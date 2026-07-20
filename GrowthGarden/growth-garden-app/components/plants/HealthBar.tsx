'use client';

interface HealthBarProps {
  healthScore: number;
}

export function HealthBar({ healthScore }: HealthBarProps) {
  const color = healthScore >= 60 ? '#4a8a50' :
    healthScore >= 40 ? '#6ee7a0' :
    healthScore >= 20 ? '#e0a060' : '#c05030';

  return (
    <div className="w-full h-[3px] rounded-full bg-[#252a38] overflow-hidden">
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
