
import React, { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string; // Optional low-res placeholder
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  placeholderSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==', // Gray pixel
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* الصورة الأصلية */}
      <img
        src={hasError ? 'https://via.placeholder.com/150?text=Error' : src}
        alt={alt}
        loading="lazy" // Native lazy loading
        decoding="async" // Off-thread decoding
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-all duration-500 ease-in-out
          ${isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-lg scale-105'}
        `}
        {...props}
      />
      
      {/* Placeholder Skeleton (يظهر قبل التحميل) */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </div>
      )}
    </div>
  );
};

export default React.memo(OptimizedImage);
