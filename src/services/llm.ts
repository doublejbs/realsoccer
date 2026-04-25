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
독자는 경기를 앞두고 있으며, 에디터처럼 압축되고 구체적인 정보를 원합니다.

[문체]
- 한 문장은 짧고 단단하게. 30~50자 권장, 최대 65자.
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
- 제공된 데이터에 없는 사실 지어내기 금지. 부상자·예상 라인업·감독 발언 등 모르는 사실은 언급하지 않는다.

[제공되는 데이터]
- [기본 경기 정보]: 팀, 리그, 킥오프, 인기도, 스타일 라벨
- [최근 폼]: 두 팀의 최근 5경기 (상대/홈원정/결과/스코어/대회)
- [리그 순위 현황]: 현재 리그 순위·승점·득실
- [상대 전적]: 두 팀의 과거 맞대결 집계 및 최근 3경기
- [시즌 주목 선수]: 양 팀의 리그 득점·어시스트 상위 선수 (이름·포지션·골·어시스트·평점)
- [시즌 팀 통계]: 양 팀의 경기당 득점/실점, 무실점 경기 수, 홈/원정 성적
* 위 섹션 중 일부가 비어 있을 수 있음. 없는 데이터는 없다고 간주하고 지어내지 말 것.

[데이터 활용 지침]
- 제공된 데이터에 근거한 구체적 내러티브를 우선.
- 숫자 인용 시 위 데이터에서 직접 가져온 값만 사용 (승수·승점·순위·스코어·평균 득점 등).
- 학습 데이터(선수·팀·감독에 대한 일반 지식)는 역사적 맥락 수준으로만 참고. 최근 이적·감독 교체 등 시점에 민감한 사실은 확실하지 않으면 쓰지 말 것.

[역할별 작성 기준]

1) 한 줄 훅 (headline) — 이 경기를 한 문장으로 정의. 15-30자.
   · 제목처럼 강렬하게. 사실에 근거.
   · 예시: "리그 판세를 가를 6포인트 매치", "4년만의 빅매치, 홈팀 상대전적 3연패 중"
   · 승부 단정 금지.

2) 경기 태그 (tags) — 이 경기의 성격을 함축하는 짧은 키워드 1-3개.
   · 예시: "타이틀레이스", "강등권결전", "더비", "UCL확정전", "복수전"
   · 해시태그(#)·이모지·공백·3단어 이상 금지. 각 태그 최대 8자.

3) The Story — 이 경기의 시즌 맥락을 담은 도입 단락. 2-3문장.
   · 현재 순위·폼·상대 전적 등 제공된 데이터에서 가장 중요한 맥락만 압축.
   · 에디터가 독자에게 "지금 이 경기가 왜 열리는가"를 설명하듯.

4) Key Battle — 선수 vs 선수 핵심 맞대결 1-2개.
   · [시즌 주목 선수] 섹션에 실제로 등장한 선수 이름만 사용. 없으면 빈 배열.
   · 각 배틀은 홈팀 선수명, 원정팀 선수명, 그리고 대결 포인트 한 문장.
   · 포지션·스탯 기반의 구체적 대결 구도.

5) Tactical Hinge — 이 경기의 전술적 분기점 한 문장.
   · 팀 통계(득점/실점 평균, 홈원정 성적)와 폼 데이터를 활용해 구체적으로.
   · "어느 팀이 어떻게 하면 유리한가"를 수치로 뒷받침.

6) The Number — 이 경기를 상징하는 수치 1개 + 레이블 + 한 줄 해설.
   · value: 반드시 제공된 데이터에서 직접 가져온 실제 수치.
   · label: 수치의 짧은 레이블.
   · context: 이 수치가 왜 이 경기에서 중요한지 한 문장.

7) 5줄 요약 (lines) — 종료된 경기만. 시간 순서대로 5문장.
   · 전반 흐름 → 결정적 장면 → 후반 변화 → 교체/전술 변화 → 결과 확정.

[공통]
- 각 문장은 완성된 문장으로. 키워드 나열 금지.
- 제공 컨텍스트가 부족해도 당황하지 말고 일반적이되 진실한 서술로 갈 것.`;

const MatchEditorialSchema = z.object({
  headline: z.string().describe("경기를 함축하는 한 줄 훅. 15-30자."),
  tags: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("경기 성격 태그 1-3개. 각 최대 8자."),
  story: z
    .string()
    .describe("이 경기의 시즌 맥락 도입 단락. 2-3문장. 제공된 데이터 기반."),
  keyBattles: z
    .array(
      z.object({
        home: z.string().describe("홈팀 선수 이름 — 주목 선수 목록에 있는 실존 선수만"),
        away: z.string().describe("원정팀 선수 이름 — 주목 선수 목록에 있는 실존 선수만"),
        description: z.string().describe("두 선수 대결 포인트 한 문장. 스탯 기반."),
      }),
    )
    .min(0)
    .max(2)
    .describe("핵심 선수 맞대결 0-2개. 주목 선수 데이터가 없으면 빈 배열."),
  tacticalHinge: z
    .string()
    .describe("전술적 분기점 한 문장. 팀 통계·폼 수치 기반."),
  theNumber: z.object({
    value: z.string().describe("핵심 수치 (예: '2.3골', '7연속무패', '3위')"),
    label: z.string().describe("수치 레이블 (예: '리버풀 경기당 득점')"),
    context: z.string().describe("이 수치가 왜 이 경기에서 중요한지 한 문장"),
  }),
});

const SummarySchema = z.object({
  lines: z.array(z.string()).length(5).describe("종료된 경기 요약 5문장"),
});

export type MatchEditorial = z.infer<typeof MatchEditorialSchema>;

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

export async function generateMatchEditorial(match: MatchDTO): Promise<MatchEditorial> {
  return callWithSchema(
    MatchEditorialSchema,
    "아래 경기의 editorial 컨텐츠를 작성하세요. 제공된 데이터에만 근거하고, 없는 사실은 절대 만들지 마세요.",
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
