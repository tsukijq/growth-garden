'use client';

import { HabitForm } from '@/components/habits/HabitForm';
import { updateHabitAction } from '@/lib/actions/habit-management';
import type { HabitActionResult } from '@/lib/actions/habit-management';
import type { ScheduleType } from '@/lib/types';

interface EditHabitFormProps {
  habitId: string;
  defaultValues: {
    name: string;
    schedule_type: ScheduleType;
    schedule_days: number[] | null;
  };
}

export function EditHabitForm({ habitId, defaultValues }: EditHabitFormProps) {
  async function handleUpdate(formData: FormData) {
    'use server';
    const initialState: HabitActionResult = { success: false };
    return updateHabitAction(habitId, initialState, formData);
  }

  return (
    <HabitForm
      action={handleUpdate}
      defaultValues={defaultValues}
      submitLabel="Save Changes"
    />
  );
}
