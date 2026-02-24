import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm } from "fs/promises";

const ALLOWLIST = [
  "connect-pg-simple",
  "drizzle-orm",
  "express",
  "express-session",
  "passport",
  "passport-local",
  "passport-google-oauth20",
  "pg",
  "bcryptjs",
  "zod",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });
  console.log("Building client...");
  await viteBuild();
  console.log("Building server...");
  const { readFile } = await import("fs/promises");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const deps = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ];
  const externals = deps.filter((d) => !ALLOWLIST.includes(d));
  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: { "process.env.NODE_ENV": '"production"' },
    external: externals,
    minify: true,
  });
  console.log("Build complete.");
}

buildAll().catch((e) => {
  console.error(e);
  process.exit(1);
});
