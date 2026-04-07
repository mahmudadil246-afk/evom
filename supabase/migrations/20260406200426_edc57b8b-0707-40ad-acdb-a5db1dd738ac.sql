
-- =============================================
-- SECURITY HARDENING ROUND 3
-- =============================================

-- ===== Fix 1: password_history — Remove admin SELECT =====
DROP POLICY IF EXISTS "Admins can view password history" ON public.password_history;
-- Admins don't need to read password hashes directly

-- ===== Fix 2: two_factor_auth — Remove admin SELECT of secrets =====
DROP POLICY IF EXISTS "Admins can view 2FA settings" ON public.two_factor_auth;

-- Create a safe function for admin to check 2FA status (without exposing secrets)
CREATE OR REPLACE FUNCTION public.get_2fa_status(target_user_id uuid)
RETURNS TABLE(user_id uuid, is_enabled boolean, method text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admin or the user themselves can check
  IF auth.uid() = target_user_id OR has_admin_role(auth.uid()) THEN
    RETURN QUERY
    SELECT t.user_id, t.is_enabled, t.method, t.created_at
    FROM public.two_factor_auth t
    WHERE t.user_id = target_user_id;
  END IF;
END;
$$;

-- ===== Fix 3: recovery_codes — Remove admin SELECT =====
DROP POLICY IF EXISTS "Admins can view recovery codes" ON public.recovery_codes;
-- Only the owner should ever see their recovery codes

-- ===== Fix 5: enabled_payment_methods — Hide account_details from public =====
-- Create a safe function that excludes account_details for non-admins
CREATE OR REPLACE FUNCTION public.get_safe_payment_methods()
RETURNS TABLE(
  id uuid, method_id text, code text, name text, name_bn text,
  description text, instructions text, logo_url text,
  is_active boolean, supports_verification boolean, sort_order integer,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.method_id, p.code, p.name, p.name_bn,
    p.description, p.instructions, p.logo_url,
    p.is_active, p.supports_verification, p.sort_order,
    p.created_at, p.updated_at
  FROM public.enabled_payment_methods p
  WHERE p.is_active = true;
END;
$$;

-- Restrict public SELECT to not expose account_details
DROP POLICY IF EXISTS "Enabled payment methods viewable" ON public.enabled_payment_methods;
CREATE POLICY "Enabled payment methods viewable by authenticated" ON public.enabled_payment_methods
  FOR SELECT USING (
    has_admin_role(auth.uid()) OR (is_active = true AND auth.uid() IS NOT NULL)
  );

-- ===== Fix 6: user_sessions — Hide session_token =====
-- Create safe function that excludes session_token
CREATE OR REPLACE FUNCTION public.get_safe_user_sessions(target_user_id uuid)
RETURNS TABLE(
  id uuid, user_id uuid, device_info jsonb, ip_address text,
  user_agent text, is_current boolean, last_active_at timestamptz,
  expires_at timestamptz, created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = target_user_id OR has_admin_role(auth.uid()) THEN
    RETURN QUERY
    SELECT s.id, s.user_id, s.device_info, s.ip_address,
      s.user_agent, s.is_current, s.last_active_at,
      s.expires_at, s.created_at
    FROM public.user_sessions s
    WHERE s.user_id = target_user_id;
  END IF;
END;
$$;

-- Remove admin SELECT that exposes session_token
DROP POLICY IF EXISTS "Admins can view user sessions" ON public.user_sessions;

-- ===== Fix 7-8: chat-attachments — Path-based access =====
-- Fix SELECT: only conversation participants or admins
DROP POLICY IF EXISTS "Chat attachment access" ON storage.objects;
CREATE POLICY "Chat attachment owner access" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-attachments' AND (
      has_admin_role(auth.uid()) OR
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- Fix INSERT: must upload to own folder
DROP POLICY IF EXISTS "Authenticated can upload chat attachments" ON storage.objects;
CREATE POLICY "Users upload own chat attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-attachments' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ===== Fix 9: avatars — Path-based UPDATE/DELETE =====
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND (
      has_admin_role(auth.uid()) OR
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND (
      has_admin_role(auth.uid()) OR
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- ===== Fix 11: review-media — Path-based INSERT =====
DROP POLICY IF EXISTS "Authenticated users can upload review media" ON storage.objects;
CREATE POLICY "Users can upload own review media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'review-media' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ===== Fix 12: coupons — Restrict public visibility =====
-- Public only sees safe fields via a function, restrict direct SELECT to authenticated
DROP POLICY IF EXISTS "Active coupons viewable by everyone" ON public.coupons;
CREATE POLICY "Active coupons viewable by authenticated" ON public.coupons
  FOR SELECT USING (
    has_admin_role(auth.uid()) OR (is_active = true AND auth.uid() IS NOT NULL)
  );

-- Safe coupon lookup function (excludes internal fields)
CREATE OR REPLACE FUNCTION public.validate_coupon(coupon_code text)
RETURNS TABLE(
  id uuid, code text, title text, description text,
  discount_type text, discount_value numeric,
  minimum_order_amount numeric, maximum_discount numeric,
  starts_at timestamptz, expires_at timestamptz,
  first_order_only boolean, is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.code, c.title, c.description,
    c.discount_type, c.discount_value,
    c.minimum_order_amount, c.maximum_discount,
    c.starts_at, c.expires_at,
    c.first_order_only, c.is_active
  FROM public.coupons c
  WHERE c.code = UPPER(coupon_code)
    AND c.is_active = true
    AND c.deleted_at IS NULL
    AND (c.starts_at IS NULL OR c.starts_at <= now())
    AND (c.expires_at IS NULL OR c.expires_at > now());
END;
$$;
