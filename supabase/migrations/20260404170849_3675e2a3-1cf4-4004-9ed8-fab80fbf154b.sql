CREATE POLICY "Users can view their own abandoned carts"
ON public.abandoned_carts
FOR SELECT
USING (
  session_id IS NOT NULL
  AND (
    user_id = auth.uid()
    OR user_id IS NULL
  )
);

CREATE POLICY "Users can delete their own abandoned carts"
ON public.abandoned_carts
FOR DELETE
USING (
  user_id = auth.uid()
  OR user_id IS NULL
);