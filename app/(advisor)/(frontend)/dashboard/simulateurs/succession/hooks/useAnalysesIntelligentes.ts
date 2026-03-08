import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';

interface AnalysesConfig {
  doubleDeces: boolean;
  comparatifDDV: boolean;
  optimisationsChiffrees: boolean;
  intelligenceFiscale: boolean;
  demembrement: boolean;
}

interface AnalysesData {
  resultatsBase: any;
  patrimoine?: any;
  alertes?: any[];
  doubleDeces?: any;
  comparatifDDV?: any;
  optimisations?: any;
  intelligenceFiscale?: any;
  demembrement?: any;
  aiRecommendations?: any[];
  metadata?: any;
  scenario1?: any;
  scenario2?: any;
  narrativeReport?: string | null;
  narrativeGeneratedAt?: string | null;
  resultatInverse?: any; // Full inverse scenario results (mode couple: spouse dies first)
}

export function useAnalysesIntelligentes(simulationData: any) {
  const [data, setData] = useState<AnalysesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<AnalysesConfig>({
    doubleDeces: false,
    comparatifDDV: false,
    optimisationsChiffrees: false,
    intelligenceFiscale: false,
    demembrement: false
  });

  const simulationKey = useMemo(() => JSON.stringify(simulationData ?? null), [simulationData]);

  // Détermine quelles analyses sont pertinentes
  const determinerAnalyses = (data: any): AnalysesConfig => {
    const statut = data.statut_matrimonial?.toLowerCase();
    const estCouple = statut === 'marié' || statut === 'marie' || statut === 'pacsé' || statut === 'pacse';
    const estMarie = statut === 'marié' || statut === 'marie';
    const aEnfants = data.nombre_enfants > 0;
    const patrimoineNet = data.patrimoine_net_total || 0;
    const ageDefunt = data.age_defunt || data.identite?.age || 65;

    return {
      // Double décès : Si couple avec patrimoine significatif
      doubleDeces: estCouple && patrimoineNet > 100000,
      
      // Comparatif DDV : Si marié uniquement
      comparatifDDV: estMarie && patrimoineNet > 100000,
      
      // Optimisations chiffrées : Toujours utile si patrimoine > 100k
      optimisationsChiffrees: patrimoineNet > 100000,
      
      // Intelligence fiscale : Toujours utile (analyse globale)
      intelligenceFiscale: true,
      
      // Démembrement : Si couple avec enfants et patrimoine > 200k
      demembrement: estCouple && aEnfants && patrimoineNet > 200000 && ageDefunt < 80
    };
  };

  const fetchAnalyses = useCallback(async () => {
    if (!simulationData) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const analyses = determinerAnalyses(simulationData);
      setConfig(prev => JSON.stringify(prev) === JSON.stringify(analyses) ? prev : analyses);

      const results: AnalysesData = {
        resultatsBase: null,
        narrativeReport: null,
        narrativeGeneratedAt: null
      };

      // 1. Résultats de base (toujours)
      const baseResponse = await api.post('/resultats-complets', simulationData);
      const baseData = baseResponse.data || {};
      results.resultatsBase = baseData;
      results.metadata = baseData.metadata ?? null;
      results.patrimoine = baseData.patrimoine ?? null;
      results.scenario1 = baseData.scenario1 ?? null;
      results.scenario2 = baseData.scenario2 ?? null;
      results.optimisations = baseData.optimisations ?? null;
      results.alertes = baseData.alertes ?? null;
      results.resultatInverse = baseData.resultatInverse ?? null;

      // 2. Double décès (si couple)
      if (analyses.doubleDeces) {
        try {
          const ddResponse = await api.post('/analyses/double-deces', simulationData);
          results.doubleDeces = ddResponse.data.resultat || ddResponse.data;
        } catch (err) {
          console.warn('Double décès non disponible:', err);
        }
      }

      // 3. Comparatif DDV (si marié)
      if (analyses.comparatifDDV) {
        try {
          const ddvResponse = await api.post('/ddv/calculer-toutes-options', simulationData);
          results.comparatifDDV = ddvResponse.data.resultats || ddvResponse.data;
        } catch (err) {
          console.warn('Comparatif DDV non disponible:', err);
        }
      }

      // 4. Optimisations chiffrées
      if (analyses.optimisationsChiffrees) {
        try {
          const optResponse = await api.post('/analyses/optimisations-chiffrees', simulationData);
          results.optimisations = optResponse.data.resultat || optResponse.data;
        } catch (err) {
          console.warn('Optimisations non disponibles:', err);
        }
      }

      // 5. Intelligence fiscale (analyse globale)
      if (analyses.intelligenceFiscale) {
        try {
          const ifResponse = await api.post('/analyses/intelligence-fiscale', simulationData);
          results.intelligenceFiscale = ifResponse.data.analyse || ifResponse.data;
        } catch (err) {
          console.warn('Intelligence fiscale non disponible:', err);
        }
      }

      // 6. Recommandations IA / Rapport narratif
      // Non transposés dans les routes CRM succession-smp pour l'instant.
      results.aiRecommendations = [];
      results.narrativeReport = null;
      results.narrativeGeneratedAt = null;

      // 8. Démembrement
      if (analyses.demembrement && simulationData.age_defunt) {
        try {
          const demResponse = await api.post('/notarial/demembrement', {
            ageUsufruitier: simulationData.age_conjoint_survivant || 65,
            valeurPatrimoine: simulationData.patrimoine_net_total
          });
          results.demembrement = demResponse.data;
        } catch (err) {
          console.warn('Démembrement non disponible:', err);
        }
      }

      setData(results);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Erreur lors de la récupération des analyses:', err);
    } finally {
      setLoading(false);
    }
  }, [simulationKey]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const refresh = useCallback(() => fetchAnalyses(), [fetchAnalyses]);

  return { data, loading, error, config, refresh };
}
