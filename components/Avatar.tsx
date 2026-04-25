import React, { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Consistent color per name (same person always gets the same swatch)
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

  if (showFallback) {
    return (
      <div
        dir="auto"
        className={`${sizeClass} ${bgColor} inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full text-white ${className}`}
        title={name}
      >
        <svg
          viewBox="0 0 64 64"
          aria-hidden="true"
          className="h-[78%] w-[78%] opacity-95"
          fill="none"
        >
          <circle cx="32" cy="32" r="30" fill="currentColor" opacity="0.14" />
          <circle cx="32" cy="25" r="10" fill="currentColor" />
          <path
            d="M16 52c1.8-8.4 8.5-14 16-14s14.2 5.6 16 14"
            fill="currentColor"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${sizeClass} inline-block shrink-0 overflow-hidden rounded-full object-cover align-middle ${className}`}
      onError={() => setImageError(true)}
    />
  );
};

export default Avatar;
