import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Text,
  VStack,
  useToast,
} from '../compat';
import { useNavigate } from 'react-router-dom';
import { useSuccessionStore } from '../store/successionStore';

export default function ParametresConseiller() {
  const navigate = useNavigate();
  const toast = useToast();

  const advisorProfile = useSuccessionStore((s) => s.advisorProfile);
  const updateAdvisorProfile = useSuccessionStore((s) => s.updateAdvisorProfile);

  const initial = useMemo(
    () => ({
      prenom: advisorProfile?.prenom || '',
      nom: advisorProfile?.nom || '',
      cabinetNom: advisorProfile?.cabinetNom || '',
      email: advisorProfile?.email || '',
      telephone: advisorProfile?.telephone || '',
      siteWeb: advisorProfile?.siteWeb || '',
    }),
    [advisorProfile]
  );

  const [form, setForm] = useState(initial);

  const onChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const onSave = () => {
    updateAdvisorProfile({
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      cabinetNom: form.cabinetNom.trim(),
      email: form.email.trim(),
      telephone: form.telephone.trim(),
      siteWeb: form.siteWeb.trim(),
    });

    toast({
      title: 'Profil conseiller enregistré',
      status: 'success',
      duration: 2000,
      position: 'top',
      isClosable: true,
    });
  };

  const onReset = () => {
    setForm({ prenom: '', nom: '', cabinetNom: '', email: '', telephone: '', siteWeb: '' });
    updateAdvisorProfile({ prenom: '', nom: '', cabinetNom: '', email: '', telephone: '', siteWeb: '' });
    toast({
      title: 'Profil conseiller réinitialisé',
      status: 'info',
      duration: 2000,
      position: 'top',
      isClosable: true,
    });
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.md" py={10}>
        <VStack align="stretch" spacing={6}>
          <Box>
            <Heading size="lg">Paramètres conseiller</Heading>
            <Text mt={2} fontSize="sm" color="gray.600">
              Ces informations seront affichées en fin de rapport PDF (page “Votre conseiller”).
            </Text>
          </Box>

          <Box bg="white" borderRadius="xl" p={6} border="1px solid" borderColor="gray.200">
            <VStack align="stretch" spacing={4}>
              <HStack spacing={4} align="flex-start">
                <FormControl>
                  <FormLabel>Prénom</FormLabel>
                  <Input value={form.prenom} onChange={onChange('prenom')} placeholder="Ex : Jean" />
                </FormControl>
                <FormControl>
                  <FormLabel>Nom</FormLabel>
                  <Input value={form.nom} onChange={onChange('nom')} placeholder="Ex : Dupont" />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Nom du cabinet</FormLabel>
                <Input value={form.cabinetNom} onChange={onChange('cabinetNom')} placeholder="Ex : Cabinet ABC" />
              </FormControl>

              <HStack spacing={4} align="flex-start">
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input value={form.email} onChange={onChange('email')} placeholder="Ex : jean@cabinet.fr" />
                </FormControl>
                <FormControl>
                  <FormLabel>Téléphone</FormLabel>
                  <Input value={form.telephone} onChange={onChange('telephone')} placeholder="Ex : 06 00 00 00 00" />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Site web</FormLabel>
                <Input value={form.siteWeb} onChange={onChange('siteWeb')} placeholder="Ex : https://cabinet.fr" />
              </FormControl>

              <HStack justify="space-between" pt={2}>
                <Button variant="ghost" onClick={() => navigate(-1)}>
                  Retour
                </Button>
                <HStack>
                  <Button variant="outline" onClick={onReset}>
                    Réinitialiser
                  </Button>
                  <Button colorScheme="teal" onClick={onSave}>
                    Enregistrer
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
