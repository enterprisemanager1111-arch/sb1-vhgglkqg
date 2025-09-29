-- Create family_img storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('family_img', 'family_img', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for family_img bucket
CREATE POLICY "Users can upload family images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'family_img' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update family images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'family_img' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete family images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'family_img' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Family images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'family_img');
