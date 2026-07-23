'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  { text: 'Preparing the soil...', emoji: '🌍' },
  { text: 'Planting seeds of intention...', emoji: '🌱' },
  { text: 'Adding a little water...', emoji: '💧' },
  { text: 'Waiting for the first sprout...', emoji: '🌿' },
  { text: 'Almost there...', emoji: '✨' },
];

export default function RootLoading() {
  const [stage, setStage] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 800),
      setTimeout(() => setStage(2), 1800),
      setTimeout(() => setStage(3), 3000),
      setTimeout(() => setStage(4), 4200),
      setTimeout(() => setReady(true), 5200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative" style={{ background: '#F7F8F2' }}>
      {/* Background ambient circles */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(74,124,89,0.06) 0%, transparent 70%)' }}
        animate={{ x: ['-10%', '10%', '-10%'], y: ['-5%', '5%', '-5%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(232,135,155,0.05) 0%, transparent 70%)', top: '20%', right: '10%' }}
        animate={{ x: ['5%', '-5%', '5%'], y: ['3%', '-3%', '3%'] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />

      {/* Main growing scene */}
      <div className="relative w-40 h-48 mb-8">
        {/* Sun glow */}
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Soil */}
        <motion.svg
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          width="120" height="30" viewBox="0 0 120 30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <ellipse cx="60" cy="20" rx="55" ry="10" fill="#8B6F47" opacity="0.3" />
          <ellipse cx="60" cy="18" rx="45" ry="7" fill="#8B6F47" opacity="0.2" />
        </motion.svg>

        {/* Stem — grows through stages */}
        <motion.div
          className="absolute bottom-6 left-1/2 w-[4px] rounded-full origin-bottom"
          style={{ background: 'linear-gradient(to top, #3d6b4a, #4A7C59)', translateX: '-50%' }}
          initial={{ height: 0 }}
          animate={{ height: stage >= 1 ? (stage >= 3 ? 90 : stage >= 2 ? 50 : 20) : 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* First leaf pair — stage 2 */}
        <AnimatePresence>
          {stage >= 2 && (
            <>
              <motion.svg
                className="absolute bottom-[40px] left-[calc(50%-22px)]"
                width="22" height="14" viewBox="0 0 22 14"
                initial={{ scale: 0, rotate: -40, opacity: 0 }}
                animate={{ scale: 1, rotate: -25, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <ellipse cx="11" cy="7" rx="11" ry="6" fill="#4A7C59" opacity="0.7" />
                <path d="M2,7 Q11,4 20,7" stroke="#3d6b4a" strokeWidth="0.5" fill="none" opacity="0.5" />
              </motion.svg>
              <motion.svg
                className="absolute bottom-[46px] left-[calc(50%+4px)]"
                width="20" height="12" viewBox="0 0 20 12"
                initial={{ scale: 0, rotate: 40, opacity: 0 }}
                animate={{ scale: 1, rotate: 25, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              >
                <ellipse cx="10" cy="6" rx="10" ry="5" fill="#4A7C59" opacity="0.6" />
                <path d="M2,6 Q10,3 18,6" stroke="#3d6b4a" strokeWidth="0.5" fill="none" opacity="0.5" />
              </motion.svg>
            </>
          )}
        </AnimatePresence>

        {/* Second leaf pair — stage 3 */}
        <AnimatePresence>
          {stage >= 3 && (
            <>
              <motion.svg
                className="absolute bottom-[68px] left-[calc(50%-20px)]"
                width="18" height="11" viewBox="0 0 18 11"
                initial={{ scale: 0, rotate: -35, opacity: 0 }}
                animate={{ scale: 1, rotate: -20, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <ellipse cx="9" cy="5.5" rx="9" ry="5" fill="#4A7C59" opacity="0.65" />
              </motion.svg>
              <motion.svg
                className="absolute bottom-[74px] left-[calc(50%+5px)]"
                width="16" height="10" viewBox="0 0 16 10"
                initial={{ scale: 0, rotate: 35, opacity: 0 }}
                animate={{ scale: 1, rotate: 20, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              >
                <ellipse cx="8" cy="5" rx="8" ry="4.5" fill="#4A7C59" opacity="0.55" />
              </motion.svg>
            </>
          )}
        </AnimatePresence>

        {/* Flower bud — stage 4 */}
        <AnimatePresence>
          {stage >= 4 && (
            <motion.div
              className="absolute bottom-[92px] left-1/2 -translate-x-1/2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <svg width="24" height="28" viewBox="0 0 24 28">
                {[0, 60, 120, 180, 240, 300].map((angle) => (
                  <ellipse key={angle} cx="12" cy="12" rx="4" ry="8" fill="#E8879B" opacity="0.8"
                    transform={`rotate(${angle}, 12, 14)`} />
                ))}
                <circle cx="12" cy="14" r="4" fill="#FFD700" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sparkle particles around the flower */}
        <AnimatePresence>
          {stage >= 4 && (
            <>
              {[[25, 30], [70, 25], [15, 50], [80, 45], [50, 15]].map(([x, y], i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full"
                  style={{ left: `${x}%`, top: `${y}%`, background: i % 2 === 0 ? '#FFD700' : '#E8879B' }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 + i * 0.3 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Water drops — stage 1 */}
        <AnimatePresence>
          {stage >= 1 && stage < 4 && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute text-xs"
                  style={{ left: `${30 + i * 18}%`, top: '10%' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.8, 0.8, 0], y: [0, 20, 50, 80] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                >
                  💧
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Cycling message */}
      <div className="h-12 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-lg">{messages[stage]?.emoji}</span>
            <p className="text-sm" style={{ color: '#6b7a6b' }}>{messages[stage]?.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1.5 rounded-full mt-6 overflow-hidden" style={{ background: '#e2e5da' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #4A7C59, #6ee7a0)' }}
          initial={{ width: '0%' }}
          animate={{ width: ready ? '100%' : `${(stage + 1) * 20}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Brand */}
      <motion.p
        className="text-xs mt-6 font-medium"
        style={{ color: '#8B6F47' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        GrowthGarden
      </motion.p>
    </div>
  );
}
