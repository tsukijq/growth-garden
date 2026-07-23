'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { saveReflection } from '@/lib/actions/habits';

interface ReflectionPromptProps {
  habitId: string;
  onDone: () => void;
}

export function ReflectionPrompt({ habitId, onDone }: ReflectionPromptProps) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!note.trim()) return;
    setSaving(true);
    await saveReflection(habitId, note.trim());
    setSaving(false);
    setSaved(true);
    setTimeout(() => onDone(), 1000);
  }

  return (
    <motion.div
      className="fixed inset-x-0 bottom-[60px] z-50 bg-[#ffffff] border-t border-[#e2e5da] px-4 pb-4 pt-5 rounded-t-2xl shadow-lg"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <p className="text-sm text-[#1F2A1F] font-medium mb-3">How did it feel today?</p>

      <label htmlFor="reflection-note" className="sr-only">Reflection note</label>
      <div className="flex gap-2">
        <input
          id="reflection-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          placeholder="One word or one sentence is enough"
          maxLength={200}
          autoFocus
          className="flex-1 px-4 py-3 bg-[#F7F8F2] border border-[#e2e5da] rounded-lg text-sm text-[#1F2A1F] focus:outline-none focus:border-[#4A7C59] transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={saving || !note.trim() || saved}
          className="px-4 py-3 bg-[#4A7C59] text-white text-sm rounded-lg hover:bg-[#3d6b4a] transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {saved ? '✓ Saved' : saving ? '...' : 'Save'}
        </button>
      </div>

      {saved && (
        <motion.p
          className="text-xs text-[#4A7C59] text-center mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Noted. Your plant remembers. 🌱
        </motion.p>
      )}

      {!saved && (
        <button
          onClick={onDone}
          className="w-full mt-3 py-2.5 border border-[#e2e5da] text-[#6b7a6b] text-sm rounded-lg hover:text-[#1F2A1F] hover:border-[#4A7C59] transition-colors"
        >
          Skip
        </button>
      )}
    </motion.div>
  );
}
