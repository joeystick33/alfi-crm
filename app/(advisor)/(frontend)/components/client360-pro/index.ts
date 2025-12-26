/**
 * Client 360 PRO - Exports
 * Dossier client pour entreprises (CGP/Banquier privé)
 */

// Container principal V2 (harmonisé avec Client360 particulier)
export { Client360ProContainerV2 } from './Client360ProContainerV2'

// Container legacy (pour rétrocompatibilité)

// Onglets unifiés V2
export { default as TabSyntheseEntreprise } from './tabs/TabSyntheseEntreprise'
export { default as TabPatrimoineProUnified } from './tabs/TabPatrimoineProUnified'

// Onglets individuels
export { default as TabFicheEntreprise } from './tabs/TabFicheEntreprise'
export { default as TabInterlocuteurs } from './tabs/TabInterlocuteurs'
export { default as TabDiagnostic } from './tabs/TabDiagnostic'
export { default as TabEpargneSalariale } from './tabs/TabEpargneSalariale'
export { default as TabProtectionSociale } from './tabs/TabProtectionSociale'
export { default as TabFinancementsPro } from './tabs/TabFinancementsPro'
export { default as TabImmobilierPro } from './tabs/TabImmobilierPro'
export { default as TabPatrimoineFinancierPro } from './tabs/TabPatrimoineFinancierPro'
export { default as TabDocumentsPro } from './tabs/TabDocumentsPro'
export { default as TabOpportunitesPro } from './tabs/TabOpportunitesPro'
export { default as TabActivitesPro } from './tabs/TabActivitesPro'
