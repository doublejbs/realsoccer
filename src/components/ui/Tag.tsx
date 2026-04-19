import { cn } from "@/lib/cn";

export function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "live" | "soon";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.18em]",
        tone === "neutral" && "border border-border text-ink-dim",
        tone === "accent" && "bg-accent text-accent-ink",
        tone === "live" && "border border-signal-live/60 text-signal-live",
        tone === "soon" && "border border-signal-soon/60 text-signal-soon",
        className,
      )}
    >
      {tone === "live" && (
        <span className="live-dot inline-block size-1.5 rounded-full bg-signal-live" />
      )}
      {children}
    </span>
  );
}
