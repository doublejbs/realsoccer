import { Skeleton } from "@/components/ui/Skeleton";
import { formatRelative } from "@/lib/time";
import { fetchMatchNews, type NewsItem } from "@/services/news";
import type { MatchDTO } from "@/types";

export async function MatchNewsSection({ match }: { match: MatchDTO }) {
  const news = await fetchMatchNews(match, 3);
  if (news.length === 0) return null;

  return (
    <section className="mt-14 rise rise-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-tightest text-ink">
          최신 소식
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          § 04
        </span>
      </div>

      <ol className="hairline-y">
        {news.map((item, i) => (
          <NewsRow key={item.url} item={item} index={i + 1} />
        ))}
      </ol>

      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
        SOURCE — Google News · KR
      </p>
    </section>
  );
}

function NewsRow({ item, index }: { item: NewsItem; index: number }) {
  return (
    <li className="py-4">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-4"
      >
        <span className="mt-1 w-5 shrink-0 font-mono text-[10px] text-accent">
          {String(index).padStart(2, "0")}
        </span>

        <Thumbnail src={item.imageUrl} alt={item.title} />

        <div className="min-w-0 flex-1">
          <p className="text-pretty font-display text-base font-semibold leading-snug text-ink transition-colors group-hover:text-accent sm:text-lg">
            {item.title}
          </p>
          <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-mute">
            {item.source && <span className="truncate">{item.source}</span>}
            {item.source && item.publishedAt && <span>·</span>}
            {item.publishedAt && (
              <span>{formatRelative(item.publishedAt)}</span>
            )}
          </div>
        </div>

        <span className="mt-1 shrink-0 font-mono text-xs text-ink-faint transition-colors group-hover:text-accent">
          ↗
        </span>
      </a>
    </li>
  );
}

function Thumbnail({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="size-16 shrink-0 border border-hairline bg-elevated sm:size-20" />
    );
  }
  return (
    <div className="size-16 shrink-0 overflow-hidden border border-hairline bg-elevated sm:size-20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={undefined}
      />
    </div>
  );
}

export function MatchNewsSkeleton() {
  return (
    <section className="mt-14">
      <div className="mb-4 flex items-baseline justify-between">
        <Skeleton className="h-7 w-24 rounded-none" />
        <Skeleton className="h-3 w-10 rounded-none" />
      </div>
      <ol className="hairline-y">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-start gap-4 py-4">
            <Skeleton className="mt-1 h-3 w-5 shrink-0 rounded-none" />
            <Skeleton className="size-16 shrink-0 rounded-none sm:size-20" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-full rounded-none" />
              <Skeleton className="h-5 w-3/4 rounded-none" />
              <Skeleton className="h-2.5 w-32 rounded-none" />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
