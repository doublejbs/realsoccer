import type { MatchDTO } from "@/types";
import { fetchLeagueTopPlayers, filterTeamPlayers } from "./api-football";

const BASE = "https://api.football-data.org/v4";

function headers(): Record<string, string> {
  const token = process.env.FOOTBALL_DATA_API_KEY;
  if (!token) throw new Error("FOOTBALL_DATA_API_KEY is not set");
  return { "X-Auth-Token": token };
}

// ---------- Types ----------
interface FDTeamRef {
  id: number;
  name: string;
  shortName?: string | null;
}

interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  competition: { code: string; name: string };
  homeTeam: FDTeamRef;
  awayTeam: FDTeamRef;
  score: { fullTime: { home: number | null; away: number | null } };
}

interface FormEntry {
  date: string;
  opponent: string;
  isHome: boolean;
  result: "W" | "D" | "L";
  score: string;
  competition: string;
}

interface StandingRow {
  position: number;
  team: FDTeamRef;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface H2HResponse {
  aggregates: {
    numberOfMatches: number;
    totalGoals: number;
    homeTeam: { id: number; name: string; wins: number; draws: number; losses: number };
    awayTeam: { id: number; name: string; wins: number; draws: number; losses: number };
  };
  matches: FDMatch[];
}

// ---------- Fetchers ----------
export async function fetchTeamForm(
  teamId: string,
  limit = 5,
): Promise<FormEntry[]> {
  const url = `${BASE}/teams/${teamId}/matches?status=FINISHED&limit=${limit}`;
  const res = await fetch(url, {
    headers: headers(),
    next: { revalidate: 1800 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { matches: FDMatch[] };
  const idNum = Number(teamId);
  // 최신 → 과거 순
  const sorted = [...data.matches].sort(
    (a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime(),
  );
  return sorted.map((m) => {
    const isHome = m.homeTeam.id === idNum;
    const opponent = isHome
      ? (m.awayTeam.shortName ?? m.awayTeam.name)
      : (m.homeTeam.shortName ?? m.homeTeam.name);
    const hs = m.score.fullTime.home ?? 0;
    const as = m.score.fullTime.away ?? 0;
    let result: "W" | "D" | "L";
    if (hs === as) result = "D";
    else if ((isHome && hs > as) || (!isHome && as > hs)) result = "W";
    else result = "L";
    return {
      date: m.utcDate.slice(0, 10),
      opponent,
      isHome,
      result,
      score: `${hs}-${as}`,
      competition: m.competition.code,
    };
  });
}

export async function fetchStandings(
  competitionCode: string,
): Promise<StandingRow[] | null> {
  const url = `${BASE}/competitions/${competitionCode}/standings`;
  const res = await fetch(url, {
    headers: headers(),
    next: { revalidate: 1800 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    standings: { type: string; table: StandingRow[] }[];
  };
  const total = data.standings.find((s) => s.type === "TOTAL");
  return total?.table ?? null;
}

export async function fetchHeadToHead(
  externalMatchId: string,
): Promise<H2HResponse | null> {
  const url = `${BASE}/matches/${externalMatchId}/head2head?limit=5`;
  const res = await fetch(url, {
    headers: headers(),
    next: { revalidate: 600 },
  });
  if (!res.ok) return null;
  return (await res.json()) as H2HResponse;
}

// ---------- Aggregator + formatter ----------
function formEntryLine(f: FormEntry): string {
  const venue = f.isHome ? "홈" : "원정";
  return `${f.date} vs ${f.opponent} (${venue}) ${f.score} ${f.result} [${f.competition}]`;
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function formatContext(
  match: MatchDTO,
  homeForm: FormEntry[],
  awayForm: FormEntry[],
  standings: StandingRow[] | null,
  h2h: H2HResponse | null,
  homePlayers: { name: string; goals: number; assists: number; rating: number | null }[],
  awayPlayers: { name: string; goals: number; assists: number; rating: number | null }[],
): string {
  const parts: string[] = [];

  if (homeForm.length > 0) {
    parts.push(`[${match.homeTeam.name} 최근 ${homeForm.length}경기]`);
    homeForm.forEach((f) => parts.push(`- ${formEntryLine(f)}`));
  }

  if (awayForm.length > 0) {
    if (parts.length > 0) parts.push("");
    parts.push(`[${match.awayTeam.name} 최근 ${awayForm.length}경기]`);
    awayForm.forEach((f) => parts.push(`- ${formEntryLine(f)}`));
  }

  if (standings) {
    const homeRow = standings.find(
      (r) => String(r.team.id) === match.homeTeam.id,
    );
    const awayRow = standings.find(
      (r) => String(r.team.id) === match.awayTeam.id,
    );
    if (homeRow || awayRow) {
      if (parts.length > 0) parts.push("");
      parts.push(`[리그 순위 현황]`);
      if (homeRow) {
        parts.push(
          `- ${match.homeTeam.name}: ${homeRow.position}위 · 승점 ${homeRow.points} · ${homeRow.won}승 ${homeRow.draw}무 ${homeRow.lost}패 · 득실 ${signed(homeRow.goalDifference)}`,
        );
      }
      if (awayRow) {
        parts.push(
          `- ${match.awayTeam.name}: ${awayRow.position}위 · 승점 ${awayRow.points} · ${awayRow.won}승 ${awayRow.draw}무 ${awayRow.lost}패 · 득실 ${signed(awayRow.goalDifference)}`,
        );
      }
    }
  }

  if (h2h && h2h.aggregates && h2h.aggregates.numberOfMatches > 0) {
    if (parts.length > 0) parts.push("");
    parts.push(`[상대 전적 (최근 ${h2h.aggregates.numberOfMatches}경기 기준)]`);
    parts.push(
      `- ${match.homeTeam.name} 승: ${h2h.aggregates.homeTeam.wins} · ${match.awayTeam.name} 승: ${h2h.aggregates.awayTeam.wins} · 무: ${h2h.aggregates.homeTeam.draws}`,
    );
    if (h2h.matches && h2h.matches.length > 0) {
      parts.push(`- 최근 맞대결:`);
      h2h.matches.slice(0, 3).forEach((m) => {
        const hs = m.score.fullTime.home ?? 0;
        const as = m.score.fullTime.away ?? 0;
        parts.push(
          `  · ${m.utcDate.slice(0, 10)}: ${m.homeTeam.shortName ?? m.homeTeam.name} ${hs}-${as} ${m.awayTeam.shortName ?? m.awayTeam.name}`,
        );
      });
    }
  }

  const formatPlayer = (p: { name: string; goals: number; assists: number; rating: number | null }) => {
    const rating = p.rating != null ? ` 평점 ${p.rating.toFixed(1)}` : "";
    return `- ${p.name}: ${p.goals}골 ${p.assists}어시스트${rating}`;
  };

  if (homePlayers.length > 0) {
    if (parts.length > 0) parts.push("");
    parts.push(`[${match.homeTeam.name} 시즌 주목 선수]`);
    homePlayers.forEach((p) => parts.push(formatPlayer(p)));
  }

  if (awayPlayers.length > 0) {
    if (parts.length > 0) parts.push("");
    parts.push(`[${match.awayTeam.name} 시즌 주목 선수]`);
    awayPlayers.forEach((p) => parts.push(formatPlayer(p)));
  }

  return parts.join("\n");
}

export async function enrichMatchContext(match: MatchDTO): Promise<string> {
  const [homeForm, awayForm, standings, h2h, allPlayers] = await Promise.all([
    fetchTeamForm(match.homeTeam.id).catch(() => [] as FormEntry[]),
    fetchTeamForm(match.awayTeam.id).catch(() => [] as FormEntry[]),
    fetchStandings(match.leagueCode).catch(() => null),
    fetchHeadToHead(match.externalMatchId).catch(() => null),
    fetchLeagueTopPlayers(match.leagueCode).catch(() => []),
  ]);
  const homePlayers = filterTeamPlayers(allPlayers, match.homeTeam.name);
  const awayPlayers = filterTeamPlayers(allPlayers, match.awayTeam.name);
  return formatContext(match, homeForm, awayForm, standings, h2h, homePlayers, awayPlayers);
}
