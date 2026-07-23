import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserHabits } from '@/lib/actions/habits';
import { getNotificationPrefs } from '@/lib/actions/notifications';
import { PlantSVG } from '@/components/plants/PlantSVG';
import { getRareVariant } from '@/lib/utils/plantStage';
import { ProfileClient } from './client';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-[#6b7a6b]">Please sign in to view your profile.</p>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const habits = await getUserHabits();
  const longestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak_count)) : 0;
  const rareBlooms = habits.filter((h) => h.plant_stage === 'fruiting');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">Profile</h1>

      {/* Avatar & username */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-[#ffffff] border border-[#e2e5da] flex items-center justify-center text-2xl text-[#6b7a6b]">
          {profile?.username?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-lg font-medium text-[#1F2A1F]">{profile?.username || 'Unknown'}</p>
          <p className="text-xs text-[#6b7a6b]">Growing since {new Date(habits[0]?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-[#ffffff] border border-[#e2e5da] rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-[#1F2A1F]">{habits.length}</p>
          <p className="text-xs text-[#6b7a6b] mt-1">Habits</p>
        </div>
        <div className="bg-[#ffffff] border border-[#e2e5da] rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-[#4A7C59]">{longestStreak}</p>
          <p className="text-xs text-[#6b7a6b] mt-1">Longest streak</p>
        </div>
        <div className="bg-[#ffffff] border border-[#e2e5da] rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-[#7c4dbd]">{rareBlooms.length}</p>
          <p className="text-xs text-[#6b7a6b] mt-1">Rare blooms</p>
        </div>
      </div>

      {/* Quiet Mode */}
      <ProfileClient quietMode={profile?.quiet_mode || false} />

      {/* Notification Settings */}
      <div className="mt-6">
        <NotificationSettings initialPrefs={await getNotificationPrefs()} />
      </div>

      {/* Rare blooms collection */}
      {rareBlooms.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm text-[#6b7a6b] font-medium mb-3">Rare blooms collected</h2>
          <div className="grid grid-cols-3 gap-3">
            {rareBlooms.map((habit) => (
              <div key={habit.id} className="bg-[#ffffff] border border-[#7c4dbd]/30 rounded-lg p-3 flex flex-col items-center">
                <div className="w-16 h-16">
                  <PlantSVG
                    stage="fruiting"
                    healthScore={habit.health_score}
                    variant={getRareVariant(habit.streak_count)}
                  />
                </div>
                <p className="text-xs text-[#9060e8] mt-2 text-center truncate w-full">{habit.plant_name || habit.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {rareBlooms.length === 0 && (
        <div className="text-center py-8 mt-4">
          <p className="text-[#6b7a6b] text-sm">No rare blooms yet.</p>
          <p className="text-[#6b7a6b] text-xs mt-1">Keep showing up and something rare will grow.</p>
        </div>
      )}

      {/* Logout */}
      <form action="/api/auth/logout" method="POST" className="mt-8">
        <button
          type="submit"
          className="w-full py-3 text-sm text-[#6b7a6b] border border-[#e2e5da] rounded-lg hover:border-[#c44030] hover:text-[#c44030] transition-colors"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
