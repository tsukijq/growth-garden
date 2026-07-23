# Implementation Plan: GrowthGarden

## Overview

This plan implements the GrowthGarden habit-tracking application using Next.js App Router with React Server Components, Supabase for authentication/database/realtime, and Edge Functions for scheduled tasks. Tasks are ordered to build foundational infrastructure first, then core domain logic, then features that depend on that logic, and finally integration and social features.

## Tasks

- [x] 1. Project setup and database schema
  - [x] 1.1 Initialize Next.js project with Supabase integration
    - Set up Next.js App Router project with TypeScript
    - Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `fast-check`, `vitest`
    - Configure Supabase client utilities (browser client + server client)
    - Set up environment variables for Supabase URL and keys
    - Create base layout with authentication context provider
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Create database migration for all tables and RLS policies
    - Create `profiles` table extending auth.users with timezone
    - Create `habits` table with all columns, constraints, and CHECK constraints
    - Create `completions` table with unique constraint on (habit_id, completed_date)
    - Create `rare_flowers` table with unique constraint on (habit_id, milestone)
    - Create `garden_share_settings` table with unique share_link_id
    - Create `friend_connections` table with unique constraint on (requester_id, recipient_id)
    - Create `reminders` table with unique constraint on habit_id
    - Apply Row Level Security policies for all tables
    - Create trigger to auto-create profile on auth.users insert
    - _Requirements: 1.1, 2.1, 3.3, 6.4, 8.1, 9.1_

  - [x] 1.3 Define TypeScript types and interfaces for all domain entities
    - Create type definitions for Habit, Completion, RareFlower, GrowthStage, GardenShareSettings, FriendConnection, Reminder
    - Create input/output types for Server Actions (CreateHabitInput, UpdateHabitInput, AuthResult, etc.)
    - Create error code enums (DUPLICATE_COMPLETION, HABIT_LIMIT_REACHED, USER_NOT_FOUND, etc.)
    - _Requirements: 2.1, 3.1, 4.1, 6.1_

- [x] 2. Garden Engine domain logic
  - [x] 2.1 Implement growth stage computation and schedule utilities
    - Implement `computeGrowthStage(streak, isWilting)` with thresholds (3, 7, 21)
    - Implement `isScheduledDay(habit, date)` for daily/weekly/custom schedules
    - Implement `shouldWilt(habit, completions, today)` to check if a habit missed its scheduled day
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.6_

  - [x] 2.2 Write property tests for growth stage computation
    - **Property 1: Growth stage computation is deterministic and threshold-based**
    - **Validates: Requirements 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**

  - [x] 2.3 Write property tests for schedule day evaluation
    - **Property 5: Completions only on scheduled days**
    - **Validates: Requirements 3.5, 5.6**

  - [x] 2.4 Implement rare flower unlock logic
    - Implement `checkRareFlowerUnlock(streak, existingUnlocks)` for milestones 30, 60, 100
    - Return null if milestone already unlocked (idempotent)
    - Return new unlock object if streak matches milestone and not already unlocked
    - _Requirements: 6.1, 6.2, 6.3, 6.6_

  - [x] 2.5 Write property tests for rare flower unlock logic
    - **Property 9: Rare flower unlock at milestones without duplication**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.6**

  - [x] 2.6 Implement validation functions
    - Implement `validateHabitName(name)` — reject empty, whitespace-only, or >50 chars
    - Implement `validateEmail(email)` — check local part, @, domain with dot
    - Implement `validatePassword(password)` — check length 8-128
    - Implement `validateSchedule(scheduleType, scheduleDays)` — ensure valid schedule config
    - _Requirements: 1.4, 1.6, 1.7, 2.1, 2.3, 10.6_

  - [x] 2.7 Write property tests for validation functions
    - **Property 2: Habit name and schedule validation rejects invalid inputs**
    - **Property 3: Auth credential validation**
    - **Validates: Requirements 2.1, 2.3, 10.6, 1.4, 1.6, 1.7**

  - [x] 2.8 Implement weekly completion rate and dashboard statistics calculations
    - Implement `calculateWeeklyCompletionRate(habits, completions, today)` — rolling 7 days, whole-number percentage
    - Implement `computeDashboardStats(habits, completions, rareFlowers)` — total active, longest streak, total completions, total rare flowers
    - _Requirements: 12.1, 12.2, 12.4_

  - [x] 2.9 Write property tests for dashboard statistics
    - **Property 19: Weekly completion rate calculation**
    - **Property 20: Dashboard statistics computation**
    - **Validates: Requirements 12.1, 12.2, 12.4**

- [x] 3. Checkpoint - Core domain logic
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Authentication flows
  - [x] 4.1 Implement registration and login Server Actions with Supabase Auth
    - Create `register` Server Action with email/password validation, Supabase signUp, and profile creation
    - Create `login` Server Action with credential validation and Supabase signInWithPassword
    - Create `logout` Server Action to terminate session
    - Configure session duration (7 days inactivity timeout)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [-] 4.2 Create authentication UI pages (login and register)
    - Build `/login` page with email/password form and inline validation errors
    - Build `/register` page with email/password form and inline validation errors
    - Implement redirect to `/garden` on successful auth
    - Handle error states (duplicate email, invalid credentials, validation failures)
    - Create middleware for protected route enforcement
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8_

  - [-] 4.3 Write unit tests for auth validation and error handling
    - Test email format validation edge cases
    - Test password length boundary conditions (7, 8, 128, 129 chars)
    - Test duplicate email error response
    - Test invalid credentials error response
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 5. Habit creation and management
  - [-] 5.1 Implement habit CRUD Server Actions
    - Create `createHabit` — validate name/schedule, check 20-habit limit, insert habit, return with seed growth stage
    - Create `updateHabit` — validate name/schedule changes, preserve streak and growth stage
    - Create `pauseHabit` — store current streak/growth stage in paused fields, set status to 'paused'
    - Create `resumeHabit` — restore streak/growth stage from paused fields, set status to 'active'
    - Create `archiveHabit` — set status to 'archived', store archived_at timestamp
    - Create `restoreHabit` — set status to 'active', preserve growth stage, reset streak to 0
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 5.2 Write property tests for habit management state preservation
    - **Property 15: Habit edit preserves streak and growth stage**
    - **Property 16: Pause/resume round trip preserves state**
    - **Property 17: Archive preserves data, restore resets streak to zero**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

  - [x] 5.3 Create habit management UI pages
    - Build `/habits/new` page with HabitForm component (name input, schedule picker with daily/weekly/custom)
    - Build `/habits/[id]/edit` page with pre-populated form
    - Build `/habits` page with HabitList showing all habits, completion toggles, status indicators
    - Add pause/resume/archive/restore action buttons on each habit
    - Display validation errors inline
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 6. Habit completion and streak mechanics
  - [x] 6.1 Implement completion recording Server Action
    - Create `completeHabit` Server Action with schedule validation (reject non-scheduled days)
    - Check for duplicate completion on same day (reject with DUPLICATE_COMPLETION error)
    - Insert completion record within a transaction
    - Increment streak, check growth stage transition thresholds
    - Handle wilting recovery (set is_wilting=false, streak=1)
    - Check and apply rare flower unlocks at milestones (30, 60, 100)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.3, 6.1, 6.2, 6.3, 6.6_

  - [-] 6.2 Write property tests for completion mechanics
    - **Property 4: Completion uniqueness per habit per day**
    - **Property 6: Wilting transition resets streak and sets wilting state**
    - **Property 7: Wilting recovery starts fresh at seed with streak 1**
    - **Validates: Requirements 3.3, 3.4, 5.1, 5.2, 5.3**

  - [-] 6.3 Add completion UI to habit list
    - Add completion toggle button for each habit on scheduled days
    - Show visual feedback on completion (plant animation trigger)
    - Display streak count next to each habit
    - Disable completion button for non-scheduled days and already-completed days
    - Show error messages for duplicate/invalid completion attempts
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6_

- [~] 7. Checkpoint - Habit mechanics complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Garden visualization
  - [-] 8.1 Implement GardenGrid and PlantCard components
    - Build `GardenGrid` component rendering up to 20 plants in a responsive grid layout
    - Build `PlantCard` component with visually distinct representations for each growth stage (seed, sprout, budding, blooming, wilting)
    - Display current streak count adjacent to each plant
    - Show empty state message when no active plants exist
    - Implement growth stage transitions with smooth animations
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [~] 8.2 Create garden page with Server Component data fetching
    - Build `/garden` page as the main authenticated view
    - Fetch all active habits with computed growth stages using Server Components
    - Set up Supabase Realtime subscription for live plant state updates
    - Implement fallback polling (30-second interval) if Realtime fails
    - _Requirements: 3.6, 7.1, 7.3_

  - [~] 8.3 Implement RareFlowerSelector and flower variant display
    - Build `RareFlowerSelector` modal for plants with multiple unlocked variants
    - Create `selectFlowerVariant` Server Action to update active display variant
    - Show unlocked rare flowers as distinct visual variants on plants
    - Display unlock notifications when new rare flowers are earned
    - _Requirements: 6.5, 6.7_

  - [~] 8.4 Write property tests for rare flower retention
    - **Property 10: Rare flowers are permanently retained**
    - **Validates: Requirements 6.4**

- [ ] 9. Wilting evaluation Edge Function
  - [~] 9.1 Implement evaluate-wilting Supabase Edge Function
    - Create Edge Function triggered by pg_cron (hourly)
    - Query all active habits due on the current day (per user timezone) without a completion
    - Set `is_wilting = true` and `current_streak = 0` for missed habits
    - Use row-level locks to prevent race conditions with concurrent user completions
    - Skip paused and archived habits
    - Ensure idempotent behavior (already-wilting habits are not modified further)
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6_

  - [~] 9.2 Write property tests for wilting evaluation logic
    - **Property 8: Wilting evaluation is idempotent and schedule-aware**
    - **Validates: Requirements 5.5, 5.6**

- [ ] 10. Social features - Garden sharing
  - [~] 10.1 Implement garden sharing Server Actions
    - Create `toggleGardenSharing` Server Action — generate unique share_link_id on enable, invalidate on disable
    - Ensure share link uniqueness (UUID v4 or nanoid)
    - On re-enable, generate a new link (previous link stays invalid)
    - _Requirements: 8.1, 8.4, 8.5, 8.6_

  - [~] 10.2 Write property tests for share link uniqueness
    - **Property 11: Share link uniqueness and invalidation**
    - **Validates: Requirements 8.1, 8.6**

  - [~] 10.3 Implement visitor garden API route and page
    - Create `/api/garden/[shareId]` GET route — validate share link, return filtered garden data
    - Build `/garden/visit/[shareId]` page with read-only VisitorGarden component
    - Filter response to show only growth stages and rare flower variants (hide streaks and completion history)
    - Return 404 with generic message for invalid/expired links
    - _Requirements: 8.2, 8.3, 8.7_

  - [~] 10.4 Write property tests for visitor view data filtering
    - **Property 12: Visitor view data filtering**
    - **Validates: Requirements 8.3**

- [ ] 11. Social features - Friend connections
  - [~] 11.1 Implement friend connection Server Actions
    - Create `sendFriendRequest` — validate email exists, check no existing connection, create pending connection
    - Create `acceptFriendRequest` — set status to 'accepted', establish mutual access
    - Create `rejectFriendRequest` — remove pending connection
    - Create `removeFriend` — delete connection, revoke mutual garden access
    - Handle error cases: user not found, duplicate connection, self-request
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6, 9.7_

  - [~] 11.2 Write property tests for friend connection symmetry and visibility
    - **Property 13: Friend connection symmetry**
    - **Property 14: Friend garden visibility requires both connection and sharing**
    - **Validates: Requirements 9.2, 9.3, 9.5**

  - [~] 11.3 Create friends UI page
    - Build `/friends` page with FriendsList component
    - Show accepted friends with links to their gardens (if sharing enabled)
    - Show pending incoming/outgoing requests with accept/reject actions
    - Add friend request form (email input)
    - Display error messages for invalid requests
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [~] 12. Checkpoint - Social features complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Reminders and notifications
  - [~] 13.1 Implement reminder configuration Server Action and UI
    - Create `setReminder` Server Action — set/update reminder time, enable/disable
    - Add ReminderSettings component within habit edit page
    - Allow per-habit custom reminder time with 1-minute granularity
    - Default to 09:00 local timezone if no custom time set
    - Handle time-in-past-today edge case (skip today, apply tomorrow)
    - _Requirements: 11.1, 11.2, 11.4, 11.5, 11.7_

  - [~] 13.2 Implement send-reminders Edge Function
    - Create Edge Function triggered by pg_cron (every minute)
    - Query reminders due within the current minute window (per user timezone)
    - Suppress reminders for habits already completed today
    - Implement Web Push API notification delivery
    - Implement retry logic (max 2 retries at 15-min intervals, abandon after 60 minutes)
    - Skip paused/archived habits
    - _Requirements: 11.1, 11.3, 11.6_

  - [~] 13.3 Write property tests for reminder suppression
    - **Property 18: Reminder suppression when completion exists**
    - **Validates: Requirements 11.3**

- [ ] 14. Dashboard
  - [~] 14.1 Implement dashboard page with statistics
    - Build `/dashboard` page with Dashboard component
    - Fetch and display: total active habits, longest current streak, total lifetime completions, total rare flowers unlocked
    - Calculate and display weekly completion rate (rolling 7 days, whole-number percentage)
    - Handle empty state (zero values for all stats)
    - Handle error state (show error message with retry button)
    - Render within 2 seconds performance target
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [~] 14.2 Write unit tests for dashboard edge cases
    - Test zero-data state returns all zeros
    - Test error handling displays retry option
    - Test weekly rate excludes paused/archived habits
    - _Requirements: 12.2, 12.5, 12.6_

- [ ] 15. Integration wiring and final polish
  - [~] 15.1 Wire navigation and layout
    - Create authenticated layout with navigation between Garden, Habits, Dashboard, Friends
    - Add sharing toggle to garden settings
    - Implement session management (7-day inactivity timeout, redirect on expiry)
    - Add loading states and error boundaries for all pages
    - _Requirements: 1.2, 1.8, 7.1, 8.5_

  - [~] 15.2 Write integration tests for critical paths
    - Test registration → login → create habit → complete → growth stage advance flow
    - Test wilting evaluation across timezone boundaries
    - Test share link generation and visitor access flow
    - Test friend request → accept → garden visibility flow
    - Test RLS policies block cross-user data access
    - _Requirements: 1.1, 1.2, 3.6, 5.4, 8.2, 9.3_

- [~] 16. Final checkpoint - All features complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The Garden Engine domain logic (Task 2) is implemented as pure functions for testability before being wired into Server Actions
- Edge Functions (wilting and reminders) require Supabase local dev environment (`supabase start`) for testing
- Realtime subscriptions provide live plant updates; polling is the fallback

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.4", "2.6", "2.8"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.5", "2.7", "2.9", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3", "8.4", "9.1"] },
    { "id": 8, "tasks": ["9.2", "10.1"] },
    { "id": 9, "tasks": ["10.2", "10.3", "11.1"] },
    { "id": 10, "tasks": ["10.4", "11.2", "11.3", "13.1"] },
    { "id": 11, "tasks": ["13.2", "13.3", "14.1"] },
    { "id": 12, "tasks": ["14.2", "15.1"] },
    { "id": 13, "tasks": ["15.2"] }
  ]
}
```
