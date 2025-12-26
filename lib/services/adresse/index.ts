/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SERVICE ADRESSE - INDEX
 * Combine API BAN + Zones PTZ + Aides locales
 * ══════════════════════════════════════════════════════════════════════════════
 */

export { APIAdresseBAN, type AdresseResult, type AdresseSearchParams } from './api-ban'
import { APIAdresseBAN, type AdresseResult } from './api-ban'
import { DGFiPService } from '../aides-locales/dgfip-api'
import { ANILService } from '../aides-locales/anil-scraper'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES ENRICHIS
// ══════════════════════════════════════════════════════════════════════════════

export interface AdresseEnrichie extends AdresseResult {
  /** Zone PTZ (A_bis, A, B1, B2, C) */
  zonePTZ: 'A_bis' | 'A' | 'B1' | 'B2' | 'C'
  /** Zone Action Logement */
  zoneActionLogement: 'A' | 'B1' | 'B2' | 'C'
  /** Nombre d'aides locales disponibles */
  nbAidesLocales: number
  /** Montant total des aides locales potentielles */
  montantAidesLocales: number
  /** Liste des aides locales */
  aidesLocales: {
    nom: string
    montantMax: number
    taux: number
  }[]
}

export interface AdresseProjet {
  /** Adresse saisie par l'utilisateur */
  adresseSaisie: string
  /** Adresse validée et normalisée */
  adresseValidee: AdresseEnrichie | null
  /** Statut de validation */
  statut: 'non_validee' | 'validee' | 'partielle' | 'erreur'
  /** Message d'erreur éventuel */
  erreur?: string
}

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS D'ENRICHISSEMENT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Enrichit une adresse avec zone PTZ et aides locales
 */
export async function enrichirAdresse(adresse: AdresseResult): Promise<AdresseEnrichie> {
  // Récupérer la zone PTZ
  const zonePTZ = DGFiPService.getZonePTZ(adresse.citycode)
  const zoneActionLogement = zonePTZ === 'A_bis' ? 'A' : zonePTZ

  // Récupérer les aides locales
  const aidesLocalesResult = await ANILService.rechercherAidesParCommune(adresse.citycode)

  return {
    ...adresse,
    zonePTZ,
    zoneActionLogement,
    nbAidesLocales: aidesLocalesResult.total,
    montantAidesLocales: aidesLocalesResult.capaciteBoost,
    aidesLocales: aidesLocalesResult.aides.map(a => ({
      nom: a.nom,
      montantMax: a.montantMax,
      taux: a.taux,
    })),
  }
}

/**
 * Recherche d'adresses avec enrichissement automatique
 */
export async function rechercherAdresseEnrichie(
  query: string,
  options: { limit?: number; enrichir?: boolean } = {}
): Promise<AdresseEnrichie[]> {
  const { limit = 10, enrichir = false } = options
  
  const adresses = await APIAdresseBAN.rechercherAdresse(query, { limit })

  if (!enrichir) {
    // Retourner avec zones PTZ mais sans appels API aides locales
    return adresses.map(adresse => {
      const zonePTZ = DGFiPService.getZonePTZ(adresse.citycode)
      const zoneAL: 'A' | 'B1' | 'B2' | 'C' = zonePTZ === 'A_bis' ? 'A' : zonePTZ
      return {
        ...adresse,
        zonePTZ,
        zoneActionLogement: zoneAL,
        nbAidesLocales: 0,
        montantAidesLocales: 0,
        aidesLocales: [],
      }
    })
  }

  // Enrichissement complet (plus lent, à utiliser pour la sélection finale)
  const enrichies = await Promise.all(adresses.map(enrichirAdresse))
  return enrichies
}

/**
 * Valide et enrichit une adresse pour un projet immobilier
 */
export async function validerAdresseProjet(
  adresseSaisie: string
): Promise<AdresseProjet> {
  if (!adresseSaisie || adresseSaisie.trim().length < 5) {
    return {
      adresseSaisie,
      adresseValidee: null,
      statut: 'erreur',
      erreur: 'Adresse trop courte (minimum 5 caractères)',
    }
  }

  try {
    const adresseValidee = await APIAdresseBAN.validerAdresse(adresseSaisie)

    if (!adresseValidee) {
      return {
        adresseSaisie,
        adresseValidee: null,
        statut: 'erreur',
        erreur: 'Adresse non trouvée dans la base nationale',
      }
    }

    // Enrichir l'adresse validée
    const adresseEnrichie = await enrichirAdresse(adresseValidee)

    // Déterminer le statut
    let statut: 'validee' | 'partielle' = 'validee'
    if (!adresseValidee.housenumber && adresseValidee.type !== 'municipality') {
      statut = 'partielle' // Adresse sans numéro de rue
    }

    return {
      adresseSaisie,
      adresseValidee: adresseEnrichie,
      statut,
    }
  } catch (error) {
    console.error('[Adresse] Erreur validation:', error)
    return {
      adresseSaisie,
      adresseValidee: null,
      statut: 'erreur',
      erreur: 'Erreur lors de la validation de l\'adresse',
    }
  }
}

/**
 * Obtient un résumé des aides pour une adresse
 */
export function getResumeAidesAdresse(adresse: AdresseEnrichie): string {
  const parts: string[] = []
  
  parts.push(`Zone ${adresse.zonePTZ}`)
  
  if (adresse.nbAidesLocales > 0) {
    parts.push(`${adresse.nbAidesLocales} aide(s) locale(s) disponible(s)`)
    parts.push(`jusqu'à ${adresse.montantAidesLocales.toLocaleString('fr-FR')}€`)
  }
  
  return parts.join(' • ')
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════════

const AdresseService = {
  // API BAN
  rechercher: APIAdresseBAN.rechercherAdresse,
  rechercherCommune: APIAdresseBAN.rechercherCommune,
  rechercherParCodePostal: APIAdresseBAN.rechercherParCodePostal,
  reverseGeocode: APIAdresseBAN.reverseGeocode,
  valider: APIAdresseBAN.validerAdresse,
  
  // Enrichissement
  enrichir: enrichirAdresse,
  rechercherEnrichie: rechercherAdresseEnrichie,
  validerProjet: validerAdresseProjet,
  getResumeAides: getResumeAidesAdresse,
}

export default AdresseService
