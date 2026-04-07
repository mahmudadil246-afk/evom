
-- Create generated_reports table
CREATE TABLE public.generated_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  file_path TEXT,
  file_size BIGINT,
  status TEXT NOT NULL DEFAULT 'generating',
  date_from TIMESTAMP WITH TIME ZONE,
  date_to TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage generated reports"
  ON public.generated_reports FOR ALL
  USING (has_admin_role(auth.uid()));

-- Create scheduled_reports table
CREATE TABLE public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily',
  recipients TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scheduled reports"
  ON public.scheduled_reports FOR ALL
  USING (has_admin_role(auth.uid()));

-- Create reports storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for reports bucket
CREATE POLICY "Admins can upload reports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reports' AND has_admin_role(auth.uid()));

CREATE POLICY "Admins can read reports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reports' AND has_admin_role(auth.uid()));

CREATE POLICY "Admins can delete reports"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'reports' AND has_admin_role(auth.uid()));
