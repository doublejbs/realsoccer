import { NextResponse } from "next/server";
import {
  fetchRecentFinishedMatches,
  fetchUpcomingMatches,
} from "@/services/football-data";
import { rankMatches } from "@/services/recommendation";
import {
  ensureContextData,
  ensureMatchEditorial,
  ensureSummary,
  type EnsureResult,
} from "@/services/content";
import { upsertMatches } from "@/services/matches-db";
import type { MatchDTO } from "@/types";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const TOP_N = 10;
const UPCOMING_DAYS = 7;
const FINISHED_LOOKBACK_DAYS = 2;
const CLAUDE_CONCURRENCY = 5;   // Claude 동시 호출 상한 (ITPM 초과 방지)
const DATA_CONCURRENCY = 10;    // football-data fetch (Claude 아님, 제약 없음)

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (true) {
        const i = cursor++;
        if (i >= items.length) return;
        results[i] = await fn(items[i]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

function tally(results: EnsureResult[]) {
  return results.reduce(
    (acc, r) => {
      acc[r] = (acc[r] ?? 0) + 1;
      return acc;
    },
    {} as Record<EnsureResult, number>,
  );
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const report = {
    upserted: { upcoming: 0, finished: 0 },
    recommendations: { picked: 0, editorial: {} as Record<string, number>, context: {} as Record<string, number> },
    summaries: { picked: 0, summary: {} as Record<string, number> },
    durationMs: 0,
  };

  const [upcomingResult, finishedResult] = await Promise.allSettled([
    fetchUpcomingMatches(UPCOMING_DAYS),
    fetchRecentFinishedMatches(FINISHED_LOOKBACK_DAYS),
  ]);
  const upcoming = upcomingResult.status === "fulfilled" ? upcomingResult.value : [];
  const finished = finishedResult.status === "fulfilled" ? finishedResult.value : [];

  const topRecommend = rankMatches(upcoming).slice(0, TOP_N).map((r) => r.match);
  const topFinished = finished
    .filter((m) => m.status === "FINISHED")
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
    .slice(0, TOP_N);
  report.recommendations.picked = topRecommend.length;
  report.summaries.picked = topFinished.length;

  // 카테고리별 pool 분리:
  // meta + summary = Claude 호출 → 각 최대 5개 (ITPM 초과 방지)
  // context = football-data → 별도 pool, Claude와 무관
  const [editorialResults, contextResults, summaryResults] = await Promise.all([
    mapPool(topRecommend, CLAUDE_CONCURRENCY, (m) => ensureMatchEditorial(m)),
    mapPool(topRecommend, DATA_CONCURRENCY, (m) => ensureContextData(m)),
    mapPool(topFinished, CLAUDE_CONCURRENCY, (m) => ensureSummary(m)),
  ]);

  // content 생성 여부와 무관하게 모든 경기의 status/score를 항상 동기화.
  // "generated"만 저장하면 캐시된 경기의 status가 FINISHED로 업데이트되지 않는 버그 방지.
  const [upcomingUpserts, finishedUpserts] = await Promise.all([
    upsertMatches(topRecommend),
    upsertMatches(topFinished),
  ]);

  report.upserted.upcoming = upcomingUpserts;
  report.upserted.finished = finishedUpserts;
  report.recommendations.editorial = tally(editorialResults);
  report.recommendations.context = tally(contextResults);
  report.summaries.summary = tally(summaryResults);
  report.durationMs = Date.now() - startedAt;

  return NextResponse.json({ ok: true, ...report });
}
