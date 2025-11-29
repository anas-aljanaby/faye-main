# Avatar Upload Implementation

This document describes how to set up and use the avatar upload functionality for team members, orphans, and sponsors.

## Setup

### 1. Run the Storage Bucket Migration

Run the migration script to create the avatars storage bucket:

```bash
# Using Supabase CLI
supabase migration up

# Or manually in Supabase Dashboard SQL Editor
# Copy and paste the contents of supabase/migrations/004_create_avatars_storage_bucket.sql
```

### 2. Verify Storage Bucket

After running the migration, verify that:
- The `avatars` bucket exists in your Supabase Storage
- The bucket is set to public
- File size limit is 5MB
- Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp

## Usage

### For Team Members

1. Navigate to a team member's profile page
2. Click on the avatar image
3. Select an image file (JPEG, PNG, or WebP, max 5MB)
4. The avatar will be uploaded and the page will refresh

### For Orphans

1. Navigate to an orphan's profile page
2. Click on the avatar image
3. Select an image file (JPEG, PNG, or WebP, max 5MB)
4. The avatar will be uploaded and the page will refresh

**Note:** Only team members can upload avatars for orphans.

### For Sponsors

1. Navigate to a sponsor's profile page
2. Click on the avatar image
3. Select an image file (JPEG, PNG, or WebP, max 5MB)
4. The avatar will be uploaded and the page will refresh

## File Structure

Avatars are stored in the following structure:
- Team members/sponsors: `{user_id}/avatar.{ext}`
- Orphans: `orphans/{orphan_id}/avatar.{ext}`

## Database Updates

When an avatar is uploaded:
1. The file is uploaded to Supabase Storage
2. The `avatar_url` field in `user_profiles` (for team members/sponsors) or `photo_url` in `orphans` is updated with the public URL
3. The page refreshes to show the new avatar

## Storage Policies

The storage bucket has the following policies:
- **Public read access**: Anyone can view avatars
- **Authenticated upload**: Users can upload their own avatars
- **Team member privileges**: Team members can upload avatars for any user in their organization and for orphans

## Troubleshooting

### Avatar not uploading
- Check that the file size is under 5MB
- Verify the file type is JPEG, PNG, or WebP
- Ensure you have the correct permissions (team members can upload for orphans)

### Avatar not displaying
- Check that the `avatar_url` or `photo_url` field is set in the database
- Verify the storage bucket is public
- Check browser console for any errors

### Permission errors
- Ensure the storage policies are correctly set up
- Verify your user role (team members have additional privileges)

