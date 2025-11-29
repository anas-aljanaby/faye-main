import React, { useState, useRef } from 'react';
import { uploadAvatar, AvatarType } from '../utils/avatarUpload';
import { supabase } from '../lib/supabase';

interface AvatarUploadProps {
  currentAvatarUrl: string;
  userId: string; // UUID for database operations
  type: AvatarType;
  onUploadComplete: (newUrl: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  userId,
  type,
  onUploadComplete,
  disabled = false,
  size = 'lg',
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      // Upload to storage
      const avatarUrl = await uploadAvatar(file, userId, type);

      // Update database
      if (type === 'orphan') {
        const { error: updateError } = await supabase
          .from('orphans')
          .update({ photo_url: avatarUrl })
          .eq('id', userId);

        if (updateError) throw updateError;
      } else {
        // For team members and sponsors (user_profiles)
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      onUploadComplete(avatarUrl);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative inline-block">
      <div className="relative group">
        <img
          src={currentAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent('User')}&background=random`}
          alt="Avatar"
          className={`${sizeClasses[size]} rounded-full object-cover ring-4 ring-primary-light cursor-pointer hover:ring-primary transition-all`}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent('User')}&background=random`;
          }}
        />
        {!disabled && !uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center transition-all cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.8-3.3-4.8-6.3-4.2-1.2.2-2.3.8-3.1 1.5-1-.7-2.3-1-3.6-1-3.3 0-6 2.7-6 6 0 1.3.4 2.5 1 3.5" />
              <path d="m20 17-5-5-4 4-3-3-5 5" />
              <path d="M16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
            </svg>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <svg
              className="animate-spin h-8 w-8 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
      {error && (
        <div className="mt-2 text-sm text-red-600 text-center">{error}</div>
      )}
      {!disabled && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          انقر على الصورة لتغييرها
        </p>
      )}
    </div>
  );
};

