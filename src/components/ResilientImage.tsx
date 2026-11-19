import React, { useState } from 'react';
import { Scissors } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  loading?: 'eager' | 'lazy';
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle,
  loading = 'eager',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#1C1C21] via-[#141417] to-[#0A0A0B] p-6 text-center"
      >
        <Scissors className="w-6 h-6 text-[#C8A45D]/70" aria-hidden="true" />
        <span className="font-display text-lg text-[#F5F2EB]/80">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
