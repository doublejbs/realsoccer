import Link from "next/link";
import { MatchRow } from "@/components/MatchRow";
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
          <MatchRow key={m.id} match={m} index={i + 1} />
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
