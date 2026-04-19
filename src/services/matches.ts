import type { MatchDTO } from "@/types";
import { MOCK_MATCHES, MOCK_FINISHED } from "@/lib/mock/matches";
import {
  findMatchById,
  findRecentFinishedMatches,
  findTodaysMatches,
} from "./matches-db";

const USE_MOCK = process.env.USE_MOCK === "true";

// 유저 요청은 DB만 조회. 외부 API(football-data) 호출 없음 — cron이 DB에 동기화.
// DB가 비어있으면 빈 배열 반환 (첫 배포 후 cron 전 상태).

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
  limit: number = 3,
): Promise<MatchDTO[]> {
  if (USE_MOCK) return [MOCK_FINISHED];

  try {
    const all = await findRecentFinishedMatches(2);
    return all
      .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
      .slice(0, limit);
  } catch (err) {
    console.error("[matches] recent finished DB read failed", err);
    return [];
  }
}
