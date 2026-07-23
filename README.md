# 🌱 GrowthGarden

Turn your habits into a living garden. Every habit you track grows as a real plant — water it with consistency, watch it bloom. Miss days and it wilts. Hit streaks and unlock rare flowers nobody else has.

## What is this?

GrowthGarden is a habit-tracking app where your consistency is visualized as growing plants. No leaderboards, no pressure — just something alive that responds to your care.

- **Track habits** — daily, weekly, or custom schedules
- **Watch plants grow** — seed → sprout → budding → blooming (day-based progression)
- **Unlock rare flowers** — hit 30, 60, or 100 day streaks
- **Share your garden** — friends can visit and see your progress
- **Flower species** — each habit category blooms into a unique species
- **Mood-based colors** — your reflections tint the bloom's saturation

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database & Auth**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **State**: Zustand
- **Testing**: Vitest

## Features

### Plant Growth System
- **Day-based stages**: Seed (days 1-7) → Sprout (8-21) → Budding (22-66) → Blooming (67+)
- **Grace period**: 1 missed day doesn't reset progress — only 2+ consecutive misses
- **Wilt recovery**: Plants never drop below their reached stage; wilt only affects visuals
- **Consistent days counter**: Separate from streak, tracks cumulative progress

### Flower Species & Categories
Each habit has an optional category that determines its flower species:
| Category | Species |
|----------|---------|
| Fitness | Sunflower |
| Mindfulness | Lotus |
| Learning | Iris |
| Creativity | Tulip |
| Discipline | Carnation |
| Relationships | Rose |
| Rest | Peony |
| Other | Daisy |

Species identity stays hidden until blooming — the "Bloom Reveal" moment shows your flower for the first time.

### Mood-Based Color Variants
- Daily "How did it feel?" reflections contribute to a 7-day rolling engagement score
- Score maps to color saturation tiers: vivid / muted / dusty
- Applied as a filter over the bloom (independent from wilt state)

### Rare Flower Unlocks
- 7-day streak → Crystal Sprout variant
- 30-day streak → Moonbell Orchid variant
- 100-day streak → Black Moonflower variant

### Notifications (In-App)
| Type | Trigger | Default |
|------|---------|---------|
| Social | Friend waters your plant | ON |
| Milestone | Growth stage changes | ON |
| Gentle nudge | 2+ missed days (once/week cap) | OFF |
| Weekly digest | Sunday summary via Edge Function | OFF |

No red badges, no urgency language. A quiet green dot indicates unread notifications.

### Social Features
- Shareable garden (friends-only, no public links)
- Friend connections via username
- Water a friend's wilting plant to boost its health
- Visit friend gardens in read-only mode

### UI/UX
- **Light garden palette**: Parchment background, sage green accents, dusty pink highlights
- **Animated loading screens**: Seed-to-flower growth animation, garden tips
- **Glassmorphism garden preview** on landing page
- **Feedback messages**: Toast confirmations for all actions (plant, replant, save reflection)
- **Reflection prompt**: Slides up after completing a habit, positioned above navbar
- **Bloom Reveal**: Full-screen celebration when a plant first reaches flowering

## Project Structure

```
GrowthGarden/growth-garden-app/
├── app/
│   ├── page.tsx                    ← Landing page (light theme, animated)
│   ├── loading.tsx                 ← Root loading screen
│   ├── layout.tsx                  ← Root layout + global styles
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx              ← Navbar + notification bell
│   │   ├── garden/
│   │   │   ├── page.tsx            ← Garden (server: decay + stage calc)
│   │   │   ├── client.tsx          ← Garden (client: interactions)
│   │   │   └── [username]/         ← Friend's garden view
│   │   ├── friends/                ← Friend list + requests
│   │   ├── seeds/                  ← Seed library + habit creation
│   │   └── profile/                ← Stats, settings, notifications
│   └── api/auth/logout/route.ts
├── components/
│   ├── garden/
│   │   ├── GardenGrid.tsx          ← Plant card grid layout
│   │   ├── MarkDoneButton.tsx      ← Habit completion with feedback
│   │   ├── ReflectionPrompt.tsx    ← "How did it feel?" bottom sheet
│   │   ├── JournalDrawer.tsx       ← Reflection history drawer
│   │   ├── BloomReveal.tsx         ← First-bloom celebration modal
│   │   ├── MilestoneScreen.tsx     ← Streak milestone overlay
│   │   └── SeasonBanner.tsx        ← Seasonal event banner
│   ├── plants/
│   │   ├── PlantSVG.tsx            ← Generic plant rendering
│   │   ├── SpeciesPlantSVG.tsx     ← Species-specific rendering
│   │   ├── PlantCard.tsx           ← Individual plant card
│   │   ├── HealthBar.tsx           ← Health indicator bar
│   │   └── StreakBadge.tsx         ← Streak count badge
│   ├── friends/
│   │   ├── FriendRow.tsx
│   │   └── WaterButton.tsx
│   └── notifications/
│       ├── NotificationBell.tsx    ← Bell icon + dropdown feed
│       └── NotificationSettings.tsx ← Toggle preferences
├── lib/
│   ├── actions/
│   │   ├── habits.ts               ← Habit CRUD + completion logic
│   │   ├── friends.ts              ← Friend connections
│   │   ├── waterings.ts            ← Water friend's plant
│   │   └── notifications.ts        ← Notification send/read/prefs
│   ├── utils/
│   │   ├── plantStage.ts           ← Day-based stage computation
│   │   ├── species.ts              ← Category→species mapping + mood
│   │   └── seasonal.ts             ← Seasonal seed availability
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_new_columns.sql
│   │   ├── 003_add_category_and_bloom.sql
│   │   ├── 004_notifications.sql
│   │   └── 005_weekly_digest_cron.sql
│   └── functions/
│       └── weekly-digest/index.ts   ← Edge Function for weekly summary
├── middleware.ts                     ← Auth route protection
└── types/index.ts                   ← All TypeScript types
```

## Getting Started

```bash
cd GrowthGarden/growth-garden-app
npm install
```

Create a `.env.local` file (see `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Setup

Run migrations in order in the Supabase SQL Editor:

1. `001_initial_schema.sql` — tables, RLS, triggers
2. `002_add_new_columns.sql` — plant stages, reflections, health
3. `003_add_category_and_bloom.sql` — category, has_revealed_bloom, consistent_days
4. `004_notifications.sql` — notifications table, prefs columns, nudge tracking
5. `005_weekly_digest_cron.sql` — (optional) pg_cron for weekly digest

## Deploy Weekly Digest Edge Function

```bash
npx supabase functions deploy weekly-digest
```

Then in Supabase Dashboard → Edge Functions → weekly-digest → Schedules:
- Cron: `0 9 * * 0` (every Sunday 9:00 AM UTC)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests (Vitest) |

## Deployment

Deployed on [Vercel](https://vercel.com). The Root Directory is set to `GrowthGarden/growth-garden-app` in project settings.

Environment variables needed in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Design Philosophy

- **No pressure**: No red badges, no guilt language, no urgency
- **Alive, not gamified**: Plants respond to care, not to points
- **Intentional**: Users name *why* a habit matters before planting
- **Honest**: Wilt shows reality without shame ("Your plant is resting. It remembers you.")
- **Celebratory**: Bloom reveals, milestone screens, sparkle animations for progress
