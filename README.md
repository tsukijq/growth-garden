# 🌱 GrowthGarden

Turn your habits into a living garden. Every habit you track grows as a real plant — water it with consistency, watch it bloom. Miss days and it wilts. Hit streaks and unlock rare flowers nobody else has.

## What is this?

GrowthGarden is a habit-tracking app where your consistency is visualized as growing plants. No leaderboards, no pressure — just something alive that responds to your care.

- **Track habits** — daily, weekly, or custom schedules
- **Watch plants grow** — seed → sprout → budding → blooming
- **Unlock rare flowers** — hit 30, 60, or 100 day streaks
- **Share your garden** — friends can visit and see your progress

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **State**: Zustand
- **Testing**: Vitest

## Project Structure

```
GrowthGarden/growth-garden-app/   ← Next.js app lives here
├── app/                          ← App Router pages & routes
├── components/                   ← UI components (garden, plants, friends)
├── lib/                          ← Server actions, Supabase client, engine
├── middleware.ts                 ← Auth protection for routes
└── supabase/                     ← Migrations & config
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

Make sure to add your Supabase environment variables in Vercel's project settings under **Settings → Environment Variables**.
