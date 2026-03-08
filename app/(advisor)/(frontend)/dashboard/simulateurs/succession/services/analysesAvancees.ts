import api from '../utils/api';

/**
 * 🧠 SERVICE ANALYSES AVANCÉES
 * 
 * Appels aux 4 nouveaux endpoints backend fusionnés
 */

export interface IntelligenceFiscaleRequest {
  statut_matrimonial: string;
  regime_matrimonial?: string;
  nombre_enfants: number;
  enfants_tous_communs?: boolean;
  age_defunt?: number;
  age_conjoint_survivant?: number;
  patrimoine_net_total: number;
  presence_assurance_vie?: boolean;
  presence_donations?: boolean;
  presence_residence_principale?: boolean;
  valeur_residence_principale?: number;
  
  // Pour double décès M/Mme
  sexe_defunt?: 'M' | 'F';
  prenom_defunt?: string;
  prenom_conjoint?: string;
  patrimoine_propre_defunt?: number;
  patrimoine_propre_conjoint?: number;
  patrimoine_commun?: number;
}

export interface IntelligenceFiscaleResponse {
  succes: boolean;
  analyse: {
    dateAnalyse: string;
    profilClient: {
      statutMatrimonial: string;
      nbEnfants: number;
      patrimoineNet: number;
      ageDefunt?: number;
      ageConjoint?: number;
      categorie: string;
      aAssuranceVie: boolean;
      aDonations: boolean;
    };
    analyseDoubleDeces?: {
      applicable: boolean;
      raison?: string;
      scenarioMonsieurPremier?: any;
      scenarioMadamePremiere?: any;
      comparaison?: any;
      recommandation?: string;
      economiePotentielle?: number;
    };
    comparaisonAbIntestatDDV?: {
      applicable: boolean;
      raison?: string;
      scenariosAbIntestat?: any[];
      scenariosDDV?: any[];
      analyseComparative?: any;
    };
    optimisationsPatrimoniales: {
      situationActuelle: {
        patrimoineNet: number;
        droitsSuccessionEstimes: number;
        commentaire: string;
      };
      topAssuranceVie: any[];
      topDonations: any[];
      topDemembrement: any[];
      classementGeneral: Array<{
        type: string;
        descriptif: string;
        economieReelle: number;
        priorite: string;
        recommandation: string;
      }>;
      meilleureOpportunite?: any;
      economieMaximale?: number;
    };
    strategieOptimale: {
      etapes: Array<{
        numero: number;
        type: string;
        titre: string;
        description: string;
        economie: number;
        priorite: string;
      }>;
      nombreEtapes: number;
      resumeExecutif: string;
    };
    economiesPrevisionnelles: {
      economieDoubleDeces: number;
      economieChoixStructurel: number;
      economieOptimisations: number;
      economieTotaleEstimee: number;
      tauxOptimisation: number;
    };
  };
  dureeCalculMs: number;
  timestamp: string;
}

export interface DoubleDecesResponse {
  succes: boolean;
  resultat: {
    scenarioMonsieurPremier: {
      ordreDecesDescription: string;
      premierDeces: any;
      secondDeces: any;
      droitsTotauxScenario: number;
      patrimoineNetTransmisEnfants: number;
      tauxFiscalEffectifGlobal: number;
    };
    scenarioMadamePremiere: {
      ordreDecesDescription: string;
      premierDeces: any;
      secondDeces: any;
      droitsTotauxScenario: number;
      patrimoineNetTransmisEnfants: number;
      tauxFiscalEffectifGlobal: number;
    };
    comparaisonFiscale: {
      scenarioOptimal: 'A' | 'B' | 'EGAL';
      droitsTotauxScenarioA: number;
      droitsTotauxScenarioB: number;
      ecartFiscalAbsolu: number;
      economieFiscale: number;
      recommandation: string;
    };
    erreur?: string;
  };
  dureeCalculMs: number;
}

export interface OptimisationsChiffreesResponse {
  succes: boolean;
  resultat: {
    situationActuelle: {
      patrimoineNet: number;
      droitsSuccessionEstimes: number;
      commentaire: string;
    };
    simulationsAssuranceVie: any[];
    simulationsDonations: any[];
    simulationsDemembrement: any[];
    optimisationsClassees: any[];
  };
  nombreSimulations: number;
  dureeCalculMs: number;
}

export interface ComparaisonScenariosResponse {
  succes: boolean;
  resultat: {
    scenariosAbIntestat: any[];
    scenariosDDV: any[];
    analyseComparative: {
      scenarioOptimal: string;
      optionOptimale?: string;
      descriptifOptimal?: string;
      droitsOptimaux: number;
      economieVsAbIntestat?: number;
      economieVsDDV?: number;
      recommandation: string;
    };
    erreur?: string;
  };
  nombreScenariosAnalyses: number;
  dureeCalculMs: number;
}

/**
 * 🧠 INTELLIGENCE FISCALE - Analyse IA complète
 */
export async function appelIntelligenceFiscale(
  donnees: IntelligenceFiscaleRequest | any
): Promise<IntelligenceFiscaleResponse> {
  // Support both old format (IntelligenceFiscaleRequest) and new format (simulationData wrapper)
  const payload = donnees.simulationData ? donnees : { simulationData: donnees };
  const response = await api.post('/analyses/intelligence-fiscale', payload);
  return response.data;
}

/**
 * 💑 DOUBLE DÉCÈS - Comparaison M/Mme inversé
 */
export async function appelDoubleDeces(
  donnees: IntelligenceFiscaleRequest | any
): Promise<DoubleDecesResponse> {
  // Support both old format (IntelligenceFiscaleRequest) and new format (simulationData wrapper)
  const payload = donnees.simulationData ? donnees : { simulationData: donnees };
  const response = await api.post('/analyses/double-deces', payload);
  return response.data;
}

/**
 * 🎯 OPTIMISATIONS CHIFFRÉES - Top optimisations AV/donations/démembrement
 */
export async function appelOptimisationsChiffrees(
  donnees: IntelligenceFiscaleRequest | any
): Promise<OptimisationsChiffreesResponse> {
  // Support both old format (IntelligenceFiscaleRequest) and new format (simulationData wrapper)
  const payload = donnees.simulationData ? donnees : { simulationData: donnees };
  const response = await api.post('/analyses/optimisations-chiffrees', payload);
  return response.data;
}

/**
 * ⚖️ COMPARAISON SCÉNARIOS - Ab intestat vs DDV exhaustif
 */
export async function appelComparaisonScenarios(
  donnees: IntelligenceFiscaleRequest | any
): Promise<ComparaisonScenariosResponse> {
  // Support both old format (IntelligenceFiscaleRequest) and new format (simulationData wrapper)
  const payload = donnees.simulationData ? donnees : { simulationData: donnees };
  const response = await api.post('/analyses/comparaison-scenarios', payload);
  return response.data;
}

/**
 * 🔄 HELPER - Mapper SimulationData vers format API analyses
 */
export function mapSimulationToAnalysesRequest(simulationData: any): IntelligenceFiscaleRequest {
  // Calcul patrimoine net (actifs - dettes)
  const actifs = Array.isArray(simulationData?.actifs) ? simulationData.actifs : [];
  const totalActifs = actifs.reduce((sum: number, a: any) => sum + Number(a?.valeur || 0), 0);
  const dettes = Number(simulationData?.dettes_totales || 0);
  const patrimoineNet = totalActifs - dettes;

  // Enfants tous communs ?
  const enfants = Array.isArray(simulationData?.enfants) ? simulationData.enfants : [];
  const enfantsTousCommuns = enfants.length > 0 && 
    enfants.every((e: any) => e?.communAvecConjoint === true);

  // Patrimoines propres pour double décès
  const patrimoinePropreDefunt = Number(simulationData?.patrimoine_propre_defunt || 0);
  const patrimoinePropreConjoint = Number(simulationData?.patrimoine_propre_conjoint || 0);
  const patrimoineCommun = Number(simulationData?.patrimoine_couple_mariage || 0);

  return {
    statut_matrimonial: simulationData?.statut_matrimonial || 'célibataire',
    regime_matrimonial: simulationData?.conjoint?.regimeMatrimonial || 'communauté_reduite',
    nombre_enfants: Number(simulationData?.nombre_enfants || 0),
    enfants_tous_communs: enfantsTousCommuns,
    age_defunt: simulationData?.identite?.age || undefined,
    age_conjoint_survivant: simulationData?.conjoint?.age || undefined,
    patrimoine_net_total: patrimoineNet,
    presence_assurance_vie: simulationData?.presence_assurance_vie || false,
    presence_donations: simulationData?.presence_donations || false,
    presence_residence_principale: simulationData?.presence_residence_principale || false,
    valeur_residence_principale: Number(simulationData?.valeur_residence_principale || 0),
    
    // Données double décès M/Mme
    sexe_defunt: simulationData?.identite?.sexe || undefined,
    prenom_defunt: simulationData?.identite?.prenom || undefined,
    prenom_conjoint: simulationData?.conjoint?.prenom || undefined,
    patrimoine_propre_defunt: patrimoinePropreDefunt > 0 ? patrimoinePropreDefunt : undefined,
    patrimoine_propre_conjoint: patrimoinePropreConjoint > 0 ? patrimoinePropreConjoint : undefined,
    patrimoine_commun: patrimoineCommun > 0 ? patrimoineCommun : undefined,
  };
}
