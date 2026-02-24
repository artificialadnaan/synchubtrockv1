/**
 * Bootstrap: register error handlers before loading the app.
 * Dynamic import ensures handlers run before any app code.
 */
process.on("uncaughtException", (err: unknown) => {
  const e = err as Error;
  console.error("[SyncHub] FATAL uncaughtException:", e?.message ?? String(err));
  if (e?.stack) console.error(e.stack);
  process.exit(1);
});
process.on("unhandledRejection", (reason: unknown) => {
  console.error("[SyncHub] FATAL unhandledRejection:", reason);
  process.exit(1);
});

import("./index").catch((err) => {
  console.error("[SyncHub] FATAL failed to load app:", (err as Error)?.message ?? err);
  process.exit(1);
});
