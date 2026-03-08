import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Collapse,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  MotionBox,
} from '../compat';
// import { step6AssuranceVieSchema } from '../validation/schemas';
import { AddIcon, DeleteIcon } from '../compat';
import { FiShield, FiUsers, FiTrendingUp, FiInfo, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { AnimatePresence } from 'framer-motion';
import { ABATTEMENT_990I_AVANT70, ABATTEMENT_757B_APRES70 } from '../constants/fiscal2025';

// Validation temporairement désactivée pour MVP
export type Step6AssuranceVieValues = any;

export function Step6AssuranceVie({
  defaultValues,
  onSubmit,
  onBack,
}: {
  defaultValues: Step6AssuranceVieValues;
  onSubmit: (values: Step6AssuranceVieValues) => void;
  onBack: () => void;
}) {
  const { register, handleSubmit, control, watch, setValue } = useForm<Step6AssuranceVieValues>({
    // resolver: zodResolver(...), // Validation temporairement désactivée
    defaultValues,
  });

  const presence = watch('presence_assurance_vie');
  const { fields, append, remove } = useFieldArray({ control, name: 'contrats_av' });
  
  // Forcer l'affichage détaillé par défaut
  useEffect(() => {
    if (!presence) {
      setValue('presence_assurance_vie', true, { shouldValidate: true });
    }
  }, [presence, setValue]);

  useEffect(() => {
    if (presence && fields.length === 0) {
      append({
        montantVersementsAvant70: 0,
        montantVersementsApres70: 0,
        valeurContratActuelle: 0,
        beneficiaires: [],
        clauseBeneficiaire: 'STANDARD',
        dateVersement: undefined,
      } as any);
    }
  }, [presence, fields.length, append]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateTotalAV = () => {
    return fields.reduce((total, _, index) => {
      const avant70 = watch(`contrats_av.${index}.montantVersementsAvant70` as const) || 0;
      const apres70 = watch(`contrats_av.${index}.montantVersementsApres70` as const) || 0;
      return total + avant70 + apres70;
    }, 0);
  };

  const calculateTotalValeurContrats = () => {
    return fields.reduce((total, _, index) => {
      const val = watch(`contrats_av.${index}.valeurContratActuelle` as const) || 0;
      return total + val;
    }, 0);
  };

  return (
    <VStack spacing={6} align="stretch" maxW="800px" mx="auto">
      <Box p={6} bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
        <HStack spacing={3} align="start">
          <Box p={3} bg="brand.50" borderRadius="xl" color="brand.600">
            <Icon as={FiShield} boxSize={6} />
          </Box>
          <VStack align="start" spacing={1}>
            <Heading size="md" color="gray.900">
              Assurance-vie
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Fiscalité spécifique selon l'âge des versements et les bénéficiaires.
            </Text>
          </VStack>
        </HStack>
      </Box>

      <Accordion allowToggle borderRadius="xl" borderWidth="1px" borderColor="brand.200" overflow="hidden">
        <AccordionItem border="none">
          <h3>
            <AccordionButton px={4} py={3} _expanded={{ bg: 'brand.50' }}>
              <HStack flex="1" spacing={3}>
                <Icon as={FiInfo} color="brand.500" boxSize={5} />
                <Text fontSize="sm" fontWeight="700" color="brand.800">
                  Pourquoi l'assurance-vie est stratégique ?
                </Text>
              </HStack>
              <AccordionIcon color="brand.500" />
            </AccordionButton>
          </h3>
          <AccordionPanel px={4} py={4}>
            <VStack align="stretch" spacing={3} fontSize="sm" color="gray.700">
              <Box p={3} bg="brand.50" borderRadius="xl" borderLeft="3px solid" borderLeftColor="brand.400">
                <Text fontWeight="700" color="brand.800" mb={1}>Hors succession</Text>
                <Text fontSize="xs">Les capitaux sont versés directement aux bénéficiaires, sans passer par le notaire.</Text>
              </Box>
              <Box p={3} bg="brand.50" borderRadius="xl" borderLeft="3px solid" borderLeftColor="brand.400">
                <Text fontWeight="700" color="brand.800" mb={1}>Abattements fiscaux</Text>
                <Text fontSize="xs">Avant 70 ans : {formatCurrency(ABATTEMENT_990I_AVANT70)} par bénéficiaire — Après 70 ans : {formatCurrency(ABATTEMENT_757B_APRES70)} au total.</Text>
              </Box>
              <Box p={3} bg="brand.50" borderRadius="xl" borderLeft="3px solid" borderLeftColor="brand.400">
                <Text fontWeight="700" color="brand.800" mb={1}>Liberté de désignation</Text>
                <Text fontSize="xs">Choisissez librement les bénéficiaires : conjoint, enfants, famille, proches, association…</Text>
              </Box>
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Card bg="gray.50" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
        <CardBody px={6} py={6}>
          <Heading size="sm" color="gray.800" mb={4}>
            Versements avant ou après 70 ans ?
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box p={4} bg="white" borderRadius="xl" borderLeft="4px solid" borderColor="brand.500" boxShadow="sm">
              <Text fontWeight="700" color="brand.800" fontSize="sm" mb={2}>Versements AVANT 70 ans</Text>
              <Text fontSize="xs" color="gray.600" lineHeight="tall">
                • Abattement : {formatCurrency(ABATTEMENT_990I_AVANT70)} <strong>par bénéficiaire</strong><br/>
                • Taxation : 20% jusqu'à 700 000 €, puis 31,25%<br/>
                • Conseil : privilégiez cette tranche d'âge
              </Text>
            </Box>

            <Box p={4} bg="white" borderRadius="xl" borderLeft="4px solid" borderColor="orange.500" boxShadow="sm">
              <Text fontWeight="700" color="orange.800" fontSize="sm" mb={2}>Versements APRÈS 70 ans</Text>
              <Text fontSize="xs" color="gray.600" lineHeight="tall">
                • Abattement : {formatCurrency(ABATTEMENT_757B_APRES70)} pour l'ensemble des bénéficiaires<br/>
                • Taxation : droits de succession classiques<br/>
                • Conseil : moins avantageux fiscalement
              </Text>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>

      <Card borderRadius="2xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm" overflow="hidden">
        <CardHeader py={4} px={6} borderBottomWidth="1px" borderColor="gray.200" bg="gray.50">
          <Heading size="sm" color="gray.800">6. Vos contrats d'assurance-vie</Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Saisissez les montants de vos contrats pour le calcul de l'abattement spécifique.
          </Text>
        </CardHeader>
        <CardBody px={6} py={6}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={6} align="stretch">
              {/* Contrats d'assurance-vie - toujours affiché en mode détaillé */}
              {true && (
                <VStack spacing={6} w="full">
                  {/* Résumé des contrats */}
                  {fields.length > 0 && (
                    <Card bg="blue.50" w="full" borderRadius="xl" borderWidth="1px" borderColor="blue.200" boxShadow="sm">
                      <CardBody px={4} py={4}>
                        <HStack justify="space-between" align="start">
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                            <Box>
                              <Text fontSize="xs" fontWeight="700" color="blue.800" mb={1}>
                                Total des versements
                              </Text>
                              <Text fontSize="lg" fontWeight="800" color="blue.900">
                                {formatCurrency(calculateTotalAV())}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" fontWeight="700" color="blue.800" mb={1}>
                                Valeur actuelle cumulée
                              </Text>
                              <Text fontSize="lg" fontWeight="800" color="blue.900">
                                {formatCurrency(calculateTotalValeurContrats())}
                              </Text>
                            </Box>
                          </SimpleGrid>
                          <Badge colorScheme="brand" fontSize="sm" px={3} py={1} borderRadius="md" ml={4}>
                            {fields.length} contrat{fields.length > 1 ? 's' : ''}
                          </Badge>
                        </HStack>
                      </CardBody>
                    </Card>
                  )}

                  {/* Liste des contrats */}
                  <VStack spacing={4} w="full">
                    <AnimatePresence>
                      {fields.map((f, i) => (
                        <ContratAVCard
                          key={f.id}
                          index={i}
                          register={register}
                          control={control}
                          watch={watch}
                          setValue={setValue}
                          onDelete={() => remove(i)}
                        />
                      ))}
                    </AnimatePresence>

                    <Button
                      size="md"
                      leftIcon={<AddIcon boxSize={4} />}
                      onClick={() => append({ 
                        montantVersementsAvant70: 0, 
                        montantVersementsApres70: 0, 
                        valeurContratActuelle: 0,
                        beneficiaires: [],
                        clauseBeneficiaire: 'STANDARD'
                      } as any)}
                      variant="outline"
                      colorScheme="brand"
                      w="full"
                      py={6}
                      borderStyle="dashed"
                      borderWidth="2px"
                      borderRadius="xl"
                      _hover={{ bg: 'brand.50', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                    >
                      <VStack spacing={0}>
                        <Text fontWeight="700" fontSize="md">Ajouter un contrat d'assurance-vie</Text>
                        <Text fontSize="xs" opacity={0.8} fontWeight="normal">
                          Contrat individuel
                        </Text>
                      </VStack>
                    </Button>
                  </VStack>
                </VStack>
              )}

              {/* Message pédagogique */}
              <Box bg="blue.50" p={4} borderRadius="xl" w="full" border="1px solid" borderColor="blue.200">
                <HStack mb={2}>
                  <Icon as={FiInfo} color="blue.500" boxSize={5} />
                  <Text fontSize="sm" fontWeight="700" color="blue.800">
                    Fiscalité de l'assurance-vie
                  </Text>
                </HStack>
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" color="blue.800">
                    • <strong>Versements avant 70 ans</strong> : {formatCurrency(ABATTEMENT_990I_AVANT70)} d'abattement par bénéficiaire (CGI 990 I)
                  </Text>
                  <Text fontSize="sm" color="blue.800">
                    • <strong>Versements après 70 ans</strong> : {formatCurrency(ABATTEMENT_757B_APRES70)} d'abattement total (CGI 757 B)
                  </Text>
                  <Text fontSize="sm" color="blue.800">
                    • <strong>Clause démembrée</strong> : Optimisation possible avec usufruit/nue-propriété
                  </Text>
                </VStack>
              </Box>

              <HStack justifyContent="space-between" mt={4} pt={4} borderTop="1px solid" borderColor="gray.200" w="full">
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
                  Continuer vers les dispositions (DDV)
                </Button>
              </HStack>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </VStack>
  );
}

// Composant pour un contrat d'assurance-vie individuel
function ContratAVCard({ 
  index, 
  register, 
  control, 
  watch, 
  setValue,
  onDelete 
}: {
  index: number;
  register: any;
  control: any;
  watch: any;
  setValue: any;
  onDelete: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true); // Ouvert par défaut
  const [isValidated, setIsValidated] = useState(false);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const avant70 = watch(`contrats_av.${index}.montantVersementsAvant70`) || 0;
  const apres70 = watch(`contrats_av.${index}.montantVersementsApres70`) || 0;
  const valeurActuelle = watch(`contrats_av.${index}.valeurContratActuelle`) || 0;
  const total = avant70 + apres70;
  const clauseBeneficiaire = watch(`contrats_av.${index}.clauseBeneficiaire`) || 'STANDARD';

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      w="full"
    >
      <Card borderWidth="1px" borderColor="gray.200" borderRadius="2xl" bg="white" boxShadow="sm" overflow="hidden">
        <CardHeader py={4} px={5} borderBottomWidth={isExpanded ? '1px' : '0'} borderColor="gray.200" bg="gray.50">
          <HStack justify="space-between" align="center">
            <HStack spacing={3} align="center">
              <Badge colorScheme={isValidated ? "green" : "brand"} variant="subtle" fontSize="xs" px={2} py={1} borderRadius="md">
                {isValidated ? "✅ " : ''}Contrat {index + 1}
              </Badge>
              <Text fontWeight="800" color="gray.900" fontSize="md">
                {total > 0 ? formatCurrency(total) : 'Nouveau contrat'}
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
                rightIcon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                borderRadius="xl"
              >
                {isExpanded ? 'Réduire' : 'Détailler'}
              </Button>
              <IconButton
                aria-label="Supprimer le contrat"
                icon={<DeleteIcon boxSize={4} />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={onDelete}
              />
            </HStack>
          </HStack>
        </CardHeader>

        <CardBody pt={isExpanded ? 5 : 0} px={5} pb={isExpanded ? 5 : 0}>
          <VStack spacing={5} align="stretch">
            {/* Souscripteur du contrat */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="700" mb={2} color="gray.800">
                Souscripteur du contrat
              </FormLabel>
              <RadioGroup
                value={watch(`contrats_av.${index}.souscripteur`) || 'MONSIEUR'}
                onChange={(value) => setValue(`contrats_av.${index}.souscripteur`, value, { shouldValidate: true })}
              >
                <HStack spacing={6}>
                  <Radio value="MONSIEUR" colorScheme="brand" size="md">
                    <Text fontSize="sm" fontWeight="600">Monsieur</Text>
                  </Radio>
                  <Radio value="MADAME" colorScheme="brand" size="md">
                    <Text fontSize="sm" fontWeight="600">Madame</Text>
                  </Radio>
                </HStack>
              </RadioGroup>
              <Text fontSize="xs" color="gray.600" mt={2}>
                Indiquez qui est le souscripteur (assuré) du contrat. En cas de décès du souscripteur, 
                le capital est versé aux bénéficiaires désignés.
              </Text>
            </FormControl>

            <Divider borderColor="gray.200" />

            {/* Montants des versements */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="700" color="gray.800">
                  Versements avant 70 ans (€)
                </FormLabel>
                <NumberInput min={0} size="md">
                  <NumberInputField
                    {...register(`contrats_av.${index}.montantVersementsAvant70`, { valueAsNumber: true })}
                    placeholder="Ex: 100 000"
                    bg="white"
                    borderRadius="md"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="xs" color="brand.600" mt={2} fontWeight="500">
                  {formatCurrency(ABATTEMENT_990I_AVANT70)} d'abattement par bénéficiaire (CGI 990 I)
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="700" color="gray.800">
                  Versements après 70 ans (€)
                </FormLabel>
                <NumberInput min={0} size="md">
                  <NumberInputField
                    {...register(`contrats_av.${index}.montantVersementsApres70`, { valueAsNumber: true })}
                    placeholder="Ex: 50 000"
                    bg="white"
                    borderRadius="md"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="xs" color="orange.600" mt={2} fontWeight="500">
                  {formatCurrency(ABATTEMENT_757B_APRES70)} d'abattement total (CGI 757 B)
                </Text>
              </FormControl>
            </SimpleGrid>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="700" color="gray.800">
                Valeur actuelle du contrat (€)
              </FormLabel>
              <NumberInput min={0} size="md">
                <NumberInputField
                  {...register(`contrats_av.${index}.valeurContratActuelle`, { valueAsNumber: true })}
                  placeholder="Ex: 150 000"
                  bg="white"
                  borderRadius="md"
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            {/* Bouton de validation */}
            {isExpanded && (
              <Box pt={2}>
                <Button
                  onClick={() => {
                    if ((avant70 > 0 || apres70 > 0) && valeurActuelle > 0) {
                      setIsValidated(true);
                      setIsExpanded(false);
                    }
                  }}
                  colorScheme={isValidated ? "green" : "brand"}
                  size="md"
                  width="full"
                  borderRadius="xl"
                  isDisabled={(avant70 === 0 && apres70 === 0) || valeurActuelle === 0}
                >
                  {isValidated ? "✅ Contrat validé" : "💾 Valider ce contrat"}
                </Button>
                {(avant70 === 0 && apres70 === 0) && (
                  <Text fontSize="xs" color="red.500" mt={2} textAlign="center" fontWeight="500">
                    ⚠️ Veuillez renseigner au moins un montant de versement
                  </Text>
                )}
                {valeurActuelle === 0 && (avant70 > 0 || apres70 > 0) && (
                  <Text fontSize="xs" color="red.500" mt={2} textAlign="center" fontWeight="500">
                    ⚠️ Veuillez renseigner la valeur actuelle du contrat
                  </Text>
                )}
              </Box>
            )}

            <Collapse in={isExpanded} animateOpacity>
              <VStack spacing={4} align="stretch">
                <Divider borderColor="gray.200" />

                {/* Clause bénéficiaire */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="700" mb={2} color="gray.800">
                    Type de clause bénéficiaire
                  </FormLabel>
                  <RadioGroup
                    value={clauseBeneficiaire}
                    onChange={(value) => setValue(`contrats_av.${index}.clauseBeneficiaire`, value, { shouldValidate: true })}
                  >
                    <VStack align="start" spacing={3}>
                      <Radio value="STANDARD" size="md" colorScheme="brand">
                        <VStack align="start" spacing={0} ml={2}>
                          <Text fontWeight="700" fontSize="sm">📋 Clause standard</Text>
                          <Text fontSize="xs" color="gray.600">
                            "Mon conjoint, à défaut mes enfants nés ou à naître"
                          </Text>
                        </VStack>
                      </Radio>

                      <Radio value="PERSONNALISE" size="md" colorScheme="brand">
                        <VStack align="start" spacing={0} ml={2}>
                          <Text fontWeight="700" fontSize="sm">✏️ Clause personnalisée</Text>
                          <Text fontSize="xs" color="gray.600">
                            Bénéficiaires nommément désignés avec répartition
                          </Text>
                        </VStack>
                      </Radio>

                      <Radio value="DEMEMBRE" size="md" colorScheme="brand">
                        <VStack align="start" spacing={0} ml={2}>
                          <Text fontWeight="700" fontSize="sm">🔄 Clause démembrée</Text>
                          <Text fontSize="xs" color="gray.600">
                            Usufruit au conjoint, nue-propriété aux enfants
                          </Text>
                        </VStack>
                      </Radio>
                    </VStack>
                  </RadioGroup>
                </FormControl>

                {/* Bénéficiaires détaillés */}
                {(clauseBeneficiaire === 'PERSONNALISE' || clauseBeneficiaire === 'DEMEMBRE') && (
                  <>
                    {clauseBeneficiaire === 'DEMEMBRE' && (
                      <Alert status="warning" borderRadius="xl" fontSize="sm" bg="orange.50" borderWidth="1px" borderColor="orange.200">
                        <AlertIcon />
                        <AlertDescription fontSize="xs">
                          Clause démembrée: les sommes perçues par l'usufruitier sont soumises au quasi‑usufruit. Un acte notarié de reconnaissance de quasi‑usufruit est recommandé.
                        </AlertDescription>
                      </Alert>
                    )}
                    <BeneficiairesSousForm 
                      control={control} 
                      register={register} 
                      parentName={`contrats_av.${index}.beneficiaires`} 
                      mode={clauseBeneficiaire}
                    />
                  </>
                )}

                {/* Impact fiscal calculé */}
                <Box bg="blue.50" p={4} borderRadius="xl" border="1px solid" borderColor="blue.200">
                  <Text fontSize="sm" fontWeight="700" color="blue.800" mb={3}>
                    💰 Estimation fiscale de ce contrat
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="gray.600">Avantage versements avant 70 ans :</Text>
                      <Text fontSize="sm" fontWeight="800" color="brand.600">
                        Jusqu'à {formatCurrency(Math.min(avant70, ABATTEMENT_990I_AVANT70))} exonérés
                      </Text>
                    </VStack>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="gray.600">Avantage versements après 70 ans :</Text>
                      <Text fontSize="sm" fontWeight="800" color="orange.600">
                        Jusqu'à {formatCurrency(Math.min(apres70, ABATTEMENT_757B_APRES70))} exonérés
                      </Text>
                    </VStack>
                  </SimpleGrid>
                </Box>
              </VStack>
            </Collapse>
          </VStack>
        </CardBody>
      </Card>
    </MotionBox>
  );
}

function BeneficiairesSousForm({ control, register, parentName, mode }: { control: any; register: any; parentName: string; mode?: 'STANDARD' | 'PERSONNALISE' | 'DEMEMBRE' }) {
  const { fields, append, remove } = useFieldArray({ control, name: parentName });
  return (
    <Box mt={2}>
      <HStack justifyContent="space-between" mb={3}>
        <Text fontSize="sm" fontWeight="700" color="gray.800">Bénéficiaires détaillés</Text>
        <Button size="sm" variant="outline" colorScheme="brand" leftIcon={<AddIcon boxSize={4} />} onClick={() => append({ nom: '', lien: '', part: undefined, role: undefined } as any)} borderRadius="xl">
          Ajouter bénéficiaire
        </Button>
      </HStack>
      <Stack spacing={3}>
        {fields.map((f, j) => (
          <Box key={f.id} p={3} bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
            <HStack align="flex-end" spacing={3} flexWrap="wrap">
              <FormControl flex="1">
                <FormLabel fontSize="xs" fontWeight="600">Nom/Prénom</FormLabel>
                <Input size="md" bg="white" borderRadius="md" {...register(`${parentName}.${j}.nom`)} placeholder="Ex: Lucas" />
              </FormControl>
              <FormControl flex="1">
                <FormLabel fontSize="xs" fontWeight="600">Lien</FormLabel>
                <Select size="md" bg="white" borderRadius="md" {...register(`${parentName}.${j}.lien`)} placeholder="Lien familial">
                  <option value="CONJOINT">Conjoint</option>
                  <option value="ENFANT">Enfant</option>
                  <option value="PETIT_ENFANT">Petit-enfant</option>
                  <option value="AUTRE">Autre</option>
                </Select>
              </FormControl>
              {mode === 'DEMEMBRE' && (
                <FormControl flex="1">
                  <FormLabel fontSize="xs" fontWeight="600">Rôle (démembrement)</FormLabel>
                  <Select size="md" bg="white" borderRadius="md" {...register(`${parentName}.${j}.role`)} placeholder="Choisir">
                    <option value="USUFRUITIER">Usufruitier</option>
                    <option value="NU_PROPRIETAIRE">Nu-propriétaire</option>
                  </Select>
                </FormControl>
              )}
              <FormControl flex={{ base: "1", md: "0 0 100px" }}>
                <FormLabel fontSize="xs" fontWeight="600">Part (%)</FormLabel>
                <NumberInput min={0} max={100} size="md">
                  <NumberInputField {...register(`${parentName}.${j}.part`, { valueAsNumber: true })} bg="white" borderRadius="md" />
                </NumberInput>
              </FormControl>
              <IconButton 
                aria-label="supprimer" 
                icon={<DeleteIcon boxSize={4} />} 
                size="md" 
                variant="ghost" 
                colorScheme="red" 
                onClick={() => remove(j)} 
              />
            </HStack>
          </Box>
        ))}
        {fields.length === 0 && (
          <Box py={6} textAlign="center" bg="gray.50" borderRadius="xl" borderStyle="dashed" borderWidth="2px" borderColor="gray.300">
            <Text fontSize="sm" color="gray.500">
              Aucun bénéficiaire ajouté
            </Text>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

// LegsSousForm supprimé de cette étape
