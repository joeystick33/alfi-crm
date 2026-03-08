import React from 'react';
import {
  Box,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Icon,
  useColorModeValue,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  MotionBox,
} from '../compat';
import { IconType } from 'react-icons';

interface FormFieldCardProps {
  title: string;
  description?: string;
  icon?: IconType;
  children: React.ReactNode;
  error?: string;
  isRequired?: boolean;
  delay?: number;
}

export function FormFieldCard({
  title,
  description,
  icon,
  children,
  error,
  isRequired = false,
  delay = 0
}: FormFieldCardProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('brand.500', 'brand.200');

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card
        bg={bgColor}
        border="1px solid"
        borderColor={error ? 'red.300' : borderColor}
        borderRadius="2xl"
        overflow="hidden"
        position="relative"
        _hover={{
          borderColor: error ? 'red.400' : accentColor,
          transform: 'translateY(-1px)',
          boxShadow: 'md',
        }}
      >
        {/* Barre d'accent */}
        <Box
          h="4px"
          bgGradient={error ? 'linear(to-r, red.400, red.600)' : 'linear(to-r, brand.400, success.400)'}
        />

        <CardBody p={6}>
          <FormControl isInvalid={!!error} isRequired={isRequired}>
            {/* En-tête */}
            <HStack spacing={3} mb={4}>
              {icon && (
                <Box
                  p={2}
                  bg={error ? 'red.50' : 'brand.50'}
                  borderRadius="lg"
                >
                  <Icon 
                    as={icon} 
                    boxSize={5} 
                    color={error ? 'red.500' : 'brand.500'} 
                  />
                </Box>
              )}
              <VStack align="flex-start" spacing={0} flex="1">
                <FormLabel fontSize="md" fontWeight="600" mb={0} color="gray.800">
                  {title}
                </FormLabel>
                {description && (
                  <FormHelperText mt={1} fontSize="sm" color="gray.600">
                    {description}
                  </FormHelperText>
                )}
              </VStack>
            </HStack>

            {/* Contenu du formulaire */}
            <Box>{children}</Box>

            {/* Message d'erreur */}
            {error && (
              <FormErrorMessage mt={2} fontSize="sm">
                {error}
              </FormErrorMessage>
            )}
          </FormControl>
        </CardBody>
      </Card>
    </MotionBox>
  );
}
