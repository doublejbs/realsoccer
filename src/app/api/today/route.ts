import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTodaysMatches } from "@/services/matches";
import { pickTopMatch } from "@/services/recommendation";
import { getReasons, getWatchPoints } from "@/services/content";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const matches = await getTodaysMatches();
  const top = pickTopMatch(matches, user.preferences ?? null);
  if (!top) return NextResponse.json({ match: null });

  const [reasons, watchPoints] = await Promise.all([
    getReasons(top.match),
    getWatchPoints(top.match),
  ]);

  return NextResponse.json({
    match: top.match,
    reasons,
    watchPoints,
    score: top.score,
  });
}
