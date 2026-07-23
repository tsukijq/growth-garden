'use client';

import { motion } from 'framer-motion';

const gardenTips = [
  'Watering your plants with consistency...',
  'Checking on your seedlings...',
  'Watching for new sprouts...',
  'The garden is waking up...',
  'Your plants missed you...',
  'Measuring growth since yesterday...',
  'Sunlight is reaching your garden...',
];

export default function GardenLoading() {
  const tip = gardenTips[Math.floor(Math.random() * gardenTips.length)];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
      {/* Animated growing plant */}
      <div className="relative w-24 h-32 mb-6">
        {/* Soil */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <svg width="60" height="20" viewBox="0 0 60 20">
            <ellipse cx="30" cy="14" rx="28" ry="6" fill="#8B6F47" opacity="0.3" />
          </svg>
        </motion.div>

        {/* Stem growing up */}
        <motion.div
          className="absolute bottom-4 left-1/2 w-[3px] bg-[#4A7C59] rounded-full origin-bottom"
          style={{ translateX: '-50%' }}
          initial={{ height: 0 }}
          animate={{ height: [0, 40, 60, 70, 60, 70] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Left leaf */}
        <motion.div
          className="absolute bottom-[44px] left-[calc(50%-14px)]"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: [0, 1, 1, 0.9, 1], rotate: [-30, -25, -30, -28, -30] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
        >
          <svg width="16" height="10" viewBox="0 0 16 10">
            <ellipse cx="8" cy="5" rx="8" ry="4" fill="#4A7C59" opacity="0.7" />
          </svg>
        </motion.div>

        {/* Right leaf */}
        <motion.div
          className="absolute bottom-[54px] left-[calc(50%+2px)]"
          initial={{ scale: 0, rotate: 30 }}
          animate={{ scale: [0, 1, 1, 0.9, 1], rotate: [30, 25, 30, 28, 30] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
        >
          <svg width="14" height="9" viewBox="0 0 14 9">
            <ellipse cx="7" cy="4.5" rx="7" ry="3.5" fill="#4A7C59" opacity="0.6" />
          </svg>
        </motion.div>

        {/* Water drops falling */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute top-0 text-sm"
            style={{ left: `${35 + i * 15}%` }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: [0, 1, 1, 0], y: [-10, 0, 40, 70] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeIn',
            }}
          >
            💧
          </motion.div>
        ))}
      </div>

      {/* Loading text */}
      <motion.p
        className="text-sm text-[#6b7a6b] text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {tip}
      </motion.p>

      {/* Subtle progress dots */}
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
