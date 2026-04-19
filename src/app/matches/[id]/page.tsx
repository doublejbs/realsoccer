import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/ui/TopBar";
import { UserMenu } from "@/components/UserMenu";
import { MatchHero } from "@/components/MatchHero";
import { requireUser } from "@/lib/auth";
import { getMatchById } from "@/services/matches";
import { getReasons, getSummary, getWatchPoints } from "@/services/content";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const match = await getMatchById(params.id);
  if (!match) notFound();

  const [reasons, watchPoints] = await Promise.all([
    getReasons(match),
    getWatchPoints(match),
  ]);
  const summary =
    match.status === "FINISHED" ? await getSummary(match) : null;

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
          <MatchHero match={match} />
        </div>

        <Section title="보는 이유" index="01" delay="rise-2">
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

        <Section title="관전 포인트" index="02" delay="rise-3">
          <ul className="grid gap-3 sm:grid-cols-1">
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

        {summary && (
          <Section title="5줄 요약" index="03" delay="rise-4">
            <ol className="hairline-y border-l-2 border-accent pl-4">
              {summary.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="mt-1 font-mono text-[10px] text-ink-mute num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="flex-1 text-sm leading-relaxed text-ink">
                    {s}
                  </p>
                </li>
              ))}
            </ol>
          </Section>
        )}

        <div className="mt-16 flex items-center justify-between border-t border-hairline pt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          <span>match.id · {match.id}</span>
          <span>{match.status}</span>
        </div>
      </main>
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
    <section className={`mt-14 rise ${delay}`}>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-tightest text-ink">
          {title}
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          § {index}
        </span>
      </div>
      {children}
    </section>
  );
}
