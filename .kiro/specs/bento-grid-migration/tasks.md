# Implementation Plan - Migration Bento Grid

## Phase 1: Foundation & Design System

- [ ] 1. Set up Bento Grid design system
  - Create CSS variables for Bento Grid system in globals.css
  - Add Tailwind configuration for custom grid utilities
  - Set up responsive breakpoints (mobile: 1 col, tablet: 4 cols, desktop: 6-8 cols)
  - _Requirements: 1.1, 1.3_

- [ ] 1.1 Create BentoGrid base component
  - Implement BentoGrid component with cols, rows, gap props
  - Add responsive behavior with breakpoint support
  - Implement 'stack', 'adapt', 'custom' responsive modes
  - Add TypeScript interfaces and prop validation
  - _Requirements: 1.1, 1.3_

- [ ] 1.2 Create BentoCard base component
  - Implement BentoCard with span (cols/rows) support
  - Add variant props: 'default', 'hero', 'accent', 'gradient'
  - Implement hover effects and click handlers
  - Add dark mode support with CSS variables
  - _Requirements: 1.2, 1.4, 1.5, 13.1, 13.2, 13.3_

- [ ] 1.3 Create BentoKPI specialized component
  - Implement BentoKPI with label, value, icon props
  - Add trend indicator support (up/down arrows with percentage)
  - Implement variant colors: default, success, warning, error
  - Add responsive sizing
  - _Requirements: 1.2, 1.4_

- [ ] 1.4 Create BentoChart wrapper component
  - Implement BentoChart with title, description props
  - Add ResponsiveContainer integration for Recharts
  - Implement hero variant for large charts
  - Add loading skeleton state
  - _Requirements: 1.2, 1.4_


- [ ] 1.5 Write unit tests for base components
  - Test BentoGrid layout calculations and responsive behavior
  - Test BentoCard span props and variant rendering
  - Test BentoKPI with different variants and trends
  - Test BentoChart with ResponsiveContainer
  - _Requirements: 15.1, 15.2_

- [ ] 1.6 Create error boundary for Bento components
  - Implement BentoErrorBoundary component
  - Add fallback UI for error states
  - Integrate error logging
  - _Requirements: 14.3_

- [ ] 1.7 Set up performance optimizations
  - Add CSS Grid optimizations (will-change, contain)
  - Implement lazy loading for charts with useInView
  - Add memoization for BentoCard components
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

## Phase 2: Templates Creation

- [ ] 2. Create reusable calculator/simulator templates
  - Build template infrastructure
  - Create 3 main templates: ChartHero, DualCharts, Timeline
  - Document template usage patterns
  - _Requirements: 6.1, 7.1, 9.1_

- [ ] 2.1 Create ChartHeroTemplate
  - Implement template with inputs, chart, KPIs, details sections
  - Configure grid: chart (4x3), KPIs sidebar (2x1 each)
  - Add responsive behavior (stack on mobile)
  - Create TypeScript interface for template props
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 2.2 Create DualChartsTemplate
  - Implement template with health indicator, two charts, KPIs
  - Configure grid: 8 cols, charts (4x3 each), KPIs (2x1 each)
  - Add responsive behavior (stack charts on tablet)
  - Create TypeScript interface for template props
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 2.3 Create TimelineTemplate
  - Implement template with feasibility, timeline, KPIs sidebar, secondary chart
  - Configure grid: timeline (6x4), KPIs sidebar (2x2 each)
  - Add responsive behavior (stack on mobile)
  - Create TypeScript interface for template props
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 2.4 Write integration tests for templates
  - Test ChartHeroTemplate with sample data
  - Test DualChartsTemplate with sample data
  - Test TimelineTemplate with sample data
  - Test responsive behavior for all templates
  - _Requirements: 15.4_

- [ ] 2.5 Create template documentation
  - Document usage examples for each template
  - Create visual diagrams of template layouts
  - Add migration guide for existing components
  - _Requirements: 14.5_

## Phase 3: Dashboard Migration

- [ ] 3. Migrate Dashboard principal to Bento Grid
  - Refactor dashboard page with BentoGrid layout
  - Prioritize important KPIs with larger cards
  - Test responsive behavior
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3.1 Refactor Dashboard KPI cards
  - Convert 6 KPI cards to BentoKPI components
  - Assign spans: Clients (2x1), Tasks (2x1), Appointments (2x1), etc.
  - Highlight priority KPIs with hero variant
  - Add trend indicators where applicable
  - _Requirements: 2.1, 2.2_

- [ ] 3.2 Implement Dashboard responsive layout
  - Configure mobile: single column stack
  - Configure tablet: 4 columns grid
  - Configure desktop: 6 columns grid
  - Test all breakpoints
  - _Requirements: 2.3, 10.1, 10.2, 10.3_

- [ ] 3.3 Add loading and error states
  - Implement skeleton loaders matching Bento layout
  - Add error boundary with fallback UI
  - Test loading states
  - _Requirements: 2.4, 2.5_

## Phase 4: Client360 Migration

- [ ] 4. Migrate Client360 tabs to Bento Grid
  - Refactor all 9 Client360 tabs with Bento layouts
  - Prioritize visual hierarchy in each tab
  - Test responsive behavior across tabs
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4.1 Migrate TabOverview
  - Convert 4 KPI cards to BentoKPI (2x1 each)
  - Convert allocation charts to BentoChart (4x3 each, side by side)
  - Add alerts section in full-width hero card if alerts exist
  - Add simulation history in large BentoCard
  - Add timeline in medium BentoCard
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4.2 Migrate TabWealth
  - Convert wealth summary KPIs to small BentoKPI cards
  - Convert main allocation chart to large hero BentoChart (6x4)
  - Convert asset breakdown to medium BentoCards
  - Implement responsive grid (4 cols on tablet)
  - Add empty state in centered BentoCard
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4.3 Migrate TabKYC
  - Convert KYC status to hero BentoCard
  - Convert KYC fields to BentoCards with appropriate spans
  - Add document upload section in BentoCard
  - _Requirements: 3.1, 3.2_

- [ ] 4.4 Migrate TabProfile
  - Convert profile sections to BentoCards
  - Organize personal info, contact, professional info in grid
  - Add edit mode support
  - _Requirements: 3.1, 3.2_

- [ ] 4.5 Migrate TabDocuments
  - Convert document list to BentoCard grid
  - Add document preview in large BentoCard
  - Implement document filters in compact BentoCard
  - _Requirements: 3.1, 3.2_

- [ ] 4.6 Migrate TabObjectives
  - Convert objectives list to BentoCards
  - Add progress visualization in BentoChart
  - Implement objective details in expandable BentoCards
  - _Requirements: 3.1, 3.2_

- [ ] 4.7 Migrate TabOpportunities
  - Convert opportunities to BentoCard grid
  - Add opportunity pipeline visualization
  - Implement filters in compact BentoCard
  - _Requirements: 3.1, 3.2_

- [ ] 4.8 Migrate TabTimeline
  - Convert timeline events to BentoCards
  - Add timeline visualization in large BentoChart
  - Implement event filters
  - _Requirements: 3.1, 3.2_

- [ ] 4.9 Test Client360 responsive behavior
  - Test all tabs on mobile (single column)
  - Test all tabs on tablet (4 columns)
  - Test all tabs on desktop (6-8 columns)
  - Verify smooth transitions between breakpoints
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

## Phase 5: Simple Calculators Migration

- [ ] 5. Migrate simple calculators using ChartHeroTemplate
  - Migrate 7 simple calculators to Bento Grid
  - Use ChartHeroTemplate for consistent layout
  - Test all calculators
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 5.1 Migrate IncomeTaxCalculator
  - Refactor with ChartHeroTemplate
  - Main chart: tax breakdown (4x3 hero)
  - KPIs: taxable income, tax, rate (2x1 each)
  - Details: breakdown table (full width)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3_

- [ ] 5.2 Migrate WealthTaxCalculator
  - Refactor with ChartHeroTemplate
  - Main chart: IFI breakdown (4x3 hero)
  - KPIs: total wealth, IFI, rate (2x1 each)
  - Details: bracket table (full width)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3_

- [ ] 5.3 Migrate CapitalGainsTaxCalculator
  - Refactor with ChartHeroTemplate
  - Main chart: gains breakdown (4x3 hero)
  - KPIs: gross gains, tax, net gains (2x1 each)
  - Details: calculation details (full width)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3_

- [ ] 5.4 Migrate DonationTaxCalculator
  - Refactor with ChartHeroTemplate
  - Main chart: donation tax breakdown (4x3 hero)
  - KPIs: donation amount, allowance, tax (2x1 each)
  - Details: bracket table (full width)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3_

- [ ] 5.5 Migrate InheritanceTaxCalculator
  - Refactor with ChartHeroTemplate
  - Main chart: inheritance tax breakdown (4x3 hero)
  - KPIs: gross inheritance, allowance, tax (2x1 each)
  - Details: heir breakdown table (full width)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3_

- [ ] 5.6 Migrate DebtCapacityCalculator
  - Refactor with ChartHeroTemplate
  - Main chart: debt capacity visualization (4x3 hero)
  - KPIs: income, debt ratio, capacity (2x1 each)
  - Details: calculation breakdown (full width)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3_

- [ ] 5.7 Migrate ObjectiveCalculator
  - Refactor with ChartHeroTemplate
  - Main chart: savings projection (4x3 hero)
  - KPIs: target, monthly savings, duration (2x1 each)
  - Details: milestone table (full width)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3_

- [ ] 5.8 Test simple calculators
  - Test all calculators with sample data
  - Verify chart rendering in hero position
  - Test responsive behavior on all breakpoints
  - Verify KPIs display correctly
  - _Requirements: 5.5, 10.1, 10.2, 10.3_

## Phase 6: Complex Calculators Migration

- [ ] 6. Migrate complex calculators using DualChartsTemplate
  - Migrate 5 complex calculators to Bento Grid
  - Use DualChartsTemplate for dual-chart layouts
  - Test all calculators
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6.1 Migrate BudgetAnalyzer
  - Refactor with DualChartsTemplate
  - Health indicator: budget health (full width hero)
  - Chart 1: income vs expenses bar chart (4x3)
  - Chart 2: expense breakdown pie chart (4x3)
  - KPIs: income, expenses, debts, available (2x1 each)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.2, 7.3_

- [ ] 6.2 Migrate MultiObjectivePlanner
  - Refactor with DualChartsTemplate
  - Chart 1: objectives timeline (4x3)
  - Chart 2: priority allocation (4x3)
  - KPIs: total objectives, completed, in progress, budget (2x1 each)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.2, 7.3_

- [ ] 6.3 Migrate HomePurchaseCalculator
  - Refactor with DualChartsTemplate
  - Chart 1: loan amortization (4x3)
  - Chart 2: cost breakdown (4x3)
  - KPIs: property price, loan amount, monthly payment, total cost (2x1 each)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.2, 7.3_

- [ ] 6.4 Migrate EducationFundingCalculator
  - Refactor with DualChartsTemplate
  - Chart 1: savings projection (4x3)
  - Chart 2: education cost breakdown (4x3)
  - KPIs: target amount, monthly savings, years, shortfall (2x1 each)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.2, 7.3_

- [ ] 6.5 Test complex calculators
  - Test all calculators with sample data
  - Verify dual charts render side by side
  - Test responsive behavior (charts stack on tablet)
  - Verify health indicators display correctly
  - _Requirements: 5.5, 7.5, 10.1, 10.2, 10.3_

## Phase 7: Timeline Simulators Migration

- [ ] 7. Migrate timeline simulators using TimelineTemplate
  - Migrate 4 timeline simulators to Bento Grid
  - Use TimelineTemplate for projection visualizations
  - Test all simulators
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 7.1 Migrate RetirementSimulator
  - Refactor with TimelineTemplate
  - Feasibility indicator: retirement feasibility (full width hero)
  - Timeline chart: savings growth projection (6x4 hero)
  - KPIs sidebar: capital at retirement, annual income (2x2 each)
  - Secondary chart: retirement income projection (4x2)
  - Recommendations: optimization tips (full width)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.2, 9.3_

- [ ] 7.2 Migrate PensionEstimator
  - Refactor with TimelineTemplate
  - Feasibility indicator: pension adequacy (full width hero)
  - Timeline chart: pension projection (6x4 hero)
  - KPIs sidebar: estimated pension, replacement rate (2x2 each)
  - Secondary chart: contribution history (4x2)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.2, 9.3_

- [ ] 7.3 Migrate TaxProjector
  - Refactor with TimelineTemplate
  - Timeline chart: tax projection over years (6x4 hero)
  - KPIs sidebar: current tax, projected tax, savings (2x2 each)
  - Secondary chart: tax optimization opportunities (4x2)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.2, 9.3_

- [ ] 7.4 Test timeline simulators
  - Test all simulators with sample data
  - Verify timeline charts render in hero position
  - Test KPIs sidebar layout
  - Test responsive behavior (stack on mobile)
  - _Requirements: 8.5, 9.5, 10.1, 10.2, 10.3_

## Phase 8: Comparison Simulators Migration

- [ ] 8. Migrate comparison simulators
  - Migrate 6 comparison simulators to Bento Grid
  - Use DualChartsTemplate or custom layouts
  - Test all simulators
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 8.1 Migrate RetirementComparison
  - Refactor with DualChartsTemplate
  - Chart 1: scenario A projection (4x3)
  - Chart 2: scenario B projection (4x3)
  - KPIs: comparison metrics (2x1 each)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 7.2, 7.3_

- [ ] 8.2 Migrate TaxStrategyComparison
  - Refactor with DualChartsTemplate
  - Chart 1: strategy A tax impact (4x3)
  - Chart 2: strategy B tax impact (4x3)
  - KPIs: tax savings, ROI (2x1 each)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 7.2, 7.3_

- [ ] 8.3 Migrate InvestmentVehicleComparison
  - Refactor with DualChartsTemplate
  - Chart 1: vehicle A performance (4x3)
  - Chart 2: vehicle B performance (4x3)
  - KPIs: returns, fees, tax efficiency (2x1 each)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 7.2, 7.3_

- [ ] 8.4 Migrate SuccessionComparison
  - Refactor with DualChartsTemplate
  - Chart 1: scenario A distribution (4x3)
  - Chart 2: scenario B distribution (4x3)
  - KPIs: total tax, net inheritance (2x1 each)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 7.2, 7.3_

- [ ] 8.5 Migrate DonationOptimizer
  - Refactor with custom Bento layout
  - Main chart: optimization timeline (6x4 hero)
  - KPIs: optimal amount, tax savings, timing (2x2 each)
  - Recommendations: optimization strategies (full width)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 8.6 Test comparison simulators
  - Test all simulators with sample data
  - Verify side-by-side chart comparisons
  - Test responsive behavior
  - Verify comparison metrics display correctly
  - _Requirements: 8.5, 10.1, 10.2, 10.3_

## Phase 9: Custom Simulators Migration

- [ ] 9. Migrate custom simulators with unique layouts
  - Migrate SuccessionSimulator with custom Bento layout
  - Test simulator
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9.1 Migrate SuccessionSimulator
  - Create custom Bento layout for succession planning
  - Assets section: asset cards in grid (2x1 each)
  - Heirs section: heir cards in grid (2x1 each)
  - Results: heir distribution chart (6x3 hero)
  - Summary KPIs: gross estate, total tax, net estate (2x1 each)
  - Recommendations: optimization tips (full width)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9.2 Test SuccessionSimulator
  - Test with multiple assets and heirs
  - Verify dynamic grid layout
  - Test responsive behavior
  - Verify calculations and visualizations
  - _Requirements: 8.5, 10.1, 10.2, 10.3_

## Phase 10: Final Testing & Optimization

- [ ] 10. Perform comprehensive testing and optimization
  - Run full test suite
  - Optimize performance
  - Verify accessibility
  - Final polish
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 15.5_

- [ ] 10.1 Run comprehensive test suite
  - Run all unit tests (target: 80% coverage)
  - Run all integration tests
  - Run visual regression tests
  - Fix any failing tests
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 10.2 Performance optimization pass
  - Measure First Contentful Paint (target: < 1.5s)
  - Measure Time to Interactive (target: < 3s)
  - Measure Cumulative Layout Shift (target: < 0.1)
  - Optimize any performance bottlenecks
  - Verify 60fps animations
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 10.3 Accessibility audit
  - Run automated accessibility tests (WCAG 2.1 AA)
  - Test keyboard navigation on all pages
  - Test screen reader compatibility
  - Verify focus indicators
  - Test 200% zoom
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 10.4 Cross-browser testing
  - Test on Chrome 90+
  - Test on Firefox 88+
  - Test on Safari 14+
  - Test on Edge 90+
  - Fix any browser-specific issues
  - _Requirements: Non-functional requirements_

- [ ] 10.5 Responsive testing
  - Test all pages on mobile (375px, 414px)
  - Test all pages on tablet (768px, 1024px)
  - Test all pages on desktop (1280px, 1920px)
  - Verify smooth transitions between breakpoints
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 10.6 Dark mode verification
  - Verify all components in dark mode
  - Check color contrast ratios
  - Test dark mode transitions
  - Fix any dark mode issues
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 10.7 Documentation finalization
  - Complete component documentation
  - Update migration guide
  - Create usage examples
  - Document known issues and workarounds
  - _Requirements: 14.5_

- [ ] 10.8 Final polish
  - Review all animations and transitions
  - Verify consistent spacing and alignment
  - Check for any visual inconsistencies
  - Final code cleanup and refactoring
  - _Requirements: All_
