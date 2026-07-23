'use client';

import { useState } from 'react';
import { NotificationPrefs, updateNotificationPrefs } from '@/lib/actions/notifications';

interface NotificationSettingsProps {
  initialPrefs: NotificationPrefs;
}

const settings = [
  { key: 'notif_social' as const, label: 'Friend activity', desc: 'When a friend waters your plant', emoji: '💧' },
  { key: 'notif_milestone' as const, label: 'Milestones', desc: 'Growth stage changes and rare blooms', emoji: '🌸' },
  { key: 'notif_nudge' as const, label: 'Gentle nudges', desc: 'A quiet reminder when a plant is resting', emoji: '🌙' },
  { key: 'notif_digest' as const, label: 'Weekly digest', desc: 'A summary of your garden each week', emoji: '📋' },
];

export function NotificationSettings({ initialPrefs }: NotificationSettingsProps) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [saving, setSaving] = useState<string | null>(null);

  async function handleToggle(key: keyof NotificationPrefs) {
    const newValue = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: newValue }));
    setSaving(key);
    await updateNotificationPrefs({ [key]: newValue });
    setSaving(null);
  }

  return (
    <div className="bg-[#ffffff] border border-[#e2e5da] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e2e5da]">
        <p className="text-sm font-medium text-[#1F2A1F]">Notifications</p>
        <p className="text-[10px] text-[#6b7a6b] mt-0.5">Choose what your garden tells you about.</p>
      </div>
      <div className="divide-y divide-[#f0f2ea]">
        {settings.map((s) => (
          <div key={s.key} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="text-base mt-0.5">{s.emoji}</span>
              <div>
                <p className="text-sm text-[#1F2A1F] font-medium">{s.label}</p>
                <p className="text-[10px] text-[#6b7a6b] mt-0.5">{s.desc}</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle(s.key)}
              disabled={saving === s.key}
              className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                prefs[s.key] ? 'bg-[#4A7C59]' : 'bg-[#e2e5da]'
              }`}
              role="switch"
              aria-checked={prefs[s.key]}
              aria-label={`Toggle ${s.label}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  prefs[s.key] ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
