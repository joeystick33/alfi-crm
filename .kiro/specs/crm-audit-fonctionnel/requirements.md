# Requirements Document

## Introduction

Audit approfondi et honnête du CRM pour identifier les fonctionnalités réellement opérationnelles vs celles qui sont des "mocks" ou du code simplifié. L'objectif est de transformer chaque élément du CRM en fonctionnalité réelle avec des résultats mesurables et prouvables.

**Problèmes identifiés lors de l'audit initial :**
1. **Cartes non cliquables** : Les cartes du dashboard ne mènent pas toujours à des pages fonctionnelles
2. **Clients non liés** : Les listes de clients ne permettent pas toujours d'accéder à leur fiche complète
3. **Documents non générables** : Les documents "à générer" (DER, Déclaration d'adéquation, Bulletin d'opération) ne produisent pas de vrais fichiers PDF/DOCX
4. **Fonctionnalités simplifiées** : Beaucoup de fonctions retournent des placeholders au lieu de vrais résultats
5. **Sections sans valeur ajoutée** : Des pages qui affichent des données mais ne permettent pas d'actions concrètes
6. **Déconnexion du CRM** : Des fonctionnalités isolées qui ne sont pas liées aux données clients réelles

## Glossary

- **Functional_Audit** : Module d'audit des fonctionnalités réelles vs mocks
- **Document_Generator_Real** : Générateur de documents produisant de vrais fichiers PDF/DOCX
- **Navigation_System** : Système de navigation assurant que chaque élément cliquable mène à une destination fonctionnelle
- **Data_Integration** : Système assurant que toutes les données sont liées au CRM central
- **Result_Validator** : Système validant que chaque action produit un résultat mesurable
- **Mock** : Code simplifié qui simule une fonctionnalité sans la réaliser vraiment
- **Placeholder** : Valeur temporaire remplaçant une vraie donnée
- **Real_Output** : Résultat concret et utilisable (fichier, donnée persistée, action effectuée)

## Requirements

### Requirement 1: Audit des Cartes Dashboard - Navigation Fonctionnelle

**User Story:** As a CGP, I want every dashboard card to be clickable and lead to a functional page, so that I can access detailed information with one click.

#### Acceptance Criteria

1. WHEN the CGP clicks on any KPI card in the Conformité dashboard, THE Navigation_System SHALL navigate to the corresponding filtered list page
2. WHEN the CGP clicks on any KPI card in the Opérations dashboard, THE Navigation_System SHALL navigate to the corresponding filtered list page
3. WHEN the CGP clicks on a client name anywhere in the application, THE Navigation_System SHALL navigate to the Client 360 view for that client
4. WHEN the CGP clicks on an operation reference, THE Navigation_System SHALL navigate to the operation detail page
5. WHEN the CGP clicks on a document in any list, THE Navigation_System SHALL either open the document or navigate to its detail page
6. THE Navigation_System SHALL ensure no card or clickable element leads to a 404 or empty page

### Requirement 2: Audit des Listes Clients - Liens Fonctionnels

**User Story:** As a CGP, I want every client mention in the application to link to their complete profile, so that I can quickly access client information from any context.

#### Acceptance Criteria

1. WHEN displaying a client name in any table or list, THE Data_Integration SHALL render it as a clickable link to Client 360
2. WHEN displaying a client in the documents KYC list, THE Data_Integration SHALL include the client's full name (not just ID) and link to their profile
3. WHEN displaying a client in the operations list, THE Data_Integration SHALL show client name with link to Client 360
4. WHEN displaying a client in the reclamations list, THE Data_Integration SHALL show client name with link to Client 360
5. THE Data_Integration SHALL display client information consistently across all modules (same format, same data)

### Requirement 3: Génération Réelle de Documents PDF

**User Story:** As a CGP, I want to generate real PDF documents that I can download, print, and have clients sign, so that I can fulfill my regulatory obligations.

#### Acceptance Criteria

1. WHEN generating a DER (Document d'Entrée en Relation), THE Document_Generator_Real SHALL produce a real PDF file with:
   - Cabinet header with logo and contact information
   - Client information pre-filled from database
   - ORIAS registration number
   - Professional liability insurance details
   - Services offered and fee structure
   - Regulatory disclosures (AMF, ACPR warnings)
   - Signature placeholders with date fields

2. WHEN generating a Déclaration d'Adéquation, THE Document_Generator_Real SHALL produce a real PDF file with:
   - Client profile summary (risk profile, investment horizon)
   - Recommended product details
   - Adequacy justification
   - Risk warnings specific to the product
   - Signature placeholders

3. WHEN generating a Bulletin d'Opération, THE Document_Generator_Real SHALL produce a real PDF file with:
   - Operation type and reference
   - Client and contract information
   - Operation details (amounts, funds, dates)
   - Compliance checklist
   - Signature placeholders

4. WHEN generating a Lettre de Mission, THE Document_Generator_Real SHALL produce a real PDF file with:
   - Mission scope and objectives
   - Duration and deliverables
   - Fee structure
   - Termination conditions
   - Signature placeholders

5. WHEN generating a Recueil d'Informations, THE Document_Generator_Real SHALL produce a real PDF file with:
   - Client identity section
   - Family situation
   - Professional situation
   - Patrimony composition
   - Income and expenses
   - Investment objectives

6. THE Document_Generator_Real SHALL use a real PDF library (react-pdf, pdfmake, or jsPDF) to generate actual downloadable files
7. THE Document_Generator_Real SHALL NOT return placeholder URLs or simulated content
8. WHEN a document is generated, THE Document_Generator_Real SHALL save the file to storage (Supabase Storage or S3) and return a real download URL

### Requirement 4: Génération Réelle de Documents DOCX

**User Story:** As a CGP, I want to generate real DOCX documents that I can edit before sending to clients, so that I can customize documents for specific situations.

#### Acceptance Criteria

1. WHEN exporting to DOCX format, THE Document_Generator_Real SHALL produce a real .docx file using the docx library
2. THE Document_Generator_Real SHALL preserve all formatting, headers, footers, and styles in the DOCX output
3. THE Document_Generator_Real SHALL include editable placeholders for custom content
4. THE Document_Generator_Real SHALL apply cabinet branding (logo, colors, fonts)
5. WHEN a DOCX is generated, THE Document_Generator_Real SHALL save the file to storage and return a real download URL

### Requirement 5: Résultats Mesurables pour Chaque Action

**User Story:** As a CGP, I want every action I take in the CRM to produce a measurable result, so that I can trust the system for my business operations.

#### Acceptance Criteria

1. WHEN the CGP validates a KYC document, THE Result_Validator SHALL:
   - Update the document status in the database
   - Record the validation in the audit log with timestamp and user
   - Update the client's KYC completion rate
   - Create a timeline event
   - Return confirmation with the updated document data

2. WHEN the CGP creates an operation, THE Result_Validator SHALL:
   - Create the operation record in the database
   - Generate a unique reference number
   - Link to the client and any associated documents
   - Create a timeline event
   - Return the created operation with all details

3. WHEN the CGP generates a document, THE Result_Validator SHALL:
   - Create a real file (PDF or DOCX)
   - Save the file to storage
   - Create a document record in the database
   - Link to the client and operation
   - Create a timeline event
   - Return a real download URL

4. WHEN the CGP sends a reminder, THE Result_Validator SHALL:
   - Record the reminder action with timestamp
   - Update the reminder count for the document/client
   - Create a timeline event
   - Optionally send an actual email (if email integration is configured)

5. WHEN the CGP completes a control, THE Result_Validator SHALL:
   - Update the control status to completed
   - Calculate and save the risk score and level
   - Record findings in the database
   - Create a timeline event
   - Update any related alerts

### Requirement 6: Intégration Complète avec le CRM

**User Story:** As a CGP, I want all features to be connected to the central CRM data, so that I have a unified view of my clients and operations.

#### Acceptance Criteria

1. THE Data_Integration SHALL ensure every document is linked to a client record
2. THE Data_Integration SHALL ensure every operation is linked to a client record
3. THE Data_Integration SHALL ensure every alert references its source (document, operation, control)
4. THE Data_Integration SHALL ensure the Client 360 view aggregates all related data:
   - KYC documents and status
   - Operations (affaires nouvelles, en cours, gestion)
   - Generated regulatory documents
   - Compliance timeline
   - Alerts and reminders
   - Reclamations

5. THE Data_Integration SHALL ensure changes in one module reflect in all related views
6. THE Data_Integration SHALL ensure no orphan data exists (documents without clients, operations without clients)

### Requirement 7: Sections Dashboard avec Valeur Ajoutée

**User Story:** As a CGP, I want every dashboard section to provide actionable insights and real functionality, so that I can make informed decisions and take immediate action.

#### Acceptance Criteria

1. THE Compliance_Dashboard "Documents expirant bientôt" section SHALL:
   - Display real documents from the database
   - Show accurate expiration dates
   - Allow one-click navigation to the document
   - Allow one-click reminder sending
   - Show the client name as a link to Client 360

2. THE Compliance_Dashboard "Alertes récentes" section SHALL:
   - Display real alerts from the database
   - Show accurate severity and type
   - Allow one-click acknowledgment
   - Allow one-click navigation to the source
   - Show the client name as a link to Client 360

3. THE Operations_Dashboard "Pipeline par montant" section SHALL:
   - Display real pipeline data from operations
   - Show accurate amounts by product type
   - Allow drill-down to filtered operation list
   - Update in real-time when operations change

4. THE Operations_Dashboard "Affaires par statut" section SHALL:
   - Display real counts from the database
   - Allow one-click filtering by status
   - Navigate to the filtered list

5. EVERY dashboard section SHALL display real data from the database, not hardcoded or mock data

### Requirement 8: Export et Téléchargement Réels

**User Story:** As a CGP, I want to download real files when I click export or download buttons, so that I can use these files for my business.

#### Acceptance Criteria

1. WHEN the CGP clicks "Télécharger" on a document, THE Result_Validator SHALL initiate a real file download
2. WHEN the CGP clicks "Exporter PDF" on the timeline, THE Result_Validator SHALL generate and download a real PDF file
3. WHEN the CGP clicks "Exporter" on a data table, THE Result_Validator SHALL generate and download a real CSV or Excel file
4. THE Result_Validator SHALL NOT display "Export en cours" without actually producing a file
5. THE Result_Validator SHALL show an error message if export fails, with the actual reason

### Requirement 9: Formulaires avec Persistance Réelle

**User Story:** As a CGP, I want form submissions to actually save data to the database, so that my work is not lost and I can retrieve it later.

#### Acceptance Criteria

1. WHEN the CGP submits the "Nouvelle Affaire" form, THE Data_Integration SHALL:
   - Validate all required fields
   - Create the affaire record in the database
   - Generate the reference number
   - Navigate to the created affaire detail page
   - Display a success toast with the reference

2. WHEN the CGP submits the "Nouvelle Opération de Gestion" form, THE Data_Integration SHALL:
   - Validate all required fields
   - Create the operation record in the database
   - Generate the reference number
   - Link to the existing contract
   - Navigate to the created operation detail page

3. WHEN the CGP submits the "Nouvelle Réclamation" form, THE Data_Integration SHALL:
   - Validate all required fields
   - Create the reclamation record in the database
   - Generate the reference number (REC-YYYY-NNNN)
   - Calculate the SLA deadline
   - Navigate to the created reclamation detail page

4. WHEN the CGP submits the MiFID questionnaire, THE Data_Integration SHALL:
   - Save all answers to the database
   - Calculate the risk profile
   - Update the client record with the new profile
   - Display the calculated profile summary

5. IF a form submission fails, THEN THE Data_Integration SHALL:
   - Display a clear error message
   - NOT lose the user's input
   - Allow retry without re-entering data

### Requirement 10: Vérification de l'Intégrité des Données

**User Story:** As a CGP, I want the system to maintain data integrity, so that I can trust the information displayed.

#### Acceptance Criteria

1. THE Data_Integration SHALL ensure all foreign key relationships are valid
2. THE Data_Integration SHALL ensure no document references a non-existent client
3. THE Data_Integration SHALL ensure no operation references a non-existent client or contract
4. THE Data_Integration SHALL ensure all generated documents have valid file URLs
5. THE Data_Integration SHALL ensure all timeline events reference valid entities
6. WHEN displaying counts or statistics, THE Data_Integration SHALL calculate from real database queries, not cached or hardcoded values

