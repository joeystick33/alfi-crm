# Requirements Document

## Introduction

Refonte complète de la section Conformité du CRM pour les Conseillers en Gestion de Patrimoine (CGP). Cette section est critique car les utilisateurs risquent des sanctions pénales et financières (AMF, ACPR, TRACFIN) en cas de non-conformité. L'objectif est de créer un système fonctionnel, professionnel et conforme aux standards du marché (Harvest, WealthCome, O2S).

La section Conformité couvre :
- **KYC (Know Your Customer)** : Collecte et validation des documents clients
- **LCB-FT** : Lutte contre le blanchiment et financement du terrorisme
- **Réclamations** : Gestion des plaintes clients avec SLA réglementaires
- **Contrôles périodiques** : Audits ACPR obligatoires

## Glossary

- **KYC_System** : Module de gestion des documents et vérifications Know Your Customer
- **Document_Manager** : Composant de gestion du cycle de vie des documents KYC
- **Compliance_Dashboard** : Tableau de bord principal de conformité
- **Alert_Engine** : Moteur de génération et gestion des alertes de conformité
- **Reclamation_Handler** : Gestionnaire des réclamations clients avec suivi SLA
- **Control_Manager** : Gestionnaire des contrôles périodiques ACPR
- **MiFID_Questionnaire** : Module de questionnaire investisseur MiFID II
- **DER_Generator** : Générateur de Document d'Entrée en Relation
- **Document_Generator** : Générateur de documents réglementaires (DER, Lettre de Mission, Rapport, etc.)
- **Template_Manager** : Gestionnaire de templates de documents personnalisables par cabinet
- **Compliance_Timeline** : Historique chronologique des événements conformité
- **Signature_Manager** : Gestionnaire des signatures électroniques
- **Client_Portal** : Interface client pour upload de documents
- **Client_360_View** : Vue complète du profil client incluant conformité, opérations et portefeuille
- **Dossier_View** : Vue d'un dossier client avec documents et opérations associés
- **Operations_Manager** : Gestionnaire central des opérations commerciales et de gestion
- **Affaire_Nouvelle** : Module de création et suivi d'une nouvelle souscription (vente)
- **Operation_Gestion** : Module de gestion des opérations post-vente (arbitrage, rachat, versement)
- **Document_Export** : Module d'export de documents en Word/PDF pour signature
- **Association_Templates** : Templates de documents spécifiques par association CGP (CNCGP, ANACOFI, CNCEF)
- **Provider_Catalog** : Base de données des fournisseurs/assureurs et leurs produits
- **Pilotage_Dashboard** : Tableau de bord de pilotage commercial avec KPIs et pipeline
- **Client** : Personne physique ou morale suivie par le conseiller
- **CGP** : Conseiller en Gestion de Patrimoine (utilisateur principal)
- **SLA** : Service Level Agreement - délais réglementaires de traitement
- **PPE** : Personne Politiquement Exposée
- **ACPR** : Autorité de Contrôle Prudentiel et de Résolution
- **AUM** : Assets Under Management - Encours sous gestion
- **DER** : Document d'Entrée en Relation
- **LCB-FT** : Lutte Contre le Blanchiment et Financement du Terrorisme

## Requirements

### Requirement 1: Tableau de bord Conformité

**User Story:** As a CGP, I want to see a clear compliance dashboard, so that I can quickly identify urgent actions and monitor my regulatory status.

#### Acceptance Criteria

1. WHEN the CGP accesses the compliance dashboard, THE Compliance_Dashboard SHALL display a summary of pending actions grouped by urgency level (critical, high, medium, low)
2. WHEN documents are expiring within 30 days, THE Alert_Engine SHALL display them in a dedicated "Expiring Soon" section with countdown
3. WHEN there are overdue items (expired documents, missed SLA), THE Compliance_Dashboard SHALL display a prominent alert banner with count and direct links
4. THE Compliance_Dashboard SHALL display KPIs including: completion rate, documents pending, controls overdue, open reclamations, SLA breach rate
5. WHEN the CGP clicks on any KPI card, THE Compliance_Dashboard SHALL navigate to the relevant filtered list

### Requirement 2: Gestion des Documents KYC

**User Story:** As a CGP, I want to manage client KYC documents efficiently, so that I can maintain regulatory compliance and track document status.

#### Acceptance Criteria

1. THE Document_Manager SHALL support the following document types: Pièce d'identité, Justificatif de domicile, RIB, Avis d'imposition, Justificatif de patrimoine, Origine des fonds
2. WHEN a document is uploaded, THE Document_Manager SHALL set its status to "En attente de validation"
3. WHEN a CGP validates a document, THE Document_Manager SHALL update status to "Validé" and record validation date and validator
4. WHEN a CGP rejects a document, THE Document_Manager SHALL require a rejection reason and update status to "Rejeté"
5. WHEN a document expiration date is reached, THE Document_Manager SHALL automatically update status to "Expiré"
6. THE Document_Manager SHALL calculate and display document expiration dates based on document type (ID: 10 years, Domicile: 3 months, Tax notice: 1 year)
7. WHEN filtering documents, THE Document_Manager SHALL support filters by: status, type, client, expiration date range
8. THE Document_Manager SHALL display documents in a sortable table with columns: Client, Type, Status, Upload date, Expiration, Actions

### Requirement 3: Alertes et Relances

**User Story:** As a CGP, I want to receive alerts for expiring documents and be able to send reminders to clients, so that I can proactively maintain compliance.

#### Acceptance Criteria

1. WHEN a document expires in 30 days, THE Alert_Engine SHALL create an alert with severity "warning"
2. WHEN a document expires in 7 days, THE Alert_Engine SHALL create an alert with severity "high"
3. WHEN a document is expired, THE Alert_Engine SHALL create an alert with severity "critical"
4. WHEN the CGP clicks "Send reminder" for a client, THE KYC_System SHALL record the reminder action with timestamp
5. THE Alert_Engine SHALL display alerts in a filterable list with columns: Client, Alert type, Severity, Date, Actions
6. WHEN an alert is acknowledged, THE Alert_Engine SHALL mark it as "acknowledged" but keep it visible until resolved

### Requirement 4: Contrôles Périodiques ACPR

**User Story:** As a CGP, I want to manage periodic compliance controls, so that I can demonstrate regulatory compliance during audits.

#### Acceptance Criteria

1. THE Control_Manager SHALL support control types: Vérification identité, Situation financière, Profil de risque, Origine patrimoine, PPE check, Revue périodique
2. WHEN creating a control, THE Control_Manager SHALL require: client, type, due date, priority, description
3. WHEN completing a control, THE Control_Manager SHALL require: findings (conclusions), risk score (0-100), risk level (Low/Medium/High/Critical)
4. THE Control_Manager SHALL calculate risk level automatically based on score: 0-29=Low, 30-59=Medium, 60-84=High, 85-100=Critical
5. WHEN a control due date is passed and status is not "Completed", THE Control_Manager SHALL mark it as "Overdue"
6. THE Control_Manager SHALL display controls in a filterable table with columns: Client, Type, Status, Priority, Due date, Risk level, Actions
7. WHEN filtering controls, THE Control_Manager SHALL support filters by: status, type, priority, ACPR mandatory flag, overdue only

### Requirement 5: Gestion des Réclamations

**User Story:** As a CGP, I want to track and manage client complaints with SLA monitoring, so that I can comply with ACPR requirements for complaint handling.

#### Acceptance Criteria

1. THE Reclamation_Handler SHALL support complaint types: Qualité service, Tarification, Qualité conseil, Communication, Document, Autre
2. WHEN creating a reclamation, THE Reclamation_Handler SHALL generate a unique reference number (format: REC-YYYY-NNNN)
3. WHEN creating a reclamation, THE Reclamation_Handler SHALL calculate SLA deadline based on severity: Low=60 days, Medium=30 days, High=15 days, Critical=7 days
4. THE Reclamation_Handler SHALL track status through workflow: Received → In Progress → Waiting Info → Resolved → Closed
5. WHEN SLA deadline is passed and status is not "Resolved" or "Closed", THE Reclamation_Handler SHALL mark as "SLA Breach"
6. WHEN resolving a reclamation, THE Reclamation_Handler SHALL require a response text
7. THE Reclamation_Handler SHALL display reclamations in a filterable table with columns: Reference, Client, Subject, Type, Status, SLA status, Deadline, Actions
8. WHEN filtering reclamations, THE Reclamation_Handler SHALL support filters by: status, type, SLA breach flag, date range

### Requirement 6: Interface Utilisateur Moderne

**User Story:** As a CGP, I want a modern and intuitive interface, so that I can work efficiently without confusion.

#### Acceptance Criteria

1. THE Compliance_Dashboard SHALL use dropdown menus (not native select elements) for all filters
2. THE Compliance_Dashboard SHALL display empty states with helpful messages and suggested actions when no data matches filters
3. WHEN data is loading, THE Compliance_Dashboard SHALL display skeleton loaders instead of blank content
4. THE Compliance_Dashboard SHALL support keyboard navigation for accessibility
5. THE Compliance_Dashboard SHALL display confirmation dialogs before destructive actions (delete, reject)
6. WHEN an action succeeds, THE Compliance_Dashboard SHALL display a success toast notification
7. WHEN an action fails, THE Compliance_Dashboard SHALL display an error toast with the error message

### Requirement 7: Données de Démonstration

**User Story:** As a CGP testing the system, I want to see realistic demo data, so that I can understand how the system works.

#### Acceptance Criteria

1. WHEN the database has no compliance data, THE KYC_System SHALL seed demo data for testing purposes
2. THE demo data SHALL include at least 5 clients with various KYC document statuses (valid, pending, expired, expiring soon)
3. THE demo data SHALL include at least 3 open reclamations with different statuses and SLA states
4. THE demo data SHALL include at least 5 controls with different types and completion states
5. THE demo data SHALL be clearly marked as demo data and easily removable

### Requirement 8: Persistance et Intégrité des Données

**User Story:** As a CGP, I want my compliance data to be reliably saved, so that I can trust the system for regulatory purposes.

#### Acceptance Criteria

1. WHEN a document status changes, THE Document_Manager SHALL record the change in an audit log with timestamp and user
2. WHEN a reclamation status changes, THE Reclamation_Handler SHALL record the change in an audit log with timestamp and user
3. THE KYC_System SHALL validate all input data before saving to prevent invalid states
4. IF a save operation fails, THEN THE KYC_System SHALL display an error message and not lose user input

### Requirement 9: Questionnaire MiFID II

**User Story:** As a CGP, I want to complete MiFID II questionnaires for my clients, so that I can assess their investor profile and comply with regulations.

#### Acceptance Criteria

1. THE MiFID_Questionnaire SHALL include sections for: knowledge/experience, financial situation, investment objectives, risk tolerance
2. WHEN a CGP starts a MiFID questionnaire, THE MiFID_Questionnaire SHALL display questions in a step-by-step wizard format
3. WHEN all questions are answered, THE MiFID_Questionnaire SHALL calculate a risk profile score (Conservative, Prudent, Balanced, Dynamic, Aggressive)
4. THE MiFID_Questionnaire SHALL calculate an investment horizon recommendation (Short <3y, Medium 3-8y, Long >8y)
5. WHEN the questionnaire is completed, THE MiFID_Questionnaire SHALL save the results to the client profile
6. THE MiFID_Questionnaire SHALL display a summary of the client's investor profile with recommendations
7. WHEN a client's profile changes significantly, THE Alert_Engine SHALL create an alert to review the MiFID questionnaire

### Requirement 10: Document d'Entrée en Relation (DER)

**User Story:** As a CGP, I want to generate Entry Relationship Documents automatically, so that I can formalize the client relationship according to regulations.

#### Acceptance Criteria

1. THE DER_Generator SHALL generate a PDF document containing: advisor information, client information, services offered, fee structure, regulatory disclosures
2. WHEN generating a DER, THE DER_Generator SHALL pre-fill client data from the database
3. THE DER_Generator SHALL include mandatory regulatory sections: ORIAS registration, professional liability insurance, complaint handling procedure
4. WHEN a DER is generated, THE DER_Generator SHALL save it as a document linked to the client
5. THE DER_Generator SHALL support customizable templates per cabinet

### Requirement 11: Historique des Échanges Conformité

**User Story:** As a CGP, I want to see a timeline of all compliance-related interactions with a client, so that I can demonstrate due diligence during audits.

#### Acceptance Criteria

1. THE Compliance_Timeline SHALL display all compliance events for a client in chronological order
2. THE Compliance_Timeline SHALL include events: document uploads, validations, rejections, reminders sent, controls completed, questionnaires filled
3. WHEN viewing a client's compliance timeline, THE Compliance_Timeline SHALL allow filtering by event type and date range
4. THE Compliance_Timeline SHALL display event details including: date, type, user who performed action, notes
5. THE Compliance_Timeline SHALL be exportable as PDF for audit purposes

### Requirement 12: Signatures Électroniques

**User Story:** As a CGP, I want to send documents for electronic signature, so that I can get client approvals efficiently and with legal validity.

#### Acceptance Criteria

1. THE Signature_Manager SHALL support sending documents for electronic signature
2. WHEN sending a document for signature, THE Signature_Manager SHALL allow specifying multiple signers with order
3. THE Signature_Manager SHALL track signature status: Pending, In Progress, Partially Signed, Signed, Rejected, Expired
4. WHEN a signature is completed, THE Signature_Manager SHALL update the document status and record the signature date
5. THE Signature_Manager SHALL send automatic reminders for pending signatures (configurable frequency)
6. THE Signature_Manager SHALL display a dashboard of pending signatures with status and deadlines

### Requirement 13: Portail Client pour Documents

**User Story:** As a CGP, I want my clients to upload their KYC documents directly through a portal, so that I can reduce manual data entry and speed up onboarding.

#### Acceptance Criteria

1. THE Client_Portal SHALL provide a secure interface for clients to upload required documents
2. WHEN a client accesses the portal, THE Client_Portal SHALL display a checklist of required documents with status (missing, pending, validated)
3. WHEN a client uploads a document, THE Client_Portal SHALL create a KYC document entry with status "En attente"
4. THE Client_Portal SHALL notify the CGP when a client uploads a new document
5. THE Client_Portal SHALL allow clients to view the status of their submitted documents
6. THE Client_Portal SHALL support document types: ID, proof of address, tax notice, bank details, proof of income

### Requirement 14: Génération Automatique de Documents Réglementaires

**User Story:** As a CGP, I want to generate regulatory documents automatically with client data pre-filled, so that I can save time and ensure compliance with ACPR/AMF requirements.

#### Acceptance Criteria

1. THE Document_Generator SHALL support generation of the following regulatory document types:
   - Document d'Entrée en Relation (DER)
   - Recueil d'Informations Client
   - Lettre de Mission
   - Rapport de Mission / Fiche Conseil
   - Convention d'Honoraires
   - Attestation de Conseil
   - Mandat de Gestion (optional)

2. WHEN generating a DER, THE Document_Generator SHALL include:
   - Cabinet information (name, ORIAS number, ACPR registration, professional liability insurance)
   - Services offered and scope of intervention
   - Fee structure and remuneration transparency
   - Complaint handling procedure
   - Regulatory disclosures (AMF, ACPR warnings)

3. WHEN generating a Recueil d'Informations, THE Document_Generator SHALL include sections for:
   - Client identity and family situation
   - Professional situation
   - Patrimony composition (assets, liabilities)
   - Income and expenses
   - Investment objectives and horizon
   - Risk tolerance assessment

4. WHEN generating a Lettre de Mission, THE Document_Generator SHALL include:
   - Scope of the mission (conseil, gestion, audit patrimonial)
   - Duration and deliverables
   - Fee structure (fixed, percentage, hourly)
   - Termination conditions

5. WHEN generating a Rapport de Mission, THE Document_Generator SHALL include:
   - Summary of client situation
   - Analysis and recommendations
   - Proposed solutions with justification
   - Risk warnings appropriate to recommendations

6. THE Document_Generator SHALL pre-fill all documents with existing client data from the database
7. THE Document_Generator SHALL generate documents in PDF format with professional styling
8. WHEN a document is generated, THE Document_Generator SHALL save it to the client's document folder
9. THE Document_Generator SHALL support customizable templates per cabinet (logo, colors, footer)
10. THE Document_Generator SHALL track document generation in the compliance timeline

### Requirement 15: Emplacement et Accès aux Documents Réglementaires

**User Story:** As a CGP, I want to access regulatory document generation from the client profile, so that I can quickly generate documents during client meetings.

#### Acceptance Criteria

1. THE Client_360_View SHALL include a "Documents Réglementaires" section in the client profile
2. WHEN viewing a client profile, THE Client_360_View SHALL display a list of generated regulatory documents with dates
3. THE Client_360_View SHALL provide quick-action buttons to generate each document type
4. WHEN a required document is missing, THE Client_360_View SHALL display a warning indicator
5. THE Dossier_View SHALL allow generating documents specific to a dossier (Lettre de Mission, Rapport de Mission)
6. THE Template_Manager SHALL allow cabinet administrators to customize document templates
7. THE Template_Manager SHALL be accessible from cabinet settings

### Requirement 16: Export Documents Personnalisables (Word/PDF)

**User Story:** As a CGP, I want to export regulatory documents in Word format for customization and PDF for signature, so that I can adapt documents to specific client situations and obtain legally valid signatures.

#### Acceptance Criteria

1. THE Document_Export SHALL support export in the following formats: PDF (for signature), DOCX (for editing)
2. WHEN exporting to DOCX, THE Document_Export SHALL preserve all formatting, headers, footers, and placeholders
3. WHEN exporting to PDF, THE Document_Export SHALL generate a professional document with embedded fonts and proper pagination
4. THE Document_Export SHALL include signature placeholders in exported documents (client signature, advisor signature, date fields)
5. WHEN a document is exported, THE Document_Export SHALL record the export action in the compliance timeline
6. THE Document_Export SHALL support batch export of multiple documents for a single client
7. THE Document_Export SHALL allow the CGP to preview documents before export
8. WHEN exporting, THE Document_Export SHALL apply the cabinet's branding (logo, colors, contact information)

### Requirement 17: Templates par Association CGP (CNCGP, ANACOFI, CNCEF)

**User Story:** As a CGP member of a professional association, I want to use document templates that comply with my association's standards, so that I can meet my professional obligations and benefit from association-approved formats.

#### Acceptance Criteria

1. THE Association_Templates SHALL provide pre-configured templates for the following associations:
   - CNCGP (Chambre Nationale des Conseils en Gestion de Patrimoine)
   - ANACOFI (Association Nationale des Conseils Financiers)
   - CNCEF (Chambre Nationale des Conseils Experts Financiers)
   - Generic (for non-affiliated CGPs)

2. WHEN setting up a cabinet, THE Template_Manager SHALL allow selection of the primary association affiliation
3. THE Association_Templates SHALL include association-specific:
   - Document headers and footers with association logo/mention
   - Regulatory disclaimers specific to the association
   - Recommended document structure and sections
   - Association-mandated clauses and warnings

4. WHEN generating a DER, THE Association_Templates SHALL include association-specific sections:
   - CNCGP: Reference to CNCGP membership, code of ethics, mediation procedure
   - ANACOFI: ANACOFI membership number, specific regulatory mentions
   - CNCEF: CNCEF certification reference, specific compliance statements

5. THE Template_Manager SHALL allow CGPs to customize association templates while preserving mandatory sections
6. WHEN an association updates its template requirements, THE Template_Manager SHALL notify affected CGPs
7. THE Association_Templates SHALL be versioned to track regulatory changes over time

### Requirement 18: Section "Mes Opérations" - Structure Globale

**User Story:** As a CGP, I want a comprehensive operations management section that clearly separates new business, ongoing deals, and management operations, so that I can effectively pilot my commercial activity and ensure compliance.

#### Acceptance Criteria

1. THE Operations_Manager SHALL provide a dedicated "Mes Opérations" section accessible from the main navigation with three distinct sub-sections:
   - **Affaires Nouvelles** : New client subscriptions (vente)
   - **Affaires en Cours** : Ongoing deals to resume/complete
   - **Opérations de Gestion** : Post-sale operations on existing contracts

2. THE Operations_Manager SHALL generate unique reference numbers for all operations:
   - Affaire Nouvelle: AN-YYYY-NNNN
   - Opération de Gestion: OG-YYYY-NNNN

3. THE Operations_Manager SHALL support the following contract/product types across all operation categories:
   - Assurance Vie (life insurance)
   - PER Individuel / PER Entreprise (retirement savings)
   - SCPI (real estate investment trust)
   - OPCI (real estate collective investment)
   - Compte-titres ordinaire (securities account)
   - PEA / PEA-PME (equity savings plan)
   - Contrat de capitalisation
   - Private Equity (FCPR, FCPI, FIP)
   - Immobilier direct (real estate)
   - Crédit immobilier (mortgage - for tracking)

4. THE Operations_Manager SHALL link every operation to:
   - The associated Client record (Client_360_View)
   - The client's Dossier (Dossier_View) if applicable
   - All generated compliance documents (Document_Manager)
   - The compliance timeline (Compliance_Timeline)
   - KYC status verification (KYC_System)

5. THE Operations_Manager SHALL display a unified dashboard showing:
   - Count of Affaires Nouvelles by status
   - Count of Affaires en Cours requiring action
   - Count of Opérations de Gestion pending
   - Total amounts in pipeline by product type
   - Alerts for operations with missing compliance documents

6. WHEN any operation is created or modified, THE Operations_Manager SHALL verify KYC compliance status and display warnings if documents are expired or missing

### Requirement 19: Affaires Nouvelles (Vente)

**User Story:** As a CGP, I want to create and track new business deals from initial contact to completion, so that I can manage my sales pipeline and ensure all regulatory documents are generated.

#### Acceptance Criteria

1. THE Affaire_Nouvelle SHALL track new subscriptions through the following workflow stages:
   - **Prospect** : Initial opportunity identified
   - **Qualification** : Client needs assessed, product identified
   - **Constitution** : Documents being gathered and generated
   - **Signature** : Awaiting client signature
   - **Envoyé** : Sent to provider/insurer
   - **En traitement** : Being processed by provider
   - **Validé** : Contract confirmed and active
   - **Rejeté** : Rejected by provider (with reason)
   - **Annulé** : Cancelled by client or advisor

2. WHEN creating an Affaire Nouvelle, THE Affaire_Nouvelle SHALL require:
   - Client selection (linked to Client_360_View)
   - Product type selection
   - Provider/Insurer selection
   - Estimated investment amount
   - Target completion date
   - Source/Origin (referral, prospection, existing client)

3. WHEN an Affaire Nouvelle reaches "Constitution" stage, THE Affaire_Nouvelle SHALL:
   - Verify client KYC status and display missing documents
   - Check MiFID questionnaire validity (alert if older than 12 months)
   - Generate checklist of required regulatory documents based on product type
   - Link to Document_Generator for one-click document creation

4. THE Affaire_Nouvelle SHALL require the following information based on product type:
   - **Assurance Vie / Capitalisation**: Investment supports allocation, beneficiary clause, payment mode
   - **PER**: Compartments selection (individual/collective), beneficiary clause, exit options
   - **SCPI/OPCI**: Number of shares, payment schedule, dismemberment option
   - **Compte-titres/PEA**: Initial allocation, management mandate type
   - **Private Equity**: Commitment amount, call schedule, lock-up period

5. THE Affaire_Nouvelle SHALL calculate and display:
   - Expected commission/fees for the advisor
   - Entry fees for the client
   - Ongoing management fees

6. WHEN an Affaire Nouvelle status changes, THE Operations_Manager SHALL:
   - Record the change with timestamp, user, and optional note
   - Update the Compliance_Timeline for the associated client
   - Send notification if configured (email/in-app)

7. THE Affaire_Nouvelle SHALL support document attachment for:
   - Signed subscription forms
   - Proof of funds (origine des fonds)
   - Provider confirmation letters
   - Any additional supporting documents

### Requirement 20: Affaires en Cours (Reprise)

**User Story:** As a CGP, I want to easily identify and resume incomplete deals, so that I can ensure no opportunity is lost and all pending actions are tracked.

#### Acceptance Criteria

1. THE Operations_Manager SHALL automatically categorize an Affaire Nouvelle as "En Cours" when:
   - Status is between "Qualification" and "Envoyé" (not yet submitted to provider)
   - More than 7 days have passed since last activity
   - Required documents are still missing

2. THE Operations_Manager SHALL display Affaires en Cours in a dedicated view with:
   - Days since last activity (with color coding: green <7d, orange 7-30d, red >30d)
   - Missing documents count
   - Next action required
   - Blocking issues (expired KYC, missing signature, etc.)

3. THE Operations_Manager SHALL provide quick actions for Affaires en Cours:
   - "Reprendre" : Open the deal for editing
   - "Relancer client" : Send reminder (linked to Alert_Engine)
   - "Mettre en pause" : Mark as intentionally paused with reason
   - "Annuler" : Cancel with reason (requires confirmation)

4. THE Operations_Manager SHALL generate alerts for Affaires en Cours:
   - WHEN an Affaire has no activity for 14 days, create "warning" alert
   - WHEN an Affaire has no activity for 30 days, create "high" alert
   - WHEN client KYC expires while Affaire is pending, create "critical" alert

5. THE Operations_Manager SHALL track "win rate" statistics:
   - Conversion rate from Prospect to Validé
   - Average time to completion by product type
   - Drop-off rate by stage
   - Rejection reasons analysis

### Requirement 21: Opérations de Gestion

**User Story:** As a CGP, I want to manage post-sale operations on existing contracts (switches, withdrawals, contributions), so that I can track all client interactions and maintain compliance documentation.

#### Acceptance Criteria

1. THE Operations_Manager SHALL support the following operation types in "Opérations de Gestion":
   - **Versement complémentaire** : Additional contribution to existing contract
   - **Arbitrage** : Fund switch within contract
   - **Rachat partiel** : Partial withdrawal
   - **Rachat total** : Full surrender
   - **Avance** : Policy loan
   - **Modification clause bénéficiaire** : Beneficiary change
   - **Changement d'option de gestion** : Management option change
   - **Transfert** : Contract transfer (PER, assurance vie under conditions)

2. WHEN creating an Opération de Gestion, THE Operations_Manager SHALL require:
   - Client selection
   - Existing contract selection (from client's portfolio)
   - Operation type
   - Amount (if applicable)
   - Effective date requested

3. THE Operations_Manager SHALL track Opérations de Gestion through workflow:
   - **Brouillon** : Draft, not yet submitted
   - **En attente signature** : Awaiting client signature
   - **Envoyé** : Sent to provider
   - **En traitement** : Being processed
   - **Exécuté** : Completed successfully
   - **Rejeté** : Rejected (with reason)

4. FOR Arbitrage operations, THE Operations_Manager SHALL require:
   - Source funds selection (which supports to sell)
   - Target funds selection (which supports to buy)
   - Amount or percentage to switch
   - Arbitrage type (ponctuel, programmé)

5. FOR Rachat operations, THE Operations_Manager SHALL:
   - Display current contract value
   - Calculate tax implications based on contract age and gains
   - Warn if rachat affects ongoing benefits (prévoyance, garantie plancher)
   - Require destination account (RIB) verification

6. FOR Versement complémentaire, THE Operations_Manager SHALL:
   - Verify if client situation has changed significantly (trigger Recueil update)
   - Check if investment profile is still adequate
   - Apply same allocation as initial or allow new allocation

7. THE Operations_Manager SHALL link each Opération de Gestion to:
   - The original Affaire Nouvelle that created the contract
   - All subsequent operations on the same contract
   - Generated compliance documents (Fiche Conseil, Déclaration d'Adéquation)

### Requirement 22: Génération Documents par Type d'Opération

**User Story:** As a CGP, I want the system to automatically determine and generate the appropriate regulatory documents based on the operation type, so that I can ensure compliance without manually determining which documents are required.

#### Acceptance Criteria

1. WHEN creating an Affaire Nouvelle (new subscription), THE Document_Generator SHALL require/suggest based on context:
   - **Toujours requis**:
     - Lettre de Mission (if not already signed for this client)
     - Recueil d'Informations Client (if not up to date or >12 months)
     - Questionnaire MiFID II / Profil investisseur (if not completed or >12 months)
     - Déclaration d'Adéquation (suitability statement)
   - **Si première relation**:
     - Document d'Entrée en Relation (DER)
   - **Selon produit**:
     - Bulletin de souscription (provider-specific form)
     - Annexe financière (for unit-linked products)
     - Justificatif origine des fonds (if amount > threshold or risk profile)

2. WHEN creating an Arbitrage, THE Document_Generator SHALL require:
   - Fiche Conseil / Rapport de Mission (justifying the switch)
   - Déclaration d'Adéquation (confirming suitability)
   - Ordre d'arbitrage (switch order form)

3. WHEN creating a Rachat (withdrawal), THE Document_Generator SHALL require:
   - Demande de rachat (withdrawal request form)
   - Fiche Conseil (if partial withdrawal with reinvestment advice)
   - Simulation fiscale (tax impact document)

4. WHEN creating a Versement complémentaire, THE Document_Generator SHALL require:
   - Déclaration d'Adéquation (if allocation changes)
   - Bulletin de versement complémentaire
   - Mise à jour Recueil d'Informations (if significant change flagged)

5. THE Operations_Manager SHALL display a compliance checklist for each operation showing:
   - Document name
   - Status: Généré / En attente / Manquant / Expiré
   - Generation date (if applicable)
   - Signature status (if applicable)
   - Quick action buttons (Generate, View, Send for signature)

6. THE Operations_Manager SHALL block operation submission when:
   - Required documents are missing (status "Manquant")
   - KYC documents are expired
   - MiFID questionnaire is outdated (>12 months)
   - Display clear message explaining what is blocking

7. THE Operations_Manager SHALL allow override of blocking with:
   - Supervisor approval (for cabinet with multiple users)
   - Documented justification (stored in audit log)
   - Time-limited exception (must be resolved within X days)

8. WHEN all required documents are generated and signed, THE Operations_Manager SHALL:
   - Update operation status to allow submission
   - Generate a compliance summary document
   - Link all documents to the operation record

### Requirement 23: Pilotage Commercial et Reporting

**User Story:** As a CGP, I want comprehensive dashboards and reports on my operations, so that I can pilot my commercial activity and analyze my performance.

#### Acceptance Criteria

1. THE Operations_Manager SHALL provide a "Pilotage" dashboard displaying:
   - **Pipeline commercial**: Total value of Affaires Nouvelles by stage
   - **Taux de transformation**: Conversion rate from Prospect to Validé
   - **Délai moyen**: Average time to close by product type
   - **Encours sous gestion**: Total AUM from validated operations
   - **Commissions prévisionnelles**: Expected commissions from pipeline

2. THE Operations_Manager SHALL calculate and display KPIs:
   - Number of new clients acquired (period)
   - Number of operations by type (period)
   - Total collected amounts by product type
   - Average ticket size by product type
   - Top providers by volume

3. THE Operations_Manager SHALL provide filtering and grouping by:
   - Date range (custom, MTD, QTD, YTD)
   - Product type
   - Provider
   - Client segment (if defined)
   - Operation status
   - Advisor (for multi-advisor cabinets)

4. THE Operations_Manager SHALL generate exportable reports:
   - Operations list (Excel/CSV)
   - Pipeline report (PDF)
   - Commission statement (PDF)
   - Compliance summary (PDF for audits)

5. THE Operations_Manager SHALL provide trend analysis:
   - Month-over-month comparison
   - Year-over-year comparison
   - Seasonal patterns identification

6. THE Operations_Manager SHALL integrate with Client_360_View to show:
   - Client's complete operation history
   - Total relationship value
   - Product diversification
   - Last interaction date

### Requirement 24: Intégration Fournisseurs et Catalogue Produits

**User Story:** As a CGP, I want a comprehensive database of providers and their products, so that I can quickly select appropriate solutions and access provider-specific requirements.

#### Acceptance Criteria

1. THE Operations_Manager SHALL maintain a Provider database with:
   - Company name and legal information (SIREN, address)
   - Provider type (Assureur, Société de gestion, Banque, Plateforme)
   - Contact information (commercial contact, back-office contact)
   - Extranet/portal URL and access notes
   - Commission grid reference
   - Convention de distribution status (active/inactive)

2. THE Operations_Manager SHALL maintain a Product catalog linked to providers:
   - Product name and code
   - Product type (Assurance Vie, PER, SCPI, etc.)
   - Key characteristics (frais entrée, frais gestion, options)
   - Available investment supports (for unit-linked)
   - Minimum investment amounts
   - Document templates specific to product

3. WHEN creating an operation, THE Affaire_Nouvelle SHALL:
   - Filter available products based on selected provider
   - Display product characteristics summary
   - Pre-fill provider-specific form fields
   - Link to provider extranet for submission (if applicable)

4. THE Operations_Manager SHALL track provider relationships:
   - Total volume placed with each provider
   - Number of active contracts per provider
   - Average processing time per provider
   - Rejection rate per provider

5. THE Operations_Manager SHALL allow CGPs to:
   - Add custom providers not in default database
   - Mark favorite providers for quick access
   - Add notes/comments on provider experience
   - Flag providers with issues (slow processing, frequent rejections)

6. THE Template_Manager SHALL support provider-specific document templates:
   - Subscription forms with provider branding
   - Pre-filled fields based on provider requirements
   - Specific regulatory mentions required by provider

### Requirement 25: Lien Conformité-Opérations

**User Story:** As a CGP, I want operations and compliance to be fully integrated, so that I can ensure regulatory requirements are met throughout the client lifecycle.

#### Acceptance Criteria

1. THE Operations_Manager SHALL verify compliance status before allowing operation creation:
   - KYC documents validity (all required documents valid and not expired)
   - MiFID questionnaire validity (<12 months)
   - LCB-FT controls status (no pending high-risk alerts)
   - Display clear compliance status indicator (green/orange/red)

2. WHEN compliance issues are detected, THE Operations_Manager SHALL:
   - Display specific issues with links to resolve them
   - Provide quick actions (e.g., "Mettre à jour KYC", "Compléter questionnaire MiFID")
   - Allow operation creation in "draft" mode but block submission

3. THE Compliance_Dashboard SHALL display operations-related metrics:
   - Operations blocked due to compliance issues
   - Operations with pending compliance documents
   - Clients with operations but incomplete KYC

4. THE Client_360_View SHALL display integrated view:
   - Compliance status summary
   - Active operations list
   - Contract portfolio
   - Document checklist with status

5. THE Compliance_Timeline SHALL record all operation events:
   - Operation created (with type and amount)
   - Status changes
   - Documents generated
   - Signatures obtained
   - Provider submissions and responses

6. THE Alert_Engine SHALL create compliance alerts for operations:
   - WHEN operation is pending and KYC expires, create "critical" alert
   - WHEN operation requires document that is missing, create "high" alert
   - WHEN operation is blocked for >7 days due to compliance, create "warning" alert

7. THE Control_Manager SHALL link periodic controls to operations:
   - Flag clients with recent large operations for enhanced due diligence
   - Trigger automatic control creation for high-value operations
   - Link control findings to operation records
