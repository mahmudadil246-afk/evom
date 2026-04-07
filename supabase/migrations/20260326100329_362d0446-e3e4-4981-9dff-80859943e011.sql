
-- Create language_settings table
CREATE TABLE public.language_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code text NOT NULL UNIQUE,
  language_name text NOT NULL,
  native_name text NOT NULL,
  flag_emoji text NOT NULL DEFAULT '🏳️',
  enabled boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.language_settings ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view language settings"
  ON public.language_settings FOR SELECT
  TO public USING (true);

-- Admin-only write
CREATE POLICY "Admins can manage language settings"
  ON public.language_settings FOR ALL
  TO public USING (has_admin_role(auth.uid()));

-- Seed en + bn
INSERT INTO public.language_settings (language_code, language_name, native_name, flag_emoji, enabled, is_default, sort_order)
VALUES
  ('en', 'English', 'English', '🇺🇸', true, true, 0),
  ('bn', 'Bengali', 'বাংলা', '🇧🇩', true, false, 1);
