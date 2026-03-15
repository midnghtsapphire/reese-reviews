-- Migration: Set up Amazon Vine and Orders tables
-- Created: 2026-03-10
-- Description: Creates tables for storing Vine items, Amazon orders, and API configurations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- VINE ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS vine_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asin TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  received_date DATE,
  review_deadline DATE NOT NULL,
  estimated_value DECIMAL(10,2),
  review_status TEXT CHECK (review_status IN ('pending', 'in_progress', 'submitted', 'published', 'overdue')) DEFAULT 'pending',
  review_id TEXT,
  vine_enrollment_date DATE,
  notes TEXT,
  template_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asin, received_date) -- Prevent duplicates per user
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS vine_items_user_id_idx ON vine_items(user_id);
CREATE INDEX IF NOT EXISTS vine_items_review_status_idx ON vine_items(review_status);
CREATE INDEX IF NOT EXISTS vine_items_review_deadline_idx ON vine_items(review_deadline);

-- ============================================================
-- AMAZON ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS amazon_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amazon_order_id TEXT NOT NULL,
  asin TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  purchase_date DATE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT CHECK (status IN ('pending', 'shipped', 'delivered', 'returned')) DEFAULT 'pending',
  review_status TEXT CHECK (review_status IN ('not_reviewed', 'draft', 'published')) DEFAULT 'not_reviewed',
  review_id TEXT,
  affiliate_link TEXT,
  source TEXT CHECK (source IN ('purchased', 'vine')) DEFAULT 'purchased',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, amazon_order_id) -- Prevent duplicate orders per user
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS amazon_orders_user_id_idx ON amazon_orders(user_id);
CREATE INDEX IF NOT EXISTS amazon_orders_review_status_idx ON amazon_orders(review_status);
CREATE INDEX IF NOT EXISTS amazon_orders_purchase_date_idx ON amazon_orders(purchase_date);

-- ============================================================
-- API CONFIGURATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS api_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Amazon PA-API credentials (encrypted in application)
  amazon_access_key TEXT,
  amazon_secret_key TEXT,
  amazon_associate_tag TEXT,
  
  -- Amazon SP-API credentials (encrypted in application)
  amazon_seller_id TEXT,
  amazon_marketplace_id TEXT DEFAULT 'ATVPDKIKX0DER', -- US marketplace
  amazon_lwa_client_id TEXT,
  amazon_lwa_client_secret TEXT,
  amazon_refresh_token TEXT,
  
  -- Vine scraping configuration
  vine_cookies JSONB, -- Session cookies for scraping
  vine_auto_sync_enabled BOOLEAN DEFAULT false,
  vine_sync_interval_hours INTEGER DEFAULT 24,
  
  -- Sync timestamps
  last_vine_sync TIMESTAMP WITH TIME ZONE,
  last_orders_sync TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user lookup
CREATE INDEX IF NOT EXISTS api_configurations_user_id_idx ON api_configurations(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE vine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;

-- Vine Items Policies
CREATE POLICY "Users can view their own vine items"
  ON vine_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vine items"
  ON vine_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vine items"
  ON vine_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vine items"
  ON vine_items FOR DELETE
  USING (auth.uid() = user_id);

-- Amazon Orders Policies
CREATE POLICY "Users can view their own orders"
  ON amazon_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON amazon_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON amazon_orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders"
  ON amazon_orders FOR DELETE
  USING (auth.uid() = user_id);

-- API Configurations Policies
CREATE POLICY "Users can view their own API config"
  ON api_configurations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API config"
  ON api_configurations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API config"
  ON api_configurations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API config"
  ON api_configurations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_vine_items_updated_at
  BEFORE UPDATE ON vine_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_orders_updated_at
  BEFORE UPDATE ON amazon_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_configurations_updated_at
  BEFORE UPDATE ON api_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE vine_items IS 'Stores Amazon Vine items received by users';
COMMENT ON TABLE amazon_orders IS 'Stores Amazon orders (purchased items) for users';
COMMENT ON TABLE api_configurations IS 'Stores encrypted API credentials and sync settings per user';

COMMENT ON COLUMN vine_items.estimated_value IS 'ETV (Estimated Tax Value) reported to IRS';
COMMENT ON COLUMN vine_items.review_deadline IS 'Date by which review must be submitted to maintain Vine eligibility';
COMMENT ON COLUMN api_configurations.vine_cookies IS 'Encrypted session cookies for Vine scraping';
