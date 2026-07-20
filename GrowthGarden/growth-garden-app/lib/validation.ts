// =============================================================================
// GrowthGarden Validation Functions
// =============================================================================
// Pure validation functions for form inputs and domain constraints.
// These functions have no database access and are fully testable in isolation.
// =============================================================================

import { ScheduleType } from './types';

/**
 * Validation result returned by all validation functions.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a habit name.
 *
 * Rules:
 * - Must not be empty
 * - Must not be whitespace-only (after trim, length must be > 0)
 * - Must not exceed 50 characters
 *
 * @param name - The habit name to validate
 * @returns ValidationResult indicating success or failure with an error message
 */
export function validateHabitName(name: string): ValidationResult {
  if (name.length === 0) {
    return { valid: false, error: 'Habit name is required' };
  }

  if (name.trim().length === 0) {
    return { valid: false, error: 'Habit name cannot be whitespace only' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Habit name must be 50 characters or less' };
  }

  return { valid: true };
}

/**
 * Validates an email address.
 *
 * Rules:
 * - Must contain a local part (at least one character before @)
 * - Must contain exactly one @ symbol
 * - Must have a domain after @ that contains at least one dot
 * - Domain must have characters before and after the dot
 *
 * @param email - The email address to validate
 * @returns ValidationResult indicating success or failure with an error message
 */
export function validateEmail(email: string): ValidationResult {
  // Split by @ — must have exactly two parts
  const atParts = email.split('@');

  if (atParts.length !== 2) {
    return { valid: false, error: 'Email must contain exactly one @ symbol' };
  }

  const [localPart, domain] = atParts;

  // Local part must have at least one character
  if (localPart.length === 0) {
    return { valid: false, error: 'Email must have a local part before @' };
  }

  // Domain must contain at least one dot
  const dotIndex = domain.indexOf('.');
  if (dotIndex === -1) {
    return { valid: false, error: 'Email domain must contain at least one dot' };
  }

  // Domain must have characters before the dot
  if (dotIndex === 0) {
    return { valid: false, error: 'Email domain must have characters before the dot' };
  }

  // Domain must have characters after the last dot
  const lastDotIndex = domain.lastIndexOf('.');
  if (lastDotIndex === domain.length - 1) {
    return { valid: false, error: 'Email domain must have characters after the dot' };
  }

  return { valid: true };
}

/**
 * Validates a password.
 *
 * Rules:
 * - Must be between 8 and 128 characters inclusive
 *
 * @param password - The password to validate
 * @returns ValidationResult indicating success or failure with an error message
 */
export function validatePassword(password: string): ValidationResult {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password must be 128 characters or less' };
  }

  return { valid: true };
}

/**
 * Validates a schedule configuration.
 *
 * Rules:
 * - If scheduleType is 'daily' → scheduleDays can be null/undefined (always valid)
 * - If scheduleType is 'weekly' → scheduleDays must have exactly 1 element, value 0-6
 * - If scheduleType is 'custom' → scheduleDays must have 1-7 elements, all values 0-6, no duplicates
 *
 * @param scheduleType - The type of schedule ('daily', 'weekly', 'custom')
 * @param scheduleDays - Optional array of day numbers (0=Sunday, 6=Saturday)
 * @returns ValidationResult indicating success or failure with an error message
 */
export function validateSchedule(
  scheduleType: ScheduleType,
  scheduleDays?: number[] | null
): ValidationResult {
  if (scheduleType === 'daily') {
    return { valid: true };
  }

  if (scheduleType === 'weekly') {
    if (!scheduleDays || scheduleDays.length !== 1) {
      return { valid: false, error: 'Weekly schedule must have exactly one day selected' };
    }

    const day = scheduleDays[0];
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      return { valid: false, error: 'Schedule day must be a value between 0 (Sunday) and 6 (Saturday)' };
    }

    return { valid: true };
  }

  if (scheduleType === 'custom') {
    if (!scheduleDays || scheduleDays.length === 0) {
      return { valid: false, error: 'Custom schedule must have at least one day selected' };
    }

    if (scheduleDays.length > 7) {
      return { valid: false, error: 'Custom schedule cannot have more than 7 days' };
    }

    for (const day of scheduleDays) {
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        return { valid: false, error: 'Schedule days must be values between 0 (Sunday) and 6 (Saturday)' };
      }
    }

    const uniqueDays = new Set(scheduleDays);
    if (uniqueDays.size !== scheduleDays.length) {
      return { valid: false, error: 'Custom schedule must not contain duplicate days' };
    }

    return { valid: true };
  }

  return { valid: false, error: 'Invalid schedule type' };
}
