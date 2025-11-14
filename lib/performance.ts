/**
 * Performance monitoring utilities
 * Helps measure and optimize page load times and component rendering
 */

/**
 * Measure page load performance
 */
export function measurePageLoad(pageName: string) {
  if (typeof window === 'undefined') return

  // Use Performance API
  if ('performance' in window && 'getEntriesByType' in window.performance) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigation) {
      const metrics = {
        page: pageName,
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        domComplete: navigation.domComplete - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      }

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${pageName}:`, metrics)
      }

      return metrics
    }
  }
}

/**
 * Measure component render time
 */
export function measureRender(componentName: string, callback: () => void) {
  if (typeof window === 'undefined') {
    callback()
    return
  }

  const startTime = performance.now()
  callback()
  const endTime = performance.now()
  const duration = endTime - startTime

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Render] ${componentName}: ${duration.toFixed(2)}ms`)
  }

  return duration
}

/**
 * Mark performance milestone
 */
export function markPerformance(name: string) {
  if (typeof window === 'undefined') return

  if ('performance' in window && 'mark' in window.performance) {
    performance.mark(name)
  }
}

/**
 * Measure time between two performance marks
 */
export function measurePerformance(name: string, startMark: string, endMark: string) {
  if (typeof window === 'undefined') return

  if ('performance' in window && 'measure' in window.performance) {
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name)[0]
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`)
      }

      return measure.duration
    } catch (error) {
      console.error('Performance measurement error:', error)
    }
  }
}

/**
 * Report Web Vitals (Core Web Vitals)
 */
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value)
  }

  // In production, you could send this to an analytics service
  // Example: sendToAnalytics(metric)
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get connection speed information
 */
export function getConnectionSpeed(): 'slow' | 'medium' | 'fast' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown'

  // @ts-ignore - Navigator.connection is experimental
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

  if (!connection) return 'unknown'

  const effectiveType = connection.effectiveType

  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'slow'
    case '3g':
      return 'medium'
    case '4g':
      return 'fast'
    default:
      return 'unknown'
  }
}

/**
 * Preload an image
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<void> {
  await Promise.all(srcs.map(preloadImage))
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * Lazy load images when they enter viewport
 */
export function lazyLoadImage(img: HTMLImageElement) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLImageElement
        const src = target.dataset.src
        if (src) {
          target.src = src
          target.removeAttribute('data-src')
        }
        observer.unobserve(target)
      }
    })
  })

  observer.observe(img)
}
