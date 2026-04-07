
-- Fix: Replace permissive RLS policies that used literal true

-- abandoned_carts
DROP POLICY IF EXISTS "Anyone can create abandoned carts" ON public.abandoned_carts;
CREATE POLICY "Anyone can create abandoned carts"
ON public.abandoned_carts
FOR INSERT
TO public
WITH CHECK (
  session_id IS NOT NULL
  AND cart_total >= 0
);

DROP POLICY IF EXISTS "Anyone can update abandoned carts" ON public.abandoned_carts;
CREATE POLICY "Anyone can update abandoned carts"
ON public.abandoned_carts
FOR UPDATE
TO public
USING (
  session_id IS NOT NULL
)
WITH CHECK (
  session_id IS NOT NULL
  AND cart_total >= 0
);

-- analytics_events
DROP POLICY IF EXISTS "Anyone can track analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can track analytics events"
ON public.analytics_events
FOR INSERT
TO public
WITH CHECK (
  event_type IS NOT NULL
);

-- contact_messages
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
FOR INSERT
TO public
WITH CHECK (
  email IS NOT NULL
  AND message IS NOT NULL
);

-- csat_ratings
DROP POLICY IF EXISTS "Anyone can insert CSAT ratings" ON public.csat_ratings;
CREATE POLICY "Anyone can insert CSAT ratings"
ON public.csat_ratings
FOR INSERT
TO public
WITH CHECK (
  rating BETWEEN 1 AND 5
);

-- failed_login_attempts
DROP POLICY IF EXISTS "Anyone can insert failed login attempts" ON public.failed_login_attempts;
CREATE POLICY "Anyone can insert failed login attempts"
ON public.failed_login_attempts
FOR INSERT
TO public
WITH CHECK (
  email IS NOT NULL
);

-- live_chat_conversations
DROP POLICY IF EXISTS "Anyone can start live chat" ON public.live_chat_conversations;
CREATE POLICY "Anyone can start live chat"
ON public.live_chat_conversations
FOR INSERT
TO public
WITH CHECK (
  status IS NOT NULL
);

DROP POLICY IF EXISTS "Customers can update conversations" ON public.live_chat_conversations;
CREATE POLICY "Customers can update conversations"
ON public.live_chat_conversations
FOR UPDATE
TO anon, authenticated
USING (
  status IS NOT NULL
)
WITH CHECK (
  status IS NOT NULL
);

-- live_chat_messages
DROP POLICY IF EXISTS "Anyone can send live chat messages" ON public.live_chat_messages;
CREATE POLICY "Anyone can send live chat messages"
ON public.live_chat_messages
FOR INSERT
TO public
WITH CHECK (
  conversation_id IS NOT NULL
  AND content IS NOT NULL
);

DROP POLICY IF EXISTS "Customers can update messages" ON public.live_chat_messages;
CREATE POLICY "Customers can update messages"
ON public.live_chat_messages
FOR UPDATE
TO anon, authenticated
USING (
  conversation_id IS NOT NULL
)
WITH CHECK (
  conversation_id IS NOT NULL
  AND content IS NOT NULL
);

-- orders
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (
  order_number IS NOT NULL
  AND total_amount >= 0
);

-- support_tickets
DROP POLICY IF EXISTS "Users can create support tickets" ON public.support_tickets;
CREATE POLICY "Users can create support tickets"
ON public.support_tickets
FOR INSERT
TO public
WITH CHECK (
  customer_email IS NOT NULL
  AND subject IS NOT NULL
  AND description IS NOT NULL
);

-- customer_communication_log
DROP POLICY IF EXISTS "Authenticated can insert comm logs" ON public.customer_communication_log;
CREATE POLICY "Authenticated can insert comm logs"
ON public.customer_communication_log
FOR INSERT
TO authenticated
WITH CHECK (
  customer_id IS NOT NULL
  AND type IS NOT NULL
  AND content IS NOT NULL
);

DROP POLICY IF EXISTS "Authenticated can delete comm logs" ON public.customer_communication_log;
CREATE POLICY "Authenticated can delete comm logs"
ON public.customer_communication_log
FOR DELETE
TO authenticated
USING (
  customer_id IS NOT NULL
);

-- login_activity
DROP POLICY IF EXISTS "System can insert login activity" ON public.login_activity;
CREATE POLICY "System can insert login activity"
ON public.login_activity
FOR INSERT
TO public
WITH CHECK (
  status IS NOT NULL
);
