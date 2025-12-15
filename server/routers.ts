import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Session management
  session: router({
    // Create a new session
    create: protectedProcedure
      .input(z.object({
        distanceMeters: z.number().positive(),
        runnerNames: z.array(z.string()),
        targetPaces: z.array(z.number().positive()),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessionId = await db.createSession(
          ctx.user.id,
          input.distanceMeters,
          new Date()
        );

        // Create runners for this session
        const runnerIds = await Promise.all(
          input.runnerNames.map((name, index) =>
            db.createRunner(sessionId, name, input.targetPaces[index])
          )
        );

        return { sessionId, runnerIds };
      }),

    // End a session
    end: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ input }) => {
        await db.endSession(input.sessionId, new Date());
        return { success: true };
      }),

    // Get user's sessions
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserSessions(ctx.user.id);
    }),

    // Get session with all data (runners + laps)
    getById: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSessionWithData(input.sessionId);
      }),
  }),

  // Lap management
  lap: router({
    // Record a lap
    create: protectedProcedure
      .input(z.object({
        runnerId: z.number(),
        lapNumber: z.number(),
        lapSec: z.number(),
        lapPaceSecPerKm: z.number(),
        diffSecPerKm: z.number(),
        timestamp: z.date(),
      }))
      .mutation(async ({ input }) => {
        const lapId = await db.createLap(input);
        return { lapId };
      }),

    // Undo last lap
    undoLast: protectedProcedure
      .input(z.object({ runnerId: z.number() }))
      .mutation(async ({ input }) => {
        const deletedLap = await db.deleteLastLap(input.runnerId);
        return { deletedLap };
      }),

    // Get runner's laps
    getByRunner: protectedProcedure
      .input(z.object({ runnerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRunnerLaps(input.runnerId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
