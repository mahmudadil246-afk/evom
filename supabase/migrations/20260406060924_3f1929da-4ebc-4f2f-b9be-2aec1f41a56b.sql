INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true);

CREATE POLICY "Public read access for store-assets" ON storage.objects FOR SELECT USING (bucket_id = 'store-assets');

CREATE POLICY "Authenticated users can upload store-assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'store-assets');

CREATE POLICY "Authenticated users can update store-assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'store-assets');

CREATE POLICY "Authenticated users can delete store-assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'store-assets');