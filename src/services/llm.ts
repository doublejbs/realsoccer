import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { MatchDTO } from "@/types";
import { enrichMatchContext } from "./football-data-context";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

const LEAGUE_KO: Record<string, string> = {
  PL: "프리미어리그",
  PD: "라리가",
  BL1: "분데스리가",
  SA: "세리에A",
  FL1: "리그1",
  CL: "챔피언스리그",
};

// 안정적 프리픽스 — prompt cache 타깃.
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
1) 한 줄 훅 (headline) — 이 경기를 한 문장으로 정의. 15-30자.
   · 제목처럼 강렬하게. 사실에 근거.
   · 예시: "리그 판세를 가를 6포인트 매치", "4년만의 빅매치, 홈팀 상대전적 3연패 중"
   · 승부 단정 금지. 쌍방이 동등하게 다뤄질 것.

2) 경기 태그 (tags) — 이 경기의 성격을 함축하는 짧은 키워드 1-3개.
   · 예시: "타이틀레이스", "강등권결전", "더비", "UCL확정전", "복수전", "빅6대결"
   · 해시태그(#) 기호·이모지·공백 포함 3단어 이상 금지. 각 태그 최대 8자.

3) 추천 이유 (reasons) — 왜 오늘 이 경기를 꼭 봐야 하는지. 서로 다른 각도 3개.
   · 예시 각도: 리그 판도, 감독 전술 대결, 핵심 선수 복귀/컨디션, 시즌 내러티브, 라이벌 관계.
   · 각 이유는 한 문장. 중복 금지.

4) 관전 포인트 (watchPoints) — 경기 중 시청자가 주목해야 할 실질적 포인트 3개.
   · 전술/매치업/세트피스/교체카드/상대성 중에서 골라 구체적으로.
   · "지켜보자" 같은 모호한 말 대신 "무엇이 어떻게" 를 명시.

5) 5줄 요약 (lines) — 종료된 경기만. 시간 순서대로 5문장.
   · 전반 흐름 → 결정적 장면 → 후반 변화 → 교체/전술 변화 → 결과 확정 순서 권장.

[제공되는 데이터]
- [기본 경기 정보]: 팀, 리그, 킥오프, 인기도, 스타일 라벨
- [최근 폼]: 두 팀의 최근 5경기 (상대/홈원정/결과/스코어/대회)
- [리그 순위 현황]: 현재 리그 순위·승점·득실
- [상대 전적]: 두 팀의 과거 맞대결 집계 및 최근 3경기
- [시즌 주목 선수]: 양 팀의 리그 득점·어시스트 상위 선수 (이름·골·어시스트·평점)
* 위 섹션 중 일부가 비어 있을 수 있음. 없는 데이터는 없다고 간주하고 지어내지 말 것.

[데이터 활용 지침]
- 제공된 데이터에 근거한 구체적 내러티브를 우선. 예:
  · 최근 폼에서 홈팀이 3연패 → "침체 탈출을 위한 반등 기회"
  · 순위표에서 두 팀 승점 차 2점 → "순위 싸움의 분수령"
  · 최근 맞대결 홈팀 연승 → "반복되는 징크스에 맞설 원정팀"
- 숫자 인용 시 위 데이터에서 직접 가져온 값만 사용 (승수·승점·순위·스코어).
- 제공된 데이터에 없는 사실은 추측하지 말 것. 부상자·예상 라인업·감독 발언 등 모르는 사실은 언급하지 않는다.
- 학습 데이터(선수·팀·감독에 대한 일반 지식)는 역사적 맥락 수준으로만 참고. 최근 이적·감독 교체 등 시점에 민감한 사실은 확실하지 않으면 쓰지 말 것.

[공통]
- 각 문장은 완성된 문장으로. 키워드 나열 금지.
- 같은 각도의 반복 금지 (reasons 3개는 서로 다른 렌즈).
- 제공 컨텍스트가 부족해도 당황하지 말고 일반적이되 진실한 서술로 갈 것.`;

// 경기 메타 통합 스키마 (reasons + watchPoints + headline + tags 한 번에)
const MatchMetaSchema = z.object({
  headline: z.string().describe("경기를 함축하는 한 줄 훅. 15-30자."),
  tags: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("경기 성격 태그 1-3개. 각 최대 8자. #·이모지·공백 금지."),
  reasons: z
    .array(z.string())
    .length(3)
    .describe("왜 이 경기를 봐야 하는지, 서로 다른 각도의 한 문장 3개"),
  watchPoints: z
    .array(z.string())
    .length(3)
    .describe("경기 중 주목할 관전 포인트 3개. 구체적 전술/매치업."),
});

const SummarySchema = z.object({
  lines: z.array(z.string()).length(5).describe("종료된 경기 요약 5문장"),
});

export type MatchMeta = z.infer<typeof MatchMetaSchema>;

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

  const context = await enrichMatchContext(match).catch((err) => {
    console.warn("[llm] enrichMatchContext failed (continuing without)", err);
    return "";
  });

  const userContent = [
    task,
    "",
    "[기본 경기 정보]",
    brief(match),
    ...(context ? ["", context] : []),
  ].join("\n");

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
    messages: [{ role: "user", content: userContent }],
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

// headline + tags + reasons + watchPoints 한 번에 생성 (Claude 1회 호출)
export async function generateMatchMeta(match: MatchDTO): Promise<MatchMeta> {
  return callWithSchema(
    MatchMetaSchema,
    "아래 경기의 한 줄 훅(headline), 태그(tags), 추천 이유(reasons), 관전 포인트(watchPoints)를 작성하세요.",
    match,
  );
}

export async function generateSummary(match: MatchDTO): Promise<string[]> {
  if (match.status !== "FINISHED") {
    throw new Error("summary requires FINISHED match");
  }
  const parsed = await callWithSchema(
    SummarySchema,
    "종료된 아래 경기의 5줄 요약을 작성하세요. 시간 순서대로.",
    match,
  );
  return parsed.lines;
}
