-- Allow short achievement videos in the avatars bucket (paths: orphans/{id}/...)
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg'::text,
    'image/jpg'::text,
    'image/png'::text,
    'image/webp'::text,
    'video/mp4'::text
  ],
  file_size_limit = 52428800
WHERE id = 'avatars';
