INSERT INTO public.factories (id, name, location, sector, daily_capacity_m3, sort_order) VALUES
  ('delta-textiles', 'Delta Textiles', '10th of Ramadan City', 'Textile dyeing', 1800, 1),
  ('nile-foods', 'Nile Food Processing', 'Sadat City', 'Food & beverage', 1200, 2),
  ('suez-metals', 'Suez Metal Finishing', 'Ain Sokhna', 'Metal finishing', 950, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.water_samples (id, name, stage, factory_id, collected_at, ph, turbidity, tds, temperature, ec, sar, lab_cd, lab_pb, sort_order) VALUES
  ('S-101', 'Raw influent — dye line', 'Before treatment', 'delta-textiles', '2026-11-12T06:40:00Z', 4.6, 145, 4200, 34.5, 6500, 11.2, 0.034, 7.8, 1),
  ('S-102', 'After primary clarifier', 'Partial treatment', 'delta-textiles', '2026-11-12T07:10:00Z', 6.2, 28, 2100, 31.2, 3300, 6.5, NULL, NULL, 2),
  ('S-103', 'After tertiary treatment', 'Treated · lab entry', 'delta-textiles', '2026-11-12T07:45:00Z', 7.4, 1.8, 820, 27.6, 1280, 2.4, 0.004, 0.6, 3),
  ('S-104', 'Treated storage tank', 'Treated · no lab data', 'delta-textiles', '2026-11-12T07:55:00Z', 7.2, 3.1, 950, 28.1, 1450, 3.4, NULL, NULL, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.risk_limits (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admins add limits" ON public.risk_limits;
CREATE POLICY "Admins add limits" ON public.risk_limits FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));