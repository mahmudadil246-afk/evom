-- Create payment-logos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-logos', 'payment-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Payment logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-logos');

-- Allow authenticated users to upload
CREATE POLICY "Admins can upload payment logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Admins can update payment logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'payment-logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Admins can delete payment logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-logos' AND auth.role() = 'authenticated');