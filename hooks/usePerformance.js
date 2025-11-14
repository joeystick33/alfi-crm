/**
 * Performance Optimization Hooks
 * useMemo, debouncing, lazy loading utilities
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * Hook de debouncing pour les inputs
 * @param {*} value - Valeur à debouncer
 * @param {Number} delay - Délai en ms
 * @returns {*} Valeur debouncée
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook pour lazy loading des données
 * @param {Function} loadFn - Fonction de chargement
 * @param {Boolean} shouldLoad - Condition de chargement
 * @returns {Object} État du chargement
 */
export function useLazyLoad(loadFn, shouldLoad = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (shouldLoad && !hasLoaded.current) {
      setLoading(true);
      loadFn()
        .then(result => {
          setData(result);
          hasLoaded.current = true;
        })
        .catch(err => {
          setError(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [shouldLoad, loadFn]);

  const reload = useCallback(() => {
    hasLoaded.current = false;
    setLoading(true);
    loadFn()
      .then(result => {
        setData(result);
        hasLoaded.current = true;
      })
      .catch(err => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loadFn]);

  return { data, loading, error, reload };
}

/**
 * Hook pour pagination
 * @param {Array} items - Liste d'items
 * @param {Number} itemsPerPage - Items par page
 * @returns {Object} État de pagination
 */
export function usePagination(items, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

/**
 * Hook pour infinite scroll
 * @param {Function} loadMore - Fonction de chargement
 * @param {Boolean} hasMore - Y a-t-il plus de données
 * @returns {Object} État et ref
 */
export function useInfiniteScroll(loadMore, hasMore) {
  const [loading, setLoading] = useState(false);
  const observerRef = useRef();
  const loadMoreRef = useRef(loadMore);

  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setLoading(true);
          loadMoreRef.current().finally(() => {
            setLoading(false);
          });
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loading]);

  return { observerRef, loading };
}

/**
 * Hook pour mesurer les performances
 * @param {String} name - Nom de la métrique
 * @returns {Function} Fonction pour marquer la fin
 */
export function usePerformanceMetric(name) {
  const startTime = useRef(Date.now());

  useEffect(() => {
    return () => {
      const duration = Date.now() - startTime.current;
      console.log(`[Performance] ${name}: ${duration}ms`);
      
      // TODO: Envoyer à un service de monitoring
    };
  }, [name]);

  const mark = useCallback((label) => {
    const duration = Date.now() - startTime.current;
    console.log(`[Performance] ${name} - ${label}: ${duration}ms`);
  }, [name]);

  return mark;
}

/**
 * Hook pour cache local
 * @param {String} key - Clé du cache
 * @param {Function} fetchFn - Fonction de récupération
 * @param {Number} ttl - Time to live en ms
 * @returns {Object} Données et fonctions
 */
export function useLocalCache(key, fetchFn, ttl = 5 * 60 * 1000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (force = false) => {
    try {
      setLoading(true);
      
      // Vérifier le cache
      if (!force) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < ttl) {
            setData(cachedData);
            setLoading(false);
            return cachedData;
          }
        }
      }
      
      // Charger les données
      const result = await fetchFn();
      
      // Mettre en cache
      localStorage.setItem(key, JSON.stringify({
        data: result,
        timestamp: Date.now(),
      }));
      
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, ttl]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const invalidate = useCallback(() => {
    localStorage.removeItem(key);
    loadData(true);
  }, [key, loadData]);

  return { data, loading, error, reload: () => loadData(true), invalidate };
}
