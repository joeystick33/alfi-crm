# Manual Testing Guide - alfi-crm

Quick reference guide for manually testing all pages in the application.

## Prerequisites

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Ensure database is seeded**:
   ```bash
   npx tsx scripts/seed-test-data.ts
   ```

3. **Test credentials**:
   - **Advisor**: Use your existing user account
   - **Client**: Check client portal credentials in database
   - **SuperAdmin**: Check superadmin credentials

## Testing Checklist

### 🔐 Authentication (1 page)

- [ ] **Login Page** (`/login`)
  - [ ] Page loads without errors
  - [ ] Form validation works
  - [ ] Login with valid credentials works
  - [ ] Error messages display for invalid credentials
  - [ ] Redirect to dashboard after login

---

### 📊 Dashboard Pages (15 pages)

#### Main Dashboard
- [ ] **Dashboard** (`/dashboard`)
  - [ ] Page loads without console errors
  - [ ] All 6 KPI cards display with correct data
  - [ ] Bento Grid layout renders properly
  - [ ] Hero card (Clients) is larger (2x2)
  - [ ] Other cards are standard size (2x1)
  - [ ] Widgets load (Today, Tasks, Calendar, Opportunities, Alerts)
  - [ ] Refresh button works
  - [ ] Click on KPI cards navigates to correct pages
  - [ ] Responsive: Test on mobile, tablet, desktop

#### Clients
- [ ] **Clients List** (`/dashboard/clients`)
  - [ ] Page loads without errors
  - [ ] Client list displays
  - [ ] Search works
  - [ ] Filters work
  - [ ] Create client button opens modal
  - [ ] Click on client navigates to Client360

- [ ] **Client360** (`/dashboard/clients/[id]`)
  - [ ] Page loads with client data
  - [ ] All 8 tabs are present
  - [ ] **Tab Overview**: Summary displays
  - [ ] **Tab Profile**: Client info displays, edit works
  - [ ] **Tab KYC**: KYC status displays, documents list
  - [ ] **Tab Wealth**: Bento Grid layout, charts display
  - [ ] **Tab Documents**: Document list, upload works
  - [ ] **Tab Objectives**: Objectives list, create works
  - [ ] **Tab Opportunities**: Opportunities list
  - [ ] **Tab Timeline**: Timeline events display

- [ ] **Client Opportunities** (`/dashboard/clients/opportunites`)
  - [ ] Page loads
  - [ ] Opportunities list displays
  - [ ] Filters work

- [ ] **Client Actions** (`/dashboard/clients/actions`)
  - [ ] Page loads
  - [ ] Actions list displays

#### Patrimoine
- [ ] **Patrimoine Overview** (`/dashboard/patrimoine`)
  - [ ] Page loads
  - [ ] Summary displays
  - [ ] Charts display

- [ ] **Actifs** (`/dashboard/patrimoine/actifs`)
  - [ ] Page loads
  - [ ] Assets list displays
  - [ ] Create asset works
  - [ ] Edit asset works
  - [ ] Delete asset works

- [ ] **Passifs** (`/dashboard/patrimoine/passifs`)
  - [ ] Page loads
  - [ ] Liabilities list displays
  - [ ] CRUD operations work

- [ ] **Contrats** (`/dashboard/patrimoine/contrats`)
  - [ ] Page loads
  - [ ] Contracts list displays
  - [ ] CRUD operations work

#### Objectifs & Projets
- [ ] **Objectifs** (`/dashboard/objectifs`)
  - [ ] Page loads
  - [ ] Objectives list displays
  - [ ] Create objective works
  - [ ] Progress bars display correctly

- [ ] **Projets** (`/dashboard/projets`)
  - [ ] Page loads
  - [ ] Projects list displays
  - [ ] CRUD operations work

#### Opportunités
- [ ] **Opportunités** (`/dashboard/opportunites`)
  - [ ] Page loads
  - [ ] Opportunities list displays
  - [ ] Pipeline view works
  - [ ] Status updates work

#### Tâches & Agenda
- [ ] **Tâches** (`/dashboard/taches`)
  - [ ] Page loads
  - [ ] Tasks list displays
  - [ ] Create task works
  - [ ] Mark as complete works
  - [ ] Filters work (status, priority, due date)

- [ ] **Agenda** (`/dashboard/agenda`)
  - [ ] Page loads
  - [ ] Calendar displays
  - [ ] Appointments show on calendar
  - [ ] Create appointment works
  - [ ] Edit appointment works
  - [ ] Delete appointment works

#### Notifications & Admin
- [ ] **Notifications** (`/dashboard/notifications`)
  - [ ] Page loads
  - [ ] Notifications list displays
  - [ ] Mark as read works
  - [ ] Filters work

- [ ] **Audit Logs** (`/dashboard/admin/audit`)
  - [ ] Page loads (admin only)
  - [ ] Audit logs display
  - [ ] Filters work
  - [ ] Pagination works

---

### 🧮 Calculator Pages (11 pages)

- [ ] **Calculators Index** (`/dashboard/calculators`)
  - [ ] Page loads
  - [ ] All calculator cards display
  - [ ] Click navigates to calculator

#### Simple Tax Calculators (Chart Hero Template)
- [ ] **Income Tax** (`/dashboard/calculators/income-tax`)
  - [ ] Page loads
  - [ ] Form inputs work
  - [ ] Calculation executes
  - [ ] Chart displays in hero card (4x3)
  - [ ] KPIs display in satellite cards (2x1)
  - [ ] Results are accurate
  - [ ] Save simulation works

- [ ] **Capital Gains Tax** (`/dashboard/calculators/capital-gains-tax`)
  - [ ] Same checks as Income Tax

- [ ] **Wealth Tax** (`/dashboard/calculators/wealth-tax`)
  - [ ] Same checks as Income Tax

- [ ] **Inheritance Tax** (`/dashboard/calculators/inheritance-tax`)
  - [ ] Same checks as Income Tax

- [ ] **Donation Tax** (`/dashboard/calculators/donation-tax`)
  - [ ] Same checks as Income Tax

#### Complex Calculators (Dual Charts Template)
- [ ] **Budget Analyzer** (`/dashboard/calculators/budget-analyzer`)
  - [ ] Page loads
  - [ ] Form inputs work
  - [ ] Two charts display side by side (4x3 each)
  - [ ] Health indicator displays in hero card
  - [ ] KPIs display in small cards
  - [ ] Results are accurate
  - [ ] Responsive: Charts stack on tablet

- [ ] **Debt Capacity** (`/dashboard/calculators/debt-capacity`)
  - [ ] Same checks as Budget Analyzer

#### Objective Calculators
- [ ] **Objective Calculator** (`/dashboard/calculators/objective`)
  - [ ] Page loads
  - [ ] Form works
  - [ ] Calculation works
  - [ ] Results display

- [ ] **Multi-Objective** (`/dashboard/calculators/multi-objective`)
  - [ ] Page loads
  - [ ] Multiple objectives can be added
  - [ ] Calculations work
  - [ ] Results display

- [ ] **Home Purchase** (`/dashboard/calculators/home-purchase`)
  - [ ] Page loads
  - [ ] Form works
  - [ ] Calculation works
  - [ ] Results display

---

### 📈 Simulator Pages (5 pages)

- [ ] **Simulators Index** (`/dashboard/simulators`)
  - [ ] Page loads
  - [ ] All simulator cards display
  - [ ] Click navigates to simulator

#### Retirement Simulators (Timeline Template)
- [ ] **Retirement Simulator** (`/dashboard/simulators/retirement`)
  - [ ] Page loads
  - [ ] Form inputs work
  - [ ] Timeline displays in large hero card (6x4)
  - [ ] KPIs display in sidebar (2x2 each)
  - [ ] Feasibility indicator displays full-width
  - [ ] Calculation executes
  - [ ] Results are accurate
  - [ ] Save simulation works
  - [ ] Responsive: Timeline + KPIs stack on mobile

- [ ] **Retirement Comparison** (`/dashboard/simulators/retirement-comparison`)
  - [ ] Same checks as Retirement Simulator
  - [ ] Comparison view works

#### Succession Simulators (Timeline Template)
- [ ] **Succession Simulator** (`/dashboard/simulators/succession`)
  - [ ] Page loads
  - [ ] Projection displays in large hero card (6x4)
  - [ ] KPIs display in sidebar (2x2)
  - [ ] Recommendations display full-width
  - [ ] Calculation works
  - [ ] Results accurate
  - [ ] Save works

- [ ] **Tax Strategy Comparison** (`/dashboard/simulators/tax-strategy-comparison`)
  - [ ] Page loads
  - [ ] Multiple strategies can be compared
  - [ ] Charts display
  - [ ] Results accurate

---

### 👤 Client Portal Pages (7 pages)

**Note**: Login as a client using portal credentials

- [ ] **Client Dashboard** (`/client/dashboard`)
  - [ ] Page loads
  - [ ] Client sees only their own data
  - [ ] Stats cards display
  - [ ] Patrimoine breakdown displays
  - [ ] Recent activity displays
  - [ ] Quick actions work

- [ ] **Client Patrimoine** (`/client/patrimoine`)
  - [ ] Page loads
  - [ ] Client can view their patrimoine
  - [ ] Charts display
  - [ ] Read-only (no edit buttons)

- [ ] **Client Objectifs** (`/client/objectifs`)
  - [ ] Page loads
  - [ ] Client can view their objectives
  - [ ] Progress displays
  - [ ] Read-only

- [ ] **Client Documents** (`/client/documents`)
  - [ ] Page loads
  - [ ] Client can view their documents
  - [ ] Download works
  - [ ] Cannot see other clients' documents

- [ ] **Client Rendez-vous** (`/client/rendez-vous`)
  - [ ] Page loads
  - [ ] Client can view their appointments
  - [ ] Calendar displays
  - [ ] Cannot see other clients' appointments

- [ ] **Client Messages** (`/client/messages`)
  - [ ] Page loads
  - [ ] Client can view messages with their advisor
  - [ ] Send message works
  - [ ] Cannot see other clients' messages

- [ ] **Client Profil** (`/client/profil`)
  - [ ] Page loads
  - [ ] Client can view their profile
  - [ ] Edit profile works
  - [ ] Change password works

---

### 👨‍💼 SuperAdmin Pages (1 page)

**Note**: Login as SuperAdmin

- [ ] **SuperAdmin Dashboard** (`/superadmin`)
  - [ ] Page loads (SuperAdmin only)
  - [ ] Global metrics display
  - [ ] Organizations list displays
  - [ ] Create organization works
  - [ ] Edit organization works
  - [ ] Quota management works
  - [ ] Plan management works
  - [ ] Audit logs display
  - [ ] Cannot access as regular user

---

## Common Checks for All Pages

For each page, verify:

### Console Errors
- [ ] No errors in browser console
- [ ] No warnings (or only expected warnings)
- [ ] No 404 errors for resources

### Data Display
- [ ] Data loads correctly
- [ ] Loading states display while fetching
- [ ] Empty states display when no data
- [ ] Error states display on API errors

### Navigation
- [ ] Sidebar navigation works
- [ ] Breadcrumbs display correctly
- [ ] Back button works
- [ ] Links navigate to correct pages

### Responsive Design
- [ ] **Mobile** (< 768px): Layout adapts, no horizontal scroll
- [ ] **Tablet** (768px - 1024px): Layout adapts properly
- [ ] **Desktop** (> 1024px): Full layout displays

### Accessibility
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Screen reader compatible (test with VoiceOver/NVDA)
- [ ] Color contrast meets WCAG AA standards
- [ ] Zoom to 200% works without breaking layout

### Performance
- [ ] Page loads in < 3 seconds
- [ ] First Contentful Paint < 1.5 seconds
- [ ] No layout shift (CLS < 0.1)
- [ ] Animations smooth (60fps)

---

## Testing Tools

### Browser DevTools
- **Console**: Check for errors
- **Network**: Check API calls
- **Performance**: Measure load times
- **Lighthouse**: Run accessibility and performance audits

### Browser Extensions
- **React DevTools**: Inspect component tree
- **axe DevTools**: Check accessibility
- **WAVE**: Check accessibility

### Screen Readers
- **macOS**: VoiceOver (Cmd + F5)
- **Windows**: NVDA (free)
- **Chrome**: ChromeVox extension

---

## Reporting Issues

When you find an issue, document:

1. **Page**: Which page/route
2. **Steps**: How to reproduce
3. **Expected**: What should happen
4. **Actual**: What actually happens
5. **Console**: Any console errors
6. **Screenshot**: If visual issue
7. **Browser**: Browser and version
8. **Device**: Desktop/tablet/mobile

---

## Quick Test Commands

```bash
# Start dev server
npm run dev

# Run TypeScript check
npx tsc --noEmit

# Run automated tests
npx tsx scripts/test-all-pages.ts

# Seed test data
npx tsx scripts/seed-test-data.ts

# Check database
npx prisma studio
```

---

**Last Updated**: November 15, 2025  
**Total Pages to Test**: 41  
**Estimated Testing Time**: 3-4 hours for complete manual testing
