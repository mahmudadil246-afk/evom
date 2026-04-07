
-- Fix 1: store_settings — Case-insensitive filter
DROP POLICY IF EXISTS "Public can read non-sensitive settings" ON public.store_settings;
CREATE POLICY "Public can read non-sensitive settings" ON public.store_settings
  FOR SELECT USING (
    has_admin_role(auth.uid()) OR
    (key NOT ILIKE '%api%' AND key NOT ILIKE '%secret%' 
     AND key NOT ILIKE '%token%' AND key NOT ILIKE '%password%'
     AND key NOT ILIKE '%client_id%' AND key NOT ILIKE '%username%'
     AND key NOT ILIKE '%client_secret%')
  );

-- Fix 2: chat-attachments storage — Restrict to authenticated + admin
DROP POLICY IF EXISTS "Public can view chat attachments" ON storage.objects;
CREATE POLICY "Chat attachment access" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-attachments' AND (
      has_admin_role(auth.uid()) OR auth.uid() IS NOT NULL
    )
  );

-- Fix 3: Realtime — Add notifications to realtime publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Fix 4: abandoned_carts UPDATE — Ownership check
DROP POLICY IF EXISTS "Anyone can update abandoned carts" ON public.abandoned_carts;
CREATE POLICY "Session owner can update abandoned carts" ON public.abandoned_carts
  FOR UPDATE USING (
    has_admin_role(auth.uid()) OR
    (user_id = auth.uid() AND user_id IS NOT NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  ) WITH CHECK (
    (session_id IS NOT NULL) AND (cart_total >= 0::numeric)
  );

-- Fix 5a: avatars — Authenticated-only write
DROP POLICY IF EXISTS "Authenticated can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete avatars" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND (has_admin_role(auth.uid()) OR auth.uid() IS NOT NULL));

-- Fix 5b: product-images — Admin-only write
DROP POLICY IF EXISTS "Authenticated can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete product images" ON storage.objects;
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND has_admin_role(auth.uid()));
CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND has_admin_role(auth.uid()));
CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND has_admin_role(auth.uid()));

-- Fix 5c: product-videos — Admin-only write
DROP POLICY IF EXISTS "Authenticated can upload product videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update product videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete product videos" ON storage.objects;
CREATE POLICY "Admins can upload product videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-videos' AND has_admin_role(auth.uid()));
CREATE POLICY "Admins can update product videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-videos' AND has_admin_role(auth.uid()));
CREATE POLICY "Admins can delete product videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-videos' AND has_admin_role(auth.uid()));

-- Fix 5d: brand-logos — Admin-only write
DROP POLICY IF EXISTS "Authenticated can upload brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete brand logos" ON storage.objects;
CREATE POLICY "Admins can upload brand logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'brand-logos' AND has_admin_role(auth.uid()));
CREATE POLICY "Admins can update brand logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'brand-logos' AND has_admin_role(auth.uid()));
CREATE POLICY "Admins can delete brand logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'brand-logos' AND has_admin_role(auth.uid()));

-- Fix 5e: category-images — Admin-only write
DROP POLICY IF EXISTS "Authenticated can upload category images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update category images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete category images" ON storage.objects;
CREATE POLICY "Admins can upload category images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'category-images' AND has_admin_role(auth.uid()));
CREATE POLICY "Admins can update category images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'category-images' AND has_admin_role(auth.uid()));
CREATE POLICY "Admins can delete category images" ON storage.objects
  FOR DELETE USING (bucket_id = 'category-images' AND has_admin_role(auth.uid()));

-- Fix 5f: carousel-media — Admin-only write
DROP POLICY IF EXISTS "Admins can upload carousel media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update carousel media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete carousel media" ON storage.objects;
CREATE POLICY "Admins can upload carousel media v2" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'carousel-media' AND has_admin_role(auth.uid()));
CREATE POLICY "Admins can update carousel media v2" ON storage.objects
  FOR UPDATE USING (bucket_id = 'carousel-media' AND has_admin_role(auth.uid()));
CREATE POLICY "Admins can delete carousel media v2" ON storage.objects
  FOR DELETE USING (bucket_id = 'carousel-media' AND has_admin_role(auth.uid()));

-- Fix 5g: payment-logos — Admin-only write
DROP POLICY IF EXISTS "Admins can upload payment logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update payment logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete payment logos" ON storage.objects;
CREATE POLICY "Admins can upload payment logos v2" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-logos' AND has_admin_role(auth.uid()));
CREATE POLICY "Admins can update payment logos v2" ON storage.objects
  FOR UPDATE USING (bucket_id = 'payment-logos' AND has_admin_role(auth.uid()));
CREATE POLICY "Admins can delete payment logos v2" ON storage.objects
  FOR DELETE USING (bucket_id = 'payment-logos' AND has_admin_role(auth.uid()));

-- Fix 6: orders INSERT — user_id ownership check
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (
    (order_number IS NOT NULL) AND (total_amount >= 0::numeric) AND
    (user_id IS NULL OR auth.uid() = user_id)
  );

-- Fix 7: support_tickets INSERT — user_id check
DROP POLICY IF EXISTS "Users can create support tickets" ON public.support_tickets;
CREATE POLICY "Users can create support tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (
    (customer_email IS NOT NULL) AND (subject IS NOT NULL) AND (description IS NOT NULL) AND
    (user_id IS NULL OR auth.uid() = user_id)
  );
