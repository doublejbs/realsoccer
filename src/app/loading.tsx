import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-screen-sm px-5 pb-24 pt-8">
      {/* Header */}
      <section className="flex items-baseline justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-44" />
        </div>
        <Skeleton className="h-3 w-20" />
      </section>

      <Skeleton className="mt-4 h-4 w-64" />

      {/* Hero match card */}
      <div className="mt-8 border border-border bg-surface p-6 sm:p-8">
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
        <Skeleton className="mt-8 h-6 w-3/4" />
        <Skeleton className="mt-8 h-3 w-full" />
      </div>

      {/* Secondary list */}
      <div className="mt-16 space-y-4">
        <Skeleton className="h-3 w-40" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-hairline py-4"
          >
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 flex-1" />
          </div>
        ))}
      </div>
    </main>
  );
}
