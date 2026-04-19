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

async function getOrCreate(
  match: MatchDTO,
  kind: Kind,
  generator: (m: MatchDTO) => Promise<string[]>,
  fallback: (m: MatchDTO) => string[],
): Promise<string[]> {
  // 1) DB 캐시 확인
  try {
    const existing = await prisma.matchContent.findUnique({
      where: { matchId_kind: { matchId: match.id, kind } },
    });
    if (existing) return existing.content as unknown as string[];
  } catch {
    // DB 접근 실패 — 캐시 없이 진행
  }

  // 2) AI 생성 시도
  let aiContent: string[] | null = null;
  try {
    aiContent = await generator(match);
  } catch (err) {
    console.error(`[content] AI generation failed for ${kind} (not caching)`, err);
  }

  // 3) AI 성공 → DB에 캐시
  if (aiContent) {
    try {
      await prisma.matchContent.upsert({
        where: { matchId_kind: { matchId: match.id, kind } },
        create: { matchId: match.id, kind, content: aiContent },
        update: { content: aiContent },
      });
    } catch (err) {
      console.error(`[content] cache write failed for ${kind}`, err);
    }
    return aiContent;
  }

  // 4) AI 실패 → 폴백 반환 (캐시하지 않음)
  return fallback(match);
}

export function getReasons(match: MatchDTO) {
  return getOrCreate(match, "reason", generateReasons, fallbackReasons);
}

export function getWatchPoints(match: MatchDTO) {
  return getOrCreate(
    match,
    "watch_points",
    generateWatchPoints,
    fallbackWatchPoints,
  );
}

export function getSummary(match: MatchDTO) {
  return getOrCreate(match, "summary", generateSummary, fallbackSummary);
}
