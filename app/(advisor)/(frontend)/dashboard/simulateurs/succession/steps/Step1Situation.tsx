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
  Radio,
  RadioGroup,
  Stack,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertDescription,
  Icon,
  Badge,
  SimpleGrid,
  List,
  ListItem,
  ListIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Switch
} from '../compat';
import { FiHeart, FiUsers, FiInfo, FiCheckCircle, FiRepeat } from 'react-icons/fi';
// import { step1SituationSchema } from '../validation/schemas';

// Validation temporairement désactivée pour MVP
export type Step1SituationValues = any; // z.infer<typeof step1SituationSchema>;

export function Step1Situation({
  defaultValues,
  onSubmit,
  onBack,
}: {
  defaultValues: Step1SituationValues;
  onSubmit: (values: Step1SituationValues) => void;
  onBack: () => void;
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Step1SituationValues>({
    // resolver: zodResolver(...), // Validation temporairement désactivée
    defaultValues,
  });

  const statut = watch('statut_matrimonial');

  // Informations détaillées selon le statut choisi
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'marié':
        return {
          color: 'green',
          title: 'Mariage - Régime fiscal privilégié',
          benefits: [
          
            'Possibilité de faire une Donation au Dernier Vivant (DDV)',
            'Options d\'usufruit/nue-propriété avantageuses',
            'Régime matrimonial déterminant pour les biens communs'
          ]
        };
      case 'pacsé':
        return {
          color: 'blue',
          title: '🤝 PACS - Avantages fiscaux identiques au mariage',
          benefits: [
          
            'Transmission sans droits entre partenaires',
            'Choix du régime : indivision ou séparation de biens',
            'Possibilité d\'optimisation fiscale similaire au mariage'
          ]
        };
      case 'concubinage':
        return {
          color: 'orange',
          title: '👫 Concubinage - Aucun avantage fiscal',
          benefits: [
            'Aucun abattement entre concubins (droits à 60%)',
            'Transmission très coûteuse fiscalement',
            'Fortement recommandé d\'envisager un PACS ou mariage',
            'Nécessité d\'optimiser via assurance-vie et donations'
          ]
        };
      case 'célibataire':
        return {
          color: 'gray',
          title: '🚶 Célibataire - Transmission directe aux héritiers',
          benefits: [
            'Transmission directe aux enfants (abattement 100 000 € /enfant)',
            'Si pas d\'enfant : transmission aux parents ou fratrie',
            'Possibilité de donations de son vivant pour optimiser',
            'Stratégies d\'assurance-vie recommandées'
          ]
        };
      default:
        return null;
    }
  };

  const statusInfo = statut ? getStatusInfo(statut) : null;

  return (
    <VStack spacing={6} maxW="800px" mx="auto" align="stretch">
      <Box p={6} bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
        <HStack spacing={3} align="start">
          <Box p={3} bg="pink.50" borderRadius="xl" color="pink.600">
            <Icon as={FiHeart} boxSize={6} />
          </Box>
          <VStack align="start" spacing={1}>
            <Heading size="md" color="gray.900">
              Votre situation familiale et matrimoniale
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Cette information est fondamentale car elle détermine vos droits fiscaux, 
              les abattements applicables et les stratégies d'optimisation possibles.
            </Text>
          </VStack>
        </HStack>
      </Box>

      <Card w="full" variant="outline" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm" overflow="hidden">
        <CardHeader py={4} px={6} borderBottom="1px solid" borderColor="gray.200" bg="gray.50">
          <Heading size="sm" color="gray.800">2. Votre Situation Matrimoniale</Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Le statut matrimonial influence directement la fiscalité de votre succession.
          </Text>
        </CardHeader>
        <CardBody px={6} py={6}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4} align="stretch">
              {errors.statut_matrimonial?.message && (
                <Alert status="error" w="full" fontSize="xs" py={2} borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>{String(errors.statut_matrimonial.message)}</AlertDescription>
                </Alert>
              )}

              <FormControl isInvalid={!!errors.statut_matrimonial} isRequired>
                <FormLabel fontSize="sm" fontWeight="600" mb={2}>
                  Quel est votre statut matrimonial actuel ?
                </FormLabel>

                <RadioGroup 
                  value={statut || ''} 
                  onChange={(v) => setValue('statut_matrimonial', v as any, { shouldValidate: true })}
                >
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Card
                      variant="outline"
                      cursor="pointer"
                      borderWidth="2px"
                      borderColor={statut === 'marié' ? 'brand.500' : 'gray.200'}
                      bg={statut === 'marié' ? 'brand.50' : 'white'}
                      _hover={{ borderColor: statut === 'marié' ? 'brand.500' : 'brand.300', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                      onClick={() => setValue('statut_matrimonial', 'marié', { shouldValidate: true })}
                      borderRadius="xl"
                    >
                      <Box p={4}>
                        <Radio value="marié" size="lg" colorScheme="brand" mb={2}>
                          <Text fontWeight="700" fontSize="md">Marié(e)</Text>
                        </Radio>
                        <Text fontSize="xs" color="gray.600" ml={8}>
                          Union civile officielle avec tous les avantages fiscaux
                        </Text>
                      </Box>
                    </Card>

                    <Card
                      variant="outline"
                      cursor="pointer"
                      borderWidth="2px"
                      borderColor={statut === 'pacsé' ? 'brand.500' : 'gray.200'}
                      bg={statut === 'pacsé' ? 'brand.50' : 'white'}
                      _hover={{ borderColor: statut === 'pacsé' ? 'brand.500' : 'brand.300', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                      onClick={() => setValue('statut_matrimonial', 'pacsé', { shouldValidate: true })}
                      borderRadius="xl"
                    >
                      <Box p={4}>
                        <Radio value="pacsé" size="lg" colorScheme="brand" mb={2}>
                          <Text fontWeight="700" fontSize="md">🤝 PACSé(e)</Text>
                        </Radio>
                        <Text fontSize="xs" color="gray.600" ml={8}>
                          Pacte civil avec avantages fiscaux identiques au mariage
                        </Text>
                      </Box>
                    </Card>

                    <Card
                      variant="outline"
                      cursor="pointer"
                      borderWidth="2px"
                      borderColor={statut === 'concubinage' ? 'brand.500' : 'gray.200'}
                      bg={statut === 'concubinage' ? 'brand.50' : 'white'}
                      _hover={{ borderColor: statut === 'concubinage' ? 'brand.500' : 'brand.300', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                      onClick={() => setValue('statut_matrimonial', 'concubinage', { shouldValidate: true })}
                      borderRadius="xl"
                    >
                      <Box p={4}>
                        <Radio value="concubinage" size="lg" colorScheme="brand" mb={2}>
                          <Text fontWeight="700" fontSize="md">👫 En concubinage</Text>
                        </Radio>
                        <Text fontSize="xs" color="gray.600" ml={8}>
                          Union libre sans avantage fiscal (taxation 60%)
                        </Text>
                      </Box>
                    </Card>

                    <Card
                      variant="outline"
                      cursor="pointer"
                      borderWidth="2px"
                      borderColor={statut === 'célibataire' ? 'brand.500' : 'gray.200'}
                      bg={statut === 'célibataire' ? 'brand.50' : 'white'}
                      _hover={{ borderColor: statut === 'célibataire' ? 'brand.500' : 'brand.300', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                      onClick={() => setValue('statut_matrimonial', 'célibataire', { shouldValidate: true })}
                      borderRadius="xl"
                    >
                      <Box p={4}>
                        <Radio value="célibataire" size="lg" colorScheme="brand" mb={2}>
                          <Text fontWeight="700" fontSize="md">🚶 Célibataire</Text>
                        </Radio>
                        <Text fontSize="xs" color="gray.600" ml={8}>
                          Sans conjoint, transmission directe aux héritiers
                        </Text>
                      </Box>
                    </Card>
                  </SimpleGrid>
                </RadioGroup>
              </FormControl>

              {statusInfo && (
                <Accordion allowToggle border="1px solid" borderColor={`${statusInfo.color}.200`} borderRadius="xl" overflow="hidden">
                  <AccordionItem border="none">
                    <h3>
                      <AccordionButton px={4} py={3} _expanded={{ bg: `${statusInfo.color}.50` }} bg={`${statusInfo.color}.50`}>
                        <HStack flex="1" spacing={3} align="center">
                          <Icon as={FiInfo} color={`${statusInfo.color}.500`} boxSize={5} />
                          <Text fontWeight="700" fontSize="sm" color={`${statusInfo.color}.800`}>
                            {statusInfo.title}
                          </Text>
                        </HStack>
                        <AccordionIcon />
                      </AccordionButton>
                    </h3>
                    <AccordionPanel px={4} py={4} bg={`${statusInfo.color}.50`}>
                      <VStack align="start" spacing={3} w="full">
                        <Text fontWeight="700" color={`${statusInfo.color}.800`} fontSize="sm">
                          💰 Implications fiscales et patrimoniales :
                        </Text>
                        <List spacing={2}>
                          {statusInfo.benefits.map((benefit, index) => (
                            <ListItem key={index} fontSize="sm" color={`${statusInfo.color}.900`}>
                              <ListIcon as={FiCheckCircle} color={`${statusInfo.color}.500`} />
                              {benefit}
                            </ListItem>
                          ))}
                        </List>
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Mode couple toggle — visible uniquement pour les couples */}
              {statut && statut !== 'célibataire' && (
                <Box
                  p={4}
                  bg="blue.50"
                  border="1px solid"
                  borderColor="blue.200"
                  borderRadius="xl"
                >
                  <HStack justify="space-between" align="center">
                    <HStack spacing={3}>
                      <Icon as={FiRepeat} color="blue.500" boxSize={5} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="700" fontSize="sm" color="blue.800">
                          Gérer le patrimoine en mode "Couple"
                        </Text>
                        <Text fontSize="xs" color="blue.600">
                          Active les calculs partagés (50/50, biens propres, etc.)
                        </Text>
                      </VStack>
                    </HStack>
                    <Switch {...register('isCouple')} colorScheme="brand" size="md" />
                  </HStack>
                </Box>
              )}

              <Accordion allowToggle border="1px solid" borderColor="brand.200" borderRadius="md">
                <AccordionItem border="none">
                  <h3>
                    <AccordionButton px={3} py={2} _expanded={{ bg: 'brand.50' }}>
                      <HStack flex="1" spacing={2}>
                        <Icon as={FiUsers} color="brand.500" boxSize={4} />
                        <Text fontSize="sm" fontWeight="600" color="brand.700">
                          Notre objectif avec cette information
                        </Text>
                      </HStack>
                      <AccordionIcon color="brand.500" />
                    </AccordionButton>
                  </h3>
                  <AccordionPanel px={3} py={3} bg="brand.50">
                    <Text fontSize="xs" color="brand.700">
                      Nous analyserons votre situation pour vous proposer les meilleures stratégies d'optimisation : 
                      donations, testament, assurance-vie, régime matrimonial... Chaque statut offre des opportunités spécifiques 
                      que nous identifierons pour vous.
                    </Text>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              <HStack justifyContent="space-between" mt={2} w="full">
                <Button variant="ghost" onClick={onBack} size="sm">
                  ← Précédent
                </Button>
                <Button 
                  type="submit" 
                  colorScheme="blue" 
                  size="sm" 
                  px={6}
                  rightIcon={<Text>→</Text>}
                  isDisabled={!statut}
                >
                  {statut && statut !== 'célibataire' ? 'Continuer vers le conjoint' : 'Continuer vers les enfants'}
                </Button>
              </HStack>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </VStack>
  );
}
