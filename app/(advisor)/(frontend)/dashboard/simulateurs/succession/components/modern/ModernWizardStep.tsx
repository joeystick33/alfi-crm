import React from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Heading, 
  Text, 
  Button, 
  Icon,
  Container,
  Alert,
  AlertIcon,
  Progress,
  MotionBox,
} from '../../compat';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '../../compat';
import type { IconType } from 'react-icons';

interface ModernWizardStepProps {
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
}

export function ModernWizardStep({
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
}: ModernWizardStepProps) {

  const progress = stepNumber && totalSteps ? ((stepNumber - 1) / (totalSteps - 1)) * 100 : 0;

  return (
    <AnimatePresence mode="wait">
      <Box
        w="100%"
        position="relative"
        overflow="hidden"
      >
        {/* Subtle Institutional Background */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bgGradient="linear(to-br, brand.50 0%, neutral.50 50%, accent.50 100%)"
          opacity={0.7}
        >
          {/* Animated gradient orbs */}
          <MotionBox
            position="absolute"
            top="-10%"
            right="-5%"
            w="500px"
            h="500px"
            borderRadius="full"
            bgGradient="radial(circle, brand.200, transparent)"
            filter="blur(60px)"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <MotionBox
            position="absolute"
            bottom="-10%"
            left="-5%"
            w="400px"
            h="400px"
            borderRadius="full"
            bgGradient="radial(circle, accent.200, transparent)"
            filter="blur(60px)"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </Box>

        {/* Content */}
        <Container maxW="6xl" position="relative" zIndex={1} py={{ base: 3, md: 4 }}>
          <VStack spacing={4} align="stretch">
            {/* Progress Bar */}
            {stepNumber && totalSteps && (
              <MotionBox
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Box
                  bg="whiteAlpha.800"
                  backdropFilter="blur(20px)"
                  borderRadius="xl"
                  p={3}
                  border="1px solid"
                  borderColor="whiteAlpha.400"
                  boxShadow="glass"
                >
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" fontWeight="semibold" color="neutral.700">
                      Étape {stepNumber} sur {totalSteps}
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="brand.600">
                      {Math.round(progress)}%
                    </Text>
                  </HStack>
                  <Progress 
                    value={progress} 
                    size="sm" 
                    borderRadius="full"
                    bg="neutral.200"
                    css={{
                      '& > div': {
                        background: 'linear-gradient(to-r, var(--chakra-colors-brand-500), var(--chakra-colors-accent-500))',
                        transition: 'all 0.5s ease',
                      }
                    }}
                  />
                </Box>
              </MotionBox>
            )}

            {/* Main Card */}
            <MotionBox
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            >
              <Box
                bg="whiteAlpha.900"
                backdropFilter="blur(40px)"
                borderRadius="2xl"
                overflow="hidden"
                border="1px solid"
                borderColor="whiteAlpha.500"
                boxShadow="0 10px 30px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5) inset"
              >
                {/* Content */}
                <Box>
                  {/* Explanation */}
                  {explanation && (
                    <MotionBox
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      mb={4}
                    >
                      <Alert 
                        status="info" 
                        borderRadius="lg" 
                        bg="blue.50"
                        border="1px solid"
                        borderColor="blue.200"
                        py={2}
                      >
                        <AlertIcon color="blue.500" boxSize={4} />
                        <Text fontSize="xs" color="blue.800" lineHeight="base">
                          {explanation}
                        </Text>
                      </Alert>
                    </MotionBox>
                  )}

                  {/* Form Content */}
                  <MotionBox
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    fontSize="sm"
                    lineHeight="short"
                  >
                    {children}
                  </MotionBox>

                  {/* Disclaimer */}
                  {showDisclaimer && (
                    <MotionBox
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      mt={4}
                    >
                      <Alert 
                        status="warning" 
                        borderRadius="lg"
                        bg="amber.50"
                        border="1px solid"
                        borderColor="amber.200"
                        py={2}
                      >
                        <AlertIcon color="amber.600" boxSize={4} />
                        <Text fontSize="xs" color="amber.800">
                          💡 Simulation indicative. Consultez un notaire pour validation juridique.
                        </Text>
                      </Alert>
                    </MotionBox>
                  )}
                </Box>
              </Box>
            </MotionBox>
          </VStack>
        </Container>
      </Box>
    </AnimatePresence>
  );
}