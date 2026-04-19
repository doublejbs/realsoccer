# realsoccer

오늘 볼 축구를 가장 효율적으로 고르는 큐레이션 서비스.

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Supabase (Auth — Google OAuth, Postgres)
- Prisma ORM
- Zod (validation)
- football-data.org (경기 데이터, mock 토글 지원)
- LLM (OpenAI / Claude) — 추천 이유, 관전 포인트, 요약 생성

## 로컬 실행

```bash
cp .env.local.example .env.local
# .env.local 채운 뒤
npm install
npx prisma generate
npx prisma db push          # Supabase Postgres 연결 시
npm run dev
```

`USE_MOCK=true` 이면 football-data.org 호출 없이 mock 데이터로 동작한다.

## 구조

- `src/app` — App Router 페이지 + API 라우트
- `src/services` — 비즈니스 로직 (추천, 매치, LLM, content 캐싱)
- `src/lib` — supabase, prisma, auth, validation, mock, utilities
- `src/components` — UI 컴포넌트 (모바일 퍼스트, editorial 디자인)

## API

```
GET  /api/me                   → 현재 유저 + 선호
GET  /api/today                → 오늘의 추천 1경기
GET  /api/matches/:id          → 경기 + 이유 + 관전 포인트
GET  /api/matches/:id/summary  → 5줄 요약 (종료 경기)
PUT  /api/preferences          → 선호 저장
```

## 아키텍처 원칙

1. 데이터/계산 = 코드 (`services/recommendation.ts`)
2. 설명/요약 = LLM (`services/llm.ts`)
3. 생성 결과는 `match_contents` 테이블에 캐싱 (`services/content.ts`)
4. 모바일 퍼스트 UI, 카드 기반, 편집적 타이포그래피
