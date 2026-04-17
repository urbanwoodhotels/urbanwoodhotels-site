import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { quizSubmissions, quizConfig } from "../drizzle/schema";
import { desc } from "drizzle-orm";
import { ENV } from "./_core/env";
import { SignJWT, jwtVerify } from "jose";

const ADMIN_COOKIE = "admin_session";
const ADMIN_SECRET = new TextEncoder().encode(ENV.cookieSecret + "_admin");

async function signAdminToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(ADMIN_SECRET);
}

async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, ADMIN_SECRET);
    return true;
  } catch {
    return false;
  }
}

async function isAdminRequest(req: { headers: Record<string, string | string[] | undefined>; cookies?: Record<string, string> }): Promise<boolean> {
  // Check Authorization header first (for localStorage-based auth)
  const authHeader = req.headers['authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (await verifyAdminToken(token)) return true;
  }
  // Fallback: check cookie
  const cookies = (req as { cookies?: Record<string, string> }).cookies ?? {};
  const token = cookies[ADMIN_COOKIE];
  if (!token) return false;
  return verifyAdminToken(token);
}

// Admin guard middleware — accepts either Manus admin role OR password-based admin session cookie
const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const hasAdminCookie = await isAdminRequest(ctx.req as Parameters<typeof isAdminRequest>[0]);
  const isManuAdmin = ctx.user?.role === "admin";
  if (!hasAdminCookie && !isManuAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Password-based admin auth (no Manus account required)
  adminAuth: router({
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ENV.adminPassword) {
          throw new TRPCError({ code: "FORBIDDEN", message: "後台密碼未設定，請聯絡管理員" });
        }
        if (input.password !== ENV.adminPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "密碼錯誤" });
        }
        const token = await signAdminToken();
        // Also set cookie as fallback
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(ADMIN_COOKIE, token, {
          ...cookieOptions,
          maxAge: 12 * 60 * 60 * 1000, // 12 hours
        });
        // Return token so frontend can store in localStorage
        return { success: true, token };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(ADMIN_COOKIE, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),

    check: publicProcedure.query(async ({ ctx }) => {
      const ok = await isAdminRequest(ctx.req as Parameters<typeof isAdminRequest>[0]);
      return { isAdmin: ok || ctx.user?.role === "admin" };
    }),
  }),

  // Quiz submission (public - anyone can submit)
  quiz: router({
    submit: publicProcedure
      .input(
        z.object({
          platform: z.enum(["instagram", "facebook"]),
          socialHandle: z.string().min(1).max(255),
          name: z.string().min(1).max(255),
          phone: z.string().max(50).optional(),
          email: z.string().email().max(320),
          resultType: z.enum(["A", "B", "C"]),
          resultName: z.string().min(1).max(100),
          marketingConsent: z.boolean().optional().default(false),
          openEndAnswers: z.record(z.string(), z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.insert(quizSubmissions).values({
          platform: input.platform,
          socialHandle: input.socialHandle,
          name: input.name,
          phone: input.phone,
          email: input.email,
          resultType: input.resultType,
          resultName: input.resultName,
          marketingConsent: input.marketingConsent ? 1 : 0,
          openEndAnswers: input.openEndAnswers ? JSON.stringify(input.openEndAnswers) : null,
        });
        return { success: true };
      }),

    // Get quiz config (public - for frontend to load custom questions/images)
    getConfig: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(quizConfig);
      return rows;
    }),
  }),

  // Admin routes (protected)
  admin: router({
    // Get all submissions
    getSubmissions: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(quizSubmissions)
        .orderBy(desc(quizSubmissions.createdAt));
      return rows;
    }),

    // Get submission stats
    getStats: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(quizSubmissions);
      const total = rows.length;
      const byResult = { A: 0, B: 0, C: 0 };
      const byPlatform = { instagram: 0, facebook: 0 };
      rows.forEach((r) => {
        byResult[r.resultType]++;
        byPlatform[r.platform]++;
      });
      return { total, byResult, byPlatform };
    }),

    // Update quiz config (questions/images)
    setConfig: adminProcedure
      .input(z.object({ key: z.string(), value: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db
          .insert(quizConfig)
          .values({ configKey: input.key, configValue: input.value })
          .onDuplicateKeyUpdate({ set: { configValue: input.value } });
        return { success: true };
      }),

    // Get all config entries
    getConfig: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(quizConfig);
    }),

    // Add a new question (stored as config with key question_extra_<id>)
    addQuestion: adminProcedure
      .input(z.object({
        chapterId: z.number().int().min(1).max(4),
        text: z.string().min(1).max(500),
        questionType: z.enum(['multiple-choice', 'open-end']).default('multiple-choice'),
        A: z.string().max(300).optional(),
        B: z.string().max(300).optional(),
        C: z.string().max(300).optional(),
        sensoryType: z.enum(['視覺', '聽覺', '嗅覺', '觸覺']).optional().default('視覺'),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Validate multiple-choice requires options
        if (input.questionType === 'multiple-choice') {
          if (!input.A || !input.B || !input.C) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "選擇題必須填寫三個選項" });
          }
        }
        // Get current extra questions list to determine next id
        const rows = await db.select().from(quizConfig);
        const extraKeys = rows.filter((r) => r.configKey.startsWith('question_extra_'));
        const nextId = 100 + extraKeys.length + 1; // extra questions start from id 101
        const key = `question_extra_${nextId}`;
        const value = JSON.stringify({
          id: nextId,
          chapterId: input.chapterId,
          text: input.text,
          questionType: input.questionType,
          A: input.A ?? '',
          B: input.B ?? '',
          C: input.C ?? '',
          sensoryType: input.sensoryType,
        });
        await db.insert(quizConfig).values({ configKey: key, configValue: value });
        return { success: true, id: nextId };
      }),

    // Remove a question by id (only extra questions can be removed)
    removeQuestion: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        if (input.id < 100) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "原有題目不能刪除，只能編輯" });
        }
        const { eq } = await import('drizzle-orm');
        await db.delete(quizConfig).where(eq(quizConfig.configKey, `question_extra_${input.id}`));
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
