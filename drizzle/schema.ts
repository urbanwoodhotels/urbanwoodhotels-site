import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here

// Quiz submission table for giveaway entries
export const quizSubmissions = mysqlTable("quiz_submissions", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", ["instagram", "facebook"]).notNull(),
  socialHandle: varchar("socialHandle", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }).notNull(),
  resultType: mysqlEnum("resultType", ["A", "B", "C"]).notNull(),
  resultName: varchar("resultName", { length: 100 }).notNull(),
  marketingConsent: int("marketingConsent").default(0).notNull(),
  openEndAnswers: text("openEndAnswers"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizSubmission = typeof quizSubmissions.$inferSelect;
export type InsertQuizSubmission = typeof quizSubmissions.$inferInsert;

// Quiz config table for admin-editable questions and images
export const quizConfig = mysqlTable("quiz_config", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("configKey", { length: 100 }).notNull().unique(),
  configValue: text("configValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizConfig = typeof quizConfig.$inferSelect;