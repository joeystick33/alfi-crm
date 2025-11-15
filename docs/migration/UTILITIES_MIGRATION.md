# Utilities Migration Summary

## Overview
This document summarizes the migration of utility functions from CRM to alfi-crm, adapted for Prisma.

## Migrated Files

### 1. `lib/utils/sanitize.ts`
**Source:** `CRM/lib/utils/sanitize.js`

**Purpose:** HTML sanitization and XSS prevention

**Key Functions:**
- `sanitizeHtml()` - Sanitize HTML with configurable rules
- `sanitizeEmailHtml()` - Permissive sanitization for email templates
- `sanitizeText()` - Strip all HTML, text only
- `escapeHtml()` - Escape special characters
- `sanitizeUrl()` - Validate and sanitize URLs
- `sanitizeFilename()` - Prevent path traversal attacks
- `renderTemplate()` - Safe template variable replacement

**Changes:**
- Converted to TypeScript with proper types
- No MongoDB dependencies to remove
- Added type safety for all parameters

**Dependencies:**
- `isomorphic-dompurify` - Installed ✓

---

### 2. `lib/utils/quota-manager.ts`
**Source:** `CRM/lib/quota-manager.js`

**Purpose:** Organization quota management and validation

**Key Functions:**
- `getOrganizationWithUsage()` - Fetch org with usage stats
- `validateQuotas()` - Validate quota changes
- `checkQuotaLimit()` - Check if quota is reached
- `updateUsageStats()` - Recalculate usage statistics
- `getQuotasWithUsage()` - Get quotas with current usage
- `getOrganizationsWithQuotaAlerts()` - Find orgs exceeding quotas

**Changes:**
- ✅ Replaced `clientPromise` with `prisma` client
- ✅ Replaced `db.collection('cabinets')` with `prisma.cabinet`
- ✅ Replaced `db.collection('conseillers')` with `prisma.user`
- ✅ Replaced `db.collection('particuliers')` with `prisma.client`
- ✅ Replaced `ObjectId()` with string IDs (cuid)
- ✅ Replaced `.findOne()` with `.findUnique()`
- ✅ Replaced `.countDocuments()` with `.count()`
- ✅ Replaced `.updateOne()` with `.update()`
- ✅ Converted to TypeScript with proper types

**Prisma Adaptations:**
```typescript
// Before (MongoDB)
const org = await db.collection('cabinets').findOne({
  _id: new ObjectId(cabinetId)
});

// After (Prisma)
const org = await prisma.cabinet.findUnique({
  where: { id: cabinetId }
});
```

---

### 3. `lib/utils/plan-definitions.ts`
**Source:** `CRM/lib/plan-definitions.js`

**Purpose:** Subscription plan definitions and utilities

**Key Constants:**
- `PLAN_DEFINITIONS` - All plan configurations
- `ORGANIZATION_STATUS` - Organization status types
- `STATUS_DESCRIPTIONS` - Status display info

**Key Functions:**
- `getPlanDefinition()` - Get plan by name
- `getAllPlans()` - List all available plans
- `isUnlimited()` - Check if quota is unlimited (-1)
- `formatQuota()` - Format quota for display
- `calculateMRR()` - Calculate monthly recurring revenue
- `getNextPlan()` - Get upgrade path
- `comparePlans()` - Compare plan tiers

**Changes:**
- Converted to TypeScript with interfaces
- Added `PlanDefinition`, `PlanQuotas`, `PlanFeatures` types
- Added `OrganizationStatus` type
- No MongoDB dependencies to remove

---

### 4. `lib/utils/document-categories.ts`
**Source:** `CRM/lib/document-categories.js`

**Purpose:** Document type definitions and compliance tracking

**Key Constants:**
- `DOCUMENT_CATEGORIES` - All document categories and types

**Key Functions:**
- `calculateDocumentCompleteness()` - Calculate KYC/compliance score
- `getDocumentTypeDetails()` - Get document type info
- `getAllDocumentTypes()` - List all types for selects

**Changes:**
- Converted to TypeScript with interfaces
- Added `DocumentType`, `DocumentCategory` types
- Added `DocumentCompletenessResult` interface
- No MongoDB dependencies to remove
- Works with Prisma document models

---

### 5. `lib/utils.ts` (Enhanced)
**Source:** `CRM/lib/utils.js`

**Purpose:** General utility functions

**Existing Functions:**
- `cn()` - Tailwind class merger
- `formatCurrency()` - Format amounts
- `formatDate()` - Format dates
- `debounce()` - Debounce function calls
- `getInitials()` - Generate initials
- `truncate()` - Truncate text

**New Functions Added:**
- `formatPercentage()` - Format percentages
- `formatNumber()` - Format numbers with separators
- `daysBetween()` - Calculate days between dates
- `isPast()` - Check if date is past
- `isFuture()` - Check if date is future
- `capitalize()` - Capitalize first letter
- `generateId()` - Generate random IDs

**Changes:**
- Enhanced TypeScript types
- Added more utility functions
- Improved type safety

---

### 6. `lib/utils/index.ts` (New)
**Purpose:** Central export point for all utilities

**Exports:**
- All functions from `lib/utils.ts`
- All functions from `lib/utils/sanitize.ts`
- All functions from `lib/utils/quota-manager.ts`
- All functions from `lib/utils/plan-definitions.ts`
- All functions from `lib/utils/document-categories.ts`

**Usage:**
```typescript
// Import from single location
import { 
  formatCurrency, 
  sanitizeHtml, 
  checkQuotaLimit,
  getPlanDefinition,
  calculateDocumentCompleteness 
} from '@/lib/utils';
```

---

## MongoDB → Prisma Mapping

### Collections → Models
| MongoDB Collection | Prisma Model |
|-------------------|--------------|
| `cabinets` | `Cabinet` |
| `conseillers` | `User` |
| `particuliers` | `Client` |

### Query Methods
| MongoDB | Prisma |
|---------|--------|
| `.findOne()` | `.findUnique()` |
| `.find()` | `.findMany()` |
| `.countDocuments()` | `.count()` |
| `.updateOne()` | `.update()` |
| `.insertOne()` | `.create()` |
| `.deleteOne()` | `.delete()` |

### ID Handling
| MongoDB | Prisma |
|---------|--------|
| `ObjectId(id)` | `id` (string/cuid) |
| `_id` | `id` |
| `new ObjectId()` | Auto-generated cuid |

---

## Testing

### Test Files Created
1. `lib/utils/__tests__/utils.test.ts` - General utilities
2. `lib/utils/__tests__/sanitize.test.ts` - Sanitization
3. `lib/utils/__tests__/plan-definitions.test.ts` - Plan definitions
4. `lib/utils/__tests__/document-categories.test.ts` - Document categories

### Running Tests
```bash
npm test -- lib/utils
```

---

## Dependencies Added

### New Dependencies
- `isomorphic-dompurify` - HTML sanitization (SSR compatible)

### Existing Dependencies Used
- `@prisma/client` - Database access
- `clsx` - Class name utilities
- `tailwind-merge` - Tailwind class merging

---

## Usage Examples

### Sanitization
```typescript
import { sanitizeHtml, sanitizeUrl } from '@/lib/utils';

const clean = sanitizeHtml(userInput);
const safeUrl = sanitizeUrl(userProvidedUrl);
```

### Quota Management
```typescript
import { checkQuotaLimit, updateUsageStats } from '@/lib/utils';

const canAdd = await checkQuotaLimit(cabinetId, 'particuliers', conseillerId);
if (canAdd) {
  // Create client
  await updateUsageStats(cabinetId);
}
```

### Plan Definitions
```typescript
import { getPlanDefinition, isUnlimited } from '@/lib/utils';

const plan = getPlanDefinition(cabinet.plan);
const unlimited = isUnlimited(plan.quotas.maxAdvisors);
```

### Document Compliance
```typescript
import { calculateDocumentCompleteness } from '@/lib/utils';

const result = calculateDocumentCompleteness(
  client.documents,
  client.patrimoine
);

console.log(`KYC Score: ${result.score}%`);
console.log(`Missing: ${result.missingDocs.length} documents`);
```

---

## Breaking Changes

### None
All utilities maintain backward-compatible APIs. The only changes are:
1. TypeScript types added (compile-time only)
2. Internal implementation uses Prisma instead of MongoDB
3. Async functions now properly typed with Promise<T>

---

## Next Steps

1. ✅ Migrate utility files
2. ✅ Adapt for Prisma
3. ✅ Add TypeScript types
4. ✅ Create tests
5. ⏳ Update imports in existing code (as needed)
6. ⏳ Run integration tests

---

## Files Created

```
alfi-crm/lib/utils/
├── index.ts                          # Central export
├── sanitize.ts                       # HTML sanitization
├── quota-manager.ts                  # Quota management
├── plan-definitions.ts               # Plan configurations
├── document-categories.ts            # Document types
└── __tests__/
    ├── utils.test.ts                 # General utils tests
    ├── sanitize.test.ts              # Sanitization tests
    ├── plan-definitions.test.ts      # Plan tests
    └── document-categories.test.ts   # Document tests
```

---

## Status: ✅ COMPLETE

All utility files have been successfully migrated and adapted for Prisma.
