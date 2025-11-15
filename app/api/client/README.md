# Client Portal API Routes

This directory contains all API routes for the client portal. These routes provide read-only (and limited write) access to client data with proper authentication and authorization.

## Security

All routes verify:
1. Client exists
2. Client has `portalAccess` enabled
3. Client is accessing only their own data

## Routes

### Authentication

#### `POST /api/client/auth`
Authenticate a client for portal access.

**Request Body:**
```json
{
  "email": "client@example.com",
  "portalPassword": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "client": {
    "id": "cuid",
    "email": "client@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "cabinetId": "cuid",
    "conseiller": { ... },
    "cabinet": { ... }
  }
}
```

### Dashboard

#### `GET /api/client/dashboard?clientId=xxx`
Get dashboard overview data.

**Response:**
```json
{
  "client": { ... },
  "wealth": {
    "total": 850000,
    "actifs": 900000,
    "passifs": 50000,
    "evolution": { ... },
    "byCategory": [ ... ]
  },
  "stats": {
    "documents": { "total": 12, "recent": 2 },
    "nextAppointment": { ... },
    "objectifs": { "total": 5, "achieved": 2, "inProgress": 3 }
  },
  "objectifs": [ ... ],
  "recentActivity": [ ... ]
}
```

### Patrimoine (Wealth)

#### `GET /api/client/patrimoine?clientId=xxx`
Get detailed wealth information (read-only).

**Response:**
```json
{
  "summary": {
    "totalActifs": 900000,
    "totalPassifs": 50000,
    "netWealth": 850000,
    "evolution": { ... }
  },
  "actifs": {
    "total": 900000,
    "count": 15,
    "byCategory": [ ... ]
  },
  "passifs": {
    "total": 50000,
    "count": 2,
    "byType": [ ... ]
  },
  "contrats": {
    "count": 5,
    "byType": [ ... ]
  }
}
```

### Documents

#### `GET /api/client/documents?clientId=xxx&type=xxx&category=xxx`
Get documents (read-only, excludes confidential documents).

**Query Parameters:**
- `clientId` (required): Client ID
- `type` (optional): Filter by document type
- `category` (optional): Filter by document category

**Response:**
```json
{
  "documents": [
    {
      "id": "cuid",
      "name": "Bilan patrimonial 2024",
      "type": "ANNUAL_REPORT",
      "category": "PATRIMOINE",
      "fileUrl": "...",
      "fileSize": 2400000,
      "uploadedAt": "2024-11-05T10:00:00Z",
      "uploadedBy": "Sophie Martin",
      "isNew": true
    }
  ],
  "stats": {
    "total": 12,
    "new": 2
  },
  "filters": {
    "types": [ ... ],
    "categories": [ ... ]
  }
}
```

### Messages

#### `GET /api/client/messages?clientId=xxx`
Get message history with advisor.

**Response:**
```json
{
  "advisor": {
    "id": "cuid",
    "firstName": "Sophie",
    "lastName": "Martin",
    "email": "sophie@cabinet.fr"
  },
  "messages": [
    {
      "id": "cuid",
      "type": "email",
      "subject": "Bilan patrimonial",
      "body": "...",
      "from": { ... },
      "timestamp": "2024-11-05T10:00:00Z",
      "hasAttachments": true
    }
  ],
  "stats": {
    "total": 25,
    "unread": 0
  }
}
```

#### `POST /api/client/messages`
Send a message to advisor.

**Request Body:**
```json
{
  "clientId": "cuid",
  "subject": "Question sur mon bilan",
  "message": "Bonjour, j'ai une question..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

### Appointments

#### `GET /api/client/appointments?clientId=xxx&upcoming=true`
Get appointments (read-only).

**Query Parameters:**
- `clientId` (required): Client ID
- `upcoming` (optional): If "true", only return upcoming appointments

**Response:**
```json
{
  "appointments": [
    {
      "id": "cuid",
      "title": "Rendez-vous annuel",
      "type": "ANNUAL_REVIEW",
      "startDate": "2024-11-15T14:00:00Z",
      "endDate": "2024-11-15T15:00:00Z",
      "location": "Cabinet",
      "isVirtual": false,
      "status": "CONFIRMED",
      "conseiller": { ... }
    }
  ],
  "nextAppointment": { ... },
  "stats": {
    "total": 10,
    "byStatus": { ... }
  }
}
```

### Objectives

#### `GET /api/client/objectives?clientId=xxx&status=ACTIVE`
Get objectives and projects (read-only).

**Query Parameters:**
- `clientId` (required): Client ID
- `status` (optional): Filter by status

**Response:**
```json
{
  "objectifs": [
    {
      "id": "cuid",
      "name": "Retraite",
      "type": "RETIREMENT",
      "targetAmount": 500000,
      "currentAmount": 250000,
      "progress": 50,
      "targetDate": "2040-01-01",
      "status": "ACTIVE"
    }
  ],
  "projets": [ ... ],
  "stats": {
    "objectifs": {
      "total": 5,
      "active": 3,
      "achieved": 2,
      "overallProgress": 65
    },
    "projets": { ... }
  },
  "groupedData": { ... }
}
```

### Profile

#### `GET /api/client/profile?clientId=xxx`
Get client profile information.

**Response:**
```json
{
  "profile": {
    "id": "cuid",
    "email": "client@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "+33123456789",
    "mobile": "+33612345678",
    "address": { ... },
    "conseiller": { ... },
    "cabinet": { ... },
    "familyMembers": [ ... ]
  }
}
```

#### `PATCH /api/client/profile`
Update client profile (limited fields: phone, mobile, address).

**Request Body:**
```json
{
  "clientId": "cuid",
  "phone": "+33123456789",
  "mobile": "+33612345678",
  "address": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "profile": { ... }
}
```

#### `POST /api/client/profile/password`
Update portal password.

**Request Body:**
```json
{
  "clientId": "cuid",
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

## Data Access Rules

### Read-Only Access
Clients can view:
- Their own profile information
- Their wealth (actifs, passifs, contrats)
- Their documents (excluding confidential ones)
- Their appointments
- Their objectives and projects
- Messages with their advisor

### Limited Write Access
Clients can:
- Send messages to their advisor
- Update their contact information (phone, mobile, address)
- Change their portal password

### Restricted Access
Clients CANNOT:
- View other clients' data
- Modify their wealth data
- Delete documents
- Create or modify appointments
- Access confidential documents
- View internal notes or advisor comments

## Error Handling

All routes return consistent error responses:

```json
{
  "error": "Error message",
  "details": [ ... ] // Optional, for validation errors
}
```

Common HTTP status codes:
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (invalid credentials)
- `403`: Forbidden (no portal access or accessing other client's data)
- `404`: Not Found
- `500`: Internal Server Error

## Implementation Notes

1. **Authentication**: Currently uses email + portalPassword. Consider implementing JWT tokens for session management.

2. **Authorization**: All routes verify `portalAccess` flag and ensure clients only access their own data.

3. **Data Filtering**: Confidential documents are automatically excluded from client portal.

4. **Audit Trail**: Timeline events are created for important actions (profile updates, password changes, messages sent).

5. **Performance**: Consider adding caching for frequently accessed data (dashboard, wealth summary).

6. **Real-time Updates**: Consider implementing WebSocket or Server-Sent Events for real-time notifications.

## Future Enhancements

- [ ] Implement JWT-based session management
- [ ] Add rate limiting to prevent abuse
- [ ] Add document download tracking
- [ ] Implement read receipts for messages
- [ ] Add push notifications for mobile apps
- [ ] Add two-factor authentication option
- [ ] Implement document e-signature workflow
- [ ] Add appointment booking functionality
