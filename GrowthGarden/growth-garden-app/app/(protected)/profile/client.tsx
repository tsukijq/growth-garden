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
    <div className="bg-[#ffffff] border border-[#e2e5da] rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🌙</span>
            <p className="text-sm text-[#1F2A1F] font-medium">Quiet mode</p>
          </div>
          <p className="text-xs text-[#6b7a6b] mt-1">
            Your garden keeps growing. No reminders, no nudges — just you and your plants.
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative w-11 h-6 rounded-full transition-colors ${quietMode ? 'bg-[#4A7C59]' : 'bg-[#e2e5da]'}`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${quietMode ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>
    </div>
  );
}
