import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useToast,
} from '../compat';
import { FiRefreshCw, FiHome, FiAlertTriangle } from 'react-icons/fi';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * 🛡️ ERROR BOUNDARY - Capture toutes les erreurs React non gérées
 * 
 * Fonctionnalités :
 * - Affichage élégant en cas d'erreur
 * - Stack trace technique (développeurs)
 * - Actions de récupération (retry, retour home)
 * - Logging pour debugging
 * - Error ID unique pour traçabilité
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log l'erreur pour debugging
    console.error('❌ Error Boundary caught:', {
      errorId: this.state.errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // TODO: Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
    // sendErrorToMonitoring({ error, errorInfo, errorId: this.state.errorId });

    this.setState({
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxW="4xl" py={20}>
          <VStack spacing={8} align="stretch">
            {/* Icône et titre principal */}
            <Box textAlign="center">
              <Box
                as={FiAlertTriangle}
                fontSize="6xl"
                color="red.500"
                mx="auto"
                mb={4}
              />
              <Heading size="2xl" color="red.600" mb={2}>
                Une erreur est survenue
              </Heading>
              <Text fontSize="lg" color="gray.600">
                Nous sommes désolés, quelque chose s'est mal passé.
              </Text>
            </Box>

            {/* Message d'erreur utilisateur */}
            <Alert
              status="error"
              variant="left-accent"
              borderRadius="lg"
              flexDirection="column"
              alignItems="flex-start"
              p={6}
            >
              <Box display="flex" alignItems="center" mb={2}>
                <AlertIcon boxSize={6} mr={2} />
                <AlertTitle fontSize="xl">Erreur technique détectée</AlertTitle>
              </Box>
              <AlertDescription fontSize="md" maxWidth="none">
                <VStack align="stretch" spacing={3} mt={2}>
                  <Text>
                    L'application a rencontré une erreur inattendue. Nos équipes techniques
                    ont été notifiées automatiquement.
                  </Text>
                  <Box
                    bg="red.50"
                    p={3}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="red.200"
                  >
                    <Text fontWeight="bold" mb={1}>
                      ID de l'erreur :
                    </Text>
                    <Code
                      colorScheme="red"
                      fontSize="md"
                      p={2}
                      borderRadius="md"
                      display="block"
                    >
                      {this.state.errorId}
                    </Code>
                    <Text fontSize="sm" color="gray.600" mt={2}>
                      (Communiquez cet ID au support si le problème persiste)
                    </Text>
                  </Box>
                </VStack>
              </AlertDescription>
            </Alert>

            {/* Actions de récupération */}
            <Box
              bg="gray.50"
              p={6}
              borderRadius="lg"
              border="1px solid"
              borderColor="gray.200"
            >
              <Heading size="md" mb={4}>
                Que faire maintenant ?
              </Heading>
              <VStack spacing={3} align="stretch">
                <Button
                  leftIcon={<FiRefreshCw />}
                  colorScheme="blue"
                  size="lg"
                  onClick={this.handleRetry}
                >
                  Recharger la page
                </Button>
                <Button
                  leftIcon={<FiHome />}
                  variant="outline"
                  colorScheme="gray"
                  size="lg"
                  onClick={this.handleGoHome}
                >
                  Retour à l'accueil
                </Button>
                <Text fontSize="sm" color="gray.600" textAlign="center" mt={2}>
                  Si le problème persiste après rechargement, contactez le support
                  technique avec l'ID d'erreur ci-dessus.
                </Text>
              </VStack>
            </Box>

            {/* Détails techniques (développeurs) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Accordion allowToggle>
                <AccordionItem border="1px solid" borderColor="gray.200" borderRadius="md">
                  <h2>
                    <AccordionButton _expanded={{ bg: 'gray.100' }}>
                      <Box flex="1" textAlign="left" fontWeight="bold">
                        🔧 Détails techniques (développeurs)
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4} bg="gray.50">
                    <VStack align="stretch" spacing={4}>
                      <Box>
                        <Text fontWeight="bold" mb={2}>
                          Message d'erreur :
                        </Text>
                        <Code
                          display="block"
                          whiteSpace="pre-wrap"
                          p={3}
                          bg="red.50"
                          borderRadius="md"
                        >
                          {this.state.error.message}
                        </Code>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" mb={2}>
                          Stack trace :
                        </Text>
                        <Code
                          display="block"
                          whiteSpace="pre-wrap"
                          p={3}
                          bg="gray.100"
                          borderRadius="md"
                          fontSize="xs"
                          maxHeight="300px"
                          overflowY="auto"
                        >
                          {this.state.error.stack}
                        </Code>
                      </Box>
                      {this.state.errorInfo && (
                        <Box>
                          <Text fontWeight="bold" mb={2}>
                            Component stack :
                          </Text>
                          <Code
                            display="block"
                            whiteSpace="pre-wrap"
                            p={3}
                            bg="gray.100"
                            borderRadius="md"
                            fontSize="xs"
                            maxHeight="300px"
                            overflowY="auto"
                          >
                            {this.state.errorInfo.componentStack}
                          </Code>
                        </Box>
                      )}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            )}
          </VStack>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

