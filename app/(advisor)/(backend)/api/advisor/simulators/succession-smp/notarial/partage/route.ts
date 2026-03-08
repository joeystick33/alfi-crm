// ============================================================
// API Route: POST /api/advisor/simulators/succession-smp/notarial/partage
// Calcul notarial (ab intestat / DDV) — accepte NotarialRequestDTO du frontend
// Convertit le format heritiers[] → children/siblings/parents pour réutiliser les engines
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { simulate } from '../../engines/inheritance-simulation-engine'
import { buildHeirs } from '../../engines/legal-devolution-engine'
import { availableQuotaFraction } from '../../engines/forced-heirship-calculator'
import { logger } from '@/app/_common/lib/logger'
import type {
  InheritanceInput,
  HeirInput,
  MaritalStatusEnum,
  SpouseOptionEnum,
  RelationshipEnum,
} from '../../types'

// --- DTO from frontend buildNotarialRequestDTO ---
interface NotarialPartageRequest {
  patrimoine: number
  statut: string | null
  conjointUsufruit: boolean
  ageConjoint: number | null
  donationDernierVivantOption: string | null
  heritiers: Array<{
    nom: string
    lien: string
    estConjoint: boolean
    fiscalConditions?: { handicap?: boolean } | null
    souche?: string | null
    representant?: boolean
  }>
  liberalites: Array<{
    type?: string
    valeur: number
    horsPart?: boolean
    beneficiaireNom?: string
    dateActe?: string | null
  }>
  dateDeces: string | null
  residencePrincipale: { valeur: number; occupationEligibleAuDeces: boolean } | null
  residencePrincipaleRepartition?: any
  actifsPatrimoniaux?: any[]
}

export async function POST(req: NextRequest) {
  try {
    const body: NotarialPartageRequest = await req.json()

    const {
      patrimoine = 0,
      statut,
      conjointUsufruit = false,
      ageConjoint,
      donationDernierVivantOption,
      heritiers = [],
      liberalites = [],
      dateDeces,
      residencePrincipale,
    } = body

    // Map statut to enum
    const maritalStatusEnum = mapStatut(statut)
    const isMarie = maritalStatusEnum === 'MARRIED'
    const isPacse = maritalStatusEnum === 'PACSED'
    const hasSpouse = heritiers.some(h => h.estConjoint || h.lien === 'CONJOINT' || h.lien === 'PARTENAIRE_PACS')

    // Determine spouse option
    let spouseOption: SpouseOptionEnum | null = null
    if (donationDernierVivantOption) {
      spouseOption = mapDDVOption(donationDernierVivantOption)
    } else if (isMarie && hasSpouse && conjointUsufruit) {
      spouseOption = 'USUFRUIT_TOTAL'
    } else if (isMarie && hasSpouse) {
      spouseOption = 'QUART_PLEINE_PROPRIETE'
    }

    // Extract spouse name
    const conjointHeritier = heritiers.find(h => h.estConjoint || h.lien === 'CONJOINT' || h.lien === 'PARTENAIRE_PACS')
    const spouseName = conjointHeritier?.nom || 'Conjoint'

    // Extract children, handling representation (prédécédé)
    const childrenNames: string[] = []
    const childSoucheMap: Record<string, string> = {}
    const disabledChildren = new Set<string>()
    const representationMap: Record<string, string[]> = {}

    const enfantHeritiers = heritiers.filter(h =>
      h.lien === 'ENFANT' || h.lien === 'PETIT_ENFANT' || h.lien === 'ARRIERE_PETIT_ENFANT',
    )

    // Group representants by souche
    const souchesMap = new Map<string, string[]>()
    for (const h of enfantHeritiers) {
      if (h.representant && h.souche) {
        if (!souchesMap.has(h.souche)) souchesMap.set(h.souche, [])
        souchesMap.get(h.souche)!.push(h.nom)
      }
    }

    // Direct children (non-representants)
    const directChildren = enfantHeritiers.filter(h => !h.representant)
    for (const h of directChildren) {
      // Check if this child has representants (prédécédé)
      const souche = h.souche || h.nom
      if (souchesMap.has(souche)) {
        // Prédécédé — add representants instead
        const reps = souchesMap.get(souche)!
        for (const repName of reps) {
          childrenNames.push(repName)
          childSoucheMap[repName] = h.nom
        }
      } else {
        childrenNames.push(h.nom)
        if (h.fiscalConditions?.handicap) disabledChildren.add(h.nom)
      }
    }

    // Also add representants that have no direct parent in the list
    for (const h of enfantHeritiers) {
      if (h.representant && h.souche && !directChildren.some(d => (d.souche || d.nom) === h.souche)) {
        if (!childrenNames.includes(h.nom)) {
          childrenNames.push(h.nom)
          childSoucheMap[h.nom] = h.souche
        }
      }
    }

    // Extract parents
    const pereHeritier = heritiers.find(h => h.lien === 'PERE')
    const mereHeritier = heritiers.find(h => h.lien === 'MERE')

    // Extract siblings
    const aliveSiblings: string[] = []
    const siblingHeritiers = heritiers.filter(h => h.lien === 'FRERE' || h.lien === 'SOEUR')
    for (const h of siblingHeritiers) {
      if (!h.representant) {
        aliveSiblings.push(h.nom)
      }
    }
    // Sibling representants (neveux/nièces)
    const neveuHeritiers = heritiers.filter(h => h.lien === 'NEVEU' || h.lien === 'NIECE')
    for (const h of neveuHeritiers) {
      if (h.representant && h.souche) {
        if (!representationMap[h.souche]) representationMap[h.souche] = []
        representationMap[h.souche].push(h.nom)
      }
    }

    const allCommonChildren = true // Default for notarial request

    // Build heirs using legal devolution engine
    const allocatedHeirs: HeirInput[] = buildHeirs({
      maritalStatus: maritalStatusEnum,
      hasSpouse,
      spouseName,
      children: childrenNames,
      hasAllCommonChildren: allCommonChildren,
      hasLastSurvivorDonation: !!donationDernierVivantOption,
      hasWill: false,
      fatherAlive: !!pereHeritier,
      motherAlive: !!mereHeritier,
      fatherName: pereHeritier?.nom || 'Père',
      motherName: mereHeritier?.nom || 'Mère',
      aliveSiblings,
      representationMap,
      disabledChildren,
      spouseOption,
      childSoucheMap,
    })

    // RP value
    const rpOccupied = residencePrincipale?.occupationEligibleAuDeces || false
    const rpValue = rpOccupied ? (residencePrincipale?.valeur || 0) : 0

    // Sum liberalites
    const totalLiberalites = liberalites.reduce((s, l) => s + (l.valeur || 0), 0)

    // Build input for simulation
    const input: InheritanceInput = {
      fiscalYear: 2026,
      scenarioType: 'CLIENT_DECEASED',
      maritalStatusEnum,
      matrimonialRegime: null,
      spouseOption,
      deceasedAge: null,
      spouseAge: ageConjoint || null,
      grossAsset: patrimoine,
      totalPassif: 0,
      deductibleDebt: 0,
      lifeInsuranceCapital: 0,
      heirs: allocatedHeirs,
      donations: [],
      lifeInsurances: [],
      legs: [],
      dateOfDeath: dateDeces || null,
      dateOfStudy: new Date().toISOString().split('T')[0],
      hasLastSurvivorDonation: !!donationDernierVivantOption,
      hasWill: false,
      deceasedSeparateAsset: null,
      commonAsset: null,
      hasAllCommonChildren: allCommonChildren,
      principalResidenceValue: rpValue > 0 ? rpValue : null,
      residenceOccupiedBySpouse: rpOccupied,
    }

    const result = simulate(input)

    // Build notarial-style response (aligned with NotarialResultDTO)
    const nbEnfants = childrenNames.length
    const masseDeCalcul = patrimoine + totalLiberalites
    const quotiteDisponiblePct = availableQuotaFraction(nbEnfants)
    const quotiteDisponibleInitiale = Math.round(masseDeCalcul * quotiteDisponiblePct)
    const reserveGlobale = masseDeCalcul - quotiteDisponibleInitiale

    const fiscal = {
      totalDroitsNets: result.totalRights,
      totalDroitsBruts: result.totalRights,
      abattementResidencePrincipaleApplique: rpValue > 0,
      abattementResidencePrincipaleTotal: rpValue > 0 ? Math.round(rpValue * 0.2) : 0,
    }

    return NextResponse.json({
      masseDeCalcul,
      totalRapportables: totalLiberalites,
      reserveGlobale,
      quotiteDisponibleInitiale,
      quotiteDisponibleRestante: quotiteDisponibleInitiale,
      quotiteDisponibleConsommee: 0,
      actifNetApresLegs: patrimoine,
      reliquatAbIntestat: true,
      reductionEffectuee: false,
      excedentReduit: 0,
      messages: [],
      notes: [],
      fiscal,
      heritiers: result.heirs.map(h => ({
        nom: h.name,
        lien: h.relationship,
        quotite: h.quotaPercentage,
        montantBrut: h.grossValueReceived,
        abattement: h.allowanceUsed,
        baseTaxable: h.baseTaxableAfterAllowance,
        droits: h.rights,
        droitRecu: h.taxReceived,
        handicape: h.disabled,
      })),
    })
  } catch (error: any) {
    logger.error('[notarial/partage] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: error.message || 'Erreur interne' },
      { status: 400 },
    )
  }
}

// --- Helpers ---

function mapStatut(statut: string | null): MaritalStatusEnum | null {
  if (!statut) return null
  const s = statut.toUpperCase()
  if (s === 'MARIE' || s === 'MARRIED') return 'MARRIED'
  if (s === 'PACSE' || s === 'PACSED') return 'PACSED'
  if (s === 'CONCUBIN' || s === 'COHABITATION') return 'COHABITATION'
  if (s === 'CELIBATAIRE' || s === 'SINGLE') return 'SINGLE'
  return null
}

function mapDDVOption(opt: string): SpouseOptionEnum | null {
  const m: Record<string, SpouseOptionEnum> = {
    TOTALITE_EN_USUFRUIT: 'USUFRUIT_TOTAL',
    PP_QUOTITE_DISPONIBLE: 'TOUTE_PLEINE_PROPRIETE',
    QUART_PP: 'QUART_PLEINE_PROPRIETE',
    QUART_PP_ET_TROIS_QUARTS_USUFRUIT: 'QUART_PP_TROIS_QUART_US',
  }
  return m[opt] || null
}
