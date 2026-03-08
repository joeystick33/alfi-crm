import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  HStack,
  VStack,
  Text,
  IconButton,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Badge,
  Switch,
  Collapse,
  Button,
  Divider,
  SimpleGrid,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tooltip,
  Alert,
  AlertIcon,
  Icon,
  MotionBox,
} from '../compat';
import { DeleteIcon, ChevronDownIcon, ChevronUpIcon } from '../compat';
import { FiHome, FiTrendingUp, FiCreditCard, FiBriefcase, FiPackage } from 'react-icons/fi';
import { AnimatePresence } from 'framer-motion';

interface Actif {
  id: string;
  categorie: 'BIEN_COMMUN' | 'BIEN_PROPRE' | 'BIEN_INDIVISION' | 'BIEN_PROPRE_MONSIEUR' | 'BIEN_PROPRE_MADAME';
  type: 'IMMOBILIER' | 'MOBILIER' | 'FINANCIER' | 'PROFESSIONNEL';
  intitule: string;
  usage: string;
  valeur: number;
  dette_associee: boolean;
  montant_dette: number;
  quotite_defunt: number;
  quotite_conjoint: number;
  coindivisaires?: string; // Pour les biens en indivision
}

interface ActifCardProps {
  actif: Actif;
  index: number; // Numéro du bien
  onChange: (actif: Actif) => void;
  onDelete: () => void;
  isCouple: boolean;
  prenomDefunt?: string;
  nomDefunt?: string;
  prenomConjoint?: string;
  nomConjoint?: string;
}

export function ActifCard({ actif, index, onChange, onDelete, isCouple, prenomDefunt, nomDefunt, prenomConjoint, nomConjoint }: ActifCardProps) {
  // Initialiser directement l'état basé sur la valeur de l'actif
  const [isExpanded, setIsExpanded] = useState(actif.valeur === 0);
  const [isValidated, setIsValidated] = useState(false);

  const getUsageOptions = (type: string) => {
    switch (type) {
      case 'IMMOBILIER':
        return [
          { value: 'Résidence principale', label: 'Résidence principale' },
          { value: 'Résidence secondaire', label: 'Résidence secondaire' },
          { value: 'Bien locatif', label: 'Bien locatif' },
          { value: 'Terrain', label: 'Terrain' },
          { value: 'Parking/Garage', label: 'Parking/Garage' },
          { value: 'Immeuble de rapport', label: 'Immeuble de rapport' },
          { value: 'Autre', label: 'Autre' },
        ];
      case 'FINANCIER':
        return [
          { value: 'Livret A', label: 'Livret A' },
          { value: 'LDDS', label: 'LDDS' },
          { value: 'LEP', label: 'LEP' },
          { value: 'Compte courant', label: 'Compte courant' },
          { value: 'Compte épargne', label: 'Compte épargne' },
          { value: 'PEA', label: 'PEA' },
          { value: 'PEA-PME', label: 'PEA-PME' },
          { value: 'Compte-titres ordinaire', label: 'Compte-titres ordinaire' },
          { value: 'PER', label: 'PER (Plan Épargne Retraite)' },
          { value: 'PERCO', label: 'PERCO' },
          { value: 'Obligations', label: 'Obligations' },
          { value: 'Actions', label: 'Actions' },
          { value: 'SCPI', label: 'SCPI' },
          { value: 'Autre placement', label: 'Autre placement' },
        ];
      case 'MOBILIER':
        return [
          { value: 'Véhicule', label: 'Véhicule' },
          { value: 'Bateau', label: 'Bateau' },
          { value: 'Œuvres d\'art', label: 'Œuvres d\'art' },
          { value: 'Bijoux', label: 'Bijoux' },
          { value: 'Meubles meublants', label: 'Meubles meublants' },
          { value: 'Équipements', label: 'Équipements' },
          { value: 'Autre mobilier', label: 'Autre mobilier' },
        ];
      case 'PROFESSIONNEL':
        return [
          { value: 'Fonds de commerce', label: 'Fonds de commerce' },
          { value: 'Parts sociales', label: 'Parts sociales (SARL, SCI...)' },
          { value: 'Actions société', label: 'Actions société' },
          { value: 'Clientèle libérale', label: 'Clientèle libérale' },
          { value: 'Matériel professionnel', label: 'Matériel professionnel' },
          { value: 'Stock', label: 'Stock' },
          { value: 'Autre actif professionnel', label: 'Autre actif professionnel' },
        ];
      default:
        return [{ value: 'Autre', label: 'Autre' }];
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getIcon = () => {
    switch (actif.type) {
      case 'IMMOBILIER':
        return FiHome;
      case 'FINANCIER':
        return FiTrendingUp;
      case 'PROFESSIONNEL':
        return FiBriefcase;
      case 'MOBILIER':
        return FiPackage;
      default:
        return FiCreditCard;
    }
  };

  const getColor = () => {
    switch (actif.type) {
      case 'IMMOBILIER':
        return 'blue';
      case 'FINANCIER':
        return 'green';
      case 'PROFESSIONNEL':
        return 'purple';
      case 'MOBILIER':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getCategorieLabel = (cat: string) => {
    switch (cat) {
      case 'BIEN_PROPRE_MONSIEUR':
        return '🔵 Bien propre Monsieur';
      case 'BIEN_PROPRE_MADAME':
        return '🌸 Bien propre Madame';
      case 'BIEN_COMMUN':
        return '🟪 Bien commun (50/50)';
      case 'BIEN_PROPRE':
        return '🟢 Bien propre';
      case 'BIEN_INDIVISION':
        return '🤝 Indivision';
      default:
        return cat;
    }
  };

  const getCategorieColor = (cat: string) => {
    switch (cat) {
      case 'BIEN_PROPRE_MONSIEUR':
        return 'blue';
      case 'BIEN_PROPRE_MADAME':
        return 'pink';
      case 'BIEN_COMMUN':
        return 'purple';
      case 'BIEN_PROPRE':
        return 'green';
      case 'BIEN_INDIVISION':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const valeurNette = actif.valeur - (actif.dette_associee ? actif.montant_dette : 0);
  const partDefunt = (valeurNette * actif.quotite_defunt) / 100;
  const partConjoint = (valeurNette * actif.quotite_conjoint) / 100;
  const isComplete = actif.valeur > 0 && Boolean(actif.intitule) && Boolean(actif.usage);
  const parseNumericInput = (valueString: string, currentValue: number) => {
    if (valueString === '') return 0;
    const parsed = Number(valueString.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : currentValue;
  };
  const normalizePercent = (value: number) => {
    const normalized = Number.isFinite(value) ? value : 0;
    return Math.max(0, Math.min(100, Math.round(normalized)));
  };

  return (
    <Card variant="outline" borderWidth="2px" borderColor={`${getColor()}.200`} borderRadius="2xl" bg="white" boxShadow="sm" overflow="hidden">
      <CardBody>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="flex-start">
            <HStack align="flex-start" spacing={3}>
              <Box
                p={3}
                borderRadius="xl"
                bg={`${getColor()}.50`}
                color={`${getColor()}.600`}
                borderWidth="1px"
                borderColor={`${getColor()}.200`}
              >
                <Icon as={getIcon()} boxSize="20px" />
              </Box>
              <VStack align="start" spacing={1}>
                <HStack spacing={2} flexWrap="wrap">
                  <Badge colorScheme="gray" variant="subtle" fontSize="xs" borderRadius="full" px={2} py={1}>
                    Bien {index + 1}
                  </Badge>
                  <Badge colorScheme={isComplete ? 'green' : 'orange'} variant="solid" fontSize="xs" borderRadius="full" px={2} py={1}>
                    {isComplete ? 'Complet' : 'À compléter'}
                  </Badge>
                </HStack>
                <Text fontSize="md" fontWeight="700" color="gray.900" lineHeight="short">
                    {actif.intitule || 'Nouvel actif'}
                </Text>
                <HStack spacing={2} flexWrap="wrap">
                  <Badge colorScheme={getColor()} fontSize="xs" borderRadius="full" px={2} py={1}>
                    {actif.type}
                  </Badge>
                  <Badge colorScheme={getCategorieColor(actif.categorie)} variant="subtle" fontSize="xs" borderRadius="full" px={2} py={1}>
                    {getCategorieLabel(actif.categorie)}
                  </Badge>
                </HStack>
              </VStack>
            </HStack>
            <VStack align="end" spacing={2}>
              <Text fontSize="lg" fontWeight="800" color={`${getColor()}.700`}>
                {formatCurrency(actif.valeur)}
              </Text>
              <IconButton
                aria-label="Supprimer actif"
                icon={<DeleteIcon />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={onDelete}
              />
            </VStack>
          </HStack>

          <SimpleGrid columns={{ base: 2, md: isCouple ? 4 : 3 }} spacing={3}>
            <Box p={3} bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
              <Text fontSize="xs" color="gray.600" mb={1}>Valeur brute</Text>
              <Text fontSize="sm" fontWeight="800" color="blue.700">{formatCurrency(actif.valeur)}</Text>
            </Box>
            <Box p={3} bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
              <Text fontSize="xs" color="gray.600" mb={1}>Dette liée</Text>
              <Text fontSize="sm" fontWeight="800" color="red.600">{formatCurrency(actif.montant_dette || 0)}</Text>
            </Box>
            <Box p={3} bg="green.50" borderRadius="xl" borderWidth="1px" borderColor="green.200">
              <Text fontSize="xs" color="gray.600" mb={1}>Valeur nette</Text>
              <Text fontSize="sm" fontWeight="800" color="green.700">{formatCurrency(valeurNette)}</Text>
            </Box>
            {isCouple && (
              <Box p={3} bg="purple.50" borderRadius="xl" borderWidth="1px" borderColor="purple.200">
                <Text fontSize="xs" color="gray.600" mb={1}>Part défunt</Text>
                <Text fontSize="sm" fontWeight="800" color="purple.700">{formatCurrency(partDefunt)}</Text>
              </Box>
            )}
          </SimpleGrid>

          {/* Informations de base */}
          <Box p={4} bg="gray.50" borderRadius="2xl" borderWidth="1px" borderColor="gray.200">
            <VStack align="stretch" spacing={4}>
              <Text fontSize="sm" fontWeight="700" color="gray.900">
                Informations principales du bien
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600">Propriétaire</FormLabel>
              <Select
                value={actif.categorie}
                onChange={(e) => {
                  const newCategorie = e.target.value as 'BIEN_COMMUN' | 'BIEN_PROPRE' | 'BIEN_INDIVISION' | 'BIEN_PROPRE_MONSIEUR' | 'BIEN_PROPRE_MADAME';
                  // Ajustement automatique des quotités selon la catégorie
                  let newQuotiteDefunt = actif.quotite_defunt;
                  let newQuotiteConjoint = actif.quotite_conjoint;
                  
                  if (newCategorie === 'BIEN_PROPRE' || newCategorie === 'BIEN_PROPRE_MONSIEUR') {
                    newQuotiteDefunt = 100;
                    newQuotiteConjoint = 0;
                  } else if (newCategorie === 'BIEN_PROPRE_MADAME') {
                    newQuotiteDefunt = 0;
                    newQuotiteConjoint = 100;
                  } else if (newCategorie === 'BIEN_COMMUN' && isCouple) {
                    newQuotiteDefunt = 50;
                    newQuotiteConjoint = 50;
                  }
                  // Pour BIEN_INDIVISION, on laisse l'utilisateur définir manuellement
                  
                  onChange({
                    ...actif,
                    categorie: newCategorie,
                    quotite_defunt: newQuotiteDefunt,
                    quotite_conjoint: newQuotiteConjoint,
                  });
                }}
                size="sm"
                bg={`${getCategorieColor(actif.categorie)}.50`}
                borderColor={`${getCategorieColor(actif.categorie)}.300`}
                fontWeight="600"
              >
                {isCouple ? (
                  <>
                    <option value="BIEN_PROPRE_MONSIEUR">
                      🔵 Bien propre {prenomDefunt || 'Monsieur'}{nomDefunt ? ` ${nomDefunt}` : ''}
                    </option>
                    <option value="BIEN_PROPRE_MADAME">
                      🌸 Bien propre {prenomConjoint || 'Madame'}{nomConjoint ? ` ${nomConjoint}` : ''}
                    </option>
                    <option value="BIEN_COMMUN">
                      🟪 Bien commun {prenomDefunt && prenomConjoint ? `${prenomDefunt} & ${prenomConjoint}` : '(50/50)'}
                    </option>
                    <option value="BIEN_INDIVISION">🤝 Bien en indivision</option>
                  </>
                ) : (
                  <>
                    <option value="BIEN_PROPRE">🟢 Mon patrimoine ({prenomDefunt || 'vous'})</option>
                    <option value="BIEN_INDIVISION">🤝 Bien en indivision</option>
                  </>
                )}
              </Select>
              <Text fontSize="xs" color="gray.600" mt={1}>
                {actif.categorie === 'BIEN_PROPRE_MONSIEUR' && `📌 Acquis avant mariage, hérité ou donné à ${prenomDefunt || 'Monsieur'} uniquement`}
                {actif.categorie === 'BIEN_PROPRE_MADAME' && `📌 Acquis avant mariage, hérité ou donné à ${prenomConjoint || 'Madame'} uniquement`}
                {actif.categorie === 'BIEN_COMMUN' && '📌 Acquis pendant le mariage - Répartition 50/50 par défaut (modifiable)'}
                {actif.categorie === 'BIEN_PROPRE' && 'Votre patrimoine personnel'}
                {actif.categorie === 'BIEN_INDIVISION' && '⚠️ Détenu avec d\'autres personnes (conjoint, partenaire, famille, tiers...)'}
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600">Type d'actif</FormLabel>
              <Select
                value={actif.type}
                onChange={(e) => {
                  const newType = e.target.value as 'IMMOBILIER' | 'MOBILIER' | 'FINANCIER' | 'PROFESSIONNEL';
                  onChange({
                    ...actif,
                    type: newType,
                    usage: '', // Réinitialiser l'usage quand on change de type
                  });
                }}
                size="sm"
              >
                <option value="IMMOBILIER">Immobilier</option>
                <option value="MOBILIER">Mobilier</option>
                <option value="FINANCIER">Financier</option>
                <option value="PROFESSIONNEL">Professionnel</option>
              </Select>
            </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">Intitulé</FormLabel>
                <Input
                  value={actif.intitule}
                  onChange={(e) =>
                    onChange({ ...actif, intitule: e.target.value })
                  }
                  placeholder="Ex: Résidence principale Paris 15ème"
                  size="sm"
                  bg="white"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">Usage / Description</FormLabel>
                <Select
                  value={actif.usage}
                  onChange={(e) =>
                    onChange({ ...actif, usage: e.target.value })
                  }
                  placeholder="Sélectionnez un usage"
                  size="sm"
                  bg="white"
                >
                  <option value="">-- Sélectionnez --</option>
                  {getUsageOptions(actif.type).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">Valeur estimée</FormLabel>
                <NumberInput
                  value={actif.valeur}
                  onChange={(valueString) =>
                    onChange({ ...actif, valeur: parseNumericInput(valueString, actif.valeur) })
                  }
                  min={0}
                  size="sm"
                >
                  <NumberInputField bg="white" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {formatCurrency(actif.valeur)}
                </Text>
              </FormControl>
            </VStack>
          </Box>

          {/* Dette associée */}
          <Box p={4} bg={actif.dette_associee ? 'red.50' : 'gray.50'} borderRadius="2xl" borderWidth="1px" borderColor={actif.dette_associee ? 'red.200' : 'gray.200'}>
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between" align="center">
                <Box>
                  <Text fontSize="sm" fontWeight="700" color="gray.900">Financement du bien</Text>
                  <Text fontSize="xs" color="gray.600">Indiquez s'il reste un crédit à déduire de la valeur brute.</Text>
                </Box>
                <Switch
                  id={`dette-${actif.id}`}
                  isChecked={actif.dette_associee}
                  onChange={(e) =>
                    onChange({ ...actif, dette_associee: e.target.checked })
                  }
                  colorScheme={getColor()}
                />
              </HStack>

              <Collapse in={actif.dette_associee} animateOpacity>
                <VStack spacing={3} align="stretch" p={3} bg="white" borderRadius="xl" borderWidth="1px" borderColor="red.200">
              <Alert status="warning" fontSize="xs" py={2}>
                <AlertIcon boxSize={3} />
                Dette déduite automatiquement de la valeur de l'actif
              </Alert>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">Montant du crédit restant</FormLabel>
                <NumberInput
                  value={actif.montant_dette}
                  onChange={(valueString) =>
                    onChange({ ...actif, montant_dette: parseNumericInput(valueString, actif.montant_dette) })
                  }
                  min={0}
                  max={actif.valeur}
                  size="sm"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="xs" color="red.600" mt={1}>
                  {formatCurrency(actif.montant_dette)}
                </Text>
              </FormControl>
                </VStack>
              </Collapse>
            </VStack>
          </Box>

          {/* Quotités de détention - Affichage conditionnel selon catégorie */}
          {actif.categorie !== 'BIEN_PROPRE' && (
            <>
              <Divider />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
                rightIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                borderRadius="xl"
                fontWeight="700"
              >
                {actif.categorie === 'BIEN_COMMUN' && 'Quotités de détention (couple)'}
                {actif.categorie === 'BIEN_INDIVISION' && 'Quotité et co-indivisaires'}
              </Button>

              <Collapse in={isExpanded} animateOpacity>
                <VStack spacing={4} align="stretch" p={3} bg="purple.50" borderRadius="md">
                  {actif.categorie === 'BIEN_COMMUN' && (
                    <>
                      <Alert status="info" fontSize="xs" py={2}>
                        <AlertIcon boxSize={3} />
                        Part de chaque époux dans le bien commun. Total = 100%
                      </Alert>
                      
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">
                          Quotité défunt : {actif.quotite_defunt}%
                        </FormLabel>
                        <Slider
                          value={actif.quotite_defunt}
                          onChange={(val) => {
                            const nextValue = normalizePercent(Number(val));
                            onChange({
                              ...actif,
                              quotite_defunt: nextValue,
                              quotite_conjoint: 100 - nextValue,
                            });
                          }}
                          min={0}
                          max={100}
                          step={1}
                        >
                          <SliderTrack>
                            <SliderFilledTrack bg="purple.500" />
                          </SliderTrack>
                          <SliderThumb boxSize={6} />
                        </Slider>
                        <Text fontSize="xs" color="purple.600" mt={1}>
                          Part valorisée : {formatCurrency((actif.valeur * actif.quotite_defunt) / 100)}
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">
                          Quotité conjoint : {actif.quotite_conjoint}%
                        </FormLabel>
                        <Slider
                          value={actif.quotite_conjoint}
                          onChange={(val) => {
                            const nextValue = normalizePercent(Number(val));
                            onChange({
                              ...actif,
                              quotite_conjoint: nextValue,
                              quotite_defunt: 100 - nextValue,
                            });
                          }}
                          min={0}
                          max={100}
                          step={1}
                        >
                          <SliderTrack>
                            <SliderFilledTrack bg="pink.500" />
                          </SliderTrack>
                          <SliderThumb boxSize={6} />
                        </Slider>
                        <Text fontSize="xs" color="pink.600" mt={1}>
                          Part valorisée : {formatCurrency((actif.valeur * actif.quotite_conjoint) / 100)}
                        </Text>
                      </FormControl>
                    </>
                  )}

                  {actif.categorie === 'BIEN_INDIVISION' && (
                    <>
                      <Alert status="info" fontSize="xs" py={2} bg="orange.50" borderColor="orange.300">
                        <AlertIcon boxSize={3} color="orange.600" />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="600">Bien en indivision</Text>
                          <Text>Peut être détenu avec : conjoint, partenaire, parent, frère/sœur, ami, tiers...</Text>
                        </VStack>
                      </Alert>
                      
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="600" color="orange.700">
                          📊 Quotité du défunt : {actif.quotite_defunt}%
                        </FormLabel>
                        <Slider
                          value={actif.quotite_defunt}
                          onChange={(val) => {
                            const nextValue = normalizePercent(Number(val));
                            onChange({
                              ...actif,
                              quotite_defunt: nextValue,
                              quotite_conjoint: 0, // En indivision, pas de conjoint automatique
                            });
                          }}
                          min={0}
                          max={100}
                          step={1}
                        >
                          <SliderTrack bg="orange.100">
                            <SliderFilledTrack bg="orange.500" />
                          </SliderTrack>
                          <SliderThumb boxSize={6} bg="orange.500" />
                        </Slider>
                        <Text fontSize="sm" fontWeight="600" color="orange.700" mt={2}>
                          Part valorisée du défunt : {formatCurrency((actif.valeur * actif.quotite_defunt) / 100)}
                        </Text>
                      </FormControl>

                      <Divider borderColor="orange.200" />

                      <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="600" color="orange.700">
                          👥 Co-indivisaires (autres que le défunt)
                        </FormLabel>
                        <Input
                          value={actif.coindivisaires || ''}
                          onChange={(e) =>
                            onChange({ ...actif, coindivisaires: e.target.value })
                          }
                          placeholder="Ex: Conjoint 30%, Frère Jean 20%, Sœur Marie 20%, Ami Pierre 30%"
                          size="md"
                          bg="white"
                          borderColor="orange.300"
                          _focus={{ borderColor: 'orange.500', boxShadow: '0 0 0 1px orange.500' }}
                        />
                        <Alert status="warning" fontSize="xs" py={2} mt={2}>
                          <AlertIcon boxSize={3} />
                          <Text>
                            Listez TOUS les co-indivisaires avec leur quotité. Le total avec le défunt doit = 100%
                          </Text>
                        </Alert>
                        <Text fontSize="xs" color="gray.600" mt={2} fontStyle="italic">
                          💡 Exemples : "Conjoint 40%, Enfant 1 30%" ou "Frère 25%, Sœur 25%, Mère 10%"
                        </Text>
                      </FormControl>
                    </>
                  )}
                </VStack>
              </Collapse>
            </>
          )}

          {/* Bouton de validation */}
          {isExpanded && (
            <Box>
              <Button
                onClick={() => {
                  if (actif.valeur > 0 && actif.intitule && actif.usage) {
                    setIsValidated(true);
                    setIsExpanded(false);
                  }
                }}
                colorScheme={isValidated ? "green" : "blue"}
                size="md"
                width="full"
                borderRadius="xl"
                leftIcon={isValidated ? <Icon as={FiHome} /> : undefined}
                isDisabled={actif.valeur === 0 || !actif.intitule || !actif.usage}
              >
                {isValidated ? "✅ Bien validé" : "💾 Valider ce bien"}
              </Button>
              {actif.valeur === 0 && (
                <Text fontSize="xs" color="red.500" mt={2} textAlign="center">
                  ⚠️ Veuillez renseigner une valeur pour valider
                </Text>
              )}
            </Box>
          )}

        </VStack>
      </CardBody>
    </Card>
  );
}
