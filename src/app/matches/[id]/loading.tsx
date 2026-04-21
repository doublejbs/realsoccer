import { Skeleton } from "@/components/ui/Skeleton";

export default function MatchLoading() {
  return (
    <main className="mx-auto max-w-screen-sm px-5 pb-28 pt-6">
      <Skeleton className="h-3 w-28" />

      {/* Hero card — versus layout */}
      <div className="relative mt-5 border border-border bg-surface p-5 sm:p-8">
        <span className="pointer-events-none absolute -left-px -top-px size-2 border-l border-t border-accent" />
        <span className="pointer-events-none absolute -right-px -top-px size-2 border-r border-t border-accent" />
        <span className="pointer-events-none absolute -bottom-px -left-px size-2 border-b border-l border-accent" />
        <span className="pointer-events-none absolute -bottom-px -right-px size-2 border-b border-r border-accent" />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-28 rounded-none" />
            <Skeleton className="h-4 w-16 rounded-none" />
          </div>
          <Skeleton className="h-3 w-10 rounded-none" />
        </div>

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
      </div>

      {/* Section: reasons */}
      <section className="mt-14">
        <div className="mb-4 flex items-baseline justify-between">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-4 border-t border-hairline py-4">
              <Skeleton className="mt-1 h-3 w-5" />
              <Skeleton className="h-6 flex-1" />
            </div>
          ))}
        </div>
      </section>

      {/* Section: watch points */}
      <section className="mt-14">
        <div className="mb-4 flex items-baseline justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </section>

      <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
        AI가 관전 포인트를 쓰는 중...
      </p>
    </main>
  );
}
