import { Suspense } from "react";
import Link from "next/link";
import { TopBar } from "@/components/ui/TopBar";
import { UserMenu } from "@/components/UserMenu";
import { MatchHero } from "@/components/MatchHero";
import { Skeleton } from "@/components/ui/Skeleton";
import { TeamCrest } from "@/components/TeamCrest";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { RecentFinishedList } from "@/components/RecentFinishedList";
import { requireUser } from "@/lib/auth";
import {
  getRecentFinishedMatches,
  getTodaysMatches,
} from "@/services/matches";
import { rankMatches } from "@/services/recommendation";
import { getHeadline, getReasons, getTags } from "@/services/content";
import { formatKickoff } from "@/lib/time";
import type { MatchDTO, UserPreferencesDTO } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireUser();

  const prefs = user.preferences;
  const prefsEmpty =
    !prefs ||
    (prefs.favoriteLeagues.length === 0 &&
      prefs.favoriteTeams.length === 0 &&
      prefs.favoriteStyles.length === 0);
  const today = new Date();
  const dateLabel = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
  const issueNo = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000,
  );

  return (
    <div>
      <TopBar
        rightSlot={
          <UserMenu
            displayName={user.displayName}
            avatarUrl={user.avatarUrl}
          />
        }
      />

      <main className="mx-auto max-w-screen-sm px-5 pb-24 pt-8">
        <section className="rise rise-1">
          <div className="flex items-start justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-mute">
              ISSUE {String(issueNo).padStart(3, "0")} · {dateLabel}
            </div>
          </div>
          <h1 className="mt-3 font-display tracking-tightest text-ink">
            <span className="block text-[11px] font-normal uppercase tracking-[0.3em] text-accent font-mono">
              realsoccer
            </span>
            <span className="block text-5xl font-semibold italic leading-none sm:text-6xl">
              Pick
            </span>
          </h1>
        </section>

        <p className="mt-5 max-w-md text-pretty text-ink-dim rise rise-2">
          다가오는 경기 중 <em className="not-italic text-ink">딱 하나</em>만 고른다면.
        </p>

        {prefsEmpty && (
          <div className="mt-6 rise rise-2">
            <OnboardingBanner />
          </div>
        )}

        <Suspense fallback={<TodayMatchesSkeleton />}>
          <TodayMatchesSection prefs={prefs} />
        </Suspense>

        <Suspense fallback={<RecentFinishedSkeleton />}>
          <RecentFinishedSection />
        </Suspense>
      </main>
    </div>
  );
}

// --- 비동기 섹션 컴포넌트 ---

async function TodayMatchesSection({
  prefs,
}: {
  prefs: UserPreferencesDTO | null;
}) {
  const matches = await getTodaysMatches();
  const ranked = rankMatches(matches, prefs);
  const top = ranked[0];
  const rest = ranked.slice(1, 4);

  return (
    <div className="no-rise">
      <div className="mt-8">
        {top ? (
          <Suspense
            fallback={
              <MatchHero match={top.match} href={`/matches/${top.match.id}`} loading />
            }
          >
            <TopMatchContent match={top.match} href={`/matches/${top.match.id}`} />
          </Suspense>
        ) : (
          <EmptyState />
        )}
      </div>

      {rest.length > 0 && (
        <section className="mt-16">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-mute">
              그 외의 주목할 경기
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              {rest.length} matches
            </span>
          </div>
          <ul className="border-t border-hairline">
            {rest.map((r, i) => (
              <SecondaryMatchRow key={r.match.id} index={i + 2} ranked={r} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

async function RecentFinishedSection() {
  const matches = await getRecentFinishedMatches();
  if (matches.length === 0) return null;
  return (
    <div className="no-rise mt-16">
      <RecentFinishedList matches={matches} />
    </div>
  );
}

async function TopMatchContent({ match, href }: { match: MatchDTO; href: string }) {
  const [reasons, headline, tags] = await Promise.all([
    getReasons(match),
    getHeadline(match),
    getTags(match),
  ]);
  return (
    <MatchHero
      match={match}
      headline={headline}
      tags={tags}
      reasonLead={reasons?.[0]}
      href={href}
    />
  );
}

// --- 스켈레톤 ---

function TodayMatchesSkeleton() {
  return (
    <>
      <div className="mt-8">
        <article className="relative flex flex-col overflow-hidden border border-border bg-surface p-5 sm:p-8">
          <span className="pointer-events-none absolute -left-px -top-px size-2 border-l border-t border-accent" />
          <span className="pointer-events-none absolute -right-px -top-px size-2 border-r border-t border-accent" />
          <span className="pointer-events-none absolute -bottom-px -left-px size-2 border-b border-l border-accent" />
          <span className="pointer-events-none absolute -bottom-px -right-px size-2 border-b border-r border-accent" />

          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28 rounded-none" />
            <Skeleton className="h-4 w-16 rounded-none" />
          </div>

          <div className="mt-6">
            <Skeleton className="h-3 w-8 rounded-none" />
            <div className="mt-2 flex items-center gap-4">
              <Skeleton className="size-11 shrink-0 rounded-none" />
              <Skeleton className="h-9 w-40 rounded-none" />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-hairline" />
            <span className="font-display text-xl italic text-ink-faint">vs</span>
            <span className="h-px flex-1 bg-hairline" />
          </div>

          <div className="mt-6">
            <Skeleton className="h-3 w-8 rounded-none" />
            <div className="mt-2 flex items-center gap-4">
              <Skeleton className="size-11 shrink-0 rounded-none" />
              <Skeleton className="h-9 w-40 rounded-none" />
            </div>
          </div>

          <div className="mt-7 space-y-2">
            <Skeleton className="h-6 w-full rounded-none" />
            <Skeleton className="h-6 w-3/4 rounded-none" />
          </div>

          <div className="mt-7 flex items-center justify-between">
            <Skeleton className="h-3 w-20 rounded-none" />
            <Skeleton className="h-3 w-14 rounded-none" />
          </div>
        </article>
      </div>

      <div className="mt-16">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-3 w-32 rounded-none" />
          <Skeleton className="h-3 w-16 rounded-none" />
        </div>
        <ul className="border-t border-hairline">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-3 border-b border-hairline py-4">
              <Skeleton className="h-3 w-5 shrink-0 rounded-none" />
              <div className="flex shrink-0 items-center gap-1">
                <Skeleton className="size-[22px] rounded-none" />
                <Skeleton className="size-[22px] rounded-none" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36 rounded-none" />
                <Skeleton className="h-3 w-24 rounded-none" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function RecentFinishedSkeleton() {
  return (
    <div className="mt-16">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-3 w-36 rounded-none" />
        <Skeleton className="h-3 w-16 rounded-none" />
      </div>
      <ul className="border-t border-hairline">
        {[0, 1].map((i) => (
          <li key={i} className="flex items-center gap-3 border-b border-hairline py-4">
            <Skeleton className="h-3 w-5 shrink-0 rounded-none" />
            <div className="flex shrink-0 items-center gap-1">
              <Skeleton className="size-[22px] rounded-none" />
              <Skeleton className="size-[22px] rounded-none" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36 rounded-none" />
              <Skeleton className="h-3 w-24 rounded-none" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- 공통 컴포넌트 ---

function SecondaryMatchRow({
  index,
  ranked,
}: {
  index: number;
  ranked: { match: MatchDTO; score: number };
}) {
  const m = ranked.match;
  const k = formatKickoff(m.kickoffAt);

  return (
    <li className="border-b border-hairline">
      <Link
        href={`/matches/${m.id}`}
        className="group flex items-center gap-3 py-4 transition-colors hover:bg-surface"
      >
        <span className="shrink-0 w-6 font-mono text-xs text-ink-faint num">
          {String(index).padStart(2, "0")}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <TeamCrest
            src={m.homeTeam.crestUrl}
            alt={m.homeTeam.name}
            size={22}
          />
          <TeamCrest
            src={m.awayTeam.crestUrl}
            alt={m.awayTeam.name}
            size={22}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
            <span className="font-display text-base font-semibold text-ink sm:text-lg">
              {m.homeTeam.shortName}
            </span>
            <span className="font-display text-sm italic text-ink-faint">
              vs
            </span>
            <span className="font-display text-base font-semibold text-ink sm:text-lg">
              {m.awayTeam.shortName}
            </span>
          </div>
          <div className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-mute">
            {m.leagueCode} · {k.date} {k.time}
          </div>
        </div>
        <span className="shrink-0 font-mono text-xs text-ink-faint transition-colors group-hover:text-accent">
          →
        </span>
      </Link>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border bg-surface p-10 text-center">
      <div className="font-display text-2xl text-ink-dim">오늘은 경기가 없어요.</div>
      <p className="mt-2 text-sm text-ink-mute">내일 다시 들러주세요.</p>
    </div>
  );
}
