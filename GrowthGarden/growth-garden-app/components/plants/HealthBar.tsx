'use client';

interface HealthBarProps {
  healthScore: number;
}

export function HealthBar({ healthScore }: HealthBarProps) {
  const color = healthScore >= 60 ? '#4A7C59' :
    healthScore >= 40 ? '#4A7C59' :
    healthScore >= 20 ? '#b08040' : '#c44030';

  return (
    <div className="w-full h-[3px] rounded-full bg-[#e2e5da] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${healthScore}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
