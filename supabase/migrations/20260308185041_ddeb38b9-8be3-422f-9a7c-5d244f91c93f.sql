CREATE TABLE public.activated_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  license_key text NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activated_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read activated licenses"
  ON public.activated_licenses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert activated licenses"
  ON public.activated_licenses FOR INSERT
  WITH CHECK (domain IS NOT NULL AND license_key IS NOT NULL);

CREATE POLICY "Anyone can update activated licenses"
  ON public.activated_licenses FOR UPDATE
  USING (domain IS NOT NULL)
  WITH CHECK (domain IS NOT NULL AND license_key IS NOT NULL);