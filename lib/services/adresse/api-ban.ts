/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SERVICE API ADRESSE - BASE ADRESSE NATIONALE (BAN)
 * Source: https://adresse.data.gouv.fr/api-doc/adresse
 * API gratuite et officielle du gouvernement français
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface AdresseResult {
  /** Adresse complète formatée */
  label: string
  /** Score de pertinence (0 à 1) */
  score: number
  /** Type: housenumber, street, locality, municipality */
  type: 'housenumber' | 'street' | 'locality' | 'municipality'
  /** Numéro de rue */
  housenumber?: string
  /** Nom de rue */
  street?: string
  /** Nom de la commune */
  city: string
  /** Code postal */
  postcode: string
  /** Code INSEE de la commune */
  citycode: string
  /** Coordonnées GPS [longitude, latitude] */
  coordinates: [number, number]
  /** Contexte géographique (département, région) */
  context: string
  /** Département (code) */
  departement: string
  /** Région */
  region: string
}

export interface AdresseSearchParams {
  /** Texte de recherche (adresse, rue, ville...) */
  q: string
  /** Limiter les résultats (max 15) */
  limit?: number
  /** Filtrer par type */
  type?: 'housenumber' | 'street' | 'locality' | 'municipality'
  /** Filtrer par code postal */
  postcode?: string
  /** Filtrer par code INSEE */
  citycode?: string
  /** Latitude pour prioriser les résultats proches */
  lat?: number
  /** Longitude pour prioriser les résultats proches */
  lon?: number
  /** Autocomplete mode (plus rapide) */
  autocomplete?: 0 | 1
}

export interface ReverseGeocodeResult {
  /** Adresse la plus proche */
  adresse: AdresseResult | null
  /** Distance en mètres */
  distance?: number
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = 'https://api-adresse.data.gouv.fr'

// Mapping départements → régions
const DEPT_TO_REGION: Record<string, string> = {
  '01': 'Auvergne-Rhône-Alpes', '03': 'Auvergne-Rhône-Alpes', '07': 'Auvergne-Rhône-Alpes',
  '15': 'Auvergne-Rhône-Alpes', '26': 'Auvergne-Rhône-Alpes', '38': 'Auvergne-Rhône-Alpes',
  '42': 'Auvergne-Rhône-Alpes', '43': 'Auvergne-Rhône-Alpes', '63': 'Auvergne-Rhône-Alpes',
  '69': 'Auvergne-Rhône-Alpes', '73': 'Auvergne-Rhône-Alpes', '74': 'Auvergne-Rhône-Alpes',
  '21': 'Bourgogne-Franche-Comté', '25': 'Bourgogne-Franche-Comté', '39': 'Bourgogne-Franche-Comté',
  '58': 'Bourgogne-Franche-Comté', '70': 'Bourgogne-Franche-Comté', '71': 'Bourgogne-Franche-Comté',
  '89': 'Bourgogne-Franche-Comté', '90': 'Bourgogne-Franche-Comté',
  '22': 'Bretagne', '29': 'Bretagne', '35': 'Bretagne', '56': 'Bretagne',
  '18': 'Centre-Val de Loire', '28': 'Centre-Val de Loire', '36': 'Centre-Val de Loire',
  '37': 'Centre-Val de Loire', '41': 'Centre-Val de Loire', '45': 'Centre-Val de Loire',
  '2A': 'Corse', '2B': 'Corse',
  '08': 'Grand Est', '10': 'Grand Est', '51': 'Grand Est', '52': 'Grand Est',
  '54': 'Grand Est', '55': 'Grand Est', '57': 'Grand Est', '67': 'Grand Est',
  '68': 'Grand Est', '88': 'Grand Est',
  '02': 'Hauts-de-France', '59': 'Hauts-de-France', '60': 'Hauts-de-France',
  '62': 'Hauts-de-France', '80': 'Hauts-de-France',
  '75': 'Île-de-France', '77': 'Île-de-France', '78': 'Île-de-France',
  '91': 'Île-de-France', '92': 'Île-de-France', '93': 'Île-de-France',
  '94': 'Île-de-France', '95': 'Île-de-France',
  '14': 'Normandie', '27': 'Normandie', '50': 'Normandie', '61': 'Normandie', '76': 'Normandie',
  '16': 'Nouvelle-Aquitaine', '17': 'Nouvelle-Aquitaine', '19': 'Nouvelle-Aquitaine',
  '23': 'Nouvelle-Aquitaine', '24': 'Nouvelle-Aquitaine', '33': 'Nouvelle-Aquitaine',
  '40': 'Nouvelle-Aquitaine', '47': 'Nouvelle-Aquitaine', '64': 'Nouvelle-Aquitaine',
  '79': 'Nouvelle-Aquitaine', '86': 'Nouvelle-Aquitaine', '87': 'Nouvelle-Aquitaine',
  '09': 'Occitanie', '11': 'Occitanie', '12': 'Occitanie', '30': 'Occitanie',
  '31': 'Occitanie', '32': 'Occitanie', '34': 'Occitanie', '46': 'Occitanie',
  '48': 'Occitanie', '65': 'Occitanie', '66': 'Occitanie', '81': 'Occitanie', '82': 'Occitanie',
  '44': 'Pays de la Loire', '49': 'Pays de la Loire', '53': 'Pays de la Loire',
  '72': 'Pays de la Loire', '85': 'Pays de la Loire',
  '04': "Provence-Alpes-Côte d'Azur", '05': "Provence-Alpes-Côte d'Azur",
  '06': "Provence-Alpes-Côte d'Azur", '13': "Provence-Alpes-Côte d'Azur",
  '83': "Provence-Alpes-Côte d'Azur", '84': "Provence-Alpes-Côte d'Azur",
  '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane', '974': 'La Réunion', '976': 'Mayotte',
}

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS PRINCIPALES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Recherche d'adresses avec autocomplétion
 * @param query Texte de recherche (minimum 3 caractères recommandé)
 * @param options Options de filtrage
 * @returns Liste d'adresses correspondantes
 */
export async function rechercherAdresse(
  query: string,
  options: Omit<AdresseSearchParams, 'q'> = {}
): Promise<AdresseResult[]> {
  if (!query || query.trim().length < 3) {
    return []
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      limit: String(options.limit || 10),
      autocomplete: String(options.autocomplete ?? 1),
    })

    if (options.type) params.append('type', options.type)
    if (options.postcode) params.append('postcode', options.postcode)
    if (options.citycode) params.append('citycode', options.citycode)
    if (options.lat) params.append('lat', String(options.lat))
    if (options.lon) params.append('lon', String(options.lon))

    const response = await fetch(`${API_BASE_URL}/search/?${params}`)

    if (!response.ok) {
      console.error('[BAN] Erreur API:', response.status)
      return []
    }

    const data = await response.json()

    return (data.features || []).map((feature: any) => {
      const props = feature.properties
      const coords = feature.geometry.coordinates
      const dept = props.citycode?.substring(0, 2) || ''

      return {
        label: props.label,
        score: props.score,
        type: props.type,
        housenumber: props.housenumber,
        street: props.street,
        city: props.city,
        postcode: props.postcode,
        citycode: props.citycode,
        coordinates: coords as [number, number],
        context: props.context,
        departement: dept,
        region: DEPT_TO_REGION[dept] || '',
      }
    })
  } catch (error) {
    console.error('[BAN] Erreur recherche adresse:', error)
    return []
  }
}

/**
 * Recherche de communes uniquement
 */
export async function rechercherCommune(query: string, limit = 10): Promise<AdresseResult[]> {
  return rechercherAdresse(query, { type: 'municipality', limit })
}

/**
 * Recherche d'adresses par code postal
 */
export async function rechercherParCodePostal(
  codePostal: string,
  query?: string
): Promise<AdresseResult[]> {
  if (!/^\d{5}$/.test(codePostal)) {
    return []
  }

  return rechercherAdresse(query || codePostal, { postcode: codePostal })
}

/**
 * Géocodage inverse: coordonnées → adresse
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<ReverseGeocodeResult> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/reverse/?lon=${lon}&lat=${lat}`
    )

    if (!response.ok) {
      return { adresse: null }
    }

    const data = await response.json()
    const feature = data.features?.[0]

    if (!feature) {
      return { adresse: null }
    }

    const props = feature.properties
    const coords = feature.geometry.coordinates
    const dept = props.citycode?.substring(0, 2) || ''

    return {
      adresse: {
        label: props.label,
        score: props.score,
        type: props.type,
        housenumber: props.housenumber,
        street: props.street,
        city: props.city,
        postcode: props.postcode,
        citycode: props.citycode,
        coordinates: coords as [number, number],
        context: props.context,
        departement: dept,
        region: DEPT_TO_REGION[dept] || '',
      },
      distance: props.distance,
    }
  } catch (error) {
    console.error('[BAN] Erreur reverse geocode:', error)
    return { adresse: null }
  }
}

/**
 * Valide et normalise une adresse
 */
export async function validerAdresse(adresse: string): Promise<AdresseResult | null> {
  const results = await rechercherAdresse(adresse, { limit: 1, autocomplete: 0 })
  return results[0] || null
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════════

export const APIAdresseBAN = {
  rechercherAdresse,
  rechercherCommune,
  rechercherParCodePostal,
  reverseGeocode,
  validerAdresse,
  API_BASE_URL,
  DEPT_TO_REGION,
}

export default APIAdresseBAN
