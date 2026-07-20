# Requirements Document

## Introduction

GrowthGarden is a habit-tracking application that visualizes user habits as a living garden. Each tracked habit is represented as a plant that grows and blooms with consistent completion, wilts when neglected, and unlocks rare visual rewards for sustained streaks. Users can visit friends' gardens, providing gentle social accountability without competitive pressure. The application is built with Next.js and Supabase.

## Glossary

- **Garden**: The visual collection of all plants belonging to a single user, displayed as an interactive garden view
- **Plant**: A visual representation of a single tracked habit, with growth stages that reflect completion consistency
- **Habit**: A recurring activity that the user commits to performing on a defined schedule (daily, weekly, or custom)
- **Streak**: The count of consecutive scheduled completions of a habit without a missed day
- **Completion**: A recorded instance of a user fulfilling a habit on its scheduled day
- **Wilting**: The visual degradation of a plant when the user misses scheduled habit completions
- **Bloom**: The fully flourishing visual state of a plant, achieved through consistent completions
- **Rare_Flower**: A unique visual plant variant unlocked exclusively by reaching specific streak milestones
- **Visitor**: A user who views another user's garden via a shared link or friend connection
- **Growth_Stage**: A discrete visual phase of a plant (seed, sprout, budding, blooming, wilting)
- **Schedule**: The recurrence pattern defining when a habit is expected to be completed (e.g., daily, specific weekdays)
- **Garden_Engine**: The backend system responsible for computing plant states based on habit data
- **Notification_Service**: The system component responsible for sending reminders and alerts to users
- **Auth_System**: The authentication and authorization system managing user identity and access

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a new user, I want to create an account and sign in securely, so that my garden and habit data are private and persistent.

#### Acceptance Criteria

1. WHEN a user submits registration credentials with a valid email format and a password meeting length requirements, THE Auth_System SHALL create a new user account and redirect to the Garden view within 3 seconds
2. WHEN a user submits valid login credentials, THE Auth_System SHALL authenticate the user and establish a session with a maximum duration of 7 days of inactivity before requiring re-authentication
3. IF a user submits registration credentials with an email already associated with an existing account, THEN THE Auth_System SHALL display an error message indicating the email is already in use without creating an account
4. IF a user submits registration credentials with an invalid email format or a password that does not meet length requirements, THEN THE Auth_System SHALL display an error message identifying which field failed validation without creating an account
5. IF a user submits incorrect login credentials, THEN THE Auth_System SHALL display an error message indicating invalid email or password combination and deny access
6. THE Auth_System SHALL require a password length between 8 and 128 characters
7. THE Auth_System SHALL validate that the email follows a standard email format containing a local part, an @ symbol, and a domain with at least one dot
8. WHEN a user initiates a logout action, THE Auth_System SHALL terminate the active session and redirect to the login view

### Requirement 2: Habit Creation

**User Story:** As a user, I want to create new habits with a defined schedule, so that I can track my recurring activities and grow plants.

#### Acceptance Criteria

1. WHEN a user submits a new habit with a name (1-50 characters, non-whitespace-only) and schedule, THE Garden_Engine SHALL create the habit and add a corresponding Plant in the seed Growth_Stage to the user's Garden
2. THE Garden_Engine SHALL support three schedule types: daily (every day), weekly (every 7 days on a chosen day), and custom weekday (user selects one or more specific days of the week)
3. IF a user submits a habit without a name, with a whitespace-only name, with a name exceeding 50 characters, or without a schedule, THEN THE Garden_Engine SHALL display a validation error identifying the invalid field and prevent creation
4. THE Garden_Engine SHALL allow a user to create up to 20 active (non-paused, non-archived) habits simultaneously
5. IF a user attempts to create a habit when they already have 20 active habits, THEN THE Garden_Engine SHALL display an error message indicating the limit has been reached and prevent creation

### Requirement 3: Habit Completion Tracking

**User Story:** As a user, I want to record habit completions each day, so that my plants grow and reflect my consistency.

#### Acceptance Criteria

1. WHEN a user marks a habit as completed on a scheduled day, THE Garden_Engine SHALL record the Completion and increment the habit's Streak by one
2. WHEN a Completion causes the habit's Streak to reach a Growth_Stage threshold (3, 7, or 21 consecutive Completions), THE Garden_Engine SHALL advance the Plant to the next Growth_Stage
3. THE Garden_Engine SHALL allow only one Completion per habit per scheduled day
4. IF a user attempts to record a duplicate Completion for a habit on the same scheduled day, THEN THE Garden_Engine SHALL reject the request and display an error message indicating the habit has already been completed for that day
5. IF a user attempts to record a Completion on a day that is not part of the habit's Schedule, THEN THE Garden_Engine SHALL reject the request and display an error message indicating the day is not scheduled
6. WHEN a user records a Completion, THE Garden_Engine SHALL update the Plant's visual state within 2 seconds

### Requirement 4: Plant Growth Stages

**User Story:** As a user, I want to see my plants progress through visible growth stages, so that I have a tangible representation of my consistency.

#### Acceptance Criteria

1. THE Garden_Engine SHALL represent each Plant with five Growth_Stages: seed, sprout, budding, blooming, and wilting
2. WHILE a Plant is in the blooming Growth_Stage and the habit's Streak count is greater than zero, THE Garden_Engine SHALL maintain the Plant in the blooming state
3. WHEN a habit's current Streak count reaches 3, THE Garden_Engine SHALL advance the Plant from seed to sprout
4. WHEN a habit's current Streak count reaches 7, THE Garden_Engine SHALL advance the Plant from sprout to budding
5. WHEN a habit's current Streak count reaches 21, THE Garden_Engine SHALL advance the Plant from budding to blooming
6. WHEN a Plant transitions from wilting back to seed after a Completion, THE Garden_Engine SHALL require the same Streak thresholds (3, 7, 21) to advance through Growth_Stages again

### Requirement 5: Plant Wilting on Missed Days

**User Story:** As a user, I want my plants to wilt when I miss scheduled days, so that I have a visual reminder to stay consistent.

#### Acceptance Criteria

1. WHEN a user misses a scheduled Completion for a habit (regardless of current Growth_Stage), THE Garden_Engine SHALL transition the Plant to the wilting Growth_Stage
2. WHEN a Plant enters the wilting state, THE Garden_Engine SHALL reset the Streak to zero
3. WHEN a user records a Completion on a wilting Plant, THE Garden_Engine SHALL transition the Plant back to the seed Growth_Stage and begin a new Streak at 1
4. THE Garden_Engine SHALL evaluate missed Completions at the end of each scheduled day (midnight in the user's local timezone)
5. WHILE a Plant remains in the wilting state for consecutive missed days, THE Garden_Engine SHALL maintain the wilting state without further degradation
6. FOR habits with weekly or custom weekday schedules, THE Garden_Engine SHALL only evaluate a missed Completion on days that are part of the habit's Schedule

### Requirement 6: Streak-Based Rare Flower Unlocks

**User Story:** As a user, I want to unlock unique flower variants by hitting streak milestones, so that I feel rewarded for long-term consistency.

#### Acceptance Criteria

1. WHEN a user's Streak reaches 30 consecutive Completions, THE Garden_Engine SHALL unlock a Rare_Flower variant for that Plant and display an unlock notification to the user
2. WHEN a user's Streak reaches 60 consecutive Completions, THE Garden_Engine SHALL unlock a second Rare_Flower variant for that Plant and display an unlock notification to the user
3. WHEN a user's Streak reaches 100 consecutive Completions, THE Garden_Engine SHALL unlock a third Rare_Flower variant for that Plant and display an unlock notification to the user
4. THE Garden_Engine SHALL permanently retain unlocked Rare_Flowers for a Plant regardless of subsequent Streak resets, habit pauses, or habit archives
5. THE Garden_Engine SHALL display unlocked Rare_Flowers as distinct visual variants on the Plant in the Garden view
6. IF a user has previously unlocked a Rare_Flower at a given milestone for a Plant, THEN THE Garden_Engine SHALL not re-grant that same Rare_Flower when the Streak reaches that milestone again after a reset
7. WHEN a Plant has more than one unlocked Rare_Flower variant, THE Garden_Engine SHALL allow the user to select which variant is displayed on the Plant in the Garden view

### Requirement 7: Garden Visualization

**User Story:** As a user, I want to view my garden with all my plants arranged visually, so that I can see my overall habit health at a glance.

#### Acceptance Criteria

1. THE Garden_Engine SHALL display all active Plants in a single Garden view arranged in a grid layout accommodating up to 20 Plants
2. THE Garden_Engine SHALL render each Growth_Stage (seed, sprout, budding, blooming, wilting) with a visually distinct plant representation such that a user can identify the stage without reading text labels
3. WHEN a user opens the Garden view, THE Garden_Engine SHALL render all Plants reflecting their current Growth_Stage within 3 seconds
4. THE Garden_Engine SHALL display the current Streak count adjacent to each Plant as a numeric value
5. IF a user has no active Plants, THEN THE Garden_Engine SHALL display an empty state message indicating how to create a habit

### Requirement 8: Social Garden Visiting

**User Story:** As a user, I want to share my garden with friends so they can visit and see my progress, providing gentle accountability.

#### Acceptance Criteria

1. WHEN a user enables garden sharing, THE Garden_Engine SHALL generate a unique shareable link for the user's Garden that does not collide with any existing or previously generated link
2. WHEN a Visitor accesses a valid shared Garden link, THE Garden_Engine SHALL display a read-only view of the garden owner's Plants and Growth_Stages within 3 seconds, without requiring the Visitor to authenticate
3. THE Garden_Engine SHALL hide Streak counts and Completion history from Visitors, showing only Plant visual states and unlocked Rare_Flowers
4. WHEN a user disables garden sharing, THE Garden_Engine SHALL invalidate the shared link within 1 second and deny all subsequent Visitor access
5. THE Garden_Engine SHALL allow a user to toggle garden sharing on or off at any time
6. WHEN a user re-enables garden sharing after previously disabling it, THE Garden_Engine SHALL generate a new unique shareable link, and the previously invalidated link SHALL remain invalid
7. IF a Visitor accesses an invalid or previously invalidated shared Garden link, THEN THE Garden_Engine SHALL display a message indicating the garden is not available and SHALL NOT reveal any garden data

### Requirement 9: Friend Connections

**User Story:** As a user, I want to connect with friends, so that I can visit their gardens directly from my account.

#### Acceptance Criteria

1. WHEN a user sends a friend request by providing another user's email address, THE Garden_Engine SHALL create a pending friend connection visible to both the sender and the recipient
2. WHEN a user accepts a friend request, THE Garden_Engine SHALL establish a mutual friend connection between both users and remove the request from the pending list
3. WHILE a mutual friend connection exists and both users have sharing enabled, THE Garden_Engine SHALL display the friend's Garden in a friends list accessible from the user's dashboard
4. IF a user rejects a friend request, THEN THE Garden_Engine SHALL remove the pending connection and prevent it from appearing in either user's pending list
5. IF a user removes an existing friend connection, THEN THE Garden_Engine SHALL remove mutual access to each other's Gardens and remove each user from the other's friends list
6. IF a user sends a friend request to an email address that is not associated with any registered account, THEN THE Garden_Engine SHALL display an error message indicating the user was not found and not create a pending connection
7. IF a user sends a friend request to a user who already has a pending or accepted connection with them, THEN THE Garden_Engine SHALL display an error message indicating a connection already exists and not create a duplicate connection

### Requirement 10: Habit Management

**User Story:** As a user, I want to edit, pause, or archive habits, so that I can adjust my garden as my routines change.

#### Acceptance Criteria

1. WHEN a user edits a habit's name or schedule, THE Garden_Engine SHALL update the habit without affecting the current Streak or Growth_Stage
2. WHEN a user pauses a habit, THE Garden_Engine SHALL freeze the Plant's Growth_Stage and Streak, and exclude the habit from wilting evaluation and Streak advancement
3. WHEN a user resumes a paused habit, THE Garden_Engine SHALL restore the Plant to its frozen Growth_Stage and Streak value, and resume wilting evaluation starting from the next scheduled day
4. WHEN a user archives a habit, THE Garden_Engine SHALL remove the Plant from the active Garden view, retain all Completion history, and preserve the Plant's Growth_Stage and Streak at time of archival
5. WHEN a user restores an archived habit, THE Garden_Engine SHALL return the Plant to the active Garden view with its historical Completion data intact and the Plant set to the Growth_Stage it held at time of archival, with the Streak reset to zero
6. IF a user edits a habit name to exceed 50 characters or submits an empty name, THEN THE Garden_Engine SHALL display a validation error and prevent the update

### Requirement 11: Daily Reminders

**User Story:** As a user, I want to receive reminders for my habits, so that I remember to water my plants before the day ends.

#### Acceptance Criteria

1. WHEN a user enables reminders for a habit, THE Notification_Service SHALL send a push notification at the user-configured time each scheduled day, delivered within 5 minutes of the configured time
2. THE Notification_Service SHALL allow users to set a custom reminder time for each habit independently, with a granularity of 1 minute within a 24-hour range
3. IF a user has already recorded a Completion for the scheduled day (determined by the user's local timezone), THEN THE Notification_Service SHALL suppress the reminder for that habit
4. WHEN a user disables reminders for a habit, THE Notification_Service SHALL cease sending notifications for that habit, including any scheduled notification for the current day that has not yet been delivered
5. IF a user enables reminders without setting a custom time, THEN THE Notification_Service SHALL default to sending the reminder at 09:00 in the user's local timezone
6. IF the Notification_Service fails to deliver a push notification due to device unavailability or denied permissions, THEN THE Notification_Service SHALL retry delivery up to 2 additional times at 15-minute intervals and suppress further retries if the configured time window has passed by more than 60 minutes
7. IF a user updates the reminder time for a habit to a time earlier than the current time on the same day, THEN THE Notification_Service SHALL skip the reminder for that day and apply the new time starting the next scheduled day

### Requirement 12: User Dashboard

**User Story:** As a user, I want a dashboard that shows my overall progress stats, so that I can reflect on my consistency over time.

#### Acceptance Criteria

1. THE Garden_Engine SHALL display total active habits, current longest Streak among active (non-paused, non-archived) habits, and total lifetime Completions across all habits (including archived) on the dashboard
2. THE Garden_Engine SHALL display a weekly completion rate calculated as the number of Completions recorded divided by the total number of scheduled habit occurrences in the rolling past 7 days, expressed as a whole-number percentage (0-100), excluding paused and archived habits from the calculation
3. WHEN a user navigates to the dashboard, THE Garden_Engine SHALL render all statistics within 2 seconds
4. THE Garden_Engine SHALL display the total number of Rare_Flowers unlocked across all habits including archived habits
5. IF the dashboard has no data to display because the user has no active habits or no recorded Completions, THEN THE Garden_Engine SHALL display zero values for all numeric statistics
6. IF the Garden_Engine fails to retrieve dashboard statistics, THEN THE Garden_Engine SHALL display an error message indicating that stats could not be loaded and provide an option to retry
