import React, { useEffect, useState } from 'react';
import {
  VStack,
  HStack,
  Button,
  Text,
  Box,
  Divider,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  SimpleGrid,
  Card,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  MotionBox,
} from '../compat';
import { AnimatePresence } from 'framer-motion';
import { PatrimoineStats } from './PatrimoineStats';
import { FiPlus, FiHome, FiTrendingUp, FiAlertCircle, FiCreditCard } from 'react-icons/fi';
import { ActifCard } from './ActifCard';
import { DetteSection } from './DetteSection';
import { v4 as uuidv4 } from 'uuid';

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

interface Dette {
  id: string;
  type: 'COMMUNE' | 'PROPRE';
  categorie: 'CREDIT_IMMOBILIER' | 'CREDIT_CONSOMMATION' | 'CREDIT_PROFESSIONNEL' | 'AUTRE_DETTE';
  intitule: string;
  organisme: string;
  capital_restant_du: number;
  quotite_defunt: number;
  quotite_conjoint: number;
  source_actif_id?: string; // Auto-généré depuis un actif avec dette
}

interface PatrimoineExpertProps {
  actifs: Actif[];
  onActifsChange: (actifs: Actif[]) => void;
  dettes?: Dette[];
  onDettesChange?: (dettes: Dette[]) => void;
  isCouple: boolean;
  prenomDefunt?: string;
  nomDefunt?: string;
  prenomConjoint?: string;
  nomConjoint?: string;
}

export function PatrimoineExpert({ actifs, onActifsChange, dettes = [], onDettesChange = () => {}, isCouple, prenomDefunt, nomDefunt, prenomConjoint, nomConjoint }: PatrimoineExpertProps) {
  const bgColor = useColorModeValue('white', 'gray.800');

  const createNewActif = (): Actif => ({
    id: uuidv4(),
    categorie: isCouple ? 'BIEN_COMMUN' : 'BIEN_PROPRE',
    type: 'IMMOBILIER',
    intitule: '',
    usage: '',
    valeur: 0,
    dette_associee: false,
    montant_dette: 0,
    // Quotités par défaut: 100% défunt pour bien propre, 50/50 pour bien commun
    quotite_defunt: 100,
    quotite_conjoint: 0,
  });

  const addActif = () => {
    const newActif = createNewActif();
    onActifsChange([...actifs, newActif]);
  };

  const updateActif = (index: number, updatedActif: Actif) => {
    const newActifs = [...actifs];
    newActifs[index] = updatedActif;
    onActifsChange(newActifs);
  };

  const deleteActif = (index: number) => {
    const newActifs = actifs.filter((_, i) => i !== index);
    onActifsChange(newActifs);
  };

  const calculateTotals = () => {
    const totalActifs = actifs.reduce((sum, actif) => sum + actif.valeur, 0);
    
    // Dettes liées aux actifs (crédits spécifiques)
    const dettesActifs = actifs.reduce((sum, actif) => 
      sum + (actif.dette_associee ? actif.montant_dette : 0), 0
    );
    
    // Dettes séparées (communes + propres)
    const dettesCommunes = dettes.filter(d => d.type === 'COMMUNE')
      .reduce((sum, dette) => sum + dette.capital_restant_du, 0);
    const dettesPropres = dettes.filter(d => d.type === 'PROPRE')
      .reduce((sum, dette) => sum + dette.capital_restant_du, 0);
    
    const totalDettes = dettesActifs + dettesCommunes + dettesPropres;
    const patrimoineNet = totalActifs - totalDettes;

    // Calcul de la part du défunt
    const patrimoineDefunt = actifs.reduce((sum, actif) => {
      const valeurNette = actif.valeur - (actif.dette_associee ? actif.montant_dette : 0);
      return sum + (valeurNette * actif.quotite_defunt / 100);
    }, 0);

    // Ajout des dettes du défunt (propres à 100%, communes selon quotité)
    const dettesDefunt = dettesPropres + 
      dettes.filter(d => d.type === 'COMMUNE')
        .reduce((sum, dette) => sum + (dette.capital_restant_du * dette.quotite_defunt / 100), 0);

    const patrimoineNetDefunt = patrimoineDefunt - dettesDefunt;

    return { 
      totalActifs, 
      totalDettes, 
      patrimoineNet, 
      patrimoineDefunt: patrimoineNetDefunt,
      dettesActifs,
      dettesCommunes,
      dettesPropres 
    };
  };

  const { totalActifs, totalDettes, patrimoineNet, patrimoineDefunt, dettesActifs, dettesCommunes, dettesPropres } = calculateTotals();

  // Synchronisation automatique des dettes depuis les actifs ayant une dette associée
  useEffect(() => {
    // Clone actuel
    let newDettes: Dette[] = [...dettes];

    // Supprimer les dettes auto créées si l'actif n'existe plus ou n'a plus de dette
    newDettes = newDettes.filter(d => {
      if (!d.source_actif_id) return true; // dette manuelle conservée
      const src = actifs.find(a => a.id === d.source_actif_id);
      return !!(src && src.dette_associee && src.montant_dette > 0);
    });

    // Pour chaque actif avec dette, créer/mettre à jour une dette correspondante
    actifs.forEach(a => {
      if (!a.dette_associee || (a.montant_dette || 0) <= 0) return;
      const idx = newDettes.findIndex(d => d.source_actif_id === a.id);
      const type = (isCouple && a.categorie === 'BIEN_COMMUN') ? 'COMMUNE' : 'PROPRE';
      const categorie = a.type === 'IMMOBILIER' ? 'CREDIT_IMMOBILIER' : 'AUTRE_DETTE';
      const baseDette: Dette = {
        id: idx >= 0 ? newDettes[idx].id : (a.id + '_dette'),
        type,
        categorie,
        intitule: `Crédit ${a.intitule || a.usage || a.type}`,
        organisme: (a as any).organisme_preteur || '',
        capital_restant_du: a.montant_dette || 0,
        quotite_defunt: type === 'COMMUNE' ? a.quotite_defunt : 100,
        quotite_conjoint: type === 'COMMUNE' ? a.quotite_conjoint : 0,
        source_actif_id: a.id,
      };
      if (idx >= 0) newDettes[idx] = baseDette; else newDettes.push(baseDette);
    });

    // Éviter les updates inutiles
    const serializedNew = JSON.stringify(newDettes);
    const serializedOld = JSON.stringify(dettes);
    if (serializedNew !== serializedOld) {
      onDettesChange(newDettes);
    }
  }, [JSON.stringify(actifs), isCouple]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getActifsByCategorie = () => {
    const categories = {
      BIEN_COMMUN: actifs.filter(a => a.categorie === 'BIEN_COMMUN'),
      BIEN_PROPRE: actifs.filter(a => 
        a.categorie === 'BIEN_PROPRE' || 
        a.categorie === 'BIEN_PROPRE_MONSIEUR' || 
        a.categorie === 'BIEN_PROPRE_MADAME'
      ),
      BIEN_INDIVISION: actifs.filter(a => a.categorie === 'BIEN_INDIVISION'),
    };
    return categories;
  };

  const categories = getActifsByCategorie();

  const summaryCards = [
    { label: 'Total des actifs', value: totalActifs, color: 'blue.600', bg: 'blue.50' },
    { label: 'Dettes liées aux actifs', value: dettesActifs, color: 'orange.600', bg: 'orange.50' },
    { label: 'Autres dettes', value: dettesCommunes + dettesPropres, color: 'red.600', bg: 'red.50' },
    { label: 'Patrimoine net', value: patrimoineNet, color: 'green.600', bg: 'green.50' },
    { label: 'Part nette du défunt', value: patrimoineDefunt, color: 'purple.600', bg: 'purple.50' },
  ];

  return (
    <VStack spacing={8} align="stretch">
      {/* Résumé financier amélioré */}
      <Card bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
        <CardBody p={6}>
          <VStack align="stretch" spacing={1} mb={5}>
            <Text fontSize="lg" fontWeight="700" color="gray.900">
              Synthèse patrimoniale
            </Text>
            <Text fontSize="sm" color="gray.600">
              Vue consolidée de vos actifs, dettes et de la part économiquement attribuable au défunt.
            </Text>
          </VStack>
          <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
            {summaryCards.map((card) => (
              <Box
                key={card.label}
                textAlign="left"
                p={4}
                bg={card.bg}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="whiteAlpha.700"
              >
                <Text fontSize="xs" color="gray.600" mb={1}>{card.label}</Text>
                <Text fontSize="lg" fontWeight="700" color={card.color}>
                  {formatCurrency(card.value)}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Affichage temps réel du patrimoine */}
      {actifs.length > 0 && (
        <Box mb={6}>
          <PatrimoineStats actifs={actifs} showDetails={true} />
        </Box>
      )}

      {/* Organisation par onglets */}
      <Tabs variant="enclosed" colorScheme="brand" defaultValue="actifs">
        <TabList>
          <Tab value="actifs">
            <HStack>
              <Icon as={FiHome} />
              <Text>Actifs ({actifs.length})</Text>
            </HStack>
          </Tab>
          <Tab value="dettes">
            <HStack>
              <Icon as={FiCreditCard} />
              <Text>Dettes & Crédits ({dettes.length})</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Onglet Actifs */}
          <TabPanel value="actifs" px={0} pt={6}>
            <VStack spacing={6} align="stretch">
              {/* Information pédagogique */}
              <Alert status="info" borderRadius="xl" bg="blue.50" border="1px solid" borderColor="blue.200">
                <AlertIcon />
                <Box>
                  <Text fontSize="sm" fontWeight="600" color="blue.800">
                    Vision Expert : Analyse détaillée par actif
                  </Text>
                  <Text fontSize="xs" color="blue.700" mt={1}>
                    Renseignez chaque bien avec sa valeur, ses dettes éventuelles et les quotités de détention.
                    Cela permet un calcul précis de la succession selon la situation matrimoniale.
                  </Text>
                </Box>
              </Alert>

              {/* Bouton d'ajout d'actif */}
              <MotionBox
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  leftIcon={<FiPlus />}
                  onClick={addActif}
                  size="lg"
                  variant="outline"
                  colorScheme="brand"
                  width="full"
                  borderRadius="xl"
                  borderStyle="dashed"
                  borderWidth="2px"
                  py={8}
                  _hover={{
                    bg: 'brand.50',
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                  }}
                >
                  <VStack spacing={1}>
                    <Text fontSize="md" fontWeight="600">
                      Ajouter un actif au patrimoine
                    </Text>
                    <Text fontSize="xs" opacity={0.8}>
                      Immobilier, placement, véhicule, fonds de commerce...
                    </Text>
                  </VStack>
                </Button>
              </MotionBox>

              {/* Liste des actifs par catégorie */}
              {Object.entries(categories).map(([categorie, actifsCategorie]) => {
                if (actifsCategorie.length === 0) return null;

                const getCategorieInfo = (cat: string) => {
                  switch (cat) {
                    case 'BIEN_COMMUN':
                      return { label: 'Biens communs du couple', icon: FiHome, color: 'blue' };
                    case 'BIEN_PROPRE':
                      return { label: 'Biens propres', icon: FiTrendingUp, color: 'green' };
                    case 'BIEN_INDIVISION':
                      return { label: 'Biens propres détenus en indivision', icon: FiAlertCircle, color: 'orange' };
                    default:
                      return { label: cat, icon: FiHome, color: 'gray' };
                  }
                };

                const categorieInfo = getCategorieInfo(categorie);

                return (
                  <MotionBox
                    key={categorie}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between" align="center" flexWrap="wrap">
                        <HStack>
                          <Icon
                            as={categorieInfo.icon}
                            color={`${categorieInfo.color}.500`}
                            boxSize={5}
                          />
                          <Text fontSize="lg" fontWeight="700" color="gray.800">
                            {categorieInfo.label}
                          </Text>
                        </HStack>
                        <Icon
                          as={FiTrendingUp}
                          color={`${categorieInfo.color}.400`}
                          boxSize={4}
                        />
                        <Text fontSize="sm" color="gray.500">
                          {actifsCategorie.length} bien{actifsCategorie.length > 1 ? 's' : ''}
                        </Text>
                      </HStack>
                      <VStack spacing={4}>
                        {actifsCategorie.map((actif, index) => {
                          // Trouver l'index global dans le tableau actifs complet
                          const globalIndex = actifs.findIndex(a => a.id === actif.id);
                          return (
                            <Box key={actif.id} w="full">
                              <ActifCard
                                actif={actif}
                                index={index}
                                onChange={(updated) => updateActif(globalIndex, updated)}
                                onDelete={() => deleteActif(globalIndex)}
                                isCouple={isCouple}
                                prenomDefunt={prenomDefunt}
                                nomDefunt={nomDefunt}
                                prenomConjoint={prenomConjoint}
                                nomConjoint={nomConjoint}
                              />
                            </Box>
                          );
                        })}
                      </VStack>
                    </VStack>
                  </MotionBox>
                );
              })}

              {actifs.length === 0 && (
                <MotionBox
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card bg="gray.50" borderStyle="dashed" borderWidth="2px" borderColor="gray.300" borderRadius="2xl">
                    <CardBody p={8} textAlign="center">
                      <VStack spacing={4}>
                        <Icon as={FiHome} boxSize={12} color="gray.400" />
                        <Text fontSize="lg" fontWeight="600" color="gray.600">
                          Aucun actif renseigné
                        </Text>
                        <Text fontSize="sm" color="gray.500" maxW="md">
                          Commencez par ajouter vos biens pour obtenir une évaluation précise de votre patrimoine successoral.
                        </Text>
                        <Button onClick={addActif} colorScheme="brand" borderRadius="xl" size="sm">
                          Ajouter mon premier actif
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </MotionBox>
              )}
            </VStack>
          </TabPanel>

          {/* Onglet Dettes */}
          <TabPanel value="dettes" px={0} pt={6}>
            <DetteSection
              dettes={dettes}
              onDettesChange={onDettesChange}
              isCouple={isCouple}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}
