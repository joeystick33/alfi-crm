/**
 * Types pour les simulateurs immobiliers
 * Structures de données pour LMNP, Pinel, SCPI, etc.
 */

// =============================================================================
// TYPES COMMUNS
// =============================================================================

// Type simple pour situation familiale dans les simulateurs (différent de l'interface complexe dans client-professionnel.types.ts)
export type SituationFamilialeSimulateur = 'CELIBATAIRE' | 'MARIE_PACSE' | 'VEUF' | 'DIVORCE' | 'SEPARE'
export type ClasseDPE = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
export type RegimeFiscal = 'REEL' | 'MICRO_BIC' | 'MICRO_FONCIER'
export type TypeMeuble = 'CLASSIQUE' | 'TOURISME_CLASSE' | 'TOURISME_NON_CLASSE' | 'CHAMBRE_HOTES'
export type TypeGarantie = 'CREDIT_LOGEMENT' | 'HYPOTHEQUE' | 'CAUTION_MUTUELLE' | 'PPD'

export type AlerteType = 'error' | 'warning' | 'info' | 'success'

// =============================================================================
// ALERTES ET CONSEILS
// =============================================================================

export interface SimulateurAlerte {
  type: AlerteType
  message: string
  code?: string
}

// =============================================================================
// PROFIL CLIENT
// =============================================================================

export interface ProfilClientInput {
  situationFamiliale: SituationFamilialeSimulateur
  enfantsACharge: number
  enfantsGardeAlternee: number
  parentIsole: boolean
  revenusSalaires: number
  revenusFonciersExistants: number
  revenusBICExistants: number
  autresRevenus: number
  patrimoineImmobilierExistant: number
  dettesImmobilieres: number
  valeurRP: number
  reductionsIRUtilisees: number
}

export interface ProfilClientResult {
  nombreParts: number
  revenuTotalAvant: number
  irAvant: number
  irBrut?: number
  plafonnementQF?: number
  tmiAvant: number
  tmi: number
  ifiAvant: number
  assujettiIFIAvant: boolean
  irApres?: number
  ifiApres: number
  assujettiIFIApres: boolean
  impactIFI: number
  // Propriétés additionnelles
  [key: string]: unknown
}

// =============================================================================
// PROJECTION ANNUELLE
// =============================================================================

export interface ProjectionAnnuelle {
  annee: number
  numAnnee: number
  // Revenus
  loyerNet: number
  loyer?: number
  // Charges
  charges: number
  interets: number
  assEmp: number
  assuranceCredit?: number
  // Amortissements
  resAvantAmort: number
  resultatAvantAmort?: number
  amortAnnuel: number
  amortDispo: number
  amortUtil: number
  amortUtilise?: number
  amortDiffere: number
  // Fiscalité
  resultat: number
  baseImp: number
  baseImposable?: number
  impotIR: number
  ir?: number
  ps: number
  // Cash-flow
  cfAvant: number
  cfAvantImpots?: number
  cfApres: number
  cfApresImpots?: number
  // Capital
  capRestant: number
  capitalRestant?: number
  valBien: number
  valeurBien?: number
  capNet: number
  capitalNet?: number
}

// =============================================================================
// AMORTISSEMENTS
// =============================================================================

export interface ComposantAmortissement {
  label: string
  montant: number
  duree: number
}

export interface AmortissementsResult {
  total: number
  immeuble: number
  mobilier: number
  travaux: number
  terrain?: number
}

// =============================================================================
// PLUS-VALUE
// =============================================================================

export interface PlusValueResult {
  prixAcquisition: number
  prixAchat?: number
  prixRevient: number
  valeurRevente: number
  plusValueBrute: number
  plusValueBruteSansReforme?: number
  dureeDetention: number
  abattementIR: number
  abattementPS: number
  plusValueImposableIR: number
  plusValueImposablePS: number
  impotIR: number
  impotPS: number
  surtaxe?: number
  impotTotal: number
  capitalFinal: number
  // Majorations acquisition
  prixAcquisitionMajore?: number
  prixAcquisitionRectifie?: number
  utiliseForfaitAcquisition?: boolean
  majorationAcquisition?: number
  // Majorations travaux
  utiliseForfaitTravaux?: boolean
  majorationTravaux?: number
  // LMNP spécifique
  amortissementsReintegres?: number
  plusValueCorrigee?: number
  // Propriétés additionnelles
  [key: string]: unknown
}

// =============================================================================
// FISCALITÉ
// =============================================================================

export interface FiscaliteResult {
  regimeFiscal: RegimeFiscal | string
  typeMeuble?: TypeMeuble | string
  plafondMicroBIC?: number
  abattementMicroBIC?: number
  baseImposable?: number
  ir?: number
  ps?: number
}

// =============================================================================
// SYNTHÈSE SIMULATION
// =============================================================================

export interface SyntheseSimulation {
  // Investissement
  investTotal: number
  apport: number
  montantEmprunte: number
  mensualite: number
  // Revenus
  loyerAnnuel?: number
  loyerMensuel?: number
  // Amortissements
  amortAnnuel: number
  amortissementComposants?: ComposantAmortissement[]
  totAmort: number
  amortCumule?: number
  amortDiffRest: number
  amortDiffereRestant?: number
  // Performance
  rendBrut: number
  rentaBrute?: number
  rentaNette?: number
  tri: number
  // Cash-flow
  cfMoyMois: number
  cashFlowMoyenMensuel?: number
  cashFlowMoyen?: number
  cfCum: number
  cashFlowCumule?: number
  // Fiscalité
  totIR: number
  irCumule?: number
  totPS: number
  psCumule?: number
  // Revente
  valRev: number
  pvBrute: number
  pvCalc?: PlusValueResult
  amortReintegres: number
  capitalFinal?: number
  capFinal: number
  produitNetVente: number
  gainTotal: number
  // Sous-objets
  profilClient: ProfilClientResult
  fiscalite: FiscaliteResult
}

// =============================================================================
// RÉSULTAT API SIMULATION
// =============================================================================

export interface SimulationAPIResponse<T = SyntheseSimulation> {
  success: boolean
  data?: {
    synthese: T
    projections: ProjectionAnnuelle[]
    alertes: SimulateurAlerte[]
    profilClient: ProfilClientResult
    fiscalite: FiscaliteResult
    amortissements?: AmortissementsResult
    plusValue?: PlusValueResult
    conseils?: string[]
    explications?: string[]
  }
  error?: string
}

// =============================================================================
// PARAMÈTRES SIMULATION LMNP
// =============================================================================

export interface LMNPSimulationParams extends ProfilClientInput {
  // Bien immobilier
  dateAcquisition: string
  prixAchat: number
  fraisNotaire: number
  travaux: number
  mobilier: number
  partTerrain: number
  dpe: ClasseDPE
  // Financement
  apport: number
  tauxCredit: number
  dureeCredit: number
  assuranceCredit: number
  sansFinancement?: boolean
  typeGarantie?: TypeGarantie
  differePaiement?: number
  // Revenus locatifs
  loyerMensuel: number
  chargesLocatives: number
  vacanceSemaines: number
  revalorisationLoyer: number
  typeMeuble: TypeMeuble | string
  // Charges
  taxeFonciere: number
  chargesCopro: number
  assurancePNO: number
  fraisGestion: number
  cfe: number
  comptabilite: number
  autresCharges: number
  travauxEntretien?: number
  // Charges exceptionnelles
  fraisGarantie?: number
  fraisDossierBancaire?: number
  fraisAdministratifs?: number
  // Fiscalité
  regimeFiscal: RegimeFiscal | string
  deficitAnterieur: number
  amortDiffereAnterieur: number
  // Projection
  dureeDetention: number
  revalorisationBien: number
  fraisRevente: number
}

// =============================================================================
// PARAMÈTRES SIMULATION PINEL
// =============================================================================

export interface PinelSimulationParams extends ProfilClientInput {
  // Bien
  prixAchat: number
  surface: number
  zone: 'A_BIS' | 'A' | 'B1' | 'B2' | 'C'
  typePinel: 'PINEL' | 'PINEL_PLUS' | 'PINEL_OUTREMER'
  // Engagement
  dureeEngagement: 6 | 9 | 12
  // Financement
  apport: number
  tauxCredit: number
  dureeCredit: number
  // Location
  loyerPlafonneM2: number
  chargesLocatives: number
  // Fiscalité
  plafondLoyer?: number
  plafondRessources?: boolean
}

// =============================================================================
// PARAMÈTRES SIMULATION SCPI
// =============================================================================

export interface SCPISimulationParams extends ProfilClientInput {
  // Investissement
  montantInvesti: number
  typeSCPI: 'RENDEMENT' | 'FISCALE' | 'PLUS_VALUE' | 'DIVERSIFIEE'
  // Performance
  tauxDistribution: number
  revalorisationAnnuelle: number
  // Financement
  financement: 'COMPTANT' | 'CREDIT'
  apport?: number
  tauxCredit?: number
  dureeCredit?: number
  // Fiscalité
  regimeFiscal: 'PFU' | 'BAREME'
  // Projection
  dureeDetention: number
}

// =============================================================================
// TIMELINE ÉVÉNEMENTS
// =============================================================================

export interface SimulateurTimelineEvent {
  annee: number
  label: string
  type: 'acquisition' | 'fin_credit' | 'exoneration_ir' | 'exoneration_ps' | 'revente' | 'autre'
  description?: string
}

// =============================================================================
// INDICATEURS CLÉS
// =============================================================================

export interface IndicateursPerformance {
  rendementBrut: number
  rendementNet: number
  tri: number
  cashFlowMensuel: number
  irTotal: number
  amortUtilise: number
  gainTotal: number
}

// =============================================================================
// GRAPHIQUES
// =============================================================================

export interface ChartData {
  labels: string[] | number[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    borderWidth?: number
    type?: 'bar' | 'line' | 'scatter'
  }[]
}

// =============================================================================
// COMPARAISON SCÉNARIOS
// =============================================================================

export interface ScenarioComparaison {
  id: string
  nom: string
  params: LMNPSimulationParams | PinelSimulationParams | SCPISimulationParams
  synthese: SyntheseSimulation
  projections: ProjectionAnnuelle[]
}

// =============================================================================
// EXPORTS UTILITAIRES
// =============================================================================

// Type guard pour vérifier si une projection est valide
export function isProjectionAnnuelle(obj: unknown): obj is ProjectionAnnuelle {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'annee' in obj &&
    typeof (obj as ProjectionAnnuelle).annee === 'number'
  )
}

// Type guard pour vérifier si une synthèse est valide
export function isSyntheseSimulation(obj: unknown): obj is SyntheseSimulation {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'investTotal' in obj &&
    'gainTotal' in obj
  )
}
