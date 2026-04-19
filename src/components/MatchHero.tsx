import Link from "next/link";
import { Tag } from "@/components/ui/Tag";
import { TeamCrest } from "@/components/TeamCrest";
import { formatKickoff, hoursUntil } from "@/lib/time";
import type { MatchDTO } from "@/types";

const LEAGUE_LABEL: Record<string, string> = {
  PL: "Premier League",
  PD: "LaLiga",
  BL1: "Bundesliga",
  SA: "Serie A",
  FL1: "Ligue 1",
  CL: "Champions League",
};

export function MatchHero({
  match,
  reasonLead,
  href,
}: {
  match: MatchDTO;
  reasonLead?: string;
  href?: string;
}) {
  const k = formatKickoff(match.kickoffAt);
  const h = hoursUntil(match.kickoffAt);
  const liveish = match.status === "IN_PLAY" || match.status === "PAUSED";
  const finished = match.status === "FINISHED";

  const content = (
    <article className="group relative flex flex-col overflow-hidden border border-border bg-surface p-5 transition-colors hover:border-ink-mute sm:p-8">
      {/* corner ticks */}
      <span className="pointer-events-none absolute -left-px -top-px size-2 border-l border-t border-accent" />
      <span className="pointer-events-none absolute -right-px -top-px size-2 border-r border-t border-accent" />
      <span className="pointer-events-none absolute -bottom-px -left-px size-2 border-b border-l border-accent" />
      <span className="pointer-events-none absolute -bottom-px -right-px size-2 border-b border-r border-accent" />

      {/* meta row */}
      <div className="flex items-center justify-between gap-3 rise rise-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <Tag className="truncate">
            {LEAGUE_LABEL[match.leagueCode] ?? match.leagueCode}
          </Tag>
          {liveish ? (
            <Tag tone="live">LIVE</Tag>
          ) : h <= 3 && !finished ? (
            <Tag tone="soon">IN {h}H</Tag>
          ) : (
            <Tag>{k.date.toUpperCase()}</Tag>
          )}
        </div>
        <span className="shrink-0 font-mono text-xs text-ink-mute num">
          {k.time}
        </span>
      </div>

      {/* HOME block */}
      <TeamBlock
        label="HOME"
        team={match.homeTeam}
        delay="rise-2"
      />

      {/* vs divider */}
      <div className="mt-5 flex items-center gap-3 rise rise-2">
        <span className="h-px flex-1 bg-hairline" />
        <span className="font-display text-xl italic text-ink-faint">vs</span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      {/* AWAY block */}
      <TeamBlock
        label="AWAY"
        team={match.awayTeam}
        delay="rise-3"
      />

      {finished && (
        <div className="mt-6 flex items-center justify-center gap-3 border-y border-hairline py-3 rise rise-3">
          <span className="font-mono text-3xl num">{match.homeScore}</span>
          <span className="font-mono text-xs text-ink-mute">FT</span>
          <span className="font-mono text-3xl num">{match.awayScore}</span>
        </div>
      )}

      {reasonLead && (
        <p className="mt-7 text-pretty font-display text-lg leading-snug text-ink-dim rise rise-3 sm:text-xl">
          <span className="mr-2 text-accent">/</span>
          {reasonLead}
        </p>
      )}

      {href && (
        <div className="mt-7 flex items-center justify-between gap-3 rise rise-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute">
            오늘의 추천
          </span>
          <span className="link-underline shrink-0 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors group-hover:text-accent">
            상세 보기 →
          </span>
        </div>
      )}
    </article>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function TeamBlock({
  label,
  team,
  delay,
}: {
  label: "HOME" | "AWAY";
  team: MatchDTO["homeTeam"];
  delay: string;
}) {
  return (
    <div className={`mt-6 rise ${delay}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-mute">
        {label}
      </div>
      <div className="mt-2 flex items-center gap-4">
        <TeamCrest
          src={team.crestUrl}
          alt={team.name}
          size={44}
          className="shrink-0"
        />
        <div
          className="min-w-0 flex-1 break-keep font-display text-[clamp(1.75rem,7.5vw,2.75rem)] font-semibold leading-[1.02] tracking-tightest"
          title={team.name}
        >
          {team.shortName ?? team.name}
        </div>
      </div>
    </div>
  );
}
