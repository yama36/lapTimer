import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, sessions, runners, laps, InsertSession, InsertRunner, InsertLap } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== Session Management ==========

export async function createSession(userId: number, distanceMeters: number, startTime: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(sessions).values({
    userId,
    distanceMeters,
    startTime,
  });

  return Number((result as any).insertId);
}

export async function endSession(sessionId: number, endTime: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(sessions)
    .set({ endTime })
    .where(eq(sessions.id, sessionId));
}

export async function getSessionById(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.createdAt));
}

// ========== Runner Management ==========

export async function createRunner(sessionId: number, name: string, targetPaceMinPerKm: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(runners).values({
    sessionId,
    name,
    targetPaceMinPerKm,
  });

  return Number((result as any).insertId);
}

export async function getSessionRunners(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(runners).where(eq(runners.sessionId, sessionId));
}

// ========== Lap Management ==========

export async function createLap(lap: InsertLap) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(laps).values(lap);
  return Number((result as any).insertId);
}

export async function getRunnerLaps(runnerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(laps)
    .where(eq(laps.runnerId, runnerId))
    .orderBy(laps.lapNumber);
}

export async function deleteLastLap(runnerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the last lap
  const lastLaps = await db.select().from(laps)
    .where(eq(laps.runnerId, runnerId))
    .orderBy(desc(laps.lapNumber))
    .limit(1);

  if (lastLaps.length === 0) return null;

  const lastLap = lastLaps[0];
  await db.delete(laps).where(eq(laps.id, lastLap.id));

  return lastLap;
}

// ========== Session Data with Relations ==========

export async function getSessionWithData(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const session = await getSessionById(sessionId);
  if (!session) return null;

  const sessionRunners = await getSessionRunners(sessionId);

  const runnersWithLaps = await Promise.all(
    sessionRunners.map(async (runner) => {
      const runnerLaps = await getRunnerLaps(runner.id);
      return {
        ...runner,
        laps: runnerLaps,
      };
    })
  );

  return {
    ...session,
    runners: runnersWithLaps,
  };
}
