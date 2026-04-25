import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMatchById } from "@/services/matches";
import { getMatchContent } from "@/services/content";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const match = await getMatchById(params.id);
  if (!match) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { headline, tags, story, keyBattles, tacticalHinge, theNumber, contextData, summary } =
    await getMatchContent(match);

  return NextResponse.json({
    match,
    headline,
    tags,
    story,
    keyBattles,
    tacticalHinge,
    theNumber,
    contextData,
    summary,
  });
}
