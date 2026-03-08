# Système Centralisé de Règles Réglementaires — ALFI CRM

## Objectif

Créer un **point unique de vérité** pour toutes les données réglementaires, fiscales, sociales et financières utilisées dans le CRM. Ce système permet de :

1. **Modifier les règles sans coder** — via une interface admin ou en éditant un seul fichier JSON/TS
2. **Impacter automatiquement** tous les modules (simulateurs, audit patrimonial, bilan PDF, RAG, CloudBot)
3. **Tracer les versions** — chaque jeu de règles est versionné et daté
4. **Ajouter des règles** (jurisprudence, dispositifs, taux) sans toucher au code métier

## Architecture

```
app/_common/lib/rules/
├── SPEC.md                          # Ce fichier
├── fiscal-rules.ts                  # Configuration centralisée (TOUTES les règles)
├── fiscal-rules-engine.ts           # Moteur : fonctions de calcul typées lisant la config
├── README.md                        # Guide de mise à jour pour non-développeurs
└── history/                         # Historique des configs (optionnel, pour audit)
```

## Structure de la Configuration

La config est un objet TypeScript exporté `RULES_2026` structuré en domaines :

### Domaines

| Domaine | Contenu | Consommateurs |
|---------|---------|---------------|
| `meta` | Année, version, date MAJ, sources | Tous |
| `ir` | Barème IR, décote, QF, plafonnement, CEHR, CDHR | tax-service, audit-engine, simulateurs, RAG |
| `ifi` | Barème IFI, seuils, décote | tax-service, audit-engine |
| `ps` | CSG, CRDS, solidarité, PFU | tax-service, simulateurs |
| `per` | Plafonds salarié/TNS, déduction, report, âge max | simulateurs, audit-engine |
| `assurance_vie` | Rachat (art.125-0A), transmission décès (990I, 757B) | simulateurs, audit-engine, succession |
| `succession` | Barèmes DMTG, abattements par lien, délai rappel | audit-engine, simulateurs |
| `donation` | Abattements spécifiques, présents d'usage, Dutreil | audit-engine |
| `demembrement` | Barème art.669 CGI | audit-engine, simulateurs |
| `immobilier` | Taux crédit, frais notaire, plus-values, dispositifs | simulateurs, audit-engine |
| `placements` | Taux livrets réglementés, fonds euros, SCPI | audit-engine, RAG, bilan |
| `retraite` | PASS, SMIC, régime base, AGIRC-ARRCO, âge légal, trimestres | simulateurs retraite, audit-engine |
| `social` | Cotisations, HCSF, seuils endettement | simulateurs emprunt, audit-engine |
| `optimisations` | Niches fiscales actives, plafonds, conditions | tax-service, audit-engine |
| `jurisprudence` | Décisions clés, BOI, rescrits | RAG, CloudBot |

### Exemple de structure

```typescript
export const RULES = {
  meta: {
    annee_fiscale: 2026,
    annee_revenus: 2025,
    version: '2026.1.0',
    date_mise_a_jour: '2026-03-06',
    sources: [
      'Loi de finances 2026 (19/02/2026)',
      'LFSS 2026',
      'BOI-IR-LIQ-20',
      'service-public.fr',
    ],
  },
  ir: {
    bareme: [
      { min: 0, max: 11600, taux: 0 },
      { min: 11600, max: 29579, taux: 0.11 },
      // ...
    ],
    decote: { ... },
    quotient_familial: { ... },
    cehr: { ... },
    cdhr: { ... },
  },
  // ...
}
```

## Flux de mise à jour

1. **Changement réglementaire** (ex: LF 2027)
2. L'admin ouvre la page `/admin/regles` dans le CRM
3. Il modifie les valeurs concernées (ex: tranches IR, PASS, taux livret A)
4. Il sauvegarde → la config est persistée en DB + le fichier TS est régénéré
5. Tous les calculs utilisent automatiquement les nouvelles valeurs

## Consommateurs impactés

| Module | Fichier | Utilise |
|--------|---------|---------|
| Tax Service | `tax-service.ts` | `RULES.ir`, `RULES.ifi`, `RULES.ps` |
| Simulateurs | `parameters.ts` | `RULES.ir`, `RULES.per`, `RULES.assurance_vie`, `RULES.succession` |
| Audit Engine | `audit-patrimonial-engine.ts` | Tous les domaines |
| Retraite | `retirement/config/parameters.ts` | `RULES.retraite`, `RULES.social` |
| Bilan PDF | `bilan-patrimonial-premium.ts` | Via audit-engine |
| RAG KB | `rag-knowledge-base.ts` | `RULES.*` pour chunks |
| CloudBot | `agent-tools-extended.ts` | `RULES.*` via simulateurs |

## Principes

1. **Jamais de valeur hardcodée** dans le code métier — tout vient de `RULES`
2. **Un seul import** : `import { RULES } from '@/app/_common/lib/rules/fiscal-rules'`
3. **Typage strict** — chaque domaine a une interface TypeScript
4. **Rétrocompatibilité** — les anciens exports (`TAX_BRACKETS_2024`, `PARAMS`, etc.) sont des alias vers `RULES`
5. **Testable** — fonctions pures, pas d'effets de bord
