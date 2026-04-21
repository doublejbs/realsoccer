import { Suspense } from "react";
import { TopBar } from "@/components/ui/TopBar";
import { UserMenu } from "@/components/UserMenu";
import { MatchHero } from "@/components/MatchHero";
import { MatchRow } from "@/components/MatchRow";
import { Skeleton } from "@/components/ui/Skeleton";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { RecentFinishedList } from "@/components/RecentFinishedList";
import { requireUser } from "@/lib/auth";
import {
  getRecentFinishedMatches,
  getTodaysMatches,
} from "@/services/matches";
import { rankMatches } from "@/services/recommendation";
import { getMatchContent } from "@/services/content";
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
              <MatchRow key={r.match.id} match={r.match} index={i + 2} />
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
  const { reasons, headline, tags } = await getMatchContent(match);
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

          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-28 rounded-none" />
          </div>

          {/* versus layout placeholder */}
          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-start gap-4 sm:mt-10 sm:gap-8">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="size-16 rounded-none" />
              <Skeleton className="h-2.5 w-8 rounded-none" />
              <Skeleton className="h-5 w-20 rounded-none" />
            </div>
            <div className="flex h-16 items-center sm:h-20">
              <span className="font-display text-2xl italic text-ink-faint sm:text-3xl">
                vs
              </span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="size-16 rounded-none" />
              <Skeleton className="h-2.5 w-8 rounded-none" />
              <Skeleton className="h-5 w-20 rounded-none" />
            </div>
          </div>

          {/* kickoff block placeholder */}
          <div className="mt-6 flex items-stretch justify-between gap-4 border-y border-hairline py-4">
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-16 rounded-none" />
              <Skeleton className="h-9 w-24 rounded-none sm:h-11" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="ml-auto h-2.5 w-10 rounded-none" />
              <Skeleton className="ml-auto h-5 w-24 rounded-none" />
              <Skeleton className="ml-auto h-2.5 w-14 rounded-none" />
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
            <MatchRowSkeleton key={i} />
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
          <MatchRowSkeleton key={i} />
        ))}
      </ul>
    </div>
  );
}

function MatchRowSkeleton() {
  return (
    <li className="flex items-start gap-3 border-b border-hairline py-4">
      <Skeleton className="mt-[9px] h-3 w-6 shrink-0 rounded-none" />
      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
          <div className="flex flex-col items-center gap-1.5">
            <Skeleton className="size-7 rounded-none" />
            <Skeleton className="h-4 w-16 rounded-none" />
          </div>
          <div className="flex h-7 items-center">
            <Skeleton className="h-4 w-10 rounded-none" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Skeleton className="size-7 rounded-none" />
            <Skeleton className="h-4 w-16 rounded-none" />
          </div>
        </div>
        <Skeleton className="mx-auto mt-2 h-2.5 w-24 rounded-none" />
      </div>
    </li>
  );
}

// --- 공통 컴포넌트 ---

function EmptyState() {
  return (
    <div className="border border-dashed border-border bg-surface p-10 text-center">
      <div className="font-display text-2xl text-ink-dim">오늘은 경기가 없어요.</div>
      <p className="mt-2 text-sm text-ink-mute">내일 다시 들러주세요.</p>
    </div>
  );
}
