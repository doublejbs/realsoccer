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
    </div>
  );
}

function FinishedRow({ match, index }: { match: MatchDTO; index: number }) {
  const k = formatKickoff(match.kickoffAt);
  return (
    <li className="border-b border-hairline">
      <Link
        href={`/matches/${match.id}`}
        className="group flex items-center gap-4 py-4 transition-colors hover:bg-surface"
      >
        <span className="w-6 font-mono text-xs text-ink-faint num">
          {String(index).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-1.5">
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
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-semibold text-ink">
              {match.homeTeam.shortName}
            </span>
            <span className="mx-1 font-mono text-sm text-ink-dim num">
              {match.homeScore} - {match.awayScore}
            </span>
            <span className="font-display text-lg font-semibold text-ink">
              {match.awayTeam.shortName}
            </span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-mute">
            {match.leagueCode} · {k.date} · 5줄 요약 보기
          </div>
        </div>
        <span className="font-mono text-xs text-ink-faint transition-colors group-hover:text-accent">
          →
        </span>
      </Link>
    </li>
  );
}
