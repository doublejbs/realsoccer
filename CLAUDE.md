# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 자동으로 참조하는 프로젝트 가이드입니다.

## 프로젝트 한 줄 정의

**해외축구 팬을 위한 개인화 경기 큐레이션 서비스.** "오늘 볼 경기 하나", 왜 봐야 하는지, 무엇을 볼지, 끝난 뒤 빠르게 따라잡기.

## 반드시 지킬 원칙

1. **기능 욕심 금지.** 핵심 경험(오늘의 경기 1개 추천 + 이유 + 관전 포인트 + 5줄 요약)을 벗어난 추가 기능은 먼저 제안하고 승인받은 뒤 구현.
2. **단순함 > 추상화.** 과도한 추상화·레이어·디자인 패턴은 피한다. 3줄의 반복이 조기 추상화보다 낫다.
3. **데이터와 설명의 분리.**
   - **데이터·순위·점수 계산 = 코드** (`src/services/recommendation.ts` 등 순수 함수)
   - **설명·내러티브·요약 = LLM** (`src/services/llm.ts`)
   - LLM은 절대 경기 데이터나 순위를 만들지 않는다. Claude가 반환한 숫자는 신뢰하지 않는다.
4. **Mock 우선, 실데이터는 플래그.** `.env`의 `USE_MOCK`로 mock/real을 토글. 새 외부 의존성은 mock 폴백이 가능해야 한다.
5. **캐시는 AI 성공 시에만.** `content.ts`는 AI가 실패하면 폴백 결과를 DB에 저장하지 않는다 (`match_contents` 오염 방지).
6. **로그인 필수, 로컬 저장 없음.** 모든 사용자 데이터는 `user_id` 기준으로 DB에 저장.
7. **외부 API 호출은 cron 전용.** 유저 요청은 DB(`matches`, `match_contents`)만 읽는다. football-data.org와 Anthropic API는 `/api/cron/refresh`(daily)에서만 호출. live match 스코어는 최대 24h 지연 — 수용된 트레이드오프.
   - **예외**: 최신 뉴스([`services/news.ts`](src/services/news.ts) Google News RSS)는 신선도가 가치라 유저 요청 시점에 호출. Next fetch `revalidate: 600`(10분)으로 부하 완화. 페이지 렌더 블로킹하지 않도록 Suspense로 감싸 스트리밍.

## 기술 스택 (확정)

- **Next.js 14** App Router + TypeScript
- **Tailwind CSS** (커스텀 다크 팔레트 + Fraunces/Instrument Sans/JetBrains Mono)
- **Supabase** (Auth — Google OAuth만, Postgres)
- **Prisma** ORM (Drizzle 사용 금지)
- **Zod v4** validation (Anthropic SDK의 `zodOutputFormat`은 v4 필수)
- **Anthropic SDK** (`@anthropic-ai/sdk`) — 기본 모델 `claude-sonnet-4-6`, 고품질 필요 시 `claude-opus-4-7`
- **football-data.org** v4 (무료 티어, 분당 10회 제한)

## 아키텍처 맵

```
src/
├── app/                     # Next App Router
│   ├── page.tsx             # 홈 — 오늘 1개 + 보조 3개 + 최근 종료 3개
│   ├── matches/[id]/        # 상세 — 이유/관전포인트/요약
│   ├── settings/            # 선호 편집
│   ├── login/               # Google OAuth 진입점
│   ├── auth/callback/       # Supabase OAuth 콜백
│   ├── api/                 # REST 엔드포인트 (me, today, matches, preferences)
│   ├── opengraph-image.tsx  # 동적 OG 이미지 (1200×630)
│   ├── icon.svg             # favicon
│   └── loading.tsx          # 스켈레톤
├── components/              # UI (MatchHero, TeamCrest, Skeleton 등)
├── services/                # 비즈니스 로직
│   ├── recommendation.ts    # 순수 함수 점수 계산 (절대 LLM 호출 금지)
│   ├── matches.ts           # 유저 facade — DB 조회 (+ USE_MOCK 분기)
│   ├── matches-db.ts        # Prisma 전용 — upsertMatches / find*
│   ├── football-data.ts     # 외부 API 어댑터 (cron에서만 호출)
│   ├── football-data-context.ts  # 폼/순위/H2H 확장 컨텍스트 (cron에서만)
│   ├── llm.ts               # Claude API 호출 (cron에서만)
│   └── content.ts           # get*=DB 읽기 전용 / ensure*=cron 전용 AI 생성
├── app/api/cron/refresh/    # Vercel Cron 매일 — match sync + AI 사전 생성
├── lib/                     # supabase 클라이언트, prisma, auth, validation, mock/
├── middleware.ts            # 비인증 사용자 /login 리다이렉트
└── types/                   # 도메인 타입 (MatchDTO, TeamDTO 등)

prisma/schema.prisma         # User, UserPreference, Match, MatchContent
```

## 데이터 플로우

### 유저 요청 경로 (외부 API 호출 0번)

1. **페이지 요청** → `requireUser()` (auth.ts) → 세션 있으면 Prisma에 upsert, 없으면 /login 리다이렉트.
2. **오늘 경기 조회** → `getTodaysMatches()` → `matches-db.findTodaysMatches()` → Postgres `matches` 테이블 select. `USE_MOCK=true`일 때만 mock.
3. **추천 점수** → `rankMatches(matches, prefs)` → 중요도·인기·폼·스타일·선호 가중합 → 상위 1개/3개 분리.
4. **AI 컨텐츠 조회** → `getReasons/getWatchPoints/getSummary` → `match_contents` 테이블 select. 없으면 fallback 문구 반환 (Claude 호출 X).
5. **응답** → 서버 컴포넌트 렌더.

### Cron 경로 (매일 06:00 KST, `/api/cron/refresh`)

1. `fetchUpcomingMatches(7)` football-data 호출 → `upsertMatches()`로 `matches` 테이블 sync.
2. `rankMatches`로 상위 10개 선정 → `ensureReasons/ensureWatchPoints` (skip-if-cached) → Claude 생성 → `match_contents` upsert.
3. `fetchRecentFinishedMatches(2)` football-data 호출 → `upsertMatches()`로 sync → `ensureSummary` (`status==FINISHED`만).
4. Authorization: `Bearer $CRON_SECRET` 검증.

## 추천 점수 공식 (recommendation.ts)

```
score = 중요도(0.30) + 인기도(0.15) + 최근 폼(0.10) + 스타일 충돌(0.10)
      + 사용자 선호(0.15) + 시간 근접도(0.20)
```

- 시간 근접도: 킥오프까지 남은 시간 기반 단계 함수. ≤2h=100, ≤6h=90, ≤12h=75, ≤24h=55, ≤48h=30, ≤72h=15, else=5. 이미 시작/종료 경기는 0.
- 가중치는 상수. 바꾸려면 사전 논의.

## 환경 변수 (.env)

| 변수 | 용도 | 필수 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` | Supabase 클라이언트 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 | ⚠️ 신중히 |
| `DATABASE_URL` / `DIRECT_URL` | Prisma (pooler 6543/5432) | ✅ |
| `FOOTBALL_DATA_API_KEY` | 32자 hex | ✅ (USE_MOCK=false 시) |
| `ANTHROPIC_API_KEY` | Claude | ✅ (AI 생성 시) |
| `ANTHROPIC_MODEL` | 기본 `claude-sonnet-4-6`, 고품질 `claude-opus-4-7` | ✅ |
| `USE_MOCK` | `true`면 외부 API 스킵, mock 데이터 사용 | ✅ |
| `NEXT_PUBLIC_SITE_URL` | OG 이미지 절대경로 (카카오 공유에 필수) | 프로덕션 필수 |
| `CRON_SECRET` | `/api/cron/refresh` 인증. Vercel Cron이 Bearer 헤더로 전달 | ✅ |

## 주요 명령어

```bash
npm run dev              # 개발 서버
npm run build            # 프로덕션 빌드
npm run db:push          # prisma schema 반영 (dotenv로 .env.local 로드)
npm run db:studio        # Prisma Studio (테이블 뷰어)
```

## 자주 겪는 이슈 & 대응

- **Supabase P1001 (DB 접속 불가)**: 직통 호스트(`db.xxx.supabase.co`)는 IPv6 전용 → 국내 ISP에서 차단. **반드시 pooler 호스트(`aws-1-<region>.pooler.supabase.com`)** 사용. 유저명은 `postgres.<project_ref>` 형식.
- **Prisma가 `.env.local`을 못 읽음**: Prisma CLI는 기본 `.env`만 로드. 그래서 DB 변수는 `.env`에 둠. 다른 경로 쓰려면 `dotenv -e` 프리픽스.
- **특수문자 DB 비밀번호**: `!` → `%21` URL 인코딩.
- **`match_contents`에 폴백 캐시됨**: 폴백 결과는 DB 저장 안 됨 (content.ts의 보호). 과거에 저장된 게 있으면 `DELETE FROM match_contents`.
- **Claude `PARSE_FAILED`**: `max_tokens`가 너무 작거나 `thinking` 과다 사용. 현재 설정은 4096 토큰, thinking 미사용.
- **Zod v3/v4 혼용 시 `Cannot read properties of undefined (reading 'def')`**: `zodOutputFormat`은 v4 필수. `package.json`에서 `zod: ^4.0.0` 고정.
- **React "Invalid hook call"**: 거의 항상 `.next` 빌드 캐시 꼬임. `rm -rf .next && npm run dev`.
- **OG 이미지가 카카오에서 안 뜸**: `NEXT_PUBLIC_SITE_URL`이 localhost면 크롤러가 접근 못 함. 프로덕션 도메인으로 바꾸고 카카오 캐시 초기화.
- **football-data 429 rate limit**: 무료 티어 분당 10회. Next fetch `revalidate`가 완화하지만 동시 접속 많으면 터짐.

## AI 컨텐츠 생성 (llm.ts)

- **모델**: env `ANTHROPIC_MODEL` (기본 Sonnet 4.6).
- **구조화 출력**: `client.messages.parse()` + `zodOutputFormat(schema)`. 파싱 실패 시 throw.
- **시스템 프롬프트**: 한글 문체 가이드 + 데이터 활용 지침 + 금기(승부 단정·클리셰·이모지). `cache_control` 붙어있음 — 수정 시 프롬프트 캐시 무효화됨.
- **도구 사용 없음**: 데이터는 football-data.org API만 사용. Claude는 제공된 데이터로 내러티브만 작성 — 웹 검색·부상 정보 추정 등 불가.
- **Thinking 끔**: 단순 작성 작업이라 adaptive thinking은 토큰만 낭비 → 비활성.

## UI 컨벤션

- **모바일 퍼스트.** 모든 페이지는 `max-w-screen-sm`.
- **다크 테마 고정.** 팔레트: `bg/surface/elevated/border/ink` + 단일 액센트 `#D4FF4A`.
- **타이포**: `font-display` = Fraunces (세리프), `font-sans` = Instrument Sans (본문), `font-mono` = JetBrains Mono (라벨·숫자).
- **애니메이션**: `.rise` + `.rise-{n}` 스태거(50ms~450ms 간격).
- **좁은 폭 주의**: flex 3-column 레이아웃은 피하기. 팀명처럼 가변 길이 텍스트는 `min-w-0 flex-1 break-keep` + `shrink-0` 고정 요소 조합.
- **컴포넌트가 Link를 쓰면 서버 컴포넌트로 충분.** 클라이언트 훅(useState, useEffect 등)이 없으면 `"use client"` 붙이지 말 것.
- **프론트엔드 디자인 작업 시**: `frontend-design:frontend-design` skill을 사용해 편집적/브루탈리즘 스포츠 매거진 느낌을 유지.

## 하지 말 것

- LLM이 경기 데이터·순위·결과를 만들게 하지 말 것.
- `recommendation.ts`에서 Claude 호출 금지 (순수 함수 유지).
- Mock 데이터에 의존하는 코드를 프로덕션 경로에 남기지 말 것 (USE_MOCK 분기만 허용).
- `.env` / `.env.local`을 커밋하지 말 것 (`.gitignore`에 포함).
- 유저 요청 경로에서 외부 API(football-data, Anthropic) 호출 금지 — 반드시 DB를 통해서만. 외부 호출은 `/api/cron/refresh`에서만.
- 무의미한 주석(변수명이 이미 말해주는 것) 추가 금지. 왜(Why)만 주석.
- 일반적인 에러 바운더리·try/catch 남발 금지. 시스템 경계(외부 API, 외부 DB)에서만 방어적으로.

## 배포 전 체크리스트

- [ ] `.env`의 `NEXT_PUBLIC_SITE_URL`을 실 도메인으로
- [ ] Supabase Authentication → Google OAuth provider에 프로덕션 콜백 URL 등록 (`{domain}/auth/callback`)
- [ ] Google Cloud Console OAuth 동의 화면 & 승인된 리디렉션 URI 업데이트
- [ ] `npx prisma db push` 프로덕션 DB 반영
- [ ] `USE_MOCK=false` 확인
- [ ] Vercel Environment Variables에 `CRON_SECRET` 등록
- [ ] Vercel Dashboard → Crons에서 `/api/cron/refresh` 스케줄 확인 (`0 21 * * *`)
- [ ] 첫 배포 후 `curl -H "Authorization: Bearer $CRON_SECRET" {domain}/api/cron/refresh` 수동 1회 실행 (DB 프리워밍)
- [ ] 카카오 OG 캐시 초기화 ([developers.kakao.com/tool/clear/og](https://developers.kakao.com/tool/clear/og))
