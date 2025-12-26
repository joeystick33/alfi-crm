# Implementation Plan: Refonte Section Conformité CGP

## Overview

Ce plan d'implémentation couvre la refonte complète de la section Conformité du CRM pour CGP. L'implémentation est organisée en phases progressives, chaque phase construisant sur la précédente. Le langage utilisé est TypeScript avec Next.js 14+, Prisma et PostgreSQL.

## Tasks

- [x] 1. Configuration et Infrastructure de Base
  - [x] 1.1 Créer les nouveaux modèles Prisma pour la conformité
    - Ajouter les enums: AlertType, AlertSeverity, TimelineEventType, AffaireStatus, etc.
    - Ajouter les modèles: ComplianceAlert, ComplianceTimelineEvent
    - Ajouter les index pour les performances
    - _Requirements: 1.1, 3.1-3.6, 8.1-8.2, 11.1-11.5_

  - [x] 1.2 Créer les modèles Prisma pour les opérations
    - Ajouter les modèles: AffaireNouvelle, AffaireStatusHistory
    - Ajouter les modèles: OperationGestion, OperationStatusHistory
    - Ajouter les modèles: Provider, Product
    - _Requirements: 18.1-18.6, 19.1-19.7, 21.1-21.7, 24.1-24.6_

  - [x] 1.3 Créer les modèles Prisma pour les documents
    - Ajouter les modèles: DocumentTemplate, GeneratedDocument
    - Ajouter les enums: RegulatoryDocumentType, AssociationType, DocumentFormat
    - _Requirements: 14.1-14.10, 16.1-16.8, 17.1-17.7_

  - [x] 1.4 Exécuter la migration Prisma et vérifier le schéma
    - Générer la migration
    - Appliquer la migration
    - Vérifier les relations et index
    - _Requirements: 8.3-8.4_


- [x] 2. Types et Schémas de Validation
  - [x] 2.1 Créer les types TypeScript pour la conformité
    - Créer `lib/compliance/types.ts` avec tous les types KYC, Alert, Control, Reclamation
    - Utiliser `unknown` au lieu de `any`, discriminated unions
    - Exporter les constantes (DOCUMENT_EXPIRATION_RULES, SLA_DEADLINES, etc.)
    - _Requirements: 2.1, 2.6, 3.1-3.3, 4.1, 4.4, 5.1, 5.3_

  - [x] 2.2 Write property test for document expiration calculation
    - **Property 1: Document Expiration Calculation**
    - **Validates: Requirements 2.6**

  - [x] 2.3 Write property test for risk level calculation
    - **Property 4: Risk Level Calculation**
    - **Validates: Requirements 4.4**

  - [x] 2.4 Write property test for SLA deadline calculation
    - **Property 5: SLA Deadline Calculation**
    - **Validates: Requirements 5.3**

  - [x] 2.5 Créer les types TypeScript pour les opérations
    - Créer `lib/operations/types.ts` avec AffaireNouvelle, OperationGestion, Provider, Product
    - Utiliser discriminated unions pour AffaireProductDetails et OperationGestionDetails
    - _Requirements: 18.2-18.4, 19.2-19.5, 21.1-21.6_

  - [x] 2.6 Créer les types TypeScript pour les documents
    - Créer `lib/documents/types.ts` avec DocumentTemplate, GeneratedDocument, DocumentRequirements
    - Définir les requirements par type d'opération
    - _Requirements: 14.1, 19.1-19.4, 22.1-22.4_

  - [x] 2.7 Créer les schémas Zod de validation
    - Créer `lib/compliance/schemas.ts` pour validation des inputs
    - Créer `lib/operations/schemas.ts`
    - Créer `lib/documents/schemas.ts`
    - _Requirements: 8.3_

- [x] 3. Checkpoint - Vérifier types et schémas
  - Ensure all tests pass, ask the user if questions arise.


- [x] 4. Services Core Conformité
  - [x] 4.1 Créer le service de gestion des documents KYC
    - Créer `lib/compliance/services/document-service.ts`
    - Implémenter: createDocument, validateDocument, rejectDocument, getDocumentsByClient
    - Implémenter le calcul automatique des dates d'expiration
    - Implémenter la mise à jour automatique du statut EXPIRE
    - _Requirements: 2.2-2.6_

  - [x] 4.2 Write property test for document status transitions
    - **Property 2: Document Status Transitions**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

  - [x] 4.3 Write property test for rejection requires reason
    - **Property 20: Rejection Requires Reason**
    - **Validates: Requirements 2.4**

  - [x] 4.4 Créer le service d'alertes
    - Créer `lib/compliance/services/alert-service.ts`
    - Implémenter: createAlert, acknowledgeAlert, resolveAlert, getAlertsByClient
    - Implémenter la génération automatique d'alertes pour documents expirants
    - _Requirements: 3.1-3.6_

  - [x] 4.5 Write property test for alert severity assignment
    - **Property 3: Alert Severity Assignment**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 4.6 Créer le service de contrôles ACPR
    - Créer `lib/compliance/services/control-service.ts`
    - Implémenter: createControl, completeControl, getControlsByClient
    - Implémenter le calcul automatique du risk level
    - Implémenter la détection des contrôles en retard
    - _Requirements: 4.1-4.7_

  - [x] 4.7 Write property test for control overdue detection
    - **Property 18: Control Overdue Detection**
    - **Validates: Requirements 4.5**

  - [x] 4.8 Créer le service de réclamations
    - Créer `lib/compliance/services/reclamation-service.ts`
    - Implémenter: createReclamation, updateStatus, resolveReclamation
    - Implémenter la génération de référence unique (REC-YYYY-NNNN)
    - Implémenter le calcul SLA et la détection de breach
    - _Requirements: 5.1-5.8_

  - [ ]* 4.9 Write property test for reclamation status workflow
    - **Property 8: Reclamation Status Workflow**
    - **Validates: Requirements 5.4**

  - [ ]* 4.10 Write property test for SLA breach detection
    - **Property 6: SLA Breach Detection**
    - **Validates: Requirements 5.5**

  - [ ]* 4.11 Write property test for resolution requires response
    - **Property 19: Resolution Requires Response**
    - **Validates: Requirements 5.6**

  - [x] 4.12 Créer le service de timeline
    - Créer `lib/compliance/services/timeline-service.ts`
    - Implémenter: addEvent, getTimelineByClient, exportTimelinePDF
    - _Requirements: 11.1-11.5_

  - [ ]* 4.13 Write property test for audit log completeness
    - **Property 11: Audit Log Completeness**
    - **Validates: Requirements 8.1, 8.2**

- [x] 5. Checkpoint - Vérifier services conformité
  - Ensure all tests pass, ask the user if questions arise.


- [x] 6. Services Opérations
  - [x] 6.1 Créer le service Affaires Nouvelles
    - Créer `lib/operations/services/affaire-service.ts`
    - Implémenter: createAffaire, updateStatus, getAffairesByClient, getAffairesEnCours
    - Implémenter la génération de référence unique (AN-YYYY-NNNN)
    - Implémenter la validation des transitions de statut
    - _Requirements: 18.1-18.6, 19.1-19.7_

  - [ ]* 6.2 Write property test for affaire status workflow
    - **Property 9: Affaire Status Workflow**
    - **Validates: Requirements 19.1**

  - [ ]* 6.3 Write property test for reference number format
    - **Property 7: Reference Number Format**
    - **Validates: Requirements 5.2, 18.2**

  - [x] 6.4 Créer le service Opérations de Gestion
    - Créer `lib/operations/services/operation-gestion-service.ts`
    - Implémenter: createOperation, updateStatus, getOperationsByContract
    - Implémenter la génération de référence unique (OG-YYYY-NNNN)
    - Implémenter les détails spécifiques par type (arbitrage, rachat, versement)
    - _Requirements: 21.1-21.7_

  - [ ]* 6.5 Write property test for operation gestion status workflow
    - **Property 10: Operation Gestion Status Workflow**
    - **Validates: Requirements 21.3**

  - [x] 6.6 Créer le service de vérification conformité
    - Créer `lib/operations/services/compliance-check-service.ts`
    - Implémenter: checkClientCompliance, getComplianceIssues
    - Vérifier KYC, MiFID, LCB-FT
    - _Requirements: 18.6, 25.1-25.7_

  - [ ]* 6.7 Write property test for compliance check accuracy
    - **Property 13: Compliance Check Accuracy**
    - **Validates: Requirements 18.6, 25.1**

  - [x] 6.8 Créer le service de blocage opérations
    - Créer `lib/operations/services/operation-blocking-service.ts`
    - Implémenter: checkOperationBlocking, getBlockingReasons
    - Implémenter la logique de blocage basée sur documents manquants
    - _Requirements: 22.5-22.8_

  - [ ]* 6.9 Write property test for operation blocking rules
    - **Property 14: Operation Blocking Rules**
    - **Validates: Requirements 22.6**

  - [x] 6.10 Créer le service de catégorisation "En Cours"
    - Créer `lib/operations/services/affaire-en-cours-service.ts`
    - Implémenter: categorizeAffairesEnCours, getInactiveAffaires
    - _Requirements: 20.1-20.5_

  - [ ]* 6.11 Write property test for affaire en cours categorization
    - **Property 15: Affaire "En Cours" Categorization**
    - **Validates: Requirements 20.1**

  - [x] 6.12 Créer le service Provider/Catalogue
    - Créer `lib/operations/services/provider-service.ts`
    - Implémenter: getProviders, getProductsByProvider, addProvider
    - _Requirements: 24.1-24.6_

- [x] 7. Checkpoint - Vérifier services opérations
  - Ensure all tests pass, ask the user if questions arise.


- [x] 8. Services Documents et Génération
  - [x] 8.1 Créer le service de templates
    - Créer `lib/documents/services/template-service.ts`
    - Implémenter: getTemplates, getTemplateByType, createTemplate
    - Supporter les templates par association (CNCGP, ANACOFI, CNCEF)
    - _Requirements: 17.1-17.7_

  - [x] 8.2 Créer le service de génération de documents
    - Créer `lib/documents/services/document-generator-service.ts`
    - Implémenter: generateDocument, previewDocument
    - Supporter tous les types: DER, Lettre de Mission, Recueil, etc.
    - Pré-remplir avec les données client
    - _Requirements: 14.1-14.10_

  - [x] 8.3 Créer le service d'export PDF/DOCX
    - Créer `lib/documents/services/export-service.ts`
    - Implémenter: exportToPDF, exportToDOCX, batchExport
    - Appliquer le branding cabinet
    - _Requirements: 16.1-16.8_

  - [x] 8.4 Créer le service de requirements documents
    - Créer `lib/documents/services/document-requirements-service.ts`
    - Implémenter: getRequiredDocuments, checkDocumentStatus
    - Logique conditionnelle par type d'opération
    - _Requirements: 22.1-22.4_

  - [x] 8.5 Créer le service MiFID
    - Créer `lib/compliance/services/mifid-service.ts`
    - Implémenter: startQuestionnaire, saveAnswers, calculateProfile
    - Calculer risk profile et investment horizon
    - _Requirements: 9.1-9.7_

  - [ ]* 8.6 Write property test for MiFID profile calculation
    - **Property 16: MiFID Profile Calculation**
    - **Validates: Requirements 9.3, 9.4**

- [x] 9. Checkpoint - Vérifier services documents
  - Ensure all tests pass, ask the user if questions arise.


- [x] 10. API Routes
  - [x] 10.1 Créer les routes API conformité
    - Créer `app/api/v1/compliance/documents/route.ts` (GET, POST)
    - Créer `app/api/v1/compliance/documents/[id]/route.ts` (GET, PATCH, DELETE)
    - Créer `app/api/v1/compliance/documents/[id]/validate/route.ts` (POST)
    - Créer `app/api/v1/compliance/documents/[id]/reject/route.ts` (POST)
    - _Requirements: 2.2-2.8_

  - [x] 10.2 Créer les routes API alertes
    - Créer `app/api/v1/compliance/alerts/route.ts` (GET, POST)
    - Créer `app/api/v1/compliance/alerts/[id]/acknowledge/route.ts` (POST)
    - _Requirements: 3.4-3.6_

  - [x] 10.3 Créer les routes API contrôles
    - Créer `app/api/v1/compliance/controls/route.ts` (GET, POST)
    - Créer `app/api/v1/compliance/controls/[id]/route.ts` (GET, PATCH)
    - Créer `app/api/v1/compliance/controls/[id]/complete/route.ts` (POST)
    - _Requirements: 4.2-4.7_

  - [x] 10.4 Créer les routes API réclamations
    - Créer `app/api/v1/compliance/reclamations/route.ts` (GET, POST)
    - Créer `app/api/v1/compliance/reclamations/[id]/route.ts` (GET, PATCH)
    - Créer `app/api/v1/compliance/reclamations/[id]/resolve/route.ts` (POST)
    - _Requirements: 5.2-5.8_

  - [x] 10.5 Créer les routes API timeline
    - Créer `app/api/v1/compliance/timeline/route.ts` (GET)
    - Créer `app/api/v1/compliance/timeline/export/route.ts` (GET - PDF)
    - _Requirements: 11.1-11.5_

  - [x] 10.6 Créer les routes API opérations
    - Créer `app/api/v1/operations/affaires/route.ts` (GET, POST)
    - Créer `app/api/v1/operations/affaires/[id]/route.ts` (GET, PATCH)
    - Créer `app/api/v1/operations/affaires/[id]/status/route.ts` (PATCH)
    - Créer `app/api/v1/operations/affaires/en-cours/route.ts` (GET)
    - _Requirements: 18.1-18.6, 19.1-19.7, 20.1-20.5_

  - [x] 10.7 Créer les routes API opérations de gestion
    - Créer `app/api/v1/operations/gestion/route.ts` (GET, POST)
    - Créer `app/api/v1/operations/gestion/[id]/route.ts` (GET, PATCH)
    - _Requirements: 21.1-21.7_

  - [x] 10.8 Créer les routes API providers
    - Créer `app/api/v1/operations/providers/route.ts` (GET, POST)
    - Créer `app/api/v1/operations/providers/[id]/products/route.ts` (GET, POST)
    - _Requirements: 24.1-24.6_

  - [x] 10.9 Créer les routes API documents
    - Créer `app/api/v1/documents/generate/route.ts` (POST)
    - Créer `app/api/v1/documents/export/route.ts` (POST)
    - Créer `app/api/v1/documents/templates/route.ts` (GET, POST)
    - _Requirements: 14.6-14.10, 16.1-16.8_

- [x] 11. Checkpoint - Vérifier API routes
  - Ensure all tests pass, ask the user if questions arise.


- [x] 12. Hooks React Query
  - [x] 12.1 Créer les hooks conformité
    - Créer `app/_common/hooks/api/use-compliance-api.ts`
    - Implémenter: useKYCDocuments, useAlerts, useControls, useReclamations
    - Implémenter les mutations: useValidateDocument, useRejectDocument, etc.
    - _Requirements: 2.7-2.8, 3.5, 4.6-4.7, 5.7-5.8_

  - [x] 12.2 Créer les hooks opérations
    - Créer `app/_common/hooks/api/use-operations-api.ts`
    - Implémenter: useAffaires, useAffairesEnCours, useOperationsGestion
    - Implémenter les mutations: useCreateAffaire, useUpdateAffaireStatus, etc.
    - _Requirements: 18.7, 19.6, 20.2-20.4, 21.7_

  - [x] 12.3 Créer les hooks documents
    - Créer `app/_common/hooks/api/use-documents-api.ts`
    - Implémenter: useTemplates, useGeneratedDocuments
    - Implémenter les mutations: useGenerateDocument, useExportDocument
    - _Requirements: 14.7-14.10, 16.6-16.7_

  - [x] 12.4 Créer les hooks providers
    - Créer `app/_common/hooks/api/use-providers-api.ts`
    - Implémenter: useProviders, useProducts
    - _Requirements: 24.3-24.5_

  - [x] 12.5 Créer les hooks KPIs et pilotage
    - Créer `app/_common/hooks/api/use-pilotage-api.ts`
    - Implémenter: useComplianceKPIs, usePipelineStats, useOperationStats
    - _Requirements: 1.4, 23.1-23.5_

  - [ ]* 12.6 Write property test for KPI calculation accuracy
    - **Property 17: KPI Calculation Accuracy**
    - **Validates: Requirements 1.4**

- [x] 13. Checkpoint - Vérifier hooks
  - Ensure all tests pass, ask the user if questions arise.


- [x] 14. Composants UI Conformité
  - [x] 14.1 Créer le Dashboard Conformité
    - Créer `app/(advisor)/(frontend)/dashboard/conformite/page.tsx`
    - Afficher les KPIs avec cartes cliquables
    - Afficher la section "Expiring Soon" avec countdown
    - Afficher le banner d'alertes critiques
    - Utiliser skeleton loaders pendant le chargement
    - _Requirements: 1.1-1.5, 6.2-6.3_

  - [x] 14.2 Créer la page Documents KYC
    - Créer `app/(advisor)/(frontend)/dashboard/conformite/documents/page.tsx`
    - Table triable avec colonnes: Client, Type, Status, Upload date, Expiration, Actions
    - Filtres dropdown (pas de select natifs): status, type, client, date range
    - Empty state avec message et actions suggérées
    - _Requirements: 2.7-2.8, 6.1-6.2_

  - [x] 14.3 Créer les composants de gestion documents
    - Créer composant DocumentUploadDialog
    - Créer composant DocumentValidationDialog
    - Créer composant DocumentRejectionDialog (avec raison obligatoire)
    - Créer composant DocumentFilters (dropdowns modernes)
    - _Requirements: 2.2-2.4, 6.1, 6.5_

  - [x] 14.4 Créer la page Contrôles ACPR
    - Créer `app/(advisor)/(frontend)/dashboard/conformite/controles/page.tsx`
    - Table avec colonnes: Client, Type, Status, Priority, Due date, Risk level, Actions
    - Filtres: status, type, priority, ACPR mandatory, overdue only
    - Dialog de création et complétion de contrôle
    - _Requirements: 4.2-4.7_

  - [x] 14.5 Créer la page Réclamations
    - Créer `app/(advisor)/(frontend)/dashboard/conformite/reclamations/page.tsx`
    - Table avec colonnes: Reference, Client, Subject, Type, Status, SLA status, Deadline, Actions
    - Indicateur visuel SLA (vert/orange/rouge)
    - Dialog de création et résolution
    - _Requirements: 5.2-5.8_

  - [x] 14.6 Créer la page Alertes
    - Créer `app/(advisor)/(frontend)/dashboard/conformite/alertes/page.tsx`
    - Liste filtrable par severity et type
    - Actions: acknowledge, navigate to source
    - _Requirements: 3.5-3.6_

  - [x] 14.7 Créer le composant Timeline Conformité
    - Créer composant ComplianceTimeline
    - Affichage chronologique des événements
    - Filtres par type et date
    - Export PDF
    - _Requirements: 11.1-11.5_

- [x] 15. Checkpoint - Vérifier UI conformité
  - Ensure all tests pass, ask the user if questions arise.


- [x] 16. Composants UI Opérations
  - [x] 16.1 Créer le Dashboard Opérations
    - Créer `app/(advisor)/(frontend)/dashboard/operations/page.tsx`
    - Afficher les 3 sous-sections: Affaires Nouvelles, En Cours, Gestion
    - Afficher les compteurs par statut
    - Afficher le pipeline par montant
    - _Requirements: 18.1, 18.5_

  - [x] 16.2 Créer la page Affaires Nouvelles
    - Créer `app/(advisor)/(frontend)/dashboard/operations/affaires-nouvelles/page.tsx`
    - Table avec colonnes: Reference, Client, Type, Product, Provider, Amount, Status, Created date, Actions
    - Filtres par status, product type, provider, date range
    - _Requirements: 18.7, 19.6_

  - [x] 16.3 Créer le formulaire Nouvelle Affaire
    - Créer `app/(advisor)/(frontend)/dashboard/operations/affaires-nouvelles/nouvelle/page.tsx`
    - Wizard multi-étapes: Client → Produit → Provider → Détails → Documents
    - Vérification conformité à l'étape Constitution
    - Checklist documents requis
    - _Requirements: 19.2-19.5, 22.5_

  - [x] 16.4 Créer la page détail Affaire
    - Créer `app/(advisor)/(frontend)/dashboard/operations/affaires-nouvelles/[id]/page.tsx`
    - Afficher tous les détails de l'affaire
    - Historique des statuts
    - Documents associés
    - Actions selon le statut
    - _Requirements: 19.6-19.7_

  - [x] 16.5 Créer la page Affaires en Cours
    - Créer `app/(advisor)/(frontend)/dashboard/operations/en-cours/page.tsx`
    - Afficher les affaires inactives avec code couleur (vert/orange/rouge)
    - Afficher les documents manquants
    - Actions rapides: Reprendre, Relancer, Pause, Annuler
    - _Requirements: 20.1-20.4_

  - [x] 16.6 Créer la page Opérations de Gestion
    - Créer `app/(advisor)/(frontend)/dashboard/operations/gestion/page.tsx`
    - Table avec toutes les opérations de gestion
    - Filtres par type, status, client, contrat
    - _Requirements: 21.7_

  - [x] 16.7 Créer les formulaires Opérations de Gestion
    - Créer `app/(advisor)/(frontend)/dashboard/operations/gestion/nouvelle/page.tsx`
    - Créer composants pour chaque type: ArbitrageForm, RachatForm, VersementForm, etc.
    - Afficher les informations du contrat existant
    - Calculer les implications fiscales pour rachats
    - _Requirements: 21.2-21.6_

  - [x] 16.8 Créer la page Pilotage Commercial
    - Créer `app/(advisor)/(frontend)/dashboard/operations/pilotage/page.tsx`
    - Dashboard avec KPIs: pipeline, taux transformation, délai moyen, AUM
    - Graphiques de tendance
    - Export rapports
    - _Requirements: 23.1-23.6_

- [x] 17. Checkpoint - Vérifier UI opérations
  - Ensure all tests pass, ask the user if questions arise.


- [x] 18. Composants UI Documents
  - [x] 18.1 Créer le composant de génération de documents
    - Créer composant DocumentGeneratorDialog
    - Sélection du type de document
    - Prévisualisation avant génération
    - Génération avec données pré-remplies
    - _Requirements: 14.6-14.7, 16.7_

  - [x] 18.2 Créer le composant d'export documents
    - Créer composant DocumentExportDialog
    - Choix du format (PDF/DOCX)
    - Export batch pour plusieurs documents
    - Application du branding cabinet
    - _Requirements: 16.1-16.6_

  - [x] 18.3 Créer le gestionnaire de templates
    - Créer `app/(advisor)/(frontend)/dashboard/settings/templates/page.tsx`
    - Liste des templates par type et association
    - Édition des sections personnalisables
    - Prévisualisation
    - _Requirements: 15.6-15.7, 17.5_

  - [x] 18.4 Intégrer les documents dans Client 360
    - Ajouter section "Documents Réglementaires" dans la vue client
    - Afficher la liste des documents générés avec dates
    - Boutons d'action rapide pour générer chaque type
    - Indicateur de documents manquants
    - _Requirements: 15.1-15.4_

  - [x] 18.5 Créer le questionnaire MiFID
    - Créer composant MiFIDQuestionnaireWizard
    - Questions par section: connaissance, situation financière, objectifs, tolérance risque
    - Calcul et affichage du profil investisseur
    - Sauvegarde des résultats
    - _Requirements: 9.1-9.6_

- [x] 19. Checkpoint - Vérifier UI documents
  - Ensure all tests pass, ask the user if questions arise.


- [x] 20. Intégration et Liens entre Modules
  - [x] 20.1 Intégrer la conformité dans Client 360
    - Ajouter onglet/section Conformité dans la vue client
    - Afficher le statut KYC global
    - Afficher la timeline conformité
    - Lien vers les opérations du client
    - _Requirements: 25.4_

  - [x] 20.2 Intégrer les opérations dans Client 360
    - Ajouter section Opérations dans la vue client
    - Afficher les affaires en cours
    - Afficher le portefeuille de contrats
    - Historique des opérations
    - _Requirements: 20.2, 23.6_

  - [x] 20.3 Lier les alertes aux opérations
    - Créer des alertes automatiques pour affaires inactives
    - Créer des alertes pour opérations bloquées
    - Navigation depuis l'alerte vers l'opération
    - _Requirements: 20.4, 25.6_

  - [x] 20.4 Intégrer la vérification conformité dans les opérations
    - Afficher le statut conformité lors de la création d'opération
    - Bloquer si non conforme avec message explicatif
    - Proposer les actions correctives
    - _Requirements: 25.1-25.3_

  - [x] 20.5 Lier les documents générés aux opérations
    - Associer chaque document à son opération
    - Afficher les documents dans le détail de l'opération
    - Tracer dans la timeline
    - _Requirements: 22.8, 25.5_

- [x] 21. Checkpoint - Vérifier intégrations
  - Ensure all tests pass, ask the user if questions arise.


- [x] 22. Données de Démonstration
  - [x] 22.1 Créer le script de seed pour la conformité
    - Créer `prisma/seeds/compliance-seed.ts`
    - Générer 5+ clients avec documents KYC variés (valid, pending, expired, expiring)
    - Générer 3+ réclamations avec différents statuts et SLA
    - Générer 5+ contrôles avec différents types et états
    - Marquer clairement comme données de démo
    - _Requirements: 7.1-7.5_

  - [x] 22.2 Créer le script de seed pour les opérations
    - Créer `prisma/seeds/operations-seed.ts`
    - Générer des affaires nouvelles à différents stades
    - Générer des opérations de gestion
    - Générer des providers et produits de base
    - _Requirements: 7.1_

  - [x] 22.3 Créer le script de seed pour les templates
    - Créer `prisma/seeds/templates-seed.ts`
    - Générer les templates par défaut pour chaque type de document
    - Générer les templates par association (CNCGP, ANACOFI, CNCEF, Generic)
    - _Requirements: 17.1-17.4_

  - [x] 22.4 Intégrer les seeds dans le script principal
    - Modifier `prisma/seed.ts` pour inclure les nouveaux seeds
    - Permettre l'exécution sélective
    - Ajouter option de nettoyage des données de démo
    - _Requirements: 7.5_

- [x] 23. Checkpoint - Vérifier données de démo
  - Ensure all tests pass, ask the user if questions arise.


- [x] 24. Tests d'Intégration et Finalisation
  - [ ]* 24.1 Write property test for document filter correctness
    - **Property 12: Document Filter Correctness**
    - **Validates: Requirements 2.7**

  - [ ]* 24.2 Write integration tests for compliance workflow
    - Test du workflow complet: upload → validation → expiration → alerte
    - Test du workflow réclamation: création → traitement → résolution
    - Test du workflow contrôle: création → complétion → risk level
    - _Requirements: 2.2-2.5, 5.4, 4.2-4.5_

  - [ ]* 24.3 Write integration tests for operations workflow
    - Test du workflow affaire: prospect → validé
    - Test du workflow opération gestion: brouillon → exécuté
    - Test de la vérification conformité
    - _Requirements: 19.1, 21.3, 25.1_

  - [x] 24.4 Vérifier l'accessibilité
    - Tester la navigation clavier sur tous les composants
    - Vérifier les labels ARIA
    - Tester avec un lecteur d'écran
    - _Requirements: 6.4_

  - [x] 24.5 Vérifier les toasts et confirmations
    - Tester les toasts de succès sur toutes les actions
    - Tester les toasts d'erreur avec messages explicites
    - Tester les dialogs de confirmation avant actions destructives
    - _Requirements: 6.5-6.7_

  - [x] 24.6 Optimiser les performances
    - Vérifier les index Prisma
    - Optimiser les requêtes N+1
    - Implémenter la pagination où nécessaire
    - _Requirements: 2.8, 4.6, 5.7_

- [x] 25. Final Checkpoint - Validation complète
  - Ensure all tests pass, ask the user if questions arise.
  - Vérifier que tous les requirements sont couverts
  - Vérifier que toutes les properties sont testées

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- No mocks - all data must be real or from seed scripts
- Use `unknown` instead of `any` throughout the codebase
