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

  const content = (
    <article className="group relative flex flex-col border border-border bg-surface p-6 transition-colors hover:border-ink-mute sm:p-8">
      {/* corner ticks */}
      <span className="absolute -left-px -top-px size-2 border-l border-t border-accent" />
      <span className="absolute -right-px -top-px size-2 border-r border-t border-accent" />
      <span className="absolute -bottom-px -left-px size-2 border-b border-l border-accent" />
      <span className="absolute -bottom-px -right-px size-2 border-b border-r border-accent" />

      <div className="flex items-center justify-between gap-4 rise rise-1">
        <div className="flex items-center gap-2">
          <Tag>{LEAGUE_LABEL[match.leagueCode] ?? match.leagueCode}</Tag>
          {liveish ? (
            <Tag tone="live">LIVE</Tag>
          ) : h <= 3 ? (
            <Tag tone="soon">KICKOFF IN {h}H</Tag>
          ) : (
            <Tag>{k.date.toUpperCase()}</Tag>
          )}
        </div>
        <span className="font-mono text-xs text-ink-mute num">
          {k.time}
        </span>
      </div>

      <div className="mt-8 flex items-end justify-between gap-6 rise rise-2">
        <div className="flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute">
            HOME
          </div>
          <div className="mt-2 flex items-center gap-3">
            <TeamCrest
              src={match.homeTeam.crestUrl}
              alt={match.homeTeam.name}
              size={48}
            />
            <div className="font-display text-display-md font-semibold leading-none">
              {match.homeTeam.shortName ?? match.homeTeam.name}
            </div>
          </div>
        </div>
        <div className="pb-2 font-display text-5xl italic text-ink-faint">
          vs
        </div>
        <div className="flex-1 text-right">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute">
            AWAY
          </div>
          <div className="mt-2 flex items-center justify-end gap-3">
            <div className="font-display text-display-md font-semibold leading-none">
              {match.awayTeam.shortName ?? match.awayTeam.name}
            </div>
            <TeamCrest
              src={match.awayTeam.crestUrl}
              alt={match.awayTeam.name}
              size={48}
            />
          </div>
        </div>
      </div>

      {match.status === "FINISHED" && (
        <div className="mt-6 flex items-center justify-center gap-3 border-y border-hairline py-3 rise rise-3">
          <span className="font-mono text-3xl num">{match.homeScore}</span>
          <span className="font-mono text-xs text-ink-mute">FT</span>
          <span className="font-mono text-3xl num">{match.awayScore}</span>
        </div>
      )}

      {reasonLead && (
        <p className="mt-8 text-pretty font-display text-xl leading-snug text-ink-dim rise rise-3 sm:text-2xl">
          <span className="mr-2 text-accent">/</span>
          {reasonLead}
        </p>
      )}

      {href && (
        <div className="mt-8 flex items-center justify-between rise rise-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute">
            오늘의 추천 · match.of.day
          </span>
          <span className="link-underline font-mono text-xs uppercase tracking-[0.15em] text-ink transition-all group-hover:text-accent">
            상세 보기 →
          </span>
        </div>
      )}
    </article>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
