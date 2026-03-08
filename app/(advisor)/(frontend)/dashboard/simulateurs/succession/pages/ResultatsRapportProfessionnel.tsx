import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  VStack,
  HStack,
  Box,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  useToast,
  Skeleton,
  Spinner,
} from '../compat';
import { FiHome, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useSuccessionStore } from '../store/successionStore';
import { useCurrencyFormatter } from './hooks_useCurrencyFormatter';
import { useRequireData } from '../hooks/useRequireData';
import { RAPPORT_CONFIG, FEATURES } from './rapportConfig_and_types';
import type { ClientDataPreview as ClientDataPreviewType } from './rapportConfig_and_types';

// ✅ CORRECTION: Composant pour l'icône de feature
interface FeatureItemProps {
  text: string;
}

const FeatureItem = React.memo<FeatureItemProps>(({ text }) => (
  <HStack spacing={2} align="start">
    <Icon as={FiCheckCircle} color="green.500" mt={1} flexShrink={0} />
    <Text>{text}</Text>
  </HStack>
));

FeatureItem.displayName = 'FeatureItem';

// ✅ CORRECTION: Composant Header memoïzé
interface RapportHeaderProps {
  onNavigateHome: () => void;
}

const RapportHeader = React.memo<RapportHeaderProps>(({ onNavigateHome }) => (
  <HStack justify="space-between" flexWrap="wrap" gap={4}>
    <Heading size="xl" color="brand.600">
      📊 Rapport Professionnel - En Construction
    </Heading>
    <Button
      leftIcon={<Icon as={FiHome} />}
      onClick={onNavigateHome}
      variant="outline"
      colorScheme="brand"
      aria-label="Retourner au simulateur de succession"
    >
      Retour
    </Button>
  </HStack>
));

RapportHeader.displayName = 'RapportHeader';

// ✅ CORRECTION: Liste de features memoïzée
const FeaturesList = React.memo(() => (
  <VStack align="start" spacing={2} pl={4}>
    {FEATURES.map((feature) => (
      <FeatureItem key={feature.id} text={feature.text} />
    ))}
  </VStack>
));

FeaturesList.displayName = 'FeaturesList';

// ✅ CORRECTION: Alert "En construction" memoïzée
const UnderConstructionAlert = React.memo(() => (
  <Alert
    status="info"
    variant="left-accent"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    textAlign="center"
    borderRadius="lg"
    py={8}
  >
    <AlertIcon as={FiAlertCircle} boxSize={RAPPORT_CONFIG.ICON_SIZE} mr={0} mb={4} />
    <AlertTitle mt={4} mb={2} fontSize="2xl">
      Système de Rapport Professionnel en Intégration
    </AlertTitle>
    <AlertDescription maxWidth="lg" fontSize="md">
      <VStack spacing={4} mt={4}>
        <Text>
          Le nouveau système de rapport professionnel avec graphiques interactifs,
          export PDF premium et analyse détaillée est en cours d'intégration.
        </Text>
        <Text fontWeight="bold" color="brand.600">
          Fonctionnalités prévues :
        </Text>
        <FeaturesList />
        <Text mt={4} fontSize="sm" color="gray.600">
          En attendant, utilisez la page de résultats existante.
        </Text>
      </VStack>
    </AlertDescription>
  </Alert>
));

UnderConstructionAlert.displayName = 'UnderConstructionAlert';

// ✅ CORRECTION: Composant aperçu des données client
interface ClientDataPreviewProps {
  data: ClientDataPreviewType;
  formatCurrency: (value: number | undefined | null) => string;
}

const ClientDataPreview = React.memo<ClientDataPreviewProps>(({ data, formatCurrency }) => (
  <Box p={6} bg="white" borderRadius="lg" shadow="md">
    <Heading size="md" mb={4}>
      Aperçu des données disponibles
    </Heading>
    <VStack align="start" spacing={3}>
      <Text>
        <strong>Client :</strong> {data.prenom}
      </Text>
      <Text>
        <strong>Patrimoine net :</strong> {formatCurrency(data.patrimoineNet)}
      </Text>
      <Text>
        <strong>Droits estimés :</strong> {formatCurrency(data.droitsEstimes)}
      </Text>
    </VStack>
  </Box>
));

ClientDataPreview.displayName = 'ClientDataPreview';

// ✅ CORRECTION: Composant footer avec actions
interface ActionsFooterProps {
  onNavigateResults: () => void;
}

const ActionsFooter = React.memo<ActionsFooterProps>(({ onNavigateResults }) => (
  <HStack justify="center" pt={4}>
    <Button
      onClick={onNavigateResults}
      colorScheme="brand"
      size="lg"
      aria-label="Accéder aux résultats de la simulation"
    >
      Accéder aux résultats actuels
    </Button>
  </HStack>
));

ActionsFooter.displayName = 'ActionsFooter';

// ✅ CORRECTION: Loading Skeleton
const LoadingSkeleton: React.FC = () => (
  <Container maxW={RAPPORT_CONFIG.CONTAINER_MAX_WIDTH} py={RAPPORT_CONFIG.CONTAINER_PADDING_Y}>
    <VStack spacing={8} align="stretch">
      <HStack justify="space-between">
        <Skeleton height="40px" width="400px" />
        <Skeleton height="40px" width="120px" />
      </HStack>
      <Skeleton height="300px" borderRadius="lg" />
      <Skeleton height="150px" borderRadius="lg" />
      <HStack justify="center">
        <Skeleton height="48px" width="250px" />
      </HStack>
    </VStack>
  </Container>
);

// ✅ CORRECTION: Écran de redirection
const RedirectingScreen: React.FC = () => (
  <Container maxW={RAPPORT_CONFIG.CONTAINER_MAX_WIDTH} py={RAPPORT_CONFIG.CONTAINER_PADDING_Y}>
    <VStack spacing={4} align="center" justify="center" minH="50vh">
      <Spinner size="xl" color="brand.500" thickness="4px" />
      <Text fontSize="lg" color="gray.600">
        Redirection en cours...
      </Text>
    </VStack>
  </Container>
);

// ✅ CORRECTION: Fallback d'erreur
interface ErrorFallbackProps {
  error: string | Error;
  onRetry: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry }) => {
  const navigate = useNavigate();
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <Container maxW={RAPPORT_CONFIG.CONTAINER_MAX_WIDTH} py={RAPPORT_CONFIG.CONTAINER_PADDING_Y}>
      <VStack spacing={4} align="center">
        <Icon as={FiAlertCircle} boxSize={12} color="red.500" />
        <Heading size="lg" color="red.500">
          Erreur de chargement
        </Heading>
        <Text color="gray.600" textAlign="center">
          {errorMessage}
        </Text>
        <HStack spacing={3}>
          <Button onClick={onRetry} colorScheme="brand">
            Réessayer
          </Button>
          <Button onClick={() => navigate(RAPPORT_CONFIG.ROUTES.SIMULATOR)} variant="outline">
            Retour au simulateur
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
};

// ✅ COMPOSANT PRINCIPAL
export default function ResultatsRapportProfessionnel() {
  const navigate = useNavigate();
  const toast = useToast();
  const formatCurrency = useCurrencyFormatter();
  
  // ✅ CORRECTION: Hook personnalisé pour la validation des données requises
  const isValid = useRequireData(RAPPORT_CONFIG.ROUTES.SIMULATOR);
  
  // ✅ CORRECTION: État de retry pour gestion d'erreur
  const [retryCount, setRetryCount] = useState(0);
  
  // Store data
  const { 
    simulationData, 
    notarialAbIntestatQuarterPPResult,
    isLoading,
    error 
  } = useSuccessionStore();
  
  // ✅ CORRECTION: Callbacks memoïzés
  const handleNavigateHome = useCallback(() => {
    navigate(RAPPORT_CONFIG.ROUTES.SIMULATOR);
  }, [navigate]);
  
  const handleNavigateResults = useCallback(() => {
    navigate(RAPPORT_CONFIG.ROUTES.RESULTS_OLD);
  }, [navigate]);
  
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    toast({
      title: 'Rechargement...',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  }, [toast]);
  
  // ✅ CORRECTION: Données client memoïzées avec validation robuste
  const clientData = useMemo<ClientDataPreviewType | null>(() => {
    if (!simulationData?.identite?.prenom) return null;
    
    return {
      prenom: simulationData.identite.prenom,
      patrimoineNet: notarialAbIntestatQuarterPPResult?.actifNetApresLegs ?? 0,
      droitsEstimes: notarialAbIntestatQuarterPPResult?.fiscal?.totalDroitsNets ?? 0,
    };
  }, [simulationData, notarialAbIntestatQuarterPPResult]);
  
  // ✅ CORRECTION: Validation robuste des données
  const hasValidData = useMemo(() => {
    return !!(
      clientData &&
      clientData.prenom !== 'N/A' &&
      (clientData.patrimoineNet > 0 || clientData.droitsEstimes > 0)
    );
  }, [clientData]);
  
  // ✅ CORRECTION: États de chargement et d'erreur
  if (!isValid) {
    return <RedirectingScreen />;
  }
  
  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  if (error) {
    return <ErrorFallback error={error} onRetry={handleRetry} />;
  }
  
  return (
    <Container 
      maxW={RAPPORT_CONFIG.CONTAINER_MAX_WIDTH} 
      py={RAPPORT_CONFIG.CONTAINER_PADDING_Y}
    >
      <VStack spacing={8} align="stretch">
        {/* Header avec navigation */}
        <RapportHeader onNavigateHome={handleNavigateHome} />
        
        {/* Alert "En construction" */}
        <UnderConstructionAlert />
        
        {/* Aperçu des données si disponibles */}
        {hasValidData && clientData && (
          <ClientDataPreview data={clientData} formatCurrency={formatCurrency} />
        )}
        
        {/* Actions footer */}
        <ActionsFooter onNavigateResults={handleNavigateResults} />
      </VStack>
    </Container>
  );
}

// ✅ Export du composant avec nom pour debug
ResultatsRapportProfessionnel.displayName = 'ResultatsRapportProfessionnel';
