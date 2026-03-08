import React, { useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box, Button, Card, CardBody, CardHeader, Divider, FormControl, FormLabel, Heading, HStack, Input,
  NumberInput, NumberInputField, Radio, RadioGroup, Switch, Text, IconButton, VStack, Alert, AlertIcon,
  Select, Badge, SimpleGrid, Progress, Icon
} from '../compat';
import { AddIcon, DeleteIcon } from '../compat';
import { FiFileText, FiInfo, FiUsers, FiAlertTriangle } from 'react-icons/fi';
import { useSuccessionStore } from '../store/successionStore';

// Schema complet pour les legs conformes aux règles CGP
const legsSchema = z.object({
  presence_legs_particuliers: z.boolean().default(false),
  legs_particuliers: z.array(z.object({
    beneficiaire_id: z.string().optional(), // ID du proche si sélectionné
    beneficiaire_nom: z.string().min(1, "Le bénéficiaire est requis"),
    beneficiaire_prenom: z.string().optional(),
    montant_legs: z.number().min(0, "Le montant du legs doit être positif"),
    type_legs: z.enum([
      'legs_particulier',        // Somme ou bien déterminé
      'legs_universel',          // Totalité des biens
      'legs_titre_universel',    // Quote-part des biens
      'legs_usufruit',          // Usufruit seulement
      'legs_nue_propriete'      // Nue-propriété seulement
    ]).default('legs_particulier'),
    objet_legs: z.enum(['somme_argent', 'bien_immobilier', 'valeurs_mobilieres', 'bijoux', 'vehicule', 'autre']).default('somme_argent'),
    quotite_utilisee: z.number().min(0).max(1).default(0), // Pourcentage de quotité utilisé
    condition_legs: z.string().optional(), // Condition suspensive éventuelle
    description: z.string().optional(),
    proprietaire: z.enum(['MONSIEUR', 'MADAME']).optional() // Qui a fait le legs (mode couple)
  })).default([]),
  testament_partenaire: z.boolean().default(false),
  type_legs_partenaire: z.enum([
    'quotite_disponible_pleine_propriete',
    'quotite_disponible_usufruit',
    'usufruit_residence_principale',
    'legs_particulier_montant'
  ]).optional()
});

export type LegsValues = z.infer<typeof legsSchema>;

export function Step8Legs({
  defaultValues,
  onSubmit,
  onBack,
  patrimoineNet,
  nombreEnfants,
  statut,
  donationsRapportables,
  isCouple,
  donneesConjoint,
  donneesEnfants,
  donneesFamille,
}: {
  defaultValues: LegsValues;
  onSubmit: (values: LegsValues) => void;
  onBack: () => void;
  patrimoineNet?: number;
  nombreEnfants?: number;
  statut: 'marié' | 'pacsé' | 'concubinage' | 'célibataire' | null;
  isCouple?: boolean;
  donationsRapportables?: number; // Montant total des donations rapportables
  donneesConjoint?: { prenom: string; age?: number } | null;
  donneesEnfants?: Array<{ id: string; prenom: string; age?: number }>;
  donneesFamille?: {
    parents?: { pere?: { prenom: string; vivant: boolean }; mere?: { prenom: string; vivant: boolean } };
    fratrie?: Array<{ prenom: string; vivant: boolean }>;
  };
}) {
  const { register, handleSubmit, control, watch, setValue } = useForm<LegsValues>({
    resolver: zodResolver(legsSchema) as any,
    defaultValues,
  });

  const presenceLegs = watch('presence_legs_particuliers');
  const testamentPartenaire = watch('testament_partenaire');
  const legs = watch('legs_particuliers') || [];

  const { fields: fieldsLegs, append: appendLeg, remove: removeLeg } = useFieldArray({ 
    control, 
    name: 'legs_particuliers' 
  });

  // Données globales (Zustand) pour l'aperçu fiscal
  const { simulationData } = useSuccessionStore();

  // Aperçu fiscal approximatif
  const apApercuFiscal = useMemo(() => {
    const contrats = Array.isArray(simulationData?.contrats_av) ? simulationData.contrats_av : [];
    const sumAvant70 = contrats.reduce((s: number, c: any) => s + Number(c.montantVersementsAvant70 || 0), 0);
    const sumApres70 = contrats.reduce((s: number, c: any) => s + Number(c.montantVersementsApres70 || 0), 0);

    const presenceRP = !!simulationData?.presence_residence_principale;
    const valeurRP = Number(simulationData?.valeur_residence_principale || 0);
    const occConjoint = !!simulationData?.residence_occupation_conjoint;
    const occEnfantMineur = !!simulationData?.residence_occupation_enfant_mineur;
    const abatRP = presenceRP && (occConjoint || occEnfantMineur) ? Math.round(valeurRP * 0.2) : 0;

    // Base succession (hors AV) = patrimoine net - abattement RP éventuel
    const baseSuccessionHorsAV = Math.max(0, Math.round((patrimoineNet || 0) - abatRP));

    // AV après 70 ans : réintégration dans l'actif successoral au-delà de 30 000 € de primes (art. 757 B CGI)
    const baseAVApres70Succession = Math.max(0, Math.round(sumApres70 - 30000));

    // Total base taxable approximative (hors abattements personnels par héritier)
    const baseTaxableApprox = baseSuccessionHorsAV + baseAVApres70Succession;

    return {
      sumAvant70,
      sumApres70,
      abatRP,
      baseSuccessionHorsAV,
      baseAVApres70Succession,
      baseTaxableApprox,
    };
  }, [simulationData, patrimoineNet]);

  // Génération des options de bénéficiaires depuis données familiales
  const optionsBeneficiaires = useMemo(() => {
    const options = [];
    
    // Conjoint en premier
    if (donneesConjoint) {
      options.push({
        id: 'conjoint',
        nom: donneesConjoint.prenom,
        lien: 'conjoint'
      });
    }
    
    // Enfants
    donneesEnfants?.forEach((enfant) => {
      options.push({
        id: enfant.id,
        nom: enfant.prenom,
        lien: 'enfant'
      });
    });
    
    // Parents
    if (donneesFamille?.parents?.pere?.vivant) {
      options.push({
        id: 'pere',
        nom: donneesFamille.parents.pere.prenom,
        lien: 'parent'
      });
    }
    if (donneesFamille?.parents?.mere?.vivant) {
      options.push({
        id: 'mere',
        nom: donneesFamille.parents.mere.prenom,
        lien: 'parent'
      });
    }
    
    return options;
  }, [donneesConjoint, donneesEnfants, donneesFamille]);

  // Calcul précis quotité disponible et réserve héréditaire selon CGI
  const calculRhQd = useMemo(() => {
    if (!patrimoineNet) return null;

    // Masse de calcul = patrimoine net + donations rapportables (art. 922 CGI)
    const masseCalcul = patrimoineNet + (donationsRapportables || 0);
    let reserveHereditaire = 0;
    let quotiteDisponible = 0;

    // Calcul réserve héréditaire selon art. 913 et suivants CC
    if (!nombreEnfants || nombreEnfants === 0) {
      // Sans enfant - pas de réserve héréditaire
      reserveHereditaire = 0;
      quotiteDisponible = masseCalcul;
    } else if (nombreEnfants === 1) {
      // 1 enfant : réserve = 1/2
      reserveHereditaire = masseCalcul * 0.5;
      quotiteDisponible = masseCalcul * 0.5;
    } else if (nombreEnfants === 2) {
      // 2 enfants : réserve = 2/3
      reserveHereditaire = masseCalcul * (2/3);
      quotiteDisponible = masseCalcul * (1/3);
    } else if (nombreEnfants >= 3) {
      // 3 enfants et plus : réserve = 3/4
      reserveHereditaire = masseCalcul * 0.75;
      quotiteDisponible = masseCalcul * 0.25;
    }

    // Calcul total legs et utilisation quotité
    const totalLegs = legs.reduce((sum, leg) => sum + (leg.montant_legs || 0), 0);
    const quotiteUtilisee = quotiteDisponible > 0 ? (totalLegs / quotiteDisponible) * 100 : 0;
    const depassement = totalLegs > quotiteDisponible;

    // Réduction proportionnelle si dépassement (art. 926 CC)
    const coefficientReduction = depassement ? quotiteDisponible / totalLegs : 1;

    return {
      masseCalcul: Math.round(masseCalcul),
      reserveHereditaire: Math.round(reserveHereditaire),
      quotiteDisponible: Math.round(quotiteDisponible),
      totalLegs: Math.round(totalLegs),
      quotiteUtilisee: Math.min(100, Math.round(quotiteUtilisee)),
      depassement,
      coefficientReduction: Math.round(coefficientReduction * 10000) / 10000,
      legsReduits: depassement ? Math.round(totalLegs * coefficientReduction) : totalLegs
    };
  }, [patrimoineNet, nombreEnfants, legs, donationsRapportables]);

  const handleAddLeg = () => {
    appendLeg({
      beneficiaire_id: '',
      beneficiaire_nom: '',
      beneficiaire_prenom: '',
      montant_legs: 0,
      type_legs: 'legs_particulier',
      objet_legs: 'somme_argent',
      quotite_utilisee: 0,
      condition_legs: '',
      description: '',
      proprietaire: undefined
    });
  };

  const showConjointTestament = statut === 'marié' || statut === 'pacsé';

  return (
    <VStack spacing={6} align="stretch" maxW="800px" mx="auto">
      <Box p={6} bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
        <HStack spacing={3} align="start">
          <Box p={3} bg="brand.50" borderRadius="xl" color="brand.600">
            <Icon as={FiFileText} boxSize={6} />
          </Box>
          <VStack align="start" spacing={1}>
            <Heading size="md" color="gray.900">
              Vos legs testamentaires
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Dispositions de votre quotité disponible par testament.
            </Text>
          </VStack>
        </HStack>
      </Box>

      <Card w="full" variant="outline" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm" overflow="hidden">
        <CardHeader bg="gray.50" py={4} px={6} borderBottom="1px solid" borderColor="gray.200">
          <Heading size="sm" color="gray.800">9. Dispositions testamentaires</Heading>
        </CardHeader>

        <CardBody px={6} py={6}>
          <form onSubmit={handleSubmit(onSubmit as any)}>
            <VStack spacing={8} align="stretch">
              
              {/* Guide types de legs */}
              <Card bg="blue.50" borderRadius="2xl" border="1px solid" borderColor="blue.200" boxShadow="sm">
                <CardBody px={5} py={5}>
                  <Heading size="sm" color="blue.800" mb={4}>
                    Types de legs : quelle différence ?
                  </Heading>
                  <VStack spacing={3} align="stretch">
                    <Box p={4} bg="white" borderRadius="xl" borderLeft="4px solid" borderColor="blue.500" boxShadow="sm">
                      <HStack mb={1}>
                        <Text fontSize="lg">💎</Text>
                        <Text fontWeight="700" color="blue.800" fontSize="sm">Legs particulier</Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.600">
                        • <strong>Bien déterminé</strong> : une somme, un bien immobilier, un bijou...<br/>
                        • Usage : Léguer un bien précis à quelqu'un
                      </Text>
                    </Box>

                    <Box p={4} bg="white" borderRadius="xl" borderLeft="4px solid" borderColor="brand.500" boxShadow="sm">
                      <HStack mb={1}>
                        <Text fontSize="lg">🌎</Text>
                        <Text fontWeight="700" color="brand.800" fontSize="sm">Legs universel</Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.600">
                        • <strong>Totalité des biens</strong> (dans la limite de la quotité disponible)<br/>
                        • Usage : Tout léguer à une personne (ex: conjoint)
                      </Text>
                    </Box>

                    <Box p={4} bg="white" borderRadius="xl" borderLeft="4px solid" borderColor="orange.500" boxShadow="sm">
                      <HStack mb={1}>
                        <Text fontSize="lg">🔑</Text>
                        <Text fontWeight="700" color="orange.800" fontSize="sm">Legs d'usufruit / Nue-propriété</Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.600">
                        • <strong>Démembrement</strong> : séparer usage et propriété<br/>
                        • Usage : Protéger le conjoint (usufruit) tout en préservant patrimoine enfants
                      </Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

            {/* Calcul quotité disponible */}
            {calculRhQd && (
              <Card bg="gray.900" color="white" borderRadius="2xl" overflow="hidden" boxShadow="md" mt={2}>
                <CardBody p={0}>
                  <Box p={4} bg="blackAlpha.300" borderBottomWidth="1px" borderColor="whiteAlpha.200">
                    <HStack>
                      <Icon as={FiUsers} color="brand.300" boxSize={5} />
                      <Heading size="sm" color="white">Calcul actif successoral (civil)</Heading>
                    </HStack>
                  </Box>
                  <VStack spacing={4} w="full" p={5}>
                    {/* Détail de la masse de calcul */}
                    {donationsRapportables && donationsRapportables > 0 ? (
                      <Box bg="whiteAlpha.100" p={4} borderRadius="xl" w="full" borderWidth="1px" borderColor="whiteAlpha.200">
                        <Text fontSize="xs" fontWeight="700" color="brand.200" mb={3} textTransform="uppercase">
                          COMPOSITION DE LA MASSE DE CALCUL (art. 922 CC)
                        </Text>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                          <Box textAlign="center">
                            <Text fontSize="xs" color="whiteAlpha.700">Patrimoine net</Text>
                            <Text fontSize="md" fontWeight="700" color="white">
                              {patrimoineNet?.toLocaleString('fr-FR')}€
                            </Text>
                          </Box>
                          <Box textAlign="center">
                            <Text fontSize="xs" color="whiteAlpha.700">+ Donations rapportables</Text>
                            <Text fontSize="md" fontWeight="700" color="white">
                              {donationsRapportables.toLocaleString('fr-FR')}€
                            </Text>
                          </Box>
                          <Box textAlign="center">
                            <Text fontSize="xs" color="whiteAlpha.700">= Masse de calcul</Text>
                            <Text fontSize="xl" fontWeight="800" color="brand.300">
                              {calculRhQd.masseCalcul.toLocaleString('fr-FR')}€
                            </Text>
                          </Box>
                        </SimpleGrid>
                      </Box>
                    ) : null}

                    {/* Calculs réserve et quotité */}
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                      <Box bg="whiteAlpha.100" p={4} borderRadius="xl" textAlign="center" borderWidth="1px" borderColor="whiteAlpha.200">
                        <Text fontSize="xs" color="whiteAlpha.600" fontWeight="700" mb={1}>MASSE DE CALCUL</Text>
                        <Text fontSize="2xl" fontWeight="800" color="white">
                          {calculRhQd.masseCalcul.toLocaleString('fr-FR')}€
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.500" mt={1}>
                          {donationsRapportables ? 'Patrimoine + donations' : 'Patrimoine net'}
                        </Text>
                      </Box>
                      
                      <Box bg="whiteAlpha.100" p={4} borderRadius="xl" textAlign="center" borderWidth="1px" borderColor="whiteAlpha.200">
                        <Text fontSize="xs" color="whiteAlpha.600" fontWeight="700" mb={1}>RÉSERVE HÉRÉDITAIRE</Text>
                        <Text fontSize="2xl" fontWeight="800" color="white">
                          {calculRhQd.reserveHereditaire.toLocaleString('fr-FR')}€
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.500" mt={1}>
                          {!nombreEnfants || nombreEnfants === 0 ? 'Aucune réserve' : 
                            nombreEnfants === 1 ? '1/2 masse (1 enfant)' :
                            nombreEnfants === 2 ? '2/3 masse (2 enfants)' :
                            '3/4 masse (3+ enfants)'
                          }
                        </Text>
                      </Box>
                      
                      <Box bg="brand.900" p={4} borderRadius="xl" textAlign="center" borderWidth="1px" borderColor="brand.500" position="relative" overflow="hidden">
                        <Box position="absolute" top={0} left={0} w="full" h="2px" bg="brand.400" />
                        <Text fontSize="xs" color="brand.200" fontWeight="700" mb={1}>QUOTITÉ DISPONIBLE</Text>
                        <Text fontSize="2xl" fontWeight="900" color={calculRhQd.depassement ? "red.300" : "brand.100"}>
                          {calculRhQd.quotiteDisponible.toLocaleString('fr-FR')}€
                        </Text>
                        <Text fontSize="xs" color="brand.200" mt={1}>Pour legs librement</Text>
                      </Box>
                    </SimpleGrid>
                  </VStack>
                  
                  {calculRhQd.totalLegs > 0 && (
                    <Box p={5} bg="whiteAlpha.50" borderTopWidth="1px" borderColor="whiteAlpha.200">
                      <VStack spacing={3}>
                        <HStack justify="space-between" w="full">
                          <Text fontSize="sm" fontWeight="600" color="whiteAlpha.900">Utilisation de votre quotité disponible :</Text>
                          <Text fontSize="md" fontWeight="800" color={calculRhQd.depassement ? "red.300" : "green.300"}>
                            {calculRhQd.quotiteUtilisee}%
                          </Text>
                        </HStack>
                        <Progress 
                          value={calculRhQd.quotiteUtilisee} 
                          colorScheme={calculRhQd.depassement ? "red" : "green"} 
                          size="md" 
                          w="full"
                          borderRadius="full"
                          bg="whiteAlpha.200"
                        />
                        {calculRhQd.depassement && (
                          <Alert status="error" size="sm" borderRadius="xl" bg="red.900" color="red.100" borderWidth="1px" borderColor="red.700" mt={2}>
                            <AlertIcon color="red.300" />
                            <Text fontSize="xs">
                              Attention : Vos legs dépassent votre quotité disponible de {(calculRhQd.totalLegs - calculRhQd.quotiteDisponible).toLocaleString('fr-FR')}€
                            </Text>
                          </Alert>
                        )}
                      </VStack>
                    </Box>
                  )}
                </CardBody>
              </Card>
            )}

            {/* Aperçu fiscal (approx.) personnalisé */}
            {(() => {
              const showBaseHorsAV = apApercuFiscal.baseSuccessionHorsAV > 0;
              const showAVApres70 = apApercuFiscal.baseAVApres70Succession > 0;
              const showTotal = apApercuFiscal.baseTaxableApprox > 0 && (showBaseHorsAV || showAVApres70);
              const tiles: Array<{title: string; value: number; subtitle?: string}> = [];
              if (showBaseHorsAV) {
                tiles.push({
                  title: 'BASE SUCCESSION HORS AV',
                  value: apApercuFiscal.baseSuccessionHorsAV,
                  subtitle: apApercuFiscal.abatRP > 0 ? `RP −20% appliqué (${apApercuFiscal.abatRP.toLocaleString('fr-FR')}€)` : undefined,
                });
              }
              if (showAVApres70) {
                tiles.push({
                  title: 'AV APRÈS 70 ANS (ART. 757 B)',
                  value: apApercuFiscal.baseAVApres70Succession,
                  subtitle: `Primes ${apApercuFiscal.sumApres70.toLocaleString('fr-FR')}€ − abattement 30 000€`,
                });
              }
              if (showTotal) {
                tiles.push({
                  title: 'BASE TAXABLE TOTALE (APPROX.)',
                  value: apApercuFiscal.baseTaxableApprox,
                  subtitle: 'Avant abattements personnels et barèmes',
                });
              }
              const showInfoAvant70 = apApercuFiscal.sumAvant70 > 0;
              if (tiles.length === 0 && !showInfoAvant70) return null;
              return (
                <Card variant="solid" bg="teal.600" color="white" borderRadius="2xl" boxShadow="md" mt={2}>
                  <CardHeader borderBottomWidth="1px" borderColor="whiteAlpha.200" bg="blackAlpha.300">
                    <HStack>
                      <FiInfo size={20} color="var(--chakra-colors-teal-200)" />
                      <Heading size="sm">Aperçu fiscal (base taxable approximative)</Heading>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} w="full" align="stretch">
                      {tiles.length > 0 && (
                        <SimpleGrid columns={{ base: 1, md: tiles.length || 1 }} spacing={4} w="full">
                          {tiles.map((t, idx) => (
                            <Box key={idx} bg="whiteAlpha.200" p={5} borderRadius="xl" textAlign="center" borderWidth="1px" borderColor="whiteAlpha.300">
                              <Text fontSize="xs" color="whiteAlpha.700" fontWeight="700" mb={2}>{t.title}</Text>
                              <Text fontSize="2xl" fontWeight="800">
                                {t.value.toLocaleString('fr-FR')}€
                              </Text>
                              {t.subtitle && (
                                <Text fontSize="xs" color="whiteAlpha.600" mt={2}>{t.subtitle}</Text>
                              )}
                            </Box>
                          ))}
                        </SimpleGrid>
                      )}

                      {showInfoAvant70 && (
                        <Alert status="info" bg="whiteAlpha.200" borderRadius="xl" borderWidth="1px" borderColor="whiteAlpha.300" mt={2}>
                          <AlertIcon color="white" />
                          <Text fontSize="sm" color="whiteAlpha.900">
                            L'assurance‑vie versée <strong>avant 70 ans</strong> ({apApercuFiscal.sumAvant70.toLocaleString('fr-FR')}€) n'entre pas dans l'actif successoral civil et relève de l'article 990 I (abattement de 152 500€ par bénéficiaire).
                          </Text>
                        </Alert>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              );
            })()}

            {/* Pré-aperçu par héritier (abattements personnalisés) */}
            {(() => {
              const tiles: Array<{ label: string; subtitle?: string }> = [];
              const statutLower = (statut || '').toLowerCase();
              const hasChildren = (simulationData?.nombre_enfants || 0) > 0;
              
              // Conjoint ou partenaire PACS: exonération droits de succession
              if (statutLower === 'marié' || statutLower === 'marie' || statutLower === 'pacsé' || statutLower === 'pacse') {
                const tag = statutLower.startsWith('mari') ? 'Conjoint' : 'Partenaire PACS';
                tiles.push({
                  label: `${tag} — Exonération de droits de succession (CGI art. 796-0 bis)`,
                });
              }

              // Enfants: abattement 100 000€ chacun
              const enfants = Array.isArray(simulationData?.enfants) ? simulationData.enfants : [];
              if (hasChildren && enfants.length > 0) {
                enfants.forEach((e: any, idx: number) => {
                  const nom = e?.prenom ? e.prenom : `Enfant ${idx + 1}`;
                  tiles.push({
                    label: `${nom} — Abattement 100 000 €`,
                    subtitle: 'Ligne directe (CGI art. 779 I)',
                  });
                });
              }

              // Parents si pas d'enfants
              if (!hasChildren) {
                const pere = simulationData?.parents_defunt?.pere;
                const mere = simulationData?.parents_defunt?.mere;
                if (pere?.vivant) {
                  tiles.push({
                    label: `${pere?.prenom || 'Père'} — Abattement 100 000 €`,
                    subtitle: 'Ascendant (CGI art. 779 I)',
                  });
                }
                if (mere?.vivant) {
                  tiles.push({
                    label: `${mere?.prenom || 'Mère'} — Abattement 100 000 €`,
                    subtitle: 'Ascendant (CGI art. 779 I)',
                  });
                }
              }

              if (tiles.length === 0) return null;
              return (
                <Card variant="outline" borderColor="teal.200" borderRadius="2xl" boxShadow="sm" mt={2}>
                  <CardHeader bg="teal.50" borderBottomWidth="1px" borderColor="teal.100">
                    <HStack>
                      <FiUsers color="var(--chakra-colors-teal-600)" />
                      <Heading size="sm" color="teal.800">Pré‑aperçu par héritier (abattements)</Heading>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      {tiles.map((t, i) => (
                        <Box key={i} p={4} bg="white" borderRadius="xl" borderWidth="1px" borderColor="teal.100" boxShadow="sm">
                          <Text fontSize="md" fontWeight="700" color="teal.900">{t.label}</Text>
                          {t.subtitle && (
                            <Text fontSize="sm" color="teal.600" mt={1}>{t.subtitle}</Text>
                          )}
                        </Box>
                      ))}
                      <Text fontSize="xs" color="gray.500" mt={2}>
                        Note: abattements personnels cumulés et barèmes progressifs seront appliqués dans vos résultats détaillés.
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })()}

            {/* Liste des legs particuliers */}
            {presenceLegs && (
              <Box mt={4}>
                <HStack mb={6} justify="space-between" align="start" flexWrap="wrap" gap={4}>
                  <VStack align="start" spacing={1}>
                    <Heading size="sm" color="brand.700">Liste des legs</Heading>
                    <Text fontSize="sm" color="gray.600">
                      Détaillez chaque legs que vous souhaitez inclure dans votre testament
                    </Text>
                  </VStack>
                  {calculRhQd && (
                    <Card bg="brand.50" borderWidth="1px" borderColor="brand.200" borderRadius="xl" boxShadow="sm">
                      <CardBody px={4} py={3}>
                        <VStack spacing={1} align="start">
                          <Text fontSize="xs" color="brand.600" fontWeight="700">TOTAL DES LEGS</Text>
                          <Text fontSize="lg" color="brand.800" fontWeight="800">
                            {calculRhQd.totalLegs.toLocaleString('fr-FR')}€
                          </Text>
                          <Text fontSize="xs" color="brand.500" fontWeight="500">
                            sur {calculRhQd.quotiteDisponible.toLocaleString('fr-FR')}€ disponible
                          </Text>
                        </VStack>
                      </CardBody>
                    </Card>
                  )}
                </HStack>

                <VStack spacing={4}>
                  {fieldsLegs.map((field, index) => (
                    <Card key={field.id} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" w="full" boxShadow="sm" overflow="hidden">
                      <CardHeader bg="gray.50" borderBottomWidth="1px" borderColor="gray.100" px={5} py={3}>
                        <HStack justify="space-between" w="full">
                          <Badge colorScheme="brand" variant="subtle" fontSize="xs" px={2} py={1} borderRadius="md">
                            Legs {index + 1}
                          </Badge>
                          <IconButton
                            icon={<DeleteIcon boxSize={4} />}
                            aria-label="Supprimer ce legs"
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => removeLeg(index)}
                          />
                        </HStack>
                      </CardHeader>
                      <CardBody px={5} py={5}>
                        <VStack spacing={4} w="full">
                            {/* Sélection bénéficiaire */}
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                              <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                                  <FiUsers style={{ display: 'inline', marginRight: '4px' }} />
                                  Bénéficiaire (famille proche)
                                </FormLabel>
                                <Select
                                  {...register(`legs_particuliers.${index}.beneficiaire_id`)}
                                  bg="white"
                                  placeholder="Choisir dans ma famille..."
                                  size="md"
                                  borderRadius="md"
                                >
                                  <option value="">-- Autre personne --</option>
                                  {optionsBeneficiaires.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.nom} ({option.lien})
                                    </option>
                                  ))}
                                </Select>
                              </FormControl>

                              <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Nom du bénéficiaire</FormLabel>
                                <Input
                                  {...register(`legs_particuliers.${index}.beneficiaire_nom`)}
                                  placeholder="Ex: Association XYZ, Mon ami Pierre"
                                  bg="white"
                                  size="md"
                                  borderRadius="md"
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Prénom</FormLabel>
                                <Input
                                  {...register(`legs_particuliers.${index}.beneficiaire_prenom`)}
                                  placeholder="Prénom du bénéficiaire"
                                  bg="white"
                                  size="md"
                                  borderRadius="md"
                                />
                              </FormControl>

                              <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                                  Montant du legs
                                </FormLabel>
                                <NumberInput min={0} size="md">
                                  <NumberInputField
                                    {...register(`legs_particuliers.${index}.montant_legs`, { valueAsNumber: true })}
                                    placeholder="10000"
                                    bg="white"
                                    borderRadius="md"
                                  />
                                </NumberInput>
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                  Sera vérifié par rapport à la quotité disponible
                                </Text>
                              </FormControl>
                            </SimpleGrid>

                            {isCouple && (
                              <FormControl p={4} bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
                                <FormLabel fontSize="sm" fontWeight="700" color="gray.800" mb={3}>Testateur (qui rédige le legs ?)</FormLabel>
                                <RadioGroup
                                  value={watch(`legs_particuliers.${index}.proprietaire`) || 'MONSIEUR'}
                                  onChange={(val) => setValue(`legs_particuliers.${index}.proprietaire`, val as 'MONSIEUR' | 'MADAME', { shouldValidate: true })}
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
                                  En mode couple, précisez qui a rédigé le legs pour l'attribution correcte au décès.
                                </Text>
                              </FormControl>
                            )}

                            {/* Type et objet du legs */}
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                              <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Type juridique de legs</FormLabel>
                                <Select
                                  {...register(`legs_particuliers.${index}.type_legs`)}
                                  bg="white"
                                  size="md"
                                  borderRadius="md"
                                >
                                  <option value="legs_particulier">Legs particulier (somme/bien précis)</option>
                                  <option value="legs_universel">Legs universel (tout le patrimoine)</option>
                                  <option value="legs_titre_universel">Legs à titre universel (quote-part)</option>
                                  <option value="legs_usufruit">Legs d'usufruit</option>
                                  <option value="legs_nue_propriete">Legs de nue-propriété</option>
                                </Select>
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                  Le type détermine les modalités de transmission
                                </Text>
                              </FormControl>

                              <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Objet du legs</FormLabel>
                                <Select
                                  {...register(`legs_particuliers.${index}.objet_legs`)}
                                  bg="white"
                                  size="md"
                                  borderRadius="md"
                                >
                                  <option value="somme_argent">Somme d'argent</option>
                                  <option value="bien_immobilier">Bien immobilier</option>
                                  <option value="valeurs_mobilieres">Valeurs mobilières</option>
                                  <option value="bijoux">Bijoux/objets précieux</option>
                                  <option value="vehicule">Véhicule</option>
                                  <option value="autre">Autre bien</option>
                                </Select>
                              </FormControl>
                            </SimpleGrid>

                            {/* Condition et description */}
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                              <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Condition suspensive (optionnel)</FormLabel>
                                <Input
                                  {...register(`legs_particuliers.${index}.condition_legs`)}
                                  placeholder="Ex: Si bénéficiaire me survit"
                                  bg="white"
                                  size="md"
                                  borderRadius="md"
                                />
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                  Condition à remplir pour que le legs prenne effet
                                </Text>
                              </FormControl>

                              <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Description détaillée</FormLabel>
                                <Input
                                  {...register(`legs_particuliers.${index}.description`)}
                                  placeholder="Ex: Pour ses œuvres caritatives"
                                  bg="white"
                                  size="md"
                                  borderRadius="md"
                                />
                              </FormControl>
                            </SimpleGrid>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}

                    <Button
                      leftIcon={<AddIcon boxSize={4} />}
                      onClick={handleAddLeg}
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
                      <Text fontWeight="700" fontSize="md">Ajouter un legs</Text>
                    </Button>
                  </VStack>

                  {/* Avertissement légal */}
                  <Alert status="warning" borderRadius="xl" mt={6} borderWidth="1px" borderColor="orange.200" bg="orange.50">
                    <AlertIcon color="orange.500" />
                    <VStack align="start" spacing={2} flex="1">
                      <Text fontWeight="700" color="orange.800" fontSize="sm">
                        ⚖️ Important : Validité testamentaire
                      </Text>
                      <Text fontSize="sm" color="orange.700">
                        Cette simulation vous aide à planifier, mais vos legs doivent être formalisés dans un testament 
                        rédigé selon les règles légales (testament olographe, authentique ou mystique). 
                        Consultez un notaire pour la rédaction officielle.
                      </Text>
                    </VStack>
                  </Alert>
                </Box>
              )}

              {/* Navigation */}
              <HStack justifyContent="space-between" pt={6} mt={2} borderTop="1px solid" borderColor="gray.200">
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
                  Calculer la succession →
                </Button>
              </HStack>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </VStack>
  );
}
