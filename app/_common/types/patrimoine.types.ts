/**
 * Types Patrimoine Professionnel
 * Pour CGP, Notaires, Ingénieurs patrimoniaux, Courtiers
 * 
 * Conformité : AMF, ACPR, Code Civil, CGI
 */

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

// --- IMMOBILIER ---
export type TypeBienImmobilier = 
  | 'RESIDENCE_PRINCIPALE'
  | 'RESIDENCE_SECONDAIRE'
  | 'LOCATIF_NU'
  | 'LOCATIF_MEUBLE'
  | 'LMNP'
  | 'LMP'
  | 'SCPI'
  | 'OPCI'
  | 'SCI'
  | 'CROWDFUNDING_IMMO'
  | 'VIAGER'
  | 'NUE_PROPRIETE'
  | 'USUFRUIT'
  | 'PARKING_GARAGE'
  | 'TERRAIN'
  | 'LOCAL_COMMERCIAL'
  | 'LOCAL_PROFESSIONNEL'
  | 'IMMEUBLE_RAPPORT'
  | 'MONUMENT_HISTORIQUE'
  | 'MALRAUX'
  | 'PINEL'
  | 'DENORMANDIE'

export type TypeUsageImmobilier = 
  | 'HABITATION'
  | 'COMMERCIAL'
  | 'PROFESSIONNEL'
  | 'MIXTE'
  | 'AGRICOLE'
  | 'INDUSTRIEL'

export type ModeDétention = 
  | 'PLEINE_PROPRIETE'
  | 'NUE_PROPRIETE'
  | 'USUFRUIT'
  | 'USUFRUIT_TEMPORAIRE'
  | 'INDIVISION'
  | 'COMMUNAUTE'
  | 'SCI_IS'
  | 'SCI_IR'
  | 'SARL_FAMILLE'
  | 'DEMEMBREMENT_CROISE'

export type RegimeFiscalImmobilier = 
  | 'MICRO_FONCIER'
  | 'REEL_FONCIER'
  | 'MICRO_BIC'
  | 'REEL_BIC'
  | 'IS'
  | 'PINEL'
  | 'PINEL_PLUS'
  | 'DENORMANDIE'
  | 'MALRAUX'
  | 'MONUMENTS_HISTORIQUES'
  | 'DEFICIT_FONCIER'
  | 'LOC_AVANTAGES'

export type EtatBien = 
  | 'NEUF'
  | 'ANCIEN_BON_ETAT'
  | 'ANCIEN_TRAVAUX'
  | 'VEFA'
  | 'RENOVATION_COMPLETE'

// --- ACTIFS FINANCIERS ---
export type TypeActifFinancier = 
  // Épargne réglementée
  | 'LIVRET_A'
  | 'LDDS'
  | 'LEP'
  | 'LIVRET_JEUNE'
  | 'CEL'
  | 'PEL'
  // Assurance-vie
  | 'ASSURANCE_VIE_FONDS_EUROS'
  | 'ASSURANCE_VIE_UC'
  | 'ASSURANCE_VIE_EURO_CROISSANCE'
  | 'CONTRAT_CAPITALISATION'
  | 'CONTRAT_LUXEMBOURGEOIS'
  | 'PEP_ASSURANCE'
  // Épargne retraite
  | 'PER_INDIVIDUEL'
  | 'PER_ENTREPRISE'
  | 'PER_OBLIGATOIRE'
  | 'PERP'
  | 'MADELIN'
  | 'PREFON'
  | 'COREM'
  | 'ARTICLE_83'
  | 'ARTICLE_39'
  | 'PERCO'
  // Actions
  | 'PEA'
  | 'PEA_PME'
  | 'PEA_JEUNE'
  | 'COMPTE_TITRES'
  // Autres
  | 'COMPTE_COURANT'
  | 'COMPTE_TERME'
  | 'OPCVM'
  | 'FIP'
  | 'FCPI'
  | 'FCPR'
  | 'SOFICA'
  | 'GIRARDIN'
  | 'CRYPTO_ACTIFS'
  | 'PRIVATE_EQUITY'
  | 'CROWDFUNDING'
  | 'OR_PHYSIQUE'
  | 'PARTS_SOCIALES'

export type TypeSupportAssuranceVie = 
  | 'FONDS_EUROS'
  | 'UC_ACTIONS'
  | 'UC_OBLIGATIONS'
  | 'UC_DIVERSIFIE'
  | 'UC_IMMOBILIER'
  | 'UC_MONETAIRE'
  | 'EURO_CROISSANCE'
  | 'SCPI'
  | 'OPCI'
  | 'SCI'
  | 'ETF'
  | 'ACTIONS_TITRES_VIFS'
  | 'PRODUITS_STRUCTURES'

export type ProfilGestion = 
  | 'GESTION_LIBRE'
  | 'GESTION_PROFILEE_PRUDENT'
  | 'GESTION_PROFILEE_EQUILIBRE'
  | 'GESTION_PROFILEE_DYNAMIQUE'
  | 'GESTION_PILOTEE'
  | 'GESTION_SOUS_MANDAT'

// --- REVENUS ---
// Types alignés sur les enums Prisma RevenueCategory (migration 20251210)
export type CategorieRevenu = 
  // Revenus du travail salarié
  | 'SALAIRE'
  | 'PRIME'
  | 'BONUS'
  | 'AVANTAGE_NATURE'
  | 'INDEMNITE_LICENCIEMENT'
  | 'INDEMNITE_RUPTURE_CONVENTIONNELLE'
  // Revenus des indépendants (TNS)
  | 'BIC'
  | 'BNC'
  | 'BA'
  | 'HONORAIRES'
  | 'DROITS_AUTEUR'
  // Revenus de dirigeant
  | 'REMUNERATION_GERANT'
  | 'DIVIDENDES'
  | 'JETONS_PRESENCE'
  // Revenus immobiliers
  | 'REVENUS_FONCIERS'
  | 'LMNP'
  | 'LMP'
  | 'LOCATION_SAISONNIERE'
  | 'SCPI'
  // Revenus de capitaux mobiliers
  | 'INTERETS'
  | 'PLUS_VALUES_MOBILIERES'
  | 'ASSURANCE_VIE_RACHAT'
  | 'CRYPTO'
  // Retraite et pension
  | 'PENSION_RETRAITE'
  | 'RETRAITE_COMPLEMENTAIRE'
  | 'PER_RENTE'
  | 'PENSION_REVERSION'
  // Prestations sociales
  | 'PENSION_ALIMENTAIRE_RECUE'
  | 'PENSION_INVALIDITE'
  | 'ALLOCATION_CHOMAGE'
  | 'RSA'
  | 'ALLOCATIONS_FAMILIALES'
  | 'APL'
  // Autres revenus
  | 'RENTE_VIAGERE'
  | 'REVENU_EXCEPTIONNEL'
  | 'AUTRE'

export type FrequenceRevenu = 
  | 'MENSUEL'
  | 'TRIMESTRIEL'
  | 'SEMESTRIEL'
  | 'ANNUEL'
  | 'PONCTUEL'

// --- CHARGES ---
// Types alignés sur les enums Prisma ExpenseCategory (migration 20251210)
export type CategorieCharge = 
  // Logement
  | 'LOYER'
  | 'CHARGES_COPROPRIETE'
  | 'TAXE_FONCIERE'
  | 'TAXE_HABITATION'
  | 'ASSURANCE_HABITATION'
  | 'ELECTRICITE_GAZ'
  | 'EAU'
  | 'INTERNET_TELEPHONE'
  | 'TRAVAUX_ENTRETIEN'
  | 'FRAIS_GESTION_LOCATIVE'
  // Transport
  | 'CREDIT_AUTO'
  | 'ASSURANCE_AUTO'
  | 'CARBURANT'
  | 'ENTRETIEN_VEHICULE'
  | 'PARKING'
  | 'TRANSPORT_COMMUN'
  | 'PEAGES'
  // Santé
  | 'MUTUELLE'
  | 'FRAIS_MEDICAUX'
  | 'OPTIQUE_DENTAIRE'
  // Assurances
  | 'ASSURANCE_VIE_PRIMES'
  | 'PREVOYANCE'
  | 'ASSURANCE_EMPRUNTEUR'
  | 'PROTECTION_JURIDIQUE'
  | 'GAV'
  // Enfants / Famille
  | 'GARDE_ENFANTS'
  | 'SCOLARITE'
  | 'ACTIVITES_ENFANTS'
  | 'PENSION_ALIMENTAIRE_VERSEE'
  | 'ETUDES_SUPERIEURES'
  // Épargne et investissement
  | 'VERSEMENT_PER'
  | 'VERSEMENT_PERP'
  | 'VERSEMENT_EPARGNE'
  | 'INVESTISSEMENT_FIP_FCPI'
  | 'INVESTISSEMENT_SOFICA'
  // Crédits et emprunts
  | 'CREDIT_IMMOBILIER_RP'
  | 'CREDIT_IMMOBILIER_LOCATIF'
  | 'CREDIT_CONSOMMATION'
  | 'CREDIT_REVOLVING'
  // Charges professionnelles
  | 'COTISATIONS_SOCIALES'
  | 'CFE'
  | 'FRAIS_COMPTABILITE'
  | 'COTISATION_SYNDICALE'
  | 'FORMATION_PROFESSIONNELLE'
  // Impôts et taxes
  | 'IMPOT_REVENU'
  | 'IFI'
  | 'PRELEVEMENTS_SOCIAUX'
  // Divers
  | 'DONS'
  | 'EMPLOI_DOMICILE'
  | 'ABONNEMENTS_LOISIRS'
  | 'ALIMENTATION'
  | 'AUTRE_CHARGE'

export type DeductibiliteFiscale = 
  | 'NON_DEDUCTIBLE'
  | 'DEDUCTIBLE_IR'
  | 'CREDIT_IMPOT_50'
  | 'CREDIT_IMPOT_66'
  | 'CREDIT_IMPOT_75'
  | 'REDUCTION_IR'
  | 'DEDUCTIBLE_REVENUS_FONCIERS'
  | 'DEDUCTIBLE_BIC_BNC'

// --- CREDITS ---
export type TypeCredit = 
  // Immobilier
  | 'CREDIT_IMMOBILIER_RP'
  | 'CREDIT_IMMOBILIER_RS'
  | 'CREDIT_IMMOBILIER_LOCATIF'
  | 'CREDIT_IMMOBILIER_SCI'
  | 'PRET_RELAIS'
  | 'PRET_IN_FINE'
  | 'PRET_AMORTISSABLE'
  | 'PTZ'
  | 'PAS'
  | 'PRET_EMPLOYEUR'
  | 'PEL_CEL'
  // Consommation
  | 'CREDIT_CONSOMMATION'
  | 'CREDIT_AUTO'
  | 'CREDIT_TRAVAUX'
  | 'CREDIT_RENOUVELABLE'
  | 'PRET_PERSONNEL'
  | 'LOA'
  | 'LLD'
  | 'LEASING'
  // Professionnel
  | 'PRET_PROFESSIONNEL'
  | 'CREDIT_BAIL'
  | 'PRET_CREATION'
  | 'PRET_BPI'
  // Études
  | 'PRET_ETUDIANT'
  | 'PRET_ETUDIANT_GARANTI'
  // Autres
  | 'AVANCE_ASSURANCE_VIE'
  | 'PRET_FAMILIAL'
  | 'DECOUVERT_AUTORISE'
  | 'COMPTE_COURANT_ASSOCIE'
  | 'AUTRE_CREDIT'

export type TypeTaux = 
  | 'FIXE'
  | 'VARIABLE'
  | 'VARIABLE_CAPE'
  | 'MIXTE'
  | 'TAUX_ZERO'

export type TypeAmortissement = 
  | 'AMORTISSABLE'
  | 'CONSTANT'
  | 'PROGRESSIF'
  | 'DEGRESSIF'
  | 'IN_FINE'
  | 'MODULARITE'
  | 'DIFFERE_TOTAL'
  | 'DIFFERE_PARTIEL'

export type TypeAssuranceEmprunteur = 
  | 'DECES'
  | 'PTIA'
  | 'IPT'
  | 'IPP'
  | 'ITT'
  | 'PERTE_EMPLOI'
  | 'MNO'

// --- ASSURANCES ---
export type TypeAssurance = 
  // Vie
  | 'DECES_SIMPLE'
  | 'DECES_ACCIDENTEL'
  | 'TEMPORAIRE_DECES'
  | 'VIE_ENTIERE'
  | 'MIXTE'
  // Prévoyance
  | 'INCAPACITE_TRAVAIL'
  | 'INVALIDITE'
  | 'DEPENDANCE'
  | 'OBSEQUES'
  | 'HOMME_CLE'
  | 'CROISE_ASSOCIES'
  // Santé
  | 'COMPLEMENTAIRE_SANTE'
  | 'SURCOMPLEMENTAIRE'
  // IARD
  | 'HABITATION_PROPRIETAIRE'
  | 'HABITATION_LOCATAIRE'
  | 'PNO'
  | 'AUTO'
  | 'MOTO'
  | 'BATEAU'
  | 'GAV'
  | 'PROTECTION_JURIDIQUE'
  | 'SCOLAIRE'
  // Pro
  | 'RC_PRO'
  | 'MULTIRISQUE_PRO'
  | 'PERTE_EXPLOITATION'

// --- SUCCESSION ---
export type LienParente = 
  | 'CONJOINT'
  | 'PARTENAIRE_PACS'
  | 'ENFANT'
  | 'PETIT_ENFANT'
  | 'ARRIERE_PETIT_ENFANT'
  | 'PARENT'
  | 'GRAND_PARENT'
  | 'FRERE_SOEUR'
  | 'NEVEU_NIECE'
  | 'ONCLE_TANTE'
  | 'COUSIN_GERMAIN'
  | 'AUTRE_PARENT'
  | 'TIERS'

export type TypeDonation = 
  | 'DON_MANUEL'
  | 'DONATION_SIMPLE'
  | 'DONATION_PARTAGE'
  | 'DONATION_GRADUELLE'
  | 'DONATION_RESIDUELLE'
  | 'DONATION_TEMPORAIRE_USUFRUIT'
  | 'DONATION_NUE_PROPRIETE'
  | 'DONATION_AVEC_RESERVE_USUFRUIT'
  | 'DONATION_ENTRE_EPOUX'
  | 'PRESENT_USAGE'

// =============================================================================
// INTERFACES COMPLÈTES
// =============================================================================

// --- IMMOBILIER ---
export interface BienImmobilier {
  id: string
  clientId: string
  
  // Identification
  nom: string
  type: TypeBienImmobilier
  usage: TypeUsageImmobilier
  etat: EtatBien
  description?: string
  
  // Localisation
  adresse: {
    numero: string
    rue: string
    complement?: string
    codePostal: string
    ville: string
    pays: string
    coordonneesGPS?: { lat: number; lng: number }
  }
  
  // Caractéristiques
  surfaceHabitable: number // m²
  surfaceTerrain?: number // m²
  nombrePieces: number
  nombreChambres: number
  nombreSDB: number
  etage?: number
  nombreEtages?: number
  anneeConstruction?: number
  dpe?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
  ges?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
  
  // Équipements
  equipements: {
    parking: boolean
    nombrePlacesParking: number
    garage: boolean
    cave: boolean
    balcon: boolean
    terrasse: boolean
    jardin: boolean
    piscine: boolean
    ascenseur: boolean
    gardien: boolean
    interphone: boolean
    digicode: boolean
  }
  
  // Acquisition
  dateAcquisition: string
  prixAcquisition: number
  fraisNotaire: number
  fraisAgence?: number
  montantTravaux?: number
  detailTravaux?: string
  modeAcquisition: 'ACHAT' | 'DONATION' | 'SUCCESSION' | 'CONSTRUCTION' | 'VIAGER'
  
  // Valorisation
  valorisationActuelle: number
  dateValorisation: string
  sourceValorisation: 'ESTIMATION_PROPRIETAIRE' | 'AGENT_IMMOBILIER' | 'NOTAIRE' | 'EXPERT'
  plusValueLatente: number
  
  // Détention
  modeDetention: ModeDétention
  quotiteDetention: number // pourcentage
  demembrementDetails?: {
    typeUsufruit: 'VIAGER' | 'TEMPORAIRE'
    ageUsufruitier?: number
    dureeRestante?: number
    valeurNuePropriete: number
    valeurUsufruit: number
  }
  indivisionDetails?: {
    coIndivisaires: {
      nom: string
      quotite: number
      lienParente: LienParente
    }[]
  }
  sciDetails?: {
    nomSCI: string
    siret: string
    nombreParts: number
    totalParts: number
    regimeFiscal: 'IS' | 'IR'
  }
  
  // Location
  estLoue: boolean
  locationDetails?: {
    typeLocation: 'NUE' | 'MEUBLEE' | 'SAISONNIERE'
    typeBail: 'BAIL_3_ANS' | 'BAIL_6_ANS' | 'BAIL_1_AN_MEUBLE' | 'BAIL_MOBILITE' | 'SAISONNIER'
    dateDebutBail: string
    dateFinBail: string
    loyerHC: number
    chargesRecuperables: number
    loyerCC: number
    depotGarantie: number
    tauxOccupation: number // pourcentage annuel
    nomLocataire?: string
    garanties: ('CAUTION_SOLIDAIRE' | 'GLI' | 'VISALE' | 'GARANT_PHYSIQUE')[]
  }
  
  // Charges
  charges: {
    taxeFonciere: number
    taxeHabitation?: number
    chargesCopropriete: number
    assurancePNO: number
    assuranceEmprunteur?: number
    fraisGestion?: number
    travaux?: number
    autres?: number
  }
  
  // Revenus (si loué)
  revenus?: {
    loyerBrutAnnuel: number
    chargesAnnuelles: number
    vacanceLocative: number
    impayés: number
    loyerNetAnnuel: number
    rendementBrut: number
    rendementNet: number
  }
  
  // Régime fiscal
  regimeFiscal: RegimeFiscalImmobilier
  dispositifFiscal?: {
    type: 'PINEL' | 'PINEL_PLUS' | 'DENORMANDIE' | 'MALRAUX' | 'MH' | 'DEFICIT_FONCIER' | 'LMNP' | 'LMP'
    dateDebut: string
    dateFin: string
    engagementLocation: number // années
    plafondLoyer?: number
    plafondRessources?: boolean
    reductionImpot?: number
    amortissementCumule?: number
  }
  
  // Crédit associé
  creditId?: string
  
  // IFI
  inclureDansIFI: boolean
  valeurIFI?: number // après abattement RP
  
  // Documents
  documents: {
    type: 'TITRE_PROPRIETE' | 'BAIL' | 'DPE' | 'DIAGNOSTIC' | 'PLAN' | 'PHOTO' | 'AUTRE'
    nom: string
    url: string
    dateUpload: string
  }[]
  
  // Métadonnées
  createdAt: string
  updatedAt: string
  createdBy: string
}

// --- ACTIF FINANCIER ---
export interface ActifFinancier {
  id: string
  clientId: string
  
  // Identification
  type: TypeActifFinancier
  nom: string
  etablissement: string
  numeroCompte?: string
  numeroContrat?: string
  
  // Dates
  dateOuverture: string
  dateEcheance?: string
  
  // Valorisation
  versementsCumules: number
  valorisationActuelle: number
  dateValorisation: string
  plusValueLatente: number
  
  // Plafonds (épargne réglementée)
  plafond?: number
  tauxRemuneration?: number
  
  // Spécifique Assurance-vie / Capitalisation
  assuranceVieDetails?: {
    typeContrat: 'MONO_SUPPORT' | 'MULTI_SUPPORT'
    profilGestion: ProfilGestion
    fraisEntree: number
    fraisGestion: number
    fraisArbitrage: number
    
    // Clause bénéficiaire
    clauseBeneficiaire: {
      type: 'STANDARD' | 'DEMEMBREE' | 'PERSONNALISEE' | 'A_TITRE_GRATUIT'
      texteClause: string
      beneficiaires: {
        ordre: number
        designation: string
        quotite: number
        lienParente: LienParente
      }[]
      dateRedaction: string
      acceptee: boolean
    }
    
    // Supports
    supports: {
      isin?: string
      nom: string
      type: TypeSupportAssuranceVie
      valorisation: number
      pourcentage: number
      performance1an?: number
      fraisGestionSupport: number
    }[]
    
    // Rachats
    rachatsPartiels: {
      date: string
      montant: number
      plusValue: number
      fiscalite: 'PFL' | 'BAREME' | 'EXONERE'
    }[]
    
    // Avances
    avancesEnCours: number
    
    // Options
    options: {
      garantiePlancher: boolean
      garantieDecesAccidentel: boolean
      tauxMinimumGaranti?: number
      optionConversion?: boolean
      ratchet?: boolean
      garantieBonneFinTMG?: boolean
    }
  }
  
  // Spécifique PEA
  peaDetails?: {
    typePEA: 'PEA' | 'PEA_PME' | 'PEA_JEUNE'
    plafondVersements: number
    versementsEffectues: number
    versementsDepuisOuverture?: number // Alias pour versementsEffectues
    retraitsCumules?: number
    dividendesPercus?: number
    plusValuesRealisees?: number
    indiceReference?: string
    disponibilite: 'DISPONIBLE' | 'BLOQUE_5_ANS' | 'CLOTURE_AVANT_5_ANS'
    lignes: {
      isin?: string
      nom: string
      type: 'ACTION' | 'ETF' | 'OPCVM' | 'SICAV' | 'CERTIFICAT' | 'WARRANT' | 'UC_ACTIONS' | 'OPCVM_ACTIONS'
      quantite: number
      prixRevientUnitaire?: number
      pru?: number // Alias pour prixRevientUnitaire
      coursActuel: number
      valorisation: number
      plusValue?: number
      dividendes?: number
      poids?: number // Poids dans le portefeuille en %
      fraisGestionSupport?: number
      pourcentage?: number
    }[]
  }
  
  // Spécifique PER
  perDetails?: {
    typePER: 'PER_INDIVIDUEL' | 'PER_ENTREPRISE_COLLECTIF' | 'PER_ENTREPRISE_OBLIGATOIRE'
    compartiment: 'COMPARTIMENT_1' | 'COMPARTIMENT_2' | 'COMPARTIMENT_3'
    versementsDeductibles: number
    versementsNonDeductibles: number
    tmiEntree: number
    tmiEstimeeSortie: number
    profilGestion: ProfilGestion
    sortieEnCapital: boolean
    sortieEnRente: boolean
    supports: {
      nom: string
      type: TypeSupportAssuranceVie
      valorisation: number
      pourcentage: number
    }[]
  }
  
  // Spécifique Compte-titres
  compteTitresDetails?: {
    lignes: {
      isin: string
      nom: string
      type: 'ACTION' | 'OBLIGATION' | 'ETF' | 'OPCVM' | 'WARRANT' | 'CERTIFICAT' | 'TURBO'
      quantite: number
      prixRevientUnitaire: number
      coursActuel: number
      valorisation: number
      plusValue: number
      dateAcquisition: string
      dividendes: number
      eligiblePEA: boolean
    }[]
    moinsValueReportable: number
  }
  
  // Spécifique Crypto
  cryptoDetails?: {
    plateforme: string
    actifs: {
      symbole: string
      nom: string
      quantite: number
      prixRevientUnitaire: number
      coursActuel: number
      valorisation: number
    }[]
  }
  
  // Spécifique SCPI
  scpiDetails?: {
    nomSCPI: string
    societeGestion: string
    typeSCPI: 'RENDEMENT' | 'FISCALE' | 'PLUS_VALUE' | 'DIVERSIFIEE'
    nombreParts: number
    prixPartAcquisition: number
    prixPartActuel: number
    valeurReconstitution: number
    tdvm: number // taux distribution
    tri: number
    fraisSouscription: number
    delaiJouissance: number
    revenus: {
      annee: number
      montant: number
    }[]
  }
  
  // Fiscalité
  fiscalite: {
    regimeFiscal: 'PFU' | 'BAREME' | 'EXONERE' | 'SPECIFIQUE'
    assietteTaxable: number
    abattementApplicable?: number
    imposition?: number
  }
  
  // IFI
  inclureDansIFI: boolean
  valeurIFI?: number
  
  // Gestion
  gestionPar: 'CLIENT' | 'CABINET' | 'BANQUE' | 'CGP_EXTERNE'
  mandatGestion: boolean
  
  // Métadonnées
  documents: {
    type: 'RELEVE' | 'CONTRAT' | 'CONDITIONS' | 'CLAUSE_BENEFICIAIRE' | 'AUTRE'
    nom: string
    url: string
    dateUpload: string
  }[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

// --- REVENU ---
export interface Revenu {
  id: string
  clientId: string
  membreFamilleId?: string // si revenu du conjoint ou enfant
  
  // Identification
  categorie: CategorieRevenu
  libelle: string
  description?: string
  
  // Montants
  montantBrut: number
  montantNet?: number // alias pour montantNetVerse
  cotisationsSociales?: number
  csgDeductible?: number
  csgNonDeductible?: number
  crds?: number
  montantNetImposable?: number
  montantNetVerse?: number
  montantAnnuel?: number // calculé selon fréquence
  
  // Périodicité
  frequence: FrequenceRevenu
  dateDebut: string
  dateFin?: string
  estRecurrent: boolean
  
  // Source / Payeur
  sourceRevenu?: string
  
  // Fiscalité simplifiée
  estImposable?: boolean
  tauxImposition?: number // TMI estimé
  
  // Notes
  notes?: string
  
  // Spécifique Salaires
  salaireDetails?: {
    employeur: string
    siretEmployeur?: string
    typeContrat: 'CDI' | 'CDD' | 'INTERIM' | 'STAGE' | 'APPRENTISSAGE' | 'FONCTION_PUBLIQUE'
    tempsPartiel: boolean
    quotiteTravail?: number
    primes: {
      type: string
      montant: number
      frequence: FrequenceRevenu
    }[]
    avantagesNature: {
      type: 'VOITURE' | 'LOGEMENT' | 'NOURRITURE' | 'TELEPHONE' | 'AUTRE'
      valeur: number
    }[]
    fraisReels: boolean
    montantFraisReels?: number
    indemnitesTeletravail?: number
  }
  
  // Spécifique TNS
  tnsDetails?: {
    regime: 'MICRO_BIC' | 'REEL_BIC' | 'MICRO_BNC' | 'DECLARATION_CONTROLEE' | 'MICRO_BA' | 'REEL_BA'
    chiffreAffaires: number
    abattementMicro?: number
    charges?: number
    cotisationsSocialesTNS: number
    cfp?: number // contribution formation pro
    resultat: number
    deficitReportable?: number
  }
  
  // Spécifique Dirigeant
  dirigeantDetails?: {
    societe: string
    siret: string
    formeSociale: 'SARL' | 'SAS' | 'SASU' | 'EURL' | 'SA'
    statut: 'GERANT_MAJORITAIRE' | 'GERANT_MINORITAIRE' | 'PRESIDENT' | 'DG'
    remunerationArticle62?: number
    dividendes?: number
    dividendesChargesSociales?: number
    jetonsPresence?: number
  }
  
  // Spécifique Revenus fonciers
  foncierDetails?: {
    bienId?: string
    regime: 'MICRO_FONCIER' | 'REEL'
    loyersBruts: number
    chargesDeductibles: {
      interetsEmprunt: number
      assurance: number
      taxeFonciere: number
      fraisGestion: number
      travaux: number
      chargesCopro: number
      autres: number
    }
    revenuNetFoncier: number
    deficitFoncier?: number
    deficitReportable?: number
  }
  
  // Spécifique Revenus mobiliers
  mobilierDetails?: {
    type: 'DIVIDENDES' | 'INTERETS' | 'PLUS_VALUES'
    source?: string
    montantBrut: number
    abattement40?: number // dividendes
    csgDeductible?: number
    regimeFiscal: 'PFU' | 'BAREME'
    pfu?: number
    irBareme?: number
  }
  
  // Spécifique Pensions
  pensionDetails?: {
    type: 'RETRAITE_BASE' | 'RETRAITE_COMPLEMENTAIRE' | 'RETRAITE_SUPPLEMENTAIRE' | 'INVALIDITE' | 'ALIMENTAIRE'
    organisme: string
    abattement10?: number
  }
  
  // Métadonnées
  documents: {
    type: 'BULLETIN_SALAIRE' | 'AVIS_IMPOSITION' | 'ATTESTATION' | 'AUTRE'
    nom: string
    url: string
  }[]
  createdAt: string
  updatedAt: string
}

// --- CHARGE ---
export interface Charge {
  id: string
  clientId: string
  
  // Identification
  categorie: CategorieCharge
  libelle: string
  description?: string
  
  // Montant
  montant: number
  montantAnnuel?: number // calculé selon fréquence
  frequence: FrequenceRevenu
  dateDebut: string
  dateFin?: string
  estRecurrent: boolean
  
  // Caractéristiques
  estFixe?: boolean
  estCompressible?: boolean
  estEssentiel?: boolean
  
  // Fiscalité
  estDeductible?: boolean
  deductibilite?: DeductibiliteFiscale
  typeDeductibilite?: 'NON_DEDUCTIBLE' | 'DEDUCTIBLE_RF' | 'DEDUCTIBLE_BIC' | 'DEDUCTIBLE_IR' | 'CREDIT_IMPOT' | 'REDUCTION_IR'
  montantDeductible?: number
  plafondDeduction?: number
  
  // Notes
  notes?: string
  
  // Spécifique Emploi domicile
  emploiDomicileDetails?: {
    typeEmploi: 'MENAGE' | 'GARDE_ENFANT' | 'AIDE_PERSONNE_AGEE' | 'JARDINAGE' | 'BRICOLAGE' | 'SOUTIEN_SCOLAIRE' | 'COURS_DOMICILE'
    urssaf: boolean
    cesu: boolean
    nombreHeures: number
    tauxHoraire: number
  }
  
  // Spécifique Dons
  donsDetails?: {
    organisme: string
    typeOrganisme: 'INTERET_GENERAL' | 'UTILITE_PUBLIQUE' | 'AIDE_PERSONNES' | 'CULTE'
    tauxReduction: 66 | 75
    plafond: number
  }
  
  // Métadonnées
  documents: {
    type: 'FACTURE' | 'RECU_FISCAL' | 'ATTESTATION' | 'AUTRE'
    nom: string
    url: string
  }[]
  createdAt: string
  updatedAt: string
}

// --- CREDIT ---
export interface Credit {
  id: string
  clientId: string
  bienImmobilierId?: string
  
  // Identification
  type: TypeCredit
  libelle: string
  etablissement: string
  numeroContrat?: string
  
  // Montants
  capitalEmprunte?: number
  montantEmprunte?: number // alias pour capitalEmprunte
  capitalRestantDu: number
  capitalRembourse?: number
  interetsVerses?: number
  assuranceVersee?: number
  
  // Conditions
  taux?: number
  tauxNominal?: number // alias pour taux
  typeTaux?: TypeTaux
  taeg?: number
  tauxEffectifGlobal?: number // alias pour taeg
  dureeInitiale: number // mois
  dureeRestante: number
  dateDebut: string
  dateFin?: string
  typeAmortissement?: TypeAmortissement
  
  // Échéances
  mensualite?: number // alias pour mensualiteTotale
  mensualiteHorsAssurance?: number
  mensualiteAssurance?: number
  mensualiteTotale?: number
  jourPrelevement?: number
  
  // Assurance emprunteur
  assuranceEmprunteur?: {
    assureur?: string
    compagnie?: string // alias pour assureur
    typeContrat?: 'GROUPE' | 'DELEGATION'
    montant?: number // prime mensuelle
    taux?: number // alias pour tauxAssurance
    tauxAssurance?: number
    capitalAssure?: number
    quotite?: number // alias pour quotiteEmprunteur1
    quotiteEmprunteur1?: number
    quotiteEmprunteur2?: number
    garanties?: (
      | { type: TypeAssuranceEmprunteur; couvert: boolean; franchise?: number; exclusions?: string[] }
      | string // version simplifiée
    )[]
    dateFinGarantie?: string
    possibiliteResiliation?: boolean
    dateProchaineResiliation?: string
  }
  
  // Garanties
  garanties?: {
    type: 'HYPOTHEQUE' | 'PPD' | 'CAUTION_MUTUELLE' | 'CAUTION_BANCAIRE' | 'NANTISSEMENT' | 'AUCUNE'
    organisme?: string
    montantGaranti?: number
    frais?: number
  }[]
  
  // Modularité
  modularite?: {
    possibleHausse?: boolean
    possibleBaisse?: boolean
    possiblePause?: boolean
    pourcentageMaxHausse?: number
    pourcentageMaxBaisse?: number
    dureePauseMax?: number
    conditionsModularite?: string
  }
  
  // Remboursement anticipé
  remboursementAnticipe?: {
    possible?: boolean
    pénalites?: number // pourcentage
    plafondPenalites?: number
    franchiseRemboursement?: number
  }
  
  // Tableau d'amortissement
  tableauAmortissement?: {
    echeance: number
    date: string
    capitalRestant: number
    capitalRembourse: number
    interets: number
    assurance: number
    mensualite: number
  }[]
  
  // Fiscal
  interetsDeductibles?: boolean
  montantInteretsDeductibles?: number
  
  // Notes
  notes?: string
  
  // Métadonnées
  documents?: {
    type: 'OFFRE_PRET' | 'TABLEAU_AMORTISSEMENT' | 'ATTESTATION_ASSURANCE' | 'AUTRE'
    nom: string
    url: string
  }[]
  createdAt?: string
  updatedAt?: string
}

// --- ASSURANCE ---
export interface Assurance {
  id: string
  clientId: string
  
  // Identification
  type: TypeAssurance
  libelle: string
  compagnie: string
  numeroContrat: string
  
  // Dates
  dateEffet: string
  dateEcheance: string
  dateProchaineEcheance: string
  
  // Prime
  primeMensuelle?: number
  primeAnnuelle: number
  fractionnement: 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL'
  
  // Bénéficiaires (assurance décès)
  beneficiaires?: {
    designation: string
    quotite: number
    lienParente: LienParente
    clauseDemembree: boolean
  }[]
  
  // Garanties
  garanties: {
    type: string
    capitalAssure?: number
    franchise?: number
    plafondRemboursement?: number
    tauxRemboursement?: number
    exclusions?: string[]
  }[]
  
  // Spécifique Prévoyance
  prevoyanceDetails?: {
    capitalDeces: number
    capitalPTIA?: number
    renteConjoint?: number
    renteEducation?: number
    ijMaladie?: number
    ijAccident?: number
    franchiseIJ?: number
    dureeMaxIJ?: number
    renteInvalidite?: number
    categoriesInvalidite?: ('1' | '2' | '3')[]
  }
  
  // Spécifique Santé
  santeDetails?: {
    formule: string
    niveauCouverture: 'BASE' | 'CONFORT' | 'PREMIUM'
    optique: { monture: number; verres: number }
    dentaire: { soins: number; protheses: number; orthodontie: number }
    hospitalisation: { chambreParticuliere: number; forfaitJournalier: boolean }
    medecinesDouces?: boolean
    teletransmission: boolean
    tierPayant: boolean
    numeroAMC?: string
  }
  
  // Spécifique IARD
  iardDetails?: {
    bienAssure?: string
    adresseBien?: string
    surfaceHabitable?: number
    valeurContenu?: number
    valeurObjetsValeur?: number
    franchise: number
    franchiseVol?: number
    optionsDommages?: ('BRIS_GLACE' | 'VOL' | 'VANDALISME' | 'CATASTROPHE_NATURELLE' | 'DEGAT_EAUX')[]
  }
  
  // Spécifique Auto
  autoDetails?: {
    immatriculation: string
    marque: string
    modele: string
    annee: number
    puissanceFiscale: number
    valeurVenale: number
    usage: 'PRIVE' | 'TRAJET_TRAVAIL' | 'PROFESSIONNEL'
    kilometrageAnnuel: number
    garage: boolean
    antivol: boolean
    formule: 'TIERS' | 'TIERS_PLUS' | 'TOUS_RISQUES'
    franchiseDommages?: number
    franchiseVol?: number
    conducteurPrincipal: string
    bonus: number
    conducteurSecondaire?: string
  }
  
  // Métadonnées
  documents: {
    type: 'CONDITIONS_GENERALES' | 'CONDITIONS_PARTICULIERES' | 'ATTESTATION' | 'AUTRE'
    nom: string
    url: string
  }[]
  createdAt: string
  updatedAt: string
}

// --- MEMBRE FAMILLE ---
export interface MembreFamille {
  id: string
  clientId: string
  
  // Identification
  lienParente: LienParente
  civilite: 'M' | 'MME'
  nom: string
  nomNaissance?: string
  prenoms: string
  dateNaissance: string
  lieuNaissance: string
  nationalite: string
  numeroSecuriteSociale?: string
  
  // Pièce d'identité
  pieceIdentite?: {
    type: 'CNI' | 'PASSEPORT' | 'TITRE_SEJOUR'
    numero: string
    dateDelivrance: string
    dateExpiration: string
    autoriteDelivrance: string
  }
  
  // Contact
  adresse?: {
    identique: boolean
    rue?: string
    codePostal?: string
    ville?: string
    pays?: string
  }
  telephone?: string
  email?: string
  
  // Situation
  situationProfessionnelle?: {
    statut: 'ACTIF' | 'ETUDIANT' | 'RETRAITE' | 'SANS_ACTIVITE' | 'MINEUR'
    profession?: string
    employeur?: string
    revenus?: number
  }
  
  // Fiscal
  aChargeFiscalement: boolean
  gardeAlternee?: boolean
  handicap?: {
    reconnu: boolean
    tauxIncapacite?: number
    carteInvalidite?: boolean
  }
  
  // Succession
  ordreSuccession?: number
  partReservataire?: number
  pacteRenonciation?: boolean
  
  // Métadonnées
  documents: {
    type: 'LIVRET_FAMILLE' | 'ACTE_NAISSANCE' | 'PIECE_IDENTITE' | 'AUTRE'
    nom: string
    url: string
  }[]
  createdAt: string
  updatedAt: string
}

// --- DONATION ---
export interface Donation {
  id: string
  clientId: string
  
  // Parties
  donateur: {
    nom: string
    dateNaissance: string
    lienAvecClient: 'CLIENT' | 'CONJOINT' | 'PARENT' | 'GRAND_PARENT'
  }
  donataire: {
    nom: string
    dateNaissance: string
    lienParente: LienParente
  }
  
  // Nature
  typeDonation: TypeDonation
  nature: 'SOMME_ARGENT' | 'BIEN_IMMOBILIER' | 'VALEURS_MOBILIERES' | 'PARTS_SOCIALES' | 'ENTREPRISE' | 'AUTRE'
  description: string
  
  // Valeurs
  valeurDeclaree: number
  dateDeclaration: string
  notaire?: string
  referenceActe?: string
  
  // Démembrement
  demembrement?: {
    type: 'PLEINE_PROPRIETE' | 'NUE_PROPRIETE' | 'USUFRUIT'
    ageDonateurAuJourDonation: number
    valeurUsufruit: number
    valeurNuePropriete: number
    dureeUsufruit?: number
  }
  
  // Fiscalité
  fiscalite: {
    abattementUtilise: number
    abattementRestant: number
    dateReconstitutionAbattement: string
    droitsAcquites: number
    reductionDroits?: number
    pacteDutreil?: boolean
  }
  
  // Rapport civil
  rapportSuccession: boolean
  avancementHoirie: boolean
  
  // Métadonnées
  documents: {
    type: 'ACTE_DONATION' | 'DECLARATION_FISCALE' | 'AUTRE'
    nom: string
    url: string
  }[]
  createdAt: string
  updatedAt: string
}

// --- OBJECTIF PATRIMONIAL ---
export interface ObjectifPatrimonial {
  id: string
  clientId: string
  
  // Identification
  type: 'RETRAITE' | 'ACHAT_RP' | 'ACHAT_RS' | 'INVESTISSEMENT_LOCATIF' | 'TRANSMISSION' | 'ETUDES_ENFANTS' | 'PROTECTION_FAMILLE' | 'DEFISCALISATION' | 'EPARGNE_PRECAUTION' | 'PROJET_VIE' | 'AUTRE'
  titre: string
  description: string
  
  // Échéance
  horizon: 'COURT_TERME' | 'MOYEN_TERME' | 'LONG_TERME'
  dateObjectif?: string
  
  // Montants
  montantCible: number
  montantActuel: number
  progression: number
  
  // Effort d'épargne
  effortEpargneMensuel?: number
  effortEpargneAnnuel?: number
  
  // Simulation
  simulation?: {
    hypotheseTaux: number
    projectionDate: string
    capitalProjetee: number
    probabiliteAtteinte: number
  }
  
  // Stratégie
  strategie?: {
    produitsCibles: string[]
    allocationCible: {
      type: string
      pourcentage: number
    }[]
  }
  
  // Priorité
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE'
  
  // Statut
  statut: 'EN_COURS' | 'ATTEINT' | 'ABANDONNE' | 'REVISE'
  
  // Métadonnées
  createdAt: string
  updatedAt: string
}

// =============================================================================
// EXPORT GLOBAL
// =============================================================================

export interface PatrimoineComplet {
  clientId: string
  
  // Immobilier
  biensImmobiliers: BienImmobilier[]
  totalImmobilier: number
  totalImmobilierRP: number
  totalImmobilierLocatif: number
  
  // Financier
  actifsFinanciers: ActifFinancier[]
  totalFinancier: number
  totalEpargneReglementee: number
  totalAssuranceVie: number
  totalEpargneRetraite: number
  totalValeursMobilieres: number
  
  // Revenus
  revenus: Revenu[]
  revenuBrutAnnuel: number
  revenuNetImposableAnnuel: number
  revenuNetVerseAnnuel: number
  revenuMensuelMoyen: number
  
  // Charges
  charges: Charge[]
  chargesAnnuelles: number
  chargesMensuelles: number
  chargesDeductibles: number
  
  // Crédits
  credits: Credit[]
  totalCapitalRestant: number
  totalMensualitesCredits: number
  tauxEndettement: number
  capaciteEmprunt: number
  
  // Assurances
  assurances: Assurance[]
  totalPrimesAnnuelles: number
  
  // Synthèse
  patrimoineBrut: number
  patrimoineNet: number
  capaciteEpargneMensuelle: number
  capaciteEpargneAnnuelle: number
  tauxEpargne: number
  
  // IFI
  patrimoineIFI: number
  assujettIFI: boolean
  
  // Succession
  donations: Donation[]
  masseSuccessorale: number
}
