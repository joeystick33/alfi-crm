import React from 'react';
import { Box, VStack, HStack, Text, Circle, MotionBox, MotionCircle } from '../../compat';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon } from '../../compat';

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface ModernWizardProgressProps {
  steps: Step[];
  currentStep: number;
  progress: number;
}

export function ModernWizardProgress({ steps, currentStep, progress }: ModernWizardProgressProps) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        bg="whiteAlpha.900"
        backdropFilter="blur(20px)"
        borderRadius="xl"
        p={4}
        border="1px solid"
        borderColor="whiteAlpha.500"
        boxShadow="glass"
      >
        {/* Timeline vertical pour desktop, horizontal pour mobile */}
        <VStack spacing={0} align="stretch">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = step.completed;
            const isLast = index === steps.length - 1;

            return (
              <Box key={step.id}>
                <HStack spacing={4} align="start">
                  {/* Step indicator */}
                  <VStack spacing={0} align="center">
                    <MotionCircle
                      size="10"
                      bg={
                        isCompleted 
                          ? "success.500" 
                          : isActive 
                            ? "brand.500" 
                            : "neutral.200"
                      }
                      color="white"
                      position="relative"
                      initial={{ scale: 0.8 }}
                      animate={{ 
                        scale: isActive ? [1, 1.1, 1] : 1,
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: isActive ? Infinity : 0,
                        repeatDelay: 2,
                      }}
                      boxShadow={
                        isActive 
                          ? "0 0 0 4px rgba(14, 165, 233, 0.2)" 
                          : isCompleted
                            ? "0 0 0 4px rgba(16, 185, 129, 0.2)"
                            : "none"
                      }
                    >
                      <AnimatePresence mode="wait">
                        {isCompleted ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={{ type: "spring", stiffness: 200 }}
                          >
                            <CheckIcon boxSize={4} />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="number"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <Text fontSize="sm" fontWeight="bold">
                              {index + 1}
                            </Text>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </MotionCircle>

                    {/* Connector line */}
                    {!isLast && (
                      <Box
                        w="2px"
                        h="8"
                        bg={isCompleted ? "success.300" : "neutral.200"}
                        transition="all 0.3s"
                      />
                    )}
                  </VStack>

                  {/* Step content */}
                  <MotionBox
                    flex="1"
                    pb={isLast ? 0 : 3}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <VStack align="start" spacing={0}>
                      <Text 
                        fontSize="xs" 
                        fontWeight={isActive ? "700" : "600"}
                        color={
                          isCompleted 
                            ? "success.700" 
                            : isActive 
                              ? "brand.700" 
                              : "neutral.600"
                        }
                        letterSpacing="tight"
                      >
                        {step.label}
                      </Text>
                      
                      {isActive && (
                        <MotionBox
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.5 }}
                        >
                          <Box
                            h="2px"
                            w="full"
                            maxW="80px"
                            bgGradient="linear(to-r, brand.500, success.500)"
                            borderRadius="full"
                          />
                        </MotionBox>
                      )}
                    </VStack>
                  </MotionBox>
                </HStack>
              </Box>
            );
          })}
        </VStack>

        {/* Overall progress bar */}
        <Box mt={4} pt={4} borderTop="1px solid" borderColor="neutral.200">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="2xs" fontWeight="600" color="neutral.600" textTransform="uppercase" letterSpacing="wide">
              Progression
            </Text>
            <Text fontSize="xs" fontWeight="bold" color="brand.600">
              {Math.round(progress)}%
            </Text>
          </HStack>
          
          <Box position="relative" h="2" bg="neutral.200" borderRadius="full" overflow="hidden">
            <MotionBox
              h="full"
              bgGradient="linear(90deg, brand.500, success.500)"
              borderRadius="full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              position="relative"
            >
              {/* Shimmer effect */}
              <Box
                position="absolute"
                top="0"
                left="-100%"
                w="100%"
                h="full"
                bgGradient="linear(90deg, transparent, whiteAlpha.400, transparent)"
                animation="shimmer 2s infinite"
                css={{
                  '@keyframes shimmer': {
                    '0%': { left: '-100%' },
                    '100%': { left: '200%' },
                  },
                }}
              />
            </MotionBox>
          </Box>
        </Box>
      </Box>
    </MotionBox>
  );
}