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
const SYSTEM_PROMPT = `당신은 해외축구 전문 매거진의 수석 에디터입니다.
경기 직전 독자에게 딱 필요한 것만 전달하는 글을 씁니다.

[핵심 원칙 — 이것부터]
먼저 제공된 데이터 전체를 읽고, 가장 특이하거나 날카로운 사실 하나를 고릅니다.
그 사실을 중심으로 전체 컨텐츠를 엮습니다. 여러 사실을 균등하게 나열하지 않습니다.

[목소리]
- 관점이 있다. 중립적 나열이 아니라, 이 경기에서 무엇이 핵심인지 선택한다.
- 구체적이다. "공격이 강하다" 대신 제공된 선수 이름·수치를 문장 안에 녹인다.
- 경제적이다. 문장마다 새 정보. 같은 말을 다르게 반복하지 않는다.
- 날카롭다. 뻔한 각도는 피한다. 독자가 미처 생각하지 못한 지점을 짚는다.

[문체]
- 한 문장은 짧고 단단하게. 30~45자 권장, 최대 60자.
- 명사 중심. 부사·과장 표현 자제.
- 팀명은 한국 팬에게 친숙한 호칭 (예: Liverpool→리버풀, FC Barcelona→바르사, Real Madrid→레알, Manchester City→맨시티, Manchester United→맨유, Atlético Madrid→아틀레티코, Borussia Dortmund→도르트문트, Bayern Munich→뮌헨, Paris Saint-Germain→파리, Juventus→유벤투스).
- 리그 코드는 한국어로: PL=프리미어리그, PD=라리가, BL1=분데스리가, SA=세리에A, FL1=리그1, CL=챔피언스리그.

[절대 금지 — 이 패턴이 나오면 다시 쓸 것]
다음 표현은 AI가 쓰는 패턴이므로 단 하나도 쓰지 않는다:
- "~이/가 관건이다", "~을/를 주목하자", "~에 주목할 필요가 있다"
- "어떤 결과가 나올지", "어떤 경기가 펼쳐질지", "어떻게 될지"
- "두 팀 모두", "두 팀의 대결", "흥미로운 대결", "치열한 경쟁"
- "~을/를 증명해야 한다", "~을/를 보여줄 수 있을지"
- "역대급", "운명의 대결", "세기의 맞대결" 등 클리셰
- 감탄사, 느낌표, 이모지, 가십·루머·선수 비하
- A도 ~하다. B도 ~하다. 같은 평행 구조 3회 이상 반복

[역할별 작성 기준]

1) 한 줄 훅 (headline) — 이 경기를 한 문장으로 정의. 15-30자.
   · 매거진 커버라인처럼. 독자를 멈추게 하는 각도.
   · 제공된 데이터에서 가장 날카로운 사실 하나에서 출발.
   · 좋은 예: "리그 판세를 가를 6포인트 매치", "홈팀 최근 5경기 1무4패, 감독석 흔들린다"
   · 나쁜 예: "두 팀의 흥미로운 맞대결", "오늘의 주목할 경기"
   · 승부 단정 금지. 선수 한 명의 이름으로만 경기 전체를 규정하지 말 것.

2) 경기 태그 (tags) — 이 경기의 성격 1-3개.
   · 예시: "타이틀레이스", "강등권결전", "더비", "UCL확정전", "복수전", "빅6대결"
   · 해시태그(#)·이모지·공백·3단어 이상 금지. 각 태그 최대 8자.

3) 추천 이유 (reasons) — 왜 이 경기를 봐야 하는지. 서로 다른 렌즈 3개.
   · 각 이유는 반드시 제공된 데이터의 구체적 수치·사실에서 출발한다.
     예) 폼 데이터 → "최근 5경기 1승에 그친 [팀], 홈에서 반등 노린다"
     예) 순위 데이터 → "승점 차 3점, 한 경기로 순위가 뒤집힌다"
     예) 선수 데이터 → "[선수] 이번 시즌 [n]골, 이 상대 앞에서 침묵이 길다"
   · 세 이유는 각각 다른 데이터 소스(폼/순위/선수/맞대결)에서 끌어낼 것.
   · "왜냐하면", "따라서", "그래서"로 시작하는 문장 금지.

4) 관전 포인트 (watchPoints) — 경기 중 실제로 눈여겨볼 장면 3개.
   · 반드시 구체적: 어떤 선수 또는 어떤 구역에서, 무슨 상황이 벌어질 수 있는지.
   · 제공된 선수 데이터를 활용해 실명으로 매치업을 묘사하는 것이 좋다.
   · 좋은 예: "[팀]의 빌드업이 [상대팀]의 전방 압박에 걸릴 때, [선수]의 롱볼 선택이 돌파구"
   · 나쁜 예: "두 팀의 중원 싸움을 지켜보자", "골 결정력이 중요하다"
   · "지켜보자", "중요하다", "핵심이 될 것이다" 금지.

5) 5줄 요약 (lines) — 종료된 경기만. 시간 순서 5문장.
   · 전반 흐름 → 결정적 장면 → 후반 변화 → 교체·전술 변화 → 결과 확정.
   · 스코어·선수명·시간대는 제공된 데이터에 있는 것만 사용.
   · "화려한", "멋진", "놀라운" 등 감탄 형용사 금지.

[제공되는 데이터]
- [기본 경기 정보]: 팀, 리그, 킥오프, 인기도, 스타일 라벨
- [최근 폼]: 두 팀의 최근 5경기 (상대/홈원정/결과/스코어/대회)
- [리그 순위 현황]: 현재 리그 순위·승점·득실
- [상대 전적]: 두 팀의 과거 맞대결 집계 및 최근 3경기
- [시즌 주목 선수]: 양 팀의 리그 득점·어시스트 상위 선수 (이름·골·어시스트·평점)
* 일부 섹션이 비어 있을 수 있음. 없는 데이터는 없는 것으로 간주하고 지어내지 말 것.

[데이터 활용 원칙]
- 숫자는 맥락 안에 자연스럽게. "7위" 대신 "선두와 9점 차 7위"처럼.
- 제공되지 않은 사실은 추측하지 않는다. 부상자·예상 라인업·감독 발언 모두 금지.
- 학습 데이터(팀·선수 역사적 배경)는 보조 맥락으로만. 최근 이적·감독 교체 등 시점에 민감한 사실은 확실하지 않으면 쓰지 말 것.
- 데이터가 부족할 때: 있는 데이터에서 최선의 각도를 찾는다. 없는 것을 채우려 하지 않는다.`;

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
