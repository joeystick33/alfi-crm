import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface LazyImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  src: string;
  alt: string;
  className?: string;
}

export function LazyImage({ src, alt, className = '', ...props }: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        loading="lazy"
        quality={85}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        {...props}
      />
    </div>
  );
}

export default LazyImage;
