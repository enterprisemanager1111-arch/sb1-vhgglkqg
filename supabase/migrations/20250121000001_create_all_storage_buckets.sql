-- Create all necessary storage buckets for the application
-- This migration creates the missing storage buckets that are causing upload failures

-- Create avatars bucket (for user profile pictures)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create public bucket (fallback for general uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Create uploads bucket (fallback for file uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Create images bucket (fallback for image uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create family_img bucket (for family profile pictures)
INSERT INTO storage.buckets (id, name, public)
VALUES ('family_img', 'family_img', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars bucket
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own avatar" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for public bucket
CREATE POLICY "Anyone can upload to public bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'public');

CREATE POLICY "Anyone can view public bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'public');

-- Create storage policies for uploads bucket
CREATE POLICY "Authenticated users can upload to uploads bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view uploads bucket" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);

-- Create storage policies for images bucket
CREATE POLICY "Authenticated users can upload to images bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view images bucket" ON storage.objects
FOR SELECT USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Create storage policies for family_img bucket
CREATE POLICY "Family members can upload family images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'family_img' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Family members can view family images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'family_img' 
  AND auth.role() = 'authenticated'
);

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
