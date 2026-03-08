/**
 * PARAMÈTRES FISCAUX ET SOCIAUX — Proxy centralisé
 * ===================================
 * Source unique de vérité : fiscal-rules.ts (RULES)
 * 
 * ⚠️ CE FICHIER EST UN PROXY VERS LA CONFIG CENTRALISÉE.
 *    Pour mettre à jour les valeurs, modifier fiscal-rules.ts
 *    ou utiliser l'interface admin /superadmin/fiscal-rules.
 *    Aucune valeur n'est hardcodée ici.
 */

import {
  RULES,
  BAREME_IR,
  PLAFONDS_EPARGNE_RETRAITE as PLAFONDS_EPARGNE_RETRAITE_IMPORT,
  PER_TNS as PER_TNS_IMPORT,
  PRELEVEMENTS_SOCIAUX as PRELEVEMENTS_SOCIAUX_IMPORT,
  ASSURANCE_VIE_RACHAT as ASSURANCE_VIE_RACHAT_RULES,
  ASSURANCE_VIE_DECES as ASSURANCE_VIE_DECES_RULES,
  BAREME_DEMEMBREMENT as BAREME_DEMEMBREMENT_RULES,
  ABATTEMENTS_SUCCESSION as ABATTEMENTS_SUCCESSION_IMPORT,
  BAREME_SUCCESSION_LIGNE_DIRECTE as BAREME_SUCCESSION_LD_IMPORT,
  CEHR as CEHR_IMPORT,
} from '@/app/_common/lib/rules/fiscal-rules'
import {
  getTMI as getTMI_engine,
  getNombreParts as getNombreParts_engine,
  calculIRSimple,
  getUsufruit as getUsufruit_engine,
  calculerPlafondPERTNS,
  calculerPlafondPERSalarie,
} from '@/app/_common/lib/rules/fiscal-rules-engine'

// =============================================================================
// PÉRIODE D'APPLICATION — Lecture dynamique depuis RULES.meta
// =============================================================================
export const PERIODE = {
  annee_fiscale: RULES.meta.annee_fiscale,
  annee_revenus: RULES.meta.annee_revenus,
  version: RULES.meta.version,
  date_maj: RULES.meta.date_mise_a_jour,
}

// =============================================================================
// BARÈME IMPÔT SUR LE REVENU (CGI art. 197)
// =============================================================================
export const BAREME_IR_2025 = BAREME_IR

// =============================================================================
// PLAFONDS ÉPARGNE RETRAITE 2026 (CGI art. 163 quatervicies)
// =============================================================================
export const PLAFONDS_EPARGNE_RETRAITE = PLAFONDS_EPARGNE_RETRAITE_IMPORT

// =============================================================================
// PARAMÈTRES PER SALARIÉS
// =============================================================================
export const PER_SALARIES = {
  TAUX_CHARGES_SALARIALES: RULES.social.charges_salariales_moyen,
  TAUX_CHARGES_PATRONALES: RULES.social.charges_patronales_moyen,
  ABONDEMENT_MAX: RULES.social.abondement_max_per,
  PARTICIPATION_MAX: RULES.per.plafond_max_salarie,
}

// =============================================================================
// PARAMÈTRES PER TNS (Madelin / art. 154 bis)
// =============================================================================
export const PER_TNS = {
  TAUX_BASE: PER_TNS_IMPORT.taux_base,
  TAUX_ADDITIONNEL: PER_TNS_IMPORT.taux_additionnel,
  PLAFOND_BASE: PER_TNS_IMPORT.plafond_base,
  PLAFOND_ADDITIONNEL: PER_TNS_IMPORT.plafond_additionnel,
  PLAFOND_MAX: PER_TNS_IMPORT.plafond_max,
  PLANCHER: PER_TNS_IMPORT.plancher,
}

// =============================================================================
// PRÉLÈVEMENTS SOCIAUX
// =============================================================================
export const PRELEVEMENTS_SOCIAUX = PRELEVEMENTS_SOCIAUX_IMPORT

// =============================================================================
// ASSURANCE-VIE - RACHAT (CGI art. 125-0 A)
// =============================================================================
export const ASSURANCE_VIE_RACHAT = {
  PFU: ASSURANCE_VIE_RACHAT_RULES.pfu_ir,
  PFL_MOINS_4_ANS: ASSURANCE_VIE_RACHAT_RULES.pfl_moins_4ans,
  PFL_4_8_ANS: ASSURANCE_VIE_RACHAT_RULES.pfl_4_8ans,
  TAUX_REDUIT_8_ANS: ASSURANCE_VIE_RACHAT_RULES.taux_reduit_8ans,
  ABATTEMENT_SEUL: ASSURANCE_VIE_RACHAT_RULES.abattement_celibataire_8ans,
  ABATTEMENT_COUPLE: ASSURANCE_VIE_RACHAT_RULES.abattement_couple_8ans,
  SEUIL_PRIMES_150K: ASSURANCE_VIE_RACHAT_RULES.seuil_primes_150k,
}

// =============================================================================
// ASSURANCE-VIE - TRANSMISSION DÉCÈS
// =============================================================================
export const ASSURANCE_VIE_DECES = {
  ABATTEMENT_990I: ASSURANCE_VIE_DECES_RULES.abattement_990i,
  TAUX_990I_1: ASSURANCE_VIE_DECES_RULES.taux_990i_1,
  TAUX_990I_2: ASSURANCE_VIE_DECES_RULES.taux_990i_2,
  SEUIL_990I: ASSURANCE_VIE_DECES_RULES.seuil_990i,
  ABATTEMENT_757B: ASSURANCE_VIE_DECES_RULES.abattement_757b,
}

// =============================================================================
// DÉMEMBREMENT (CGI art. 669)
// =============================================================================
export const BAREME_DEMEMBREMENT = BAREME_DEMEMBREMENT_RULES.map(t => ({
  ageMax: t.age_max,
  usufruit: t.usufruit,
  nuePropriete: t.nue_propriete,
}))

// =============================================================================
// DROITS DE SUCCESSION / DONATION
// =============================================================================
export const ABATTEMENTS_SUCCESSION = {
  ENFANT: ABATTEMENTS_SUCCESSION_IMPORT.enfant,
  PETIT_ENFANT: ABATTEMENTS_SUCCESSION_IMPORT.petit_enfant,
  ARRIERE_PETIT_ENFANT: ABATTEMENTS_SUCCESSION_IMPORT.arriere_petit_enfant,
  FRERE_SOEUR: ABATTEMENTS_SUCCESSION_IMPORT.frere_soeur,
  NEVEU_NIECE: ABATTEMENTS_SUCCESSION_IMPORT.neveu_niece,
  HANDICAPE: ABATTEMENTS_SUCCESSION_IMPORT.handicape,
  CONJOINT: ABATTEMENTS_SUCCESSION_IMPORT.conjoint,
}

export const BAREME_SUCCESSION_LIGNE_DIRECTE = BAREME_SUCCESSION_LD_IMPORT

// =============================================================================
// IFI 2026 (CGI art. 977)
// =============================================================================
export const IFI = {
  SEUIL: RULES.ifi.seuil_assujettissement,
  SEUIL_DEBUT: RULES.ifi.seuil_debut_taxation,
  BAREME: RULES.ifi.bareme,
  DECOTE_SEUIL: RULES.ifi.decote.seuil,
  DECOTE_BASE: RULES.ifi.decote.base,
  DECOTE_TAUX: RULES.ifi.decote.taux,
}

// =============================================================================
// CEHR - Contribution Exceptionnelle Hauts Revenus (CGI art. 223 sexies)
// =============================================================================
export const CEHR = {
  CELIBATAIRE: CEHR_IMPORT.celibataire,
  COUPLE: CEHR_IMPORT.couple,
}

// =============================================================================
// FONCTIONS UTILITAIRES — Proxys vers fiscal-rules-engine.ts
// =============================================================================

export function getTMI(quotientFamilial: number): number {
  return getTMI_engine(quotientFamilial)
}

export function getNombreParts(statut: 'celibataire' | 'couple', enfants: number, parentIsole = false): number {
  return getNombreParts_engine(statut, enfants, { parentIsole })
}

export function calculIR(revenuImposable: number, nbParts: number): number {
  return calculIRSimple(revenuImposable, nbParts)
}

export function getUsufruit(age: number): number {
  return getUsufruit_engine(age)
}

export function getPlafondPERTNS(benefice: number): { plafond: number; detail: string } {
  return calculerPlafondPERTNS(benefice)
}

export function getPlafondPERSalarie(
  revenuNet: number,
  plafondNonUtiliseN1 = 0,
  plafondNonUtiliseN2 = 0,
  plafondNonUtiliseN3 = 0
): number {
  const result = calculerPlafondPERSalarie(revenuNet, [
    plafondNonUtiliseN1,
    plafondNonUtiliseN2,
    plafondNonUtiliseN3,
  ])
  return result.total
}

// =============================================================================
// EXPORT GLOBAL POUR COMPATIBILITÉ
// =============================================================================
export const PARAMS = {
  PS: PRELEVEMENTS_SOCIAUX.TOTAL,
  PFU: ASSURANCE_VIE_RACHAT.PFU,
  ABAT_SEUL: ASSURANCE_VIE_RACHAT.ABATTEMENT_SEUL,
  ABAT_COUPLE: ASSURANCE_VIE_RACHAT.ABATTEMENT_COUPLE,
  TAUX_75: ASSURANCE_VIE_RACHAT.TAUX_REDUIT_8_ANS,
  TAUX_PFL_MOINS4: ASSURANCE_VIE_RACHAT.PFL_MOINS_4_ANS,
  TAUX_PFL_4A8: ASSURANCE_VIE_RACHAT.PFL_4_8_ANS,
  ABAT_990I: ASSURANCE_VIE_DECES.ABATTEMENT_990I,
  TAUX_990I_1: ASSURANCE_VIE_DECES.TAUX_990I_1,
  TAUX_990I_2: ASSURANCE_VIE_DECES.TAUX_990I_2,
  SEUIL_990I: ASSURANCE_VIE_DECES.SEUIL_990I,
  ABAT_757B: ASSURANCE_VIE_DECES.ABATTEMENT_757B,
  BAREME_IR: BAREME_IR,
  DEMEMBREMENT: BAREME_DEMEMBREMENT.map(t => ({ age: t.ageMax, usufruit: t.usufruit })),
  PASS: PLAFONDS_EPARGNE_RETRAITE.PASS,
}

export default PARAMS
