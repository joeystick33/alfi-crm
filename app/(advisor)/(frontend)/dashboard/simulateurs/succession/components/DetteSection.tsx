import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  HStack,
  VStack,
  Text,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Heading,
  Icon,
  Alert,
  AlertIcon,
  Badge,
  Button,
  IconButton,
  Divider,
  SimpleGrid,
  Select,
  Input,
  Collapse,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  MotionBox,
} from '../compat';
import { FiAlertCircle, FiPlus, FiCreditCard } from 'react-icons/fi';
import { AddIcon, DeleteIcon, ChevronDownIcon, ChevronUpIcon } from '../compat';
import { AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

interface Dette {
  id: string;
  type: 'COMMUNE' | 'PROPRE';
  categorie: 'CREDIT_IMMOBILIER' | 'CREDIT_CONSOMMATION' | 'CREDIT_PROFESSIONNEL' | 'AUTRE_DETTE';
  intitule: string;
  organisme: string;
  capital_restant_du: number;
  quotite_defunt: number;
  quotite_conjoint: number;
  source_actif_id?: string;
}

interface DetteSectionProps {
  dettes: Dette[];
  onDettesChange: (dettes: Dette[]) => void;
  isCouple: boolean;
}

export function DetteSection({ dettes, onDettesChange, isCouple }: DetteSectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const addDette = () => {
    const newDette: Dette = {
      id: uuidv4(),
      type: isCouple ? 'COMMUNE' : 'PROPRE',
      categorie: 'AUTRE_DETTE',
      intitule: '',
      organisme: '',
      capital_restant_du: 0,
      quotite_defunt: isCouple ? 50 : 100,
      quotite_conjoint: isCouple ? 50 : 0,
    };
    onDettesChange([...dettes, newDette]);
  };

  const updateDette = (index: number, updatedDette: Dette) => {
    const newDettes = [...dettes];
    newDettes[index] = updatedDette;
    onDettesChange(newDettes);
  };

  const deleteDette = (index: number) => {
    const newDettes = dettes.filter((_, i) => i !== index);
    onDettesChange(newDettes);
  };

  // Séparer dettes manuelles vs auto-générées
  const dettesManuelles = dettes.filter(d => !d.source_actif_id);
  const dettesActifs = dettes.filter(d => d.source_actif_id);

  const totalDettes = dettes.reduce((sum, dette) => sum + dette.capital_restant_du, 0);
  const totalDettesCommunes = dettes.filter(d => d.type === 'COMMUNE').reduce((sum, d) => sum + d.capital_restant_du, 0);
  const totalDettesPropres = dettes.filter(d => d.type === 'PROPRE').reduce((sum, d) => sum + d.capital_restant_du, 0);

  return (
    <VStack spacing={6} align="stretch">
      {/* En-tête avec totaux */}
      <Card variant="outline" borderWidth="2px" borderColor="red.200" bg="white" borderRadius="2xl" boxShadow="sm">
        <CardHeader pb={2}>
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <HStack>
                <Icon as={FiAlertCircle} color="red.600" boxSize={5} />
                <Heading size="sm" color="red.700">
                  Dettes et passifs
                </Heading>
              </HStack>
              <Badge colorScheme="red" fontSize="md">
                {formatCurrency(totalDettes)}
              </Badge>
            </HStack>

            {/* Détail types */}
            {isCouple && (
              <SimpleGrid columns={2} spacing={2}>
                <Box textAlign="center" p={2} bg="white" borderRadius="md">
                  <Text fontSize="xs" color="gray.600">Dettes communes</Text>
                  <Text fontSize="sm" fontWeight="700" color="orange.600">
                    {formatCurrency(totalDettesCommunes)}
                  </Text>
                </Box>
                <Box textAlign="center" p={2} bg="white" borderRadius="md">
                  <Text fontSize="xs" color="gray.600">Dettes propres</Text>
                  <Text fontSize="sm" fontWeight="700" color="red.600">
                    {formatCurrency(totalDettesPropres)}
                  </Text>
                </Box>
              </SimpleGrid>
            )}
          </VStack>
        </CardHeader>
        <CardBody pt={2}>
          <VStack spacing={3} align="stretch">
            <Alert status="info" variant="left-accent" fontSize="sm" borderRadius="xl" bg="blue.50" border="1px solid" borderColor="blue.200">
              <AlertIcon />
              <Text fontSize="xs">
                Les dettes sont déduites de l'actif brut pour obtenir le patrimoine net taxable.
                {dettes.length} dette(s) : {dettesActifs.length} liée(s) aux actifs, {dettesManuelles.length} manuelle(s).
              </Text>
            </Alert>

            <Box bg="gray.50" p={3} borderRadius="xl" borderWidth="1px" borderColor="gray.200">
              <Text fontSize="xs" fontWeight="600" color="gray.700" mb={2}>
                💡 Exemples de dettes déductibles :
              </Text>
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color="gray.600">• Emprunts immobiliers restants (non déjà saisis sur un actif)</Text>
                <Text fontSize="xs" color="gray.600">• Crédits à la consommation</Text>
                <Text fontSize="xs" color="gray.600">• Crédits professionnels</Text>
                <Text fontSize="xs" color="gray.600">• Impôts dus au moment du décès</Text>
                <Text fontSize="xs" color="gray.600">• Frais funéraires (forfait 1 500€ déductible)</Text>
              </VStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      {/* Dettes liées aux actifs (lecture seule) */}
      {dettesActifs.length > 0 && (
        <Card borderRadius="xl" borderWidth="1px" borderColor="orange.200">
          <CardHeader bg="orange.50">
            <HStack>
              <Icon as={FiCreditCard} color="orange.600" />
              <Heading size="sm" color="orange.700">
                Crédits liés aux actifs ({dettesActifs.length})
              </Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={2} align="stretch">
              <Alert status="warning" fontSize="xs" py={2}>
                <AlertIcon boxSize={3} />
                Ces dettes sont automatiquement gérées depuis vos actifs. Modifiez-les dans l'onglet "Actifs".
              </Alert>
              {dettesActifs.map((dette, index) => (
                <Box key={dette.id} p={3} bg="gray.50" borderRadius="md" borderWidth="1px">
                  <SimpleGrid columns={3} spacing={2} fontSize="xs">
                    <Box>
                      <Text color="gray.600">Intitulé</Text>
                      <Text fontWeight="600">{dette.intitule}</Text>
                    </Box>
                    <Box>
                      <Text color="gray.600">Type</Text>
                      <Badge colorScheme={dette.type === 'COMMUNE' ? 'orange' : 'red'} fontSize="xs">
                        {dette.type === 'COMMUNE' ? 'Commune' : 'Propre'}
                      </Badge>
                    </Box>
                    <Box textAlign="right">
                      <Text color="gray.600">Montant</Text>
                      <Text fontWeight="700" color="red.600">
                        {formatCurrency(dette.capital_restant_du)}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Bouton ajout dette manuelle */}
      <Button
        leftIcon={<FiPlus />}
        onClick={addDette}
        size="lg"
        variant="outline"
        colorScheme="red"
        borderStyle="dashed"
        borderWidth="2px"
        py={6}
        borderRadius="xl"
        _hover={{ bg: 'red.50', transform: 'translateY(-1px)', boxShadow: 'md' }}
      >
        <VStack spacing={0}>
          <Text fontSize="md" fontWeight="600">
            Ajouter une dette indépendante
          </Text>
          <Text fontSize="xs" opacity={0.8}>
            Crédits non liés à un actif spécifique
          </Text>
        </VStack>
      </Button>

      {/* Liste des dettes manuelles */}
      <AnimatePresence>
        {dettesManuelles.map((dette, index) => {
          const globalIndex = dettes.findIndex(d => d.id === dette.id);
          return (
            <MotionBox
              key={dette.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DetteCard
                dette={dette}
                onChange={(updatedDette) => updateDette(globalIndex, updatedDette)}
                onDelete={() => deleteDette(globalIndex)}
                isCouple={isCouple}
              />
            </MotionBox>
          );
        })}
      </AnimatePresence>

      {dettesManuelles.length === 0 && (
        <Card bg="gray.50" borderStyle="dashed" borderWidth="2px" borderColor="gray.300" borderRadius="2xl">
          <CardBody p={6} textAlign="center">
            <VStack spacing={3}>
              <Icon as={FiCreditCard} boxSize={10} color="gray.400" />
              <Text fontSize="md" fontWeight="600" color="gray.600">
                Aucune dette indépendante
              </Text>
              <Text fontSize="sm" color="gray.500" maxW="md">
                Les dettes liées à vos biens sont gérées automatiquement.
                Ajoutez ici les crédits non rattachés à un actif spécifique.
              </Text>
              <Button onClick={addDette} colorScheme="red" variant="outline" borderRadius="xl" size="sm">
                Ajouter une dette
              </Button>
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
}

// Composant carte dette individuelle
function DetteCard({
  dette,
  onChange,
  onDelete,
  isCouple,
}: {
  dette: Dette;
  onChange: (updatedDette: Dette) => void;
  onDelete: () => void;
  isCouple: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getColorByCategorie = () => {
    switch (dette.categorie) {
      case 'CREDIT_IMMOBILIER':
        return 'blue';
      case 'CREDIT_CONSOMMATION':
        return 'orange';
      case 'CREDIT_PROFESSIONNEL':
        return 'purple';
      default:
        return 'red';
    }
  };

  const partDefunt = (dette.capital_restant_du * dette.quotite_defunt) / 100;
  const partConjoint = (dette.capital_restant_du * dette.quotite_conjoint) / 100;
  const normalizePercent = (value: number) => {
    const normalized = Number.isFinite(value) ? value : 0;
    return Math.max(0, Math.min(100, Math.round(normalized)));
  };

  return (
    <Card variant="outline" borderWidth="2px" borderColor={`${getColorByCategorie()}.200`}>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <HStack>
              <Icon as={FiCreditCard} color={`${getColorByCategorie()}.600`} boxSize={5} />
              <Badge colorScheme={dette.type === 'COMMUNE' ? 'orange' : 'red'}>
                {dette.type === 'COMMUNE' ? 'Dette commune' : 'Dette propre'}
              </Badge>
            </HStack>
            <IconButton
              aria-label="Supprimer dette"
              icon={<DeleteIcon />}
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={onDelete}
            />
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600">Type de crédit</FormLabel>
              <Select
                value={dette.categorie}
                onChange={(e) =>
                  onChange({
                    ...dette,
                    categorie: e.target.value as 'CREDIT_IMMOBILIER' | 'CREDIT_CONSOMMATION' | 'CREDIT_PROFESSIONNEL' | 'AUTRE_DETTE',
                  })
                }
                size="sm"
              >
                <option value="CREDIT_IMMOBILIER">Crédit immobilier</option>
                <option value="CREDIT_CONSOMMATION">Crédit consommation</option>
                <option value="CREDIT_PROFESSIONNEL">Crédit professionnel</option>
                <option value="AUTRE_DETTE">Autre dette</option>
              </Select>
            </FormControl>

            {isCouple && (
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">Nature</FormLabel>
                <Select
                  value={dette.type}
                  onChange={(e) =>
                    onChange({
                      ...dette,
                      type: e.target.value as 'COMMUNE' | 'PROPRE',
                    })
                  }
                  size="sm"
                >
                  <option value="COMMUNE">Dette commune du couple</option>
                  <option value="PROPRE">Dette propre</option>
                </Select>
              </FormControl>
            )}
          </SimpleGrid>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="600">Intitulé</FormLabel>
            <Input
              value={dette.intitule}
              onChange={(e) => onChange({ ...dette, intitule: e.target.value })}
              placeholder="Ex: Crédit auto, Prêt travaux..."
              size="sm"
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="600">Organisme prêteur</FormLabel>
            <Input
              value={dette.organisme}
              onChange={(e) => onChange({ ...dette, organisme: e.target.value })}
              placeholder="Ex: Banque Populaire, Crédit Agricole..."
              size="sm"
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="600">Capital restant dû</FormLabel>
            <NumberInput
              value={dette.capital_restant_du}
              onChange={(valueString) =>
                onChange({ ...dette, capital_restant_du: Number(valueString) || 0 })
              }
              min={0}
              size="sm"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Text fontSize="xs" color="red.600" mt={1}>
              {formatCurrency(dette.capital_restant_du)}
            </Text>
          </FormControl>

          {/* Quotités */}
          {isCouple && dette.type === 'COMMUNE' && (
            <>
              <Divider />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                rightIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              >
                Répartition de la dette commune
              </Button>

              <Collapse in={isExpanded} animateOpacity>
                <VStack spacing={4} align="stretch" p={3} bg="orange.50" borderRadius="md">
                  <Alert status="info" fontSize="xs" py={2}>
                    <AlertIcon boxSize={3} />
                    Pour une dette commune, définissez la part de chaque époux
                  </Alert>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="600">
                      Quotité défunt : {dette.quotite_defunt}%
                    </FormLabel>
                    <Slider
                      value={dette.quotite_defunt}
                      onChange={(val) => {
                        const nextValue = normalizePercent(Number(val));
                        onChange({
                          ...dette,
                          quotite_defunt: nextValue,
                          quotite_conjoint: 100 - nextValue,
                        });
                      }}
                      min={0}
                      max={100}
                      step={1}
                    >
                      <SliderTrack>
                        <SliderFilledTrack bg="orange.500" />
                      </SliderTrack>
                      <SliderThumb boxSize={6} />
                    </Slider>
                    <Text fontSize="xs" color="orange.600" mt={1}>
                      Part : {formatCurrency(partDefunt)}
                    </Text>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="600">
                      Quotité conjoint : {dette.quotite_conjoint}%
                    </FormLabel>
                    <Slider
                      value={dette.quotite_conjoint}
                      onChange={(val) => {
                        const nextValue = normalizePercent(Number(val));
                        onChange({
                          ...dette,
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
                      Part : {formatCurrency(partConjoint)}
                    </Text>
                  </FormControl>
                </VStack>
              </Collapse>
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}
