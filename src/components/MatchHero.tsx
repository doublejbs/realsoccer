import Link from "next/link";
import { Tag } from "@/components/ui/Tag";
import { Skeleton } from "@/components/ui/Skeleton";
import { TeamCrest } from "@/components/TeamCrest";
import { cn } from "@/lib/cn";
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

export type MatchHeroLayout = "stack" | "versus";

export function MatchHero({
  match,
  headline,
  tags,
  reasonLead,
  href,
  loading = false,
  layout = "versus",
}: {
  match: MatchDTO;
  headline?: string | null;
  tags?: string[] | null;
  reasonLead?: string;
  href?: string;
  loading?: boolean;
  layout?: MatchHeroLayout;
}) {
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

      {/* meta row — 리그 · 라이브 상태 · AI 태그 */}
      <div className="flex min-w-0 flex-wrap items-center gap-1.5 rise rise-1">
        <Tag className="truncate">
          {LEAGUE_LABEL[match.leagueCode] ?? match.leagueCode}
        </Tag>
        {liveish && <Tag tone="live">LIVE</Tag>}
        {loading ? (
          <Skeleton className="h-4 w-20 rounded-none" />
        ) : (
          tags?.map((tag) => (
            <span
              key={tag}
              className="border border-accent/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-accent"
            >
              {tag}
            </span>
          ))
        )}
      </div>

      {layout === "versus" ? (
        <VersusLayout match={match} />
      ) : (
        <StackLayout match={match} />
      )}

      {finished ? (
        <div className="mt-6 flex items-center justify-center gap-3 border-y border-hairline py-3 rise rise-3">
          <span className="font-mono text-3xl num">{match.homeScore}</span>
          <span className="font-mono text-xs text-ink-mute">FT</span>
          <span className="font-mono text-3xl num">{match.awayScore}</span>
        </div>
      ) : liveish ? (
        <div className="mt-6 flex items-center justify-center gap-3 border-y border-signal-live/40 py-3 rise rise-3">
          <span className="font-mono text-3xl num text-signal-live">
            {match.homeScore ?? 0}
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-signal-live">
            LIVE
          </span>
          <span className="font-mono text-3xl num text-signal-live">
            {match.awayScore ?? 0}
          </span>
        </div>
      ) : (
        <KickoffBlock kickoffAt={match.kickoffAt} hoursTo={h} />
      )}

      {loading ? (
        <div className="mt-7 space-y-2">
          <Skeleton className="h-6 w-full rounded-none" />
          <Skeleton className="h-6 w-3/4 rounded-none" />
        </div>
      ) : (
        <>
          {headline && (
            <p className="mt-7 font-display text-xl font-semibold leading-snug text-ink rise rise-3 sm:text-2xl">
              {headline}
            </p>
          )}
          {!headline && reasonLead && (
            <p className="mt-7 text-pretty font-display text-lg leading-snug text-ink-dim rise rise-3 sm:text-xl">
              <span className="mr-2 text-accent">/</span>
              {reasonLead}
            </p>
          )}
        </>
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

/* ─────────────────────────────────────────────────────────────
 * Kickoff block — upcoming match의 시간·날짜 focal 블록
 * ──────────────────────────────────────────────────────────── */
function KickoffBlock({
  kickoffAt,
  hoursTo,
}: {
  kickoffAt: string;
  hoursTo: number;
}) {
  const k = formatKickoff(kickoffAt);
  const imminent = hoursTo <= 3;
  const soon = !imminent && hoursTo <= 24;

  return (
    <div className="mt-6 flex items-stretch justify-between gap-4 border-y border-hairline py-4 rise rise-3">
      <div className="flex flex-col items-start">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-mute">
          KICKOFF
        </span>
        <span className="mt-1.5 font-mono text-4xl font-semibold leading-none tabular-nums text-ink sm:text-5xl">
          {k.time}
        </span>
      </div>

      <div className="flex flex-col items-end text-right">
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.2em]",
            imminent
              ? "text-accent"
              : soon
                ? "text-ink"
                : "text-ink-mute",
          )}
        >
          {imminent
            ? `IN ${hoursTo}H`
            : soon
              ? `IN ${hoursTo}H`
              : k.date}
        </span>
        <span className="mt-1.5 font-display text-xl italic font-medium leading-none text-ink-dim sm:text-2xl">
          {k.date} · {k.weekday}
        </span>
        <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
          KST · GMT+9
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Stack layout (home page) — 수직 스택, 풀폭 팀명
 * ──────────────────────────────────────────────────────────── */
function StackLayout({ match }: { match: MatchDTO }) {
  return (
    <>
      <TeamBlock label="HOME" team={match.homeTeam} delay="rise-2" />
      <div className="mt-5 flex items-center gap-3 rise rise-2">
        <span className="h-px flex-1 bg-hairline" />
        <span className="font-display text-xl italic text-ink-faint">vs</span>
        <span className="h-px flex-1 bg-hairline" />
      </div>
      <TeamBlock label="AWAY" team={match.awayTeam} delay="rise-3" />
    </>
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

/* ─────────────────────────────────────────────────────────────
 * Versus layout (match detail) — 가로 3-column, 각 팀은 수직 스택
 * 크레스트가 시각 앵커. 팀명이 크레스트 아래 정렬.
 * ──────────────────────────────────────────────────────────── */
function VersusLayout({ match }: { match: MatchDTO }) {
  return (
    <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-start gap-4 rise rise-2 sm:mt-10 sm:gap-8">
      <TeamColumn team={match.homeTeam} label="HOME" />
      <div className="flex h-16 items-center sm:h-20">
        <span className="font-display text-2xl italic text-ink-faint sm:text-3xl">
          vs
        </span>
      </div>
      <TeamColumn team={match.awayTeam} label="AWAY" />
    </div>
  );
}

function TeamColumn({
  team,
  label,
}: {
  team: MatchDTO["homeTeam"];
  label: "HOME" | "AWAY";
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-3 text-center">
      <TeamCrest
        src={team.crestUrl}
        alt={team.name}
        size={64}
        className="shrink-0"
      />
      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-faint">
        {label}
      </div>
      <div
        className="w-full break-keep text-balance font-display text-[clamp(0.95rem,4.5vw,1.375rem)] font-semibold leading-[1.15] tracking-tight text-ink"
        title={team.name}
      >
        {team.shortName ?? team.name}
      </div>
    </div>
  );
}
