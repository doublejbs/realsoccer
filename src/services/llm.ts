import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { MatchDTO } from "@/types";

// 기본 모델은 Sonnet 4.6. 품질 최상위가 필요하면 .env에 ANTHROPIC_MODEL=claude-opus-4-7.
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

const LEAGUE_KO: Record<string, string> = {
  PL: "프리미어리그",
  PD: "라리가",
  BL1: "분데스리가",
  SA: "세리에A",
  FL1: "리그1",
  CL: "챔피언스리그",
};

// 안정적 프리픽스 — 요청 간 바이트 동일. prompt cache 타깃.
const SYSTEM_PROMPT = `당신은 한국어로 글을 쓰는 해외축구 전문 에디터입니다.
독자는 경기 직전이라 짧고 명확한 한 줄짜리 정보를 원합니다.

[문체]
- 한 문장은 짧고 단단하게. 30~45자 권장, 최대 60자.
- 명사 중심. 부사·과장 표현 자제.
- 팀명은 한국 팬에게 친숙한 호칭 (예: Liverpool→리버풀, FC Barcelona→바르사, Real Madrid→레알, Manchester City→맨시티, Manchester United→맨유, Atlético Madrid→아틀레티코, Borussia Dortmund→도르트문트, Bayern Munich→뮌헨, Paris Saint-Germain→파리, Juventus→유벤투스).
- 리그 코드는 한국어로: PL=프리미어리그, PD=라리가, BL1=분데스리가, SA=세리에A, FL1=리그1, CL=챔피언스리그.

[금지]
- 승부 단정·결과 예측 금지.
- "역대급", "운명의 대결", "세기의 맞대결" 등 클리셰 금지.
- 감탄사, 느낌표 금지.
- 가십·루머·선수 비하 금지.
- 같은 표현 반복 금지.
- 이모지 금지.

[역할별 작성 기준]
1) 추천 이유 (reasons) — 왜 오늘 이 경기를 꼭 봐야 하는지. 서로 다른 각도 3개.
   · 예시 각도: 리그 판도, 감독 전술 대결, 핵심 선수 복귀/컨디션, 시즌 내러티브, 라이벌 관계.
   · 각 이유는 한 문장. 중복 금지.

2) 관전 포인트 (watchPoints) — 경기 중 시청자가 주목해야 할 실질적 포인트 3개.
   · 전술/매치업/세트피스/교체카드/상대성 중에서 골라 구체적으로.
   · "지켜보자" 같은 모호한 말 대신 "무엇이 어떻게" 를 명시.

3) 5줄 요약 (lines) — 종료된 경기만. 시간 순서대로 5문장.
   · 전반 흐름 → 결정적 장면 → 후반 변화 → 교체/전술 변화 → 결과 확정 순서 권장.

[공통]
- 근거가 없는 수치/사실을 만들지 말 것.
- 제공된 경기 데이터(팀·리그·폼·스타일)만 활용.
- 각 문장은 완성된 문장으로. 키워드 나열 금지.`;

// 출력 스키마 — 숫자/길이 제약은 SDK가 클라이언트 측에서 검증한다 (API에는 전달 X).
const ReasonsSchema = z.object({
  reasons: z
    .array(z.string())
    .length(3)
    .describe("왜 이 경기를 오늘 봐야 하는지, 서로 다른 각도의 한 문장 3개"),
});

const WatchPointsSchema = z.object({
  watchPoints: z
    .array(z.string())
    .length(3)
    .describe("경기 중 주목할 관전 포인트 3개. 구체적 전술/매치업."),
});

const SummarySchema = z.object({
  lines: z.array(z.string()).length(5).describe("종료된 경기 요약 5문장"),
});

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic();
}

function brief(match: MatchDTO): string {
  const lg = LEAGUE_KO[match.leagueCode] ?? match.leagueCode;
  const h = match.homeTeam;
  const a = match.awayTeam;
  const kickoff = new Date(match.kickoffAt).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const score =
    match.status === "FINISHED"
      ? `최종 ${match.homeScore}-${match.awayScore}`
      : "경기 시작 전";
  return [
    `- 리그: ${lg}`,
    `- 킥오프(한국시간): ${kickoff}`,
    `- 홈: ${h.name} (인기도 ${h.popularity ?? "?"}, 스타일: ${(h.style ?? []).join("/") || "미지정"})`,
    `- 원정: ${a.name} (인기도 ${a.popularity ?? "?"}, 스타일: ${(a.style ?? []).join("/") || "미지정"})`,
    `- 상태: ${score}`,
    match.importance != null ? `- 매치 중요도: ${match.importance}/100` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function callWithSchema<T extends z.ZodTypeAny>(
  schema: T,
  task: string,
  match: MatchDTO,
): Promise<z.infer<T>> {
  const client = getClient();
  if (!client) throw new Error("ANTHROPIC_API_KEY_MISSING");

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `${task}\n\n[경기 정보]\n${brief(match)}`,
      },
    ],
    output_config: { format: zodOutputFormat(schema) },
  });

  if (!response.parsed_output) {
    console.error("[llm] PARSE_FAILED — diagnostics:", {
      stop_reason: response.stop_reason,
      usage: response.usage,
      content_preview: JSON.stringify(response.content).slice(0, 500),
    });
    throw new Error("PARSE_FAILED");
  }
  return response.parsed_output as z.infer<T>;
}

// --- 폴백 템플릿 (API 키 미설정 또는 호출 실패 시) ---
export function fallbackReasons(match: MatchDTO): string[] {
  const h = match.homeTeam.shortName ?? match.homeTeam.name;
  const a = match.awayTeam.shortName ?? match.awayTeam.name;
  return [
    `${h} vs ${a} — 오늘 가장 주목받는 맞대결.`,
    `두 팀의 최근 폼이 엇갈려 경기 리듬이 승부를 가른다.`,
    `스타일 차이 — ${(match.homeTeam.style ?? ["balanced"]).join("+")} vs ${(match.awayTeam.style ?? ["balanced"]).join("+")}.`,
  ];
}

export function fallbackWatchPoints(match: MatchDTO): string[] {
  const h = match.homeTeam.shortName ?? match.homeTeam.name;
  const a = match.awayTeam.shortName ?? match.awayTeam.name;
  return [
    `${h}의 전방 압박이 ${a}의 빌드업을 끊어낼 수 있을지.`,
    `중원 점유 싸움 — 템포를 쥐는 팀이 승기를 잡는다.`,
    `세트피스 효율이 결과를 가를 수 있는 팽팽한 매치업.`,
  ];
}

export function fallbackSummary(match: MatchDTO): string[] {
  if (match.status !== "FINISHED") {
    return ["경기 종료 후 요약이 제공됩니다."];
  }
  const h = match.homeTeam.shortName ?? match.homeTeam.name;
  const a = match.awayTeam.shortName ?? match.awayTeam.name;
  return [
    `${h} ${match.homeScore}-${match.awayScore} ${a}, 최종 스코어.`,
    `전반은 팽팽한 탐색전으로 결정적 기회가 많지 않았다.`,
    `후반 시작과 함께 템포가 올라가며 경기가 열렸다.`,
    `교체 카드가 승부 무게중심을 바꾼 장면이 있었다.`,
    `막판 세트피스 한 번이 결과를 결정지었다.`,
  ];
}

// --- 공개 API — 성공 시 AI 결과, 실패 시 throw ---
export async function generateReasons(match: MatchDTO): Promise<string[]> {
  const parsed = await callWithSchema(
    ReasonsSchema,
    "아래 경기의 '오늘 봐야 할 이유' 3개를 작성하세요.",
    match,
  );
  return parsed.reasons;
}

export async function generateWatchPoints(match: MatchDTO): Promise<string[]> {
  const parsed = await callWithSchema(
    WatchPointsSchema,
    "아래 경기의 '관전 포인트' 3개를 작성하세요.",
    match,
  );
  return parsed.watchPoints;
}

export async function generateSummary(match: MatchDTO): Promise<string[]> {
  if (match.status !== "FINISHED") {
    return ["경기 종료 후 요약이 제공됩니다."];
  }
  const parsed = await callWithSchema(
    SummarySchema,
    "종료된 아래 경기의 5줄 요약을 작성하세요. 시간 순서대로.",
    match,
  );
  return parsed.lines;
}
