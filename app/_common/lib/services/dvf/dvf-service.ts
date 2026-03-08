/**
 * Service DVF (Demandes de Valeurs Foncières)
 * 
 * Interroge l'API DVF publique (api.cquest.org) pour obtenir les prix
 * de transactions immobilières réelles en France.
 * 
 * Sources :
 *   - api.cquest.org/dvf (micro-API DVF, données DGFiP)
 *   - Données depuis 2014, hors Alsace/Moselle/Mayotte
 * 
 * L'API est gratuite et ne nécessite aucune clé.
 */

const DVF_API_BASE = 'https://api.cquest.org/dvf'
const DVF_TIMEOUT_MS = 12_000

// ============================================================================
// TYPES
// ============================================================================

export interface DVFMutation {
  id_mutation: string
  date_mutation: string
  nature_mutation: string
  valeur_fonciere: number
  adresse_numero: string | null
  adresse_suffixe: string | null
  adresse_nom_voie: string | null
  adresse_code_voie: string | null
  code_postal: string
  code_commune: string
  nom_commune: string
  code_departement: string
  type_local: string | null
  surface_reelle_bati: number | null
  nombre_pieces_principales: number | null
  surface_terrain: number | null
  longitude: number | null
  latitude: number | null
}

export interface DVFPriceStats {
  commune: string
  codePostal: string
  codeDepartement: string
  typeLocal: string
  periode: { debut: string; fin: string }
  nombreTransactions: number
  prixM2: {
    median: number
    moyen: number
    min: number
    max: number
    q1: number  // 1er quartile
    q3: number  // 3e quartile
  }
  surfaceMoyenne: number
  prixMoyen: number
  transactions: Array<{
    date: string
    prix: number
    surface: number | null
    prixM2: number | null
    pieces: number | null
    adresse: string
  }>
}

export interface DVFSearchParams {
  codeCommune?: string
  codePostal?: string
  lat?: number
  lon?: number
  dist?: number  // rayon en mètres (défaut 500)
  typeLocal?: 'Maison' | 'Appartement'
  natureMutation?: string
}

// ============================================================================
// SERVICE
// ============================================================================

export class DVFService {
  /**
   * Recherche les mutations DVF par commune ou par géolocalisation.
   */
  async searchMutations(params: DVFSearchParams): Promise<DVFMutation[]> {
    const queryParams = new URLSearchParams()

    if (params.codeCommune) {
      queryParams.set('code_commune', params.codeCommune)
    }
    if (params.lat !== undefined && params.lon !== undefined) {
      queryParams.set('lat', params.lat.toString())
      queryParams.set('lon', params.lon.toString())
      if (params.dist) queryParams.set('dist', params.dist.toString())
    }
    if (params.typeLocal) {
      queryParams.set('type_local', params.typeLocal)
    }
    if (params.natureMutation) {
      queryParams.set('nature_mutation', params.natureMutation)
    } else {
      queryParams.set('nature_mutation', 'Vente')
    }

    const url = `${DVF_API_BASE}?${queryParams.toString()}`

    // Retry with increasing timeouts (the DVF API can be slow for large cities)
    let lastError: Error | null = null
    for (const timeout of [DVF_TIMEOUT_MS, DVF_TIMEOUT_MS * 2]) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(timeout),
          headers: { 'Accept': 'application/json' },
        })

        if (!response.ok) {
          lastError = new Error(`DVF API error: ${response.status} ${response.statusText}`)
          continue
        }

        const data = await response.json()
        return (data.resultats || data.features || data || []) as DVFMutation[]
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.warn(`[DVF] Retry after error: ${lastError.message}`)
      }
    }

    throw lastError || new Error('DVF API: échec après retries')
  }

  /**
   * Calcule les statistiques de prix au m² pour une commune donnée.
   * Filtre les 2 dernières années et un type de bien spécifique.
   */
  async getPriceStats(params: {
    codeCommune?: string
    codePostal?: string
    lat?: number
    lon?: number
    dist?: number
    typeLocal?: 'Maison' | 'Appartement'
  }): Promise<DVFPriceStats | null> {
    // Résoudre le code commune à partir du code postal si nécessaire
    let codeCommune = params.codeCommune
    if (!codeCommune && params.codePostal) {
      codeCommune = await this.resolveCodeCommune(params.codePostal)
    }

    if (!codeCommune && !params.lat) {
      return null
    }

    const mutations = await this.searchMutations({
      codeCommune,
      lat: params.lat,
      lon: params.lon,
      dist: params.dist || 1000,
      typeLocal: params.typeLocal,
      natureMutation: 'Vente',
    })

    if (!mutations || mutations.length === 0) {
      return null
    }

    // Filtrer les mutations valides (avec surface et prix)
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
    const twoYearsAgoStr = twoYearsAgo.toISOString().slice(0, 10)

    const valid = mutations.filter(m =>
      m.valeur_fonciere > 0 &&
      m.surface_reelle_bati && m.surface_reelle_bati > 0 &&
      m.date_mutation >= twoYearsAgoStr
    )

    if (valid.length === 0) {
      // Fallback: use all available data without date filter
      const allValid = mutations.filter(m =>
        m.valeur_fonciere > 0 &&
        m.surface_reelle_bati && m.surface_reelle_bati > 0
      )
      if (allValid.length === 0) return null
      return this.computeStats(allValid, params.typeLocal || 'Tous')
    }

    return this.computeStats(valid, params.typeLocal || 'Tous')
  }

  /**
   * Résout un code postal en code commune via l'API Geo du gouvernement.
   */
  private async resolveCodeCommune(codePostal: string): Promise<string | undefined> {
    try {
      const response = await fetch(
        `https://geo.api.gouv.fr/communes?codePostal=${codePostal}&fields=code,nom&limit=1`,
        { signal: AbortSignal.timeout(5_000) }
      )
      if (!response.ok) return undefined
      const data = await response.json()
      if (data.length > 0) return data[0].code
    } catch {
      // ignore
    }
    return undefined
  }

  /**
   * Calcule les statistiques à partir des mutations filtrées.
   */
  private computeStats(mutations: DVFMutation[], typeLocal: string): DVFPriceStats {
    const prixM2List = mutations
      .map(m => m.valeur_fonciere / (m.surface_reelle_bati || 1))
      .sort((a, b) => a - b)

    const n = prixM2List.length
    const sum = prixM2List.reduce((a, b) => a + b, 0)
    const median = n % 2 === 0
      ? (prixM2List[n / 2 - 1] + prixM2List[n / 2]) / 2
      : prixM2List[Math.floor(n / 2)]

    const q1Index = Math.floor(n * 0.25)
    const q3Index = Math.floor(n * 0.75)

    const dates = mutations.map(m => m.date_mutation).sort()
    const surfaceSum = mutations.reduce((s, m) => s + (m.surface_reelle_bati || 0), 0)
    const prixSum = mutations.reduce((s, m) => s + m.valeur_fonciere, 0)

    // Build transaction list (max 20 most recent)
    const sorted = [...mutations].sort((a, b) => b.date_mutation.localeCompare(a.date_mutation))
    const transactions = sorted.slice(0, 20).map(m => ({
      date: m.date_mutation,
      prix: Math.round(m.valeur_fonciere),
      surface: m.surface_reelle_bati,
      prixM2: m.surface_reelle_bati ? Math.round(m.valeur_fonciere / m.surface_reelle_bati) : null,
      pieces: m.nombre_pieces_principales,
      adresse: [m.adresse_numero, m.adresse_nom_voie, m.nom_commune].filter(Boolean).join(' '),
    }))

    return {
      commune: mutations[0]?.nom_commune || '',
      codePostal: mutations[0]?.code_postal || '',
      codeDepartement: mutations[0]?.code_departement || '',
      typeLocal,
      periode: { debut: dates[0] || '', fin: dates[dates.length - 1] || '' },
      nombreTransactions: n,
      prixM2: {
        median: Math.round(median),
        moyen: Math.round(sum / n),
        min: Math.round(prixM2List[0]),
        max: Math.round(prixM2List[n - 1]),
        q1: Math.round(prixM2List[q1Index]),
        q3: Math.round(prixM2List[q3Index]),
      },
      surfaceMoyenne: Math.round(surfaceSum / n),
      prixMoyen: Math.round(prixSum / n),
      transactions,
    }
  }
}
