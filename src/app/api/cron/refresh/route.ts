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

// Hobby 플랜 함수 타임아웃 상한 (60초)
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const TOP_N = 10;
const UPCOMING_DAYS = 7;
const FINISHED_LOOKBACK_DAYS = 2;

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

  // --- Part A: 7일 윈도우 전 경기를 DB에 sync + 상위 N개만 AI 사전 생성 ---
  try {
    const upcoming = await fetchUpcomingMatches(UPCOMING_DAYS);
    report.upserted.upcoming = await upsertMatches(upcoming);

    const topMatches = rankMatches(upcoming)
      .slice(0, TOP_N)
      .map((r) => r.match);
    report.recommendations.picked = topMatches.length;

    const reasonResults = await Promise.all(
      topMatches.map((m) => ensureReasons(m)),
    );
    const watchResults = await Promise.all(
      topMatches.map((m) => ensureWatchPoints(m)),
    );

    report.recommendations.reason = tally(reasonResults);
    report.recommendations.watchPoints = tally(watchResults);
  } catch (err) {
    console.error("[cron] recommendations phase failed", err);
  }

  // --- Part B: 최근 종료 경기 sync + summary 생성 ---
  try {
    const finished = await fetchRecentFinishedMatches(FINISHED_LOOKBACK_DAYS);
    report.upserted.finished = await upsertMatches(finished);

    const onlyFinished = finished.filter((m) => m.status === "FINISHED");
    report.summaries.picked = onlyFinished.length;

    const summaryResults = await Promise.all(
      onlyFinished.map((m) => ensureSummary(m)),
    );
    report.summaries.summary = tally(summaryResults);
  } catch (err) {
    console.error("[cron] summaries phase failed", err);
  }

  report.durationMs = Date.now() - startedAt;
  return NextResponse.json({ ok: true, ...report });
}
