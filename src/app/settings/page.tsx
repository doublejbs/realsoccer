import { TopBar } from "@/components/ui/TopBar";
import { UserMenu } from "@/components/UserMenu";
import { PreferenceEditor } from "@/components/PreferenceEditor";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  const initial = {
    favoriteLeagues: user.preferences?.favoriteLeagues ?? [],
    favoriteTeams: user.preferences?.favoriteTeams ?? [],
    favoriteStyles: user.preferences?.favoriteStyles ?? [],
  };

  return (
    <div>
      <TopBar
        rightSlot={
          <UserMenu
            displayName={user.displayName}
            avatarUrl={user.avatarUrl}
          />
        }
      />

      <main className="mx-auto max-w-screen-sm px-5 pb-28 pt-6">
        <section className="rise rise-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-mute">
            SETTINGS — PERSONALIZATION
          </div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tightest sm:text-5xl">
            취향을 알려주세요.
          </h1>
          <p className="mt-3 max-w-md text-pretty text-ink-dim">
            추천은 이 선호를 바탕으로 매일 다시 계산됩니다.
          </p>
        </section>

        <div className="mt-12 rise rise-2">
          <PreferenceEditor initial={initial} />
        </div>

        <section className="mt-16 rise rise-3 border-t border-hairline pt-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            ACCOUNT
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="font-display text-lg font-semibold">
                {user.displayName ?? "익명 유저"}
              </div>
              <div className="font-mono text-xs text-ink-mute">{user.email}</div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
              {user.authProvider}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
