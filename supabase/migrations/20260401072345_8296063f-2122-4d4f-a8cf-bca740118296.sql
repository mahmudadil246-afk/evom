CREATE TABLE public.product_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  asked_by_name TEXT NOT NULL DEFAULT 'Customer',
  user_id UUID,
  helpful_count INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE,
  answered_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;

-- Anyone can view questions
CREATE POLICY "Anyone can view product questions"
  ON public.product_questions FOR SELECT
  TO public
  USING (true);

-- Anyone can ask a question
CREATE POLICY "Anyone can ask product questions"
  ON public.product_questions FOR INSERT
  TO public
  WITH CHECK (question IS NOT NULL AND product_id IS NOT NULL);

-- Admins can manage all questions (answer, delete, etc.)
CREATE POLICY "Admins can manage product questions"
  ON public.product_questions FOR ALL
  TO public
  USING (has_admin_role(auth.uid()));
