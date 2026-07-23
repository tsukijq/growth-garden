import Link from 'next/link';
import { getAllHabits } from '@/lib/actions/habit-management';
import { HabitList } from '@/components/habits/HabitList';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function HabitsPage() {
  const habits = await getAllHabits();

  // Fetch today's completions to determine which habits are already done
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let completedToday: string[] = [];
  if (user) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { data: completions } = await supabase
      .from('completions')
      .select('habit_id')
      .eq('user_id', user.id)
      .eq('completed_date', today);

    completedToday = (completions || []).map((c: { habit_id: string }) => c.habit_id);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#1F2A1F]">Habits</h1>
        <Link
          href="/habits/new"
          className="px-4 py-2 bg-[#4A7C59] text-white text-sm rounded-lg font-medium hover:bg-[#3d6b4a] transition-colors"
        >
          + New Habit
        </Link>
      </div>

      <HabitList habits={habits} completedToday={completedToday} />
    </div>
  );
}
