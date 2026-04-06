-- Reese Reviews pipeline tables
-- Orders: input contract

CREATE TYPE order_category AS ENUM ('electronics','beauty','kitchen','fitness','pets','home','other');
CREATE TYPE review_persona AS ENUM ('reese','audrey','custom');
CREATE TYPE review_tone AS ENUM ('enthusiastic','balanced','critical');
CREATE TYPE job_status AS ENUM (
  'queued','researching','generating','awaiting_approval',
  'synthesizing','rendering','assembling','distributing','done','failed','rejected'
);

CREATE TABLE IF NOT EXISTS orders (
  order_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(512) NOT NULL,
  asin         VARCHAR(20),
  product_url  TEXT,
  category     order_category DEFAULT 'other',
  purchase_price FLOAT,
  purchase_date  DATE,
  usage_notes    TEXT,
  review_persona review_persona DEFAULT 'reese',
  review_tone    review_tone DEFAULT 'balanced',
  target_platform JSONB DEFAULT '[]',
  affiliate_tag  VARCHAR(100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  job_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  status       job_status NOT NULL DEFAULT 'queued',
  stage_statuses JSONB DEFAULT '{}',
  review_text  TEXT,
  review_script TEXT,
  star_rating  FLOAT CHECK (star_rating >= 1 AND star_rating <= 5),
  audio_url    TEXT,
  image_urls   JSONB DEFAULT '[]',
  video_url    TEXT,
  final_asset_url TEXT,
  telegram_notified_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS errors (
  id           BIGSERIAL PRIMARY KEY,
  job_id       UUID NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
  stage        VARCHAR(50),
  message      TEXT NOT NULL,
  stack_trace  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_costs (
  id           BIGSERIAL PRIMARY KEY,
  job_id       UUID NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
  stage        VARCHAR(50),
  service      VARCHAR(100),
  amount_usd   FLOAT NOT NULL DEFAULT 0,
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
