// ============================================================
// API Route: POST /api/advisor/simulators/succession-smp/ddv/calculer-toutes-options
// Calcule les 4 options DDV et renvoie les résultats comparés
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { simulate } from '../../engines/inheritance-simulation-engine'
import { buildHeirs } from '../../engines/legal-devolution-engine'
import { logger } from '@/app/_common/lib/logger'
import type {
  InheritanceInput,
  HeirInput,
  MaritalStatusEnum,
  SpouseOptionEnum,
} from '../../types'

const DDV_OPTIONS: SpouseOptionEnum[] = [
  'USUFRUIT_TOTAL',
  'QUART_PLEINE_PROPRIETE',
  'TOUTE_PLEINE_PROPRIETE',
  'QUART_PP_TROIS_QUART_US',
]

const DDV_LABELS: Record<SpouseOptionEnum, string> = {
  USUFRUIT_TOTAL: 'Totalité en usufruit',
  QUART_PLEINE_PROPRIETE: '1/4 en pleine propriété',
  TOUTE_PLEINE_PROPRIETE: 'Quotité disponible en PP',
  QUART_PP_TROIS_QUART_US: '1/4 PP + 3/4 usufruit',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      patrimoine = 0,
      statut,
      ageConjoint,
      heritiers = [],
      residencePrincipale,
    } = body

    const maritalStatusEnum = mapStatut(statut)
    if (maritalStatusEnum !== 'MARRIED') {
      return NextResponse.json({
        options: [],
        message: 'La DDV est réservée aux époux mariés.',
      })
    }

    const hasSpouse = heritiers.some((h: any) => h.estConjoint || h.lien === 'CONJOINT')
    if (!hasSpouse) {
      return NextResponse.json({
        options: [],
        message: 'Aucun conjoint identifié.',
      })
    }

    const conjointHeritier = heritiers.find((h: any) => h.estConjoint || h.lien === 'CONJOINT')
    const spouseName = conjointHeritier?.nom || 'Conjoint'

    // Extract children
    const childrenNames: string[] = []
    const enfantHeritiers = heritiers.filter((h: any) =>
      h.lien === 'ENFANT' || h.lien === 'PETIT_ENFANT',
    )
    for (const h of enfantHeritiers) {
      if (!h.representant) childrenNames.push(h.nom)
    }

    // Extract parents
    const pereHeritier = heritiers.find((h: any) => h.lien === 'PERE')
    const mereHeritier = heritiers.find((h: any) => h.lien === 'MERE')

    // Extract siblings
    const aliveSiblings: string[] = []
    for (const h of heritiers.filter((h: any) => h.lien === 'FRERE' || h.lien === 'SOEUR')) {
      if (!h.representant) aliveSiblings.push(h.nom)
    }

    const rpOccupied = residencePrincipale?.occupationEligibleAuDeces || false
    const rpValue = rpOccupied ? (residencePrincipale?.valeur || 0) : 0

    const results = DDV_OPTIONS.map(option => {
      const heirs: HeirInput[] = buildHeirs({
        maritalStatus: maritalStatusEnum,
        hasSpouse: true,
        spouseName,
        children: childrenNames,
        hasAllCommonChildren: true,
        hasLastSurvivorDonation: true,
        hasWill: false,
        fatherAlive: !!pereHeritier,
        motherAlive: !!mereHeritier,
        fatherName: pereHeritier?.nom || 'Père',
        motherName: mereHeritier?.nom || 'Mère',
        aliveSiblings,
        representationMap: {},
        disabledChildren: new Set<string>(),
        spouseOption: option,
        childSoucheMap: {},
      })

      const input: InheritanceInput = {
        fiscalYear: 2026,
        scenarioType: 'CLIENT_DECEASED',
        maritalStatusEnum,
        matrimonialRegime: null,
        spouseOption: option,
        deceasedAge: null,
        spouseAge: ageConjoint || null,
        grossAsset: patrimoine,
        totalPassif: 0,
        deductibleDebt: 0,
        lifeInsuranceCapital: 0,
        heirs,
        donations: [],
        lifeInsurances: [],
        legs: [],
        dateOfDeath: null,
        dateOfStudy: new Date().toISOString().split('T')[0],
        hasLastSurvivorDonation: true,
        hasWill: false,
        deceasedSeparateAsset: null,
        commonAsset: null,
        hasAllCommonChildren: true,
        principalResidenceValue: rpValue > 0 ? rpValue : null,
        residenceOccupiedBySpouse: rpOccupied,
      }

      const result = simulate(input)

      return {
        option,
        label: DDV_LABELS[option],
        totalRights: result.totalRights,
        netTransmitted: result.netAsset - result.totalRights,
        heirs: result.heirs.map(h => ({
          nom: h.name,
          lien: h.relationship,
          quotite: h.quotaPercentage,
          montantBrut: h.grossValueReceived,
          droits: h.rights,
          droitRecu: h.taxReceived,
        })),
      }
    })

    return NextResponse.json({ options: results })
  } catch (error: any) {
    logger.error('[ddv/calculer-toutes-options] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: error.message || 'Erreur interne', options: [] },
      { status: 400 },
    )
  }
}

function mapStatut(statut: string | null): MaritalStatusEnum | null {
  if (!statut) return null
  const s = statut.toUpperCase()
  if (s === 'MARIE' || s === 'MARRIED') return 'MARRIED'
  if (s === 'PACSE' || s === 'PACSED') return 'PACSED'
  if (s === 'CONCUBIN' || s === 'COHABITATION') return 'COHABITATION'
  if (s === 'CELIBATAIRE' || s === 'SINGLE') return 'SINGLE'
  return null
}
