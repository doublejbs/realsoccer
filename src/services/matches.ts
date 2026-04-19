import type { MatchDTO } from "@/types";
import { MOCK_MATCHES, MOCK_FINISHED } from "@/lib/mock/matches";
import {
  fetchMatchById,
  fetchRecentFinishedMatches,
  fetchTodaysMatches,
} from "./football-data";
import { rankMatches } from "./recommendation";

const USE_MOCK = process.env.USE_MOCK === "true";

export async function getTodaysMatches(): Promise<MatchDTO[]> {
  if (USE_MOCK) return MOCK_MATCHES;

  try {
    return await fetchTodaysMatches();
  } catch (err) {
    console.error("[matches] football-data fetch failed — falling back to mock", err);
    return MOCK_MATCHES;
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
    return await fetchMatchById(id);
  } catch (err) {
    console.error(`[matches] football-data match ${id} failed — falling back`, err);
    return (
      MOCK_MATCHES.find((m) => m.id === id) ??
      (MOCK_FINISHED.id === id ? MOCK_FINISHED : null)
    );
  }
}

export async function getRecentFinishedMatches(
  limit: number = 3,
): Promise<MatchDTO[]> {
  if (USE_MOCK) {
    return [MOCK_FINISHED];
  }

  try {
    const all = await fetchRecentFinishedMatches(2);
    // 중요도·인기 기준으로 상위만 — "빅매치 요약"이 가치가 크니까
    return rankMatches(all)
      .slice(0, limit)
      .map((r) => r.match);
  } catch (err) {
    console.error("[matches] recent finished fetch failed", err);
    return [];
  }
}
