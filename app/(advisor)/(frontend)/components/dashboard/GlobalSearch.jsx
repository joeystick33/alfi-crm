'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  X, 
  User, 
  CheckSquare, 
  Calendar, 
  FileText,
  Clock,
  Loader2
} from 'lucide-react';
import { cn } from '@/app/_common/lib/utils';
import { apiCall } from '@/app/_common/lib/api-client';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const RESULT_ICONS = {
  client: User,
  task: CheckSquare,
  appointment: Calendar,
  document: FileText
};

const RESULT_COLORS = {
  client: 'text-blue-600 bg-blue-50',
  task: 'text-green-600 bg-green-50',
  appointment: 'text-orange-600 bg-orange-50',
  document: 'text-purple-600 bg-purple-50'
};

export default function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    clients: [],
    tasks: [],
    appointments: [],
    documents: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
        setResults({ clients: [], tasks: [], appointments: [], documents: [] });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({ clients: [], tasks: [], appointments: [], documents: [] });
      return;
    }

    setLoading(true);
    try {
      const data = await apiCall(`/api/advisor/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
      setResults(data.results);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle query change with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  // Get all results as flat array
  const getAllResults = () => {
    const all = [];
    Object.entries(results).forEach(([type, items]) => {
      items.forEach(item => all.push({ ...item, groupType: type }));
    });
    return all;
  };

  const allResults = getAllResults();

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allResults.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleResultClick(allResults[selectedIndex]);
        }
        break;
    }
  };

  // Handle result click
  const handleResultClick = (result) => {
    // Save to recent searches
    const newRecent = [
      { query, result },
      ...recentSearches.filter(r => r.result.id !== result.id)
    ].slice(0, 5);
    
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));

    // Save to backend
    apiCall('/api/advisor/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        resultId: result.id,
        resultType: result.type
      })
    }).catch(console.error);

    // Navigate
    router.push(result.url);
    
    // Close search
    setIsOpen(false);
    setQuery('');
    setResults({ clients: [], tasks: [], appointments: [], documents: [] });
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setResults({ clients: [], tasks: [], appointments: [], documents: [] });
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Rechercher...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded">
          <span>⌘</span>K
        </kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Modal */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher des clients, tâches, rendez-vous..."
              className="flex-1 text-sm outline-none placeholder-gray-400"
            />
            {loading && (
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            )}
            {query && !loading && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div 
            ref={resultsRef}
            className="max-h-[60vh] overflow-y-auto"
          >
            {query.length < 2 && recentSearches.length > 0 && (
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Recherches récentes
                </h3>
                <div className="space-y-1">
                  {recentSearches.map((recent, index) => (
                    <button
                      key={index}
                      onClick={() => handleResultClick(recent.result)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {recent.result.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {recent.query}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.length >= 2 && allResults.length === 0 && !loading && (
              <div className="p-8 text-center">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Aucun résultat pour "{query}"
                </p>
              </div>
            )}

            {allResults.length > 0 && (
              <div className="p-2">
                {Object.entries(results).map(([type, items]) => {
                  if (items.length === 0) return null;

                  const Icon = RESULT_ICONS[type] || FileText;
                  const typeLabel = {
                    clients: 'Clients',
                    tasks: 'Tâches',
                    appointments: 'Rendez-vous',
                    documents: 'Documents'
                  }[type];

                  return (
                    <div key={type} className="mb-4">
                      <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                        {typeLabel}
                      </h3>
                      <div className="space-y-1">
                        {items.map((item, itemIndex) => {
                          const globalIndex = allResults.findIndex(r => r.id === item.id);
                          const isSelected = globalIndex === selectedIndex;

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleResultClick(item)}
                              className={cn(
                                'w-full flex items-start gap-3 px-3 py-2 text-left rounded-lg transition-colors',
                                isSelected 
                                  ? 'bg-blue-50 border border-blue-200' 
                                  : 'hover:bg-gray-50'
                              )}
                            >
                              <div className={cn(
                                'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                                RESULT_COLORS[item.type]
                              )}>
                                <Icon className="h-4 w-4" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.title}
                                </p>
                                {item.subtitle && (
                                  <p className="text-xs text-gray-600 truncate">
                                    {item.subtitle}
                                  </p>
                                )}
                                {item.description && (
                                  <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                                {item.date && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {format(new Date(item.date), 'PPp', { locale: fr })}
                                  </p>
                                )}
                              </div>

                              {isSelected && (
                                <div className="flex-shrink-0 text-xs text-blue-600 font-medium">
                                  ↵
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">↓</kbd>
                  <span>naviguer</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">↵</kbd>
                  <span>sélectionner</span>
                </span>
              </div>
              <span>{allResults.length} résultat{allResults.length > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
