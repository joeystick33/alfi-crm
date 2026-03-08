import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import api from '../utils/api';
import { resolveAgeConjoint, isUsufruitOption } from '../utils/ddv';
import {
  buildSuccessionPayload,
  buildNotarialRequestDTO,
  mapStatutToEnum,
  buildHeritiers,
  normalizeStatut,
} from './payloadBuilders';
import {
  appelIntelligenceFiscale,
  appelDoubleDeces,
  appelOptimisationsChiffrees,
  appelComparaisonScenarios,
  mapSimulationToAnalysesRequest
} from '../services/analysesAvancees';
import type { 
  Personne, 
  TypePersonne, 
  ContratAVReference, 
  DonationReference, 
  LegsReference 
} from '../types/personne';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

import type {
  NotarialResultDTO,
  OptionDonationDernierVivant,
  StatutMatrimonial,
  HeritierNotarialDTO,
  ResidencePrincipaleDTO,
  IdentiteDC,
  ConjointPartenaire,
  Enfant,
  ParentInfo,
  FrereSoeurInfo,
  PatrimoineActifDTO,
  DonationFront,
  LegParticulierFront,
  ContratAV,
} from './types';

export interface ScenarioSnapshot {
  id: string;
  nom: string;
  creeLe: string;
  optionDDV?: string | null;
  droitsTotaux?: number;
  patrimoineNet?: number;
  netTransmis?: number;
  simulation: SimulationData;
  notarialResult: NotarialResultDTO | null;
  ddvResult: any | null;
  demembrement: any | null;
}

export interface ScenarioSnapshotPayload {
  nom: string;
  creeLe: string;
  optionDDV?: string | null;
  droitsTotaux?: number;
  patrimoineNet?: number;
  netTransmis?: number;
  simulation: SimulationData;
  notarialResult: NotarialResultDTO | null;
  ddvResult: any | null;
  demembrement: any | null;
}

export interface SimulationData {
  personnesRegistry: Personne[];
  identite_id: string; // Référence au registre
  conjoint_id?: string; // Référence au registre
  enfants_ids: string[]; // Références au registre
  
  identite: IdentiteDC;

  statut_matrimonial: 'marié' | 'pacsé' | 'concubinage' | 'célibataire' | null;

  conjoint: ConjointPartenaire;

  nombre_enfants: number;
  enfants: Enfant[];
  enfants_tous_communs?: boolean;

  parents_defunt: { pere: ParentInfo; mere: ParentInfo };
  fratrie_defunt: FrereSoeurInfo[];
  parents_partenaire?: { pere: ParentInfo; mere: ParentInfo } | null;
  fratrie_partenaire?: FrereSoeurInfo[] | null;

  mode_patrimoine: 'DETAILLE';
  patrimoine_net_total: number;
  presence_residence_principale: boolean;
  valeur_residence_principale: number;
  residence_occupation_conjoint: boolean;
  residence_occupation_enfant_mineur: boolean;
  actifs: PatrimoineActifDTO[];
  dettes_totales?: number;

  patrimoine_propre_defunt?: number;
  patrimoine_propre_conjoint?: number;

  presence_assurance_vie: boolean;
  nombre_contrats_av?: number;
  contrats_av?: ContratAV[];

  presence_donations: boolean;
  donations: DonationFront[];
  presence_legs_particuliers: boolean;
  legs_particuliers: LegParticulierFront[];
  testament_partenaire?: boolean;
  type_legs_partenaire?: 'QUOTITE_DISPONIBLE' | 'PLEINE_PROPRIETE' | 'USUFRUIT_RP' | 'USUFRUIT_GENERAL' | null;

  presence_ddv?: boolean;
  option_ddv?: 'TOTALITE_USUFRUIT' | 'QUOTITE_DISPONIBLE_PP' | 'QUART_PP_TROIS_QUARTS_USUFRUIT' | 'QUART_PP' | null;
  age_conjoint_usufruit?: number | null;

  date_deces?: string | null;

  mode_couple?: boolean;
}

export interface AdvisorProfile {
  prenom: string;
  nom: string;
  cabinetNom: string;
  email: string;
  telephone: string;
  siteWeb: string;
}

export interface SuccessionStoreState {
  simulationData: SimulationData;

  advisorProfile: AdvisorProfile;

  notarialAbIntestatQuarterPPResult: NotarialResultDTO | null;
  notarialAbIntestatUsufruitResult: NotarialResultDTO | null;
  notarialDDVResult: NotarialResultDTO | null;
  ddvOptionSimulee: OptionDonationDernierVivant | null;

  abIntestatUsufruitEligible: boolean | null;
  abIntestatUsufruitEligibilityReason: string | null;

  avResult: any | null;

  intelligenceFiscaleResult: any | null;
  doubleDecesResult: any | null;
  optimisationsChiffreesResult: any | null;
  comparaisonScenariosResult: any | null;
  ddvCompletResult: any | null;
  scenarioSnapshots: ScenarioSnapshot[];
  analysesLoading: boolean;
  analysesError: string | null;

  isLoading: boolean;
  error: string | null;

  updateSimulationData: (patch: Partial<SimulationData>) => void;
  updateAdvisorProfile: (patch: Partial<AdvisorProfile>) => void;
  resetSimulation: () => void;

  calculateAbIntestatQuarterPP: () => Promise<NotarialResultDTO>;
  calculateAbIntestatUsufruit: () => Promise<NotarialResultDTO | { eligible: false; reason: string }>;
  calculateAbIntestatBoth: () => Promise<{ quarter: NotarialResultDTO; usuf: NotarialResultDTO | null }>;
  calculateDDVScenario: (opt: OptionDonationDernierVivant) => Promise<NotarialResultDTO>;
  calculateSuccession: () => Promise<any>;

  lancerIntelligenceFiscale: () => Promise<void>;
  lancerDoubleDeces: () => Promise<void>;
  lancerOptimisationsChiffrees: () => Promise<void>;
  lancerComparaisonScenarios: () => Promise<void>;
  lancerToutesAnalyses: () => Promise<void>;

  enregistrerScenario: (payload: ScenarioSnapshotPayload) => void;
  supprimerScenario: (id: string) => void;
  viderScenarios: () => void;

  addPersonne: (personne: Omit<Personne, 'id' | 'createdAt' | 'updatedAt'>) => string;
  getPersonne: (id: string) => Personne | undefined;
  getPersonnesByType: (type: TypePersonne | TypePersonne[]) => Personne[];
  updatePersonne: (id: string, updates: Partial<Personne>) => void;
  deletePersonne: (id: string) => void;
}

const isNotarialResultDTO = (obj: any): obj is NotarialResultDTO => {
  return obj && typeof obj === 'object' && Array.isArray(obj.heritiers);
};

const isEligibleResponse = (obj: any): obj is { eligible: false; reason: string } => {
  return obj && 'eligible' in obj && obj.eligible === false;
};

// Helpers
const buildDDVRequestPayload = (sd: SimulationData) =>
  buildNotarialRequestDTO(sd, { ddvOption: null, conjointUsufruitAbIntestat: false });

const isAbIntestatUsufruitEligible = (sd: SimulationData): boolean => {
  const s = normalizeStatut(sd.statut_matrimonial);
  if (s !== 'marie') return false;
  const nb = Number(sd.nombre_enfants || 0);
  if (nb === 0) return false;
  const enfants = Array.isArray(sd.enfants) ? sd.enfants : [];
  if (enfants.length !== nb) return false;
  return enfants.every(e => e?.communAvecConjoint === true && e?.predecede !== true);
};

const validateBusinessRules = (sd: SimulationData): string[] => {
  const errors: string[] = [];
  const statut = (sd.statut_matrimonial || '').toLowerCase();

  if ((statut === 'marié' || statut === 'marie') && !sd.conjoint?.present) {
    errors.push("Le statut 'marié' impose de renseigner un conjoint présent.");
  }

  if ((statut === 'marié' || statut === 'marie' || statut === 'pacsé' || statut === 'pacs') && sd.conjoint?.present) {
    const ageConjoint = sd.conjoint.age ?? sd.age_conjoint_usufruit;
    if (ageConjoint == null || Number(ageConjoint) <= 0) {
      errors.push("L'âge du conjoint/partenaire est requis pour les calculs de protection (usufruit / DDV).");
    }
  }

  if (Array.isArray(sd.enfants)) {
    sd.enfants.forEach((enfant, idx) => {
      if ((statut === 'marié' || statut === 'marie') && enfant && enfant.communAvecConjoint === undefined) {
        errors.push(`L'enfant n°${idx + 1} nécessite de préciser s'il est commun avec le conjoint.`);
      }
      if (enfant?.predecede) {
        const reps = Array.isArray(enfant.representants) ? enfant.representants.filter(Boolean) : [];
        if (reps.length === 0) {
          errors.push(`L'enfant n°${idx + 1} est indiqué comme prédécédé : renseignez au moins un représentant (petit-enfant) pour établir la représentation.`);
        } else {
          reps.forEach((rep, repIdx) => {
            if (!rep?.prenom || rep.prenom.trim().length === 0) {
              errors.push(`Le représentant n°${repIdx + 1} de l'enfant n°${idx + 1} doit être identifié (prénom).`);
            }
          });
        }
      }
    });
  }

  if (sd.presence_assurance_vie && (!sd.contrats_av || sd.contrats_av.length === 0)) {
    errors.push("Des contrats d'assurance-vie doivent être renseignés lorsqu'une présence assurance-vie est cochée.");
  }

  if (Array.isArray(sd.actifs) && sd.actifs.some((actif) => (actif?.valeur ?? 0) < 0)) {
    errors.push("La valeur des actifs ne peut pas être négative.");
  }

  if ((sd.actifs?.length || 0) === 0 && (sd.patrimoine_net_total || 0) <= 0) {
    errors.push('Le patrimoine transmis doit contenir au moins un actif ou un montant net positif.');
  }

  if (Array.isArray(sd.fratrie_defunt)) {
    sd.fratrie_defunt.forEach((frereSoeur, idx) => {
      if (frereSoeur?.vivant === false) {
        const reps = Array.isArray(frereSoeur.representants) ? frereSoeur.representants.filter(Boolean) : [];
        if (reps.length === 0) {
          errors.push(`Le frère/sœur n°${idx + 1} est indiqué(e) comme prédécédé(e) : renseignez les représentants (neveux/nièces) pour la représentation.`);
        }
      }
    });
  }

  return errors;
};

const storeCreator: StateCreator<SuccessionStoreState> = (set, get) => ({
  simulationData: {
    personnesRegistry: [],
    identite_id: '',
    conjoint_id: undefined,
    enfants_ids: [],
    
    identite: { id: generateId(), nom: '', prenom: '', age: null, revenusMensuels: null },
    statut_matrimonial: null,
    conjoint: { 
      id: generateId(),
      present: false, 
      type: null, 
      prenom: '', 
      age: null, 
      regimeMatrimonial: null, 
      clauseAttributionIntegrale: false, 
      presenceDDV: false 
    },
    nombre_enfants: 0,
    enfants: [],
    enfants_tous_communs: true,
    parents_defunt: { 
      pere: { id: generateId(), vivant: false, prenom: '', age: null }, 
      mere: { id: generateId(), vivant: false, prenom: '', age: null } 
    },
    fratrie_defunt: [],
    parents_partenaire: { 
      pere: { id: generateId(), vivant: false, prenom: '', age: null }, 
      mere: { id: generateId(), vivant: false, prenom: '', age: null } 
    },
    fratrie_partenaire: [],
    mode_patrimoine: 'DETAILLE',
    patrimoine_net_total: 0,
    presence_residence_principale: false,
    valeur_residence_principale: 0,
    residence_occupation_conjoint: false,
    residence_occupation_enfant_mineur: false,
    actifs: [],
    presence_assurance_vie: false,
    nombre_contrats_av: 0,
    contrats_av: [],
    presence_donations: false,
    donations: [],
    presence_legs_particuliers: false,
    legs_particuliers: [],
    testament_partenaire: false,
    type_legs_partenaire: null,
    presence_ddv: false,
    option_ddv: null,
    age_conjoint_usufruit: null,
    date_deces: null,
  },

  advisorProfile: {
    prenom: '',
    nom: '',
    cabinetNom: '',
    email: '',
    telephone: '',
    siteWeb: '',
  },

  notarialAbIntestatQuarterPPResult: null,
  notarialAbIntestatUsufruitResult: null,
  notarialDDVResult: null,
  ddvOptionSimulee: null,
  abIntestatUsufruitEligible: null,
  abIntestatUsufruitEligibilityReason: null,
  avResult: null,

  intelligenceFiscaleResult: null,
  doubleDecesResult: null,
  optimisationsChiffreesResult: null,
  comparaisonScenariosResult: null,
  ddvCompletResult: null,
  scenarioSnapshots: [],
  analysesLoading: false,
  analysesError: null,

  isLoading: false,
  error: null,

  updateSimulationData: (patch) => set((st) => ({
    simulationData: { ...st.simulationData, ...patch },
    notarialAbIntestatQuarterPPResult: null,
    notarialAbIntestatUsufruitResult: null,
    notarialDDVResult: null,
    ddvOptionSimulee: null,
    abIntestatUsufruitEligible: null,
    abIntestatUsufruitEligibilityReason: null,
    avResult: null,
    error: null,
    scenarioSnapshots: [],
  })),

  updateAdvisorProfile: (patch) => set((st) => ({
    advisorProfile: { ...st.advisorProfile, ...patch },
  })),

  resetSimulation: () => set((st) => ({
    simulationData: {
      personnesRegistry: [],
      identite_id: '',
      conjoint_id: undefined,
      enfants_ids: [],
      
      identite: { id: generateId(), nom: '', prenom: '', age: null, revenusMensuels: null },
      statut_matrimonial: null,
      conjoint: { 
        id: generateId(),
        present: false, 
        type: null, 
        prenom: '', 
        age: null, 
        regimeMatrimonial: null, 
        clauseAttributionIntegrale: false, 
        presenceDDV: false 
      },
      nombre_enfants: 0,
      enfants: [],
      enfants_tous_communs: true,
      parents_defunt: { 
        pere: { id: generateId(), vivant: false, prenom: '', age: null }, 
        mere: { id: generateId(), vivant: false, prenom: '', age: null } 
      },
      fratrie_defunt: [],
      parents_partenaire: { 
        pere: { id: generateId(), vivant: false, prenom: '', age: null }, 
        mere: { id: generateId(), vivant: false, prenom: '', age: null } 
      },
      fratrie_partenaire: [],
      mode_patrimoine: 'DETAILLE',
      patrimoine_net_total: 0,
      presence_residence_principale: false,
      valeur_residence_principale: 0,
      residence_occupation_conjoint: false,
      residence_occupation_enfant_mineur: false,
      actifs: [],
      dettes_totales: 0,
      presence_assurance_vie: false,
      nombre_contrats_av: 0,
      contrats_av: [],
      presence_donations: false,
      donations: [],
      presence_legs_particuliers: false,
      legs_particuliers: [],
      testament_partenaire: false,
      type_legs_partenaire: null,
      presence_ddv: false,
      option_ddv: null,
      age_conjoint_usufruit: null,
      date_deces: null,
    },
    notarialAbIntestatQuarterPPResult: null,
    notarialAbIntestatUsufruitResult: null,
    notarialDDVResult: null,
    ddvOptionSimulee: null,
    abIntestatUsufruitEligible: null,
    abIntestatUsufruitEligibilityReason: null,
    avResult: null,
    intelligenceFiscaleResult: null,
    doubleDecesResult: null,
    optimisationsChiffreesResult: null,
    comparaisonScenariosResult: null,
    ddvCompletResult: null,
    scenarioSnapshots: [],
    isLoading: false,
    error: null,
  })),

  calculateAbIntestatQuarterPP: async () => {
    set({ isLoading: true, error: null });
    try {
      const sd = get().simulationData;
      const dto = buildNotarialRequestDTO(sd, { conjointUsufruitAbIntestat: false });
      const res = await api.post('/notarial/partage', dto);
      
      if (!isNotarialResultDTO(res.data)) {
        throw new Error('Format de réponse invalide');
      }
      
      set({ notarialAbIntestatQuarterPPResult: res.data, isLoading: false });
      return res.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erreur (ab intestat 1/4 PP)';
      console.error('[calculateAbIntestatQuarterPP]', msg, e);
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  calculateAbIntestatUsufruit: async () => {
    set({ isLoading: true, error: null });
    try {
      const sd = get().simulationData;
      if (!isAbIntestatUsufruitEligible(sd)) {
        const s = (sd.statut_matrimonial || '').toLowerCase();
        const nb = Number(sd.nombre_enfants || 0);
        let reason = "Option applicable uniquement si marié et enfants tous communs.";
        if (s !== 'marié' && s !== 'marie') reason = 'Option non éligible: statut non marié.';
        else if (nb === 0) reason = 'Option non éligible: aucun enfant (réservataires).';
        else reason = 'Option non éligible: enfants non tous communs.';
        set({ 
          notarialAbIntestatUsufruitResult: null, 
          abIntestatUsufruitEligible: false, 
          abIntestatUsufruitEligibilityReason: reason, 
          isLoading: false 
        });
        return { eligible: false, reason } as const;
      }
      const resolvedAge = resolveAgeConjoint(sd.conjoint?.age ?? null, sd.age_conjoint_usufruit ?? null);
      if (resolvedAge == null) {
        throw new Error("Âge du conjoint requis pour valoriser l'usufruit (ab intestat)");
      }
      const dto = buildNotarialRequestDTO(sd, { conjointUsufruitAbIntestat: true });
      const res = await api.post('/notarial/partage', dto);
      
      if (!isNotarialResultDTO(res.data)) {
        throw new Error('Format de réponse invalide');
      }
      
      set({ 
        notarialAbIntestatUsufruitResult: res.data, 
        abIntestatUsufruitEligible: true, 
        abIntestatUsufruitEligibilityReason: null, 
        isLoading: false 
      });
      return res.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erreur (ab intestat usufruit)';
      console.error('[calculateAbIntestatUsufruit]', msg, e);
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  calculateAbIntestatBoth: async () => {
    set({ isLoading: true, error: null });
    try {
      const quarter = await get().calculateAbIntestatQuarterPP();
      try {
        const usufResp = await get().calculateAbIntestatUsufruit();
        if (isEligibleResponse(usufResp)) {
          set({ isLoading: false });
          return { quarter, usuf: null };
        }
        set({ isLoading: false });
        return { quarter, usuf: usufResp as NotarialResultDTO };
      } catch {
        set({ isLoading: false });
        return { quarter, usuf: null };
      }
    } catch (e: any) {
      console.error('[calculateAbIntestatBoth]', e);
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  calculateDDVScenario: async (opt) => {
    set({ isLoading: true, error: null });
    try {
      const sd = get().simulationData;
      const s = (sd.statut_matrimonial || '').toLowerCase();
      if (s !== 'marié' && s !== 'marie') throw new Error('La DDV est réservée aux époux mariés.');
      const optionUsuf = isUsufruitOption(opt as any);
      const ageOk =
        (sd.conjoint?.age != null && !isNaN(Number(sd.conjoint.age))) ||
        (sd.age_conjoint_usufruit != null && !isNaN(Number(sd.age_conjoint_usufruit)));
      if (optionUsuf && !ageOk) {
        throw new Error("Âge du conjoint requis pour valoriser l'usufruit (DDV)");
      }
      const dto = buildNotarialRequestDTO(sd, { ddvOption: opt, conjointUsufruitAbIntestat: false });
      const res = await api.post('/notarial/partage', dto);
      
      if (!isNotarialResultDTO(res.data)) {
        throw new Error('Format de réponse invalide');
      }
      
      set({ notarialDDVResult: res.data, ddvOptionSimulee: opt, isLoading: false });
      return res.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erreur (DDV)';
      console.error('[calculateDDVScenario]', msg, e);
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  calculateSuccession: async () => {
    set({ isLoading: true, error: null });
    try {
      const sd = get().simulationData;
      const businessErrors = validateBusinessRules(sd);
      if (businessErrors.length > 0) {
        const message = businessErrors.join(' ');
        set({ error: message, isLoading: false });
        throw new Error(message);
      }

      const payload = buildSuccessionPayload(sd);

      // Validation: si donations présentes, date_deces requise
      if (payload.presence_donations && (!sd.date_deces || (sd.date_deces as any) === '')) {
        const msg = "Date du décès requise pour le rappel fiscal des donations (< 15 ans).";
        set({ isLoading: false, error: msg });
        throw new Error(msg);
      }

      const res = await api.post('/succession-simulation', payload);
      set({ avResult: res.data, isLoading: false });
      return res.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erreur calcul global';
      console.error('[calculateSuccession]', msg, e);
      set({ error: msg, isLoading: false });
      
      // ✅ Distinction erreurs client vs serveur
      if (e?.response?.status === 400) {
        return null; // Données invalides, OK de continuer
      }
      throw new Error(msg); // Erreur serveur, interrompre
    }
  },

  lancerIntelligenceFiscale: async () => {
    set({ analysesLoading: true, analysesError: null });
    try {
      const sd = get().simulationData;
      const request = mapSimulationToAnalysesRequest(sd);
      const response = await appelIntelligenceFiscale(request);
      set({ 
        intelligenceFiscaleResult: response.analyse,
        analysesLoading: false 
      });
    } catch (e: any) {
      const msg = e?.response?.data?.erreur || e?.message || 'Erreur Intelligence Fiscale';
      console.error('[lancerIntelligenceFiscale]', msg, e);
      set({ analysesError: msg, analysesLoading: false });
    }
  },

  lancerDoubleDeces: async () => {
    set({ analysesLoading: true, analysesError: null });
    try {
      const sd = get().simulationData;
      const request = mapSimulationToAnalysesRequest(sd);
      const response = await appelDoubleDeces(request);
      set({ 
        doubleDecesResult: response.resultat,
        analysesLoading: false 
      });
    } catch (e: any) {
      const msg = e?.response?.data?.erreur || e?.message || 'Erreur Double Décès';
      console.error('[lancerDoubleDeces]', msg, e);
      set({ analysesError: msg, analysesLoading: false });
    }
  },

  lancerOptimisationsChiffrees: async () => {
    set({ analysesLoading: true, analysesError: null });
    try {
      const sd = get().simulationData;
      const request = mapSimulationToAnalysesRequest(sd);
      const response = await appelOptimisationsChiffrees(request);
      set({ 
        optimisationsChiffreesResult: response.resultat,
        analysesLoading: false 
      });
    } catch (e: any) {
      const msg = e?.response?.data?.erreur || e?.message || 'Erreur Optimisations';
      console.error('[lancerOptimisationsChiffrees]', msg, e);
      set({ analysesError: msg, analysesLoading: false });
    }
  },

  lancerComparaisonScenarios: async () => {
    set({ analysesLoading: true, analysesError: null });
    try {
      const sd = get().simulationData;
      const request = mapSimulationToAnalysesRequest(sd);
      const response = await appelComparaisonScenarios(request);
      set({ 
        comparaisonScenariosResult: response.resultat,
        analysesLoading: false 
      });
    } catch (e: any) {
      const msg = e?.response?.data?.erreur || e?.message || 'Erreur Comparaison';
      console.error('[lancerComparaisonScenarios]', msg, e);
      set({ analysesError: msg, analysesLoading: false });
    }
  },

  lancerToutesAnalyses: async () => {
    set({ analysesLoading: true, analysesError: null });
    try {
      const sd = get().simulationData;
      const businessErrors = validateBusinessRules(sd);
      if (businessErrors.length > 0) {
        const message = businessErrors.join(' ');
        set({ analysesError: message, analysesLoading: false });
        throw new Error(message);
      }
      const request = mapSimulationToAnalysesRequest(sd);
      const ddvRequest = buildDDVRequestPayload(sd);
      
      const [intelligence, doubleDeces, optimisations, comparaison, ddvComplet] = await Promise.allSettled([
        appelIntelligenceFiscale(request),
        appelDoubleDeces(request),
        appelOptimisationsChiffrees(request),
        appelComparaisonScenarios(request),
        api.post('/ddv/calculer-toutes-options', ddvRequest),
      ]);

      set({
        intelligenceFiscaleResult: intelligence.status === 'fulfilled' ? intelligence.value.analyse : null,
        doubleDecesResult: doubleDeces.status === 'fulfilled' ? doubleDeces.value.resultat : null,
        optimisationsChiffreesResult: optimisations.status === 'fulfilled' ? optimisations.value.resultat : null,
        comparaisonScenariosResult: comparaison.status === 'fulfilled' ? comparaison.value.resultat : null,
        ddvCompletResult: ddvComplet.status === 'fulfilled' ? ddvComplet.value.data : null,
        analysesLoading: false,
      });

      const errors = [intelligence, doubleDeces, optimisations, comparaison, ddvComplet]
        .filter(r => r.status === 'rejected')
        .map((r: any) => r.reason?.message);
      
      if (errors.length > 0) {
        console.warn('[lancerToutesAnalyses] Certaines analyses ont échoué:', errors);
      }
    } catch (e: any) {
      const msg = e?.message || 'Erreur lors du lancement des analyses';
      console.error('[lancerToutesAnalyses]', msg, e);
      set({ analysesError: msg, analysesLoading: false });
    }
  },

  enregistrerScenario: (payload) => {
    // Fonction de clone avec fallback
    const deepClone = <T>(obj: T): T => {
      if (typeof structuredClone !== 'undefined') {
        return structuredClone(obj);
      }
      // Fallback pour navigateurs anciens
      return JSON.parse(JSON.stringify(obj));
    };

    const snapshot: ScenarioSnapshot = {
      id: `sc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      nom: payload.nom,
      creeLe: payload.creeLe,
      optionDDV: payload.optionDDV,
      droitsTotaux: payload.droitsTotaux,
      patrimoineNet: payload.patrimoineNet,
      netTransmis: payload.netTransmis,
      simulation: deepClone(payload.simulation),
      notarialResult: payload.notarialResult ? deepClone(payload.notarialResult) : null,
      ddvResult: payload.ddvResult ? deepClone(payload.ddvResult) : null,
      demembrement: payload.demembrement ? deepClone(payload.demembrement) : null,
    };
    set((state) => ({ scenarioSnapshots: [...state.scenarioSnapshots, snapshot] }));
  },

  supprimerScenario: (id) => {
    set((state) => ({ scenarioSnapshots: state.scenarioSnapshots.filter((sc) => sc.id !== id) }));
  },

  viderScenarios: () => {
    set({ scenarioSnapshots: [] });
  },

  addPersonne: (personne) => {
    const id = generateId();
    const now = new Date().toISOString();
    const nouvellePersonne: Personne = {
      ...personne,
      id,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      simulationData: {
        ...state.simulationData,
        personnesRegistry: [...state.simulationData.personnesRegistry, nouvellePersonne],
      },
    }));
    return id;
  },

  getPersonne: (id) => {
    const state = get();
    return state.simulationData.personnesRegistry.find((p) => p.id === id);
  },

  getPersonnesByType: (type) => {
    const state = get();
    const types = Array.isArray(type) ? type : [type];
    return state.simulationData.personnesRegistry.filter((p) => types.includes(p.type));
  },

  updatePersonne: (id, updates) => {
    const now = new Date().toISOString();
    set((state) => ({
      simulationData: {
        ...state.simulationData,
        personnesRegistry: state.simulationData.personnesRegistry.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: now } : p
        ),
      },
    }));
  },

  deletePersonne: (id) => {
    set((state) => ({
      simulationData: {
        ...state.simulationData,
        personnesRegistry: state.simulationData.personnesRegistry.filter((p) => p.id !== id),
        identite_id: state.simulationData.identite_id === id ? '' : state.simulationData.identite_id,
        conjoint_id: state.simulationData.conjoint_id === id ? undefined : state.simulationData.conjoint_id,
        enfants_ids: state.simulationData.enfants_ids.filter((eid) => eid !== id),
      },
    }));
  },
});

// ✅ CORRECTION: Version et migration pour persist
export const useSuccessionStore = create<SuccessionStoreState>()(
  persist(storeCreator, {
    name: 'succession-sim-data',
    version: 3,
    partialize: (st) => ({ 
      simulationData: st.simulationData,
      scenarioSnapshots: st.scenarioSnapshots,
      advisorProfile: st.advisorProfile,
    }),
    migrate: (persistedState: any, version: number) => {
      // Migration v0 -> v1 : Ajouter personnesRegistry si absent
      if (version === 0) {
        return {
          ...persistedState,
          simulationData: {
            ...persistedState.simulationData,
            personnesRegistry: persistedState.simulationData?.personnesRegistry || [],
          },
        };
      }
      // Migration v1 -> v2 : Reset fratrie_defunt car le Switch Chakra+register() 
      // ne sauvegardait pas vivant=false correctement (bug corrigé avec Controller)
      if (version === 1) {
        console.warn('[MIGRATION v1→v2] Reset fratrie_defunt (ancien bug Switch vivant)');
        return {
          ...persistedState,
          simulationData: {
            ...persistedState.simulationData,
            fratrie_defunt: [],
          },
        };
      }
      if (version === 2) {
        return {
          ...persistedState,
          advisorProfile: persistedState.advisorProfile || {
            prenom: '',
            nom: '',
            cabinetNom: '',
            email: '',
            telephone: '',
            siteWeb: '',
          },
        };
      }
      return persistedState;
    },
  })
);