# Multi-Tenant Refactoring Audit Report

**Date:** November 16, 2025  
**Task:** 4.1 Audit app/api/ directory structure

## Executive Summary

This audit identifies all API domains in the ALFI CRM system and categorizes them based on their refactoring status. The goal is to ensure all domains follow the established tenant-aware patterns with centralized validation, data formatting, and service layer architecture.

## Audit Methodology

1. Listed all directories in `app/api/`
2. Checked for existence of `utils.ts` files
3. Verified service classes exist in `lib/services/`
4. Examined route handlers for direct Prisma access
5. Checked services for proper formatting helpers (`toNumber()`, `format<Entity>()`)

## Domain Classification

### ✅ FULLY REFACTORED (Already Complete)
These domains follow all established patterns:

1. **actifs** - ✅ Complete
   - Has: `lib/services/actif-service.ts`
   - Missing: `app/api/actifs/utils.ts` (uses inline validation)
   - Status: Service has tenant isolation, uses Decimal conversion
   - Note: Could benefit from utils.ts for consistency

2. **passifs** - ✅ Complete
   - Has: `app/api/passifs/utils.ts`, `lib/services/passif-service.ts`
   - Status: Fully refactored with validation utilities

3. **contrats** - ✅ Complete
   - Has: `app/api/contrats/utils.ts`, `lib/services/contrat-service.ts`
   - Status: Fully refactored with validation utilities

4. **taches** - ✅ Complete
   - Has: `app/api/taches/utils.ts`, `lib/services/tache-service.ts`
   - Status: Fully refactored with validation utilities

5. **documents** - ✅ Complete
   - Has: `app/api/documents/utils.ts`, `lib/services/document-service.ts`
   - Status: Fully refactored with toNumber() and formatDocument() helpers

6. **projets** - ✅ Complete
   - Has: `app/api/projets/utils.ts`, `lib/services/projet-service.ts`
   - Status: Fully refactored with validation utilities

7. **opportunites** - ✅ Complete
   - Has: `app/api/opportunites/utils.ts`, `lib/services/opportunite-service.ts`
   - Status: Fully refactored with validation utilities

8. **patrimoine** - ✅ Complete
   - Has: `lib/services/patrimoine-service.ts`
   - Status: Core calculation service, no direct API routes

### ⚠️ PARTIALLY REFACTORED (Needs Utils)
These domains have services but lack utils.ts validation modules:

9. **clients** - ⚠️ Needs utils.ts
   - Has: `lib/services/client-service.ts`
   - Missing: `app/api/clients/utils.ts`
   - Route: Uses service but inline validation
   - Priority: HIGH (core domain)

10. **objectifs** - ⚠️ Needs utils.ts
    - Has: `lib/services/objectif-service.ts`
    - Missing: `app/api/objectifs/utils.ts`
    - Route: Uses service but inline validation
    - Service: Missing toNumber() and formatObjectif() helpers
    - Priority: HIGH

11. **rendez-vous** - ⚠️ Needs utils.ts
    - Has: `lib/services/rendez-vous-service.ts`
    - Missing: `app/api/rendez-vous/utils.ts`
    - Route: Uses service but inline validation
    - Service: Missing formatting helpers
    - Priority: HIGH

### ❌ NEEDS REFACTORING (Direct Prisma Access)
These domains have direct Prisma access in routes:

12. **simulations** - ❌ Needs full refactoring
    - Has: `lib/services/simulation-service.ts`
    - Missing: `app/api/simulations/utils.ts`
    - Route: Uses old `auth()` and direct Prisma access
    - Service: Missing formatting helpers
    - Priority: HIGH (used frequently)

13. **notifications** - ❌ Needs full refactoring
    - Has: `lib/services/notification-service.ts`
    - Missing: `app/api/notifications/utils.ts`
    - Route: Uses old `auth()`, returns TODO placeholders
    - Service: Incomplete implementation
    - Priority: MEDIUM

### 🔍 SPECIAL CASES (Non-Standard Domains)

14. **auth** - 🔍 Authentication domain
    - Has: `lib/services/auth-service.ts`
    - Status: Authentication logic, doesn't need tenant isolation
    - Action: No refactoring needed

15. **advisor** - 🔍 Aggregation endpoints
    - Subdirectories: alerts, appointments, clients, events, opportunities, tasks, widgets
    - Status: Aggregation/dashboard endpoints
    - Action: Review for consistency, may need utils

16. **audit** - 🔍 Audit logging
    - Has: `lib/services/audit-service.ts`
    - Subdirectories: logs, stats
    - Status: System-level logging
    - Action: Review for tenant isolation

17. **calculators** - 🔍 Calculation utilities
    - Subdirectories: budget, objectives, tax
    - Status: Stateless calculation endpoints
    - Action: Review for consistency

18. **client** - 🔍 Client portal endpoints
    - Subdirectories: dashboard, objectives, patrimoine
    - Status: Client-facing API endpoints
    - Action: Review for consistency with main APIs

19. **dashboard** - 🔍 Dashboard aggregation
    - Subdirectories: counters
    - Status: Dashboard data aggregation
    - Action: Review for consistency

20. **kyc** - 🔍 KYC management
    - Has: `lib/services/kyc-service.ts`
    - Subdirectories: expiring
    - Status: Has service, needs review
    - Action: Check for utils.ts and formatting

21. **simulators** - 🔍 Simulation calculators
    - Subdirectories: retirement, succession
    - Status: Stateless simulation endpoints
    - Action: Review for consistency

22. **superadmin** - 🔍 SuperAdmin endpoints
    - Subdirectories: organizations
    - Status: Cross-tenant admin operations
    - Action: Review for proper SuperAdmin handling

## Prioritized Refactoring List

### Priority 1: HIGH (Core Business Domains)
1. **clients** - Add utils.ts, verify service formatting
2. **objectifs** - Add utils.ts, add formatting helpers to service
3. **rendez-vous** - Add utils.ts, add formatting helpers to service
4. **simulations** - Full refactoring (route + utils + service formatting)

### Priority 2: MEDIUM (Supporting Domains)
5. **notifications** - Full refactoring (route + utils + service completion)
6. **kyc** - Add utils.ts if needed, verify service
7. **actifs** - Add utils.ts for consistency (service already good)

### Priority 3: LOW (Review for Consistency)
8. **advisor/** - Review subdirectories for consistency
9. **audit/** - Verify tenant isolation
10. **calculators/** - Review for consistency
11. **client/** - Review client portal endpoints
12. **dashboard/** - Review aggregation endpoints
13. **simulators/** - Review simulation endpoints
14. **superadmin/** - Verify SuperAdmin handling

## Detailed Findings

### Clients Domain Analysis
**File:** `app/api/clients/route.ts`
- ✅ Uses `requireAuth()` and `createSuccessResponse()`
- ✅ Uses `ClientService` with tenant isolation
- ❌ Missing `utils.ts` for validation
- ❌ Inline filter parsing in route
- **Action Required:** Create `app/api/clients/utils.ts` with:
  - `parseClientFilters()`
  - `normalizeClientCreatePayload()`
  - `normalizeClientUpdatePayload()`

**File:** `lib/services/client-service.ts`
- ✅ Uses `getPrismaClient()` for tenant isolation
- ✅ Has proper constructor with cabinetId
- ⚠️ Missing `toNumber()` helper
- ⚠️ Missing `formatClient()` helper
- **Action Required:** Add formatting helpers

### Objectifs Domain Analysis
**File:** `app/api/objectifs/route.ts`
- ✅ Uses `requireAuth()` and `createSuccessResponse()`
- ✅ Uses `ObjectifService` with tenant isolation
- ❌ Missing `utils.ts` for validation
- ❌ Inline enum casting in route
- **Action Required:** Create `app/api/objectifs/utils.ts`

**File:** `lib/services/objectif-service.ts`
- ✅ Uses `getPrismaClient()` for tenant isolation
- ✅ Converts numbers to Decimal on create
- ❌ Missing `toNumber()` helper
- ❌ Missing `formatObjectif()` helper
- ❌ Returns raw Prisma objects
- **Action Required:** Add formatting helpers, ensure all methods return formatted objects

### Rendez-Vous Domain Analysis
**File:** `app/api/rendez-vous/route.ts`
- ✅ Uses `requireAuth()` and `createSuccessResponse()`
- ✅ Uses `RendezVousService` with tenant isolation
- ❌ Missing `utils.ts` for validation
- ❌ Inline enum casting and date parsing
- **Action Required:** Create `app/api/rendez-vous/utils.ts`

**File:** `lib/services/rendez-vous-service.ts`
- ✅ Uses `getPrismaClient()` for tenant isolation
- ✅ Validates relationships before creation
- ❌ Missing `toNumber()` helper (if any Decimal fields)
- ❌ Missing `formatRendezVous()` helper
- **Action Required:** Add formatting helpers

### Simulations Domain Analysis
**File:** `app/api/simulations/route.ts`
- ❌ Uses old `auth()` instead of `requireAuth()`
- ❌ Uses direct Prisma access instead of service
- ❌ Uses `NextResponse.json()` instead of `createSuccessResponse()`
- ❌ Missing `utils.ts` for validation
- **Action Required:** Complete refactoring of route handlers

**File:** `lib/services/simulation-service.ts`
- ✅ Uses `getPrismaClient()` for tenant isolation
- ✅ Validates client relationship
- ❌ Missing `toNumber()` helper (for feasibilityScore if Decimal)
- ❌ Missing `formatSimulation()` helper
- ❌ Returns raw Prisma objects
- **Action Required:** Add formatting helpers, ensure all methods return formatted objects

### Notifications Domain Analysis
**File:** `app/api/notifications/route.ts`
- ❌ Uses old `auth()` instead of `requireAuth()`
- ❌ Returns TODO placeholders instead of real data
- ❌ Uses `NextResponse.json()` instead of `createSuccessResponse()`
- ❌ Missing `utils.ts` for validation
- **Action Required:** Complete implementation of route handlers

**File:** `lib/services/notification-service.ts`
- ✅ Uses `getPrismaClient()` for tenant isolation
- ⚠️ Incomplete implementation (truncated in file)
- ❌ Missing `toNumber()` helper
- ❌ Missing `formatNotification()` helper
- **Action Required:** Complete service implementation, add formatting helpers

## Patterns to Apply

### 1. Utils Module Pattern
Each domain needs `app/api/<domain>/utils.ts` with:

```typescript
/**
 * Validation utilities for <domain> API routes
 */

// Helper functions
function ensureString(value: unknown, field: string, required = false): string | undefined
function ensureNumber(value: unknown, field: string, required = false): number | undefined
function ensureDate(value: unknown, field: string, required = false): Date | undefined
function ensureEnumValue<T>(value: unknown, field: string, allowed: Set<string>, required = false): T | undefined

// Main validation functions
export function parse<Domain>Filters(searchParams: URLSearchParams): <Domain>Filters
export function normalize<Domain>CreatePayload(body: unknown): Create<Domain>Payload
export function normalize<Domain>UpdatePayload(body: unknown): Update<Domain>Payload
```

### 2. Service Formatting Pattern
Each service needs:

```typescript
export class <Domain>Service {
  private prisma
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Converts Decimal or numeric values to JavaScript number
   */
  private toNumber(value: any): number | null {
    if (value === null || value === undefined) {
      return null
    }
    if (typeof value === 'object' && typeof value?.toNumber === 'function') {
      return value.toNumber()
    }
    return value
  }

  /**
   * Formats entity with nested relations
   */
  private format<Entity>(entity: any): any {
    if (!entity) {
      return null
    }
    return {
      ...entity,
      // Convert Decimal fields
      numericField: this.toNumber(entity.numericField),
      // Format nested relations
      relatedEntity: entity.relatedEntity ? this.formatRelatedEntity(entity.relatedEntity) : null,
    }
  }

  // All public methods should return formatted entities
  async get<Entity>ById(id: string) {
    const entity = await this.prisma.<entity>.findFirst({ /* ... */ })
    return this.format<Entity>(entity)
  }
}
```

### 3. Route Handler Pattern
Each route should:

```typescript
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const filters = parse<Domain>Filters(searchParams)

    const service = new <Domain>Service(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const entities = await service.list<Entities>(filters)
    return createSuccessResponse(entities)
  } catch (error: any) {
    // Error handling
  }
}
```

## Recommendations

### Immediate Actions (Task 4.1 Complete)
1. ✅ Document all domains and their status
2. ✅ Create prioritized refactoring list
3. ✅ Identify specific gaps in each domain

### Next Steps (Tasks 4.2-4.7)
1. **Task 4.2:** Refactor clients domain
   - Create utils.ts
   - Add formatting helpers to service
   - Update route handlers

2. **Task 4.3:** Refactor objectifs domain
   - Create utils.ts
   - Add formatting helpers to service
   - Update route handlers

3. **Task 4.4:** Refactor simulations domain
   - Create utils.ts
   - Add formatting helpers to service
   - Completely refactor route handlers

4. **Task 4.5:** Refactor notifications domain
   - Create utils.ts
   - Complete service implementation
   - Implement route handlers

5. **Task 4.6:** Refactor rendez-vous domain
   - Create utils.ts
   - Add formatting helpers to service
   - Update route handlers

6. **Task 4.7:** Review remaining domains
   - Audit special case domains
   - Ensure consistency across all endpoints
   - Document any domain-specific considerations

## Success Metrics

- ✅ All core business domains have utils.ts files
- ✅ All services use toNumber() and format<Entity>() helpers
- ✅ All routes use requireAuth() and createSuccessResponse()
- ✅ No direct Prisma access in route handlers
- ✅ Consistent validation and error handling across all domains
- ✅ All Decimal fields properly converted to numbers in responses

## Conclusion

The audit has identified **5 domains requiring refactoring**:
- **clients** (utils.ts + formatting)
- **objectifs** (utils.ts + formatting)
- **rendez-vous** (utils.ts + formatting)
- **simulations** (full refactoring)
- **notifications** (full refactoring)

Additionally, **7 domains** (actifs, passifs, contrats, taches, documents, projets, opportunites) are already fully refactored and serve as reference implementations.

The remaining domains are either special cases (auth, superadmin) or aggregation endpoints that need review for consistency but may not require full refactoring.

---

**Audit Completed:** November 16, 2025  
**Next Task:** 4.2 - Refactor clients domain
