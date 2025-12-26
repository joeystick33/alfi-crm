/**
 * Client 360 Components
 * Export all Client 360 tab components and utilities
 */

// Tab components - Version professionnelle fusionnée
export { TabVueEnsemble } from './tabs/TabVueEnsemble'
export { TabProfilFamille } from './tabs/TabProfilFamille'
export { TabPatrimoineReporting } from './tabs/TabPatrimoineReporting'
export { TabBudgetComplet } from './tabs/TabBudgetComplet'
export { TabFiscaliteComplete } from './tabs/TabFiscaliteComplete'
export { TabContratsComplet } from './tabs/TabContratsComplet'
export { TabDocumentsConformite } from './tabs/TabDocumentsConformite'
export { TabObjectifsProjets } from './tabs/TabObjectifsProjets'
export { TabOpportunitesComplet } from './tabs/TabOpportunitesComplet'
export { TabActivitesHistorique } from './tabs/TabActivitesHistorique'
export { TabParametresComplet } from './tabs/TabParametresComplet'

// Legacy tab components (deprecated - use fusioned versions above)
// TabWealth supprimé - utiliser TabPatrimoineReporting
// TabPatrimoine supprimé - utiliser TabPatrimoineReporting
// TabBudget supprimé - utiliser TabBudgetComplet (tabs/)

// Modals
export { UpdateOpportuniteModal } from './UpdateOpportuniteModal'
export { PatrimoineFormModal, ClientWizardModal } from './modals'
export type { PatrimoineFormType } from './modals'

// Quick Actions

// Utilities

// Bulk Action Progress

// Error Boundaries

// Skeletons
