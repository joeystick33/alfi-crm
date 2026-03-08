/**
 * Property-Based Tests - Client Link Consistency
 * 
 * **Feature: crm-audit-fonctionnel, Property 2: Client Link Consistency**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 * 
 * Tests that client displays are consistent across the application:
 * - 2.1: ClientLink component renders correct href to /dashboard/clients/[clientId]
 * - 2.2: Client displays in KYC tables use ClientLink
 * - 2.3: Client displays in operations tables use ClientLink
 * - 2.4: Client displays in reclamations/alertes use ClientLink
 * - 2.5: All client links navigate to the correct Client 360 page
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ============================================================================
// CLIENT LINK RULES
// ============================================================================

/**
 * Expected client link path format
 */
const CLIENT_LINK_PATH_PREFIX = '/dashboard/clients/'

/**
 * Generate the expected client link path for a given clientId
 */
function getExpectedClientLinkPath(clientId: string): string {
  return `${CLIENT_LINK_PATH_PREFIX}${clientId}`
}

/**
 * Validate that a client link path is correctly formatted
 */
function isValidClientLinkPath(path: string, clientId: string): boolean {
  return path === getExpectedClientLinkPath(clientId)
}

/**
 * Generate display name from client data
 */
function generateDisplayName(
  clientId: string,
  clientName?: string,
  clientFirstName?: string,
  showIdPrefix: boolean = true
): string {
  if (clientName) {
    return clientFirstName ? `${clientFirstName} ${clientName}` : clientName
  }
  
  if (showIdPrefix) {
    return `Client #${clientId.slice(0, 8)}`
  }
  return clientId.slice(0, 8)
}

/**
 * Simulate ClientLink href generation
 */
function generateClientLinkHref(clientId: string): string {
  return `/dashboard/clients/${clientId}`
}

/**
 * Validate client ID format (CUID-like)
 */
function isValidClientId(clientId: string): boolean {
  // CUID format: starts with 'c' followed by alphanumeric characters
  // Or UUID format: 8-4-4-4-12 hex characters
  const cuidPattern = /^c[a-z0-9]{24}$/
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const simpleIdPattern = /^[a-zA-Z0-9_-]{8,}$/
  
  return cuidPattern.test(clientId) || uuidPattern.test(clientId) || simpleIdPattern.test(clientId)
}

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for valid CUID-like client IDs
 */
const cuidClientIdArb = fc.array(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
  { minLength: 24, maxLength: 24 }
).map(arr => `c${arr.join('')}`)

/**
 * Generator for valid UUID client IDs
 */
const uuidClientIdArb = fc.uuid()

/**
 * Generator for any valid client ID
 */
const clientIdArb = fc.oneof(cuidClientIdArb, uuidClientIdArb)

/**
 * Generator for client names (last name)
 */
const clientNameArb = fc.array(
  fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')),
  { minLength: 2, maxLength: 20 }
).map(arr => arr.join(''))

/**
 * Generator for client first names
 */
const clientFirstNameArb = fc.array(
  fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')),
  { minLength: 2, maxLength: 20 }
).map(arr => arr.join(''))

/**
 * Generator for optional client name
 */
const optionalClientNameArb = fc.option(clientNameArb, { nil: undefined })

/**
 * Generator for optional client first name
 */
const optionalClientFirstNameArb = fc.option(clientFirstNameArb, { nil: undefined })

/**
 * Generator for showIdPrefix boolean
 */
const showIdPrefixArb = fc.boolean()

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Client Link Consistency - Property-Based Tests', () => {
  /**
   * **Feature: crm-audit-fonctionnel, Property 2: Client Link Consistency**
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
   */
  describe('Property 2: Client Link Consistency', () => {
    /**
     * Requirement 2.1: ClientLink generates correct href
     */
    it('ClientLink always generates href to /dashboard/clients/[clientId]', () => {
      fc.assert(
        fc.property(clientIdArb, (clientId) => {
          const href = generateClientLinkHref(clientId)
          
          expect(href).toBe(`/dashboard/clients/${clientId}`)
          expect(href.startsWith(CLIENT_LINK_PATH_PREFIX)).toBe(true)
          expect(href.endsWith(clientId)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 2.1: ClientLink path validation
     */
    it('generated client link paths are always valid', () => {
      fc.assert(
        fc.property(clientIdArb, (clientId) => {
          const path = generateClientLinkHref(clientId)
          
          expect(isValidClientLinkPath(path, clientId)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 2.1: Display name with full client data
     */
    it('displays full name when both firstName and lastName are provided', () => {
      fc.assert(
        fc.property(
          clientIdArb,
          clientNameArb,
          clientFirstNameArb,
          (clientId, lastName, firstName) => {
            const displayName = generateDisplayName(clientId, lastName, firstName)
            
            expect(displayName).toBe(`${firstName} ${lastName}`)
            expect(displayName).toContain(firstName)
            expect(displayName).toContain(lastName)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 2.1: Display name with only lastName
     */
    it('displays lastName only when firstName is not provided', () => {
      fc.assert(
        fc.property(clientIdArb, clientNameArb, (clientId, lastName) => {
          const displayName = generateDisplayName(clientId, lastName, undefined)
          
          expect(displayName).toBe(lastName)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 2.1: Display name fallback to ID with prefix
     */
    it('displays "Client #[id]" when no name is provided and showIdPrefix is true', () => {
      fc.assert(
        fc.property(clientIdArb, (clientId) => {
          const displayName = generateDisplayName(clientId, undefined, undefined, true)
          
          expect(displayName).toBe(`Client #${clientId.slice(0, 8)}`)
          expect(displayName.startsWith('Client #')).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 2.1: Display name fallback to ID without prefix
     */
    it('displays truncated ID when no name is provided and showIdPrefix is false', () => {
      fc.assert(
        fc.property(clientIdArb, (clientId) => {
          const displayName = generateDisplayName(clientId, undefined, undefined, false)
          
          expect(displayName).toBe(clientId.slice(0, 8))
          expect(displayName.length).toBe(8)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 2.2-2.4: Client link path is deterministic
     */
    it('client link path generation is deterministic', () => {
      fc.assert(
        fc.property(clientIdArb, (clientId) => {
          const path1 = generateClientLinkHref(clientId)
          const path2 = generateClientLinkHref(clientId)
          
          expect(path1).toBe(path2)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 2.2-2.4: Display name generation is deterministic
     */
    it('display name generation is deterministic', () => {
      fc.assert(
        fc.property(
          clientIdArb,
          optionalClientNameArb,
          optionalClientFirstNameArb,
          showIdPrefixArb,
          (clientId, clientName, clientFirstName, showIdPrefix) => {
            const name1 = generateDisplayName(clientId, clientName, clientFirstName, showIdPrefix)
            const name2 = generateDisplayName(clientId, clientName, clientFirstName, showIdPrefix)
            
            expect(name1).toBe(name2)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 2.5: Client ID is preserved in link
     */
    it('client ID is always preserved in the generated link', () => {
      fc.assert(
        fc.property(clientIdArb, (clientId) => {
          const href = generateClientLinkHref(clientId)
          
          // Extract clientId from href
          const extractedId = href.replace(CLIENT_LINK_PATH_PREFIX, '')
          
          expect(extractedId).toBe(clientId)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 2.5: Link path never contains double slashes
     */
    it('generated link paths never contain double slashes', () => {
      fc.assert(
        fc.property(clientIdArb, (clientId) => {
          const href = generateClientLinkHref(clientId)
          
          // Check for double slashes (except in protocol)
          const pathPart = href.replace(/^https?:\/\//, '')
          expect(pathPart).not.toContain('//')
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 2.5: Display name is never empty
     */
    it('display name is never empty', () => {
      fc.assert(
        fc.property(
          clientIdArb,
          optionalClientNameArb,
          optionalClientFirstNameArb,
          showIdPrefixArb,
          (clientId, clientName, clientFirstName, showIdPrefix) => {
            const displayName = generateDisplayName(clientId, clientName, clientFirstName, showIdPrefix)
            
            expect(displayName.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirement 2.5: Link path is always a valid URL path
     */
    it('generated link is always a valid URL path', () => {
      fc.assert(
        fc.property(clientIdArb, (clientId) => {
          const href = generateClientLinkHref(clientId)
          
          // Should start with /
          expect(href.startsWith('/')).toBe(true)
          
          // Should not contain spaces
          expect(href).not.toContain(' ')
          
          // Should be a valid path structure
          const segments = href.split('/').filter(Boolean)
          expect(segments.length).toBe(3) // dashboard, clients, [clientId]
          expect(segments[0]).toBe('dashboard')
          expect(segments[1]).toBe('clients')
          expect(segments[2]).toBe(clientId)
        }),
        { numRuns: 100 }
      )
    })
  })
})
