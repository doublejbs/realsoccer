"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="group relative inline-flex w-full items-center justify-between gap-4 border border-ink bg-ink px-6 py-4 text-accent-ink transition-transform hover:-translate-y-0.5 disabled:opacity-50"
    >
      <span className="flex items-center gap-3">
        <GoogleMark />
        <span className="font-mono text-sm uppercase tracking-[0.15em]">
          {loading ? "연결 중…" : "Continue with Google"}
        </span>
      </span>
      <span className="font-mono text-sm transition-transform group-hover:translate-x-1">
        →
      </span>
    </button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        d="M21.35 11.1H12v2.92h5.35c-.23 1.55-1.8 4.54-5.35 4.54-3.22 0-5.85-2.67-5.85-5.96s2.63-5.96 5.85-5.96c1.84 0 3.07.79 3.77 1.47l2.58-2.49C16.62 4.07 14.5 3.1 12 3.1 6.98 3.1 2.9 7.17 2.9 12.2s4.08 9.1 9.1 9.1c5.26 0 8.74-3.69 8.74-8.9 0-.6-.06-1.05-.14-1.3z"
        fill="currentColor"
      />
    </svg>
  );
}
