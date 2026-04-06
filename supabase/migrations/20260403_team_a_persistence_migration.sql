-- ============================================================
-- TEAM A: Supabase Persistence Migration
-- Date: April 3, 2026
-- Migrates localStorage stores to Supabase tables:
--   • taxStore (persons, entities, income, documents, writeoffs, quarterly)
--   • expenseStore (expenses)
--   • vineReviewStore (vine items, avatars)
--   • productLifecycleStore (product lifecycle)
--   • reviewStore local submissions
--   • user profiles
-- All tables use RLS with user_id FK to auth.users
-- ============================================================

-- ─── HELPER: Ensure updated_at trigger function exists ──────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. USER PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'owner')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. TAX MODULE: Business Entities
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ein TEXT,
  entity_type TEXT NOT NULL DEFAULT 'sole_prop'
    CHECK (entity_type IN ('sole_prop', 'llc', 's_corp', 'partnership', 'rental', 'gig')),
  schedule TEXT NOT NULL DEFAULT 'schedule_c'
    CHECK (schedule IN ('schedule_c', 'schedule_e', 'schedule_f', 'none')),
  home_office_eligible BOOLEAN NOT NULL DEFAULT false,
  state TEXT,
  formation_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'dissolved')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.business_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own business entities"
  ON public.business_entities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER business_entities_updated_at
  BEFORE UPDATE ON public.business_entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_business_entities_user ON public.business_entities(user_id);

-- ============================================================
-- 3. TAX MODULE: Tax Persons
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tax_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'primary'
    CHECK (role IN ('primary', 'spouse', 'dependent')),
  ssn_last4 TEXT,
  filing_status TEXT DEFAULT 'single'
    CHECK (filing_status IN ('single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household', 'qualifying_widow')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tax_persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own tax persons"
  ON public.tax_persons FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER tax_persons_updated_at
  BEFORE UPDATE ON public.tax_persons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_tax_persons_user ON public.tax_persons(user_id);

-- ─── Junction: Person <-> Business Entity ───────────────────

CREATE TABLE IF NOT EXISTS public.person_business_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.tax_persons(id) ON DELETE CASCADE,
  business_entity_id UUID NOT NULL REFERENCES public.business_entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(person_id, business_entity_id)
);

ALTER TABLE public.person_business_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own person-entity links"
  ON public.person_business_entities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. TAX MODULE: Income Sources
-- ============================================================

CREATE TABLE IF NOT EXISTS public.income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.tax_persons(id) ON DELETE CASCADE,
  business_entity_id UUID REFERENCES public.business_entities(id) ON DELETE SET NULL,
  tax_year INTEGER NOT NULL,
  label TEXT NOT NULL,
  payer_name TEXT NOT NULL,
  payer_ein TEXT,
  income_type TEXT NOT NULL
    CHECK (income_type IN ('w2', '1099_nec', '1099_misc', '1099_k', '1099_div', '1099_int', 'ssa_1099', 'rental', 'self_employ', 'other')),
  gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  federal_withheld NUMERIC(12,2) NOT NULL DEFAULT 0,
  state_withheld NUMERIC(12,2) NOT NULL DEFAULT 0,
  ss_wages NUMERIC(12,2),
  medicare_wages NUMERIC(12,2),
  document_id UUID,
  reconciled BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own income sources"
  ON public.income_sources FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER income_sources_updated_at
  BEFORE UPDATE ON public.income_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_income_sources_user_year ON public.income_sources(user_id, tax_year);
CREATE INDEX idx_income_sources_person ON public.income_sources(person_id);

-- ============================================================
-- 5. TAX MODULE: Tax Documents
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.tax_persons(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  document_type TEXT NOT NULL
    CHECK (document_type IN ('w2', '1099_nec', '1099_misc', '1099_k', '1099_div', '1099_int', 'ssa_1099', 'receipt', 'other')),
  file_name TEXT NOT NULL,
  file_storage_path TEXT,
  file_size_bytes INTEGER DEFAULT 0,
  mime_type TEXT,
  extracted_fields JSONB DEFAULT '{}',
  confirmed BOOLEAN NOT NULL DEFAULT false,
  linked_income_source_id UUID REFERENCES public.income_sources(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT DEFAULT ''
);

ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own tax documents"
  ON public.tax_documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_tax_documents_user_year ON public.tax_documents(user_id, tax_year);

-- ============================================================
-- 6. TAX MODULE: Write-Offs / Deductions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.write_offs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.tax_persons(id) ON DELETE CASCADE,
  business_entity_id UUID REFERENCES public.business_entities(id) ON DELETE SET NULL,
  tax_year INTEGER NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  vendor TEXT DEFAULT '',
  category TEXT NOT NULL
    CHECK (category IN ('home_office', 'supplies', 'internet', 'phone', 'shipping', 'product_costs', 'vehicle_mileage', 'advertising', 'professional_services', 'equipment', 'education', 'meals_entertainment', 'other')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductible_pct NUMERIC(5,2) NOT NULL DEFAULT 100,
  deductible_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  receipt_document_id UUID REFERENCES public.tax_documents(id) ON DELETE SET NULL,
  mileage_miles NUMERIC(10,2),
  mileage_rate NUMERIC(6,4),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.write_offs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own write-offs"
  ON public.write_offs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_write_offs_user_year ON public.write_offs(user_id, tax_year);
CREATE INDEX idx_write_offs_person ON public.write_offs(person_id);

-- ============================================================
-- 7. TAX MODULE: Quarterly Estimates
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quarterly_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.tax_persons(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  due_date DATE NOT NULL,
  estimated_income NUMERIC(12,2) NOT NULL DEFAULT 0,
  estimated_tax_owed NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_date DATE,
  paid BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  UNIQUE(user_id, person_id, tax_year, quarter)
);

ALTER TABLE public.quarterly_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own quarterly estimates"
  ON public.quarterly_estimates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 8. EXPENSE STORE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_entity_id UUID REFERENCES public.business_entities(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  merchant TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'uncategorized'
    CHECK (category IN (
      'home_office', 'equipment', 'software_subscriptions', 'advertising_marketing',
      'professional_services', 'shipping_postage', 'office_supplies', 'travel_vehicle',
      'meals_entertainment', 'education_training', 'phone_internet', 'other_business',
      'personal', 'uncategorized'
    )),
  is_write_off BOOLEAN NOT NULL DEFAULT false,
  write_off_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'bank_import', 'amazon')),
  receipt_url TEXT,
  notes TEXT DEFAULT '',
  tax_year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own expenses"
  ON public.expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_expenses_user_year ON public.expenses(user_id, tax_year);

-- ============================================================
-- 9. VINE REVIEW STORE: Items
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vine_review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  asin TEXT DEFAULT '',
  category TEXT DEFAULT 'other',
  order_date TIMESTAMPTZ,
  review_deadline TIMESTAMPTZ,
  etv NUMERIC(12,2) NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'generated', 'edited', 'submitted', 'overdue')),
  generated_review JSONB,
  scraped_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vine_review_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own vine review items"
  ON public.vine_review_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER vine_review_items_updated_at
  BEFORE UPDATE ON public.vine_review_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_vine_review_items_user ON public.vine_review_items(user_id);
CREATE INDEX idx_vine_review_items_status ON public.vine_review_items(status);

-- ============================================================
-- 10. VINE REVIEW STORE: Avatars
-- ============================================================

CREATE TABLE IF NOT EXISTS public.review_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  avatar_type TEXT NOT NULL DEFAULT 'custom'
    CHECK (avatar_type IN ('stock', 'custom')),
  gender TEXT NOT NULL DEFAULT 'neutral'
    CHECK (gender IN ('male', 'female', 'neutral')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.review_avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own avatars"
  ON public.review_avatars FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 11. PRODUCT LIFECYCLE STORE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_lifecycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_entity_id UUID REFERENCES public.business_entities(id) ON DELETE SET NULL,
  current_stage TEXT NOT NULL DEFAULT 'ORDERED'
    CHECK (current_stage IN ('ORDERED', 'SHIPPED', 'RECEIVED', 'REVIEWED', 'TRANSFERRED', 'LISTED', 'SOLD')),
  -- Stage data stored as JSONB for flexibility
  ordered JSONB,
  shipped JSONB,
  received JSONB,
  reviewed JSONB,
  transferred JSONB,
  listed JSONB,
  sold JSONB,
  tags TEXT[] DEFAULT '{}',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  internal_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_lifecycle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own product lifecycle"
  ON public.product_lifecycle FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER product_lifecycle_updated_at
  BEFORE UPDATE ON public.product_lifecycle
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_product_lifecycle_user ON public.product_lifecycle(user_id);
CREATE INDEX idx_product_lifecycle_stage ON public.product_lifecycle(current_stage);

-- ============================================================
-- 12. LOCAL REVIEW SUBMISSIONS (user-submitted reviews)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.review_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT NOT NULL,
  rating NUMERIC(3,1) NOT NULL DEFAULT 5,
  excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '',
  pros TEXT[] DEFAULT '{}',
  cons TEXT[] DEFAULT '{}',
  verdict TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  product_name TEXT DEFAULT '',
  product_link TEXT DEFAULT '',
  affiliate_tag TEXT DEFAULT 'meetaudreyeva-20',
  reviewer_name TEXT DEFAULT '',
  reviewer_email TEXT DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.review_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a review (even unauthenticated via anon key)
CREATE POLICY "Anyone can insert review submissions"
  ON public.review_submissions FOR INSERT
  WITH CHECK (true);

-- Only the submitter or admins can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON public.review_submissions FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
  );

-- Only admins can update/delete submissions
CREATE POLICY "Admins can update submissions"
  ON public.review_submissions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

CREATE POLICY "Admins can delete submissions"
  ON public.review_submissions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

CREATE TRIGGER review_submissions_updated_at
  BEFORE UPDATE ON public.review_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DONE: All tables created with RLS enabled
-- ============================================================
