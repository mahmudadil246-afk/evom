-- Storage policies for database-backups bucket (admin only)
CREATE POLICY "Admins can download backups"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'database-backups' 
  AND has_admin_role(auth.uid())
);

CREATE POLICY "Admins can upload backups"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'database-backups' 
  AND has_admin_role(auth.uid())
);

CREATE POLICY "Admins can update backups"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'database-backups' 
  AND has_admin_role(auth.uid())
);

CREATE POLICY "Admins can delete backups"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'database-backups' 
  AND has_admin_role(auth.uid())
);
