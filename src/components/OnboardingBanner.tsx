import Link from "next/link";

export function OnboardingBanner() {
  return (
    <Link
      href="/settings"
      className="group relative flex items-center justify-between gap-4 border border-accent/60 bg-accent/5 p-4 transition-colors hover:bg-accent/10 sm:p-5"
    >
      <span className="absolute left-0 top-0 h-full w-1 bg-accent" />

      <div className="pl-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
          START — 1 MIN SETUP
        </div>
        <div className="mt-1.5 font-display text-lg font-semibold text-ink sm:text-xl">
          좋아하는 팀·리그를 알려주세요.
        </div>
        <div className="mt-0.5 text-sm text-ink-dim">
          추천이 당신의 취향에 맞춰집니다.
        </div>
      </div>

      <span className="shrink-0 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-transform group-hover:translate-x-1">
        설정 →
      </span>
    </Link>
  );
}
