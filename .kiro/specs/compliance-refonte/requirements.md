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
- **Client_360_View** : Vue complète du profil client incluant la section conformité
- **Dossier_View** : Vue d'un dossier client avec documents associés
- **Client** : Personne physique ou morale suivie par le conseiller
- **CGP** : Conseiller en Gestion de Patrimoine (utilisateur principal)
- **SLA** : Service Level Agreement - délais réglementaires de traitement
- **PPE** : Personne Politiquement Exposée
- **ACPR** : Autorité de Contrôle Prudentiel et de Résolution

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
