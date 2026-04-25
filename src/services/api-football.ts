// api-sports.io v3 — 선수 시즌 스탯 + 팀 통계 전용. 외부 API 호출은 cron에서만.

const BASE = "https://v3.football.api-sports.io";

const LEAGUE_IDS: Record<string, number> = {
  PL: 39,
  PD: 140,
  BL1: 78,
  SA: 135,
  FL1: 61,
  CL: 2,
};

function headers(): Record<string, string> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY not set");
  return { "x-apisports-key": key };
}

function currentSeason(): number {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

function normName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(fc|cf|afc|sc|ac|as|ssc|ss|rb|rcd|ud|sd|ca|cd|vfb|bsc|fsv|sv|vfl|tsg)\b\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function teamMatches(apiTeamName: string, matchTeamName: string): boolean {
  const a = normName(apiTeamName);
  const b = normName(matchTeamName);
  return a === b || a.includes(b) || b.includes(a);
}

export interface PlayerStat {
  name: string;
  team: string;
  teamId: number;
  position?: string;
  goals: number;
  assists: number;
  rating: number | null;
}

export interface TeamStatistics {
  goalsForAvg: number;
  goalsAgainstAvg: number;
  cleanSheets: number;
  homeWins: number;
  homePlayed: number;
  awayWins: number;
  awayPlayed: number;
}

// 리그 단위 캐시 — 같은 cron 실행 내 중복 호출 방지
const _playerCache = new Map<string, PlayerStat[]>();
const _teamStatsCache = new Map<string, TeamStatistics>();

export async function fetchLeagueTopPlayers(
  leagueCode: string,
): Promise<PlayerStat[]> {
  if (_playerCache.has(leagueCode)) return _playerCache.get(leagueCode)!;

  const leagueId = LEAGUE_IDS[leagueCode];
  if (!leagueId) return [];

  const season = currentSeason();
  const [scorersRes, assistsRes] = await Promise.all([
    fetch(`${BASE}/players/topscorers?league=${leagueId}&season=${season}`, {
      headers: headers(),
      next: { revalidate: 3600 },
    }).catch(() => null),
    fetch(`${BASE}/players/topassists?league=${leagueId}&season=${season}`, {
      headers: headers(),
      next: { revalidate: 3600 },
    }).catch(() => null),
  ]);

  const playerMap = new Map<string, PlayerStat>();

  if (scorersRes?.ok) {
    const data = (await scorersRes.json()) as { response: ApiPlayerEntry[] };
    for (const item of data.response ?? []) {
      const stat = item.statistics[0];
      if (!stat) continue;
      playerMap.set(item.player.name, {
        name: item.player.name,
        team: stat.team.name,
        teamId: stat.team.id,
        position: item.player.position,
        goals: stat.goals.total ?? 0,
        assists: stat.goals.assists ?? 0,
        rating: stat.games.rating ? parseFloat(stat.games.rating) : null,
      });
    }
  }

  if (assistsRes?.ok) {
    const data = (await assistsRes.json()) as { response: ApiPlayerEntry[] };
    for (const item of data.response ?? []) {
      const stat = item.statistics[0];
      if (!stat) continue;
      const existing = playerMap.get(item.player.name);
      if (existing) {
        existing.assists = Math.max(existing.assists, stat.goals.assists ?? 0);
      } else {
        playerMap.set(item.player.name, {
          name: item.player.name,
          team: stat.team.name,
          teamId: stat.team.id,
          position: item.player.position,
          goals: stat.goals.total ?? 0,
          assists: stat.goals.assists ?? 0,
          rating: stat.games.rating ? parseFloat(stat.games.rating) : null,
        });
      }
    }
  }

  const result = Array.from(playerMap.values());
  _playerCache.set(leagueCode, result);
  return result;
}

export function filterTeamPlayers(
  allPlayers: PlayerStat[],
  teamName: string,
  limit = 3,
): PlayerStat[] {
  return allPlayers
    .filter((p) => teamMatches(p.team, teamName))
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
    .slice(0, limit);
}

// player 목록에서 팀명으로 API-Football team ID 추출
export function findTeamId(allPlayers: PlayerStat[], teamName: string): number | null {
  return allPlayers.find((p) => teamMatches(p.team, teamName))?.teamId ?? null;
}

export async function fetchTeamStatistics(
  teamId: number,
  leagueCode: string,
): Promise<TeamStatistics | null> {
  const key = `${leagueCode}:${teamId}`;
  if (_teamStatsCache.has(key)) return _teamStatsCache.get(key)!;

  const leagueId = LEAGUE_IDS[leagueCode];
  if (!leagueId) return null;

  const season = currentSeason();
  const res = await fetch(
    `${BASE}/teams/statistics?league=${leagueId}&season=${season}&team=${teamId}`,
    { headers: headers(), next: { revalidate: 3600 } },
  ).catch(() => null);

  if (!res?.ok) return null;

  const data = (await res.json()) as { response: ApiTeamStats };
  const s = data.response;
  if (!s) return null;

  const stats: TeamStatistics = {
    goalsForAvg: parseFloat(s.goals?.for?.average?.total ?? "0"),
    goalsAgainstAvg: parseFloat(s.goals?.against?.average?.total ?? "0"),
    cleanSheets: s.clean_sheet?.total ?? 0,
    homeWins: s.fixtures?.wins?.home ?? 0,
    homePlayed: s.fixtures?.played?.home ?? 0,
    awayWins: s.fixtures?.wins?.away ?? 0,
    awayPlayed: s.fixtures?.played?.away ?? 0,
  };

  _teamStatsCache.set(key, stats);
  return stats;
}

// ---------- Internal types ----------
interface ApiPlayerEntry {
  player: { name: string; position: string };
  statistics: {
    team: { name: string; id: number };
    goals: { total: number | null; assists: number | null };
    games: { rating: string | null };
  }[];
}

interface ApiTeamStats {
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
  };
  goals: {
    for: { average: { home: string; away: string; total: string } };
    against: { average: { home: string; away: string; total: string } };
  };
  clean_sheet: { home: number; away: number; total: number };
}
