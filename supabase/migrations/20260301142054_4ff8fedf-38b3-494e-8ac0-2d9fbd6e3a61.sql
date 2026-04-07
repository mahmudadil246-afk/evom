
-- Create storage bucket for carousel/hero images and videos
INSERT INTO storage.buckets (id, name, public) VALUES ('carousel-media', 'carousel-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view carousel media
CREATE POLICY "Anyone can view carousel media" ON storage.objects FOR SELECT USING (bucket_id = 'carousel-media');

-- Allow authenticated admins to upload carousel media
CREATE POLICY "Admins can upload carousel media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'carousel-media' AND auth.role() = 'authenticated');

-- Allow authenticated admins to update carousel media
CREATE POLICY "Admins can update carousel media" ON storage.objects FOR UPDATE USING (bucket_id = 'carousel-media' AND auth.role() = 'authenticated');

-- Allow authenticated admins to delete carousel media
CREATE POLICY "Admins can delete carousel media" ON storage.objects FOR DELETE USING (bucket_id = 'carousel-media' AND auth.role() = 'authenticated');
