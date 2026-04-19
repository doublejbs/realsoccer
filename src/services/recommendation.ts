import type { MatchDTO, UserPreferencesDTO } from "@/types";

const WEIGHTS = {
  importance: 0.35,
  popularity: 0.2,
  form: 0.15,
  styleClash: 0.1,
  userPref: 0.2,
};

function formScore(form?: ("W" | "D" | "L")[]): number {
  if (!form || form.length === 0) return 50;
  const map = { W: 100, D: 50, L: 0 };
  const s = form.reduce((acc, r) => acc + map[r], 0) / form.length;
  return s;
}

function styleClashScore(a?: string[], b?: string[]): number {
  if (!a?.length || !b?.length) return 40;
  const set = new Set(a);
  const overlap = b.filter((s) => set.has(s)).length;
  const union = new Set([...a, ...b]).size;
  // 완전히 같으면 낮음, 완전히 다르면 높음 (흥미로움)
  const diff = 1 - overlap / union;
  return Math.round(diff * 100);
}

function userPrefScore(
  match: MatchDTO,
  prefs?: UserPreferencesDTO | null,
): number {
  if (!prefs) return 50;

  let score = 0;
  if (prefs.favoriteLeagues.includes(match.leagueCode)) score += 40;

  const teamIds = [match.homeTeam.id, match.awayTeam.id];
  if (teamIds.some((id) => prefs.favoriteTeams.includes(id))) score += 50;

  const styles = [
    ...(match.homeTeam.style ?? []),
    ...(match.awayTeam.style ?? []),
  ];
  if (styles.some((s) => prefs.favoriteStyles.includes(s))) score += 20;

  return Math.min(score, 100);
}

export function scoreMatch(
  match: MatchDTO,
  prefs?: UserPreferencesDTO | null,
): number {
  const importance = match.importance ?? 50;
  const popularity =
    ((match.homeTeam.popularity ?? 50) + (match.awayTeam.popularity ?? 50)) / 2;
  const form =
    (formScore(match.homeTeam.recentForm) +
      formScore(match.awayTeam.recentForm)) /
    2;
  const clash = styleClashScore(match.homeTeam.style, match.awayTeam.style);
  const pref = userPrefScore(match, prefs);

  return (
    importance * WEIGHTS.importance +
    popularity * WEIGHTS.popularity +
    form * WEIGHTS.form +
    clash * WEIGHTS.styleClash +
    pref * WEIGHTS.userPref
  );
}

export function rankMatches(
  matches: MatchDTO[],
  prefs?: UserPreferencesDTO | null,
): Array<{ match: MatchDTO; score: number }> {
  return matches
    .map((match) => ({ match, score: scoreMatch(match, prefs) }))
    .sort((a, b) => b.score - a.score);
}

export function pickTopMatch(
  matches: MatchDTO[],
  prefs?: UserPreferencesDTO | null,
): { match: MatchDTO; score: number } | null {
  const ranked = rankMatches(matches, prefs);
  return ranked[0] ?? null;
}
