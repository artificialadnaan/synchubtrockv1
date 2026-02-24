# SyncHub v1.1

Middleware platform for Procore, HubSpot, and integrations. Built from the [Middleware Platform Build Plan](.cursor/plans/new_synchub_build_plan_f9a39a28.plan.md).

## Stack

- **Frontend:** React, Vite, TanStack Query, Tailwind CSS, Wouter
- **Backend:** Express, Passport, Drizzle ORM, PostgreSQL
- **Integrations:** Procore OAuth, HubSpot, Gmail/Outlook (planned)

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Run `npm install` and `npm run db:push`.
3. Run `npm run dev` for development.

## Procore: Read-only mode

SyncHub's Procore integration is **read-only**. It performs only GET requests to the Procore API. No POST, PUT, PATCH, or DELETE. Your live Procore data will not be modified.

## HubSpot

- Set Access Token in Admin Credentials.
- Create a custom deal property `project_number` (single-line text) in HubSpot to sync by Project Number.
- Stage Mapping uses HubSpot pipeline stages from your account.

## Env vars

- `DATABASE_URL` – PostgreSQL connection string (required)
- `SESSION_SECRET` – Session secret (default: dev-only)
- `PUBLIC_URL` – Base URL for OAuth redirects
- `PROCORE_CLIENT_ID`, `PROCORE_CLIENT_SECRET`
- `HUBSPOT_ACCESS_TOKEN`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (for Gmail OAuth)
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` (for Outlook OAuth)

Credentials can also be set via the Admin Credentials page (Admin only).

## Deploy

Railway: add `nixpacks.toml` and `Procfile`. Run `db:push` before start.
