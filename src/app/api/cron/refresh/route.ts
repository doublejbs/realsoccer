import { NextResponse } from "next/server";
import {
  fetchRecentFinishedMatches,
  fetchUpcomingMatches,
} from "@/services/football-data";
import { rankMatches } from "@/services/recommendation";
import {
  ensureReasons,
  ensureSummary,
  ensureWatchPoints,
  type EnsureResult,
} from "@/services/content";
import { upsertMatches } from "@/services/matches-db";
import type { MatchDTO } from "@/types";

// Hobby 플랜 함수 타임아웃 상한 (60초)
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const TOP_N = 10;
const TOP_FINISHED_FOR_SUMMARY = 10;
const UPCOMING_DAYS = 7;
const FINISHED_LOOKBACK_DAYS = 2;
// Anthropic rate limit 내 병렬 한계. web_search 제거 후 상향.
const AI_CONCURRENCY = 10;

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
  // Vercel Cron은 Authorization: Bearer $CRON_SECRET 헤더를 자동으로 붙여줌.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const report: {
    upserted: { upcoming: number; finished: number };
    recommendations: {
      picked: number;
      reason: Record<string, number>;
      watchPoints: Record<string, number>;
    };
    summaries: { picked: number; summary: Record<string, number> };
    durationMs: number;
  } = {
    upserted: { upcoming: 0, finished: 0 },
    recommendations: { picked: 0, reason: {}, watchPoints: {} },
    summaries: { picked: 0, summary: {} },
    durationMs: 0,
  };

  // 외부 fetch 병렬
  const [upcomingResult, finishedResult] = await Promise.allSettled([
    fetchUpcomingMatches(UPCOMING_DAYS),
    fetchRecentFinishedMatches(FINISHED_LOOKBACK_DAYS),
  ]);
  const upcoming =
    upcomingResult.status === "fulfilled" ? upcomingResult.value : [];
  const finished =
    finishedResult.status === "fulfilled" ? finishedResult.value : [];
  if (upcomingResult.status === "rejected")
    console.error("[cron] upcoming fetch failed", upcomingResult.reason);
  if (finishedResult.status === "rejected")
    console.error("[cron] finished fetch failed", finishedResult.reason);

  // AI 대상 선정
  const topRecommend = rankMatches(upcoming)
    .slice(0, TOP_N)
    .map((r) => r.match);
  const topFinished = finished
    .filter((m) => m.status === "FINISHED")
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
    .slice(0, TOP_FINISHED_FOR_SUMMARY);
  report.recommendations.picked = topRecommend.length;
  report.summaries.picked = topFinished.length;

  // AI 태스크 (reason + watch + summary 30개)와 upsert를 **동시에** 실행.
  type AiTask =
    | { kind: "reason"; m: MatchDTO }
    | { kind: "watch"; m: MatchDTO }
    | { kind: "summary"; m: MatchDTO };
  const aiTasks: AiTask[] = [
    ...topRecommend.map((m) => ({ kind: "reason" as const, m })),
    ...topRecommend.map((m) => ({ kind: "watch" as const, m })),
    ...topFinished.map((m) => ({ kind: "summary" as const, m })),
  ];

  const [aiResults, upcomingUpserts, finishedUpserts] = await Promise.all([
    mapPool(aiTasks, AI_CONCURRENCY, (t) => {
      if (t.kind === "reason") return ensureReasons(t.m);
      if (t.kind === "watch") return ensureWatchPoints(t.m);
      return ensureSummary(t.m);
    }),
    upsertMatches(upcoming),
    upsertMatches(finished),
  ]);

  report.upserted.upcoming = upcomingUpserts;
  report.upserted.finished = finishedUpserts;
  report.recommendations.reason = tally(
    aiResults.filter((_, i) => aiTasks[i].kind === "reason"),
  );
  report.recommendations.watchPoints = tally(
    aiResults.filter((_, i) => aiTasks[i].kind === "watch"),
  );
  report.summaries.summary = tally(
    aiResults.filter((_, i) => aiTasks[i].kind === "summary"),
  );

  report.durationMs = Date.now() - startedAt;
  return NextResponse.json({ ok: true, ...report });
}
