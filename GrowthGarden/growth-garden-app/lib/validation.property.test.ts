import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  validateHabitName,
  validateEmail,
  validatePassword,
  validateSchedule,
} from './validation';
import { ScheduleType } from './types';

// =============================================================================
// Property 2: Habit name and schedule validation rejects invalid inputs
// Tag: Feature: growth-garden, Property 2: Habit name and schedule validation rejects invalid inputs
// Validates: Requirements 2.1, 2.3, 10.6
// =============================================================================

describe('Property 2: Habit name and schedule validation rejects invalid inputs', () => {
  it('rejects empty strings', () => {
    // Empty string is always invalid
    const result = validateHabitName('');
    expect(result.valid).toBe(false);
  });

  it('rejects whitespace-only strings', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 50 }).map(arr => arr.join('')),
        (whitespaceStr) => {
          const result = validateHabitName(whitespaceStr);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects strings exceeding 50 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 51, maxLength: 200 }),
        (longStr) => {
          const result = validateHabitName(longStr);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts strings of 1-50 characters with at least one non-whitespace character', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        (validStr) => {
          const result = validateHabitName(validStr);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts valid habit name with daily schedule', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        (name) => {
          const nameResult = validateHabitName(name);
          const scheduleResult = validateSchedule('daily');
          expect(nameResult.valid).toBe(true);
          expect(scheduleResult.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts valid habit name with weekly schedule (valid day 0-6)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        fc.integer({ min: 0, max: 6 }),
        (name, day) => {
          const nameResult = validateHabitName(name);
          const scheduleResult = validateSchedule('weekly', [day]);
          expect(nameResult.valid).toBe(true);
          expect(scheduleResult.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts valid habit name with custom schedule (1-7 unique days)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        fc.uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: 1, maxLength: 7 }),
        (name, days) => {
          const nameResult = validateHabitName(name);
          const scheduleResult = validateSchedule('custom', days);
          expect(nameResult.valid).toBe(true);
          expect(scheduleResult.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects weekly schedule with invalid day values', () => {
    fc.assert(
      fc.property(
        fc.integer().filter((d) => d < 0 || d > 6),
        (invalidDay) => {
          const result = validateSchedule('weekly', [invalidDay]);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects custom schedule with duplicate days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 6 }),
        fc.uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: 0, maxLength: 5 }),
        (dupDay, otherDays) => {
          // Create an array with at least one duplicate
          const days = [dupDay, ...otherDays, dupDay];
          const result = validateSchedule('custom', days);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Property 3: Auth credential validation
// Tag: Feature: growth-garden, Property 3: Auth credential validation
// Validates: Requirements 1.4, 1.6, 1.7
// =============================================================================

describe('Property 3: Auth credential validation', () => {
  it('accepts passwords of length 8-128', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 128 }),
        (password) => {
          const result = validatePassword(password);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects passwords shorter than 8 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 7 }),
        (password) => {
          const result = validatePassword(password);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects passwords longer than 128 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 129, maxLength: 300 }),
        (password) => {
          const result = validatePassword(password);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('password validation accepts if and only if length is 8-128', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 300 }),
        (password) => {
          const result = validatePassword(password);
          const shouldBeValid = password.length >= 8 && password.length <= 128;
          expect(result.valid).toBe(shouldBeValid);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts valid email format (local@domain.tld)', () => {
    const alphanumArb = fc.array(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
      { minLength: 1, maxLength: 20 }
    ).map(arr => arr.join(''));
    const alphaArb = fc.array(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
      { minLength: 1, maxLength: 6 }
    ).map(arr => arr.join(''));

    fc.assert(
      fc.property(
        alphanumArb,
        alphanumArb,
        alphaArb,
        (local, domain, tld) => {
          const email = `${local}@${domain}.${tld}`;
          const result = validateEmail(email);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects strings without @ symbol', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('@')),
        (noAtStr) => {
          const result = validateEmail(noAtStr);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects emails without local part (empty before @)', () => {
    const alphanumArb = fc.array(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
      { minLength: 1, maxLength: 10 }
    ).map(arr => arr.join(''));
    const alphaArb = fc.array(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
      { minLength: 1, maxLength: 5 }
    ).map(arr => arr.join(''));

    fc.assert(
      fc.property(
        alphanumArb,
        alphaArb,
        (domain, tld) => {
          const email = `@${domain}.${tld}`;
          const result = validateEmail(email);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects emails without dot in domain', () => {
    const alphanumArb = fc.array(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
      { minLength: 1, maxLength: 10 }
    ).map(arr => arr.join(''));

    fc.assert(
      fc.property(
        alphanumArb,
        alphanumArb,
        (local, domain) => {
          // Domain without any dot
          const email = `${local}@${domain}`;
          const result = validateEmail(email);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects emails with domain starting with dot', () => {
    const alphanumArb = fc.array(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
      { minLength: 1, maxLength: 10 }
    ).map(arr => arr.join(''));

    fc.assert(
      fc.property(
        alphanumArb,
        alphanumArb,
        (local, rest) => {
          const email = `${local}@.${rest}`;
          const result = validateEmail(email);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects emails with domain ending with dot', () => {
    const alphanumArb = fc.array(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
      { minLength: 1, maxLength: 10 }
    ).map(arr => arr.join(''));

    fc.assert(
      fc.property(
        alphanumArb,
        alphanumArb,
        (local, domain) => {
          const email = `${local}@${domain}.`;
          const result = validateEmail(email);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
