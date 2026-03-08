import { Landmark, ScrollText, Clock, TrendingUp, Home, CreditCard, Shield, Car, Briefcase, Building2 } from 'lucide-react'

export const CATEGORIES = [
  {
    id: 'PATRIMOINE',
    label: 'Patrimoine',
    icon: Landmark,
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    description: 'Gestion et structuration patrimoniale',
    types: [
      { value: 'BILAN_PATRIMONIAL', label: 'Bilan patrimonial', description: 'Analyse complète de la situation' },
      { value: 'RESTRUCTURATION_PATRIMOINE', label: 'Restructuration', description: 'Réorganisation du patrimoine' },
      { value: 'OPTIMISATION_FISCALE', label: 'Optimisation fiscale', description: 'Réduction de l\'impôt' },
      { value: 'AUDIT_FISCAL', label: 'Audit fiscal', description: 'Analyse fiscale' },
      { value: 'CREATION_SCI', label: 'Création SCI', description: 'Société Civile Immobilière' },
      { value: 'CREATION_HOLDING', label: 'Création Holding', description: 'Structure de détention' },
      { value: 'DIVORCE_SEPARATION', label: 'Divorce / Séparation', description: 'Accompagnement patrimonial' },
      { value: 'DONATION', label: 'Donation', description: 'Transmission anticipée' },
      { value: 'DEMEMBREMENT', label: 'Démembrement', description: 'Usufruit / Nue-propriété' },
      { value: 'PACTE_DUTREIL', label: 'Pacte Dutreil', description: 'Transmission d\'entreprise' },
    ]
  },
  {
    id: 'SUCCESSION',
    label: 'Succession',
    icon: ScrollText,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Préparation et règlement successoral',
    types: [
      { value: 'PREPARATION_SUCCESSION', label: 'Préparation succession', description: 'Anticipation et organisation' },
      { value: 'TESTAMENT', label: 'Testament', description: 'Rédaction et conseil' },
      { value: 'REGLEMENT_SUCCESSION', label: 'Règlement succession', description: 'Accompagnement des héritiers' },
      { value: 'ASSURANCE_DECES', label: 'Assurance décès', description: 'Protection des proches' },
      { value: 'CLAUSE_BENEFICIAIRE', label: 'Clause bénéficiaire', description: 'Rédaction et modification' },
    ]
  },
  {
    id: 'RETRAITE',
    label: 'Retraite',
    icon: Clock,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    description: 'Préparation et gestion retraite',
    types: [
      { value: 'BILAN_RETRAITE', label: 'Bilan retraite', description: 'Estimation des droits' },
      { value: 'OUVERTURE_PER', label: 'Ouverture PER', description: 'Plan Épargne Retraite' },
      { value: 'TRANSFERT_PER', label: 'Transfert PER', description: 'Changement de contrat' },
      { value: 'VERSEMENT_PER', label: 'Versement PER', description: 'Alimentation du plan' },
      { value: 'RACHAT_PER', label: 'Rachat PER', description: 'Déblocage anticipé' },
      { value: 'SORTIE_CAPITAL', label: 'Sortie en capital', description: 'Liquidation retraite' },
      { value: 'SORTIE_RENTE', label: 'Sortie en rente', description: 'Rente viagère' },
    ]
  },
  {
    id: 'INVESTISSEMENT',
    label: 'Investissement',
    icon: TrendingUp,
    color: 'bg-green-100 text-green-700 border-green-200',
    description: 'Placements financiers',
    types: [
      { value: 'SOUSCRIPTION_AV', label: 'Souscription Assurance-vie', description: 'Nouveau contrat AV' },
      { value: 'VERSEMENT_AV', label: 'Versement Assurance-vie', description: 'Alimentation AV' },
      { value: 'ARBITRAGE_AV', label: 'Arbitrage Assurance-vie', description: 'Changement de supports' },
      { value: 'RACHAT_AV', label: 'Rachat Assurance-vie', description: 'Retrait partiel/total' },
      { value: 'SOUSCRIPTION_PEA', label: 'Souscription PEA', description: 'Nouveau PEA' },
      { value: 'VERSEMENT_PEA', label: 'Versement PEA', description: 'Alimentation PEA' },
      { value: 'SOUSCRIPTION_CTO', label: 'Souscription Compte-titres', description: 'Nouveau CTO' },
      { value: 'SOUSCRIPTION_SCPI', label: 'Souscription SCPI', description: 'Parts de SCPI' },
      { value: 'VERSEMENT_SCPI', label: 'Versement SCPI', description: 'Versements programmés' },
      { value: 'PRIVATE_EQUITY', label: 'Private Equity', description: 'Capital investissement' },
    ]
  },
  {
    id: 'IMMOBILIER',
    label: 'Immobilier',
    icon: Home,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    description: 'Projets et investissements immobiliers',
    types: [
      { value: 'ACQUISITION_RP', label: 'Résidence principale', description: 'Achat RP' },
      { value: 'ACQUISITION_RS', label: 'Résidence secondaire', description: 'Achat RS' },
      { value: 'ACQUISITION_LOCATIF', label: 'Investissement locatif', description: 'Achat locatif' },
      { value: 'DEFISCALISATION_PINEL', label: 'Pinel', description: 'Défiscalisation Pinel' },
      { value: 'DEFISCALISATION_DENORMANDIE', label: 'Denormandie', description: 'Défiscalisation ancien' },
      { value: 'LMNP_LMP', label: 'LMNP / LMP', description: 'Location meublée' },
      { value: 'VENTE_IMMOBILIER', label: 'Vente immobilière', description: 'Cession de bien' },
      { value: 'TRAVAUX_RENOVATION', label: 'Travaux / Rénovation', description: 'Projets travaux' },
    ]
  },
  {
    id: 'CREDIT',
    label: 'Crédit',
    icon: CreditCard,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Financement et courtage crédit',
    types: [
      { value: 'CREDIT_IMMOBILIER', label: 'Crédit immobilier', description: 'Financement achat immo' },
      { value: 'RENEGOCIATION_CREDIT', label: 'Renégociation', description: 'Renégociation de taux' },
      { value: 'RACHAT_CREDIT', label: 'Rachat de crédit', description: 'Restructuration de dettes' },
      { value: 'PRET_RELAIS', label: 'Prêt relais', description: 'Financement transitoire' },
      { value: 'PRET_TRAVAUX', label: 'Prêt travaux', description: 'Financement travaux' },
      { value: 'CREDIT_CONSO', label: 'Crédit consommation', description: 'Prêt personnel' },
      { value: 'REGROUPEMENT_CREDITS', label: 'Regroupement crédits', description: 'Consolidation dettes' },
    ]
  },
  {
    id: 'ASSURANCE_PERSONNES',
    label: 'Assurance Personnes',
    icon: Shield,
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    description: 'Protection des personnes',
    types: [
      { value: 'PREVOYANCE_DECES', label: 'Prévoyance décès', description: 'Capital décès' },
      { value: 'PREVOYANCE_INCAPACITE', label: 'Prévoyance incapacité', description: 'Arrêt de travail' },
      { value: 'PREVOYANCE_INVALIDITE', label: 'Prévoyance invalidité', description: 'Rente invalidité' },
      { value: 'SANTE_MUTUELLE', label: 'Santé / Mutuelle', description: 'Complémentaire santé' },
      { value: 'DEPENDANCE', label: 'Dépendance', description: 'Perte d\'autonomie' },
      { value: 'ASSURANCE_EMPRUNTEUR', label: 'Assurance emprunteur', description: 'Couverture de prêt' },
      { value: 'GAV', label: 'GAV', description: 'Garantie Accidents de la Vie' },
    ]
  },
  {
    id: 'ASSURANCE_BIENS',
    label: 'Assurance Biens',
    icon: Car,
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    description: 'Protection des biens',
    types: [
      { value: 'ASSURANCE_HABITATION', label: 'Habitation', description: 'MRH locataire/proprio' },
      { value: 'ASSURANCE_PNO', label: 'PNO', description: 'Propriétaire non occupant' },
      { value: 'ASSURANCE_AUTO', label: 'Auto', description: 'Véhicule automobile' },
      { value: 'ASSURANCE_MOTO', label: 'Moto', description: 'Deux-roues' },
      { value: 'PROTECTION_JURIDIQUE', label: 'Protection juridique', description: 'Défense et recours' },
    ]
  },
  {
    id: 'ASSURANCE_PRO',
    label: 'Assurance Pro',
    icon: Briefcase,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Protection professionnelle',
    types: [
      { value: 'RC_PRO', label: 'RC Pro', description: 'Responsabilité civile pro' },
      { value: 'MULTIRISQUE_PRO', label: 'Multirisque Pro', description: 'Locaux et activité' },
      { value: 'DECENNALE', label: 'Décennale', description: 'Garantie décennale BTP' },
      { value: 'HOMME_CLE', label: 'Homme clé', description: 'Protection dirigeant' },
      { value: 'PREVOYANCE_TNS', label: 'Prévoyance TNS', description: 'Protection indépendant' },
      { value: 'SANTE_TNS', label: 'Santé TNS', description: 'Complémentaire santé TNS' },
      { value: 'RETRAITE_TNS', label: 'Retraite TNS', description: 'Madelin / PER' },
      { value: 'SANTE_COLLECTIVE', label: 'Santé collective', description: 'Mutuelle entreprise' },
      { value: 'PREVOYANCE_COLLECTIVE', label: 'Prévoyance collective', description: 'Prévoyance entreprise' },
    ]
  },
  {
    id: 'ENTREPRISE',
    label: 'Entreprise',
    icon: Building2,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: 'Conseil aux entreprises',
    types: [
      { value: 'CREATION_ENTREPRISE', label: 'Création entreprise', description: 'Accompagnement création' },
      { value: 'CESSION_ENTREPRISE', label: 'Cession entreprise', description: 'Vente d\'entreprise' },
      { value: 'TRANSMISSION_ENTREPRISE', label: 'Transmission entreprise', description: 'Transmission familiale' },
      { value: 'VALORISATION_ENTREPRISE', label: 'Valorisation', description: 'Estimation de valeur' },
    ]
  },
]
