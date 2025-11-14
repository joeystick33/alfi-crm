'use client';

import { useState } from 'react';
import { cn, getInitials } from '@/lib/utils';

const Avatar = ({ 
  src,
  alt,
  name,
  size = 'md',
  variant = 'circle',
  status,
  className 
}) => {
  const [imageError, setImageError] = useState(false);
  
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-3xl'
  };
  
  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5'
  };
  
  const statusColors = {
    online: 'bg-success-500',
    offline: 'bg-gray-400',
    busy: 'bg-error-500',
    away: 'bg-warning-500'
  };
  
  const showInitials = !src || imageError;
  const initials = name ? getInitials(name) : '?';
  
  return (
    <div className={cn('relative inline-block', className)}>
      <div 
        className={cn(
          'flex items-center justify-center',
          'bg-gradient-to-br from-primary-400 to-primary-600',
          'text-white font-semibold',
          'overflow-hidden',
          sizes[size],
          variant === 'circle' ? 'rounded-full' : 'rounded-lg'
        )}
      >
        {showInitials ? (
          <span>{initials}</span>
        ) : (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      
      {status && (
        <span 
          className={cn(
            'absolute bottom-0 right-0',
            'rounded-full border-2 border-white',
            statusSizes[size],
            statusColors[status]
          )}
          aria-label={status}
        />
      )}
    </div>
  );
};

const AvatarGroup = ({ children, max = 3, size = 'md', className }) => {
  const childrenArray = Array.isArray(children) ? children : [children];
  const displayedChildren = childrenArray.slice(0, max);
  const remaining = childrenArray.length - max;
  
  const sizes = {
    xs: 'w-6 h-6 text-xs -ml-2',
    sm: 'w-8 h-8 text-sm -ml-2',
    md: 'w-10 h-10 text-base -ml-3',
    lg: 'w-12 h-12 text-lg -ml-3',
    xl: 'w-16 h-16 text-xl -ml-4',
    '2xl': 'w-24 h-24 text-3xl -ml-6'
  };
  
  return (
    <div className={cn('flex items-center', className)}>
      {displayedChildren.map((child, index) => (
        <div 
          key={index}
          className={cn(
            'ring-2 ring-white',
            index > 0 && sizes[size]
          )}
        >
          {child}
        </div>
      ))}
      
      {remaining > 0 && (
        <div 
          className={cn(
            'flex items-center justify-center',
            'bg-gray-200 text-gray-600 font-semibold',
            'rounded-full ring-2 ring-white',
            sizes[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

const AvatarFallback = ({ children, className }) => {
  return (
    <div className={cn(
      'flex items-center justify-center w-full h-full',
      'bg-gradient-to-br from-primary-400 to-primary-600',
      'text-white font-semibold',
      className
    )}>
      {children}
    </div>
  );
};

Avatar.Group = AvatarGroup;

export { Avatar, AvatarFallback, AvatarGroup };
export default Avatar;
