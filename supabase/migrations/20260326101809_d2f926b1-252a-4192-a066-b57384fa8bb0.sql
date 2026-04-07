
CREATE TABLE public.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  language_code text NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(key, language_code)
);

ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read translations"
  ON public.translations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage translations"
  ON public.translations FOR ALL
  TO public
  USING (has_admin_role(auth.uid()));

CREATE INDEX idx_translations_language ON public.translations(language_code);
CREATE INDEX idx_translations_key ON public.translations(key);
