import type { Express } from "express";
import { createServer as createViteServer } from "vite";
import type { Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";

export async function setupVite(server: Server, app: Express) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);

  app.use("/*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(
        path.resolve(import.meta.dirname, "..", "client", "index.html"),
        "utf-8"
      );
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
