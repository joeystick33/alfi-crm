/**
 * SERVICE KYC UNIFIÉ
 * Orchestre toutes les APIs pour l'enrichissement des données client/entreprise
 */

import { rechercherParSiren, rechercherParNom, type Entreprise } from '../entreprise/api-sirene'
import { genererProfilEntreprise, type ProfilEntreprise } from '../entreprise/enrichissement'
import { genererProfilSocial, type ProfilSocialComplet } from '../entreprise/conventions'
import { rechercherAdresse, type AdresseResult } from '../adresse/api-ban'

// Types
export interface KYCEntreprise {
  entreprise: Entreprise | null
  profil: ProfilEntreprise | null
  profilSocial: ProfilSocialComplet | null
  adresseSiege: AdresseResult | null
  dateEnrichissement: string
  sources: string[]
  erreurs: string[]
}

export interface KYCOptions {
  includeFinances?: boolean
  includeSocial?: boolean
  includeAdresse?: boolean
}

/**
 * Enrichissement complet KYC d'une entreprise par SIREN
 */
export async function enrichirEntrepriseBySiren(
  siren: string,
  effectif?: number,
  options: KYCOptions = {}
): Promise<KYCEntreprise> {
  const result: KYCEntreprise = {
    entreprise: null,
    profil: null,
    profilSocial: null,
    adresseSiege: null,
    dateEnrichissement: new Date().toISOString(),
    sources: [],
    erreurs: [],
  }

  const opts = {
    includeFinances: true,
    includeSocial: true,
    includeAdresse: true,
    ...options,
  }

  try {
    // 1. Recherche SIRENE
    const entreprise = await rechercherParSiren(siren)
    if (entreprise) {
      result.entreprise = entreprise
      result.sources.push('API SIRENE')
    } else {
      result.erreurs.push('Entreprise non trouvée dans SIRENE')
      return result
    }

    // 2. Enrichissement profil financier
    if (opts.includeFinances) {
      try {
        result.profil = await genererProfilEntreprise(siren)
        result.sources.push('Enrichissement financier')
      } catch (e) {
        result.erreurs.push(`Enrichissement financier: ${e}`)
      }
    }

    // 3. Profil social et conventions
    if (opts.includeSocial && result.entreprise) {
      const codeNAF = result.entreprise.activite_principale || ''
      const eff = effectif || parseInt(result.entreprise.tranche_effectif_salarie || '0') || 10
      result.profilSocial = genererProfilSocial(codeNAF, eff, {})
      result.sources.push('Conventions collectives')
    }

    // 4. Géolocalisation adresse
    if (opts.includeAdresse && result.entreprise?.siege?.adresse) {
      try {
        const adresses = await rechercherAdresse(result.entreprise.siege.adresse, { limit: 1 })
        if (adresses.length > 0) {
          result.adresseSiege = adresses[0]
          result.sources.push('API BAN')
        }
      } catch (e) {
        result.erreurs.push(`Géolocalisation: ${e}`)
      }
    }

  } catch (error) {
    result.erreurs.push(`Erreur générale: ${error}`)
  }

  return result
}

/**
 * Recherche et enrichissement par nom d'entreprise
 */
export async function rechercherEtEnrichir(
  query: string,
  limit = 5
): Promise<KYCEntreprise[]> {
  const entreprises = await rechercherParNom(query, { per_page: limit })
  
  return Promise.all(
    entreprises.map(async (e) => {
      return enrichirEntrepriseBySiren(e.siren, undefined, {
        includeFinances: false,
        includeSocial: true,
        includeAdresse: false,
      })
    })
  )
}

export default {
  enrichirEntrepriseBySiren,
  rechercherEtEnrichir,
}
