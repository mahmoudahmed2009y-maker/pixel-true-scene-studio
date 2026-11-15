CREATE TABLE public.site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name text NOT NULL DEFAULT 'RELEAF' CHECK (char_length(btrim(site_name)) BETWEEN 1 AND 40),
  logo_data_url text CHECK (logo_data_url IS NULL OR (logo_data_url ~ '^data:image/(png|jpeg|webp);base64,' AND char_length(logo_data_url) <= 400000)),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site branding"
  ON public.site_settings FOR SELECT TO anon, authenticated
  USING (id = 1);

CREATE POLICY "Admins can create site branding"
  ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site branding"
  ON public.site_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_settings_touch BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_settings (id, site_name) VALUES (1, 'RELEAF') ON CONFLICT (id) DO NOTHING;