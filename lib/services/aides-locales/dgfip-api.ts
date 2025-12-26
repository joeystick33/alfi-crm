/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SERVICE API DGFiP - DONNÉES FISCALES ET GÉOGRAPHIQUES
 * Source: api.gouv.fr - APIs gratuites de l'État français
 * Cache: Fichiers JSON locaux (pas de MongoDB)
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { CacheFichier } from './cache-fichier'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface CommuneInfo {
  codeInsee: string
  nom: string
  codePostal: string
  departement: string
  region: string
  zonePTZ: 'A_bis' | 'A' | 'B1' | 'B2' | 'C'
  zoneActionLogement: 'A' | 'B1' | 'B2' | 'C'
  population: number
}

export interface PlafondsFiscaux {
  zone: string
  plafondsPTZ: Record<number, number>  // Taille foyer → plafond revenus
  plafondsActionLogement: Record<number, number>
  plafondsPAS: Record<number, number>
}

export interface TaxesFoncieres {
  codeInsee: string
  taxeFonciereBatie: number  // Taux en %
  taxeFonciereNonBatie: number
  taxeHabitation: number  // Résidences secondaires uniquement depuis 2023
}

// ══════════════════════════════════════════════════════════════════════════════
// BASE DE DONNÉES ZONES PTZ PAR DÉPARTEMENT
// Source: Arrêté du 1er août 2014 modifié - Zonage ABC
// ══════════════════════════════════════════════════════════════════════════════

const ZONES_PAR_DEPARTEMENT: Record<string, 'A_bis' | 'A' | 'B1' | 'B2' | 'C'> = {
  // Zone A bis (Paris et petite couronne très tendue)
  '75': 'A_bis', // Paris
  
  // Zone A (Grandes agglos tendues)
  '92': 'A', '93': 'A', '94': 'A', // Petite couronne
  '78': 'A', '91': 'A', '95': 'A', // Grande couronne (parties)
  '06': 'A', // Alpes-Maritimes (Côte d'Azur)
  '74': 'A', // Haute-Savoie (Genève)
  
  // Zone B1 (Villes moyennes tendues)
  '13': 'B1', '31': 'B1', '33': 'B1', '34': 'B1', '35': 'B1',
  '38': 'B1', '44': 'B1', '59': 'B1', '67': 'B1', '69': 'B1',
  '77': 'B1', // Seine-et-Marne (parties)
  
  // Zone B2 (Villes moyennes)
  '14': 'B2', '17': 'B2', '21': 'B2', '25': 'B2', '29': 'B2',
  '30': 'B2', '37': 'B2', '42': 'B2', '45': 'B2', '49': 'B2',
  '51': 'B2', '54': 'B2', '56': 'B2', '57': 'B2', '62': 'B2',
  '63': 'B2', '64': 'B2', '66': 'B2', '68': 'B2', '72': 'B2',
  '76': 'B2', '80': 'B2', '83': 'B2', '84': 'B2', '85': 'B2',
  '86': 'B2', '87': 'B2',
  
  // Zone C (Rural et petites villes) - Par défaut
}

/**
 * Communes en zone A bis (liste partielle - principales)
 */
const COMMUNES_A_BIS = new Set([
  '75056', // Paris
  '92012', '92014', '92019', '92020', '92024', '92025', '92026', // Boulogne, Issy, Levallois...
  '92035', '92036', '92040', '92044', '92046', '92047', '92048', // Malakoff, Montrouge, Neuilly...
  '92049', '92050', '92051', '92060', '92062', '92063', '92064', // Puteaux, Rueil...
  '92071', '92073', '92075', '92076', '92077', '92078', // Sèvres, Vanves...
  '94003', '94011', '94015', '94016', '94017', '94018', '94019', // Arcueil, Cachan, Charenton...
  '94028', '94033', '94034', '94037', '94038', '94041', '94042', // Fontenay, Gentilly...
  '94043', '94044', '94046', '94048', '94052', '94053', '94054', // Ivry, Joinville...
  '94058', '94060', '94067', '94068', '94069', '94070', '94071', // Nogent, Saint-Mandé...
  '94073', '94074', '94076', '94077', '94078', '94079', '94080', // Vincennes, Vitry...
  '93001', '93005', '93006', '93007', '93008', '93010', '93013', // Aubervilliers, Bagnolet...
  '93014', '93015', '93027', '93029', '93030', '93031', '93032', // Bobigny, Bondy...
  '93033', '93039', '93045', '93046', '93047', '93048', '93049', // Drancy, Montreuil...
  '93050', '93051', '93053', '93055', '93057', '93059', '93061', // Noisy, Pantin...
  '93062', '93063', '93064', '93066', '93070', '93071', '93072', // Le Pré, Romainville...
  '93073', '93074', '93077', '93078', '93079', // Saint-Ouen, Villepinte...
])

// ══════════════════════════════════════════════════════════════════════════════
// PLAFONDS DE REVENUS 2025
// ══════════════════════════════════════════════════════════════════════════════

import { 
  PLAFONDS_REVENUS_PTZ_2025, 
  PLAFONDS_PLI_2025,
  PRET_ACCESSION_SOCIALE_2025 
} from './parameters-ptz-2025'

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS PRINCIPALES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Récupère les informations d'une commune par code INSEE
 * 1. Vérifie le cache fichier JSON
 * 2. Sinon, appelle l'API geo.api.gouv.fr
 * 3. Sauvegarde dans le cache pour les prochaines requêtes
 */
export async function getCommuneInfo(codeInsee: string): Promise<CommuneInfo | null> {
  // 1. Vérifier le cache fichier
  const communeCachee = CacheFichier.getCachedCommune(codeInsee)
  if (communeCachee) {
    console.log(`[DGFiP] Commune ${codeInsee} trouvée dans le cache`)
    return communeCachee
  }

  try {
    // 2. Appel API Géo gouv.fr - Gratuite
    const response = await fetch(
      `https://geo.api.gouv.fr/communes/${codeInsee}?fields=nom,code,codesPostaux,codeDepartement,codeRegion,population`
    )
    
    if (!response.ok) {
      console.warn(`[DGFiP] Commune ${codeInsee} non trouvée dans l'API`)
      return null
    }
    
    const data = await response.json()
    const zone = getZonePTZ(codeInsee)
    
    const communeInfo: CommuneInfo = {
      codeInsee: data.code,
      nom: data.nom,
      codePostal: data.codesPostaux?.[0] || '',
      departement: data.codeDepartement,
      region: data.codeRegion,
      zonePTZ: zone,
      zoneActionLogement: zone === 'A_bis' ? 'A' : zone, // Action Logement n'a pas de A bis
      population: data.population || 0,
    }
    
    // 3. Sauvegarder dans le cache fichier
    CacheFichier.setCachedCommune(communeInfo)
    console.log(`[DGFiP] Commune ${codeInsee} sauvegardée dans le cache`)
    
    return communeInfo
  } catch (error) {
    console.error(`[DGFiP] Erreur API commune:`, error)
    return null
  }
}

/**
 * Recherche une commune par nom ou code postal
 * Les résultats sont automatiquement mis en cache
 */
export async function rechercherCommune(query: string): Promise<CommuneInfo[]> {
  try {
    // Déterminer si c'est un code postal ou un nom
    const isCodePostal = /^\d{5}$/.test(query)
    
    const url = isCodePostal
      ? `https://geo.api.gouv.fr/communes?codePostal=${query}&fields=nom,code,codesPostaux,codeDepartement,codeRegion,population&limit=20`
      : `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux,codeDepartement,codeRegion,population&limit=20`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    
    const communes: CommuneInfo[] = data.map((commune: any) => {
      const zone = getZonePTZ(commune.code)
      return {
        codeInsee: commune.code,
        nom: commune.nom,
        codePostal: commune.codesPostaux?.[0] || '',
        departement: commune.codeDepartement,
        region: commune.codeRegion,
        zonePTZ: zone,
        zoneActionLogement: zone === 'A_bis' ? 'A' : zone,
        population: commune.population || 0,
      }
    })
    
    // Sauvegarder dans le cache fichier
    if (communes.length > 0) {
      CacheFichier.setCachedCommunes(communes)
      console.log(`[DGFiP] ${communes.length} communes sauvegardées dans le cache`)
    }
    
    return communes
  } catch (error) {
    console.error(`[DGFiP] Erreur recherche commune:`, error)
    return []
  }
}

/**
 * Détermine la zone PTZ pour un code INSEE
 */
export function getZonePTZ(codeInsee: string): 'A_bis' | 'A' | 'B1' | 'B2' | 'C' {
  // Vérifier si commune en zone A bis
  if (COMMUNES_A_BIS.has(codeInsee)) {
    return 'A_bis'
  }
  
  // Sinon utiliser le zonage par département
  const departement = codeInsee.substring(0, 2)
  return ZONES_PAR_DEPARTEMENT[departement] || 'C'
}

/**
 * Récupère les plafonds fiscaux pour une zone
 */
export function getPlafondsFiscaux(zone: 'A_bis' | 'A' | 'B1' | 'B2' | 'C'): PlafondsFiscaux {
  // Pour A_bis, on utilise les plafonds de A
  const zoneKey = zone === 'A_bis' ? 'A_bis' : zone
  
  return {
    zone,
    plafondsPTZ: PLAFONDS_REVENUS_PTZ_2025[zoneKey] || PLAFONDS_REVENUS_PTZ_2025['C'],
    plafondsActionLogement: PLAFONDS_PLI_2025[zoneKey] || PLAFONDS_PLI_2025['C'],
    plafondsPAS: PRET_ACCESSION_SOCIALE_2025.plafonds[zoneKey] || PRET_ACCESSION_SOCIALE_2025.plafonds['C'],
  }
}

/**
 * Vérifie l'éligibilité aux aides selon les revenus et la zone
 */
export function verifierEligibilite(params: {
  codeInsee: string
  revenus: number // RFR N-2
  tailleFoyer: number // 1 à 8+
  primoAccedant: boolean
  typeLogement: 'neuf' | 'ancien'
  travaux?: number // Montant travaux si ancien
}): {
  ptz: { eligible: boolean; raison?: string; montantMax?: number }
  actionLogement: { eligible: boolean; raison?: string; montantMax?: number }
  pas: { eligible: boolean; raison?: string }
} {
  const zone = getZonePTZ(params.codeInsee)
  const plafonds = getPlafondsFiscaux(zone)
  const taille = Math.min(params.tailleFoyer, 8) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  
  // PTZ
  let ptzEligible = false
  let ptzRaison = ''
  let ptzMontant = 0
  
  if (!params.primoAccedant) {
    ptzRaison = 'Primo-accédant requis'
  } else if (params.revenus > plafonds.plafondsPTZ[taille]) {
    ptzRaison = `Revenus > plafond zone ${zone} (${plafonds.plafondsPTZ[taille]}€)`
  } else if (params.typeLogement === 'ancien' && !['B2', 'C'].includes(zone)) {
    ptzRaison = 'Ancien avec travaux uniquement en zone B2/C'
  } else if (params.typeLogement === 'ancien' && params.travaux && params.travaux < (params.revenus * 0.25)) {
    ptzRaison = 'Travaux < 25% du coût total requis pour ancien'
  } else {
    ptzEligible = true
    // Calcul simplifié du montant max PTZ
    ptzMontant = Math.min(180000, plafonds.plafondsPTZ[taille] * 0.5)
  }
  
  // Action Logement
  let alEligible = false
  let alRaison = ''
  let alMontant = 0
  
  const plafondAL = plafonds.plafondsActionLogement[taille]
  if (params.revenus > plafondAL) {
    alRaison = `Revenus > plafond PLI zone ${zone} (${plafondAL}€)`
  } else {
    alEligible = true
    alMontant = 30000 // Montant max 2025
  }
  
  // PAS
  let pasEligible = false
  let pasRaison = ''
  
  const plafondPAS = plafonds.plafondsPAS[taille]
  if (params.revenus > plafondPAS) {
    pasRaison = `Revenus > plafond PAS zone ${zone} (${plafondPAS}€)`
  } else {
    pasEligible = true
  }
  
  return {
    ptz: { eligible: ptzEligible, raison: ptzRaison || undefined, montantMax: ptzMontant || undefined },
    actionLogement: { eligible: alEligible, raison: alRaison || undefined, montantMax: alMontant || undefined },
    pas: { eligible: pasEligible, raison: pasRaison || undefined },
  }
}

/**
 * Calcule la capacité d'emprunt boostée avec les aides
 */
export async function calculerCapaciteBoostee(params: {
  codeInsee: string
  revenus: number
  tailleFoyer: number
  primoAccedant: boolean
  typeLogement: 'neuf' | 'ancien'
  capaciteBase: number // Capacité d'emprunt calculée sans aides
}): Promise<{
  capaciteBase: number
  aidesNationales: { nom: string; montant: number }[]
  aidesLocales: { nom: string; montant: number }[]
  capaciteTotale: number
}> {
  const eligibilite = verifierEligibilite({
    codeInsee: params.codeInsee,
    revenus: params.revenus,
    tailleFoyer: params.tailleFoyer,
    primoAccedant: params.primoAccedant,
    typeLogement: params.typeLogement,
  })
  
  const aidesNationales: { nom: string; montant: number }[] = []
  
  if (eligibilite.ptz.eligible && eligibilite.ptz.montantMax) {
    aidesNationales.push({ nom: 'PTZ 2025', montant: eligibilite.ptz.montantMax })
  }
  
  if (eligibilite.actionLogement.eligible && eligibilite.actionLogement.montantMax) {
    aidesNationales.push({ nom: 'Action Logement', montant: eligibilite.actionLogement.montantMax })
  }
  
  // Aides locales (import dynamique)
  const { rechercherAidesParCommune } = await import('./anil-scraper')
  const aidesLocalesResult = await rechercherAidesParCommune(params.codeInsee)
  
  const aidesLocales = aidesLocalesResult.aides.map(aide => ({
    nom: aide.nom,
    montant: aide.montantMax,
  }))
  
  const totalAidesNationales = aidesNationales.reduce((sum, a) => sum + a.montant, 0)
  const totalAidesLocales = aidesLocales.reduce((sum, a) => sum + a.montant, 0)
  
  return {
    capaciteBase: params.capaciteBase,
    aidesNationales,
    aidesLocales,
    capaciteTotale: params.capaciteBase + totalAidesNationales + totalAidesLocales,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════════════════════

export const DGFiPService = {
  getCommuneInfo,
  rechercherCommune,
  getZonePTZ,
  getPlafondsFiscaux,
  verifierEligibilite,
  calculerCapaciteBoostee,
  ZONES_PAR_DEPARTEMENT,
  COMMUNES_A_BIS,
}

export default DGFiPService
