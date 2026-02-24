import { db } from "./db";
import {
  users,
  appCredentials,
  stageMappings,
  workstreamConfig,
  userEmailConnections,
  procoreConnections,
  syncLogs,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export const storage = {
  users: {
    findByEmail: (email: string) => db.query.users.findFirst({ where: eq(users.email, email) }),
    findById: (id: string) => db.query.users.findFirst({ where: eq(users.id, id) }),
    findByOAuth: (provider: string, oauthId: string) =>
      db.query.users.findFirst({
        where: and(eq(users.oauthProvider, provider), eq(users.oauthId, oauthId)),
      }),
    create: (data: { email: string; passwordHash?: string; role?: string; oauthProvider?: string; oauthId?: string }) =>
      db.insert(users).values(data).returning().then((r) => r[0]),
    update: (id: string, data: Partial<typeof users.$inferInsert>) =>
      db.update(users).set(data).where(eq(users.id, id)).returning().then((r) => r[0]),
  },
  credentials: {
    get: (key: string) =>
      db.query.appCredentials.findFirst({ where: eq(appCredentials.key, key) }).then((r) => r?.value),
    set: (key: string, value: string, updatedBy?: string) =>
      db
        .insert(appCredentials)
        .values({ key, value, updatedBy })
        .onConflictDoUpdate({
          target: appCredentials.key,
          set: { value, updatedBy, updatedAt: new Date() },
        })
        .returning()
        .then((r) => r[0]),
    getAll: () => db.select().from(appCredentials),
  },
  stageMappings: {
    list: () => db.select().from(stageMappings),
    create: (data: { procoreStage: string; crmStage: string; crmProvider?: string }) =>
      db.insert(stageMappings).values(data).returning().then((r) => r[0]),
    delete: (id: string) => db.delete(stageMappings).where(eq(stageMappings.id, id)),
  },
  workstreamConfig: {
    get: (workstreamId: string) =>
      db.query.workstreamConfig.findFirst({ where: eq(workstreamConfig.workstreamId, workstreamId) }),
    upsert: (workstreamId: string, syncDirection: string, enabled?: boolean) =>
      db
        .insert(workstreamConfig)
        .values({ workstreamId, syncDirection, enabled: enabled ?? true })
        .onConflictDoUpdate({
          target: workstreamConfig.workstreamId,
          set: { syncDirection, enabled: enabled ?? true, updatedAt: new Date() },
        })
        .returning()
        .then((r) => r[0]),
  },
  userEmailConnections: {
    listByUser: (userId: string) =>
      db.select().from(userEmailConnections).where(eq(userEmailConnections.userId, userId)),
    create: (data: { userId: string; provider: string; email: string; refreshToken: string; isDefault?: boolean }) =>
      db.insert(userEmailConnections).values(data).returning().then((r) => r[0]),
    delete: (id: string) => db.delete(userEmailConnections).where(eq(userEmailConnections.id, id)),
    setDefault: async (userId: string, connectionId: string) => {
      await db.update(userEmailConnections).set({ isDefault: false }).where(eq(userEmailConnections.userId, userId));
      await db.update(userEmailConnections).set({ isDefault: true }).where(eq(userEmailConnections.id, connectionId));
    },
  },
  procoreConnections: {
    get: async (userId?: string) => {
      if (userId) {
        return db.query.procoreConnections.findFirst({ where: eq(procoreConnections.userId, userId) });
      }
      const rows = await db.select().from(procoreConnections).limit(1);
      return rows[0];
    },
    upsert: (data: { userId?: string; accessToken: string; refreshToken?: string; expiresAt?: Date; companyId?: string; companyName?: string; userEmail?: string }) =>
      db.insert(procoreConnections).values(data).returning().then((r) => r[0]),
  },
  syncLogs: {
    list: (opts?: { workstreamId?: string; limit?: number }) => {
      let q = db.select().from(syncLogs).orderBy(desc(syncLogs.createdAt)).limit(opts?.limit ?? 50);
      if (opts?.workstreamId) {
        return db.select().from(syncLogs).where(eq(syncLogs.workstreamId, opts.workstreamId)).orderBy(desc(syncLogs.createdAt)).limit(opts?.limit ?? 50);
      }
      return q;
    },
    create: (data: { workstreamId?: string; status: string; message?: string; details?: unknown }) =>
      db.insert(syncLogs).values(data).returning().then((r) => r[0]),
  },
};
