# ENRICHISSEMENTS PRISMA - SEMAINE 0

**Date** : 25 novembre 2024  
**Objectif** : Ajouter modèles manquants + enrichir modèles existants  
**Méthode** : Pas de doublon, harmonisation avec l'existant

---

## 📊 ANALYSE SCHÉMA EXISTANT

### Modèles déjà présents ✅

- Cabinet ✅
- User ✅  
- Client ✅ (à enrichir)
- FamilyMember ✅ (à enrichir)
- Actif ✅ (à enrichir)
- ClientActif ✅ (liaison N-N)
- Passif ✅ (à enrichir)
- Contrat ✅ (existe)
- Objectif ✅ (existe)
- Document ✅ (existe)
- Tache ✅ (existe)
- RendezVous ✅ (existe)
- Opportunite ✅ (existe)
- KYCDocument, KYCCheck ✅ (existent)

### Modèles À CRÉER ❌

1. **ClientBudget** - NOUVEAU (pour TabBudget)
2. **ClientTaxation** - NOUVEAU (pour TabTaxation)
3. **TaxOptimization** - NOUVEAU (pour recommandations fiscales)
4. **Appointment** - ⚠️ VÉRIFIER si RendezVous suffit ou si besoin nouveau modèle
5. **Task** - ⚠️ VÉRIFIER si Tache suffit ou si besoin nouveau modèle

---

## 🔧 ENRICHISSEMENTS DÉTAILLÉS

### 1. Modèle Client (ENRICHIR)

**Champs EXISTANTS à conserver** :
```prisma
// ✅ Déjà présents
id, cabinetId, clientType, conseillerId, conseillerRemplacantId
email, firstName, lastName, birthDate, birthPlace, nationality
phone, mobile, address
maritalStatus, marriageRegime, numberOfChildren
profession, employerName, professionalStatus
companyName, siret, legalForm, activitySector (pour PROFESSIONNEL)
annualIncome, taxBracket, fiscalResidence
riskProfile, investmentHorizon, investmentGoals, investmentKnowledge
kycStatus, kycCompletedAt, kycNextReviewDate
status, createdAt, updatedAt
```

**Champs À AJOUTER** :
```prisma
model Client {
  // ... tous les champs existants ...

  // AJOUTER pour formulaire 7 étapes :
  civilite             String?  // M, MME, MLLE
  nomUsage             String?  // Nom marital
  taxResidence         String?  // Pays résidence fiscale (alternative à fiscalResidence)
  
  // AJOUTER pour situation familiale enrichie :
  matrimonialRegime    String?  // SEPARATION, COMMUNAUTE, UNIVERSELLE, PARTICIPATION
  dependents           Int?     @default(0)  // Personnes à charge
  
  // AJOUTER pour situation professionnelle enrichie :
  professionCategory   String?  // CADRE_SUP, PROFESS_LIB, CHEF_ENTR, etc.
  employmentType       String?  // CDI, CDD, INDEPENDANT, INTERIM, etc.
  employmentSince      DateTime?  // Date d'embauche
  
  // NOUVELLES RELATIONS :
  budget               ClientBudget?
  taxation             ClientTaxation?
  taxOptimizations     TaxOptimization[]
  
  // ⚠️ Relations existantes à vérifier :
  // appointments      Appointment[] OU rendezvous RendezVous[] ?
  // tasks             Task[] OU taches Tache[] ?
}
```

**⚠️ NOTE** : Vérifier si `fiscalResidence` vs `taxResidence` sont doublons. Si oui, utiliser existant.

---

### 2. Modèle FamilyMember (ENRICHIR)

**Champs EXISTANTS** :
```prisma
id, clientId, firstName, lastName, birthDate
relationship (SPOUSE, CHILD, PARENT, SIBLING, GRANDCHILD, OTHER)
linkedClientId, isBeneficiary
createdAt, updatedAt
```

**Champs À AJOUTER** :
```prisma
model FamilyMember {
  // ... champs existants ...
  
  // AJOUTER :
  civility         String?  // M, MME, MLLE
  profession       String?
  annualIncome     Decimal?  @db.Decimal(10, 2)
  isDependent      Boolean   @default(false)  // À charge ?
  email            String?
  phone            String?
  notes            String?   @db.Text
}
```

**Enum À ENRICHIR** :
```prisma
enum FamilyRelationship {
  SPOUSE
  CHILD
  PARENT
  SIBLING
  GRANDCHILD
  OTHER
  ASCENDANT  // AJOUTER pour l'ancien CRM
}
```

---

### 3. Modèle Actif (ENRICHIR)

**Champs EXISTANTS** :
```prisma
id, cabinetId, type, category, name, description
value, acquisitionDate, acquisitionValue
details, annualIncome, taxDetails
managedByFirm, managementFees
isActive, createdAt, updatedAt
```

**Champs À AJOUTER** :
```prisma
model Actif {
  // ... champs existants ...
  
  // AJOUTER pour TabWealth enrichi :
  location                String?   // Localisation actif (ville, pays)
  purchaseDate            DateTime? // Alias pour acquisitionDate (⚠️ vérifier doublon)
  
  // Management tracking enrichi :
  managementAdvisor       String?   // Nom conseiller référent
  managementSince         DateTime? // Date début gestion
  
  // Fiscal data IFI (pour immobilier) :
  fiscalPropertyType      String?   // RP, SECONDARY, RENTAL, COMMERCIAL
  fiscalRpAbatement       Boolean   @default(false)  // Abattement 30% résidence principale
  fiscalManualDiscount    Decimal?  @db.Decimal(5, 2)  // Décote manuelle %
  fiscalIfiValue          Decimal?  @db.Decimal(15, 2)  // Valeur IFI calculée
  
  // Linkage actif ↔ passif :
  linkedPassifId          String?   // ID passif associé (crédit)
}
```

**⚠️ NOTE** : 
- Vérifier si `acquisitionDate` et `purchaseDate` sont doublons
- Le modèle `ClientActif` gère la liaison N-N avec Client, donc OK

---

### 4. Modèle Passif (ENRICHIR)

**Champs EXISTANTS** :
```prisma
id, cabinetId, clientId, type, name, description
initialAmount, remainingAmount, interestRate, monthlyPayment
startDate, endDate
linkedActifId (✅ déjà présent!)
insurance, isActive, createdAt, updatedAt
```

**Champs À AJOUTER** :
```prisma
model Passif {
  // ... champs existants ...
  
  // AJOUTER :
  insuranceRate        Decimal?  @db.Decimal(5, 2)  // Taux assurance %
  
  // ⚠️ linkedActifId existe déjà ! Parfait, juste à utiliser
}
```

**✅ BONNE NOUVELLE** : `linkedActifId` existe déjà dans Passif !

---

### 5. ClientBudget (CRÉER - NOUVEAU)

```prisma
model ClientBudget {
  id        String   @id @default(cuid())
  clientId  String   @unique
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // REVENUS (stockés en JSON pour flexibilité)
  professionalIncome   Json?  // { netSalary, selfEmployedIncome, bonuses, other }
  assetIncome          Json?  // { rentalIncome, dividends, interest, capitalGains }
  spouseIncome         Json?  // { netSalary, other }
  retirementPensions   Json?  // { total }
  allowances           Json?  // { total }
  
  // CHARGES (stockées en JSON)
  monthlyExpenses      Json?  // { housing, utilities, food, transportation, insurance, leisure, health, education, loans, other }
  
  // MÉTRIQUES CALCULÉES (mises à jour automatiquement)
  totalRevenue         Decimal?  @db.Decimal(12, 2)
  totalExpenses        Decimal?  @db.Decimal(12, 2)
  savingsCapacity      Decimal?  @db.Decimal(12, 2)
  savingsRate          Decimal?  @db.Decimal(5, 2)
  
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  
  @@map("client_budgets")
}
```

**⚠️ AJOUT RELATION DANS Client** :
```prisma
model Client {
  // ...
  budget     ClientBudget?
}
```

---

### 6. ClientTaxation (CRÉER - NOUVEAU)

```prisma
model ClientTaxation {
  id        String   @id @default(cuid())
  clientId  String   @unique
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  anneeFiscale         Int       @default(2024)
  
  // IMPÔT SUR LE REVENU (stocké en JSON)
  incomeTax            Json?  // { fiscalReferenceIncome, taxShares, quotientFamilial, taxBracket, annualAmount, monthlyPayment, taxCredits, taxReductions }
  
  // IFI (stocké en JSON)
  ifi                  Json?  // { taxableRealEstateAssets, deductibleLiabilities, netTaxableIFI, ifiAmount, bracket, threshold }
  
  // PRÉLÈVEMENTS SOCIAUX (stocké en JSON)
  socialContributions  Json?  // { taxableAssetIncome, rate, amount }
  
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  
  @@map("client_taxation")
}
```

**⚠️ AJOUT RELATION DANS Client** :
```prisma
model Client {
  // ...
  taxation   ClientTaxation?
}
```

---

### 7. TaxOptimization (CRÉER - NOUVEAU)

```prisma
enum TaxOptimizationPriority {
  HIGH
  MEDIUM
  LOW
}

enum TaxOptimizationStatus {
  DETECTED
  REVIEWED
  IN_PROGRESS
  COMPLETED
  DISMISSED
}

model TaxOptimization {
  id                String                      @id @default(cuid())
  clientId          String
  client            Client                      @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  priority          TaxOptimizationPriority     @default(MEDIUM)
  category          String                      // TAX, SAVINGS, INVESTMENT, etc.
  title             String
  description       String                      @db.Text
  potentialSavings  Decimal?                    @db.Decimal(10, 2)
  recommendation    String                      @db.Text
  status            TaxOptimizationStatus       @default("DETECTED")
  
  reviewedAt        DateTime?
  completedAt       DateTime?
  dismissedAt       DateTime?
  dismissReason     String?                     @db.Text
  
  createdAt         DateTime                    @default(now())
  updatedAt         DateTime                    @updatedAt
  
  @@index([clientId])
  @@index([clientId, status])
  @@index([priority])
  @@map("tax_optimizations")
}
```

**⚠️ AJOUT RELATION DANS Client** :
```prisma
model Client {
  // ...
  taxOptimizations   TaxOptimization[]
}
```

---

### 8. Appointment vs RendezVous (ANALYSER)

**RendezVous EXISTE DÉJÀ** :
```prisma
// À vérifier dans le schéma existant
model RendezVous {
  // ... champs existants
}
```

**DÉCISION** :
1. Si `RendezVous` a déjà tous les champs nécessaires → **ENRICHIR l'existant**
2. Si `RendezVous` est incomplet → **CRÉER Appointment** comme alias ou enrichir

**⚠️ ACTION** : Vérifier contenu modèle `RendezVous` avant de créer `Appointment`

---

### 9. Task vs Tache (ANALYSER)

**Tache EXISTE DÉJÀ** :
```prisma
// À vérifier dans le schéma existant
model Tache {
  // ... champs existants
}
```

**DÉCISION** :
1. Si `Tache` a déjà tous les champs nécessaires → **ENRICHIR l'existant**
2. Si `Tache` est incomplet → **CRÉER Task** ou enrichir

**⚠️ ACTION** : Vérifier contenu modèle `Tache` avant de créer `Task`

---

## 📋 CHECKLIST AVANT MIGRATION

### Vérifications obligatoires

- [ ] Lire modèle `RendezVous` complet (ligne ?)
- [ ] Lire modèle `Tache` complet (ligne ?)
- [ ] Vérifier si `fiscalResidence` existe déjà dans Client
- [ ] Vérifier si `acquisitionDate` vs `purchaseDate` dans Actif sont doublons
- [ ] Confirmer que `linkedActifId` existe dans Passif (✅ confirmé)
- [ ] Vérifier enum `FamilyRelationship` complet

### Nouveaux modèles à créer

- [ ] ClientBudget (NOUVEAU)
- [ ] ClientTaxation (NOUVEAU)
- [ ] TaxOptimization (NOUVEAU)

### Modèles à enrichir

- [ ] Client (ajouter 8 champs + 3 relations)
- [ ] FamilyMember (ajouter 7 champs)
- [ ] Actif (ajouter 9 champs)
- [ ] Passif (ajouter 1 champ: insuranceRate)

### Enums à enrichir

- [ ] FamilyRelationship (ajouter ASCENDANT)
- [ ] Créer TaxOptimizationPriority (NOUVEAU)
- [ ] Créer TaxOptimizationStatus (NOUVEAU)

---

## 🚀 PROCHAINES ÉTAPES

1. **Lire modèles RendezVous et Tache** pour vérifier s'ils suffisent
2. **Créer fichier migration** avec tous les enrichissements
3. **Exécuter migration** : `npx prisma migrate dev --name add_budget_taxation_enrichments`
4. **Générer client** : `npx prisma generate`
5. **Tests** : Vérifier pas de régression

---

## ⚠️ NOTES IMPORTANTES

### Pas de doublons

- `linkedActifId` existe déjà dans Passif ✅
- Vérifier `fiscalResidence` vs `taxResidence` dans Client
- Vérifier `acquisitionDate` vs `purchaseDate` dans Actif

### JSON vs colonnes séparées

**DÉCISION** : Utiliser JSON pour :
- Budget (revenus, charges) : trop de champs, flexibilité
- Taxation (IR, IFI, PS) : structure complexe, évolutive

**RAISON** : 
- Évite 30+ colonnes
- Flexibilité pour évolution
- TypeScript types pour validation côté app

### Naming conventions

- Tables : snake_case (`client_budgets`, `tax_optimizations`)
- Champs : camelCase
- Relations : camelCase
