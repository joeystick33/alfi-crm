import React from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Heading, 
  Text, 
  Button, 
  Icon,
  Flex,
  Container,
  Alert,
  AlertIcon,
  MotionBox,
} from '../compat';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '../compat';
import { IconType } from 'react-icons';

interface WizardStepProps {
  title: string;
  subtitle?: string;
  icon: IconType;
  children: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  isNextDisabled?: boolean;
  showPrevious?: boolean;
  stepNumber?: number;
  totalSteps?: number;
  explanation?: string;
  showDisclaimer?: boolean;
  stepTitles?: string[];
}

export function WizardStep({
  title,
  subtitle,
  icon,
  children,
  onNext,
  onPrevious,
  nextLabel = "Suivant",
  previousLabel = "Précédent",
  isNextDisabled = false,
  showPrevious = true,
  stepNumber,
  totalSteps,
  explanation,
  showDisclaimer = false,
  stepTitles = []
}: WizardStepProps) {

  // Design light propre et moderne
  const bgGradient = "linear(to-br, blue.50, purple.50)";
  const cardBg = "white";
  const headerGradient = "linear(135deg, brand.500, success.500)";
  const textColor = "gray.800";
  const borderColor = "gray.100";

  return (
    <>
      {/* Barre de progression globale */}
      {stepNumber && totalSteps && (
        <Box bg="white" borderBottom="1px solid" borderColor="gray.200" p={3}>
          <Text fontSize="sm" color="gray.600" textAlign="center">
            Étape {stepNumber} sur {totalSteps} • {Math.round(((stepNumber - 1) / (totalSteps - 1)) * 100)}% complété
          </Text>
        </Box>
      )}
      
      <AnimatePresence mode="wait">
        <Box
          minH="100vh"
          w="100%"
          py={{ base: 4, md: 6 }}
          px={{ base: 3, md: 4 }}
          bgGradient={bgGradient}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Container maxW="6xl" px={0}>
          <MotionBox
            bg={cardBg}
            borderRadius={{ base: "xl", md: "2xl" }}
            boxShadow="xl"
            overflow="hidden"
            w="100%"
            minH={{ base: "auto", md: "75vh" }}
            display="flex"
            flexDirection="column"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <Box
              bgGradient={headerGradient}
              color="white"
              p={{ base: 6, md: 8 }}
              borderTopRadius={{ base: "xl", md: "2xl" }}
            >
              <Flex 
                direction={{ base: "column", sm: "row" }} 
                align={{ base: "center", sm: "flex-start" }}
                gap={4}
                textAlign={{ base: "center", sm: "left" }}
              >
                <Box
                  p={3}
                  bg="whiteAlpha.200"
                  borderRadius="xl"
                >
                  <Icon as={icon} boxSize={{ base: 6, md: 8 }} />
                </Box>
                
                <VStack align={{ base: "center", sm: "flex-start" }} spacing={1} flex="1">
                  <HStack 
                    spacing={3}
                    flexWrap="wrap" 
                    justify={{ base: "center", sm: "flex-start" }}
                  >
                    <Heading size={{ base: "lg", md: "xl" }} fontWeight="700" color="white">
                      {title}
                    </Heading>
                    {stepNumber && totalSteps && (
                      <Text 
                        fontSize="sm"
                        bg="whiteAlpha.300" 
                        px={3}
                        py={1} 
                        borderRadius="full"
                        fontWeight="600"
                        color="white"
                      >
                        {stepNumber}/{totalSteps}
                      </Text>
                    )}
                  </HStack>
                  {subtitle && (
                    <Text 
                      fontSize={{ base: "md", md: "lg" }} 
                      opacity={0.95}
                      maxW="2xl"
                      color="white"
                    >
                      {subtitle}
                    </Text>
                  )}
                </VStack>
              </Flex>
            </Box>

            {/* Contenu principal */}
            <Box 
              flex="1"
              p={{ base: 6, md: 8 }}
              overflowY="auto"
              display="flex"
              flexDirection="column"
            >
              {/* Explication contextuelle */}
              {explanation && (
                <Alert status="info" borderRadius="lg" mb={4} bg="blue.50">
                  <AlertIcon color="blue.500" />
                  <Text fontSize="sm" color="blue.700">
                    {explanation}
                  </Text>
                </Alert>
              )}

              <Box flex="1" mb={6}>
                {children}
              </Box>

              {/* Disclaimer légal si nécessaire */}
              {showDisclaimer && (
                <Alert status="warning" borderRadius="lg" mb={4}>
                  <AlertIcon />
                  <Text fontSize="sm">
                    Simulation indicative. Consultez un notaire pour validation.
                  </Text>
                </Alert>
              )}

              {/* Navigation */}
              <Flex 
                gap={4}
                direction={{ base: "column", sm: "row" }}
                align="stretch"
                pt={6}
                borderTop="1px solid"
                borderColor={borderColor}
              >
                {showPrevious && onPrevious && (
                  <Button
                    leftIcon={<ChevronLeftIcon />}
                    variant="ghost"
                    onClick={onPrevious}
                    size="lg"
                    borderRadius="xl"
                    flex={{ base: "1", sm: "initial" }}
                    color={textColor}
                  >
                    {previousLabel}
                  </Button>
                )}
                
                <Box flex="1" display={{ base: "none", sm: "block" }} />
                
                {onNext && (
                  <Button
                    rightIcon={<ChevronRightIcon />}
                    colorScheme="brand"
                    onClick={onNext}
                    isDisabled={isNextDisabled}
                    size="lg"
                    borderRadius="xl"
                    flex={{ base: "1", sm: "initial" }}
                    bgGradient={headerGradient}
                    _hover={{
                      bgGradient: "linear(135deg, brand.600, success.600)",
                    }}
                  >
                    {nextLabel}
                  </Button>
                )}
              </Flex>
            </Box>
          </MotionBox>
        </Container>
        </Box>
      </AnimatePresence>
    </>
  );
}
