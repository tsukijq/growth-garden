---
inclusion: auto
---

# GrowthGarden Tech Stack

## Core Stack

- **Framework**: Next.js 16 (App Router, React 19, Server Components, Server Actions)
- **Database & Auth**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Styling**: Tailwind CSS v4, light garden-inspired palette
- **Animations**: Framer Motion (growth animations, page transitions, loading screens)
- **Client State**: Zustand (minimal — prefer server state via RSC)
- **Testing**: Vitest + fast-check

## Architecture Rules

- Use App Router exclusively. No Pages Router.
- Prefer React Server Components for data fetching.
- Use Server Actions (`'use server'`) for all mutations.
- RLS enforces data isolation — never bypass it or hardcode user IDs.
- Plant growth stages are computed from `consistent_days` (day-based thresholds), not streak alone.
- Health decay is applied on page load by comparing `last_completed` to today.
- Supabase Edge Functions handle scheduled tasks (weekly digest).
- `supabase/functions/` is excluded from Next.js TypeScript compilation (Deno runtime).

## Project Location

App source lives at `GrowthGarden/growth-garden-app/`.
Vercel Root Directory: `GrowthGarden/growth-garden-app`.

## Database

All tables use RLS. Schema lives in `supabase/migrations/`.

**Migration order:**
1. `001_initial_schema.sql` — base tables, RLS, triggers
2. `002_add_new_columns.sql` — plant stages, reflections, health system
3. `003_add_category_and_bloom.sql` — category, has_revealed_bloom, consistent_days
4. `004_notifications.sql` — notifications table, prefs, nudge tracking
5. `005_weekly_digest_cron.sql` — pg_cron schedule (optional)

**Tables:** `profiles`, `habits`, `habit_logs`, `habit_reflections`, `notifications`, `friend_connections`, `waterings`, `rare_flowers`, `garden_share_settings`, `reminders`

## Design Tokens (Light Theme)

| Token | Value |
|-------|-------|
| Background | `#F7F8F2` (parchment green) |
| Card BG | `#ffffff` |
| Alt section BG | `#f0f2ea` |
| Border | `#e2e5da` |
| Text primary | `#1F2A1F` (forest charcoal) |
| Text secondary | `#6b7a6b` |
| Primary green | `#4A7C59` (sage) |
| Primary green hover | `#3d6b4a` |
| Accent pink | `#E8879B` (dusty) |
| Accent brown | `#8B6F47` (soil) |
| Success bg | `#f0f5f1` |
| Success border | `#c8e0cc` |
| Error | `#c44030` |
| Warning amber | `#b08040` |
| Rare purple | `#7c4dbd` |

## Plant Growth System

- **Day-based stages**: Seed (1-2) → Sprout (3-7) → Seedling (8-14) → Vegetative (15-21) → Budding (22-66) → Flowering (67+) → Fruiting (streak 30+)
- **Grace period**: 1 missed day does NOT reset `consistent_days` — only 2+ consecutive misses
- **Stage preservation**: Once a stage is reached, wilt never drops it below that stage
- **`consistent_days`**: Cumulative counter, separate from `streak_count`
- **`streak_count`**: Resets on any miss (used for rare flower milestones)

## Flower Species System

- Each habit has an optional `category` → maps to a `FlowerSpecies`
- Species identity is hidden until flowering stage ("Bloom Reveal" moment)
- Pre-bloom stages render with generic species-agnostic silhouette
- `has_revealed_bloom` flag prevents repeat reveal animations
- Mood tier (vivid/muted/dusty) applied as CSS filter on bloom stages only

## Notification System

- In-app feed (bell icon in header) — no browser push
- Stored in `notifications` table, respects per-user prefs
- No red badges, no numbers — quiet green dot for unread
- Nudge capped at once per plant per week (`last_nudge_at`)
- Weekly digest via Supabase Edge Function (`weekly-digest`)

## Key Constraints

- Plants never die instantly — minimum health is 15 (always a recovery window).
- Mark Done button MUST animate with Framer Motion on every tap.
- No placeholder/lorem ipsum text — all copy matches calm, personal tone.
- No urgency language, no guilt framing, no loss-based messaging.
- One watering per friend per day.
- Max health: 100. Completion: +10. Miss 1 day: -20. Miss 3+: drops to 15. Friend water: +15.
- All feedback actions show toast/inline confirmation messages.
- Loading screens are animated (not skeleton placeholders).

## UX Patterns

- Success toasts appear at top of screen (z-[70]), auto-dismiss 4s
- Reflection prompt positioned at `bottom-[60px]` (above navbar)
- Journal drawer at `z-[60]` with `pb-24` (above navbar)
- Notification dropdown at `z-[80]`, closes on outside click
- Bloom Reveal at `z-[100]`, dismissible by tap
- Milestone screen at `z-[100]`, shows after bloom reveal
