# Design Document

## Overview

This design document outlines the architecture and implementation approach for completing the multi-tenant refactoring of the ALFI CRM system. The refactoring will extend proven patterns from already-completed domains (actifs, passifs, contrats, tâches, patrimoine) to all remaining domains including documents, projets, opportunités, and others.

The design follows a three-layer architecture:
1. **API Layer** (app/api/): Request validation, authentication, and response formatting
2. **Service Layer** (lib/services/): Business logic with tenant isolation
3. **Data Layer**: Prisma ORM with tenant-aware client instantiation

## Architecture

### Tenant Isolation Pattern

All database access must flow through tenant-aware service instances that enforce cabinet-level data isolation:

```typescript
// Service instantiation pattern
const service = new DomainService(
  cabinetId,      // Tenant identifier
  userId,         // Current user ID
  userRole,       // User role (optional, for permissions)
  isSuperAdmin    // SuperAdmin bypass flag
)

// Internal Prisma client instantiation
this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
```

The `getPrismaClient()` function returns a Prisma client instance that automatically filters all queries by `cabinetId` unless the user is a SuperAdmin with explicit cross-cabinet access.

### Request Flow

```
HTTP Request
    ↓
API Route Handler (app/api/<domain>/route.ts)
    ↓
requireAuth() → Extract user context
    ↓
Parse & Validate Input (utils.ts)
    ↓
Instantiate Service (tenant-aware)
    ↓
Execute Business Logic
    ↓
Format Response (service formatters)
    ↓
createSuccessResponse() → Return JSON
```

### Data Formatting Pattern

All services must convert Prisma's raw data types to JavaScript-native types:

- **Decimal → number**: All monetary and numeric Decimal fields
- **Date → ISO string**: All date fields (handled by JSON serialization)
- **Nested relations**: Recursively format related entities
- **Remove metadata**: Strip Prisma internal fields

## Components and Interfaces

### 1. Validation Utilities (app/api/<domain>/utils.ts)

Each domain requires a dedicated utils module with three core functions:

#### parseFilters()
Parses and validates URLSearchParams for GET requests.

```typescript
export function parse<Domain>Filters(searchParams: URLSearchParams): <Domain>Filters {
  // Extract and validate query parameters
  // Convert strings to appropriate types (number, Date, enum, boolean)
  // Return typed filter object
}
```

**Responsibilities:**
- Extract query parameters from URLSearchParams
- Validate enum values against Prisma-generated types
- Convert string parameters to numbers, dates, booleans
- Handle optional vs required parameters
- Return strongly-typed filter object

#### normalizeCreatePayload()
Validates and normalizes POST request bodies.

```typescript
export function normalize<Domain>CreatePayload(body: unknown): Create<Domain>Payload {
  // Validate required fields
  // Type-check and convert values
  // Validate enum values
  // Return typed payload
}
```

**Responsibilities:**
- Validate payload structure
- Ensure required fields are present
- Type-check all fields
- Validate enum values
- Convert date strings to Date objects
- Sanitize string inputs (trim whitespace)
- Throw descriptive errors for invalid data

#### normalizeUpdatePayload()
Validates and normalizes PATCH request bodies.

```typescript
export function normalize<Domain>UpdatePayload(body: unknown): Update<Domain>Payload {
  // Validate partial update structure
  // Only include provided fields
  // Validate types and enums
  // Return typed partial payload
}
```

**Responsibilities:**
- Handle partial updates (all fields optional)
- Validate only provided fields
- Maintain type safety
- Support explicit null/undefined values
- Throw error if no valid fields provided

#### Helper Functions

Each utils module should include reusable helper functions:

```typescript
// String validation
function ensureString(value: unknown, field: string, required = false): string | undefined

// Number validation and conversion
function ensureNumber(value: unknown, field: string, required = false): number | undefined

// Date validation and conversion
function ensureDate(value: unknown, field: string, required = false): Date | undefined

// Enum validation
function ensureEnumValue<T extends string>(
  value: unknown,
  field: string,
  allowed: Set<string>,
  required = false
): T | undefined

// Boolean parsing
function parseBoolean(param: string | null): boolean | undefined
```

### 2. Service Layer (lib/services/<domain>-service.ts)

Each service class encapsulates business logic for a domain with tenant isolation.

#### Service Structure

```typescript
export class <Domain>Service {
  private prisma
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private userRole?: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  // Formatting helpers
  private toNumber(value: any): number | null
  private format<Entity>(entity: any): Formatted<Entity>

  // CRUD operations
  async create<Entity>(data: Create<Entity>Input): Promise<Formatted<Entity>>
  async get<Entity>ById(id: string): Promise<Formatted<Entity> | null>
  async list<Entities>(filters?: Filters): Promise<Formatted<Entity>[]>
  async update<Entity>(id: string, data: Update<Entity>Input): Promise<Formatted<Entity>>
  async delete<Entity>(id: string): Promise<{ success: boolean }>

  // Domain-specific operations
  // ...
}
```

#### toNumber() Helper

Converts Prisma Decimal fields to JavaScript numbers:

```typescript
private toNumber(value: any): number | null {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'object' && typeof value?.toNumber === 'function') {
    return value.toNumber()
  }

  return value
}
```

#### Format Helpers

Each entity type requires a dedicated formatter:

```typescript
private format<Entity>(entity: any): Formatted<Entity> | null {
  if (!entity) {
    return null
  }

  return {
    ...entity,
    // Convert Decimal fields
    numericField: this.toNumber(entity.numericField),
    amount: this.toNumber(entity.amount),
    
    // Format nested relations recursively
    relatedEntity: entity.relatedEntity 
      ? this.formatRelatedEntity(entity.relatedEntity)
      : null,
    
    // Format arrays
    items: entity.items?.map(item => this.formatItem(item)) ?? [],
  }
}
```

#### Relationship Validation

Before creating or updating entities, validate that related entities exist:

```typescript
async create<Entity>(data: Create<Entity>Input) {
  // Validate client exists
  if (data.clientId) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: data.clientId,
        cabinetId: this.cabinetId,
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }
  }

  // Create entity
  const entity = await this.prisma.<entity>.create({
    data: {
      cabinetId: this.cabinetId,
      ...data,
      // Convert numbers to Decimal
      amount: new Decimal(data.amount),
    },
  })

  // Return formatted entity
  return this.get<Entity>ById(entity.id)
}
```

#### Update Pattern

Always fetch and return the formatted entity after updates:

```typescript
async update<Entity>(id: string, data: Update<Entity>Input) {
  // Validate relationships if provided
  // ...

  // Prepare update data with Decimal conversions
  const updateData: any = { ...data }
  if (data.amount !== undefined) {
    updateData.amount = new Decimal(data.amount)
  }

  // Update with tenant isolation
  const { count } = await this.prisma.<entity>.updateMany({
    where: {
      id,
      cabinetId: this.cabinetId,
    },
    data: updateData,
  })

  if (count === 0) {
    throw new Error('<Entity> not found or access denied')
  }

  // Return formatted entity
  return this.get<Entity>ById(id)
}
```

### 3. API Route Handlers (app/api/<domain>/route.ts)

API routes handle HTTP requests, authentication, and response formatting.

#### GET Handler Pattern

```typescript
export async function GET(request: NextRequest) {
  try {
    // Authenticate and extract context
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse and validate filters
    const { searchParams } = new URL(request.url)
    const filters = parse<Domain>Filters(searchParams)

    // Instantiate service
    const service = new <Domain>Service(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    // Execute query
    const entities = await service.list<Entities>(filters)

    // Return formatted response
    return createSuccessResponse(entities)
  } catch (error: any) {
    console.error('Error in GET /api/<domain>:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
```

#### POST Handler Pattern

```typescript
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse and validate payload
    const body = await request.json()
    const payload = normalize<Domain>CreatePayload(body)

    // Instantiate service
    const service = new <Domain>Service(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    // Create entity
    const entity = await service.create<Entity>(payload)

    // Return formatted response with 201 status
    return createSuccessResponse(entity, 201)
  } catch (error: any) {
    console.error('Error in POST /api/<domain>:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
```

#### PATCH Handler Pattern

```typescript
export async function PATCH(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Extract ID from URL
    const { pathname } = new URL(request.url)
    const id = pathname.split('/').pop()

    if (!id) {
      return createErrorResponse('Missing entity ID', 400)
    }

    // Parse and validate payload
    const body = await request.json()
    const payload = normalize<Domain>UpdatePayload(body)

    // Instantiate service
    const service = new <Domain>Service(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    // Update entity
    const entity = await service.update<Entity>(id, payload)

    // Return formatted response
    return createSuccessResponse(entity)
  } catch (error: any) {
    console.error('Error in PATCH /api/<domain>:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
```

#### DELETE Handler Pattern

```typescript
export async function DELETE(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Extract ID from URL
    const { pathname } = new URL(request.url)
    const id = pathname.split('/').pop()

    if (!id) {
      return createErrorResponse('Missing entity ID', 400)
    }

    // Instantiate service
    const service = new <Domain>Service(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    // Delete entity
    await service.delete<Entity>(id)

    // Return success response
    return createSuccessResponse({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/<domain>:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
```

## Data Models

### Documents Domain

**Entities:**
- Document: Core document entity
- DocumentType: Enum (CONTRACT, INVOICE, REPORT, KYC, TAX, OTHER)
- DocumentCategory: Enum (CLIENT, PROJET, TACHE, ACTIF, PASSIF, CONTRAT)
- SignatureStatus: Enum (PENDING, SIGNED, REJECTED)

**Key Fields:**
- name: string
- type: DocumentType
- category: DocumentCategory
- fileUrl: string
- fileSize: number (Decimal → number)
- mimeType: string
- uploadedBy: User relation
- signatureStatus: SignatureStatus
- signedAt: Date
- clientId, projetId, tacheId: Optional relations

**Validation Rules:**
- name is required
- type must be valid DocumentType
- fileUrl is required
- fileSize must be positive number
- Validate related entity exists before creation

### Projets Domain

**Entities:**
- Projet: Core project entity
- ProjetType: Enum (INVESTMENT, REAL_ESTATE, RETIREMENT, SUCCESSION, TAX_OPTIMIZATION, OTHER)
- ProjetStatus: Enum (DRAFT, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD)

**Key Fields:**
- name: string
- type: ProjetType
- status: ProjetStatus
- description: string
- clientId: Client relation (required)
- estimatedBudget: number (Decimal → number)
- actualBudget: number (Decimal → number)
- startDate: Date
- endDate: Date
- completionPercentage: number

**Validation Rules:**
- name is required
- type must be valid ProjetType
- status must be valid ProjetStatus
- clientId must reference existing client
- estimatedBudget and actualBudget must be non-negative
- startDate must be before endDate
- completionPercentage must be 0-100

### Opportunités Domain

**Entities:**
- Opportunite: Core opportunity entity
- OpportuniteType: Enum (INVESTMENT, INSURANCE, LOAN, TAX_OPTIMIZATION, SUCCESSION, OTHER)
- OpportuniteStatus: Enum (IDENTIFIED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST, ABANDONED)
- OpportunitePriority: Enum (LOW, MEDIUM, HIGH, URGENT)

**Key Fields:**
- title: string
- type: OpportuniteType
- status: OpportuniteStatus
- priority: OpportunitePriority
- clientId: Client relation (required)
- estimatedValue: number (Decimal → number)
- probability: number (0-100)
- expectedCloseDate: Date
- convertedToProjetId: Projet relation (optional)
- notes: string

**Validation Rules:**
- title is required
- type must be valid OpportuniteType
- status must be valid OpportuniteStatus
- priority must be valid OpportunitePriority
- clientId must reference existing client
- estimatedValue must be non-negative
- probability must be 0-100
- When converting to projet, validate projet exists

## Error Handling

### Validation Errors

All validation errors should throw descriptive Error instances:

```typescript
throw new Error('Missing field: <fieldName>')
throw new Error('Invalid value for field: <fieldName>')
throw new Error('Invalid <enumType> for field: <fieldName>')
throw new Error('Invalid date for field: <fieldName>')
```

### Service Errors

Service methods should throw errors for business logic violations:

```typescript
throw new Error('<Entity> not found')
throw new Error('<RelatedEntity> not found')
throw new Error('<Entity> not found or access denied')
throw new Error('Cannot <action>: <reason>')
```

### API Error Responses

API routes should catch errors and return appropriate HTTP responses:

```typescript
// 400 Bad Request - Validation errors
return createErrorResponse(error.message, 400)

// 401 Unauthorized - Authentication failures
return createErrorResponse('Unauthorized', 401)

// 403 Forbidden - Permission denied
return createErrorResponse('Access denied', 403)

// 404 Not Found - Entity not found
return createErrorResponse('<Entity> not found', 404)

// 500 Internal Server Error - Unexpected errors
return createErrorResponse('Internal server error', 500)
```

## Testing Strategy

### Unit Testing

Each service should have unit tests covering:

1. **CRUD Operations**
   - Create entity with valid data
   - Create entity with invalid data (should throw)
   - Get entity by ID
   - Get non-existent entity (should return null)
   - List entities with filters
   - Update entity with valid data
   - Update entity with invalid data (should throw)
   - Delete entity

2. **Tenant Isolation**
   - Verify entities are scoped to cabinetId
   - Verify cross-cabinet access is blocked for regular users
   - Verify SuperAdmin can access cross-cabinet data

3. **Data Formatting**
   - Verify Decimal fields are converted to numbers
   - Verify nested relations are formatted
   - Verify null/undefined handling

4. **Relationship Validation**
   - Verify related entities are validated before creation
   - Verify appropriate errors for missing relations

### Integration Testing

API routes should have integration tests covering:

1. **Authentication**
   - Verify requireAuth() blocks unauthenticated requests
   - Verify user context is correctly extracted

2. **Request Validation**
   - Verify valid requests succeed
   - Verify invalid requests return 400 errors
   - Verify missing required fields return 400 errors
   - Verify invalid enum values return 400 errors

3. **Response Format**
   - Verify successful responses use createSuccessResponse()
   - Verify error responses use createErrorResponse()
   - Verify correct HTTP status codes

4. **End-to-End Flows**
   - Create → Get → Update → Delete
   - List with various filter combinations
   - Verify tenant isolation in multi-tenant scenarios

### Manual Testing

For each refactored domain:

1. **GET Requests**
   ```bash
   # List all entities
   curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/<domain>
   
   # List with filters
   curl -H "Authorization: Bearer <token>" \
     "http://localhost:3000/api/<domain>?type=<TYPE>&status=<STATUS>"
   ```

2. **POST Requests**
   ```bash
   curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"field": "value", ...}' \
     http://localhost:3000/api/<domain>
   ```

3. **PATCH Requests**
   ```bash
   curl -X PATCH \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"field": "newValue"}' \
     http://localhost:3000/api/<domain>/<id>
   ```

4. **DELETE Requests**
   ```bash
   curl -X DELETE \
     -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/<domain>/<id>
   ```

## Cross-Cutting Concerns

### Patrimoine Recalculation

When entities that affect client wealth are modified, trigger patrimoine recalculation:

```typescript
// After creating/updating/deleting actif, passif, or contrat
if (entity.clientId) {
  const patrimoineService = new PatrimoineService(
    this.cabinetId,
    this.userId,
    this.userRole,
    this.isSuperAdmin
  )
  
  await patrimoineService.calculateAndUpdateClientWealth(entity.clientId)
}
```

**Triggers:**
- Actif: create, update value, delete, change ownership
- Passif: create, update remaining amount, delete
- Contrat: create, update value, delete
- Projet: create/update if estimatedBudget or actualBudget changes
- Opportunite: convert to projet

### Timeline Events

Create timeline events for significant actions:

```typescript
await this.prisma.timelineEvent.create({
  data: {
    cabinetId: this.cabinetId,
    clientId: entity.clientId,
    type: '<EVENT_TYPE>',
    title: '<Event Title>',
    description: '<Event Description>',
    relatedEntityType: '<EntityType>',
    relatedEntityId: entity.id,
    createdBy: this.userId,
  },
})
```

**Event Types:**
- ASSET_ADDED: Actif created
- ASSET_REMOVED: Actif deleted
- CONTRACT_SIGNED: Contrat created
- DOCUMENT_UPLOADED: Document uploaded
- DOCUMENT_SIGNED: Document signed
- OTHER: Generic events

### Permission Validation

For sensitive operations, validate user permissions:

```typescript
import { hasPermission } from '@/lib/permissions'

// Check permission before operation
if (!hasPermission(context.user, 'documents:upload')) {
  throw new Error('Permission denied: documents:upload')
}
```

**Permission Checks:**
- documents:upload - Upload documents
- documents:sign - Sign documents
- documents:delete - Delete documents
- projets:create - Create projects
- projets:delete - Delete projects
- opportunites:convert - Convert opportunities to projects

## Implementation Phases

### Phase 1: Documents Domain
1. Create app/api/documents/utils.ts
2. Refactor DocumentService (if exists) or create new service
3. Update all document API routes
4. Add timeline events for document actions
5. Test manually and with automated tests

### Phase 2: Projets Domain
1. Create app/api/projets/utils.ts
2. Refactor ProjetService
3. Update all projet API routes
4. Integrate patrimoine recalculation for budget changes
5. Add timeline events
6. Test manually and with automated tests

### Phase 3: Opportunités Domain
1. Create app/api/opportunites/utils.ts
2. Refactor OpportuniteService
3. Update all opportunité API routes
4. Implement conversion to projet with validation
5. Add timeline events for status changes
6. Test manually and with automated tests

### Phase 4: Additional Domains Audit
1. Audit all app/api/ directories
2. Identify domains with direct Prisma access
3. For each identified domain:
   - Create utils.ts
   - Refactor or create service
   - Update API routes
   - Add tests
4. Verify all sub-routes follow patterns

### Phase 5: Testing and Validation
1. Run npm run lint on all modified files
2. Execute automated test suites
3. Perform manual testing with curl/HTTPie
4. Verify tenant isolation
5. Verify patrimoine recalculation
6. Verify timeline events
7. Document any issues or limitations

## Performance Considerations

### Database Query Optimization

1. **Use select to limit fields**
   ```typescript
   await this.prisma.entity.findMany({
     select: {
       id: true,
       name: true,
       // Only select needed fields
     },
   })
   ```

2. **Use include judiciously**
   - Only include relations when needed
   - Avoid deep nesting (max 2-3 levels)

3. **Batch operations**
   - Use Promise.all() for parallel queries
   - Use transactions for related operations

### Caching Strategy

Consider implementing caching for:
- Frequently accessed entities (clients, users)
- Enum values and lookup tables
- Calculated patrimoine data

### Pagination

For list endpoints with large datasets:

```typescript
async list<Entities>(filters?: Filters, pagination?: {
  page: number
  pageSize: number
}) {
  const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0
  const take = pagination?.pageSize ?? 100

  const [entities, total] = await Promise.all([
    this.prisma.entity.findMany({
      where: { /* filters */ },
      skip,
      take,
    }),
    this.prisma.entity.count({
      where: { /* filters */ },
    }),
  ])

  return {
    data: entities.map(e => this.formatEntity(e)),
    pagination: {
      page: pagination?.page ?? 1,
      pageSize: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  }
}
```

## Security Considerations

### Input Sanitization

- Trim all string inputs
- Validate all enum values against allowed sets
- Reject payloads with unexpected fields
- Validate numeric ranges (non-negative amounts, percentages 0-100)

### SQL Injection Prevention

- Never use raw SQL queries
- Always use Prisma's query builder
- Validate all input before passing to Prisma

### Authorization

- Always use requireAuth() in API routes
- Verify user type with isRegularUser()
- Check permissions for sensitive operations
- Enforce tenant isolation through services

### Data Exposure

- Never return raw Prisma objects
- Always use format helpers to control exposed fields
- Remove sensitive fields (passwords, tokens)
- Respect user permissions when returning data

## Migration Strategy

### Backward Compatibility

During refactoring:
1. Keep existing API contracts unchanged
2. Maintain response structure
3. Support existing query parameters
4. Preserve error message formats

### Rollout Plan

1. **Development**: Implement and test each domain
2. **Staging**: Deploy to staging environment for integration testing
3. **Production**: Gradual rollout with monitoring
4. **Monitoring**: Track error rates, response times, tenant isolation

### Rollback Plan

If issues arise:
1. Revert to previous service implementation
2. Keep API routes unchanged (they're stateless)
3. Monitor for data consistency issues
4. Fix and redeploy

## Documentation Requirements

### Code Documentation

Each file should include:

```typescript
/**
 * <Domain> Service
 * 
 * Manages <domain> entities with tenant isolation.
 * Provides CRUD operations and domain-specific business logic.
 * 
 * @example
 * const service = new <Domain>Service(cabinetId, userId, userRole, isSuperAdmin)
 * const entity = await service.create<Entity>(data)
 */
```

### Utils Documentation

```typescript
/**
 * Validation utilities for <domain> API routes
 * 
 * Provides functions to parse query parameters and normalize request payloads.
 * All functions throw descriptive errors for invalid input.
 */
```

### API Documentation

Update API documentation with:
- Endpoint URLs
- Request/response schemas
- Query parameters
- Error codes and messages
- Example requests

## Success Criteria

The refactoring is complete when:

1. ✅ All domains have utils.ts with validation functions
2. ✅ All services use tenant-aware Prisma clients
3. ✅ All services have format helpers with Decimal conversion
4. ✅ All API routes use validation utilities
5. ✅ All API routes return formatted responses
6. ✅ No direct Prisma access in API routes
7. ✅ Patrimoine recalculation triggers are in place
8. ✅ Timeline events are created for significant actions
9. ✅ Permission checks are implemented for sensitive operations
10. ✅ All tests pass (unit and integration)
11. ✅ Manual testing confirms functionality
12. ✅ npm run lint passes without errors
13. ✅ Documentation is updated
14. ✅ Code review is complete
