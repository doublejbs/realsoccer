import { ImageResponse } from "next/og";
import { getMatchById } from "@/services/matches";

export const runtime = "nodejs";
export const alt = "realsoccer match";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LEAGUE_KO: Record<string, string> = {
  PL: "프리미어리그",
  PD: "라리가",
  BL1: "분데스리가",
  SA: "세리에A",
  FL1: "리그1",
  CL: "챔피언스리그",
};

export default async function MatchOG({
  params,
}: {
  params: { id: string };
}) {
  const match = await getMatchById(params.id);

  // fallback: simple branded card
  if (!match) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#0A0A0B",
            color: "#FAFAFA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 80,
            fontFamily: "serif",
            fontStyle: "italic",
          }}
        >
          missed it.
        </div>
      ),
      { ...size },
    );
  }

  const home = match.homeTeam.shortName ?? match.homeTeam.name;
  const away = match.awayTeam.shortName ?? match.awayTeam.name;
  const league = LEAGUE_KO[match.leagueCode] ?? match.leagueCode;
  const kickoff = new Date(match.kickoffAt).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const finished = match.status === "FINISHED";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A0B",
          color: "#FAFAFA",
          display: "flex",
          flexDirection: "column",
          padding: "56px 72px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* top row: brand + league */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              fontFamily: "serif",
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: "-0.03em",
            }}
          >
            realsoccer
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: 9,
                background: "#D4FF4A",
                marginLeft: 2,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              color: "#A1A1AA",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              border: "1px solid #26262A",
              padding: "6px 14px",
            }}
          >
            {league}
          </div>
        </div>

        {/* center: teams vs teams */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* VS block */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 40,
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "flex-end",
                fontFamily: "serif",
                fontWeight: 700,
                fontSize: 96,
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
                maxWidth: 420,
                textAlign: "right",
              }}
            >
              {home}
            </div>
            <div
              style={{
                fontFamily: "serif",
                fontStyle: "italic",
                fontSize: 72,
                color: "#52525B",
                fontWeight: 400,
              }}
            >
              vs
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                fontFamily: "serif",
                fontWeight: 700,
                fontSize: 96,
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
                maxWidth: 420,
              }}
            >
              {away}
            </div>
          </div>

          {/* score or kickoff */}
          {finished ? (
            <div
              style={{
                marginTop: 36,
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 72,
                  color: "#FAFAFA",
                }}
              >
                {match.homeScore}
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 22,
                  color: "#71717A",
                  letterSpacing: "0.2em",
                }}
              >
                FT
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 72,
                  color: "#FAFAFA",
                }}
              >
                {match.awayScore}
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: 36,
                fontFamily: "monospace",
                fontSize: 30,
                color: "#D4FF4A",
                letterSpacing: "0.1em",
              }}
            >
              KICKOFF · {kickoff}
            </div>
          )}
        </div>

        {/* bottom tagline */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontFamily: "monospace",
            fontSize: 18,
            color: "#71717A",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            borderTop: "1px solid #26262A",
            paddingTop: 22,
          }}
        >
          <span>{finished ? "5줄 요약 · 관전 포인트" : "보는 이유 · 관전 포인트"}</span>
          <span style={{ color: "#A1A1AA" }}>realsoccer</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
