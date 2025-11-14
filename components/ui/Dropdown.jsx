'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/design-system';
import { focusRing } from '@/lib/accessibility';

export default function Dropdown({
  trigger,
  children,
  align = 'left',
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const alignments = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1',
            alignments[align],
            className
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, onClick, disabled = false, className }) {
  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full px-4 py-2 text-left text-sm transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        focusRing.default,
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 border-t border-gray-200 dark:border-gray-700" role="separator" />;
}

// Additional exports for compatibility
export const DropdownMenu = Dropdown;
export const DropdownMenuTrigger = ({ children, asChild, ...props }) => {
  return asChild ? children : <div {...props}>{children}</div>;
};
export const DropdownMenuContent = ({ children, align = 'left', className, ...props }) => {
  return children;
};
export const DropdownMenuItem = DropdownItem;
export const DropdownMenuSeparator = DropdownSeparator;
export const DropdownMenuLabel = ({ children, className }) => {
  return (
    <div className={cn('px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400', className)}>
      {children}
    </div>
  );
};
