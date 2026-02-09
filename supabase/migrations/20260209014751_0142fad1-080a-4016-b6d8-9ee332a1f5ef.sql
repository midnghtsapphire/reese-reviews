-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  category TEXT,
  external_link TEXT,
  average_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products are publicly viewable
CREATE POLICY "Products are publicly viewable"
ON public.products
FOR SELECT
USING (true);

-- Add product_id to reviews table
ALTER TABLE public.reviews
ADD COLUMN product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Add status column for review moderation (pending, approved, rejected)
ALTER TABLE public.reviews
ADD COLUMN status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add reviewer info columns for public submissions
ALTER TABLE public.reviews
ADD COLUMN reviewer_name TEXT;

ALTER TABLE public.reviews
ADD COLUMN reviewer_email TEXT;

-- Create admins table for admin access
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin list
CREATE POLICY "Admins can view admin list"
ON public.admins
FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- Update reviews RLS to allow public submissions (pending status)
CREATE POLICY "Anyone can submit reviews"
ON public.reviews
FOR INSERT
WITH CHECK (status = 'pending');

-- Admins can update reviews (for moderation)
CREATE POLICY "Admins can update reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- Admins can delete reviews
CREATE POLICY "Admins can delete reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- Function to update product stats when review changes
CREATE OR REPLACE FUNCTION public.update_product_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the product's average rating and review count
  IF TG_OP = 'DELETE' THEN
    UPDATE public.products
    SET 
      average_rating = COALESCE((
        SELECT AVG(rating)::numeric(3,2) 
        FROM public.reviews 
        WHERE product_id = OLD.product_id AND status = 'approved'
      ), 0),
      review_count = (
        SELECT COUNT(*) 
        FROM public.reviews 
        WHERE product_id = OLD.product_id AND status = 'approved'
      ),
      updated_at = now()
    WHERE id = OLD.product_id;
    RETURN OLD;
  ELSE
    UPDATE public.products
    SET 
      average_rating = COALESCE((
        SELECT AVG(rating)::numeric(3,2) 
        FROM public.reviews 
        WHERE product_id = NEW.product_id AND status = 'approved'
      ), 0),
      review_count = (
        SELECT COUNT(*) 
        FROM public.reviews 
        WHERE product_id = NEW.product_id AND status = 'approved'
      ),
      updated_at = now()
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for product stats
CREATE TRIGGER update_product_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stats();

-- Add timestamp trigger to products
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();