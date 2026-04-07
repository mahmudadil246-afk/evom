
-- Create the unified site_content_overrides table
CREATE TABLE public.site_content_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug TEXT NOT NULL,
  section_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT NULL,
  title TEXT DEFAULT NULL,
  subtitle TEXT DEFAULT NULL,
  badge_text TEXT DEFAULT NULL,
  image_url TEXT DEFAULT NULL,
  content JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (page_slug, section_key)
);

-- Enable RLS
ALTER TABLE public.site_content_overrides ENABLE ROW LEVEL SECURITY;

-- Admins can manage all overrides
CREATE POLICY "Admins can manage site content overrides"
  ON public.site_content_overrides
  FOR ALL
  TO public
  USING (has_admin_role(auth.uid()));

-- Anyone can view overrides (storefront needs to read them)
CREATE POLICY "Anyone can view site content overrides"
  ON public.site_content_overrides
  FOR SELECT
  TO public
  USING (true);

-- Migrate data from homepage_sections
INSERT INTO public.site_content_overrides (page_slug, section_key, is_enabled, title, subtitle, badge_text, image_url, content, sort_order, created_at, updated_at)
SELECT 
  'homepage',
  section_type,
  is_enabled,
  title,
  subtitle,
  badge_text,
  image_url,
  COALESCE(content, '{}'::jsonb),
  sort_order,
  COALESCE(created_at, now()),
  COALESCE(updated_at, now())
FROM public.homepage_sections
ON CONFLICT (page_slug, section_key) DO NOTHING;

-- Migrate data from page_contents
INSERT INTO public.site_content_overrides (page_slug, section_key, is_enabled, title, subtitle, content, created_at, updated_at)
SELECT 
  page_slug,
  'main_content',
  is_enabled,
  title,
  subtitle,
  COALESCE(content, '{}'::jsonb),
  created_at,
  updated_at
FROM public.page_contents
ON CONFLICT (page_slug, section_key) DO NOTHING;
