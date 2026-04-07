-- Create review-media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('review-media', 'review-media', true);

-- Allow authenticated users to upload review media
CREATE POLICY "Authenticated users can upload review media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'review-media');

-- Allow public read access to review media
CREATE POLICY "Anyone can view review media"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-media');

-- Allow users to delete their own review media
CREATE POLICY "Users can delete own review media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'review-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Change is_approved default to null for pending status
ALTER TABLE public.product_reviews ALTER COLUMN is_approved SET DEFAULT null;