-- =============================================
-- 언커버링 MVP 스키마
-- Supabase SQL Editor에 전체 복붙 후 실행
-- =============================================

-- 1. 사용자 (익명 + 닉네임)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname      TEXT NOT NULL,
  push_token    TEXT,                        -- Expo 푸시 토큰
  current_day   INT NOT NULL DEFAULT 1,      -- 현재 진행 일차 (1~7)
  started_at    TIMESTAMPTZ,                 -- 프로그램 시작 시각
  day_completed_at TIMESTAMPTZ,              -- 해당 일차 완료 시각
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 미션풀
CREATE TABLE missions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_key       TEXT UNIQUE NOT NULL,    -- 예: M001
  scenario          TEXT NOT NULL,           -- 시나리오 본문
  prompt            TEXT NOT NULL,           -- 사용자에게 묻는 질문
  trait_axes        TEXT[] NOT NULL,         -- 측정 행동축 (예: ["착수형","분석형"])
  difficulty        FLOAT NOT NULL,          -- b 파라미터 (-3 ~ +3)
  discrimination    FLOAT NOT NULL,          -- a 파라미터 (0.5 ~ 2.5)
  axis_weights      JSONB NOT NULL,          -- {"착수형": 0.5, "분석형": 0.3, ...}
  order_in_day      INT NOT NULL,            -- 일차 내 순서: 1=아침, 2=점심, 3=저녁
  expected_time_min INT NOT NULL DEFAULT 4,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 사용자별 일일 미션 배정
CREATE TABLE user_missions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id    UUID NOT NULL REFERENCES missions(id),
  day           INT NOT NULL,                -- 1~7
  order_in_day  INT NOT NULL,               -- 1~3
  scheduled_at  TIMESTAMPTZ NOT NULL,       -- 발송 시각 (당일 10:00 KST)
  expires_at    TIMESTAMPTZ NOT NULL,       -- 마감 시각 (당일 17:00 KST)
  is_unlocked   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, day, order_in_day)
);

-- 4. 사용자 응답
CREATE TABLE responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_mission_id UUID REFERENCES user_missions(id),
  mission_id      UUID REFERENCES missions(id),
  day             INT NOT NULL,
  mission_order   INT NOT NULL,
  response_text   TEXT NOT NULL,
  nickname        TEXT,
  fun_rating      INT,
  burden_rating   INT,
  immersion_rating INT,
  retry_rating    INT,
  feeling_text    TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 운영자 채점 후 기입
  admin_score     INT,
  admin_comment   TEXT,
  reviewed_at     TIMESTAMPTZ,
  axis_scores     JSONB,                    -- {"착수형": 2, "분석형": 3, ...}  0~4 스케일
  scored_at       TIMESTAMPTZ,
  UNIQUE(user_id, user_mission_id),
  UNIQUE(user_id, day, mission_order)
);

-- 5. theta 추정값 (행동축별 사용자 현재 수준)
CREATE TABLE theta_estimates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trait_axis  TEXT NOT NULL,
  theta       FLOAT NOT NULL DEFAULT 0.0,   -- 초기값 0 (평균)
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, trait_axis)
);

-- 6. 일일 리포트 (운영자 작성 → 사용자 전달)
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day          INT NOT NULL,                -- 몇 일차 응답에 대한 리포트인지
  content      JSONB NOT NULL,             -- 리포트 내용 (카드 형태 지원)
  is_delivered BOOLEAN NOT NULL DEFAULT false,
  delivered_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, day)
);

-- =============================================
-- 인덱스
-- =============================================

CREATE INDEX idx_user_missions_user_day ON user_missions(user_id, day);
CREATE INDEX idx_responses_user_id ON responses(user_id);
CREATE INDEX idx_responses_user_day_order ON responses(user_id, day, mission_order);
CREATE INDEX idx_responses_scored ON responses(scored_at) WHERE scored_at IS NULL;
CREATE INDEX idx_reports_undelivered ON reports(is_delivered) WHERE is_delivered = false;
CREATE INDEX idx_theta_user ON theta_estimates(user_id);

-- =============================================
-- RLS (Row Level Security)
-- 앱은 user_id 기준으로만 본인 데이터 접근
-- =============================================

ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_missions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE theta_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports         ENABLE ROW LEVEL SECURITY;

-- 앱 클라이언트: anon 키 사용, user_id를 앱에서 전달
-- (Supabase 익명 Auth 사용 시 auth.uid()로 대체 가능)

-- missions: 모든 사용자 읽기 허용
CREATE POLICY "missions_read" ON missions
  FOR SELECT USING (is_active = true);

-- user_missions: 본인 것만
CREATE POLICY "user_missions_own" ON user_missions
  FOR SELECT USING (user_id = auth.uid());

-- responses: 본인 것만 읽기/쓰기
CREATE POLICY "responses_own_read"   ON responses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "responses_own_insert" ON responses FOR INSERT WITH CHECK (user_id = auth.uid());

-- theta_estimates: 본인 것만
CREATE POLICY "theta_own" ON theta_estimates
  FOR SELECT USING (user_id = auth.uid());

-- reports: 본인 것만
CREATE POLICY "reports_own" ON reports
  FOR SELECT USING (user_id = auth.uid());

-- users: 본인 것만 읽기/업데이트
CREATE POLICY "users_own_insert" ON users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_own_read"   ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_own_update" ON users FOR UPDATE USING (id = auth.uid());

-- =============================================
-- reports.content JSONB 구조 참고
-- =============================================
-- {
--   "summary": "오늘 미션에서 착수형 성향이 강하게 드러났어요.",
--   "cards": [
--     {
--       "axis": "착수형",
--       "score": 3,
--       "description": "망설임 없이 먼저 행동하는 패턴이 보입니다.",
--       "highlight": "일단 해보자가 자연스러운 사람"
--     }
--   ],
--   "next_hint": "내일은 관계 영역 미션이 이어집니다."
-- }
