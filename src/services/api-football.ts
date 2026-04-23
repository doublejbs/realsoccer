// api-sports.io v3 — 선수 시즌 스탯 전용. 외부 API 호출은 cron에서만.

const BASE = "https://v3.football.api-sports.io";

// football-data.org leagueCode → API-Football league ID
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

// 축구 시즌은 8월 시작 — 8월 이후면 현재 연도, 이전이면 전년도
function currentSeason(): number {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

// football-data.org 팀명과 API-Football 팀명 비교용 정규화
// "Liverpool FC" → "liverpool", "FC Barcelona" → "barcelona"
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
  goals: number;
  assists: number;
  rating: number | null;
}

// 리그 단위 캐시 — 같은 cron 실행 내 중복 호출 방지
const _playerCache = new Map<string, PlayerStat[]>();

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

// 두 팀에 해당하는 선수만 필터링, 목표/어시스트 합산 내림차순 상위 N명
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

// ---------- Internal types ----------
interface ApiPlayerEntry {
  player: { name: string };
  statistics: {
    team: { name: string };
    goals: { total: number | null; assists: number | null };
    games: { rating: string | null };
  }[];
}
