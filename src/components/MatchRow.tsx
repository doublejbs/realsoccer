import Link from "next/link";
import { TeamCrest } from "@/components/TeamCrest";
import { formatKickoff } from "@/lib/time";
import type { MatchDTO } from "@/types";

/**
 * 미니 scoreboard 리스트 행 — 각 팀은 크레스트 위, 이름 아래의 수직 atom.
 *
 *   01        [🔴]        15:30         [🔵]
 *          Liverpool                  Man City
 *                    PL · 오늘
 *
 * 종료 경기는 가운데가 스코어로 교체:
 *
 *   01        [🔴]        2 – 1         [🔵]
 *          Liverpool                  Man City
 *                     PL · FT
 */
export function MatchRow({
  match,
  index,
}: {
  match: MatchDTO;
  index?: number;
}) {
  const k = formatKickoff(match.kickoffAt);
  const finished = match.status === "FINISHED";
  const liveish =
    match.status === "IN_PLAY" || match.status === "PAUSED";

  const meta = [
    match.leagueCode,
    k.date,
    liveish ? "LIVE" : finished ? "FT" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="border-b border-hairline">
      <Link
        href={`/matches/${match.id}`}
        className="group flex items-start gap-3 py-4 transition-colors hover:bg-surface/60"
      >
        {typeof index === "number" && (
          <span className="mt-[9px] w-6 shrink-0 font-mono text-[10px] text-ink-faint num">
            {String(index).padStart(2, "0")}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
            {/* HOME column */}
            <TeamColumn
              name={match.homeTeam.shortName ?? match.homeTeam.name}
              crestUrl={match.homeTeam.crestUrl}
              alt={match.homeTeam.name}
            />

            {/* Center — vertically aligned to crest height (28px) */}
            <div className="flex h-7 items-center">
              <Center
                finished={finished}
                liveish={liveish}
                time={k.time}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
              />
            </div>

            {/* AWAY column */}
            <TeamColumn
              name={match.awayTeam.shortName ?? match.awayTeam.name}
              crestUrl={match.awayTeam.crestUrl}
              alt={match.awayTeam.name}
            />
          </div>

          <div className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-ink-mute">
            {meta}
          </div>
        </div>
      </Link>
    </li>
  );
}

function TeamColumn({
  name,
  crestUrl,
  alt,
}: {
  name: string;
  crestUrl?: string | null;
  alt: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
      <TeamCrest src={crestUrl} alt={alt} size={28} className="shrink-0" />
      <span
        className="max-w-full truncate font-display text-sm font-semibold leading-tight text-ink transition-colors group-hover:text-accent sm:text-base"
        title={alt}
      >
        {name}
      </span>
    </div>
  );
}

function Center({
  finished,
  liveish,
  time,
  homeScore,
  awayScore,
}: {
  finished: boolean;
  liveish: boolean;
  time: string;
  homeScore: number | null;
  awayScore: number | null;
}) {
  if (finished) {
    return (
      <div className="flex items-center gap-1.5 font-mono font-semibold tabular-nums text-ink">
        <span className="text-lg">{homeScore ?? "–"}</span>
        <span className="text-xs font-normal text-ink-faint">–</span>
        <span className="text-lg">{awayScore ?? "–"}</span>
      </div>
    );
  }

  if (liveish) {
    return (
      <div className="flex items-center gap-1.5 font-mono font-semibold tabular-nums text-signal-live">
        <span className="text-lg">{homeScore ?? 0}</span>
        <span className="text-xs font-normal">–</span>
        <span className="text-lg">{awayScore ?? 0}</span>
      </div>
    );
  }

  return (
    <span className="whitespace-nowrap font-mono text-sm font-medium tabular-nums text-accent">
      {time}
    </span>
  );
}
