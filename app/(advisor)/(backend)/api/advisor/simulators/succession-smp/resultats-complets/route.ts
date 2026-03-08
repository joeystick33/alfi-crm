// ============================================================
// API Route: POST /api/advisor/simulators/succession-smp/resultats-complets
//
// Endpoint principal fidèlement porté depuis InheritanceSimulationController.java
// + InheritanceCompleteMapper.java. Accepte le simulationData du frontend
// (champs FR) et retourne la réponse au format SMP complet.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import {
  mapToDTO,
  buildLiquidation,
  runScenario,
  runSecondDeath,
  resolveDefaultSpouseOption,
  mapMaritalStatus,
  buildSMPResponse,
} from './mapping'

export async function POST(req: NextRequest) {
  try {
    const simulationData = await req.json()

    // 1) Map French simulationData → internal DTO
    const dto = mapToDTO(simulationData)

    // 2) Liquidation régime matrimonial
    const liquidation = buildLiquidation(dto)

    // 3) Resolve spouse option
    const ms = mapMaritalStatus(dto.maritalStatus)
    const isMarried = ms === 'MARRIED'
    const isPacsed = ms === 'PACSED'
    const nbChildren = (dto.children ?? []).filter((c: any) => !c.predeceased).length
    const spouseOption = resolveDefaultSpouseOption(
      isMarried, isPacsed, nbChildren,
      dto.allCommonChildren ?? true, dto.hasWill ?? false,
      dto.hasLastSurvivorDonation ? dto.spouseOption : null
    )

    // 4) Scenario A: client dies first
    const { result: result1, legsHeirs, totalLegsRights } = runScenario(dto, liquidation, spouseOption)

    // 5) Scenario B: spouse dies second
    const result2 = runSecondDeath(dto, liquidation, spouseOption)

    // 6) Build SMP-format response
    const response = buildSMPResponse(
      simulationData, dto,
      result1, legsHeirs, totalLegsRights,
      liquidation, spouseOption, result2
    )

    // 7) Mode couple: compute inverse scenario (spouse dies first)
    if (simulationData.mode_couple && dto.spouseName) {
      const inverseDTO = buildInverseDTO(dto, simulationData)
      const inverseLiq = buildLiquidation(inverseDTO)
      const inverseOpt = resolveDefaultSpouseOption(
        isMarried, isPacsed, nbChildren,
        inverseDTO.allCommonChildren ?? true, inverseDTO.hasWill ?? false,
        inverseDTO.hasLastSurvivorDonation ? inverseDTO.spouseOption : null
      )
      const { result: invResult, legsHeirs: invLegs, totalLegsRights: invLegsRights } = runScenario(inverseDTO, inverseLiq, inverseOpt)
      const invResult2 = runSecondDeath(inverseDTO, inverseLiq, inverseOpt)

      // Build inverse simulationData with swapped identities
      const inverseSD = {
        ...simulationData,
        identite: simulationData.conjoint ? { prenom: simulationData.conjoint.prenom, nom: simulationData.conjoint.nom, age: simulationData.conjoint.age, sexe: null } : simulationData.identite,
        conjoint: simulationData.identite ? { prenom: simulationData.identite.prenom, nom: simulationData.identite.nom, age: simulationData.identite.age } : simulationData.conjoint,
      }

      response.resultatInverse = buildSMPResponse(
        inverseSD, inverseDTO,
        invResult, invLegs, invLegsRights,
        inverseLiq, inverseOpt, invResult2
      )
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[resultats-complets] Erreur:', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 })
    }
    if (error.message?.includes('must not be null') || error.message?.includes('invalid')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Build an inverse DTO where the spouse dies first and the client is the survivor.
 * (ref: InheritanceCompleteMapper.toInverseCommand)
 */
function buildInverseDTO(originalDTO: any, sd: any) {
  // Swap client ↔ spouse
  const invDTO = {
    ...originalDTO,
    deceasedName: originalDTO.spouseName || 'Conjoint',
    deceasedAge: originalDTO.spouseAge ?? null,
    spouseName: originalDTO.deceasedName || 'Défunt',
    spouseAge: originalDTO.deceasedAge ?? null,
    // Swap parents
    fatherAlive: sd.parents_partenaire?.pere?.vivant || false,
    motherAlive: sd.parents_partenaire?.mere?.vivant || false,
    fatherName: sd.parents_partenaire?.pere?.prenom || 'Père',
    motherName: sd.parents_partenaire?.mere?.prenom || 'Mère',
    // Swap siblings
    siblings: (sd.fratrie_partenaire || []).map((s: any) => ({
      name: s.prenom || 'Frère/Sœur', alive: s.vivant !== false,
      relationship: s.lien || 'FRERE',
      representants: (s.representants || []).map((r: any) => ({ name: r.prenom || 'Neveu/Nièce' })),
    })),
    // Swap asset ownership
    assets: (originalDTO.assets || []).map((a: any) => {
      const own = (a.ownership || '').toUpperCase()
      let swapped = a.ownership
      if (own.includes('PROPRE_CLIENT')) swapped = 'PROPRE_CONJOINT'
      else if (own.includes('PROPRE_CONJOINT')) swapped = 'PROPRE_CLIENT'
      return { ...a, ownership: swapped }
    }),
    // Swap liberality ownership
    donations: (originalDTO.donations || []).map((d: any) => ({ ...d, owner: swapOwner(d.owner) })),
    legs: (originalDTO.legs || []).map((l: any) => ({ ...l, owner: swapOwner(l.owner) })),
    lifeInsurances: (originalDTO.lifeInsurances || []).map((li: any) => ({ ...li, owner: swapOwner(li.owner) })),
  }
  return invDTO
}

function swapOwner(owner: string | null | undefined): string {
  if (!owner || owner.trim() === '' || owner.toUpperCase() === 'CLIENT') return 'CONJOINT'
  if (owner.toUpperCase() === 'CONJOINT') return 'CLIENT'
  return owner
}
