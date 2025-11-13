# Document de Design - CRM Patrimonial avec PostgreSQL et Prisma

## Vue d'Ensemble

Ce document décrit l'architecture complète de la base de données PostgreSQL avec Prisma pour le CRM Patrimonial. Le système est conçu pour être multi-tenant avec isolation totale des données par cabinet, historisation complète, et support de toutes les fonctionnalités métier d'un cabinet de gestion de patrimoine.

## Architecture Globale

### Principes de Design

1. **Multi-tenant avec isolation stricte** : Chaque entité contient un `cabinetId` pour garantir l'isolation des données
2. **Historisation complète** : Toutes les modifications sont tracées via des tables d'audit
3. **Relations flexibles** : Support des relations many-to-many (actifs partagés, documents liés à plusieurs entités)
4. **Performance** : Index optimisés pour les requêtes fréquentes
5. **Conformité** : Support RGPD, MiFID II, TRACFIN
6. **Extensibilité** : Champs JSON pour données métier spécifiques

### Stack Technique

- **Base de données** : PostgreSQL 15+
- **ORM** : Prisma 5+
- **Migrations** : Prisma Migrate
- **Sécurité** : Row Level Security (RLS) PostgreSQL + Middleware Prisma

## Schéma Prisma Complet

Le schéma est organisé en modules fonctionnels pour faciliter la maintenance.


## Module 1 : Gestion Multi-Tenant et Utilisateurs

### 1.1 SuperAdmin

```prisma
model SuperAdmin {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Hashé avec bcrypt
  firstName String
  lastName  String
  role      SuperAdminRole @default(ADMIN)
  
  // Permissions
  permissions Json // Structure flexible pour permissions détaillées
  
  // Statut
  isActive  Boolean  @default(true)
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastLogin DateTime?
  
  // Relations
  auditLogs AuditLog[]
  
  @@index([email])
  @@index([isActive])
  @@map("super_admins")
}

enum SuperAdminRole {
  OWNER      // Propriétaire - accès complet
  ADMIN      // Administrateur - gestion quotidienne
  DEVELOPER  // Développeur - accès technique
  SUPPORT    // Support - lecture + support client
}
```

### 1.2 Cabinet (Organisation)

```prisma
model Cabinet {
  id    String @id @default(cuid())
  name  String
  slug  String @unique
  email String
  phone String?
  
  // Adresse
  address Json? // { street, city, postalCode, country }
  
  // Abonnement
  plan              SubscriptionPlan @default(TRIAL)
  status            CabinetStatus    @default(TRIALING)
  subscriptionStart DateTime?
  subscriptionEnd   DateTime?
  trialEndsAt       DateTime?
  
  // Quotas (limites du plan)
  quotas Json // { maxAdvisors, maxClientsPerAdvisor, maxAssistants, maxStorageGB, maxAPICallsPerMonth }
  
  // Usage actuel
  usage Json // { advisorsCount, assistantsCount, clientsCount, storageUsedGB, apiCallsThisMonth, lastUpdated }
  
  // Features activées
  features Json // { advancedSimulations, unlimitedPDFExports, apiAccess, whitelabel, prioritySupport, customIntegrations }
  
  // Restrictions
  restrictions Json // { canCreateAdvisors, canCreateClients, canExportData, canAccessAPI }
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  // Ref: SuperAdmin
  
  // Relations
  users            User[]
  clients          Client[]
  actifs           Actif[]
  passifs          Passif[]
  documents        Document[]
  taches           Tache[]
  rendezvous       RendezVous[]
  objectifs        Objectif[]
  projets          Projet[]
  opportunites     Opportunite[]
  campagnes        Campagne[]
  emails           Email[]
  notifications    Notification[]
  templates        Template[]
  apporteurs       ApporteurAffaires[]
  simulations      Simulation[]
  auditLogs        AuditLog[]
  
  @@index([slug])
  @@index([status])
  @@index([plan])
  @@map("cabinets")
}

enum SubscriptionPlan {
  TRIAL
  STARTER
  BUSINESS
  PREMIUM
  ENTERPRISE
  CUSTOM
}

enum CabinetStatus {
  ACTIVE
  RESTRICTED
  SUSPENDED
  TERMINATED
  TRIALING
}
```


### 1.3 User (Conseiller, Assistant, Admin Cabinet)

```prisma
model User {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  // Identité
  email     String   @unique
  password  String   // Hashé avec bcrypt
  firstName String
  lastName  String
  phone     String?
  avatar    String?
  
  // Rôle dans le cabinet
  role      UserRole @default(ADVISOR)
  
  // Permissions détaillées
  permissions Json // Structure flexible par rôle
  
  // Statistiques
  stats Json? // { clientsCount, activeClientsCount, totalAUM, lastActivityDate }
  
  // Préférences
  preferences Json? // { language, timezone, notifications, dashboardLayout }
  
  // Statut
  isActive  Boolean  @default(true)
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastLogin DateTime?
  
  // Relations
  clientsPrincipaux     Client[]              @relation("ConseillerPrincipal")
  clientsRemplacants    Client[]              @relation("ConseillerRemplacant")
  assistantAssignments  AssistantAssignment[]
  taches                Tache[]
  rendezvous            RendezVous[]
  opportunites          Opportunite[]
  campagnes             Campagne[]
  emails                Email[]
  documents             Document[]            @relation("UploadedBy")
  apporteurs            ApporteurAffaires[]
  simulations           Simulation[]
  auditLogs             AuditLog[]
  
  @@index([cabinetId])
  @@index([cabinetId, role])
  @@index([email])
  @@index([isActive])
  @@map("users")
}

enum UserRole {
  ADMIN      // Admin Cabinet - gestion complète du cabinet
  ADVISOR    // Conseiller - gestion de ses clients
  ASSISTANT  // Assistant - accès aux dossiers assignés
}
```

### 1.4 Assistant Assignment (Relation Many-to-Many)

```prisma
model AssistantAssignment {
  id          String   @id @default(cuid())
  cabinetId   String
  assistantId String
  advisorId   String
  
  assistant   User     @relation(fields: [assistantId], references: [id], onDelete: Cascade)
  
  // Permissions spécifiques pour cet assistant sur les dossiers de ce conseiller
  permissions Json // { canEdit, canDelete, canExport, specificClients: [] }
  
  // Métadonnées
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([assistantId, advisorId])
  @@index([cabinetId])
  @@index([assistantId])
  @@index([advisorId])
  @@map("assistant_assignments")
}
```

### 1.5 Apporteur d'Affaires

```prisma
model ApporteurAffaires {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  // Propriétaire (conseiller ou cabinet)
  ownerId   String?  // Si null = apporteur du cabinet, sinon = apporteur du conseiller
  owner     User?    @relation(fields: [ownerId], references: [id], onDelete: SetNull)
  
  // Type d'apporteur
  type      ApporteurType
  
  // Identité
  firstName String
  lastName  String
  email     String
  phone     String?
  company   String?
  
  // Profession
  profession String? // Notaire, Expert-comptable, Banquier, etc.
  
  // Conditions commerciales
  commissionRate Decimal? @db.Decimal(5, 2) // Pourcentage de commission
  
  // Statistiques
  stats Json? // { totalApports, totalCommissions, activeClients }
  
  // Statut
  isActive  Boolean  @default(true)
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  clients   Client[]
  
  @@index([cabinetId])
  @@index([ownerId])
  @@index([type])
  @@map("apporteurs_affaires")
}

enum ApporteurType {
  NOTAIRE
  EXPERT_COMPTABLE
  BANQUIER
  COURTIER
  AUTRE
}
```


## Module 2 : Gestion des Clients

### 2.1 Client (Particulier)

```prisma
model Client {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  // Conseiller principal
  conseillerId String
  conseiller   User   @relation("ConseillerPrincipal", fields: [conseillerId], references: [id])
  
  // Conseiller remplaçant (temporaire)
  conseillerRemplacantId String?
  conseillerRemplacant   User?   @relation("ConseillerRemplacant", fields: [conseillerRemplacantId], references: [id])
  
  // Apporteur d'affaires
  apporteurId String?
  apporteur   ApporteurAffaires? @relation(fields: [apporteurId], references: [id], onDelete: SetNull)
  
  // Identité
  email       String?
  firstName   String
  lastName    String
  birthDate   DateTime?
  birthPlace  String?
  nationality String?
  phone       String?
  mobile      String?
  
  // Adresse
  address Json? // { street, city, postalCode, country }
  
  // Situation familiale
  maritalStatus    MaritalStatus?
  marriageRegime   String? // Communauté, Séparation de biens, etc.
  numberOfChildren Int?    @default(0)
  
  // Situation professionnelle
  profession       String?
  employerName     String?
  professionalStatus String? // Salarié, Indépendant, Retraité, etc.
  
  // Situation fiscale
  annualIncome     Decimal? @db.Decimal(12, 2)
  taxBracket       String?
  fiscalResidence  String?
  
  // Profil investisseur (MiFID II)
  riskProfile       RiskProfile?
  investmentHorizon InvestmentHorizon?
  investmentGoals   Json? // Array de goals
  
  // Patrimoine (calculé)
  wealth Json? // { totalAssets, totalLiabilities, netWealth, lastCalculated }
  
  // KYC et Conformité
  kycStatus         KYCStatus @default(PENDING)
  kycCompletedAt    DateTime?
  kycNextReviewDate DateTime?
  
  // Statut client
  status ClientStatus @default(PROSPECT)
  
  // Portail client
  portalAccess Boolean  @default(false)
  portalPassword String?
  lastPortalLogin DateTime?
  
  // Métadonnées
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastContactDate DateTime?
  
  // Relations
  familyMembers   FamilyMember[]
  actifs          ClientActif[]
  passifs         Passif[]
  contrats        Contrat[]
  objectifs       Objectif[]
  projets         Projet[]
  opportunites    Opportunite[]
  taches          Tache[]
  rendezvous      RendezVous[]
  documents       ClientDocument[]
  emails          Email[]
  notifications   Notification[]
  simulations     Simulation[]
  kycDocuments    KYCDocument[]
  consentements   Consentement[]
  reclamations    Reclamation[]
  timelineEvents  TimelineEvent[]
  
  @@index([cabinetId])
  @@index([conseillerId])
  @@index([cabinetId, conseillerId])
  @@index([status])
  @@index([kycStatus])
  @@index([email])
  @@map("clients")
}

enum MaritalStatus {
  SINGLE
  MARRIED
  DIVORCED
  WIDOWED
  PACS
  COHABITATION
}

enum RiskProfile {
  CONSERVATIVE
  BALANCED
  DYNAMIC
  AGGRESSIVE
}

enum InvestmentHorizon {
  SHORT    // < 3 ans
  MEDIUM   // 3-10 ans
  LONG     // > 10 ans
}

enum KYCStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  EXPIRED
  REJECTED
}

enum ClientStatus {
  PROSPECT
  ACTIVE
  INACTIVE
  ARCHIVED
  LOST
}
```

### 2.2 Family Member (Membres de la Famille)

```prisma
model FamilyMember {
  id        String   @id @default(cuid())
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Identité
  firstName String
  lastName  String
  birthDate DateTime?
  
  // Relation
  relationship FamilyRelationship
  
  // Est-ce aussi un client ?
  linkedClientId String?
  
  // Bénéficiaire
  isBeneficiary Boolean @default(false)
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([clientId])
  @@map("family_members")
}

enum FamilyRelationship {
  SPOUSE
  CHILD
  PARENT
  SIBLING
  GRANDCHILD
  OTHER
}
```


## Module 3 : Gestion du Patrimoine

### 3.1 Actif (Asset)

```prisma
model Actif {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  // Type et catégorie
  type     ActifType
  category ActifCategory
  
  // Détails généraux
  name        String
  description String?
  value       Decimal  @db.Decimal(15, 2)
  
  // Acquisition
  acquisitionDate  DateTime?
  acquisitionValue Decimal?  @db.Decimal(15, 2)
  
  // Détails spécifiques (JSON flexible)
  details Json? // Structure varie selon le type
  
  // Revenus générés
  annualIncome Decimal? @db.Decimal(12, 2)
  
  // Fiscalité
  taxDetails Json? // { regime, deductions, etc. }
  
  // Statut
  isActive Boolean @default(true)
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations many-to-many avec clients (pour biens en indivision)
  clients   ClientActif[]
  documents ActifDocument[]
  
  @@index([cabinetId])
  @@index([type])
  @@index([category])
  @@map("actifs")
}

// Table de liaison pour actifs partagés
model ClientActif {
  id       String  @id @default(cuid())
  clientId String
  actifId  String
  
  client   Client  @relation(fields: [clientId], references: [id], onDelete: Cascade)
  actif    Actif   @relation(fields: [actifId], references: [id], onDelete: Cascade)
  
  // Pourcentage de détention
  ownershipPercentage Decimal @db.Decimal(5, 2) @default(100.00)
  
  // Type de détention
  ownershipType String? // Pleine propriété, Usufruit, Nue-propriété
  
  createdAt DateTime @default(now())
  
  @@unique([clientId, actifId])
  @@index([clientId])
  @@index([actifId])
  @@map("client_actifs")
}

enum ActifType {
  // Immobilier
  REAL_ESTATE_MAIN
  REAL_ESTATE_RENTAL
  REAL_ESTATE_SECONDARY
  SCPI
  SCI
  
  // Financier
  LIFE_INSURANCE
  SECURITIES_ACCOUNT
  PEA
  PEA_PME
  BANK_ACCOUNT
  SAVINGS_ACCOUNT
  PEL
  CEL
  
  // Retraite
  PER
  PERP
  MADELIN
  ARTICLE_83
  
  // Professionnel
  COMPANY_SHARES
  PROFESSIONAL_REAL_ESTATE
  
  // Autres
  PRECIOUS_METALS
  ART_COLLECTION
  CRYPTO
  OTHER
}

enum ActifCategory {
  IMMOBILIER
  FINANCIER
  PROFESSIONNEL
  AUTRE
}
```

### 3.2 Passif (Liability)

```prisma
model Passif {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Type
  type PassifType
  
  // Détails
  name             String
  description      String?
  initialAmount    Decimal @db.Decimal(15, 2)
  remainingAmount  Decimal @db.Decimal(15, 2)
  interestRate     Decimal @db.Decimal(5, 2)
  monthlyPayment   Decimal @db.Decimal(12, 2)
  
  // Dates
  startDate DateTime
  endDate   DateTime
  
  // Lié à un actif ?
  linkedActifId String?
  
  // Assurance emprunteur
  insurance Json? // { provider, premium, coverage }
  
  // Statut
  isActive Boolean @default(true)
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  documents PassifDocument[]
  
  @@index([cabinetId])
  @@index([clientId])
  @@index([type])
  @@map("passifs")
}

enum PassifType {
  MORTGAGE
  CONSUMER_LOAN
  PROFESSIONAL_LOAN
  REVOLVING_CREDIT
  BRIDGE_LOAN
  OTHER
}
```

### 3.3 Contrat (Insurance, Investment Contracts)

```prisma
model Contrat {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Type
  type ContratType
  
  // Détails
  name           String
  provider       String  // Compagnie d'assurance
  contractNumber String?
  
  // Dates
  startDate DateTime
  endDate   DateTime?
  
  // Montants
  premium  Decimal? @db.Decimal(12, 2) // Prime annuelle
  coverage Decimal? @db.Decimal(15, 2) // Montant couvert
  value    Decimal? @db.Decimal(15, 2) // Valeur actuelle (pour contrats capitalisants)
  
  // Bénéficiaires
  beneficiaries Json? // Array de { name, relationship, percentage }
  
  // Détails spécifiques
  details Json?
  
  // Commissions
  commission Decimal? @db.Decimal(12, 2)
  
  // Échéances
  nextRenewalDate DateTime?
  
  // Statut
  status ContratStatus @default(ACTIVE)
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  documents ContratDocument[]
  
  @@index([cabinetId])
  @@index([clientId])
  @@index([type])
  @@index([status])
  @@map("contrats")
}

enum ContratType {
  LIFE_INSURANCE
  HEALTH_INSURANCE
  HOME_INSURANCE
  CAR_INSURANCE
  PROFESSIONAL_INSURANCE
  DEATH_INSURANCE
  DISABILITY_INSURANCE
  RETIREMENT_SAVINGS
  OTHER
}

enum ContratStatus {
  ACTIVE
  SUSPENDED
  TERMINATED
  EXPIRED
}
```


## Module 4 : Documents et GED

### 4.1 Document

```prisma
model Document {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  // Métadonnées du fichier
  name        String
  description String?
  fileUrl     String
  fileSize    Int     // En bytes
  mimeType    String
  
  // Type et catégorie
  type     DocumentType
  category DocumentCategory?
  
  // Tags
  tags Json? // Array de tags
  
  // Versioning
  version       Int     @default(1)
  parentVersion String? // ID du document parent si c'est une nouvelle version
  
  // Upload
  uploadedById String
  uploadedBy   User    @relation("UploadedBy", fields: [uploadedById], references: [id])
  uploadedAt   DateTime @default(now())
  
  // Signature électronique
  signatureStatus   SignatureStatus?
  signatureProvider String? // DocuSign, etc.
  signedAt          DateTime?
  signedBy          Json? // Array de signataires
  
  // Sécurité
  isConfidential Boolean @default(false)
  accessLevel    String  @default("NORMAL") // NORMAL, RESTRICTED, CONFIDENTIAL
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations many-to-many
  clients  ClientDocument[]
  actifs   ActifDocument[]
  passifs  PassifDocument[]
  contrats ContratDocument[]
  projets  ProjetDocument[]
  taches   TacheDocument[]
  
  @@index([cabinetId])
  @@index([type])
  @@index([uploadedById])
  @@map("documents")
}

// Tables de liaison pour documents
model ClientDocument {
  id         String   @id @default(cuid())
  clientId   String
  documentId String
  
  client     Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  createdAt  DateTime @default(now())
  
  @@unique([clientId, documentId])
  @@index([clientId])
  @@index([documentId])
  @@map("client_documents")
}

model ActifDocument {
  id         String   @id @default(cuid())
  actifId    String
  documentId String
  
  actif      Actif    @relation(fields: [actifId], references: [id], onDelete: Cascade)
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  createdAt  DateTime @default(now())
  
  @@unique([actifId, documentId])
  @@map("actif_documents")
}

model PassifDocument {
  id         String   @id @default(cuid())
  passifId   String
  documentId String
  
  passif     Passif   @relation(fields: [passifId], references: [id], onDelete: Cascade)
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  createdAt  DateTime @default(now())
  
  @@unique([passifId, documentId])
  @@map("passif_documents")
}

model ContratDocument {
  id         String   @id @default(cuid())
  contratId  String
  documentId String
  
  contrat    Contrat  @relation(fields: [contratId], references: [id], onDelete: Cascade)
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  createdAt  DateTime @default(now())
  
  @@unique([contratId, documentId])
  @@map("contrat_documents")
}

enum DocumentType {
  // KYC et Conformité
  ID_CARD
  PASSPORT
  PROOF_OF_ADDRESS
  TAX_NOTICE
  BANK_STATEMENT
  
  // Patrimoine
  PROPERTY_DEED
  LOAN_AGREEMENT
  INSURANCE_POLICY
  INVESTMENT_STATEMENT
  
  // Réglementaire
  ENTRY_AGREEMENT
  MISSION_LETTER
  ADEQUACY_DECLARATION
  INVESTOR_PROFILE
  ANNUAL_REPORT
  
  // Communication
  EMAIL_ATTACHMENT
  MEETING_MINUTES
  PROPOSAL
  
  // Autres
  CONTRACT
  INVOICE
  OTHER
}

enum DocumentCategory {
  IDENTITE
  FISCAL
  PATRIMOINE
  REGLEMENTAIRE
  COMMERCIAL
  AUTRE
}

enum SignatureStatus {
  PENDING
  SIGNED
  REJECTED
  EXPIRED
}
```

### 4.2 KYC Document

```prisma
model KYCDocument {
  id        String   @id @default(cuid())
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Type de document KYC
  type         KYCDocumentType
  documentId   String? // Lien vers Document si stocké
  
  // Validation
  status       KYCDocStatus @default(PENDING)
  validatedAt  DateTime?
  validatedBy  String?
  expiresAt    DateTime?
  
  // Métadonnées
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([clientId])
  @@index([status])
  @@map("kyc_documents")
}

enum KYCDocumentType {
  IDENTITY
  PROOF_OF_ADDRESS
  TAX_NOTICE
  BANK_RIB
  WEALTH_JUSTIFICATION
  ORIGIN_OF_FUNDS
  OTHER
}

enum KYCDocStatus {
  PENDING
  VALIDATED
  REJECTED
  EXPIRED
}
```


## Module 5 : Objectifs et Projets

### 5.1 Objectif

```prisma
model Objectif {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Type d'objectif
  type ObjectifType
  
  // Détails
  name         String
  description  String?
  targetAmount Decimal  @db.Decimal(15, 2)
  targetDate   DateTime
  
  // Progression
  currentAmount Decimal? @db.Decimal(15, 2) @default(0)
  progress      Int?     @default(0) // Pourcentage 0-100
  
  // Priorité
  priority ObjectifPriority @default(MEDIUM)
  
  // Recommandations
  monthlyContribution Decimal? @db.Decimal(12, 2)
  recommendations     Json? // Array de recommandations
  
  // Statut
  status ObjectifStatus @default(ACTIVE)
  
  // Métadonnées
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  achievedAt  DateTime?
  
  @@index([cabinetId])
  @@index([clientId])
  @@index([type])
  @@index([status])
  @@map("objectifs")
}

enum ObjectifType {
  RETIREMENT
  REAL_ESTATE_PURCHASE
  EDUCATION
  WEALTH_TRANSMISSION
  TAX_OPTIMIZATION
  INCOME_GENERATION
  CAPITAL_PROTECTION
  OTHER
}

enum ObjectifPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum ObjectifStatus {
  ACTIVE
  ACHIEVED
  CANCELLED
  ON_HOLD
}
```

### 5.2 Projet

```prisma
model Projet {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Détails
  name        String
  description String?
  type        ProjetType
  
  // Budget
  estimatedBudget Decimal? @db.Decimal(15, 2)
  actualBudget    Decimal? @db.Decimal(15, 2)
  
  // Dates
  startDate  DateTime?
  targetDate DateTime?
  endDate    DateTime?
  
  // Progression
  progress Int @default(0) // 0-100
  
  // Statut
  status ProjetStatus @default(PLANNED)
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  taches    Tache[]
  documents ProjetDocument[]
  
  @@index([cabinetId])
  @@index([clientId])
  @@index([status])
  @@map("projets")
}

model ProjetDocument {
  id         String   @id @default(cuid())
  projetId   String
  documentId String
  
  projet     Projet   @relation(fields: [projetId], references: [id], onDelete: Cascade)
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  createdAt  DateTime @default(now())
  
  @@unique([projetId, documentId])
  @@map("projet_documents")
}

enum ProjetType {
  REAL_ESTATE_PURCHASE
  BUSINESS_CREATION
  RETIREMENT_PREPARATION
  WEALTH_RESTRUCTURING
  TAX_OPTIMIZATION
  SUCCESSION_PLANNING
  OTHER
}

enum ProjetStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  ON_HOLD
}
```


## Module 6 : Opportunités et Pipeline Commercial

### 6.1 Opportunité

```prisma
model Opportunite {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  conseillerId String
  conseiller   User   @relation(fields: [conseillerId], references: [id])
  
  clientId String
  client   Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Type d'opportunité
  type OpportuniteType
  
  // Détails
  name        String
  description String?
  
  // Valeur estimée
  estimatedValue Decimal? @db.Decimal(15, 2)
  
  // Scoring
  score      Int?     @default(0) // 0-100
  confidence Decimal? @db.Decimal(5, 2) // Pourcentage de confiance
  priority   OpportunitePriority @default(MEDIUM)
  
  // Pipeline
  status OpportuniteStatus @default(DETECTED)
  stage  String? // Étape personnalisée du pipeline
  
  // Dates importantes
  detectedAt      DateTime  @default(now())
  qualifiedAt     DateTime?
  contactedAt     DateTime?
  presentedAt     DateTime?
  acceptedAt      DateTime?
  convertedAt     DateTime?
  rejectedAt      DateTime?
  actionDeadline  DateTime?
  
  // Raison de rejet
  rejectionReason String?
  
  // Conversion
  convertedToProjetId String?
  
  // Historique des actions
  actions Json? // Array de { date, action, userId, notes }
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([cabinetId])
  @@index([conseillerId])
  @@index([clientId])
  @@index([status])
  @@index([type])
  @@map("opportunites")
}

enum OpportuniteType {
  LIFE_INSURANCE
  RETIREMENT_SAVINGS
  REAL_ESTATE_INVESTMENT
  SECURITIES_INVESTMENT
  TAX_OPTIMIZATION
  LOAN_RESTRUCTURING
  WEALTH_TRANSMISSION
  INSURANCE_REVIEW
  OTHER
}

enum OpportunitePriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum OpportuniteStatus {
  DETECTED
  QUALIFIED
  CONTACTED
  PRESENTED
  ACCEPTED
  CONVERTED
  REJECTED
  LOST
}
```


## Module 7 : Tâches et Agenda

### 7.1 Tâche

```prisma
model Tache {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  // Assignation
  assignedToId String
  assignedTo   User   @relation(fields: [assignedToId], references: [id])
  
  // Client lié
  clientId String?
  client   Client? @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Projet lié
  projetId String?
  projet   Projet? @relation(fields: [projetId], references: [id], onDelete: SetNull)
  
  // Détails
  title       String
  description String?
  type        TacheType
  
  // Priorité et statut
  priority TachePriority @default(MEDIUM)
  status   TacheStatus   @default(TODO)
  
  // Dates
  dueDate     DateTime?
  completedAt DateTime?
  
  // Rappels
  reminderDate DateTime?
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  documents TacheDocument[]
  
  @@index([cabinetId])
  @@index([assignedToId])
  @@index([clientId])
  @@index([status])
  @@index([dueDate])
  @@map("taches")
}

model TacheDocument {
  id         String   @id @default(cuid())
  tacheId    String
  documentId String
  
  tache      Tache    @relation(fields: [tacheId], references: [id], onDelete: Cascade)
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  createdAt  DateTime @default(now())
  
  @@unique([tacheId, documentId])
  @@map("tache_documents")
}

enum TacheType {
  CALL
  EMAIL
  MEETING
  DOCUMENT_REVIEW
  KYC_UPDATE
  CONTRACT_RENEWAL
  FOLLOW_UP
  ADMINISTRATIVE
  OTHER
}

enum TachePriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TacheStatus {
  TODO
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

### 7.2 Rendez-Vous

```prisma
model RendezVous {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  // Conseiller
  conseillerId String
  conseiller   User   @relation(fields: [conseillerId], references: [id])
  
  // Client
  clientId String?
  client   Client? @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Détails
  title       String
  description String?
  type        RendezVousType
  
  // Date et heure
  startDate DateTime
  endDate   DateTime
  
  // Lieu
  location     String?
  isVirtual    Boolean @default(false)
  meetingUrl   String?
  
  // Statut
  status RendezVousStatus @default(SCHEDULED)
  
  // Rappels
  reminderSent Boolean @default(false)
  
  // Compte-rendu
  notes        String?
  hasMinutes   Boolean @default(false)
  minutesDocId String?
  
  // Synchronisation calendrier externe
  externalCalendarId String?
  externalEventId    String?
  
  // Métadonnées
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  cancelledAt DateTime?
  
  @@index([cabinetId])
  @@index([conseillerId])
  @@index([clientId])
  @@index([startDate])
  @@index([status])
  @@map("rendez_vous")
}

enum RendezVousType {
  FIRST_MEETING
  FOLLOW_UP
  ANNUAL_REVIEW
  SIGNING
  PHONE_CALL
  VIDEO_CALL
  OTHER
}

enum RendezVousStatus {
  SCHEDULED
  CONFIRMED
  COMPLETED
  CANCELLED
  NO_SHOW
}
```

### 7.3 Calendar Sync (Synchronisation Outlook/Google)

```prisma
model CalendarSync {
  id        String   @id @default(cuid())
  userId    String   @unique
  
  // Provider
  provider  CalendarProvider
  
  // Tokens OAuth
  accessToken  String
  refreshToken String?
  expiresAt    DateTime?
  
  // Configuration
  calendarId   String? // ID du calendrier externe
  syncEnabled  Boolean @default(true)
  
  // Dernière synchronisation
  lastSyncAt   DateTime?
  lastSyncStatus String?
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
  @@map("calendar_syncs")
}

enum CalendarProvider {
  OUTLOOK
  GOOGLE
  APPLE
}
```


## Module 8 : Communications

### 8.1 Email

```prisma
model Email {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  // Expéditeur (conseiller)
  senderId String
  sender   User   @relation(fields: [senderId], references: [id])
  
  // Destinataire (client)
  clientId String?
  client   Client? @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Contenu
  subject String
  body    String  @db.Text
  
  // Destinataires
  to  Json // Array d'emails
  cc  Json? // Array d'emails
  bcc Json? // Array d'emails
  
  // Pièces jointes
  attachments Json? // Array de { name, url, size }
  
  // Statut
  status EmailStatus @default(DRAFT)
  
  // Tracking
  sentAt     DateTime?
  openedAt   DateTime?
  clickedAt  DateTime?
  
  // Template utilisé
  templateId String?
  
  // Campagne liée
  campagneId String?
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([cabinetId])
  @@index([senderId])
  @@index([clientId])
  @@index([status])
  @@index([sentAt])
  @@map("emails")
}

enum EmailStatus {
  DRAFT
  SCHEDULED
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  FAILED
}
```

### 8.2 Notification

```prisma
model Notification {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  // Destinataire
  userId   String?
  clientId String?
  client   Client? @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Type et contenu
  type    NotificationType
  title   String
  message String
  
  // Lien d'action
  actionUrl String?
  
  // Statut
  isRead Boolean @default(false)
  readAt DateTime?
  
  // Métadonnées
  createdAt DateTime @default(now())
  
  @@index([cabinetId])
  @@index([userId])
  @@index([clientId])
  @@index([isRead])
  @@map("notifications")
}

enum NotificationType {
  TASK_ASSIGNED
  TASK_DUE
  APPOINTMENT_REMINDER
  DOCUMENT_UPLOADED
  KYC_EXPIRING
  CONTRACT_RENEWAL
  OPPORTUNITY_DETECTED
  CLIENT_MESSAGE
  SYSTEM
  OTHER
}
```

### 8.3 Campagne Marketing

```prisma
model Campagne {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  createdById String
  createdBy   User   @relation(fields: [createdById], references: [id])
  
  // Détails
  name        String
  description String?
  type        CampagneType
  
  // Cible
  targetSegment Json? // Critères de segmentation
  
  // Template
  templateId String?
  
  // Planification
  scheduledAt DateTime?
  
  // Statut
  status CampagneStatus @default(DRAFT)
  
  // Statistiques
  stats Json? // { sent, opened, clicked, converted }
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  sentAt    DateTime?
  
  @@index([cabinetId])
  @@index([createdById])
  @@index([status])
  @@map("campagnes")
}

enum CampagneType {
  EMAIL
  SMS
  POSTAL
  MIXED
}

enum CampagneStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  COMPLETED
  CANCELLED
}
```


## Module 9 : Templates et Modèles

### 9.1 Template

```prisma
model Template {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  // Type de template
  type TemplateType
  
  // Détails
  name        String
  description String?
  
  // Contenu
  content String @db.Text
  
  // Variables disponibles
  variables Json? // Array de variables disponibles
  
  // Catégorie
  category TemplateCategory
  
  // Est-ce un template réglementaire ?
  isRegulatory Boolean @default(false)
  
  // Version
  version Int @default(1)
  
  // Statut
  isActive Boolean @default(true)
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([cabinetId])
  @@index([type])
  @@index([category])
  @@index([isRegulatory])
  @@map("templates")
}

enum TemplateType {
  EMAIL
  LETTER
  CONTRACT
  REPORT
  DOCUMENT
}

enum TemplateCategory {
  // Réglementaire
  ENTRY_AGREEMENT
  MISSION_LETTER
  ADEQUACY_DECLARATION
  INVESTOR_PROFILE
  ANNUAL_REPORT
  
  // Commercial
  PROPOSAL
  QUOTE
  FOLLOW_UP
  
  // Administratif
  MEETING_MINUTES
  INTERNAL_NOTE
  
  // Autre
  OTHER
}
```


## Module 10 : Simulations et Analyses

### 10.1 Simulation

```prisma
model Simulation {
  id        String   @id @default(cuid())
  cabinetId String
  cabinet   Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  clientId String
  client   Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  createdById String
  createdBy   User   @relation(fields: [createdById], references: [id])
  
  // Type de simulation
  type SimulationType
  
  // Nom et description
  name        String
  description String?
  
  // Paramètres d'entrée
  parameters Json
  
  // Résultats
  results Json
  
  // Recommandations générées
  recommendations Json?
  
  // Score de faisabilité
  feasibilityScore Int? // 0-100
  
  // Statut
  status SimulationStatus @default(DRAFT)
  
  // Partagé avec le client ?
  sharedWithClient Boolean @default(false)
  sharedAt         DateTime?
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([cabinetId])
  @@index([clientId])
  @@index([type])
  @@index([createdById])
  @@map("simulations")
}

enum SimulationType {
  RETIREMENT
  REAL_ESTATE_LOAN
  LIFE_INSURANCE
  WEALTH_TRANSMISSION
  TAX_OPTIMIZATION
  INVESTMENT_PROJECTION
  BUDGET_ANALYSIS
  OTHER
}

enum SimulationStatus {
  DRAFT
  COMPLETED
  SHARED
  ARCHIVED
}
```


## Module 11 : Conformité et Réglementaire

### 11.1 Consentement RGPD

```prisma
model Consentement {
  id       String @id @default(cuid())
  clientId String
  client   Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Type de consentement
  type ConsentementType
  
  // Statut
  granted   Boolean
  grantedAt DateTime?
  revokedAt DateTime?
  
  // Détails
  purpose     String
  description String?
  
  // Preuve
  ipAddress   String?
  userAgent   String?
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([clientId])
  @@index([type])
  @@map("consentements")
}

enum ConsentementType {
  DATA_PROCESSING
  MARKETING_COMMUNICATION
  DATA_SHARING
  PROFILING
  AUTOMATED_DECISION
}
```

### 11.2 Réclamation

```prisma
model Reclamation {
  id        String   @id @default(cuid())
  cabinetId String
  
  clientId String
  client   Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Détails
  subject     String
  description String  @db.Text
  type        ReclamationType
  
  // Traitement
  status         ReclamationStatus @default(RECEIVED)
  assignedToId   String?
  responseText   String?           @db.Text
  resolutionDate DateTime?
  
  // Délais réglementaires
  receivedAt  DateTime @default(now())
  deadline    DateTime // 2 mois réglementaires
  
  // Escalade
  escalatedToMediator Boolean @default(false)
  escalatedAt         DateTime?
  
  // Métadonnées
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([cabinetId])
  @@index([clientId])
  @@index([status])
  @@map("reclamations")
}

enum ReclamationType {
  SERVICE_QUALITY
  FEES
  ADVICE_QUALITY
  COMMUNICATION
  DOCUMENT
  OTHER
}

enum ReclamationStatus {
  RECEIVED
  IN_PROGRESS
  RESOLVED
  REJECTED
  ESCALATED
}
```


## Module 12 : Historisation et Audit

### 12.1 Audit Log

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  cabinetId String?
  cabinet   Cabinet? @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  // Acteur
  userId       String?
  user         User?       @relation(fields: [userId], references: [id])
  superAdminId String?
  superAdmin   SuperAdmin? @relation(fields: [superAdminId], references: [id])
  
  // Action
  action      AuditAction
  entityType  String // Client, Actif, Document, etc.
  entityId    String
  
  // Détails de l'action
  changes Json? // Avant/Après pour les modifications
  
  // Contexte
  ipAddress String?
  userAgent String?
  
  // Métadonnées
  createdAt DateTime @default(now())
  
  @@index([cabinetId])
  @@index([userId])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  VIEW
  EXPORT
  SHARE
  SIGN
  APPROVE
  REJECT
}
```

### 12.2 Timeline Event (Historique Client)

```prisma
model TimelineEvent {
  id       String @id @default(cuid())
  clientId String
  client   Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // Type d'événement
  type TimelineEventType
  
  // Détails
  title       String
  description String?
  
  // Entité liée
  relatedEntityType String? // Actif, Document, Rendez-Vous, etc.
  relatedEntityId   String?
  
  // Métadonnées
  createdAt DateTime @default(now())
  createdBy String?
  
  @@index([clientId])
  @@index([type])
  @@index([createdAt])
  @@map("timeline_events")
}

enum TimelineEventType {
  CLIENT_CREATED
  MEETING_HELD
  DOCUMENT_SIGNED
  ASSET_ADDED
  GOAL_ACHIEVED
  CONTRACT_SIGNED
  KYC_UPDATED
  SIMULATION_SHARED
  EMAIL_SENT
  OPPORTUNITY_CONVERTED
  OTHER
}
```


## Module 13 : Export et Migration

### 13.1 Export Job

```prisma
model ExportJob {
  id        String   @id @default(cuid())
  cabinetId String
  
  // Créateur
  createdById String
  
  // Type d'export
  type ExportType
  
  // Filtres appliqués
  filters Json?
  
  // Format
  format ExportFormat @default(CSV)
  
  // Statut
  status ExportStatus @default(PENDING)
  
  // Résultat
  fileUrl    String?
  fileSize   Int?
  recordCount Int?
  
  // Erreur
  errorMessage String?
  
  // Métadonnées
  createdAt   DateTime @default(now())
  completedAt DateTime?
  expiresAt   DateTime? // URL expire après X jours
  
  @@index([cabinetId])
  @@index([createdById])
  @@index([status])
  @@map("export_jobs")
}

enum ExportType {
  CLIENTS
  ACTIFS
  PASSIFS
  CONTRATS
  DOCUMENTS
  TACHES
  RENDEZ_VOUS
  OPPORTUNITES
  FULL_PORTFOLIO // Export complet pour migration
}

enum ExportFormat {
  CSV
  EXCEL
  JSON
  PDF
}

enum ExportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```


## Architecture de Sécurité

### Row Level Security (RLS) PostgreSQL

Pour garantir l'isolation totale des données par cabinet, nous utilisons Row Level Security de PostgreSQL :

```sql
-- Activer RLS sur toutes les tables avec cabinetId
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE actifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- etc.

-- Politique pour les utilisateurs normaux (non SuperAdmin)
CREATE POLICY cabinet_isolation_policy ON clients
  USING (cabinetId = current_setting('app.current_cabinet_id')::text);

-- Politique pour SuperAdmin (accès à tout)
CREATE POLICY superadmin_access_policy ON clients
  USING (current_setting('app.is_superadmin')::boolean = true);
```

### Middleware Prisma

```typescript
// lib/prisma-middleware.ts
import { Prisma } from '@prisma/client'

export function createTenantMiddleware(cabinetId: string, isSuperAdmin: boolean = false) {
  return async (params: Prisma.MiddlewareParams, next: any) => {
    // SuperAdmin bypass
    if (isSuperAdmin) {
      return next(params)
    }

    // Ajouter automatiquement le filtre cabinetId
    if (params.model && hasCabinetId(params.model)) {
      if (params.action === 'findMany' || params.action === 'findFirst') {
        params.args.where = {
          ...params.args.where,
          cabinetId
        }
      }
      
      if (params.action === 'create' || params.action === 'createMany') {
        if (params.action === 'create') {
          params.args.data.cabinetId = cabinetId
        }
      }
    }

    return next(params)
  }
}
```

### Permissions par Rôle

```typescript
// lib/permissions.ts
export const PERMISSIONS = {
  SUPERADMIN: {
    canAccessAllCabinets: true,
    canManageCabinets: true,
    canViewAuditLogs: true,
    canExportAllData: true
  },
  
  ADMIN_CABINET: {
    canManageUsers: true,
    canManageClients: true,
    canManageDocuments: true,
    canExportData: true,
    canViewReports: true,
    canManageTemplates: true
  },
  
  ADVISOR: {
    canManageOwnClients: true,
    canManageDocuments: true,
    canExportOwnData: true,
    canViewOwnReports: true,
    canManageOwnApporteurs: true
  },
  
  ASSISTANT: {
    canViewAssignedClients: true,
    canEditAssignedClients: true,
    canManageDocuments: true,
    canViewReports: false
  }
}
```


## Index et Performance

### Index Composés Recommandés

```sql
-- Requêtes fréquentes par cabinet
CREATE INDEX idx_clients_cabinet_status ON clients(cabinetId, status);
CREATE INDEX idx_clients_cabinet_advisor ON clients(cabinetId, conseillerId);
CREATE INDEX idx_actifs_cabinet_type ON actifs(cabinetId, type);
CREATE INDEX idx_documents_cabinet_type ON documents(cabinetId, type);

-- Recherche full-text
CREATE INDEX idx_clients_search ON clients USING GIN (
  to_tsvector('french', firstName || ' ' || lastName || ' ' || COALESCE(email, ''))
);

-- Dates et échéances
CREATE INDEX idx_taches_due_date ON taches(cabinetId, dueDate) WHERE status != 'COMPLETED';
CREATE INDEX idx_rendez_vous_start ON rendez_vous(cabinetId, startDate);
CREATE INDEX idx_contrats_renewal ON contrats(cabinetId, nextRenewalDate) WHERE status = 'ACTIVE';

-- Audit et historique
CREATE INDEX idx_audit_logs_entity ON audit_logs(entityType, entityId, createdAt DESC);
CREATE INDEX idx_timeline_client_date ON timeline_events(clientId, createdAt DESC);
```

### Partitionnement (pour grandes volumétries)

```sql
-- Partitionner les audit_logs par mois
CREATE TABLE audit_logs (
  -- colonnes...
) PARTITION BY RANGE (createdAt);

CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- etc.
```


## Stratégie de Migration depuis MongoDB

### Étape 1 : Export MongoDB

```javascript
// scripts/export-mongodb-to-json.js
const collections = [
  'particuliers',
  'actifs',
  'passifs',
  'contrats',
  'documents',
  'taches',
  'rendezvous',
  'objectifs',
  'projets',
  'opportunites'
]

for (const collection of collections) {
  const data = await db.collection(collection).find({}).toArray()
  fs.writeFileSync(`./migration/${collection}.json`, JSON.stringify(data, null, 2))
}
```

### Étape 2 : Transformation des Données

```typescript
// scripts/transform-data.ts
// Mapper les anciens champs vers les nouveaux
const transformClient = (oldClient: any) => ({
  id: oldClient._id.toString(),
  cabinetId: oldClient.cabinetId,
  conseillerId: oldClient.conseillerId,
  email: oldClient.email,
  firstName: oldClient.firstName,
  lastName: oldClient.lastName,
  // ... mapping complet
})
```

### Étape 3 : Import dans PostgreSQL

```typescript
// scripts/import-to-postgres.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Import par batch pour performance
const BATCH_SIZE = 1000

for (let i = 0; i < clients.length; i += BATCH_SIZE) {
  const batch = clients.slice(i, i + BATCH_SIZE)
  await prisma.client.createMany({
    data: batch,
    skipDuplicates: true
  })
}
```

### Étape 4 : Validation

```typescript
// Comparer les counts
const mongoCount = await mongoDb.collection('particuliers').countDocuments()
const pgCount = await prisma.client.count()

console.log(`MongoDB: ${mongoCount}, PostgreSQL: ${pgCount}`)
```


## Diagramme ERD (Relations Principales)

```mermaid
erDiagram
    SuperAdmin ||--o{ AuditLog : creates
    
    Cabinet ||--o{ User : contains
    Cabinet ||--o{ Client : contains
    Cabinet ||--o{ Actif : contains
    Cabinet ||--o{ Document : contains
    Cabinet ||--o{ Template : contains
    
    User ||--o{ Client : "manages (principal)"
    User ||--o{ Client : "manages (remplacant)"
    User ||--o{ AssistantAssignment : participates
    User ||--o{ Tache : assigned
    User ||--o{ RendezVous : schedules
    User ||--o{ ApporteurAffaires : manages
    
    ApporteurAffaires ||--o{ Client : brings
    
    Client ||--o{ ClientActif : owns
    Client ||--o{ Passif : has
    Client ||--o{ Contrat : has
    Client ||--o{ Objectif : has
    Client ||--o{ Projet : has
    Client ||--o{ Opportunite : has
    Client ||--o{ Tache : related
    Client ||--o{ RendezVous : attends
    Client ||--o{ Simulation : has
    Client ||--o{ FamilyMember : has
    Client ||--o{ TimelineEvent : has
    
    Actif ||--o{ ClientActif : "shared by"
    Actif ||--o{ ActifDocument : linked
    
    Document ||--o{ ClientDocument : linked
    Document ||--o{ ActifDocument : linked
    Document ||--o{ PassifDocument : linked
    Document ||--o{ ContratDocument : linked
    
    Projet ||--o{ Tache : contains
    
    Template }o--|| Cabinet : belongs
```


## Configuration Prisma

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Tous les modèles définis ci-dessus...
```

### Variables d'Environnement

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/crm_patrimonial?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/crm_patrimonial?schema=public"

# Pour les migrations
SHADOW_DATABASE_URL="postgresql://user:password@localhost:5432/crm_patrimonial_shadow?schema=public"
```

### Scripts de Migration

```json
// package.json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "ts-node prisma/seed.ts",
    "db:reset": "prisma migrate reset"
  }
}
```


## Fonctionnalités Avancées

### 1. KYC Automatisé

```typescript
// lib/kyc-automation.ts
export async function performAutomatedKYC(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      kycDocuments: true,
      actifs: true,
      passifs: true,
      consentements: true
    }
  })
  
  const checks = {
    identityVerified: checkIdentityDocuments(client.kycDocuments),
    addressVerified: checkAddressProof(client.kycDocuments),
    wealthJustified: checkWealthJustification(client),
    consentsObtained: checkConsents(client.consentements),
    riskProfileComplete: !!client.riskProfile
  }
  
  const kycStatus = Object.values(checks).every(Boolean) 
    ? 'COMPLETED' 
    : 'IN_PROGRESS'
  
  await prisma.client.update({
    where: { id: clientId },
    data: { 
      kycStatus,
      kycCompletedAt: kycStatus === 'COMPLETED' ? new Date() : null
    }
  })
  
  return checks
}
```

### 2. Détection Automatique d'Opportunités

```typescript
// lib/opportunity-detection.ts
export async function detectOpportunities(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      actifs: { include: { actif: true } },
      passifs: true,
      contrats: true,
      objectifs: true
    }
  })
  
  const opportunities = []
  
  // Détection : Contrat d'assurance-vie sous-performant
  for (const contrat of client.contrats) {
    if (contrat.type === 'LIFE_INSURANCE') {
      const performance = calculatePerformance(contrat)
      if (performance < 2.0) { // < 2% de rendement
        opportunities.push({
          type: 'LIFE_INSURANCE',
          name: 'Optimisation assurance-vie',
          estimatedValue: contrat.value * 0.02, // Gain potentiel
          confidence: 0.75,
          priority: 'HIGH'
        })
      }
    }
  }
  
  // Détection : Épargne disponible non investie
  const liquidAssets = calculateLiquidAssets(client.actifs)
  if (liquidAssets > 50000) {
    opportunities.push({
      type: 'SECURITIES_INVESTMENT',
      name: 'Investissement épargne disponible',
      estimatedValue: liquidAssets * 0.05,
      confidence: 0.60,
      priority: 'MEDIUM'
    })
  }
  
  // Créer les opportunités en base
  for (const opp of opportunities) {
    await prisma.opportunite.create({
      data: {
        cabinetId: client.cabinetId,
        conseillerId: client.conseillerId,
        clientId: client.id,
        ...opp,
        status: 'DETECTED'
      }
    })
  }
  
  return opportunities
}
```

### 3. Calcul Automatique du Patrimoine

```typescript
// lib/wealth-calculation.ts
export async function calculateClientWealth(clientId: string) {
  const [actifs, passifs] = await Promise.all([
    prisma.clientActif.findMany({
      where: { clientId },
      include: { actif: true }
    }),
    prisma.passif.findMany({
      where: { clientId }
    })
  ])
  
  const totalAssets = actifs.reduce((sum, ca) => {
    const value = ca.actif.value.toNumber()
    const percentage = ca.ownershipPercentage.toNumber() / 100
    return sum + (value * percentage)
  }, 0)
  
  const totalLiabilities = passifs.reduce((sum, p) => 
    sum + p.remainingAmount.toNumber(), 0
  )
  
  const netWealth = totalAssets - totalLiabilities
  
  await prisma.client.update({
    where: { id: clientId },
    data: {
      wealth: {
        totalAssets,
        totalLiabilities,
        netWealth,
        lastCalculated: new Date()
      }
    }
  })
  
  return { totalAssets, totalLiabilities, netWealth }
}
```

### 4. Export Complet pour Migration

```typescript
// lib/full-export.ts
export async function exportFullPortfolio(cabinetId: string) {
  const exportData = {
    cabinet: await prisma.cabinet.findUnique({ where: { id: cabinetId } }),
    users: await prisma.user.findMany({ where: { cabinetId } }),
    clients: await prisma.client.findMany({
      where: { cabinetId },
      include: {
        familyMembers: true,
        actifs: { include: { actif: true } },
        passifs: true,
        contrats: true,
        objectifs: true,
        projets: true,
        opportunites: true,
        taches: true,
        rendezvous: true,
        documents: { include: { document: true } },
        simulations: true,
        kycDocuments: true,
        consentements: true
      }
    }),
    templates: await prisma.template.findMany({ where: { cabinetId } }),
    apporteurs: await prisma.apporteurAffaires.findMany({ where: { cabinetId } })
  }
  
  // Générer le fichier JSON
  const filename = `export_${cabinetId}_${Date.now()}.json`
  const filepath = `/exports/${filename}`
  
  fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2))
  
  // Créer le job d'export
  await prisma.exportJob.create({
    data: {
      cabinetId,
      createdById: 'system',
      type: 'FULL_PORTFOLIO',
      format: 'JSON',
      status: 'COMPLETED',
      fileUrl: filepath,
      fileSize: fs.statSync(filepath).size,
      recordCount: exportData.clients.length,
      completedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    }
  })
  
  return filepath
}
```


## Considérations de Performance

### Stratégies de Cache

```typescript
// lib/cache.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Cache du patrimoine client (recalculé toutes les heures)
export async function getCachedWealth(clientId: string) {
  const cached = await redis.get(`wealth:${clientId}`)
  
  if (cached) {
    return JSON.parse(cached)
  }
  
  const wealth = await calculateClientWealth(clientId)
  await redis.setex(`wealth:${clientId}`, 3600, JSON.stringify(wealth))
  
  return wealth
}

// Invalidation du cache lors de modifications
export async function invalidateWealthCache(clientId: string) {
  await redis.del(`wealth:${clientId}`)
}
```

### Pagination Optimisée

```typescript
// lib/pagination.ts
export async function paginateClients(
  cabinetId: string,
  page: number = 1,
  pageSize: number = 50
) {
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where: { cabinetId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.client.count({ where: { cabinetId } })
  ])
  
  return {
    data: clients,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}
```

### Requêtes Optimisées avec Select

```typescript
// Ne charger que les champs nécessaires
const clients = await prisma.client.findMany({
  where: { cabinetId },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    status: true,
    wealth: true,
    conseiller: {
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    }
  }
})
```


## Tests et Validation

### Tests Unitaires

```typescript
// __tests__/wealth-calculation.test.ts
import { calculateClientWealth } from '@/lib/wealth-calculation'

describe('Wealth Calculation', () => {
  it('should calculate net wealth correctly', async () => {
    const clientId = 'test-client-id'
    
    // Setup test data
    await prisma.clientActif.create({
      data: {
        clientId,
        actif: {
          create: {
            cabinetId: 'test-cabinet',
            type: 'REAL_ESTATE_MAIN',
            category: 'IMMOBILIER',
            name: 'Résidence principale',
            value: 300000
          }
        },
        ownershipPercentage: 100
      }
    })
    
    await prisma.passif.create({
      data: {
        clientId,
        cabinetId: 'test-cabinet',
        type: 'MORTGAGE',
        name: 'Prêt immobilier',
        initialAmount: 200000,
        remainingAmount: 150000,
        interestRate: 1.5,
        monthlyPayment: 1000,
        startDate: new Date('2020-01-01'),
        endDate: new Date('2035-01-01')
      }
    })
    
    const wealth = await calculateClientWealth(clientId)
    
    expect(wealth.totalAssets).toBe(300000)
    expect(wealth.totalLiabilities).toBe(150000)
    expect(wealth.netWealth).toBe(150000)
  })
})
```

### Tests d'Intégration

```typescript
// __tests__/integration/client-flow.test.ts
describe('Client Complete Flow', () => {
  it('should create client with full data', async () => {
    // 1. Créer le client
    const client = await prisma.client.create({
      data: {
        cabinetId: 'test-cabinet',
        conseillerId: 'test-advisor',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        status: 'PROSPECT'
      }
    })
    
    // 2. Ajouter un actif
    await prisma.clientActif.create({
      data: {
        clientId: client.id,
        actif: {
          create: {
            cabinetId: 'test-cabinet',
            type: 'BANK_ACCOUNT',
            category: 'FINANCIER',
            name: 'Compte courant',
            value: 10000
          }
        }
      }
    })
    
    // 3. Créer un objectif
    await prisma.objectif.create({
      data: {
        cabinetId: 'test-cabinet',
        clientId: client.id,
        type: 'RETIREMENT',
        name: 'Préparation retraite',
        targetAmount: 500000,
        targetDate: new Date('2040-01-01'),
        priority: 'HIGH'
      }
    })
    
    // 4. Vérifier la timeline
    const timeline = await prisma.timelineEvent.findMany({
      where: { clientId: client.id }
    })
    
    expect(timeline.length).toBeGreaterThan(0)
  })
})
```


## Conclusion

Ce design fournit une base de données PostgreSQL complète et robuste pour un CRM patrimonial professionnel avec :

### ✅ Fonctionnalités Couvertes

1. **Multi-tenant sécurisé** avec isolation totale des données
2. **Gestion complète des utilisateurs** (SuperAdmin, Admin, Conseiller, Assistant, Apporteur)
3. **Gestion du patrimoine** avec actifs partagés et relations complexes
4. **Documents et GED** avec versioning et signature électronique
5. **Objectifs et projets** avec suivi de progression
6. **Pipeline commercial** avec détection automatique d'opportunités
7. **Tâches et agenda** avec synchronisation calendrier externe
8. **Communications** (emails, notifications, campagnes)
9. **Templates** réglementaires et commerciaux
10. **Simulations** historisées et liées aux clients
11. **Conformité** (KYC automatisé, RGPD, réclamations)
12. **Historisation complète** avec audit logs et timeline
13. **Export et migration** pour portabilité des données

### 🚀 Avantages de PostgreSQL + Prisma

- **Performance** : Index optimisés, requêtes SQL natives
- **Intégrité** : Contraintes de clés étrangères, transactions ACID
- **Sécurité** : Row Level Security natif
- **Scalabilité** : Partitionnement, réplication
- **Type-safety** : Prisma génère des types TypeScript
- **Migrations** : Gestion de schéma versionnée

### 📋 Prochaines Étapes

1. Valider ce design avec vous
2. Créer le fichier `schema.prisma` complet
3. Générer les migrations initiales
4. Créer les scripts de migration depuis MongoDB
5. Implémenter les middlewares de sécurité
6. Développer les services métier

**Le design est maintenant complet et prêt pour validation !**

