-- Create storage bucket for opportunity attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('oportunidade-anexos', 'oportunidade-anexos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload oportunidade anexos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'oportunidade-anexos');

-- Allow public read
CREATE POLICY "Public can read oportunidade anexos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'oportunidade-anexos');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete oportunidade anexos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'oportunidade-anexos');

-- RLS policies for oportunidade_anexo table
ALTER TABLE public.oportunidade_anexo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select oportunidade_anexo"
ON public.oportunidade_anexo FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert oportunidade_anexo"
ON public.oportunidade_anexo FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update oportunidade_anexo"
ON public.oportunidade_anexo FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete oportunidade_anexo"
ON public.oportunidade_anexo FOR DELETE TO authenticated
USING (true);