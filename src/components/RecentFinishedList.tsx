import Link from "next/link";
import { TeamCrest } from "@/components/TeamCrest";
import { formatKickoff } from "@/lib/time";
import type { MatchDTO } from "@/types";

export function RecentFinishedList({ matches }: { matches: MatchDTO[] }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-mute">
          놓친 경기 따라잡기
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          RECENT · {matches.length}
        </span>
      </div>

      <ul className="border-t border-hairline">
        {matches.map((m, i) => (
          <FinishedRow key={m.id} match={m} index={i + 1} />
        ))}
      </ul>

      <Link
        href="/finished"
        className="group mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-mute transition-colors hover:text-accent"
      >
        <span>전체 보기</span>
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </Link>
    </div>
  );
}

function FinishedRow({ match, index }: { match: MatchDTO; index: number }) {
  const k = formatKickoff(match.kickoffAt);
  return (
    <li className="border-b border-hairline">
      <Link
        href={`/matches/${match.id}`}
        className="group flex items-center gap-3 py-4 transition-colors hover:bg-surface"
      >
        <span className="shrink-0 w-6 font-mono text-xs text-ink-faint num">
          {String(index).padStart(2, "0")}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <TeamCrest
            src={match.homeTeam.crestUrl}
            alt={match.homeTeam.name}
            size={22}
          />
          <TeamCrest
            src={match.awayTeam.crestUrl}
            alt={match.awayTeam.name}
            size={22}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
            <span className="font-display text-base font-semibold text-ink sm:text-lg">
              {match.homeTeam.shortName}
            </span>
            <span className="font-mono text-sm text-ink-dim num">
              {match.homeScore}-{match.awayScore}
            </span>
            <span className="font-display text-base font-semibold text-ink sm:text-lg">
              {match.awayTeam.shortName}
            </span>
          </div>
          <div className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-mute">
            {match.leagueCode} · {k.date} · 5줄 요약
          </div>
        </div>
        <span className="shrink-0 font-mono text-xs text-ink-faint transition-colors group-hover:text-accent">
          →
        </span>
      </Link>
    </li>
  );
}
