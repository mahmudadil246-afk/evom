
-- password_history: owner-only policies
CREATE POLICY "Users can manage own password history" ON public.password_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
