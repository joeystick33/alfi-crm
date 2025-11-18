# API Documentation - Multi-Tenant Refactored Domains

This document provides comprehensive API documentation for all refactored domains in the ALFI CRM system.

## Table of Contents

- [Documents API](#documents-api)
- [Projets API](#projets-api)
- [Opportunités API](#opportunités-api)
- [Objectifs API](#objectifs-api)
- [Simulations API](#simulations-api)
- [Notifications API](#notifications-api)
- [Rendez-Vous API](#rendez-vous-api)
- [Clients API](#clients-api)
- [Common Patterns](#common-patterns)
- [Error Codes](#error-codes)

---

## Documents API

### Base URL
`/api/documents`

### Endpoints

#### GET /api/documents
Retrieves a list of documents with optional filtering.

**Query Parameters:**
- `type` (optional): DocumentType enum (CONTRACT, INVOICE, REPORT, KYC, TAX, OTHER)
- `category` (optional): DocumentCategory enum (CLIENT, PROJET, TACHE, ACTIF, PASSIF, CONTRAT)
- `signatureStatus` (optional): SignatureStatus enum (PENDING, SIGNED, REJECTED)
- `clientId` (optional): Filter by client ID
- `projetId` (optional): Filter by projet ID
- `tacheId` (optional): Filter by tache ID
- `uploadedBy` (optional): Filter by uploader user ID
- `uploadedAfter` (optional): ISO date string
- `uploadedBefore` (optional): ISO date string
- `search` (optional): Search in name and description
- `isConfidential` (optional): Boolean (true/false)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-123",
      "name": "Contract.pdf",
      "description": "Client contract",
      "fileUrl": "https://...",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "type": "CONTRACT",
      "category": "CLIENT",
      "signatureStatus": "SIGNED",
      "isConfidential": false,
      "uploadedAt": "2024-01-15T10:30:00Z",
      "uploadedBy": {
        "id": "user-123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "clients": [...],
      "projets": [...],
      "taches": [...]
    }
  ]
}
```

#### POST /api/documents
Creates a new document.

**Request Body:**
```json
{
  "name": "Contract.pdf",
  "description": "Client contract",
  "fileUrl": "https://...",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "type": "CONTRACT",
  "category": "CLIENT",
  "tags": ["important", "2024"],
  "isConfidential": false,
  "clientId": "client-123",
  "projetId": "projet-456",
  "tacheId": "tache-789"
}
```

**Required Fields:**
- `name`: string
- `fileUrl`: string
- `fileSize`: number (positive)
- `mimeType`: string
- `type`: DocumentType enum

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "doc-123",
    ...
  }
}
```

#### PATCH /api/documents/[id]
Updates an existing document.

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Contract.pdf",
  "description": "Updated description",
  "signatureStatus": "SIGNED",
  "signedAt": "2024-01-15T10:30:00Z"
}
```

**Response:** `200 OK`

#### DELETE /api/documents/[id]
Deletes a document.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

---

## Projets API

### Base URL
`/api/projets`

### Endpoints

#### GET /api/projets
Retrieves a list of projets with optional filtering.

**Query Parameters:**
- `clientId` (optional): Filter by client ID
- `type` (optional): ProjetType enum (INVESTMENT, REAL_ESTATE, RETIREMENT, SUCCESSION, TAX_OPTIMIZATION, OTHER)
- `status` (optional): ProjetStatus enum (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD)
- `search` (optional): Search in name and description
- `startDateAfter` (optional): ISO date string
- `startDateBefore` (optional): ISO date string
- `targetDateAfter` (optional): ISO date string
- `targetDateBefore` (optional): ISO date string
- `estimatedBudgetMin` (optional): number
- `estimatedBudgetMax` (optional): number
- `actualBudgetMin` (optional): number
- `actualBudgetMax` (optional): number

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "projet-123",
      "name": "Portfolio Diversification",
      "description": "Diversify investment portfolio",
      "type": "INVESTMENT",
      "status": "IN_PROGRESS",
      "estimatedBudget": 50000,
      "actualBudget": 25000,
      "progress": 50,
      "startDate": "2024-01-01T00:00:00Z",
      "targetDate": "2024-12-31T00:00:00Z",
      "client": {
        "id": "client-123",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      },
      "_count": {
        "taches": 5,
        "documents": 3
      }
    }
  ]
}
```

#### POST /api/projets
Creates a new projet.

**Request Body:**
```json
{
  "clientId": "client-123",
  "type": "INVESTMENT",
  "name": "Portfolio Diversification",
  "description": "Diversify investment portfolio",
  "estimatedBudget": 50000,
  "actualBudget": 0,
  "startDate": "2024-01-01T00:00:00Z",
  "targetDate": "2024-12-31T00:00:00Z",
  "status": "PLANNED",
  "progress": 0
}
```

**Required Fields:**
- `clientId`: string
- `type`: ProjetType enum
- `name`: string

**Response:** `201 Created`

#### PATCH /api/projets/[id]
Updates an existing projet.

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Project Name",
  "status": "IN_PROGRESS",
  "progress": 50,
  "actualBudget": 25000
}
```

**Response:** `200 OK`

**Note:** Changing status to COMPLETED automatically sets endDate and progress to 100.

#### DELETE /api/projets/[id]
Deletes a projet.

**Response:** `200 OK`

---

## Opportunités API

### Base URL
`/api/opportunites`

### Endpoints

#### GET /api/opportunites
Retrieves a list of opportunités with optional filtering.

**Query Parameters:**
- `clientId` (optional): Filter by client ID
- `type` (optional): OpportuniteType enum (INVESTMENT, INSURANCE, LOAN, TAX_OPTIMIZATION, SUCCESSION, OTHER)
- `status` (optional): OpportuniteStatus enum (IDENTIFIED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST, ABANDONED)
- `priority` (optional): OpportunitePriority enum (LOW, MEDIUM, HIGH, URGENT)
- `search` (optional): Search in title and description
- `expectedCloseDateAfter` (optional): ISO date string
- `expectedCloseDateBefore` (optional): ISO date string
- `estimatedValueMin` (optional): number
- `estimatedValueMax` (optional): number

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "opp-123",
      "title": "Life Insurance Policy",
      "description": "Comprehensive life insurance",
      "type": "INSURANCE",
      "status": "PROPOSAL",
      "priority": "HIGH",
      "estimatedValue": 100000,
      "probability": 75,
      "expectedCloseDate": "2024-06-30T00:00:00Z",
      "client": {
        "id": "client-123",
        "firstName": "Jane",
        "lastName": "Smith"
      }
    }
  ]
}
```

#### POST /api/opportunites
Creates a new opportunité.

**Request Body:**
```json
{
  "clientId": "client-123",
  "type": "INSURANCE",
  "title": "Life Insurance Policy",
  "description": "Comprehensive life insurance",
  "priority": "HIGH",
  "estimatedValue": 100000,
  "probability": 75,
  "expectedCloseDate": "2024-06-30T00:00:00Z"
}
```

**Required Fields:**
- `clientId`: string
- `type`: OpportuniteType enum
- `title`: string

**Response:** `201 Created`

#### PATCH /api/opportunites/[id]
Updates an existing opportunité.

**Request Body:** (all fields optional)
```json
{
  "status": "WON",
  "probability": 100,
  "notes": "Deal closed successfully"
}
```

**Response:** `200 OK`

#### POST /api/opportunites/[id]/convert
Converts an opportunité to a projet.

**Request Body:**
```json
{
  "projetId": "projet-456"
}
```

**Required Fields:**
- `projetId`: string (must reference an existing projet)

**Response:** `200 OK`

**Note:** This creates a timeline event and triggers patrimoine recalculation.

#### DELETE /api/opportunites/[id]
Deletes an opportunité.

**Response:** `200 OK`

---

## Objectifs API

### Base URL
`/api/objectifs`

### Endpoints

#### GET /api/objectifs
Retrieves a list of objectifs with optional filtering.

**Query Parameters:**
- `clientId` (optional): Filter by client ID
- `type` (optional): ObjectifType enum (RETIREMENT, EDUCATION, REAL_ESTATE, INVESTMENT, SAVINGS, OTHER)
- `status` (optional): ObjectifStatus enum (ACTIVE, ACHIEVED, ON_HOLD, CANCELLED)
- `priority` (optional): ObjectifPriority enum (LOW, MEDIUM, HIGH, URGENT)
- `search` (optional): Search in name and description
- `targetDateAfter` (optional): ISO date string
- `targetDateBefore` (optional): ISO date string
- `targetAmountMin` (optional): number
- `targetAmountMax` (optional): number

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "obj-123",
      "name": "Retirement Fund",
      "description": "Build retirement savings",
      "type": "RETIREMENT",
      "status": "ACTIVE",
      "priority": "HIGH",
      "targetAmount": 500000,
      "currentAmount": 250000,
      "progress": 50,
      "targetDate": "2040-01-01T00:00:00Z",
      "monthlyContribution": 2000,
      "client": {
        "id": "client-123",
        "firstName": "Jane",
        "lastName": "Smith"
      }
    }
  ]
}
```

#### POST /api/objectifs
Creates a new objectif.

**Request Body:**
```json
{
  "clientId": "client-123",
  "type": "RETIREMENT",
  "name": "Retirement Fund",
  "description": "Build retirement savings",
  "targetAmount": 500000,
  "currentAmount": 0,
  "targetDate": "2040-01-01T00:00:00Z",
  "priority": "HIGH",
  "monthlyContribution": 2000
}
```

**Required Fields:**
- `clientId`: string
- `type`: ObjectifType enum
- `name`: string
- `targetAmount`: number (positive)
- `targetDate`: ISO date string

**Response:** `201 Created`

#### PATCH /api/objectifs/[id]
Updates an existing objectif.

**Request Body:** (all fields optional)
```json
{
  "currentAmount": 300000,
  "monthlyContribution": 2500,
  "status": "ACTIVE"
}
```

**Response:** `200 OK`

**Note:** Updating currentAmount automatically recalculates progress and may change status to ACHIEVED.

#### DELETE /api/objectifs/[id]
Deletes an objectif.

**Response:** `200 OK`

---

## Simulations API

### Base URL
`/api/simulations`

### Endpoints

#### GET /api/simulations
Retrieves a list of simulations with optional filtering.

**Query Parameters:**
- `clientId` (optional): Filter by client ID
- `type` (optional): SimulationType enum
- `status` (optional): SimulationStatus enum (DRAFT, COMPLETED, ARCHIVED)
- `createdAfter` (optional): ISO date string
- `createdBefore` (optional): ISO date string

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "sim-123",
      "type": "RETIREMENT",
      "name": "Retirement Projection 2024",
      "status": "COMPLETED",
      "parameters": {...},
      "results": {...},
      "createdAt": "2024-01-15T10:30:00Z",
      "client": {
        "id": "client-123",
        "firstName": "Jane",
        "lastName": "Smith"
      }
    }
  ]
}
```

#### POST /api/simulations
Creates a new simulation.

**Request Body:**
```json
{
  "clientId": "client-123",
  "type": "RETIREMENT",
  "name": "Retirement Projection 2024",
  "parameters": {
    "currentAge": 35,
    "retirementAge": 65,
    "currentSavings": 100000
  }
}
```

**Required Fields:**
- `clientId`: string
- `type`: SimulationType enum
- `name`: string
- `parameters`: object

**Response:** `201 Created`

#### PATCH /api/simulations/[id]
Updates an existing simulation.

**Response:** `200 OK`

#### DELETE /api/simulations/[id]
Deletes a simulation.

**Response:** `200 OK`

---

## Notifications API

### Base URL
`/api/notifications`

### Endpoints

#### GET /api/notifications
Retrieves a list of notifications for the current user.

**Query Parameters:**
- `type` (optional): NotificationType enum
- `isRead` (optional): Boolean (true/false)
- `createdAfter` (optional): ISO date string

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-123",
      "type": "TASK_ASSIGNED",
      "title": "New Task Assigned",
      "message": "You have been assigned a new task",
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "relatedEntityType": "Tache",
      "relatedEntityId": "tache-456"
    }
  ]
}
```

#### PATCH /api/notifications/[id]
Marks a notification as read.

**Request Body:**
```json
{
  "isRead": true
}
```

**Response:** `200 OK`

#### DELETE /api/notifications/[id]
Deletes a notification.

**Response:** `200 OK`

---

## Rendez-Vous API

### Base URL
`/api/rendez-vous`

### Endpoints

#### GET /api/rendez-vous
Retrieves a list of rendez-vous with optional filtering.

**Query Parameters:**
- `conseillerId` (optional): Filter by conseiller ID
- `clientId` (optional): Filter by client ID
- `type` (optional): RendezVousType enum (INITIAL, FOLLOW_UP, REVIEW, SIGNING, OTHER)
- `status` (optional): RendezVousStatus enum (SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)
- `startDate` (optional): ISO date string (filter from this date)
- `endDate` (optional): ISO date string (filter to this date)
- `search` (optional): Search in title and description

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "rdv-123",
      "type": "INITIAL",
      "title": "Initial Consultation",
      "description": "First meeting with client",
      "startDate": "2024-01-20T14:00:00Z",
      "endDate": "2024-01-20T15:00:00Z",
      "location": "Office",
      "isVirtual": false,
      "status": "SCHEDULED",
      "conseiller": {
        "id": "user-123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "client": {
        "id": "client-123",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      }
    }
  ]
}
```

#### POST /api/rendez-vous
Creates a new rendez-vous.

**Request Body:**
```json
{
  "type": "INITIAL",
  "title": "Initial Consultation",
  "description": "First meeting with client",
  "startDate": "2024-01-20T14:00:00Z",
  "endDate": "2024-01-20T15:00:00Z",
  "location": "Office",
  "meetingUrl": "https://zoom.us/...",
  "isVirtual": false,
  "conseillerId": "user-123",
  "clientId": "client-123"
}
```

**Required Fields:**
- `type`: RendezVousType enum
- `title`: string
- `startDate`: ISO date string
- `endDate`: ISO date string
- `conseillerId`: string

**Response:** `201 Created`

**Note:** The system automatically checks for time slot conflicts and will return an error if a conflict is detected.

#### PATCH /api/rendez-vous/[id]
Updates an existing rendez-vous.

**Request Body:** (all fields optional)
```json
{
  "status": "CONFIRMED",
  "location": "Updated Office Location"
}
```

**Response:** `200 OK`

**Note:** Changing dates triggers conflict detection.

#### DELETE /api/rendez-vous/[id]
Deletes a rendez-vous.

**Response:** `200 OK`

---

## Clients API

### Base URL
`/api/clients`

### Endpoints

#### GET /api/clients
Retrieves a list of clients with optional filtering.

**Query Parameters:**
- `status` (optional): ClientStatus enum (PROSPECT, ACTIVE, INACTIVE, ARCHIVED)
- `type` (optional): ClientType enum (INDIVIDUAL, COUPLE, COMPANY)
- `search` (optional): Search in firstName, lastName, email
- `createdAfter` (optional): ISO date string
- `createdBefore` (optional): ISO date string

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "client-123",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "phone": "+33612345678",
      "status": "ACTIVE",
      "type": "INDIVIDUAL",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/clients
Creates a new client.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+33612345678",
  "type": "INDIVIDUAL",
  "status": "PROSPECT"
}
```

**Required Fields:**
- `firstName`: string
- `lastName`: string
- `email`: string (valid email format)
- `type`: ClientType enum

**Response:** `201 Created`

#### PATCH /api/clients/[id]
Updates an existing client.

**Response:** `200 OK`

#### DELETE /api/clients/[id]
Deletes a client.

**Response:** `200 OK`

---

## Common Patterns

### Authentication
All API endpoints require authentication via Bearer token:

```
Authorization: Bearer <token>
```

### Tenant Isolation
All requests are automatically scoped to the user's cabinet (tenant). SuperAdmin users can access cross-cabinet data when explicitly requested.

### Response Format
All successful responses follow this format:

```json
{
  "success": true,
  "data": <response_data>
}
```

### Pagination
For endpoints returning large datasets, pagination can be implemented using query parameters:

```
?page=1&pageSize=50
```

Response includes pagination metadata:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Date Formats
All dates must be provided in ISO 8601 format:

```
2024-01-15T10:30:00Z
```

### Decimal Fields
All monetary and numeric Decimal fields are automatically converted to JavaScript numbers in responses.

---

## Error Codes

### 400 Bad Request
Invalid request payload or query parameters.

```json
{
  "success": false,
  "error": "Invalid value for field: type"
}
```

Common causes:
- Missing required fields
- Invalid enum values
- Invalid date formats
- Invalid numeric values
- Validation failures

### 401 Unauthorized
Missing or invalid authentication token.

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 403 Forbidden
User lacks required permissions for the operation.

```json
{
  "success": false,
  "error": "Access denied"
}
```

### 404 Not Found
Requested resource does not exist.

```json
{
  "success": false,
  "error": "Document not found"
}
```

### 409 Conflict
Operation conflicts with existing data (e.g., time slot conflict for rendez-vous).

```json
{
  "success": false,
  "error": "Time slot conflict detected"
}
```

### 500 Internal Server Error
Unexpected server error.

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Best Practices

### 1. Always Validate Input
Use the provided validation utilities in each domain's `utils.ts` file.

### 2. Handle Errors Gracefully
Check response status and handle errors appropriately in client applications.

### 3. Use Appropriate HTTP Methods
- GET: Retrieve data
- POST: Create new resources
- PATCH: Update existing resources (partial updates)
- DELETE: Remove resources

### 4. Leverage Filtering
Use query parameters to filter results and reduce payload size.

### 5. Monitor Rate Limits
Be mindful of API rate limits and implement appropriate retry logic.

### 6. Cache When Appropriate
Cache frequently accessed, rarely changing data (e.g., enum values, lookup tables).

---

## Support

For questions or issues with the API, please contact the development team or refer to the source code documentation in:
- Service classes: `lib/services/`
- Validation utilities: `app/api/<domain>/utils.ts`
- API routes: `app/api/<domain>/route.ts`
