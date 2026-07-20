import { getFriends } from '@/lib/actions/friends';
import { FriendsPageClient } from './client';

export default async function FriendsPage() {
  const { friends, pending } = await getFriends();
  return <FriendsPageClient initialFriends={friends} initialPending={pending} />;
}
