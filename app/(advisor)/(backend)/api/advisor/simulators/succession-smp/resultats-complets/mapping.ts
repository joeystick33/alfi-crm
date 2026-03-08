// ============================================================
// Mapping helpers for /resultats-complets
// Maps French simulationData → English SimulationRequestDTO
// Maps internal result → SMP response format
// ============================================================

import type {
  HeirInput,
  HeirResult,
  InheritanceInput,
  InheritanceResult,
  DonationInput,
  LifeInsuranceInput,
  LegInput,
  LiquidationResult,
  MaritalStatusEnum,
  SpouseOptionEnum,
  RelationshipEnum,
} from '../types'
import { simulate } from '../engines/inheritance-simulation-engine'
import { buildHeirs } from '../engines/legal-devolution-engine'
import { liquidate } from '../engines/liquidation-regime-service'
import { rightsPerSlice } from '../engines/fiscal-calculator'
import { getFiscalRules } from '../fiscal-rules'
import { availableQuotaFraction } from '../engines/forced-heirship-calculator'

export const round2 = (v: number): number => Math.round(v * 100) / 100

// ── Enum mappers ──

export function mapMaritalStatus(s: string | null | undefined): MaritalStatusEnum | null {
  if (!s) return null
  const n = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  if (n === 'marie' || n === 'married') return 'MARRIED'
  if (n === 'pacse' || n === 'pacs' || n === 'pacsed') return 'PACSED'
  if (n.includes('concubin') || n === 'cohabitation') return 'COHABITATION'
  if (n === 'celibataire' || n === 'single') return 'SINGLE'
  return null
}

export function mapSpouseOption(s: string | null | undefined): SpouseOptionEnum | null {
  if (!s) return null
  const n = s.toUpperCase().replace(/[\s-]/g, '_')
  if (n.includes('USUFRUIT_TOTAL') || n.includes('TOTALITE_USUFRUIT') || n.includes('TOTALITE_EN_USUFRUIT')) return 'USUFRUIT_TOTAL'
  if (n.includes('QUART_PP_TROIS') || n.includes('QUART_PP_ET_TROIS')) return 'QUART_PP_TROIS_QUART_US'
  if (n.includes('TOUTE_PLEINE') || n.includes('QUOTITE_DISPONIBLE') || n.includes('PP_QUOTITE')) return 'TOUTE_PLEINE_PROPRIETE'
  if (n.includes('QUART_PP') || n.includes('QUART_PLEINE')) return 'QUART_PLEINE_PROPRIETE'
  return null
}

export function mapRelationship(s: string | null | undefined): RelationshipEnum {
  if (!s) return 'OTHERS'
  const n = s.toLowerCase().trim()
  if (n.includes('enfant') || n.includes('child') || n === 'direct_line' || n === 'ligne_directe' || n.includes('parent')) return 'DIRECT_LINE'
  if (n.includes('frere') || n.includes('frère') || n.includes('soeur') || n.includes('sœur') || n === 'siblings') return 'SIBLINGS'
  if (n.includes('neveu') || n.includes('nièce') || n.includes('niece')) return 'NIECE_NEPHEW'
  if (n.includes('grand')) return 'GRANDPARENT'
  if (n.includes('oncle') || n.includes('tante') || n.includes('cousin')) return 'UNCLE_AUNT'
  return 'OTHERS'
}

export function mapLegRelationship(rel: string | null | undefined): RelationshipEnum {
  if (!rel) return 'OTHERS'
  const s = rel.toLowerCase().trim()
  if (s.includes('enfant') || s.includes('parent')) return 'DIRECT_LINE'
  if (s.includes('conjoint') || s.includes('pacs')) return 'OTHERS'
  if (s.includes('frere') || s.includes('frère') || s.includes('soeur') || s.includes('sœur')) return 'SIBLINGS'
  if (s.includes('neveu') || s.includes('nièce') || s.includes('niece')) return 'NIECE_NEPHEW'
  return 'OTHERS'
}

export function isSpouseOrPacs(rel: string | null | undefined): boolean {
  if (!rel) return false
  const s = rel.toLowerCase()
  return s.includes('conjoint') || s.includes('pacs') || s.includes('spouse')
}

function mapRegimeEnum(r: string | null | undefined): string | null {
  if (!r) return null
  switch (r.toUpperCase()) {
    case 'COMMUNAUTE_LEGALE': return 'communauté réduite aux acquêts'
    case 'SEPARATION_BIENS': return 'séparation de biens'
    case 'COMMUNAUTE_UNIVERSELLE': return 'communauté universelle'
    case 'PARTICIPATION_ACQUETS': return 'participation aux acquêts'
    default: return r
  }
}

function mapProprietaireToOwnership(p: string | null | undefined): string | null {
  if (!p) return null
  switch (p.toUpperCase()) {
    case 'MONSIEUR': return 'PROPRE_CLIENT'
    case 'MADAME': return 'PROPRE_CONJOINT'
    case 'COMMUN': return 'COMMUN'
    case 'INDIVISION': return 'INDIVISION'
    default: return p
  }
}

export function resolveDefaultSpouseOption(
  isMarried: boolean, isPacsed: boolean, nbChildren: number,
  allCommonChildren: boolean, hasWill: boolean, rawSpouseOption: string | null | undefined
): SpouseOptionEnum | null {
  if (isMarried && nbChildren > 0) {
    if (rawSpouseOption) return mapSpouseOption(rawSpouseOption)
    return allCommonChildren ? 'USUFRUIT_TOTAL' : 'QUART_PLEINE_PROPRIETE'
  }
  if (isPacsed && hasWill && nbChildren > 0) return 'TOUTE_PLEINE_PROPRIETE'
  if (!isMarried && !isPacsed && hasWill && nbChildren > 0) return 'TOUTE_PLEINE_PROPRIETE'
  return null
}

const npPercentByAge = (age: number): number => {
  if (age < 21) return 10; if (age <= 30) return 20; if (age <= 40) return 30
  if (age <= 50) return 40; if (age <= 60) return 50; if (age <= 70) return 60
  if (age <= 80) return 70; if (age <= 90) return 80; return 90
}

// ── Map simulationData → DTO ──

export function mapToDTO(sd: any) {
  const maritalStatusStr = sd.statut_matrimonial || null
  const maritalStatus = mapMaritalStatus(maritalStatusStr)
  const isMarried = maritalStatus === 'MARRIED'
  const isPacsed = maritalStatus === 'PACSED'
  let regime = mapRegimeEnum(sd.conjoint?.regimeMatrimonial)
  if (sd.conjoint?.clauseAttributionIntegrale && regime) regime += " avec clause d'attribution intégrale"

  const enfants = Array.isArray(sd.enfants) ? sd.enfants.filter(Boolean) : []
  const children = enfants.map((e: any) => ({
    name: [e.prenom, e.nom].filter(Boolean).join(' ') || 'Enfant',
    commonChild: e.communAvecConjoint !== false,
    disabled: e.handicape || e.fiscalConditions?.handicap || false,
    predeceased: e.predecede || false,
    representants: Array.isArray(e.representants) ? e.representants.filter(Boolean).map((r: any) => ({
      name: r.prenom || 'Petit-enfant', disabled: r.handicape || false,
    })) : [],
  }))

  const fratrie = Array.isArray(sd.fratrie_defunt) ? sd.fratrie_defunt.filter(Boolean) : []
  const siblings = fratrie.map((s: any) => ({
    name: [s.prenom, s.nom].filter(Boolean).join(' ') || 'Frère/Sœur',
    alive: s.vivant !== false, relationship: s.lien || 'FRERE',
    representants: Array.isArray(s.representants) ? s.representants.filter(Boolean).map((r: any) => ({ name: r.prenom || 'Neveu/Nièce' })) : [],
  }))

  const actifs = Array.isArray(sd.actifs) ? sd.actifs.filter(Boolean) : []
  const grossAsset = actifs.reduce((sum: number, a: any) => sum + Number(a.valeur || 0), 0)
  const assets = actifs.map((a: any) => ({
    type: a.type || a.designation || 'AUTRE', value: Number(a.valeur || 0), debt: Number(a.dette || 0),
    ownership: mapProprietaireToOwnership(a.proprietaire) || undefined,
    label: a.libelle || a.designation || a.type || undefined,
  }))

  const lifeInsurances = mapLifeInsurances(sd, isMarried || isPacsed)
  const donations = mapDonations(sd)
  const legs = mapLegsFromSD(sd)

  const presenceDDV = sd.presence_ddv || false
  const hasWill = sd.testament_partenaire || false
  const spouseOptionRaw = sd.option_ddv || sd.option_conjoint || null
  const allCommonChildren = sd.enfants_tous_communs !== false

  const rpValue = sd.presence_residence_principale ? Number(sd.valeur_residence_principale || 0) : 0
  const rpOccupied = sd.residence_occupation_conjoint || sd.residence_occupation_enfant_mineur || false

  return {
    maritalStatus: maritalStatusStr, matrimonialRegime: regime,
    deceasedName: [sd.identite?.prenom, sd.identite?.nom].filter(Boolean).join(' ') || 'Défunt',
    deceasedAge: sd.identite?.age ?? null,
    spouseName: [sd.conjoint?.prenom, sd.conjoint?.nom].filter(Boolean).join(' ') || undefined,
    spouseAge: sd.conjoint?.age ?? null,
    children, allCommonChildren, siblings,
    fatherAlive: sd.parents_defunt?.pere?.vivant || false,
    motherAlive: sd.parents_defunt?.mere?.vivant || false,
    fatherName: sd.parents_defunt?.pere?.prenom || 'Père',
    motherName: sd.parents_defunt?.mere?.prenom || 'Mère',
    grossAsset, totalPassif: Number(sd.dettes_totales || 0),
    principalResidenceValue: rpValue > 0 ? rpValue : null,
    residenceOccupiedBySpouse: rpOccupied, assets,
    lifeInsurances, presenceDonations: sd.presence_donations || false, donations,
    presenceLegs: sd.presence_legs_particuliers || false, legs,
    hasLastSurvivorDonation: presenceDDV, hasWill,
    spouseOption: presenceDDV ? spouseOptionRaw : null,
    dateOfDeath: sd.date_deces || null,
    dateOfStudy: new Date().toISOString().split('T')[0],
    separateAsset: null, commonAsset: null,
  }
}

function mapLifeInsurances(sd: any, hasSpouse: boolean): any[] {
  if (!sd.presence_assurance_vie || !Array.isArray(sd.contrats_av)) return []
  const result: any[] = []
  const spouseName = [sd.conjoint?.prenom, sd.conjoint?.nom].filter(Boolean).join(' ') || 'Conjoint'
  const childrenNames = (sd.enfants || []).filter((e: any) => e && !e.predecede).map((e: any) =>
    [e.prenom, e.nom].filter(Boolean).join(' ') || 'Enfant')
  const nbChildren = childrenNames.length
  const ageDefunt = sd.identite?.age ?? 65
  const ageConjoint = sd.conjoint?.age ?? 65
  const npFraction = npPercentByAge(ageConjoint) / 100

  for (const c of sd.contrats_av) {
    if (!c) continue
    const av70 = Number(c.montantVersementsAvant70 || 0)
    const ap70 = Number(c.montantVersementsApres70 || 0)
    const cap = Number(c.valeurContratActuelle || 0)
    const clause = c.clauseBeneficiaire || 'STANDARD'
    let owner: string | null = c.owner || null
    if (!owner) { if (c.souscripteur === 'MONSIEUR') owner = 'CLIENT'; else if (c.souscripteur === 'MADAME') owner = 'CONJOINT' }
    const bens = Array.isArray(c.beneficiaires) ? c.beneficiaires.filter(Boolean) : []

    if (bens.length === 0) {
      if (clause === 'DEMEMBRE' && nbChildren > 0 && hasSpouse) {
        result.push({ beneficiaryName: spouseName, bonusesPaid: av70, deathBenefit: cap, ageOfInsuredAtPayment: ageDefunt, allowanceFraction: 1, owner })
        for (const cn of childrenNames) {
          result.push({ beneficiaryName: cn, bonusesPaid: round2(av70 * npFraction / nbChildren), deathBenefit: round2(cap * npFraction / nbChildren), ageOfInsuredAtPayment: ageDefunt < 70 ? ageDefunt : 50, allowanceFraction: npFraction, owner })
        }
      } else {
        result.push({ beneficiaryName: hasSpouse ? spouseName : (childrenNames[0] || 'Bénéficiaire'), bonusesPaid: av70 + ap70, deathBenefit: cap, ageOfInsuredAtPayment: ageDefunt, allowanceFraction: 1, owner })
      }
    } else {
      const totalParts = bens.reduce((s: number, b: any) => s + Number(b.part || 0), 0) || bens.length
      for (const b of bens) {
        const ratio = (Number(b.part || 0) || 1) / totalParts
        const lienLower = (b.lien || '').toLowerCase()
        let rn = b.nom || 'Bénéficiaire'
        if (lienLower.includes('conjoint') || lienLower.includes('pacs')) rn = spouseName
        result.push({ beneficiaryName: rn, bonusesPaid: round2((av70 + ap70) * ratio), deathBenefit: round2(cap * ratio), ageOfInsuredAtPayment: ageDefunt, allowanceFraction: 1, owner })
      }
    }
  }
  return result
}

function mapDonations(sd: any): any[] {
  if (!sd.presence_donations || !Array.isArray(sd.donations)) return []
  return sd.donations.filter(Boolean).map((d: any) => ({
    beneficiaryName: d.beneficiaireNom || 'Bénéficiaire', montant: Number(d.valeur || 0),
    relationship: d.lien || 'enfant', dateDonation: d.dateActe || null,
    rapportable: d.horsPart != null ? !d.horsPart : (d.rapportable !== false),
    owner: d.owner || d.proprietaire || null,
  }))
}

function mapLegsFromSD(sd: any): any[] {
  if (!sd.presence_legs_particuliers || !Array.isArray(sd.legs_particuliers)) return []
  return sd.legs_particuliers.filter(Boolean).map((l: any) => ({
    beneficiaryName: l.beneficiaireNom || 'Légataire', amount: Number(l.valeur || 0),
    relationship: l.lien || 'tiers', description: l.description || null,
    owner: l.owner || l.proprietaire || null,
  }))
}

// ── Simulation runner ──

function filterByOwner<T extends { owner?: string | null }>(items: T[] | undefined, type: 'CLIENT' | 'CONJOINT'): T[] {
  if (!items) return []
  if (type === 'CLIENT') return items.filter(d => !d.owner || d.owner.trim() === '' || d.owner.toUpperCase() === 'CLIENT')
  return items.filter(d => d.owner && d.owner.toUpperCase() === 'CONJOINT')
}

export function buildLiquidation(dto: any): LiquidationResult | null {
  const ms = mapMaritalStatus(dto.maritalStatus)
  if (ms !== 'MARRIED' && ms !== 'PACSED') return null
  const regime = dto.matrimonialRegime ?? null
  let sep = 0, com = 0, owPass = 0, hasOwn = false
  if (dto.assets?.length > 0) {
    for (const a of dto.assets) {
      const net = Math.max(0, (a.value ?? 0) - (a.debt ?? 0))
      const own = (a.ownership || '').trim().toUpperCase()
      if (own) {
        hasOwn = true
        if (own.includes('PROPRE_CLIENT') || own === 'PROPRE') { sep += net; owPass += a.debt ?? 0 }
        else if (!own.includes('PROPRE_CONJOINT')) { com += net; owPass += a.debt ?? 0 }
      } else { com += net; owPass += a.debt ?? 0 }
    }
  }
  const passif = hasOwn ? owPass : (dto.totalPassif ?? 0) + (dto.assets || []).reduce((s: number, a: any) => s + (a.debt ?? 0), 0)
  return liquidate(regime, dto.grossAsset ?? 0, passif, hasOwn ? sep : null, hasOwn ? com : null)
}

export function runScenario(dto: any, liq: LiquidationResult | null, spOpt: SpouseOptionEnum | null) {
  const ms = mapMaritalStatus(dto.maritalStatus)
  const hasSp = (ms === 'MARRIED' || ms === 'PACSED' || ms === 'COHABITATION') && !!dto.spouseName
  const cNames: string[] = [], cSouche: Record<string, string> = {}, disabled = new Set<string>()
  for (const c of dto.children ?? []) {
    if (c.predeceased && c.representants?.length > 0) {
      for (const r of c.representants) { cNames.push(r.name); cSouche[r.name] = c.name; if (r.disabled) disabled.add(r.name) }
    } else { cNames.push(c.name); if (c.disabled) disabled.add(c.name) }
  }
  const aliveSib: string[] = [], repMap: Record<string, string[]> = {}
  for (const s of dto.siblings ?? []) {
    if (s.alive !== false) aliveSib.push(s.name)
    else if (s.representants?.length > 0) repMap[s.name] = s.representants.map((r: any) => r.name)
  }
  const heirs: HeirInput[] = buildHeirs({
    maritalStatus: ms, hasSpouse: hasSp, spouseName: dto.spouseName ?? 'Conjoint',
    children: cNames, hasAllCommonChildren: dto.allCommonChildren ?? true,
    hasLastSurvivorDonation: dto.hasLastSurvivorDonation ?? false, hasWill: dto.hasWill ?? false,
    fatherAlive: dto.fatherAlive ?? false, motherAlive: dto.motherAlive ?? false,
    fatherName: dto.fatherName ?? 'Père', motherName: dto.motherName ?? 'Mère',
    aliveSiblings: aliveSib, representationMap: repMap, disabledChildren: disabled,
    spouseOption: spOpt, childSoucheMap: cSouche,
  })

  let grossAsset: number, inputPassif: number
  if (liq?.estateEnteringSuccession != null && liq.estateEnteringSuccession > 0) {
    grossAsset = liq.estateEnteringSuccession; inputPassif = 0
  } else { grossAsset = dto.grossAsset ?? 0; inputPassif = dto.totalPassif ?? 0 }

  const decDon = filterByOwner(dto.presenceDonations !== false ? dto.donations : undefined, 'CLIENT')
  const decLegs = filterByOwner(dto.presenceLegs !== false ? dto.legs : undefined, 'CLIENT')
  const decAV = filterByOwner(dto.lifeInsurances, 'CLIENT')

  const legsInput: LegInput[] = decLegs.map((l: any) => ({ beneficiaryName: l.beneficiaryName, amount: l.amount ?? 0, description: l.description ?? null, relationship: l.relationship ?? null, owner: l.owner ?? null }))
  grossAsset = Math.max(0, grossAsset - legsInput.reduce((s, l) => s + (l.amount ?? 0), 0))

  const donInput: DonationInput[] = decDon.map((d: any) => ({ beneficiaryName: d.beneficiaryName, relationship: mapRelationship(d.relationship), montant: d.montant ?? 0, dateDonation: d.dateDonation ?? null, rapportable: d.rapportable !== false }))
  const avInput: LifeInsuranceInput[] = decAV.map((li: any) => ({ beneficiaryName: li.beneficiaryName, bonusesPaid: li.bonusesPaid ?? 0, deathBenefit: li.deathBenefit ?? 0, subscriptionDate: null, lastBonusPaymentDate: null, ageOfInsuredAtPayment: li.ageOfInsuredAtPayment ?? null, allowanceFraction: li.allowanceFraction ?? 1, owner: li.owner ?? null }))

  const netTotal = Math.max(0, (dto.grossAsset ?? 0) - (dto.totalPassif ?? 0))
  let rpVal = 0
  if (dto.residenceOccupiedBySpouse && dto.principalResidenceValue > 0 && netTotal > 0) {
    rpVal = round2(Math.min(dto.principalResidenceValue, Math.min(grossAsset, netTotal)))
  }

  const input: InheritanceInput = {
    fiscalYear: 2026, scenarioType: 'CLIENT_DECEASED', maritalStatusEnum: ms,
    matrimonialRegime: dto.matrimonialRegime ?? null, spouseOption: spOpt,
    deceasedAge: dto.deceasedAge ?? null, spouseAge: dto.spouseAge ?? null,
    grossAsset, totalPassif: inputPassif, deductibleDebt: inputPassif,
    lifeInsuranceCapital: avInput.reduce((s, li) => s + li.deathBenefit, 0),
    heirs, donations: donInput, lifeInsurances: avInput, legs: legsInput,
    dateOfDeath: dto.dateOfDeath ?? null, dateOfStudy: dto.dateOfStudy ?? new Date().toISOString().split('T')[0],
    hasLastSurvivorDonation: dto.hasLastSurvivorDonation ?? false, hasWill: dto.hasWill ?? false,
    deceasedSeparateAsset: null, commonAsset: null, hasAllCommonChildren: dto.allCommonChildren ?? true,
    principalResidenceValue: rpVal > 0 ? rpVal : null, residenceOccupiedBySpouse: dto.residenceOccupiedBySpouse ?? false,
  }

  const result = simulate(input)

  // Legs taxation
  const fiscalRules = getFiscalRules(2026)
  const legsHeirs: HeirResult[] = []
  let totalLegsRights = 0
  for (const leg of legsInput) {
    if (!leg.amount || leg.amount <= 0) continue
    const link = mapLegRelationship(leg.relationship)
    if (isSpouseOrPacs(leg.relationship)) {
      legsHeirs.push({ name: leg.beneficiaryName, relationship: 'OTHERS', taxReceived: 'PLEINE_PROPRIETE', quotaPercentage: 0, grossValueReceived: round2(leg.amount), taxableValue: round2(leg.amount), allowanceUsed: 0, baseTaxableAfterAllowance: 0, rights: 0, disabled: false })
      continue
    }
    const allow = fiscalRules.abatementsByLink[link]?.amount ?? 0
    const base = Math.max(0, leg.amount - allow)
    const scale = fiscalRules.scalesByLink[link]
    const rights = scale ? rightsPerSlice(base, scale) : 0
    totalLegsRights += rights
    legsHeirs.push({ name: leg.beneficiaryName, relationship: link, taxReceived: 'PLEINE_PROPRIETE', quotaPercentage: 0, grossValueReceived: round2(leg.amount), taxableValue: round2(leg.amount), allowanceUsed: round2(Math.min(allow, leg.amount)), baseTaxableAfterAllowance: round2(base), rights: round2(rights), disabled: false })
  }

  return { result, input, legsHeirs, totalLegsRights: round2(totalLegsRights) }
}

export function runSecondDeath(dto: any, liq: LiquidationResult | null, firstOpt: SpouseOptionEnum | null): InheritanceResult | null {
  if (!dto.spouseName) return null
  const ms = mapMaritalStatus(dto.maritalStatus)
  if (ms !== 'MARRIED' && !(ms === 'PACSED' && dto.hasWill)) return null

  const spHalf = liq?.spouseShare ?? 0
  const decShare = liq?.estateEnteringSuccession ?? 0
  const nbC = (dto.children ?? []).length
  let pp = 0
  if (firstOpt && decShare > 0) {
    if (firstOpt === 'QUART_PP_TROIS_QUART_US' || firstOpt === 'QUART_PLEINE_PROPRIETE') pp = round2(decShare * 0.25)
    else if (firstOpt === 'TOUTE_PLEINE_PROPRIETE') pp = round2(decShare * availableQuotaFraction(nbC))
  }
  let conjPropre = 0
  if (dto.assets) for (const a of dto.assets) { if ((a.ownership || '').toUpperCase().includes('PROPRE_CONJOINT')) conjPropre += Math.max(0, (a.value ?? 0) - (a.debt ?? 0)) }
  const patrimoine = spHalf + conjPropre + pp

  const cNames: string[] = [], dis2 = new Set<string>(), cs2: Record<string, string> = {}
  for (const c of dto.children ?? []) {
    if (c.predeceased && c.representants?.length > 0) { for (const r of c.representants) { cNames.push(r.name); cs2[r.name] = c.name } }
    else { cNames.push(c.name); if (c.disabled) dis2.add(c.name) }
  }
  const heirs = buildHeirs({ maritalStatus: 'SINGLE', hasSpouse: false, spouseName: '', children: cNames, hasAllCommonChildren: true, hasLastSurvivorDonation: false, hasWill: false, fatherAlive: false, motherAlive: false, fatherName: '', motherName: '', aliveSiblings: [], representationMap: {}, disabledChildren: dis2, spouseOption: null, childSoucheMap: cs2 })

  return simulate({
    fiscalYear: 2026, scenarioType: 'SPOUSE_DECEASED', maritalStatusEnum: 'SINGLE',
    matrimonialRegime: null, spouseOption: null, deceasedAge: dto.spouseAge ?? null,
    spouseAge: null, grossAsset: patrimoine, totalPassif: 0, deductibleDebt: 0,
    lifeInsuranceCapital: 0, heirs, donations: [], lifeInsurances: [], legs: [],
    dateOfDeath: null, dateOfStudy: new Date().toISOString().split('T')[0],
    hasLastSurvivorDonation: false, hasWill: false, deceasedSeparateAsset: null,
    commonAsset: null, hasAllCommonChildren: true, principalResidenceValue: null,
    residenceOccupiedBySpouse: false,
  })
}

// ── Response builders ──

function relationshipLabel(rel: RelationshipEnum): string {
  switch (rel) {
    case 'DIRECT_LINE': return 'Ligne directe'; case 'SIBLINGS': return 'Frères et sœurs'
    case 'NIECE_NEPHEW': return 'Neveux et nièces'; case 'GRANDPARENT': return 'Grands-parents'
    case 'UNCLE_AUNT': return 'Oncles / Tantes / Cousins'; case 'OTHERS': return 'Conjoint / Autre'
    default: return 'Autre'
  }
}
function rightTypeLabel(rt: string): string {
  switch (rt) { case 'PLEINE_PROPRIETE': return 'Pleine propriété'; case 'USUFRUIT': return 'Usufruit'; case 'NUE_PROPRIETE': return 'Nue-propriété'; default: return rt }
}
function categorizeAssetType(type: string): string {
  const t = type.toUpperCase()
  if (t.includes('RESIDENCE') || t.includes('IMMOBILIER') || t.includes('IMMEUBLE') || t.includes('TERRAIN') || t.includes('SCI') || t.includes('BIENS_RURAUX') || t.includes('GFA') || t.includes('MONUMENT') || t.includes('BOIS') || t.includes('FORET')) return 'immobilier'
  if (t.includes('FINANCIER') || t.includes('COMPTE') || t.includes('EPARGNE') || t.includes('PLACEMENT') || t.includes('PEA') || t.includes('LIVRET') || t.includes('TITRE')) return 'financier'
  if (t.includes('PROFESSIONNEL') || t.includes('ENTREPRISE') || t.includes('FONDS_COMMERCE') || t.includes('SOCIETE') || t.includes('PARTS')) return 'professionnel'
  return 'autre'
}

function mapHeirToResponse(h: HeirResult) {
  return {
    nom: h.name, lien: relationshipLabel(h.relationship), typeDroit: rightTypeLabel(h.taxReceived),
    quotite: h.quotaPercentage, montantTransmis: h.grossValueReceived, valeurTaxable: h.taxableValue,
    abattement: h.allowanceUsed, baseApresAbattement: h.baseTaxableAfterAllowance,
    droits: h.rights, handicape: h.disabled,
  }
}

export function buildSMPResponse(
  sd: any, dto: any,
  result1: InheritanceResult, legsHeirs: HeirResult[], totalLegsRights: number,
  liq: LiquidationResult | null, spOpt: SpouseOptionEnum | null,
  result2: InheritanceResult | null,
) {
  const enrichedHeirs = [...result1.heirs, ...legsHeirs]
  const enrichedRights = round2(result1.totalRights + totalLegsRights)

  // Patrimoine
  const actifs = Array.isArray(sd.actifs) ? sd.actifs.filter(Boolean) : []
  const totalBrut = actifs.reduce((s: number, a: any) => s + Number(a.valeur || 0), 0)
  const totalNet = Math.max(0, totalBrut - Number(sd.dettes_totales || 0))
  const typeMap: Record<string, number> = {}
  for (const a of actifs) { const type = categorizeAssetType(a.type || 'AUTRE'); typeMap[type] = (typeMap[type] || 0) + Number(a.valeur || 0) }
  const immo = typeMap['immobilier'] || 0, fin = typeMap['financier'] || 0, pro = typeMap['professionnel'] || 0
  const aut = Math.max(0, totalBrut - immo - fin - pro)
  const mkPct = (v: number) => totalBrut > 0 ? round2(v / totalBrut * 100) : 0

  // Masse
  const nbChildren = (dto.children ?? []).filter((c: any) => !c.predeceased).length + (dto.children ?? []).filter((c: any) => c.predeceased && c.representants?.length > 0).reduce((s: number, c: any) => s + c.representants.length, 0)
  const qdFrac = availableQuotaFraction(nbChildren)
  const civilMasse = result1.netAsset
  const rpAbat = (dto.residenceOccupiedBySpouse && dto.principalResidenceValue > 0) ? round2(Math.min(dto.principalResidenceValue, result1.netAsset) * 0.20) : 0
  const spHeir = enrichedHeirs.find(h => h.relationship === 'OTHERS' && h.rights === 0 && h.grossValueReceived > 0)

  const notary1 = round2(result1.netAsset * 0.02)
  const netTrans1 = Math.max(0, round2(result1.netAsset - enrichedRights - notary1))

  const scenario1 = {
    label: `Décès de ${sd.identite?.prenom || 'M.'}`,
    defunt: { nom: sd.identite?.nom || null, prenom: sd.identite?.prenom || null, age: sd.identite?.age ?? 0 },
    optionConjoint: spOpt || null,
    actifSuccessoral: round2(result1.netAsset),
    liquidation: liq ? { biensPropreDefunt: round2(liq.separateAsset ?? 0), biensCommuns: round2(liq.commonAsset ?? 0), partDefunt: round2(liq.deceasedShare ?? 0), partConjoint: round2(liq.spouseShare ?? 0), actifSuccessoral: round2(liq.estateEnteringSuccession ?? 0) } : null,
    masse: { civil: round2(civilMasse), reserve: round2(civilMasse * (1 - qdFrac)), quotiteDisponible: round2(civilMasse * qdFrac), abattementResidence: rpAbat, baseResidenceAvantAbattement: rpAbat > 0 ? round2(rpAbat / 0.20) : 0, exonerationConjoint: spHeir ? round2(spHeir.taxableValue) : 0, fiscale: round2(result1.fiscalInheritanceAsset) },
    heritiers: enrichedHeirs.map(mapHeirToResponse),
    droitsSuccession: enrichedRights, fraisNotaire: notary1,
    transmissionNette: netTrans1, tauxTransmission: result1.netAsset > 0 ? round2(netTrans1 / result1.netAsset * 100) : 0,
    impactBudgetaire: null,
  }

  let scenario2 = null
  if (result2) {
    const n2 = round2(result2.netAsset * 0.02)
    const nt2 = Math.max(0, round2(result2.netAsset - result2.totalRights - n2))
    scenario2 = {
      label: `Décès de ${sd.conjoint?.prenom || 'Conjoint'}`,
      defunt: { nom: sd.conjoint?.nom || null, prenom: sd.conjoint?.prenom || null, age: sd.conjoint?.age ?? 0 },
      optionConjoint: null, actifSuccessoral: round2(result2.netAsset), liquidation: null,
      masse: { civil: round2(result2.netAsset), reserve: 0, quotiteDisponible: 0, abattementResidence: 0, baseResidenceAvantAbattement: 0, exonerationConjoint: 0, fiscale: round2(result2.fiscalInheritanceAsset) },
      heritiers: result2.heirs.map(mapHeirToResponse),
      droitsSuccession: result2.totalRights, fraisNotaire: n2,
      transmissionNette: nt2, tauxTransmission: result2.netAsset > 0 ? round2(nt2 / result2.netAsset * 100) : 0,
      impactBudgetaire: null,
    }
  }

  // Optimisations basiques
  const strategies: any[] = []
  const ms = mapMaritalStatus(sd.statut_matrimonial)
  if (ms === 'MARRIED' && !sd.presence_ddv) strategies.push({ titre: 'Donation au Dernier Vivant', description: 'Protéger le conjoint survivant.', economie: 0, recommande: true, delai: 'Court terme' })
  if (nbChildren > 0) strategies.push({ titre: 'Donations anticipées', description: `Abattements de 100 000 € par enfant, renouvelables tous les 15 ans.`, economie: round2(Math.min(nbChildren * 100000 * 0.20, enrichedRights * 0.5)), recommande: true, delai: 'Moyen terme' })
  if (!sd.presence_assurance_vie) strategies.push({ titre: 'Assurance-vie', description: 'Abattement de 152 500 € par bénéficiaire (art. 990 I).', economie: 0, recommande: true, delai: 'Court terme' })

  return {
    metadata: {
      dateEtude: new Date().toISOString().split('T')[0],
      client: { prenom: sd.identite?.prenom || null, nom: sd.identite?.nom || null, age: sd.identite?.age ?? null, sexe: sd.identite?.sexe || null },
      conseiller: sd.conseiller ? { nom: [sd.conseiller.prenom, sd.conseiller.nom].filter(Boolean).join(' ') || null, cabinet: sd.conseiller.cabinet || null, email: sd.conseiller.email || null } : null,
      regimeMatrimonial: sd.conjoint?.regimeMatrimonial || null,
      statutMatrimonial: sd.statut_matrimonial || null,
    },
    patrimoine: {
      totalBrut: round2(totalBrut), totalNet: round2(totalNet),
      repartition: { immobilier: { total: round2(immo), pourcentage: mkPct(immo) }, financier: { total: round2(fin), pourcentage: mkPct(fin) }, professionnel: { total: round2(pro), pourcentage: mkPct(pro) }, autre: { total: round2(aut), pourcentage: mkPct(aut) } },
      actifs: actifs.map((a: any) => ({ type: a.type || 'AUTRE', designation: a.designation || null, libelle: a.libelle || a.designation || null, valeur: Number(a.valeur || 0), dette: Number(a.dette || 0), valeurNette: Math.max(0, Number(a.valeur || 0) - Number(a.dette || 0)) })),
    },
    scenario1, scenario2,
    scenariosDDV: [], scenariosLegaux: [],
    optimisations: { economiePotentielle: strategies.reduce((s: number, st: any) => s + (st.economie || 0), 0), strategies },
    alertes: [] as any[],
    detailsFiscaux: {
      detailAssuranceVie: [], detailDonationsRappelees: [],
      detailLegs: legsHeirs.map(l => ({ legataire: l.name, lien: relationshipLabel(l.relationship), montant: l.grossValueReceived, droits: l.rights })),
      totalLegsDeduits: round2(legsHeirs.reduce((s, l) => s + l.grossValueReceived, 0)),
    },
    resultatInverse: null,
  }
}
