# GrowthGarden — Product Requirements Document

## Overview

GrowthGarden turns your habits into a living garden. Every habit you track grows as a real plant — water it with consistency, watch it bloom. Miss days and it wilts. Hit streaks and unlock flowers nobody else has. Your friends can visit your garden and see exactly how disciplined you've been. No leaderboards, no pressure — just something alive that responds to your care.

## Tech Stack

- **Frontend**: Next.js (React)
- **Backend/Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Notifications**: Push notifications via Supabase Edge Functions

## Core Concepts

| Concept | Description |
|---------|-------------|
| Garden | A user's collection of habit-plants displayed as an interactive visual grid |
| Plant | Visual representation of a habit — grows through stages based on consistency |
| Growth Stages | seed → sprout → budding → blooming (or wilting if missed) |
| Streak | Consecutive scheduled completions without a miss |
| Rare Flower | Unique plant variant unlocked at 30, 60, 100 day streaks |
| Visitor | Someone viewing another user's garden via shared link |

## Features

### 1. Authentication
- Email/password registration and login via Supabase Auth
- Session management (7-day inactivity timeout)
- Input validation (email format, 8-128 char password)

### 2. Habit Creation & Management
- Create habits with name (1-50 chars) and schedule (daily, weekly, custom weekdays)
- Up to 20 active habits per user
- Edit, pause, archive, and restore habits
- Paused habits freeze in place; archived habits retain history

### 3. Completion Tracking
- One completion per habit per scheduled day
- Streak increments on each completion
- Plant advances at streak thresholds: 3 (sprout), 7 (budding), 21 (blooming)
- Visual update within 2 seconds

### 4. Plant Growth & Wilting
- 5 stages: seed, sprout, budding, blooming, wilting
- Missed day → plant wilts, streak resets to 0
- Recovery starts a new streak from seed
- Evaluation runs at midnight in user's timezone

### 5. Rare Flower Unlocks
- 30-day streak → 1st rare flower
- 60-day streak → 2nd rare flower
- 100-day streak → 3rd rare flower
- Permanently retained even if streak breaks
- User can choose which variant to display

### 6. Garden Visualization
- Grid layout showing all active plants
- Each growth stage visually distinct without text labels
- Streak count displayed per plant
- Empty state guidance for new users

### 7. Social Features
- Shareable garden link (public, read-only, no auth required)
- Toggle sharing on/off (invalidates old links)
- Visitors see plant states and rare flowers only (no streak numbers)
- Friend connections via email
- Friends list on dashboard with garden access

### 8. Daily Reminders
- Per-habit configurable reminder time (default 09:00)
- Suppressed if already completed for the day
- Retry logic for failed deliveries (2 retries, 15-min intervals)

### 9. Dashboard
- Active habits count, longest active streak, lifetime completions
- Weekly completion rate (rolling 7 days, whole-number %)
- Total rare flowers unlocked
- Error state with retry option

## Success Metrics

- Daily active users completing at least one habit
- Average streak length across all users
- Retention rate at 7, 14, 30 days
- Rare flower unlock rate (measures long-term engagement)
- Social sharing activation rate

## Non-Goals (v1)

- No leaderboards or competitive ranking
- No paid tiers or premium flowers
- No habit categories or tagging
- No calendar/history view (dashboard stats only)
- No mobile native app (responsive web only)
