'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  FileText,
  Mail,
  TrendingUp,
  Briefcase,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BarChart3,
  Target,
  MessageSquare,
  Shield,
  Search,
  Pin,
  PinOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import NavigationItem from './NavigationItem';
import NavigationSection from './NavigationSection';

// Sidebar states
const SIDEBAR_STATES = {
  HIDDEN: 'hidden',
  COLLAPSED: 'collapsed',
  EXPANDED: 'expanded'
};

// Navigation items configuration
const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    path: '/dashboard',
    badge: null
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    path: '/dashboard/clients',
    badge: 'clients'
  },
  {
    id: 'calendar',
    label: 'Calendrier',
    icon: Calendar,
    path: '/dashboard/calendrier',
    badge: 'appointments'
  },
  {
    id: 'tasks',
    label: 'Tâches',
    icon: CheckSquare,
    path: '/dashboard/taches',
    badge: 'tasks'
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    path: '/dashboard/documents',
    badge: null
  },
  {
    id: 'emails',
    label: 'Emails',
    icon: Mail,
    path: '/dashboard/emails',
    badge: 'emails'
  },
  {
    id: 'opportunities',
    label: 'Opportunités',
    icon: TrendingUp,
    path: '/dashboard/opportunites',
    badge: 'opportunities'
  },
  {
    id: 'projects',
    label: 'Projets',
    icon: Briefcase,
    path: '/dashboard/projets',
    badge: null
  },
  {
    id: 'activity',
    label: 'Mon activité',
    icon: BarChart3,
    path: '/dashboard/mon-activite',
    badge: null
  },
  {
    id: 'objectives',
    label: 'Objectifs',
    icon: Target,
    path: '/dashboard/objectifs',
    badge: null
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    path: '/dashboard/messages',
    badge: 'messages'
  },
  {
    id: 'compliance',
    label: 'Conformité',
    icon: Shield,
    path: '/dashboard/conformite',
    badge: 'alerts'
  }
];

const BOTTOM_ITEMS = [
  {
    id: 'alerts',
    label: 'Alertes',
    icon: Bell,
    path: '/dashboard/alertes',
    badge: 'alerts'
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    path: '/dashboard/settings',
    badge: null
  }
];

export default function Sidebar({ badges = {}, className }) {
  const [state, setState] = useState(SIDEBAR_STATES.EXPANDED);
  const [pinnedItems, setPinnedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarState');
    if (savedState && Object.values(SIDEBAR_STATES).includes(savedState)) {
      setState(savedState);
    }

    const savedPinned = localStorage.getItem('pinnedItems');
    if (savedPinned) {
      try {
        setPinnedItems(JSON.parse(savedPinned));
      } catch (e) {
        console.error('Error loading pinned items:', e);
      }
    }
  }, []);

  // Save sidebar state to localStorage
  const updateState = (newState) => {
    setState(newState);
    localStorage.setItem('sidebarState', newState);
  };

  // Keyboard shortcut: Ctrl+B
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state]);

  const toggleSidebar = () => {
    if (state === SIDEBAR_STATES.EXPANDED) {
      updateState(SIDEBAR_STATES.COLLAPSED);
    } else if (state === SIDEBAR_STATES.COLLAPSED) {
      updateState(SIDEBAR_STATES.HIDDEN);
    } else {
      updateState(SIDEBAR_STATES.EXPANDED);
    }
  };

  const getBadgeCount = (badgeKey) => {
    if (!badgeKey || !badges[badgeKey]) return null;
    const count = badges[badgeKey];
    return count > 0 ? count : null;
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    router.push(path);
  };

  // Pin/Unpin item
  const togglePin = (itemId) => {
    setPinnedItems(prev => {
      const newPinned = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      localStorage.setItem('pinnedItems', JSON.stringify(newPinned));
      return newPinned;
    });
  };

  const isPinned = (itemId) => pinnedItems.includes(itemId);

  // Filter items based on search query
  const filterItems = (items) => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.label.toLowerCase().includes(query)
    );
  };

  const filteredNavItems = filterItems(NAVIGATION_ITEMS);
  const filteredBottomItems = filterItems(BOTTOM_ITEMS);

  // Highlight matching text
  const highlightText = (text) => {
    if (!searchQuery.trim()) return text;
    
    const query = searchQuery.toLowerCase();
    const index = text.toLowerCase().indexOf(query);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <mark className="bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-white">
          {text.substring(index, index + query.length)}
        </mark>
        {text.substring(index + query.length)}
      </>
    );
  };

  // Render navigation item using NavigationItem component
  const renderNavItem = (item, showInPinnedSection = false) => {
    const badgeCount = getBadgeCount(item.badge);
    const pinned = isPinned(item.id);

    return (
      <NavigationItem
        key={item.id}
        item={item}
        isCollapsed={state === SIDEBAR_STATES.COLLAPSED}
        isPinned={pinned}
        onTogglePin={togglePin}
        badgeCount={badgeCount}
        highlightText={highlightText}
      />
    );
  };

  // Floating button for hidden state
  if (state === SIDEBAR_STATES.HIDDEN) {
    return (
      <button
        onClick={() => updateState(SIDEBAR_STATES.EXPANDED)}
        className={cn(
          'fixed left-4 top-4 z-40 p-3 rounded-lg',
          'bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700',
          'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
          className
        )}
      >
        <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>
    );
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 flex flex-col',
        state === SIDEBAR_STATES.EXPANDED ? 'w-64' : 'w-16',
        className
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700',
        state === SIDEBAR_STATES.COLLAPSED && 'justify-center'
      )}>
        {state === SIDEBAR_STATES.EXPANDED ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CRM</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                Conseiller
              </span>
            </div>
            
            <button
              onClick={toggleSidebar}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
          </>
        ) : (
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Search Bar */}
      {state === SIDEBAR_STATES.EXPANDED && (
        <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className={cn(
                'w-full pl-9 pr-8 py-2 text-sm',
                'bg-gray-50 dark:bg-gray-700/50',
                'border border-gray-200 dark:border-gray-600',
                'rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'text-gray-900 dark:text-white',
                'placeholder-gray-400 dark:placeholder-gray-500'
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pinned Items Section */}
      {pinnedItems.length > 0 && !searchQuery && (
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          {state === SIDEBAR_STATES.EXPANDED && (
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Favoris
              </h3>
              <span className="text-xs text-gray-400">
                {pinnedItems.length}
              </span>
            </div>
          )}
          <DraggablePinnedItems
            pinnedItems={pinnedItems}
            allItems={[...NAVIGATION_ITEMS, ...BOTTOM_ITEMS]}
            onReorder={(newOrder) => {
              setPinnedItems(newOrder);
              localStorage.setItem('pinnedItems', JSON.stringify(newOrder));
            }}
            renderItem={renderNavItem}
            state={state}
          />
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {filteredNavItems.length > 0 ? (
          <div className="space-y-1">
            {filteredNavItems.map(item => renderNavItem(item))}
          </div>
        ) : (
          state === SIDEBAR_STATES.EXPANDED && searchQuery && (
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucun résultat
              </p>
            </div>
          )
        )}
      </nav>

      {/* Bottom Items */}
      {filteredBottomItems.length > 0 && (
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-1">
            {filteredBottomItems.map(item => renderNavItem(item))}
          </div>
        </div>
      )}

      {/* Footer */}
      {state === SIDEBAR_STATES.EXPANDED && (
        <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
              Ctrl
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
              B
            </kbd>
            <span className="ml-1">pour basculer</span>
          </div>
        </div>
      )}
    </aside>
  );
}

/**
 * Hook to manage sidebar state
 */
export function useSidebar() {
  const [state, setState] = useState(SIDEBAR_STATES.EXPANDED);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarState');
    if (savedState && Object.values(SIDEBAR_STATES).includes(savedState)) {
      setState(savedState);
    }
  }, []);

  const updateState = (newState) => {
    setState(newState);
    localStorage.setItem('sidebarState', newState);
  };

  const toggle = () => {
    if (state === SIDEBAR_STATES.EXPANDED) {
      updateState(SIDEBAR_STATES.COLLAPSED);
    } else if (state === SIDEBAR_STATES.COLLAPSED) {
      updateState(SIDEBAR_STATES.HIDDEN);
    } else {
      updateState(SIDEBAR_STATES.EXPANDED);
    }
  };

  const expand = () => updateState(SIDEBAR_STATES.EXPANDED);
  const collapse = () => updateState(SIDEBAR_STATES.COLLAPSED);
  const hide = () => updateState(SIDEBAR_STATES.HIDDEN);

  return {
    state,
    isExpanded: state === SIDEBAR_STATES.EXPANDED,
    isCollapsed: state === SIDEBAR_STATES.COLLAPSED,
    isHidden: state === SIDEBAR_STATES.HIDDEN,
    toggle,
    expand,
    collapse,
    hide
  };
}

/**
 * Get sidebar width based on state
 */
export function getSidebarWidth(state) {
  switch (state) {
    case SIDEBAR_STATES.EXPANDED:
      return 256; // 16rem = 256px
    case SIDEBAR_STATES.COLLAPSED:
      return 64; // 4rem = 64px
    case SIDEBAR_STATES.HIDDEN:
      return 0;
    default:
      return 256;
  }
}

/**
 * Draggable Pinned Items Component
 */
function DraggablePinnedItems({ pinnedItems, allItems, onReorder, renderItem, state }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newOrder = [...pinnedItems];
      const [removed] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(dragOverIndex, 0, removed);
      onReorder(newOrder);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  if (state !== SIDEBAR_STATES.EXPANDED) {
    // No drag & drop in collapsed mode
    return (
      <div className="space-y-1">
        {pinnedItems.map(itemId => {
          const item = allItems.find(i => i.id === itemId);
          return item ? renderItem(item, true) : null;
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {pinnedItems.map((itemId, index) => {
        const item = allItems.find(i => i.id === itemId);
        if (!item) return null;

        return (
          <div
            key={itemId}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDragLeave={handleDragLeave}
            className={cn(
              'transition-all',
              draggedIndex === index && 'opacity-50',
              dragOverIndex === index && 'border-t-2 border-blue-500'
            )}
          >
            {renderItem(item, true)}
          </div>
        );
      })}
    </div>
  );
}
