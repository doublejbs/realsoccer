import { cn } from "@/lib/cn";

// football-data.org가 SVG/PNG를 주는데 SVG는 Next/Image로 처리하면
// remotePatterns 등 추가 설정이 필요하니 <img>로 단순 처리한다.
export function TeamCrest({
  src,
  alt,
  size = 40,
  className,
}: {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  if (!src) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center border border-hairline bg-elevated font-mono text-[10px] uppercase text-ink-faint",
          className,
        )}
        style={{ width: size, height: size }}
      >
        {alt.slice(0, 2)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={cn("inline-block object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
