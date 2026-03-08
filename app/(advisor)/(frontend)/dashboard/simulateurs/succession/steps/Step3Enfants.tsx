import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box, Button, Card, CardBody, CardHeader, Divider, FormControl, FormLabel, Heading, HStack, Input,
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  Text, IconButton, VStack, Icon, Alert, AlertIcon, AlertDescription, Radio, RadioGroup,
  SimpleGrid, Badge, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Switch
} from '../compat';
// import { step3EnfantsSchema } from '../validation/schemas';
import { AddIcon, DeleteIcon } from '../compat';
import { FiUsers, FiInfo, FiHeart } from 'react-icons/fi';

// Validation temporairement désactivée pour MVP
export type Step3EnfantsValues = any; // z.infer<typeof step3EnfantsSchema>;

export function Step3Enfants({
  defaultValues,
  hasPartner,
  onSubmit,
  onBack,
}: {
  defaultValues: Step3EnfantsValues;
  hasPartner: boolean;
  onSubmit: (values: Step3EnfantsValues) => void;
  onBack: () => void;
}) {
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<Step3EnfantsValues>({
    // resolver: zodResolver(...), // Validation temporairement désactivée
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'enfants' });
  const nombre = watch('nombre_enfants') || 0;
  const [showDetails, setShowDetails] = useState(false);

  const syncNombre = (n: number) => {
    setValue('nombre_enfants', n, { shouldValidate: true });
    const current = fields.length;
    if (n > current) {
      for (let i = current; i < n; i++) {
        append({ prenom: '', age: null, communAvecConjoint: true, predecede: false, representants: [] } as any);
      }
    } else if (n < current) {
      for (let i = current - 1; i >= n; i--) remove(i);
    }
    setShowDetails(n > 0);
  };

  return (
    <VStack spacing={6} maxW="800px" mx="auto" align="stretch">
      <Box p={6} bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
        <HStack spacing={3} align="start">
          <Box p={3} bg="brand.50" borderRadius="xl" color="brand.600">
            <Icon as={FiUsers} boxSize={6} />
          </Box>
          <VStack align="start" spacing={1}>
            <Heading size="md" color="gray.900">
              Vos enfants
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Cette information détermine la réserve héréditaire et les abattements fiscaux applicables à votre succession.
            </Text>
          </VStack>
        </HStack>
      </Box>

      <Accordion allowToggle border="1px solid" borderColor="brand.200" borderRadius="xl" overflow="hidden">
        <AccordionItem border="none">
          <h3>
            <AccordionButton px={4} py={3} _expanded={{ bg: 'brand.50' }}>
              <HStack flex="1" spacing={3}>
                <Icon as={FiInfo} color="brand.500" boxSize={5} />
                <Text fontSize="sm" fontWeight="700" color="brand.800">Pourquoi déclarer vos enfants ?</Text>
              </HStack>
              <AccordionIcon color="brand.500" />
            </AccordionButton>
          </h3>
          <AccordionPanel px={4} py={4}>
            <VStack align="stretch" spacing={3} fontSize="sm" color="gray.700">
              <Box p={3} bg="brand.50" borderRadius="xl" borderLeft="3px solid" borderLeftColor="brand.400">
                <Text fontWeight="700" color="brand.800" mb={1}>Réserve héréditaire</Text>
                <Text fontSize="xs">Droit minimal garanti : 1 enfant = 1/2, 2 enfants = 2/3, 3+ = 3/4 du patrimoine.</Text>
              </Box>
              <Box p={3} bg="brand.50" borderRadius="xl" borderLeft="3px solid" borderLeftColor="brand.400">
                <Text fontWeight="700" color="brand.800" mb={1}>Abattement fiscal</Text>
                <Text fontSize="xs">Chaque enfant bénéficie d'un abattement de 100 000 € sur sa part d'héritage.</Text>
              </Box>
              <Box p={3} bg="brand.50" borderRadius="xl" borderLeft="3px solid" borderLeftColor="brand.400">
                <Text fontWeight="700" color="brand.800" mb={1}>Représentation</Text>
                <Text fontSize="xs">En cas de prédécès d'un enfant, ses propres enfants prennent sa place.</Text>
              </Box>
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Card w="full" variant="outline" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm" overflow="hidden">
        <CardHeader bg="gray.50" py={4} px={6} borderBottom="1px solid" borderColor="gray.200">
          <Heading size="sm" color="gray.800">4. Composition de la famille</Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Indiquez le nombre de vos enfants.
          </Text>
        </CardHeader>
        <CardBody px={6} py={6}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={6} align="stretch">
              {errors.nombre_enfants?.message && (
                <Alert status="error" w="full" fontSize="xs" py={2} borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>{String(errors.nombre_enfants.message)}</AlertDescription>
                </Alert>
              )}

              {/* Question principale */}
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="700" mb={2}>
                  Combien d'enfants avez-vous ?
                </FormLabel>
                <Text fontSize="xs" color="gray.600" mb={4}>
                  Incluez tous vos enfants. Chaque enfant bénéficie d'un abattement 
                  de 100 000 € et d'une part de réserve héréditaire.
                </Text>

                <HStack justify="center" mb={6}>
                  <NumberInput 
                    min={0} 
                    max={20} 
                    size="lg" 
                    value={nombre}
                    onChange={(_, valueNumber) => syncNombre(isNaN(valueNumber) ? 0 : valueNumber)}
                    w="150px"
                  >
                    <NumberInputField textAlign="center" fontSize="xl" fontWeight="bold" borderRadius="xl" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </HStack>

                {/* Impacts fiscaux */}
                <Accordion allowToggle border="1px solid" borderColor="brand.200" borderRadius="xl" overflow="hidden">
                  <AccordionItem isDisabled={nombre === 0} border="none">
                    <h3>
                      <AccordionButton px={4} py={3}>
                        <HStack flex="1" spacing={3}>
                          <Badge colorScheme="brand" px={2} py={1} borderRadius="md">Impact fiscal</Badge>
                          <Text fontSize="sm" fontWeight="700">{nombre > 0 ? `${nombre} enfant${nombre > 1 ? 's' : ''}` : 'Aucun enfant'}</Text>
                        </HStack>
                        <AccordionIcon />
                      </AccordionButton>
                    </h3>
                    <AccordionPanel px={4} py={4} bg="gray.50">
                      {nombre > 0 ? (
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} w="full">
                          <Box>
                            <Text fontSize="sm" color="gray.700">
                              <Badge colorScheme="green" mr={2}>Abattement total</Badge>
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(nombre * 100000)}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.700">
                              <Badge colorScheme="blue" mr={2}>Réserve héréditaire</Badge>
                              {nombre === 1 ? '50%' : nombre === 2 ? '66,67%' : '75%'} de votre patrimoine
                            </Text>
                          </Box>
                        </SimpleGrid>
                      ) : (
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color="gray.700">• À votre conjoint/partenaire (si vous en avez un)</Text>
                          <Text fontSize="xs" color="gray.700">• À vos parents ou votre fratrie (si vous êtes célibataire)</Text>
                          <Text fontSize="xs" color="gray.700">• Vous disposez d'une liberté totale pour léguer vos biens</Text>
                        </VStack>
                      )}
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </FormControl>

              {/* Détails des enfants si présents */}
              {nombre > 0 && (
                <VStack spacing={4} w="full">
                  <Divider my={2} />
                  <Box w="full">
                    <Heading size="sm" mb={2} color="gray.800">
                      Informations optionnelles par enfant
                    </Heading>
                    <Text fontSize="sm" color="gray.600" mb={4}>
                      Ces détails nous aident à affiner les calculs et recommandations.
                    </Text>

                    {fields.map((field, idx) => {
                      const childName = `enfants.${idx}` as const;
                      return (
                        <Card key={field.id} variant="outline" mb={4} borderRadius="xl" borderColor="gray.200" boxShadow="sm">
                          <CardBody px={5} py={5}>
                            <HStack justifyContent="space-between" mb={4}>
                              <Heading size="xs" color="gray.800" bg="gray.100" px={3} py={1} borderRadius="full">
                                Enfant {idx + 1}
                              </Heading>
                              {nombre > 1 && (
                                <IconButton 
                                  aria-label="supprimer" 
                                  icon={<DeleteIcon boxSize={4} />} 
                                  variant="ghost" 
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => syncNombre(nombre - 1)}
                                />
                              )}
                            </HStack>

                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600">Prénom (optionnel)</FormLabel>
                                <Input 
                                  {...register(`${childName}.prenom`)} 
                                  placeholder={`Enfant ${idx + 1}`}
                                  bg="white"
                                  size="md"
                                  borderRadius="md"
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600">Âge (optionnel)</FormLabel>
                                <NumberInput min={0} max={100} size="md">
                                  <NumberInputField 
                                    {...register(`${childName}.age`, { valueAsNumber: true })}
                                    bg="white"
                                    placeholder="Ex: 25"
                                    borderRadius="md"
                                  />
                                </NumberInput>
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                  L'âge peut influencer certaines stratégies de transmission
                                </Text>
                              </FormControl>
                            </SimpleGrid>

                            {hasPartner && (
                              <Box mt={4} p={4} bg="blue.50" borderRadius="xl" borderWidth="1px" borderColor="blue.200">
                                <FormLabel fontSize="sm" fontWeight="700" mb={3}>
                                  Cet enfant est-il commun avec votre conjoint ?
                                </FormLabel>
                                <RadioGroup 
                                  value={watch(`${childName}.communAvecConjoint`) === true ? "oui" : "non"}
                                  onChange={(value) => {
                                    const newValue = value === "oui";
                                    setValue(`${childName}.communAvecConjoint`, newValue, { 
                                      shouldValidate: true, 
                                      shouldDirty: true 
                                    });
                                  }}
                                >
                                  <HStack spacing={4}>
                                    <Radio value="oui" colorScheme="brand" size="md">
                                      <Text fontSize="sm" fontWeight="600">Oui, enfant commun</Text>
                                    </Radio>
                                    <Radio value="non" colorScheme="brand" size="md">
                                      <Text fontSize="sm" fontWeight="600">Non, d'une union précédente</Text>
                                    </Radio>
                                  </HStack>
                                </RadioGroup>
                                {watch(`${childName}.communAvecConjoint`) === false && (
                                  <Box 
                                    mt={3} 
                                    p={3} 
                                    bg="orange.50" 
                                    borderLeft="3px solid" 
                                    borderLeftColor="orange.500"
                                    borderRadius="md"
                                  >
                                    <Text fontSize="xs" color="orange.800" fontWeight="600">
                                      ⚠️ Important: Si au moins un enfant n'est pas commun, le conjoint survivant sera limité à 1/4 en pleine propriété (pas d'option usufruit sur la totalité selon Art. 757 CC).
                                    </Text>
                                  </Box>
                                )}
                              </Box>
                            )}
                            {/* Handicap */}
                            <Box mt={4} p={4} bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
                              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                <Box flex={1} pr={4}>
                                  <FormLabel mb="0" fontSize="sm" fontWeight="700">
                                    Cet enfant est-il en situation de handicap ?
                                  </FormLabel>
                                  <Text fontSize="xs" color="gray.600" mt={1}>
                                    Art. 779 II CGI — Abattement supplémentaire de 159 325 € cumulable avec l'abattement de droit commun (100 000 €).
                                  </Text>
                                </Box>
                                <Switch
                                  {...register(`${childName}.handicape`)}
                                  colorScheme="brand"
                                  size="md"
                                />
                              </FormControl>
                            </Box>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </Box>
                </VStack>
              )}

              {/* Message pédagogique */}
              <Accordion allowToggle border="1px solid" borderColor="brand.200" borderRadius="xl" overflow="hidden">
                <AccordionItem border="none">
                  <h3>
                    <AccordionButton px={4} py={3} _expanded={{ bg: 'brand.50' }}>
                      <HStack flex="1" spacing={3}>
                        <Icon as={FiInfo} color="brand.500" boxSize={5} />
                        <Text fontSize="sm" fontWeight="700" color="brand.800">
                          Bon à savoir sur la transmission aux enfants
                        </Text>
                      </HStack>
                      <AccordionIcon color="brand.500" />
                    </AccordionButton>
                  </h3>
                  <AccordionPanel px={4} py={4} bg="brand.50">
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="brand.800">• Chaque enfant peut recevoir 100 000 € tous les 15 ans sans droits (donation)</Text>
                      <Text fontSize="sm" color="brand.800">• Pour la succession : abattement de 100 000 € par enfant également</Text>
                      <Text fontSize="sm" color="brand.800">• La réserve héréditaire garantit une part minimum</Text>
                      <Text fontSize="sm" color="brand.800">• L'assurance-vie permet de transmettre en complément hors succession</Text>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              <HStack justifyContent="space-between" mt={4} w="full">
                <Button 
                  variant="outline" 
                  onClick={onBack} 
                  size="md"
                  borderRadius="xl"
                >
                  ← Précédent
                </Button>
                <Button 
                  type="submit" 
                  colorScheme="brand" 
                  size="md" 
                  borderRadius="xl"
                  px={8}
                  rightIcon={<Text>→</Text>}
                >
                  {nombre === 0 ? 'Continuer vers la famille' : 'Continuer vers le patrimoine'}
                </Button>
              </HStack>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </VStack>
  );
}
