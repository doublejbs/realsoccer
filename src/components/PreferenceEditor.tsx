"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";

const LEAGUES = [
  { code: "PL", name: "Premier League" },
  { code: "PD", name: "LaLiga" },
  { code: "BL1", name: "Bundesliga" },
  { code: "SA", name: "Serie A" },
  { code: "FL1", name: "Ligue 1" },
  { code: "CL", name: "Champions League" },
];

// ID는 football-data.org 팀 ID(문자열). 실 API 데이터와 매칭됨.
const TEAMS = [
  { id: "65", name: "Manchester City" },
  { id: "64", name: "Liverpool" },
  { id: "57", name: "Arsenal" },
  { id: "61", name: "Chelsea" },
  { id: "66", name: "Manchester United" },
  { id: "73", name: "Tottenham" },
  { id: "86", name: "Real Madrid" },
  { id: "81", name: "FC Barcelona" },
  { id: "78", name: "Atlético Madrid" },
  { id: "5", name: "Bayern Munich" },
  { id: "4", name: "Borussia Dortmund" },
  { id: "109", name: "Juventus" },
  { id: "108", name: "Inter" },
  { id: "98", name: "AC Milan" },
  { id: "524", name: "Paris Saint-Germain" },
];

const STYLES = [
  { id: "possession", label: "점유" },
  { id: "press", label: "압박" },
  { id: "counter", label: "역습" },
  { id: "defensive", label: "수비적" },
  { id: "individual", label: "개인 기량" },
];

export function PreferenceEditor({
  initial,
}: {
  initial: {
    favoriteLeagues: string[];
    favoriteTeams: string[];
    favoriteStyles: string[];
  };
}) {
  const [leagues, setLeagues] = useState<string[]>(initial.favoriteLeagues);
  const [teams, setTeams] = useState<string[]>(initial.favoriteTeams);
  const [styles, setStyles] = useState<string[]>(initial.favoriteStyles);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle(
    list: string[],
    set: (v: string[]) => void,
    value: string,
  ) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          favoriteLeagues: leagues,
          favoriteTeams: teams,
          favoriteStyles: styles,
        }),
      });
      setSaved(true);
    });
  }

  return (
    <div className="space-y-12">
      <Group
        index="01"
        title="리그"
        hint="관심 있는 리그를 선택하세요."
      >
        <div className="flex flex-wrap gap-2">
          {LEAGUES.map((l) => (
            <Chip
              key={l.code}
              active={leagues.includes(l.code)}
              onClick={() => toggle(leagues, setLeagues, l.code)}
            >
              {l.name}
            </Chip>
          ))}
        </div>
      </Group>

      <Group index="02" title="팀" hint="선호하는 팀.">
        <div className="flex flex-wrap gap-2">
          {TEAMS.map((t) => (
            <Chip
              key={t.id}
              active={teams.includes(t.id)}
              onClick={() => toggle(teams, setTeams, t.id)}
            >
              {t.name}
            </Chip>
          ))}
        </div>
      </Group>

      <Group index="03" title="스타일" hint="보고 싶은 전술 스타일.">
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <Chip
              key={s.id}
              active={styles.includes(s.id)}
              onClick={() => toggle(styles, setStyles, s.id)}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </Group>

      <div className="sticky bottom-4 mt-10 flex items-center justify-between gap-3 border border-border bg-elevated p-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-mute">
          {saved ? "저장됨" : pending ? "저장 중…" : "변경 사항을 저장하세요"}
        </span>
        <button
          onClick={save}
          disabled={pending}
          className="bg-accent px-5 py-2 font-mono text-xs uppercase tracking-[0.15em] text-accent-ink transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          저장
        </button>
      </div>
    </div>
  );
}

function Group({
  index,
  title,
  hint,
  children,
}: {
  index: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            § {index}
          </div>
          <h3 className="font-display text-2xl font-semibold tracking-tightest">
            {title}
          </h3>
        </div>
        <span className="font-mono text-[10px] text-ink-mute">{hint}</span>
      </div>
      {children}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors",
        active
          ? "border-accent bg-accent text-accent-ink"
          : "border-border text-ink-dim hover:border-ink-mute hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
