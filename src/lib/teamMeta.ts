export interface TeamMeta {
  popularity?: number;
  style?: string[];
}

// football-data.org team ID 기준. 프리티어에 접근 가능한 주요 팀만 정리.
export const TEAM_META: Record<number, TeamMeta> = {
  // Premier League
  65: { popularity: 92, style: ["possession", "press"] }, // Manchester City
  64: { popularity: 95, style: ["press", "counter"] }, // Liverpool
  57: { popularity: 90, style: ["possession", "press"] }, // Arsenal
  61: { popularity: 85, style: ["counter"] }, // Chelsea
  66: { popularity: 93, style: ["individual", "counter"] }, // Manchester United
  73: { popularity: 78, style: ["counter"] }, // Tottenham
  58: { popularity: 70, style: ["counter"] }, // Aston Villa
  67: { popularity: 65, style: ["press"] }, // Newcastle

  // La Liga (PD)
  86: { popularity: 98, style: ["counter", "individual"] }, // Real Madrid
  81: { popularity: 96, style: ["possession"] }, // FC Barcelona
  78: { popularity: 82, style: ["defensive", "counter"] }, // Atlético Madrid
  559: { popularity: 60, style: ["possession"] }, // Sevilla

  // Bundesliga (BL1)
  5: { popularity: 93, style: ["possession", "press"] }, // Bayern Munich
  4: { popularity: 82, style: ["press", "counter"] }, // Borussia Dortmund
  3: { popularity: 68, style: ["press"] }, // Bayer Leverkusen
  36: { popularity: 58, style: ["press"] }, // RB Leipzig

  // Serie A (SA)
  109: { popularity: 86, style: ["defensive"] }, // Juventus
  108: { popularity: 80, style: ["counter"] }, // Inter
  98: { popularity: 82, style: ["counter"] }, // AC Milan
  113: { popularity: 72, style: ["possession"] }, // Napoli
  100: { popularity: 70, style: ["counter"] }, // Roma

  // Ligue 1 (FL1)
  524: { popularity: 90, style: ["individual", "counter"] }, // PSG
  516: { popularity: 55, style: ["counter"] }, // Marseille
};
