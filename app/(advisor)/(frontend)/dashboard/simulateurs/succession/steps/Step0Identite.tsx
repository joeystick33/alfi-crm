import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  NumberIncrementStepper,
  NumberDecrementStepper,
  NumberInputStepper,
  Stack,
  Text,
  Alert,
  AlertIcon,
  VStack,
  Icon,
  Grid,
  GridItem,
  RadioGroup,
  Radio
} from '../compat';
import { FiUser, FiShield } from 'react-icons/fi';
// import { step0IdentiteSchema } from '../validation/schemas';

// Validation temporairement désactivée pour MVP
export type Step0IdentiteValues = any; // z.infer<typeof step0IdentiteSchema>;

export function Step0Identite({
  defaultValues,
  onSubmit,
}: {
  defaultValues: Step0IdentiteValues;
  onSubmit: (values: Step0IdentiteValues) => void;
}) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<Step0IdentiteValues>({
    // resolver: zodResolver(...), // Validation temporairement désactivée
    defaultValues,
  });

  const age = watch('age');
  const revenusMensuels = watch('revenusMensuels');
  const sexe = watch('sexe');

  return (
    <VStack spacing={6} maxW="800px" mx="auto" align="stretch">
      {/* Introduction claire */}
      <Box p={6} bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
        <VStack align="stretch" spacing={3}>
          <HStack spacing={3}>
            <Box p={3} bg="brand.50" borderRadius="xl" color="brand.600">
              <Icon as={FiUser} boxSize={6} />
            </Box>
            <VStack align="start" spacing={0}>
              <Heading size="md" color="gray.900">Simulons votre succession</Heading>
              <Text color="gray.500" fontSize="sm">
                Évaluons la transmission de votre patrimoine pour anticiper et optimiser la fiscalité.
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </Box>

      <Card w="full" variant="outline" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm" overflow="hidden">
        <CardHeader bg="gray.50" py={4} px={6} borderBottom="1px solid" borderColor="gray.200">
          <Heading size="sm" color="gray.800">1. Votre identité</Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Nécessaire pour personnaliser les abattements et les calculs.
          </Text>
        </CardHeader>
        <CardBody px={6} py={6}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={6} align="stretch">
              {(errors.nom || errors.prenom || errors.age || errors.sexe) && (
                <Alert status="error" w="full" borderRadius="md" fontSize="xs" py={2}>
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" fontWeight="600">
                      Veuillez corriger les erreurs suivantes :
                    </Text>
                    {errors.sexe?.message && <Text fontSize="xs">• {String(errors.sexe.message)}</Text>}
                    {errors.prenom?.message && <Text fontSize="xs">• {String(errors.prenom.message)}</Text>}
                    {errors.nom?.message && <Text fontSize="xs">• {String(errors.nom.message)}</Text>}
                    {errors.age?.message && <Text fontSize="xs">• {String(errors.age.message)}</Text>}
                  </VStack>
                </Alert>
              )}

              {/* Civilité EN PREMIER */}
              <FormControl isInvalid={!!errors.sexe} isRequired>
                <FormLabel fontWeight="600" fontSize="sm" mb={2}>
                  👤 Vous êtes
                </FormLabel>
                <RadioGroup 
                  value={sexe} 
                  onChange={(val) => setValue('sexe', val as 'M' | 'F')}
                >
                  <HStack spacing={4} align="stretch">
                    <Card 
                      variant="outline" 
                      cursor="pointer"
                      borderWidth="2px"
                      borderColor={sexe === 'M' ? 'brand.500' : 'gray.200'}
                      bg={sexe === 'M' ? 'brand.50' : 'white'}
                      _hover={{ borderColor: sexe === 'M' ? 'brand.500' : 'brand.300', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                      onClick={() => setValue('sexe', 'M')}
                      flex={1}
                      borderRadius="xl"
                    >
                      <Box textAlign="center" py={4}>
                        <Radio value="M" size="lg" mb={2} colorScheme="brand">
                          <Text fontSize="md" fontWeight="600">Monsieur</Text>
                        </Radio>
                      </Box>
                    </Card>
                    <Card 
                      variant="outline" 
                      cursor="pointer"
                      borderWidth="2px"
                      borderColor={sexe === 'F' ? 'brand.500' : 'gray.200'}
                      bg={sexe === 'F' ? 'brand.50' : 'white'}
                      _hover={{ borderColor: sexe === 'F' ? 'brand.500' : 'brand.300', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                      onClick={() => setValue('sexe', 'F')}
                      flex={1}
                      borderRadius="xl"
                    >
                      <Box textAlign="center" py={4}>
                        <Radio value="F" size="lg" mb={2} colorScheme="brand">
                          <Text fontSize="md" fontWeight="600">Madame</Text>
                        </Radio>
                      </Box>
                    </Card>
                  </HStack>
                </RadioGroup>
                {errors.sexe?.message && (
                  <Text color="red.500" fontSize="2xs" mt={1}>
                    {String(errors.sexe.message)}
                  </Text>
                )}
              </FormControl>

              <Divider my={2} />

              {/* Prénom et Nom */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} w="full">
                <GridItem>
                  <FormControl isInvalid={!!errors.prenom} isRequired>
                    <FormLabel fontWeight="600" fontSize="sm" mb={1}>Prénom</FormLabel>
                    <Input 
                      placeholder="Ex: Jean" 
                      {...register('prenom')}
                      bg="white"
                      size="md"
                      borderRadius="md"
                      borderColor="gray.300"
                    />
                    {errors.prenom?.message && (
                      <Text color="red.500" fontSize="2xs" mt={1}>
                        {String(errors.prenom.message)}
                      </Text>
                    )}
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isInvalid={!!errors.nom} isRequired>
                    <FormLabel fontWeight="600" fontSize="sm" mb={1}>Nom de famille</FormLabel>
                    <Input 
                      placeholder="Ex: Dupont" 
                      {...register('nom')}
                      bg="white"
                      size="md"
                      borderRadius="md"
                      borderColor="gray.300"
                    />
                    {errors.nom?.message && (
                      <Text color="red.500" fontSize="xs" mt={1}>
                        {String(errors.nom.message)}
                      </Text>
                    )}
                  </FormControl>
                </GridItem>
              </Grid>

              <Divider my={2} />

              {/* Âge et Revenus */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} w="full">
                <GridItem>
                  <FormControl isInvalid={!!errors.age} isRequired>
                    <FormLabel fontWeight="600" fontSize="sm" mb={1}>Âge actuel</FormLabel>
                    <NumberInput min={18} max={120} size="md">
                      <NumberInputField
                        value={age ?? ''}
                        onChange={(e) => setValue('age', e.target.value ? Number(e.target.value) : null, { shouldValidate: true })}
                        placeholder="Ex: 55"
                        bg="white"
                        borderRadius="md"
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    {errors.age?.message && (
                      <Text color="red.500" fontSize="xs" mt={1}>
                        {String(errors.age.message)}
                      </Text>
                    )}
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      💡 Détermine les abattements fiscaux
                    </Text>
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isInvalid={!!errors.revenusMensuels}>
                    <FormLabel fontWeight="600" fontSize="sm" mb={1}>Revenus mensuels nets (optionnel)</FormLabel>
                    <NumberInput min={0} size="md">
                      <NumberInputField
                        value={revenusMensuels ?? ''}
                        onChange={(e) => setValue('revenusMensuels', e.target.value ? Number(e.target.value) : null, { shouldValidate: true })}
                        placeholder="Ex: 3500"
                        bg="white"
                        borderRadius="md"
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    {errors.revenusMensuels?.message && (
                      <Text color="red.500" fontSize="xs" mt={1}>
                        {String(errors.revenusMensuels.message)}
                      </Text>
                    )}
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      💡 Pour calculer votre épargne de précaution
                    </Text>
                  </FormControl>
                </GridItem>
              </Grid>

              <Box bg="brand.50" p={3} borderRadius="lg" w="full" border="1px solid" borderColor="brand.200">
                <HStack align="start" spacing={2}>
                  <Icon as={FiShield} color="brand.500" boxSize={4} mt={0.5} />
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="sm" fontWeight="600" color="brand.800">
                      🔒 Confidentialité totale garantie
                    </Text>
                    <Text fontSize="xs" color="brand.700">
                      Aucune donnée personnelle n'est stockée ou transmise. Calculs effectués localement dans votre navigateur.
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              <HStack justifyContent="flex-end" mt={4} w="full">
                <Button 
                  type="submit" 
                  colorScheme="brand"
                  size="md" 
                  borderRadius="xl"
                  px={8}
                  rightIcon={<Text>→</Text>}
                >
                  Continuer vers la situation familiale
                </Button>
              </HStack>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </VStack>
  );
}
