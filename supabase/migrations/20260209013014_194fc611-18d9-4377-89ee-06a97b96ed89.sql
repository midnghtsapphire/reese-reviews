-- Create categories enum
CREATE TYPE public.review_category AS ENUM ('home-office', 'furniture', 'organization', 'kitchen', 'bathroom', 'tech', 'decor', 'outdoor');

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category review_category NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  product_name TEXT,
  product_link TEXT,
  pros TEXT[],
  cons TEXT[],
  verdict TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public read access for published reviews
CREATE POLICY "Published reviews are publicly viewable" 
ON public.reviews 
FOR SELECT 
USING (published_at IS NOT NULL AND published_at <= now());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_reviews_category ON public.reviews(category);
CREATE INDEX idx_reviews_published_at ON public.reviews(published_at DESC);
CREATE INDEX idx_reviews_is_featured ON public.reviews(is_featured) WHERE is_featured = true;
CREATE INDEX idx_reviews_slug ON public.reviews(slug);

-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true);

-- Allow public read access to review images
CREATE POLICY "Review images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'review-images');

-- Insert sample reviews data
INSERT INTO public.reviews (title, slug, category, rating, excerpt, content, image_url, product_name, pros, cons, verdict, is_featured, published_at) VALUES
(
  'The Ultimate Desk Setup',
  'ultimate-desk-setup',
  'home-office',
  5,
  'A full breakdown of my dream desk setup — was it worth the hype? Spoiler: mostly yes.',
  E'After months of research and countless hours scrolling through Pinterest boards, I finally pulled the trigger on what I''m calling my "dream desk setup." Here''s the honest truth about whether it lived up to the hype.\n\n## The Main Pieces\n\nThe star of the show is the motorized standing desk from FlexiSpot. At $599, it''s not cheap, but the build quality is exceptional. The motor is whisper-quiet, and I love being able to switch between sitting and standing throughout the day.\n\n## The Verdict\n\nWas it worth the investment? Absolutely. My productivity has genuinely improved, and I actually enjoy spending time at my desk now.',
  NULL,
  'FlexiSpot E7 Pro Standing Desk',
  ARRAY['Whisper-quiet motor', 'Rock-solid stability', 'Great cable management', 'Beautiful aesthetic'],
  ARRAY['Price is steep', 'Assembly takes 2+ hours', 'Heavy - need help moving'],
  'If you work from home regularly, this setup is worth every penny. Start with the desk and build from there.',
  true,
  now()
),
(
  'DIY Bookshelf Assembly',
  'diy-bookshelf-assembly',
  'furniture',
  4,
  'This "easy assembly" shelf took 4 hours. Here''s what they don''t tell you in the instructions.',
  E'The KALLAX from IKEA promised "easy 45-minute assembly." Four hours and two stripped screws later, I have thoughts.\n\n## What They Don''t Tell You\n\nFirst, you''ll need your own Phillips head screwdriver - the included tool is laughably inadequate. Second, the dowel holes don''t always line up perfectly. I had to gently encourage several pieces with a rubber mallet.\n\n## The Final Result\n\nDespite the struggle, I have to admit it looks great in my living room. The clean lines and versatile sizing make it perfect for books, plants, and decorative storage bins.',
  NULL,
  'IKEA KALLAX Shelf Unit',
  ARRAY['Looks amazing when done', 'Very sturdy', 'Affordable price', 'Modular and versatile'],
  ARRAY['Instructions are vague', 'Assembly takes way longer than stated', 'Need additional tools'],
  'Great shelf, just budget 3-4x the stated assembly time and have real tools ready.',
  true,
  now()
),
(
  'Bathroom Organization Essentials',
  'bathroom-org-essentials',
  'organization',
  4,
  'These storage containers changed my morning routine. Affordable and actually aesthetic.',
  E'I finally tackled the disaster zone under my bathroom sink, and these organization essentials made all the difference.\n\n## The Heroes\n\nThe clear acrylic containers from The Container Store are genuinely life-changing. Yes, I said life-changing about storage containers. Being able to see everything at a glance means I''m not constantly rummaging around in the dark.\n\n## Morning Routine Impact\n\nMy morning routine went from 45 chaotic minutes to 25 calm minutes. Everything has a place, and I can actually find my skincare products.',
  NULL,
  'The Container Store Acrylic Organization Set',
  ARRAY['Everything visible at a glance', 'Easy to clean', 'Stackable design', 'Looks high-end'],
  ARRAY['Acrylic shows water spots', 'Not the cheapest option', 'Limited size options'],
  'Worth the investment if you''re serious about organization. These pieces will last years.',
  true,
  now()
),
(
  'Smart Home Hub Showdown',
  'smart-home-hub-showdown',
  'tech',
  5,
  'Tested the top 3 smart home hubs. One clear winner emerged after a month of daily use.',
  E'I spent a month testing the Amazon Echo Show 10, Google Nest Hub Max, and Apple HomePod Mini. Here''s what I found.\n\n## The Testing Process\n\nEach hub got one week as my primary smart home controller, then I spent the final week comparing them head-to-head.\n\n## The Winner\n\nFor most people, the Google Nest Hub Max offers the best balance of features, smart home compatibility, and value. The rotating Echo Show is cool but gimmicky, and the HomePod is too limited unless you''re all-in on Apple.',
  NULL,
  'Google Nest Hub Max',
  ARRAY['Best smart assistant', 'Great display quality', 'Wide device compatibility', 'Excellent value'],
  ARRAY['Privacy concerns', 'Not as good for music', 'Some features require subscription'],
  'The Nest Hub Max wins for its versatility and smart home integration.',
  false,
  now()
),
(
  'Outdoor String Lights Guide',
  'outdoor-string-lights-guide',
  'outdoor',
  4,
  'Transformed my patio with these weatherproof string lights. Instagram-worthy on a budget.',
  E'My backyard went from "meh" to "magazine cover" with one simple addition: outdoor string lights.\n\n## What I Bought\n\nI went with the Brightown 48ft LED string lights from Amazon. At $35, they''re a fraction of the cost of boutique options, and honestly? They look just as good.\n\n## Installation Tips\n\nUse guide wire for the cleanest look. The included clips work okay, but proper installation with tensioned wire makes all the difference.',
  NULL,
  'Brightown 48ft LED String Lights',
  ARRAY['Incredible value', 'Truly weatherproof', 'Warm, ambient glow', 'Easy installation'],
  ARRAY['Bulbs are plastic not glass', 'Extension cord needed for most setups', 'Some bulbs arrived dim'],
  'Best bang for your buck in outdoor lighting. Buy two sets for most patios.',
  false,
  now()
),
(
  'Kitchen Drawer Dividers',
  'kitchen-drawer-dividers',
  'kitchen',
  5,
  'Finally, a utensil drawer that doesn''t look like a tornado hit it.',
  E'The junk drawer was never meant to be the utensil drawer, but here we are. These bamboo dividers fixed everything.\n\n## Why Bamboo?\n\nI chose bamboo over plastic for two reasons: it looks better and it''s more sustainable. The Joseph Joseph set I bought has adjustable dividers that actually stay in place.\n\n## The Transformation\n\nBefore: chaos. After: I can find my garlic press in under 3 seconds. Revolutionary.',
  NULL,
  'Joseph Joseph DrawerStore Organizer',
  ARRAY['Adjustable compartments', 'Beautiful bamboo finish', 'Easy to clean', 'Fits most drawers'],
  ARRAY['Premium price point', 'Bamboo needs occasional oiling', 'Not dishwasher safe'],
  'If you care about kitchen organization, this is a no-brainer purchase.',
  false,
  now()
);