// ✅ constants/rapportConfig.ts
// Configuration centralisée pour le composant RapportProfessionnel

export const RAPPORT_CONFIG = {
  // Layout
  CONTAINER_MAX_WIDTH: '7xl',
  CONTAINER_PADDING_Y: 12,
  
  // Icons
  ICON_SIZE: '40px',
  
  // Routes
  ROUTES: {
    SIMULATOR: '/simulateur',
    RESULTS_OLD: '/resultats-ancien',
    RESULTS_NEW: '/resultats',
  },
  
  // Timings
  REDIRECT_DELAY: 0, // Immediate redirect
  TOAST_DURATION: 2000,
  
  // Alert
  ALERT_MAX_WIDTH: 'lg',
  ALERT_PADDING_Y: 8,
} as const;

// Liste des fonctionnalités prévues
export const FEATURES = [
  {
    id: 1,
    text: 'Rapport narratif professionnel avec analyse personnalisée',
    priority: 'high',
  },
  {
    id: 2,
    text: 'Graphiques interactifs (camemberts, barres, courbes)',
    priority: 'high',
  },
  {
    id: 3,
    text: "Score d'optimisation visuel",
    priority: 'medium',
  },
  {
    id: 4,
    text: 'Export PDF premium de 8+ pages',
    priority: 'high',
  },
  {
    id: 5,
    text: 'Plan d\'action priorisé avec impacts chiffrés',
    priority: 'medium',
  },
] as const;

// Messages utilisateur
export const MESSAGES = {
  CONSTRUCTION: {
    TITLE: 'Système de Rapport Professionnel en Intégration',
    DESCRIPTION: 'Le nouveau système de rapport professionnel avec graphiques interactifs, export PDF premium et analyse détaillée est en cours d\'intégration.',
    FEATURES_TITLE: 'Fonctionnalités prévues :',
    WAITING_MESSAGE: 'En attendant, utilisez la page de résultats existante.',
  },
  ERROR: {
    TITLE: 'Erreur de chargement',
    DEFAULT_MESSAGE: 'Une erreur est survenue lors du chargement des données.',
  },
  REDIRECT: {
    TITLE: 'Redirection en cours...',
    MISSING_DATA: 'Données manquantes',
    MISSING_DATA_DESCRIPTION: 'Redirection vers le simulateur...',
  },
  LOADING: {
    TITLE: 'Chargement en cours...',
  },
  RETRY: {
    TITLE: 'Rechargement...',
  },
} as const;

// Configuration des boutons
export const BUTTONS = {
  BACK_HOME: {
    LABEL: 'Retour',
    ARIA_LABEL: 'Retourner au simulateur de succession',
  },
  GO_TO_RESULTS: {
    LABEL: 'Accéder aux résultats actuels',
    ARIA_LABEL: 'Accéder aux résultats de la simulation',
  },
  RETRY: {
    LABEL: 'Réessayer',
    ARIA_LABEL: 'Réessayer le chargement des données',
  },
} as const;

// Couleurs et styles
export const COLORS = {
  BRAND: 'brand',
  SUCCESS: 'green',
  ERROR: 'red',
  WARNING: 'orange',
  INFO: 'blue',
} as const;

// ===========================================
// ✅ types/RapportTypes.ts
// Types TypeScript pour le composant
// ===========================================

export interface ClientDataPreview {
  prenom: string;
  patrimoineNet: number;
  droitsEstimes: number;
}

export interface NotarialResult {
  actifNetApresLegs?: number;
  fiscal?: {
    totalDroitsNets?: number;
  };
}

export interface SimulationDataMinimal {
  identite?: {
    prenom?: string;
    nom?: string;
    age?: number | null;
  };
}

export interface Feature {
  id: number;
  text: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RapportConfig {
  readonly CONTAINER_MAX_WIDTH: string;
  readonly CONTAINER_PADDING_Y: number;
  readonly ICON_SIZE: string;
  readonly ROUTES: {
    readonly SIMULATOR: string;
    readonly RESULTS_OLD: string;
    readonly RESULTS_NEW: string;
  };
  readonly REDIRECT_DELAY: number;
  readonly TOAST_DURATION: number;
  readonly ALERT_MAX_WIDTH: string;
  readonly ALERT_PADDING_Y: number;
}

// Props des composants

export interface RapportHeaderProps {
  onNavigateHome: () => void;
}

export interface FeatureItemProps {
  text: string;
}

export interface ClientDataPreviewProps {
  data: ClientDataPreview;
  formatCurrency: (value: number | undefined | null) => string;
}

export interface ActionsFooterProps {
  onNavigateResults: () => void;
}

export interface ErrorFallbackProps {
  error: string | Error;
  onRetry: () => void;
}

// Store types

export interface RapportStoreData {
  simulationData: SimulationDataMinimal | null;
  notarialAbIntestatQuarterPPResult: NotarialResult | null;
  isLoading: boolean;
  error: string | null;
}

// Hook return types

export interface UseRequireDataReturn {
  isValid: boolean;
  isRedirecting: boolean;
}

export interface UseRapportDataReturn {
  clientData: ClientDataPreview | null;
  hasValidData: boolean;
  isLoading: boolean;
  error: string | null;
}

// Type guards

export function isValidSimulationData(data: any): data is SimulationDataMinimal {
  return (
    data &&
    typeof data === 'object' &&
    'identite' in data &&
    data.identite &&
    typeof data.identite === 'object'
  );
}

export function isValidNotarialResult(result: any): result is NotarialResult {
  return (
    result &&
    typeof result === 'object' &&
    (typeof result.actifNetApresLegs === 'number' ||
      (result.fiscal && typeof result.fiscal.totalDroitsNets === 'number'))
  );
}

export function isValidClientData(data: any): data is ClientDataPreview {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.prenom === 'string' &&
    data.prenom.length > 0 &&
    typeof data.patrimoineNet === 'number' &&
    typeof data.droitsEstimes === 'number'
  );
}

// Helpers de validation

export function validateClientPreview(
  simulationData: SimulationDataMinimal | null,
  notarialResult: NotarialResult | null
): ClientDataPreview | null {
  if (!isValidSimulationData(simulationData)) {
    return null;
  }

  if (!simulationData.identite?.prenom) {
    return null;
  }

  return {
    prenom: simulationData.identite.prenom,
    patrimoineNet: notarialResult?.actifNetApresLegs ?? 0,
    droitsEstimes: notarialResult?.fiscal?.totalDroitsNets ?? 0,
  };
}

export function hasMinimalRequiredData(
  simulationData: SimulationDataMinimal | null
): boolean {
  return !!(
    simulationData &&
    simulationData.identite &&
    simulationData.identite.prenom &&
    simulationData.identite.prenom.length > 0
  );
}

// Constants pour validation

export const VALIDATION = {
  MIN_PRENOM_LENGTH: 1,
  MIN_PATRIMOINE: 0,
  MIN_DROITS: 0,
} as const;

// Enums

export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
  REDIRECTING = 'redirecting',
}

export enum ToastStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

// Utility types

export type FeaturePriority = 'high' | 'medium' | 'low';
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AlertStatus = 'success' | 'error' | 'warning' | 'info';

// Configuration type exports

export type { RapportConfig as RapportConfigType };
export type FeaturesConfig = typeof FEATURES;
export type MessagesConfig = typeof MESSAGES;
export type ButtonsConfig = typeof BUTTONS;
export type ColorsConfig = typeof COLORS;
