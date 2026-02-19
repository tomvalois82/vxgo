-- Enable RLS on canva_moldura and allow public read/insert
ALTER TABLE public.canva_moldura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read canva_moldura"
ON public.canva_moldura FOR SELECT
USING (true);

CREATE POLICY "Authenticated insert canva_moldura"
ON public.canva_moldura FOR INSERT
TO authenticated
WITH CHECK (true);
