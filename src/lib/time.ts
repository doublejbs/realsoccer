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

// "3시간 전", "2일 전" 같은 한국어 상대시간.
export function formatRelative(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";

  const diffSec = Math.max(0, (Date.now() - then) / 1000);
  if (diffSec < 60) return "방금";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}주 전`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}달 전`;
  return `${Math.floor(day / 365)}년 전`;
}
