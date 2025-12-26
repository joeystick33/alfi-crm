'use client'

/**
 * usePatrimoineSummary - Hook partagé pour les données patrimoine
 * 
 * Réutilise la même logique que TabPatrimoineReporting pour garantir
 * la cohérence des données affichées dans tous les onglets.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'

// Interfaces supportant les deux formats EN et FR de l'API
interface ActifItem {
  id: string
  name?: string
  nom?: string
  type: string
  category?: string
  categorie?: string
  value?: number
  valeur?: number
  valorisationActuelle?: number
}

interface PassifItem {
  id: string
  name?: string
  nom?: string
  type: string
  remainingAmount?: number
  capitalRestant?: number
  monthlyPayment?: number
  mensualite?: number
}

interface ContratItem {
  id: string
  name?: string
  nom?: string
  type: string
  value?: number
  valeur?: number
}

export interface PatrimoineSummary {
  // Totaux
  totalActifs: number
  totalPassifs: number
  patrimoineNet: number
  
  // Répartition actifs par catégorie
  actifsByCategory: Record<string, number>
  
  // Catégories principales
  immobilier: number
  financier: number
  epargneSalariale: number
  epargneRetraite: number
  professionnel: number
  mobilier: number
  
  // Contrats
  contrats: {
    total: number
    assuranceVie: number
    retraite: number
    prevoyance: number
    valeurTotale: number
  }
  
  // Évolution (placeholder)
  evolution: Array<{ month: string; value: number }>
  
  // Disponibilité
  hasData: boolean

  // Chargement
  isLoading: boolean
  error: string | null
  
  // Refresh
  refresh: () => Promise<void>
}

// Mapping type actif -> catégorie (EN + FR)
const TYPE_TO_CATEGORY: Record<string, string> = {
  // Immobilier - EN
  REAL_ESTATE_MAIN: 'IMMOBILIER',
  REAL_ESTATE_RENTAL: 'IMMOBILIER',
  REAL_ESTATE_SECONDARY: 'IMMOBILIER',
  REAL_ESTATE_COMMERCIAL: 'IMMOBILIER',
  SCPI: 'IMMOBILIER',
  SCI: 'IMMOBILIER',
  OPCI: 'IMMOBILIER',
  CROWDFUNDING_IMMO: 'IMMOBILIER',
  VIAGER: 'IMMOBILIER',
  NUE_PROPRIETE: 'IMMOBILIER',
  USUFRUIT: 'IMMOBILIER',
  // Immobilier - FR
  RESIDENCE_PRINCIPALE: 'IMMOBILIER',
  RESIDENCE_SECONDAIRE: 'IMMOBILIER',
  IMMOBILIER_LOCATIF: 'IMMOBILIER',
  IMMOBILIER_COMMERCIAL: 'IMMOBILIER',
  TERRAIN: 'IMMOBILIER',
  PARKING: 'IMMOBILIER',
  
  // Financier - EN
  LIFE_INSURANCE: 'FINANCIER',
  CAPITALIZATION_CONTRACT: 'FINANCIER',
  SECURITIES_ACCOUNT: 'FINANCIER',
  PEA: 'FINANCIER',
  PEA_PME: 'FINANCIER',
  BANK_ACCOUNT: 'FINANCIER',
  SAVINGS_ACCOUNT: 'FINANCIER',
  PEL: 'FINANCIER',
  CEL: 'FINANCIER',
  TERM_DEPOSIT: 'FINANCIER',
  // Financier - FR
  ASSURANCE_VIE: 'FINANCIER',
  CONTRAT_CAPITALISATION: 'FINANCIER',
  COMPTE_TITRES: 'FINANCIER',
  COMPTE_BANCAIRE: 'FINANCIER',
  LIVRETS: 'FINANCIER',
  COMPTE_A_TERME: 'FINANCIER',
  
  // Épargne salariale (commun EN/FR)
  PEE: 'EPARGNE_SALARIALE',
  PEG: 'EPARGNE_SALARIALE',
  PERCO: 'EPARGNE_SALARIALE',
  PERECO: 'EPARGNE_SALARIALE',
  CET: 'EPARGNE_SALARIALE',
  PARTICIPATION: 'EPARGNE_SALARIALE',
  INTERESSEMENT: 'EPARGNE_SALARIALE',
  STOCK_OPTIONS: 'EPARGNE_SALARIALE',
  ACTIONS_GRATUITES: 'EPARGNE_SALARIALE',
  BSPCE: 'EPARGNE_SALARIALE',
  
  // Épargne retraite (commun EN/FR)
  PER: 'EPARGNE_RETRAITE',
  PERP: 'EPARGNE_RETRAITE',
  MADELIN: 'EPARGNE_RETRAITE',
  ARTICLE_83: 'EPARGNE_RETRAITE',
  PREFON: 'EPARGNE_RETRAITE',
  COREM: 'EPARGNE_RETRAITE',
  
  // Professionnel - EN
  COMPANY_SHARES: 'PROFESSIONNEL',
  PROFESSIONAL_REAL_ESTATE: 'PROFESSIONNEL',
  PROFESSIONAL_EQUIPMENT: 'PROFESSIONNEL',
  GOODWILL: 'PROFESSIONNEL',
  PATENTS_IP: 'PROFESSIONNEL',
  // Professionnel - FR
  PARTS_SOCIALES: 'PROFESSIONNEL',
  FONDS_COMMERCE: 'PROFESSIONNEL',
  MATERIEL_PROFESSIONNEL: 'PROFESSIONNEL',
  
  // Mobilier - EN
  PRECIOUS_METALS: 'MOBILIER',
  JEWELRY: 'MOBILIER',
  ART_COLLECTION: 'MOBILIER',
  WINE_COLLECTION: 'MOBILIER',
  WATCHES: 'MOBILIER',
  VEHICLES: 'MOBILIER',
  FURNITURE: 'MOBILIER',
  CRYPTO: 'MOBILIER',
  NFT: 'MOBILIER',
  OTHER: 'MOBILIER',
  // Mobilier - FR
  METAUX_PRECIEUX: 'MOBILIER',
  BIJOUX: 'MOBILIER',
  OEUVRES_ART: 'MOBILIER',
  COLLECTION_VINS: 'MOBILIER',
  MONTRES: 'MOBILIER',
  VEHICULES: 'MOBILIER',
  MOBILIER: 'MOBILIER',
  CRYPTOMONNAIES: 'MOBILIER',
  AUTRE: 'MOBILIER',
}

// Types pour les contrats - support EN et FR
const ACTIFS_ASSURANCE_VIE = [
  'LIFE_INSURANCE', 'CAPITALIZATION_CONTRACT', // EN
  'ASSURANCE_VIE', 'CONTRAT_CAPITALISATION',   // FR
]
const ACTIFS_RETRAITE = [
  'PER', 'PERP', 'MADELIN', 'ARTICLE_83', 'PREFON', 'COREM', // Communs
  'PERCO', 'PERECO', // Épargne retraite salariale
]
const CONTRATS_PREVOYANCE = [
  'DEATH_INSURANCE', 'DISABILITY_INSURANCE', 'HEALTH_INSURANCE', // EN
  'HOME_INSURANCE', 'CAR_INSURANCE', 'PROFESSIONAL_INSURANCE',   // Autres assurances EN
]

export function usePatrimoineSummary(clientId: string): PatrimoineSummary {
  const [actifs, setActifs] = useState<ActifItem[]>([])
  const [passifs, setPassifs] = useState<PassifItem[]>([])
  const [contrats, setContrats] = useState<ContratItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch des données
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const fetchOptions: RequestInit = { credentials: 'include' }
      const [actifRes, passifRes, contratRes] = await Promise.all([
        fetch(`/api/advisor/clients/${clientId}/actifs`, fetchOptions),
        fetch(`/api/advisor/clients/${clientId}/passifs`, fetchOptions),
        fetch(`/api/advisor/clients/${clientId}/contrats`, fetchOptions),
      ])

      if (actifRes.ok) {
        const data = await actifRes.json()
        // API returns { data: { actifs: [...], count: ... } }
        const actifs = data.data?.actifs || data.data || []
        setActifs(Array.isArray(actifs) ? actifs : [])
      }
      if (passifRes.ok) {
        const data = await passifRes.json()
        // API returns { data: { passifs: [...], count: ... } }
        const passifs = data.data?.passifs || data.data || []
        setPassifs(Array.isArray(passifs) ? passifs : [])
      }
      if (contratRes.ok) {
        const data = await contratRes.json()
        // API returns { data: { contrats: [...], count: ... } } or { data: [...] }
        const contrats = data.data?.contrats || data.data || []
        setContrats(Array.isArray(contrats) ? contrats : [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calcul des totaux - S'assurer que les données sont des tableaux
  // Support both EN and FR field names
  const totalActifs = useMemo(() => {
    const arr = Array.isArray(actifs) ? actifs : []
    return arr.reduce((sum, a) => sum + Number(a.value ?? a.valeur ?? a.valorisationActuelle ?? 0), 0)
  }, [actifs])

  const totalPassifs = useMemo(() => {
    const arr = Array.isArray(passifs) ? passifs : []
    return arr.reduce((sum, p) => sum + Number(p.remainingAmount ?? p.capitalRestant ?? 0), 0)
  }, [passifs])

  const patrimoineNet = totalActifs - totalPassifs

  // Répartition par catégorie
  const actifsByCategory = useMemo(() => {
    const result: Record<string, number> = {}
    const arr = Array.isArray(actifs) ? actifs : []
    arr.forEach(a => {
      const cat = TYPE_TO_CATEGORY[a.type] || a.category || a.categorie || 'AUTRE'
      const value = Number(a.value ?? a.valeur ?? a.valorisationActuelle ?? 0)
      result[cat] = (result[cat] || 0) + value
    })
    return result
  }, [actifs])

  // Catégories principales
  const immobilier = actifsByCategory['IMMOBILIER'] || 0
  const financier = actifsByCategory['FINANCIER'] || 0
  const epargneSalariale = actifsByCategory['EPARGNE_SALARIALE'] || 0
  const epargneRetraite = actifsByCategory['EPARGNE_RETRAITE'] || 0
  const professionnel = actifsByCategory['PROFESSIONNEL'] || 0
  const mobilier = actifsByCategory['MOBILIER'] || 0

  // Contrats - Combiner actifs financiers et contrats d'assurance
  // Support both EN and FR type names
  const contratsData = useMemo(() => {
    const actifsArr = Array.isArray(actifs) ? actifs : []
    const contratsArr = Array.isArray(contrats) ? contrats : []
    
    // Actifs financiers type assurance-vie (EN + FR)
    const ASSURANCE_VIE_TYPES = [...ACTIFS_ASSURANCE_VIE, 'ASSURANCE_VIE', 'CONTRAT_CAPITALISATION']
    const assuranceVieActifs = actifsArr.filter(a => ASSURANCE_VIE_TYPES.includes(a.type))
    
    // Actifs financiers type retraite (EN + FR)
    const RETRAITE_TYPES = [...ACTIFS_RETRAITE, 'PER', 'PERP', 'MADELIN', 'ARTICLE_83', 'PREFON', 'COREM', 'PERCO', 'PERECO']
    const retraiteActifs = actifsArr.filter(a => RETRAITE_TYPES.includes(a.type))
    
    // Contrats prévoyance
    const prevoyanceContrats = contratsArr.filter(c => CONTRATS_PREVOYANCE.includes(c.type))

    // Helper pour extraire la valeur
    const getValue = (item: ActifItem | ContratItem) => Number(item.value ?? item.valeur ?? 0)

    return {
      total: assuranceVieActifs.length + retraiteActifs.length + prevoyanceContrats.length,
      assuranceVie: assuranceVieActifs.length,
      retraite: retraiteActifs.length,
      prevoyance: prevoyanceContrats.length,
      valeurTotale: 
        assuranceVieActifs.reduce((sum, a) => sum + getValue(a), 0) +
        retraiteActifs.reduce((sum, a) => sum + getValue(a), 0) +
        prevoyanceContrats.reduce((sum, c) => sum + getValue(c), 0),
    }
  }, [actifs, contrats])

  // Évolution du patrimoine - useMemo pour générer les données (API ou fallback)
  const evolution = useMemo(() => {
    // Générer des données basées sur le patrimoine actuel
    // L'API d'évolution sera appelée séparément si nécessaire
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const result: Array<{ month: string; value: number }> = []
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1)
      // Simulation de croissance progressive basée sur le patrimoine net actuel
      const growthFactor = 0.95 + ((12 - i) * 0.005)
      result.push({
        month: date.toISOString(),
        value: Math.round((patrimoineNet || 0) * growthFactor),
      })
    }
    return result
  }, [patrimoineNet])

  return {
    totalActifs,
    totalPassifs,
    patrimoineNet,
    actifsByCategory,
    immobilier,
    financier,
    epargneSalariale,
    epargneRetraite,
    professionnel,
    mobilier,
    contrats: contratsData,
    evolution,
    hasData: (Array.isArray(actifs) && actifs.length > 0) || (Array.isArray(passifs) && passifs.length > 0) || (Array.isArray(contrats) && contrats.length > 0),
    isLoading,
    error,
    refresh: fetchData,
  }
}
