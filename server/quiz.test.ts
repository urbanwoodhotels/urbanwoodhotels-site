import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Create a mock DB that handles chained Drizzle calls
function createMockDb(rows: unknown[] = []) {
  const insertChain = {
    values: vi.fn().mockImplementation(() => ({
      onDuplicateKeyUpdate: vi.fn().mockResolvedValue(undefined),
      then: (resolve: (v: undefined) => unknown) => Promise.resolve(undefined).then(resolve),
    })),
  };

  const fromChain = {
    orderBy: vi.fn().mockResolvedValue(rows),
    then: (resolve: (v: unknown[]) => unknown) => Promise.resolve(rows).then(resolve),
  };

  const deleteChain = {
    where: vi.fn().mockResolvedValue(undefined),
  };

  return {
    insert: vi.fn().mockReturnValue(insertChain),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue(fromChain),
    }),
    delete: vi.fn().mockReturnValue(deleteChain),
  };
}

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn().mockImplementation(() => Promise.resolve(createMockDb([]))),
}));

// Mock ENV so adminPassword is predictable in tests
vi.mock("./_core/env", () => ({
  ENV: {
    appId: "test-app-id",
    cookieSecret: "test-secret-key-that-is-long-enough-32ch",
    databaseUrl: "mysql://test",
    oAuthServerUrl: "https://test.oauth.com",
    ownerOpenId: "test-owner",
    isProduction: false,
    forgeApiUrl: "https://test.forge.com",
    forgeApiKey: "test-forge-key",
    adminPassword: "correctpassword",
  },
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {}, cookies: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {}, cookies: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {}, cookies: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("quiz.submit", () => {
  it("accepts valid submission with instagram platform", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quiz.submit({
      platform: "instagram",
      socialHandle: "@testuser",
      phone: "+852 9999 8888",
      email: "test@example.com",
      resultType: "A",
      resultName: "慢活旅人",
    });

    expect(result).toEqual({ success: true });
  });

  it("accepts valid submission with facebook platform", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quiz.submit({
      platform: "facebook",
      socialHandle: "Test User",
      phone: "+852 9999 7777",
      email: "fb@example.com",
      resultType: "B",
      resultName: "街坊美食家",
    });

    expect(result).toEqual({ success: true });
  });

  it("rejects submission with invalid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.quiz.submit({
        platform: "instagram",
        socialHandle: "@testuser",
        phone: "+852 9999 8888",
        email: "not-an-email",
        resultType: "C",
        resultName: "鏡頭探索家",
      })
    ).rejects.toThrow();
  });

  it("rejects submission with empty social handle", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.quiz.submit({
        platform: "instagram",
        socialHandle: "",
        phone: "+852 9999 8888",
        email: "test@example.com",
        resultType: "A",
        resultName: "慢活旅人",
      })
    ).rejects.toThrow();
  });
});

describe("adminAuth - password login", () => {
  it("rejects wrong password", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.adminAuth.login({ password: "wrongpassword" })
    ).rejects.toThrow("密碼錯誤");
  });

  it("accepts correct password, sets cookie, and returns token", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.adminAuth.login({ password: "correctpassword" });
    expect(result.success).toBe(true);
    // Should return a JWT token for localStorage storage
    expect(typeof result.token).toBe("string");
    expect(result.token.split(".").length).toBe(3); // valid JWT format
    // Should also set cookie as fallback
    expect(ctx.res.cookie).toHaveBeenCalledWith(
      "admin_session",
      expect.any(String),
      expect.any(Object)
    );
  });

  it("returns isAdmin false when no cookie or header", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.adminAuth.check();
    expect(result.isAdmin).toBe(false);
  });

  it("returns isAdmin true when valid Bearer token in Authorization header", async () => {
    // First get a valid token by logging in
    const loginCtx = createPublicContext();
    const loginCaller = appRouter.createCaller(loginCtx);
    const { token } = await loginCaller.adminAuth.login({ password: "correctpassword" });

    // Now check with the token in Authorization header
    const checkCtx: typeof loginCtx = {
      ...createPublicContext(),
      req: {
        protocol: "https",
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      } as typeof loginCtx["req"],
    };
    const checkCaller = appRouter.createCaller(checkCtx);
    const result = await checkCaller.adminAuth.check();
    expect(result.isAdmin).toBe(true);
  });

  it("allows admin routes access with valid Bearer token", async () => {
    // Get a valid token
    const loginCtx = createPublicContext();
    const loginCaller = appRouter.createCaller(loginCtx);
    const { token } = await loginCaller.adminAuth.login({ password: "correctpassword" });

    // Access admin route with Bearer token
    const adminCtx: typeof loginCtx = {
      ...createPublicContext(),
      req: {
        protocol: "https",
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      } as typeof loginCtx["req"],
    };
    const adminCaller = appRouter.createCaller(adminCtx);
    const result = await adminCaller.admin.getSubmissions();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns isAdmin true for Manus admin user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.adminAuth.check();
    expect(result.isAdmin).toBe(true);
  });
});

describe("admin routes", () => {
  it("allows Manus admin to access getSubmissions", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.getSubmissions();
    expect(Array.isArray(result)).toBe(true);
  });

  it("blocks non-admin from accessing getSubmissions", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getSubmissions()).rejects.toThrow("Admin access required");
  });

  it("blocks unauthenticated user from accessing admin routes", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getSubmissions()).rejects.toThrow();
  });

  it("allows admin to access getStats", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.getStats();
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("byResult");
    expect(result).toHaveProperty("byPlatform");
  });
});

describe("quiz.getConfig", () => {
  it("is publicly accessible and returns an array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quiz.getConfig();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("quiz.submit - optional phone", () => {
  it("accepts submission without phone field", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quiz.submit({
      platform: "instagram",
      socialHandle: "@nophone",
      email: "nophone@example.com",
      resultType: "A",
      resultName: "慢活旅人",
    });
    expect(result).toEqual({ success: true });
  });
});

describe("admin.addQuestion / admin.removeQuestion", () => {
  it("allows admin to add a new question via setConfig", async () => {
    // Get a valid token
    const loginCtx = createPublicContext();
    const loginCaller = appRouter.createCaller(loginCtx);
    const { token } = await loginCaller.adminAuth.login({ password: "correctpassword" });

    const adminCtx: typeof loginCtx = {
      ...createPublicContext(),
      req: {
        protocol: "https",
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      } as typeof loginCtx["req"],
    };
    const adminCaller = appRouter.createCaller(adminCtx);
    const result = await adminCaller.admin.addQuestion({
      chapterId: 1,
      text: "新題目測試",
      A: "選項A",
      B: "選項B",
      C: "選項C",
      sensoryType: "視覺",
    });
    expect(result.success).toBe(true);
    expect(typeof result.id).toBe("number");
    expect(result.id).toBeGreaterThanOrEqual(100);
  });

  it("allows admin to remove an extra question (id >= 100)", async () => {
    const loginCtx = createPublicContext();
    const loginCaller = appRouter.createCaller(loginCtx);
    const { token } = await loginCaller.adminAuth.login({ password: "correctpassword" });

    const adminCtx: typeof loginCtx = {
      ...createPublicContext(),
      req: {
        protocol: "https",
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      } as typeof loginCtx["req"],
    };
    const adminCaller = appRouter.createCaller(adminCtx);
    const result = await adminCaller.admin.removeQuestion({ id: 100 });
    expect(result.success).toBe(true);
  });

  it("blocks removing built-in questions (id < 100)", async () => {
    const loginCtx = createPublicContext();
    const loginCaller = appRouter.createCaller(loginCtx);
    const { token } = await loginCaller.adminAuth.login({ password: "correctpassword" });

    const adminCtx: typeof loginCtx = {
      ...createPublicContext(),
      req: {
        protocol: "https",
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      } as typeof loginCtx["req"],
    };
    const adminCaller = appRouter.createCaller(adminCtx);
    await expect(
      adminCaller.admin.removeQuestion({ id: 1 })
    ).rejects.toThrow("原有題目不能刪除，只能編輯");
  });
});
