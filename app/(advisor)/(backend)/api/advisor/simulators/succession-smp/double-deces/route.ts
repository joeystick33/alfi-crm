// ============================================================
// API Route: POST /api/advisor/simulators/succession-smp/double-deces
// Simulation du double décès successif (1er + 2e décès)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { simulate } from '../engines/inheritance-simulation-engine'
import { buildHeirs } from '../engines/legal-devolution-engine'
import { availableQuotaFraction } from '../engines/forced-heirship-calculator'
import { logger } from '@/app/_common/lib/logger'
import type {
  InheritanceInput,
  HeirInput,
  MaritalStatusEnum,
  SpouseOptionEnum,
} from '../types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sd = body.simulationData || body

    const nbEnfants = Number(sd.nombre_enfants || 0)
    const patrimoineNet = Number(sd.patrimoine_net_total || 0)
    const ageConjoint = Number(sd.age_conjoint_survivant || 0)
    const statut = (sd.statut_matrimonial || '').toLowerCase()

    if (!statut.includes('mari') && !statut.includes('pacs')) {
      return NextResponse.json({
        succes: true,
        resultat: {
          applicable: false,
          raison: 'Le double décès successif ne concerne que les couples mariés ou pacsés.',
        },
      })
    }

    if (nbEnfants === 0) {
      return NextResponse.json({
        succes: true,
        resultat: {
          applicable: false,
          raison: 'Le double décès nécessite au moins un enfant héritier.',
        },
      })
    }

    const maritalStatus: MaritalStatusEnum = statut.includes('mari') ? 'MARRIED' : 'PACSED'
    const spouseName = sd.prenom_conjoint || 'Conjoint'
    const childrenNames = Array.from({ length: nbEnfants }, (_, i) => `Enfant ${i + 1}`)

    // Simulate 1st death with usufruit total
    const option1: SpouseOptionEnum = 'USUFRUIT_TOTAL'
    const heirs1 = buildHeirs({
      maritalStatus,
      hasSpouse: true,
      spouseName,
      children: childrenNames,
      hasAllCommonChildren: true,
      hasLastSurvivorDonation: true,
      hasWill: false,
      fatherAlive: false,
      motherAlive: false,
      fatherName: '',
      motherName: '',
      aliveSiblings: [],
      spouseOption: option1,
    })

    const input1: InheritanceInput = {
      fiscalYear: 2026,
      scenarioType: 'CLIENT_DECEASED',
      maritalStatusEnum: maritalStatus,
      matrimonialRegime: null,
      spouseOption: option1,
      deceasedAge: null,
      spouseAge: ageConjoint || null,
      grossAsset: patrimoineNet,
      totalPassif: 0,
      deductibleDebt: 0,
      lifeInsuranceCapital: 0,
      heirs: heirs1,
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
      principalResidenceValue: null,
      residenceOccupiedBySpouse: false,
    }

    const result1 = simulate(input1)

    // Simulate 2nd death: spouse dies, children inherit
    const spouseReceived = patrimoineNet * 0.5 // Simplified: spouse gets half via liquidation
    const heirs2 = buildHeirs({
      maritalStatus: 'SINGLE',
      hasSpouse: false,
      spouseName: '',
      children: childrenNames,
      hasAllCommonChildren: true,
      hasLastSurvivorDonation: false,
      hasWill: false,
      fatherAlive: false,
      motherAlive: false,
      fatherName: '',
      motherName: '',
      aliveSiblings: [],
      spouseOption: null,
    })

    const input2: InheritanceInput = {
      fiscalYear: 2026,
      scenarioType: 'CLIENT_DECEASED',
      maritalStatusEnum: 'SINGLE',
      matrimonialRegime: null,
      spouseOption: null,
      deceasedAge: null,
      spouseAge: null,
      grossAsset: spouseReceived,
      totalPassif: 0,
      deductibleDebt: 0,
      lifeInsuranceCapital: 0,
      heirs: heirs2,
      donations: [],
      lifeInsurances: [],
      legs: [],
      dateOfDeath: null,
      dateOfStudy: new Date().toISOString().split('T')[0],
      hasLastSurvivorDonation: false,
      hasWill: false,
      deceasedSeparateAsset: null,
      commonAsset: null,
      hasAllCommonChildren: true,
      principalResidenceValue: null,
      residenceOccupiedBySpouse: false,
    }

    const result2 = simulate(input2)

    return NextResponse.json({
      succes: true,
      resultat: {
        applicable: true,
        premierDeces: {
          droitsTotaux: result1.totalRights,
          netTransmis: result1.netAsset - result1.totalRights,
          heritiers: result1.heirs.map(h => ({
            nom: h.name,
            droits: h.rights,
            montantBrut: h.grossValueReceived,
          })),
        },
        secondDeces: {
          patrimoineConjoint: spouseReceived,
          droitsTotaux: result2.totalRights,
          netTransmis: result2.netAsset - result2.totalRights,
          heritiers: result2.heirs.map(h => ({
            nom: h.name,
            droits: h.rights,
            montantBrut: h.grossValueReceived,
          })),
        },
        cumul: {
          droitsTotaux: result1.totalRights + result2.totalRights,
          netTotalTransmis: (result1.netAsset - result1.totalRights) + (result2.netAsset - result2.totalRights),
          tauxGlobal: patrimoineNet > 0
            ? Math.round((result1.totalRights + result2.totalRights) / patrimoineNet * 10000) / 100
            : 0,
        },
      },
    })
  } catch (error: any) {
    logger.error('[double-deces] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { succes: false, erreur: error.message || 'Erreur interne' },
      { status: 400 },
    )
  }
}
