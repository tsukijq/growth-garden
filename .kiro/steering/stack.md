---
inclusion: auto
---

# GrowthGarden Tech Stack

## Core Stack

- **Framework**: Next.js 14+ (App Router, React Server Components, Server Actions)
- **Database & Auth**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Styling**: Tailwind CSS, dark theme only (`#0d1117` base)
- **Animations**: Framer Motion (required for Mark Done plant growth interaction)
- **Client State**: Zustand (minimal — prefer server state via RSC)

## Architecture Rules

- Use App Router exclusively. No Pages Router.
- Prefer React Server Components for data fetching.
- Use Server Actions (`'use server'`) for all mutations.
- RLS enforces data isolation — never bypass it or hardcode user IDs.
- Plant growth stages are computed from `health_score` and `streak_count`, not stored independently.
- Health decay is applied on page load by comparing `last_completed` to today.

## Project Location

App source lives at `GrowthGarden/growth-garden-app/`.

## Database

All tables use RLS. Schema lives in `supabase/migrations/001_initial_schema.sql`.

Tables: `profiles`, `habits`, `habit_logs`, `friendships`, `waterings`.

## Design Tokens

| Token | Value |
|-------|-------|
| Background | `#0d1117` |
| Card BG | `#141820` |
| Border | `#252a38` |
| Text primary | `#e0e6f0` |
| Text secondary | `#8b95a8` |
| Healthy green | `#4a8a50`, `#6ee7a0` |
| Wilting amber | `#e0a060` |
| Dying red | `#c05030` |
| Rare purple | `#9060e8`, `#c0a0ff` |

## Key Constraints

- Plants never die instantly — minimum health is 15 (always a recovery window).
- Mark Done button MUST animate with Framer Motion on every tap.
- No placeholder/lorem ipsum text — all copy matches calm, personal tone.
- One watering per friend per day.
- Max health: 100. Completion: +10. Miss 1 day: -20. Miss 3+: drops to 15. Friend water: +15.
