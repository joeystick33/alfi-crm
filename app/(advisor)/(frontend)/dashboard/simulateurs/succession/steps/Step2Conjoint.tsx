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
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  Text,
  VStack,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Icon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '../compat';
import { FiHeart, FiFileText } from 'react-icons/fi';
// import { step2ConjointSchema } from '../validation/schemas';

// Validation temporairement désactivée pour MVP
export type Step2ConjointValues = any; // z.infer<typeof step2ConjointSchema>;

export function Step2Conjoint({
  defaultValues,
  statut,
  onSubmit,
  onBack,
}: {
  defaultValues: Step2ConjointValues;
  statut: 'marié' | 'pacsé' | 'concubinage' | 'célibataire' | null;
  onSubmit: (values: Step2ConjointValues) => void;
  onBack: () => void;
}) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<Step2ConjointValues>({
    // resolver: zodResolver(...), // Validation temporairement désactivée
    defaultValues,
  });

  const regime = watch('regimeMatrimonial');
  const sexeConjoint = watch('sexe');

  const label = statut === 'marié' ? 'votre conjoint(e)' : statut === 'pacsé' ? 'votre partenaire' : statut === 'concubinage' ? 'votre concubin(e)' : 'votre conjoint(e)/partenaire';
  const labelCapitalized = statut === 'marié' ? 'Conjoint(e)' : statut === 'pacsé' ? 'Partenaire' : statut === 'concubinage' ? 'Concubin(e)' : 'Conjoint(e)/Partenaire';

  const showRegime = statut === 'marié';
  const showClauseAI = showRegime && regime === 'COMMUNAUTE_UNIVERSELLE';
  const showDDV = statut === 'marié';

  return (
    <VStack spacing={6} maxW="800px" mx="auto" align="stretch">
      <Box p={6} bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
        <HStack spacing={3} align="start">
          <Box p={3} bg="pink.50" borderRadius="xl" color="pink.600">
            <Icon as={FiHeart} boxSize={6} />
          </Box>
          <VStack align="start" spacing={1}>
            <Heading size="md" color="gray.900">
              Informations sur {label}
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Ces informations sont essentielles pour calculer les droits du conjoint survivant.
            </Text>
          </VStack>
        </HStack>
      </Box>

      <Card w="full" variant="outline" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm" overflow="hidden">
        <CardHeader bg="gray.50" py={4} px={6} borderBottom="1px solid" borderColor="gray.200">
          <Heading size="sm" color="gray.800">3. Identité du conjoint</Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Veuillez renseigner les informations d'état civil.
          </Text>
        </CardHeader>
        <CardBody px={6} py={6}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={6} align="stretch">
              {/* Civilité du conjoint */}
              <FormControl isRequired>
                <FormLabel fontWeight="600" fontSize="sm" mb={2}>
                  👤 {labelCapitalized} est
                </FormLabel>
                <RadioGroup 
                  value={sexeConjoint || ''} 
                  onChange={(val) => setValue('sexe', val as 'M' | 'F')}
                >
                  <HStack spacing={4} align="stretch">
                    <Card 
                      variant="outline" 
                      cursor="pointer"
                      borderWidth="2px"
                      borderColor={sexeConjoint === 'M' ? 'brand.500' : 'gray.200'}
                      bg={sexeConjoint === 'M' ? 'brand.50' : 'white'}
                      _hover={{ borderColor: sexeConjoint === 'M' ? 'brand.500' : 'brand.300', transform: 'translateY(-2px)' }}
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
                      borderColor={sexeConjoint === 'F' ? 'brand.500' : 'gray.200'}
                      bg={sexeConjoint === 'F' ? 'brand.50' : 'white'}
                      _hover={{ borderColor: sexeConjoint === 'F' ? 'brand.500' : 'brand.300', transform: 'translateY(-2px)' }}
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
              </FormControl>

              <Divider my={2} />

              {/* Prénom et Nom */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} w="full">
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel fontWeight="600" fontSize="sm" mb={1}>Prénom</FormLabel>
                    <Input 
                      placeholder="Ex: Marie" 
                      {...register('prenom')}
                      bg="white"
                      size="md"
                      borderRadius="md"
                      borderColor="gray.300"
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired>
                    <FormLabel fontWeight="600" fontSize="sm" mb={1}>Nom de famille</FormLabel>
                    <Input 
                      placeholder="Ex: Martin" 
                      {...register('nom')}
                      bg="white"
                      size="md"
                      borderRadius="md"
                      borderColor="gray.300"
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              {/* Âge */}
              <FormControl>
                <FormLabel fontWeight="600" fontSize="sm" mb={1}>Âge</FormLabel>
                <NumberInput min={18} max={120} size="md">
                  <NumberInputField
                    {...register('age', { valueAsNumber: true })}
                    placeholder="Ex: 62"
                    bg="white"
                    borderRadius="md"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  💡 Nécessaire pour valoriser l'usufruit (DDV ou ab intestat)
                </Text>
              </FormControl>

              {/* Régime matrimonial (mariés uniquement) */}
              {showRegime && (
                <>
                  <Divider my={2} />
                  <Accordion allowToggle border="1px solid" borderColor="brand.200" borderRadius="xl" overflow="hidden">
                    <AccordionItem border="none">
                      <h3>
                        <AccordionButton px={4} py={3} _expanded={{ bg: 'brand.50' }}>
                          <HStack flex="1" spacing={3}>
                            <Icon as={FiFileText} color="brand.600" boxSize={5} />
                            <Text fontSize="sm" fontWeight="700" color="brand.800">Régime matrimonial</Text>
                          </HStack>
                          <AccordionIcon />
                        </AccordionButton>
                      </h3>
                      <AccordionPanel px={4} py={4}>
                        <FormControl isRequired>
                          <FormLabel fontWeight="600" fontSize="sm" mb={2}>Votre contrat de mariage</FormLabel>
                          <Select 
                            {...register('regimeMatrimonial')} 
                            placeholder="Sélectionnez votre régime..."
                            size="md"
                            bg="white"
                            borderRadius="md"
                          >
                            <option value="COMMUNAUTE_LEGALE">🟪 Communauté légale (régime par défaut)</option>
                            <option value="SEPARATION_BIENS">🔵 Séparation de biens</option>
                            <option value="COMMUNAUTE_UNIVERSELLE">� Communauté universelle</option>
                            <option value="PARTICIPATION_ACQUETS">🟢 Participation aux acquêts</option>
                          </Select>
                          <Alert status="info" mt={3} fontSize="xs" borderRadius="md">
                            <AlertIcon />
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="600">Rappel des régimes :</Text>
                              <Text>• <strong>Communauté légale</strong> : biens acquis pendant le mariage = communs (50/50)</Text>
                              <Text>• <strong>Séparation de biens</strong> : chacun conserve ses biens propres</Text>
                              <Text>• <strong>Communauté universelle</strong> : tous les biens sont communs</Text>
                              <Text>• <strong>Participation aux acquêts</strong> : séparation durant le mariage, partage des acquêts à la dissolution</Text>
                            </VStack>
                          </Alert>
                        </FormControl>

                        {showClauseAI && (
                          <Box mt={4} p={4} bg="brand.50" borderRadius="xl" borderWidth="1px" borderColor="brand.200">
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <Box flex={1} pr={4}>
                                <FormLabel mb={1} fontWeight="700" fontSize="sm">Clause d'attribution intégrale</FormLabel>
                                <Text fontSize="xs" color="gray.600">
                                  Le survivant reçoit l'intégralité de la communauté
                                </Text>
                              </Box>
                              <Switch 
                                {...register('clauseAttributionIntegrale')}
                                size="md"
                                colorScheme="brand"
                              />
                            </FormControl>
                          </Box>
                        )}

                        {showDDV && (
                          <Box mt={4} p={4} bg="blue.50" borderRadius="xl" borderWidth="1px" borderColor="blue.200">
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <Box flex={1} pr={4}>
                                <FormLabel mb={1} fontWeight="700" fontSize="sm">Donation au dernier vivant (DDV)</FormLabel>
                                <Text fontSize="xs" color="gray.600">
                                  Protège le conjoint survivant en augmentant ses droits
                                </Text>
                              </Box>
                              <Switch 
                                {...register('donationDernierVivant')}
                                size="md"
                                colorScheme="blue"
                              />
                            </FormControl>
                          </Box>
                        )}
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </>
              )}

              {/* PACS : choix du régime */}
              {statut === 'pacsé' && (
                <>
                  <Divider my={1} />
                  <Accordion allowToggle border="1px solid" borderColor="orange.200" borderRadius="md">
                    <AccordionItem>
                      <h3>
                        <AccordionButton px={3} py={2} _expanded={{ bg: 'orange.50' }}>
                          <HStack flex="1" spacing={2}>
                            <Icon as={FiFileText} color="orange.600" boxSize={4} />
                            <Text fontSize="sm" fontWeight="600" color="orange.800">🤝 Régime du PACS</Text>
                          </HStack>
                          <AccordionIcon />
                        </AccordionButton>
                      </h3>
                      <AccordionPanel px={3} py={3}>
                        <FormControl isRequired>
                          <FormLabel fontWeight="600" fontSize="sm" mb={1}>Votre convention de PACS</FormLabel>
                          <Select 
                            {...register('regimePACS')} 
                            placeholder="Sélectionnez votre régime..."
                            size="sm"
                            bg="white"
                          >
                            <option value="SEPARATION">🔵 Séparation de biens (régime par défaut)</option>
                            <option value="INDIVISION">🟠 Indivision des acquis</option>
                          </Select>
                          <Alert status="info" mt={3} fontSize="xs" borderRadius="md">
                            <AlertIcon />
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="600">Rappel des régimes PACS (Art. 515-5 CC) :</Text>
                              <Text>• <strong>Séparation</strong> (défaut) : chacun conserve ses biens propres</Text>
                              <Text>• <strong>Indivision</strong> : biens acquis pendant le PACS = indivis 50/50</Text>
                            </VStack>
                          </Alert>
                        </FormControl>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </>
              )}

              {/* Concubinage : toujours séparation */}
              {statut === 'concubinage' && (
                <Alert status="info" fontSize="xs" borderRadius="md" py={2}>
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="600">
                      Concubinage : Séparation de biens
                    </Text>
                    <Text>
                      En concubinage, chacun conserve ses biens propres. 
                      Les biens peuvent être détenus en indivision (à préciser dans l'étape Patrimoine).
                    </Text>
                  </VStack>
                </Alert>
              )}

              <HStack justifyContent="space-between" mt={2} w="full">
                <Button 
                  variant="ghost" 
                  onClick={onBack}
                  size="sm"
                >
                  ← Retour
                </Button>
                <Button 
                  type="submit" 
                  colorScheme="pink"
                  size="sm"
                  px={6}
                  rightIcon={<Text>→</Text>}
                >
                  Continuer
                </Button>
              </HStack>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </VStack>
  );
}
