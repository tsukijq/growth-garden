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

  async function handleSave() {
    if (!note.trim()) return;
    setSaving(true);
    await saveReflection(habitId, note.trim());
    setSaving(false);
    onDone();
  }

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-50 bg-[#141820] border-t border-[#252a38] px-4 py-5 rounded-t-2xl shadow-lg"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <p className="text-sm text-[#e0e6f0] font-medium mb-3">How did it feel today?</p>

      <label htmlFor="reflection-note" className="sr-only">Reflection note</label>
      <input
        id="reflection-note"
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="One word or one sentence is enough"
        maxLength={200}
        autoFocus
        className="w-full px-4 py-3 bg-[#0d1117] border border-[#252a38] rounded-lg text-sm text-[#e0e6f0] focus:outline-none focus:border-[#4a8a50] transition-colors"
      />

      <div className="flex gap-3 mt-3">
        <button
          onClick={handleSave}
          disabled={saving || !note.trim()}
          className="flex-1 py-2.5 bg-[#4a8a50] text-white text-sm rounded-lg hover:bg-[#5a9a60] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save note'}
        </button>
        <button
          onClick={onDone}
          className="flex-1 py-2.5 border border-[#252a38] text-[#8b95a8] text-sm rounded-lg hover:text-[#e0e6f0] hover:border-[#4a8a50] transition-colors"
        >
          Skip
        </button>
      </div>
    </motion.div>
  );
}
