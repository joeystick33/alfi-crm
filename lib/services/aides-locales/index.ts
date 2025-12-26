/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SERVICES AIDES LOCALES - INDEX
 * Combine ANIL (scraping) + DGFiP (API) + PDF parsing
 * ══════════════════════════════════════════════════════════════════════════════
 */

export { ANILService, type AideLocale, type AideLocaleRecherche } from './anil-scraper'
export { DGFiPService, type CommuneInfo, type PlafondsFiscaux } from './dgfip-api'
export { CacheFichier } from './cache-fichier'

import { ANILService } from './anil-scraper'
import { DGFiPService } from './dgfip-api'
import { CacheFichier } from './cache-fichier'

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE COMBINÉ
// ══════════════════════════════════════════════════════════════════════════════

export interface SimulationAidesResult {
  commune: {
    codeInsee: string
    nom: string
    zone: string
    departement: string
    region: string
  }
  eligibilite: {
    ptz: { eligible: boolean; raison?: string; montantMax?: number }
    actionLogement: { eligible: boolean; raison?: string; montantMax?: number }
    pas: { eligible: boolean; raison?: string }
    ecoptz: { eligible: boolean; raison?: string; montantMax?: number }
  }
  aidesLocales: {
    nom: string
    organisme: string
    montantMax: number
    taux: number
    conditions: string[]
  }[]
  recap: {
    totalAidesNationales: number
    totalAidesLocales: number
    capaciteBoost: number
  }
}

/**
 * Simulation complète des aides pour une commune et un profil
 */
export async function simulerAides(params: {
  codeInsee?: string
  codePostal?: string
  nomCommune?: string
  revenus: number
  tailleFoyer: number
  primoAccedant: boolean
  typeLogement: 'neuf' | 'ancien'
  travaux?: number
  travauxEnergetiques?: boolean
  salariePrive?: boolean
  tailleEntreprise?: number
}): Promise<SimulationAidesResult | null> {
  // 1. Résoudre la commune
  let codeInsee = params.codeInsee
  let communeInfo = null
  
  if (!codeInsee && params.codePostal) {
    const communes = await DGFiPService.rechercherCommune(params.codePostal)
    if (communes.length > 0) {
      codeInsee = communes[0].codeInsee
      communeInfo = communes[0]
    }
  } else if (!codeInsee && params.nomCommune) {
    const communes = await DGFiPService.rechercherCommune(params.nomCommune)
    if (communes.length > 0) {
      codeInsee = communes[0].codeInsee
      communeInfo = communes[0]
    }
  } else if (codeInsee) {
    communeInfo = await DGFiPService.getCommuneInfo(codeInsee)
  }
  
  if (!codeInsee || !communeInfo) {
    console.warn('[AidesLocales] Commune non trouvée')
    return null
  }
  
  // 2. Vérifier éligibilités nationales
  const eligibilite = DGFiPService.verifierEligibilite({
    codeInsee,
    revenus: params.revenus,
    tailleFoyer: params.tailleFoyer,
    primoAccedant: params.primoAccedant,
    typeLogement: params.typeLogement,
    travaux: params.travaux,
  })
  
  // Éco-PTZ (logique simplifiée)
  let ecoptzEligible = false
  let ecoptzMontant = 0
  if (params.travauxEnergetiques) {
    ecoptzEligible = true
    ecoptzMontant = 50000 // Max performance globale
  }
  
  // Action Logement - vérifier salarié privé
  if (!params.salariePrive || (params.tailleEntreprise && params.tailleEntreprise < 10)) {
    eligibilite.actionLogement.eligible = false
    eligibilite.actionLogement.raison = 'Salarié entreprise privée ≥10 employés requis'
    eligibilite.actionLogement.montantMax = 0
  }
  
  // 3. Récupérer aides locales
  const aidesLocalesResult = await ANILService.rechercherAidesParCommune(codeInsee)
  
  // Filtrer selon éligibilité
  const aidesLocalesEligibles = ANILService.verifierEligibiliteAidesLocales(
    aidesLocalesResult.aides,
    {
      primoAccedant: params.primoAccedant,
      revenus: params.revenus,
      situationPro: params.salariePrive ? 'salarie' : 'autre',
      typeLogement: params.typeLogement,
    }
  )
  
  // 4. Calculer récap
  const totalAidesNationales = 
    (eligibilite.ptz.montantMax || 0) + 
    (eligibilite.actionLogement.montantMax || 0) +
    ecoptzMontant
  
  const totalAidesLocales = aidesLocalesEligibles.reduce((sum, a) => sum + a.montantMax, 0)
  
  return {
    commune: {
      codeInsee,
      nom: communeInfo.nom,
      zone: communeInfo.zonePTZ,
      departement: communeInfo.departement,
      region: ANILService.DEPARTEMENTS_REGIONS[communeInfo.departement] || 'inconnu',
    },
    eligibilite: {
      ptz: eligibilite.ptz,
      actionLogement: eligibilite.actionLogement,
      pas: eligibilite.pas,
      ecoptz: { eligible: ecoptzEligible, montantMax: ecoptzMontant },
    },
    aidesLocales: aidesLocalesEligibles.map(a => ({
      nom: a.nom,
      organisme: a.organisme,
      montantMax: a.montantMax,
      taux: a.taux,
      conditions: a.conditions,
    })),
    recap: {
      totalAidesNationales,
      totalAidesLocales,
      capaciteBoost: totalAidesNationales + totalAidesLocales,
    },
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT PAR DÉFAUT
// ══════════════════════════════════════════════════════════════════════════════

const AidesLocalesService = {
  ANIL: ANILService,
  DGFiP: DGFiPService,
  Cache: CacheFichier,
  simulerAides,
}

export default AidesLocalesService
