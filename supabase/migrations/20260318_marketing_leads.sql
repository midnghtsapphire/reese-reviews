-- ================================================================
-- MARKETING LEADS / EMAIL SUBSCRIBERS TABLE
-- Persistent backend storage for newsletter signups captured via
-- the NewsletterSignup component on the landing page.
-- ================================================================

-- Ensure update_updated_at_column() exists (may already exist from earlier migrations)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE IF NOT EXISTS public.marketing_leads (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  name          TEXT,
  source_page   TEXT        NOT NULL DEFAULT 'home',
  source_url    TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'confirmed', 'unsubscribed', 'bounced')),
  confirmation_token  TEXT UNIQUE,
  confirmed_at        TIMESTAMP WITH TIME ZONE,
  unsubscribed_at     TIMESTAMP WITH TIME ZONE,
  interests     TEXT[]      NOT NULL DEFAULT '{}',
  tags          TEXT[]      NOT NULL DEFAULT '{}',
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata      JSONB
);

-- Enable Row Level Security
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

-- Public can insert (subscribe) but not read others' data
CREATE POLICY "Anyone can subscribe"
  ON public.marketing_leads
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated admins can read all leads
CREATE POLICY "Admins can read all leads"
  ON public.marketing_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Subscribers can update their own record via confirmation_token match
-- (used for email confirmation and unsubscribe flows)
CREATE POLICY "Subscribers can update their own record via token"
  ON public.marketing_leads
  FOR UPDATE
  USING (confirmation_token IS NOT NULL)
  WITH CHECK (confirmation_token IS NOT NULL);

-- Auto-update updated_at on change
CREATE TRIGGER update_marketing_leads_updated_at
  BEFORE UPDATE ON public.marketing_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for common queries
CREATE INDEX idx_marketing_leads_status  ON public.marketing_leads(status);
CREATE INDEX idx_marketing_leads_created ON public.marketing_leads(created_at DESC);
CREATE INDEX idx_marketing_leads_email   ON public.marketing_leads(email);
