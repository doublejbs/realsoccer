import { prisma } from "@/lib/prisma";
import type { MatchDTO } from "@/types";
import {
  fallbackReasons,
  fallbackSummary,
  fallbackWatchPoints,
  generateReasons,
  generateSummary,
  generateWatchPoints,
} from "./llm";

type Kind = "reason" | "watch_points" | "summary";

// --- 읽기 전용 (페이지·API에서 사용) ---
// DB에 캐시된 컨텐츠가 있으면 반환, 없으면 폴백.
// Claude를 호출하지 않음 — AI 생성은 cron 전용.
async function getFromCache(
  match: MatchDTO,
  kind: Kind,
  fallback: (m: MatchDTO) => string[],
): Promise<string[]> {
  try {
    const existing = await prisma.matchContent.findUnique({
      where: { matchId_kind: { matchId: match.id, kind } },
    });
    if (existing) return existing.content as unknown as string[];
  } catch (err) {
    console.error(`[content] DB read failed for ${kind}`, err);
  }
  return fallback(match);
}

export function getReasons(match: MatchDTO) {
  return getFromCache(match, "reason", fallbackReasons);
}

export function getWatchPoints(match: MatchDTO) {
  return getFromCache(match, "watch_points", fallbackWatchPoints);
}

export function getSummary(match: MatchDTO) {
  return getFromCache(match, "summary", fallbackSummary);
}

// --- 쓰기 전용 (cron에서만 호출) ---
// 캐시에 이미 있으면 skip. 없으면 Claude 호출 → 성공 시 DB upsert.
export type EnsureResult = "cached" | "generated" | "failed" | "skipped";

async function ensureContent(
  match: MatchDTO,
  kind: Kind,
  generator: (m: MatchDTO) => Promise<string[]>,
): Promise<EnsureResult> {
  try {
    const existing = await prisma.matchContent.findUnique({
      where: { matchId_kind: { matchId: match.id, kind } },
    });
    if (existing) return "cached";
  } catch (err) {
    console.error(`[content] DB read failed (ensure ${kind})`, err);
  }

  let aiContent: string[] | null = null;
  try {
    aiContent = await generator(match);
  } catch (err) {
    console.error(`[content] AI generation failed (${kind})`, match.id, err);
    return "failed";
  }

  if (!aiContent) return "failed";

  try {
    await prisma.matchContent.upsert({
      where: { matchId_kind: { matchId: match.id, kind } },
      create: { matchId: match.id, kind, content: aiContent },
      update: { content: aiContent },
    });
    return "generated";
  } catch (err) {
    console.error(`[content] cache write failed (${kind})`, match.id, err);
    return "failed";
  }
}

export function ensureReasons(match: MatchDTO) {
  return ensureContent(match, "reason", generateReasons);
}

export function ensureWatchPoints(match: MatchDTO) {
  return ensureContent(match, "watch_points", generateWatchPoints);
}

// 종료된 경기에만 summary 생성.
export async function ensureSummary(match: MatchDTO): Promise<EnsureResult> {
  if (match.status !== "FINISHED") return "skipped";
  return ensureContent(match, "summary", generateSummary);
}
