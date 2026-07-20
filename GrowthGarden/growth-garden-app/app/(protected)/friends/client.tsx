'use client';

import { useState } from 'react';
import { Profile, Friendship, Habit } from '@/types';
import { FriendRow } from '@/components/friends/FriendRow';
import { sendFriendRequest, acceptFriendRequest } from '@/lib/actions/friends';

interface FriendsPageClientProps {
  initialFriends: (Profile & { habits?: Habit[] })[];
  initialPending: Friendship[];
}

export function FriendsPageClient({ initialFriends, initialPending }: FriendsPageClientProps) {
  const [friends] = useState(initialFriends);
  const [pending, setPending] = useState(initialPending);
  const [username, setUsername] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(false);

    if (!username.trim()) return;

    const result = await sendFriendRequest(username.trim().toLowerCase());
    if (!result.success) {
      setSendError(result.error || 'Something went wrong');
      return;
    }

    setSendSuccess(true);
    setUsername('');
  }

  async function handleAccept(friendshipId: string) {
    await acceptFriendRequest(friendshipId);
    setPending((prev) => prev.filter((p) => p.id !== friendshipId));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">Friends</h1>

      {/* Add friend form */}
      <form onSubmit={handleSendRequest} className="mb-6">
        <div className="flex gap-2">
          <label htmlFor="friend-username" className="sr-only">Add friend by username</label>
          <input
            id="friend-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Add friend by username"
            className="flex-1 px-4 py-2.5 bg-[#141820] border border-[#252a38] rounded-lg text-sm text-[#e0e6f0] focus:outline-none focus:border-[#4a8a50] transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#4a8a50] text-white text-sm rounded-lg hover:bg-[#5a9a60] transition-colors"
          >
            Send
          </button>
        </div>
        {sendError && <p className="text-xs text-[#c05030] mt-2">{sendError}</p>}
        {sendSuccess && <p className="text-xs text-[#6ee7a0] mt-2">Request sent!</p>}
      </form>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm text-[#8b95a8] font-medium mb-3">Pending requests</h2>
          <div className="flex flex-col gap-2">
            {pending.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 bg-[#141820] border border-[#252a38] rounded-lg"
              >
                <p className="text-sm text-[#e0e6f0]">Friend request received</p>
                <button
                  onClick={() => handleAccept(request.id)}
                  className="px-3 py-1 text-xs bg-[#4a8a50] text-white rounded-full hover:bg-[#5a9a60] transition-colors"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      {friends.length > 0 ? (
        <div>
          <h2 className="text-sm text-[#8b95a8] font-medium mb-3">Your garden neighbors</h2>
          <div className="flex flex-col gap-2">
            {friends.map((friend) => (
              <FriendRow key={friend.id} profile={friend} habits={friend.habits} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-[#8b95a8] text-sm">No friends yet.</p>
          <p className="text-[#8b95a8] text-xs mt-1">Add a friend by their username to visit their garden.</p>
        </div>
      )}
    </div>
  );
}
