import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  MotionBox,
} from '../../compat';
import type { IconType } from 'react-icons';

interface ModernFormFieldCardProps {
  title: string;
  description?: string;
  icon?: IconType;
  children: React.ReactNode;
  error?: string;
  isRequired?: boolean;
  delay?: number;
}

export function ModernFormFieldCard({
  title,
  description,
  icon,
  children,
  error,
  isRequired = false,
  delay = 0
}: ModernFormFieldCardProps) {

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2 }}
    >
      <Box
        bg="white"
        borderRadius="xl"
        p={3}
        border="1px solid"
        borderColor={error ? 'red.300' : 'neutral.200'}
        position="relative"
        overflow="hidden"
        boxShadow="0 2px 8px rgba(0, 0, 0, 0.03)"
        _hover={{
          borderColor: error ? 'red.400' : 'brand.300',
          boxShadow: error 
            ? '0 4px 12px rgba(239, 68, 68, 0.12)' 
            : '0 4px 12px rgba(30, 58, 95, 0.12)',
        }}
        transition="all 0.2s"
      >
        {/* Accent bar */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          h="2px"
          bgGradient={error 
            ? 'linear(to-r, red.400, red.600)' 
            : 'linear(to-r, brand.500, accent.500)'
          }
        />

        <FormControl isInvalid={!!error} isRequired={isRequired}>
          {/* Header */}
          <HStack spacing={3} mb={2} align="start">
            {icon && (
              <MotionBox
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Box
                  p={2}
                  bg={error ? 'red.50' : 'brand.50'}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={error ? 'red.100' : 'brand.100'}
                >
                  <Icon 
                    as={icon} 
                    boxSize={4} 
                    color={error ? 'red.500' : 'brand.500'} 
                  />
                </Box>
              </MotionBox>
            )}
            
            <VStack align="flex-start" spacing={0} flex="1">
              <FormLabel 
                fontSize="sm" 
                fontWeight="600" 
                mb={0} 
                color="neutral.900"
                letterSpacing="tight"
              >
                {title}
              </FormLabel>
              {description && (
                <FormHelperText mt={0} fontSize="xs" color="neutral.600" lineHeight="short">
                  {description}
                </FormHelperText>
              )}
            </VStack>
          </HStack>

          {/* Content */}
          <Box>{children}</Box>

          {/* Error message */}
          {error && (
            <MotionBox
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
            >
              <FormErrorMessage 
                mt={2} 
                fontSize="xs"
                fontWeight="medium"
                color="red.600"
              >
                ⚠️ {error}
              </FormErrorMessage>
            </MotionBox>
          )}
        </FormControl>
      </Box>
    </MotionBox>
  );
}