# Requirements Document - Migration Bento Grid

## Introduction

Ce document définit les exigences pour la migration du design actuel du CRM ALFI vers un design system basé sur Bento Grid. La migration se concentre sur les 4 zones les plus visuelles et data-intensive de l'application : Dashboard principal, Client360, Calculateurs et Simulateurs.

L'objectif est de créer une hiérarchie visuelle claire, améliorer l'expérience utilisateur et moderniser l'interface tout en préservant toutes les fonctionnalités existantes.

## Glossary

- **Bento Grid**: Système de layout asymétrique inspiré des boîtes bento japonaises, où les éléments peuvent occuper différentes tailles de cellules dans une grille
- **BentoCard**: Composant de base représentant une cellule dans le Bento Grid, pouvant s'étendre sur plusieurs colonnes et lignes
- **Span**: Nombre de colonnes et/ou lignes qu'occupe un BentoCard dans la grille
- **Design System**: Ensemble cohérent de composants, styles et règles de design réutilisables
- **KPI Card**: Carte affichant un indicateur clé de performance (Key Performance Indicator)
- **Chart Hero**: Pattern de layout où un graphique occupe la position dominante visuellement
- **Responsive Breakpoints**: Points de rupture où le layout s'adapte aux différentes tailles d'écran
- **CRM**: Customer Relationship Management - Application de gestion de la relation client
- **Client360**: Vue complète à 360° d'un client avec tous ses onglets d'information
- **Calculator Component**: Composant permettant de calculer des valeurs fiscales ou financières
- **Simulator Component**: Composant permettant de simuler des scénarios financiers sur le long terme

---

## Requirements

### Requirement 1: Design System Bento Grid

**User Story:** En tant que développeur, je veux un design system Bento Grid réutilisable, afin de pouvoir créer des layouts asymétriques cohérents dans toute l'application.

#### Acceptance Criteria

1. WHEN THE System IS initialized, THE System SHALL provide a BentoGrid component accepting cols and rows configuration
2. WHEN A BentoCard IS rendered, THE BentoCard SHALL accept span properties for columns and rows
3. WHEN THE viewport size changes, THE BentoGrid SHALL adapt its layout according to responsive breakpoints (mobile: 1 col, tablet: 4 cols, desktop: 6-8 cols)
4. WHEN A BentoCard IS rendered, THE BentoCard SHALL support variant props including 'default', 'accent', 'gradient', and 'hero'
5. WHERE dark mode IS enabled, THE BentoGrid components SHALL render with appropriate dark mode styles

---

### Requirement 2: Dashboard Principal Migration

**User Story:** En tant qu'utilisateur, je veux voir mon dashboard avec une hiérarchie visuelle claire, afin de comprendre rapidement les informations les plus importantes.

#### Acceptance Criteria

1. WHEN THE dashboard page loads, THE System SHALL display 6 KPI cards in a Bento Grid layout
2. WHEN THE dashboard IS rendered, THE System SHALL highlight the most important KPIs with larger card sizes
3. WHEN A user views THE dashboard on mobile, THE System SHALL stack all cards vertically
4. WHEN THE dashboard data IS loading, THE System SHALL display skeleton loaders matching the Bento Grid layout
5. WHEN AN error occurs, THE System SHALL display error states without breaking the Bento Grid layout

---

### Requirement 3: Client360 Overview Tab Migration

**User Story:** En tant que conseiller, je veux voir la vue d'ensemble d'un client avec une hiérarchie visuelle claire, afin d'identifier rapidement les informations critiques.

#### Acceptance Criteria

1. WHEN THE Client360 Overview tab loads, THE System SHALL display 4 KPI cards (Total Actifs, Total Passifs, Patrimoine Net, Taux d'endettement) in a Bento Grid
2. WHEN THE allocation charts ARE rendered, THE System SHALL display them in medium-sized Bento Cards side by side
3. WHEN THE alerts section IS rendered, THE System SHALL display it in a full-width Bento Card at the top if alerts exist
4. WHEN THE simulation history IS rendered, THE System SHALL display it in a large Bento Card
5. WHEN THE timeline IS rendered, THE System SHALL display recent events in a medium Bento Card

---

### Requirement 4: Client360 Wealth Tab Migration

**User Story:** En tant que conseiller, je veux voir le patrimoine d'un client avec une visualisation claire, afin d'analyser rapidement sa situation financière.

#### Acceptance Criteria

1. WHEN THE Wealth tab loads, THE System SHALL display wealth summary KPIs in small Bento Cards
2. WHEN THE allocation charts ARE rendered, THE System SHALL display the main allocation chart in a large hero Bento Card
3. WHEN THE asset breakdown IS rendered, THE System SHALL display it in medium Bento Cards
4. WHEN THE user views wealth data on tablet, THE System SHALL adapt the grid to 4 columns
5. WHEN NO wealth data exists, THE System SHALL display an empty state in a centered Bento Card

---

### Requirement 5: Calculator Components Migration

**User Story:** En tant qu'utilisateur, je veux utiliser les calculateurs avec une interface moderne, afin de visualiser les résultats de manière claire et hiérarchisée.

#### Acceptance Criteria

1. WHEN A calculator IS rendered, THE System SHALL display input fields in a compact Bento Card at the top
2. WHEN calculation results ARE available, THE System SHALL display the main chart in a large hero Bento Card (span: 4 cols x 3 rows minimum)
3. WHEN summary KPIs ARE rendered, THE System SHALL display them in small Bento Cards (span: 2 cols x 1 row) positioned as satellites around the main chart
4. WHEN A detailed breakdown table IS rendered, THE System SHALL display it in a full-width Bento Card at the bottom
5. WHEN THE calculator IS viewed on mobile, THE System SHALL stack all elements vertically with the chart taking full width

---

### Requirement 6: Simple Calculator Template

**User Story:** En tant que développeur, je veux un template "Chart Hero" réutilisable, afin de migrer rapidement les calculateurs simples (IncomeTax, WealthTax, etc.).

#### Acceptance Criteria

1. WHEN THE Chart Hero template IS used, THE template SHALL provide a predefined Bento Grid layout with chart as hero
2. WHEN A calculator uses THE template, THE System SHALL position the main chart in a 4x3 span Bento Card
3. WHEN summary cards ARE provided, THE template SHALL position them in 2x1 span Bento Cards on the right side
4. WHEN A details section IS provided, THE template SHALL position it in a full-width Bento Card at the bottom
5. WHERE responsive mode IS mobile, THE template SHALL stack all elements vertically

---

### Requirement 7: Complex Calculator Template

**User Story:** En tant que développeur, je veux un template "Dual Charts" réutilisable, afin de migrer les calculateurs complexes avec plusieurs graphiques (BudgetAnalyzer, etc.).

#### Acceptance Criteria

1. WHEN THE Dual Charts template IS used, THE template SHALL provide a Bento Grid layout with two chart positions
2. WHEN two charts ARE provided, THE System SHALL display them side by side in 4x3 span Bento Cards each
3. WHEN A health indicator IS provided, THE template SHALL display it in a full-width hero Bento Card at the top
4. WHEN KPIs ARE provided, THE template SHALL display them in small Bento Cards below the charts
5. WHERE responsive mode IS tablet, THE template SHALL stack charts vertically

---

### Requirement 8: Simulator Components Migration

**User Story:** En tant qu'utilisateur, je veux utiliser les simulateurs avec une visualisation immersive, afin de mieux comprendre les projections à long terme.

#### Acceptance Criteria

1. WHEN A simulator IS rendered, THE System SHALL display the feasibility indicator in a full-width hero Bento Card at the top
2. WHEN THE projection timeline IS rendered, THE System SHALL display it in a very large Bento Card (span: 6 cols x 4 rows minimum)
3. WHEN summary KPIs ARE rendered, THE System SHALL display them in a vertical sidebar of small Bento Cards (span: 2 cols x 2 rows each)
4. WHEN A secondary chart IS rendered, THE System SHALL display it in a medium Bento Card (span: 4 cols x 2 rows)
5. WHEN recommendations ARE available, THE System SHALL display them in a full-width Bento Card at the bottom

---

### Requirement 9: Timeline Simulator Template

**User Story:** En tant que développeur, je veux un template "Timeline" réutilisable, afin de migrer les simulateurs de projection (Retirement, Pension, etc.).

#### Acceptance Criteria

1. WHEN THE Timeline template IS used, THE template SHALL provide a Bento Grid layout optimized for timeline visualizations
2. WHEN A timeline chart IS provided, THE System SHALL position it in a 6x4 span Bento Card as the main focus
3. WHEN KPIs ARE provided, THE template SHALL position them in a vertical sidebar with 2x2 span Bento Cards
4. WHEN A feasibility indicator IS provided, THE template SHALL position it in a full-width hero card at the top
5. WHERE responsive mode IS mobile, THE template SHALL stack timeline and KPIs vertically

---

### Requirement 10: Responsive Behavior

**User Story:** En tant qu'utilisateur mobile, je veux que le Bento Grid s'adapte à mon écran, afin d'avoir une expérience optimale sur tous les appareils.

#### Acceptance Criteria

1. WHEN THE viewport width IS less than 768px, THE System SHALL render all Bento Cards in a single column stack
2. WHEN THE viewport width IS between 768px and 1024px, THE System SHALL render the Bento Grid with 4 columns
3. WHEN THE viewport width IS greater than 1024px, THE System SHALL render the Bento Grid with 6 to 8 columns depending on the template
4. WHEN THE layout changes breakpoint, THE System SHALL animate the transition smoothly over 300ms
5. WHEN charts ARE rendered in responsive mode, THE System SHALL ensure charts remain readable at all sizes

---

### Requirement 11: Performance Optimization

**User Story:** En tant qu'utilisateur, je veux que le Bento Grid se charge rapidement, afin de ne pas subir de ralentissements.

#### Acceptance Criteria

1. WHEN THE Bento Grid IS rendered, THE System SHALL use CSS Grid for layout calculations instead of JavaScript
2. WHEN charts ARE rendered, THE System SHALL lazy load charts that are outside the viewport
3. WHEN THE layout changes, THE System SHALL use CSS transforms for animations to leverage GPU acceleration
4. WHEN multiple Bento Cards ARE rendered, THE System SHALL render them in a single paint cycle
5. WHEN THE page loads, THE System SHALL achieve a First Contentful Paint under 1.5 seconds

---

### Requirement 12: Accessibility Compliance

**User Story:** En tant qu'utilisateur avec des besoins d'accessibilité, je veux que le Bento Grid soit accessible, afin de pouvoir utiliser l'application avec des technologies d'assistance.

#### Acceptance Criteria

1. WHEN A BentoCard IS rendered, THE System SHALL provide appropriate ARIA labels and roles
2. WHEN THE user navigates with keyboard, THE System SHALL provide visible focus indicators on all interactive Bento Cards
3. WHEN THE layout changes, THE System SHALL announce changes to screen readers using ARIA live regions
4. WHEN colors ARE used for information, THE System SHALL provide alternative text indicators
5. WHEN THE user zooms to 200%, THE System SHALL maintain readability and usability

---

### Requirement 13: Dark Mode Support

**User Story:** En tant qu'utilisateur, je veux que le Bento Grid supporte le mode sombre, afin de réduire la fatigue oculaire.

#### Acceptance Criteria

1. WHEN dark mode IS enabled, THE BentoCard SHALL render with dark background colors (bg-gray-900)
2. WHEN dark mode IS enabled, THE BentoCard borders SHALL use dark-appropriate colors (border-gray-700)
3. WHEN dark mode IS enabled, THE gradient variants SHALL use dark-compatible gradients
4. WHEN dark mode IS toggled, THE System SHALL transition colors smoothly over 200ms
5. WHEN charts ARE rendered in dark mode, THE System SHALL use dark-appropriate color schemes

---

### Requirement 14: Migration Strategy

**User Story:** En tant que développeur, je veux une stratégie de migration progressive, afin de minimiser les risques et permettre des rollbacks.

#### Acceptance Criteria

1. WHEN THE migration starts, THE System SHALL create Bento components alongside existing components without breaking current functionality
2. WHEN A page IS migrated, THE System SHALL maintain the same API and props interface where possible
3. WHEN AN error occurs in a Bento component, THE System SHALL log the error and display a fallback UI
4. WHEN THE migration IS in progress, THE System SHALL allow feature flags to toggle between old and new designs
5. WHERE a component cannot be migrated, THE System SHALL document the reason and provide an alternative approach

---

### Requirement 15: Testing Requirements

**User Story:** En tant que développeur, je veux des tests pour les composants Bento, afin de garantir la qualité et la stabilité.

#### Acceptance Criteria

1. WHEN A BentoGrid component IS created, THE System SHALL include unit tests for layout calculations
2. WHEN A BentoCard component IS created, THE System SHALL include tests for all variant props
3. WHEN responsive behavior IS implemented, THE System SHALL include tests for all breakpoints
4. WHEN templates ARE created, THE System SHALL include integration tests with sample data
5. WHEN THE migration IS complete, THE System SHALL achieve minimum 80% code coverage for Bento components

---

## Non-Functional Requirements

### Performance
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Layout Shift (CLS) < 0.1
- Smooth animations at 60fps

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility

### Maintainability
- Component reusability > 80%
- Code duplication < 10%
- Documentation coverage 100%
