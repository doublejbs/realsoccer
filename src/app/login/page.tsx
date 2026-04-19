import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Backdrop typographic decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 select-none whitespace-nowrap font-display text-[min(38vw,22rem)] font-semibold italic leading-none tracking-tightest text-elevated opacity-60"
      >
        kickoff.
      </div>

      {/* grid of dots on top right */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-40 w-40 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, #26262a 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        }}
      />

      <header className="z-10 mx-auto flex w-full max-w-screen-sm items-center justify-between px-5 pt-6">
        <div className="flex items-baseline gap-1.5 font-display text-xl font-semibold tracking-tightest">
          realsoccer
          <span className="inline-block size-1.5 rounded-full bg-accent" />
        </div>
        <span className="bracket">KR · EU</span>
      </header>

      <section className="z-10 mx-auto flex w-full max-w-screen-sm flex-1 flex-col justify-center px-5 pb-24 pt-20">
        <div className="rise rise-1 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-mute">
          No. 01 — <span className="text-ink-dim">DAILY MATCH CURATION</span>
        </div>

        <h1 className="mt-4 font-display text-display-lg font-semibold tracking-tightest text-ink rise rise-2">
          오늘,
          <br />
          <span className="italic text-accent">한 경기만</span>
          <br />
          보자.
        </h1>

        <p className="mt-6 max-w-sm text-pretty text-base text-ink-dim rise rise-3 sm:text-lg">
          경기는 수십 개. 시간은 한정. 당신이 봐야 할 <em className="not-italic text-ink">단 한 경기</em>와
          그 이유를 매일 정리해 드립니다.
        </p>

        <div className="mt-12 rise rise-4">
          <GoogleLoginButton />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            GOOGLE 계정으로 계속 · 로그인만 사용 됩니다
          </p>
        </div>

        <ul className="mt-16 grid grid-cols-3 gap-4 rise rise-5 sm:gap-6">
          <Feature n="01" label="오늘의 경기" desc="1개 추천" />
          <Feature n="02" label="보는 이유" desc="3줄 요약" />
          <Feature n="03" label="관전 포인트" desc="핵심 체크" />
        </ul>
      </section>

      <footer className="z-10 mx-auto w-full max-w-screen-sm px-5 pb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
        © realsoccer · press · pass · score
      </footer>
    </main>
  );
}

function Feature({
  n,
  label,
  desc,
}: {
  n: string;
  label: string;
  desc: string;
}) {
  return (
    <li className="border-t border-hairline pt-3">
      <div className="font-mono text-[10px] text-ink-mute">{n}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{label}</div>
      <div className="text-xs text-ink-mute">{desc}</div>
    </li>
  );
}
