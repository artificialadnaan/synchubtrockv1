# Deploying SyncHub v1.1 to Railway

## Root Directory (required)

If your repo has `synchubv1.1` as a **subfolder** (e.g. you cloned Procore-Hubsync or pasted into an existing repo):

1. In Railway: open your **app service**
2. Go to **Settings**
3. Find **Root Directory** (or **Source**)
4. Set it to: `synchubv1.1`
5. Redeploy

This makes Railway build from the `synchubv1.1` folder so `script/build.ts` and `package.json` are found.

## If your repo root IS synchubv1.1

If you created a new repo and pasted the **contents** of synchubv1.1 directly at the root (no subfolder), leave Root Directory blank.
