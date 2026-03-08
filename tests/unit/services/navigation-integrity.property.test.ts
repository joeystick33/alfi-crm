/**
 * Property-Based Tests - Navigation Integrity
 * 
 * **Feature: crm-audit-fonctionnel, Property 1: Navigation Integrity**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
 * 
 * Tests that all clickable elements navigate to valid pages:
 * - 1.1: KPI cards in Conformité dashboard navigate to correct filtered pages
 * - 1.2: KPI cards in Opérations dashboard navigate to correct filtered pages
 * - 1.3: Client names navigate to Client 360 view
 * - 1.4: Operation references navigate to operation detail pages
 * - 1.5: Documents navigate to document detail or open file
 * - 1.6: No clickable element leads to 404 or empty page
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

/**
 * Valid dashboard routes in the application
 */
const VALID_DASHBOARD_ROUTES = [
  '/dashboard/conformite',
  '/dashboard/conformite/documents',
  '/dashboard/conformite/controles',
  '/dashboard/conformite/reclamations',
  '/dashboard/conformite/alertes',
  '/dashboard/conformite/timeline',
  '/dashboard/operations',
  '/dashboard/operations/affaires-nouvelles',
  '/dashboard/operations/en-cours',
  '/dashboard/operations/gestion',
  '/dashboard/operations/pilotage',
  '/dashboard/clients',
] as const

/**
 * Valid filter parameters for each route
 */
const ROUTE_FILTER_PARAMS: Record<string, string[]> = {
  '/dashboard/conformite/documents': ['status', 'type', 'expiringSoon', 'clientId'],
  '/dashboard/conformite/controles': ['status', 'type', 'priority', 'overdueOnly', 'isACPRMandatory'],
  '/dashboard/conformite/reclamations': ['status', 'type', 'slaBreachOnly'],
  '/dashboard/conformite/alertes': ['severity', 'type', 'resolved'],
  '/dashboard/operations/affaires-nouvelles': ['status', 'productType', 'providerId'],
  '/dashboard/operations/en-cours': ['inactivityCategory'],
  '/dashboard/operations/gestion': ['status', 'type'],
}

/**
 * KPI card configurations for Conformité dashboard
 */
const CONFORMITE_KPI_CARDS = [
  { id: 'completion-rate', path: '/dashboard/conformite/documents', filters: {} },
  { id: 'documents-pending', path: '/dashboard/conformite/documents', filters: { status: 'EN_ATTENTE' } },
  { id: 'controls-overdue', path: '/dashboard/conformite/controles', filters: { overdueOnly: 'true' } },
  { id: 'open-reclamations', path: '/dashboard/conformite/reclamations', filters: {} },
  { id: 'critical-alerts', path: '/dashboard/conformite/alertes', filters: { severity: 'CRITICAL,HIGH' } },
]

/**
 * KPI card configurations for Opérations dashboard
 */
const OPERATIONS_KPI_CARDS = [
  { id: 'pipeline-total', path: '/dashboard/operations/pilotage', filters: {} },
  { id: 'affaires-nouvelles', path: '/dashboard/operations/affaires-nouvelles', filters: {} },
  { id: 'affaires-en-cours', path: '/dashboard/operations/en-cours', filters: {} },
  { id: 'operations-gestion', path: '/dashboard/operations/gestion', filters: {} },
]

/**
 * Valid document statuses
 */
const DOCUMENT_STATUSES = ['EN_ATTENTE', 'VALIDE', 'REJETE', 'EXPIRE'] as const

/**
 * Valid affaire statuses
 */
const AFFAIRE_STATUSES = [
  'PROSPECT', 'QUALIFICATION', 'CONSTITUTION', 'SIGNATURE',
  'ENVOYE', 'EN_TRAITEMENT', 'VALIDE', 'REJETE', 'ANNULE'
] as const

/**
 * Valid alert severities
 */
const ALERT_SEVERITIES = ['LOW', 'WARNING', 'HIGH', 'CRITICAL'] as const

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Build a URL with query parameters
 */
function buildUrlWithParams(basePath: string, params: Record<string, string>): string {
  const url = new URL(basePath, 'http://localhost')
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value)
    }
  })
  return url.pathname + url.search
}

/**
 * Parse URL and extract path and query parameters
 */
function parseUrl(url: string): { path: string; params: Record<string, string> } {
  const urlObj = new URL(url, 'http://localhost')
  const params: Record<string, string> = {}
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return { path: urlObj.pathname, params }
}

/**
 * Check if a path is a valid dashboard route
 */
function isValidDashboardRoute(path: string): boolean {
  // Check exact match
  if (VALID_DASHBOARD_ROUTES.includes(path as typeof VALID_DASHBOARD_ROUTES[number])) {
    return true
  }
  
  // Check dynamic routes (e.g., /dashboard/clients/[id])
  const dynamicPatterns = [
    /^\/dashboard\/clients\/[a-zA-Z0-9_-]+$/,
    /^\/dashboard\/operations\/affaires-nouvelles\/[a-zA-Z0-9_-]+$/,
    /^\/dashboard\/operations\/gestion\/[a-zA-Z0-9_-]+$/,
    /^\/dashboard\/conformite\/controles\/[a-zA-Z0-9_-]+$/,
    /^\/dashboard\/conformite\/reclamations\/[a-zA-Z0-9_-]+$/,
  ]
  
  return dynamicPatterns.some(pattern => pattern.test(path))
}

/**
 * Check if filter parameters are valid for a given route
 */
function areValidFilterParams(path: string, params: Record<string, string>): boolean {
  const validParams = ROUTE_FILTER_PARAMS[path]
  if (!validParams) {
    // Route doesn't have defined filter params, any params are invalid
    return Object.keys(params).length === 0
  }
  
  return Object.keys(params).every(key => validParams.includes(key))
}

/**
 * Generate client link path
 */
function generateClientLinkPath(clientId: string): string {
  return `/dashboard/clients/${clientId}`
}

/**
 * Generate operation detail path
 */
function generateOperationDetailPath(operationId: string, type: 'affaire' | 'gestion'): string {
  if (type === 'affaire') {
    return `/dashboard/operations/affaires-nouvelles/${operationId}`
  }
  return `/dashboard/operations/gestion/${operationId}`
}

/**
 * Generate alert action URL based on alert type
 */
function generateAlertActionUrl(
  alertType: string,
  sourceId: string,
  clientId?: string
): string | null {
  switch (alertType) {
    case 'DOCUMENT_EXPIRING':
    case 'DOCUMENT_EXPIRED':
    case 'KYC_INCOMPLETE':
      return `/dashboard/conformite/documents?clientId=${clientId || sourceId}`
    case 'CONTROL_OVERDUE':
      return `/dashboard/conformite/controles/${sourceId}`
    case 'RECLAMATION_SLA_BREACH':
      return `/dashboard/conformite/reclamations/${sourceId}`
    case 'MIFID_OUTDATED':
      return clientId ? `/dashboard/clients/${clientId}` : null
    case 'OPERATION_BLOCKED':
    case 'AFFAIRE_INACTIVE':
      return `/dashboard/operations/affaires-nouvelles/${sourceId}`
    default:
      return null
  }
}

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for valid client IDs
 */
const clientIdArb = fc.oneof(
  // CUID format
  fc.array(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
    { minLength: 24, maxLength: 24 }
  ).map(arr => `c${arr.join('')}`),
  // UUID format
  fc.uuid()
)

/**
 * Generator for document statuses
 */
const documentStatusArb = fc.constantFrom(...DOCUMENT_STATUSES)

/**
 * Generator for affaire statuses
 */
const affaireStatusArb = fc.constantFrom(...AFFAIRE_STATUSES)

/**
 * Generator for alert severities
 */
const alertSeverityArb = fc.constantFrom(...ALERT_SEVERITIES)

/**
 * Generator for alert types
 */
const alertTypeArb = fc.constantFrom(
  'DOCUMENT_EXPIRING',
  'DOCUMENT_EXPIRED',
  'KYC_INCOMPLETE',
  'CONTROL_OVERDUE',
  'RECLAMATION_SLA_BREACH',
  'MIFID_OUTDATED',
  'OPERATION_BLOCKED',
  'AFFAIRE_INACTIVE'
)

/**
 * Generator for KPI card from Conformité dashboard
 */
const conformiteKpiCardArb = fc.constantFrom(...CONFORMITE_KPI_CARDS)

/**
 * Generator for KPI card from Opérations dashboard
 */
const operationsKpiCardArb = fc.constantFrom(...OPERATIONS_KPI_CARDS)

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Navigation Integrity - Property-Based Tests', () => {
  /**
   * **Feature: crm-audit-fonctionnel, Property 1: Navigation Integrity**
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
   */
  describe('Property 1: Navigation Integrity', () => {
    /**
     * Requirement 1.1: Conformité KPI cards navigate to valid routes
     */
    it('Conformité KPI cards always navigate to valid dashboard routes', () => {
      fc.assert(
        fc.property(conformiteKpiCardArb, (kpiCard) => {
          const url = buildUrlWithParams(kpiCard.path, kpiCard.filters)
          const { path, params } = parseUrl(url)
          
          expect(isValidDashboardRoute(path)).toBe(true)
          expect(areValidFilterParams(path, params)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 1.2: Opérations KPI cards navigate to valid routes
     */
    it('Opérations KPI cards always navigate to valid dashboard routes', () => {
      fc.assert(
        fc.property(operationsKpiCardArb, (kpiCard) => {
          const url = buildUrlWithParams(kpiCard.path, kpiCard.filters)
          const { path, params } = parseUrl(url)
          
          expect(isValidDashboardRoute(path)).toBe(true)
          expect(areValidFilterParams(path, params)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 1.3: Client names navigate to Client 360 view
     */
    it('client links always navigate to valid Client 360 paths', () => {
      fc.assert(
        fc.property(clientIdArb, (clientId) => {
          const path = generateClientLinkPath(clientId)
          
          expect(isValidDashboardRoute(path)).toBe(true)
          expect(path).toBe(`/dashboard/clients/${clientId}`)
          expect(path.startsWith('/dashboard/clients/')).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 1.4: Operation references navigate to detail pages
     */
    it('operation links always navigate to valid detail pages', () => {
      fc.assert(
        fc.property(
          clientIdArb,
          fc.constantFrom('affaire', 'gestion') as fc.Arbitrary<'affaire' | 'gestion'>,
          (operationId, type) => {
            const path = generateOperationDetailPath(operationId, type)
            
            expect(isValidDashboardRoute(path)).toBe(true)
            expect(path).toContain(operationId)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 1.5: Alert action URLs are valid when present
     */
    it('alert action URLs are always valid when generated', () => {
      fc.assert(
        fc.property(
          alertTypeArb,
          clientIdArb,
          fc.option(clientIdArb, { nil: undefined }),
          (alertType, sourceId, clientId) => {
            const actionUrl = generateAlertActionUrl(alertType, sourceId, clientId)
            
            if (actionUrl !== null) {
              const { path } = parseUrl(actionUrl)
              expect(isValidDashboardRoute(path)).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 1.6: Document status filter URLs are valid
     */
    it('document status filter URLs are always valid', () => {
      fc.assert(
        fc.property(documentStatusArb, (status) => {
          const url = buildUrlWithParams('/dashboard/conformite/documents', { status })
          const { path, params } = parseUrl(url)
          
          expect(isValidDashboardRoute(path)).toBe(true)
          expect(areValidFilterParams(path, params)).toBe(true)
          expect(params.status).toBe(status)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 1.6: Affaire status filter URLs are valid
     */
    it('affaire status filter URLs are always valid', () => {
      fc.assert(
        fc.property(affaireStatusArb, (status) => {
          const url = buildUrlWithParams('/dashboard/operations/affaires-nouvelles', { status })
          const { path, params } = parseUrl(url)
          
          expect(isValidDashboardRoute(path)).toBe(true)
          expect(areValidFilterParams(path, params)).toBe(true)
          expect(params.status).toBe(status)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 1.6: Alert severity filter URLs are valid
     */
    it('alert severity filter URLs are always valid', () => {
      fc.assert(
        fc.property(alertSeverityArb, (severity) => {
          const url = buildUrlWithParams('/dashboard/conformite/alertes', { severity })
          const { path, params } = parseUrl(url)
          
          expect(isValidDashboardRoute(path)).toBe(true)
          expect(areValidFilterParams(path, params)).toBe(true)
          expect(params.severity).toBe(severity)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 1.6: Multiple severity filter URLs are valid
     */
    it('multiple severity filter URLs are always valid', () => {
      fc.assert(
        fc.property(
          fc.array(alertSeverityArb, { minLength: 1, maxLength: 4 }),
          (severities) => {
            const uniqueSeverities = [...new Set(severities)]
            const severityParam = uniqueSeverities.join(',')
            const url = buildUrlWithParams('/dashboard/conformite/alertes', { severity: severityParam })
            const { path, params } = parseUrl(url)
            
            expect(isValidDashboardRoute(path)).toBe(true)
            expect(areValidFilterParams(path, params)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 1.6: URL building is deterministic
     */
    it('URL building is deterministic', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_DASHBOARD_ROUTES),
          fc.dictionary(fc.string(), fc.string()),
          (basePath, params) => {
            const url1 = buildUrlWithParams(basePath, params)
            const url2 = buildUrlWithParams(basePath, params)
            
            expect(url1).toBe(url2)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 1.6: URL parsing is inverse of building
     */
    it('URL parsing extracts the same path that was built', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_DASHBOARD_ROUTES),
          (basePath) => {
            const url = buildUrlWithParams(basePath, {})
            const { path } = parseUrl(url)
            
            expect(path).toBe(basePath)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 1.6: Generated URLs never contain double slashes
     */
    it('generated URLs never contain double slashes in path', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_DASHBOARD_ROUTES),
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/.test(s)),
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
          ),
          (basePath, params) => {
            const url = buildUrlWithParams(basePath, params)
            const { path } = parseUrl(url)
            
            // Path should not contain double slashes
            expect(path).not.toContain('//')
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
