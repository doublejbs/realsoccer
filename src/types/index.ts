export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

export interface TeamDTO {
  id: string;
  name: string;
  shortName?: string | null;
  crestUrl?: string | null;
  leagueCode: string;
  recentForm?: ("W" | "D" | "L")[]; // 최근 5경기
  popularity?: number; // 0-100
  style?: string[]; // e.g. ["press", "possession"]
}

export interface MatchDTO {
  id: string;
  externalMatchId: string;
  leagueCode: string;
  kickoffAt: string; // ISO
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: TeamDTO;
  awayTeam: TeamDTO;
  importance?: number; // 0-100 - 라이벌 / 순위 / 타이틀 영향 등
}

export interface MatchBundle {
  match: MatchDTO;
  reasons: string[];
  watchPoints: string[];
  score?: number;
}

export interface MatchContextData {
  homeForm: ("W" | "D" | "L")[];
  awayForm: ("W" | "D" | "L")[];
  homeStanding?: { position: number; points: number; played: number };
  awayStanding?: { position: number; points: number; played: number };
  homeTopPlayers?: { name: string; goals: number; assists: number; rating: number | null }[];
  awayTopPlayers?: { name: string; goals: number; assists: number; rating: number | null }[];
}

export interface UserPreferencesDTO {
  favoriteLeagues: string[];
  favoriteTeams: string[];
  favoriteStyles: string[];
}
