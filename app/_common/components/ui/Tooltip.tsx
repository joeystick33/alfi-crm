// @ts-nocheck
'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/app/_common/lib/utils';

const Tooltip = ({ 
  children, 
  content,
  position = 'top',
  delay = 200,
  className 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };
  
  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
    }
  }, [isVisible]);
  
  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };
  
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };
  
  const tooltipContent = isVisible && typeof window !== 'undefined' && (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        top: coords.top,
        left: coords.left,
        width: coords.width,
        height: coords.height
      }}
    >
      <div className={cn('absolute', positions[position])}>
        <div 
          className={cn(
            'px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg',
            'animate-in fade-in zoom-in-95 duration-100',
            'max-w-xs',
            className
          )}
        >
          {content}
        </div>
      </div>
    </div>
  );
  
  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      {tooltipContent && createPortal(tooltipContent, document.body)}
    </>
  );
};

const TooltipProvider = ({ children }) => {
  return <>{children}</>;
};

const TooltipTrigger = ({ children, asChild, ...props }) => {
  return <div {...props}>{children}</div>;
};

const TooltipContent = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn(
        'px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg',
        'animate-in fade-in zoom-in-95 duration-100',
        'max-w-xs',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent };
export default Tooltip;
