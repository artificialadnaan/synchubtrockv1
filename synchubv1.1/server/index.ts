import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPgSession from "connect-pg-simple";
import passport from "passport";
import { registerRoutes } from "./routes";
import { initPassport } from "./auth";
import { pool } from "./db";
import { createServer } from "http";
import { serveStatic } from "./static";

const app = express();
const httpServer = createServer(app);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

const pgSession = connectPgSession(session);
app.use(
  session({
    store: new pgSession({ pool }),
    secret: process.env.SESSION_SECRET || "synchub-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());
initPassport();

// CORS for Vite dev
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.ORIGIN || "http://localhost:5000");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

registerRoutes(app);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

const port = parseInt(process.env.PORT || "5000", 10);
const listenOpts = { port, host: "0.0.0.0" as const };

if (process.env.NODE_ENV === "production") {
  try {
    serveStatic(app);
  } catch (e) {
    console.error("[SyncHub] serveStatic failed:", (e as Error)?.message);
    throw e;
  }
  httpServer.listen(listenOpts, () => {
    console.log(`SyncHub v1.1 serving on port ${port}`);
  });
} else {
  (async () => {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
    httpServer.listen(listenOpts, () => {
      console.log(`SyncHub v1.1 serving on port ${port}`);
    });
  })();
}
