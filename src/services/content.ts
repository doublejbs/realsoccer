import { prisma } from "@/lib/prisma";
import type { MatchContextData, MatchDTO } from "@/types";
import {
  fetchStandings,
  fetchTeamForm,
} from "./football-data-context";
import { generateMatchMeta, generateSummary } from "./llm";

type Kind =
  | "reason"
  | "watch_points"
  | "headline"
  | "tags"
  | "summary"
  | "context_data";

export type EnsureResult = "cached" | "generated" | "failed" | "skipped";

export interface MatchContentBundle {
  reasons: string[] | null;
  watchPoints: string[] | null;
  headline: string | null;
  tags: string[] | null;
  summary: string[] | null;
  contextData: MatchContextData | null;
}

// --- 읽기 (유저 경로) ---
// 한 경기의 모든 컨텐츠를 1회 쿼리로 가져온다. pooler 커넥션 1개만 점유.
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

  return {
    reasons: (byKind.get("reason") as string[] | undefined) ?? null,
    watchPoints: (byKind.get("watch_points") as string[] | undefined) ?? null,
    headline: headlineArr?.[0] ?? null,
    tags: (byKind.get("tags") as string[] | undefined) ?? null,
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

// headline + tags + reasons + watchPoints 한 번에 (Claude 1회 호출).
export async function ensureMatchMeta(
  match: MatchDTO,
): Promise<EnsureResult> {
  try {
    const [r, w, h, t] = await Promise.all([
      prisma.matchContent.findUnique({
        where: { matchId_kind: { matchId: match.id, kind: "reason" } },
      }),
      prisma.matchContent.findUnique({
        where: { matchId_kind: { matchId: match.id, kind: "watch_points" } },
      }),
      prisma.matchContent.findUnique({
        where: { matchId_kind: { matchId: match.id, kind: "headline" } },
      }),
      prisma.matchContent.findUnique({
        where: { matchId_kind: { matchId: match.id, kind: "tags" } },
      }),
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
    const [homeForm, awayForm, standings] = await Promise.all([
      fetchTeamForm(match.homeTeam.id).catch(() => []),
      fetchTeamForm(match.awayTeam.id).catch(() => []),
      fetchStandings(match.leagueCode).catch(() => null),
    ]);

    const homeRow = standings?.find(
      (r) => String(r.team.id) === match.homeTeam.id,
    );
    const awayRow = standings?.find(
      (r) => String(r.team.id) === match.awayTeam.id,
    );

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
