'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentSeason } from '@/lib/utils/seasonal';

export function SeasonBanner() {
  const season = getCurrentSeason();
  const [dismissed, setDismissed] = useState(false);

  if (!season.active) return null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          className="w-full bg-[#ffffff] border border-[#e2e5da] rounded-lg px-4 py-3 mb-4 relative"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        >
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-3 text-[#6b7a6b] hover:text-[#1F2A1F] text-xs transition-colors"
            aria-label="Dismiss seasonal banner"
          >
            ✕
          </button>
          <p className="text-sm text-[#1F2A1F]">
            {season.emoji} <span className="font-medium">{season.name}</span>
          </p>
          <p className="text-xs text-[#6b7a6b] mt-1">{season.copy}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
