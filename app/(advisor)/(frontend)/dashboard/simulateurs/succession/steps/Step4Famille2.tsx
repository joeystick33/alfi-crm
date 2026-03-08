import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box, Button, Card, CardBody, CardHeader, FormControl, FormLabel, Heading, HStack, Input,
  NumberInput, NumberInputField, Select, Switch, Text, IconButton, VStack, Badge, SimpleGrid,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Icon
} from '../compat';
// import { step4FamilleSchema } from '../validation/schemas';
import { AddIcon, DeleteIcon } from '../compat';
import { FiUsers, FiHeart, FiInfo } from 'react-icons/fi';

// Validation temporairement désactivée pour MVP
export type Step4FamilleValues = any; // z.infer<typeof step4FamilleSchema>;

export function Step4Famille({
  defaultValues,
  onSubmit,
  onBack,
  showPartenaireBlocks,
}: {
  defaultValues: Step4FamilleValues;
  onSubmit: (values: Step4FamilleValues) => void;
  onBack: () => void;
  showPartenaireBlocks?: boolean;
}) {
  const { register, handleSubmit, control, watch } = useForm<Step4FamilleValues>({
    // resolver: zodResolver(...), // Validation temporairement désactivée
    defaultValues,
  });

  const pereVivant = watch('parents_defunt.pere.vivant');
  const mereVivante = watch('parents_defunt.mere.vivant');
  const fratrieValues = watch('fratrie_defunt');
  const fratriePartenaireValues = watch('fratrie_partenaire' as any);

  const { fields: fratrieDef, append: appendFratrie, remove: removeFratrie } = useFieldArray({ control, name: 'fratrie_defunt' });
  const { fields: fratriePart, append: appendFratriePart, remove: removeFratriePart } = useFieldArray({ control, name: 'fratrie_partenaire' as any });

  return (
    <VStack spacing={6} maxW="800px" mx="auto" align="stretch">
      <Box p={6} bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
        <HStack spacing={3} align="start">
          <Box p={3} bg="blue.50" borderRadius="xl" color="blue.600">
            <FiUsers size={24} />
          </Box>
          <VStack align="start" spacing={1}>
            <Heading size="md" color="gray.900">
              Votre famille
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Ces informations déterminent l'ordre des héritiers légaux et les parts de succession (parents et fratrie).
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
                <Text fontSize="sm" fontWeight="700" color="brand.800">
                  Pourquoi ces informations sont-elles importantes ?
                </Text>
              </HStack>
              <AccordionIcon color="brand.500" />
            </AccordionButton>
          </h3>
          <AccordionPanel px={4} py={4}>
            <VStack align="stretch" spacing={2}>
              <Text fontSize="sm" color="brand.800">• Sans enfant, parents et fratrie deviennent héritiers légaux</Text>
              <Text fontSize="sm" color="brand.800">• L'âge influe sur les abattements et les stratégies d'optimisation</Text>
              <Text fontSize="sm" color="brand.800">• Ces données permettent un calcul précis des droits de succession</Text>
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Card w="full" variant="outline" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm" overflow="hidden">
        <CardHeader bg="gray.50" py={4} px={6} borderBottom="1px solid" borderColor="gray.200">
          <Heading size="sm" color="gray.800">5. Ascendants et Collatéraux</Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Renseignez les informations sur vos parents et frères/sœurs.
          </Text>
        </CardHeader>
        <CardBody px={6} py={6}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={6} align="stretch">
              <Box p={4} bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
                <HStack mb={3} spacing={2}>
                  <FiHeart color="#1A365D" size={20} />
                  <Heading size="sm" color="gray.800">Vos parents</Heading>
                </HStack>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Indiquez si vos parents sont vivants. Ils bénéficient chacun d'un abattement de 100 000 €.
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Card bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" boxShadow="sm">
                    <CardBody px={4} py={4}>
                      <VStack spacing={4} align="stretch">
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <FormLabel mb="0" fontWeight="700" color="gray.800" fontSize="sm">
                            Mon père est vivant
                          </FormLabel>
                          <Controller
                            name="parents_defunt.pere.vivant"
                            control={control}
                            render={({ field }) => (
                              <Switch
                                isChecked={!!field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                size="sm"
                                colorScheme="brand"
                              />
                            )}
                          />
                        </FormControl>
                        {pereVivant && (
                          <VStack spacing={3} w="full">
                            <FormControl>
                              <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Prénom de mon père</FormLabel>
                              <Input
                                {...register('parents_defunt.pere.prenom')}
                                placeholder="Ex: Pierre"
                                bg="white"
                                size="md"
                                borderRadius="md"
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Âge actuel</FormLabel>
                              <NumberInput min={0} size="md">
                                <NumberInputField
                                  {...register('parents_defunt.pere.age', { valueAsNumber: true })}
                                  placeholder="75"
                                  bg="white"
                                  borderRadius="md"
                                />
                              </NumberInput>
                            </FormControl>
                          </VStack>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" boxShadow="sm">
                    <CardBody px={4} py={4}>
                      <VStack spacing={4} align="stretch">
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <FormLabel mb="0" fontWeight="700" color="gray.800" fontSize="sm">
                            👩 Ma mère est vivante
                          </FormLabel>
                          <Controller
                            name="parents_defunt.mere.vivant"
                            control={control}
                            render={({ field }) => (
                              <Switch
                                isChecked={!!field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                size="md"
                                colorScheme="brand"
                              />
                            )}
                          />
                        </FormControl>
                        {mereVivante && (
                          <VStack spacing={3} w="full">
                            <FormControl>
                              <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Prénom de ma mère</FormLabel>
                              <Input
                                {...register('parents_defunt.mere.prenom')}
                                placeholder="Ex: Marie"
                                bg="white"
                                size="md"
                                borderRadius="md"
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Âge actuel</FormLabel>
                              <NumberInput min={0} size="md">
                                <NumberInputField
                                  {...register('parents_defunt.mere.age', { valueAsNumber: true })}
                                  placeholder="72"
                                  bg="white"
                                  borderRadius="md"
                                />
                              </NumberInput>
                            </FormControl>
                          </VStack>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </Box>

              <Box p={4} bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
                <HStack mb={3} spacing={2}>
                  <FiUsers color="#1A365D" size={20} />
                  <Heading size="sm" color="gray.800">Vos frères et sœurs</Heading>
                </HStack>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Ajoutez vos frères et sœurs. Ils bénéficient chacun d'un abattement de 15 932 €.
                </Text>
                <VStack spacing={4} align="stretch">
                  {fratrieDef.map((field, index) => {
                    const vivant = fratrieValues?.[index]?.vivant !== false;
                    return (
                      <Card
                        key={field.id}
                        bg="white"
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="xl"
                        boxShadow="sm"
                      >
                        <CardBody px={5} py={5}>
                          <VStack spacing={4} align="stretch">
                            <HStack justifyContent="space-between">
                              <HStack spacing={3}>
                                <Badge colorScheme="brand" variant="subtle" fontSize="xs" px={2} py={1} borderRadius="md">
                                  Frère/Sœur {index + 1}
                                </Badge>
                                {!vivant && (
                                  <Badge colorScheme="gray" variant="solid" fontSize="xs" px={2} py={1} borderRadius="md">
                                    Décédé(e)
                                  </Badge>
                                )}
                              </HStack>
                              <IconButton
                                aria-label="Supprimer ce frère/sœur"
                                icon={<DeleteIcon boxSize={4} />}
                                onClick={() => removeFratrie(index)}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                              />
                            </HStack>

                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                              <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Prénom</FormLabel>
                                <Input
                                  {...register(`fratrie_defunt.${index}.prenom`)}
                                  placeholder="Ex: Sophie"
                                  bg="white"
                                  size="md"
                                  borderRadius="md"
                                />
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Âge</FormLabel>
                                <NumberInput min={0} size="md">
                                  <NumberInputField
                                    {...register(`fratrie_defunt.${index}.age`, { valueAsNumber: true })}
                                    placeholder="45"
                                    bg="white"
                                    borderRadius="md"
                                  />
                                </NumberInput>
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Lien</FormLabel>
                                <Select {...register(`fratrie_defunt.${index}.lien`)} size="md" bg="white" borderRadius="md">
                                  <option value="FRERE">Frère / sœur (ordre 2)</option>
                                  <option value="GRANDPARENT">Grand-parent (ordre 3)</option>
                                  <option value="ONCLE_TANTE">Oncle / tante / cousin (ordre 4)</option>
                                </Select>
                              </FormControl>
                              <FormControl display="flex" alignItems="center" justifyContent="flex-start" mt={2}>
                                <VStack spacing={2} align="start">
                                  <FormLabel mb="0" fontSize="sm" fontWeight="600" color="gray.700">Vivant(e) ?</FormLabel>
                                  <Controller
                                    name={`fratrie_defunt.${index}.vivant`}
                                    control={control}
                                    render={({ field }) => (
                                      <Switch
                                        isChecked={!!field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                        colorScheme="brand"
                                        size="md"
                                      />
                                    )}
                                  />
                                </VStack>
                              </FormControl>
                            </SimpleGrid>

                            {!vivant && (
                              <Accordion allowToggle border="1px solid" borderColor="brand.300" borderRadius="md">
                                <AccordionItem>
                                  <AccordionButton px={3} py={2} _expanded={{ bg: 'brand.100' }}>
                                    <HStack flex="1" spacing={2}>
                                      <Badge colorScheme="blue" fontSize="2xs">Représentation</Badge>
                                      <Text fontSize="xs" fontWeight="600">Ajouter les descendants</Text>
                                    </HStack>
                                    <AccordionIcon />
                                  </AccordionButton>
                                  <AccordionPanel px={3} py={3}>
                                    <Text fontSize="2xs" color="gray.600" mb={2}>
                                      Les descendants héritent à la place du défunt.
                                    </Text>
                                    <FratrieRepresentants
                                      control={control}
                                      name={`fratrie_defunt.${index}.representants`}
                                      register={register as any}
                                    />
                                  </AccordionPanel>
                                </AccordionItem>
                              </Accordion>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })}

                  <Button
                    leftIcon={<AddIcon boxSize={4} />}
                    onClick={() => appendFratrie({ prenom: '', age: null, vivant: true, representants: [], lien: 'FRERE' } as any)}
                    colorScheme="brand"
                    variant="outline"
                    size="md"
                    borderRadius="xl"
                  >
                    Ajouter un proche
                  </Button>
                </VStack>
              </Box>

              {showPartenaireBlocks && (
                <Box p={4} bg="orange.50" borderRadius="xl" borderWidth="1px" borderColor="orange.200">
                  <HStack mb={3} spacing={2}>
                    <FiHeart color="orange" size={20} />
                    <Heading size="sm" color="orange.800">Famille de votre Partenaire</Heading>
                  </HStack>
                  <Text fontSize="sm" color="orange.700" mb={4}>
                    Informations sur la famille de votre conjoint(e) ou partenaire PACS.
                  </Text>

                  <VStack spacing={3} align="stretch">
                    <Card bg="orange.50" borderWidth="1px" borderColor="orange.200" borderRadius="md">
                      <CardBody px={3} py={3}>
                        <VStack spacing={3} align="stretch">
                          <Heading size="xs" color="orange.700">Parents du partenaire</Heading>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                            <FormControl>
                              <FormLabel fontSize="xs" color="gray.600">Prénom du père</FormLabel>
                              <Input
                                {...register('parents_partenaire.pere.prenom' as any)}
                                placeholder="Ex: Jean"
                                bg="white"
                                size="sm"
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="xs" color="gray.600">Âge du père</FormLabel>
                              <NumberInput min={0} size="sm">
                                <NumberInputField
                                  {...register('parents_partenaire.pere.age' as any, { valueAsNumber: true })}
                                  placeholder="70"
                                  bg="white"
                                />
                              </NumberInput>
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="xs" color="gray.600">Prénom de la mère</FormLabel>
                              <Input
                                {...register('parents_partenaire.mere.prenom' as any)}
                                placeholder="Ex: Jeanne"
                                bg="white"
                                size="sm"
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="xs" color="gray.600">Âge de la mère</FormLabel>
                              <NumberInput min={0} size="sm">
                                <NumberInputField
                                  {...register('parents_partenaire.mere.age' as any, { valueAsNumber: true })}
                                  placeholder="68"
                                  bg="white"
                                />
                              </NumberInput>
                            </FormControl>
                          </SimpleGrid>
                        </VStack>
                      </CardBody>
                    </Card>

                    <VStack spacing={3} align="stretch">
                      <Heading size="xs" color="orange.700">Frères et sœurs du partenaire</Heading>
                      {fratriePart.map((field, index) => {
                        const vivantPart = fratriePartenaireValues?.[index]?.vivant !== false;
                        return (
                          <Card
                            key={field.id}
                            bg="orange.50"
                            borderWidth="1px"
                            borderColor="orange.200"
                            borderRadius="md"
                          >
                            <CardBody px={3} py={3}>
                              <VStack spacing={3} align="stretch">
                                <HStack justifyContent="space-between">
                                  <Badge colorScheme="orange" variant="subtle" fontSize="2xs">
                                    Frère/Sœur partenaire {index + 1}
                                  </Badge>
                                  <IconButton
                                    aria-label="Supprimer"
                                    icon={<DeleteIcon boxSize={3} />}
                                    onClick={() => removeFratriePart(index)}
                                    size="xs"
                                    variant="ghost"
                                  />
                                </HStack>
                                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                                  <FormControl>
                                    <FormLabel fontSize="xs" color="gray.600">Prénom</FormLabel>
                                    <Input
                                      {...register(`fratrie_partenaire.${index}.prenom` as any)}
                                      placeholder="Ex: Paul"
                                      bg="white"
                                      size="sm"
                                    />
                                  </FormControl>
                                  <FormControl>
                                    <FormLabel fontSize="xs" color="gray.600">Âge</FormLabel>
                                    <NumberInput min={0} size="sm">
                                      <NumberInputField
                                        {...register(`fratrie_partenaire.${index}.age` as any, { valueAsNumber: true })}
                                        placeholder="42"
                                        bg="white"
                                      />
                                    </NumberInput>
                                  </FormControl>
                                  <FormControl>
                                    <FormLabel fontSize="xs" color="gray.600">Lien</FormLabel>
                                    <Select {...register(`fratrie_partenaire.${index}.lien` as any)} size="sm" bg="white">
                                      <option value="FRERE">Frère / sœur (ordre 2)</option>
                                      <option value="GRANDPARENT">Grand-parent (ordre 3)</option>
                                      <option value="ONCLE_TANTE">Oncle / tante / cousin (ordre 4)</option>
                                    </Select>
                                  </FormControl>
                                  <FormControl display="flex" alignItems="center" justifyContent="center">
                                    <VStack spacing={1}>
                                      <FormLabel mb="0" fontSize="xs" color="gray.600">Vivant(e) ?</FormLabel>
                                      <Controller
                                        name={`fratrie_partenaire.${index}.vivant` as any}
                                        control={control}
                                        render={({ field }) => (
                                          <Switch
                                            isChecked={!!field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            colorScheme="orange"
                                            size="sm"
                                          />
                                        )}
                                      />
                                    </VStack>
                                  </FormControl>
                                </SimpleGrid>
                                {!vivantPart && (
                                  <Accordion allowToggle border="1px solid" borderColor="orange.300" borderRadius="md">
                                    <AccordionItem>
                                      <AccordionButton px={3} py={2} _expanded={{ bg: 'orange.100' }}>
                                        <HStack flex="1" spacing={2}>
                                          <Badge colorScheme="orange" fontSize="2xs">Représentation</Badge>
                                          <Text fontSize="xs" fontWeight="600">Ajouter les descendants</Text>
                                        </HStack>
                                        <AccordionIcon />
                                      </AccordionButton>
                                      <AccordionPanel px={3} py={3}>
                                        <FratrieRepresentants
                                          control={control}
                                          name={`fratrie_partenaire.${index}.representants`}
                                          register={register as any}
                                        />
                                      </AccordionPanel>
                                    </AccordionItem>
                                  </Accordion>
                                )}
                              </VStack>
                            </CardBody>
                          </Card>
                        );
                      })}
                      <Button
                        leftIcon={<AddIcon boxSize={3} />}
                        onClick={() => appendFratriePart({ prenom: '', age: null, vivant: true, lien: 'FRERE' } as any)}
                        colorScheme="orange"
                        variant="outline"
                        size="sm"
                      >
                        ➕ Ajouter un proche du partenaire
                      </Button>
                    </VStack>
                  </VStack>
                </Box>
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
                  Continuer vers le patrimoine →
                </Button>
              </HStack>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </VStack>
  );
}

function FratrieRepresentants({ control, name, register }: { control: any; name: string; register: any }) {
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <Box mt={1} p={3} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
      <VStack spacing={2} align="stretch">
        <HStack justifyContent="space-between">
          <VStack align="start" spacing={0}>
            <Text fontWeight="600" color="gray.700" fontSize="xs">
              👶 Descendants (représentation)
            </Text>
            <Text fontSize="2xs" color="gray.500">
              Enfants/petits-enfants héritant à la place du défunt
            </Text>
          </VStack>
          <Button
            size="xs"
            leftIcon={<AddIcon boxSize={2.5} />}
            onClick={() => append({ prenom: '', age: null } as any)}
            colorScheme="gray"
            variant="outline"
          >
            Ajouter
          </Button>
        </HStack>

        <VStack spacing={2} align="stretch">
          {fields.map((item, idx) => (
            <Card key={item.id} borderWidth="1px" borderColor="gray.200" borderRadius="md">
              <CardBody px={3} py={2}>
                <HStack spacing={3} align="start">
                  <Badge colorScheme="gray" variant="subtle" fontSize="2xs">
                    Descendant {idx + 1}
                  </Badge>
                  <FormControl flex="2">
                    <FormLabel fontSize="2xs" color="gray.600">Prénom</FormLabel>
                    <Input
                      {...register(`${name}.${idx}.prenom`)}
                      placeholder="Ex: Lucas"
                      bg="white"
                      size="sm"
                    />
                  </FormControl>
                  <FormControl flex="1">
                    <FormLabel fontSize="2xs" color="gray.600">Âge</FormLabel>
                    <NumberInput min={0} size="sm">
                      <NumberInputField
                        {...register(`${name}.${idx}.age`, { valueAsNumber: true })}
                        placeholder="25"
                        bg="white"
                      />
                    </NumberInput>
                  </FormControl>
                  <IconButton
                    aria-label="Supprimer ce descendant"
                    icon={<DeleteIcon boxSize={3} />}
                    onClick={() => remove(idx)}
                    size="xs"
                    variant="ghost"
                  />
                </HStack>
              </CardBody>
            </Card>
          ))}

          {fields.length === 0 && (
            <Text fontSize="xs" color="gray.500" textAlign="center" py={2}>
              Aucun descendant ajouté pour le moment
            </Text>
          )}
        </VStack>
      </VStack>
    </Box>
  );
}
