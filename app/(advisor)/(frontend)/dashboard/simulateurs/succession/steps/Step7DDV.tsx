import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
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
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  NumberInput,
  NumberInputField,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Text,
  VStack,
  Icon,
} from '../compat';
import { FiUsers, FiInfo } from 'react-icons/fi';

// Local schema focusing only on DDV fields with strict validation
const ddvSchema = z.object({
  presence_ddv: z.boolean().default(false),
  option_ddv: z
    .union([
      z.literal('TOTALITE_USUFRUIT'),
      z.literal('QUOTITE_DISPONIBLE_PP'),
      z.literal('QUART_PP_TROIS_QUARTS_USUFRUIT'),
      z.literal('QUART_PP'),
      z.null(),
    ])
    .default(null),
  age_conjoint_usufruit: z.union([z.number().int().min(18).max(120), z.null()]).default(null),
}).superRefine((val, ctx) => {
  if (val.presence_ddv) {
    if (!val.option_ddv) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Choix DDV requis', path: ['option_ddv'] });
    }
    const usufruitOptions = ['TOTALITE_USUFRUIT', 'QUART_PP_TROIS_QUARTS_USUFRUIT'] as const;
    if (val.option_ddv && (usufruitOptions as readonly string[]).includes(val.option_ddv)) {
      if (typeof val.age_conjoint_usufruit !== 'number') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Âge du conjoint requis pour une option avec usufruit', path: ['age_conjoint_usufruit'] });
      }
    }
  }
});

export type Step7DDVValues = z.infer<typeof ddvSchema>;

export function Step7DDV({
  defaultValues,
  onSubmit,
  onBack,
  statut,
}: {
  defaultValues: Step7DDVValues;
  onSubmit: (values: Step7DDVValues) => void;
  onBack: () => void;
  statut: 'marié' | 'pacsé' | 'concubinage' | 'célibataire' | null;
}) {
  const { handleSubmit, register, setValue, watch, formState: { errors } } = useForm<Step7DDVValues>({
    resolver: zodResolver(ddvSchema) as any,
    defaultValues,
  });

  const presenceDDV = watch('presence_ddv');
  const optionDDV = watch('option_ddv');

  return (
    <VStack spacing={6} align="stretch" maxW="800px" mx="auto">
      <Box p={6} bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
        <HStack spacing={3} align="start">
          <Box p={3} bg="brand.50" borderRadius="xl" color="brand.600">
            <Icon as={FiUsers} boxSize={6} />
          </Box>
          <VStack align="start" spacing={1}>
            <Heading size="md" color="gray.900">
              Donation au Dernier Vivant (DDV)
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Activez la DDV si vous êtes mariés pour personnaliser le partage en cas de décès.
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
                  Pourquoi préparer une Donation au Dernier Vivant ?
                </Text>
              </HStack>
              <AccordionIcon color="brand.500" />
            </AccordionButton>
          </h3>
          <AccordionPanel px={4} py={4}>
            <VStack align="stretch" spacing={4}>
              <HStack align="start" spacing={3}>
                <Text fontSize="xl">🛡️</Text>
                <Box flex={1}>
                  <Text fontWeight="700" color="gray.900" fontSize="sm">Protection du conjoint</Text>
                  <Text fontSize="sm" color="gray.600">
                    La DDV permet d'offrir au conjoint survivant des droits supérieurs à ceux prévus par défaut.
                  </Text>
                </Box>
              </HStack>
              <HStack align="start" spacing={3}>
                <Text fontSize="xl">📜</Text>
                <Box flex={1}>
                  <Text fontWeight="700" color="gray.900" fontSize="sm">Flexibilité juridique</Text>
                  <Text fontSize="sm" color="gray.600">
                    Plusieurs options (usufruit, pleine propriété) ajustent la part transmise selon les objectifs.
                  </Text>
                </Box>
              </HStack>
              <HStack align="start" spacing={3}>
                <Text fontSize="xl">⚖️</Text>
                <Box flex={1}>
                  <Text fontWeight="700" color="gray.900" fontSize="sm">Impact fiscal</Text>
                  <Text fontSize="sm" color="gray.600">
                    Le choix influence les droits de succession dus par les enfants et la disponibilité du patrimoine.
                  </Text>
                </Box>
              </HStack>
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Card bg="gray.50" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
        <CardBody px={6} py={6}>
          <Heading size="sm" color="gray.800" mb={4}>
            DDV : quelles options envisager ?
          </Heading>
          <Stack spacing={3} fontSize="sm" color="gray.700">
            <Text>• <strong>Totalité en usufruit</strong> : le conjoint garde l'usage de tout le patrimoine.</Text>
            <Text>• <strong>Quotité disponible en pleine propriété</strong> : maximise la part dont le conjoint dispose librement.</Text>
            <Text>• <strong>1/4 PP + 3/4 usufruit</strong> : équilibre entre usufruit et propriété directe.</Text>
            <Text>• <strong>1/4 PP</strong> : laisse davantage de pleine propriété immédiate aux enfants.</Text>
          </Stack>
        </CardBody>
      </Card>

      <Card w="full" variant="outline" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm" overflow="hidden">
        <CardHeader bg="gray.50" py={4} px={6} borderBottom="1px solid" borderColor="gray.200">
          <Heading size="sm" color="gray.800">7. Protection du conjoint</Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Choisissez d'activer ou non la DDV et son option.
          </Text>
        </CardHeader>
        <CardBody px={6} py={6}>
          <form onSubmit={handleSubmit(onSubmit as any)}>
            <VStack spacing={6} align="stretch">
              {statut !== 'marié' && (
                <Alert status="info" borderRadius="xl" fontSize="sm" bg="blue.50" borderWidth="1px" borderColor="blue.200">
                  <AlertIcon />
                  La DDV est réservée aux couples mariés. Vous pouvez passer à l'étape suivante.
                </Alert>
              )}

              <FormControl display="flex" alignItems="center" justifyContent="space-between" bg="blue.50" borderRadius="xl" borderWidth="1px" borderColor="blue.200" px={4} py={4}>
                <Box>
                  <FormLabel mb={0} fontSize="md" fontWeight="700" color="blue.900">
                    Activer une DDV
                  </FormLabel>
                  <Text fontSize="xs" color="blue.700" mt={1}>
                    Disponible uniquement pour les couples mariés.
                  </Text>
                </Box>
                <Switch
                  {...register('presence_ddv')}
                  size="md"
                  colorScheme="brand"
                  isDisabled={statut !== 'marié'}
                />
              </FormControl>

              {presenceDDV && statut === 'marié' && (
                <VStack align="stretch" spacing={5}>
                  <FormControl isRequired isInvalid={!!errors.option_ddv} aria-invalid={!!errors.option_ddv} aria-describedby={errors.option_ddv ? 'ddv-option-error' : undefined}>
                    <FormLabel fontSize="sm" fontWeight="700" color="gray.800" mb={3}>
                      Choix de l'option DDV
                    </FormLabel>
                    <RadioGroup
                      value={optionDDV ?? ''}
                      onChange={(val) => setValue('option_ddv', (val || null) as any, { shouldValidate: true })}
                    >
                      <VStack align="stretch" spacing={3}>
                        <Card variant="outline" p={3} borderRadius="xl" borderWidth="1px" borderColor={optionDDV === 'TOTALITE_USUFRUIT' ? 'brand.500' : 'gray.200'} bg={optionDDV === 'TOTALITE_USUFRUIT' ? 'brand.50' : 'white'} cursor="pointer" onClick={() => setValue('option_ddv', 'TOTALITE_USUFRUIT', { shouldValidate: true })}>
                          <Radio value="TOTALITE_USUFRUIT" size="md" colorScheme="brand">
                            <Box ml={2}>
                              <Text fontSize="sm" fontWeight="700">Totalité en usufruit</Text>
                              <Text fontSize="xs" color="gray.600">Le conjoint conserve l'usage complet du patrimoine.</Text>
                            </Box>
                          </Radio>
                        </Card>
                        <Card variant="outline" p={3} borderRadius="xl" borderWidth="1px" borderColor={optionDDV === 'QUOTITE_DISPONIBLE_PP' ? 'brand.500' : 'gray.200'} bg={optionDDV === 'QUOTITE_DISPONIBLE_PP' ? 'brand.50' : 'white'} cursor="pointer" onClick={() => setValue('option_ddv', 'QUOTITE_DISPONIBLE_PP', { shouldValidate: true })}>
                          <Radio value="QUOTITE_DISPONIBLE_PP" size="md" colorScheme="brand">
                            <Box ml={2}>
                              <Text fontSize="sm" fontWeight="700">Quotité disponible en pleine propriété</Text>
                              <Text fontSize="xs" color="gray.600">Il reçoit la part librement transmissible en pleine propriété.</Text>
                            </Box>
                          </Radio>
                        </Card>
                        <Card variant="outline" p={3} borderRadius="xl" borderWidth="1px" borderColor={optionDDV === 'QUART_PP_TROIS_QUARTS_USUFRUIT' ? 'brand.500' : 'gray.200'} bg={optionDDV === 'QUART_PP_TROIS_QUARTS_USUFRUIT' ? 'brand.50' : 'white'} cursor="pointer" onClick={() => setValue('option_ddv', 'QUART_PP_TROIS_QUARTS_USUFRUIT', { shouldValidate: true })}>
                          <Radio value="QUART_PP_TROIS_QUARTS_USUFRUIT" size="md" colorScheme="brand">
                            <Box ml={2}>
                              <Text fontSize="sm" fontWeight="700">1/4 PP + 3/4 usufruit</Text>
                              <Text fontSize="xs" color="gray.600">Mixte pour préserver conjoint et enfants.</Text>
                            </Box>
                          </Radio>
                        </Card>
                        <Card variant="outline" p={3} borderRadius="xl" borderWidth="1px" borderColor={optionDDV === 'QUART_PP' ? 'brand.500' : 'gray.200'} bg={optionDDV === 'QUART_PP' ? 'brand.50' : 'white'} cursor="pointer" onClick={() => setValue('option_ddv', 'QUART_PP', { shouldValidate: true })}>
                          <Radio value="QUART_PP" size="md" colorScheme="brand">
                            <Box ml={2}>
                              <Text fontSize="sm" fontWeight="700">1/4 en pleine propriété</Text>
                              <Text fontSize="xs" color="gray.600">Option plus favorable aux enfants.</Text>
                            </Box>
                          </Radio>
                        </Card>
                      </VStack>
                    </RadioGroup>
                    {errors.option_ddv && (
                      <Text id="ddv-option-error" fontSize="sm" color="red.500" mt={2} fontWeight="600">{String(errors.option_ddv.message)}</Text>
                    )}
                  </FormControl>

                  {(optionDDV === 'TOTALITE_USUFRUIT' || optionDDV === 'QUART_PP_TROIS_QUARTS_USUFRUIT') && (
                    <FormControl isRequired p={4} bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
                      <FormLabel fontSize="sm" fontWeight="700" color="gray.800">Âge du conjoint (barème usufruit)</FormLabel>
                      <NumberInput min={18} max={120} size="md" maxW="200px">
                        <NumberInputField {...register('age_conjoint_usufruit', { valueAsNumber: true })} placeholder="Ex : 72" bg="white" borderRadius="md" />
                      </NumberInput>
                      {errors.age_conjoint_usufruit && (
                        <Text fontSize="sm" color="red.500" mt={2} fontWeight="600">{String(errors.age_conjoint_usufruit.message)}</Text>
                      )}
                    </FormControl>
                  )}

                  <Alert status="info" borderRadius="xl" fontSize="sm" bg="gray.50" borderWidth="1px" borderColor="gray.200">
                    <AlertIcon />
                    <HStack align="start" spacing={2}>
                      <FiInfo color="#2D3748" size={16} />
                      <Text fontSize="sm" color="gray.700">
                        Libellés officiels : Totalité en usufruit, Quotité disponible (PP), 1/4 PP + 3/4 usufruit, 1/4 PP. Ils s'appuient sur les articles 913 et 1094 du Code civil.
                      </Text>
                    </HStack>
                  </Alert>
                </VStack>
              )}

              <HStack justifyContent="space-between" pt={4} mt={4} borderTop="1px solid" borderColor="gray.200">
                <Button variant="outline" onClick={onBack} size="md" borderRadius="xl">
                  ← Précédent
                </Button>
                <Button type="submit" colorScheme="brand" size="md" borderRadius="xl" px={8}>
                  Continuer vers les donations →
                </Button>
              </HStack>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </VStack>
  );
}
