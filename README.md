# Airtable Clone

A high-performance Airtable-style spreadsheet built with the [T3 Stack](https://create.t3.gg/). Supports 100k+ rows with virtualized scrolling, search/filter/sort at the database level, and saved views.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **tRPC** for type-safe API
- **Prisma** + **PostgreSQL**
- **NextAuth** (Google sign-in)
- **TanStack Table** + **TanStack Virtual** for the grid UI
- **Faker.js** for sample data

## Features

- Sign in with Google
- Create **bases** and **tables** (new tables get default Name/Score columns and 5 sample rows)
- Add **columns** (Text or Number)
- **Virtualized infinite scroll**: only visible rows are rendered; more load as you scroll (handles 100k–1M+ rows)
- **Add 100k rows** button (Faker data)
- **Search** across all cells (filters rows at DB level)
- **Filters**: text (is empty, is not empty, contains, not contains, equal to); number (>, <, =)
- **Sort**: A→Z / Z→A for text; ascending/descending for numbers
- **Views**: save and load search, filter, sort, and column visibility
- **Column visibility**: show/hide columns
- **Cell editing** with Tab and arrow-key navigation

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **PostgreSQL**

   Use a local Postgres or a hosted DB (e.g. [Neon](https://neon.tech), [Vercel Postgres](https://vercel.com/storage/postgres)).

3. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` – PostgreSQL connection string
   - `AUTH_SECRET` – e.g. `npx auth secret`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` – from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (OAuth 2.0 Client ID for a web app)

4. **Database**

   ```bash
   npm run db:push
   ```

5. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000), sign in with Google, create a base and table, then use the grid and “Add 100k rows” to test virtualization.

## Deploy on Vercel

1. Push the repo to GitHub and import the project in [Vercel](https://vercel.com).
2. Add a **Postgres** database (Vercel Postgres or external) and set `DATABASE_URL` in Project Settings → Environment Variables.
3. Set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET`.
4. In Google Cloud Console, add your Vercel deployment URL to the OAuth client’s “Authorized redirect URIs” (e.g. `https://your-app.vercel.app/api/auth/callback/google`).
5. Deploy. After deploy, run migrations from your machine or use Vercel’s run script:

   ```bash
   npm run db:migrate
   ```

   If you use `db:push` for prototyping, run `npx prisma db push` locally with `DATABASE_URL` pointing to the production DB once.

## Scripts

- `npm run dev` – Next.js dev server
- `npm run build` – Production build
- `npm run db:push` – Push Prisma schema (no migrations)
- `npm run db:generate` – Generate Prisma client and migrations
- `npm run db:migrate` – Deploy migrations
- `npm run typecheck` – TypeScript check
