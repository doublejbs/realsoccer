import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-screen-sm flex-col items-start justify-center px-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-mute">
        404 — OFFSIDE
      </div>
      <h1 className="mt-3 font-display text-display-lg font-semibold italic tracking-tightest">
        missed it.
      </h1>
      <p className="mt-4 text-ink-dim">찾으시는 경기가 없습니다.</p>
      <Link
        href="/"
        className="mt-8 link-underline font-mono text-xs uppercase tracking-[0.15em] text-ink"
      >
        오늘의 경기로 돌아가기 →
      </Link>
    </main>
  );
}
