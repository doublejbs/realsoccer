import type { MatchDTO, TeamDTO } from "@/types";

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO
  imageUrl: string | null;
}

const UA =
  "Mozilla/5.0 (compatible; realsoccer/1.0; +https://realsoccer.app)";

// football-data 팀명 정리 — "FC" 접미/접두는 보통 기사 제목에 안 나옴.
// 예: "Liverpool FC" → "Liverpool", "FC Barcelona" → "Barcelona"
function teamQueryName(team: TeamDTO): string {
  const raw = team.shortName ?? team.name;
  return raw
    .replace(/\bFC\b/g, "")
    .replace(/\bAFC\b/g, "")
    .replace(/\bCF\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Google News 쿼리 — 두 팀명만. 인용·연산자·날짜 필터는 결과를 과도하게
// 줄이는 경향이 있어 배제. Google 관련성 랭킹이 알아서 정렬.
function buildQuery(match: MatchDTO): string {
  const h = teamQueryName(match.homeTeam);
  const a = teamQueryName(match.awayTeam);
  return `${h} ${a}`;
}

/**
 * Google News RSS — API 키 없음, 한국어 검색 결과 우선.
 * CLAUDE.md 원칙 7의 예외: 뉴스는 신선도가 핵심이라 cron 사이클로 다룰 수 없음.
 */
export async function fetchMatchNews(
  match: MatchDTO,
  limit = 3,
): Promise<NewsItem[]> {
  const query = encodeURIComponent(buildQuery(match));
  const url = `https://news.google.com/rss/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 600 },
      headers: { "User-Agent": UA },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = parseGoogleNewsRss(xml).slice(0, limit);

    // og:image 병렬 추출 (개별 실패해도 null로 fallback)
    const withImages = await Promise.all(
      items.map(async (it) => ({
        ...it,
        imageUrl: await fetchOgImage(it.url).catch(() => null),
      })),
    );

    return withImages;
  } catch (err) {
    console.error("[news] fetch failed", err);
    return [];
  }
}

// 간단한 RSS 파서 — Google News RSS 포맷만 지원.
function parseGoogleNewsRss(xml: string): Omit<NewsItem, "imageUrl">[] {
  const items: Omit<NewsItem, "imageUrl">[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;

  while ((m = itemRe.exec(xml)) !== null) {
    const body = m[1];
    const title = decodeEntities(extractTag(body, "title") ?? "");
    const link = decodeEntities(extractTag(body, "link") ?? "");
    const pubDate = extractTag(body, "pubDate");
    const source = decodeEntities(extractTag(body, "source") ?? "");

    if (!title || !link) continue;

    const publishedAt = pubDate ? safeIsoDate(pubDate) : "";
    items.push({ title, url: link, source, publishedAt });
  }

  return items;
}

// 기사 페이지에서 og:image 추출. 3초 timeout, 1시간 캐시.
async function fetchOgImage(articleUrl: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(articleUrl, {
      redirect: "follow",
      signal: controller.signal,
      next: { revalidate: 3600 },
      headers: { "User-Agent": UA, Accept: "text/html" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // <head>만 보면 충분하고, 큰 본문 파싱 비용 절약.
    const head = html.slice(0, 80_000);
    return extractOgImage(head);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractOgImage(html: string): string | null {
  // property=og:image (혹은 og:image:secure_url), content 어느 순서든 커버.
  const patterns = [
    /<meta\s+(?:[^>]*?\s+)?property=["']og:image(?::secure_url)?["'][^>]*?content=["']([^"']+)["']/i,
    /<meta\s+(?:[^>]*?\s+)?content=["']([^"']+)["'][^>]*?property=["']og:image(?::secure_url)?["']/i,
    /<meta\s+(?:[^>]*?\s+)?name=["']twitter:image(?::src)?["'][^>]*?content=["']([^"']+)["']/i,
    /<meta\s+(?:[^>]*?\s+)?content=["']([^"']+)["'][^>]*?name=["']twitter:image(?::src)?["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return cleanUrl(m[1]);
  }
  return null;
}

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const m = xml.match(re);
  if (!m) return null;
  const inner = m[1].trim();
  const cdata = inner.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1].trim() : inner;
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function cleanUrl(url: string): string {
  return url
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/g, "/")
    .replace(/&quot;/g, '"');
}

function safeIsoDate(raw: string): string {
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}
