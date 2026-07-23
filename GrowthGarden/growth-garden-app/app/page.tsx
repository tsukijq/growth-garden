'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { PlantSVG } from '@/components/plants/PlantSVG';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const growthStages: { stage: 'seed' | 'sprout' | 'budding' | 'flowering' | 'fruiting'; label: string; health: number; tagline: string }[] = [
  { stage: 'seed', label: 'Seed', health: 60, tagline: 'Day 1' },
  { stage: 'sprout', label: 'Sprout', health: 70, tagline: 'Day 3' },
  { stage: 'budding', label: 'Budding', health: 80, tagline: 'Day 14' },
  { stage: 'flowering', label: 'Blooming', health: 90, tagline: 'Day 21' },
  { stage: 'fruiting', label: 'Rare', health: 100, tagline: 'Day 100' },
];

const samplePlants = [
  { name: 'Morning Pages', stage: 'flowering' as const, health: 88, streak: 24, intention: 'Clarity before chaos' },
  { name: 'Meditation', stage: 'budding' as const, health: 72, streak: 12, intention: 'Find stillness' },
  { name: 'Exercise', stage: 'sprout' as const, health: 65, streak: 4, intention: 'Feel strong again' },
];

const botanicalPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cpath d='M30 140 Q50 100 30 60 Q55 85 70 60 Q55 100 65 140Z' fill='none' stroke='%234A7C59' stroke-width='0.6' opacity='0.4'/%3E%3Cpath d='M140 170 Q160 140 150 100 Q170 125 185 110 Q170 145 175 175Z' fill='none' stroke='%234A7C59' stroke-width='0.6' opacity='0.35'/%3E%3Cpath d='M100 50 Q108 30 100 10 Q115 28 125 15 Q115 38 120 55Z' fill='none' stroke='%234A7C59' stroke-width='0.5' opacity='0.3'/%3E%3Ccircle cx='80' cy='120' r='1.5' fill='%234A7C59' opacity='0.2'/%3E%3Ccircle cx='160' cy='60' r='1' fill='%23E8879B' opacity='0.25'/%3E%3Ccircle cx='40' cy='180' r='1.2' fill='%238B6F47' opacity='0.2'/%3E%3Cpath d='M170 30 Q175 22 172 15' fill='none' stroke='%23E8879B' stroke-width='0.4' opacity='0.3'/%3E%3C/svg%3E")`;

export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ color: '#1F2A1F' }}>
      {/* Layered background */}
      <div className="fixed inset-0 -z-30" style={{ background: '#F7F8F2' }} />
      <div
        className="fixed inset-0 -z-20"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(232,240,234,0.8) 0%, transparent 60%),
            radial-gradient(ellipse 70% 50% at 80% 85%, rgba(251,238,240,0.7) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 60% 40%, rgba(232,135,155,0.06) 0%, transparent 50%)
          `,
        }}
      />

      {/* Slow-moving ambient orbs */}
      <motion.div
        className="fixed inset-0 -z-15 pointer-events-none"
        style={{ zIndex: -15 }}
        animate={prefersReducedMotion ? {} : { rotate: [0, 360] }}
        transition={prefersReducedMotion ? {} : { duration: 120, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(74,124,89,0.04) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[5%] right-[10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,135,155,0.05) 0%, transparent 70%)' }} />
      </motion.div>

      {/* Botanical texture */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ backgroundImage: botanicalPattern, backgroundRepeat: 'repeat', backgroundSize: '200px 200px', opacity: 0.06 }}
      />

      {/* ===== HERO ===== */}
      <section className="relative flex flex-col items-center px-6 pt-24 pb-8">
        {/* Glow ring behind hero plant */}
        <div className="absolute top-16 w-44 h-44 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(74,124,89,0.1) 0%, transparent 70%)' }} />

        <motion.div
          className="w-36 h-36 mb-5 relative"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: 'drop-shadow(0 16px 32px rgba(74,124,89,0.25)) drop-shadow(0 6px 12px rgba(74,124,89,0.15))' }}
        >
          <motion.div
            animate={prefersReducedMotion ? {} : { scale: [1, 1.04, 1], rotate: [0, 1, -1, 0] }}
            transition={prefersReducedMotion ? {} : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <PlantSVG stage="flowering" healthScore={95} />
          </motion.div>
        </motion.div>

        <motion.h1
          className="text-4xl md:text-5xl font-bold text-center max-w-2xl leading-[1.15] tracking-tight"
          style={{ color: '#1F2A1F' }}
          custom={0.2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          GrowthGarden turns your habits into a living garden
        </motion.h1>

        <motion.p
          className="text-center max-w-md mt-5 text-lg"
          style={{ color: '#5a6a5a' }}
          custom={0.4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          No streaks on a spreadsheet. No badges you forget about.
          Just something alive that responds to your care.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 mt-10 w-full max-w-sm"
          custom={0.6}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <Link
            href="/signup"
            className="flex-1 text-center px-7 py-3.5 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #4A7C59 0%, #3d6b4a 100%)', boxShadow: '0 6px 20px rgba(74,124,89,0.35), 0 2px 6px rgba(74,124,89,0.2)' }}
          >
            Start growing
          </Link>
          <Link
            href="/login"
            className="flex-1 text-center px-7 py-3.5 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ border: '2px solid #4A7C59', color: '#4A7C59', background: 'rgba(74,124,89,0.04)' }}
          >
            Sign in
          </Link>
        </motion.div>
      </section>

      {/* ===== GROWTH STAGES ===== */}
      <section className="px-6 pt-8 pb-4">
        <div className="max-w-2xl mx-auto">
          <motion.p
            className="text-center text-sm font-medium tracking-wide uppercase mb-6"
            style={{ color: '#8B6F47', letterSpacing: '0.12em' }}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            Every habit grows through stages
          </motion.p>

          {/* Stage timeline */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-[10%] right-[10%] h-[2px] -translate-y-1/2 rounded-full"
              style={{ background: 'linear-gradient(90deg, #e2e5da 0%, #4A7C59 50%, #E8879B 100%)', opacity: 0.4 }} />

            <div className="relative flex items-center justify-between">
              {growthStages.map((item, i) => (
                <motion.div
                  key={item.stage}
                  className="flex flex-col items-center"
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.85 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={prefersReducedMotion ? {} : { delay: i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center p-2"
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(74,124,89,0.15)',
                      boxShadow: '0 4px 16px rgba(74,124,89,0.1), 0 1px 3px rgba(0,0,0,0.04)',
                      filter: 'drop-shadow(0 4px 8px rgba(74,124,89,0.08))',
                    }}
                  >
                    <PlantSVG stage={item.stage} healthScore={item.health} />
                  </div>
                  <p className="text-xs font-semibold mt-2" style={{ color: '#4A7C59' }}>{item.label}</p>
                  <p className="text-[10px]" style={{ color: '#8B6F47' }}>{item.tagline}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== GARDEN PREVIEW ===== */}
      <section className="px-6 py-8 relative">
        {/* Visible colored background panel that creates the "frosted" look */}
        <div className="absolute inset-x-6 top-[30%] bottom-[10%] mx-auto max-w-2xl rounded-[2rem] pointer-events-none"
          style={{
            background: 'linear-gradient(160deg, rgba(232,135,155,0.12) 0%, rgba(232,240,234,0.2) 40%, rgba(74,124,89,0.08) 100%)',
            filter: 'blur(2px)',
          }} />

        <div className="max-w-2xl mx-auto relative">
          <motion.p
            className="text-center text-sm font-medium tracking-wide uppercase mb-2"
            style={{ color: '#8B6F47', letterSpacing: '0.12em' }}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            Your garden at a glance
          </motion.p>
          <motion.p
            className="text-sm text-center mb-8"
            style={{ color: '#5a6a5a' }}
            custom={0.1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            Each habit becomes a plant. You&apos;ll see how they&apos;re doing every day.
          </motion.p>

          {/* Faux glassmorphism container — uses layered backgrounds instead of backdrop-filter */}
          <motion.div
            className="rounded-3xl p-8 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.85) 0%, rgba(248,250,245,0.75) 50%, rgba(255,255,255,0.8) 100%)',
              border: '1.5px solid rgba(255, 255, 255, 0.9)',
              boxShadow: `
                0 20px 60px rgba(74,124,89,0.12),
                0 8px 24px rgba(0,0,0,0.06),
                inset 0 1px 0 rgba(255,255,255,1),
                inset 0 -1px 0 rgba(74,124,89,0.05)
              `,
            }}
            custom={0.15}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            {/* Top edge light refraction */}
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl"
              style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,1) 30%, rgba(232,135,155,0.15) 50%, rgba(255,255,255,1) 70%, transparent 90%)' }} />
            {/* Inner soft glow */}
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(232,135,155,0.08) 0%, transparent 70%)' }} />
            <div className="absolute bottom-4 left-4 w-28 h-28 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(74,124,89,0.06) 0%, transparent 70%)' }} />

            <div className="grid grid-cols-3 gap-4 relative">
              {samplePlants.map((plant, i) => (
                <motion.div
                  key={plant.name}
                  className="rounded-2xl p-4 flex flex-col items-center gap-2 relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(247,248,242,0.9) 100%)',
                    border: '1px solid rgba(226,229,218,0.9)',
                    boxShadow: '0 4px 12px rgba(74,124,89,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                  }}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={prefersReducedMotion ? {} : { delay: 0.3 + i * 0.1, duration: 0.5 }}
                >
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: '#4A7C59', color: '#fff', boxShadow: '0 2px 6px rgba(74,124,89,0.3)' }}>
                    🔥 {plant.streak}
                  </span>
                  <div className="w-20 h-20 my-1"
                    style={{ filter: 'drop-shadow(0 4px 8px rgba(74,124,89,0.12))' }}>
                    <PlantSVG stage={plant.stage} healthScore={plant.health} />
                  </div>
                  <p className="text-xs font-semibold text-center" style={{ color: '#1F2A1F' }}>{plant.name}</p>
                  <p className="text-[10px] italic text-center" style={{ color: '#8B6F47' }}>&ldquo;{plant.intention}&rdquo;</p>
                  {/* Health bar */}
                  <div className="w-full h-2 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(226,229,218,0.6)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #4A7C59, #4A7C59)' }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${plant.health}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.15, duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== WHY DIFFERENT ===== */}
      <section className="px-6 py-10 relative">
        <div className="max-w-lg mx-auto text-center relative">
          {/* Decorative quote mark */}
          <motion.span
            className="block text-6xl leading-none mb-2 select-none"
            style={{ color: '#E8879B', opacity: 0.3 }}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            &ldquo;
          </motion.span>
          <motion.h2
            className="text-xl md:text-2xl font-bold mb-4"
            style={{ color: '#1F2A1F' }}
            custom={0.05}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            Habits form unconsciously. This one doesn&apos;t.
          </motion.h2>
          <motion.p
            className="text-base leading-relaxed"
            style={{ color: '#5a6a5a' }}
            custom={0.15}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            Most habit trackers reward repetition for its own sake. GrowthGarden asks you
            to name <span className="font-semibold" style={{ color: '#4A7C59' }}>why</span> a habit matters
            before you start — so building it stays intentional instead of automatic.
            Your intention gently reminds you when motivation fades.
          </motion.p>
          {/* Soil divider */}
          <div className="mx-auto mt-8 w-16 h-[3px] rounded-full" style={{ background: '#8B6F47', opacity: 0.4 }} />
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <motion.p
            className="text-center text-sm font-medium tracking-wide uppercase mb-8"
            style={{ color: '#8B6F47', letterSpacing: '0.12em' }}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            How it works
          </motion.p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '🌱', label: 'Plant', desc: 'Name a habit and say why it matters.', accent: '#4A7C59' },
              { icon: '💧', label: 'Water', desc: 'Complete it daily — one tap.', accent: '#5b9ecf' },
              { icon: '🌿', label: 'Grow', desc: 'Seed → sprout → bud → bloom.', accent: '#4A7C59' },
              { icon: '🍂', label: 'Wilt', desc: 'Miss a day? It shows. No shame.', accent: '#8B6F47' },
            ].map((step, i) => (
              <motion.div
                key={step.label}
                className="p-5 rounded-2xl text-center"
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(226,229,218,0.8)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                }}
                custom={i * 0.08}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <span className="text-3xl block">{step.icon}</span>
                <p className="text-sm font-bold mt-3" style={{ color: step.accent }}>{step.label}</p>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#5a6a5a' }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SOCIAL ===== */}
      <section className="px-6 py-10 text-center relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(232,135,155,0.04) 0%, transparent 60%)' }} />
        <motion.div
          className="relative"
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <span className="text-4xl block mb-3">🏡</span>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#1F2A1F' }}>
            Your garden is yours to share
          </h2>
          <p className="text-base leading-relaxed max-w-md mx-auto" style={{ color: '#5a6a5a' }}>
            Friends can visit your garden and see how your plants are doing.
            No leaderboards, no competition — just a quiet way to grow alongside people you care about.
          </p>
        </motion.div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="px-6 pt-8 pb-16 text-center relative">
        <motion.div
          className="relative max-w-md mx-auto rounded-3xl p-10"
          style={{
            background: 'linear-gradient(135deg, rgba(74,124,89,0.06) 0%, rgba(232,135,155,0.04) 100%)',
            border: '1px solid rgba(74,124,89,0.12)',
          }}
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#1F2A1F' }}>
            Ready to plant your first seed?
          </h2>
          <p className="text-sm mb-8" style={{ color: '#5a6a5a' }}>
            It takes 30 seconds. No credit card, no spam.
          </p>
          <Link
            href="/signup"
            className="inline-block px-10 py-4 rounded-xl text-white font-semibold transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #4A7C59 0%, #3d6b4a 100%)', boxShadow: '0 8px 24px rgba(74,124,89,0.35), 0 3px 8px rgba(74,124,89,0.2)' }}
          >
            Create your garden 🌱
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 text-center" style={{ borderTop: '1px solid rgba(226,229,218,0.6)' }}>
        <p className="text-xs" style={{ color: '#8B6F47' }}>GrowthGarden — grow something real.</p>
      </footer>
    </div>
  );
}
