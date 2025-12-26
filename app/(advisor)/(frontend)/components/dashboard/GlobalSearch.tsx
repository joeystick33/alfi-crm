'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/app/_common/lib/utils'
import {
  Search,
  X,
  User,
  CheckSquare,
  Calendar,
  FileText,
  Clock,
  Loader2,
} from 'lucide-react'

const RESULT_ICONS = {
  client: User,
  task: CheckSquare,
  appointment: Calendar,
  document: FileText,
}

const RESULT_COLORS = {
  client: 'text-blue-600 bg-blue-50',
  task: 'text-green-600 bg-green-50',
  appointment: 'text-orange-600 bg-orange-50',
  document: 'text-purple-600 bg-purple-50',
}

interface SearchResult {
  id: string
  type: 'client' | 'task' | 'appointment' | 'document'
  title: string
  subtitle?: string
  description?: string
  date?: string
  url: string
}

interface SearchResults {
  clients: SearchResult[]
  tasks: SearchResult[]
  appointments: SearchResult[]
  documents: SearchResult[]
}

export function GlobalSearch() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({
    clients: [],
    tasks: [],
    appointments: [],
    documents: [],
  })
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<Array<{ query: string; result: SearchResult }>>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading recent searches:', e)
      }
    }
  }, [])

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }

      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
        setResults({ clients: [], tasks: [], appointments: [], documents: [] })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({ clients: [], tasks: [], appointments: [], documents: [] })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results)
        setSelectedIndex(0)
      }
    } catch (error: unknown) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle query change with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, performSearch])

  // Get all results as flat array
  const getAllResults = () => {
    const all: SearchResult[] = []
    Object.entries(results).forEach(([type, items]) => {
      items.forEach((item: SearchResult) => all.push({ ...item, groupType: type } as SearchResult & { groupType: string }))
    })
    return all
  }

  const allResults = getAllResults()

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev: number) => (prev < allResults.length - 1 ? prev + 1 : prev))
        break

      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev: number) => (prev > 0 ? prev - 1 : 0))
        break

      case 'Enter':
        e.preventDefault()
        if (allResults[selectedIndex]) {
          handleResultClick(allResults[selectedIndex])
        }
        break
    }
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const newRecent = [
      { query, result },
      ...recentSearches.filter((r) => r.result.id !== result.id),
    ].slice(0, 5)

    setRecentSearches(newRecent)
    localStorage.setItem('recentSearches', JSON.stringify(newRecent))

    // Navigate
    router.push(result.url)

    // Close search
    setIsOpen(false)
    setQuery('')
    setResults({ clients: [], tasks: [], appointments: [], documents: [] })
  }

  // Clear search
  const handleClear = () => {
    setQuery('')
    setResults({ clients: [], tasks: [], appointments: [], documents: [] })
    setSelectedIndex(0)
    inputRef.current?.focus()
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-lg hover:bg-accent transition-colors w-full max-w-md"
      >
        <Search className="h-4 w-4" />
        <span>Rechercher...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-background border rounded ml-auto">
          <span>⌘</span>K
        </kbd>
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={() => setIsOpen(false)} />

      {/* Search Modal */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-card rounded-lg shadow-2xl border overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher des clients, tâches, rendez-vous..."
              className="flex-1 text-sm outline-none bg-transparent placeholder-muted-foreground"
            />
            {loading && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
            {query && !loading && (
              <button onClick={handleClear} className="p-1 hover:bg-accent rounded transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-mono bg-muted border rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
            {query.length < 2 && recentSearches.length > 0 && (
              <div className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Recherches récentes
                </h3>
                <div className="space-y-1">
                  {recentSearches.map((recent, index) => (
                    <button
                      key={index}
                      onClick={() => handleResultClick(recent.result)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent rounded-lg transition-colors"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{recent.result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{recent.query}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.length >= 2 && allResults.length === 0 && !loading && (
              <div className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucun résultat pour "{query}"</p>
              </div>
            )}

            {allResults.length > 0 && (
              <div className="p-2">
                {Object.entries(results).map(([type, items]) => {
                  if (items.length === 0) return null

                  const Icon = RESULT_ICONS[type as keyof typeof RESULT_ICONS] || FileText
                  const typeLabel: Record<string, string> = {
                    clients: 'Clients',
                    tasks: 'Tâches',
                    appointments: 'Rendez-vous',
                    documents: 'Documents',
                  }

                  return (
                    <div key={type} className="mb-4">
                      <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                        {typeLabel[type]}
                      </h3>
                      <div className="space-y-1">
                        {items.map((item: SearchResult) => {
                          const globalIndex = allResults.findIndex((r) => r.id === item.id)
                          const isSelected = globalIndex === selectedIndex

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleResultClick(item)}
                              className={cn(
                                'w-full flex items-start gap-3 px-3 py-2 text-left rounded-lg transition-colors',
                                isSelected ? 'bg-accent border border-border' : 'hover:bg-accent/50'
                              )}
                            >
                              <div
                                className={cn(
                                  'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                                  RESULT_COLORS[item.type]
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.title}</p>
                                {item.subtitle && (
                                  <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                                )}
                                {item.description && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                                {item.date && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(item.date).toLocaleDateString('fr-FR', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                )}
                              </div>

                              {isSelected && (
                                <div className="flex-shrink-0 text-xs text-primary font-medium">↵</div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-muted/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background border rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-background border rounded">↓</kbd>
                  <span>naviguer</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background border rounded">↵</kbd>
                  <span>sélectionner</span>
                </span>
              </div>
              <span>
                {allResults.length} résultat{allResults.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
