DROP POLICY IF EXISTS "Anyone can view factories" ON public.factories;
DROP POLICY IF EXISTS "Anyone can view samples" ON public.water_samples;
DROP POLICY IF EXISTS "Anyone can view limits" ON public.risk_limits;

REVOKE SELECT ON public.factories FROM anon;
REVOKE SELECT ON public.water_samples FROM anon;
REVOKE SELECT ON public.risk_limits FROM anon;

GRANT SELECT ON public.factories TO authenticated;
GRANT SELECT ON public.water_samples TO authenticated;
GRANT SELECT ON public.risk_limits TO authenticated;

CREATE POLICY "Signed-in users can view factories" ON public.factories
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Signed-in users can view samples" ON public.water_samples
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Signed-in users can view limits" ON public.risk_limits
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);