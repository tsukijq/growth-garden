'use client';

import { motion } from 'framer-motion';

export default function SeedsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="flex gap-3 mb-4">
        {['🌱', '🌿', '🌸'].map((emoji, i) => (
          <motion.span
            key={i}
            className="text-2xl"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>
      <motion.p
        className="text-sm text-[#6b7a6b]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Opening the seed library...
      </motion.p>
      <div className="flex gap-1.5 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#4A7C59]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}
