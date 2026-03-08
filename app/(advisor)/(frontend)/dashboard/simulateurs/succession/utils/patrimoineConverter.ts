/**
 * 🔄 Convertisseur Frontend → Backend pour le Patrimoine
 * Assure la compatibilité entre l'interface moderne et l'API Java existante
 */

interface ActifFrontend {
  id: string;
  categorie: 'BIEN_COMMUN' | 'BIEN_PROPRE' | 'BIEN_INDIVISION' | 'BIEN_PROPRE_MONSIEUR' | 'BIEN_PROPRE_MADAME';
  type: 'IMMOBILIER' | 'MOBILIER' | 'FINANCIER' | 'PROFESSIONNEL';
  intitule: string;
  usage: string;
  nature?: string;
  valeur: number;
  dette_associee: boolean;
  montant_dette: number;
  montant_pret_initial?: number;
  organisme_preteur?: string;
  taux_interet?: number;
  duree_restante_mois?: number;
  mensualite?: number;
  date_fin?: string;
  quotite_defunt: number;
  quotite_conjoint: number;
}

import type { PatrimoineAssetType, PatrimoineConditionsDTO, PatrimoineActifDTO } from '../store/types';

interface ActifBackend {
  type: PatrimoineAssetType;
  valeur: number;
  libelle?: string;
  dette?: number;
  propriete?: string;
  conditions?: PatrimoineConditionsDTO;
}

/**
 * Mapping des types d'actifs Frontend → Backend
 */
const mapTypeToBackend = (type: string, usage: string, nature?: string): PatrimoineAssetType => {
  // Priorité à la "nature" si renseignée sur un bien immobilier
  if (type === 'IMMOBILIER' && nature) {
    switch (nature) {
      case 'MONUMENT_HISTORIQUE': return 'MONUMENT_HISTORIQUE';
      case 'BOIS_FORETS': return 'BOIS_FORETS';
      case 'BIENS_RURAUX_GFA': return 'BIENS_RURAUX_GFA';
    }
  }
  switch (type) {
    case 'IMMOBILIER':
      if (usage.toLowerCase().includes('principale')) return 'RESIDENCE_PRINCIPALE';
      if (usage.toLowerCase().includes('locatif')) return 'AUTRE';
      if (usage.toLowerCase().includes('secondaire')) return 'AUTRE';
      return 'AUTRE';
    
    case 'FINANCIER':
      if (usage.toLowerCase().includes('titres') || usage.toLowerCase().includes('actions')) {
        return 'TITRES_SOCIETE';
      }
      if (usage.toLowerCase().includes('agricole') || usage.toLowerCase().includes('gfa')) {
        return 'BIENS_RURAUX_GFA';
      }
      return 'AUTRE';
    
    case 'PROFESSIONNEL':
      return 'TITRES_SOCIETE';
    
    case 'MOBILIER':
      if (usage.toLowerCase().includes('art') || usage.toLowerCase().includes('œuvre')) {
        return 'OEUVRE_ART';
      }
      return 'AUTRE';
    
    default:
      return 'AUTRE';
  }
};

/**
 * Mapping des catégories Frontend → Backend
 */
const mapCategorieToBackend = (categorie: string): PatrimoineConditionsDTO['categorie'] => {
  switch (categorie) {
    case 'BIEN_COMMUN':
      return 'FINANCE_AUTRES'; // Géré par le régime matrimonial
    case 'BIEN_PROPRE':
      return 'AUTRE';
    case 'BIEN_INDIVISION':
      return 'AUTRE'; // Avec métadonnées indivision
    default:
      return 'AUTRE';
  }
};

/**
 * Maps categorie Frontend → propriete Backend enum.
 * The backend handles liquidation splitting — we send FULL values + ownership.
 */
const mapCategorieToProprieteBE = (categorie: string): string | undefined => {
  switch (categorie) {
    case 'BIEN_PROPRE_MONSIEUR':
    case 'BIEN_PROPRE':          // default own = deceased
      return 'PROPRE_CLIENT';
    case 'BIEN_PROPRE_MADAME':
      return 'PROPRE_CONJOINT';
    case 'BIEN_COMMUN':
      return 'COMMUN';
    case 'BIEN_INDIVISION':
      return 'INDIVISION';
    default:
      return undefined; // backend treats null as COMMUN
  }
};

/**
 * 🔧 Convertit un actif Frontend vers le format Backend
 *
 * IMPORTANT: envoie la valeur BRUTE complète + propriete.
 * Le backend (LiquidationRegimeService) gère la répartition propre / commun.
 * Ne PAS pré-réduire par quotite_defunt ici — cela causerait une double réduction.
 */
export const convertActifToBackend = (actif: ActifFrontend): ActifBackend => {
  const conditions: PatrimoineConditionsDTO = {
    categorie: mapCategorieToBackend(actif.categorie) || undefined,
    sousType: actif.usage,
    creditEnCours: actif.dette_associee,
    montantInitialPret: actif.dette_associee ? (actif.montant_pret_initial || undefined) : undefined,
    montantRestantDu: actif.dette_associee ? (actif.montant_dette || undefined) : undefined,
    tauxInteret: actif.dette_associee ? (actif.taux_interet || undefined) : undefined,
    dureeRestanteMois: actif.dette_associee ? (actif.duree_restante_mois || undefined) : undefined,
    mensualite: actif.dette_associee ? (actif.mensualite || undefined) : undefined,
    organismePreteur: actif.dette_associee ? (actif.organisme_preteur || undefined) : undefined,
    pourcentageDetention: actif.quotite_defunt,
    metadonnees: {
      intitule: actif.intitule,
      categorie_frontend: actif.categorie,
      type_frontend: actif.type,
      nature: actif.nature,
      quotite_conjoint: actif.quotite_conjoint,
      valeur_brute: actif.valeur,
      dette_totale: actif.montant_dette,
      date_fin_credit: actif.date_fin,
    },
  };

  return {
    type: mapTypeToBackend(actif.type, actif.usage, actif.nature),
    valeur: actif.valeur,                                   // FULL brut value — no quotite reduction
    libelle: actif.intitule,                                // top-level for AssetsRequestDto.label()
    dette: actif.dette_associee ? actif.montant_dette : 0,  // top-level for AssetsRequestDto.debt()
    propriete: mapCategorieToProprieteBE(actif.categorie),  // ownership for backend liquidation
    conditions,
  };
};

/**
 * 🔧 Convertit une liste d'actifs Frontend vers Backend
 *
 * NE PAS filtrer les biens du conjoint : le backend a besoin de TOUS les actifs
 * pour la liquidation du régime matrimonial et l'inversion couple (mode couple).
 * Le champ `propriete` indique au backend quel actif est propre / commun / conjoint.
 */
export const convertActifsToBackend = (actifs: ActifFrontend[]): PatrimoineActifDTO[] => {
  return actifs.map(convertActifToBackend);
};

/**
 * 🔧 Calcule le total des dettes à partir des actifs Frontend
 * Envoie le total BRUT — le backend sépare par ownership via LiquidationRegimeService.
 */
export const calculateDettesTotales = (actifs: ActifFrontend[]): number => {
  return actifs.reduce((total, actif) => {
    if (actif.dette_associee) {
      return total + actif.montant_dette;
    }
    return total;
  }, 0);
};

/**
 * 🔧 Convertit les données patrimoine complètes Frontend → Backend
 */
export const convertPatrimoineToBackend = (
  visionMode: 'SIMPLE' | 'DETAILLE',
  patrimoineSimple: number,
  actifsExpert: ActifFrontend[],
  residencePrincipale: {
    presence: boolean;
    valeur: number;
    occupation_conjoint: boolean;
    occupation_enfant_mineur: boolean;
  }
) => {
  const baseData = {
    mode_patrimoine: visionMode,
    presence_residence_principale: residencePrincipale.presence,
    valeur_residence_principale: residencePrincipale.valeur,
    residence_occupation_conjoint: residencePrincipale.occupation_conjoint,
    residence_occupation_enfant_mineur: residencePrincipale.occupation_enfant_mineur,
  };

  if (visionMode === 'SIMPLE') {
    return {
      ...baseData,
      patrimoine_net_total: patrimoineSimple,
      actifs: [],
      dettes_totales: 0,
    };
  } else {
    // Vision Expert
    const actifsBackend = convertActifsToBackend(actifsExpert);
    
    // En mode DETAILLE, patrimoine_net_total = 0 et dettes_totales = 0
    // pour forcer le recalcul backend depuis les actifs individuels.
    // Chaque actif porte sa propre dette + propriete → le backend
    // (HeritageCalculationService + buildLiquidation) calcule tout correctement.
    // Envoyer des valeurs non-nulles causerait un double-comptage des dettes.
    const patrimoineNetTotal = 0;
    const dettesTotales = 0;
    
    const out: { 
      mode_patrimoine: 'SIMPLE' | 'DETAILLE';
      patrimoine_net_total: number;
      actifs: PatrimoineActifDTO[];
      dettes_totales: number;
      presence_residence_principale: boolean;
      valeur_residence_principale: number;
      residence_occupation_conjoint: boolean;
      residence_occupation_enfant_mineur: boolean;
    } = {
      ...baseData,
      patrimoine_net_total: patrimoineNetTotal,
      actifs: actifsBackend,
      dettes_totales: dettesTotales,
    };
    return out;
  }
};

/**
 * 🔍 Valide les données avant conversion
 */
export const validatePatrimoineData = (
  visionMode: 'SIMPLE' | 'DETAILLE',
  patrimoineSimple: number,
  actifsExpert: ActifFrontend[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (visionMode === 'SIMPLE') {
    if (patrimoineSimple < 0) {
      errors.push('Le patrimoine net total ne peut pas être négatif');
    }
  } else {
    // Validation Vision Expert
    actifsExpert.forEach((actif, index) => {
      if (!actif.intitule.trim()) {
        errors.push(`L'actif ${index + 1} doit avoir un intitulé`);
      }
      
      if (actif.valeur <= 0) {
        errors.push(`L'actif "${actif.intitule}" doit avoir une valeur positive`);
      }
      
      if (actif.quotite_defunt < 0 || actif.quotite_defunt > 100) {
        errors.push(`La quotité du défunt pour "${actif.intitule}" doit être entre 0 et 100%`);
      }
      
      // Alerte si quotité = 0 SAUF pour biens propres du conjoint
      if (actif.quotite_defunt === 0 && actif.categorie !== 'BIEN_PROPRE_MADAME') {
        errors.push(`L'actif "${actif.intitule}" a une quotité défunt de 0% - il ne sera pas pris en compte dans la succession`);
      }
      
      if (actif.categorie === 'BIEN_COMMUN' && actif.quotite_defunt + actif.quotite_conjoint !== 100) {
        errors.push(`Les quotités pour "${actif.intitule}" doivent totaliser 100%`);
      }
      
      if (actif.dette_associee && actif.montant_dette <= 0) {
        errors.push(`Le montant de la dette pour "${actif.intitule}" doit être positif`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 📊 Calcule les statistiques du patrimoine Frontend
 */
export const calculatePatrimoineStats = (actifs: ActifFrontend[]) => {
  const stats = actifs.reduce(
    (acc, actif) => {
      const valeurBrute = actif.valeur;
      const detteBrute = actif.dette_associee ? actif.montant_dette : 0;

      acc.totalActifs += valeurBrute;
      acc.totalDettes += detteBrute;
      acc.patrimoineNet += valeurBrute - detteBrute;
      
      acc.repartition[actif.categorie] = (acc.repartition[actif.categorie] || 0) + valeurBrute;
      
      return acc;
    },
    {
      totalActifs: 0,
      totalDettes: 0,
      patrimoineNet: 0,
      repartition: {} as Record<string, number>,
    }
  );

  return stats;
};
