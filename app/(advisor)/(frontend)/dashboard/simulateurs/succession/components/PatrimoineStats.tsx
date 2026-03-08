import React, { useMemo } from 'react';
import { Box, Stat, StatLabel, StatNumber, StatHelpText, SimpleGrid, Card, CardBody, Divider, HStack, Icon, Text, Badge } from '../compat';
import { FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';

interface Actif {
  id: string;
  categorie: string;
  valeur: number;
  dette_associee: boolean;
  montant_dette: number;
  quotite_defunt: number;
  quotite_conjoint: number;
}

interface PatrimoineStatsProps {
  actifs: Actif[];
  showDetails?: boolean;
}

export function PatrimoineStats({ actifs, showDetails = true }: PatrimoineStatsProps) {
  const stats = useMemo(() => {
    let totalActifsBrut = 0;
    let totalDettes = 0;
    let totalDefunt = 0;
    let totalConjoint = 0;
    const repartitionCategories: Record<string, number> = {};

    actifs.forEach(actif => {
      const valeurDefunt = actif.valeur * (actif.quotite_defunt / 100);
      const valeurConjoint = actif.valeur * (actif.quotite_conjoint / 100);
      const detteDefunt = actif.dette_associee ? actif.montant_dette * (actif.quotite_defunt / 100) : 0;
      const detteConjoint = actif.dette_associee ? actif.montant_dette * (actif.quotite_conjoint / 100) : 0;

      totalActifsBrut += actif.valeur;
      totalDettes += actif.montant_dette || 0;
      totalDefunt += valeurDefunt - detteDefunt;
      totalConjoint += valeurConjoint - detteConjoint;

      // Répartition par catégorie
      const cat = actif.categorie || 'AUTRE';
      repartitionCategories[cat] = (repartitionCategories[cat] || 0) + valeurDefunt;
    });

    const patrimoineNet = totalDefunt + totalConjoint;
    const tauxEndettement = totalActifsBrut > 0 ? (totalDettes / totalActifsBrut) * 100 : 0;

    return {
      totalActifsBrut,
      totalDettes,
      patrimoineNet,
      totalDefunt,
      totalConjoint,
      tauxEndettement,
      repartitionCategories,
    };
  }, [actifs]);

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getCategorieLabel = (cat: string): string => {
    const labels: Record<string, string> = {
      BIEN_COMMUN: 'Biens communs',
      BIEN_PROPRE: 'Biens propres',
      BIEN_PROPRE_MONSIEUR: 'Biens propres Monsieur',
      BIEN_PROPRE_MADAME: 'Biens propres Madame',
      BIEN_INDIVISION: 'Biens en indivision',
    };
    return labels[cat] || cat;
  };

  return (
    <Card bg="blue.50" borderColor="blue.200" borderWidth={2}>
      <CardBody>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          {/* Patrimoine Net Total */}
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">
              <HStack>
                <Icon as={FiDollarSign} />
                <Text>Patrimoine Net Total</Text>
              </HStack>
            </StatLabel>
            <StatNumber fontSize="2xl" color="blue.700">
              {formatEuro(stats.patrimoineNet)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Actifs brut: {formatEuro(stats.totalActifsBrut)}
            </StatHelpText>
          </Stat>

          {/* Part Défunt */}
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">
              <HStack>
                <Icon as={FiTrendingUp} />
                <Text>Part Défunt (Net)</Text>
              </HStack>
            </StatLabel>
            <StatNumber fontSize="2xl" color="green.600">
              {formatEuro(stats.totalDefunt)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Base imposable succession
            </StatHelpText>
          </Stat>

          {/* Dettes Totales */}
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">
              <HStack>
                <Icon as={FiTrendingDown} />
                <Text>Dettes Totales</Text>
              </HStack>
            </StatLabel>
            <StatNumber fontSize="2xl" color="red.600">
              {formatEuro(stats.totalDettes)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Taux d'endettement: {stats.tauxEndettement.toFixed(1)}%
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        {showDetails && stats.totalConjoint > 0 && (
          <>
            <Divider my={4} />
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>Part Conjoint (Net): {formatEuro(stats.totalConjoint)}</Text>
              <Text fontSize="xs" color="gray.600">Hors succession (patrimoine conjoint survivant)</Text>
            </Box>
          </>
        )}

        {showDetails && Object.keys(stats.repartitionCategories).length > 1 && (
          <>
            <Divider my={4} />
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>Répartition par catégorie (Part défunt):</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                {Object.entries(stats.repartitionCategories)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, val]) => (
                    <HStack key={cat} justify="space-between" fontSize="xs">
                      <Badge colorScheme="blue" fontSize="xs">{getCategorieLabel(cat)}</Badge>
                      <Text fontWeight="medium">{formatEuro(val)}</Text>
                    </HStack>
                  ))}
              </SimpleGrid>
            </Box>
          </>
        )}

        {stats.tauxEndettement > 50 && (
          <Box mt={4} p={3} bg="orange.100" borderRadius="md">
            <Text fontSize="xs" color="orange.800">
              ⚠️ Attention: Taux d'endettement élevé ({stats.tauxEndettement.toFixed(1)}%). 
              Vérifiez la cohérence des dettes et valeurs des actifs.
            </Text>
          </Box>
        )}
      </CardBody>
    </Card>
  );
}
