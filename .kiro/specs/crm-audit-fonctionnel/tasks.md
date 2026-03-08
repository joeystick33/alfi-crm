# Implementation Plan: Audit Fonctionnel CRM

## Overview

Ce plan d'implémentation transforme le CRM d'un état "mock/simplifié" vers un état "fonctionnel complet". Chaque tâche vise à rendre une fonctionnalité réellement opérationnelle avec des résultats mesurables.

## Tasks

- [x] 1. Installation des dépendances pour génération de documents réels
  - [x] 1.1 Installer les bibliothèques PDF et DOCX
    - Installer `@react-pdf/renderer` pour génération PDF côté serveur
    - Installer `docx` pour génération DOCX
    - Installer `file-saver` pour téléchargement côté client
    - _Requirements: 3.6, 4.1_

  - [x] 1.2 Configurer Supabase Storage pour le stockage de fichiers
    - Créer le bucket "documents" dans Supabase
    - Configurer les policies RLS pour accès par cabinet
    - Créer le service `lib/storage/file-storage-service.ts`
    - _Requirements: 3.8, 4.5_

- [x] 2. Checkpoint - Vérifier les dépendances
  - Ensure all packages are installed and Supabase Storage is configured.

- [-] 3. Service de génération PDF réel
  - [x] 3.1 Créer le service PDF Generator
    - Créer `lib/documents/services/pdf-generator-service.tsx`
    - Implémenter `generateDERPDF()` avec @react-pdf/renderer
    - Inclure: header cabinet, infos client, ORIAS, assurance RC, services, tarifs, mentions légales
    - _Requirements: 3.1, 3.6_

  - [x] 3.2 Implémenter la génération de Déclaration d'Adéquation PDF
    - Implémenter `generateDeclarationAdequationPDF()`
    - Inclure: profil client, produit recommandé, justification, avertissements
    - _Requirements: 3.2_

  - [x] 3.3 Implémenter la génération de Bulletin d'Opération PDF
    - Implémenter `generateBulletinOperationPDF()`
    - Inclure: type opération, référence, client, contrat, détails, checklist conformité
    - _Requirements: 3.3_

  - [x] 3.4 Implémenter la génération de Lettre de Mission PDF
    - Implémenter `generateLettreMissionPDF()`
    - Inclure: périmètre, durée, livrables, tarifs, conditions résiliation
    - _Requirements: 3.4_

  - [x] 3.5 Implémenter la génération de Recueil d'Informations PDF
    - Implémenter `generateRecueilInformationsPDF()`
    - Inclure: identité, situation familiale, professionnelle, patrimoine, revenus, objectifs
    - _Requirements: 3.5_

  - [x] 3.6 Write property test for PDF generation validity
    - **Property 3: PDF Generation Validity**
    - **Validates: Requirements 3.1-3.8**

- [x] 4. Checkpoint - Vérifier génération PDF
  - Ensure PDF generation produces valid files.

- [ ] 5. Service de génération DOCX réel
  - [x] 5.1 Créer le service DOCX Generator
    - Créer `lib/documents/services/docx-generator-service.ts`
    - Implémenter `generateDERDOCX()` avec bibliothèque docx
    - Préserver formatage, headers, footers, styles
    - _Requirements: 4.1, 4.2_

  - [x] 5.2 Implémenter les autres types de documents DOCX
    - Implémenter `generateDeclarationAdequationDOCX()`
    - Implémenter `generateBulletinOperationDOCX()`
    - Implémenter `generateLettreMissionDOCX()`
    - Implémenter `generateRecueilInformationsDOCX()`
    - _Requirements: 4.1-4.4_

  - [x] 5.3 Write property test for DOCX generation validity
    - **Property 4: DOCX Generation Validity**
    - **Validates: Requirements 4.1-4.5**

- [x] 6. Checkpoint - Vérifier génération DOCX
  - Ensure DOCX generation produces valid files.

- [x] 7. Refactoring du service d'export existant
  - [x] 7.1 Modifier export-service.ts pour utiliser les vrais générateurs
    - Remplacer les placeholder URLs par de vrais appels aux générateurs
    - Intégrer le stockage Supabase
    - Retourner de vraies URLs de téléchargement
    - _Requirements: 3.7, 3.8, 8.1-8.5_

  - [x] 7.2 Modifier document-generator-service.ts
    - Intégrer les vrais générateurs PDF/DOCX
    - Stocker les fichiers dans Supabase Storage
    - Mettre à jour le modèle avec fileSize et checksum
    - _Requirements: 3.8, 5.3_

  - [x] 7.3 Write property test for export file validity
    - **Property 8: Export File Validity**
    - **Validates: Requirements 8.1-8.5**
    - ✅ All 9 tests passed (PDF/DOCX validity, file signatures, size proportionality, error handling, filename formatting)

- [x] 8. Checkpoint - Vérifier service d'export
  - Ensure export service produces real downloadable files.

- [x] 9. Composant ClientLink réutilisable
  - [x] 9.1 Créer le composant ClientLink
    - Créer `app/_common/components/ClientLink.tsx`
    - Props: clientId, clientName (optionnel), showAvatar, className
    - Fetch automatique du nom si non fourni
    - Lien vers `/dashboard/clients/[clientId]`
    - _Requirements: 2.1_

  - [x] 9.2 Remplacer les affichages clients dans les tables KYC
    - Modifier `app/(advisor)/(frontend)/dashboard/conformite/documents/page.tsx`
    - Remplacer "Client #{doc.clientId.slice(0, 8)}" par ClientLink
    - _Requirements: 2.2_

  - [x] 9.3 Remplacer les affichages clients dans les tables opérations
    - Modifier les pages affaires-nouvelles, en-cours, gestion
    - Utiliser ClientLink partout où un client est affiché
    - _Requirements: 2.3_

  - [x] 9.4 Remplacer les affichages clients dans les réclamations et alertes
    - Modifier les pages réclamations et alertes
    - Utiliser ClientLink partout
    - _Requirements: 2.4_

  - [x] 9.5 Write property test for client link consistency
    - **Property 2: Client Link Consistency**
    - **Validates: Requirements 2.1-2.5**
    - ✅ All 12 tests passed (href generation, path validation, display name variants, determinism, ID preservation)

- [x] 10. Checkpoint - Vérifier liens clients
  - Ensure all client names are clickable links.
  - ✅ ClientLink component created and integrated across all compliance and operations pages

- [x] 11. Navigation fonctionnelle des KPI cards
  - [x] 11.1 Vérifier et corriger les liens KPI du dashboard Conformité
    - Vérifier que chaque KPI card navigue vers la bonne page avec les bons filtres
    - Corriger les liens cassés ou manquants
    - _Requirements: 1.1_

  - [x] 11.2 Vérifier et corriger les liens KPI du dashboard Opérations
    - Vérifier que chaque KPI card navigue vers la bonne page
    - Corriger les liens cassés ou manquants
    - _Requirements: 1.2_

  - [x] 11.3 Vérifier les liens des sections "Expiring Soon" et "Alertes"
    - Chaque document/alerte doit être cliquable
    - Navigation vers le détail ou la page filtrée
    - _Requirements: 1.5, 7.1, 7.2_

  - [x] 11.4 Write property test for navigation integrity
    - **Property 1: Navigation Integrity**
    - **Validates: Requirements 1.1-1.6**

- [x] 12. Checkpoint - Vérifier navigation
  - Ensure all clickable elements lead to valid pages.

- [x] 13. Résultats mesurables pour les actions
  - [x] 13.1 Améliorer la validation de documents KYC
    - Vérifier que validateDocument() crée bien l'audit log
    - Vérifier que le timeline event est créé
    - Vérifier que le taux de complétion KYC est mis à jour
    - _Requirements: 5.1_

  - [x] 13.2 Améliorer la création d'opérations
    - Vérifier que createAffaire() génère bien la référence unique
    - Vérifier que le timeline event est créé
    - Vérifier que les documents sont liés
    - _Requirements: 5.2_

  - [x] 13.3 Améliorer la génération de documents
    - Vérifier que generateDocument() crée le fichier réel
    - Vérifier que le record DB est créé avec fileUrl valide
    - Vérifier que le timeline event est créé
    - _Requirements: 5.3_

  - [x] 13.4 Améliorer l'envoi de relances
    - Vérifier que sendReminder() enregistre l'action
    - Vérifier que le compteur de relances est incrémenté
    - Vérifier que le timeline event est créé
    - _Requirements: 5.4_

  - [x] 13.5 Améliorer la complétion de contrôles
    - Vérifier que completeControl() met à jour le statut
    - Vérifier que le risk score est calculé et sauvé
    - Vérifier que les alertes liées sont mises à jour
    - _Requirements: 5.5_

  - [x] 13.6 Write property test for action result completeness
    - **Property 5: Action Result Completeness**
    - **Validates: Requirements 5.1-5.5**
    - ✅ All 14 tests passed (document validation, operation creation, document generation, reminder sending, control completion, audit logs, timeline events)

- [x] 14. Checkpoint - Vérifier résultats des actions
  - Ensure all actions produce measurable results.
  - ✅ All subtasks 13.1-13.6 completed with proper audit logs, timeline events, and side effects

- [ ] 15. Intégrité des données et relations
  - [ ] 15.1 Ajouter validation des relations dans les services
    - Vérifier que clientId existe avant de créer un document
    - Vérifier que clientId existe avant de créer une opération
    - Retourner erreur explicite si relation invalide
    - _Requirements: 6.1, 6.2_

  - [ ] 15.2 Vérifier l'intégrité des alertes
    - Chaque alerte doit référencer une source valide
    - Ajouter actionUrl valide pour chaque type d'alerte
    - _Requirements: 6.3_

  - [ ] 15.3 Vérifier l'agrégation Client 360
    - Vérifier que tous les onglets affichent des données réelles
    - Vérifier que les compteurs sont corrects
    - _Requirements: 6.4_

  - [ ] 15.4 Ajouter script de vérification d'intégrité
    - Créer `scripts/verify-data-integrity.ts`
    - Détecter les documents sans client
    - Détecter les opérations sans client
    - Détecter les URLs de fichiers invalides
    - _Requirements: 6.5, 6.6_

  - [ ] 15.5 Write property test for data relationship integrity
    - **Property 6: Data Relationship Integrity**
    - **Validates: Requirements 6.1-6.6**

- [ ] 16. Checkpoint - Vérifier intégrité des données
  - Ensure no orphan data exists.

- [ ] 17. Authenticité des données dashboard
  - [ ] 17.1 Vérifier que les KPIs sont calculés en temps réel
    - Vérifier que useComplianceKPIs() fait une vraie requête DB
    - Vérifier que les compteurs ne sont pas hardcodés
    - _Requirements: 7.1-7.5_

  - [ ] 17.2 Vérifier la section "Documents expirant bientôt"
    - Vérifier que les documents affichés viennent de la DB
    - Vérifier que les dates d'expiration sont correctes
    - Vérifier que les liens clients fonctionnent
    - _Requirements: 7.1_

  - [ ] 17.3 Vérifier la section "Alertes récentes"
    - Vérifier que les alertes viennent de la DB
    - Vérifier que l'acquittement fonctionne
    - Vérifier que la navigation vers la source fonctionne
    - _Requirements: 7.2_

  - [ ] 17.4 Vérifier le pipeline par montant
    - Vérifier que les montants sont calculés depuis les opérations réelles
    - Vérifier que le drill-down fonctionne
    - _Requirements: 7.3_

  - [ ] 17.5 Write property test for dashboard data authenticity
    - **Property 7: Dashboard Data Authenticity**
    - **Validates: Requirements 7.1-7.5**

- [ ] 18. Checkpoint - Vérifier authenticité des dashboards
  - Ensure dashboards display real data.

- [ ] 19. Persistance des formulaires
  - [ ] 19.1 Vérifier le formulaire "Nouvelle Affaire"
    - Vérifier que la soumission crée bien l'affaire en DB
    - Vérifier que la référence est générée
    - Vérifier la navigation vers la page détail
    - _Requirements: 9.1_

  - [ ] 19.2 Vérifier le formulaire "Nouvelle Opération de Gestion"
    - Vérifier que la soumission crée bien l'opération en DB
    - Vérifier le lien avec le contrat existant
    - Vérifier la navigation vers la page détail
    - _Requirements: 9.2_

  - [ ] 19.3 Vérifier le formulaire "Nouvelle Réclamation"
    - Vérifier que la soumission crée bien la réclamation en DB
    - Vérifier que la référence REC-YYYY-NNNN est générée
    - Vérifier que le SLA est calculé
    - _Requirements: 9.3_

  - [ ] 19.4 Vérifier le questionnaire MiFID
    - Vérifier que les réponses sont sauvées en DB
    - Vérifier que le profil de risque est calculé
    - Vérifier que le client est mis à jour
    - _Requirements: 9.4_

  - [ ] 19.5 Améliorer la gestion des erreurs de formulaire
    - Afficher les erreurs clairement
    - Ne pas perdre les données saisies en cas d'erreur
    - Permettre de réessayer
    - _Requirements: 9.5_

  - [ ] 19.6 Write property test for form persistence round-trip
    - **Property 9: Form Persistence Round-Trip**
    - **Validates: Requirements 9.1-9.5**

- [ ] 20. Checkpoint - Vérifier persistance des formulaires
  - Ensure all forms persist data correctly.

- [ ] 21. Intégrité référentielle de la base de données
  - [ ] 21.1 Ajouter contraintes FK dans Prisma si manquantes
    - Vérifier toutes les relations dans schema.prisma
    - Ajouter onDelete: Cascade ou Restrict selon le cas
    - _Requirements: 10.1, 10.2_

  - [ ] 21.2 Vérifier les URLs de fichiers générés
    - Créer un job de vérification des URLs
    - Marquer les documents avec URLs invalides
    - _Requirements: 10.4_

  - [ ] 21.3 Vérifier les références des timeline events
    - Chaque event doit référencer une entité valide
    - Nettoyer les events orphelins
    - _Requirements: 10.5_

  - [ ] 21.4 Write property test for database referential integrity
    - **Property 10: Database Referential Integrity**
    - **Validates: Requirements 10.1-10.6**

- [ ] 22. Checkpoint - Vérifier intégrité référentielle
  - Ensure all foreign keys are valid.

- [ ] 23. Tests d'intégration finaux
  - [ ] 23.1 Test workflow complet de génération de document
    - Créer client → Créer affaire → Générer DER → Télécharger PDF
    - Vérifier que le fichier est valide et téléchargeable

  - [ ] 23.2 Test workflow complet d'opération
    - Créer affaire → Changer statuts → Générer documents → Valider
    - Vérifier tous les side effects

  - [ ] 23.3 Test navigation complète
    - Parcourir tous les liens du dashboard
    - Vérifier qu'aucun ne mène à une erreur

- [ ] 24. Final Checkpoint - Validation complète
  - Ensure all tests pass, ask the user if questions arise.
  - Vérifier que tous les requirements sont couverts
  - Vérifier que toutes les properties sont testées

## Notes

- All tasks are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Focus on transforming mocks into real functionality
- Use TypeScript strict mode throughout

