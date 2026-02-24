#!/usr/bin/env node
"use strict";
const esbuild = require("esbuild");
const vite = require("vite");
const fs = require("fs");
const path = require("path");

const ALLOWLIST = [
  "connect-pg-simple", "drizzle-orm", "drizzle-zod", "express", "express-session",
  "passport", "passport-local", "passport-google-oauth20", "pg", "bcryptjs", "zod",
];

async function build() {
  if (fs.existsSync("dist")) fs.rmSync("dist", { recursive: true });
  console.log("Building client...");
  await vite.build();
  console.log("Building server...");
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf-8"));
  const deps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];
  const externals = deps.filter((d) => !ALLOWLIST.includes(d));
  await esbuild.build({
    entryPoints: ["server/start.ts"],
    platform: "node",
    target: "node18",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: { "process.env.NODE_ENV": '"production"' },
    external: externals,
    minify: true,
  });
  console.log("Build complete.");
}

build().catch((e) => { console.error(e); process.exit(1); });
