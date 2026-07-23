'use client';

import Link from 'next/link';
import { HabitForm } from '@/components/habits/HabitForm';
import { createHabitAction } from '@/lib/actions/habit-management';
import type { HabitActionResult } from '@/lib/actions/habit-management';

export default function NewHabitPage() {
  async function handleCreate(formData: FormData) {
    'use server';
    const initialState: HabitActionResult = { success: false };
    return createHabitAction(initialState, formData);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/habits"
          className="p-2 text-[#6b7a6b] hover:text-[#1F2A1F] transition-colors rounded-md hover:bg-[#e2e5da]/50"
          aria-label="Back to habits"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-[#1F2A1F]">New Habit</h1>
      </div>

      <HabitForm action={handleCreate} submitLabel="Create Habit" />
    </div>
  );
}
