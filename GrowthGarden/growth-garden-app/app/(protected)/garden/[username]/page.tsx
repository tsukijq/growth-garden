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
        <p className="text-[#8b95a8]">Garden not found.</p>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-[#141820] border border-[#252a38] rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-[#8b95a8]">
            Visiting <span className="text-[#e0e6f0] font-medium">{profile.username}&apos;s garden</span>
          </p>
        </div>
        <p className="text-[#8b95a8] text-center">
          You need to be friends to visit this garden.
        </p>
      </div>
    );
  }

  return <FriendGardenClient profile={profile} habits={habits} />;
}
