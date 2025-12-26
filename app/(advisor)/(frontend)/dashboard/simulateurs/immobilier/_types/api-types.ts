/**
 * Types partagés pour les résultats des API simulateurs immobiliers
 * Ces types correspondent aux réponses des routes API backend
 */

// ══════════════════════════════════════════════════════════════════════════════
// TYPES COMMUNS
// ══════════════════════════════════════════════════════════════════════════════

export interface ProfilClientResult {
  nombreParts: number
  tmi: number
  irAvant: number
  ifiAvant: number
  assujettiIFIAvant: boolean
  ifiApres: number
  assujettiIFIApres: boolean
  impactIFI?: number
}

export interface PlusValueResult {
  plusValueBrute: number
  abattementIR: number
  abattementPS: number
  plusValueImposableIR: number
  plusValueImposablePS: number
  impotIR: number
  impotPS: number
  impotTotal: number
  dureeDetention: number
  exonereIR: boolean
  exonerePS: boolean
}

export interface ProjectionAnnuelle {
  annee: number
  loyer?: number
  loyerNet?: number
  charges?: number
  interets?: number
  amortissement?: number
  amortUtilise?: number
  baseImposable?: number
  ir: number
  ps: number
  creditAnnuel?: number
  capitalRestant: number
  cfAvantImpots: number
  cfApresImpots: number
  valeurBien: number
  capitalNet: number
}

export interface Alerte {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

// ══════════════════════════════════════════════════════════════════════════════
// LMNP
// ══════════════════════════════════════════════════════════════════════════════

export interface LMNPInput {
  situationFamiliale: 'CELIBATAIRE' | 'MARIE_PACSE' | 'VEUF'
  enfantsACharge: number
  enfantsGardeAlternee?: number
  parentIsole?: boolean
  revenusSalaires: number
  revenusFonciersExistants?: number
  revenusBICExistants?: number
  autresRevenus?: number
  patrimoineImmobilierExistant?: number
  dettesImmobilieres?: number
  valeurRP?: number
  dateAcquisition: string
  prixAchat: number
  fraisNotaire: number
  travaux?: number
  mobilier?: number
  partTerrain?: number
  dpe?: string
  apport: number
  tauxCredit: number
  dureeCredit: number
  assuranceCredit?: number
  loyerMensuel: number
  chargesLocatives?: number
  vacanceSemaines?: number
  revalorisationLoyer?: number
  typeMeuble?: string
  taxeFonciere?: number
  chargesCopro?: number
  assurancePNO?: number
  fraisGestion?: number
  cfe?: number
  comptabilite?: number
  regimeFiscal: 'MICRO_BIC' | 'REEL'
  deficitAnterieur?: number
  amortDiffereAnterieur?: number
  dureeDetention: number
  revalorisationBien?: number
  fraisRevente?: number
}

export interface LMNPSynthese {
  investTotal: number
  montantEmprunte: number
  mensualite: number
  loyerAnnuel: number
  rentaBrute: number
  rentaNette: number
  tri: number
  cashFlowMoyen: number
  cashFlowMoyenMensuel: number
  cashFlowCumule: number
  irCumule: number
  psCumule: number
  amortCumule: number
  amortDiffereRestant: number
  plusValueBrute: number
  impotPV: number
  plusValueNette: number
  gainTotal: number
}

export interface LMNPResult {
  success: boolean
  synthese: LMNPSynthese
  fiscalite: {
    regimeFiscal: string
    eligibleMicroBIC: boolean
    plafondMicroBIC: number
    abattementMicroBIC: number
    alerteLMP: boolean
    seuilLMP: number
  }
  amortissements: {
    immeuble: number
    mobilier: number
    travaux: number
    total: number
  }
  credit: {
    montant: number
    mensualite: number
    interetsTotaux: number
    coutTotal: number
    dateFinCredit: string
  }
  profilClient: ProfilClientResult
  plusValue: PlusValueResult
  projections: ProjectionAnnuelle[]
  alertes: Alerte[]
}

// ══════════════════════════════════════════════════════════════════════════════
// LMP
// ══════════════════════════════════════════════════════════════════════════════

export interface LMPResult {
  success: boolean
  synthese: {
    investTotal: number
    montantEmprunte: number
    mensualite: number
    loyerAnnuel: number
    rentaBrute: number
    rentaNette: number
    tri: number
    cashFlowMoyen: number
    cashFlowCumule: number
    irCumule: number
    cotisationsSSICumulees: number
    plusValueBrute: number
    impotPV: number
    plusValueNette: number
    gainTotal: number
  }
  statutLMP: {
    estLMP: boolean
    recettesAnnuelles: number
    autresRevenusActivite: number
    conditionRecettes: boolean
    conditionRevenus: boolean
  }
  cotisationsSSI: {
    taux: number
    montantAnnuel: number
  }
  profilClient: ProfilClientResult
  plusValue: PlusValueResult
  projections: ProjectionAnnuelle[]
  alertes: Alerte[]
}

// ══════════════════════════════════════════════════════════════════════════════
// PINEL
// ══════════════════════════════════════════════════════════════════════════════

export interface PinelResult {
  success: boolean
  synthese: {
    investTotal: number
    montantEmprunte: number
    mensualite: number
    loyerAnnuel: number
    rentaBrute: number
    rentaNette: number
    tri: number
    cashFlowMoyen: number
    cashFlowCumule: number
    reductionIRTotale: number
    reductionIRAnnuelle: number
    irCumule: number
    psCumule: number
    gainTotal: number
  }
  dispositifPinel: {
    zone: string
    dureeEngagement: number
    tauxReduction: number
    plafondInvestissement: number
    plafondLoyer: number
    plafondRessources: number
    reductionEligible: boolean
  }
  profilClient: ProfilClientResult
  plusValue: PlusValueResult
  projections: ProjectionAnnuelle[]
  alertes: Alerte[]
}

// ══════════════════════════════════════════════════════════════════════════════
// SCPI
// ══════════════════════════════════════════════════════════════════════════════

export interface SCPIResult {
  success: boolean
  synthese: {
    investissementBrut: number
    fraisSouscription: number
    investissementNet: number
    valeurParts: number
    montantEmprunte: number
    mensualite: number
    distributionAnnuelle: number
    rendementBrut: number
    rendementNet: number
    tri: number
    cashFlowMoyen: number
    cashFlowCumule: number
    irCumule: number
    psCumule: number
    creditImpotCumule: number
    valeurRevente: number
    plusValueBrute: number
    impotPV: number
    plusValueNette: number
    gainTotal: number
  }
  parametresSCPI: {
    typeAcquisition: string
    tauxDistribution: number
    fraisSouscription: number
    delaiJouissance: number
    partRevenusEtrangers: number
    dureeDemembrement?: number
    decoteNuePropriete?: number
    valeurPPTheorique?: number
  }
  profilClient: ProfilClientResult
  projections: Array<{
    annee: number
    valeurParts: number
    distribution: number
    distributionFrance: number
    distributionEtranger: number
    irFrance: number
    psFrance: number
    creditImpotEtranger: number
    interetsCredit: number
    creditAnnuel: number
    capitalRestant: number
    cfAvantImpots: number
    cfApresImpots: number
    recoitRevenus: boolean
  }>
  alertes: Alerte[]
}

// ══════════════════════════════════════════════════════════════════════════════
// LOCATION SAISONNIÈRE
// ══════════════════════════════════════════════════════════════════════════════

export interface SaisonnierResult {
  success: boolean
  synthese: {
    investTotal: number
    montantEmprunte: number
    mensualite: number
    nuitsLouees: number
    recettesBrutes: number
    recettesNettes: number
    rentaBrute: number
    rentaNette: number
    tri: number
    cashFlowMoyen: number
    cashFlowCumule: number
    irCumule: number
    psCumule: number
    ssiCumule: number
    amortStockeRestant: number
    plusValueBrute: number
    impotPV: number
    plusValueNette: number
    gainTotal: number
  }
  exploitation: {
    typeMeuble: string
    estResidencePrincipale: boolean
    limiteNuitsRP: number | null
    nbNuitsMax: number
    nuitsEffectives: number
    tauxOccupation: number
    tarifNuitee: number
    fraisPlateforme: number
  }
  fiscalite: {
    regimeFiscal: string
    abattementMicroBIC: number
    plafondMicroBIC: number
    depassePlafond: boolean
    estLMP: boolean
    seuilLMP: number
    cotisationsSSI: string | null
  }
  profilClient: ProfilClientResult
  plusValue: PlusValueResult
  projections: ProjectionAnnuelle[]
  alertes: Alerte[]
}

// ══════════════════════════════════════════════════════════════════════════════
// NUE-PROPRIÉTÉ
// ══════════════════════════════════════════════════════════════════════════════

export interface NueProprieteResult {
  success: boolean
  synthese: {
    valeurPP: number
    decoteNP: number
    prixNP: number
    fraisNotaire: number
    investTotal: number
    montantEmprunte: number
    mensualite: number
    gainIntrinseque: number
    gainIntrinsequeRevalue: number
    tri: number
    rendementAnnualise: number
    cashFlowMoyen: number
    cashFlowCumule: number
    irCumule: number
    psCumule: number
    economieIFI_annuelle: number
    economieIFI_totale: number
    valeurRevente: number
    plusValueBrute: number
    impotPV: number
    plusValueNette: number
    gainTotal: number
  }
  demembrement: {
    dureeDemembrement: number
    typeUsufruitier: string
    decoteNP: number
    valeurUsufruit: number
    exonerationIFI: boolean
    pasDeRevenus: boolean
    pasDeCharges: boolean
    finDemembrement: number
  }
  profilClient: ProfilClientResult
  plusValue: PlusValueResult
  projections: Array<{
    annee: number
    phase: 'DEMEMBREMENT' | 'PLEINE_PROPRIETE'
    loyer: number
    charges: number
    revenuFoncier: number
    ir: number
    ps: number
    creditAnnuel: number
    capitalRestant: number
    cfAvantImpots: number
    cfApresImpots: number
    valeurBien: number
    valeurIFI: number
    capitalNet: number
  }>
  alertes: Alerte[]
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTS DES ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════

export const API_ENDPOINTS = {
  LMNP: '/api/advisor/simulators/immobilier/lmnp',
  LMP: '/api/advisor/simulators/immobilier/lmp',
  PINEL: '/api/advisor/simulators/immobilier/pinel',
  DENORMANDIE: '/api/advisor/simulators/immobilier/denormandie',
  DEFICIT_FONCIER: '/api/advisor/simulators/immobilier/deficit-foncier',
  MALRAUX: '/api/advisor/simulators/immobilier/malraux',
  MONUMENTS_HISTORIQUES: '/api/advisor/simulators/immobilier/monuments-historiques',
  SCPI: '/api/advisor/simulators/immobilier/scpi',
  NUE_PROPRIETE: '/api/advisor/simulators/immobilier/nue-propriete',
  SAISONNIER: '/api/advisor/simulators/immobilier/saisonnier',
  LOCATION_NUE: '/api/advisor/simulators/immobilier/location-nue',
  COLOCATION: '/api/advisor/simulators/immobilier/colocation',
} as const
