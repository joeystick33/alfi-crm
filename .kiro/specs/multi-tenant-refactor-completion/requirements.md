# Requirements Document

## Introduction

This specification defines the requirements for completing the multi-tenant refactoring of the ALFI CRM system. The refactoring has already been successfully applied to the actifs, passifs, contrats, tâches, and patrimoine domains. This phase will extend the same architectural patterns and standards to all remaining domains (documents, projets, opportunités, and others) to ensure complete tenant isolation, consistent data formatting, and centralized validation across the entire application.

## Glossary

- **System**: The ALFI CRM multi-tenant application
- **Cabinet**: A tenant organization in the multi-tenant system
- **Tenant-Aware Service**: A service class that enforces cabinet isolation through getPrismaClient(cabinetId, isSuperAdmin)
- **Domain**: A functional area of the CRM (e.g., documents, projets, opportunités)
- **API Route**: Next.js API endpoint in app/api/
- **Service Layer**: Business logic layer in lib/services/
- **Utils Module**: Validation and normalization utilities in app/api/<domain>/utils.ts
- **Format Helper**: A function that converts Prisma raw data to clean API responses
- **Decimal Field**: Prisma Decimal type used for monetary values
- **Patrimoine**: Client wealth/portfolio data
- **Timeline Event**: Audit trail entry tracking system changes
- **SuperAdmin**: User with cross-cabinet access privileges

## Requirements

### Requirement 1: Tenant-Aware Service Architecture

**User Story:** As a system architect, I want all domain services to enforce tenant isolation, so that cabinet data remains completely segregated.

#### Acceptance Criteria

1. WHEN any API route processes a request, THE System SHALL instantiate the domain service using getPrismaClient(cabinetId, isSuperAdmin)
2. THE System SHALL prohibit direct Prisma client access from API routes
3. WHEN a service is instantiated, THE System SHALL enforce cabinet-level data isolation for all database queries
4. IF a user is not a SuperAdmin, THEN THE System SHALL restrict all queries to the user's cabinet only
5. WHERE a SuperAdmin accesses the system, THE System SHALL allow cross-cabinet queries when explicitly requested

### Requirement 2: Centralized Validation Utilities

**User Story:** As a developer, I want all input validation centralized in utils modules, so that validation logic is consistent and maintainable.

#### Acceptance Criteria

1. THE System SHALL create a utils.ts file in each domain's API directory (app/api/<domain>/utils.ts)
2. THE System SHALL implement parseFilters() functions to validate and parse URLSearchParams for GET requests
3. THE System SHALL implement normalizeCreatePayload() functions to validate and normalize POST request bodies
4. THE System SHALL implement normalizeUpdatePayload() functions to validate and normalize PATCH request bodies
5. WHEN parsing filters, THE System SHALL convert string parameters to appropriate types (number, Date, enum, boolean)
6. WHEN normalizing payloads, THE System SHALL validate enum values against defined types
7. THE System SHALL validate date ranges and numeric constraints in filter functions

### Requirement 3: Data Formatting and Type Conversion

**User Story:** As an API consumer, I want all numeric and date fields properly formatted, so that I receive clean, JavaScript-compatible data.

#### Acceptance Criteria

1. THE System SHALL implement a toNumber() helper in each service to convert Decimal fields to number type
2. THE System SHALL implement format<Entity>() functions for each domain entity
3. WHEN formatting an entity, THE System SHALL convert all Decimal fields to number using toNumber()
4. WHEN formatting an entity, THE System SHALL convert all Date fields to ISO string format
5. THE System SHALL format nested relations recursively
6. THE System SHALL remove internal Prisma metadata from formatted responses
7. WHEN a service method returns data, THE System SHALL apply formatting helpers before returning

### Requirement 4: Documents Domain Refactoring

**User Story:** As a user managing documents, I want the documents domain to follow tenant-aware patterns, so that document access is properly isolated by cabinet.

#### Acceptance Criteria

1. THE System SHALL create app/api/documents/utils.ts with parseDocumentFilters(), normalizeDocumentCreatePayload(), and normalizeDocumentUpdatePayload()
2. WHEN parsing document filters, THE System SHALL validate DocumentType, DocumentCategory, and SignatureStatus enums
3. THE System SHALL refactor DocumentService to include toNumber() and formatDocument() helpers
4. WHEN formatting documents, THE System SHALL convert fileSize and related numeric fields
5. THE System SHALL validate client, projet, and tache relationships before document creation
6. WHEN a document is created or updated, THE System SHALL verify the user has appropriate permissions
7. THE System SHALL update all document API routes to use the tenant-aware service and validation utilities

### Requirement 5: Projets Domain Refactoring

**User Story:** As a user managing projects, I want the projets domain to follow tenant-aware patterns, so that project data is properly isolated and validated.

#### Acceptance Criteria

1. THE System SHALL create app/api/projets/utils.ts with parseProjetFilters(), normalizeProjetCreatePayload(), and normalizeProjetUpdatePayload()
2. WHEN parsing projet filters, THE System SHALL validate ProjetType and ProjetStatus enums
3. THE System SHALL refactor ProjetService to include toNumber() and formatProjet() helpers
4. WHEN formatting projets, THE System SHALL convert estimatedBudget and actualBudget Decimal fields to numbers
5. THE System SHALL validate client and cabinet relationships before projet creation
6. WHEN a projet affects patrimoine, THE System SHALL trigger calculateAndUpdateClientWealth()
7. THE System SHALL update all projet API routes to use createSuccessResponse() with formatted objects

### Requirement 6: Opportunités Domain Refactoring

**User Story:** As a user managing opportunities, I want the opportunités domain to follow tenant-aware patterns, so that opportunity tracking is consistent with other domains.

#### Acceptance Criteria

1. THE System SHALL create app/api/opportunites/utils.ts with parseOpportuniteFilters(), normalizeOpportuniteCreatePayload(), and normalizeOpportuniteUpdatePayload()
2. WHEN parsing opportunité filters, THE System SHALL validate OpportuniteType, OpportuniteStatus, and priority values
3. THE System SHALL refactor OpportuniteService to include formatOpportunite() helper
4. WHEN formatting opportunités, THE System SHALL convert estimatedValue and budget Decimal fields to numbers
5. WHEN an opportunité is converted to a projet, THE System SHALL verify the projet exists and trigger patrimoine recalculation
6. WHEN an opportunité status changes, THE System SHALL create corresponding timeline events
7. THE System SHALL update all opportunité API routes to use the tenant-aware service

### Requirement 7: Additional Domains Audit and Refactoring

**User Story:** As a system architect, I want all remaining API domains audited and refactored, so that the entire application follows consistent patterns.

#### Acceptance Criteria

1. THE System SHALL audit all directories in app/api/ to identify domains not yet refactored
2. WHEN a domain with direct Prisma access is identified, THE System SHALL refactor it to use tenant-aware services
3. THE System SHALL apply the same validation, formatting, and service patterns to each identified domain
4. THE System SHALL ensure all sub-routes (e.g., [id], /share) follow the same patterns as main routes
5. WHEN refactoring is complete for a domain, THE System SHALL document the changes in the domain's service file

### Requirement 8: Patrimoine Recalculation Integration

**User Story:** As a system maintaining data integrity, I want patrimoine automatically recalculated when related data changes, so that wealth calculations remain accurate.

#### Acceptance Criteria

1. WHEN an actif is created, updated, or deleted, THE System SHALL trigger calculateAndUpdateClientWealth()
2. WHEN a passif is created, updated, or deleted, THE System SHALL trigger calculateAndUpdateClientWealth()
3. WHEN a contrat is created, updated, or deleted, THE System SHALL trigger calculateAndUpdateClientWealth()
4. WHEN a projet with financial impact is modified, THE System SHALL trigger calculateAndUpdateClientWealth()
5. WHEN an opportunité is converted to a projet, THE System SHALL trigger calculateAndUpdateClientWealth()
6. THE System SHALL pass the correct clientId to the patrimoine recalculation function

### Requirement 9: Timeline Event Creation

**User Story:** As a user reviewing audit trails, I want timeline events created for significant actions, so that I can track system changes.

#### Acceptance Criteria

1. WHEN an actif is created or deleted, THE System SHALL create a corresponding timeline event
2. WHEN a passif is created or deleted, THE System SHALL create a corresponding timeline event
3. WHEN an opportunité is converted to a projet, THE System SHALL create a timeline event
4. WHEN a document is uploaded or signed, THE System SHALL create a timeline event
5. THE System SHALL include relevant entity IDs and user information in timeline events

### Requirement 10: Permission Validation

**User Story:** As a security-conscious administrator, I want permissions validated for sensitive operations, so that unauthorized actions are prevented.

#### Acceptance Criteria

1. WHEN a user attempts to upload a document, THE System SHALL verify the user has document creation permissions
2. WHEN a user attempts to sign a document, THE System SHALL verify the user has signature permissions
3. WHEN a user attempts to convert an opportunité, THE System SHALL verify the user has projet creation permissions
4. WHEN a user attempts to delete a projet, THE System SHALL verify the user has deletion permissions
5. THE System SHALL use the permissions service and auth-types.ts for all permission checks

### Requirement 11: API Response Consistency

**User Story:** As an API consumer, I want all API responses to follow a consistent format, so that client applications can reliably parse responses.

#### Acceptance Criteria

1. THE System SHALL use createSuccessResponse() for all successful API responses
2. THE System SHALL return formatted objects from services, never raw Prisma responses
3. WHEN an entity is created, THE System SHALL fetch and return the formatted entity using the service's get method
4. WHEN an entity is updated, THE System SHALL fetch and return the formatted entity using the service's get method
5. THE System SHALL include appropriate HTTP status codes (200, 201, 204) based on operation type

### Requirement 12: Testing and Validation

**User Story:** As a quality assurance engineer, I want all refactored code tested and validated, so that regressions are prevented.

#### Acceptance Criteria

1. WHEN refactoring is complete for a domain, THE System SHALL pass npm run lint without errors
2. THE System SHALL support manual testing via curl or HTTPie for each refactored endpoint
3. WHEN a domain is refactored, THE System SHALL verify GET, POST, PATCH, and DELETE operations function correctly
4. THE System SHALL update or create unit tests for new service methods
5. THE System SHALL document any test failures or known issues in the domain's documentation

### Requirement 13: Code Quality and Documentation

**User Story:** As a developer maintaining the codebase, I want clear documentation and consistent code quality, so that future modifications are straightforward.

#### Acceptance Criteria

1. THE System SHALL include a comment header in each utils.ts file describing the validation functions
2. THE System SHALL follow consistent naming conventions across all domains (parseFilters, normalizePayload, format<Entity>)
3. THE System SHALL remove unused imports and dead code during refactoring
4. THE System SHALL use TypeScript strict mode for all new and refactored files
5. WHEN refactoring is complete, THE System SHALL update the TODO tracking list for each completed domain
