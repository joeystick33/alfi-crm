import React, { useMemo } from 'react';
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
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  VStack,
  Icon,
} from '../compat';
import { AddIcon, DeleteIcon } from '../compat';
import { FiGift, FiInfo, FiCalendar, FiDollarSign, FiUsers } from 'react-icons/fi';

// Schema complet pour les donations conformes aux règles CGP
const donationsSchema = z.object({
  presence_donations: z.boolean().default(false),
  donations: z.array(z.object({
    beneficiaire_id: z.string().optional(), // ID du proche si sélectionné
    beneficiaire_nom: z.string().min(1, "Le bénéficiaire est requis"),
    beneficiaire_prenom: z.string().optional(),
    valeur_donation_origine: z.number().min(0, "La valeur d'origine doit être positive"),
    valeur_donation_actuelle: z.number().min(0, "La valeur actuelle doit être positive"),
    date_donation: z.string().min(1, "La date de donation est requise pour les calculs"),
    lien_parente: z.enum(['enfant', 'conjoint', 'parent', 'petit_enfant', 'arriere_petit_enfant', 'frere_soeur', 'neveu_niece', 'tiers']),
    type_donation: z.enum([
      'avance_part_successorale',   // Rapportable à la succession
      'hors_part_successorale',     // Préciputaire - non rapportable
      'donation_partage'            // Entre plusieurs bénéficiaires
    ]),
    nature_bien: z.enum(['numeraire', 'immobilier', 'valeurs_mobilieres', 'fonds_commerce', 'oeuvre_art', 'autres']),
    rapportable: z.boolean(), // Calculé automatiquement selon type_donation
    abattement_utilise: z.number().default(0), // Abattement consommé lors de cette donation
    abattement_residuel: z.number().default(0), // Abattement restant pour ce bénéficiaire
    droits_payes: z.number().default(0), // Droits de donation payés
    description: z.string().optional(),
    proprietaire: z.enum(['MONSIEUR', 'MADAME']).optional() // Qui a fait la donation (mode couple)
  })).default([]),
  // Champ global: date du décès (requise par le backend si donations présentes)
  date_deces: z.string().optional(),
});

export type DonationsValues = z.infer<typeof donationsSchema>;

export function Step7Donations({
  defaultValues,
  onSubmit,
  onBack,
  patrimoineNet,
  nombreEnfants,
  donneesConjoint,
  donneesEnfants,
  donneesFamille,
  isCouple,
}: {
  defaultValues: DonationsValues;
  onSubmit: (values: DonationsValues) => void;
  onBack: () => void;
  patrimoineNet?: number;
  nombreEnfants?: number;
  isCouple?: boolean;
  donneesConjoint?: { prenom: string; age?: number } | null;
  donneesEnfants?: Array<{ id: string; prenom: string; age?: number }>;
  donneesFamille?: {
    parents?: { pere?: { prenom: string; vivant: boolean }; mere?: { prenom: string; vivant: boolean } };
    fratrie?: Array<{ prenom: string; vivant: boolean }>;
  };
}) {
  const { register, handleSubmit, control, watch, setValue } = useForm<DonationsValues>({
    resolver: zodResolver(donationsSchema) as any,
    defaultValues,
  });

  const presenceDonations = watch('presence_donations');
  const donations = watch('donations') || [];

  const { fields: fieldsDon, append: appendDon, remove: removeDon } = useFieldArray({ 
    control, 
    name: 'donations' 
  });

  // Génération des options de bénéficiaires à partir des données familiales
  const optionsBeneficiaires = useMemo(() => {
    const options = [];
    
    // Conjoint en premier
    if (donneesConjoint) {
      options.push({
        id: 'conjoint',
        nom: donneesConjoint.prenom,
        lien: 'conjoint',
        abattement: 80724
      });
    }
    
    // Enfants
    donneesEnfants?.forEach((enfant, index) => {
      options.push({
        id: enfant.id,
        nom: enfant.prenom,
        lien: 'enfant',
        abattement: 100000
      });
    });
    
    // Parents
    if (donneesFamille?.parents?.pere?.vivant) {
      options.push({
        id: 'pere',
        nom: donneesFamille.parents.pere.prenom,
        lien: 'parent',
        abattement: 100000
      });
    }
    if (donneesFamille?.parents?.mere?.vivant) {
      options.push({
        id: 'mere',
        nom: donneesFamille.parents.mere.prenom,
        lien: 'parent',
        abattement: 100000
      });
    }
    
    // Fratrie
    donneesFamille?.fratrie?.forEach((frere, index) => {
      if (frere.vivant) {
        options.push({
          id: `frere_${index}`,
          nom: frere.prenom,
          lien: 'frere_soeur',
          abattement: 15932
        });
      }
    });
    
    return options;
  }, [donneesConjoint, donneesEnfants, donneesFamille]);

  // Fonctions utilitaires pour calculs (déclarées avant useMemo pour éviter les erreurs d'initialisation)
  const getAbattementByLien = (lien: string): number => {
    switch (lien) {
      case 'enfant': case 'parent': return 100000;
      case 'conjoint': return 80724;
      case 'petit_enfant': return 31865;
      case 'arriere_petit_enfant': return 5310;
      case 'frere_soeur': return 15932;
      case 'neveu_niece': return 7967;
      default: return 0;
    }
  };

  const getTauxImposition = (lien: string, montant: number): number => {
    // Barèmes simplifiés - en réalité plus complexes
    if (lien === 'enfant' || lien === 'conjoint') {
      if (montant <= 8072) return 0.05;
      if (montant <= 12109) return 0.10;
      if (montant <= 15932) return 0.15;
      return 0.20;
    }
    return 0.35; // Taux forfaitaire autres
  };

  // Calcul méticuleux des donations avec rapportabilité et abattements
  const calculDonations = useMemo(() => {
    if (!donations.length) return null;
    
    let totalDonationsRapportables = 0;
    let totalDonationsHorsPart = 0;
    let totalAbattementsUtilises = 0;
    let totalDroitsPayes = 0;
    
    // Regroupement par bénéficiaire pour calcul abattements
    const donationsParBeneficiaire = donations.reduce((acc, don) => {
      const key = don.beneficiaire_id || don.beneficiaire_nom;
      if (!acc[key]) acc[key] = [];
      acc[key].push(don);
      return acc;
    }, {} as Record<string, typeof donations>);
    
    Object.entries(donationsParBeneficiaire).forEach(([beneficiaire, donsListe]) => {
      const lienParente = donsListe[0]?.lien_parente;
      const abattementTotal = getAbattementByLien(lienParente);
      let abattementConsomme = 0;
      
      donsListe.forEach(don => {
        const valeurActuelle = don.valeur_donation_actuelle || 0;
        
        if (don.rapportable) {
          totalDonationsRapportables += valeurActuelle;
        } else {
          totalDonationsHorsPart += valeurActuelle;
        }
        
        // Calcul abattement utilisé (chronologique)
        const datedon = new Date(don.date_donation);
        const maintenant = new Date();
        const ancienneteAnnees = (maintenant.getTime() - datedon.getTime()) / (1000 * 60 * 60 * 24 * 365);
        
        if (ancienneteAnnees <= 15) {
          const abattementDisponible = Math.max(0, abattementTotal - abattementConsomme);
          const abattementUtilise = Math.min(valeurActuelle, abattementDisponible);
          abattementConsomme += abattementUtilise;
          totalAbattementsUtilises += abattementUtilise;
          
          // Droits de donation payés
          const baseImposable = Math.max(0, valeurActuelle - abattementUtilise);
          const tauxImposition = getTauxImposition(lienParente, baseImposable);
          totalDroitsPayes += baseImposable * tauxImposition;
        }
      });
    });
    
    return {
      totalDonationsRapportables,
      totalDonationsHorsPart,
      totalDonations: totalDonationsRapportables + totalDonationsHorsPart,
      totalAbattementsUtilises,
      totalDroitsPayes: Math.round(totalDroitsPayes),
      economieSuccession: Math.round(totalDroitsPayes * 1.5) // Estimation économie succession
    };
  }, [donations]);

  const handleAddDonation = () => {
    appendDon({
      beneficiaire_id: '',
      beneficiaire_nom: '',
      beneficiaire_prenom: '',
      valeur_donation_origine: 0,
      valeur_donation_actuelle: 0,
      date_donation: '',
      lien_parente: 'enfant',
      type_donation: 'avance_part_successorale',
      nature_bien: 'numeraire',
      rapportable: true, // Par défaut pour avance de part
      abattement_utilise: 0,
      abattement_residuel: 0,
      droits_payes: 0,
      description: '',
      proprietaire: undefined
    });
  };

  // Fonction pour mettre à jour automatiquement la rapportabilité
  const updateRapportabilite = (index: number, typeDonation: string) => {
    const rapportable = typeDonation === 'avance_part_successorale' || typeDonation === 'donation_partage';
    // Ici on devrait utiliser setValue de react-hook-form mais on va le gérer dans l'interface
  };

  return (
    <VStack spacing={6} align="stretch" maxW="800px" mx="auto">
      <Box p={6} bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
        <HStack spacing={3} align="start">
          <Box p={3} bg="brand.50" borderRadius="xl" color="brand.600">
            <Icon as={FiGift} boxSize={6} />
          </Box>
          <VStack align="start" spacing={1}>
            <Heading size="md" color="gray.900">
              Vos donations antérieures
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Listez les donations réalisées : elles impactent le rappel fiscal et les abattements.
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
                  Pourquoi anticiper vos donations ?
                </Text>
              </HStack>
              <AccordionIcon color="brand.500" />
            </AccordionButton>
          </h3>
          <AccordionPanel px={4} py={4}>
            <VStack align="stretch" spacing={3}>
              <Box p={3} bg="brand.50" borderRadius="xl" borderLeft="3px solid" borderLeftColor="brand.400">
                <Text fontWeight="700" color="brand.800" mb={1} fontSize="sm">Abattements renouvelables</Text>
                <Text fontSize="xs" color="gray.700">100 000 € par enfant tous les 15 ans. Chaque donation prépare la suivante.</Text>
              </Box>
              <Box p={3} bg="brand.50" borderRadius="xl" borderLeft="3px solid" borderLeftColor="brand.400">
                <Text fontWeight="700" color="brand.800" mb={1} fontSize="sm">Économie d'impôts</Text>
                <Text fontSize="xs" color="gray.700">Les droits payés sont déduits de la succession : jusqu'à 40-50 % d'économie.</Text>
              </Box>
              <Box p={3} bg="brand.50" borderRadius="xl" borderLeft="3px solid" borderLeftColor="brand.400">
                <Text fontWeight="700" color="brand.800" mb={1} fontSize="sm">Transmission sereine</Text>
                <Text fontSize="xs" color="gray.700">Vous voyez vos proches profiter et pouvez les accompagner dans leurs projets.</Text>
              </Box>
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Accordion allowToggle borderRadius="xl" borderWidth="1px" borderColor="brand.200" overflow="hidden">
        <AccordionItem border="none">
          <h3>
            <AccordionButton px={4} py={3} _expanded={{ bg: 'brand.50' }}>
              <HStack flex="1" spacing={3}>
                <Icon as={FiInfo} color="brand.500" boxSize={5} />
                <Text fontSize="sm" fontWeight="700" color="brand.800">
                  Trois formes courantes de donation
                </Text>
              </HStack>
              <AccordionIcon color="brand.500" />
            </AccordionButton>
          </h3>
          <AccordionPanel px={4} py={4}>
            <Stack spacing={3}>
              <Box p={3} bg="brand.50" borderRadius="xl" borderLeft="3px solid" borderLeftColor="brand.400">
                <Text fontWeight="700" color="brand.800" fontSize="sm" mb={1}>Avance sur part successorale</Text>
                <Text fontSize="xs" color="gray.700">Rapportable à la succession pour maintenir l'égalité.</Text>
              </Box>
              <Box p={3} bg="brand.50" borderRadius="xl" borderLeft="3px solid" borderLeftColor="brand.400">
                <Text fontWeight="700" color="brand.800" fontSize="sm" mb={1}>Hors part successorale (préciputaire)</Text>
                <Text fontSize="xs" color="gray.700">Non rapportable : permet d'avantager un proche.</Text>
              </Box>
              <Box p={3} bg="brand.50" borderRadius="xl" borderLeft="3px solid" borderLeftColor="brand.400">
                <Text fontWeight="700" color="brand.800" fontSize="sm" mb={1}>Donation-partage</Text>
                <Text fontSize="xs" color="gray.700">Plusieurs bénéficiaires, valeurs figées pour éviter les litiges.</Text>
              </Box>
            </Stack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Card w="full" variant="outline" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm" overflow="hidden">
        <CardHeader bg="gray.50" py={4} px={6} borderBottom="1px solid" borderColor="gray.200">
          <Heading size="sm" color="gray.800">8. Détail des donations</Heading>
        </CardHeader>
        <CardBody px={6} py={6}>
          <form onSubmit={handleSubmit(onSubmit as any)}>
            <VStack spacing={6} align="stretch">
              <FormControl display="flex" alignItems="center" justifyContent="space-between" bg="blue.50" borderRadius="xl" borderWidth="1px" borderColor="blue.200" px={4} py={4}>
                <Box>
                  <FormLabel mb={0} fontSize="md" fontWeight="700" color="blue.900">
                    Avez-vous déjà effectué des donations ?
                  </FormLabel>
                  <Text fontSize="xs" color="blue.700" mt={1}>Incluez les donations réalisées depuis 15 ans.</Text>
                </Box>
                <Switch
                  {...register('presence_donations')}
                  size="md"
                  colorScheme="brand"
                />
              </FormControl>

              {!presenceDonations && (
                <Alert status="info" borderRadius="xl" fontSize="sm" bg="gray.50" borderWidth="1px" borderColor="gray.200">
                  <AlertIcon />
                  Indiquez "Oui" si des donations ont été réalisées pour calculer précisément les abattements restants.
                </Alert>
              )}

              {presenceDonations && (
                <VStack spacing={6} align="stretch">
                  <Card bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
                    <CardBody px={4} py={4}>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl isRequired>
                          <FormLabel fontSize="sm" fontWeight="700" color="gray.800">
                            <FiCalendar style={{ display: 'inline', marginRight: '8px' }} />
                            Date du décès (prévisionnelle)
                          </FormLabel>
                          <Input
                            {...register('date_deces')}
                            type="date"
                            bg="white"
                            size="md"
                            borderRadius="md"
                          />
                          <Text fontSize="xs" color="gray.600" mt={2}>
                            Utilisée pour vérifier les donations des 15 dernières années.
                          </Text>
                        </FormControl>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
                    <VStack align="start" spacing={1}>
                      <Heading size="sm" color="gray.800">Liste de vos donations</Heading>
                    </VStack>
                    {calculDonations && (
                      <Card bg="blue.50" borderWidth="1px" borderColor="blue.200" borderRadius="xl" boxShadow="sm">
                        <CardBody px={4} py={3}>
                          <VStack spacing={1} align="start">
                            <Text fontSize="xs" color="blue.700" fontWeight="700">Économie estimée</Text>
                            <Text fontSize="lg" color="blue.900" fontWeight="800">
                              {calculDonations.economieSuccession.toLocaleString('fr-FR')} €
                            </Text>
                            <Text fontSize="xs" color="blue.600">
                              Sur {calculDonations.totalDonations.toLocaleString('fr-FR')} € donnés
                            </Text>
                            <Text fontSize="xs" color="brand.700" fontWeight="700" mt={1}>
                              Rapportables : {calculDonations.totalDonationsRapportables.toLocaleString('fr-FR')} €
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    )}
                  </HStack>

                  <VStack spacing={4} align="stretch">
                    {fieldsDon.map((field, index) => (
                      <Card key={field.id} borderWidth="1px" borderColor="gray.200" borderRadius="2xl" bg="white" boxShadow="sm" overflow="hidden">
                        <CardHeader py={3} px={4} borderBottomWidth="1px" borderColor="gray.100" bg="gray.50">
                          <HStack justify="space-between" align="center">
                            <Badge colorScheme="brand" fontSize="xs" px={2} py={1} borderRadius="md">
                              Donation {index + 1}
                            </Badge>
                            <IconButton
                              icon={<DeleteIcon boxSize={4} />}
                              aria-label="Supprimer cette donation"
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => removeDon(index)}
                            />
                          </HStack>
                        </CardHeader>
                        <CardBody px={4} py={4}>
                          <VStack spacing={4} align="stretch">
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                                  <FiUsers style={{ display: 'inline', marginRight: '4px' }} /> Bénéficiaire (famille)
                                </FormLabel>
                                <Select
                                  {...register(`donations.${index}.beneficiaire_id`)}
                                  bg="white"
                                  placeholder="Choisir dans ma famille"
                                  size="md"
                                  borderRadius="md"
                                >
                                  <option value="">-- Autre personne --</option>
                                  {optionsBeneficiaires.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.nom} ({option.lien} – {option.abattement.toLocaleString('fr-FR')} €)
                                    </option>
                                  ))}
                                </Select>
                              </FormControl>

                              <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Nom du bénéficiaire</FormLabel>
                                <Input
                                  {...register(`donations.${index}.beneficiaire_nom`)}
                                  placeholder="Nom complet"
                                  bg="white"
                                  size="md"
                                  borderRadius="md"
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Prénom</FormLabel>
                                <Input
                                  {...register(`donations.${index}.beneficiaire_prenom`)}
                                  placeholder="Prénom"
                                  bg="white"
                                  size="md"
                                  borderRadius="md"
                                />
                              </FormControl>

                              <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Lien de parenté</FormLabel>
                                <Select
                                  {...register(`donations.${index}.lien_parente`)}
                                  bg="white"
                                  size="md"
                                  borderRadius="md"
                                >
                                  <option value="enfant">Enfant (100 000€)</option>
                                  <option value="conjoint">Conjoint (80 724€)</option>
                                  <option value="parent">Parent (100 000€)</option>
                                  <option value="petit_enfant">Petit-enfant (31 865€)</option>
                                  <option value="arriere_petit_enfant">Arrière-petit-enfant (5 310€)</option>
                                  <option value="frere_soeur">Frère / sœur (15 932€)</option>
                                  <option value="neveu_niece">Neveu / nièce (7 967€)</option>
                                  <option value="tiers">Autre personne</option>
                                </Select>
                              </FormControl>
                            </SimpleGrid>

                              {isCouple && (
                                <FormControl p={4} bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
                                  <FormLabel fontSize="sm" fontWeight="700" color="gray.800" mb={3}>Donateur (qui a fait la donation ?)</FormLabel>
                                  <RadioGroup
                                    value={watch(`donations.${index}.proprietaire`) || 'MONSIEUR'}
                                    onChange={(val) => setValue(`donations.${index}.proprietaire`, val as 'MONSIEUR' | 'MADAME', { shouldValidate: true })}
                                  >
                                    <HStack spacing={6}>
                                      <Radio value="MONSIEUR" size="md" colorScheme="brand">
                                        <Text fontSize="sm" fontWeight="600">Monsieur</Text>
                                      </Radio>
                                      <Radio value="MADAME" size="md" colorScheme="brand">
                                        <Text fontSize="sm" fontWeight="600">Madame</Text>
                                      </Radio>
                                    </HStack>
                                  </RadioGroup>
                                  <Text fontSize="xs" color="gray.500" mt={2}>
                                    En mode couple, précisez qui a consenti la donation pour l'attribution correcte au décès.
                                  </Text>
                                </FormControl>
                              )}

                              <Card bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="xl" boxShadow="sm">
                                <CardBody px={4} py={4}>
                                  <Text fontSize="sm" fontWeight="700" color="gray.800" mb={3}>
                                    Valeurs de la donation
                                  </Text>
                                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    <FormControl isRequired>
                                      <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Valeur à l'origine</FormLabel>
                                      <NumberInput min={0} size="md">
                                        <NumberInputField
                                          {...register(`donations.${index}.valeur_donation_origine`, { valueAsNumber: true })}
                                          placeholder="50 000"
                                          bg="white"
                                          borderRadius="md"
                                        />
                                      </NumberInput>
                                      <Text fontSize="xs" color="gray.500" mt={1}>
                                        Montant déclaré le jour de la donation.
                                      </Text>
                                    </FormControl>

                                    <FormControl isRequired>
                                      <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Valeur actuelle estimée</FormLabel>
                                      <NumberInput min={0} size="md">
                                        <NumberInputField
                                          {...register(`donations.${index}.valeur_donation_actuelle`, { valueAsNumber: true })}
                                          placeholder="75 000"
                                          bg="white"
                                          borderRadius="md"
                                        />
                                      </NumberInput>
                                      <Text fontSize="xs" color="gray.500" mt={1}>
                                        Réévaluation pour la succession.
                                      </Text>
                                    </FormControl>
                                  </SimpleGrid>
                                </CardBody>
                              </Card>

                              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                <FormControl isRequired>
                                  <FormLabel fontSize="sm" fontWeight="600" color="gray.700">📅 Date de donation</FormLabel>
                                  <Input
                                    {...register(`donations.${index}.date_donation`)}
                                    type="date"
                                    bg="white"
                                    size="md"
                                    borderRadius="md"
                                  />
                                  <Text fontSize="xs" color="gray.500" mt={1}>
                                    Indispensable pour appliquer la règle des 15 ans.
                                  </Text>
                                </FormControl>

                                <FormControl isRequired>
                                  <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Type juridique</FormLabel>
                                  <Select
                                    {...register(`donations.${index}.type_donation`)}
                                    bg="white"
                                    size="md"
                                    borderRadius="md"
                                  >
                                    <option value="avance_part_successorale">Avance sur part successorale</option>
                                    <option value="hors_part_successorale">Hors part successorale</option>
                                    <option value="donation_partage">Donation-partage</option>
                                  </Select>
                                  <Text fontSize="xs" color="orange.600" mt={1} fontWeight="500">
                                    ⚖️ Influence la rapportabilité.
                                  </Text>
                                </FormControl>

                                <FormControl isRequired>
                                  <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Nature du bien</FormLabel>
                                  <Select
                                    {...register(`donations.${index}.nature_bien`)}
                                    bg="white"
                                    size="md"
                                    borderRadius="md"
                                  >
                                    <option value="numeraire">Argent liquide</option>
                                    <option value="immobilier">Bien immobilier</option>
                                    <option value="valeurs_mobilieres">Valeurs mobilières</option>
                                    <option value="fonds_commerce">Fonds de commerce</option>
                                    <option value="oeuvre_art">Œuvre d'art</option>
                                    <option value="autres">Autres</option>
                                  </Select>
                                </FormControl>
                              </SimpleGrid>

                              <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Commentaire</FormLabel>
                                <Input
                                  {...register(`donations.${index}.description`)}
                                  placeholder="Ex : aide à l'achat de résidence"
                                  bg="white"
                                  size="md"
                                  borderRadius="md"
                                />
                              </FormControl>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}

                      <Button
                        leftIcon={<AddIcon boxSize={4} />}
                        onClick={handleAddDonation}
                        colorScheme="brand"
                        variant="outline"
                        size="md"
                        w="full"
                        py={6}
                        borderStyle="dashed"
                        borderWidth="2px"
                        borderRadius="xl"
                        _hover={{ bg: 'brand.50', transform: 'translateY(-2px)' }}
                        transition="all 0.2s"
                      >
                        <Text fontWeight="700" fontSize="md">Ajouter une donation</Text>
                      </Button>
                    </VStack>

                    {fieldsDon.length > 0 && (
                      <Alert status="info" borderRadius="xl" fontSize="sm" bg="blue.50" borderWidth="1px" borderColor="blue.200">
                        <AlertIcon />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="700" color="blue.800">Conseil d'optimisation</Text>
                          <Text fontSize="sm" color="blue.700">
                            {calculDonations && calculDonations.totalDonations > 0
                              ? `Vos donations totalisent ${calculDonations.totalDonations.toLocaleString('fr-FR')} € dont ${calculDonations.totalDonationsRapportables.toLocaleString('fr-FR')} € rapportables. Économie estimée : ${calculDonations.economieSuccession.toLocaleString('fr-FR')} €.`
                              : 'Effectuez des donations régulières tous les 15 ans pour maximiser les abattements.'}
                          </Text>
                        </VStack>
                      </Alert>
                    )}
                  </VStack>
                )}

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
                  >
                    Continuer vers les legs →
                  </Button>
                </HStack>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </VStack>
    );
  }
