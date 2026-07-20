'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { PlantSVG } from '@/components/plants/PlantSVG';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Animated hero plant */}
      <motion.div
        className="w-40 h-40 mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PlantSVG stage="flowering" healthScore={90} />
        </motion.div>
      </motion.div>

      {/* Tagline */}
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-center mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        Your habits, alive.
      </motion.h1>

      <motion.p
        className="text-[#8b95a8] text-center max-w-md mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        We track calories, steps, and screen time — but rarely our own growth.
        GrowthGarden makes the small things you do every day visible, honest,
        and quietly beautiful.
      </motion.p>

      {/* CTAs */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      >
        <Link
          href="/signup"
          className="flex-1 text-center px-6 py-3 rounded-lg bg-[#4a8a50] text-white font-medium hover:bg-[#5a9a60] transition-colors"
        >
          Start growing
        </Link>
        <Link
          href="/login"
          className="flex-1 text-center px-6 py-3 rounded-lg border border-[#252a38] text-[#e0e6f0] font-medium hover:border-[#4a8a50] transition-colors"
        >
          Sign in
        </Link>
      </motion.div>
    </div>
  );
}
