"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function UserMenu({
  displayName,
  avatarUrl,
}: {
  displayName?: string | null;
  avatarUrl?: string | null;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = (displayName ?? "U").slice(0, 1).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/settings"
        className="flex items-center gap-2 border border-border bg-surface px-2 py-1 transition-colors hover:border-ink-mute"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="size-5 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-5 items-center justify-center bg-accent font-mono text-[10px] text-accent-ink">
            {initial}
          </span>
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-dim">
          설정
        </span>
      </Link>
      <button
        onClick={signOut}
        className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint hover:text-ink"
      >
        로그아웃
      </button>
    </div>
  );
}
