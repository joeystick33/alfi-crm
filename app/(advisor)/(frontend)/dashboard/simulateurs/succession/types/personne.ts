/**
 * 👤 SYSTÈME DE REGISTRE PERSONNES
 * 
 * Chaque personne a un ID unique et est réutilisée dans tout le simulateur
 * (enfants, bénéficiaires AV, donations, legs, etc.)
 */

export type TypePersonne = 
  | 'DEFUNT' 
  | 'CONJOINT' 
  | 'ENFANT' 
  | 'PARENT' 
  | 'FRERE_SOEUR' 
  | 'AUTRE';

export type Sexe = 'M' | 'F';

export interface Personne {
  id: string; // UUID unique
  type: TypePersonne;
  prenom: string;
  nom?: string;
  age?: number;
  sexe?: Sexe;
  dateNaissance?: string;
  
  // Informations spécifiques selon le type
  lien?: string; // "Fils", "Fille", "Père", "Mère", "Frère", "Sœur", etc.
  communAvecConjoint?: boolean; // Pour enfants : enfant commun au couple ?
  predecede?: boolean; // Enfant prédécédé ?
  vivant?: boolean; // Pour parents : encore vivant ?
  
  // Informations patrimoniales (pour calcul double décès)
  patrimoinePropreEstime?: number;
  
  // Métadonnées
  createdAt?: string;
  updatedAt?: string;
}

export interface BeneficiaireReference {
  personne_id: string;
  part: number; // Pourcentage (0-100)
}

export interface DonationReference {
  id: string;
  beneficiaire_id: string;
  type: 'DON_MANUEL' | 'DONATION_NOTARIEE' | 'DONATION_PARTAGE';
  valeur: number;
  dateActe?: string;
  horsPart?: boolean;
}

export interface LegsReference {
  id: string;
  beneficiaire_id: string;
  valeur: number;
  type?: 'UNIVERSEL' | 'A_TITRE_UNIVERSEL' | 'PARTICULIER';
}

export interface ContratAVReference {
  id: string;
  valeur: number;
  dateOuverture?: string;
  versementsAvant70ans?: number;
  versementsApres70ans?: number;
  beneficiaires: BeneficiaireReference[];
}
