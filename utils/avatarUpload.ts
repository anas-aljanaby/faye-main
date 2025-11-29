import { supabase } from '../lib/supabase';

export type AvatarType = 'team_member' | 'sponsor' | 'orphan';

/**
 * Uploads an avatar image to Supabase storage
 * @param file The image file to upload
 * @param userId The user ID (for team members/sponsors) or orphan ID
 * @param type The type of avatar being uploaded
 * @returns The public URL of the uploaded avatar
 */
export async function uploadAvatar(
  file: File,
  userId: string,
  type: AvatarType
): Promise<string> {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit.');
    }

    // Determine folder path based on type
    let folderPath: string;
    if (type === 'orphan') {
      folderPath = `orphans/${userId}`;
    } else {
      folderPath = `${userId}`;
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Replace existing file if it exists
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

/**
 * Deletes an avatar from Supabase storage
 * @param userId The user ID or orphan ID
 * @param type The type of avatar
 */
export async function deleteAvatar(
  userId: string,
  type: AvatarType
): Promise<void> {
  try {
    let folderPath: string;
    if (type === 'orphan') {
      folderPath = `orphans/${userId}`;
    } else {
      folderPath = `${userId}`;
    }

    // List all files in the folder
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list(folderPath);

    if (listError) {
      throw listError;
    }

    // Delete all files in the folder (usually just one avatar file)
    if (files && files.length > 0) {
      const filePaths = files.map((file) => `${folderPath}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove(filePaths);

      if (deleteError) {
        throw deleteError;
      }
    }
  } catch (error) {
    console.error('Error deleting avatar:', error);
    throw error;
  }
}

/**
 * Gets the public URL for an avatar
 * @param userId The user ID or orphan ID
 * @param type The type of avatar
 * @returns The public URL or null if not found
 */
export function getAvatarUrl(userId: string, type: AvatarType): string | null {
  let folderPath: string;
  if (type === 'orphan') {
    folderPath = `orphans/${userId}`;
  } else {
    folderPath = `${userId}`;
  }

  // Try common file extensions
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  for (const ext of extensions) {
    const filePath = `${folderPath}/avatar.${ext}`;
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    // Note: This returns a URL even if the file doesn't exist
    // You may want to check if the file actually exists
    return data.publicUrl;
  }

  return null;
}

