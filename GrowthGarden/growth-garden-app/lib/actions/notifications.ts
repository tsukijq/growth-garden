'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Notification {
  id: string;
  user_id: string;
  type: 'social' | 'milestone' | 'nudge' | 'digest';
  title: string;
  body: string;
  read: boolean;
  habit_id: string | null;
  created_at: string;
}

export interface NotificationPrefs {
  notif_social: boolean;
  notif_milestone: boolean;
  notif_nudge: boolean;
  notif_digest: boolean;
}

// --- Queries ---

export async function getNotifications(limit = 20): Promise<Notification[]> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []) as Notification[];
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);

  return count || 0;
}

export async function markAllRead(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  revalidatePath('/garden');
}

export async function markRead(notificationId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { notif_social: true, notif_milestone: true, notif_nudge: false, notif_digest: false };

  const { data } = await supabase
    .from('profiles')
    .select('notif_social, notif_milestone, notif_nudge, notif_digest')
    .eq('id', user.id)
    .single();

  return {
    notif_social: data?.notif_social ?? true,
    notif_milestone: data?.notif_milestone ?? true,
    notif_nudge: data?.notif_nudge ?? false,
    notif_digest: data?.notif_digest ?? false,
  };
}

export async function updateNotificationPrefs(prefs: Partial<NotificationPrefs>): Promise<{ success: boolean }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  await supabase
    .from('profiles')
    .update(prefs)
    .eq('id', user.id);

  revalidatePath('/profile');
  return { success: true };
}

// --- Sending notifications ---

export async function sendNotification(
  userId: string,
  type: 'social' | 'milestone' | 'nudge' | 'digest',
  title: string,
  body: string,
  habitId?: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  // Check user prefs
  const { data: prefs } = await supabase
    .from('profiles')
    .select('notif_social, notif_milestone, notif_nudge, notif_digest')
    .eq('id', userId)
    .single();

  if (prefs) {
    if (type === 'social' && !prefs.notif_social) return;
    if (type === 'milestone' && !prefs.notif_milestone) return;
    if (type === 'nudge' && !prefs.notif_nudge) return;
    if (type === 'digest' && !prefs.notif_digest) return;
  }

  // For nudges, check the once-per-week cap
  if (type === 'nudge' && habitId) {
    const { data: habit } = await supabase
      .from('habits')
      .select('last_nudge_at')
      .eq('id', habitId)
      .single();

    if (habit?.last_nudge_at) {
      const lastNudge = new Date(habit.last_nudge_at);
      const daysSince = (Date.now() - lastNudge.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return; // Cap: once per week per habit
    }

    // Update last_nudge_at
    await supabase
      .from('habits')
      .update({ last_nudge_at: new Date().toISOString() })
      .eq('id', habitId);
  }

  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    habit_id: habitId || null,
  });
}
