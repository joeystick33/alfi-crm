# Document Management Integration Guide

## Quick Start

### 1. Add TabDocuments to Client360

In your Client360 page (`app/dashboard/clients/[id]/page.tsx`), import and use the TabDocuments component:

```tsx
import { TabDocuments } from '@/components/documents'

// In your tabs configuration
const tabs = [
  { id: 'overview', label: 'Vue d\'ensemble', component: <TabOverview /> },
  { id: 'profile', label: 'Profil', component: <TabProfile /> },
  { id: 'documents', label: 'Documents', component: <TabDocuments clientId={clientId} client={client} /> },
  // ... other tabs
]
```

### 2. Add DocumentsWidget to Dashboard

In your dashboard page (`app/dashboard/page.tsx`), add the widget:

```tsx
import { DocumentsWidget } from '@/components/documents'

// In your dashboard layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <DocumentsWidget maxDocuments={5} showStats={true} />
  {/* Other widgets */}
</div>
```

## API Endpoints

### Client Documents

#### Get Client Documents
```typescript
GET /api/advisor/clients/[id]/documents

Response:
{
  documents: Document[],
  completeness: {
    score: number,
    status: 'COMPLETE' | 'GOOD' | 'MEDIUM' | 'INCOMPLETE',
    completed: number,
    totalRequired: number,
    missing: number,
    missingDocs: DocumentType[],
    expiringDocs: DocumentType[]
  },
  externalSources: {
    gedLinked: number,
    gedTotal: number
  } | null
}
```

#### Upload Document
```typescript
POST /api/advisor/clients/[id]/documents
Content-Type: multipart/form-data

Body:
- file: File
- type: DocumentType
- name: string (optional)
- description: string (optional)

Response:
{
  id: string,
  name: string,
  fileUrl: string,
  type: DocumentType,
  // ... other document fields
}
```

### GED Integration

#### Get GED Library
```typescript
GET /api/advisor/clients/[id]/documents/ged

Response:
{
  documents: ExternalDocument[],
  total: number
}
```

#### Link GED Document
```typescript
POST /api/advisor/clients/[id]/documents/ged/link
Content-Type: application/json

Body:
{
  externalId: string
}

Response:
{
  message: string,
  externalId: string,
  clientId: string
}
```

#### Unlink GED Document
```typescript
POST /api/advisor/clients/[id]/documents/ged/unlink
Content-Type: application/json

Body:
{
  externalId: string
}

Response:
{
  message: string,
  externalId: string,
  clientId: string
}
```

### Widget

#### Get Documents for Widget
```typescript
GET /api/advisor/widgets/documents?limit=5

Response:
{
  documents: Array<{
    id: string,
    name: string,
    type: DocumentType,
    status: string,
    priority: 'HAUTE' | 'MOYENNE' | 'NORMALE',
    requiresSignature: boolean,
    dueLabel: string | null,
    uploadedAt: Date
  }>,
  total: number,
  stats: {
    totalDocuments: number,
    pendingSignatures: number,
    expiringSoon: number,
    storageUsed: number,
    storageLimit: number
  }
}
```

## Document Types

### Available Document Types

See `lib/utils/document-categories.ts` for the complete list. Key types include:

**Entry into Relationship:**
- PIECE_IDENTITE - ID card
- JUSTIF_DOMICILE - Proof of address
- RIB - Bank details
- QUESTIONNAIRE_MIFID - MIFID questionnaire

**Tax:**
- AVIS_IMPOSITION - Tax notice
- DECLARATION_REVENUS - Income declaration
- DECLARATION_IFI - Wealth tax declaration

**Wealth:**
- RELEVE_COMPTE - Account statement
- RELEVE_PORTEFEUILLE - Portfolio statement
- TITRE_PROPRIETE - Property title

**Contracts:**
- CONTRAT_ASSURANCE_VIE - Life insurance contract
- CONTRAT_CAPITALISATION - Capitalization contract
- MANDAT_GESTION - Management mandate

## Customization

### Modify Document Categories

Edit `lib/utils/document-categories.ts`:

```typescript
export const DOCUMENT_CATEGORIES = {
  MY_CATEGORY: {
    label: 'My Category',
    description: 'Description',
    required: true,
    types: [
      {
        id: 'MY_DOC_TYPE',
        label: 'My Document Type',
        description: 'Description',
        required: true,
        threshold: 100000, // Optional wealth threshold
      }
    ]
  }
}
```

### Customize Completeness Calculation

The `calculateDocumentCompleteness()` function in `lib/utils/document-categories.ts` can be modified to change how completeness is calculated.

### Add Custom Document Actions

Extend the TabDocuments component to add custom actions:

```tsx
const handleCustomAction = async (doc: any) => {
  // Your custom logic
}

// In the document row
<Button onClick={() => handleCustomAction(doc)}>
  Custom Action
</Button>
```

## File Storage Integration

### Current Implementation

Currently uses placeholder URLs. To integrate with actual storage:

### Option 1: Supabase Storage

```typescript
// In the upload handler
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Upload file
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`${cabinetId}/${clientId}/${file.name}`, file)

if (error) throw error

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('documents')
  .getPublicUrl(data.path)

const fileUrl = publicUrl
```

### Option 2: AWS S3

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({ region: process.env.AWS_REGION })

const command = new PutObjectCommand({
  Bucket: process.env.S3_BUCKET,
  Key: `${cabinetId}/${clientId}/${file.name}`,
  Body: Buffer.from(await file.arrayBuffer()),
  ContentType: file.type,
})

await s3Client.send(command)

const fileUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${cabinetId}/${clientId}/${file.name}`
```

## GED System Integration

### External Document Management System

To integrate with an external GED system:

1. **Configure GED API credentials** in environment variables
2. **Implement GED client** in `lib/services/ged-service.ts`
3. **Update GED routes** to call the GED service

Example GED service:

```typescript
// lib/services/ged-service.ts
export class GEDService {
  async listDocuments(filters?: any) {
    // Call external GED API
    const response = await fetch(`${process.env.GED_API_URL}/documents`, {
      headers: {
        'Authorization': `Bearer ${process.env.GED_API_KEY}`
      }
    })
    return response.json()
  }

  async linkDocument(externalId: string, clientId: string) {
    // Create link in GED system
  }

  async unlinkDocument(externalId: string, clientId: string) {
    // Remove link in GED system
  }
}
```

## Troubleshooting

### Documents not loading
- Check API route is accessible
- Verify authentication is working
- Check browser console for errors
- Verify Prisma client is configured correctly

### Upload failing
- Check file size limits
- Verify storage configuration
- Check file type is allowed
- Verify API route has correct permissions

### Completeness not calculating
- Verify `document-categories.ts` is imported correctly
- Check client patrimoine value is passed correctly
- Verify document types match category definitions

### GED integration not working
- Verify GED API credentials
- Check GED service implementation
- Verify external system is accessible
- Check CORS configuration if needed

## Performance Optimization

### Lazy Loading
Documents are loaded on demand when the tab is opened.

### Pagination
For clients with many documents, implement pagination:

```typescript
const { searchParams } = new URL(request.url)
const page = parseInt(searchParams.get('page') || '1', 10)
const limit = parseInt(searchParams.get('limit') || '20', 10)

const documents = await prisma.clientDocument.findMany({
  where: { clientId },
  skip: (page - 1) * limit,
  take: limit,
  // ... rest of query
})
```

### Caching
Consider caching document lists:

```typescript
import { unstable_cache } from 'next/cache'

const getClientDocuments = unstable_cache(
  async (clientId: string) => {
    // ... fetch documents
  },
  ['client-documents'],
  { revalidate: 60 } // Cache for 60 seconds
)
```

## Security Considerations

1. **File Upload Validation**
   - Validate file types
   - Enforce size limits
   - Scan for malware

2. **Access Control**
   - Verify user has access to client
   - Check document permissions
   - Implement RLS in Prisma

3. **Storage Security**
   - Use signed URLs for downloads
   - Encrypt sensitive documents
   - Implement access logs

4. **Data Privacy**
   - Comply with GDPR
   - Implement data retention policies
   - Allow document deletion

## Next Steps

1. ✅ Components migrated
2. ✅ API routes created
3. ⏳ Integrate with actual file storage
4. ⏳ Configure GED system (if needed)
5. ⏳ Test upload/download functionality
6. ⏳ Add electronic signature integration
7. ⏳ Implement OCR for classification
8. ⏳ Add document templates
