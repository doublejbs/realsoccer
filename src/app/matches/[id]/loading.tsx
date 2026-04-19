import { Skeleton } from "@/components/ui/Skeleton";

export default function MatchLoading() {
  return (
    <main className="mx-auto max-w-screen-sm px-5 pb-28 pt-6">
      <Skeleton className="h-3 w-28" />

      {/* Hero card */}
      <div className="mt-5 border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="mt-8 flex items-end justify-between gap-6">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-12" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
          <Skeleton className="h-10 w-10" />
          <div className="flex-1 space-y-3 text-right">
            <Skeleton className="ml-auto h-3 w-12" />
            <div className="flex items-center justify-end gap-3">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
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
