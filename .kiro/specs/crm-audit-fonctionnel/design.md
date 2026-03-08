# Design Document: Audit Fonctionnel CRM

## Overview

Ce document décrit l'architecture et l'implémentation pour transformer le CRM d'un état "mock/simplifié" vers un état "fonctionnel complet". L'objectif est que chaque élément de l'interface produise un résultat réel et mesurable.

## Architecture

### Couches Impactées

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Dashboards  │  │   Tables    │  │  Forms/Dialogs      │  │
│  │ (KPI Cards) │  │ (Client     │  │  (Document Gen,     │  │
│  │             │  │  Links)     │  │   Operations)       │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼───────────────────┼──────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ /api/v1/    │  │ /api/v1/    │  │ /api/v1/documents/  │  │
│  │ compliance/ │  │ operations/ │  │ generate, export    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼───────────────────┼──────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Services (Business Logic)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ document-   │  │ affaire-    │  │ pdf-generator-      │  │
│  │ service     │  │ service     │  │ service (NEW)       │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼───────────────────┼──────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Prisma    │  │  Supabase   │  │   File Storage      │  │
│  │  (Database) │  │   Auth      │  │   (Supabase/S3)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Navigation System (Refactored)

**Problème actuel:** Les cartes KPI et les éléments cliquables ne mènent pas toujours à des pages fonctionnelles.

**Solution:** Créer un système de navigation centralisé avec validation des routes.

```typescript
// lib/navigation/navigation-config.ts
interface NavigationTarget {
  path: string
  params?: Record<string, string>
  filters?: Record<string, string | string[]>
}

interface KPICardConfig {
  id: string
  title: string
  target: NavigationTarget
  validateTarget: () => Promise<boolean>
}

// Exemple de configuration
const COMPLIANCE_KPI_CARDS: KPICardConfig[] = [
  {
    id: 'documents-pending',
    title: 'Documents en attente',
    target: {
      path: '/dashboard/conformite/documents',
      filters: { status: 'EN_ATTENTE' }
    },
    validateTarget: async () => true // Route exists
  }
]
```

### 2. Client Link Component (New)

**Problème actuel:** Les noms de clients sont parfois affichés comme du texte simple ou avec juste l'ID.

**Solution:** Créer un composant réutilisable `ClientLink` qui garantit la cohérence.

```typescript
// app/_common/components/ClientLink.tsx
interface ClientLinkProps {
  clientId: string
  clientName?: string
  showAvatar?: boolean
  className?: string
}

export function ClientLink({ clientId, clientName, showAvatar, className }: ClientLinkProps) {
  // Fetch client name if not provided
  // Render as Link to /dashboard/clients/[clientId]
}
```

### 3. Real PDF Generator Service (New)

**Problème actuel:** Le service `export-service.ts` génère des "placeholder URLs" au lieu de vrais fichiers.

**Solution:** Implémenter un vrai générateur PDF avec `@react-pdf/renderer` ou `pdfmake`.

```typescript
// lib/documents/services/pdf-generator-service.ts
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

interface PDFGeneratorResult {
  success: boolean
  fileBuffer?: Buffer
  fileName?: string
  error?: string
}

export async function generateDERPDF(
  clientData: ClientData,
  cabinetData: CabinetData,
  advisorData: AdvisorData
): Promise<PDFGeneratorResult> {
  // Create real PDF document
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {/* Cabinet logo and info */}
        </View>
        <View style={styles.section}>
          <Text style={styles.title}>Document d'Entrée en Relation</Text>
          {/* Real content */}
        </View>
        {/* More sections */}
      </Page>
    </Document>
  )
  
  const buffer = await pdf(doc).toBuffer()
  return { success: true, fileBuffer: buffer, fileName: `DER_${clientData.lastName}_${Date.now()}.pdf` }
}
```

### 4. File Storage Service (New)

**Problème actuel:** Les fichiers générés ne sont pas réellement stockés.

**Solution:** Intégrer Supabase Storage pour le stockage réel des fichiers.

```typescript
// lib/storage/file-storage-service.ts
import { createClient } from '@supabase/supabase-js'

interface StorageResult {
  success: boolean
  publicUrl?: string
  path?: string
  error?: string
}

export async function uploadDocument(
  cabinetId: string,
  clientId: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<StorageResult> {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  
  const path = `${cabinetId}/${clientId}/${fileName}`
  
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, fileBuffer, { contentType })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(path)
  
  return { success: true, publicUrl: urlData.publicUrl, path }
}
```

### 5. DOCX Generator Service (New)

**Problème actuel:** L'export DOCX génère du texte simple, pas de vrais fichiers Word.

**Solution:** Utiliser la bibliothèque `docx` pour générer de vrais fichiers Word.

```typescript
// lib/documents/services/docx-generator-service.ts
import { Document, Packer, Paragraph, TextRun, Header, Footer } from 'docx'

export async function generateDERDOCX(
  clientData: ClientData,
  cabinetData: CabinetData,
  advisorData: AdvisorData
): Promise<{ success: boolean; fileBuffer?: Buffer; error?: string }> {
  const doc = new Document({
    sections: [{
      properties: {},
      headers: {
        default: new Header({
          children: [new Paragraph({ children: [new TextRun(cabinetData.name)] })]
        })
      },
      children: [
        new Paragraph({
          children: [new TextRun({ text: "Document d'Entrée en Relation", bold: true, size: 32 })]
        }),
        // More content
      ]
    }]
  })
  
  const buffer = await Packer.toBuffer(doc)
  return { success: true, fileBuffer: buffer }
}
```

## Data Models

### Document Storage Model (Extended)

```prisma
model RegulatoryGeneratedDocument {
  id              String   @id @default(cuid())
  cabinetId       String
  clientId        String
  affaireId       String?
  operationId     String?
  templateId      String
  documentType    String
  fileName        String
  fileUrl         String   // MUST be a real URL, not placeholder
  storagePath     String?  // Path in storage bucket
  format          String   // PDF, DOCX
  status          String   // DRAFT, FINAL, SIGNED
  fileSize        Int?     // Actual file size in bytes
  checksum        String?  // MD5 hash for integrity
  generatedData   Json
  generatedById   String
  generatedAt     DateTime @default(now())
  signedAt        DateTime?
  expiresAt       DateTime?
  
  // Relations
  client          Client   @relation(fields: [clientId], references: [id])
  cabinet         Cabinet  @relation(fields: [cabinetId], references: [id])
  template        RegulatoryDocumentTemplate @relation(fields: [templateId], references: [id])
  generatedBy     User     @relation(fields: [generatedById], references: [id])
  affaire         AffaireNouvelle? @relation(fields: [affaireId], references: [id])
  operation       OperationGestion? @relation(fields: [operationId], references: [id])
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation Integrity

*For any* clickable element (KPI card, client name, operation reference, document) in the application, clicking it SHALL navigate to a valid page that displays relevant content (not 404, not empty state for valid data).

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**

### Property 2: Client Link Consistency

*For any* client displayed in any table, list, or card in the application, the client name SHALL be rendered as a clickable link that navigates to `/dashboard/clients/[clientId]` where `clientId` matches the client's database ID.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 3: PDF Generation Validity

*For any* document generation request (DER, Déclaration d'Adéquation, Bulletin d'Opération, Lettre de Mission, Recueil d'Informations), the generated output SHALL be a valid PDF file that:
- Has a file size > 0 bytes
- Can be parsed by a PDF reader
- Contains the expected sections based on document type
- Has a real storage URL that returns the file when accessed

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

### Property 4: DOCX Generation Validity

*For any* DOCX export request, the generated output SHALL be a valid DOCX file that:
- Has a file size > 0 bytes
- Can be opened by Microsoft Word or LibreOffice
- Preserves formatting and structure
- Has a real storage URL that returns the file when accessed

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 5: Action Result Completeness

*For any* user action (validate document, create operation, generate document, send reminder, complete control), the system SHALL:
- Persist the change to the database
- Create an audit log entry with timestamp and user
- Create a timeline event
- Return confirmation with the updated/created data

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 6: Data Relationship Integrity

*For any* document, operation, alert, or timeline event in the database, there SHALL exist a valid client record that it references. No orphan data is allowed.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 7: Dashboard Data Authenticity

*For any* dashboard section displaying data (expiring documents, alerts, pipeline, status counts), the displayed data SHALL match the result of a real-time database query with the same filters. No hardcoded or cached stale data.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 8: Export File Validity

*For any* export action (download document, export timeline PDF, export table CSV), the system SHALL produce a real file that:
- Downloads to the user's device
- Has the correct MIME type
- Has content matching the source data

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 9: Form Persistence Round-Trip

*For any* form submission (nouvelle affaire, nouvelle opération, nouvelle réclamation, MiFID questionnaire), submitting valid data SHALL result in:
- A new record in the database with all submitted fields
- Navigation to the detail page of the created record
- The detail page displaying the submitted data accurately

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 10: Database Referential Integrity

*For all* records in the database, foreign key relationships SHALL be valid:
- Every document.clientId references an existing client
- Every operation.clientId references an existing client
- Every generatedDocument.fileUrl returns a valid file
- Every timelineEvent references a valid entity

**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**

## Error Handling

### Document Generation Errors

```typescript
type DocumentGenerationError = 
  | { type: 'TEMPLATE_NOT_FOUND'; templateId: string }
  | { type: 'CLIENT_NOT_FOUND'; clientId: string }
  | { type: 'PDF_GENERATION_FAILED'; reason: string }
  | { type: 'STORAGE_UPLOAD_FAILED'; reason: string }
  | { type: 'INVALID_DATA'; fields: string[] }

function handleDocumentGenerationError(error: DocumentGenerationError): string {
  switch (error.type) {
    case 'TEMPLATE_NOT_FOUND':
      return `Template non trouvé: ${error.templateId}`
    case 'CLIENT_NOT_FOUND':
      return `Client non trouvé: ${error.clientId}`
    case 'PDF_GENERATION_FAILED':
      return `Erreur de génération PDF: ${error.reason}`
    case 'STORAGE_UPLOAD_FAILED':
      return `Erreur de stockage: ${error.reason}`
    case 'INVALID_DATA':
      return `Données invalides: ${error.fields.join(', ')}`
  }
}
```

### Navigation Errors

```typescript
// Validate navigation target before navigating
async function validateNavigationTarget(path: string): Promise<boolean> {
  // Check if route exists
  // Check if user has permission
  // Check if required data exists
  return true
}
```

## Testing Strategy

### Unit Tests

- Test PDF generation produces valid PDF buffer
- Test DOCX generation produces valid DOCX buffer
- Test file storage uploads and returns valid URL
- Test client link component renders correct href
- Test KPI card navigation targets are valid

### Property-Based Tests

Each correctness property will be implemented as a property-based test using `fast-check`:

1. **Navigation Integrity**: Generate random clickable elements, verify navigation works
2. **Client Link Consistency**: Generate random client displays, verify all are links
3. **PDF Generation Validity**: Generate random document requests, verify PDF validity
4. **DOCX Generation Validity**: Generate random export requests, verify DOCX validity
5. **Action Result Completeness**: Generate random actions, verify all side effects
6. **Data Relationship Integrity**: Query all records, verify foreign keys
7. **Dashboard Data Authenticity**: Compare dashboard data with direct DB queries
8. **Export File Validity**: Generate random exports, verify file validity
9. **Form Persistence Round-Trip**: Submit random forms, verify persistence
10. **Database Referential Integrity**: Verify all foreign keys are valid

### Integration Tests

- Test complete document generation workflow: request → generate → store → download
- Test complete operation workflow: create → update status → generate documents
- Test dashboard data matches database state

### Libraries

- **PDF Generation**: `@react-pdf/renderer` (React-based) or `pdfmake` (JSON-based)
- **DOCX Generation**: `docx` (official library)
- **Property Testing**: `fast-check`
- **File Storage**: Supabase Storage SDK
- **Testing**: Vitest with minimum 100 iterations per property test

