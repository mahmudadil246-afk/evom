
-- Create product-videos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-videos', 'product-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-videos
CREATE POLICY "Product videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-videos');

CREATE POLICY "Admins can upload product videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-videos' AND has_admin_role(auth.uid()));

CREATE POLICY "Admins can update product videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-videos' AND has_admin_role(auth.uid()));

CREATE POLICY "Admins can delete product videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-videos' AND has_admin_role(auth.uid()));

-- Add video_thumbnail column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_thumbnail text;
