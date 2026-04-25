import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/ui/TopBar";
import { UserMenu } from "@/components/UserMenu";
import { MatchHero } from "@/components/MatchHero";
import {
  MatchNewsSection,
  MatchNewsSkeleton,
} from "@/components/MatchNewsSection";
import { requireUser } from "@/lib/auth";
import { getMatchById } from "@/services/matches";
import { getMatchContent } from "@/services/content";
import type { KeyBattle, TheNumber } from "@/services/content";
import type { MatchContextData } from "@/types";

export const dynamic = "force-dynamic";

const LEAGUE_KO: Record<string, string> = {
  PL: "프리미어리그",
  PD: "라리가",
  BL1: "분데스리가",
  SA: "세리에A",
  FL1: "리그1",
  CL: "챔피언스리그",
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const match = await getMatchById(params.id);
  if (!match) return { title: "경기를 찾을 수 없습니다" };

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

  const title = `${home} vs ${away}`;
  const description =
    match.status === "FINISHED"
      ? `${league} · 최종 ${match.homeScore}-${match.awayScore} · 5줄 요약 보기`
      : `${league} · ${kickoff} 킥오프 · 왜 봐야 하는지, 무엇을 볼지.`;
  const ogPath = `/matches/${params.id}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} · realsoccer`,
      description,
      type: "article",
      url: `/matches/${params.id}`,
      images: [{ url: ogPath, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · realsoccer`,
      description,
      images: [ogPath],
    },
  };
}

export default async function MatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const match = await getMatchById(params.id);
  if (!match) notFound();

  const { headline, tags, story, keyBattles, tacticalHinge, theNumber, contextData, summary } =
    await getMatchContent(match);

  const hasSummary = match.status === "FINISHED" && !!summary;

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

      <main className="mx-auto max-w-screen-sm px-5 pb-28 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute hover:text-ink"
        >
          ← 오늘로 돌아가기
        </Link>

        <div className="mt-5 rise rise-1">
          <MatchHero match={match} headline={headline} tags={tags} />
        </div>

        {/* 팀 현황 — 폼 + 순위 + 주목 선수 */}
        {contextData && (
          <Section title="팀 현황" index="00" delay="rise-2">
            <TeamContextRow
              home={match.homeTeam.shortName ?? match.homeTeam.name}
              away={match.awayTeam.shortName ?? match.awayTeam.name}
              ctx={contextData}
            />
          </Section>
        )}

        {/* The Story */}
        {story && (
          <Section title="The Story" index="01" delay="rise-2">
            <p className="text-pretty font-display text-lg leading-relaxed text-ink-dim sm:text-xl">
              {story}
            </p>
          </Section>
        )}

        {/* Key Battle */}
        {keyBattles && keyBattles.length > 0 && (
          <Section title="Key Battle" index="02" delay="rise-3">
            <div className="flex flex-col gap-4">
              {keyBattles.map((b, i) => (
                <KeyBattleCard key={i} battle={b} />
              ))}
            </div>
          </Section>
        )}

        {/* Tactical Hinge */}
        {tacticalHinge && (
          <Section title="Tactical Hinge" index="03" delay="rise-3">
            <blockquote className="border-l-2 border-accent pl-4">
              <p className="font-display text-lg leading-snug text-ink sm:text-xl">
                {tacticalHinge}
              </p>
            </blockquote>
          </Section>
        )}

        {/* The Number */}
        {theNumber && (
          <Section title="The Number" index="04" delay="rise-4">
            <TheNumberCard number={theNumber} />
          </Section>
        )}

        {/* 5줄 요약 (종료 경기만) */}
        {hasSummary && summary && (
          <Section title="5줄 요약" index="05" delay="rise-4">
            <ol className="hairline-y border-l-2 border-accent pl-4">
              {summary.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="mt-1 font-mono text-[10px] text-ink-mute num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="flex-1 text-sm leading-relaxed text-ink">{s}</p>
                </li>
              ))}
            </ol>
          </Section>
        )}

        <Suspense fallback={<MatchNewsSkeleton />}>
          <MatchNewsSection match={match} />
        </Suspense>

        <div className="mt-16 flex items-center justify-between border-t border-hairline pt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          <span>match.id · {match.id}</span>
          <span>{match.status}</span>
        </div>
      </main>
    </div>
  );
}

// --- Sub-components ---

function KeyBattleCard({ battle }: { battle: KeyBattle }) {
  return (
    <div className="relative border border-hairline bg-surface p-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span className="font-display text-base font-semibold text-ink leading-tight">
          {battle.home}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent shrink-0">
          vs
        </span>
        <span className="font-display text-base font-semibold text-ink leading-tight text-right">
          {battle.away}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-dim border-t border-hairline pt-3">
        {battle.description}
      </p>
    </div>
  );
}

function TheNumberCard({ number }: { number: TheNumber }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-[clamp(3rem,12vw,5rem)] font-semibold leading-none tracking-tighter text-accent tabular-nums">
          {number.value}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute">
          {number.label}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-ink-dim border-t border-hairline pt-3">
        {number.context}
      </p>
    </div>
  );
}

function TeamContextRow({
  home,
  away,
  ctx,
}: {
  home: string;
  away: string;
  ctx: MatchContextData;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <TeamCtx name={home} form={ctx.homeForm} standing={ctx.homeStanding} side="home" />
        <TeamCtx name={away} form={ctx.awayForm} standing={ctx.awayStanding} side="away" />
      </div>

      {(ctx.homeTopPlayers?.length || ctx.awayTopPlayers?.length) ? (
        <div className="grid grid-cols-2 gap-4 border-t border-hairline pt-5">
          <PlayerList players={ctx.homeTopPlayers} side="home" />
          <PlayerList players={ctx.awayTopPlayers} side="away" />
        </div>
      ) : null}
    </div>
  );
}

function TeamCtx({
  name,
  form,
  standing,
  side,
}: {
  name: string;
  form: ("W" | "D" | "L")[];
  standing?: { position: number; points: number; played: number };
  side: "home" | "away";
}) {
  const align = side === "away" ? "items-end text-right" : "items-start";
  return (
    <div className={`flex flex-col gap-2 ${align}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute">
        {name}
      </span>
      {form.length > 0 && (
        <div className="flex gap-1">
          {form.slice(0, 5).map((r, i) => (
            <span
              key={i}
              className={`size-5 flex items-center justify-center font-mono text-[9px] font-bold
                ${r === "W" ? "bg-accent text-bg" : r === "D" ? "bg-ink-mute/20 text-ink-mute" : "bg-border text-ink-faint"}`}
            >
              {r}
            </span>
          ))}
        </div>
      )}
      {standing && (
        <span className="font-mono text-[10px] text-ink-dim num">
          {standing.position}위 · {standing.points}점
        </span>
      )}
    </div>
  );
}

function PlayerList({
  players,
  side,
}: {
  players?: { name: string; goals: number; assists: number; rating: number | null; position?: string }[];
  side: "home" | "away";
}) {
  if (!players?.length) return <div />;
  const align = side === "away" ? "items-end text-right" : "items-start";
  return (
    <div className={`flex flex-col gap-2 ${align}`}>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
        주목 선수
      </span>
      {players.map((p) => (
        <div key={p.name} className={`flex flex-col gap-0.5 ${align}`}>
          <span className="font-display text-sm font-semibold text-ink leading-tight">
            {p.name}
          </span>
          <span className="font-mono text-[10px] text-ink-mute num">
            {p.goals}G {p.assists}A
            {p.rating != null && (
              <span className="ml-1.5 text-accent">{p.rating.toFixed(1)}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  index,
  delay,
  children,
}: {
  title: string;
  index: string;
  delay: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`mt-12 rise ${delay}`}>
      <div className="mb-5 flex items-baseline gap-3 border-b border-hairline pb-3">
        <span className="font-mono text-[10px] text-accent">§ {index}</span>
        <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}
