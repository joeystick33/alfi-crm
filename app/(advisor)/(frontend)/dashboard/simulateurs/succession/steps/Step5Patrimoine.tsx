import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Switch,
  Text,
  VStack,
  useToast,
  MotionBox,
} from '../compat';
import { AnimatePresence } from 'framer-motion';
// import { step5PatrimoineSchema } from '../validation/schemas';
import { PatrimoineExpert } from '../components/PatrimoineExpert';
import { convertPatrimoineToBackend, validatePatrimoineData } from '../utils/patrimoineConverter';

// Validation temporairement désactivée pour MVP
export type Step5PatrimoineValues = any; // z.infer<typeof step5PatrimoineSchema>;

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
  coindivisaires?: string;
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
  source_actif_id?: string;
}

export function Step5Patrimoine({
  defaultValues,
  onSubmit,
  onBack,
  statut,
  prenomDefunt,
  nomDefunt,
  prenomConjoint,
  nomConjoint,
}: {
  defaultValues: Step5PatrimoineValues;
  onSubmit: (values: Step5PatrimoineValues) => void;
  onBack: () => void;
  statut?: 'marié' | 'pacsé' | 'concubinage' | 'célibataire' | null;
  prenomDefunt?: string;
  nomDefunt?: string;
  prenomConjoint?: string;
  nomConjoint?: string;
}) {
  const toast = useToast();
  const [actifsExpert, setActifsExpert] = useState<Actif[]>([]);
  const [dettesExpert, setDettesExpert] = useState<Dette[]>([]);
  const [valeurResidence, setValeurResidence] = useState<number>(Number((defaultValues as any)?.valeur_residence_principale || 0));

  useEffect(() => {
    const initialActifs = (defaultValues as any)?.actifs || [];
    if (Array.isArray(initialActifs) && initialActifs.length > 0) {
      setActifsExpert(initialActifs as any);
    }

    const initialDettes = (defaultValues as any)?.dettes || [];
    if (Array.isArray(initialDettes) && initialDettes.length > 0) {
      setDettesExpert(initialDettes as any);
    }

    setValeurResidence(Number((defaultValues as any)?.valeur_residence_principale || 0));
  }, [defaultValues]);

  const [isCouple, setIsCouple] = useState<boolean>(() => {
    const s = (statut || '').toLowerCase();
    return s === 'marié' || s === 'marie' || s === 'pacsé' || s === 'pacse' || s === 'concubinage';
  });

  const { register, watch } = useForm<Step5PatrimoineValues>({
    // resolver: zodResolver(step5PatrimoineSchema),
    defaultValues: {
      ...defaultValues,
      mode_patrimoine: 'DETAILLE',
    },
  });

  const presenceRP = watch('presence_residence_principale');
  const valeurRP = valeurResidence;

  useEffect(() => {
    const s = (statut || '').toLowerCase();
    setIsCouple(s === 'marié' || s === 'marie' || s === 'pacsé' || s === 'pacse' || s === 'concubinage');
  }, [statut]);

  useEffect(() => {
    if (!presenceRP) {
      setActifsExpert(prev => {
        const next = prev.filter(a => a && a.id && !a.id.startsWith('residence_principale_auto'));
        return next.length === prev.length ? prev : next;
      });
      return;
    }

    if (valeurRP > 0) {
      setActifsExpert(prev => {
        const existsAuto = prev.some(a => a && a.id && a.id.startsWith('residence_principale_auto'));
        if (existsAuto) return prev;

        const rp: Actif = {
          id: 'residence_principale_auto',
          categorie: isCouple ? 'BIEN_COMMUN' : 'BIEN_PROPRE',
          type: 'IMMOBILIER',
          intitule: 'Résidence principale',
          usage: 'Résidence principale',
          valeur: typeof valeurRP === 'number' ? valeurRP : Number(valeurRP) || 0,
          dette_associee: false,
          montant_dette: 0,
          quotite_defunt: isCouple ? 50 : 100,
          quotite_conjoint: isCouple ? 50 : 0,
        };
        return [rp, ...prev];
      });
    }
  }, [presenceRP, valeurRP, isCouple]);

  useEffect(() => {
    if (!presenceRP || valeurRP === 0) return;

    setActifsExpert(prev => {
      let changed = false;
      const next = prev.filter(a => a && a.id).map(a => {
        if (!a.id.startsWith('residence_principale_auto')) return a;

        const updated: Actif = {
          ...a,
          valeur: typeof valeurRP === 'number' ? valeurRP : Number(valeurRP) || 0,
          categorie: isCouple ? 'BIEN_COMMUN' : 'BIEN_PROPRE',
          quotite_defunt: isCouple ? 50 : 100,
          quotite_conjoint: isCouple ? 50 : 0,
        };

        if (
          updated.valeur !== a.valeur ||
          updated.categorie !== a.categorie ||
          updated.quotite_defunt !== a.quotite_defunt ||
          updated.quotite_conjoint !== a.quotite_conjoint
        ) {
          changed = true;
          return updated;
        }

        return a;
      });

      return changed ? next : prev;
    });
  }, [valeurRP, isCouple, presenceRP]);

  const handleFormSubmit = () => {
    const validation = validatePatrimoineData('DETAILLE', 0, actifsExpert);

    if (!validation.isValid) {
      validation.errors.forEach(error => {
        toast({
          title: 'Erreur de validation',
          description: error,
          status: 'error',
          duration: 3000,
        });
      });
      return;
    }

    const convertedData = convertPatrimoineToBackend('DETAILLE', 0, actifsExpert, {
      presence: presenceRP || false,
      valeur: valeurResidence || 0,
      occupation_conjoint: watch('residence_occupation_conjoint') || false,
      occupation_enfant_mineur: watch('residence_occupation_enfant_mineur') || false,
    });

    const totalDettesActifs = actifsExpert.reduce((sum, actif) => sum + (actif.dette_associee ? Number(actif.montant_dette || 0) : 0), 0);
    const totalDettesManuelles = dettesExpert
      .filter(d => !d.source_actif_id)
      .reduce((sum, dette) => sum + Number(dette.capital_restant_du || 0), 0);
    const totalDettes = totalDettesActifs + totalDettesManuelles;

    const patrimoineBrut = actifsExpert.reduce((sum, actif) => sum + Number(actif.valeur || 0), 0);
    const patrimoineNet = Math.max(0, patrimoineBrut - totalDettes);

    const finalData: Step5PatrimoineValues = {
      ...convertedData,
      mode_patrimoine: 'DETAILLE',
      actifs: convertedData.actifs as any[],
      dettes: dettesExpert.filter(d => !d.source_actif_id),
      dettes_totales: totalDettes,
      patrimoine_net_total: patrimoineNet,
    };

    onSubmit(finalData);
  };

  return (
    <VStack spacing={4} align="stretch" maxW="900px" mx="auto">
      <Box p={5} bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
        <VStack align="stretch" spacing={3}>
          <Text fontSize="xl" fontWeight="800" color="gray.900">
            Patrimoine du foyer
          </Text>
          <Text fontSize="sm" color="gray.600">
            Renseignez vos biens et vos dettes pour calculer une masse successorale fiable. Chaque actif doit être visible, valorisé et correctement rattaché à son propriétaire.
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            <Box p={3} bg="blue.50" borderRadius="xl" borderWidth="1px" borderColor="blue.200">
              <Text fontSize="xs" fontWeight="700" color="blue.800" mb={1}>1. Ajoutez les biens</Text>
              <Text fontSize="xs" color="blue.700">Immobilier, comptes, placements, biens mobiliers, actifs professionnels.</Text>
            </Box>
            <Box p={3} bg="orange.50" borderRadius="xl" borderWidth="1px" borderColor="orange.200">
              <Text fontSize="xs" fontWeight="700" color="orange.800" mb={1}>2. Rattachez les dettes</Text>
              <Text fontSize="xs" color="orange.700">Crédits liés à un bien ou dettes indépendantes du patrimoine.</Text>
            </Box>
            <Box p={3} bg="green.50" borderRadius="xl" borderWidth="1px" borderColor="green.200">
              <Text fontSize="xs" fontWeight="700" color="green.800" mb={1}>3. Vérifiez les répartitions</Text>
              <Text fontSize="xs" color="green.700">Quotités du défunt, du conjoint ou parts d'indivision.</Text>
            </Box>
          </SimpleGrid>
        </VStack>
      </Box>

      <Accordion allowToggle border="1px solid" borderColor="brand.200" borderRadius="lg">
        <AccordionItem border="none">
          <h3>
            <AccordionButton px={3} py={2} _expanded={{ bg: 'brand.50' }}>
              <HStack flex="1" spacing={2}>
                <Text fontSize="sm" fontWeight="600" color="brand.700">
                  Comment distinguer les différents types de biens ?
                </Text>
              </HStack>
              <AccordionIcon color="brand.500" />
            </AccordionButton>
          </h3>
          <AccordionPanel px={3} py={3}>
            <VStack align="stretch" spacing={2} fontSize="xs" color="gray.700">
              <Box p={2} bg="brand.50" borderRadius="md" borderLeft="2px solid" borderLeftColor="brand.400">
                <Text fontWeight="700" color="brand.800" mb={0.5}>Bien propre {prenomDefunt || 'du défunt'}</Text>
                <Text>Acquis avant le mariage ou reçu par héritage/donation.</Text>
              </Box>
              {isCouple && prenomConjoint && (
                <Box p={2} bg="brand.50" borderRadius="md" borderLeft="2px solid" borderLeftColor="brand.400">
                  <Text fontWeight="700" color="brand.800" mb={0.5}>Bien propre {prenomConjoint}</Text>
                  <Text>Acquis avant le mariage ou reçu par héritage/donation à {prenomConjoint}.</Text>
                </Box>
              )}
              {isCouple && (
                <Box p={2} bg="brand.50" borderRadius="md" borderLeft="2px solid" borderLeftColor="brand.400">
                  <Text fontWeight="700" color="brand.800" mb={0.5}>Bien commun</Text>
                  <Text>Acquis pendant le mariage, appartient aux deux époux (50/50 par défaut).</Text>
                </Box>
              )}
              <Box p={2} bg="brand.50" borderRadius="md" borderLeft="2px solid" borderLeftColor="brand.400">
                <Text fontWeight="700" color="brand.800" mb={0.5}>Bien en indivision</Text>
                <Text>Détenu avec d'autres personnes, chacun possède une quote-part.</Text>
              </Box>
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Box
          borderRadius="xl"
          borderWidth="2px"
          borderColor={presenceRP ? 'brand.400' : 'brand.200'}
          bg={presenceRP ? 'brand.50' : 'white'}
          p={5}
          position="relative"
          overflow="hidden"
          transition="all 0.3s ease"
          _hover={{ borderColor: 'brand.400', boxShadow: '0 2px 12px rgba(12, 35, 64, 0.08)' }}
        >
          {/* Bandeau fiscal */}
          <Box
            position="absolute"
            top={0}
            right={0}
            bg="brand.600"
            color="white"
            px={3}
            py={1}
            borderBottomLeftRadius="lg"
            fontSize="2xs"
            fontWeight="700"
            letterSpacing="wide"
            textTransform="uppercase"
          >
            Abattement 20 % — art. 764 bis CGI
          </Box>

          <VStack spacing={4} align="stretch">
            <HStack spacing={3} align="center">
              <Box
                w="42px"
                h="42px"
                borderRadius="lg"
                bg="brand.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Text fontSize="xl" lineHeight="1">🏠</Text>
              </Box>
              <Box flex="1">
                <Text fontSize="md" fontWeight="700" color="gray.900">
                  Résidence principale
                </Text>
                <Text fontSize="xs" color="gray.600" lineHeight="short">
                  Êtes-vous propriétaire de votre résidence principale ?
                </Text>
              </Box>
              <Switch {...register('presence_residence_principale')} colorScheme="brand" size="md" />
            </HStack>

            <AnimatePresence>
              {presenceRP && (
                <MotionBox
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <VStack spacing={3} align="stretch" pt={2} borderTop="1px solid" borderColor="brand.200">
                    <Box p={3} bg="brand.100" borderRadius="lg" borderLeft="3px solid" borderLeftColor="brand.500">
                      <Text fontSize="xs" fontWeight="600" color="brand.900">
                        Votre résidence principale sera automatiquement ajoutée comme premier bien.
                      </Text>
                      <Text fontSize="xs" color="brand.800" mt={1}>
                        Vous pourrez ajuster sa valeur et ses quotes-parts dans la liste ci-dessous.
                      </Text>
                    </Box>

                    <FormControl>
                      <FormLabel fontWeight="600" fontSize="sm">
                        Valeur estimée
                      </FormLabel>
                      <NumberInput
                        min={0}
                        size="sm"
                        value={valeurResidence}
                        onChange={(valueString) => {
                          const parsed = Number(valueString?.replace(/\s/g, '').replace(',', '.'));
                          setValeurResidence(Number.isFinite(parsed) ? parsed : 0);
                        }}
                      >
                        <NumberInputField
                          placeholder="Ex : 450 000 €"
                          bg="white"
                          borderRadius="md"
                        />
                      </NumberInput>
                    </FormControl>

                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <FormLabel mb="0" fontWeight="600" fontSize="sm">
                          Le conjoint survivant continuera d'y habiter
                        </FormLabel>
                        <Text fontSize="xs" color="gray.600">
                          Utile pour évaluer les options d'usufruit ou de droit d'usage.
                        </Text>
                      </Box>
                      <Switch {...register('residence_occupation_conjoint')} colorScheme="brand" size="sm" />
                    </FormControl>

                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <FormLabel mb="0" fontWeight="600" fontSize="sm">
                          Un enfant mineur y résidera toujours
                        </FormLabel>
                        <Text fontSize="xs" color="gray.600">
                          Permet d'anticiper un éventuel maintien dans les lieux à titre gratuit.
                        </Text>
                      </Box>
                      <Switch {...register('residence_occupation_enfant_mineur')} colorScheme="brand" size="sm" />
                    </FormControl>
                  </VStack>
                </MotionBox>
              )}
            </AnimatePresence>
          </VStack>
        </Box>
      </MotionBox>

      <MotionBox
        key="expert"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.25 }}
      >
        <PatrimoineExpert
          actifs={actifsExpert}
          onActifsChange={setActifsExpert}
          dettes={dettesExpert}
          onDettesChange={setDettesExpert}
          isCouple={isCouple}
          prenomDefunt={prenomDefunt}
          nomDefunt={nomDefunt}
          prenomConjoint={prenomConjoint}
          nomConjoint={nomConjoint}
        />
      </MotionBox>

      <HStack justifyContent="space-between" pt={2}>
        <Button variant="outline" onClick={onBack} size="md" borderRadius="xl">
          ← Précédent
        </Button>
        <Button
          onClick={handleFormSubmit}
          colorScheme="brand"
          size="md"
          borderRadius="xl"
          bgGradient="linear(135deg, brand.500, success.500)"
          _hover={{ bgGradient: 'linear(135deg, brand.600, success.600)', transform: 'translateY(-1px)', boxShadow: 'md' }}
        >
          Valider le patrimoine →
        </Button>
      </HStack>
    </VStack>
  );
}
