# Document Management Components (GED)

This folder contains all components related to document management (Gestion Électronique de Documents - GED).

## Components

### TabDocuments
Complete document management interface for Client360 view.

**Features:**
- Document upload with drag & drop
- Document categorization by type
- Completeness tracking (required vs optional documents)
- Expiration alerts
- GED (external document library) integration
- Document preview and download
- Document versioning support

**Usage:**
```tsx
import { TabDocuments } from '@/components/documents'

<TabDocuments clientId={clientId} client={client} />
```

### DocumentsWidget
Dashboard widget showing recent documents and pending actions.

**Features:**
- Recent documents list
- Pending signatures count
- Expiring documents alert
- Storage usage statistics
- Quick upload via drag & drop

**Usage:**
```tsx
import { DocumentsWidget } from '@/components/documents'

<DocumentsWidget maxDocuments={5} showStats={true} />
```

## API Routes

### Client Documents
- `GET /api/advisor/clients/[id]/documents` - List client documents with completeness
- `POST /api/advisor/clients/[id]/documents` - Upload new document

### GED Integration
- `GET /api/advisor/clients/[id]/documents/ged` - Get GED library
- `POST /api/advisor/clients/[id]/documents/ged/link` - Link GED document to client
- `POST /api/advisor/clients/[id]/documents/ged/unlink` - Unlink GED document

### Widget
- `GET /api/advisor/widgets/documents` - Get documents for dashboard widget

## Document Categories

Documents are organized into regulatory categories:

1. **ENTREE_RELATION** - Entry into relationship (KYC, ID, etc.)
2. **FISCALITE** - Tax documents
3. **PATRIMOINE** - Wealth documents
4. **CONTRATS** - Contracts
5. **CORRESPONDANCE** - Correspondence
6. **CONFORMITE** - Compliance
7. **AUTRES** - Other

Each category has specific document types with:
- Required/optional flag
- Wealth threshold (if applicable)
- Expiration tracking
- Description

## Document Types

See `lib/utils/document-categories.ts` for the complete list of document types and their properties.

## Storage

Documents are stored using the DocumentService which handles:
- File upload to storage (S3, Supabase Storage, etc.)
- Metadata management in Prisma
- Multi-entity linking (clients, actifs, passifs, contrats, etc.)
- Version control
- Access control

## Completeness Calculation

The system calculates document completeness based on:
- Required documents for all clients
- Conditional documents based on wealth threshold
- Document expiration dates
- Missing vs present documents

Status levels:
- **COMPLETE** (100%): All required documents present
- **GOOD** (80-99%): Most documents present
- **MEDIUM** (50-79%): Some documents missing
- **INCOMPLETE** (<50%): Many documents missing

## GED Integration

The GED (external document library) integration allows:
- Browsing external document repositories
- Linking external documents to client files
- Maintaining references without duplicating files
- Tracking which documents are linked vs internal

**Note:** GED integration requires configuration of external document management system.

## Future Enhancements

- [ ] Electronic signature integration (DocuSign, Yousign)
- [ ] OCR for automatic document classification
- [ ] Full-text search across documents
- [ ] Bulk upload and processing
- [ ] Document templates
- [ ] Automated expiration reminders
- [ ] Document sharing with clients via portal
- [ ] Audit trail for document access
