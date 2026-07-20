import { describe, it, expect } from 'vitest';
import {
  validateHabitName,
  validateEmail,
  validatePassword,
  validateSchedule,
} from './validation';

describe('validateHabitName', () => {
  it('accepts a valid name', () => {
    expect(validateHabitName('Morning Run')).toEqual({ valid: true });
  });

  it('accepts a single character name', () => {
    expect(validateHabitName('X')).toEqual({ valid: true });
  });

  it('accepts a name at the 50-character limit', () => {
    const name = 'a'.repeat(50);
    expect(validateHabitName(name)).toEqual({ valid: true });
  });

  it('rejects an empty string', () => {
    const result = validateHabitName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects a whitespace-only string', () => {
    const result = validateHabitName('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects a name exceeding 50 characters', () => {
    const name = 'a'.repeat(51);
    const result = validateHabitName(name);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('accepts a name with leading/trailing spaces if non-whitespace exists', () => {
    expect(validateHabitName(' hello ')).toEqual({ valid: true });
  });
});

describe('validateEmail', () => {
  it('accepts a standard email', () => {
    expect(validateEmail('user@example.com')).toEqual({ valid: true });
  });

  it('accepts email with subdomain', () => {
    expect(validateEmail('user@mail.example.com')).toEqual({ valid: true });
  });

  it('rejects email without @', () => {
    const result = validateEmail('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects email with multiple @ symbols', () => {
    const result = validateEmail('user@@example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects email without local part', () => {
    const result = validateEmail('@example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects email without dot in domain', () => {
    const result = validateEmail('user@localhost');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects email with dot at start of domain', () => {
    const result = validateEmail('user@.example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects email with dot at end of domain', () => {
    const result = validateEmail('user@example.');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('validatePassword', () => {
  it('accepts an 8-character password', () => {
    expect(validatePassword('12345678')).toEqual({ valid: true });
  });

  it('accepts a 128-character password', () => {
    const pw = 'a'.repeat(128);
    expect(validatePassword(pw)).toEqual({ valid: true });
  });

  it('accepts a typical password', () => {
    expect(validatePassword('mySecurePassword123')).toEqual({ valid: true });
  });

  it('rejects a 7-character password', () => {
    const result = validatePassword('1234567');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects a 129-character password', () => {
    const pw = 'a'.repeat(129);
    const result = validatePassword(pw);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects an empty password', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('validateSchedule', () => {
  describe('daily schedule', () => {
    it('accepts daily with no scheduleDays', () => {
      expect(validateSchedule('daily')).toEqual({ valid: true });
    });

    it('accepts daily with undefined scheduleDays', () => {
      expect(validateSchedule('daily', undefined)).toEqual({ valid: true });
    });

    it('accepts daily with null scheduleDays', () => {
      expect(validateSchedule('daily', null)).toEqual({ valid: true });
    });
  });

  describe('weekly schedule', () => {
    it('accepts weekly with one valid day', () => {
      expect(validateSchedule('weekly', [3])).toEqual({ valid: true });
    });

    it('accepts weekly with Sunday (0)', () => {
      expect(validateSchedule('weekly', [0])).toEqual({ valid: true });
    });

    it('accepts weekly with Saturday (6)', () => {
      expect(validateSchedule('weekly', [6])).toEqual({ valid: true });
    });

    it('rejects weekly with no days', () => {
      const result = validateSchedule('weekly', []);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects weekly with multiple days', () => {
      const result = validateSchedule('weekly', [1, 3]);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects weekly with null scheduleDays', () => {
      const result = validateSchedule('weekly', null);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects weekly with day out of range', () => {
      const result = validateSchedule('weekly', [7]);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects weekly with negative day', () => {
      const result = validateSchedule('weekly', [-1]);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('custom schedule', () => {
    it('accepts custom with one day', () => {
      expect(validateSchedule('custom', [1])).toEqual({ valid: true });
    });

    it('accepts custom with all 7 days', () => {
      expect(validateSchedule('custom', [0, 1, 2, 3, 4, 5, 6])).toEqual({ valid: true });
    });

    it('rejects custom with no days', () => {
      const result = validateSchedule('custom', []);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects custom with null scheduleDays', () => {
      const result = validateSchedule('custom', null);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects custom with more than 7 days', () => {
      const result = validateSchedule('custom', [0, 1, 2, 3, 4, 5, 6, 0]);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects custom with duplicate days', () => {
      const result = validateSchedule('custom', [1, 3, 1]);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects custom with day out of range', () => {
      const result = validateSchedule('custom', [1, 7]);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects custom with non-integer day', () => {
      const result = validateSchedule('custom', [1.5]);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
