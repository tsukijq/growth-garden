'use client';

import { motion } from 'framer-motion';

export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[50vh]">
      <motion.div
        className="w-16 h-16 rounded-full bg-[#f0f5f1] border-2 border-[#e2e5da] flex items-center justify-center text-2xl mb-4"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        🌻
      </motion.div>
      <motion.p
        className="text-sm text-[#6b7a6b]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Gathering your garden stats...
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
