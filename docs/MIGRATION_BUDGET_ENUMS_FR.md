# Migration: Harmonisation des Enums Budget (FR)

## Date: 2024-12-10

## Objectif
Harmoniser les valeurs entre **Frontend ↔ Prisma ↔ Supabase** pour faciliter la maintenance.

**Avant**: Mappings bidirectionnels complexes entre valeurs anglaises Prisma et valeurs françaises frontend.
**Après**: Valeurs françaises uniformes partout, pas de mapping.

---

## Fichiers modifiés

### 1. Schema Prisma
`prisma/schema.prisma`
- `RevenueCategory` : 35 valeurs alignées sur `RevenuForm.tsx`
- `ExpenseCategory` : 53 valeurs alignées sur `ChargeForm.tsx`
- `RevenueFrequency` / `ExpenseFrequency` : déjà en français (MENSUEL, TRIMESTRIEL...)

### 2. Migration SQL
`prisma/migrations/20251210_harmonize_budget_enums_fr/migration.sql`
- Crée les nouveaux types enum
- Migre les données existantes avec mapping des anciennes vers nouvelles valeurs
- Supprime les anciens types

### 3. Routes API simplifiées
- `revenues/route.ts` - Sans mapping, valeurs directes
- `revenues/[revenueId]/route.ts` - Sans mapping
- `expenses/route.ts` - Sans mapping, valeurs directes
- `expenses/[expenseId]/route.ts` - Sans mapping

---

## Étapes de migration

### 1. Types Prisma (✅ Fait)
```bash
npx prisma generate
```

### 2. Exécuter la migration SQL sur Supabase (⚠️ REQUIS)

**La migration ne peut pas être appliquée via `prisma migrate` car les migrations sont désynchronisées.**

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Copier le contenu de `/scripts/migrate-budget-enums-supabase.sql`
3. Exécuter le script (il utilise une transaction pour garantir l'atomicité)
4. Vérifier avec:
   ```sql
   SELECT DISTINCT category FROM revenues;
   SELECT DISTINCT category FROM expenses;
   ```

### 3. Redémarrer le serveur
```bash
npm run dev
```

---

## Nouveaux enums RevenueCategory

| Catégorie | Valeurs |
|-----------|---------|
| **Salaires** | SALAIRE, PRIME, BONUS, AVANTAGE_NATURE, INDEMNITE_LICENCIEMENT, INDEMNITE_RUPTURE_CONVENTIONNELLE |
| **TNS** | BIC, BNC, BA, HONORAIRES, DROITS_AUTEUR |
| **Dirigeant** | REMUNERATION_GERANT, DIVIDENDES, JETONS_PRESENCE |
| **Immobilier** | REVENUS_FONCIERS, LMNP, LMP, LOCATION_SAISONNIERE, SCPI |
| **Capitaux** | INTERETS, PLUS_VALUES_MOBILIERES, ASSURANCE_VIE_RACHAT, CRYPTO |
| **Retraite** | PENSION_RETRAITE, RETRAITE_COMPLEMENTAIRE, PER_RENTE, PENSION_REVERSION |
| **Social** | PENSION_ALIMENTAIRE_RECUE, PENSION_INVALIDITE, ALLOCATION_CHOMAGE, RSA, ALLOCATIONS_FAMILIALES, APL |
| **Autres** | RENTE_VIAGERE, REVENU_EXCEPTIONNEL, AUTRE |

---

## Nouveaux enums ExpenseCategory

| Catégorie | Valeurs |
|-----------|---------|
| **Logement** | LOYER, CHARGES_COPROPRIETE, TAXE_FONCIERE, TAXE_HABITATION, ASSURANCE_HABITATION, ELECTRICITE_GAZ, EAU, INTERNET_TELEPHONE, TRAVAUX_ENTRETIEN, FRAIS_GESTION_LOCATIVE |
| **Transport** | CREDIT_AUTO, ASSURANCE_AUTO, CARBURANT, ENTRETIEN_VEHICULE, PARKING, TRANSPORT_COMMUN, PEAGES |
| **Santé** | MUTUELLE, FRAIS_MEDICAUX, OPTIQUE_DENTAIRE |
| **Assurances** | ASSURANCE_VIE_PRIMES, PREVOYANCE, ASSURANCE_EMPRUNTEUR, PROTECTION_JURIDIQUE, GAV |
| **Famille** | GARDE_ENFANTS, SCOLARITE, ACTIVITES_ENFANTS, PENSION_ALIMENTAIRE_VERSEE, ETUDES_SUPERIEURES |
| **Épargne** | VERSEMENT_PER, VERSEMENT_PERP, VERSEMENT_EPARGNE, INVESTISSEMENT_FIP_FCPI, INVESTISSEMENT_SOFICA |
| **Crédits** | CREDIT_IMMOBILIER_RP, CREDIT_IMMOBILIER_LOCATIF, CREDIT_CONSOMMATION, CREDIT_REVOLVING |
| **Professionnel** | COTISATIONS_SOCIALES, CFE, FRAIS_COMPTABILITE, COTISATION_SYNDICALE, FORMATION_PROFESSIONNELLE |
| **Impôts** | IMPOT_REVENU, IFI, PRELEVEMENTS_SOCIAUX |
| **Divers** | DONS, EMPLOI_DOMICILE, ABONNEMENTS_LOISIRS, ALIMENTATION, AUTRE_CHARGE |

---

## Architecture simplifiée

### Avant (complexe)
```
Frontend (SALAIRE) → mapRevenueCategory() → Prisma (SALAIRE_NET) → DB
DB → mapRevenueCategoryToFrontend() → Frontend (SALAIRE)
```

### Après (simple)
```
Frontend (SALAIRE) → API → Prisma (SALAIRE) → DB
DB → API → Frontend (SALAIRE)
```

---

## Points d'attention

1. **Données existantes**: La migration SQL convertit automatiquement les anciennes valeurs
2. **Types TypeScript**: Les erreurs de type disparaîtront après `prisma generate`
3. **Formulaires**: Les formulaires `RevenuForm.tsx` et `ChargeForm.tsx` utilisent déjà les bonnes valeurs
4. **Tests**: Tester la création, modification et affichage des revenus/charges après migration
