// ✅ hooks/useRequireData.ts
// Hook personnalisé pour valider et rediriger si données manquantes

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../compat';
import { useSuccessionStore } from '../store/successionStore';
import { RAPPORT_CONFIG, MESSAGES, hasMinimalRequiredData } from '../pages/rapportConfig_and_types';

/**
 * Hook pour vérifier que les données requises sont présentes
 * et rediriger vers le simulateur sinon
 * 
 * @param redirectTo - Route de redirection (par défaut: /simulateur)
 * @returns boolean - true si les données sont valides
 * 
 * @example
 * const isValid = useRequireData('/simulateur');
 * if (!isValid) return <LoadingScreen />;
 */
export const useRequireData = (
  redirectTo: string = RAPPORT_CONFIG.ROUTES.SIMULATOR
): boolean => {
  const navigate = useNavigate();
  const toast = useToast();
  const { simulationData } = useSuccessionStore();
  const [isValid, setIsValid] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Vérifier si les données minimales sont présentes
    const hasData = hasMinimalRequiredData(simulationData);

    if (!hasData && !isRedirecting) {
      // Marquer comme en cours de redirection
      setIsRedirecting(true);
      setIsValid(false);

      // Afficher un toast informatif
      toast({
        title: MESSAGES.REDIRECT.MISSING_DATA,
        description: MESSAGES.REDIRECT.MISSING_DATA_DESCRIPTION,
        status: 'warning',
        duration: RAPPORT_CONFIG.TOAST_DURATION,
        isClosable: true,
        position: 'top',
      });

      // Redirection asynchrone avec setTimeout pour éviter les warnings React
      const timeoutId = setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, RAPPORT_CONFIG.REDIRECT_DELAY);

      // Cleanup
      return () => {
        clearTimeout(timeoutId);
      };
    }

    // Données valides
    if (hasData && !isValid) {
      setIsValid(true);
      setIsRedirecting(false);
    }
  }, [simulationData, navigate, redirectTo, toast, isRedirecting, isValid]);

  return isValid;
};

/**
 * Hook avancé avec plus de contrôle sur la redirection
 * 
 * @param options - Options de configuration
 * @returns Objet avec état de validation et fonctions de contrôle
 * 
 * @example
 * const { isValid, isRedirecting, cancelRedirect } = useRequireDataAdvanced({
 *   redirectTo: '/simulateur',
 *   showToast: true,
 *   delay: 1000
 * });
 */
export interface UseRequireDataAdvancedOptions {
  redirectTo?: string;
  showToast?: boolean;
  delay?: number;
  onRedirect?: () => void;
  onValidationFail?: () => void;
}

export interface UseRequireDataAdvancedReturn {
  isValid: boolean;
  isRedirecting: boolean;
  cancelRedirect: () => void;
  forceRedirect: () => void;
}

export const useRequireDataAdvanced = (
  options: UseRequireDataAdvancedOptions = {}
): UseRequireDataAdvancedReturn => {
  const {
    redirectTo = RAPPORT_CONFIG.ROUTES.SIMULATOR,
    showToast = true,
    delay = RAPPORT_CONFIG.REDIRECT_DELAY,
    onRedirect,
    onValidationFail,
  } = options;

  const navigate = useNavigate();
  const toast = useToast();
  const { simulationData } = useSuccessionStore();
  
  const [isValid, setIsValid] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Fonction pour annuler la redirection
  const cancelRedirect = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsRedirecting(false);
  }, [timeoutId]);

  // Fonction pour forcer la redirection
  const forceRedirect = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo, timeoutId]);

  useEffect(() => {
    const hasData = hasMinimalRequiredData(simulationData);

    if (!hasData && !isRedirecting) {
      setIsRedirecting(true);
      setIsValid(false);

      // Callback de validation échouée
      if (onValidationFail) {
        onValidationFail();
      }

      // Toast optionnel
      if (showToast) {
        toast({
          title: MESSAGES.REDIRECT.MISSING_DATA,
          description: MESSAGES.REDIRECT.MISSING_DATA_DESCRIPTION,
          status: 'warning',
          duration: RAPPORT_CONFIG.TOAST_DURATION,
          isClosable: true,
          position: 'top',
        });
      }

      // Redirection avec délai
      const id = setTimeout(() => {
        if (onRedirect) {
          onRedirect();
        }
        navigate(redirectTo, { replace: true });
      }, delay);

      setTimeoutId(id);

      return () => {
        clearTimeout(id);
      };
    }

    if (hasData && !isValid) {
      setIsValid(true);
      setIsRedirecting(false);
    }

    return undefined;
  }, [
    simulationData,
    navigate,
    redirectTo,
    toast,
    showToast,
    delay,
    isRedirecting,
    isValid,
    onRedirect,
    onValidationFail,
  ]);

  return {
    isValid,
    isRedirecting,
    cancelRedirect,
    forceRedirect,
  };
};

/**
 * Hook simple pour vérifier uniquement la présence des données
 * sans redirection automatique
 * 
 * @returns boolean - true si les données sont présentes
 * 
 * @example
 * const hasData = useHasRequiredData();
 * if (!hasData) {
 *   return <MissingDataMessage />;
 * }
 */
export const useHasRequiredData = (): boolean => {
  const { simulationData } = useSuccessionStore();
  return hasMinimalRequiredData(simulationData);
};

/**
 * Hook pour obtenir des informations détaillées sur l'état des données
 * 
 * @returns Objet avec informations détaillées
 * 
 * @example
 * const { hasData, missingFields, dataQuality } = useDataStatus();
 */
export interface DataStatus {
  hasData: boolean;
  hasIdentity: boolean;
  hasPrenom: boolean;
  missingFields: string[];
  dataQuality: 'complete' | 'partial' | 'missing';
}

export const useDataStatus = (): DataStatus => {
  const { simulationData } = useSuccessionStore();

  const hasIdentity = !!(simulationData && simulationData.identite);
  const hasPrenom = !!(hasIdentity && simulationData?.identite?.prenom);
  const hasData = hasMinimalRequiredData(simulationData);

  const missingFields: string[] = [];
  if (!hasIdentity) missingFields.push('identite');
  if (!hasPrenom) missingFields.push('prenom');

  let dataQuality: DataStatus['dataQuality'] = 'missing';
  if (hasData && missingFields.length === 0) {
    dataQuality = 'complete';
  } else if (hasIdentity) {
    dataQuality = 'partial';
  }

  return {
    hasData,
    hasIdentity,
    hasPrenom,
    missingFields,
    dataQuality,
  };
};
