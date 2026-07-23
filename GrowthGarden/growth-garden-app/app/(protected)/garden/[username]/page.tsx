import { getFriendGarden } from '@/lib/actions/friends';
import { FriendGardenClient } from './client';

interface Props {
  params: Promise<{ username: string }>;
}

export default async function FriendGardenPage({ params }: Props) {
  const { username } = await params;
  const { profile, habits } = await getFriendGarden(username);

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-[#6b7a6b]">Garden not found.</p>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-[#ffffff] border border-[#e2e5da] rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-[#6b7a6b]">
            Visiting <span className="text-[#1F2A1F] font-medium">{profile.username}&apos;s garden</span>
          </p>
        </div>
        <p className="text-[#6b7a6b] text-center">
          You need to be friends to visit this garden.
        </p>
      </div>
    );
  }

  return <FriendGardenClient profile={profile} habits={habits} />;
}
