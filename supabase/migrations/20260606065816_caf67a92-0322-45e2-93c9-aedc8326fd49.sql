CREATE TABLE public.campaign_codes (
  code TEXT PRIMARY KEY,
  reward JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaign_codes TO anon, authenticated;
GRANT ALL ON public.campaign_codes TO service_role;
ALTER TABLE public.campaign_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read codes" ON public.campaign_codes FOR SELECT USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_codes;