// =============================================================================
// GrowthGarden Domain Types
// =============================================================================
// Type definitions for all domain entities, server action inputs/outputs,
// and error codes as defined in the GrowthGarden design specification.
// =============================================================================

// -----------------------------------------------------------------------------
// Growth Stage
// -----------------------------------------------------------------------------

/**
 * The five discrete visual phases of a plant's lifecycle.
 * Growth stage is computed from streak count and wilting state.
 *
 * Thresholds:
 * - seed: streak < 3 (and not wilting)
 * - sprout: streak >= 3 (and < 7)
 * - budding: streak >= 7 (and < 21)
 * - blooming: streak >= 21
 * - wilting: is_wilting = true (regardless of streak)
 */
export type GrowthStage = 'seed' | 'sprout' | 'budding' | 'blooming' | 'wilting';

// -----------------------------------------------------------------------------
// Domain Entities
// -----------------------------------------------------------------------------

/**
 * A recurring activity tracked by the user, represented as a plant in the garden.
 */
export interface Habit {
  id: string;
  user_id: string;
  name: string;
  schedule_type: ScheduleType;
  schedule_days: number[] | null;
  status: HabitStatus;
  current_streak: number;
  is_wilting: boolean;
  paused_at: string | null;
  paused_streak: number | null;
  paused_growth_stage: GrowthStage | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Schedule type for a habit.
 * - daily: every day
 * - weekly: every 7 days on a chosen day
 * - custom: user selects specific days of the week
 */
export type ScheduleType = 'daily' | 'weekly' | 'custom';

/**
 * Status of a habit in the system.
 */
export type HabitStatus = 'active' | 'paused' | 'archived';

/**
 * A recorded instance of completing a habit on a scheduled day.
 */
export interface Completion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string; // ISO date string (YYYY-MM-DD)
  created_at: string;
}

/**
 * A unique flower variant unlocked by reaching a streak milestone.
 * Milestones: 30, 60, 100 consecutive completions.
 */
export interface RareFlower {
  id: string;
  habit_id: string;
  milestone: RareFlowerMilestone;
  variant_id: string;
  is_active_display: boolean;
  unlocked_at: string;
}

/**
 * Valid milestone values for rare flower unlocks.
 */
export type RareFlowerMilestone = 30 | 60 | 100;

/**
 * Per-user settings for garden sharing with visitors.
 */
export interface GardenShareSettings {
  id: string;
  user_id: string;
  is_sharing_enabled: boolean;
  share_link_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * A friend connection between two users.
 */
export interface FriendConnection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: FriendConnectionStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Status of a friend connection request.
 */
export type FriendConnectionStatus = 'pending' | 'accepted' | 'rejected';

/**
 * A per-habit reminder configuration for push notifications.
 */
export interface Reminder {
  id: string;
  habit_id: string;
  user_id: string;
  reminder_time: string; // HH:MM format (24-hour)
  is_enabled: boolean;
  retry_count: number;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Server Action Input Types
// -----------------------------------------------------------------------------

/**
 * Input for creating a new habit.
 */
export interface CreateHabitInput {
  name: string;
  schedule_type: ScheduleType;
  schedule_days?: number[];
}

/**
 * Input for updating an existing habit.
 * All fields are optional — only provided fields are updated.
 */
export interface UpdateHabitInput {
  name?: string;
  schedule_type?: ScheduleType;
  schedule_days?: number[];
}

// -----------------------------------------------------------------------------
// Server Action Output Types
// -----------------------------------------------------------------------------

/**
 * Result of an authentication operation (login/register).
 */
export interface AuthResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

/**
 * Minimal user information returned from auth operations.
 */
export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Result of a share settings toggle operation.
 */
export interface ShareSettingsResult {
  success: boolean;
  error?: string;
  settings?: GardenShareSettings;
}

/**
 * Result of a friend request operation.
 */
export interface FriendRequestResult {
  success: boolean;
  error?: string;
  connection?: FriendConnection;
}

// -----------------------------------------------------------------------------
// Error Codes
// -----------------------------------------------------------------------------

/**
 * Application-wide error codes for structured error handling.
 */
export enum ErrorCode {
  /** Attempt to record a completion that already exists for this habit + date */
  DUPLICATE_COMPLETION = 'DUPLICATE_COMPLETION',

  /** User has reached the maximum of 20 active habits */
  HABIT_LIMIT_REACHED = 'HABIT_LIMIT_REACHED',

  /** Friend request sent to an email not associated with any account */
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  /** Login attempt with wrong email/password combination */
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  /** Registration attempt with an email already in use */
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',

  /** Visitor accessed an invalid or expired share link */
  INVALID_SHARE_LINK = 'INVALID_SHARE_LINK',

  /** Friend request to a user with an existing pending or accepted connection */
  CONNECTION_EXISTS = 'CONNECTION_EXISTS',

  /** User attempted to send a friend request to themselves */
  SELF_REQUEST = 'SELF_REQUEST',

  /** Attempt to record a completion on a day not in the habit's schedule */
  NOT_SCHEDULED_DAY = 'NOT_SCHEDULED_DAY',

  /** Generic validation failure (form input, constraints) */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * Structured error response from server actions.
 */
export interface ActionError {
  code: ErrorCode;
  message: string;
}

/**
 * Result of a completion recording operation.
 */
export interface CompletionResult {
  success: boolean;
  error?: ActionError;
  completion?: Completion;
  newStreak?: number;
  growthStage?: GrowthStage;
  rareFlowerUnlock?: RareFlowerUnlock | null;
}

// -----------------------------------------------------------------------------
// Garden Engine Types (used in domain logic computations)
// -----------------------------------------------------------------------------

/**
 * Result from the rare flower unlock check.
 * Returned when a streak hits a milestone and the flower hasn't been unlocked yet.
 */
export interface RareFlowerUnlock {
  milestone: RareFlowerMilestone;
  variant_id: string;
}

/**
 * Dashboard statistics computed from user data.
 */
export interface DashboardStats {
  /** Number of active (non-paused, non-archived) habits */
  total_active_habits: number;

  /** Longest current streak among active habits */
  longest_current_streak: number;

  /** Total lifetime completions across all habits (including archived) */
  total_lifetime_completions: number;

  /** Total rare flowers unlocked across all habits (including archived) */
  total_rare_flowers: number;

  /** Weekly completion rate as a whole-number percentage (0-100) */
  weekly_completion_rate: number;
}

/**
 * Visitor-facing garden data (filtered to hide private information).
 */
export interface VisitorGardenData {
  plants: VisitorPlant[];
}

/**
 * A plant as seen by a visitor — only growth stage and rare flowers are visible.
 * Streak counts and completion history are hidden.
 */
export interface VisitorPlant {
  habit_name: string;
  growth_stage: GrowthStage;
  rare_flowers: VisitorRareFlower[];
}

/**
 * Rare flower data visible to visitors.
 */
export interface VisitorRareFlower {
  variant_id: string;
  is_active_display: boolean;
}
