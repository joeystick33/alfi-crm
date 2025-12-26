/**
 * Schémas de validation Zod - Simulateurs Immobilier
 * Validation stricte côté serveur
 */

import { z } from 'zod'

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMAS DE BASE RÉUTILISABLES
// ══════════════════════════════════════════════════════════════════════════════

export const situationFamilialeSchema = z.enum(['CELIBATAIRE', 'MARIE_PACSE', 'VEUF'])

export const profilClientSchema = z.object({
  situationFamiliale: situationFamilialeSchema,
  enfantsACharge: z.number().int().min(0).max(10),
  enfantsGardeAlternee: z.number().int().min(0).max(10).default(0),
  parentIsole: z.boolean().default(false),
  revenusSalaires: z.number().min(0).max(10000000),
  revenusFonciersExistants: z.number().min(0).max(1000000).default(0),
  autresRevenus: z.number().min(0).max(10000000).default(0),
  patrimoineImmobilierExistant: z.number().min(0).max(100000000).default(0),
  dettesImmobilieres: z.number().min(0).max(100000000).default(0),
  valeurRP: z.number().min(0).max(50000000).default(0),
})

export const dateAcquisitionSchema = z.string().regex(
  /^\d{4}-(0[1-9]|1[0-2])$/,
  'Format attendu: YYYY-MM (ex: 2025-01)'
)

export const financementSchema = z.object({
  apport: z.number().min(0).max(10000000),
  tauxCredit: z.number().min(0).max(15),
  dureeCredit: z.number().int().min(1).max(30),
  assuranceCredit: z.number().min(0).max(2).default(0.30),
})

export const projectionSchema = z.object({
  dureeDetention: z.number().int().min(1).max(50).default(20),
  revalorisationBien: z.number().min(-10).max(20).default(2),
  revalorisationLoyer: z.number().min(-10).max(20).default(1.5),
  fraisRevente: z.number().min(0).max(15).default(5),
})

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA LMNP
// ══════════════════════════════════════════════════════════════════════════════

export const lmnpInputSchema = profilClientSchema.extend({
  revenusBICExistants: z.number().min(0).max(10000000).default(0),
  // Bien immobilier
  dateAcquisition: dateAcquisitionSchema,
  prixAchat: z.number().min(10000).max(10000000),
  fraisNotaire: z.number().min(0).max(100000),
  travaux: z.number().min(0).max(1000000).default(0),
  mobilier: z.number().min(0).max(500000).default(0),
  partTerrain: z.number().min(0).max(50).default(15),
  dpe: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).default('D'),

  // Financement
  ...financementSchema.shape,

  // Revenus locatifs
  loyerMensuel: z.number().min(0).max(50000),
  chargesLocatives: z.number().min(0).max(10000).default(0),
  vacanceSemaines: z.number().min(0).max(52).default(2),
  revalorisationLoyer: z.number().min(-5).max(10).default(1.5),
  typeMeuble: z.enum(['CLASSIQUE', 'TOURISME_CLASSE', 'CHAMBRE_HOTES']).default('CLASSIQUE'),

  // Charges propriétaire
  taxeFonciere: z.number().min(0).max(50000).default(0),
  chargesCopro: z.number().min(0).max(50000).default(0),
  assurancePNO: z.number().min(0).max(10000).default(0),
  fraisGestion: z.number().min(0).max(20).default(0),
  cfe: z.number().min(0).max(50000).default(0),
  comptabilite: z.number().min(0).max(50000).default(0),

  // Régime fiscal
  regimeFiscal: z.enum(['MICRO_BIC', 'REEL']),
  deficitAnterieur: z.number().min(0).max(10000000).default(0),
  amortDiffereAnterieur: z.number().min(0).max(10000000).default(0),

  // Projection
  ...projectionSchema.shape,
})

export type LMNPInput = z.infer<typeof lmnpInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA LMP
// ══════════════════════════════════════════════════════════════════════════════

export const lmpInputSchema = profilClientSchema.extend({
  autresRevenusProfessionnels: z.number().min(0).max(10000000).default(0),

  // Bien immobilier
  dateAcquisition: dateAcquisitionSchema,
  prixAcquisition: z.number().min(10000).max(10000000),
  fraisNotaire: z.number().min(0).max(100000),
  travaux: z.number().min(0).max(1000000).default(0),
  mobilier: z.number().min(0).max(500000).default(0),
  partTerrain: z.number().min(0).max(50).default(15),

  // Financement
  ...financementSchema.shape,

  // Revenus locatifs
  loyerMensuel: z.number().min(0).max(50000),
  chargesLocatives: z.number().min(0).max(10000).default(0),
  vacanceSemaines: z.number().min(0).max(52).default(2),
  revalorisationLoyer: z.number().min(-5).max(10).default(1.5),

  // Charges propriétaire
  taxeFonciere: z.number().min(0).max(50000).default(0),
  chargesCopro: z.number().min(0).max(50000).default(0),
  assurancePNO: z.number().min(0).max(10000).default(0),
  fraisGestion: z.number().min(0).max(20).default(0),
  fraisComptable: z.number().min(0).max(5000).default(1500),

  // Projection
  ...projectionSchema.shape,
})

export type LMPInput = z.infer<typeof lmpInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA PINEL
// ══════════════════════════════════════════════════════════════════════════════

export const pinelInputSchema = profilClientSchema.extend({
  autresReductionsImpot: z.number().min(0).max(18000).default(0),
  dateAcquisition: dateAcquisitionSchema,
  prixAcquisition: z.number().min(10000).max(300000),
  fraisNotaire: z.number().min(0).max(30000),
  surface: z.number().min(1).max(500),
  zone: z.enum(['A_BIS', 'A', 'B1', 'B2']),
  dureeEngagement: z.number().int().min(6).max(12),
  isPinelPlus: z.boolean().default(false),

  // Financement
  ...financementSchema.shape,

  // Loyer
  loyerMensuel: z.number().min(0).max(10000),
  chargesLocatives: z.number().min(0).max(2000).default(0),
  vacanceSemaines: z.number().min(0).max(52).default(2),
  revalorisationLoyer: z.number().min(-5).max(10).default(1),

  // Charges
  taxeFonciere: z.number().min(0).max(20000).default(0),
  chargesCopro: z.number().min(0).max(20000).default(0),
  assurancePNO: z.number().min(0).max(5000).default(0),
  fraisGestion: z.number().min(0).max(20).default(0),

  // Projection
  dureeDetention: z.number().int().min(6).max(50).default(15),
  revalorisationBien: z.number().min(-10).max(20).default(2),
  fraisRevente: z.number().min(0).max(15).default(5),
})

export type PinelInput = z.infer<typeof pinelInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA DENORMANDIE
// ══════════════════════════════════════════════════════════════════════════════

export const denormandieInputSchema = profilClientSchema.extend({
  autresReductionsImpot: z.number().min(0).max(18000).default(0),
  dateAcquisition: dateAcquisitionSchema,
  prixAcquisition: z.number().min(10000).max(300000),
  fraisNotaire: z.number().min(0).max(30000),
  travaux: z.number().min(0).max(200000),
  surface: z.number().min(1).max(500),
  zone: z.enum(['A_BIS', 'A', 'B1', 'B2']),
  dureeEngagement: z.enum(['6', '9', '12']).transform(Number),

  // Financement
  ...financementSchema.shape,

  // Loyer
  loyerMensuel: z.number().min(0).max(10000),
  chargesLocatives: z.number().min(0).max(2000).default(0),
  vacanceSemaines: z.number().min(0).max(52).default(2),

  // Charges
  taxeFonciere: z.number().min(0).max(20000).default(0),
  chargesCopro: z.number().min(0).max(20000).default(0),
  assurancePNO: z.number().min(0).max(5000).default(0),
  fraisGestion: z.number().min(0).max(20).default(0),

  // Projection
  ...projectionSchema.shape,
})

export type DenormandieInput = z.infer<typeof denormandieInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA DÉFICIT FONCIER
// ══════════════════════════════════════════════════════════════════════════════

export const deficitFoncierInputSchema = profilClientSchema.extend({
  dateAcquisition: dateAcquisitionSchema,
  prixAcquisition: z.number().min(10000).max(10000000),
  fraisNotaire: z.number().min(0).max(100000),
  travaux: z.number().min(0).max(5000000),
  travauxRenovEnergetique: z.number().min(0).max(5000000).default(0),
  dureeTravaux: z.number().int().min(1).max(5).default(1),

  // Financement
  ...financementSchema.shape,

  // Loyer
  loyerMensuel: z.number().min(0).max(50000),
  chargesLocatives: z.number().min(0).max(10000).default(0),
  vacanceSemaines: z.number().min(0).max(52).default(4),
  revalorisationLoyer: z.number().min(-5).max(10).default(1.5),

  // Charges
  taxeFonciere: z.number().min(0).max(50000).default(0),
  chargesCopro: z.number().min(0).max(50000).default(0),
  assurancePNO: z.number().min(0).max(10000).default(0),
  fraisGestion: z.number().min(0).max(20).default(0),

  // Projection
  ...projectionSchema.shape,
  revalorisationBien: z.number().min(-10).max(20).default(2),
  fraisRevente: z.number().min(0).max(15).default(5),
})

export type DeficitFoncierInput = z.infer<typeof deficitFoncierInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA MALRAUX
// ══════════════════════════════════════════════════════════════════════════════

export const malrauxInputSchema = profilClientSchema.extend({
  dateAcquisition: dateAcquisitionSchema,
  prixAcquisition: z.number().min(10000).max(10000000),
  fraisNotaire: z.number().min(0).max(100000),
  travaux: z.number().min(0).max(400000),
  dureeTravaux: z.number().int().min(1).max(4),
  typeSecteur: z.enum(['SPR', 'QAD']),

  // Financement
  ...financementSchema.shape,

  // Loyer
  loyerMensuel: z.number().min(0).max(50000),
  chargesLocatives: z.number().min(0).max(10000).default(0),
  vacanceSemaines: z.number().min(0).max(52).default(2),

  // Charges
  taxeFonciere: z.number().min(0).max(50000).default(0),
  chargesCopro: z.number().min(0).max(50000).default(0),
  assurancePNO: z.number().min(0).max(10000).default(0),
  fraisGestion: z.number().min(0).max(20).default(0),

  // Projection
  ...projectionSchema.shape,
  dureeDetention: z.number().int().min(9).max(50).default(15),
})

export type MalrauxInput = z.infer<typeof malrauxInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA MONUMENTS HISTORIQUES
// ══════════════════════════════════════════════════════════════════════════════

export const monumentsHistoriquesInputSchema = profilClientSchema.extend({
  dateAcquisition: dateAcquisitionSchema,
  prixAcquisition: z.number().min(10000).max(50000000),
  fraisNotaire: z.number().min(0).max(500000),
  travaux: z.number().min(0).max(10000000),
  dureeTravaux: z.number().int().min(1).max(5).default(3),
  ouverturePublic: z.enum(['OUI', 'NON', 'PARTIEL']),
  joursOuverture: z.number().int().min(0).max(365).default(0),

  // Financement
  ...financementSchema.shape,

  // Loyer (si loué)
  loyerMensuel: z.number().min(0).max(100000).default(0),
  chargesLocatives: z.number().min(0).max(20000).default(0),
  vacanceSemaines: z.number().min(0).max(52).default(4),
  revalorisationLoyer: z.number().min(-10).max(20).default(1.5),

  // Charges
  taxeFonciere: z.number().min(0).max(100000).default(0),
  chargesCopro: z.number().min(0).max(100000).default(0),
  assurancePNO: z.number().min(0).max(20000).default(0),
  fraisGestion: z.number().min(0).max(20).default(0),
  chargesEntretienMH: z.number().min(0).max(500000).default(0),

  // Projection
  ...projectionSchema.shape,
  fraisRevente: z.number().min(0).max(15).default(5),
})

export type MonumentsHistoriquesInput = z.infer<typeof monumentsHistoriquesInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA SCPI
// ══════════════════════════════════════════════════════════════════════════════

export const scpiInputSchema = profilClientSchema.extend({
  ageUsufruitier: z.number().int().min(18).max(100).optional(),

  // Investissement
  montantInvesti: z.number().min(1000).max(10000000),
  typeAcquisition: z.enum(['PLEINE_PROPRIETE', 'NUE_PROPRIETE', 'CREDIT']),
  fraisSouscription: z.number().min(0).max(20).default(10),
  tauxDistribution: z.number().min(0).max(15).default(4.5),
  partRevenusEtrangers: z.number().min(0).max(100).default(40),
  delaiJouissance: z.number().int().min(0).max(12).default(4),

  // Si démembrement (nue-propriété)
  dureeDemembrement: z.number().int().min(5).max(20).optional(),
  decoteNuePropriete: z.number().min(0).max(60).optional(),

  // Si crédit
  apport: z.number().min(0).optional(),
  tauxCredit: z.number().min(0).max(15).optional(),
  dureeCredit: z.number().int().min(1).max(25).optional(),
  assuranceCredit: z.number().min(0).max(2).default(0.30),

  // Projection
  dureeDetention: z.number().int().min(1).max(50).default(15),
  revalorisationParts: z.number().min(-10).max(20).default(1),
  revalorisationDistribution: z.number().min(-10).max(20).default(0),
})

export type SCPIInput = z.infer<typeof scpiInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA NUE-PROPRIÉTÉ
// ══════════════════════════════════════════════════════════════════════════════

export const nueProprieteInputSchema = profilClientSchema.extend({
  dateAcquisition: dateAcquisitionSchema,
  valeurPP: z.number().min(10000).max(10000000),
  fraisNotaire: z.number().min(0).max(20).default(7),
  dureeDemembrement: z.number().int().min(5).max(20),
  typeUsufruitier: z.enum(['BAILLEUR_SOCIAL', 'PARTICULIER', 'INSTITUTIONNEL']),
  decoteNP: z.number().min(0).max(60).optional(),

  // Financement
  apport: z.number().min(0).max(10000000),
  tauxCredit: z.number().min(0).max(15),
  dureeCredit: z.number().int().min(1).max(30),
  assuranceCredit: z.number().min(0).max(2).default(0.30),

  // Après démembrement
  loyerEstimeApres: z.number().min(0).max(50000).default(0),
  optionRevente: z.boolean().default(false),
  dureePostDemembrement: z.number().int().min(0).max(30).default(10),

  // Charges après démembrement (si conservé)
  taxeFonciereEstimee: z.number().min(0).max(50000).default(0),
  chargesCoProEstimees: z.number().min(0).max(20000).default(0),
  assurancePNOEstimee: z.number().min(0).max(5000).default(0),
  fraisGestion: z.number().min(0).max(20).default(0),

  // Projection
  revalorisationBien: z.number().min(-10).max(20).default(2),
  revalorisationLoyer: z.number().min(-10).max(20).default(1.5),
  fraisRevente: z.number().min(0).max(15).default(5),
})

export type NueProprieteInput = z.infer<typeof nueProprieteInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA LOCATION SAISONNIÈRE
// ══════════════════════════════════════════════════════════════════════════════

export const saisonnierInputSchema = profilClientSchema.extend({
  dateAcquisition: dateAcquisitionSchema,
  prixAchat: z.number().min(10000).max(10000000),
  fraisNotaire: z.number().min(0).max(100000),
  travaux: z.number().min(0).max(1000000).default(0),
  mobilier: z.number().min(0).max(500000).default(0),
  typeMeuble: z.enum(['TOURISME_CLASSE', 'TOURISME_NON_CLASSE', 'CHAMBRE_HOTES']),
  estResidencePrincipale: z.boolean().default(false),

  // Exploitation
  tarifNuitee: z.number().min(0).max(5000),
  tauxOccupation: z.number().min(0).max(100),
  nbNuitsMax: z.number().int().min(1).max(365),
  fraisPlateforme: z.number().min(0).max(30).default(3),
  fraisMenage: z.number().min(0).max(500).default(40),
  chargesAnnuelles: z.number().min(0).max(100000).default(0),

  // Financement
  ...financementSchema.shape,

  // Charges propriétaire
  taxeFonciere: z.number().min(0).max(50000).default(0),
  chargesCopro: z.number().min(0).max(50000).default(0),
  assurancePNO: z.number().min(0).max(10000).default(0),
  fraisGestion: z.number().min(0).max(20).default(0),

  // Fiscalité
  regimeFiscal: z.enum(['MICRO_BIC', 'REEL']),

  // Projection
  dureeDetention: z.number().int().min(1).max(50).default(15),
  revalorisationBien: z.number().min(-10).max(20).default(2),
  revalorisationTarif: z.number().min(-10).max(20).default(2),
  fraisRevente: z.number().min(0).max(15).default(5),
})

export type SaisonnierInput = z.infer<typeof saisonnierInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA COLOCATION
// ══════════════════════════════════════════════════════════════════════════════

export const colocationInputSchema = profilClientSchema.extend({
  dateAcquisition: dateAcquisitionSchema,
  prixAcquisition: z.number().min(10000).max(10000000),
  fraisNotaire: z.number().min(0).max(100000),
  travaux: z.number().min(0).max(1000000).default(0),
  mobilier: z.number().min(0).max(200000).default(0),
  surface: z.number().min(10).max(1000),
  nbChambres: z.number().int().min(2).max(20),

  // Type de colocation
  typeLocation: z.enum(['MEUBLE', 'NUE']),
  typeBail: z.enum(['INDIVIDUEL', 'SOLIDAIRE']),

  // Financement
  ...financementSchema.shape,

  // Revenus locatifs
  loyerParChambre: z.number().min(0).max(5000),
  chargesParChambre: z.number().min(0).max(500).default(0),
  tauxOccupation: z.number().min(0).max(100).default(90),
  turnoverAnnuel: z.number().min(0).max(200).default(30),
  revalorisationLoyer: z.number().min(-5).max(10).default(1.5),

  // Charges propriétaire
  taxeFonciere: z.number().min(0).max(50000).default(0),
  chargesCopro: z.number().min(0).max(50000).default(0),
  assurancePNO: z.number().min(0).max(10000).default(0),
  fraisGestion: z.number().min(0).max(20).default(0),
  chargesCommunes: z.number().min(0).max(20000).default(0),

  // Régime fiscal
  regimeFiscal: z.enum(['MICRO_BIC', 'REEL', 'MICRO_FONCIER', 'REEL_FONCIER']),

  // Projection
  ...projectionSchema.shape,
})

export type ColocationInput = z.infer<typeof colocationInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA LOCATION NUE
// ══════════════════════════════════════════════════════════════════════════════

export const locationNueInputSchema = profilClientSchema.extend({
  dateAcquisition: dateAcquisitionSchema,
  prixAcquisition: z.number().min(10000).max(10000000),
  fraisNotaire: z.number().min(0).max(100000),
  travaux: z.number().min(0).max(1000000).default(0),

  // Financement
  ...financementSchema.shape,

  // Revenus locatifs
  loyerMensuel: z.number().min(0).max(50000),
  chargesLocatives: z.number().min(0).max(10000).default(0),
  vacanceSemaines: z.number().min(0).max(52).default(2),
  revalorisationLoyer: z.number().min(-5).max(10).default(1.5),

  // Charges propriétaire
  taxeFonciere: z.number().min(0).max(50000).default(0),
  chargesCopro: z.number().min(0).max(50000).default(0),
  assurancePNO: z.number().min(0).max(10000).default(0),
  fraisGestion: z.number().min(0).max(20).default(0),
  travauxEntretien: z.number().min(0).max(100000).default(0),

  // Régime fiscal
  regimeFiscal: z.enum(['MICRO_FONCIER', 'REEL']),

  // Projection
  ...projectionSchema.shape,
})

export type LocationNueInput = z.infer<typeof locationNueInputSchema>
