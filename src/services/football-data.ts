import type { MatchDTO, MatchStatus, TeamDTO } from "@/types";
import { TEAM_META } from "@/lib/teamMeta";

const BASE = "https://api.football-data.org/v4";

function headers(): Record<string, string> {
  const token = process.env.FOOTBALL_DATA_API_KEY;
  if (!token) throw new Error("FOOTBALL_DATA_API_KEY is not set");
  return { "X-Auth-Token": token };
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

interface FDTeam {
  id: number;
  name: string;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
}

interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  competition: { code: string; name: string };
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: { fullTime: { home: number | null; away: number | null } };
}

const ALLOWED_STATUSES: MatchStatus[] = [
  "SCHEDULED",
  "TIMED",
  "IN_PLAY",
  "PAUSED",
  "FINISHED",
  "POSTPONED",
  "CANCELLED",
];

function mapStatus(s: string): MatchStatus {
  return (ALLOWED_STATUSES as string[]).includes(s)
    ? (s as MatchStatus)
    : "SCHEDULED";
}

function mapTeam(t: FDTeam, leagueCode: string): TeamDTO {
  const meta = TEAM_META[t.id] ?? {};
  return {
    id: String(t.id),
    name: t.name,
    shortName: t.shortName ?? t.tla ?? t.name,
    crestUrl: t.crest ?? null,
    leagueCode,
    popularity: meta.popularity ?? 50,
    style: meta.style ?? [],
  };
}

const LEAGUE_WEIGHT: Record<string, number> = {
  CL: 20,
  PL: 12,
  PD: 12,
  BL1: 9,
  SA: 9,
  FL1: 6,
};

function computeImportance(
  home: TeamDTO,
  away: TeamDTO,
  leagueCode: string,
): number {
  const avgPop = ((home.popularity ?? 50) + (away.popularity ?? 50)) / 2;
  return Math.min(100, Math.round(avgPop + (LEAGUE_WEIGHT[leagueCode] ?? 0)));
}

function mapMatch(m: FDMatch): MatchDTO {
  const leagueCode = m.competition.code;
  const home = mapTeam(m.homeTeam, leagueCode);
  const away = mapTeam(m.awayTeam, leagueCode);
  return {
    id: String(m.id),
    externalMatchId: String(m.id),
    leagueCode,
    kickoffAt: m.utcDate,
    status: mapStatus(m.status),
    homeScore: m.score.fullTime.home ?? null,
    awayScore: m.score.fullTime.away ?? null,
    homeTeam: home,
    awayTeam: away,
    importance: computeImportance(home, away, leagueCode),
  };
}

export async function fetchUpcomingMatches(
  days: number = 7,
): Promise<MatchDTO[]> {
  const now = new Date();
  const later = new Date(now.getTime() + days * 24 * 3_600_000);
  const url = `${BASE}/matches?dateFrom=${ymd(now)}&dateTo=${ymd(later)}`;

  const res = await fetch(url, {
    headers: headers(),
    next: { revalidate: 1800 }, // 30분 — cron 주기(daily)에 맞춰 넉넉히
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`football-data /matches(upcoming) ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { matches: FDMatch[] };
  return data.matches.map(mapMatch);
}

export async function fetchRecentFinishedMatches(
  daysBack: number = 2,
): Promise<MatchDTO[]> {
  const now = new Date();
  const earlier = new Date(now.getTime() - daysBack * 24 * 3_600_000);
  const url = `${BASE}/matches?dateFrom=${ymd(earlier)}&dateTo=${ymd(now)}&status=FINISHED`;

  const res = await fetch(url, {
    headers: headers(),
    next: { revalidate: 600 }, // 10분 캐시
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`football-data /matches(finished) ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { matches: FDMatch[] };
  return data.matches.map(mapMatch).sort((a, b) => {
    // 최근순
    return (
      new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime()
    );
  });
}

