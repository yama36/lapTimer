import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float } from "drizzle-orm/mysql-core";

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

/**
 * Training sessions table
 * Each session represents a single training event with multiple runners
 */
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Foreign key to users table
  distanceMeters: int("distanceMeters").notNull().default(400), // Lap distance in meters
  startTime: timestamp("startTime").notNull(), // Session start timestamp
  endTime: timestamp("endTime"), // Session end timestamp (null if ongoing)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

/**
 * Runners table
 * Stores runner information for each session
 */
export const runners = mysqlTable("runners", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(), // Foreign key to sessions table
  name: varchar("name", { length: 100 }).notNull(),
  targetPaceMinPerKm: float("targetPaceMinPerKm").notNull().default(5.0), // Target pace in minutes per kilometer
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Runner = typeof runners.$inferSelect;
export type InsertRunner = typeof runners.$inferInsert;

/**
 * Laps table
 * Stores individual lap records for each runner
 */
export const laps = mysqlTable("laps", {
  id: int("id").autoincrement().primaryKey(),
  runnerId: int("runnerId").notNull(), // Foreign key to runners table
  lapNumber: int("lapNumber").notNull(), // Lap number (1, 2, 3, ...)
  lapSec: float("lapSec").notNull(), // Lap time in seconds
  lapPaceSecPerKm: float("lapPaceSecPerKm").notNull(), // Lap pace in seconds per kilometer
  diffSecPerKm: float("diffSecPerKm").notNull(), // Difference from target pace in seconds per kilometer
  timestamp: timestamp("timestamp").notNull(), // When the lap was completed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lap = typeof laps.$inferSelect;
export type InsertLap = typeof laps.$inferInsert;