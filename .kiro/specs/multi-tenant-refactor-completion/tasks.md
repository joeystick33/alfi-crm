# Implementation Plan

- [x] 1. Documents Domain Refactoring
  - Create validation utilities module with parseDocumentFilters(), normalizeDocumentCreatePayload(), and normalizeDocumentUpdatePayload() functions
  - Implement enum validation for DocumentType, DocumentCategory, and SignatureStatus
  - Support filtering by type, category, clientId, projetId, tacheId, uploadedBy, signatureStatus, and date ranges
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2_

- [x] 1.1 Create app/api/documents/utils.ts
  - Implement parseDocumentFilters() to parse and validate URLSearchParams
  - Implement normalizeDocumentCreatePayload() to validate POST request bodies
  - Implement normalizeDocumentUpdatePayload() to validate PATCH request bodies
  - Add helper functions: ensureString(), ensureNumber(), ensureDate(), ensureEnumValue()
  - Validate DocumentType, DocumentCategory, and SignatureStatus enum values
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2_

- [x] 1.2 Refactor or create DocumentService
  - Add toNumber() helper to convert Decimal fields (fileSize) to numbers
  - Implement formatDocument() to format document entities with nested relations
  - Ensure all public methods return formatted entities
  - Validate client, projet, and tache relationships before document creation
  - Implement tenant-aware Prisma client instantiation via getPrismaClient()
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.3, 4.4, 4.5_

- [x] 1.3 Update document API routes
  - Refactor GET /api/documents to use parseDocumentFilters() and DocumentService
  - Refactor POST /api/documents to use normalizeDocumentCreatePayload() and DocumentService
  - Refactor PATCH /api/documents/[id] to use normalizeDocumentUpdatePayload() and DocumentService
  - Refactor DELETE /api/documents/[id] to use DocumentService
  - Ensure all routes use createSuccessResponse() for responses
  - Implement proper error handling with createErrorResponse()
  - _Requirements: 4.7, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 1.4 Add permission validation for document operations
  - Validate documents:upload permission before document creation
  - Validate documents:sign permission before signature operations
  - Validate documents:delete permission before deletion
  - _Requirements: 4.6, 10.1, 10.2, 10.4_

- [x] 1.5 Implement timeline events for document actions
  - Create timeline event when document is uploaded
  - Create timeline event when document is signed
  - Include document name, type, and related entity information
  - _Requirements: 9.4_

- [x] 1.6 Write tests for Documents domain
  - Write unit tests for DocumentService CRUD operations
  - Write unit tests for document formatting and Decimal conversion
  - Write integration tests for document API routes
  - Test tenant isolation for documents
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 2. Projets Domain Refactoring
  - Create validation utilities module with parseProjetFilters(), normalizeProjetCreatePayload(), and normalizeProjetUpdatePayload() functions
  - Implement enum validation for ProjetType and ProjetStatus
  - Support filtering by type, status, clientId, date ranges, and budget ranges
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.1, 5.2_

- [x] 2.1 Create app/api/projets/utils.ts
  - Implement parseProjetFilters() to parse and validate URLSearchParams
  - Implement normalizeProjetCreatePayload() to validate POST request bodies
  - Implement normalizeProjetUpdatePayload() to validate PATCH request bodies
  - Add helper functions for string, number, date, and enum validation
  - Validate ProjetType and ProjetStatus enum values
  - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2_

- [x] 2.2 Refactor ProjetService
  - Add toNumber() helper to convert Decimal fields (estimatedBudget, actualBudget) to numbers
  - Implement formatProjet() to format projet entities with nested relations
  - Ensure all public methods return formatted entities
  - Validate client and cabinet relationships before projet creation
  - Implement tenant-aware Prisma client instantiation
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 5.3, 5.4, 5.5_

- [x] 2.3 Update projet API routes
  - Refactor GET /api/projets to use parseProjetFilters() and ProjetService
  - Refactor POST /api/projets to use normalizeProjetCreatePayload() and ProjetService
  - Refactor PATCH /api/projets/[id] to use normalizeProjetUpdatePayload() and ProjetService
  - Refactor DELETE /api/projets/[id] to use ProjetService
  - Ensure all routes use createSuccessResponse() for responses
  - _Requirements: 5.7, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 2.4 Integrate patrimoine recalculation for projets
  - Trigger calculateAndUpdateClientWealth() when projet with financial impact is created
  - Trigger recalculation when estimatedBudget or actualBudget is updated
  - Trigger recalculation when projet is deleted
  - _Requirements: 5.6, 8.4_

- [x] 2.5 Add timeline events for projet actions
  - Create timeline event when projet is created
  - Create timeline event when projet status changes
  - Create timeline event when projet is completed
  - _Requirements: 9.1, 9.2_

- [x] 2.6 Write tests for Projets domain
  - Write unit tests for ProjetService CRUD operations
  - Write unit tests for projet formatting and Decimal conversion
  - Write integration tests for projet API routes
  - Test patrimoine recalculation triggers
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 3. Opportunités Domain Refactoring
  - Create validation utilities module with parseOpportuniteFilters(), normalizeOpportuniteCreatePayload(), and normalizeOpportuniteUpdatePayload() functions
  - Implement enum validation for OpportuniteType, OpportuniteStatus, and OpportunitePriority
  - Support filtering by type, status, priority, clientId, and date ranges
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 6.1, 6.2_

- [x] 3.1 Create app/api/opportunites/utils.ts
  - Implement parseOpportuniteFilters() to parse and validate URLSearchParams
  - Implement normalizeOpportuniteCreatePayload() to validate POST request bodies
  - Implement normalizeOpportuniteUpdatePayload() to validate PATCH request bodies
  - Add helper functions for validation and type conversion
  - Validate OpportuniteType, OpportuniteStatus, and OpportunitePriority enum values
  - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2_

- [x] 3.2 Refactor OpportuniteService
  - Add toNumber() helper to convert Decimal fields (estimatedValue, budget) to numbers
  - Implement formatOpportunite() to format opportunité entities with nested relations
  - Ensure all public methods return formatted entities
  - Validate client relationship before opportunité creation
  - Implement tenant-aware Prisma client instantiation
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 6.3, 6.4_

- [x] 3.3 Implement opportunité conversion to projet
  - Add convertToProjet() method in OpportuniteService
  - Validate that the target projet exists before conversion
  - Update opportunité status and set convertedToProjetId
  - Trigger patrimoine recalculation for the client
  - Create timeline event for the conversion
  - _Requirements: 6.5, 8.5, 9.3_

- [x] 3.4 Update opportunité API routes
  - Refactor GET /api/opportunites to use parseOpportuniteFilters() and OpportuniteService
  - Refactor POST /api/opportunites to use normalizeOpportuniteCreatePayload() and OpportuniteService
  - Refactor PATCH /api/opportunites/[id] to use normalizeOpportuniteUpdatePayload() and OpportuniteService
  - Refactor DELETE /api/opportunites/[id] to use OpportuniteService
  - Add POST /api/opportunites/[id]/convert route for conversion to projet
  - Ensure all routes use createSuccessResponse() for responses
  - _Requirements: 6.7, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 3.5 Add permission validation for opportunité operations
  - Validate opportunites:convert permission before conversion to projet
  - Implement proper authorization checks
  - _Requirements: 10.3_

- [x] 3.6 Implement timeline events for opportunité actions
  - Create timeline event when opportunité status changes
  - Create timeline event when opportunité is converted to projet
  - Include opportunité details and estimated value
  - _Requirements: 6.6, 9.3_

- [x] 3.7 Write tests for Opportunités domain
  - Write unit tests for OpportuniteService CRUD operations
  - Write unit tests for opportunité formatting and Decimal conversion
  - Write unit tests for conversion to projet
  - Write integration tests for opportunité API routes
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 4. Additional Domains Audit and Refactoring
  - Audit all directories in app/api/ to identify domains not yet refactored
  - For each identified domain, apply the same validation, formatting, and service patterns
  - Ensure all sub-routes follow the established patterns
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4.1 Audit app/api/ directory structure
  - List all directories in app/api/
  - Identify domains with direct Prisma access in routes
  - Identify domains without utils.ts files
  - Identify domains without dedicated service classes
  - Create prioritized list of domains to refactor
  - _Requirements: 7.1, 7.2_

- [x] 4.2 Refactor clients domain (if needed)
  - Audit app/api/clients/ for direct Prisma access
  - Create app/api/clients/utils.ts if missing
  - Refactor ClientService to follow patterns
  - Update all client API routes
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 4.3 Refactor objectifs domain (if needed)
  - Audit app/api/objectifs/ for direct Prisma access
  - Create app/api/objectifs/utils.ts if missing
  - Create or refactor ObjectifService
  - Update all objectif API routes
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 4.4 Refactor simulations domain (if needed)
  - Audit app/api/simulations/ for direct Prisma access
  - Create app/api/simulations/utils.ts if missing
  - Create or refactor SimulationService
  - Update all simulation API routes
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 4.5 Refactor notifications domain (if needed)
  - Audit app/api/notifications/ for direct Prisma access
  - Create app/api/notifications/utils.ts if missing
  - Create or refactor NotificationService
  - Update all notification API routes
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 4.6 Refactor rendez-vous domain (if needed)
  - Audit app/api/rendez-vous/ for direct Prisma access
  - Create app/api/rendez-vous/utils.ts if missing
  - Create or refactor RendezVousService
  - Update all rendez-vous API routes
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 4.7 Refactor remaining domains
  - Apply refactoring patterns to any other identified domains
  - Ensure consistency across all domains
  - Document any domain-specific considerations
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [x] 5. Patrimoine Integration for New Domains
  - Add patrimoine recalculation triggers for projets and opportunités
  - Follow existing pattern from actifs, passifs, and contrats (already implemented)
  - _Requirements: 8.4, 8.5_

- [x] 5.1 Add projet patrimoine triggers
  - Implement recalculation when projet with financial impact is created
  - Implement recalculation when estimatedBudget or actualBudget changes
  - Follow pattern from ActifService and PassifService
  - _Requirements: 8.4_

- [x] 5.2 Add opportunité patrimoine triggers
  - Implement recalculation when opportunité is converted to projet
  - Ensure clientId is correctly passed to recalculation function
  - _Requirements: 8.5_

- [x] 6. Timeline Events for New Domains
  - Add timeline events for documents, projets, and opportunités
  - Follow existing pattern from actifs, passifs, contrats, and tâches (already implemented)
  - Use timelineEvent.create() as in TacheService
  - _Requirements: 9.3, 9.4_

- [x] 6.1 Add document timeline events
  - Implement timeline event creation when document is uploaded
  - Implement timeline event creation when document is signed
  - Include document name, type, and related entity
  - Follow pattern from TacheService.createTache()
  - _Requirements: 9.4_

- [x] 6.2 Add projet timeline events
  - Implement timeline event creation when projet is created
  - Implement timeline event creation when projet status changes
  - Follow existing timeline event pattern
  - _Requirements: 9.3_

- [x] 6.3 Add opportunité timeline events
  - Implement timeline event creation when opportunité is converted to projet
  - Include opportunité title and estimated value
  - _Requirements: 9.3_

- [x] 7. Permission Validation
  - Implement permission checks for sensitive operations using checkPermission() from auth-helpers.ts
  - Return appropriate error responses for unauthorized actions
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 7.1 Implement document permission checks
  - Use checkPermission() for documents:upload before document creation
  - Use checkPermission() for documents:sign before signature operations
  - Use checkPermission() for documents:delete before deletion
  - _Requirements: 10.1, 10.2, 10.4_

- [x] 7.2 Implement projet permission checks
  - Use checkPermission() for projets:create before projet creation
  - Use checkPermission() for projets:delete before deletion
  - _Requirements: 10.5_

- [x] 7.3 Implement opportunité permission checks
  - Use checkPermission() for opportunites:convert before conversion to projet
  - Ensure proper authorization for all opportunité operations
  - _Requirements: 10.3_

- [x] 8. Testing and Validation
  - Run npm run lint on all modified files
  - Execute automated test suites
  - Perform manual testing with curl or HTTPie
  - Verify tenant isolation
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 8.1 Run linting and type checking
  - Execute npm run lint on all modified files
  - Fix any linting errors or warnings
  - Verify TypeScript strict mode compliance
  - _Requirements: 12.1, 13.4_

- [x] 8.2 Execute automated tests
  - Run unit tests for all refactored services
  - Run integration tests for all refactored API routes
  - Verify test coverage meets requirements
  - Fix any failing tests
  - _Requirements: 12.2, 12.3_

- [x] 8.3 Manual testing with curl/HTTPie
  - Test GET requests with various filter combinations
  - Test POST requests with valid and invalid payloads
  - Test PATCH requests for partial updates
  - Test DELETE requests
  - Verify response formats and status codes
  - _Requirements: 12.2_

- [x] 8.4 Verify tenant isolation
  - Test that users can only access their cabinet's data
  - Test that SuperAdmin can access cross-cabinet data when needed
  - Verify no data leakage between cabinets
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 8.5 Verify patrimoine recalculation
  - Test that patrimoine is recalculated when actifs change
  - Test that patrimoine is recalculated when passifs change
  - Test that patrimoine is recalculated when contrats change
  - Verify calculation accuracy
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8.6 Verify timeline events
  - Test that timeline events are created for all significant actions
  - Verify event data is complete and accurate
  - Check that events are visible in client timelines
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9. Documentation and Code Quality
  - Add documentation comments to all new code
  - Update API documentation
  - Ensure consistent naming conventions
  - Remove unused code
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 9.1 Add code documentation
  - Add JSDoc comments to all service classes
  - Add JSDoc comments to all public methods
  - Add header comments to utils.ts files describing validation functions
  - Document any complex business logic
  - _Requirements: 13.1_

- [x] 9.2 Update API documentation
  - Document all refactored API endpoints
  - Include request/response schemas
  - Document query parameters and filters
  - Document error codes and messages
  - Provide example requests
  - _Requirements: 13.1_

- [x] 9.3 Code quality improvements
  - Ensure consistent naming conventions across all domains
  - Remove unused imports and dead code
  - Apply consistent code formatting
  - Verify TypeScript strict mode compliance
  - _Requirements: 13.2, 13.3, 13.4_

- [x] 9.4 Update TODO tracking
  - Mark completed tasks in TODO list
  - Document any remaining work or known issues
  - Create follow-up tasks for future improvements
  - _Requirements: 13.5_

- [x] 10. Final Review and Deployment
  - Conduct code review
  - Verify all requirements are met
  - Prepare deployment plan
  - Deploy to staging for final testing
  - _Requirements: All_

- [x] 10.1 Code review
  - Review all modified files for code quality
  - Verify adherence to established patterns
  - Check for security vulnerabilities
  - Ensure proper error handling
  - _Requirements: All_

- [x] 10.2 Requirements verification
  - Verify all 13 requirements are fully implemented
  - Check all 65 acceptance criteria
  - Document any deviations or limitations
  - _Requirements: All_

- [x] 10.3 Deployment preparation
  - Create deployment checklist
  - Prepare rollback plan
  - Set up monitoring and alerting
  - Document deployment steps
  - _Requirements: All_

- [x] 10.4 Staging deployment and testing
  - Deploy to staging environment
  - Run full test suite in staging
  - Perform end-to-end testing
  - Verify tenant isolation in multi-tenant scenarios
  - Monitor for errors or performance issues
  - _Requirements: All_
