CREATE TABLE public.monthly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL UNIQUE,
  sales_target numeric DEFAULT 100000,
  orders_target integer DEFAULT 50,
  customers_target integer DEFAULT 20,
  sales_actual numeric DEFAULT 0,
  orders_actual integer DEFAULT 0,
  customers_actual integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage goals" ON public.monthly_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);