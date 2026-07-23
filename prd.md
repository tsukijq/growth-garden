# GrowthGarden — Product Requirements Document

## Overview

GrowthGarden turns your habits into a living garden. Every habit you track grows as a real plant — water it with consistency, watch it bloom. Miss days and it wilts. Hit streaks and unlock flowers nobody else has. Your friends can visit your garden and see how you're doing. No leaderboards, no pressure — just something alive that responds to your care.

## Tech Stack

- **Frontend**: Next.js 16 (App Router, React 19, Framer Motion)
- **Backend/Database**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Styling**: Tailwind CSS v4, light garden-inspired palette
- **Notifications**: In-app notification feed + Supabase Edge Functions for scheduled tasks
- **Deployment**: Vercel (Root Directory: `GrowthGarden/growth-garden-app`)

## Core Concepts

| Concept | Description |
|---------|-------------|
| Garden | A user's collection of habit-plants displayed as an interactive visual grid |
| Plant | Visual representation of a habit — grows through day-based stages |
| Growth Stages | seed → sprout → seedling → vegetative → budding → flowering → fruiting |
| Consistent Days | Cumulative day counter with 1-day grace period (only resets on 2+ misses) |
| Streak | Consecutive completions without any miss (resets on 1 miss) |
| Category | Habit type (Fitness, Mindfulness, Learning, etc.) that determines flower species |
| Species | The flower type a plant blooms into (Sunflower, Lotus, Iris, etc.) |
| Mood Tier | Color saturation (vivid/muted/dusty) based on 7-day reflection engagement |
| Rare Flower | Unique plant variant unlocked at streak milestones (7, 30, 100 days) |
| Bloom Reveal | Celebratory moment when a plant's species is first shown at flowering |
| Visitor | Someone viewing a friend's garden in read-only mode |

## Features

### 1. Authentication
- Email/password registration and login via Supabase Auth
- Username selection on signup (unique, 3+ chars)
- Session management via middleware
- Input validation (email format, 8+ char password)

### 2. Habit Creation & Management
- Create habits with:
  - Name (1-50 chars, required)
  - Plant name (optional, personal label)
  - Intention/why (optional, shown during wilting as a nudge)
  - Category (optional dropdown: Fitness, Mindfulness, Learning, Creativity, Discipline, Relationships, Rest, Other)
  - Rest days (optional, specific weekdays)
- Seeds page with suggested habits (select → confirm with intention before planting)
- Seasonal limited-time seeds
- Streak-unlockable premium seeds (Crystal Sprout, Moonbell Orchid, Black Moonflower)
- Release habits ("to the wild") with 7-day replant window

### 3. Day-Based Growth System
- Growth stage thresholds based on `consistent_days`:
  - Seed: days 1-2
  - Sprout: days 3-7
  - Seedling: days 8-14
  - Vegetative: days 15-21
  - Budding: days 22-66
  - Flowering: day 67+
  - Fruiting: streak 30+ (rare milestone stage)
- **Grace period**: 1 missed day does NOT reset `consistent_days` — only 2+ consecutive misses reset to 0
- **Stage preservation**: Once reached, a stage never drops back due to wilting
- **Wilt**: Only affects `health_score` (visual drooping), not stage progression
- Health decay: miss 1 day = -20, miss 3+ = drop to 15. Max health: 100. Completion: +10.

### 4. Flower Species & Mood System
- Category → Species mapping:
  - Fitness → Sunflower, Mindfulness → Lotus, Learning → Iris
  - Creativity → Tulip, Discipline → Carnation, Relationships → Rose
  - Rest → Peony, Other → Daisy
- Species stays hidden until flowering (pre-bloom stages use generic silhouette)
- **Bloom Reveal**: First time reaching flowering triggers a full-screen celebration showing the species name and colored flower
- `has_revealed_bloom` flag ensures reveal only happens once per habit
- **Mood-based color**: 7-day reflection count → vivid (5+) / muted (2-4) / dusty (0-1) saturation filter on blooming plants

### 5. Rare Flower Unlocks
- 7-day streak → Crystal Sprout variant
- 30-day streak → Moonbell Orchid variant
- 100-day streak → Black Moonflower variant
- Permanently retained even if streak breaks
- Visual sparkle overlay on fruiting stage

### 6. Garden Visualization
- Grid layout (2 columns mobile, 4 desktop) showing all active plants
- Each growth stage visually distinct via SVG illustrations
- Species-specific flower heads at blooming/fruiting stages
- Streak count badge per plant
- Health bar per plant
- Intention shown on hover (or during wilting as a nudge)
- Rest day indicator (🌙)
- Empty state with clear call-to-action pointing to "+ Plant seed"
- "All done for today" celebratory card when all habits completed

### 7. Reflections & Journal
- "How did it feel today?" prompt after marking a habit done
- Save/Skip buttons, Enter key support
- Confirmation feedback: "Noted. Your plant remembers. 🌱"
- Per-habit journal drawer showing reflection history
- Reflection count shown on plant cards (journal icon)

### 8. Social Features
- Friend connections via username
- Friends list with garden status (streak info, wilting count, rare bloom)
- Visit friend gardens (read-only grid view)
- Water a friend's wilting plant (+15 health, once per friend per day)
- Social notification sent to plant owner on watering

### 9. Notifications (In-App)
- Bell icon in top-right header with quiet green dot (no badge count)
- Dropdown feed showing recent notifications with:
  - Type icon (💧 social, 🌸 milestone, 🌙 nudge, 📋 digest)
  - Title, body, time-ago timestamp
  - Unread highlight background
- **Notification types:**
  - Social: friend watered your plant (default ON)
  - Milestone: growth stage advancement (default ON)
  - Gentle nudge: 2+ missed days, once/week cap (default OFF)
  - Weekly digest: Sunday summary via Edge Function (default OFF)
- Settings in Profile with independent toggles per type
- **Tone**: No urgency, no guilt. "Whenever you're ready." "Your plant is resting."

### 10. Profile & Settings
- Username, avatar initial, "Growing since" date
- Stats: habit count, longest streak, rare blooms collected
- Rare blooms gallery (fruiting plants with variant visuals)
- Quiet mode toggle (suppresses reflection prompts and milestone screens)
- Notification preferences (4 toggles)
- Sign out

### 11. Landing Page
- Light garden palette with mesh gradient background
- Animated hero plant (flowering SVG with breathing animation)
- Growth stage strip (5 stages with staggered scroll reveal)
- Garden preview (faux-glass card with sample plant cards)
- "Why it's different" section (intentional > automatic)
- How it works (4-step grid)
- Social sharing angle
- Final CTA with gradient button
- Botanical texture overlay, ambient orbs, soil-brown accents

### 12. Loading Screens
- Garden: animated seed-to-plant growth + random garden tip
- Seeds: bouncing plant emojis + "Opening the seed library..."
- Friends: rocking house emoji + "Visiting the neighborhood..."
- Profile: breathing sunflower + "Gathering your garden stats..."
- Landing: 5-stage storytelling (soil → stem → leaves → flower → sparkles) with progress bar

## Success Metrics

- Daily active users completing at least one habit
- Average consistent_days across all users
- Retention rate at 7, 14, 30 days
- Rare flower unlock rate (measures long-term engagement)
- Bloom reveal completion rate (measures reaching 67+ days)
- Social watering frequency
- Notification engagement (open rate on in-app feed)

## Non-Goals (v1)

- No leaderboards or competitive ranking
- No paid tiers or premium flowers
- No calendar/history view (journal + stats only)
- No mobile native app (responsive web only)
- No browser push notifications (in-app only)
- No real-time multiplayer/collaborative features
- No AI-generated content or suggestions
