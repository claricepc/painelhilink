-- FitDuo — Supabase Schema
-- Execute este arquivo no SQL Editor do Supabase

-- ================================================
-- TABELA: users
-- ================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT         NOT NULL,
  avatar_emoji  TEXT         DEFAULT '👤',
  color         TEXT         DEFAULT '#7c6ff7',
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- Seed dos dois usuários fixos
INSERT INTO users (id, name, avatar_emoji, color) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Rafael',  '🦁', '#7c6ff7'),
  ('22222222-2222-2222-2222-222222222222', 'Clarice', '🌸', '#ff6b6b')
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- TABELA: workout_plans
-- ================================================
CREATE TABLE IF NOT EXISTS workout_plans (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT         NOT NULL,
  description TEXT,
  exercises   JSONB        DEFAULT '[]',
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ================================================
-- TABELA: workout_logs
-- ================================================
CREATE TABLE IF NOT EXISTS workout_logs (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID         REFERENCES users(id) ON DELETE CASCADE,
  plan_id          UUID         REFERENCES workout_plans(id) ON DELETE SET NULL,
  plan_name        TEXT,
  duration_minutes INTEGER,
  notes            TEXT,
  logged_at        TIMESTAMPTZ  DEFAULT NOW()
);

-- ================================================
-- TABELA: body_records
-- ================================================
CREATE TABLE IF NOT EXISTS body_records (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         REFERENCES users(id) ON DELETE CASCADE,
  weight_kg     DECIMAL(5,2),
  body_fat_pct  DECIMAL(4,1),
  chest_cm      DECIMAL(5,1),
  waist_cm      DECIMAL(5,1),
  hip_cm        DECIMAL(5,1),
  bicep_cm      DECIMAL(5,1),
  notes         TEXT,
  recorded_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ================================================
-- TABELA: water_logs
-- ================================================
CREATE TABLE IF NOT EXISTS water_logs (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         REFERENCES users(id) ON DELETE CASCADE,
  amount_ml  INTEGER      NOT NULL CHECK (amount_ml > 0),
  logged_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ================================================
-- TABELA: daily_checklist
-- ================================================
CREATE TABLE IF NOT EXISTS daily_checklist (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         REFERENCES users(id) ON DELETE CASCADE,
  item         TEXT         NOT NULL,
  is_completed BOOLEAN      DEFAULT FALSE,
  date         DATE         DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ================================================
-- TABELA: points
-- ================================================
CREATE TABLE IF NOT EXISTS points (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         REFERENCES users(id) ON DELETE CASCADE,
  action      TEXT         NOT NULL,
  description TEXT,
  points      INTEGER      NOT NULL,
  earned_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ================================================
-- ÍNDICES de performance
-- ================================================
CREATE INDEX IF NOT EXISTS idx_workout_logs_user     ON workout_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_body_records_user     ON body_records(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date  ON water_logs(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_checklist_user_date   ON daily_checklist(user_id, date);
CREATE INDEX IF NOT EXISTS idx_points_user           ON points(user_id, earned_at DESC);

-- ================================================
-- VERIFICAÇÃO: confirmar usuários criados
-- ================================================
SELECT id, name, avatar_emoji FROM users;

-- ================================================
-- TABELA: financial_transactions (Caixa Operacional)
-- Apenas movimentações realizadas no banco, sem sócios
-- ================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE         NOT NULL,
  description TEXT         NOT NULL,
  type        TEXT         NOT NULL CHECK (type IN ('receita', 'despesa')),
  value       DECIMAL(12,2) NOT NULL CHECK (value > 0),
  category    TEXT,        -- nulo sinalizado como inconsistência
  origin      TEXT,        -- conta bancária / fonte
  status      TEXT         NOT NULL DEFAULT 'realizado'
                           CHECK (status IN ('realizado', 'pendente')),
  flags       TEXT[]       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ================================================
-- TABELA: partner_transactions (Conta Corrente de Sócios)
-- Retiradas, aportes e pagamentos cruzados de sócios
-- Isoladas do resultado operacional
-- ================================================
CREATE TABLE IF NOT EXISTS partner_transactions (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE         NOT NULL,
  description  TEXT         NOT NULL,
  type         TEXT         NOT NULL
                            CHECK (type IN ('retirada', 'aporte', 'pagamento_cruzado', 'emprestimo')),
  value        DECIMAL(12,2) NOT NULL CHECK (value > 0),
  category     TEXT,
  origin       TEXT,        -- conta de origem/destino
  partner_name TEXT         NOT NULL,
  flags        TEXT[]       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ================================================
-- ÍNDICES financeiros
-- ================================================
CREATE INDEX IF NOT EXISTS idx_fin_tx_date    ON financial_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_fin_tx_type    ON financial_transactions(type, date DESC);
CREATE INDEX IF NOT EXISTS idx_partner_tx_date ON partner_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_partner_name   ON partner_transactions(partner_name, date DESC);
