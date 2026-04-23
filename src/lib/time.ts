const KST = "Asia/Seoul";

// "sv" 로케일은 YYYY-MM-DD 형식을 반환 — 날짜 비교에 활용
function kstDateStr(d: Date): string {
  return new Intl.DateTimeFormat("sv", { timeZone: KST }).format(d);
}

export function formatKickoff(iso: string) {
  const d = new Date(iso);
  const now = new Date();

  const kstDate = kstDateStr(d);
  const todayDate = kstDateStr(now);
  // DST 없는 KST라 +24h = 정확히 내일
  const tomorrowDate = kstDateStr(new Date(now.getTime() + 86_400_000));

  const sameDay = kstDate === todayDate;
  const isTomorrow = kstDate === tomorrowDate;

  const [, m, day] = kstDate.split("-");
  const dateLabel = sameDay ? "오늘" : isTomorrow ? "내일" : `${parseInt(m)}/${parseInt(day)}`;

  const time = new Intl.DateTimeFormat("en", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

  const weekday = new Intl.DateTimeFormat("ko", {
    timeZone: KST,
    weekday: "narrow",
  }).format(d);

  return { time, date: dateLabel, weekday, raw: d };
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
