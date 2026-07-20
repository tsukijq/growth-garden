'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { computePlantStage } from '@/lib/utils/plantStage';
import { Habit } from '@/types';

export async function waterFriendHabit(habitId: string, toUserId: string): Promise<Habit | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const today = new Date().toISOString().split('T')[0];

  // Check if already watered this user today
  const { data: existing } = await supabase
    .from('waterings')
    .select('id')
    .eq('from_user_id', user.id)
    .eq('to_user_id', toUserId)
    .gte('watered_at', `${today}T00:00:00`)
    .lt('watered_at', `${today}T23:59:59`)
    .single();

  if (existing) return { error: 'You already watered this friend today' };

  // Get the habit (readable via "Friends can read habits" RLS policy)
  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', toUserId)
    .single();

  if (!habit) return { error: 'Plant not found' };

  // Insert watering record
  const { error: waterError } = await supabase.from('waterings').insert({
    from_user_id: user.id,
    to_user_id: toUserId,
    habit_id: habitId,
  });

  if (waterError) return { error: 'Failed to water plant' };

  // Use a security definer function to update friend's habit health
  // since RLS blocks writing to another user's habits
  const { data: updated, error: rpcError } = await supabase.rpc('water_friend_plant', {
    habit_id_input: habitId,
    health_boost: 15,
  });

  if (rpcError) return { error: 'Watering recorded but health boost failed' };

  revalidatePath('/garden');
  return updated as Habit;
}
