import type { MatchDTO } from "@/types";
import { MOCK_MATCHES, MOCK_FINISHED } from "@/lib/mock/matches";
import {
  findFinishedPage,
  findMatchById,
  findRecentFinishedMatches,
  findTodaysMatches,
} from "./matches-db";

const USE_MOCK = process.env.USE_MOCK === "true";

// DB에 있는 경기 = AI 컨텐츠 있는 경기 (cron이 생성 성공한 것만 저장).
// 별도 필터 없이 DB 그대로 반환.

export async function getTodaysMatches(): Promise<MatchDTO[]> {
  if (USE_MOCK) return MOCK_MATCHES;
  try {
    return await findTodaysMatches();
  } catch (err) {
    console.error("[matches] DB read failed", err);
    return [];
  }
}

export async function getMatchById(id: string): Promise<MatchDTO | null> {
  if (USE_MOCK) {
    return (
      MOCK_MATCHES.find((m) => m.id === id) ??
      (MOCK_FINISHED.id === id ? MOCK_FINISHED : null)
    );
  }
  try {
    return await findMatchById(id);
  } catch (err) {
    console.error(`[matches] DB read failed for ${id}`, err);
    return null;
  }
}

export async function getRecentFinishedMatches(
  limit: number = 5,
): Promise<MatchDTO[]> {
  if (USE_MOCK) return [MOCK_FINISHED];
  try {
    const all = await findRecentFinishedMatches(2);
    return all.slice(0, limit);
  } catch (err) {
    console.error("[matches] recent finished DB read failed", err);
    return [];
  }
}

export async function getFinishedMatchesPage(
  page: number,
  perPage: number = 20,
) {
  if (USE_MOCK) {
    return { matches: [MOCK_FINISHED], total: 1, pageCount: 1, hasMore: false };
  }
  try {
    return await findFinishedPage(page, perPage);
  } catch (err) {
    console.error("[matches] finished page DB read failed", err);
    return { matches: [], total: 0, pageCount: 1, hasMore: false };
  }
}
