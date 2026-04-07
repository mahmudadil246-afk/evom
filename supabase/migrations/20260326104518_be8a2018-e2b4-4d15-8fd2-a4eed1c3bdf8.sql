
CREATE TABLE public.currency_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  symbol text NOT NULL,
  name text NOT NULL,
  rate_to_bdt numeric NOT NULL DEFAULT 1,
  is_enabled boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view currencies" ON public.currency_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage currencies" ON public.currency_settings FOR ALL TO public USING (has_admin_role(auth.uid()));

INSERT INTO public.currency_settings (code, symbol, name, rate_to_bdt, is_enabled, is_default, sort_order) VALUES
  ('BDT', '৳', 'Bangladeshi Taka', 1, true, true, 0),
  ('USD', '$', 'US Dollar', 120, true, false, 1),
  ('INR', '₹', 'Indian Rupee', 1.44, true, false, 2);
