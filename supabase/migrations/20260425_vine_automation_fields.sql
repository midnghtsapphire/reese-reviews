-- Add automation mode, amazon URL, and scraped images columns to vine_review_items
ALTER TABLE public.vine_review_items ADD COLUMN IF NOT EXISTS amazon_url TEXT DEFAULT '';
ALTER TABLE public.vine_review_items ADD COLUMN IF NOT EXISTS automation_mode TEXT NOT NULL DEFAULT 'full_auto' CHECK (automation_mode IN ('full_auto', 'video_only', 'photos_only', 'review_only', 'manual'));
ALTER TABLE public.vine_review_items ADD COLUMN IF NOT EXISTS scraped_images JSONB;
