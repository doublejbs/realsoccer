const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function formatKickoff(iso: string) {
  const d = new Date(iso);
  const now = new Date();

  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dateLabel = sameDay
    ? "오늘"
    : isTomorrow
      ? "내일"
      : `${d.getMonth() + 1}/${d.getDate()}`;

  const weekday = WEEKDAY_KO[d.getDay()];

  return { time: `${hh}:${mm}`, date: dateLabel, weekday, raw: d };
}

export function hoursUntil(iso: string): number {
  const d = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.round((d - now) / 3_600_000));
}
