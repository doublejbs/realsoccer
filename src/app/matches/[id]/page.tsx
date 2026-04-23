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

  const { reasons, watchPoints, headline, tags, contextData, summary } =
    await getMatchContent(match);

  const sectionIndex = { reasons: "01", watchPoints: "02", summary: "03" };
  // 종료 경기가 아니면 summary는 설령 DB에 있더라도 표시하지 않음.
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

        {/* 폼 + 순위 컨텍스트 */}
        {contextData && (
          <Section title="팀 현황" index="00" delay="rise-2">
            <TeamContextRow
              home={match.homeTeam.shortName ?? match.homeTeam.name}
              away={match.awayTeam.shortName ?? match.awayTeam.name}
              ctx={contextData}
            />
          </Section>
        )}

        {reasons && (
          <Section title="보는 이유" index={sectionIndex.reasons} delay="rise-2">
            <ol className="hairline-y">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-4 py-4">
                  <span className="mt-1 font-mono text-[10px] text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="flex-1 text-pretty font-display text-lg leading-snug text-ink sm:text-xl">
                    {r}
                  </p>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {watchPoints && (
          <Section title="관전 포인트" index={sectionIndex.watchPoints} delay="rise-3">
            <ul className="grid gap-3">
              {watchPoints.map((w, i) => (
                <li
                  key={i}
                  className="relative border border-hairline bg-surface p-4 pl-14"
                >
                  <span className="absolute left-3 top-3 font-display text-3xl font-semibold italic leading-none text-accent">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-ink-dim">{w}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {hasSummary && summary && (
          <Section title="5줄 요약" index={sectionIndex.summary} delay="rise-4">
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
  players?: { name: string; goals: number; assists: number; rating: number | null }[];
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
