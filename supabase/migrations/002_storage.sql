-- Storage: avatars bucket and RLS policies
-- Run after 001_initial_schema.sql
-- Paths use user_profiles.id as the top-level folder (see utils/avatarUpload.ts); auth.uid() is auth.users.id.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users upload to folder named by their profile id (linked via auth_user_id)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (
    (storage.foldername(name))[1] = (SELECT id::text FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1)
    OR
    (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE auth_user_id = auth.uid() AND role = 'team_member'
      )
      AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM user_profiles
        WHERE organization_id = (
          SELECT organization_id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1
        )
      )
    )
  )
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (
    (storage.foldername(name))[1] = (SELECT id::text FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1)
    OR
    (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE auth_user_id = auth.uid() AND role = 'team_member'
      )
      AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM user_profiles
        WHERE organization_id = (
          SELECT organization_id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1
        )
      )
    )
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (
    (storage.foldername(name))[1] = (SELECT id::text FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1)
    OR
    (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE auth_user_id = auth.uid() AND role = 'team_member'
      )
      AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM user_profiles
        WHERE organization_id = (
          SELECT organization_id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1
        )
      )
    )
  )
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (
    (storage.foldername(name))[1] = (SELECT id::text FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1)
    OR
    (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE auth_user_id = auth.uid() AND role = 'team_member'
      )
      AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM user_profiles
        WHERE organization_id = (
          SELECT organization_id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1
        )
      )
    )
  )
);

CREATE POLICY "Team members can manage orphan avatars"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'orphans' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = auth.uid() AND role = 'team_member'
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'orphans' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = auth.uid() AND role = 'team_member'
  )
);

CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
