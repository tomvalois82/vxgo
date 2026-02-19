-- Create storage bucket for canva frames
INSERT INTO storage.buckets (id, name, public)
VALUES ('canva-molduras', 'canva-molduras', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read on canva-molduras
CREATE POLICY "Public read canva-molduras"
ON storage.objects FOR SELECT
USING (bucket_id = 'canva-molduras');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload canva-molduras"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'canva-molduras');
