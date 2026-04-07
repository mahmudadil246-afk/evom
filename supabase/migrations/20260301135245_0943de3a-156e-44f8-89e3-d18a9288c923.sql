
-- Create carousel slides table for hero section
CREATE TABLE public.homepage_carousel_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  badge_text TEXT,
  image_url TEXT,
  video_url TEXT,
  youtube_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image', 'video', 'youtube'
  cta_text TEXT,
  cta_link TEXT,
  secondary_cta_text TEXT,
  secondary_cta_link TEXT,
  overlay_color TEXT DEFAULT 'rgba(0,0,0,0.45)',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_carousel_slides ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage carousel slides"
ON public.homepage_carousel_slides
FOR ALL
USING (has_admin_role(auth.uid()));

-- Anyone can view enabled slides
CREATE POLICY "Anyone can view enabled carousel slides"
ON public.homepage_carousel_slides
FOR SELECT
USING (is_enabled = true);

-- Insert default slide
INSERT INTO public.homepage_carousel_slides (title, subtitle, badge_text, image_url, media_type, cta_text, cta_link, secondary_cta_text, secondary_cta_link, sort_order)
VALUES (
  'Elevate Your Style',
  'Discover premium fashion that speaks to your unique personality. New collection just arrived.',
  'New Collection 2024',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop',
  'image',
  'Shop Now',
  '/products',
  'New Arrivals',
  '/products?filter=new',
  0
);
