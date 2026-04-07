
-- ============================================
-- SECURITY FIX: Harden RLS policies
-- ============================================

-- 1. store_settings: Keep public read for non-sensitive, admin-only for sensitive keys
DROP POLICY IF EXISTS "Store settings readable by everyone" ON public.store_settings;
CREATE POLICY "Public can read non-sensitive settings" ON public.store_settings
  FOR SELECT USING (
    has_admin_role(auth.uid()) OR
    key NOT LIKE '%api%' AND key NOT LIKE '%secret%' AND key NOT LIKE '%token%' AND key NOT LIKE '%password%' AND key NOT LIKE '%smtp%' AND key NOT LIKE '%resend%'
  );

-- 2. live_chat_conversations: Restrict customer SELECT/UPDATE to own conversations
DROP POLICY IF EXISTS "Customers can view conversations" ON public.live_chat_conversations;
CREATE POLICY "Customers can view own conversations" ON public.live_chat_conversations
  FOR SELECT TO anon, authenticated
  USING (user_id = auth.uid() OR has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Customers can update conversations" ON public.live_chat_conversations;
CREATE POLICY "Customers can update own conversations" ON public.live_chat_conversations
  FOR UPDATE TO anon, authenticated
  USING (user_id = auth.uid())
  WITH CHECK (status IS NOT NULL);

-- 3. live_chat_messages: Restrict to own conversation messages
DROP POLICY IF EXISTS "Customers can view messages" ON public.live_chat_messages;
CREATE POLICY "Customers can view own conversation messages" ON public.live_chat_messages
  FOR SELECT TO anon, authenticated
  USING (
    has_admin_role(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.live_chat_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Customers can update messages" ON public.live_chat_messages;
CREATE POLICY "Customers can update own messages" ON public.live_chat_messages
  FOR UPDATE TO anon, authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (conversation_id IS NOT NULL AND content IS NOT NULL);

-- 4. abandoned_carts: Remove user_id IS NULL from SELECT
DROP POLICY IF EXISTS "Users can view their own abandoned carts" ON public.abandoned_carts;
CREATE POLICY "Users can view own abandoned carts" ON public.abandoned_carts
  FOR SELECT USING (
    has_admin_role(auth.uid()) OR
    (user_id = auth.uid() AND user_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Users can delete their own abandoned carts" ON public.abandoned_carts;
CREATE POLICY "Users can delete own abandoned carts" ON public.abandoned_carts
  FOR DELETE USING (
    has_admin_role(auth.uid()) OR
    (user_id = auth.uid() AND user_id IS NOT NULL)
  );

-- 5. page_contents: Admin-only write operations
DROP POLICY IF EXISTS "Authenticated can insert page contents" ON public.page_contents;
CREATE POLICY "Admins can insert page contents" ON public.page_contents
  FOR INSERT WITH CHECK (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can update page contents" ON public.page_contents;
CREATE POLICY "Admins can update page contents" ON public.page_contents
  FOR UPDATE USING (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can delete page contents" ON public.page_contents;
CREATE POLICY "Admins can delete page contents" ON public.page_contents
  FOR DELETE USING (has_admin_role(auth.uid()));

-- 6. brands: Admin-only write operations
DROP POLICY IF EXISTS "Allow authenticated insert brands" ON public.brands;
CREATE POLICY "Admins can insert brands" ON public.brands
  FOR INSERT WITH CHECK (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated update brands" ON public.brands;
CREATE POLICY "Admins can update brands" ON public.brands
  FOR UPDATE USING (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated delete brands" ON public.brands;
CREATE POLICY "Admins can delete brands" ON public.brands
  FOR DELETE USING (has_admin_role(auth.uid()));

-- 7. activated_licenses: Admin-only
DROP POLICY IF EXISTS "Anyone can read activated licenses" ON public.activated_licenses;
CREATE POLICY "Admins can read activated licenses" ON public.activated_licenses
  FOR SELECT USING (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Anyone can insert activated licenses" ON public.activated_licenses;
CREATE POLICY "Admins can insert activated licenses" ON public.activated_licenses
  FOR INSERT WITH CHECK (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Anyone can update activated licenses" ON public.activated_licenses;
CREATE POLICY "Admins can update activated licenses" ON public.activated_licenses
  FOR UPDATE USING (has_admin_role(auth.uid()));

-- 8. customer_communication_log: Admin-only
DROP POLICY IF EXISTS "Authenticated can view comm logs" ON public.customer_communication_log;
CREATE POLICY "Admins can view comm logs" ON public.customer_communication_log
  FOR SELECT USING (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can insert comm logs" ON public.customer_communication_log;
CREATE POLICY "Admins can insert comm logs" ON public.customer_communication_log
  FOR INSERT WITH CHECK (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can delete comm logs" ON public.customer_communication_log;
CREATE POLICY "Admins can delete comm logs" ON public.customer_communication_log
  FOR DELETE USING (has_admin_role(auth.uid()));

-- 9. Storage: database-backups — Admin-only
DROP POLICY IF EXISTS "Authenticated can view backups" ON storage.objects;
CREATE POLICY "Admins can view backups" ON storage.objects
  FOR SELECT USING (bucket_id = 'database-backups' AND has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can upload backups" ON storage.objects;
CREATE POLICY "Admins can upload backups" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'database-backups' AND has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can delete backups" ON storage.objects;
CREATE POLICY "Admins can delete backups" ON storage.objects
  FOR DELETE USING (bucket_id = 'database-backups' AND has_admin_role(auth.uid()));

-- 10. Storage: store-assets — Admin-only write
DROP POLICY IF EXISTS "Authenticated users can upload store-assets" ON storage.objects;
CREATE POLICY "Admins can upload store-assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'store-assets' AND has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update store-assets" ON storage.objects;
CREATE POLICY "Admins can update store-assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'store-assets' AND has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete store-assets" ON storage.objects;
CREATE POLICY "Admins can delete store-assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'store-assets' AND has_admin_role(auth.uid()));

-- 11. Storage: chat-attachments — User can only access own conversation attachments
DROP POLICY IF EXISTS "Authenticated can view chat attachments" ON storage.objects;
CREATE POLICY "Users can view own chat attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-attachments' AND (
      has_admin_role(auth.uid()) OR auth.uid() IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Authenticated can upload chat attachments" ON storage.objects;
CREATE POLICY "Authenticated can upload chat attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can delete chat attachments" ON storage.objects;
CREATE POLICY "Admins can delete chat attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'chat-attachments' AND has_admin_role(auth.uid()));
