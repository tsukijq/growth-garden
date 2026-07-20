'use client';

import { useState } from 'react';
import { toggleQuietMode } from '@/lib/actions/habits';

interface ProfileClientProps {
  quietMode: boolean;
}

export function ProfileClient({ quietMode: initialQuietMode }: ProfileClientProps) {
  const [quietMode, setQuietMode] = useState(initialQuietMode);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const newValue = !quietMode;
    await toggleQuietMode(newValue);
    setQuietMode(newValue);
    setLoading(false);
  }

  return (
    <div className="bg-[#141820] border border-[#252a38] rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🌙</span>
            <p className="text-sm text-[#e0e6f0] font-medium">Quiet mode</p>
          </div>
          <p className="text-xs text-[#8b95a8] mt-1">
            Your garden keeps growing. No reminders, no nudges — just you and your plants.
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative w-11 h-6 rounded-full transition-colors ${quietMode ? 'bg-[#4a8a50]' : 'bg-[#252a38]'}`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${quietMode ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>
    </div>
  );
}
