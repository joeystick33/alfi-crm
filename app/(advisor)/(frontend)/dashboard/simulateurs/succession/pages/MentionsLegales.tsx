'use client'

import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  HStack,
  Divider,
} from '../compat';
import { useNavigate } from 'react-router-dom';

export default function MentionsLegales() {
  const navigate = useNavigate();

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading size="lg">Mentions légales</Heading>
          <Button size="sm" variant="outline" onClick={() => navigate(-1)}>
            Retour
          </Button>
        </HStack>

        <Divider />

        <Box>
          <Heading size="md" mb={3}>Objet du simulateur</Heading>
          <Text fontSize="sm" color="neutral.600" lineHeight="tall">
            Ce simulateur de succession a pour objet de fournir une estimation indicative
            des droits de succession et de la répartition du patrimoine entre héritiers,
            sur la base des informations saisies par l'utilisateur et de la législation
            fiscale en vigueur.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={3}>Limitation de responsabilité</Heading>
          <Text fontSize="sm" color="neutral.600" lineHeight="tall">
            Les résultats fournis par ce simulateur ont un caractère purement informatif
            et pédagogique. Ils ne constituent en aucun cas un acte juridique, un conseil
            fiscal personnalisé, ni une recommandation d'investissement. Les montants
            indiqués sont des estimations qui peuvent différer des montants réels.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={3}>Données personnelles</Heading>
          <Text fontSize="sm" color="neutral.600" lineHeight="tall">
            Les données saisies dans ce simulateur sont traitées localement dans votre
            navigateur et sur les serveurs sécurisés de la plateforme. Elles ne sont
            partagées avec aucun tiers. Conformément au RGPD, vous disposez d'un droit
            d'accès, de rectification et de suppression de vos données.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={3}>Base légale des calculs</Heading>
          <Text fontSize="sm" color="neutral.600" lineHeight="tall">
            Les calculs sont effectués sur la base du Code Général des Impôts (CGI),
            notamment les articles 777, 779, 788, 790 B, 790 D, 790 G, 990 I et 757 B,
            ainsi que le barème de l'article 669 pour le démembrement de propriété.
            Les barèmes et abattements utilisés sont ceux en vigueur au 1er janvier 2025.
          </Text>
        </Box>

        <Box>
          <Heading size="md" mb={3}>Recommandation</Heading>
          <Text fontSize="sm" color="neutral.600" lineHeight="tall">
            Pour toute mise en œuvre des stratégies identifiées par ce simulateur,
            il est impératif de consulter un notaire ou un conseiller en gestion de
            patrimoine habilité. Les auteurs déclinent toute responsabilité en cas
            d'utilisation de ce simulateur sans accompagnement professionnel.
          </Text>
        </Box>

        <Divider />

        <Text fontSize="xs" color="neutral.400" textAlign="center">
          © {new Date().getFullYear()} — Simulateur de succession — Tous droits réservés
        </Text>
      </VStack>
    </Container>
  );
}
