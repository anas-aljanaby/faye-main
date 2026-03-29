import { supabase } from '../lib/supabase';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

/**
 * Upload achievement image or video for an orphan. Uses avatars bucket under orphans/{orphanId}/achievements/.
 */
export async function uploadOrphanAchievementMedia(
  file: File,
  orphanUuid: string
): Promise<{ publicUrl: string; mediaType: 'image' | 'video' }> {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  if (!isVideo && !isImage) {
    throw new Error('نوع الملف غير مدعوم. استخدم صورة أو فيديو MP4.');
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) {
    throw new Error('حجم الصورة يتجاوز 5 ميجابايت.');
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    throw new Error('حجم الفيديو يتجاوز 50 ميجابايت.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
  const safeExt = ext.replace(/[^a-z0-9]/g, '') || (isVideo ? 'mp4' : 'jpg');
  const filePath = `orphans/${orphanUuid}/achievements/${crypto.randomUUID()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return {
    publicUrl: data.publicUrl,
    mediaType: isVideo ? 'video' : 'image',
  };
}
