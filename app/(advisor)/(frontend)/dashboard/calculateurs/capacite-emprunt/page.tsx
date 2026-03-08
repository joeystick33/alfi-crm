 
'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import { usePlotlyReady } from '../../simulateurs/immobilier/_hooks/usePlotlyReady'
import { Plus, Trash2, CheckCircle, XCircle, User, Users, AlertTriangle, Info, FileText, Lightbulb, Settings, TrendingUp, Home, Banknote, Shield, FileCheck, RotateCcw, MapPin } from 'lucide-react'
import { AdresseInput } from '@/app/_common/components/AdresseInput'
import {
  NORMES_HCSF_2025,
  getTauxMoyenParDuree,
  PRET_ACTION_LOGEMENT_2025,
  DUREES_PRET_AUTORISEES,
  calculerMensualiteHorsAssurance,
  calculerCoutTotalInterets,
  calculerResteAVivreMinimum,
  verifierEligibilitePTZ,
  verifierEligibiliteActionLogement,
  verifierEligibiliteEcoPTZ,
  getTauxAssuranceParAge,
  calculerFraisNotaire,
} from './parameters-emprunt'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════
interface Emprunteur {
  id: string; prenom: string; age: number; situationFamiliale: string; nbEnfantsACharge: number
  statutPro: string; profession: string; ancienneteAnnees: number; secteurActivite: string; primoAccedant: boolean
}
interface Revenu { id: string; emprunteurId: string; type: string; montant: number; frequence: string }
interface Charge { id: string; emprunteurId: string; type: string; montant: number }
interface CreditEnCours { id: string; type: string; mensualite: number; capitalRestant: number; finPrevue: string; rachetable: boolean }
interface BienImmobilier { id: string; type: string; valeur: number; crdCredit: number; loyerPercu: number }
interface Epargne { id: string; type: string; montant: number; disponible: boolean }
interface LigneCredit { id: string; type: string; montant: number; duree: number; taux: number; differe: number }
interface AssuranceEmprunteur { emprunteurId: string; quotite: number; taux: number; garanties: string }
interface Scenario { id: string; label: string; duree: number; taux: number; mensualite: number; cout: number; endettement: number; faisable: boolean; apport: number; montantCredit: number }

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES & PONDÉRATIONS MODIFIABLES
// ══════════════════════════════════════════════════════════════════════════════
const PONDERATIONS_DEFAUT: Record<string, { label: string; coef: number; description: string }> = {
  salaire_net: { label: 'Salaire net CDI', coef: 1.0, description: 'Revenus stables, pris à 100%' },
  salaire_cdd: { label: 'Salaire CDD/Intérim', coef: 0.5, description: 'Revenus précaires, moyenne sur 24 mois' },
  salaire_variable: { label: 'Part variable/Commissions', coef: 0.7, description: 'Moyenne 2-3 ans, décote pour variabilité' },
  prime_13e: { label: '13ème mois', coef: 1.0, description: 'Contractuel = pris à 100%' },
  prime_annuelle: { label: 'Prime annuelle récurrente', coef: 0.8, description: 'Si versée 3 ans consécutifs' },
  benefices_bic: { label: 'Bénéfices BIC (moyenne 3 ans)', coef: 0.7, description: 'Moyenne pondérée des 3 derniers bilans' },
  benefices_bnc: { label: 'Bénéfices BNC (moyenne 3 ans)', coef: 0.7, description: 'Professions libérales, moyenne 3 ans' },
  revenus_locatifs: { label: 'Revenus locatifs', coef: 0.7, description: '70% des loyers perçus (standard bancaire)' },
  pension_retraite: { label: 'Pension retraite', coef: 1.0, description: 'Revenus garantis à vie' },
  pension_alimentaire: { label: 'Pension alimentaire reçue', coef: 0.8, description: 'Si jugement et paiement régulier' },
  allocations: { label: 'Allocations (CAF)', coef: 0.5, description: 'Variables selon âge enfants' },
  dividendes: { label: 'Dividendes récurrents', coef: 0.5, description: 'Si 3 années consécutives minimum' },
  autre: { label: 'Autre revenu', coef: 0.5, description: 'À justifier, décote prudente' },
}

const COEF_STATUT: Record<string, { label: string; coef: number; ancienneteMin: number }> = {
  cdi: { label: 'CDI', coef: 1.0, ancienneteMin: 0 },
  cdi_pe: { label: 'CDI période essai', coef: 0.8, ancienneteMin: 0 },
  fonctionnaire: { label: 'Fonctionnaire', coef: 1.0, ancienneteMin: 0 },
  cdd: { label: 'CDD', coef: 0.5, ancienneteMin: 24 },
  interim: { label: 'Intérimaire', coef: 0.5, ancienneteMin: 24 },
  liberal: { label: 'Profession libérale', coef: 0.7, ancienneteMin: 36 },
  tns_gerant: { label: 'Gérant TNS', coef: 0.7, ancienneteMin: 36 },
  auto_entrepreneur: { label: 'Auto-entrepreneur', coef: 0.5, ancienneteMin: 36 },
  retraite: { label: 'Retraité', coef: 1.0, ancienneteMin: 0 },
  sans_emploi: { label: 'Sans emploi', coef: 0, ancienneteMin: 0 },
}

const SITUATIONS_FAMILIALES = [
  { value: 'celibataire', label: 'Célibataire' }, { value: 'marie', label: 'Marié(e)' },
  { value: 'pacse', label: 'Pacsé(e)' }, { value: 'concubinage', label: 'Concubinage' },
  { value: 'divorce', label: 'Divorcé(e)' }, { value: 'veuf', label: 'Veuf/Veuve' },
]

const SECTEURS = [
  { value: 'prive', label: 'Secteur privé' }, { value: 'public', label: 'Secteur public' },
  { value: 'medical', label: 'Médical/Paramédical' }, { value: 'juridique', label: 'Juridique' },
  { value: 'finance', label: 'Finance/Banque' }, { value: 'immobilier', label: 'Immobilier' },
  { value: 'tech', label: 'Tech/IT' }, { value: 'autre', label: 'Autre' },
]

const CHARGES_TYPES = [
  { value: 'loyer', label: 'Loyer actuel' }, { value: 'pension_versee', label: 'Pension alimentaire versée' },
  { value: 'impots', label: 'Impôts sur le revenu (mensuel)' }, { value: 'autre', label: 'Autre charge fixe' },
]

const CREDITS_TYPES = [
  { value: 'immobilier_rp', label: 'Crédit immobilier RP' }, { value: 'immobilier_locatif', label: 'Crédit immobilier locatif' },
  { value: 'consommation', label: 'Crédit consommation' }, { value: 'auto', label: 'Crédit auto / LOA' },
  { value: 'revolving', label: 'Crédit revolving' }, { value: 'etudiant', label: 'Prêt étudiant' },
]

const PATRIMOINE_IMMO_TYPES = [
  { value: 'rp', label: 'Résidence principale' }, { value: 'rs', label: 'Résidence secondaire' },
  { value: 'locatif', label: 'Investissement locatif' }, { value: 'scpi', label: 'Parts SCPI' },
]

const EPARGNE_TYPES = [
  { value: 'compte_courant', label: 'Compte courant', dispo: true },
  { value: 'livret_a', label: 'Livret A / LDDS', dispo: true },
  { value: 'pel', label: 'PEL / CEL', dispo: true },
  { value: 'assurance_vie', label: 'Assurance-vie', dispo: true },
  { value: 'pea', label: 'PEA', dispo: false },
  { value: 'per', label: 'PER', dispo: false },
]

const NATURES_PROJET = [
  { value: 'achat_rp', label: 'Achat résidence principale', ptzEligible: true },
  { value: 'achat_rs', label: 'Achat résidence secondaire', ptzEligible: false },
  { value: 'investissement_locatif', label: 'Investissement locatif', ptzEligible: false },
  { value: 'construction', label: 'Construction / VEFA', ptzEligible: true },
  { value: 'travaux_rp', label: 'Travaux résidence principale', ecoPtzEligible: true },
  { value: 'rachat_soulte', label: 'Rachat de soulte', ptzEligible: false },
  { value: 'scpi', label: 'Financement parts SCPI', ptzEligible: false, scpi: true },
]

const STADES_PROJET = [
  { value: 'reflexion', label: 'En réflexion' }, { value: 'recherche', label: 'Recherche active' },
  { value: 'offre_faite', label: 'Offre faite' }, { value: 'offre_acceptee', label: 'Offre acceptée' },
  { value: 'compromis', label: 'Compromis signé' },
]

const TYPES_BIEN = [
  { value: 'appartement', label: 'Appartement' }, { value: 'maison', label: 'Maison' },
  { value: 'terrain', label: 'Terrain' }, { value: 'immeuble', label: 'Immeuble' },
]

const ZONES_PTZ = [
  { value: 'A_bis', label: 'Zone A bis (Paris, petite couronne)' },
  { value: 'A', label: 'Zone A (Grandes agglos tendues)' },
  { value: 'B1', label: 'Zone B1 (Villes moyennes)' },
  { value: 'B2', label: 'Zone B2 (Communes intermédiaires)' },
  { value: 'C', label: 'Zone C (Rural)' },
]

// ══════════════════════════════════════════════════════════════════════════════
// PRÊTS AIDÉS NATIONAUX 2025 - Données complètes dans parameters-emprunt.ts
// Source: Service-public.fr, ANIL, Action Logement - Décembre 2025
// ══════════════════════════════════════════════════════════════════════════════
const PRETS_AIDES = {
  // Prêts à Taux Zéro
  ptz: { 
    nom: 'PTZ 2025', 
    taux: 0, 
    montantMax: 180000, // Zone A/B1
    description: 'Primo-accédants, neuf partout France ou ancien avec 25% travaux B2/C', 
    dureeMax: 25,
    aplEligible: false,
    dateReforme: '01/04/2025',
    prolongeJusque: '31/12/2027',
  },
  eco_ptz: { 
    nom: 'Éco-PTZ 2025', 
    taux: 0, 
    montantMax: 50000, 
    description: 'Travaux rénovation énergétique (logement > 2 ans)', 
    dureeMax: 20,
    aplEligible: false,
    prolongeJusque: '31/12/2027',
  },
  // Prêt Accession Sociale
  pret_pas: { 
    nom: 'PAS (Prêt Accession Sociale)', 
    taux: 5.85, // Taux plafonné max (>20 ans)
    tauxPlafond: true,
    montantMax: null, // Pas de plafond montant
    description: 'Revenus modestes, APL possible, neuf ou ancien', 
    dureeMax: 30,
    aplEligible: true,
  },
  // Prêt Conventionné
  pret_pc: { 
    nom: 'PC (Prêt Conventionné)', 
    taux: 5.95, // Taux plafonné max (25-30 ans)
    tauxPlafond: true,
    montantMax: null, // Peut financer 100%
    description: 'Sans condition de ressources, APL possible', 
    dureeMax: 30,
    aplEligible: true,
  },
  // Action Logement
  action_logement: { 
    nom: 'Prêt Action Logement', 
    taux: 1.0, 
    montantMax: 30000, // Corrigé: 30 000 €
    description: 'Salariés entreprises privées non agricoles +10 salariés',
    dureeMax: 25,
    aplEligible: false,
  },
  // Prêts Épargne Logement
  pel: { 
    nom: 'Prêt PEL', 
    taux: 2.95, // PEL ouverts depuis 2025
    montantMax: 92000,
    description: 'Taux garanti selon date ouverture PEL (min 4 ans)', 
    dureeMax: 15,
    aplEligible: false,
  },
  cel: { 
    nom: 'Prêt CEL', 
    taux: 3.50, // Environ
    montantMax: 23000,
    description: 'Taux épargne + 1.5%, cumulable avec PEL (18 mois min)', 
    dureeMax: 15,
    aplEligible: false,
  },
}

// Liste exhaustive des garanties - données complètes dans parameters-emprunt.ts
const GARANTIES = [
  // Cautions mutuelles
  { value: 'credit_logement', label: 'Crédit Logement', frais: 0.012, restitution: 0.70, type: 'caution', description: 'Leader 200+ banques partenaires' },
  { value: 'saccef', label: 'SACCEF', frais: 0.0125, restitution: 0, type: 'caution', description: 'Caisse d\'Épargne / Banque Populaire' },
  { value: 'camca', label: 'CAMCA', frais: 0.014, restitution: 0.75, type: 'caution', description: 'Crédit Agricole / LCL' },
  { value: 'casden', label: 'CASDEN', frais: 0.009, restitution: 0.80, type: 'caution', description: 'Fonctionnaires Éducation nationale' },
  { value: 'mgen', label: 'MGEN', frais: 0.010, restitution: 0.75, type: 'caution', description: 'Adhérents MGEN' },
  { value: 'cnp', label: 'CNP Caution', frais: 0.0125, restitution: 0.65, type: 'caution', description: 'La Banque Postale' },
  { value: 'socami', label: 'SOCAMI', frais: 0.013, restitution: 0.70, type: 'caution', description: 'Crédit Mutuel' },
  { value: 'cegc', label: 'CEGC', frais: 0.0135, restitution: 0.60, type: 'caution', description: 'BNP Paribas / Société Générale' },
  { value: 'mfpf', label: 'MFPF', frais: 0.009, restitution: 0.80, type: 'caution', description: 'Mutuelle Fonction Publique' },
  { value: 'ips', label: 'IPS (Armées)', frais: 0.007, restitution: 0.85, type: 'caution', description: 'Militaires / Gendarmes' },
  // Garanties réelles
  { value: 'hypotheque', label: 'Hypothèque conventionnelle', frais: 0.015, restitution: 0, type: 'garantie_reelle', description: 'Tous biens y compris VEFA' },
  { value: 'hlspd', label: 'HLSPD (ex-PPD)', frais: 0.007, restitution: 0, type: 'garantie_reelle', description: 'Ancien uniquement - moins cher que hypothèque' },
  { value: 'nantissement', label: 'Nantissement', frais: 0.001, restitution: 0, type: 'garantie_reelle', description: 'Nantissement AV/PEA/SCPI' },
]

const CREDIT_LIGNE_TYPES = [
  // Prêts classiques
  { value: 'amortissable', label: 'Crédit amortissable classique', categorie: 'classique' },
  { value: 'in_fine', label: 'Prêt in fine (intérêts seuls)', categorie: 'classique' },
  { value: 'relais', label: 'Prêt relais', categorie: 'classique' },
  // Prêts aidés nationaux
  { value: 'ptz', label: 'PTZ (Prêt à Taux Zéro)', categorie: 'aide', taux: 0 },
  { value: 'eco_ptz', label: 'Éco-PTZ', categorie: 'aide', taux: 0 },
  { value: 'pret_pas', label: 'PAS (Prêt Accession Sociale)', categorie: 'aide', aplEligible: true },
  { value: 'pret_pc', label: 'PC (Prêt Conventionné)', categorie: 'aide', aplEligible: true },
  { value: 'action_logement', label: 'Prêt Action Logement', categorie: 'aide', taux: 1 },
  { value: 'pel', label: 'Prêt PEL', categorie: 'epargne' },
  { value: 'cel', label: 'Prêt CEL', categorie: 'epargne' },
  // Spéciaux
  { value: 'scpi', label: 'Financement SCPI', categorie: 'special' },
  { value: 'regional', label: 'Prêt régional/local (0%)', categorie: 'aide', taux: 0 },
]

// Taux CAFPI décembre 2025 - Voir parameters-emprunt.ts pour les valeurs
const DUREES = DUREES_PRET_AUTORISEES // [7, 10, 12, 15, 17, 20, 22, 25] - HCSF max 25 ans (27 VEFA)

const DOCUMENTS_REQUIS = {
  identite: ['Pièce identité CNI/passeport valide', 'Justificatif domicile < 3 mois', 'Livret de famille si applicable'],
  revenus_salarie: ['3 derniers bulletins de salaire', 'Dernier avis imposition complet', 'Contrat de travail'],
  revenus_tns: ['3 derniers bilans comptables', '3 derniers avis imposition', 'Extrait Kbis < 3 mois', 'Attestation URSSAF'],
  revenus_locatifs: ['Baux locatifs signés', 'Déclaration 2044/2044S', 'Quittances ou relevé gestion'],
  patrimoine: ['Relevés comptes bancaires 3 mois', 'Attestations AV/PEA/PER', 'Titres propriété si biens'],
  projet: ['Compromis ou promesse vente', 'Devis travaux si applicable', 'Permis construire si construction'],
  charges: ['Tableaux amortissement crédits', 'Offres prêt existantes', 'Jugement divorce si pension'],
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
const fmtPct = (n: number) => n.toFixed(2) + '%'

// Fonctions de calcul importées de parameters-emprunt.ts
const calcMensualiteHorsAss = calculerMensualiteHorsAssurance
const calcCoutTotal = calculerCoutTotalInterets
const getTauxParDuree = getTauxMoyenParDuree

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
const CapaciteEmpruntPage = () => {
  const { plotlyReady, handlePlotlyLoad } = usePlotlyReady()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showPonderations, setShowPonderations] = useState(false)
  const [activeResultTab, setActiveResultTab] = useState<'synthese' | 'scenarios' | 'documents' | 'avis'>('synthese')
  const chartRef1 = useRef<HTMLDivElement>(null)
  const chartRef2 = useRef<HTMLDivElement>(null)

  // Pondérations modifiables
  const [ponderations, setPonderations] = useState(PONDERATIONS_DEFAUT)
  const resetPonderations = () => setPonderations(PONDERATIONS_DEFAUT)
  const updPonderation = (type: string, coef: number) => {
    setPonderations(prev => ({ ...prev, [type]: { ...prev[type], coef: Math.max(0, Math.min(1, coef)) } }))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. PROJET (EN PREMIER)
  // ═══════════════════════════════════════════════════════════════════════════
  const [natureProjet, setNatureProjet] = useState('achat_rp')
  const [stadeProjet, setStadeProjet] = useState('reflexion')
  const [dateCompromis, setDateCompromis] = useState('')
  const [dateFinCondSusp, setDateFinCondSusp] = useState('')
  const [typeBien, setTypeBien] = useState('appartement')
  const [neufOuAncien, setNeufOuAncien] = useState<'neuf' | 'ancien'>('ancien')
  const [localisation, setLocalisation] = useState('')
  const [zonePTZ, setZonePTZ] = useState<'A_bis' | 'A' | 'B1' | 'B2' | 'C'>('B1')
  const [codeInsee, setCodeInsee] = useState('')
  const [departement, setDepartement] = useState('')
  const [aidesLocales, setAidesLocales] = useState<{ nom: string; organisme?: string; montantMax: number; taux?: number; conditions?: string[] }[]>([])
  const [prixBien, setPrixBien] = useState(0)
  const [fraisAgence, setFraisAgence] = useState(0)
  const [travaux, setTravaux] = useState(0)
  const [loyerEstime, setLoyerEstime] = useState(0)
  // Frais de notaire calculés via le module parameters-emprunt
  const fraisNotaireCalc = useMemo(() => {
    if (prixBien <= 0) return { total: 0, detail: '' }
    return calculerFraisNotaire(prixBien, neufOuAncien === 'neuf')
  }, [prixBien, neufOuAncien])
  const fraisNotaire = fraisNotaireCalc.total
  // ═══════════════════════════════════════════════════════════════════════════
  // 2. EMPRUNTEURS
  // ═══════════════════════════════════════════════════════════════════════════
  const [emprunteurs, setEmprunteurs] = useState<Emprunteur[]>([
    { id: 'emp1', prenom: '', age: 35, situationFamiliale: 'celibataire', nbEnfantsACharge: 0, statutPro: 'cdi', profession: '', ancienneteAnnees: 3, secteurActivite: 'prive', primoAccedant: true },
    { id: 'emp2', prenom: '', age: 32, situationFamiliale: 'celibataire', nbEnfantsACharge: 0, statutPro: 'cdi', profession: '', ancienneteAnnees: 2, secteurActivite: 'prive', primoAccedant: true },
  ])
  const [assurances, setAssurances] = useState<AssuranceEmprunteur[]>([
    { emprunteurId: 'emp1', quotite: 50, taux: getTauxAssuranceParAge(35), garanties: 'DC/PTIA/ITT/IPT' },
    { emprunteurId: 'emp2', quotite: 50, taux: getTauxAssuranceParAge(32), garanties: 'DC/PTIA/ITT/IPT' },
  ])
  
  const addCoemprunteur = () => {
    if (emprunteurs.some(e => e.id === 'emp2')) return
    setEmprunteurs(prev => [...prev, {
      id: 'emp2', prenom: '', age: 32, situationFamiliale: 'celibataire', nbEnfantsACharge: 0,
      statutPro: 'cdi', profession: '', ancienneteAnnees: 2, secteurActivite: 'prive', primoAccedant: true
    }])
    setRevenus(prev => {
      // Ne pas ajouter si un revenu pour emp2 existe déjà
      if (prev.some(r => r.emprunteurId === 'emp2')) return prev
      return [...prev, { id: Date.now().toString(), emprunteurId: 'emp2', type: 'salaire_net', montant: 0, frequence: 'mensuel' }]
    })
    setAssurances(prev => {
      // Ne pas ajouter si une assurance pour emp2 existe déjà
      if (prev.some(a => a.emprunteurId === 'emp2')) {
        // Mettre à jour la quotité à 50/50 si le co-emprunteur est ajouté
        return prev.map(a => ({ ...a, quotite: 50 }))
      }
      return [...prev.map(a => ({ ...a, quotite: 50 })), { emprunteurId: 'emp2', quotite: 50, taux: getTauxAssuranceParAge(32), garanties: 'DC/PTIA/ITT/IPT' }]
    })
  }
  const removeCoemprunteur = () => {
    setEmprunteurs(emprunteurs.filter(e => e.id === 'emp1'))
    setRevenus(revenus.filter(r => r.emprunteurId === 'emp1'))
    setCharges(charges.filter(c => c.emprunteurId === 'emp1'))
    setAssurances([{ emprunteurId: 'emp1', quotite: 100, taux: getTauxAssuranceParAge(emprunteurs.find(e => e.id === 'emp1')?.age || 35), garanties: 'DC/PTIA/ITT/IPT' }])
  }
  const ensureCoEmprunteur = () => {
    if (!emprunteurs.some(e => e.id === 'emp2')) {
      addCoemprunteur()
    }
  }
  const updEmprunteur = (id: string, field: string, val: string | number | boolean) => setEmprunteurs(emprunteurs.map(e => e.id === id ? { ...e, [field]: val } : e))
  const setSituationFamiliale = (id: string, val: string) => {
    if (['marie', 'pacs', 'concubinage', 'pacsé', 'concubin', 'concubine'].includes(val.toLowerCase())) {
      ensureCoEmprunteur()
    }
    updEmprunteur(id, 'situationFamiliale', val)
  }

  // Synchroniser assurances avec emprunteurs (éviter les doublons et orphelins)
  useEffect(() => {
    setAssurances(prev => {
      // Supprimer les assurances pour emprunteurs inexistants
      const filtered = prev.filter(a => emprunteurs.some(e => e.id === a.emprunteurId))
      // Dédupliquer par emprunteurId
      const deduped = filtered.reduce((acc, a) => {
        if (!acc.find(x => x.emprunteurId === a.emprunteurId)) {
          acc.push(a)
        }
        return acc
      }, [] as AssuranceEmprunteur[])
      // Ajouter les assurances manquantes pour les emprunteurs
      const quotiteBase = emprunteurs.length > 1 ? 50 : 100
      emprunteurs.forEach(e => {
        if (!deduped.find(a => a.emprunteurId === e.id)) {
          deduped.push({ emprunteurId: e.id, quotite: quotiteBase, taux: getTauxAssuranceParAge(e.age), garanties: 'DC/PTIA/ITT/IPT' })
        }
      })
      // Si le nombre d'emprunteurs a changé, ajuster les quotités
      if (deduped.length !== prev.length || JSON.stringify(deduped) !== JSON.stringify(prev)) {
        return deduped
      }
      return prev
    })
  }, [emprunteurs])

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. REVENUS
  // ═══════════════════════════════════════════════════════════════════════════
  const [revenus, setRevenus] = useState<Revenu[]>([
    { id: '1', emprunteurId: 'emp1', type: 'salaire_net', montant: 0, frequence: 'mensuel' },
    { id: '2', emprunteurId: 'emp2', type: 'salaire_net', montant: 0, frequence: 'mensuel' },
  ])
  const addRevenu = (empId: string) => setRevenus([...revenus, { id: Date.now().toString(), emprunteurId: empId, type: 'salaire_net', montant: 0, frequence: 'mensuel' }])
  const delRevenu = (id: string) => setRevenus(revenus.filter(r => r.id !== id))
  const updRevenu = (id: string, field: string, val: string | number) => setRevenus(revenus.map(r => r.id === id ? { ...r, [field]: val } : r))

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. CHARGES
  // ═══════════════════════════════════════════════════════════════════════════
  const [charges, setCharges] = useState<Charge[]>([{ id: '1', emprunteurId: 'emp1', type: 'loyer', montant: 0 }])
  const [supprimerLoyer, setSupprimerLoyer] = useState(true)
  const addCharge = (empId: string) => setCharges([...charges, { id: Date.now().toString(), emprunteurId: empId, type: 'autre', montant: 0 }])
  const delCharge = (id: string) => setCharges(charges.filter(c => c.id !== id))
  const updCharge = (id: string, field: string, val: string | number) => setCharges(charges.map(c => c.id === id ? { ...c, [field]: val } : c))

  const [creditsCours, setCreditsCours] = useState<CreditEnCours[]>([])
  const addCreditCours = () => setCreditsCours([...creditsCours, { id: Date.now().toString(), type: 'consommation', mensualite: 0, capitalRestant: 0, finPrevue: '', rachetable: false }])
  const delCreditCours = (id: string) => setCreditsCours(creditsCours.filter(c => c.id !== id))
  const updCreditCours = (id: string, field: string, val: string | number | boolean) => setCreditsCours(creditsCours.map(c => c.id === id ? { ...c, [field]: val } : c))

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. PATRIMOINE
  // ═══════════════════════════════════════════════════════════════════════════
  const [biensImmo, setBiensImmo] = useState<BienImmobilier[]>([])
  const addBienImmo = () => setBiensImmo([...biensImmo, { id: Date.now().toString(), type: 'rp', valeur: 0, crdCredit: 0, loyerPercu: 0 }])
  const delBienImmo = (id: string) => setBiensImmo(biensImmo.filter(b => b.id !== id))
  const updBienImmo = (id: string, field: string, val: string | number) => setBiensImmo(biensImmo.map(b => b.id === id ? { ...b, [field]: val } : b))

  const [epargne, setEpargne] = useState<Epargne[]>([{ id: '1', type: 'livret_a', montant: 0, disponible: true }])
  const addEpargne = () => setEpargne([...epargne, { id: Date.now().toString(), type: 'compte_courant', montant: 0, disponible: true }])
  const delEpargne = (id: string) => setEpargne(epargne.filter(e => e.id !== id))
  const updEpargne = (id: string, field: string, val: string | number | boolean) => setEpargne(epargne.map(e => e.id === id ? { ...e, [field]: val } : e))

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. FINANCEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  const [apport, setApport] = useState(0)
  const [fraisDossier, setFraisDossier] = useState(0)
  const [lignesCredit, setLignesCredit] = useState<LigneCredit[]>([{ id: '1', type: 'amortissable', montant: 0, duree: 20, taux: getTauxMoyenParDuree(20), differe: 0 }])
  const addLigne = () => setLignesCredit([...lignesCredit, { id: Date.now().toString(), type: 'amortissable', montant: 0, duree: 20, taux: 3.55, differe: 0 }])
  const delLigne = (id: string) => setLignesCredit(lignesCredit.filter(l => l.id !== id))
  const updLigne = (id: string, field: string, val: string | number) => setLignesCredit(lignesCredit.map(l => l.id === id ? { ...l, [field]: val } : l))
  const [garantie, setGarantie] = useState('credit_logement')

  // Réinitialisation complète (sidebar repart de zéro)
  const resetSimulation = useCallback(() => {
    setStep(1)
    setShowResults(false)
    setShowPonderations(false)
    setActiveResultTab('synthese')
    setNatureProjet('achat_rp')
    setStadeProjet('reflexion')
    setDateCompromis('')
    setDateFinCondSusp('')
    setTypeBien('appartement')
    setNeufOuAncien('ancien')
    setLocalisation('')
    setZonePTZ('B1' as const)
    setCodeInsee('')
    setDepartement('')
    setAidesLocales([])
    setPrixBien(0)
    setFraisAgence(0)
    setTravaux(0)
    setLoyerEstime(0)
    setEmprunteurs([
      { id: 'emp1', prenom: '', age: 35, situationFamiliale: 'celibataire', nbEnfantsACharge: 0, statutPro: 'cdi', profession: '', ancienneteAnnees: 3, secteurActivite: 'prive', primoAccedant: true },
      { id: 'emp2', prenom: '', age: 32, situationFamiliale: 'celibataire', nbEnfantsACharge: 0, statutPro: 'cdi', profession: '', ancienneteAnnees: 2, secteurActivite: 'prive', primoAccedant: true },
    ])
    setAssurances([
      { emprunteurId: 'emp1', quotite: 50, taux: getTauxAssuranceParAge(35), garanties: 'DC/PTIA/ITT/IPT' },
      { emprunteurId: 'emp2', quotite: 50, taux: getTauxAssuranceParAge(32), garanties: 'DC/PTIA/ITT/IPT' },
    ])
    setRevenus([
      { id: '1', emprunteurId: 'emp1', type: 'salaire_net', montant: 0, frequence: 'mensuel' },
      { id: '2', emprunteurId: 'emp2', type: 'salaire_net', montant: 0, frequence: 'mensuel' },
    ])
    setCharges([
      { id: '1', emprunteurId: 'emp1', type: 'loyer', montant: 0 },
      { id: '2', emprunteurId: 'emp2', type: 'autre', montant: 0 },
    ])
    setSupprimerLoyer(true)
    setCreditsCours([])
    setBiensImmo([])
    setEpargne([{ id: '1', type: 'livret_a', montant: 0, disponible: true }])
    setApport(0)
    setFraisDossier(0)
    setLignesCredit([{ id: '1', type: 'amortissable', montant: 0, duree: 20, taux: getTauxMoyenParDuree(20), differe: 0 }])
    setGarantie('credit_logement')
    setAmort([])
    setRes(null)
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULS PRINCIPAUX
  // ═══════════════════════════════════════════════════════════════════════════
  const calcRevenusParEmprunteur = useCallback((empId: string) => {
    const emp = emprunteurs.find(e => e.id === empId)
    const coefStatut = COEF_STATUT[emp?.statutPro as keyof typeof COEF_STATUT]?.coef || 1
    return revenus.filter(r => r.emprunteurId === empId).reduce((sum, r) => {
      const coef = ponderations[r.type]?.coef || 0.5
      const montantMensuel = r.frequence === 'annuel' ? r.montant / 12 : r.montant
      return sum + (montantMensuel * coef * coefStatut)
    }, 0)
  }, [emprunteurs, revenus, ponderations])

  const totalRevenusPonderes = useMemo(() => emprunteurs.reduce((sum, emp) => sum + calcRevenusParEmprunteur(emp.id), 0), [emprunteurs, calcRevenusParEmprunteur])
  const totalRevenusBruts = useMemo(() => revenus.reduce((sum, r) => sum + (r.frequence === 'annuel' ? r.montant / 12 : r.montant), 0), [revenus])

  const loyerActuel = useMemo(() => charges.find(c => c.type === 'loyer')?.montant || 0, [charges])
  const chargesLoyerAjuste = useMemo(() => {
    if (supprimerLoyer && natureProjet === 'achat_rp') return charges.filter(c => c.type !== 'loyer').reduce((s, c) => s + c.montant, 0)
    return charges.reduce((s, c) => s + c.montant, 0)
  }, [charges, supprimerLoyer, natureProjet])
  const totalCreditsCours = useMemo(() => creditsCours.reduce((s, c) => s + c.mensualite, 0), [creditsCours])
  const totalCharges = chargesLoyerAjuste + totalCreditsCours

  // Patrimoine
  const totalPatrimoineImmo = useMemo(() => biensImmo.reduce((s, b) => s + b.valeur, 0), [biensImmo])
  const totalCRDImmo = useMemo(() => biensImmo.reduce((s, b) => s + b.crdCredit, 0), [biensImmo])
  const patrimoineNetImmo = totalPatrimoineImmo - totalCRDImmo
  const totalEpargne = useMemo(() => epargne.reduce((s, e) => s + e.montant, 0), [epargne])
  const totalEpargneDispo = useMemo(() => epargne.filter(e => e.disponible).reduce((s, e) => s + e.montant, 0), [epargne])
  const epargneResiduelle = Math.max(0, totalEpargneDispo - apport)

  // Projet
  const montantTotal = prixBien + fraisNotaire + fraisAgence + travaux + fraisDossier
  const montantAFinancer = Math.max(0, montantTotal - apport)
  const garantieInfo = GARANTIES.find(g => g.value === garantie) || GARANTIES[0]
  const coutGarantie = Math.round(montantAFinancer * garantieInfo.frais)

  // Mise à jour auto montant crédit principal
  useEffect(() => {
    if (lignesCredit.length > 0 && lignesCredit[0].type === 'amortissable') {
      const autresLignes = lignesCredit.slice(1).reduce((s, l) => s + l.montant, 0)
      const montantPrincipal = Math.max(0, montantAFinancer - autresLignes)
      if (lignesCredit[0].montant !== montantPrincipal) {
        setLignesCredit(prev => prev.map((l, i) => i === 0 ? { ...l, montant: montantPrincipal } : l))
      }
    }
  }, [montantAFinancer, lignesCredit])

  // Calcul crédit
  const recapCredits = useMemo(() => {
    return lignesCredit.reduce((acc, l) => {
      if (l.montant > 0) {
        const mensHA = calcMensualiteHorsAss(l.montant, l.duree, l.taux)
        acc.montant += l.montant; acc.mensHA += mensHA
        acc.duree = Math.max(acc.duree, l.duree)
        acc.cout += calcCoutTotal(l.montant, l.duree, l.taux)
      }
      return acc
    }, { montant: 0, mensHA: 0, duree: 0, cout: 0 })
  }, [lignesCredit])

  // Calcul assurance par emprunteur (quotité x taux x capital / 12)
  const assuranceMensuelle = useMemo(() => {
    return Math.round(assurances.reduce((sum, a) => {
      const quotitePct = a.quotite / 100
      return sum + (recapCredits.montant * quotitePct * (a.taux / 100) / 12)
    }, 0))
  }, [recapCredits.montant, assurances])
  
  // Taux assurance global pondéré (pour affichage)
  const tauxAssuranceGlobal = useMemo(() => {
    const totalQuotite = assurances.reduce((sum, a) => sum + a.quotite, 0)
    if (totalQuotite === 0) return 0
    return assurances.reduce((sum, a) => sum + (a.taux * a.quotite / totalQuotite), 0)
  }, [assurances])
  const mensualiteTotale = Math.round(recapCredits.mensHA + assuranceMensuelle)
  const coutAssuranceTotal = assuranceMensuelle * recapCredits.duree * 12
  const sautDeCharge = mensualiteTotale - loyerActuel

  // Indicateurs HCSF
  const mensualiteMaxHCSF = Math.round(totalRevenusPonderes * NORMES_HCSF_2025.tauxEndettementMax) - totalCreditsCours
  const ratioEndettement = totalRevenusPonderes > 0 ? ((mensualiteTotale + totalCreditsCours) / totalRevenusPonderes) * 100 : 0
  const resteAVivre = totalRevenusPonderes - mensualiteTotale - totalCharges

  // Ratio hypothécaire
  const totalValeurApresAchat = totalPatrimoineImmo + prixBien
  const totalCRDApresAchat = totalCRDImmo + montantAFinancer
  const ratioHypothecaire = totalValeurApresAchat > 0 ? (totalCRDApresAchat / totalValeurApresAchat) * 100 : 0

  // Calcul reste à vivre minimum selon composition foyer (HCSF 2025)
  const situationFamilleFoyer = emprunteurs.length > 1 ? 'couple' : 'seul'
  const nbEnfantsFoyer = emprunteurs[0].nbEnfantsACharge
  const resteAVivreMinimum = calculerResteAVivreMinimum(situationFamilleFoyer, nbEnfantsFoyer)
  
  // Vérification conformité HCSF 2025
  const dureeMaxAutorisee = natureProjet === 'construction' || neufOuAncien === 'neuf' 
    ? NORMES_HCSF_2025.dureeMaxVEFA // 27 ans pour VEFA/construction
    : NORMES_HCSF_2025.dureeMaxStandard // 25 ans standard
  const dureeDepasseHCSF = recapCredits.duree > dureeMaxAutorisee
  
  const faisable = ratioEndettement <= (NORMES_HCSF_2025.tauxEndettementMax * 100) 
    && resteAVivre >= resteAVivreMinimum 
    && epargneResiduelle >= 0
    && !dureeDepasseHCSF

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉLIGIBILITÉ PRÊTS AIDÉS (Logique 2025 avec fonctions parameters-emprunt)
  // ═══════════════════════════════════════════════════════════════════════════
  const pretsEligibles = useMemo(() => {
    const result: { type: string; nom: string; eligible: boolean; montantMax: number; raisons: string[]; details?: string }[] = []
    const emp = emprunteurs[0]
    const isPrimo = emp.primoAccedant && (emprunteurs.length === 1 || emprunteurs[1]?.primoAccedant)
    const isRP = natureProjet === 'achat_rp' || natureProjet === 'construction'
    const tailleForyer = 1 + emprunteurs.length + emp.nbEnfantsACharge
    
    // PTZ 2025 - Utilisation de la fonction verifierEligibilitePTZ
    const ptzResult = verifierEligibilitePTZ({
      primoAccedant: isPrimo,
      residencePrincipale: isRP,
      neuf: neufOuAncien === 'neuf',
      typeBien: typeBien as 'appartement' | 'maison',
      zone: zonePTZ,
      prixBien,
      travaux,
      rfr: totalRevenusBruts * 12, // Approximation RFR avec revenus annuels
      tailleForyer,
    })
    result.push({
      type: 'ptz', 
      nom: `PTZ 2025 ${ptzResult.tranche ? `(Tranche ${ptzResult.tranche})` : ''}`, 
      eligible: ptzResult.eligible, 
      montantMax: ptzResult.montantMax,
      raisons: ptzResult.raisons,
      details: ptzResult.eligible ? `Quotité: ${(ptzResult.quotite * 100).toFixed(0)}%` : undefined,
    })

    // Éco-PTZ 2025 - Utilisation de la fonction verifierEligibiliteEcoPTZ
    const ecoPtzResult = verifierEligibiliteEcoPTZ({
      residencePrincipale: isRP || natureProjet === 'travaux_rp',
      ancienneteLogement: neufOuAncien === 'ancien' ? 10 : 0, // Supposé ancien > 2 ans
      montantTravaux: travaux,
      nbCategoriesTravaux: travaux >= 30000 ? 3 : travaux >= 15000 ? 2 : 1, // Estimation basique
      coupleMaprimerenov: false,
    })
    result.push({
      type: 'eco_ptz', 
      nom: 'Éco-PTZ 2025', 
      eligible: ecoPtzResult.eligible, 
      montantMax: ecoPtzResult.plafond,
      raisons: ecoPtzResult.raisons,
      details: ecoPtzResult.eligible ? `Durée max: ${ecoPtzResult.dureeMax} ans` : undefined,
    })

    // Prêt Action Logement 2025 - Utilisation de la fonction verifierEligibiliteActionLogement
    const palResult = verifierEligibiliteActionLogement({
      salarieSecteurPrive: emp.secteurActivite !== 'public',
      tailleEntreprise: 10, // Supposé >= 10 si secteur privé
      secteurAgricole: false,
      residencePrincipale: isRP,
      rfr: totalRevenusBruts * 12,
      zone: zonePTZ,
      tailleForyer,
    })
    result.push({
      type: 'pas', 
      nom: 'Prêt Action Logement', 
      eligible: palResult.eligible, 
      montantMax: palResult.montantMax,
      raisons: palResult.raisons,
      details: palResult.eligible ? `Taux: ${PRET_ACTION_LOGEMENT_2025.taux}% fixe` : undefined,
    })

    return result
  }, [emprunteurs, natureProjet, neufOuAncien, travaux, prixBien, zonePTZ, typeBien, totalRevenusBruts])

  // ═══════════════════════════════════════════════════════════════════════════
  // MULTI-SCÉNARIOS & OPTIMISATION
  // ═══════════════════════════════════════════════════════════════════════════
  const genererScenarios = useCallback((): Scenario[] => {
    const scenarios: Scenario[] = []
    const durees = [15, 20, 25]
    
    durees.forEach(duree => {
      const taux = getTauxParDuree(duree)
      const mensHA = calcMensualiteHorsAss(montantAFinancer, duree, taux)
      const mensAss = montantAFinancer * 0.003 / 12
      const mensTotal = mensHA + mensAss
      const endettement = totalRevenusPonderes > 0 ? ((mensTotal + totalCreditsCours) / totalRevenusPonderes) * 100 : 100
      const cout = calcCoutTotal(montantAFinancer, duree, taux) + mensAss * duree * 12
      scenarios.push({
        id: `base-${duree}`, label: `${duree} ans @ ${fmtPct(taux)}`,
        duree, taux, mensualite: Math.round(mensTotal), cout: Math.round(cout),
        endettement, faisable: endettement <= 35, apport, montantCredit: montantAFinancer
      })
    })
    return scenarios
  }, [montantAFinancer, totalRevenusPonderes, totalCreditsCours, apport])

  const genererOptimisations = useCallback((): { action: string; impact: string; detail: string; priorite: 'haute' | 'moyenne' | 'basse' }[] => {
    const opts: { action: string; impact: string; detail: string; priorite: 'haute' | 'moyenne' | 'basse' }[] = []
    
    if (ratioEndettement > 35) {
      // Allonger durée
      for (const duree of [22, 25, 27]) {
        if (duree > recapCredits.duree) {
          const mensHA = calcMensualiteHorsAss(montantAFinancer, duree, getTauxParDuree(duree))
          const mensAss = montantAFinancer * 0.003 / 12
          const newEndet = totalRevenusPonderes > 0 ? ((mensHA + mensAss + totalCreditsCours) / totalRevenusPonderes) * 100 : 100
          if (newEndet <= 35) {
            opts.push({ action: `Allonger la durée à ${duree} ans`, impact: `Endettement → ${newEndet.toFixed(1)}%`, detail: `Mensualité: ${fmtEur(Math.round(mensHA + mensAss))}`, priorite: 'haute' })
            break
          }
        }
      }
      // Augmenter apport
      if (totalEpargneDispo > apport) {
        const apportSupp = Math.min(totalEpargneDispo - 5000, montantAFinancer * 0.3)
        if (apportSupp > 5000) {
          opts.push({ action: `Augmenter l'apport de ${fmtEur(apportSupp)}`, impact: 'Réduire le montant emprunté', detail: `Garder ${fmtEur(5000)} d'épargne de sécurité`, priorite: 'moyenne' })
        }
      }
      // Réduire enveloppe
      const budgetMax = mensualiteMaxHCSF * recapCredits.duree * 12 * 0.8 + apport
      if (budgetMax < montantTotal && budgetMax > 100000) {
        opts.push({ action: `Réduire le budget à ${fmtEur(budgetMax)}`, impact: 'Projet faisable', detail: `Soit -${fmtEur(montantTotal - budgetMax)} sur le prix`, priorite: 'basse' })
      }
      // Solder crédits
      if (totalCreditsCours > 150) {
        opts.push({ action: 'Solder les crédits en cours', impact: `+${fmtEur(totalCreditsCours)}/mois de capacité`, detail: 'Intégrer dans financement ou solder avec épargne', priorite: 'haute' })
      }
    }
    
    if (epargneResiduelle < 3000) {
      opts.push({ action: 'Réduire l\'apport', impact: 'Conserver épargne de précaution', detail: 'Recommandé: garder 3-6 mois de charges', priorite: 'moyenne' })
    }
    
    return opts
  }, [ratioEndettement, montantAFinancer, recapCredits.duree, totalRevenusPonderes, totalCreditsCours, mensualiteMaxHCSF, apport, totalEpargneDispo, epargneResiduelle, montantTotal])

  // ═══════════════════════════════════════════════════════════════════════════
  // AVIS RISQUE MOTIVÉ
  // ═══════════════════════════════════════════════════════════════════════════
  const evaluerRisque = useCallback(() => {
    let score = 100
    const points: string[] = []
    const alertes: string[] = []
    const bloquants: string[] = []

    // Endettement
    if (ratioEndettement <= 30) { points.push('Endettement confortable (<30%)'); score += 5 }
    else if (ratioEndettement <= 35) { points.push('Endettement dans la norme HCSF') }
    else { bloquants.push(`Endettement trop élevé (${fmtPct(ratioEndettement)} > 35%)`); score -= 30 }

    // Reste à vivre (normes HCSF 2025 avec distinction seul/couple)
    if (resteAVivre >= resteAVivreMinimum * 1.5) { points.push('Reste à vivre confortable'); score += 5 }
    else if (resteAVivre >= resteAVivreMinimum) { points.push('Reste à vivre suffisant') }
    else { alertes.push(`Reste à vivre limite (${fmtEur(resteAVivre)} vs ${fmtEur(resteAVivreMinimum)} min recommandé)`); score -= 15 }
    
    // Durée HCSF
    if (dureeDepasseHCSF) { 
      bloquants.push(`Durée ${recapCredits.duree} ans > ${dureeMaxAutorisee} ans max HCSF`); 
      score -= 20 
    }

    // Épargne résiduelle
    if (epargneResiduelle >= 10000) { points.push('Épargne résiduelle importante'); score += 5 }
    else if (epargneResiduelle >= 5000) { points.push('Épargne de précaution correcte') }
    else if (epargneResiduelle >= 0) { alertes.push('Épargne résiduelle faible'); score -= 10 }
    else { bloquants.push('Apport supérieur à l\'épargne disponible'); score -= 25 }

    // Apport
    const ratioApport = (apport / montantTotal) * 100
    if (ratioApport >= 20) { points.push(`Apport solide (${ratioApport.toFixed(0)}%)`); score += 10 }
    else if (ratioApport >= 10) { points.push(`Apport correct (${ratioApport.toFixed(0)}%)`) }
    else { alertes.push(`Apport faible (${ratioApport.toFixed(0)}%)`); score -= 10 }

    // Stabilité pro
    const emp = emprunteurs[0]
    if (['cdi', 'fonctionnaire', 'retraite'].includes(emp.statutPro) && emp.ancienneteAnnees >= 2) {
      points.push('Situation professionnelle stable'); score += 5
    } else if (emp.statutPro === 'cdi_pe') {
      alertes.push('CDI en période d\'essai'); score -= 10
    } else if (['cdd', 'interim'].includes(emp.statutPro)) {
      alertes.push('Emploi précaire (CDD/Intérim)'); score -= 15
    }

    // Âge fin de prêt
    const ageFin = emp.age + recapCredits.duree
    if (ageFin > 75) { bloquants.push(`Âge fin de prêt: ${ageFin} ans (>75)`); score -= 20 }
    else if (ageFin > 70) { alertes.push(`Âge fin de prêt: ${ageFin} ans`); score -= 5 }

    // Saut de charge
    if (sautDeCharge > 500) { alertes.push(`Saut de charge important (+${fmtEur(sautDeCharge)}/mois)`); score -= 5 }
    else if (sautDeCharge < 0) { points.push('Saut de charge négatif (économie)'); score += 5 }

    // Co-emprunteur
    if (emprunteurs.length === 2) { points.push('Dossier à deux emprunteurs'); score += 5 }

    // Crédits en cours
    if (creditsCours.length === 0) { points.push('Pas de crédits en cours'); score += 5 }
    else if (creditsCours.some(c => c.type === 'revolving')) { alertes.push('Crédit revolving en cours'); score -= 10 }

    score = Math.max(0, Math.min(100, score))
    let niveau: 'excellent' | 'bon' | 'moyen' | 'difficile' | 'bloquant' = 'bloquant'
    if (bloquants.length === 0) {
      if (score >= 85) niveau = 'excellent'
      else if (score >= 70) niveau = 'bon'
      else if (score >= 50) niveau = 'moyen'
      else niveau = 'difficile'
    }

    return { score, niveau, points, alertes, bloquants }
  }, [ratioEndettement, resteAVivre, resteAVivreMinimum, dureeDepasseHCSF, dureeMaxAutorisee, epargneResiduelle, apport, montantTotal, emprunteurs, recapCredits.duree, sautDeCharge, creditsCours])

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTS REQUIS
  // ═══════════════════════════════════════════════════════════════════════════
  const getDocumentsRequis = useCallback(() => {
    const docs: { categorie: string; documents: string[] }[] = []
    docs.push({ categorie: 'Identité', documents: DOCUMENTS_REQUIS.identite })
    
    emprunteurs.forEach(emp => {
      const isTNS = ['tns_gerant', 'liberal', 'auto_entrepreneur'].includes(emp.statutPro)
      docs.push({
        categorie: `Revenus - ${emp.prenom || (emp.id === 'emp1' ? 'Emprunteur principal' : 'Co-emprunteur')}`,
        documents: isTNS ? DOCUMENTS_REQUIS.revenus_tns : DOCUMENTS_REQUIS.revenus_salarie
      })
    })
    
    if (biensImmo.some(b => b.loyerPercu > 0) || revenus.some(r => r.type === 'revenus_locatifs')) {
      docs.push({ categorie: 'Revenus locatifs', documents: DOCUMENTS_REQUIS.revenus_locatifs })
    }
    
    docs.push({ categorie: 'Patrimoine & Épargne', documents: DOCUMENTS_REQUIS.patrimoine })
    docs.push({ categorie: 'Projet', documents: DOCUMENTS_REQUIS.projet })
    
    if (creditsCours.length > 0 || charges.some(c => c.type === 'pension_versee')) {
      docs.push({ categorie: 'Charges & Crédits', documents: DOCUMENTS_REQUIS.charges })
    }
    
    return docs
  }, [emprunteurs, biensImmo, revenus, creditsCours, charges])

  const avisRisque = evaluerRisque()
  const scenarios = genererScenarios()
  const optimisations = genererOptimisations()
  const documentsRequis = getDocumentsRequis()

  // ═══════════════════════════════════════════════════════════════════════════
  // AMORTISSEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  const [amort, setAmort] = useState<Array<{ annee: number; capitalRestant: number; capitalRembourse: number; interets: number; assurance: number; mensualiteTotale: number }>>([])
  const [res, setRes] = useState<Record<string, unknown> | null>(null)

  const genererAmortissement = useCallback(() => {
    if (lignesCredit.length === 0 || recapCredits.montant <= 0) return []
    const l = lignesCredit[0]
    const tm = l.taux / 100 / 12
    const mensHA = calcMensualiteHorsAss(l.montant, l.duree, l.taux)
    // Assurance mensuelle basée sur le tableau assurances (quotité x taux)
    const mensAss = assurances.reduce((sum, a) => sum + (l.montant * (a.quotite / 100) * (a.taux / 100) / 12), 0)
    let capital = l.montant
    const table: Array<{ annee: number; capitalRestant: number; capitalRembourse: number; interets: number; assurance: number; mensualiteTotale: number }> = []
    for (let annee = 1; annee <= l.duree; annee++) {
      let capitalAnnee = 0, interetsAnnee = 0
      for (let m = 0; m < 12; m++) {
        const interets = capital * tm
        const capitalRemb = mensHA - interets
        capitalAnnee += capitalRemb
        interetsAnnee += interets
        capital -= capitalRemb
      }
      table.push({
        annee, capitalRestant: Math.max(0, Math.round(capital)),
        capitalRembourse: Math.round(capitalAnnee), interets: Math.round(interetsAnnee),
        assurance: Math.round(mensAss * 12), mensualiteTotale: Math.round(mensHA + mensAss)
      })
    }
    return table
  }, [lignesCredit, recapCredits.montant, assurances])

  // ═══════════════════════════════════════════════════════════════════════════
  // LANCER SIMULATION
  // ═══════════════════════════════════════════════════════════════════════════
  const lancer = useCallback(async () => {
    setLoading(true)
    try {
      const payload = {
        revenus: revenus.map(r => ({ type: r.type, montant: r.frequence === 'annuel' ? Math.round(r.montant / 12) : r.montant })),
        charges: [...charges.map(c => ({ type: c.type, montant: c.montant })), ...creditsCours.map(c => ({ type: 'credit', montant: c.mensualite }))],
        situationFamiliale: emprunteurs.length > 1 ? 'couple' : 'seul',
        nbEnfants: emprunteurs[0].nbEnfantsACharge,
        ageEmprunteur: emprunteurs[0].age,
        projet: { prixBien, typeAchat: neufOuAncien, fraisNotaire, fraisAgence, travaux, apportPersonnel: apport },
        lignesCredit: lignesCredit.map(l => ({ type: l.type, montant: l.montant, dureeAnnees: l.duree, tauxAnnuel: l.taux, tauxAssurance: tauxAssuranceGlobal })),
        dureeEmpruntSouhaitee: recapCredits.duree,
        tauxSouhaite: lignesCredit[0]?.taux || 3.55,
        supprimerLoyerActuel: supprimerLoyer && natureProjet === 'achat_rp'
      }
      
      const response = await fetch('/api/advisor/simulators/capacite-emprunt', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur API')
      setRes(data.data)
      // Si l'API renvoie un tableau vide (multi-lignes), on génère localement l'amortissement principal
      const amortApi = data.data?.tableauAmortissement
      setAmort(amortApi && amortApi.length > 0 ? amortApi : genererAmortissement())
      setShowResults(true)
    } catch (err: unknown) {
      console.error('Erreur simulation:', err)
      setAmort(genererAmortissement())
      setShowResults(true)
    } finally {
      setLoading(false)
    }
  }, [revenus, charges, supprimerLoyer, natureProjet, emprunteurs, prixBien, neufOuAncien, fraisNotaire, fraisAgence, travaux, apport, lignesCredit, recapCredits.duree, tauxAssuranceGlobal, genererAmortissement, creditsCours])

  // ═══════════════════════════════════════════════════════════════════════════
  // GRAPHIQUES
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!showResults || !plotlyReady || amort.length === 0) return
    const Plotly = (window as unknown as { Plotly?: { newPlot: (el: HTMLElement | string, data: unknown[], layout: Record<string, unknown>, config: Record<string, unknown>) => void } }).Plotly
    if (!Plotly) return

    if (chartRef1.current) {
      Plotly.newPlot(chartRef1.current, [{
        x: amort.map(r => `A${r.annee}`), y: amort.map(r => r.capitalRembourse), name: 'Capital', type: 'bar', marker: { color: '#3b82f6' }
      }, {
        x: amort.map(r => `A${r.annee}`), y: amort.map(r => r.interets), name: 'Intérêts', type: 'bar', marker: { color: '#94a3b8' }
      }, {
        x: amort.map(r => `A${r.annee}`), y: amort.map(r => r.assurance), name: 'Assurance', type: 'bar', marker: { color: '#fbbf24' }
      }], { barmode: 'stack', margin: { t: 20, b: 40, l: 50, r: 20 }, height: 280, legend: { orientation: 'h', y: -0.15 }, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent' }, { responsive: true, displayModeBar: false })
    }
    if (chartRef2.current) {
      Plotly.newPlot(chartRef2.current, [{
        x: amort.map(r => `A${r.annee}`), y: amort.map(r => r.capitalRestant), name: 'Capital restant dû', type: 'scatter', mode: 'lines+markers', fill: 'tozeroy', line: { color: '#3b82f6' }, marker: { color: '#1e40af' }
      }], { margin: { t: 20, b: 40, l: 60, r: 20 }, height: 280, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent' }, { responsive: true, displayModeBar: false })
    }
  }, [showResults, plotlyReady, amort])

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════════════════
  // Ordre demandé : Profil (situation) en premier, puis Projet, Revenus, Charges, Patrimoine, Financement
  const STEPS = [
    { num: 1, label: 'Profil', icon: User },
    { num: 2, label: 'Projet', icon: Home },
    { num: 3, label: 'Revenus', icon: Banknote },
    { num: 4, label: 'Charges', icon: FileText },
    { num: 5, label: 'Patrimoine', icon: TrendingUp },
    { num: 6, label: 'Financement', icon: Shield },
  ]

  return (
    <SimulatorGate simulator="CAPACITE_EMPRUNT">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/calculateurs" className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </Link>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Capacité d'Emprunt Pro</h1>
                <p className="text-xs text-gray-500">Analyse complète faisabilité bancaire</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Badge version décembre 2025 */}
              <span className="px-2 py-1 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
                Données déc. 2025
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${avisRisque.niveau === 'excellent' ? 'bg-green-100 text-green-700' : avisRisque.niveau === 'bon' ? 'bg-blue-100 text-blue-700' : avisRisque.niveau === 'moyen' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {avisRisque.score}/100
              </span>
              <button onClick={resetSimulation} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Réinitialiser la simulation">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => setShowPonderations(!showPonderations)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Paramètres pondérations">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Toggle Pondérations */}
          {showPonderations && (
            <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Settings className="w-4 h-4" /> Pondérations des revenus</h3>
                <button onClick={resetPonderations} className="text-sm text-blue-600 hover:underline">Réinitialiser</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(ponderations).map(([key, val]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-2">
                    <label className="text-xs text-gray-600 block mb-1">{val.label}</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min="0" max="1" step="0.1" value={val.coef} onChange={e => updPonderation(key, +e.target.value)} className="flex-1" />
                      <span className="text-sm font-medium w-10 text-right">{(val.coef * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{val.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showResults ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Formulaire principal */}
              <div className="lg:col-span-3 space-y-4">
                {/* Stepper */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex justify-between">
                    {STEPS.map((s, idx) => {
                      const Icon = s.icon
                      return (
                        <div key={s.num} className="flex items-center">
                          <button onClick={() => setStep(s.num)} className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${step === s.num ? 'bg-blue-100 text-blue-700' : step > s.num ? 'text-green-600' : 'text-gray-400 hover:bg-gray-50'}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${step === s.num ? 'bg-blue-600 text-white' : step > s.num ? 'bg-green-100' : 'bg-gray-100'}`}>
                              {step > s.num ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                            </div>
                            <span className="text-xs font-medium">{s.label}</span>
                          </button>
                          {idx < 5 && <div className={`w-8 h-0.5 ${step > s.num ? 'bg-green-400' : 'bg-gray-200'}`} />}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  {/* ÉTAPE 2: PROJET (après le profil) */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="pb-3 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Home className="w-5 h-5 text-blue-600" /> Votre projet immobilier</h2>
                        <p className="text-sm text-gray-500">Décrivez votre projet d'acquisition</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nature du projet</label>
                          <select value={natureProjet} onChange={e => setNatureProjet(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            {NATURES_PROJET.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stade du projet</label>
                          <select value={stadeProjet} onChange={e => setStadeProjet(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                            {STADES_PROJET.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>
                      {stadeProjet === 'compromis' && (
                        <div className="grid grid-cols-2 gap-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div>
                            <label className="block text-sm font-medium text-amber-800 mb-1">Date signature compromis</label>
                            <input type="date" value={dateCompromis} onChange={e => setDateCompromis(e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded-lg" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-amber-800 mb-1">Fin conditions suspensives</label>
                            <input type="date" value={dateFinCondSusp} onChange={e => setDateFinCondSusp(e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded-lg" />
                          </div>
                        </div>
                      )}
                      <hr className="border-gray-100" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type de bien</label>
                          <select value={typeBien} onChange={e => setTypeBien(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                            {TYPES_BIEN.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Neuf / Ancien</label>
                          <select value={neufOuAncien} onChange={e => setNeufOuAncien(e.target.value as any)} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                            <option value="ancien">Ancien</option>
                            <option value="neuf">Neuf / VEFA</option>
                          </select>
                        </div>
                        {/* Adresse du bien avec autocomplétion et zone PTZ automatique */}
                        <div className="md:col-span-2">
                          <AdresseInput
                            label="Adresse du bien"
                            placeholder="Rechercher une adresse..."
                            showZonePTZ={true}
                            showAidesLocales={true}
                            helpText="La zone PTZ sera déterminée automatiquement"
                            onSelect={(adresse) => {
                              setLocalisation(`${adresse.city} (${adresse.postcode})`)
                              if (adresse.zonePTZ) {
                                setZonePTZ(adresse.zonePTZ as 'A_bis' | 'A' | 'B1' | 'B2' | 'C')
                              }
                              setCodeInsee(adresse.citycode)
                              setDepartement(adresse.departement || '')
                            }}
                          />
                        </div>
                        
                        {/* Zone PTZ affichée et modifiable si besoin */}
                        {localisation && (
                          <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-blue-900">{localisation}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  zonePTZ === 'A_bis' ? 'bg-red-100 text-red-800' :
                                  zonePTZ === 'A' ? 'bg-orange-100 text-orange-800' :
                                  zonePTZ === 'B1' ? 'bg-yellow-100 text-yellow-800' :
                                  zonePTZ === 'B2' ? 'bg-lime-100 text-lime-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  Zone {zonePTZ === 'A_bis' ? 'A bis' : zonePTZ}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {zonePTZ === 'A_bis' || zonePTZ === 'A' ? 'Zone tendue' : 
                                   zonePTZ === 'B1' ? 'Zone intermédiaire' : 'Zone détendue'}
                                </span>
                              </div>
                            </div>
                            <select 
                              value={zonePTZ} 
                              onChange={e => setZonePTZ(e.target.value as 'A_bis' | 'A' | 'B1' | 'B2' | 'C')} 
                              className="text-xs px-2 py-1 border border-blue-200 rounded bg-white"
                              title="Modifier la zone si nécessaire"
                            >
                              {ZONES_PTZ.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Prix du bien</label>
                          <input type="number" value={prixBien} onChange={e => setPrixBien(+e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Frais d'agence</label>
                          <input type="number" value={fraisAgence} onChange={e => setFraisAgence(+e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Travaux</label>
                          <input type="number" value={travaux} onChange={e => setTravaux(+e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Frais notaire (estimé)</label>
                          <input type="number" value={fraisNotaire} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50" />
                          <span className="text-xs text-gray-400">{neufOuAncien === 'neuf' ? '~2.5%' : '~8%'}</span>
                        </div>
                        {natureProjet.includes('locatif') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loyer mensuel estimé</label>
                            <input type="number" value={loyerEstime} onChange={e => setLoyerEstime(+e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                          </div>
                        )}
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
                        <div><span className="text-sm text-blue-600">Budget total</span><div className="text-xl font-bold text-blue-700">{fmtEur(montantTotal)}</div></div>
                        <div className="text-right"><span className="text-sm text-blue-600">À financer (hors apport)</span><div className="text-xl font-bold text-blue-700">{fmtEur(montantAFinancer)}</div></div>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 1: PROFIL (en premier comme demandé) */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="pb-3 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><User className="w-5 h-5 text-blue-600" /> Votre situation</h2>
                        <p className="text-sm text-gray-500">Commençons par votre profil emprunteur</p>
                      </div>
                      
                      {/* Profil(s) emprunteur(s) */}
                      {emprunteurs.map((emp, idx) => (
                        <div key={emp.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">{idx === 0 ? <User className="w-5 h-5 text-blue-600" /> : <Users className="w-5 h-5 text-blue-600" />}<span className="font-semibold text-gray-800">{idx === 0 ? 'Emprunteur principal' : 'Co-emprunteur'}</span></div>
                            {idx === 1 && <button onClick={() => removeCoemprunteur()} className="text-red-500 text-sm hover:underline flex items-center gap-1"><Trash2 className="w-3 h-3" />Retirer</button>}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div><label className="block text-xs text-gray-500 mb-1">Prénom</label><input type="text" value={emp.prenom} onChange={e => updEmprunteur(emp.id, 'prenom', e.target.value)} placeholder="Prénom" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                            <div><label className="block text-xs text-gray-500 mb-1">Âge</label><input type="number" value={emp.age} onChange={e => { updEmprunteur(emp.id, 'age', +e.target.value); setAssurances(assurances.map(a => a.emprunteurId === emp.id ? { ...a, taux: getTauxAssuranceParAge(+e.target.value) } : a)) }} min={18} max={85} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Situation familiale</label>
                              <select value={emp.situationFamiliale} onChange={e => setSituationFamiliale(emp.id, e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                                {SITUATIONS_FAMILIALES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                            </div>
                            <div><label className="block text-xs text-gray-500 mb-1">Enfants à charge</label><input type="number" value={emp.nbEnfantsACharge} onChange={e => updEmprunteur(emp.id, 'nbEnfantsACharge', +e.target.value)} min={0} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                            <div><label className="block text-xs text-gray-500 mb-1">Statut professionnel</label><select value={emp.statutPro} onChange={e => updEmprunteur(emp.id, 'statutPro', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">{Object.entries(COEF_STATUT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                            <div><label className="block text-xs text-gray-500 mb-1">Profession</label><input type="text" value={emp.profession} onChange={e => updEmprunteur(emp.id, 'profession', e.target.value)} placeholder="Ex: Ingénieur" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                            <div><label className="block text-xs text-gray-500 mb-1">Secteur</label><select value={emp.secteurActivite} onChange={e => updEmprunteur(emp.id, 'secteurActivite', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">{SECTEURS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                            <div><label className="block text-xs text-gray-500 mb-1">Ancienneté (années)</label><input type="number" value={emp.ancienneteAnnees} onChange={e => updEmprunteur(emp.id, 'ancienneteAnnees', +e.target.value)} min={0} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                          </div>
                          <label className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                            <input type="checkbox" checked={emp.primoAccedant} onChange={e => updEmprunteur(emp.id, 'primoAccedant', e.target.checked)} className="w-4 h-4" />
                            Primo-accédant (pas propriétaire depuis 2 ans)
                          </label>
                        </div>
                      ))}
                      
                      {/* Bouton ajouter co-emprunteur si un seul */}
                      {emprunteurs.length === 1 && (
                        <button 
                          onClick={addCoemprunteur} 
                          className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-2 transition-all"
                        >
                          <Plus className="w-5 h-5" /> Ajouter un co-emprunteur
                        </button>
                      )}
                      
                      {/* Info box */}
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-sm flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span className="text-amber-800">Le taux d'assurance est ajusté automatiquement selon l'âge de chaque emprunteur. Vous pourrez modifier les quotités dans l'étape Financement.</span>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 3: REVENUS */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="pb-3 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Banknote className="w-5 h-5 text-blue-600" /> Revenus</h2>
                        <p className="text-sm text-gray-500">Revenus mensuels nets de chaque emprunteur</p>
                      </div>
                      {emprunteurs.map(emp => {
                        const statutInfo = COEF_STATUT[emp.statutPro as keyof typeof COEF_STATUT]
                        return (
                          <div key={emp.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-700 flex items-center gap-2">{emp.id === 'emp1' ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}{emp.prenom || (emp.id === 'emp1' ? 'Emprunteur principal' : 'Co-emprunteur')}</h4>
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Coef. statut: {(statutInfo?.coef || 1) * 100}%</span>
                            </div>
                            {revenus.filter(r => r.emprunteurId === emp.id).map(r => {
                              const typeInfo = ponderations[r.type]
                              return (
                                <div key={r.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                  <select value={r.type} onChange={e => updRevenu(r.id, 'type', e.target.value)} className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm">
                                    {Object.entries(ponderations).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                  </select>
                                  <input type="number" value={r.montant} onChange={e => updRevenu(r.id, 'montant', +e.target.value)} className="w-24 px-2 py-1.5 border border-gray-200 rounded text-sm text-right" />
                                  <select value={r.frequence} onChange={e => updRevenu(r.id, 'frequence', e.target.value)} className="w-24 px-2 py-1.5 border border-gray-200 rounded text-sm">
                                    <option value="mensuel">/ mois</option>
                                    <option value="annuel">/ an</option>
                                  </select>
                                  <span className="text-xs text-gray-400 w-12">x{((typeInfo?.coef || 0.5) * 100).toFixed(0)}%</span>
                                  {revenus.filter(x => x.emprunteurId === emp.id).length > 1 && <button onClick={() => delRevenu(r.id)} className="p-1 text-red-500"><Trash2 className="w-4 h-4" /></button>}
                                </div>
                              )
                            })}
                            <button onClick={() => addRevenu(emp.id)} className="text-blue-600 text-sm flex items-center gap-1"><Plus className="w-4 h-4" />Ajouter</button>
                          </div>
                        )
                      })}
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>Les revenus sont pondérés selon leur nature et le statut professionnel (pratique bancaire). <button onClick={() => setShowPonderations(true)} className="text-blue-700 underline">Voir/modifier les pondérations</button></span>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 4: CHARGES */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <div className="pb-3 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Charges</h2>
                        <p className="text-sm text-gray-500">Charges fixes mensuelles et crédits en cours</p>
                      </div>
                      {emprunteurs.map(emp => (
                        <div key={emp.id} className="space-y-2">
                          <h4 className="font-medium text-gray-700 flex items-center gap-2">{emp.id === 'emp1' ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}{emp.prenom || (emp.id === 'emp1' ? 'Emprunteur principal' : 'Co-emprunteur')}</h4>
                          {charges.filter(c => c.emprunteurId === emp.id).map(c => (
                            <div key={c.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                              <select value={c.type} onChange={e => updCharge(c.id, 'type', e.target.value)} className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm">
                                {CHARGES_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                              <input type="number" value={c.montant} onChange={e => updCharge(c.id, 'montant', +e.target.value)} className="w-28 px-2 py-1.5 border border-gray-200 rounded text-sm text-right" />
                              <span className="text-gray-400 text-sm">€</span>
                              {charges.filter(x => x.emprunteurId === emp.id).length > 1 && <button onClick={() => delCharge(c.id)} className="p-1 text-red-500"><Trash2 className="w-4 h-4" /></button>}
                            </div>
                          ))}
                          <button onClick={() => addCharge(emp.id)} className="text-blue-600 text-sm flex items-center gap-1"><Plus className="w-4 h-4" />Ajouter</button>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="font-medium text-gray-700 mb-2">Crédits en cours</h4>
                        {creditsCours.length === 0 && <p className="text-sm text-gray-400 italic">Aucun crédit en cours</p>}
                        {creditsCours.map(c => (
                          <div key={c.id} className="grid grid-cols-5 gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 mb-2 items-center">
                            <select value={c.type} onChange={e => updCreditCours(c.id, 'type', e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded text-sm">
                              {CREDITS_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <div><label className="text-[10px] text-gray-400">Mensualité</label><input type="number" value={c.mensualite} onChange={e => updCreditCours(c.id, 'mensualite', +e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" /></div>
                            <div><label className="text-[10px] text-gray-400">Capital restant</label><input type="number" value={c.capitalRestant} onChange={e => updCreditCours(c.id, 'capitalRestant', +e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" /></div>
                            <div><label className="text-[10px] text-gray-400">Fin prévue</label><input type="month" value={c.finPrevue} onChange={e => updCreditCours(c.id, 'finPrevue', e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" /></div>
                            <div className="flex items-center gap-1">
                              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={c.rachetable} onChange={e => updCreditCours(c.id, 'rachetable', e.target.checked)} />Racheter</label>
                              <button onClick={() => delCreditCours(c.id)} className="p-1 text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ))}
                        <button onClick={addCreditCours} className="text-blue-600 text-sm flex items-center gap-1"><Plus className="w-4 h-4" />Ajouter un crédit</button>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 5: PATRIMOINE */}
                  {step === 5 && (
                    <div className="space-y-4">
                      <div className="pb-3 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> Patrimoine</h2>
                        <p className="text-sm text-gray-500">Biens immobiliers et épargne disponible</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Biens immobiliers existants</h4>
                        {biensImmo.length === 0 && <p className="text-sm text-gray-400 italic">Aucun bien immobilier</p>}
                        {biensImmo.map(b => (
                          <div key={b.id} className="grid grid-cols-5 gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 mb-2 items-center">
                            <select value={b.type} onChange={e => updBienImmo(b.id, 'type', e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded text-sm">
                              {PATRIMOINE_IMMO_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <div><label className="text-[10px] text-gray-400">Valeur estimée</label><input type="number" value={b.valeur} onChange={e => updBienImmo(b.id, 'valeur', +e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" /></div>
                            <div><label className="text-[10px] text-gray-400">CRD crédit</label><input type="number" value={b.crdCredit} onChange={e => updBienImmo(b.id, 'crdCredit', +e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" /></div>
                            <div><label className="text-[10px] text-gray-400">Loyer perçu</label><input type="number" value={b.loyerPercu} onChange={e => updBienImmo(b.id, 'loyerPercu', +e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" /></div>
                            <button onClick={() => delBienImmo(b.id)} className="p-1 text-red-500 justify-self-end"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                        <button onClick={addBienImmo} className="text-blue-600 text-sm flex items-center gap-1"><Plus className="w-4 h-4" />Ajouter un bien</button>
                      </div>
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="font-medium text-gray-700 mb-2">Épargne</h4>
                        {epargne.map(e => (
                          <div key={e.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 mb-2">
                            <select value={e.type} onChange={ev => updEpargne(e.id, 'type', ev.target.value)} className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm">
                              {EPARGNE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <input type="number" value={e.montant} onChange={ev => updEpargne(e.id, 'montant', +ev.target.value)} className="w-28 px-2 py-1.5 border border-gray-200 rounded text-sm text-right" />
                            <span className="text-gray-400 text-sm">€</span>
                            <label className="flex items-center gap-1 text-xs text-gray-500"><input type="checkbox" checked={e.disponible} onChange={ev => updEpargne(e.id, 'disponible', ev.target.checked)} />Dispo</label>
                            {epargne.length > 1 && <button onClick={() => delEpargne(e.id)} className="p-1 text-red-500"><Trash2 className="w-4 h-4" /></button>}
                          </div>
                        ))}
                        <button onClick={addEpargne} className="text-blue-600 text-sm flex items-center gap-1"><Plus className="w-4 h-4" />Ajouter</button>
                      </div>
                      <div className="bg-slate-100 p-3 rounded-lg grid grid-cols-3 gap-3 text-center text-sm">
                        <div><span className="text-gray-500">Patrimoine immo net</span><div className="font-bold text-gray-800">{fmtEur(patrimoineNetImmo)}</div></div>
                        <div><span className="text-gray-500">Épargne totale</span><div className="font-bold text-gray-800">{fmtEur(totalEpargne)}</div></div>
                        <div><span className="text-gray-500">Épargne disponible</span><div className="font-bold text-blue-700">{fmtEur(totalEpargneDispo)}</div></div>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 6: FINANCEMENT */}
                  {step === 6 && (
                    <div className="space-y-4">
                      <div className="pb-3 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600" /> Financement</h2>
                        <p className="text-sm text-gray-500">Apport, crédit, assurance et garantie</p>
                      </div>
                      
                      {/* Prêts aidés éligibles */}
                      {pretsEligibles.some(p => p.eligible) && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Prêts aidés éligibles</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {pretsEligibles.filter(p => p.eligible).map(p => (
                              <div key={p.type} className="bg-white rounded-lg p-3 border border-green-200">
                                <div className="font-medium text-green-700">{p.nom}</div>
                                <div className="text-sm text-green-600">Jusqu'à {fmtEur(p.montantMax)}</div>
                                <button onClick={() => {
                                  const newLigne: LigneCredit = { id: Date.now().toString(), type: p.type, montant: Math.min(p.montantMax, montantAFinancer * 0.4), duree: 20, taux: 0, differe: 0 }
                                  setLignesCredit([...lignesCredit, newLigne])
                                }} className="text-xs text-green-700 underline mt-1">+ Ajouter au plan</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Apport personnel</label>
                          <input type="number" value={apport} onChange={e => setApport(+e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                          <span className="text-xs text-gray-400">Soit {(apport / montantTotal * 100).toFixed(1)}% du budget</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <span className="text-sm text-gray-600">Épargne résiduelle après apport</span>
                          <div className={`text-xl font-bold ${epargneResiduelle >= 5000 ? 'text-green-600' : 'text-amber-600'}`}>{fmtEur(epargneResiduelle)}</div>
                          {epargneResiduelle < 5000 && <span className="text-xs text-amber-600">Épargne de sécurité faible</span>}
                        </div>
                      </div>
                      
                      <h4 className="font-medium text-gray-700 pt-2">Lignes de crédit</h4>
                      {lignesCredit.map((l, idx) => {
                        const mensHA = Math.round(calcMensualiteHorsAss(l.montant, l.duree, l.taux))
                        return (
                          <div key={l.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="grid grid-cols-5 gap-2 mb-2">
                              <div><label className="text-[10px] text-gray-400">Type</label><select value={l.type} onChange={e => updLigne(l.id, 'type', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm">{CREDIT_LIGNE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                              <div><label className="text-[10px] text-gray-400">Montant</label><input type="number" value={l.montant} onChange={e => updLigne(l.id, 'montant', +e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" readOnly={idx === 0} /></div>
                              <div><label className="text-[10px] text-gray-400">Durée</label><select value={l.duree} onChange={e => updLigne(l.id, 'duree', +e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm">{DUREES.map(d => <option key={d} value={d}>{d} ans</option>)}</select></div>
                              <div><label className="text-[10px] text-gray-400">Taux (%)</label><input type="number" value={l.taux} onChange={e => updLigne(l.id, 'taux', +e.target.value)} step={0.01} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" /></div>
                              <div className="flex items-end">{lignesCredit.length > 1 && idx > 0 && <button onClick={() => delLigne(l.id)} className="p-1.5 text-red-500"><Trash2 className="w-4 h-4" /></button>}</div>
                            </div>
                            <div className="text-right text-sm"><span className="text-gray-500">Mensualité hors assurance:</span> <span className="font-bold">{fmtEur(mensHA)}</span></div>
                          </div>
                        )
                      })}
                      <button onClick={addLigne} className="text-blue-600 text-sm flex items-center gap-1"><Plus className="w-4 h-4" />Ajouter une ligne</button>
                      
                      {/* Assurance emprunteur par tête */}
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-600" /> Assurance emprunteur
                          <span className="text-xs text-gray-400 font-normal ml-auto">
                            Total quotité: {assurances
                              .filter((ass, idx, self) => self.findIndex(a => a.emprunteurId === ass.emprunteurId) === idx)
                              .filter(ass => emprunteurs.some(e => e.id === ass.emprunteurId))
                              .reduce((s, a) => s + a.quotite, 0)}%
                          </span>
                        </h4>
                        <div className="space-y-3">
                          {assurances
                            .filter((ass, idx, self) => self.findIndex(a => a.emprunteurId === ass.emprunteurId) === idx)
                            .filter(ass => emprunteurs.some(e => e.id === ass.emprunteurId))
                            .map((ass, idx) => {
                              const emp = emprunteurs.find(e => e.id === ass.emprunteurId)
                              return (
                                <div key={`assurance-${ass.emprunteurId}`} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    {idx === 0 ? <User className="w-4 h-4 text-blue-600" /> : <Users className="w-4 h-4 text-blue-600" />}
                                    <span className="font-medium text-gray-700 text-sm">{emp?.prenom || (idx === 0 ? 'Emprunteur principal' : 'Co-emprunteur')}</span>
                                    <span className="text-xs text-gray-400">({emp?.age || 35} ans)</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3">
                                    <div>
                                      <label className="text-[10px] text-gray-500">Quotité (%)</label>
                                      <input 
                                        type="number" 
                                        value={ass.quotite} 
                                        onChange={e => setAssurances(assurances.map(a => a.emprunteurId === ass.emprunteurId ? { ...a, quotite: Math.max(0, Math.min(100, +e.target.value)) } : a))}
                                        min={0} max={100} step={5}
                                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-gray-500">Taux (%)</label>
                                      <input 
                                        type="number" 
                                        value={ass.taux} 
                                        onChange={e => setAssurances(assurances.map(a => a.emprunteurId === ass.emprunteurId ? { ...a, taux: +e.target.value } : a))}
                                        step={0.01} min={0} max={2}
                                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-gray-500">Garanties</label>
                                      <select 
                                        value={ass.garanties} 
                                        onChange={e => setAssurances(assurances.map(a => a.emprunteurId === ass.emprunteurId ? { ...a, garanties: e.target.value } : a))}
                                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                                      >
                                        <option value="DC/PTIA/ITT/IPT">DC/PTIA/ITT/IPT (complet)</option>
                                        <option value="DC/PTIA/ITT">DC/PTIA/ITT</option>
                                        <option value="DC/PTIA">DC/PTIA (minimum)</option>
                                        <option value="DC">DC seul</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-700">Coût assurance mensuel</span>
                            <span className="font-bold text-blue-800">{fmtEur(assuranceMensuelle)}</span>
                          </div>
                          <div className="text-[10px] text-blue-600 mt-1">
                            Taux global pondéré: {fmtPct(tauxAssuranceGlobal)} sur capital initial
                          </div>
                        </div>
                      </div>

                      {/* Garantie du prêt */}
                      <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Garantie du prêt</label>
                        <select value={garantie} onChange={e => setGarantie(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                          {GARANTIES.map(g => <option key={g.value} value={g.value}>{g.label} (~{(g.frais * 100).toFixed(1)}%)</option>)}
                        </select>
                        <span className="text-xs text-gray-400">Coût estimé: {fmtEur(coutGarantie)} • {garantieInfo.description}</span>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between pt-5 border-t border-gray-100 mt-5">
                    <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40">Précédent</button>
                    {step < 6 ? (
                      <button onClick={() => setStep(step + 1)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Suivant</button>
                    ) : (
                      <button onClick={lancer} disabled={loading} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50">
                        {loading ? 'Calcul...' : 'Analyser la faisabilité'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SIDEBAR */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">Synthèse financière</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Revenus bruts</span><span className="font-medium">{fmtEur(totalRevenusBruts)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Revenus pondérés</span><span className="font-medium text-blue-600">{fmtEur(totalRevenusPonderes)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Charges actuelles</span><span className="font-medium text-red-600">{fmtEur(totalCharges)}</span></div>
                    <hr />
                    <div className="flex justify-between"><span className="text-gray-500">Budget projet</span><span className="font-medium">{fmtEur(montantTotal)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Apport</span><span className="font-medium">{fmtEur(apport)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">À financer</span><span className="font-bold text-blue-700">{fmtEur(montantAFinancer)}</span></div>
                    <hr />
                    <div className="flex justify-between"><span className="text-gray-500">Mensualité crédit</span><span className="font-bold text-blue-700">{fmtEur(mensualiteTotale)}</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-gray-400">dont assurance</span><span className="text-gray-500">{fmtEur(assuranceMensuelle)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Garantie</span><span className="font-medium">{fmtEur(coutGarantie)}</span></div>
                  </div>
                </div>

                <div className={`rounded-xl border-2 p-3 ${ratioEndettement <= 35 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="text-center">
                    <span className="text-xs text-gray-600">Taux d'endettement</span>
                    <div className={`text-2xl font-bold ${ratioEndettement <= 35 ? 'text-green-600' : 'text-red-600'}`}>{fmtPct(ratioEndettement)}</div>
                    <span className="text-[10px] text-gray-500">Max HCSF: 35%</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-3">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div><span className="text-gray-500">Reste à vivre</span><div className={`text-lg font-bold ${resteAVivre >= 800 ? 'text-green-600' : 'text-red-600'}`}>{fmtEur(resteAVivre)}</div></div>
                    <div><span className="text-gray-500">Saut de charge</span><div className={`text-lg font-bold ${sautDeCharge <= 300 ? 'text-green-600' : sautDeCharge <= 500 ? 'text-amber-600' : 'text-red-600'}`}>{sautDeCharge >= 0 ? '+' : ''}{fmtEur(sautDeCharge)}</div></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-3">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div><span className="text-gray-500">Épargne résiduelle</span><div className={`text-lg font-bold ${epargneResiduelle >= 5000 ? 'text-green-600' : 'text-amber-600'}`}>{fmtEur(epargneResiduelle)}</div></div>
                    <div><span className="text-gray-500">Ratio hypothécaire</span><div className={`text-lg font-bold ${ratioHypothecaire <= 80 ? 'text-green-600' : 'text-amber-600'}`}>{fmtPct(ratioHypothecaire)}</div></div>
                  </div>
                </div>

                <div className={`rounded-xl border p-3 ${avisRisque.niveau === 'excellent' ? 'bg-green-50 border-green-200' : avisRisque.niveau === 'bon' ? 'bg-blue-50 border-blue-200' : avisRisque.niveau === 'moyen' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">Avis risque</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${avisRisque.niveau === 'excellent' ? 'bg-green-200 text-green-800' : avisRisque.niveau === 'bon' ? 'bg-blue-200 text-blue-800' : avisRisque.niveau === 'moyen' ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'}`}>
                      {avisRisque.niveau.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {avisRisque.points.slice(0, 3).map((p, i) => <div key={i} className="text-[10px] text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" />{p}</div>)}
                    {avisRisque.alertes.slice(0, 2).map((a, i) => <div key={i} className="text-[10px] text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{a}</div>)}
                    {avisRisque.bloquants.slice(0, 1).map((b, i) => <div key={i} className="text-[10px] text-red-700 flex items-center gap-1"><XCircle className="w-3 h-3" />{b}</div>)}
                  </div>
                </div>

                {/* Mensualité max */}
                <div className="bg-slate-100 rounded-xl p-3 text-center">
                  <span className="text-xs text-gray-500">Mensualité max HCSF</span>
                  <div className="text-lg font-bold text-gray-700">{fmtEur(mensualiteMaxHCSF)}</div>
                </div>
              </div>
            </div>

          ) : (
            /* ═══════════════════════════════════════════════════════════════════════════
               RÉSULTATS
               ═══════════════════════════════════════════════════════════════════════════ */
            <div className="space-y-6">
              <button onClick={() => setShowResults(false)} className="text-blue-600 text-sm flex items-center gap-1 hover:underline">Modifier la simulation</button>
              
              {/* Verdict */}
              <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${faisable ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                {faisable ? <CheckCircle className="w-10 h-10 text-green-600" /> : <XCircle className="w-10 h-10 text-red-600" />}
                <div>
                  <h3 className={`text-lg font-bold ${faisable ? 'text-green-700' : 'text-red-700'}`}>{faisable ? 'Projet réalisable' : 'Projet à retravailler'}</h3>
                  <p className="text-sm text-gray-600">Endettement: {fmtPct(ratioEndettement)} | Reste à vivre: {fmtEur(resteAVivre)} | Score: {avisRisque.score}/100</p>
                </div>
              </div>

              {/* Onglets résultats */}
              <div className="flex gap-2 border-b border-gray-200">
                {[
                  { id: 'synthese', label: 'Synthèse', icon: FileText },
                  { id: 'scenarios', label: 'Scénarios', icon: TrendingUp },
                  { id: 'documents', label: 'Documents', icon: FileCheck },
                  { id: 'avis', label: 'Avis risque', icon: Shield },
                ].map(tab => {
                  const Icon = tab.icon
                  return (
                    <button key={tab.id} onClick={() => setActiveResultTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeResultTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      <Icon className="w-4 h-4" />{tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Tab: Synthèse */}
              {activeResultTab === 'synthese' && (
                <div className="space-y-6">
                  {/* KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white rounded-xl border p-3 text-center"><span className="text-xs text-gray-500">Montant crédit</span><div className="text-lg font-bold text-blue-700">{fmtEur(recapCredits.montant)}</div></div>
                    <div className="bg-white rounded-xl border p-3 text-center"><span className="text-xs text-gray-500">Mensualité totale</span><div className="text-lg font-bold text-blue-700">{fmtEur(mensualiteTotale)}</div></div>
                    <div className="bg-white rounded-xl border p-3 text-center"><span className="text-xs text-gray-500">Endettement</span><div className={`text-lg font-bold ${ratioEndettement > 35 ? 'text-red-600' : 'text-green-600'}`}>{fmtPct(ratioEndettement)}</div></div>
                    <div className="bg-white rounded-xl border p-3 text-center"><span className="text-xs text-gray-500">Reste à vivre</span><div className={`text-lg font-bold ${resteAVivre < 800 ? 'text-red-600' : 'text-green-600'}`}>{fmtEur(resteAVivre)}</div></div>
                    <div className="bg-white rounded-xl border p-3 text-center"><span className="text-xs text-gray-500">Score dossier</span><div className={`text-lg font-bold ${avisRisque.niveau === 'excellent' || avisRisque.niveau === 'bon' ? 'text-green-600' : 'text-amber-600'}`}>{avisRisque.score}/100</div></div>
                  </div>

                  {/* Détail financement */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border p-4">
                      <h3 className="font-bold text-gray-900 mb-3">Plan de financement</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between font-medium text-gray-700 border-b pb-2"><span>Budget total</span><span>{fmtEur(montantTotal)}</span></div>
                        <div className="flex justify-between text-gray-500 pl-2"><span>Prix du bien</span><span>{fmtEur(prixBien)}</span></div>
                        <div className="flex justify-between text-gray-500 pl-2"><span>Frais de notaire</span><span>{fmtEur(fraisNotaire)}</span></div>
                        {fraisAgence > 0 && <div className="flex justify-between text-gray-500 pl-2"><span>Frais agence</span><span>{fmtEur(fraisAgence)}</span></div>}
                        {travaux > 0 && <div className="flex justify-between text-gray-500 pl-2"><span>Travaux</span><span>{fmtEur(travaux)}</span></div>}
                        <div className="flex justify-between text-gray-500 pl-2"><span>Frais dossier + garantie</span><span>{fmtEur(fraisDossier + coutGarantie)}</span></div>
                        <hr />
                        <div className="flex justify-between font-medium text-green-700"><span>Apport personnel</span><span>- {fmtEur(apport)}</span></div>
                        <div className="flex justify-between font-bold text-blue-700 border-t pt-2"><span>Montant emprunté</span><span>{fmtEur(recapCredits.montant)}</span></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border p-4">
                      <h3 className="font-bold text-gray-900 mb-3">Coût du crédit</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Mensualité hors assurance</span><span className="font-medium">{fmtEur(Math.round(recapCredits.mensHA))}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Assurance emprunteur</span><span className="font-medium">{fmtEur(assuranceMensuelle)}</span></div>
                        <div className="flex justify-between font-bold border-t pt-2"><span>Mensualité totale</span><span className="text-blue-700">{fmtEur(mensualiteTotale)}</span></div>
                        <hr />
                        <div className="flex justify-between"><span className="text-gray-500">Coût total intérêts</span><span className="font-medium">{fmtEur(Math.round(recapCredits.cout))}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Coût total assurance</span><span className="font-medium">{fmtEur(coutAssuranceTotal)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Coût garantie</span><span className="font-medium">{fmtEur(coutGarantie)}</span></div>
                        <div className="flex justify-between font-bold border-t pt-2"><span>Coût total crédit</span><span>{fmtEur(Math.round(recapCredits.cout) + coutAssuranceTotal + coutGarantie)}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Graphiques */}
                  <div className="bg-white rounded-xl border p-4">
                    <h3 className="font-bold text-gray-900 mb-3">Répartition annuelle des remboursements</h3>
                    <div ref={chartRef1} />
                  </div>
                  <div className="bg-white rounded-xl border p-4">
                    <h3 className="font-bold text-gray-900 mb-3">Évolution du capital restant dû</h3>
                    <div ref={chartRef2} />
                  </div>

                  {/* Tableau amortissement */}
                  {amort.length > 0 && (
                    <div className="bg-white rounded-xl border p-4">
                      <h3 className="font-bold mb-3 text-sm">Tableau d'amortissement</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr><th className="p-2 text-left">Année</th><th className="p-2 text-right">Capital restant</th><th className="p-2 text-right">Capital remb.</th><th className="p-2 text-right">Intérêts</th><th className="p-2 text-right">Assurance</th><th className="p-2 text-right">Total annuel</th></tr>
                          </thead>
                          <tbody>
                            {amort.map(r => (
                              <tr key={r.annee} className="border-t">
                                <td className="p-2">{r.annee}</td>
                                <td className="p-2 text-right">{fmtEur(r.capitalRestant)}</td>
                                <td className="p-2 text-right text-blue-600">{fmtEur(r.capitalRembourse)}</td>
                                <td className="p-2 text-right text-gray-500">{fmtEur(r.interets)}</td>
                                <td className="p-2 text-right text-gray-500">{fmtEur(r.assurance)}</td>
                                <td className="p-2 text-right font-medium">{fmtEur(r.mensualiteTotale * 12)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Scénarios */}
              {activeResultTab === 'scenarios' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border p-4">
                    <h3 className="font-bold text-gray-900 mb-4">Comparaison multi-scénarios</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {scenarios.map(s => (
                        <div key={s.id} className={`rounded-xl border-2 p-4 ${s.faisable ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-gray-800">{s.duree} ans</span>
                            {s.faisable ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between"><span className="text-gray-500">Taux</span><span className="font-medium">{fmtPct(s.taux)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Mensualité</span><span className="font-bold text-blue-700">{fmtEur(s.mensualite)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Endettement</span><span className={s.endettement <= 35 ? 'text-green-600' : 'text-red-600'}>{fmtPct(s.endettement)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Coût crédit</span><span className="text-gray-700">{fmtEur(s.cout)}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optimisations si le dossier ne passe pas */}
                  {optimisations.length > 0 && (
                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                      <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5" /> Pistes d'optimisation</h3>
                      <div className="space-y-3">
                        {optimisations.map((opt, i) => (
                          <div key={i} className={`bg-white rounded-lg p-3 border ${opt.priorite === 'haute' ? 'border-red-200' : opt.priorite === 'moyenne' ? 'border-amber-200' : 'border-gray-200'}`}>
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium text-gray-800">{opt.action}</div>
                                <div className="text-sm text-green-600">{opt.impact}</div>
                                <div className="text-xs text-gray-500 mt-1">{opt.detail}</div>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded ${opt.priorite === 'haute' ? 'bg-red-100 text-red-700' : opt.priorite === 'moyenne' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                {opt.priorite}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prêts aidés */}
                  <div className="bg-white rounded-xl border p-4">
                    <h3 className="font-bold text-gray-900 mb-4">Prêts aidés - Éligibilité</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {pretsEligibles.map(p => (
                        <div key={p.type} className={`rounded-lg p-3 border ${p.eligible ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {p.eligible ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                            <span className={`font-medium ${p.eligible ? 'text-green-700' : 'text-gray-500'}`}>{p.nom}</span>
                          </div>
                          {p.eligible ? (
                            <div className="text-sm text-green-600">Montant max: {fmtEur(p.montantMax)}</div>
                          ) : (
                            <div className="text-xs text-gray-400">{p.raisons.join(', ')}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Aides locales */}
                  {aidesLocales.length > 0 && (
                    <div className="bg-white rounded-xl border p-4">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-purple-600" /> Aides locales disponibles</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aidesLocales.map((aide, i) => (
                          <div key={i} className="rounded-lg p-3 border bg-purple-50 border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-purple-700">{aide.nom}</span>
                            </div>
                            {aide.organisme && <div className="text-xs text-purple-500 mb-1">{aide.organisme}</div>}
                            <div className="text-sm text-purple-600">Montant max: {fmtEur(aide.montantMax)}</div>
                            {aide.conditions && aide.conditions.length > 0 && (
                              <div className="text-xs text-purple-400 mt-1">{aide.conditions.slice(0, 2).join(' • ')}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Documents */}
              {activeResultTab === 'documents' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border p-4">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FileCheck className="w-5 h-5 text-blue-600" /> Documents requis pour le dossier</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documentsRequis.map((cat, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="font-medium text-gray-800 mb-2">{cat.categorie}</h4>
                          <ul className="space-y-1">
                            {cat.documents.map((doc, j) => (
                              <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-gray-400 mt-0.5">•</span>
                                {doc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Avis risque */}
              {activeResultTab === 'avis' && (
                <div className="space-y-4">
                  <div className={`rounded-xl border-2 p-6 ${avisRisque.niveau === 'excellent' ? 'bg-green-50 border-green-300' : avisRisque.niveau === 'bon' ? 'bg-blue-50 border-blue-300' : avisRisque.niveau === 'moyen' ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-300'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Avis risque: {avisRisque.niveau.toUpperCase()}</h3>
                        <p className="text-gray-600">Score global: {avisRisque.score}/100</p>
                      </div>
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${avisRisque.niveau === 'excellent' ? 'bg-green-200 text-green-700' : avisRisque.niveau === 'bon' ? 'bg-blue-200 text-blue-700' : avisRisque.niveau === 'moyen' ? 'bg-amber-200 text-amber-700' : 'bg-red-200 text-red-700'}`}>
                        {avisRisque.score}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Points forts */}
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Points forts</h4>
                        <ul className="space-y-1">
                          {avisRisque.points.map((p, i) => (
                            <li key={i} className="text-sm text-green-600 flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{p}
                            </li>
                          ))}
                          {avisRisque.points.length === 0 && <li className="text-sm text-gray-400 italic">Aucun</li>}
                        </ul>
                      </div>
                      
                      {/* Alertes */}
                      <div className="bg-white rounded-lg p-4 border border-amber-200">
                        <h4 className="font-medium text-amber-700 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Points d'attention</h4>
                        <ul className="space-y-1">
                          {avisRisque.alertes.map((a, i) => (
                            <li key={i} className="text-sm text-amber-600 flex items-start gap-2">
                              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />{a}
                            </li>
                          ))}
                          {avisRisque.alertes.length === 0 && <li className="text-sm text-gray-400 italic">Aucun</li>}
                        </ul>
                      </div>
                      
                      {/* Bloquants */}
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2"><XCircle className="w-4 h-4" /> Points bloquants</h4>
                        <ul className="space-y-1">
                          {avisRisque.bloquants.map((b, i) => (
                            <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                              <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{b}
                            </li>
                          ))}
                          {avisRisque.bloquants.length === 0 && <li className="text-sm text-gray-400 italic">Aucun</li>}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Synthèse motivée */}
                  <div className="bg-white rounded-xl border p-4">
                    <h3 className="font-bold text-gray-900 mb-3">Synthèse motivée</h3>
                    <div className="prose prose-sm text-gray-600">
                      <p>
                        {avisRisque.niveau === 'excellent' && 'Dossier de très bonne qualité. Tous les indicateurs sont au vert avec une marge de sécurité confortable. Le financement devrait être accordé sans difficulté par la majorité des établissements bancaires.'}
                        {avisRisque.niveau === 'bon' && 'Dossier solide avec des fondamentaux corrects. Les critères HCSF sont respectés et la situation financière est stable. Le dossier peut être présenté en confiance aux banques.'}
                        {avisRisque.niveau === 'moyen' && 'Dossier acceptable mais présentant quelques points de vigilance. Il sera important de soigner la présentation et de mettre en avant les éléments positifs. Certaines banques pourraient demander des garanties supplémentaires.'}
                        {avisRisque.niveau === 'difficile' && 'Dossier fragile nécessitant un travail d\'optimisation. Les points d\'attention sont nombreux et certains établissements refuseront le financement en l\'état. Il est recommandé de travailler sur les pistes d\'amélioration proposées.'}
                        {avisRisque.niveau === 'bloquant' && 'Le dossier présente un ou plusieurs critères bloquants qui empêchent le financement en l\'état actuel. Il est impératif de revoir le projet ou la situation financière avant de solliciter les banques.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SimulatorGate>
  )
}

export default CapaciteEmpruntPage
