CREATE TABLE public.registros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL,
  promotor text NOT NULL,
  comarca text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  execucoes integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.registros TO anon, authenticated;
GRANT ALL ON public.registros TO service_role;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver registros" ON public.registros FOR SELECT TO anon, authenticated USING (true);