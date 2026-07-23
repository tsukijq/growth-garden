import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getHabitById, updateHabitAction } from '@/lib/actions/habit-management';
import { EditHabitForm } from './client';

interface EditHabitPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHabitPage({ params }: EditHabitPageProps) {
  const { id } = await params;
  const habit = await getHabitById(id);

  if (!habit) {
    notFound();
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
        <h1 className="text-xl font-bold text-[#1F2A1F]">Edit Habit</h1>
      </div>

      <EditHabitForm
        habitId={id}
        defaultValues={{
          name: habit.name,
          schedule_type: habit.schedule_type,
          schedule_days: habit.schedule_days,
        }}
      />
    </div>
  );
}
