/**
 * Client360 V2 - Exports centralisés
 * 
 * Version simplifiée et moderne du Client360 avec:
 * - Architecture épurée (6-8 tabs)
 * - Composants optimisés
 * - Actions rapides fonctionnelles
 */

// Conteneur principal
export { Client360ContainerV2 } from './Client360ContainerV2'

// Header et bannière
export { default as ClientBannerV2 } from './ClientBannerV2'
export { default as ClientHeader } from './ClientHeader'

// Alertes et actions
export { 
  ClientAlertsActions, 
  defaultQuickActions,
  type Alert,
  type QuickAction,
} from './ClientAlertsActions'

// Widget de scoring
export { 
  ClientScoringWidget,
  type ClientScoringWidgetProps,
  type ScoreCategory,
} from './ClientScoringWidget'

// Sections
export { default as DocumentsSection } from './sections/DocumentsSection'
export { default as FiscaliteSection } from './sections/FiscaliteSection'
export { default as ProjetsSection } from './sections/ProjetsSection'

// Tabs
export { default as ActivityTimelineTab } from './tabs/ActivityTimelineTab'
export { default as TabPatrimoineUnified } from './tabs/TabPatrimoineUnified'
export { default as TabProjetsUnified } from './tabs/TabProjetsUnified'
