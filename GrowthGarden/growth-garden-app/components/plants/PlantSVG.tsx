'use client';

import { PlantStage, RareVariant } from '@/types';
import { getPlantVisualState } from '@/lib/utils/plantStage';

interface PlantSVGProps {
  stage: PlantStage;
  healthScore: number;
  variant?: RareVariant;
}

export function PlantSVG({ stage, healthScore, variant }: PlantSVGProps) {
  const visualState = getPlantVisualState(healthScore);
  const isDying = visualState === 'dying';
  const isWilting = visualState === 'wilting';

  const stemColor = isDying ? '#6b4c3b' : isWilting ? '#7a6a40' : '#4A7C59';
  const leafColor = isDying ? '#5a4030' : isWilting ? '#8a7a40' : '#4A7C59';
  const petalColor = variant === 'black_moonflower' ? '#180a30' :
    variant === 'moonbell_orchid' ? '#7c4dbd' :
    variant === 'crystal_sprout' ? '#80d0f0' :
    isDying ? '#c44030' : isWilting ? '#b08040' : '#e890c0';
  const centerColor = variant === 'black_moonflower' ? '#7050c0' : '#ffe080';
  const fruitColor = variant === 'black_moonflower' ? '#2a1050' :
    variant === 'moonbell_orchid' ? '#b080ff' : '#f0a040';

  const droopAngle = isDying ? 20 : isWilting ? 10 : 0;
  const opacity = isDying ? 0.6 : isWilting ? 0.8 : 1;

  // Stage 1: Seed — small mound with a seed visible in soil
  if (stage === 'seed') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ opacity }}>
        <ellipse cx="50" cy="82" rx="30" ry="10" fill="#3d2b1f" />
        <ellipse cx="50" cy="80" rx="25" ry="8" fill="#5c3a28" />
        {/* Seed buried in soil */}
        <ellipse cx="50" cy="76" rx="6" ry="4" fill="#8b6914" />
        {/* Tiny crack showing life */}
        <path d="M50,74 Q51,72 50,70" stroke="#4A7C59" strokeWidth="0.8" fill="none" opacity="0.5" />
        {isDying && <ellipse cx="50" cy="76" rx="6" ry="4" fill="#c44030" opacity="0.3" />}
      </svg>
    );
  }

  // Stage 2: Sprout (Germination) — first shoot breaking through soil
  if (stage === 'sprout') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ opacity }}>
        <ellipse cx="50" cy="85" rx="28" ry="8" fill="#3d2b1f" />
        {/* Short curved stem just emerging */}
        <path
          d={`M50,85 Q${50 + droopAngle * 0.2},75 50,68`}
          stroke={stemColor}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Two cotyledon leaves (seed leaves) */}
        <ellipse cx="44" cy="67" rx="7" ry="3.5" fill={leafColor}
          transform={`rotate(${-20 - droopAngle}, 44, 67)`} />
        <ellipse cx="56" cy="67" rx="7" ry="3.5" fill={leafColor}
          transform={`rotate(${20 + droopAngle}, 56, 67)`} />
      </svg>
    );
  }

  // Stage 3: Seedling — short stem with first true leaves
  if (stage === 'seedling') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ opacity }}>
        <ellipse cx="50" cy="87" rx="26" ry="7" fill="#3d2b1f" />
        {/* Slightly taller stem */}
        <path
          d={`M50,87 Q${50 + droopAngle * 0.2},68 50,52`}
          stroke={stemColor}
          strokeWidth="2.8"
          fill="none"
        />
        {/* True leaves — slightly larger and more defined */}
        <ellipse cx="40" cy="68" rx="9" ry="4" fill={leafColor}
          transform={`rotate(${-30 - droopAngle}, 40, 68)`} />
        <ellipse cx="60" cy="64" rx="9" ry="4" fill={leafColor}
          transform={`rotate(${25 + droopAngle}, 60, 64)`} />
        {/* Top pair of smaller new leaves */}
        <ellipse cx="44" cy="55" rx="6" ry="3" fill={leafColor}
          transform={`rotate(${-20 - droopAngle}, 44, 55)`} opacity="0.85" />
        <ellipse cx="56" cy="53" rx="6" ry="3" fill={leafColor}
          transform={`rotate(${15 + droopAngle}, 56, 53)`} opacity="0.85" />
      </svg>
    );
  }

  // Stage 4: Vegetative — rapid growth, tall stem, multiple leaf pairs
  if (stage === 'vegetative') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ opacity }}>
        <ellipse cx="50" cy="90" rx="26" ry="6" fill="#3d2b1f" />
        {/* Tall main stem */}
        <path
          d={`M50,90 Q${48 + droopAngle * 0.15},60 50,32`}
          stroke={stemColor}
          strokeWidth="3.2"
          fill="none"
        />
        {/* Multiple leaf pairs along the stem */}
        <ellipse cx="36" cy="78" rx="10" ry="4" fill={leafColor}
          transform={`rotate(${-35 - droopAngle}, 36, 78)`} />
        <ellipse cx="64" cy="74" rx="10" ry="4" fill={leafColor}
          transform={`rotate(${30 + droopAngle}, 64, 74)`} />
        <ellipse cx="38" cy="60" rx="10" ry="4.5" fill={leafColor}
          transform={`rotate(${-30 - droopAngle}, 38, 60)`} />
        <ellipse cx="62" cy="56" rx="10" ry="4.5" fill={leafColor}
          transform={`rotate(${25 + droopAngle}, 62, 56)`} />
        <ellipse cx="40" cy="42" rx="9" ry="4" fill={leafColor}
          transform={`rotate(${-25 - droopAngle}, 40, 42)`} />
        <ellipse cx="60" cy="38" rx="9" ry="4" fill={leafColor}
          transform={`rotate(${20 + droopAngle}, 60, 38)`} />
        {/* Growing tip */}
        <ellipse cx="50" cy="30" rx="4" ry="6" fill={leafColor} opacity="0.7" />
      </svg>
    );
  }

  // Stage 5: Budding — flower buds forming at the top
  if (stage === 'budding') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ opacity }}>
        <ellipse cx="50" cy="90" rx="26" ry="6" fill="#3d2b1f" />
        {/* Strong stem */}
        <path
          d={`M50,90 Q48,58 50,28`}
          stroke={stemColor}
          strokeWidth="3.5"
          fill="none"
        />
        {/* Leaves along stem */}
        <ellipse cx="36" cy="76" rx="11" ry="4.5" fill={leafColor}
          transform={`rotate(-35, 36, 76)`} />
        <ellipse cx="64" cy="72" rx="11" ry="4.5" fill={leafColor}
          transform={`rotate(30, 64, 72)`} />
        <ellipse cx="38" cy="56" rx="10" ry="4" fill={leafColor}
          transform={`rotate(-30, 38, 56)`} />
        <ellipse cx="62" cy="52" rx="10" ry="4" fill={leafColor}
          transform={`rotate(25, 62, 52)`} />
        <ellipse cx="40" cy="40" rx="9" ry="3.5" fill={leafColor}
          transform={`rotate(-25, 40, 40)`} />
        <ellipse cx="60" cy="36" rx="9" ry="3.5" fill={leafColor}
          transform={`rotate(20, 60, 36)`} />
        {/* Closed flower bud — teardrop shape */}
        <ellipse cx="50" cy="22" rx="5" ry="9" fill={petalColor} opacity="0.7" />
        {/* Sepals (green protective leaves around bud) */}
        <path d="M45,28 Q50,18 50,22" stroke={stemColor} strokeWidth="1.5" fill="none" />
        <path d="M55,28 Q50,18 50,22" stroke={stemColor} strokeWidth="1.5" fill="none" />
      </svg>
    );
  }

  // Stage 6: Flowering — full bloom, open petals
  if (stage === 'flowering') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ opacity }}>
        <ellipse cx="50" cy="92" rx="24" ry="5" fill="#3d2b1f" />
        {/* Strong stem */}
        <path d="M50,92 Q48,58 50,28" stroke={stemColor} strokeWidth="3.5" fill="none" />
        {/* Leaves */}
        <ellipse cx="36" cy="78" rx="11" ry="4.5" fill={leafColor} transform="rotate(-38, 36, 78)" />
        <ellipse cx="64" cy="74" rx="11" ry="4.5" fill={leafColor} transform="rotate(33, 64, 74)" />
        <ellipse cx="38" cy="58" rx="10" ry="4" fill={leafColor} transform="rotate(-30, 38, 58)" />
        <ellipse cx="62" cy="54" rx="10" ry="4" fill={leafColor} transform="rotate(25, 62, 54)" />
        <ellipse cx="42" cy="42" rx="9" ry="3.5" fill={leafColor} transform="rotate(-22, 42, 42)" />
        <ellipse cx="58" cy="38" rx="9" ry="3.5" fill={leafColor} transform="rotate(18, 58, 38)" />
        {/* Open flower — 6 petals */}
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <ellipse
            key={angle}
            cx="50"
            cy="18"
            rx="6"
            ry="10"
            fill={petalColor}
            transform={`rotate(${angle}, 50, 23)`}
          />
        ))}
        {/* Flower center */}
        <circle cx="50" cy="23" r="5" fill={centerColor} />
      </svg>
    );
  }

  // Stage 7: Fruiting — bearing fruit, the legendary achievement
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ opacity }}>
      <ellipse cx="50" cy="92" rx="24" ry="5" fill="#3d2b1f" />
      {/* Thick mature stem */}
      <path d="M50,92 Q48,56 50,24" stroke={stemColor} strokeWidth="4" fill="none" />
      {/* Mature leaves */}
      <ellipse cx="34" cy="76" rx="12" ry="5" fill={leafColor} transform="rotate(-40, 34, 76)" />
      <ellipse cx="66" cy="72" rx="12" ry="5" fill={leafColor} transform="rotate(35, 66, 72)" />
      <ellipse cx="36" cy="56" rx="11" ry="4.5" fill={leafColor} transform="rotate(-32, 36, 56)" />
      <ellipse cx="64" cy="52" rx="11" ry="4.5" fill={leafColor} transform="rotate(28, 64, 52)" />
      <ellipse cx="40" cy="40" rx="10" ry="4" fill={leafColor} transform="rotate(-25, 40, 40)" />
      <ellipse cx="60" cy="36" rx="10" ry="4" fill={leafColor} transform="rotate(20, 60, 36)" />
      {/* Flower still present but fading */}
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="50"
          cy="16"
          rx="5"
          ry="8"
          fill={petalColor}
          opacity="0.5"
          transform={`rotate(${angle}, 50, 20)`}
        />
      ))}
      {/* Fruits hanging from stem */}
      <circle cx="38" cy="48" r="4" fill={fruitColor} />
      <circle cx="62" cy="44" r="4" fill={fruitColor} />
      <circle cx="50" cy="20" r="5" fill={fruitColor} />
      {/* Sparkle dots for rare variants */}
      {variant && [
        [32, 42], [68, 38], [44, 14], [56, 10], [28, 60], [72, 56],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="1"
          fill="#9060e8"
          opacity={0.3 + (i % 3) * 0.2}
        />
      ))}
    </svg>
  );
}
