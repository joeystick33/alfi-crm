/**
 * API Route - Simulateur Dispositif Jeanbrun 2026
 * Nouveau statut du bailleur privé (remplace Pinel)
 * 
 * POST /api/advisor/simulators/immobilier/jeanbrun
 * 
 * Dispositif Jeanbrun (PLF 2026) :
 * - Amortissement fiscal sur revenus fonciers (location nue)
 * - Neuf : 3.5% (intermédiaire), 4.5% (social), 5.5% (très social)
 * - Ancien : 3% / 3.5% / 4% avec travaux ≥ 30% du prix
 * - Déficit imputable sur revenu global (10 700€ ou 21 400€ rénovation)
 * - Engagement location 9 ans minimum
 * - Uniquement immeubles collectifs
 * - Plafonds loyer : -15%, -30%, -45% du marché
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import {
  calculNombreParts,
  calculIRDetaille,
  calculIFI,
  calculMensualiteCredit,
  calculTableauAmortissement,
} from '../_shared/calculations'
import { logger } from '@/app/_common/lib/logger'
import {
  JEANBRUN,
  PRELEVEMENTS_SOCIAUX,
  BAREME_IR_2025,
  LOCATION_NUE,
} from '../_shared/constants'

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA DE VALIDATION
// ══════════════════════════════════════════════════════════════════════════════

const jeanbrunInputSchema = z.object({
  // Profil client
  situationFamiliale: z.enum(['CELIBATAIRE', 'MARIE_PACSE', 'VEUF']),
  enfantsACharge: z.number().int().min(0).max(10),
  enfantsGardeAlternee: z.number().int().min(0).max(10).default(0),
  parentIsole: z.boolean().default(false),
  revenusSalaires: z.number().min(0).max(10000000),
  revenusFonciersExistants: z.number().min(0).max(1000000).default(0),
  autresRevenus: z.number().min(0).max(10000000).default(0),
  patrimoineImmobilierExistant: z.number().min(0).max(100000000).default(0),
  dettesImmobilieres: z.number().min(0).max(100000000).default(0),
  valeurRP: z.number().min(0).max(50000000).default(0),

  // Bien immobilier
  typeLogement: z.enum(['NEUF', 'ANCIEN']),
  prixAcquisition: z.number().min(10000).max(10000000),
  surface: z.number().min(9).max(500), // m²
  fraisNotaire: z.number().min(0).max(200000).default(0),

  // Spécifique ancien
  montantTravaux: z.number().min(0).max(5000000).default(0),
  dpeAvant: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
  dpeApres: z.enum(['A', 'B']).optional(), // Jeanbrun exige A ou B

  // Catégorie de loyer
  categorieLoyer: z.enum(['INTERMEDIAIRE', 'SOCIAL', 'TRES_SOCIAL']),

  // Revenus locatifs
  loyerMarcheM2: z.number().min(5).max(50), // €/m²/mois prix du marché
  chargesLocatives: z.number().min(0).max(10000).default(0),
  vacanceSemaines: z.number().min(0).max(52).default(2),

  // Charges propriétaire
  taxeFonciere: z.number().min(0).max(50000).default(0),
  chargesCopro: z.number().min(0).max(50000).default(0),
  assurancePNO: z.number().min(0).max(10000).default(0),
  fraisGestion: z.number().min(0).max(20).default(0), // % des loyers
  comptabilite: z.number().min(0).max(5000).default(0),

  // Financement
  apport: z.number().min(0).max(10000000),
  tauxCredit: z.number().min(0).max(15),
  dureeCredit: z.number().int().min(1).max(30),
  assuranceCredit: z.number().min(0).max(2).default(0.30),

  // Projection
  dureeDetention: z.number().int().min(9).max(50).default(15),
  revalorisationBien: z.number().min(-10).max(20).default(2),
  revalorisationLoyer: z.number().min(-10).max(20).default(1.5),
})

type JeanbrunInput = z.infer<typeof jeanbrunInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// FONCTION DE SIMULATION
// ══════════════════════════════════════════════════════════════════════════════

function simulerJeanbrun(input: JeanbrunInput) {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. PROFIL FISCAL
  // ─────────────────────────────────────────────────────────────────────────────
  const nombreParts = calculNombreParts({
    situationFamiliale: input.situationFamiliale,
    enfantsACharge: input.enfantsACharge,
    enfantsGardeAlternee: input.enfantsGardeAlternee,
    parentIsole: input.parentIsole,
  })

  const revenusTotaux = input.revenusSalaires + input.revenusFonciersExistants + input.autresRevenus
  const irAvant = calculIRDetaille(revenusTotaux, nombreParts)
  const tmi = irAvant.tmi

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. VÉRIFICATION CONDITIONS JEANBRUN
  // ─────────────────────────────────────────────────────────────────────────────
  const alertes: string[] = []

  // Vérification travaux ancien
  if (input.typeLogement === 'ANCIEN') {
    const seuilTravaux = input.prixAcquisition * JEANBRUN.CONDITIONS.SEUIL_TRAVAUX_ANCIEN
    if (input.montantTravaux < seuilTravaux) {
      alertes.push(`Les travaux doivent représenter au moins 30% du prix d'acquisition (${Math.round(seuilTravaux).toLocaleString('fr-FR')} €). Montant actuel : ${input.montantTravaux.toLocaleString('fr-FR')} €.`)
    }
    if (input.dpeApres && !JEANBRUN.CONDITIONS.DPE_CIBLE.includes(input.dpeApres)) {
      alertes.push(`Le DPE après travaux doit être A ou B. DPE prévu : ${input.dpeApres}.`)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. CALCUL DU LOYER PLAFONNÉ
  // ─────────────────────────────────────────────────────────────────────────────
  const decoteLoyer = JEANBRUN.DECOTE_LOYER[input.categorieLoyer]
  const loyerPlafondM2 = input.loyerMarcheM2 * (1 - decoteLoyer)
  const loyerMensuel = loyerPlafondM2 * input.surface
  const loyerAnnuel = loyerMensuel * 12
  const loyerEffectif = loyerAnnuel * (1 - input.vacanceSemaines / 52)

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. AMORTISSEMENT JEANBRUN
  // ─────────────────────────────────────────────────────────────────────────────
  const params = input.typeLogement === 'NEUF'
    ? JEANBRUN.NEUF[input.categorieLoyer]
    : JEANBRUN.ANCIEN[input.categorieLoyer]

  const coutTotal = input.prixAcquisition + (input.typeLogement === 'ANCIEN' ? input.montantTravaux : 0)
  const baseAmortissable = coutTotal * JEANBRUN.BASE_AMORTISSABLE // 80% (excl. terrain)
  const amortissementBrut = baseAmortissable * (params.TAUX_AMORTISSEMENT / 100)
  const amortissementAnnuel = Math.min(amortissementBrut, params.PLAFOND_ANNUEL)

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. CHARGES DÉDUCTIBLES
  // ─────────────────────────────────────────────────────────────────────────────
  const fraisGestionMontant = loyerEffectif * (input.fraisGestion / 100)
  const chargesAnnuelles = input.taxeFonciere + input.chargesCopro + input.assurancePNO + fraisGestionMontant + input.comptabilite

  // Intérêts d'emprunt
  const montantEmprunt = coutTotal + input.fraisNotaire - input.apport
  const mensualiteCredit = montantEmprunt > 0
    ? calculMensualiteCredit(montantEmprunt, input.tauxCredit, input.dureeCredit)
    : 0
  const mensualiteAssurance = montantEmprunt > 0
    ? (montantEmprunt * (input.assuranceCredit / 100)) / 12
    : 0

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. PROJECTION ANNÉE PAR ANNÉE
  // ─────────────────────────────────────────────────────────────────────────────
  const projection: Array<{
    annee: number
    loyerBrut: number
    loyerEffectif: number
    charges: number
    interetsEmprunt: number
    amortissement: number
    revenuFoncierNet: number
    deficitFoncier: number
    imputationRG: number
    economieIR: number
    cashFlowAvantImpot: number
    cashFlowApresImpot: number
    capitalRestantDu: number
  }> = []

  let loyerCourant = loyerAnnuel
  let crdCourant = montantEmprunt
  let deficitReportable = 0
  let totalEconomieIR = 0
  let totalAmortissement = 0
  let totalCashFlowNet = 0

  // Tableau d'amortissement crédit
  const tauxMensuel = input.tauxCredit / 100 / 12

  for (let annee = 1; annee <= input.dureeDetention; annee++) {
    // Loyer revalorisé
    if (annee > 1) {
      loyerCourant *= (1 + input.revalorisationLoyer / 100)
    }
    const loyerEffectifAnnee = loyerCourant * (1 - input.vacanceSemaines / 52)

    // Intérêts d'emprunt (moyenne sur l'année)
    let interetsAnnee = 0
    if (annee <= input.dureeCredit && crdCourant > 0) {
      for (let mois = 0; mois < 12; mois++) {
        if (crdCourant <= 0) break
        const interetsMois = crdCourant * tauxMensuel
        const capitalMois = mensualiteCredit - interetsMois
        interetsAnnee += interetsMois
        crdCourant = Math.max(0, crdCourant - capitalMois)
      }
    }

    // Charges totales déductibles
    const chargesAnnee = chargesAnnuelles + interetsAnnee

    // Amortissement Jeanbrun (limité à l'engagement de 9 ans, renouvelable)
    const amortAnnee = annee <= JEANBRUN.ENGAGEMENT_LOCATION ? amortissementAnnuel : 0
    totalAmortissement += amortAnnee

    // Revenu foncier net (avant amortissement)
    const revenuFoncierBrut = loyerEffectifAnnee - chargesAnnee

    // Revenu foncier après amortissement
    const revenuFoncierNet = revenuFoncierBrut - amortAnnee

    // Déficit foncier
    let deficitFoncier = 0
    let imputationRG = 0
    if (revenuFoncierNet < 0) {
      deficitFoncier = Math.abs(revenuFoncierNet)
      // Imputation sur revenu global (limité)
      const plafondRG = input.typeLogement === 'ANCIEN' && input.montantTravaux > 0
        ? JEANBRUN.DEFICIT_FONCIER.PLAFOND_RG_RENOVATION_ENERGETIQUE
        : JEANBRUN.DEFICIT_FONCIER.PLAFOND_RG
      imputationRG = Math.min(deficitFoncier, plafondRG)
      deficitReportable += (deficitFoncier - imputationRG)
    } else {
      // Résorption déficit reportable
      if (deficitReportable > 0) {
        const resorption = Math.min(revenuFoncierNet, deficitReportable)
        deficitReportable -= resorption
      }
    }

    // Économie d'impôt
    const economieIR = imputationRG * (tmi / 100) + imputationRG * PRELEVEMENTS_SOCIAUX.FONCIER.TAUX_GLOBAL
    totalEconomieIR += economieIR

    // Cash-flow
    const mensualiteTotal = (mensualiteCredit + mensualiteAssurance) * 12
    const cashFlowAvantImpot = annee <= input.dureeCredit
      ? loyerEffectifAnnee - chargesAnnuelles - mensualiteTotal
      : loyerEffectifAnnee - chargesAnnuelles

    const impotSurLoyer = revenuFoncierNet > 0
      ? revenuFoncierNet * (tmi / 100) + revenuFoncierNet * PRELEVEMENTS_SOCIAUX.FONCIER.TAUX_GLOBAL
      : 0
    const cashFlowApresImpot = cashFlowAvantImpot - impotSurLoyer + economieIR

    totalCashFlowNet += cashFlowApresImpot

    projection.push({
      annee,
      loyerBrut: Math.round(loyerCourant),
      loyerEffectif: Math.round(loyerEffectifAnnee),
      charges: Math.round(chargesAnnee),
      interetsEmprunt: Math.round(interetsAnnee),
      amortissement: Math.round(amortAnnee),
      revenuFoncierNet: Math.round(revenuFoncierNet),
      deficitFoncier: Math.round(deficitFoncier),
      imputationRG: Math.round(imputationRG),
      economieIR: Math.round(economieIR),
      cashFlowAvantImpot: Math.round(cashFlowAvantImpot),
      cashFlowApresImpot: Math.round(cashFlowApresImpot),
      capitalRestantDu: Math.round(crdCourant),
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. BILAN GLOBAL
  // ─────────────────────────────────────────────────────────────────────────────
  const valeurRevente = input.prixAcquisition * Math.pow(1 + input.revalorisationBien / 100, input.dureeDetention)
  const totalLoyers = projection.reduce((sum, p) => sum + p.loyerEffectif, 0)
  const totalCharges = projection.reduce((sum, p) => sum + p.charges, 0)
  const totalMensualites = Math.min(input.dureeDetention, input.dureeCredit) * 12 * (mensualiteCredit + mensualiteAssurance)
  const rendementBrutAnnuel = (loyerAnnuel / (coutTotal + input.fraisNotaire)) * 100
  const rendementNetAnnuel = ((loyerEffectif - chargesAnnuelles) / (coutTotal + input.fraisNotaire)) * 100

  // Effort d'épargne mensuel moyen
  const effortEpargneMensuelMoyen = projection
    .filter(p => p.annee <= input.dureeCredit)
    .reduce((sum, p) => sum + (-p.cashFlowApresImpot), 0)
    / (Math.min(input.dureeDetention, input.dureeCredit) * 12)

  return {
    // Synthèse
    synthese: {
      investissementTotal: Math.round(coutTotal + input.fraisNotaire),
      montantEmprunt: Math.round(montantEmprunt),
      apportPersonnel: Math.round(input.apport),
      loyerMensuelPlafonne: Math.round(loyerMensuel),
      loyerMarcheEquivalent: Math.round(input.loyerMarcheM2 * input.surface),
      decoteLoyer: Math.round(decoteLoyer * 100),
      amortissementAnnuel: Math.round(amortissementAnnuel),
      totalAmortissement9Ans: Math.round(amortissementAnnuel * JEANBRUN.ENGAGEMENT_LOCATION),
      economieIRTotale: Math.round(totalEconomieIR),
      rendementBrutAnnuel: Math.round(rendementBrutAnnuel * 100) / 100,
      rendementNetAnnuel: Math.round(rendementNetAnnuel * 100) / 100,
      effortEpargneMensuel: Math.round(Math.max(0, effortEpargneMensuelMoyen)),
      mensualiteCredit: Math.round(mensualiteCredit + mensualiteAssurance),
      valeurRevente: Math.round(valeurRevente),
      totalCashFlowNet: Math.round(totalCashFlowNet),
    },

    // Détail amortissement Jeanbrun
    amortissement: {
      typeLogement: input.typeLogement,
      categorieLoyer: input.categorieLoyer,
      tauxAmortissement: params.TAUX_AMORTISSEMENT,
      plafondAnnuel: params.PLAFOND_ANNUEL,
      baseAmortissable: Math.round(baseAmortissable),
      amortissementBrut: Math.round(amortissementBrut),
      amortissementEffectif: Math.round(amortissementAnnuel),
      dureeEngagement: JEANBRUN.ENGAGEMENT_LOCATION,
      partTerrain: JEANBRUN.PART_TERRAIN * 100,
    },

    // Conditions d'éligibilité
    eligibilite: {
      typeBien: JEANBRUN.CONDITIONS.TYPE_BIEN,
      respecteTravauxAncien: input.typeLogement === 'NEUF' || input.montantTravaux >= input.prixAcquisition * JEANBRUN.CONDITIONS.SEUIL_TRAVAUX_ANCIEN,
      seuilTravauxMin: input.typeLogement === 'ANCIEN' ? Math.round(input.prixAcquisition * JEANBRUN.CONDITIONS.SEUIL_TRAVAUX_ANCIEN) : 0,
      montantTravaux: input.montantTravaux,
      dpeApres: input.dpeApres || 'N/A',
      dpeRequis: JEANBRUN.CONDITIONS.DPE_CIBLE,
      re2020Neuf: input.typeLogement === 'NEUF' ? JEANBRUN.CONDITIONS.RE2020_NEUF : false,
    },

    // Comparaison avec location nue sans Jeanbrun
    comparaison: {
      sansJeanbrun: {
        revenuFoncierAnnee1: Math.round(loyerEffectif - chargesAnnuelles - (projection[0]?.interetsEmprunt || 0)),
        impotAnnee1: Math.round(Math.max(0, loyerEffectif - chargesAnnuelles - (projection[0]?.interetsEmprunt || 0)) * ((tmi / 100) + PRELEVEMENTS_SOCIAUX.FONCIER.TAUX_GLOBAL)),
      },
      avecJeanbrun: {
        revenuFoncierAnnee1: Math.round(projection[0]?.revenuFoncierNet || 0),
        economieAnnee1: Math.round(projection[0]?.economieIR || 0),
      },
      gainFiscalAnnee1: Math.round((projection[0]?.economieIR || 0) + Math.max(0, -(projection[0]?.revenuFoncierNet || 0)) * ((tmi / 100) + PRELEVEMENTS_SOCIAUX.FONCIER.TAUX_GLOBAL)),
    },

    // Projection détaillée
    projection,

    // Alertes
    alertes,

    // Profil fiscal
    profilFiscal: {
      nombreParts,
      tmi,
      irAvant: irAvant.impotNet,
    },
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE POST
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)

    const body = await request.json()
    const validatedData = jeanbrunInputSchema.parse(body)
    const result = simulerJeanbrun(validatedData)

    return createSuccessResponse({
      simulation: result,
      metadata: {
        dispositif: 'Jeanbrun 2026',
        description: 'Nouveau statut du bailleur privé — Amortissement fiscal sur revenus fonciers',
        source: 'PLF 2026 — Dispositif « Relance logement »',
        dateCalcul: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return createErrorResponse(
        `Données invalides : ${error.errors.map((e: any) => `${e.path.join('.')} - ${e.message}`).join(', ')}`,
        400
      )
    }
    logger.error('Erreur simulateur Jeanbrun:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de la simulation Jeanbrun', 500)
  }
}
