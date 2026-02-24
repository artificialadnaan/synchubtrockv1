import type { Express } from "express";
import express from "express";
import passport from "passport";
import { storage } from "./storage";
import { resolveCredential } from "./credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  getProcoreAuthUrl,
  exchangeProcoreCode,
  getProcoreMe,
  PROCORE_READ_ONLY,
} from "./procore";
import { hubspotAdapter } from "./adapters/hubspot";

export function registerRoutes(app: Express) {
  const api = express.Router();

  // Auth
  api.post("/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid email or password" });
      req.login(user, (e) => {
        if (e) return next(e);
        res.json({ user: sanitizeUser(user) });
      });
    })(req, res, next);
  });

  api.post("/auth/signup", async (req, res) => {
    const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
    const { email, password } = parsed.data;
    const existing = await storage.users.findByEmail(email);
    if (existing) return res.status(400).json({ message: "Email already registered" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await storage.users.create({ email, passwordHash, role: "user" });
    req.login(user, () => res.status(201).json({ user: sanitizeUser(user) }));
  });

  api.get("/auth/logout", (req, res) => {
    req.logout(() => res.json({ ok: true }));
  });

  api.get("/auth/me", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    res.json({ user: sanitizeUser(req.user!) });
  });

  api.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  api.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (_req, res) => res.redirect("/dashboard")
  );

  function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    next();
  }

  function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const u = req.user as { role?: string };
    if (u?.role !== "admin") return res.status(403).json({ message: "Admin required" });
    next();
  }

  // Admin credentials
  api.get("/admin/credentials", requireAdmin, async (_req, res) => {
    const creds = await storage.credentials.getAll();
    const mask: Record<string, boolean> = {};
    for (const c of creds) mask[c.key] = !!c.value;
    res.json({ credentials: mask });
  });

  const ALLOWED_CRED_KEYS = [
    "procore_client_id", "procore_client_secret", "hubspot_access_token",
    "google_client_id", "google_client_secret", "microsoft_client_id", "microsoft_client_secret",
    "public_url",
  ];
  api.post("/admin/credentials", requireAdmin, async (req, res) => {
    const schema = z.object({ key: z.string(), value: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
    if (!ALLOWED_CRED_KEYS.includes(parsed.data.key)) return res.status(400).json({ message: "Invalid key" });
    const user = req.user as { id: string };
    await storage.credentials.set(parsed.data.key, parsed.data.value, user.id);
    res.json({ ok: true });
  });

  // Admin stage mapping
  api.get("/admin/stage-mappings", requireAdmin, async (_req, res) => {
    const mappings = await storage.stageMappings.list();
    res.json({ mappings });
  });

  api.post("/admin/stage-mappings", requireAdmin, async (req, res) => {
    const schema = z.object({ procoreStage: z.string(), crmStage: z.string(), crmProvider: z.string().default("hubspot") });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
    const mapping = await storage.stageMappings.create(parsed.data);
    res.status(201).json({ mapping });
  });

  api.delete("/admin/stage-mappings/:id", requireAdmin, async (req, res) => {
    await storage.stageMappings.delete(req.params.id);
    res.json({ ok: true });
  });

  api.get("/admin/hubspot-stages", requireAdmin, async (req, res) => {
    try {
      const stages = await hubspotAdapter.getStages(req.query.pipelineId as string | undefined);
      res.json({ stages });
    } catch (err) {
      res.status(502).json({ message: err instanceof Error ? err.message : "HubSpot not connected" });
    }
  });

  api.get("/admin/workstream-config/:workstreamId", requireAdmin, async (req, res) => {
    const config = await storage.workstreamConfig.get(req.params.workstreamId);
    res.json({ config: config ?? null });
  });

  api.put("/admin/workstream-config/:workstreamId", requireAdmin, async (req, res) => {
    const schema = z.object({ syncDirection: z.string(), enabled: z.boolean().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
    const config = await storage.workstreamConfig.upsert(req.params.workstreamId, parsed.data.syncDirection, parsed.data.enabled);
    res.json({ config });
  });

  // User email connections (Email Provider Portal)
  api.get("/settings/email-connections", requireAuth, async (req, res) => {
    const user = req.user as { id: string };
    const connections = await storage.userEmailConnections.listByUser(user.id);
    res.json({ connections });
  });

  // Procore OAuth (READ-ONLY mode - no writes to Procore)
  api.get("/procore/connect", requireAuth, async (req, res) => {
    try {
      const publicUrl = await resolveCredential("public_url") ?? process.env.PUBLIC_URL ?? `${req.protocol}://${req.get("host")}`;
      const redirectUri = `${publicUrl}/api/procore/callback`;
      const { url, state } = await getProcoreAuthUrl(redirectUri);
      (req.session as Record<string, unknown>).procoreOAuthState = state;
      res.redirect(url);
    } catch (err) {
      res.status(500).json({ message: err instanceof Error ? err.message : "Procore connect failed" });
    }
  });

  api.get("/procore/callback", async (req, res) => {
    const { code, state } = req.query;
    if (typeof code !== "string" || typeof state !== "string") {
      return res.redirect("/connections?error=missing_params");
    }
    const storedState = (req.session as Record<string, unknown>).procoreOAuthState;
    if (!storedState || storedState !== state) {
      return res.redirect("/connections?error=invalid_state");
    }
    delete (req.session as Record<string, unknown>).procoreOAuthState;
    const publicUrl = await resolveCredential("public_url") ?? process.env.PUBLIC_URL ?? `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${publicUrl}/api/procore/callback`;
    try {
      const tokenRes = await exchangeProcoreCode(code, redirectUri);
      const me = await getProcoreMe(tokenRes.access_token);
      await storage.procoreConnections.save({
        accessToken: tokenRes.access_token,
        refreshToken: tokenRes.refresh_token,
        expiresAt: tokenRes.expires_in ? new Date(Date.now() + tokenRes.expires_in * 1000) : undefined,
        userEmail: me.email_address ?? me.login,
      });
      res.redirect("/connections?procore=connected");
    } catch (err) {
      console.error("Procore callback error:", err);
      res.redirect(`/connections?error=${encodeURIComponent(err instanceof Error ? err.message : "Connection failed")}`);
    }
  });

  api.post("/procore/disconnect", requireAuth, async (_req, res) => {
    const conn = await storage.procoreConnections.get();
    if (conn) {
      await storage.procoreConnections.delete(conn.id);
    }
    res.json({ ok: true });
  });

  api.get("/procore/read-only", (_req, res) => {
    res.json({ readOnly: PROCORE_READ_ONLY });
  });

  api.get("/procore/test", requireAuth, async (_req, res) => {
    const conn = await storage.procoreConnections.get();
    if (!conn) return res.status(400).json({ message: "Procore not connected" });
    try {
      const me = await getProcoreMe(conn.accessToken);
      res.json({ ok: true, email: me.email_address ?? me.login, readOnly: PROCORE_READ_ONLY });
    } catch (err) {
      res.status(502).json({ message: err instanceof Error ? err.message : "Procore API error" });
    }
  });

  // Connections overview
  api.get("/connections", requireAuth, async (_req, res) => {
    const procore = await storage.procoreConnections.get();
    const hubspotToken = await resolveCredential("hubspot_access_token");
    res.json({
      procore: procore ? { connected: true, email: procore.userEmail } : { connected: false },
      hubspot: { connected: !!hubspotToken },
      procoreReadOnly: PROCORE_READ_ONLY,
    });
  });

  // Logs
  api.get("/logs", requireAuth, async (req, res) => {
    const workstreamId = req.query.workstreamId as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const logs = await storage.syncLogs.list({ workstreamId, limit });
    res.json({ logs });
  });

  // Dashboard - workstreams placeholder
  api.get("/dashboard/workstreams", requireAuth, async (_req, res) => {
    res.json({
      workstreams: [
        { id: "bid-board-hubspot", name: "Bid Board ↔ HubSpot", status: "pending" },
        { id: "company-directory", name: "Company Directory Sync", status: "pending" },
        { id: "stage-sync", name: "Stage Sync", status: "pending" },
      ],
    });
  });

  app.use("/api", api);
}

function sanitizeUser(user: { id: string; email: string | null; role: string }) {
  return { id: user.id, email: user.email, role: user.role };
}
