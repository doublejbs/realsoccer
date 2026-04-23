import { prisma } from "@/lib/prisma";
import type { MatchContextData, MatchDTO } from "@/types";
import {
  fetchStandings,
  fetchTeamForm,
} from "./football-data-context";
import { fetchLeagueTopPlayers, filterTeamPlayers } from "./api-football";
import { generateMatchMeta, generateSummary } from "./llm";

type Kind = "reason" | "watch_points" | "headline" | "tags" | "summary" | "context_data";

export type EnsureResult = "cached" | "generated" | "failed" | "skipped";

// --- 읽기 전용 (페이지·API) ---
async function getFromCache(match: MatchDTO, kind: Kind): Promise<unknown | null> {
  try {
    const existing = await prisma.matchContent.findUnique({
      where: { matchId_kind: { matchId: match.id, kind } },
    });
    return existing ? existing.content : null;
  } catch (err) {
    console.error(`[content] DB read failed for ${kind}`, err);
    return null;
  }
}

export async function getReasons(match: MatchDTO): Promise<string[] | null> {
  const val = await getFromCache(match, "reason");
  return val as string[] | null;
}

export async function getWatchPoints(match: MatchDTO): Promise<string[] | null> {
  const val = await getFromCache(match, "watch_points");
  return val as string[] | null;
}

export async function getHeadline(match: MatchDTO): Promise<string | null> {
  const val = await getFromCache(match, "headline");
  if (!val) return null;
  return (val as string[])[0] ?? null;
}

export async function getTags(match: MatchDTO): Promise<string[] | null> {
  const val = await getFromCache(match, "tags");
  return val as string[] | null;
}

export async function getSummary(match: MatchDTO): Promise<string[] | null> {
  const val = await getFromCache(match, "summary");
  return val as string[] | null;
}

export async function getContextData(match: MatchDTO): Promise<MatchContextData | null> {
  const val = await getFromCache(match, "context_data");
  return val as MatchContextData | null;
}

// --- 쓰기 전용 (cron 전용) ---

async function upsertKind(matchId: string, kind: Kind, content: object | string[] | string) {
  await prisma.matchContent.upsert({
    where: { matchId_kind: { matchId, kind } },
    create: { matchId, kind, content },
    update: { content },
  });
}

// headline + tags + reasons + watchPoints 한 번에 (Claude 1회 호출).
export async function ensureMatchMeta(match: MatchDTO): Promise<EnsureResult> {
  try {
    const [r, w, h, t] = await Promise.all([
      prisma.matchContent.findUnique({ where: { matchId_kind: { matchId: match.id, kind: "reason" } } }),
      prisma.matchContent.findUnique({ where: { matchId_kind: { matchId: match.id, kind: "watch_points" } } }),
      prisma.matchContent.findUnique({ where: { matchId_kind: { matchId: match.id, kind: "headline" } } }),
      prisma.matchContent.findUnique({ where: { matchId_kind: { matchId: match.id, kind: "tags" } } }),
    ]);
    if (r && w && h && t) return "cached";
  } catch (err) {
    console.error("[content] DB read failed (ensureMatchMeta)", err);
  }

  try {
    const meta = await generateMatchMeta(match);
    await Promise.all([
      upsertKind(match.id, "reason", meta.reasons),
      upsertKind(match.id, "watch_points", meta.watchPoints),
      upsertKind(match.id, "headline", [meta.headline]),
      upsertKind(match.id, "tags", meta.tags),
    ]);
    return "generated";
  } catch (err) {
    console.error("[content] ensureMatchMeta failed", match.id, err);
    return "failed";
  }
}

// 폼 + 순위 데이터 저장 (football-data, Claude 아님).
export async function ensureContextData(match: MatchDTO): Promise<EnsureResult> {
  try {
    const existing = await prisma.matchContent.findUnique({
      where: { matchId_kind: { matchId: match.id, kind: "context_data" } },
    });
    if (existing) return "cached";
  } catch (err) {
    console.error("[content] DB read failed (ensureContextData)", err);
  }

  try {
    const [homeForm, awayForm, standings, allPlayers] = await Promise.all([
      fetchTeamForm(match.homeTeam.id).catch(() => []),
      fetchTeamForm(match.awayTeam.id).catch(() => []),
      fetchStandings(match.leagueCode).catch(() => null),
      fetchLeagueTopPlayers(match.leagueCode).catch(() => []),
    ]);

    const homeRow = standings?.find((r) => String(r.team.id) === match.homeTeam.id);
    const awayRow = standings?.find((r) => String(r.team.id) === match.awayTeam.id);

    const homePlayers = filterTeamPlayers(allPlayers, match.homeTeam.name);
    const awayPlayers = filterTeamPlayers(allPlayers, match.awayTeam.name);

    const data: MatchContextData = {
      homeForm: homeForm.map((f) => f.result),
      awayForm: awayForm.map((f) => f.result),
      homeStanding: homeRow
        ? { position: homeRow.position, points: homeRow.points, played: homeRow.playedGames }
        : undefined,
      awayStanding: awayRow
        ? { position: awayRow.position, points: awayRow.points, played: awayRow.playedGames }
        : undefined,
      homeTopPlayers: homePlayers.length > 0 ? homePlayers : undefined,
      awayTopPlayers: awayPlayers.length > 0 ? awayPlayers : undefined,
    };

    await upsertKind(match.id, "context_data", data);
    return "generated";
  } catch (err) {
    console.error("[content] ensureContextData failed", match.id, err);
    return "failed";
  }
}

export async function ensureSummary(match: MatchDTO): Promise<EnsureResult> {
  if (match.status !== "FINISHED") return "skipped";

  try {
    const existing = await prisma.matchContent.findUnique({
      where: { matchId_kind: { matchId: match.id, kind: "summary" } },
    });
    if (existing) return "cached";
  } catch (err) {
    console.error("[content] DB read failed (ensureSummary)", err);
  }

  try {
    const lines = await generateSummary(match);
    await upsertKind(match.id, "summary", lines);
    return "generated";
  } catch (err) {
    console.error("[content] ensureSummary failed", match.id, err);
    return "failed";
  }
}
