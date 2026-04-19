import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMatchById } from "@/services/matches";
import { getReasons, getWatchPoints } from "@/services/content";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const match = await getMatchById(params.id);
  if (!match) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [reasons, watchPoints] = await Promise.all([
    getReasons(match),
    getWatchPoints(match),
  ]);

  return NextResponse.json({ match, reasons, watchPoints });
}
