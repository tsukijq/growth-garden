/**
 * Get the current seasonal event based on the month.
 */
export function getCurrentSeason(): { name: string; emoji: string; active: boolean; copy: string } {
  const month = new Date().getMonth(); // 0-indexed

  if (month >= 2 && month <= 4) {
    return {
      name: 'Cherry Blossom Festival',
      emoji: '🌸',
      active: true,
      copy: 'New season, new seeds. What do you want to grow this year?',
    };
  }
  if (month >= 5 && month <= 7) {
    return {
      name: 'Summer Solstice',
      emoji: '☀️',
      active: true,
      copy: 'Long days, steady habits. Keep tending.',
    };
  }
  if (month >= 8 && month <= 10) {
    return {
      name: 'Harvest Moon',
      emoji: '🌙',
      active: true,
      copy: 'Things slow down before they bloom again. That\u2019s okay.',
    };
  }
  if (month === 11) {
    return {
      name: 'Winter Garden',
      emoji: '❄️',
      active: true,
      copy: 'Rest is part of growing too. Even gardens go quiet in winter.',
    };
  }
  // January, February
  return {
    name: 'New Growth',
    emoji: '🌱',
    active: true,
    copy: 'Rest is part of growing too. Even gardens go quiet in winter.',
  };
}

/**
 * Seasonal seeds available for a limited time.
 */
export function getSeasonalSeeds(): { name: string; description: string; available: boolean; endsAt: Date }[] {
  const month = new Date().getMonth();
  const year = new Date().getFullYear();

  if (month >= 2 && month <= 4) {
    return [{
      name: 'Sakura Seed',
      description: 'A delicate cherry blossom that thrives in spring warmth.',
      available: true,
      endsAt: new Date(year, 4, 31),
    }];
  }
  if (month >= 5 && month <= 7) {
    return [{
      name: 'Sunfire Seed',
      description: 'A radiant bloom that opens only under the summer sun.',
      available: true,
      endsAt: new Date(year, 7, 31),
    }];
  }
  if (month >= 8 && month <= 10) {
    return [{
      name: 'Moonvine Seed',
      description: 'An autumn creeper that glows faintly under harvest moons.',
      available: true,
      endsAt: new Date(year, 10, 30),
    }];
  }
  return [{
    name: 'Frostbloom Seed',
    description: 'A hardy bloom that crystallizes in cold air.',
    available: true,
    endsAt: new Date(year + (month === 0 ? 0 : 1), 1, 28),
  }];
}
