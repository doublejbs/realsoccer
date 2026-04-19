import { prisma } from "@/lib/prisma";
import type { MatchDTO, MatchStatus, TeamDTO } from "@/types";

function toDTO(row: {
  id: string;
  leagueCode: string;
  kickoffAt: Date;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: unknown;
  awayTeam: unknown;
  importance: number;
}): MatchDTO {
  return {
    id: row.id,
    externalMatchId: row.id,
    leagueCode: row.leagueCode,
    kickoffAt: row.kickoffAt.toISOString(),
    status: row.status as MatchStatus,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    homeTeam: row.homeTeam as TeamDTO,
    awayTeam: row.awayTeam as TeamDTO,
    importance: row.importance,
  };
}

// pooler 연결 한계(connection_limit=1)와 rate limit 고려해 chunk 병렬.
const UPSERT_CHUNK = 10;

export async function upsertMatches(matches: MatchDTO[]): Promise<number> {
  let count = 0;
  for (let i = 0; i < matches.length; i += UPSERT_CHUNK) {
    const chunk = matches.slice(i, i + UPSERT_CHUNK);
    const results = await Promise.all(
      chunk.map(async (m) => {
        const data = {
          leagueCode: m.leagueCode,
          kickoffAt: new Date(m.kickoffAt),
          status: m.status,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          homeTeam: m.homeTeam as unknown as object,
          awayTeam: m.awayTeam as unknown as object,
          importance: m.importance ?? 50,
        };
        try {
          await prisma.match.upsert({
            where: { id: m.id },
            create: { id: m.id, ...data },
            update: data,
          });
          return true;
        } catch (err) {
          console.error("[matches-db] upsert failed", m.id, err);
          return false;
        }
      }),
    );
    count += results.filter(Boolean).length;
  }
  return count;
}

// 현재 시각 기준 앞으로 N시간 동안의 경기 (홈 페이지용 — 기존 36h 윈도우 유지)
export async function findTodaysMatches(
  windowHours: number = 36,
): Promise<MatchDTO[]> {
  const now = new Date();
  const later = new Date(now.getTime() + windowHours * 3_600_000);
  const rows = await prisma.match.findMany({
    where: { kickoffAt: { gte: now, lte: later } },
    orderBy: { kickoffAt: "asc" },
  });
  return rows.map(toDTO);
}

export async function findMatchById(id: string): Promise<MatchDTO | null> {
  const row = await prisma.match.findUnique({ where: { id } });
  return row ? toDTO(row) : null;
}

export async function findRecentFinishedMatches(
  daysBack: number = 2,
): Promise<MatchDTO[]> {
  const now = new Date();
  const earlier = new Date(now.getTime() - daysBack * 24 * 3_600_000);
  const rows = await prisma.match.findMany({
    where: {
      status: "FINISHED",
      kickoffAt: { gte: earlier, lte: now },
    },
    orderBy: { kickoffAt: "desc" },
  });
  return rows.map(toDTO);
}
