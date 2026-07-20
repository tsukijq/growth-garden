'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Friendship, Profile, Habit } from '@/types';

export async function sendFriendRequest(username: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Look up profile by username
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (!profile) return { success: false, error: 'User not found' };
  if (profile.id === user.id) return { success: false, error: "You can't add yourself" };

  // Check existing friendship
  const { data: existing } = await supabase
    .from('friendships')
    .select('id')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`)
    .single();

  if (existing) return { success: false, error: 'Friend request already exists' };

  const { error } = await supabase.from('friendships').insert({
    requester_id: user.id,
    addressee_id: profile.id,
    status: 'pending',
  });

  if (error) return { success: false, error: 'Failed to send request' };
  return { success: true };
}

export async function acceptFriendRequest(friendshipId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .eq('addressee_id', user.id);

  if (error) return { success: false, error: 'Failed to accept request' };
  return { success: true };
}

export async function getFriends(): Promise<{ friends: (Profile & { habits?: Habit[] })[]; pending: Friendship[] }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { friends: [], pending: [] };

  // Run both queries in parallel
  const [friendshipsResult, pendingResult] = await Promise.all([
    supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
    supabase
      .from('friendships')
      .select('*')
      .eq('addressee_id', user.id)
      .eq('status', 'pending'),
  ]);

  const friendships = friendshipsResult.data || [];
  const pending = pendingResult.data || [];

  const friendIds = friendships.map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  let friends: (Profile & { habits?: Habit[] })[] = [];
  if (friendIds.length > 0) {
    // Fetch profiles and all friend habits in parallel (2 queries, not N)
    const [profilesResult, habitsResult] = await Promise.all([
      supabase.from('profiles').select('*').in('id', friendIds),
      supabase.from('habits').select('*').in('user_id', friendIds).is('released_at', null),
    ]);

    const profiles = profilesResult.data || [];
    const allHabits = habitsResult.data || [];

    // Group habits by user_id
    friends = profiles.map((profile) => ({
      ...profile,
      habits: allHabits.filter((h) => h.user_id === profile.id),
    }));
  }

  return { friends, pending: pending as Friendship[] };
}

export async function getFriendGarden(username: string): Promise<{ profile: Profile | null; habits: Habit[] }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { profile: null, habits: [] };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) return { profile: null, habits: [] };

  // Check friendship exists
  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .eq('status', 'accepted')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`)
    .single();

  if (!friendship) return { profile, habits: [] };

  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', profile.id);

  return { profile, habits: habits || [] };
}
