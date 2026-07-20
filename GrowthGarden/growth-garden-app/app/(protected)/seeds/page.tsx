import { SeedsPageClient } from './client';
import { getUserHabits } from '@/lib/actions/habits';

export default async function SeedsPage() {
  const habits = await getUserHabits();
  const longestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak_count)) : 0;
  return <SeedsPageClient longestStreak={longestStreak} />;
}
