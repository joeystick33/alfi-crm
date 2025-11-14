'use client';

import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { Pin, PinOff } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';

export default function NavigationItem({
  item,
  isCollapsed = false,
  isPinned = false,
  onTogglePin,
  badgeCount = null,
  highlightText = (text) => text
}) {
  const pathname = usePathname();
  const router = useRouter();
  const Icon = item.icon;

  const isActive = () => {
    if (item.path === '/dashboard') {
      return pathname === item.path;
    }
    return pathname.startsWith(item.path);
  };

  const active = isActive();

  const handleClick = () => {
    router.push(item.path);
  };

  const handlePinClick = (e) => {
    e.stopPropagation();
    if (onTogglePin) {
      onTogglePin(item.id);
    }
  };

  const content = (
    <div className="relative group/item">
      <button
        onClick={handleClick}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
          active
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
          isCollapsed && 'justify-center px-2'
        )}
      >
        <Icon className={cn(
          'h-5 w-5 flex-shrink-0',
          active && 'text-blue-600 dark:text-blue-400'
        )} />
        
        {!isCollapsed && (
          <>
            <span className="flex-1 text-sm font-medium text-left truncate">
              {highlightText(item.label)}
            </span>
            
            {badgeCount && (
              <Badge 
                variant={active ? 'default' : 'secondary'} 
                className="h-5 min-w-[20px] px-1.5 text-xs"
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </Badge>
            )}
          </>
        )}
      </button>

      {/* Pin/Unpin Button */}
      {!isCollapsed && onTogglePin && (
        <button
          onClick={handlePinClick}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-all',
            'opacity-0 group-hover/item:opacity-100',
            isPinned && 'opacity-100',
            'hover:bg-gray-200 dark:hover:bg-gray-600'
          )}
          title={isPinned ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          {isPinned ? (
            <PinOff className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />
          ) : (
            <Pin className="h-3.5 w-3.5 text-gray-400" />
          )}
        </button>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={item.label} side="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}
