# Task 18: Client360 Migration Plan

## Status: IN PROGRESS

## Overview
Migrate the Client360 page from CRM to alfi-crm with Bento Grid enhancements while preserving all functionality.

## Current State Analysis

### alfi-crm (Destination) - EXISTING
✅ Basic Client360 page structure exists at `app/dashboard/clients/[id]/page.tsx`
✅ Basic Tab components exist:
- TabOverview.tsx - Basic KPIs and allocation charts
- TabProfile.tsx - Basic personal/professional/fiscal info
- TabWealth.tsx - Basic wealth management with tabs
- TabKYC.tsx - Basic KYC status and MIF II profile
- TabDocuments.tsx - Basic document listing
- TabObjectives.tsx - Basic objectives listing
- TabOpportunities.tsx - Basic opportunities listing
- TabTimeline.tsx - Basic timeline/activity

### CRM (Source) - TO MIGRATE
🔄 Enhanced Client360 with advanced features:
- TabOverview.jsx - Advanced with alerts, calculations, quick links
- TabFamily.jsx - Complete family management with fiscal calculations
- TabBudget.jsx - Budget analysis (NOT in alfi-crm)
- TabTaxation.jsx - Tax analysis (NOT in alfi-crm)
- TabWealth.jsx - Advanced wealth with leverage, liquidity ratios
- TabContracts.jsx - Insurance contracts (NOT in alfi-crm)
- TabObjectives.jsx - Enhanced objectives
- TabKYC.jsx - Enhanced KYC with MIF II questionnaire
- TabDocuments.jsx - Enhanced document management
- TabTimeline.jsx - Enhanced timeline

## Migration Strategy

### Phase 1: Enhance Existing Tabs (Subtasks 18.1-18.7)
For each existing tab, ADD features from CRM while keeping Prisma structure:

#### 18.1 TabProfile ✅ EXISTS - ENHANCE
**Current**: Basic info display
**Add from CRM**:
- Family members inline display
- Edit capabilities
- More detailed fiscal information
- Professional status details

#### 18.2 TabKYC ✅ EXISTS - ENHANCE  
**Current**: Basic KYC status
**Add from CRM**:
- MIF II questionnaire form
- Document upload/validation
- PEP status management
- Compliance officer notes
- LCB-FT section

#### 18.3 TabWealth ✅ EXISTS - ENHANCE + BENTO GRID
**Current**: Basic wealth display with tabs
**Add from CRM**:
- Liquidity ratio calculations
- Leverage effect calculations
- Asset sorting options
- Asset/liability linking
- Managed vs unmanaged breakdown
**Apply**: Bento Grid layout for KPIs and charts

#### 18.4 TabDocuments ✅ EXISTS - ENHANCE
**Current**: Basic document listing
**Add from CRM**:
- Document categories
- Upload functionality
- Document versioning
- Access control

#### 18.5 TabObjectives ✅ EXISTS - ENHANCE
**Current**: Basic objectives listing
**Add from CRM**:
- Progress calculations
- Create/edit objectives
- Link to simulations
- Priority management

#### 18.6 TabOpportunities ✅ EXISTS - ENHANCE
**Current**: Basic opportunities listing
**Add from CRM**:
- Scoring display
- Actions on opportunities
- Conversion tracking
- Priority indicators

#### 18.7 TabTimeline ✅ EXISTS - ENHANCE
**Current**: Basic timeline
**Add from CRM**:
- All event types
- Add event functionality
- Filtering
- Event details

### Phase 2: Add Missing Tabs
Create NEW tabs that don't exist in alfi-crm:

#### TabFamily (NEW)
- Complete family member management
- Fiscal calculations (tax shares, household income)
- Dependent children tracking
- Family alerts

#### TabBudget (NEW - Optional)
- Budget analysis
- Income/expense tracking
- Budget recommendations

#### TabTaxation (NEW - Optional)
- Tax analysis
- Tax optimization suggestions
- Tax bracket calculations

#### TabContracts (NEW - Optional)
- Insurance contracts
- Contract management
- Premium tracking

### Phase 3: Apply Bento Grid
Apply Bento Grid layouts to:
- TabOverview - Asymmetric KPI layout
- TabWealth - Chart hero for allocation

## API Adaptations Required

### MongoDB → Prisma Conversions

```typescript
// Family Members
MongoDB: client.familyMembers (embedded)
Prisma: FamilyMember model with clientId relation

// Assets/Liabilities
MongoDB: Actif/Passif collections
Prisma: Actif/Passif models (already exist)

// KYC Documents
MongoDB: Embedded documents
Prisma: KYCDocument model with clientId relation

// Timeline Events
MongoDB: Embedded events
Prisma: AuditLog or TimelineEvent model
```

## Implementation Order

1. ✅ Update main Client360 page (app/dashboard/clients/[id]/page.tsx)
2. 🔄 Enhance TabProfile (18.1)
3. 🔄 Enhance TabKYC (18.2)
4. 🔄 Enhance TabWealth with Bento Grid (18.3)
5. 🔄 Enhance TabDocuments (18.4)
6. 🔄 Enhance TabObjectives (18.5)
7. 🔄 Enhance TabOpportunities (18.6)
8. 🔄 Enhance TabTimeline (18.7)
9. ⏳ Create TabFamily (NEW)
10. ⏳ Apply Bento Grid to TabOverview

## Key Principles

1. **Preserve Existing**: Don't break what works in alfi-crm
2. **Add Features**: Enhance with CRM features
3. **Prisma First**: All data access through Prisma
4. **TypeScript**: Convert JSX to TSX
5. **Bento Grid**: Apply where specified in requirements
6. **Test**: Verify each tab works before moving to next

## Files to Create/Modify

### Modify (Enhance existing)
- ✅ app/dashboard/clients/[id]/page.tsx
- 🔄 components/client360/TabProfile.tsx
- 🔄 components/client360/TabKYC.tsx
- 🔄 components/client360/TabWealth.tsx
- 🔄 components/client360/TabDocuments.tsx
- 🔄 components/client360/TabObjectives.tsx
- 🔄 components/client360/TabOpportunities.tsx
- 🔄 components/client360/TabTimeline.tsx

### Create (New)
- ⏳ components/client360/TabFamily.tsx
- ⏳ components/client360/TabBudget.tsx (optional)
- ⏳ components/client360/TabTaxation.tsx (optional)
- ⏳ components/client360/TabContracts.tsx (optional)

### API Routes (May need to create/enhance)
- ⏳ app/api/clients/[id]/family/route.ts
- ⏳ app/api/clients/[id]/kyc/route.ts
- ⏳ app/api/clients/[id]/alerts/route.ts
- ⏳ app/api/family/[id]/route.ts

## Success Criteria

- [ ] All existing tabs enhanced with CRM features
- [ ] TabFamily created and functional
- [ ] Bento Grid applied to TabOverview and TabWealth
- [ ] All data fetched via Prisma
- [ ] TypeScript types correct
- [ ] No MongoDB dependencies
- [ ] Responsive design maintained
- [ ] All CRUD operations work
- [ ] Client360 page loads without errors

## Notes

- The CRM source has MUCH more functionality than current alfi-crm
- Need to be selective about which features to migrate
- Focus on core features first, optional features later
- Bento Grid should enhance UX, not complicate it
- Keep performance in mind - don't over-fetch data
