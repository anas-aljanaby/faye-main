import React, { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Generate a consistent color based on the name
function getColorFromName(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Get the first letter (handles Arabic and Latin)
function getFirstLetter(name: string): string {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  
  // Get first character (handles multi-byte Unicode like Arabic)
  const firstChar = [...trimmed][0];
  return firstChar.toUpperCase();
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  const showFallback = !src || src === '' || imageError;
  const sizeClass = sizeClasses[size];
  const bgColor = getColorFromName(name);
  const letter = getFirstLetter(name);

  if (showFallback) {
    return (
      <div
        className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
        title={name}
      >
        {letter}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${sizeClass} rounded-full object-cover ${className}`}
      onError={() => setImageError(true)}
    />
  );
};

export default Avatar;
