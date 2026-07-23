import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Verify the request is from a trusted source (cron or manual invocation)
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${supabaseServiceKey}`) {
    // Allow if called internally by Supabase cron
    const isCron = req.headers.get('x-supabase-cron') === 'true';
    if (!isCron && !authHeader?.includes(supabaseServiceKey)) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get all users who have weekly digest enabled
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('notif_digest', true);

  if (usersError || !users || users.length === 0) {
    return new Response(JSON.stringify({ message: 'No users with digest enabled', count: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let sent = 0;

  for (const user of users) {
    // Get habits for this user
    const { data: habits } = await supabase
      .from('habits')
      .select('id, name, plant_name, plant_stage, health_score')
      .eq('user_id', user.id)
      .is('released_at', null);

    if (!habits || habits.length === 0) continue;

    // Get completions from the past 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const { data: logs } = await supabase
      .from('habit_logs')
      .select('habit_id, completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', weekAgoStr);

    const completionCount = logs?.length || 0;

    // Count plants in different states
    const blooming = habits.filter(h => h.plant_stage === 'flowering' || h.plant_stage === 'fruiting').length;
    const wilting = habits.filter(h => h.health_score < 40).length;
    const growing = habits.filter(h => h.health_score >= 40 && h.plant_stage !== 'flowering' && h.plant_stage !== 'fruiting').length;

    // Build the digest message
    const parts: string[] = [];
    if (blooming > 0) parts.push(`${blooming} plant${blooming > 1 ? 's' : ''} in bloom`);
    if (growing > 0) parts.push(`${growing} growing steadily`);
    if (wilting > 0) parts.push(`${wilting} could use some water`);

    const summary = parts.length > 0 ? parts.join(', ') : 'Your garden is resting';
    const body = `${completionCount} check-in${completionCount !== 1 ? 's' : ''} this week. ${summary}.`;

    // Insert the digest notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'digest',
      title: 'Your garden this week 🌿',
      body,
      habit_id: null,
    });

    sent++;
  }

  return new Response(JSON.stringify({ message: `Sent ${sent} weekly digests`, count: sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
