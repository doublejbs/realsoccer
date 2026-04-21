import Link from "next/link";
import { TopBar } from "@/components/ui/TopBar";
import { UserMenu } from "@/components/UserMenu";
import { MatchRow } from "@/components/MatchRow";
import { requireUser } from "@/lib/auth";
import { getFinishedMatchesPage } from "@/services/matches";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

function parsePage(raw: string | string[] | undefined): number {
  if (typeof raw !== "string") return 1;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function FinishedPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const user = await requireUser();
  const page = parsePage(searchParams.page);
  const { matches, total, pageCount, hasMore } = await getFinishedMatchesPage(
    page,
    PER_PAGE,
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
        <section className="flex items-baseline justify-between rise rise-1">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-mute">
              ARCHIVE
            </div>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tightest text-ink sm:text-5xl">
              종료된 경기
            </h1>
          </div>
          <div className="text-right font-mono text-xs text-ink-mute num">
            {total} MATCHES
          </div>
        </section>

        <p className="mt-4 text-pretty text-ink-dim rise rise-2">
          최신순으로 누적된 종료 경기. 상세로 들어가면 5줄 요약을 볼 수 있어.
        </p>

        {matches.length === 0 ? (
          <div className="mt-8 border border-dashed border-border bg-surface p-10 text-center rise rise-3">
            <div className="font-display text-2xl text-ink-dim">
              아직 종료된 경기가 없어요.
            </div>
          </div>
        ) : (
          <ul className="mt-8 border-t border-hairline rise rise-3">
            {matches.map((m, i) => (
              <MatchRow
                key={m.id}
                match={m}
                index={(page - 1) * PER_PAGE + i + 1}
              />
            ))}
          </ul>
        )}

        {pageCount > 1 && (
          <nav className="mt-8 flex items-center justify-between rise rise-4">
            <PageLink label="← 이전" target={page - 1} disabled={page <= 1} />
            <span className="font-mono text-xs text-ink-mute num">
              {page} / {pageCount}
            </span>
            <PageLink label="다음 →" target={page + 1} disabled={!hasMore} />
          </nav>
        )}

        <div className="mt-10 rise rise-5">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-mute transition-colors hover:text-accent"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">
              ←
            </span>
            <span>오늘의 경기로</span>
          </Link>
        </div>
      </main>
    </div>
  );
}

function PageLink({
  label,
  target,
  disabled,
}: {
  label: string;
  target: number;
  disabled: boolean;
}) {
  if (disabled) {
    return (
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={`/finished?page=${target}`}
      className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink transition-colors hover:text-accent"
    >
      {label}
    </Link>
  );
}

