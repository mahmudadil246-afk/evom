
CREATE POLICY "Admins can update deletion requests"
  ON public.account_deletion_requests FOR UPDATE
  TO authenticated
  USING (public.has_admin_role(auth.uid()));
