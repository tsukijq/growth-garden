'use client';

import { PlantStage, FlowerSpecies, RareVariant, MoodTier } from '@/types';
import { getPlantVisualState } from '@/lib/utils/plantStage';
import { SPECIES_COLORS, getMoodFilter } from '@/lib/utils/species';

interface SpeciesPlantSVGProps {
  stage: PlantStage;
  healthScore: number;
  species: FlowerSpecies;
  variant?: RareVariant;
  moodTier?: MoodTier;
}

export function SpeciesPlantSVG({ stage, healthScore, species, variant, moodTier }: SpeciesPlantSVGProps) {
  const visualState = getPlantVisualState(healthScore);
  const isDying = visualState === 'dying';
  const isWilting = visualState === 'wilting';

  const colors = SPECIES_COLORS[species];
  const stemColor = isDying ? '#6b4c3b' : isWilting ? '#7a6a40' : '#4a8a50';
  const leafColor = isDying ? '#5a4030' : isWilting ? '#8a7a40' : '#6ee7a0';

  // Use species petal color unless overridden by rare variant
  const petalColor = variant === 'black_moonflower' ? '#180a30' :
    variant === 'moonbell_orchid' ? '#9060e8' :
    variant === 'crystal_sprout' ? '#80d0f0' :
    isDying ? '#c05030' : isWilting ? '#e0a060' : colors.petal;
  const centerColor = variant === 'black_moonflower' ? '#7050c0' : colors.center;

  const droopAngle = isDying ? 20 : isWilting ? 10 : 0;
  const opacity = isDying ? 0.6 : isWilting ? 0.8 : 1;

  // Apply mood filter only to blooming/fruiting stages when healthy
  const isBloomStage = stage === 'flowering' || stage === 'fruiting';
  const moodFilter = (moodTier && isBloomStage && !isWilting && !isDying)
    ? getMoodFilter(moodTier) : undefined;

  const svgStyle: React.CSSProperties = { opacity, filter: moodFilter };

  // Early stages are the same for all species (seed/sprout/seedling/vegetative)
  if (stage === 'seed') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={svgStyle}>
        <ellipse cx="50" cy="82" rx="30" ry="10" fill="#3d2b1f" />
        <ellipse cx="50" cy="80" rx="25" ry="8" fill="#5c3a28" />
        <ellipse cx="50" cy="76" rx="6" ry="4" fill="#8b6914" />
        <path d="M50,74 Q51,72 50,70" stroke={leafColor} strokeWidth="0.8" fill="none" opacity="0.5" />
      </svg>
    );
  }

  if (stage === 'sprout') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={svgStyle}>
        <ellipse cx="50" cy="85" rx="28" ry="8" fill="#3d2b1f" />
        <path d={`M50,85 Q${50 + droopAngle * 0.2},75 50,68`} stroke={stemColor} strokeWidth="2.5" fill="none" />
        <ellipse cx="44" cy="67" rx="7" ry="3.5" fill={leafColor} transform={`rotate(${-20 - droopAngle}, 44, 67)`} />
        <ellipse cx="56" cy="67" rx="7" ry="3.5" fill={leafColor} transform={`rotate(${20 + droopAngle}, 56, 67)`} />
      </svg>
    );
  }

  if (stage === 'seedling' || stage === 'vegetative') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={svgStyle}>
        <ellipse cx="50" cy="90" rx="26" ry="6" fill="#3d2b1f" />
        <path d={`M50,90 Q${48 + droopAngle * 0.15},60 50,32`} stroke={stemColor} strokeWidth="3.2" fill="none" />
        <ellipse cx="36" cy="78" rx="10" ry="4" fill={leafColor} transform={`rotate(${-35 - droopAngle}, 36, 78)`} />
        <ellipse cx="64" cy="74" rx="10" ry="4" fill={leafColor} transform={`rotate(${30 + droopAngle}, 64, 74)`} />
        <ellipse cx="38" cy="60" rx="10" ry="4.5" fill={leafColor} transform={`rotate(${-30 - droopAngle}, 38, 60)`} />
        <ellipse cx="62" cy="56" rx="10" ry="4.5" fill={leafColor} transform={`rotate(${25 + droopAngle}, 62, 56)`} />
        <ellipse cx="40" cy="42" rx="9" ry="4" fill={leafColor} transform={`rotate(${-25 - droopAngle}, 40, 42)`} />
        <ellipse cx="60" cy="38" rx="9" ry="4" fill={leafColor} transform={`rotate(${20 + droopAngle}, 60, 38)`} />
        <ellipse cx="50" cy="30" rx="4" ry="6" fill={leafColor} opacity="0.7" />
      </svg>
    );
  }

  if (stage === 'budding') {
    // Generic bud — species stays hidden until flowering
    const genericBudColor = isDying ? '#c05030' : isWilting ? '#e0a060' : '#a8d8a0';
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={svgStyle}>
        <ellipse cx="50" cy="90" rx="26" ry="6" fill="#3d2b1f" />
        <path d="M50,90 Q48,58 50,28" stroke={stemColor} strokeWidth="3.5" fill="none" />
        <ellipse cx="36" cy="76" rx="11" ry="4.5" fill={leafColor} transform="rotate(-35, 36, 76)" />
        <ellipse cx="64" cy="72" rx="11" ry="4.5" fill={leafColor} transform="rotate(30, 64, 72)" />
        <ellipse cx="38" cy="56" rx="10" ry="4" fill={leafColor} transform="rotate(-30, 38, 56)" />
        <ellipse cx="62" cy="52" rx="10" ry="4" fill={leafColor} transform="rotate(25, 62, 52)" />
        {/* Generic teardrop bud — no species color */}
        <ellipse cx="50" cy="22" rx="5" ry="9" fill={genericBudColor} opacity="0.7" />
        <path d="M45,28 Q50,18 50,22" stroke={stemColor} strokeWidth="1.5" fill="none" />
        <path d="M55,28 Q50,18 50,22" stroke={stemColor} strokeWidth="1.5" fill="none" />
      </svg>
    );
  }

  // Species-specific flowering shapes
  if (stage === 'flowering') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={svgStyle}>
        <ellipse cx="50" cy="92" rx="24" ry="5" fill="#3d2b1f" />
        <path d="M50,92 Q48,58 50,28" stroke={stemColor} strokeWidth="3.5" fill="none" />
        <ellipse cx="36" cy="78" rx="11" ry="4.5" fill={leafColor} transform="rotate(-38, 36, 78)" />
        <ellipse cx="64" cy="74" rx="11" ry="4.5" fill={leafColor} transform="rotate(33, 64, 74)" />
        <ellipse cx="38" cy="58" rx="10" ry="4" fill={leafColor} transform="rotate(-30, 38, 58)" />
        <ellipse cx="62" cy="54" rx="10" ry="4" fill={leafColor} transform="rotate(25, 62, 54)" />
        {/* Species-specific flower head */}
        {renderFlowerHead(species, petalColor, centerColor)}
      </svg>
    );
  }

  // Fruiting — same as flowering but with fruit
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={svgStyle}>
      <ellipse cx="50" cy="92" rx="24" ry="5" fill="#3d2b1f" />
      <path d="M50,92 Q48,56 50,24" stroke={stemColor} strokeWidth="4" fill="none" />
      <ellipse cx="34" cy="76" rx="12" ry="5" fill={leafColor} transform="rotate(-40, 34, 76)" />
      <ellipse cx="66" cy="72" rx="12" ry="5" fill={leafColor} transform="rotate(35, 66, 72)" />
      <ellipse cx="36" cy="56" rx="11" ry="4.5" fill={leafColor} transform="rotate(-32, 36, 56)" />
      <ellipse cx="64" cy="52" rx="11" ry="4.5" fill={leafColor} transform="rotate(28, 64, 52)" />
      {renderFlowerHead(species, petalColor, centerColor)}
      {/* Fruits */}
      <circle cx="38" cy="48" r="4" fill={colors.accent} />
      <circle cx="62" cy="44" r="4" fill={colors.accent} />
      {variant && [
        [32, 42], [68, 38], [44, 14], [56, 10],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="#c0a0ff" opacity={0.3 + (i % 3) * 0.2} />
      ))}
    </svg>
  );
}

function renderFlowerHead(species: FlowerSpecies, petalColor: string, centerColor: string) {
  switch (species) {
    case 'sunflower':
      // Large round petals radiating out
      return (
        <g>
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse key={i} cx="50" cy="16" rx="4" ry="9" fill={petalColor}
              transform={`rotate(${i * 30}, 50, 22)`} />
          ))}
          <circle cx="50" cy="22" r="6" fill={centerColor} />
        </g>
      );
    case 'lotus':
      // Layered round petals, wider and softer
      return (
        <g>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <ellipse key={angle} cx="50" cy="17" rx="5" ry="8" fill={petalColor} opacity="0.85"
              transform={`rotate(${angle}, 50, 22)`} />
          ))}
          <circle cx="50" cy="22" r="4" fill={centerColor} />
        </g>
      );
    case 'iris':
      // Tall narrow petals, 3 up + 3 down
      return (
        <g>
          {[0, 120, 240].map((angle) => (
            <ellipse key={`up-${angle}`} cx="50" cy="14" rx="4" ry="11" fill={petalColor}
              transform={`rotate(${angle}, 50, 22)`} />
          ))}
          {[60, 180, 300].map((angle) => (
            <ellipse key={`down-${angle}`} cx="50" cy="18" rx="5" ry="7" fill={petalColor} opacity="0.7"
              transform={`rotate(${angle}, 50, 22)`} />
          ))}
          <circle cx="50" cy="22" r="3" fill={centerColor} />
        </g>
      );
    case 'tulip':
      // Cup-shaped, overlapping petals
      return (
        <g>
          <ellipse cx="44" cy="18" rx="6" ry="10" fill={petalColor} />
          <ellipse cx="56" cy="18" rx="6" ry="10" fill={petalColor} />
          <ellipse cx="50" cy="16" rx="5" ry="11" fill={petalColor} opacity="0.9" />
        </g>
      );
    case 'carnation':
      // Ruffled dense petals
      return (
        <g>
          {Array.from({ length: 10 }).map((_, i) => (
            <ellipse key={i} cx="50" cy="18" rx={3 + (i % 3)} ry={5 + (i % 2) * 2} fill={petalColor}
              opacity={0.7 + (i % 3) * 0.1}
              transform={`rotate(${i * 36}, 50, 22)`} />
          ))}
          <circle cx="50" cy="22" r="3" fill={centerColor} />
        </g>
      );
    case 'rose':
      // Spiral layered petals
      return (
        <g>
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <ellipse key={angle} cx="50" cy="17" rx={4 + i * 0.5} ry={8 - i * 0.5} fill={petalColor}
              opacity={0.9 - i * 0.05}
              transform={`rotate(${angle}, 50, 22)`} />
          ))}
          <circle cx="50" cy="22" r="3.5" fill={centerColor} />
        </g>
      );
    case 'peony':
      // Full, round, many-petaled
      return (
        <g>
          {Array.from({ length: 8 }).map((_, i) => (
            <ellipse key={i} cx="50" cy="17" rx="6" ry="9" fill={petalColor}
              opacity={0.75 + (i % 2) * 0.15}
              transform={`rotate(${i * 45}, 50, 22)`} />
          ))}
          <circle cx="50" cy="22" r="4" fill={centerColor} />
        </g>
      );
    case 'daisy':
    default:
      // Classic 6-petal daisy
      return (
        <g>
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <ellipse key={angle} cx="50" cy="18" rx="5" ry="9" fill={petalColor}
              transform={`rotate(${angle}, 50, 23)`} />
          ))}
          <circle cx="50" cy="23" r="5" fill={centerColor} />
        </g>
      );
  }
}
