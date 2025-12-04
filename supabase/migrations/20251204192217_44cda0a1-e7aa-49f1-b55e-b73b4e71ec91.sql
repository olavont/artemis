-- Create storage bucket for checklist photos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-checklist', 'fotos-checklist', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fotos-checklist' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow public read access to photos
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos-checklist');