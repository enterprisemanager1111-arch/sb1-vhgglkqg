# Storage Bucket Fix Guide

## 🚨 **Root Cause Identified**

The avatar upload errors are caused by **missing storage buckets** in your Supabase project:
- **Error**: `StorageApiError: Bucket not found`
- **Missing Buckets**: `avatar`, `public`, `uploads`, `images`, `family_img`
- **Cause**: Storage buckets haven't been created in your Supabase project

## 🔍 **Error Analysis**

From the logs, we can see:
```
❌ Upload failed: StorageApiError: Bucket not found
🔄 Trying fallback bucket: public
❌ Fallback bucket public failed: Bucket not found
🔄 Trying fallback bucket: uploads
❌ Fallback bucket uploads failed: Bucket not found
🔄 Trying fallback bucket: images
❌ Fallback bucket images failed: Bucket not found
❌ Avatar upload failed: Error: All upload attempts failed
```

## 🛠️ **Solution: Create Storage Buckets**

### **Option 1: Using Supabase Dashboard (Recommended)**

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage**:
   - Click on "Storage" in the left sidebar
   - Click "New bucket"

3. **Create Required Buckets**:
   Create these buckets one by one:

   **Bucket 1: avatar**
   - Name: `avatar`
   - Public: ✅ Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

   **Bucket 2: public**
   - Name: `public`
   - Public: ✅ Yes
   - File size limit: 10MB
   - Allowed MIME types: `*/*`

   **Bucket 3: uploads**
   - Name: `uploads`
   - Public: ❌ No
   - File size limit: 10MB
   - Allowed MIME types: `*/*`

   **Bucket 4: images**
   - Name: `images`
   - Public: ❌ No
   - File size limit: 10MB
   - Allowed MIME types: `image/*`

   **Bucket 5: family_img**
   - Name: `family_img`
   - Public: ✅ Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

### **Option 2: Using SQL Editor**

1. **Go to SQL Editor** in Supabase Dashboard
2. **Run this SQL**:

```sql
-- Create all storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatar', 'avatar', true),
  ('public', 'public', true),
  ('uploads', 'uploads', true),
  ('images', 'images', true),
  ('family_img', 'family_img', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatar' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own avatar" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatar' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can upload to public bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'public');

CREATE POLICY "Anyone can view public bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'public');

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
```

## 🧪 **Testing After Fix**

1. **Verify Buckets Created**:
   - Go to Storage in Supabase Dashboard
   - Confirm all 5 buckets exist

2. **Test Avatar Upload**:
   - Try updating your profile with an avatar
   - Check console logs for success messages
   - Verify avatar appears in profile

3. **Check Storage Policies**:
   - Go to Storage → Policies
   - Verify policies are created for each bucket

## 🎯 **Expected Results**

After creating the buckets:
- ✅ Avatar uploads will work
- ✅ Profile updates will include avatars
- ✅ Fallback mechanisms will be available
- ✅ Family image uploads will work
- ✅ No more "Bucket not found" errors

## 🚨 **Important Notes**

1. **Supabase Project Status**: Make sure your Supabase project is not paused
2. **Network Connectivity**: Ensure you can access Supabase dashboard
3. **Storage Policies**: The policies ensure proper access control
4. **File Limits**: Set appropriate file size limits for each bucket

## 🔧 **Files Created**

- `supabase/migrations/20250121000001_create_all_storage_buckets.sql` - Migration file
- `create-storage-buckets.js` - Script to create buckets (requires connectivity)

## ✅ **Next Steps**

1. **Create the storage buckets** using one of the methods above
2. **Test avatar upload** functionality
3. **Verify profile updates** work correctly
4. **Check family image uploads** work

Once the storage buckets are created, all avatar upload functionality will work correctly!
