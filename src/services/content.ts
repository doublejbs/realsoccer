import { prisma } from "@/lib/prisma";
import type { MatchContextData, MatchDTO } from "@/types";
import {
  fetchStandings,
  fetchTeamForm,
} from "./football-data-context";
import {
  fetchLeagueTopPlayers,
  fetchTeamStatistics,
  filterTeamPlayers,
  findTeamId,
} from "./api-football";
import { generateMatchEditorial, generateSummary } from "./llm";

type Kind =
  | "reason"
  | "watch_points"
  | "headline"
  | "tags"
  | "summary"
  | "context_data"
  | "story"
  | "key_battles"
  | "tactical_hinge"
  | "the_number";

export type EnsureResult = "cached" | "generated" | "failed" | "skipped";

export interface KeyBattle {
  home: string;
  away: string;
  description: string;
}

export interface TheNumber {
  value: string;
  label: string;
  context: string;
}

export interface MatchContentBundle {
  headline: string | null;
  tags: string[] | null;
  story: string | null;
  keyBattles: KeyBattle[] | null;
  tacticalHinge: string | null;
  theNumber: TheNumber | null;
  summary: string[] | null;
  contextData: MatchContextData | null;
}

// --- 읽기 (유저 경로) ---
export async function getMatchContent(
  match: MatchDTO,
): Promise<MatchContentBundle> {
  let rows: { kind: string; content: unknown }[] = [];
  try {
    rows = await prisma.matchContent.findMany({
      where: { matchId: match.id },
      select: { kind: true, content: true },
    });
  } catch (err) {
    console.error("[content] DB read failed", err);
  }

  const byKind = new Map<string, unknown>();
  for (const r of rows) byKind.set(r.kind, r.content);

  const headlineArr = byKind.get("headline") as string[] | undefined;
  const storyArr = byKind.get("story") as string[] | undefined;
  const tacticalHingeArr = byKind.get("tactical_hinge") as string[] | undefined;

  return {
    headline: headlineArr?.[0] ?? null,
    tags: (byKind.get("tags") as string[] | undefined) ?? null,
    story: storyArr?.[0] ?? null,
    keyBattles: (byKind.get("key_battles") as KeyBattle[] | undefined) ?? null,
    tacticalHinge: tacticalHingeArr?.[0] ?? null,
    theNumber: (byKind.get("the_number") as TheNumber | undefined) ?? null,
    summary: (byKind.get("summary") as string[] | undefined) ?? null,
    contextData:
      (byKind.get("context_data") as MatchContextData | undefined) ?? null,
  };
}

// --- 쓰기 전용 (cron 전용) ---

async function upsertKind(
  matchId: string,
  kind: Kind,
  content: object | string[] | string,
) {
  await prisma.matchContent.upsert({
    where: { matchId_kind: { matchId, kind } },
    create: { matchId, kind, content },
    update: { content },
  });
}

// headline + tags + story + keyBattles + tacticalHinge + theNumber 한 번에 (Claude 1회 호출).
export async function ensureMatchEditorial(
  match: MatchDTO,
): Promise<EnsureResult> {
  try {
    const [story, battles, hinge, number, headline, tags] = await Promise.all([
      prisma.matchContent.findUnique({
        where: { matchId_kind: { matchId: match.id, kind: "story" } },
      }),
      prisma.matchContent.findUnique({
        where: { matchId_kind: { matchId: match.id, kind: "key_battles" } },
      }),
      prisma.matchContent.findUnique({
        where: { matchId_kind: { matchId: match.id, kind: "tactical_hinge" } },
      }),
      prisma.matchContent.findUnique({
        where: { matchId_kind: { matchId: match.id, kind: "the_number" } },
      }),
      prisma.matchContent.findUnique({
        where: { matchId_kind: { matchId: match.id, kind: "headline" } },
      }),
      prisma.matchContent.findUnique({
        where: { matchId_kind: { matchId: match.id, kind: "tags" } },
      }),
    ]);
    if (story && battles && hinge && number && headline && tags) return "cached";
  } catch (err) {
    console.error("[content] DB read failed (ensureMatchEditorial)", err);
  }

  try {
    const editorial = await generateMatchEditorial(match);
    await Promise.all([
      upsertKind(match.id, "story", [editorial.story]),
      upsertKind(match.id, "key_battles", editorial.keyBattles),
      upsertKind(match.id, "tactical_hinge", [editorial.tacticalHinge]),
      upsertKind(match.id, "the_number", editorial.theNumber),
      upsertKind(match.id, "headline", [editorial.headline]),
      upsertKind(match.id, "tags", editorial.tags),
    ]);
    return "generated";
  } catch (err) {
    console.error("[content] ensureMatchEditorial failed", match.id, err);
    return "failed";
  }
}

// 폼 + 순위 + 선수 + 팀 통계 저장 (football-data + API-Football, Claude 아님).
export async function ensureContextData(
  match: MatchDTO,
): Promise<EnsureResult> {
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

    const homeRow = standings?.find(
      (r) => String(r.team.id) === match.homeTeam.id,
    );
    const awayRow = standings?.find(
      (r) => String(r.team.id) === match.awayTeam.id,
    );

    const homePlayers = filterTeamPlayers(allPlayers, match.homeTeam.name);
    const awayPlayers = filterTeamPlayers(allPlayers, match.awayTeam.name);

    const homeTeamId = findTeamId(allPlayers, match.homeTeam.name);
    const awayTeamId = findTeamId(allPlayers, match.awayTeam.name);

    const [homeStats, awayStats] = await Promise.all([
      homeTeamId
        ? fetchTeamStatistics(homeTeamId, match.leagueCode).catch(() => null)
        : null,
      awayTeamId
        ? fetchTeamStatistics(awayTeamId, match.leagueCode).catch(() => null)
        : null,
    ]);

    const data: MatchContextData = {
      homeForm: homeForm.map((f) => f.result),
      awayForm: awayForm.map((f) => f.result),
      homeStanding: homeRow
        ? {
            position: homeRow.position,
            points: homeRow.points,
            played: homeRow.playedGames,
          }
        : undefined,
      awayStanding: awayRow
        ? {
            position: awayRow.position,
            points: awayRow.points,
            played: awayRow.playedGames,
          }
        : undefined,
      homeTopPlayers: homePlayers.length > 0 ? homePlayers : undefined,
      awayTopPlayers: awayPlayers.length > 0 ? awayPlayers : undefined,
      homeStats: homeStats ?? undefined,
      awayStats: awayStats ?? undefined,
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
