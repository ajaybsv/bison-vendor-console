# BISON — Vendor portal

The vendor-side console for BISON (phase 1): a vendor answers client assessments from a reusable
Trust Pack, and assesses its own vendors. Built from `bison-vendor-console.html`.

Stack: Next.js 16 (App Router) · React 19 · Prisma 7 + Postgres · Tailwind v4 (utilities only — the
design's own `sv-*` component CSS lives in `app/globals.css`).

## Local setup

```bash
cp .env.example .env          # point DATABASE_URL at a local Postgres database
npm install                   # also runs `prisma generate`
npm run db:migrate            # apply migrations
npm run db:seed               # sample data (PayBridge Systems)
npm run dev
```

Sign in as `rahul@paybridge.in` / `demo-password` (Owner). `sneha@paybridge.in` (Contributor) uses
the same password; Vikram Shah has a pending invite you can preview from the sign-in screen.

### Creating a sign-in account

```bash
NEW_USER_PASSWORD='…' npm run user:create -- you@company.com "Your Name" Owner
```

Creates or updates an active member in whatever database `DATABASE_URL` points at. The password is
read from the environment so it never ends up in git.

### Email (forgot password)

Password-reset emails go through Mailjet. Set `MAILJET_API_KEY`, `MAILJET_API_SECRET` and
`MAILJET_EMAIL` (the verified sender) in `.env` locally and in the Vercel project.

## Deploying on Vercel

Same setup as the admin console:

1. Add a **Prisma Postgres** database to the Vercel project with the env-var prefix **`bison_vendor`**
   (it must be a separate database from the admin console's — the migration histories differ).
2. Vercel runs `vercel-build`: `prisma migrate deploy && next build`.
3. Seed once if you want the sample data: `DATABASE_URL=<bison_vendor_DATABASE_URL> npm run db:seed`.

## Layout

- `app/(auth)` — sign in, invite email preview, invite sign-up
- `app/(console)` — dashboard, requests + workspace, history, Trust Pack (answers, evidence),
  vendors, sent requests, team, settings
- `actions/` — server actions (each re-checks the session and role)
- `lib/` — Prisma client, sessions, queries, derived statuses, CRUD field schemas
- `proxy.ts` — redirects requests without a session cookie to `/sign-in`

Roles: Owner can do everything; Contributor can edit the Trust Pack, requests and vendors;
Viewer is read-only.
