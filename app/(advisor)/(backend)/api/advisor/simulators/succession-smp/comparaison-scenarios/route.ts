// ============================================================
// API Route: POST /api/advisor/simulators/succession-smp/comparaison-scenarios
// Comparaison de scénarios successoraux (ab intestat vs DDV options)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { simulate } from '../engines/inheritance-simulation-engine'
import { buildHeirs } from '../engines/legal-devolution-engine'
import { logger } from '@/app/_common/lib/logger'
import type {
  InheritanceInput,
  HeirInput,
  MaritalStatusEnum,
  SpouseOptionEnum,
} from '../types'

interface ScenarioResult {
  nom: string
  option: string | null
  droitsTotaux: number
  netTransmis: number
  tauxTransmission: number
  partConjoint: number
  partEnfants: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sd = body.simulationData || body

    const nbEnfants = Number(sd.nombre_enfants || 0)
    const patrimoineNet = Number(sd.patrimoine_net_total || 0)
    const ageConjoint = Number(sd.age_conjoint_survivant || 0)
    const statut = (sd.statut_matrimonial || '').toLowerCase()

    if (patrimoineNet <= 0) {
      return NextResponse.json({
        succes: true,
        resultat: { scenarios: [], message: 'Patrimoine insuffisant pour la comparaison.' },
      })
    }

    const maritalStatus: MaritalStatusEnum | null = statut.includes('mari')
      ? 'MARRIED'
      : statut.includes('pacs')
        ? 'PACSED'
        : statut.includes('concubin')
          ? 'COHABITATION'
          : 'SINGLE'

    const hasSpouse = maritalStatus === 'MARRIED' || maritalStatus === 'PACSED' || maritalStatus === 'COHABITATION'
    const spouseName = sd.prenom_conjoint || 'Conjoint'
    const childrenNames = Array.from({ length: nbEnfants }, (_, i) => `Enfant ${i + 1}`)

    const scenarios: ScenarioResult[] = []

    // Define scenarios to compare
    const optionsToTest: Array<{ nom: string; option: SpouseOptionEnum | null }> = [
      { nom: 'Ab intestat (1/4 PP)', option: null },
    ]

    if (maritalStatus === 'MARRIED' && nbEnfants > 0) {
      optionsToTest.push(
        { nom: 'DDV — Totalité usufruit', option: 'USUFRUIT_TOTAL' },
        { nom: 'DDV — Quotité disponible PP', option: 'TOUTE_PLEINE_PROPRIETE' },
        { nom: 'DDV — 1/4 PP + 3/4 usufruit', option: 'QUART_PP_TROIS_QUART_US' },
        { nom: 'DDV — 1/4 PP seul', option: 'QUART_PLEINE_PROPRIETE' },
      )
    }

    for (const scenarioDef of optionsToTest) {
      const spouseOption = scenarioDef.option || (maritalStatus === 'MARRIED' && nbEnfants > 0 ? 'QUART_PLEINE_PROPRIETE' : null)

      const heirs: HeirInput[] = buildHeirs({
        maritalStatus,
        hasSpouse,
        spouseName,
        children: childrenNames,
        hasAllCommonChildren: true,
        hasLastSurvivorDonation: !!scenarioDef.option,
        hasWill: false,
        fatherAlive: false,
        motherAlive: false,
        fatherName: '',
        motherName: '',
        aliveSiblings: [],
        spouseOption,
      })

      const input: InheritanceInput = {
        fiscalYear: 2026,
        scenarioType: 'CLIENT_DECEASED',
        maritalStatusEnum: maritalStatus,
        matrimonialRegime: null,
        spouseOption,
        deceasedAge: null,
        spouseAge: ageConjoint || null,
        grossAsset: patrimoineNet,
        totalPassif: 0,
        deductibleDebt: 0,
        lifeInsuranceCapital: 0,
        heirs,
        donations: [],
        lifeInsurances: [],
        legs: [],
        dateOfDeath: null,
        dateOfStudy: new Date().toISOString().split('T')[0],
        hasLastSurvivorDonation: !!scenarioDef.option,
        hasWill: false,
        deceasedSeparateAsset: null,
        commonAsset: null,
        hasAllCommonChildren: true,
        principalResidenceValue: null,
        residenceOccupiedBySpouse: false,
      }

      const result = simulate(input)
      const netTransmis = result.netAsset - result.totalRights
      const spouseHeir = result.heirs.find(h => h.relationship === 'DIRECT_LINE' && h.name === spouseName)
      const partConjoint = spouseHeir?.grossValueReceived || 0
      const partEnfants = result.heirs
        .filter(h => h.name !== spouseName)
        .reduce((s, h) => s + h.grossValueReceived, 0)

      scenarios.push({
        nom: scenarioDef.nom,
        option: scenarioDef.option,
        droitsTotaux: result.totalRights,
        netTransmis,
        tauxTransmission: patrimoineNet > 0 ? Math.round(netTransmis / patrimoineNet * 10000) / 100 : 0,
        partConjoint,
        partEnfants,
      })
    }

    // Sort by net transmitted (best first)
    scenarios.sort((a, b) => b.netTransmis - a.netTransmis)

    return NextResponse.json({
      succes: true,
      resultat: {
        scenarios,
        meilleurScenario: scenarios[0]?.nom || null,
        ecartMaximal: scenarios.length > 1
          ? scenarios[0].netTransmis - scenarios[scenarios.length - 1].netTransmis
          : 0,
      },
    })
  } catch (error: any) {
    logger.error('[comparaison-scenarios] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { succes: false, erreur: error.message || 'Erreur interne' },
      { status: 400 },
    )
  }
}
