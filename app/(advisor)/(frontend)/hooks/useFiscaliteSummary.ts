'use client'

/**
 * useFiscaliteSummary - Hook partagé pour les données fiscales
 * 
 * Réutilise la même logique que TabFiscaliteComplete pour garantir
 * la cohérence des données affichées dans tous les onglets.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'

// Barème IR 2024 - Identique à TabFiscaliteComplete
const IR_BRACKETS_2024 = [
  { min: 0, max: 11294, rate: 0 },
  { min: 11294, max: 28797, rate: 11 },
  { min: 28797, max: 82341, rate: 30 },
  { min: 82341, max: 177106, rate: 41 },
  { min: 177106, max: Infinity, rate: 45 },
]

// Barème IFI 2024 - Identique à TabFiscaliteComplete
const IFI_BRACKETS_2024 = [
  { min: 0, max: 800000, rate: 0 },
  { min: 800000, max: 1300000, rate: 0.5 },
  { min: 1300000, max: 2570000, rate: 0.7 },
  { min: 2570000, max: 5000000, rate: 1 },
  { min: 5000000, max: 10000000, rate: 1.25 },
  { min: 10000000, max: Infinity, rate: 1.5 },
]

type FrequencePrisma = 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL' | 'PONCTUEL'

interface RevenueItem {
  id: string
  category?: string
  categorie?: string
  amount?: number
  montant?: number
  montantNet?: number
  frequency?: FrequencePrisma
  frequence?: FrequencePrisma
}

interface FamilyMember {
  relationship?: string
  relation?: string
  role?: string
  isFiscalDependent?: boolean
  isDependent?: boolean
  aCharge?: boolean
  gardeAlternee?: boolean
  sharedCustody?: boolean
}

export interface FiscaliteSummary {
  // IR
  revenusBruts: number
  revenuNetImposable: number
  irEstime: number
  tmi: number
  tmiLabel: string
  tauxEffectif: number
  partsFiscales: number
  mensualiteIR: number
  
  // IFI
  patrimoineImmobilier: number
  ifiEstime: number
  ifiAssujetti: boolean
  
  // Disponibilité
  hasData: boolean

  // Chargement
  isLoading: boolean
  error: string | null
  
  // Refresh
  refresh: () => Promise<void>
}

// Convertir fréquence en annuel
function toAnnual(amount: number, frequency: FrequencePrisma): number {
  const factors: Record<FrequencePrisma, number> = {
    MENSUEL: 12,
    TRIMESTRIEL: 4,
    SEMESTRIEL: 2,
    ANNUEL: 1,
    PONCTUEL: 1,
  }
  return amount * (factors[frequency] || 12)
}

// Calculer les parts fiscales - Même logique que TabFiscaliteComplete
function calculatePartsFiscales(
  maritalStatus: string,
  nbEnfantsCharge: number,
  nbEnfantsGardeAlternee: number,
  parentIsole: boolean
): number {
  let parts = 1

  const status = maritalStatus?.toUpperCase() || ''
  if (['MARRIED', 'MARIE', 'PACS', 'CIVIL_UNION'].includes(status)) {
    parts = 2
  } else if (parentIsole) {
    parts = 1.5
  }

  // Enfants à charge complète
  if (nbEnfantsCharge >= 1) parts += 0.5
  if (nbEnfantsCharge >= 2) parts += 0.5
  if (nbEnfantsCharge >= 3) parts += (nbEnfantsCharge - 2)

  // Enfants en garde alternée (demi-parts)
  if (nbEnfantsGardeAlternee >= 1) parts += 0.25
  if (nbEnfantsGardeAlternee >= 2) parts += 0.25
  if (nbEnfantsGardeAlternee >= 3) parts += (nbEnfantsGardeAlternee - 2) * 0.5

  return parts
}

// Calculer l'IR - Même logique que TabFiscaliteComplete
function calculateIR(revenuNetImposable: number, partsFiscales: number) {
  if (revenuNetImposable <= 0) {
    return { impot: 0, tmi: 0 }
  }

  const quotientFamilial = revenuNetImposable / partsFiscales
  let impotBrut = 0
  let tmi = 0

  for (const bracket of IR_BRACKETS_2024) {
    if (quotientFamilial > bracket.min) {
      const taxableInBracket = Math.min(quotientFamilial, bracket.max) - bracket.min
      impotBrut += taxableInBracket * (bracket.rate / 100)
      tmi = bracket.rate
    }
  }

  return {
    impot: Math.round(impotBrut * partsFiscales),
    tmi,
  }
}

// Calculer l'IFI - Même logique que TabFiscaliteComplete
function calculateIFI(patrimoineImmobilier: number) {
  if (patrimoineImmobilier < 1300000) {
    return { impot: 0, assujetti: false }
  }

  let impot = 0
  for (const bracket of IFI_BRACKETS_2024) {
    if (patrimoineImmobilier > bracket.min) {
      const taxableInBracket = Math.min(patrimoineImmobilier, bracket.max) - bracket.min
      impot += taxableInBracket * (bracket.rate / 100)
    }
  }

  return {
    impot: Math.round(impot),
    assujetti: true,
  }
}

export function useFiscaliteSummary(
  clientId: string,
  maritalStatus?: string,
  numberOfChildren?: number,
  familyMembers?: FamilyMember[],
  annualIncome?: number,
  profession?: string
): FiscaliteSummary {
  const [revenues, setRevenues] = useState<RevenueItem[]>([])
  const [actifs, setActifs] = useState<Array<{ type: string; value: number }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch des données
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const fetchOptions: RequestInit = { credentials: 'include' }
      const [revRes, actifRes] = await Promise.all([
        fetch(`/api/advisor/clients/${clientId}/revenues`, fetchOptions),
        fetch(`/api/advisor/clients/${clientId}/actifs`, fetchOptions),
      ])

      if (revRes.ok) {
        const revData = await revRes.json()
        // API returns { data: [...] } or { data: { revenues: [...] } }
        const revenues = revData.data?.revenues || revData.data || []
        setRevenues(Array.isArray(revenues) ? revenues : [])
      }
      if (actifRes.ok) {
        const actifData = await actifRes.json()
        // API returns { data: { actifs: [...] } }
        const actifs = actifData.data?.actifs || actifData.data || []
        setActifs(Array.isArray(actifs) ? actifs : [])
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

  // Compter les enfants depuis familyMembers - Même logique que TabFiscaliteComplete
  const enfantsFromFamily = useMemo(() => {
    const members = familyMembers || []
    let nbCharge = 0
    let nbGardeAlternee = 0

    members.forEach(m => {
      const relation = String(m.relationship || m.relation || m.role || '').toUpperCase()
      const isEnfant = relation.includes('ENFANT') || relation.includes('CHILD')
      const isDependent = Boolean(m.isFiscalDependent || m.isDependent || m.aCharge)
      const gardeAlternee = Boolean(m.gardeAlternee || m.sharedCustody)

      if (isEnfant && isDependent) {
        if (gardeAlternee) {
          nbGardeAlternee++
        } else {
          nbCharge++
        }
      }
    })

    // Fallback sur numberOfChildren
    if (nbCharge === 0 && nbGardeAlternee === 0 && (numberOfChildren || 0) > 0) {
      nbCharge = numberOfChildren || 0
    }

    return { nbCharge, nbGardeAlternee }
  }, [familyMembers, numberOfChildren])

  // Calcul des revenus annuels par catégorie - Même logique que TabFiscaliteComplete
  const revenusParCategorie = useMemo(() => {
    let salaires = 0
    let revenusTNS = 0
    let revenusFonciers = 0
    let revenusCapitaux = 0
    let pensions = 0
    let autres = 0

    revenues.forEach(r => {
      // Support both EN and FR field names
      const amount = Number(r.amount ?? r.montant ?? r.montantNet ?? 0)
      const freq = (r.frequency ?? r.frequence ?? 'MENSUEL') as FrequencePrisma
      const annual = toAnnual(amount, freq)
      const cat = (r.category ?? r.categorie ?? '').toUpperCase()

      if (cat.includes('SALAIRE') || cat.includes('PRIME') || cat.includes('BONUS')) {
        salaires += annual
      } else if (cat.includes('TNS') || cat.includes('BIC') || cat.includes('BNC') || cat.includes('INDEPENDANT')) {
        revenusTNS += annual
      } else if (cat.includes('FONCIER') || cat.includes('LOYER') || cat.includes('LOCATIF')) {
        revenusFonciers += annual
      } else if (cat.includes('DIVIDENDE') || cat.includes('INTERET') || cat.includes('CAPITAL')) {
        revenusCapitaux += annual
      } else if (cat.includes('PENSION') || cat.includes('RETRAITE')) {
        pensions += annual
      } else {
        autres += annual
      }
    })

    return { salaires, revenusTNS, revenusFonciers, revenusCapitaux, pensions, autres }
  }, [revenues])

  // Patrimoine immobilier pour IFI
  const patrimoineImmobilier = useMemo(() => {
    // Support both EN and FR type names
    const TYPES_IMMOBILIER = [
      // EN
      'REAL_ESTATE_MAIN', 'REAL_ESTATE_RENTAL', 'REAL_ESTATE_SECONDARY',
      'REAL_ESTATE_COMMERCIAL', 'SCPI', 'SCI', 'OPCI',
      // FR
      'RESIDENCE_PRINCIPALE', 'IMMOBILIER_LOCATIF', 'RESIDENCE_SECONDAIRE',
      'IMMOBILIER_COMMERCIAL', 'CROWDFUNDING_IMMO', 'VIAGER', 'NUE_PROPRIETE', 'USUFRUIT'
    ]
    // S'assurer que actifs est un tableau
    const actifsArray = Array.isArray(actifs) ? actifs : []
    return actifsArray
      .filter(a => TYPES_IMMOBILIER.includes(a.type))
      .reduce((sum, a) => sum + (Number(a.value) || 0), 0)
  }, [actifs])

  // Parts fiscales
  const partsFiscales = useMemo(() => 
    calculatePartsFiscales(
      maritalStatus || '',
      enfantsFromFamily.nbCharge,
      enfantsFromFamily.nbGardeAlternee,
      false
    ),
    [maritalStatus, enfantsFromFamily]
  )

  // Calcul IR - Même logique que TabFiscaliteComplete
  const irCalculation = useMemo(() => {
    let { salaires, revenusTNS, revenusFonciers, revenusCapitaux, pensions, autres } = revenusParCategorie
    let revenusBruts = salaires + revenusTNS + revenusFonciers + revenusCapitaux + pensions + autres
    
    // Fallback sur client.annualIncome si aucun revenu trouvé - même logique que TabFiscaliteComplete
    if (revenusBruts === 0 && annualIncome && annualIncome > 0) {
      const prof = (profession || '').toLowerCase()
      if (prof.includes('libéral') || prof.includes('médecin') || prof.includes('avocat') || prof.includes('indépendant')) {
        revenusTNS = annualIncome
      } else {
        salaires = annualIncome
      }
      revenusBruts = annualIncome
    }

    // Abattement 10% sur salaires et pensions (plafonné)
    const abattementSalaires = Math.min(salaires * 0.10, 14171)
    const abattementPensions = Math.min(pensions * 0.10, 4321)

    const revenuNetImposable = Math.max(0, revenusBruts - abattementSalaires - abattementPensions)
    const { impot, tmi } = calculateIR(revenuNetImposable, partsFiscales)
    const tauxEffectif = revenuNetImposable > 0 ? (impot / revenuNetImposable) * 100 : 0

    return {
      revenusBruts,
      revenuNetImposable,
      impot,
      tmi,
      tauxEffectif,
      mensualite: Math.round(impot / 12),
    }
  }, [revenusParCategorie, partsFiscales, annualIncome, profession])

  // Calcul IFI
  const ifiCalculation = useMemo(() => 
    calculateIFI(patrimoineImmobilier),
    [patrimoineImmobilier]
  )

  const hasData = (Array.isArray(revenues) && revenues.length > 0) || (Array.isArray(actifs) && actifs.length > 0) || (annualIncome && annualIncome > 0)

  return {
    revenusBruts: irCalculation.revenusBruts,
    revenuNetImposable: irCalculation.revenuNetImposable,
    irEstime: irCalculation.impot,
    tmi: irCalculation.tmi,
    tmiLabel: `${irCalculation.tmi}%`,
    tauxEffectif: irCalculation.tauxEffectif,
    partsFiscales,
    mensualiteIR: irCalculation.mensualite,
    patrimoineImmobilier,
    ifiEstime: ifiCalculation.impot,
    ifiAssujetti: ifiCalculation.assujetti,
    hasData,
    isLoading,
    error,
    refresh: fetchData,
  }
}
