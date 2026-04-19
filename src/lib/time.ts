export function formatKickoff(iso: string) {
  const d = new Date(iso);
  const now = new Date();

  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dateLabel = sameDay
    ? "오늘"
    : `${d.getMonth() + 1}/${d.getDate()}`;

  return { time: `${hh}:${mm}`, date: dateLabel, raw: d };
}

export function hoursUntil(iso: string): number {
  const d = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.round((d - now) / 3_600_000));
}
