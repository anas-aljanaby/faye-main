-- Migration: Create avatars storage bucket
-- This migration creates a Supabase storage bucket for profile pictures
-- Run this using Supabase CLI or Dashboard SQL Editor

-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the avatars bucket
-- Allow authenticated users to upload their own avatars (team members and sponsors)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (
    -- Users can upload to their own folder
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Team members can upload to any user folder in their organization
    (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'team_member'
      )
      AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM user_profiles
        WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
      )
    )
  )
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'team_member'
      )
      AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM user_profiles
        WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
      )
    )
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'team_member'
      )
      AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM user_profiles
        WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
      )
    )
  )
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'team_member'
      )
      AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM user_profiles
        WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
      )
    )
  )
);

-- Allow team members to upload/update/delete avatars for orphans in their organization
CREATE POLICY "Team members can manage orphan avatars"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'orphans' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'team_member'
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'orphans' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'team_member'
  )
);

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

