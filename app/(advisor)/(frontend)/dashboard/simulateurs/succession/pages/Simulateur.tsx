import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, VStack, HStack, useToast, Box, Text, Heading, MotionContainer } from '../compat';
import { FiUser, FiHeart, FiUsers, FiHome, FiDollarSign, FiShield, FiFileText, FiGift } from 'react-icons/fi';
import { ModernWizardStep } from '../components/modern/ModernWizardStep';
import { ModernWizardProgress } from '../components/modern/ModernWizardProgress';
import { FormFieldCard } from '../components/FormFieldCard';
import { Step0Identite } from '../steps/Step0Identite';
import { Step1Situation } from '../steps/Step1Situation';
import { Step2Conjoint } from '../steps/Step2Conjoint';
import { Step3Enfants } from '../steps/Step3Enfants';
import { Step4Famille } from '../steps/Step4Famille2';
import { Step5Patrimoine } from '../steps/Step5Patrimoine';
import { Step6AssuranceVie } from '../steps/Step6AssuranceVie';
import { Step7Donations } from '../steps/Step7Donations';
import { Step7DDV } from '../steps/Step7DDV';
import { Step8Legs } from '../steps/Step8Legs';
import { useSuccessionStore } from '../store/successionStore';

type StepId = 'IDENTITE' | 'SITUATION' | 'CONJOINT' | 'ENFANTS' | 'FAMILLE' | 'PATRIMOINE' | 'ASSURANCE_VIE' | 'DDV' | 'DONATIONS' | 'LEGS';

interface StepDef { id: StepId; label: string; completed: boolean; }

export default function Simulateur() {
  const toast = useToast();
  const navigate = useNavigate();
  const { simulationData, updateSimulationData } = useSuccessionStore();

  const [index, setIndex] = useState(0);

  const visibleSteps: StepDef[] = useMemo(() => {
    const steps: StepDef[] = [];
    let stepCount = 0;
    
    steps.push({ id: 'IDENTITE', label: 'Identité', completed: index > stepCount++ });
    steps.push({ id: 'SITUATION', label: 'Situation', completed: index > stepCount++ });
    
    // Conjoint visible si on n'est pas célibataire
    const isCelib = (simulationData.statut_matrimonial || '').toLowerCase() === 'célibataire' || (simulationData.statut_matrimonial || '').toLowerCase() === 'celibataire';
    if (!isCelib) {
      steps.push({ id: 'CONJOINT', label: 'Conjoint', completed: index > stepCount++ });
    }
    
    steps.push({ id: 'ENFANTS', label: 'Enfants', completed: index > stepCount++ });
    
    // Famille (parents/fratrie) seulement si aucun enfant
    const nbEnfantsRaw = simulationData.nombre_enfants;
    const nbEnfants = typeof nbEnfantsRaw === 'number' ? nbEnfantsRaw : null;
    if (nbEnfants === 0) {
      steps.push({ id: 'FAMILLE', label: 'Famille', completed: index > stepCount++ });
    }
    
    steps.push({ id: 'PATRIMOINE', label: 'Patrimoine', completed: index > stepCount++ });
    steps.push({ id: 'ASSURANCE_VIE', label: 'Assurance‑vie', completed: index > stepCount++ });
    
    // DDV step visible uniquement pour les couples mariés
    const isMarie = (simulationData.statut_matrimonial || '').toLowerCase() === 'marié' || (simulationData.statut_matrimonial || '').toLowerCase() === 'marie';
    if (isMarie) {
      steps.push({ id: 'DDV', label: 'Dispositions (DDV)', completed: index > stepCount++ });
    }
    
    steps.push({ id: 'DONATIONS', label: 'Donations', completed: index > stepCount++ });
    steps.push({ id: 'LEGS', label: 'Legs', completed: index > stepCount++ });
    
    return steps;
  }, [index, simulationData.statut_matrimonial, simulationData.nombre_enfants]);

  // Stabiliser l'index si visibleSteps change (ajout/suppression d'étapes)
  useEffect(() => {
    if (index >= visibleSteps.length) {
      setIndex(Math.max(0, visibleSteps.length - 1));
    }
  }, [visibleSteps.length, index]);

  const step = visibleSteps[index]?.id;
  const percent = Math.round(((index + 1) / visibleSteps.length) * 100);

  const goNext = () => setIndex((i) => Math.min(i + 1, visibleSteps.length - 1));
  const goPrev = () => setIndex((i) => Math.max(i - 1, 0));

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'IDENTITE': return FiUser;
      case 'SITUATION': return FiHeart;
      case 'CONJOINT': return FiHeart;
      case 'ENFANTS': return FiUsers;
      case 'FAMILLE': return FiUsers;
      case 'PATRIMOINE': return FiDollarSign;
      case 'ASSURANCE_VIE': return FiShield;
      case 'DDV': return FiFileText;
      case 'DONATIONS': return FiGift;
      case 'LEGS': return FiFileText;
      default: return FiUser;
    }
  };

  const getStepTitle = (stepId: string) => {
    switch (stepId) {
      case 'IDENTITE': return 'Votre identité';
      case 'SITUATION': return 'Votre situation familiale';
      case 'CONJOINT': return 'Votre conjoint / partenaire';
      case 'ENFANTS': return 'Vos enfants';
      case 'FAMILLE': return 'Vos parents et votre fratrie';
      case 'PATRIMOINE': return 'Votre patrimoine';
      case 'ASSURANCE_VIE': return 'Vos assurances‑vie';
      case 'DDV': return 'Dispositions (DDV)';
      case 'DONATIONS': return 'Vos donations';
      case 'LEGS': return 'Vos legs testamentaires';
      default: return 'Étape';
    }
  };

  const getStepSubtitle = (stepId: string) => {
    switch (stepId) {
      case 'IDENTITE': return 'Nous avons besoin de votre nom, prénom, et âge pour personnaliser la simulation.';
      case 'SITUATION': return 'Marié(e), pacsé(e) ou célibataire : cela influe sur vos droits.';
      case 'CONJOINT': return 'Renseignez les informations utiles à la prise en compte du conjoint/partenaire.';
      case 'ENFANTS': return 'Vos enfants sont héritiers réservataires : indiquez leur nombre et leur âge.';
      case 'FAMILLE': return 'Sans enfant, vos parents et votre fratrie sont pris en compte.';
      case 'PATRIMOINE': return 'Évaluez votre patrimoine en vue détaillée (actifs et dettes).';
      case 'ASSURANCE_VIE': return 'Les assurances‑vie ont une fiscalité spécifique : précisez les montants.';
      case 'DDV': return 'Donation au Dernier Vivant (DDV) pour protéger le conjoint survivant.';
      case 'DONATIONS': return 'Indiquez vos donations antérieures avec leurs dates et bénéficiaires.';
      case 'LEGS': return 'Indiquez vos legs particuliers en respectant la quotité disponible.';
      default: return '';
    }
  };

  const finish = () => {
    const errors: string[] = [];

    // 1. Identité
    if (!simulationData.identite?.prenom || !simulationData.identite?.nom) {
      errors.push('Veuillez renseigner votre nom et prénom (étape Identité).');
    }
    if (!simulationData.identite?.age || simulationData.identite.age < 18) {
      errors.push('Veuillez renseigner un âge valide (≥ 18 ans).');
    }

    // 2. Situation matrimoniale
    if (!simulationData.statut_matrimonial) {
      errors.push('Veuillez indiquer votre statut matrimonial.');
    }

    // 3. Conjoint — requis pour marié/pacsé/concubinage
    const statut = (simulationData.statut_matrimonial || '').toLowerCase();
    const isCouple = statut.includes('mari') || statut.includes('pacs') || statut.includes('concubin');
    if (isCouple) {
      if (!simulationData.conjoint?.prenom) {
        errors.push('Veuillez renseigner le prénom du conjoint/partenaire.');
      }
      if (!simulationData.conjoint?.age || simulationData.conjoint.age <= 0) {
        errors.push("L'âge du conjoint/partenaire est requis pour les calculs d'usufruit et de protection.");
      }
      if (statut.includes('mari') && !simulationData.conjoint?.regimeMatrimonial) {
        errors.push('Veuillez indiquer le régime matrimonial.');
      }
    }

    // 4. Enfants
    if (simulationData.nombre_enfants === undefined || simulationData.nombre_enfants === null) {
      errors.push("Veuillez indiquer votre nombre d'enfants (0 si aucun).");
    }
    const enfantsArr = Array.isArray(simulationData.enfants) ? simulationData.enfants : [];
    if (simulationData.nombre_enfants > 0 && enfantsArr.length < simulationData.nombre_enfants) {
      errors.push(`Vous avez déclaré ${simulationData.nombre_enfants} enfant(s), mais seuls ${enfantsArr.length} sont renseignés.`);
    }
    enfantsArr.forEach((enfant: any, idx: number) => {
      if (enfant?.predecede) {
        const reps = Array.isArray(enfant.representants) ? enfant.representants.filter(Boolean) : [];
        if (reps.length === 0) {
          errors.push(`L'enfant n°${idx + 1} est prédécédé : ajoutez au moins un représentant (petit-enfant).`);
        }
      }
    });

    // 5. Patrimoine
    const totalActifs = (simulationData.actifs || []).reduce((sum: number, actif: any) => sum + (actif.valeur || 0), 0);
    if (totalActifs === 0 && !simulationData.patrimoine_net_total) {
      errors.push('Veuillez renseigner au moins un actif dans votre patrimoine.');
    }
    if (Array.isArray(simulationData.actifs) && simulationData.actifs.some((a: any) => (a?.valeur ?? 0) < 0)) {
      errors.push("La valeur d'un actif ne peut pas être négative.");
    }

    // 6. Assurance-vie
    if (simulationData.presence_assurance_vie && (!simulationData.contrats_av || simulationData.contrats_av.length === 0)) {
      errors.push("Vous avez indiqué posséder des contrats d'assurance-vie, mais aucun n'est renseigné.");
    }

    // Afficher les erreurs
    if (errors.length > 0) {
      errors.forEach((err, i) => {
        toast({
          title: i === 0 ? 'Vérification du dossier' : undefined,
          description: err,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
        });
      });
      return;
    }
    
    navigate('/resultats');
  };

  return (
    <Box w="100%">
      <Container maxW="7xl" py={4}>
        <HStack align="start" spacing={6} w="100%">
          {/* Progress sidebar - visible on desktop only */}
          <VStack
            w="280px"
            position="sticky"
            top="10px"
            display={{ base: 'none', lg: 'flex' }}
            flexShrink={0}
          >
            <ModernWizardProgress
              steps={visibleSteps}
              currentStep={index}
              progress={percent}
            />
          </VStack>

          {/* Main content */}
          <VStack flex="1" spacing={0} minW="0">

        {/* Étapes */}

        {step === 'IDENTITE' && (
          <ModernWizardStep
            title={getStepTitle('IDENTITE')}
            subtitle={getStepSubtitle('IDENTITE')}
            icon={getStepIcon('IDENTITE')}
            stepNumber={index + 1}
            totalSteps={visibleSteps.length}
            nextLabel="Suivant"
            previousLabel="← Retour"
            showPrevious={false}
            explanation="Ces informations permettent de personnaliser votre simulation successorale."
          >
              <Step0Identite
                defaultValues={{ 
                  nom: simulationData.identite?.nom || '',
                  prenom: simulationData.identite?.prenom || '', 
                  sexe: simulationData.identite?.sexe || 'M',
                  age: simulationData.identite?.age || 0,
                  revenusMensuels: simulationData.identite?.revenusMensuels || null
                }}
                onSubmit={(values: any) => { 
                  updateSimulationData({ 
                    identite: {
                      nom: values.nom, 
                      prenom: values.prenom, 
                      sexe: values.sexe,
                      age: values.age,
                      revenusMensuels: values.revenusMensuels
                    }
                  });
                  toast({ title: 'Identité enregistrée', status: 'success', duration: 1500 });
                  goNext(); 
                }}
              />
          </ModernWizardStep>
        )}

        {step === 'SITUATION' && (
          <ModernWizardStep
            title={getStepTitle('SITUATION')}
            subtitle={getStepSubtitle('SITUATION')}
            icon={getStepIcon('SITUATION')}
            stepNumber={index + 1}
            totalSteps={visibleSteps.length}
          >
              <Step1Situation
                defaultValues={{ statut_matrimonial: simulationData.statut_matrimonial as any, mode_couple: simulationData.mode_couple }}
                onBack={goPrev}
                onSubmit={(values: any) => { 
                  updateSimulationData({ statut_matrimonial: values.statut_matrimonial, mode_couple: !!values.mode_couple });
                  toast({ title: 'Statut enregistré', status: 'success', duration: 1500 });
                  goNext(); 
                }}
              />
          </ModernWizardStep>
        )}

        {step === 'CONJOINT' && (
          <ModernWizardStep
            title={getStepTitle('CONJOINT')}
            subtitle={getStepSubtitle('CONJOINT')}
            icon={getStepIcon('CONJOINT')}
            stepNumber={index + 1}
            totalSteps={visibleSteps.length}
          >
              <Step2Conjoint
                statut={simulationData.statut_matrimonial}
                defaultValues={{
                  sexe: simulationData.conjoint.sexe,
                  prenom: simulationData.conjoint.prenom,
                  nom: simulationData.conjoint.nom || '',
                  age: simulationData.conjoint.age ?? null,
                  regimeMatrimonial: simulationData.conjoint.regimeMatrimonial ?? null,
                  regimePACS: simulationData.conjoint.regimePACS ?? null,
                  clauseAttributionIntegrale: !!simulationData.conjoint.clauseAttributionIntegrale,
                  presenceDDV: !!simulationData.conjoint.presenceDDV,
                }}
                onBack={goPrev}
                onSubmit={(values: any) => { 
                  updateSimulationData({ conjoint: { ...simulationData.conjoint, ...values, present: true } }); 
                  toast({ title: 'Conjoint / partenaire enregistré', status: 'success', duration: 1500 });
                  goNext(); 
                }}
              />
          </ModernWizardStep>
        )}

        {step === 'ENFANTS' && (
          <ModernWizardStep
            title={getStepTitle('ENFANTS')}
            subtitle={getStepSubtitle('ENFANTS')}
            icon={getStepIcon('ENFANTS')}
            stepNumber={index + 1}
            totalSteps={visibleSteps.length}
          >
              <Step3Enfants
                hasPartner={!!simulationData.statut_matrimonial && simulationData.statut_matrimonial !== 'célibataire'}
                defaultValues={{ nombre_enfants: simulationData.nombre_enfants, enfants: simulationData.enfants as any }}
                onBack={goPrev}
                onSubmit={(values: any) => {
                  const enfantsArr = Array.isArray(values.enfants) ? values.enfants : [];
                  const allCommon = enfantsArr.length === 0 || enfantsArr.every((e: any) => e.communAvecConjoint !== false);
                  updateSimulationData({ nombre_enfants: values.nombre_enfants, enfants: values.enfants as any, enfants_tous_communs: allCommon }); 
                  toast({ title: 'Enfants enregistrés', status: 'success', duration: 1500 });
                  goNext(); 
                }}
              />
          </ModernWizardStep>
        )}

        {step === 'FAMILLE' && (
          <ModernWizardStep
            title={getStepTitle('FAMILLE')}
            subtitle={getStepSubtitle('FAMILLE')}
            icon={getStepIcon('FAMILLE')}
            stepNumber={index + 1}
            totalSteps={visibleSteps.length}
          >
              <Step4Famille
                defaultValues={{
                  parents_defunt: simulationData.parents_defunt as any,
                  fratrie_defunt: simulationData.fratrie_defunt as any,
                  parents_partenaire: simulationData.parents_partenaire as any,
                  fratrie_partenaire: simulationData.fratrie_partenaire as any,
                }}
                showPartenaireBlocks={simulationData.statut_matrimonial === 'marié' || simulationData.statut_matrimonial === 'pacsé' || simulationData.statut_matrimonial === 'concubinage'}
                onBack={goPrev}
                onSubmit={(values: any) => { 
                  updateSimulationData(values as any); 
                  toast({ title: 'Famille enregistrée', status: 'success', duration: 1500 });
                  goNext(); 
                }}
              />
          </ModernWizardStep>
        )}

        {step === 'PATRIMOINE' && (
          <ModernWizardStep
            title={getStepTitle('PATRIMOINE')}
            subtitle={getStepSubtitle('PATRIMOINE')}
            icon={getStepIcon('PATRIMOINE')}
            stepNumber={index + 1}
            totalSteps={visibleSteps.length}
          >
              <Step5Patrimoine
                defaultValues={{
                  mode_patrimoine: simulationData.mode_patrimoine,
                  patrimoine_net_total: simulationData.patrimoine_net_total,
                  presence_residence_principale: simulationData.presence_residence_principale,
                  valeur_residence_principale: simulationData.valeur_residence_principale,
                  residence_occupation_conjoint: simulationData.residence_occupation_conjoint,
                  residence_occupation_enfant_mineur: simulationData.residence_occupation_enfant_mineur,
                  actifs: simulationData.actifs as any,
                  dettes: (simulationData as any).dettes as any,
                  dettes_totales: simulationData.dettes_totales ?? 0,
                }}
                statut={simulationData.statut_matrimonial}
                prenomDefunt={simulationData.identite?.prenom}
                nomDefunt={simulationData.identite?.nom}
                prenomConjoint={simulationData.conjoint?.prenom}
                nomConjoint={simulationData.conjoint?.nom}
                onBack={goPrev}
                onSubmit={(values) => { 
                  updateSimulationData(values as any); 
                  const totalActifs = (values.actifs || []).reduce((sum: number, actif: any) => sum + (actif.valeur || 0), 0);
                  const patrimoine = Math.max(0, totalActifs - (values.dettes_totales || 0));
                  toast({ title: 'Patrimoine enregistré', description: `Montant estimé: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(patrimoine)}`, status: 'success', duration: 2000 });
                  goNext(); 
                }}
              />
          </ModernWizardStep>
        )}

        {step === 'ASSURANCE_VIE' && (
          <ModernWizardStep
            title={getStepTitle('ASSURANCE_VIE')}
            subtitle={getStepSubtitle('ASSURANCE_VIE')}
            icon={getStepIcon('ASSURANCE_VIE')}
            stepNumber={index + 1}
            totalSteps={visibleSteps.length}
          >
              <Step6AssuranceVie
                defaultValues={{
                  presence_assurance_vie: simulationData.presence_assurance_vie,
                  nombre_contrats_av: simulationData.nombre_contrats_av || 0,
                  contrats_av: simulationData.contrats_av as any,
                }}
                onBack={goPrev}
                onSubmit={(values) => { 
                  updateSimulationData(values as any); 
                  toast({ title: 'Assurance‑vie enregistrée', status: 'success', duration: 1500 });
                  goNext(); 
                }}
              />
          </ModernWizardStep>
        )}

        {step === 'DDV' && (
          <ModernWizardStep
            title={getStepTitle('DDV')}
            subtitle={getStepSubtitle('DDV')}
            icon={getStepIcon('DDV')}
            stepNumber={index + 1}
            totalSteps={visibleSteps.length}
          >
              <Step7DDV
                statut={simulationData.statut_matrimonial}
                defaultValues={{
                  presence_ddv: !!simulationData.presence_ddv,
                  option_ddv: (simulationData.option_ddv as any) ?? null,
                  age_conjoint_usufruit: simulationData.age_conjoint_usufruit ?? null,
                }}
                onBack={goPrev}
                onSubmit={(values) => {
                  updateSimulationData({
                    presence_ddv: !!values.presence_ddv,
                    option_ddv: values.option_ddv ?? null,
                    age_conjoint_usufruit: values.age_conjoint_usufruit ?? null,
                  });
                  toast({ title: 'DDV enregistrée', status: 'success', duration: 1500 });
                  goNext();
                }}
              />
          </ModernWizardStep>
        )}

        {step === 'DONATIONS' && (
          <ModernWizardStep
            title={getStepTitle('DONATIONS')}
            subtitle={getStepSubtitle('DONATIONS')}
            icon={getStepIcon('DONATIONS')}
            stepNumber={index + 1}
            totalSteps={visibleSteps.length}
            onPrevious={goPrev}
            nextLabel="Suivant"
            previousLabel="← Retour"
          >
            <Step7Donations
                defaultValues={{
                  presence_donations: !!simulationData.presence_donations,
                  date_deces: simulationData.date_deces || '',
                  donations: (Array.isArray(simulationData.donations) ? simulationData.donations : []).map((d: any) => ({
                    beneficiaire_id: '',
                    beneficiaire_nom: d.beneficiaireNom || '',
                    beneficiaire_prenom: '',
                    valeur_donation_origine: Number(d.valeur || 0),
                    valeur_donation_actuelle: Number(d.valeur || 0),
                    date_donation: d.dateActe || '',
                    lien_parente: (d.lien as any) || 'enfant',
                    type_donation: d.horsPart ? 'hors_part_successorale' : 'avance_part_successorale',
                    nature_bien: 'numeraire',
                    rapportable: !d.horsPart,
                    abattement_utilise: 0,
                    abattement_residuel: 0,
                    droits_payes: 0,
                    description: '',
                    proprietaire: d.proprietaire === 'CLIENT' ? 'MONSIEUR' : d.proprietaire === 'CONJOINT' ? 'MADAME' : undefined
                  }))
                }}
                onBack={goPrev}
                onSubmit={(values: any) => {
                  if (values.presence_donations && (!values.date_deces || values.date_deces === '')) {
                    toast({ status: 'error', description: 'Date du décès requise pour le rappel fiscal des donations (< 15 ans).', duration: 2500 });
                    return;
                  }
                  const resolveBenefNom = (d: any) => {
                    const id = d.beneficiaire_id;
                    if (id === 'conjoint') return simulationData.conjoint?.prenom || d.beneficiaire_nom;
                    const enfant = (simulationData.enfants || []).find((e: any) => e.id === id);
                    if (enfant) return enfant.prenom || d.beneficiaire_nom;
                    return d.beneficiaire_nom;
                  };
                  const mapped = (values.donations || []).map((d: any) => ({
                    type: d.type_donation === 'donation_partage' ? 'DONATION_PARTAGE' : (d.nature_bien === 'numeraire' ? 'DON_MANUEL' : 'DONATION_NOTARIEE'),
                    valeur: Number(d.valeur_donation_actuelle || 0),
                    horsPart: d.type_donation === 'hors_part_successorale' || !d.rapportable,
                    beneficiaireNom: resolveBenefNom(d),
                    dateActe: d.date_donation || null,
                    valeurPartage: Number(d.valeur_donation_actuelle || 0),
                    // lien en extra pour le calcul global (normaliseur Java le lira si présent)
                    lien: d.lien_parente,
                    proprietaire: d.proprietaire === 'MONSIEUR' ? 'CLIENT' : d.proprietaire === 'MADAME' ? 'CONJOINT' : undefined,
                  }));
                  updateSimulationData({ presence_donations: !!values.presence_donations, donations: mapped as any, date_deces: values.date_deces || null });
                  toast({ title: 'Donations enregistrées', status: 'success', duration: 1500 });
                  goNext();
                }}
                patrimoineNet={(() => {
                  const totalActifs = (simulationData.actifs || []).reduce((sum: number, actif: any) => sum + (actif.valeur || 0), 0);
                  const totalDettes = simulationData.dettes_totales || 0;
                  return Math.max(0, totalActifs - totalDettes);
                })()}
                nombreEnfants={simulationData.nombre_enfants || 0}
                isCouple={!!simulationData.conjoint?.present}
                donneesConjoint={{ prenom: simulationData.conjoint?.prenom || '', age: simulationData.conjoint?.age || undefined }}
                donneesEnfants={(simulationData.enfants || []).map((e: any) => ({ id: e.id, prenom: e.prenom, age: e.age }))}
                donneesFamille={{
                  parents: { pere: simulationData.parents_defunt?.pere, mere: simulationData.parents_defunt?.mere },
                  fratrie: simulationData.fratrie_defunt,
                }}
              />
          </ModernWizardStep>
        )}

        {step === 'LEGS' && (
          <ModernWizardStep
            title={getStepTitle('LEGS')}
            subtitle={getStepSubtitle('LEGS')}
            icon={getStepIcon('LEGS')}
            stepNumber={index + 1}
            totalSteps={visibleSteps.length}
          >
              <Step8Legs
                defaultValues={{
                  presence_legs_particuliers: !!simulationData.presence_legs_particuliers,
                  legs_particuliers: !!simulationData.presence_legs_particuliers
                    ? (Array.isArray(simulationData.legs_particuliers) ? simulationData.legs_particuliers : []).map((l: any) => ({
                        beneficiaire_id: '',
                        beneficiaire_nom: l.beneficiaireNom || '',
                        beneficiaire_prenom: '',
                        montant_legs: Number(l.valeur || 0),
                        type_legs: 'legs_particulier',
                        objet_legs: 'somme_argent',
                        quotite_utilisee: 0,
                        condition_legs: '',
                        description: '',
                        proprietaire: l.proprietaire === 'CLIENT' ? 'MONSIEUR' : l.proprietaire === 'CONJOINT' ? 'MADAME' : undefined
                      }))
                    : [],
                  testament_partenaire: !!simulationData.testament_partenaire,
                  type_legs_partenaire: simulationData.type_legs_partenaire as any,
                }}
                onBack={goPrev}
                onSubmit={(values: any) => {
                  const resolveBenefNom = (l: any) => {
                    const id = l.beneficiaire_id;
                    if (id === 'conjoint') return simulationData.conjoint?.prenom || l.beneficiaire_nom;
                    const enfant = (simulationData.enfants || []).find((e: any) => e.id === id);
                    if (enfant) return enfant.prenom || l.beneficiaire_nom;
                    return l.beneficiaire_nom;
                  };
                  const resolveLien = (l: any): string => {
                    const id = l.beneficiaire_id;
                    if (id === 'conjoint') return 'conjoint';
                    if (id === 'pere' || id === 'mere') return 'parent';
                    const enfant = (simulationData.enfants || []).find((e: any) => e.id === id);
                    if (enfant) return 'enfant';
                    const frere = (simulationData.fratrie_defunt || []).find((_: any, i: number) => `frere_${i}` === id);
                    if (frere) return 'frere_soeur';
                    return 'tiers';
                  };
                  const mappedLegs = (values.legs_particuliers || []).map((l: any) => ({
                    beneficiaireNom: resolveBenefNom(l),
                    valeur: Number(l.montant_legs || 0),
                    lien: resolveLien(l),
                    proprietaire: l.proprietaire === 'MONSIEUR' ? 'CLIENT' : l.proprietaire === 'MADAME' ? 'CONJOINT' : undefined,
                  }));
                  updateSimulationData({
                    presence_legs_particuliers: !!values.presence_legs_particuliers,
                    legs_particuliers: mappedLegs as any,
                    testament_partenaire: !!values.testament_partenaire,
                    type_legs_partenaire: values.type_legs_partenaire ?? null,
                  });
                  toast({ title: 'Legs enregistrés', status: 'success', duration: 1500 });
                  toast({ title: 'Simulation terminée', description: 'Découvrez vos résultats personnalisés.', status: 'success', duration: 2000 });
                  finish();
                }}
                patrimoineNet={(() => {
                  const totalActifs = (simulationData.actifs || []).reduce((sum: number, actif: any) => sum + (actif.valeur || 0), 0);
                  const totalDettes = simulationData.dettes_totales || 0;
                  return Math.max(0, totalActifs - totalDettes);
                })()}
                nombreEnfants={simulationData.nombre_enfants || 0}
                statut={simulationData.statut_matrimonial}
                isCouple={!!simulationData.conjoint?.present}
                donationsRapportables={(() => {
                  const dons = Array.isArray(simulationData.donations) ? simulationData.donations : [];
                  return dons.filter((d: any) => !d.horsPart).reduce((s: number, d: any) => s + Number(d.valeur || 0), 0);
                })()}
                donneesConjoint={{ prenom: simulationData.conjoint?.prenom || '', age: simulationData.conjoint?.age || undefined }}
                donneesEnfants={(simulationData.enfants || []).map((e: any) => ({ id: e.id, prenom: e.prenom, age: e.age }))}
                donneesFamille={{
                  parents: { pere: simulationData.parents_defunt?.pere, mere: simulationData.parents_defunt?.mere },
                  fratrie: simulationData.fratrie_defunt,
                }}
              />
          </ModernWizardStep>
        )}
          </VStack>
        </HStack>
      </Container>
    </Box>
  );
}
