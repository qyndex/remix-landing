# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Remix Landing — Marketing landing page with hero + waitlist signup, features grid, testimonials, pricing tiers, and FAQs. Content is DB-driven via Supabase (testimonials, FAQs, waitlist signups).

Built with Remix 2.15, React 18, TypeScript 5.9, Tailwind CSS, and Supabase.

## Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run test             # Run unit tests (vitest)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:e2e         # Run E2E tests (Playwright)
npm run lint             # ESLint
npm run format           # Prettier
npm run typecheck        # TypeScript type check (tsc --noEmit)
```

## Environment Variables

Copy `.env.example` to `.env` and set:

```
SUPABASE_URL=           # Supabase project URL
SUPABASE_ANON_KEY=      # Supabase anon public key
```

Run `npx supabase start` for a local Supabase stack, then apply migrations:

```bash
npx supabase db push
npx supabase db seed
```

## Architecture

- `app/routes/` — File-based routing with loaders and actions
  - `_index.tsx` — Landing page: hero with waitlist form (action), features, testimonials (loader), pricing, FAQs (loader)
- `app/lib/` — Server-side data access
  - `supabase.server.ts` — Supabase client factory (`createSupabaseClient`)
  - `database.types.ts` — TypeScript types matching the Supabase schema
- `app/styles/global.css` — Custom CSS for landing page sections
- `app/test/` — Vitest unit tests
- `e2e/` — Playwright E2E tests
- `supabase/` — Migrations and seed data
  - `migrations/20240101000000_initial_schema.sql` — waitlist, testimonials, faqs tables with RLS
  - `seed.sql` — Sample testimonials and FAQs
- `public/` — Static assets

## Database Tables

- `waitlist` — Email signups (public insert, service-role read)
- `testimonials` — Social proof cards (public read, service-role write)
- `faqs` — FAQ entries with sort_order (public read, service-role write)

## Rules

- Use `loader` for GET data, `action` for mutations — no client-side fetching
- TypeScript strict mode — no `any` types
- Progressive enhancement — forms should work without JavaScript
- Tailwind utility classes for styling
- All database access goes through `app/lib/supabase.server.ts` — never import Supabase directly in routes
- Testimonials and FAQs sections conditionally render (hidden when DB returns empty)
