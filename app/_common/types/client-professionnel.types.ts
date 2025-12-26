/**
 * Types Client Professionnel Complet
 * Pour CGP, Notaires, Courtiers, Agents Immobiliers
 * 
 * Conformité : RGPD, AMF, ACPR, CNIL
 */

import type { 
  MembreFamille, 
  BienImmobilier, 
  ActifFinancier, 
  Revenu, 
  Charge, 
  Credit, 
  Assurance, 
  Donation,
  ObjectifPatrimonial
} from './patrimoine.types'

// =============================================================================
// ENUMS
// =============================================================================

export type TypeClient = 
  | 'PARTICULIER'
  | 'PROFESSIONNEL'
  | 'PERSONNE_MORALE'
  | 'ASSOCIATION'
  | 'FONDATION'

export type SegmentClient = 
  | 'MASS_MARKET'           // < 50k€
  | 'MASS_AFFLUENT'         // 50k€ - 500k€
  | 'AFFLUENT'              // 500k€ - 1M€
  | 'HNW'                   // 1M€ - 5M€
  | 'VHNW'                  // 5M€ - 30M€
  | 'UHNW'                  // > 30M€

export type StatutRelation = 
  | 'PROSPECT'
  | 'PROSPECT_QUALIFIE'
  | 'CLIENT_ACTIF'
  | 'CLIENT_INACTIF'
  | 'CLIENT_VIP'
  | 'ANCIEN_CLIENT'

export type OrigineClient = 
  | 'RECOMMANDATION_CLIENT'
  | 'RECOMMANDATION_PARTENAIRE'
  | 'SITE_WEB'
  | 'RESEAUX_SOCIAUX'
  | 'SALON_EVENEMENT'
  | 'PUBLICITE'
  | 'DEMARCHAGE'
  | 'APPORTEUR_AFFAIRES'
  | 'NOTAIRE'
  | 'EXPERT_COMPTABLE'
  | 'AVOCAT'
  | 'BANQUIER'
  | 'HERITAGE_PORTEFEUILLE'
  | 'AUTRE'

export type Civilite = 'M' | 'MME'

export type SituationMatrimoniale = 
  | 'CELIBATAIRE'
  | 'MARIE'
  | 'PACSE'
  | 'CONCUBIN'
  | 'DIVORCE'
  | 'SEPARE'
  | 'VEUF'

export type RegimeMatrimonial = 
  | 'COMMUNAUTE_LEGALE'              // Communauté réduite aux acquêts
  | 'COMMUNAUTE_UNIVERSELLE'
  | 'COMMUNAUTE_MEUBLES_ACQUETS'
  | 'SEPARATION_BIENS'
  | 'PARTICIPATION_ACQUETS'
  | 'COMMUNAUTE_UNIVERSELLE_ATTRIBUTION_INTEGRALE'
  | 'NON_APPLICABLE'

export type StatutProfessionnel = 
  | 'SALARIE_PRIVE'
  | 'SALARIE_CADRE'
  | 'SALARIE_CADRE_DIRIGEANT'
  | 'FONCTIONNAIRE_A'
  | 'FONCTIONNAIRE_B'
  | 'FONCTIONNAIRE_C'
  | 'CONTRACTUEL_PUBLIC'
  | 'TNS_ARTISAN'
  | 'TNS_COMMERCANT'
  | 'TNS_INDUSTRIEL'
  | 'PROFESSION_LIBERALE_BNC'
  | 'PROFESSION_LIBERALE_REGLEMENTEE'
  | 'GERANT_MAJORITAIRE'
  | 'GERANT_MINORITAIRE'
  | 'PRESIDENT_SAS'
  | 'DIRECTEUR_GENERAL'
  | 'AUTO_ENTREPRENEUR'
  | 'AGRICULTEUR'
  | 'RETRAITE_PRIVE'
  | 'RETRAITE_PUBLIC'
  | 'SANS_ACTIVITE'
  | 'ETUDIANT'
  | 'DEMANDEUR_EMPLOI'

export type CSP = 
  | 'AGRICULTEURS_EXPLOITANTS'
  | 'ARTISANS_COMMERCANTS_CHEFS_ENTREPRISE'
  | 'CADRES_PROFESSIONS_INTELLECTUELLES'
  | 'PROFESSIONS_INTERMEDIAIRES'
  | 'EMPLOYES'
  | 'OUVRIERS'
  | 'RETRAITES'
  | 'AUTRES_SANS_ACTIVITE'

export type ResidenceFiscale = 
  | 'FRANCE'
  | 'MONACO'
  | 'SUISSE'
  | 'BELGIQUE'
  | 'LUXEMBOURG'
  | 'AUTRE_UE'
  | 'HORS_UE'

export type ProfilRisque = 
  | 'SECURITAIRE'      // 0-20% UC
  | 'PRUDENT'          // 20-40% UC
  | 'EQUILIBRE'        // 40-60% UC
  | 'DYNAMIQUE'        // 60-80% UC
  | 'OFFENSIF'         // 80-100% UC

export type HorizonPlacement = 
  | 'TRES_COURT_TERME'  // < 1 an
  | 'COURT_TERME'       // 1-3 ans
  | 'MOYEN_TERME'       // 3-8 ans
  | 'LONG_TERME'        // 8-15 ans
  | 'TRES_LONG_TERME'   // > 15 ans

export type NiveauConnaissance = 
  | 'DEBUTANT'
  | 'INTERMEDIAIRE'
  | 'AVANCE'
  | 'EXPERT'

export type ObjectifInvestissement = 
  | 'SECURITE_CAPITAL'
  | 'REVENUS_REGULIERS'
  | 'CROISSANCE_CAPITAL'
  | 'SPECULATION'
  | 'DIVERSIFICATION'
  | 'OPTIMISATION_FISCALE'
  | 'TRANSMISSION'
  | 'PREPARATION_RETRAITE'

export type PreferenceContact = 
  | 'EMAIL'
  | 'TELEPHONE'
  | 'SMS'
  | 'COURRIER'
  | 'VISIO'
  | 'RDV_CABINET'
  | 'RDV_DOMICILE'

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Adresse complète
 */
export interface Adresse {
  type: 'PRINCIPALE' | 'SECONDAIRE' | 'PROFESSIONNELLE' | 'FISCALE'
  numero: string
  complement?: string
  rue: string
  codePostal: string
  ville: string
  pays: string
  depuis?: string // Date d'emménagement
}

/**
 * Pièce d'identité
 */
export interface PieceIdentite {
  type: 'CNI' | 'PASSEPORT' | 'TITRE_SEJOUR' | 'CARTE_RESIDENT' | 'PERMIS_CONDUIRE'
  numero: string
  dateDelivrance: string
  dateExpiration: string
  autoriteDelivrance: string
  paysDelivrance: string
  documentUrl?: string
  verified: boolean
  dateVerification?: string
}

/**
 * Coordonnées de contact
 */
export interface Coordonnees {
  // Téléphones
  telephoneDomicile?: string
  telephoneMobile: string
  telephoneProfessionnel?: string
  
  // Emails
  emailPersonnel: string
  emailProfessionnel?: string
  
  // Préférences
  preferenceContact: PreferenceContact[]
  consentementEmail: boolean
  consentementSMS: boolean
  consentementAppel: boolean
  
  // Disponibilités
  joursPreferesContact?: ('LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI')[]
  heuresPreferesContact?: string // ex: "09:00-12:00, 14:00-18:00"
}

/**
 * Situation professionnelle complète
 */
export interface SituationProfessionnelle {
  statut: StatutProfessionnel
  csp: CSP
  profession: string
  secteurActivite: string
  
  // Employeur / Entreprise
  employeur?: {
    raisonSociale: string
    siret?: string
    adresse?: string
    secteur: string
  }
  
  // Détails contrat
  typeContrat?: 'CDI' | 'CDD' | 'INTERIM' | 'FREELANCE' | 'FONCTIONNAIRE' | 'MILITAIRE'
  dateEmbauche?: string
  ancienneteAnnees?: number
  tempsPartiel?: boolean
  quotiteTravail?: number // pourcentage
  
  // TNS
  tnsDetails?: {
    regime: 'MICRO' | 'REEL_SIMPLIFIE' | 'REEL_NORMAL'
    dateCreation: string
    siret: string
    codeAPE: string
    chiffreAffaires: number
  }
  
  // Dirigeant
  dirigeantDetails?: {
    societe: string
    siret: string
    formeJuridique: 'SARL' | 'SAS' | 'SASU' | 'EURL' | 'SA' | 'SNC' | 'SCA'
    capitalSocial: number
    partsSociales: number
    pourcentageCapital: number
    fonctions: string[]
    mandatSocial: boolean
    cotisationsArt62?: boolean
  }
  
  // Retraite
  retraiteDetails?: {
    dateDepart: string
    regimeBase: string
    regimeComplementaire: string[]
    pensionEstimee?: number
    trimestresAcquis?: number
    trimestresManquants?: number
  }
  
  // Carrière
  carriere?: {
    emploisAnterieurs: {
      employeur: string
      poste: string
      dateDebut: string
      dateFin: string
      secteur: string
    }[]
    formationInitiale: string
    diplomePlusHaut: string
    competencesCles: string[]
  }
}

/**
 * Situation familiale complète
 */
export interface SituationFamiliale {
  situationMatrimoniale: SituationMatrimoniale
  dateSituation?: string // Date mariage, PACS, divorce...
  
  // Régime matrimonial
  regimeMatrimonial?: RegimeMatrimonial
  contratMariage?: {
    existe: boolean
    date?: string
    notaire?: string
    clauses?: ('ATTRIBUTION_INTEGRALE' | 'PRECIPUT' | 'DONATION_ENTRE_EPOUX' | 'CLAUSE_COMMERCIALE')[]
  }
  
  // Conjoint
  conjoint?: {
    civilite: Civilite
    nom: string
    nomNaissance?: string
    prenoms: string
    dateNaissance: string
    lieuNaissance: string
    nationalite: string
    numeroSecuriteSociale?: string
    situationProfessionnelle: SituationProfessionnelle
  }
  
  // Enfants
  nombreEnfants: number
  enfants: MembreFamille[]
  
  // Autres personnes à charge
  personnesACharge: MembreFamille[]
  
  // Parts fiscales
  nombrePartsFiscales: number
  
  // Informations succession
  donationsRecues?: Donation[]
  donationsConsenties?: Donation[]
  testamentExistant?: boolean
  mandatProtectionFuture?: boolean
}

/**
 * Situation fiscale
 */
export interface SituationFiscale {
  residenceFiscale: ResidenceFiscale
  paysResidenceFiscale: string
  
  // NIF
  nif?: string
  
  // Impôt sur le revenu
  impotRevenu: {
    revenuFiscalReference: number
    nombreParts: number
    tmi: number // 0, 11, 30, 41, 45
    impotNet: number
    anneeReference: number
  }
  
  // Historique IR
  historiqueIR?: {
    annee: number
    rfr: number
    impot: number
    tmi: number
  }[]
  
  // IFI
  ifi?: {
    assujetti: boolean
    patrimoineImmobilierNet: number
    impotIFI?: number
    anneeReference: number
  }
  
  // Prélèvements sociaux
  prelevementsSociaux?: number
  
  // Déficits
  deficits?: {
    foncierReportable: number
    bic: number
    bnc: number
  }
  
  // Réductions / Crédits d'impôt
  avantagesFiscaux?: {
    type: string
    montant: number
    anneeDebut: number
    anneeFin: number
  }[]
}

/**
 * KYC / MIFID complet
 */
export interface KYCComplet {
  // Profil investisseur
  profilRisque: ProfilRisque
  scoreRisque: number // 0-100
  dateProfilage: string
  
  // Objectifs
  objectifsInvestissement: ObjectifInvestissement[]
  horizonPlacement: HorizonPlacement
  
  // Capacité financière
  capaciteFinanciere: {
    patrimoineGlobal: number
    revenuAnnuel: number
    chargesAnnuelles: number
    capaciteEpargne: number
    capacitePerte: number // montant qu'il peut perdre
    pourcentagePerteAcceptable: number
  }
  
  // Connaissance et expérience
  connaissanceExperience: {
    niveauGeneral: NiveauConnaissance
    produits: {
      type: string
      connaissance: NiveauConnaissance
      experience: boolean
      frequenceOperations?: 'JAMAIS' | 'RAREMENT' | 'REGULIEREMENT' | 'FREQUEMMENT'
      volumeOperations?: number
    }[]
    formationFinanciere?: boolean
    experienceProfessionnelleFinance?: boolean
  }
  
  // LCB-FT (Lutte Contre le Blanchiment)
  lcbft: {
    pep: boolean // Personne Politiquement Exposée
    pepDetails?: {
      fonction: string
      pays: string
      dateDebut: string
      dateFin?: string
      lienPEP?: 'DIRECT' | 'FAMILLE' | 'PROCHE_ASSOCIE'
    }
    
    sanctionsEmbargos: boolean
    paysRisque: boolean
    paysResidenceRisque?: string[]
    
    // Origine des fonds
    origineFonds: {
      sources: ('SALAIRE' | 'HERITAGE' | 'DONATION' | 'VENTE_IMMOBILIER' | 'VENTE_ENTREPRISE' | 'GAINS_FINANCIERS' | 'AUTRE')[]
      details?: string
      justificatifs: string[]
    }
    
    // Source de patrimoine
    sourcePatrimoine: {
      sources: ('ACTIVITE_PROFESSIONNELLE' | 'HERITAGE' | 'INVESTISSEMENTS' | 'IMMOBILIER' | 'AUTRE')[]
      details?: string
    }
    
    // Vigilance
    niveauVigilance: 'SIMPLIFIE' | 'STANDARD' | 'RENFORCE'
    dateRevue: string
    prochaineDateRevue: string
    
    // EDD (Enhanced Due Diligence)
    edd?: {
      requis: boolean
      motif?: string
      mesuresPrises?: string[]
    }
  }
  
  // Déclarations
  declarations: {
    type: 'CONNAISSANCE_CLIENT' | 'PROFIL_INVESTISSEUR' | 'ADEQUATION' | 'DEVOIR_CONSEIL'
    date: string
    version: string
    documentUrl?: string
    signature: boolean
  }[]
  
  // Conformité
  conformite: {
    statutGlobal: 'CONFORME' | 'A_COMPLETER' | 'NON_CONFORME' | 'EN_REVUE'
    derniereRevue: string
    prochaineRevue: string
    alertes: {
      type: 'WARNING' | 'CRITIQUE'
      message: string
      date: string
    }[]
  }
}

/**
 * Préférences client
 */
export interface PreferencesClient {
  // Communication
  communication: {
    frequenceContact: 'HEBDOMADAIRE' | 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL'
    typeRapports: ('PATRIMONIAL' | 'FISCAL' | 'PERFORMANCE' | 'SYNTHESE')[]
    formatRapports: 'PDF' | 'PAPIER' | 'WEB'
  }
  
  // Investissement
  investissement: {
    exclusionsSectorielles?: ('TABAC' | 'ARMEMENT' | 'PETROLE' | 'NUCLEAIRE' | 'JEUX')[]
    preferencesESG?: boolean
    labelISR?: boolean
    investissementImpact?: boolean
  }
  
  // Services
  services: {
    gestionPilotee: boolean
    alertesMarchés: boolean
    newsletterMensuelle: boolean
    invitationsEvenements: boolean
  }
  
  // Confidentialité
  confidentialite: {
    partageConjoint: boolean
    partageComptable: boolean
    partageNotaire: boolean
    partageAvocat: boolean
  }
}

/**
 * CLIENT COMPLET
 */
export interface ClientProfessionnel {
  id: string
  
  // Métadonnées
  typeClient: TypeClient
  segment: SegmentClient
  statutRelation: StatutRelation
  origineClient: OrigineClient
  origineDetails?: string
  apporteurAffaires?: string
  
  // Conseiller
  conseillerId: string
  conseillerSecondaireId?: string
  cabinetId: string
  
  // Dates
  dateCreationFiche: string
  datePremierContact?: string
  dateEntreeRelation?: string
  dateDernierContact?: string
  dateProchainContact?: string
  
  // État civil
  civilite: Civilite
  nom: string
  nomNaissance?: string
  prenoms: string
  dateNaissance: string
  lieuNaissance: string
  departementNaissance?: string
  paysNaissance: string
  nationalites: string[]
  numeroSecuriteSociale?: string
  
  // Pièces d'identité
  piecesIdentite: PieceIdentite[]
  
  // Adresses
  adresses: Adresse[]
  
  // Coordonnées
  coordonnees: Coordonnees
  
  // Situation professionnelle
  situationProfessionnelle: SituationProfessionnelle
  
  // Situation familiale
  situationFamiliale: SituationFamiliale
  
  // Situation fiscale
  situationFiscale: SituationFiscale
  
  // Patrimoine
  patrimoine: {
    biensImmobiliers: BienImmobilier[]
    actifsFinanciers: ActifFinancier[]
    revenus: Revenu[]
    charges: Charge[]
    credits: Credit[]
    assurances: Assurance[]
  }
  
  // Synthèse patrimoine
  synthesePatrimoine: {
    patrimoineBrut: number
    patrimoineNet: number
    patrimoineImmobilierBrut: number
    patrimoineFinancierBrut: number
    totalPassifs: number
    revenuAnnuel: number
    chargesAnnuelles: number
    capaciteEpargne: number
    tauxEndettement: number
  }
  
  // KYC / MIFID
  kyc: KYCComplet
  
  // Objectifs
  objectifs: ObjectifPatrimonial[]
  
  // Préférences
  preferences: PreferencesClient
  
  // Notes
  notes?: {
    id: string
    date: string
    auteur: string
    contenu: string
    categorie: 'GENERAL' | 'PATRIMONIAL' | 'FISCAL' | 'FAMILIAL' | 'IMPORTANT'
    prive: boolean
  }[]
  
  // Documents
  documents: {
    id: string
    type: string
    categorie: string
    nom: string
    url: string
    dateUpload: string
    dateExpiration?: string
    verified: boolean
  }[]
  
  // Historique
  historique?: {
    id: string
    date: string
    type: 'CREATION' | 'MODIFICATION' | 'RDV' | 'APPEL' | 'EMAIL' | 'OPERATION' | 'DOCUMENT' | 'AUTRE'
    description: string
    auteur: string
    details?: Record<string, unknown>
  }[]
  
  // Tags
  tags: string[]
  
  // Métadonnées
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  
  // Audit
  derniereRevueGlobale?: string
  prochaineRevueProgrammee?: string
  scoreCompletudeDossier: number // 0-100
}

// =============================================================================
// TYPES POUR FORMULAIRES
// =============================================================================

/**
 * Données wizard création client
 */
export interface WizardClientData {
  // Étape 1 : Type et relation
  etape1: {
    typeClient: TypeClient
    statutRelation: StatutRelation
    origineClient: OrigineClient
    origineDetails?: string
    conseillerId: string
    segment?: SegmentClient
  }
  
  // Étape 2 : État civil
  etape2: {
    civilite: Civilite
    nom: string
    nomNaissance?: string
    prenoms: string
    dateNaissance: string
    lieuNaissance: string
    paysNaissance: string
    nationalites: string[]
    numeroSecuriteSociale?: string
  }
  
  // Étape 3 : Pièces d'identité
  etape3: {
    piecesIdentite: PieceIdentite[]
  }
  
  // Étape 4 : Coordonnées
  etape4: {
    adresses: Adresse[]
    coordonnees: Coordonnees
  }
  
  // Étape 5 : Situation familiale
  etape5: {
    situationMatrimoniale: SituationMatrimoniale
    dateSituation?: string
    regimeMatrimonial?: RegimeMatrimonial
    contratMariage?: boolean
    conjoint?: Partial<MembreFamille>
    nombreEnfants: number
    enfants: Partial<MembreFamille>[]
    nombrePartsFiscales: number
  }
  
  // Étape 6 : Situation professionnelle
  etape6: {
    statut: StatutProfessionnel
    csp: CSP
    profession: string
    secteurActivite: string
    employeur?: string
    typeContrat?: string
    dateEmbauche?: string
    revenuBrutAnnuel: number
    tnsDetails?: Partial<SituationProfessionnelle['tnsDetails']>
    dirigeantDetails?: Partial<SituationProfessionnelle['dirigeantDetails']>
  }
  
  // Étape 7 : Revenus détaillés
  etape7: {
    revenus: Partial<Revenu>[]
    revenuTotalAnnuel: number
  }
  
  // Étape 8 : Charges détaillées
  etape8: {
    charges: Partial<Charge>[]
    chargesTotalesAnnuelles: number
    capaciteEpargne: number
  }
  
  // Étape 9 : Patrimoine immobilier
  etape9: {
    biensImmobiliers: Partial<BienImmobilier>[]
    totalImmobilier: number
  }
  
  // Étape 10 : Patrimoine financier
  etape10: {
    actifsFinanciers: Partial<ActifFinancier>[]
    totalFinancier: number
  }
  
  // Étape 11 : Endettement
  etape11: {
    credits: Partial<Credit>[]
    totalCredits: number
    tauxEndettement: number
  }
  
  // Étape 12 : Situation fiscale
  etape12: {
    residenceFiscale: ResidenceFiscale
    nombreParts: number
    tmiActuel: number
    revenuFiscalReference: number
    assujettiIFI: boolean
    patrimoineIFI?: number
  }
  
  // Étape 13 : KYC / MIFID
  etape13: {
    profilRisque: ProfilRisque
    horizonPlacement: HorizonPlacement
    objectifsInvestissement: ObjectifInvestissement[]
    connaissancesProduits: KYCComplet['connaissanceExperience']['produits']
    capacitePerte: number
    pourcentagePerteAcceptable: number
  }
  
  // Étape 14 : LCB-FT
  etape14: {
    pep: boolean
    pepDetails?: KYCComplet['lcbft']['pepDetails']
    origineFonds: KYCComplet['lcbft']['origineFonds']['sources']
    origineFondsDetails?: string
    sourcePatrimoine: KYCComplet['lcbft']['sourcePatrimoine']['sources']
  }
  
  // Étape 15 : Objectifs et projets
  etape15: {
    objectifs: Partial<ObjectifPatrimonial>[]
    prioritesPrincipales: string[]
    horizonGlobal: HorizonPlacement
  }
  
  // Étape 16 : Préférences
  etape16: {
    preferences: PreferencesClient
    consentements: {
      rgpd: boolean
      prospection: boolean
      partenaires: boolean
    }
  }
  
  // Étape 17 : Récapitulatif et validation
  etape17: {
    documentsUpload: string[]
    signatureElectronique: boolean
    validationClient: boolean
    commentaires?: string
  }
}

/**
 * Configuration étapes wizard
 */
export interface WizardStepConfig {
  id: number
  titre: string
  sousTitre: string
  icone: string
  obligatoire: boolean
  champsPrerequis: string[]
  validationRules: Record<string, unknown>
  tempsEstime: number // minutes
}

export const WIZARD_STEPS_CONFIG: WizardStepConfig[] = [
  { id: 1, titre: 'Type & Relation', sousTitre: 'Nature de la relation client', icone: 'Users', obligatoire: true, champsPrerequis: [], validationRules: {}, tempsEstime: 1 },
  { id: 2, titre: 'État Civil', sousTitre: 'Informations personnelles', icone: 'User', obligatoire: true, champsPrerequis: ['etape1'], validationRules: {}, tempsEstime: 2 },
  { id: 3, titre: 'Identité', sousTitre: 'Pièces d\'identité', icone: 'CreditCard', obligatoire: true, champsPrerequis: ['etape2'], validationRules: {}, tempsEstime: 2 },
  { id: 4, titre: 'Coordonnées', sousTitre: 'Adresses et contacts', icone: 'MapPin', obligatoire: true, champsPrerequis: ['etape2'], validationRules: {}, tempsEstime: 2 },
  { id: 5, titre: 'Famille', sousTitre: 'Situation familiale complète', icone: 'Heart', obligatoire: true, champsPrerequis: ['etape2'], validationRules: {}, tempsEstime: 5 },
  { id: 6, titre: 'Profession', sousTitre: 'Situation professionnelle', icone: 'Briefcase', obligatoire: true, champsPrerequis: ['etape2'], validationRules: {}, tempsEstime: 3 },
  { id: 7, titre: 'Revenus', sousTitre: 'Revenus détaillés', icone: 'TrendingUp', obligatoire: true, champsPrerequis: ['etape6'], validationRules: {}, tempsEstime: 5 },
  { id: 8, titre: 'Charges', sousTitre: 'Charges et dépenses', icone: 'TrendingDown', obligatoire: true, champsPrerequis: ['etape7'], validationRules: {}, tempsEstime: 5 },
  { id: 9, titre: 'Immobilier', sousTitre: 'Patrimoine immobilier', icone: 'Home', obligatoire: false, champsPrerequis: ['etape2'], validationRules: {}, tempsEstime: 10 },
  { id: 10, titre: 'Financier', sousTitre: 'Patrimoine financier', icone: 'PiggyBank', obligatoire: false, champsPrerequis: ['etape2'], validationRules: {}, tempsEstime: 10 },
  { id: 11, titre: 'Crédits', sousTitre: 'Endettement', icone: 'CreditCard', obligatoire: false, champsPrerequis: ['etape9'], validationRules: {}, tempsEstime: 5 },
  { id: 12, titre: 'Fiscalité', sousTitre: 'Situation fiscale', icone: 'Calculator', obligatoire: true, champsPrerequis: ['etape7'], validationRules: {}, tempsEstime: 3 },
  { id: 13, titre: 'KYC/MIFID', sousTitre: 'Profil investisseur', icone: 'Shield', obligatoire: true, champsPrerequis: ['etape12'], validationRules: {}, tempsEstime: 5 },
  { id: 14, titre: 'LCB-FT', sousTitre: 'Conformité réglementaire', icone: 'ShieldCheck', obligatoire: true, champsPrerequis: ['etape2'], validationRules: {}, tempsEstime: 3 },
  { id: 15, titre: 'Objectifs', sousTitre: 'Objectifs patrimoniaux', icone: 'Target', obligatoire: true, champsPrerequis: ['etape12'], validationRules: {}, tempsEstime: 5 },
  { id: 16, titre: 'Préférences', sousTitre: 'Préférences et consentements', icone: 'Settings', obligatoire: true, champsPrerequis: [], validationRules: {}, tempsEstime: 2 },
  { id: 17, titre: 'Validation', sousTitre: 'Récapitulatif et signature', icone: 'CheckCircle', obligatoire: true, champsPrerequis: ['etape16'], validationRules: {}, tempsEstime: 5 },
]

/**
 * Interface alternative pour le wizard avec structure simplifiée
 * Utilisée par les formulaires de création/édition client
 */
export interface WizardClientDataSimplified {
  // Identité
  identite?: {
    civilite?: string
    nom?: string
    nomUsage?: string
    prenom?: string
    dateNaissance?: string
    lieuNaissance?: string
    departementNaissance?: string
    nationalite?: string
    doubleNationalite?: string
    typePieceIdentite?: string
    numeroPieceIdentite?: string
    dateValiditePieceIdentite?: string
    dateDelivrancePieceIdentite?: string
    autoriteDelivrance?: string
    paysResidenceFiscale?: string
    nif?: string
  }
  
  // Coordonnées
  coordonnees?: {
    adresse?: {
      ligne1?: string
      ligne2?: string
      codePostal?: string
      ville?: string
      pays?: string
    }
    estProprietaire?: boolean
    telephoneMobile?: string
    telephoneFixe?: string
    telephoneProfessionnel?: string
    emailPersonnel?: string
    emailProfessionnel?: string
    accepteSMS?: boolean
    accepteEmail?: boolean
    accepteCourrier?: boolean
    accepteAppel?: boolean
  }
  
  // Situation familiale
  situationFamiliale?: {
    situationMatrimoniale?: string
    dateSituationMatrimoniale?: string
    regimeMatrimonial?: string
    contratMariage?: boolean
    clauseAttribution?: boolean
    conjoint?: {
      civilite?: string
      nom?: string
      prenom?: string
      dateNaissance?: string
      profession?: string
    }
    enfants?: {
      prenom?: string
      dateNaissance?: string
      aCharge?: boolean
      rattachementFiscal?: string
      gardeAlternee?: boolean
    }[]
  }
  
  // Situation professionnelle
  situationProfessionnelle?: {
    statut?: string
    csp?: string
    profession?: string
    secteurActivite?: string
    employeur?: string
    siret?: string
    typeContrat?: string
    dateEntree?: string
    formeJuridique?: string
    capitalSocial?: number
    pourcentageDetention?: number
    dateDebutActivite?: string
    anneesActivite?: number
    dateRetraitePrevue?: string
  }
  
  // KYC / LCB-FT
  kycLcbft?: {
    origineFonds?: string
    detailOrigineFonds?: string
    montantPatrimoineEstime?: number
    estPPE?: boolean
    fonctionPPE?: string
    detailPPE?: string
    residenceFiscaleFrance?: boolean
    usPersonFatca?: boolean
    autresResidencesFiscales?: string
    niveauRisque?: string
    justificationRisque?: string
    dateVerificationKyc?: string
    dateProchaineRevue?: string
  }
  
  // Profil de risque / MIFID
  profilRisque?: {
    connaissances?: Record<string, string>
    reactionPerte?: string
    perteMaxAcceptee?: string
    horizonInvestissement?: string
    profilRisque?: string
  }
  
  // Patrimoine
  revenus?: Revenu[]
  charges?: Charge[]
  patrimoineImmobilier?: BienImmobilier[]
  patrimoineFinancier?: ActifFinancier[]
  credits?: Credit[]
  protectionSociale?: Record<string, unknown>
  objectifs?: ObjectifPatrimonial[]
  consentements?: Record<string, unknown>
  documents?: { id: string; name: string; type: string; url: string }[]
}
