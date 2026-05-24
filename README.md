# 언커버링 (Uncovering)

> 설문이 아닌 미션으로, 직접 해보면서 나를 발견하는 진로 탐색 서비스

대학생이 4가지 미션을 수행하고, AI가 답변 패턴을 분석해 8개 축의 진로 성향 프로파일과 추천 직무를 제공합니다.

## 주요 기능

- **4단계 미션**: 단순 연상 → 이야기 만들기 → 창의 발상 → 비즈니스 아이디어 (난이도 순)
- **반응 체크**: 미션별 재미·부담·몰입·다시할의향 슬라이더 (1~5점)
- **AI 분석**: Claude Sonnet이 답변에서 진로 성향 8개 축 점수 산출
- **결과 시각화**: 바 차트 + 인사이트 3개 + 추천 직무 태그

## 기술 스택

- Next.js 14 (App Router)
- Tailwind CSS
- Anthropic SDK (`@anthropic-ai/sdk`)
- Vercel 배포

---

## 로컬 실행

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local`을 열고 Anthropic API 키를 입력하세요:

```
ANTHROPIC_API_KEY=sk-ant-...
```

> API 키는 [console.anthropic.com](https://console.anthropic.com)에서 발급받을 수 있습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## Vercel 배포

### 방법 1: GitHub 연동 (권장)

1. 이 프로젝트를 GitHub에 push
2. [vercel.com](https://vercel.com)에서 **New Project** → GitHub 저장소 선택
3. **Environment Variables** 탭에서 `ANTHROPIC_API_KEY` 추가
4. **Deploy** 클릭

### 방법 2: Vercel CLI

```bash
npm install -g vercel
vercel
```

배포 과정에서 `ANTHROPIC_API_KEY` 환경변수를 입력하라는 프롬프트가 나옵니다.

---

## 환경변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Anthropic API 키 | ✅ |

---

## 프로젝트 구조

```
├── app/
│   ├── page.tsx              # 온보딩 (/)
│   ├── mission/page.tsx      # 미션 수행 (/mission)
│   ├── analyzing/page.tsx    # 분석 중 (/analyzing)
│   ├── result/page.tsx       # 결과 (/result)
│   └── api/analyze/route.ts  # Claude API 호출
├── lib/
│   ├── missions.ts           # 미션 데이터
│   └── types.ts              # TypeScript 타입
└── .env.example
```

---

## 미션 데이터 변경

`lib/missions.ts`의 `MISSIONS` 배열을 수정하면 미션 내용을 바꿀 수 있습니다.

## AI 분석 프롬프트 변경

`app/api/analyze/route.ts`의 `SYSTEM_PROMPT` 상수를 수정하면 분석 기준을 조정할 수 있습니다.
