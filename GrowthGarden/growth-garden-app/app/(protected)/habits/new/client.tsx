'use client';

import { HabitForm } from '@/components/habits/HabitForm';
import { createHabitAction } from '@/lib/actions/habit-management';
import type { HabitActionResult } from '@/lib/actions/habit-management';

export function NewHabitFormWrapper() {
  async function handleCreate(formData: FormData) {
    const initialState: HabitActionResult = { success: false };
    return createHabitAction(initialState, formData);
  }

  return <HabitForm action={handleCreate} submitLabel="Create Habit" />;
}
