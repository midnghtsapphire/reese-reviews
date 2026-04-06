-- ============================================================
-- PLAID PERSISTENCE MIGRATION
-- Date: April 5, 2026
-- Creates Supabase tables for Plaid bank-link data:
--   • plaid_accounts  — linked bank/credit accounts per user
--   • plaid_transactions — classified transactions imported via Plaid
-- All tables use RLS with user_id FK to auth.users.
-- Access tokens MUST be stored server-side in production;
-- this table stores only the frontend-safe subset.
-- ============================================================

-- ─── HELPER ─────────────────────────────────────────────────
-- Reuse update_updated_at_column() from the previous migration.
-- Already created in 20260403_team_a_persistence_migration.sql.

-- ============================================================
-- 1. PLAID ACCOUNTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.plaid_accounts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id    TEXT        NOT NULL,          -- Plaid account_id
  item_id       TEXT        NOT NULL,          -- Plaid item_id
  name          TEXT        NOT NULL,
  official_name TEXT,
  type          TEXT        NOT NULL DEFAULT 'depository',
  subtype       TEXT,
  mask          TEXT,
  balance       NUMERIC(14,2) DEFAULT 0,
  currency      TEXT        NOT NULL DEFAULT 'USD',
  institution   TEXT,
  last_synced   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, account_id)
);

ALTER TABLE public.plaid_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plaid accounts"
  ON public.plaid_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plaid accounts"
  ON public.plaid_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plaid accounts"
  ON public.plaid_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plaid accounts"
  ON public.plaid_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER plaid_accounts_updated_at
  BEFORE UPDATE ON public.plaid_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. PLAID TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.plaid_transactions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_transaction_id    TEXT        NOT NULL,
  account_id              TEXT        NOT NULL,
  date                    DATE        NOT NULL,
  amount                  NUMERIC(14,2) NOT NULL,
  merchant_name           TEXT,
  description             TEXT,
  category                TEXT        NOT NULL DEFAULT 'expense_other',
  tax_deductible          BOOLEAN     NOT NULL DEFAULT false,
  write_off_category      TEXT,
  is_vine_related         BOOLEAN     NOT NULL DEFAULT false,
  is_amazon_purchase      BOOLEAN     NOT NULL DEFAULT false,
  credit_eligible         BOOLEAN     NOT NULL DEFAULT false,
  auto_flagged            BOOLEAN     NOT NULL DEFAULT false,
  flag_reason             TEXT,
  notes                   TEXT        DEFAULT '',
  is_manual               BOOLEAN     NOT NULL DEFAULT false,
  pending                 BOOLEAN     NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, plaid_transaction_id)
);

ALTER TABLE public.plaid_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plaid transactions"
  ON public.plaid_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plaid transactions"
  ON public.plaid_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plaid transactions"
  ON public.plaid_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plaid transactions"
  ON public.plaid_transactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS plaid_transactions_user_date
  ON public.plaid_transactions (user_id, date DESC);

CREATE INDEX IF NOT EXISTS plaid_transactions_account
  ON public.plaid_transactions (user_id, account_id);

CREATE TRIGGER plaid_transactions_updated_at
  BEFORE UPDATE ON public.plaid_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
