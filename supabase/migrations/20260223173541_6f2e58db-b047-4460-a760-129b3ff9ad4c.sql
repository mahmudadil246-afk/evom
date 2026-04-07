
-- Add media columns to product_reviews
ALTER TABLE public.product_reviews 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS video_url text;

-- Create storage bucket for review media
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-media', 'review-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for review-media bucket
CREATE POLICY "Review media is publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-media');

CREATE POLICY "Authenticated users can upload review media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'review-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own review media"
ON storage.objects FOR DELETE
USING (bucket_id = 'review-media' AND auth.uid()::text = (storage.foldername(name))[1]);
