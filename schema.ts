import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Express-session store (connect-pg-simple). Must exist before app starts.
export const session = pgTable(
  "session",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire", { withTimezone: true }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Platform users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("user"), // admin | user
  oauthProvider: text("oauth_provider"), // google | microsoft
  oauthId: text("oauth_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin credentials (encrypted at rest)
export const appCredentials = pgTable("app_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(), // encrypted
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by"),
});

// Stage mapping: Procore stage ↔ CRM stage
export const stageMappings = pgTable("stage_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  procoreStage: text("procore_stage").notNull(),
  crmStage: text("crm_stage").notNull(),
  crmProvider: text("crm_provider").notNull().default("hubspot"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workstream config: sync direction per workstream
export const workstreamConfig = pgTable("workstream_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workstreamId: text("workstream_id").notNull().unique(),
  syncDirection: text("sync_direction").notNull().default("procore_primary"), // procore_primary | crm_primary | bidirectional
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Per-user email connections (Gmail/Outlook)
export const userEmailConnections = pgTable("user_email_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(), // gmail | outlook
  email: text("email").notNull(),
  refreshToken: text("refresh_token").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Procore OAuth tokens (org-level or per-user)
export const procoreConnections = pgTable("procore_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  companyId: text("company_id"),
  companyName: text("company_name"),
  userEmail: text("user_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sync/activity logs
export const syncLogs = pgTable("sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workstreamId: text("workstream_id"),
  status: text("status").notNull(), // ok | fail
  message: text("message"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export const insertStageMappingSchema = createInsertSchema(stageMappings).omit({
  id: true,
  createdAt: true,
});
export const insertWorkstreamConfigSchema = createInsertSchema(
  workstreamConfig
).omit({ id: true, updatedAt: true });
export const insertUserEmailConnectionSchema = createInsertSchema(
  userEmailConnections
).omit({ id: true, createdAt: true });
export const insertProcoreConnectionSchema = createInsertSchema(
  procoreConnections
).omit({ id: true, createdAt: true });
export const insertSyncLogSchema = createInsertSchema(syncLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AppCredential = typeof appCredentials.$inferSelect;
export type StageMapping = typeof stageMappings.$inferSelect;
export type WorkstreamConfig = typeof workstreamConfig.$inferSelect;
export type UserEmailConnection = typeof userEmailConnections.$inferSelect;
export type ProcoreConnection = typeof procoreConnections.$inferSelect;
export type SyncLog = typeof syncLogs.$inferSelect;
