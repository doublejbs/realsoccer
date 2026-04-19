import Link from "next/link";

export function TopBar({ rightSlot }: { rightSlot?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-sm items-center justify-between px-5">
        <Link
          href="/"
          className="flex items-baseline gap-1.5 font-display text-xl font-semibold tracking-tightest"
        >
          realsoccer
          <span className="inline-block size-1.5 rounded-full bg-accent" />
        </Link>
        <div className="flex items-center gap-3">{rightSlot}</div>
      </div>
    </header>
  );
}
