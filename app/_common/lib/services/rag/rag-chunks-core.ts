/**
 * RAG Chunks Core — Base de connaissances patrimoniale exhaustive (Partie 1)
 * 
 * Fiscalité (IR, IFI, PV, PS, PFU, CEHR), Assurance-Vie, PER, Enveloppes
 */

import type { KnowledgeChunkV2 } from './rag-knowledge-base'

export const CHUNKS_FISCALITE: KnowledgeChunkV2[] = [
  {
    id: 'ir-bareme-2026',
    source: 'parameters',
    category: 'fiscalite-ir',
    subcategory: 'bareme',
    title: 'Barème Impôt sur le Revenu 2026 (CGI art. 197) — revenus 2025',
    content: `Barème progressif IR 2026 applicable aux revenus 2025 (LF 2026, +1.8% revalorisation) :
- Tranche 1 : 0 à 11 497 € → 0%
- Tranche 2 : 11 497 à 29 315 € → 11%
- Tranche 3 : 29 315 à 83 823 € → 30%
- Tranche 4 : 83 823 à 180 294 € → 41%
- Tranche 5 : au-delà de 180 294 € → 45%
Décote 2026 : seuil célibataire 1 982 €, couple 3 277 €. Base décote : célibataire 873 €, couple 1 444 €. Coefficient 0.4583.
Plafonnement du QF : 1 794 €/demi-part (revalorisé).
Nouveau 2026 : CDHR — Contribution Différentielle Hauts Revenus, taux minimum 20% pour RFR > 250k€ (célib) / 500k€ (couple).
Fonction CRM : calculIR(revenuImposable, nbParts) → montant impôt. Source : fiscal-rules.ts centralisé.`,
    keywords: ['ir', 'impot', 'revenu', 'bareme', 'tranche', 'tmi', 'quotient familial', 'decote', 'cgi 197', 'taux marginal', 'imposition', '11497', '29315', '83823', '180294', 'cdhr', '2026', 'lf 2026'],
    legalReferences: ['CGI art. 197', 'CGI art. 193', 'LF 2026 art. 2'],
    relatedChunkIds: ['ir-calcul-qf', 'cehr-2026', 'cdhr-2026', 'ps-2026', 'pfu-2026'],
    professionalRelevance: ['cgp', 'tax_specialist', 'financial_analyst'],
    difficulty: 'basic',
    crmLink: '/dashboard/simulateurs/impot-revenu',
    lastUpdated: '2026-03-06',
  },
  {
    id: 'ir-calcul-qf',
    source: 'parameters',
    category: 'fiscalite-ir',
    subcategory: 'quotient-familial',
    title: 'Quotient Familial et Parts Fiscales 2026',
    content: `Parts fiscales : Célibataire 1 | Couple 2 | Enfant 1-2 +0.5 | Enfant 3+ +1 | Parent isolé +0.5 | Invalide +0.5.
Plafonnement QF 2026 : 1 794 €/demi-part (revalorisé +1.8%). Parent isolé : 4 232 € (1ère demi-part). Personne seule ayant élevé enfant : 1 069 €.
Fonction CRM : getNombreParts(statut, enfants, parentIsole). Source : fiscal-rules.ts centralisé.`,
    keywords: ['quotient familial', 'parts', 'enfants', 'celibataire', 'couple', 'parent isole', 'plafonnement', 'demi-part', '1794', '2026'],
    legalReferences: ['CGI art. 194', 'CGI art. 195', 'CGI art. 197'],
    relatedChunkIds: ['ir-bareme-2026'],
    professionalRelevance: ['cgp', 'tax_specialist'],
    difficulty: 'basic',
    lastUpdated: '2026-03-06',
  },
  {
    id: 'cehr-2026',
    source: 'parameters',
    category: 'fiscalite-ir',
    subcategory: 'cehr',
    title: 'CEHR — Contribution Exceptionnelle Hauts Revenus (CGI art. 223 sexies)',
    content: `CEHR 2026 (non indexée, inchangée) : Célibataire : 250k-500k → 3%, >500k → 4%. Couple : 500k-1M → 3%, >1M → 4%.
Basée sur le RFR. Lissage sur 2 ans pour revenus exceptionnels. PV incluses dans le RFR.
Exemple : célibataire 300k€ RFR → CEHR = 1 500 € en plus de l'IR.
Nouveau LF 2026 : voir aussi la CDHR (Contribution Différentielle Hauts Revenus) pour un taux minimum de 20%.`,
    keywords: ['cehr', 'contribution exceptionnelle', 'hauts revenus', '223 sexies', 'surtaxe', '3%', '4%', 'rfr', 'cdhr'],
    legalReferences: ['CGI art. 223 sexies'],
    relatedChunkIds: ['ir-bareme-2026', 'cdhr-2026', 'pfu-2026'],
    professionalRelevance: ['cgp', 'tax_specialist'],
    difficulty: 'intermediate',
    lastUpdated: '2026-03-06',
  },
  {
    id: 'pfu-2026',
    source: 'parameters',
    category: 'fiscalite-revenus-capitaux',
    subcategory: 'pfu',
    title: 'PFU — Flat Tax 30% (CGI art. 200 A)',
    content: `Flat tax 30% = 12.8% IR + 17.2% PS. S'applique par défaut aux dividendes, intérêts, PV mobilières, rachats AV < 8 ans.
Option globale barème (case 2OP) : intéressant si TMI ≤ 11% (voire 30% avec abattement 40% dividendes).
Abattement 40% dividendes uniquement si option barème (art. 158-3-2°). CSG déductible 6.8% si option barème.
Option irrévocable, globale pour tous les revenus du capital de l'année.`,
    keywords: ['pfu', 'flat tax', '30%', '12.8%', 'prelevement forfaitaire unique', 'dividendes', 'interets', 'plus-values mobilieres', 'option bareme', '200 a', 'abattement 40%'],
    legalReferences: ['CGI art. 200 A', 'CGI art. 158-3-2°'],
    relatedChunkIds: ['ps-2026', 'ir-bareme-2026', 'pv-mobiliere'],
    professionalRelevance: ['cgp', 'tax_specialist', 'financial_analyst'],
    difficulty: 'intermediate',
    lastUpdated: '2026-03-06',
  },
  {
    id: 'ps-2026',
    source: 'parameters',
    category: 'fiscalite-ps',
    subcategory: 'prelevements-sociaux',
    title: 'Prélèvements Sociaux 2026',
    content: `PS 17.2% : CSG 9.2% (6.8% déductible si option barème) + CRDS 0.5% + Solidarité 7.5%.
Sur revenus fonciers, BIC non pro, PV, RCM, produits AV. Non-résidents UE : 7.5% uniquement.
Charge totale location nue : TMI + 17.2% (ex: TMI 30% → 47.2%).`,
    keywords: ['prelevements sociaux', 'csg', 'crds', 'ps', '17.2', '9.2', '6.8', 'deductible', 'solidarite'],
    legalReferences: ['CSS art. L136-7', 'CGI art. 1600-0 S'],
    relatedChunkIds: ['pfu-2026', 'ir-bareme-2026'],
    professionalRelevance: ['cgp', 'tax_specialist'],
    difficulty: 'basic',
    lastUpdated: '2026-03-06',
  },
  {
    id: 'ifi-bareme-2026',
    source: 'parameters',
    category: 'fiscalite-ifi',
    subcategory: 'bareme',
    title: 'IFI 2026 — Impôt Fortune Immobilière (CGI art. 977)',
    content: `Seuil : 1 300 000 €. Barème : 800k-1.3M 0.50% | 1.3M-2.57M 0.70% | 2.57M-5M 1% | 5M-10M 1.25% | >10M 1.50%.
Décote 1.3M-1.4M : 17 500 − 1.25% × patrimoine. Abattement 30% RP. Biens professionnels exonérés.
Plafonnement : IR+IFI ≤ 75% revenus. NP exclue de l'assiette (l'usufruitier déclare PP).
Optimisation : démembrement, investissement pro, SCPI NP, bois/forêts (75% exo).`,
    keywords: ['ifi', 'fortune', 'immobiliere', 'seuil', '977', 'residence principale', 'abattement 30%', 'decote', '1300000', 'plafonnement', 'nue-propriete', 'bouclier'],
    legalReferences: ['CGI art. 964 à 983', 'CGI art. 977'],
    relatedChunkIds: ['demembrement-669', 'immobilier-scpi', 'immobilier-sci'],
    professionalRelevance: ['cgp', 'tax_specialist', 'real_estate_broker'],
    difficulty: 'intermediate',
    lastUpdated: '2026-03-06',
  },
  {
    id: 'cdhr-2026',
    source: 'parameters',
    category: 'fiscalite-ir',
    subcategory: 'cdhr',
    title: 'CDHR — Contribution Différentielle Hauts Revenus (LF 2026)',
    content: `Nouveauté LF 2026 : taux minimum d'imposition de 20% du RFR pour les très hauts revenus.
Seuils : célibataire > 250 000 €, couple > 500 000 €. Si l'imposition effective (IR + CEHR) est < 20% du RFR, la CDHR comble le différentiel.
Mesure introduite par l'art. 3 de la LF 2025, reconduite en LF 2026.
Stratégies : PER (déduction), déficit foncier, investissements productifs pour réduire le RFR.
Source : fiscal-rules.ts centralisé (RULES.ir.cdhr).`,
    keywords: ['cdhr', 'contribution differentielle', 'hauts revenus', 'taux minimum', '20%', '250000', '500000', 'lf 2026', 'rfr'],
    legalReferences: ['LF 2026 art. 3', 'LF 2025 art. 3'],
    relatedChunkIds: ['cehr-2026', 'ir-bareme-2026'],
    professionalRelevance: ['cgp', 'tax_specialist'],
    difficulty: 'expert',
    lastUpdated: '2026-03-06',
  },
  {
    id: 'pv-immobiliere',
    source: 'tax-calculator',
    category: 'fiscalite-pv',
    subcategory: 'pv-immo',
    title: 'Plus-Values Immobilières — Calcul et Abattements',
    content: `PV immo (hors RP exonérée) : 19% IR + 17.2% PS = 36.2% avant abattements.
Abattements IR : 6%/an de 6e à 21e année, 4% la 22e → exo IR après 22 ans.
Abattements PS : 1.65%/an 6-21 ans, 1.6% 22e, 9%/an 23-30 ans → exo totale après 30 ans.
Surtaxe PV > 50k€ : 2% à 6%. RP exonérée. Exo si < 15k€.
PV = Prix cession − (Prix acquisition + frais 7.5% forfait + travaux 15% forfait après 5 ans).`,
    keywords: ['plus-value', 'immobiliere', 'abattement', 'duree detention', '22 ans', '30 ans', 'residence principale', 'exoneration', 'surtaxe', '36.2%'],
    legalReferences: ['CGI art. 150 U', 'CGI art. 150 VB', 'CGI art. 150 VC'],
    relatedChunkIds: ['ps-2026', 'immobilier-lmnp'],
    professionalRelevance: ['cgp', 'tax_specialist', 'real_estate_broker', 'notary'],
    difficulty: 'intermediate',
    lastUpdated: '2026-03-06',
  },
  {
    id: 'pv-mobiliere',
    source: 'tax-calculator',
    category: 'fiscalite-pv',
    subcategory: 'pv-mob',
    title: 'Plus-Values Mobilières — PFU et Régimes Spéciaux',
    content: `PFU 30% par défaut. Option barème : abattement durée détention (titres avant 2018) : 50% (2-8 ans), 65% (>8 ans).
Dirigeant retraite : abattement fixe 500 000 € (art. 150-0 D ter) + abattement renforcé 85% (>8 ans).
Report/sursis : apport à société contrôlée (art. 150-0 B ter). Moins-values : imputables 10 ans.`,
    keywords: ['plus-value', 'mobiliere', 'cession', 'valeurs mobilieres', 'abattement duree', 'dirigeant retraite', '500000', '150-0 d ter', '150-0 b ter', 'moins-value'],
    legalReferences: ['CGI art. 150-0 A', 'CGI art. 150-0 D ter', 'CGI art. 150-0 B ter'],
    relatedChunkIds: ['pfu-2026', 'corporate-cession', 'corporate-apport-cession'],
    professionalRelevance: ['cgp', 'tax_specialist', 'financial_analyst'],
    difficulty: 'expert',
    lastUpdated: '2026-03-06',
  },
  {
    id: 'reductions-credits-impot',
    source: 'parameters',
    category: 'fiscalite-ir',
    subcategory: 'reductions',
    title: 'Réductions et Crédits d\'Impôt 2026',
    content: `Plafonnement niches : 10 000 €/an (+8 000 € Outre-mer/SOFICA = 18 000 €).
Dons : 66% (plafond 20% revenus), 75% aide personnes (plafond Coluche DOUBLÉ à 2 000 € en 2026, LF 2026). Emploi domicile : CI 50% (max 12-15k€).
IR-PME : 25% (50/100k€). FIP/FCPI : 25% (12/24k€). SOFICA : 48% (18k€).
Girardin industriel : jusqu'à 40 909 € (hors plafonnement). Garde enfant <6 ans : 50% (max 3 500 €/enfant).
Pinel SUPPRIMÉ depuis le 31/12/2024. Denormandie prolongé jusqu'au 31/12/2027.`,
    keywords: ['reduction impot', 'credit impot', 'niche fiscale', 'plafonnement', '10000', 'dons', 'emploi domicile', 'pme', 'fip', 'fcpi', 'sofica', 'girardin', 'defiscalisation', 'coluche', '2000', 'pinel supprime', '2026'],
    legalReferences: ['CGI art. 200-0 A', 'CGI art. 199 terdecies-0 A', 'LF 2026'],
    relatedChunkIds: ['ir-bareme-2026'],
    professionalRelevance: ['cgp', 'tax_specialist'],
    difficulty: 'intermediate',
    lastUpdated: '2026-03-06',
  },
  {
    id: 'revenus-fonciers',
    source: 'tax-calculator',
    category: 'fiscalite-ir',
    subcategory: 'revenus-fonciers',
    title: 'Revenus Fonciers — Micro-foncier vs Réel',
    content: `Micro-foncier (<15k€ brut/an) : abattement 30%, barème + PS 17.2%.
Réel : déduction charges (travaux, intérêts, assurance, gestion 20€/lot, taxe foncière hors TEOM).
Déficit foncier : imputation revenu global max 10 700 €. Excédent reportable 10 ans sur RF.
Condition : maintien location 3 ans. Charge totale : TMI + 17.2%.`,
    keywords: ['revenus fonciers', 'micro foncier', 'regime reel', 'charges deductibles', 'deficit foncier', 'location nue', '10700', '21400', 'travaux'],
    legalReferences: ['CGI art. 28', 'CGI art. 31', 'CGI art. 156-I-3°'],
    relatedChunkIds: ['immobilier-deficit-foncier', 'immobilier-lmnp', 'ps-2026'],
    professionalRelevance: ['cgp', 'tax_specialist', 'real_estate_broker'],
    difficulty: 'intermediate',
    lastUpdated: '2026-03-06',
  },
]

export const CHUNKS_ASSURANCE_VIE: KnowledgeChunkV2[] = [
  {
    id: 'av-rachat-2025',
    source: 'simulator-av',
    category: 'assurance-vie',
    subcategory: 'rachat',
    title: 'Assurance-Vie — Fiscalité Rachats 2025 (art. 125-0 A)',
    content: `< 8 ans : PFU 30%. ≥ 8 ans : abattement 4 600€/9 200€, puis primes ≤150k → 7.5%+PS=24.7%, >150k → PFU 30%.
Option barème possible. Produits = Montant racheté × (Total produits / Valeur contrat).
Rachat partiel : contrat non clôturé. Astuce : rachats annuels pour optimiser l'abattement.`,
    keywords: ['assurance vie', 'rachat', 'abattement', '4600', '9200', 'pfu', '125-0 a', '8 ans', '150000', '7.5%', '24.7%'],
    legalReferences: ['CGI art. 125-0 A'],
    relatedChunkIds: ['av-deces-990i', 'av-deces-757b', 'pfu-2025'],
    professionalRelevance: ['cgp', 'insurance_broker', 'tax_specialist'],
    difficulty: 'intermediate',
    crmLink: '/dashboard/simulateurs/assurance-vie',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'av-deces-990i',
    source: 'simulator-av',
    category: 'assurance-vie',
    subcategory: 'deces',
    title: 'AV Décès — Art. 990 I (Primes avant 70 ans)',
    content: `Primes versées AVANT 70 ans : abattement 152 500€/bénéficiaire. 0-700k → 20%, >700k → 31.25%.
Conjoint/PACS exonéré. Clause démembrée : usufruit conjoint + NP enfants → double exonération.
Multi-bénéficiaires : abattement par bénéficiaire (tous contrats même assuré).
Mécanisme le plus puissant de transmission hors succession.`,
    keywords: ['assurance vie', 'deces', '990 i', '990i', '152500', 'beneficiaire', 'avant 70 ans', '20%', '31.25%', 'clause beneficiaire', 'demembree', 'hors succession'],
    legalReferences: ['CGI art. 990 I'],
    relatedChunkIds: ['av-deces-757b', 'abattements-succession'],
    professionalRelevance: ['cgp', 'insurance_broker', 'tax_specialist', 'notary'],
    difficulty: 'intermediate',
    crmLink: '/dashboard/simulateurs/assurance-vie',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'av-deces-757b',
    source: 'simulator-av',
    category: 'assurance-vie',
    subcategory: 'deces',
    title: 'AV Décès — Art. 757 B (Primes après 70 ans)',
    content: `Primes versées APRÈS 70 ans : abattement global 30 500€ (tous bénéficiaires confondus). Au-delà : droits de succession droit commun.
Avantage majeur : intérêts et PV TOTALEMENT exonérés de droits.
Ex: 100k€ versés → valorisés 180k€ au décès → 69.5k€ taxables (100k-30.5k), 80k€ de gains exonérés.
Stratégie : verser après 70 ans sur contrat dynamique (UC).`,
    keywords: ['assurance vie', 'deces', '757 b', '757b', '30500', 'apres 70 ans', 'interets exoneres', 'gains exoneres'],
    legalReferences: ['CGI art. 757 B'],
    relatedChunkIds: ['av-deces-990i', 'abattements-succession'],
    professionalRelevance: ['cgp', 'insurance_broker', 'tax_specialist', 'notary'],
    difficulty: 'intermediate',
    crmLink: '/dashboard/simulateurs/assurance-vie',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'av-gestion-contrat',
    source: 'simulator-av',
    category: 'assurance-vie',
    subcategory: 'gestion',
    title: 'Assurance-Vie — Gestion, Supports et Arbitrages',
    content: `Fonds euros : capital garanti, 2.5-3.5% (2024), PS annuels, effet cliquet. UC : OPCVM, ETF, SCPI, PE, structurés, pas de garantie.
Gestion libre/pilotée/sous mandat. Arbitrages : sécurisation, investissement progressif, stop-loss.
Clause bénéficiaire : nominative/démembrée/à défaut. Modifiable sauf si acceptée.
Avance : alternative au rachat (pas de fiscalité). Nantissement : garantie de prêt.
Contrat de capitalisation : transmissible par donation avec conservation antériorité fiscale.`,
    keywords: ['assurance vie', 'fonds euros', 'uc', 'arbitrage', 'gestion pilotee', 'clause beneficiaire', 'avance', 'nantissement', 'capitalisation'],
    legalReferences: ['Code assurances art. L132-1'],
    relatedChunkIds: ['av-rachat-2025', 'av-deces-990i'],
    professionalRelevance: ['cgp', 'insurance_broker', 'financial_analyst'],
    difficulty: 'basic',
    lastUpdated: '2025-01-01',
  },
]

export const CHUNKS_EPARGNE_RETRAITE: KnowledgeChunkV2[] = [
  {
    id: 'per-salarie-2026',
    source: 'simulator-per',
    category: 'epargne-retraite',
    subcategory: 'per-individuel',
    title: 'PER Individuel Salarié 2026 (art. 163 quatervicies)',
    content: `Plafond déduction : 10% revenus nets (plancher 4 806€, plafond 38 448€). PASS 2026 : 48 060€.
Reports 5 ans (au lieu de 3 ans, LF 2026) + mutualisation conjoint. Économie = TMI × versement.
Sortie capital : IR barème sur capital + PFU 31.4% sur gains. Sortie rente : pension art. 158-5-a + PS.
Déblocage anticipé : RP, invalidité, surendettement, chômage, liquidation, décès conjoint.
⚠️ LF 2026 : versements non déductibles après 70 ans (recentrage sur objectif retraite).
Simulateur CRM : getPlafondPERSalarie(revenuNet, reports...). Source : fiscal-rules.ts centralisé.`,
    keywords: ['per', 'plan epargne retraite', 'salarie', 'plafond', 'deduction', '163 quatervicies', 'pass', '48060', 'report', 'conjoint', 'economie impot', '38448', '4806', '2026', '70 ans', 'lf 2026'],
    legalReferences: ['CGI art. 163 quatervicies', 'LF 2026'],
    relatedChunkIds: ['per-tns-2026', 'ir-bareme-2026', 'retraite-simulation'],
    professionalRelevance: ['cgp', 'tax_specialist', 'insurance_broker'],
    difficulty: 'intermediate',
    crmLink: '/dashboard/simulateurs/per-salaries',
    lastUpdated: '2026-03-06',
  },
  {
    id: 'per-tns-2026',
    source: 'simulator-per',
    category: 'epargne-retraite',
    subcategory: 'per-tns',
    title: 'PER TNS (ex-Madelin) 2026 (art. 154 bis)',
    content: `Plafond TNS 2026 : 10% bénéfice (max 38 448€) + 15% entre 1-8 PASS (max 50 472€). Total max : 88 920€. Plancher : 4 806€. PASS 2026 : 48 060€.
Double avantage : économie IR (TMI) + économie cotisations sociales (~45%).
Ancien Madelin transférable vers PER (portabilité Pacte).
⚠️ LF 2026 : versements non déductibles après 70 ans.
Fonction CRM : getPlafondPERTNS(benefice) → { plafond, detail, economie }. Source : fiscal-rules.ts centralisé.`,
    keywords: ['per', 'tns', 'madelin', '154 bis', 'independant', 'liberal', 'benefice', 'plafond tns', '88920', 'cotisations sociales', '48060', '2026'],
    legalReferences: ['CGI art. 154 bis', 'LF 2026'],
    relatedChunkIds: ['per-salarie-2026', 'prevoyance-tns', 'corporate-remuneration'],
    professionalRelevance: ['cgp', 'tax_specialist', 'insurance_broker'],
    difficulty: 'intermediate',
    crmLink: '/dashboard/simulateurs/per-tns',
    lastUpdated: '2026-03-06',
  },
  {
    id: 'epargne-salariale',
    source: 'parameters',
    category: 'epargne-retraite',
    subcategory: 'epargne-salariale',
    title: 'Épargne Salariale — PEE, PERCO, Intéressement, Participation',
    content: `PEE : blocage 5 ans, abondement max 3 519€ (8% PASS), gains exo IR (PS 17.2% sortie).
PERCO/PERCOL : retraite, abondement max 7 039€ (16% PASS), capital ou rente.
Intéressement : plafond 34 776€ (75% PASS), exo IR si placé. Participation : obligatoire >50 salariés.
Abondement : exo charges (hors CSG/CRDS 9.7% + forfait social 20% ou 0%). Transfert PEE→PER possible.`,
    keywords: ['epargne salariale', 'pee', 'perco', 'percol', 'interessement', 'participation', 'abondement', '3519', '7039'],
    legalReferences: ['C. trav. art. L3332-1'],
    relatedChunkIds: ['per-salarie-2026', 'pea-2026'],
    professionalRelevance: ['cgp', 'tax_specialist'],
    difficulty: 'intermediate',
    lastUpdated: '2026-03-06',
  },
]

export const CHUNKS_ENVELOPPES: KnowledgeChunkV2[] = [
  {
    id: 'pea-2026',
    source: 'simulator-enveloppe',
    category: 'enveloppes-fiscales',
    subcategory: 'pea',
    title: 'PEA 2026 — Plan d\'Épargne en Actions',
    content: `Plafond 150k€ (PEA-PME 225k€ cumulé). <5 ans : PFU 30% + clôture. ≥5 ans : exo IR, PS 17.2% seulement.
Depuis loi PACTE (2019) : retraits partiels après 5 ans sans clôture. Rente viagère >5 ans : exo IR.
Éligible : actions EU/EEE, ETF PEA. Interdit : obligations pures, monétaire pur.
Simulateur CRM compare PEA vs CTO vs AV.`,
    keywords: ['pea', 'plan epargne actions', '150000', '225000', 'exoneration', '5 ans', 'actions', 'etf', 'pea-pme', 'pacte'],
    legalReferences: ['CGI art. 163 quinquies D'],
    relatedChunkIds: ['enveloppe-comparison', 'pfu-2026'],
    professionalRelevance: ['cgp', 'financial_analyst', 'fund_manager'],
    difficulty: 'basic',
    crmLink: '/dashboard/simulateurs/enveloppe-fiscale',
    lastUpdated: '2026-03-06',
  },
  {
    id: 'enveloppe-comparison',
    source: 'simulator-enveloppe',
    category: 'enveloppes-fiscales',
    subcategory: 'comparaison',
    title: 'Comparaison Enveloppes — CTO vs PEA vs AV vs PER',
    content: `CTO : pas de plafond, PFU 30% sur chaque gain, univers illimité. PEA : 150k€, exo IR >5 ans, actions EU.
AV : pas de plafond, abattement >8 ans, transmission 152.5k€/bénéf. PER : déduction entrée (TMI), bloqué retraite.
Hiérarchie classique : 1. PEA (actions EU) → 2. AV (flexibilité+transmission) → 3. PER (TMI ≥30%) → 4. CTO (complément).`,
    keywords: ['cto', 'pea', 'assurance vie', 'per', 'comparaison', 'enveloppe', 'fiscalite', 'rendement net', 'hierarchie'],
    legalReferences: [],
    relatedChunkIds: ['pea-2026', 'av-rachat-2025', 'per-salarie-2026'],
    professionalRelevance: ['cgp', 'financial_analyst', 'insurance_broker', 'fund_manager'],
    difficulty: 'basic',
    crmLink: '/dashboard/simulateurs/enveloppe-fiscale',
    lastUpdated: '2026-03-06',
  },
  {
    id: 'livrets-reglementes',
    source: 'parameters',
    category: 'enveloppes-fiscales',
    subcategory: 'livrets',
    title: 'Livrets Réglementés 2026',
    content: `Livret A : 22 950€, 2.4% (au 01/02/2026), exo IR+PS. LDDS : 12 000€, 2.4%, exo. LEP : 10 000€, 3.5%, sous conditions revenus.
CEL : 15 300€, 1.5%, PFU. PEL : 61 200€, taux fixé ouverture (1.75% pour PEL ouverts en 2026), PFU dès 1ère année.
Optimal : LA+LDDS = 34 950€ épargne de précaution exonérée. LEP si éligible (meilleur taux garanti).
Fonds euros 2025 : 2.5-3.5%. SCPI rendement moyen : 4.5-5.5%.
Source : fiscal-rules.ts centralisé (RULES.placements).`,
    keywords: ['livret a', 'ldds', 'lep', 'cel', 'pel', 'epargne reglementee', '2.4%', '3.5%', '22950', '12000', '2026', 'fonds euros', 'scpi'],
    legalReferences: ['CMF art. L221-1', 'Arrêté 28/01/2026'],
    relatedChunkIds: ['enveloppe-comparison', 'audit-epargne-precaution'],
    professionalRelevance: ['cgp', 'insurance_broker'],
    difficulty: 'basic',
    lastUpdated: '2026-03-06',
  },
]

export const CHUNKS_SUCCESSION: KnowledgeChunkV2[] = [
  {
    id: 'abattements-succession',
    source: 'simulator-succession',
    category: 'succession-donation',
    subcategory: 'abattements',
    title: 'Abattements Succession et Donation 2026',
    content: `Renouvellement tous les 15 ans (donations). Enfant : 100 000€. Petit-enfant : 31 865€. Arrière-PE : 5 310€.
Conjoint succession : EXONÉRATION TOTALE (TEPA 2007). Conjoint donation : 80 724€.
Frère/sœur : 15 932€ (exo succession sous conditions). Neveu/nièce : 7 967€. Handicapé : +159 325€ (cumulable).
Don familial art. 790 G : 31 865€ exo si donateur <80 ans, donataire ≥18 ans.`,
    keywords: ['succession', 'donation', 'abattement', 'enfant', '100000', 'conjoint', 'exoneration', 'droits', '15 ans', 'ligne directe', 'dmtg', '80724', '31865', '159325', '790 g', 'tepa'],
    legalReferences: ['CGI art. 779', 'CGI art. 790 B', 'CGI art. 790 G', 'CGI art. 796-0 bis'],
    relatedChunkIds: ['bareme-succession', 'donation-strategies', 'demembrement-669'],
    professionalRelevance: ['cgp', 'tax_specialist', 'notary', 'insurance_broker'],
    difficulty: 'basic',
    crmLink: '/dashboard/simulateurs/succession',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'bareme-succession',
    source: 'simulator-succession',
    category: 'succession-donation',
    subcategory: 'bareme',
    title: 'Barème Droits de Succession et Donation',
    content: `Ligne directe après abattement : 0-8 072€ 5% | 8-12k 10% | 12-15.9k 15% | 15.9-552k 20% | 552-902k 30% | 902k-1.8M 40% | >1.8M 45%.
Frères/sœurs : <24 430€ 35%, au-delà 45%. Parents 4e degré : 55%. Non-parents : 60%.
Paiement fractionné (3 ans) ou différé (NP, entreprise) possible.`,
    keywords: ['bareme', 'droits succession', 'droits donation', 'ligne directe', '20%', '30%', '45%', 'freres soeurs', '55%', '60%'],
    legalReferences: ['CGI art. 777', 'CGI art. 780'],
    relatedChunkIds: ['abattements-succession', 'donation-strategies'],
    professionalRelevance: ['cgp', 'tax_specialist', 'notary'],
    difficulty: 'basic',
    crmLink: '/dashboard/simulateurs/succession',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'demembrement-669',
    source: 'parameters',
    category: 'succession-donation',
    subcategory: 'demembrement',
    title: 'Démembrement — Barème Fiscal Art. 669 CGI',
    content: `Barème viager : <21→90/10 | 21-30→80/20 | 31-40→70/30 | 41-50→60/40 | 51-60→50/50 | 61-70→40/60 | 71-80→30/70 | 81-90→20/80 | >91→10/90.
Applications : 1) Donation NP → droits réduits 2) IFI : NP exclue 3) SCPI NP : décote, 0 fiscalité pendant démembrement 4) Temporaire : durée fixe.
Fonction CRM : getUsufruit(age) → % usufruit.`,
    keywords: ['demembrement', 'usufruit', 'nue-propriete', '669', 'bareme', 'donation', 'ifi', 'scpi demembrement', 'temporaire', 'viager'],
    legalReferences: ['CGI art. 669'],
    relatedChunkIds: ['ifi-bareme-2025', 'abattements-succession', 'immobilier-scpi', 'donation-strategies'],
    professionalRelevance: ['cgp', 'tax_specialist', 'notary', 'real_estate_broker'],
    difficulty: 'intermediate',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'donation-dernier-vivant',
    source: 'knowledge-pro',
    category: 'succession-donation',
    subcategory: 'donation-entre-epoux',
    title: 'Donation au Dernier Vivant (DDV) — Art. 1094-1 Code Civil',
    content: `La donation au dernier vivant (DDV), aussi appelée "donation entre époux", est un acte notarié permettant d'augmenter les droits successoraux du conjoint survivant au-delà de ce que prévoit la loi (art. 757 C. civ).

Options offertes au conjoint survivant (art. 1094-1 C. civ) :
- Option 1 : L'usufruit de la TOTALITÉ de la succession (option la plus courante)
- Option 2 : 1/4 en pleine propriété + 3/4 en usufruit
- Option 3 : La quotité disponible en pleine propriété (1/2, 1/3 ou 1/4 selon le nombre d'enfants, art. 913 C. civ)

Comparaison SANS DDV (droits légaux, art. 757) : le conjoint choisit entre 1/4 PP ou usufruit total (si tous les enfants sont communs).
Comparaison AVEC DDV : les 3 options ci-dessus + droit légal → le conjoint a PLUS de choix et de flexibilité.

Points clés :
- Acte notarié obligatoire (révocable unilatéralement à tout moment, sauf si fait par contrat de mariage)
- GRATUIT en termes de droits de mutation (pas de taxation, pas d'abattement consommé)
- Le conjoint survivant est EXONÉRÉ de droits de succession (art. 796-0 bis CGI, loi TEPA 2007)
- Applicable uniquement entre ÉPOUX (pas aux partenaires PACS ni aux concubins)
- Les partenaires PACS bénéficient de l'exonération DMTG mais pas de droits légaux sauf testament
- La DDV ne prend effet QU'AU DÉCÈS du donateur (= libéralité pour cause de mort)
- En présence d'enfants d'un autre lit, l'usufruit total n'est plus de droit : la DDV permet de le rétablir (mais les enfants peuvent demander la conversion en rente, art. 759 C. civ)
- Coût notaire DDV : environ 200-400€ (très faible rapport coût/bénéfice)

Stratégie CGP : recommander systématiquement la DDV aux couples mariés, surtout en présence d'enfants non communs ou de patrimoine immobilier (évite le démembrement subi). À combiner avec clause de préciput dans le contrat de mariage et assurance-vie.`,
    keywords: ['donation dernier vivant', 'ddv', 'donation entre epoux', 'conjoint survivant', 'usufruit total', 'quotite disponible', '1094-1', 'protection conjoint', 'droits successoraux', 'notaire', 'succession epoux', 'dernier vivant', 'donation au dernier vivant'],
    legalReferences: ['CC art. 1094-1', 'CC art. 757', 'CC art. 913', 'CC art. 759', 'CGI art. 796-0 bis'],
    relatedChunkIds: ['abattements-succession', 'bareme-succession', 'demembrement-669', 'donation-strategies', 'av-deces-990i'],
    professionalRelevance: ['cgp', 'tax_specialist', 'notary', 'insurance_broker'],
    difficulty: 'intermediate',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'donation-strategies',
    source: 'simulator-donation',
    category: 'succession-donation',
    subcategory: 'strategies',
    title: 'Stratégies de Donation Optimisées',
    content: `1. Donation NP : abattement + décote NP. Ex: parent 62 ans, bien 500k → NP=300k - 100k abattement = 200k taxable.
2. Donation-partage (art. 1076) : fige valeurs au jour de l'acte. 3. Réserve d'usufruit : conserve revenus.
4. Dutreil (787 B/C) : abattement 75% parts entreprise. Ex: parts 2M → base 500k - 100k = 400k → droits ~78k.
5. Don familial 790 G : 31 865€ exo. 6. DDV : quotité disponible majorée entre époux.
7. Donation graduelle/résiduelle : contrôle sur 2 générations.`,
    keywords: ['donation', 'optimisation', 'nue-propriete', 'partage', 'dutreil', '787 b', '787 c', 'don familial', 'strategie', 'usufruit', 'ddv', '790 g', '75%'],
    legalReferences: ['CGI art. 787 B', 'CGI art. 787 C', 'CGI art. 790 G', 'CC art. 1076'],
    relatedChunkIds: ['abattements-succession', 'demembrement-669', 'bareme-succession'],
    professionalRelevance: ['cgp', 'tax_specialist', 'notary'],
    difficulty: 'expert',
    crmLink: '/dashboard/simulateurs/donation-optimizer',
    lastUpdated: '2025-01-01',
  },
]

export const CHUNKS_IMMOBILIER: KnowledgeChunkV2[] = [
  {
    id: 'immobilier-lmnp',
    source: 'simulator-immobilier',
    category: 'immobilier',
    subcategory: 'lmnp',
    title: 'LMNP — Loueur Meublé Non Professionnel',
    content: `Conditions : recettes <23k€/an ET < revenus pro. Micro-BIC : abattement 50% (30% tourisme zone tendue). Seuil 77 700€.
Réel : charges + amortissements (immeuble 25-30 ans, mobilier 5-10 ans, travaux 10-15 ans).
Amortissement non réintégré dans PV (art. 150 U). ATTENTION réforme 2025 : réintégration possible.
Avantage : revenus quasi nets d'impôt 15-20 ans. Simulateur CRM projette cash-flows et TRI.`,
    keywords: ['lmnp', 'meuble', 'location meublee', 'non professionnel', 'micro-bic', 'amortissement', 'regime reel', 'cash flow', '23000', 'bic', 'reforme 2025'],
    legalReferences: ['CGI art. 35 bis', 'CGI art. 39', 'CGI art. 150 U'],
    relatedChunkIds: ['immobilier-lmp', 'revenus-fonciers', 'pv-immobiliere'],
    professionalRelevance: ['cgp', 'tax_specialist', 'real_estate_broker'],
    difficulty: 'intermediate',
    crmLink: '/dashboard/simulateurs/immobilier/lmnp',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'immobilier-lmp',
    source: 'simulator-immobilier',
    category: 'immobilier',
    subcategory: 'lmp',
    title: 'LMP — Loueur Meublé Professionnel',
    content: `Conditions cumulatives (2020+) : recettes >23k€ ET > revenus pro. BIC professionnel.
Déficit imputable sur revenu global (sans limite). PV pro art. 151 septies : exo totale si recettes <90k€ + >5 ans.
Cotisations SSI ~35-45% du bénéfice (principal inconvénient). Exonération IFI (biens professionnels).
Dutreil possible pour LMP. Passage LMNP→LMP automatique si conditions remplies.`,
    keywords: ['lmp', 'loueur meuble professionnel', '23000', 'deficit global', 'plus-value professionnelle', '151 septies', 'exoneration', 'cotisations sociales', 'ifi', 'ssi'],
    legalReferences: ['CGI art. 155-IV', 'CGI art. 151 septies', 'CGI art. 975'],
    relatedChunkIds: ['immobilier-lmnp', 'ifi-bareme-2025'],
    professionalRelevance: ['cgp', 'tax_specialist', 'real_estate_broker'],
    difficulty: 'expert',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'immobilier-scpi',
    source: 'simulator-immobilier',
    category: 'immobilier',
    subcategory: 'scpi',
    title: 'SCPI — Pierre-Papier (Guide Complet)',
    content: `Rendement 4.5-6% (TDVM 2024). Ticket : 200-1 000€. Fiscalité : RF → IR+PS 17.2%.
SCPI européennes : taux effectif ou crédit d'impôt → fiscalité plus douce. Frais : souscription 8-12%, gestion 8-12%.
Modes : 1) PP 2) NP temporaire (décote 20-40%, 0 fiscalité) 3) En AV 4) À crédit (levier) 5) SCI IS (amortissement).
PV cession : PV immo particuliers (abattements durée).`,
    keywords: ['scpi', 'pierre papier', 'rendement', 'revenus fonciers', 'demembrement scpi', 'nue-propriete', 'europeenne', 'assurance vie scpi', 'credit', 'tdvm'],
    legalReferences: ['CMF art. L214-86'],
    relatedChunkIds: ['revenus-fonciers', 'demembrement-669', 'av-gestion-contrat', 'immobilier-sci'],
    professionalRelevance: ['cgp', 'financial_analyst', 'real_estate_broker', 'insurance_broker'],
    difficulty: 'intermediate',
    crmLink: '/dashboard/simulateurs/immobilier/scpi',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'immobilier-sci',
    source: 'simulator-immobilier',
    category: 'immobilier',
    subcategory: 'sci',
    title: 'SCI — IR vs IS, Avantages et Pièges',
    content: `SCI IR : transparence, RF pour location nue, PV particuliers, pas d'amortissement. Meublé en SCI IR → risque IS.
SCI IS : amortissement déductible, IS 15% (<42.5k€) puis 25%, PV pro à la cession (énorme après amortissements), dividendes PFU 30%.
Avantages SCI : gestion familiale, transmission (donation parts + décote 10-20% illiquidité/minorité), démembrement parts.
IR = détention long terme + transmission. IS = cash-flow optimisé + réinvestissement.`,
    keywords: ['sci', 'societe civile immobiliere', 'ir', 'is', 'transparence', 'amortissement', 'donation parts', 'decote', 'transmission', 'requalification'],
    legalReferences: ['CC art. 1845', 'CGI art. 206-2', 'CGI art. 8'],
    relatedChunkIds: ['immobilier-lmnp', 'demembrement-669', 'corporate-holding', 'revenus-fonciers'],
    professionalRelevance: ['cgp', 'tax_specialist', 'notary', 'real_estate_broker'],
    difficulty: 'expert',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'immobilier-deficit-foncier',
    source: 'simulator-immobilier',
    category: 'immobilier',
    subcategory: 'deficit-foncier',
    title: 'Déficit Foncier — Optimisation Fiscale',
    content: `Si charges > RF : imputation revenu global max 10 700€ (21 400€ réno énergétique jusqu'à fin 2025).
Excédent reportable 10 ans sur RF. Condition : location 3 ans après imputation.
Charges éligibles : travaux entretien/réparation/amélioration, intérêts (sur RF uniquement), assurance, gestion.
Effet : TMI × déficit. Ex: TMI 41%, déficit 10 700€ → économie 4 387€.`,
    keywords: ['deficit foncier', 'travaux', '10700', '21400', 'imputation', 'revenu global', 'charges deductibles', 'renovation energetique'],
    legalReferences: ['CGI art. 156-I-3°'],
    relatedChunkIds: ['revenus-fonciers', 'immobilier-lmnp'],
    professionalRelevance: ['cgp', 'tax_specialist', 'real_estate_broker'],
    difficulty: 'intermediate',
    crmLink: '/dashboard/simulateurs/immobilier/deficit-foncier',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'immobilier-pinel',
    source: 'simulator-immobilier',
    category: 'immobilier',
    subcategory: 'pinel',
    title: 'Pinel — Supprimé au 31/12/2024',
    content: `Dispositif Pinel (art. 199 novovicies) SUPPRIMÉ pour les nouvelles acquisitions depuis le 01/01/2025.
Investissements existants : réductions maintenues. Pinel+ : 12% (6 ans), 18% (9 ans), 21% (12 ans).
Plafond 300k€/an, 5 500€/m². Conditions : location nue, plafonds loyer/ressources, zones tendues.
Alternative 2025 : Denormandie ancien, déficit foncier, Loc'Avantages.`,
    keywords: ['pinel', 'reduction impot', '199 novovicies', 'supprime 2025', 'location nue', 'zone tendue'],
    legalReferences: ['CGI art. 199 novovicies'],
    relatedChunkIds: ['immobilier-deficit-foncier', 'reductions-credits-impot'],
    professionalRelevance: ['cgp', 'tax_specialist', 'real_estate_broker'],
    difficulty: 'basic',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'immobilier-financement',
    source: 'simulator-emprunt',
    category: 'immobilier',
    subcategory: 'financement',
    title: 'Financement Immobilier — HCSF, Capacité, PTZ',
    content: `Norme HCSF (obligatoire 2022+) : endettement max 35% revenus nets, durée max 25 ans (27 ans VEFA).
Capacité emprunt = (Revenus × 35% − charges existantes) × coefficient durée.
PTZ 2025 : élargi (zones A bis, A, B1 pour neuf, toutes zones pour ancien avec travaux). Plafond selon zone et composition familiale.
Assurance emprunteur : loi Lemoine (résiliation à tout moment). Délégation d'assurance : économie 30-50%.
Simulateur CRM : mensualité, capital empruntable, coût total crédit.`,
    keywords: ['emprunt', 'capacite', 'hcsf', '35%', 'endettement', 'mensualite', 'credit', 'ptz', 'pret taux zero', 'assurance emprunteur', 'lemoine'],
    legalReferences: ['Décision HCSF D-2021-16'],
    relatedChunkIds: ['audit-budget', 'immobilier-lmnp'],
    professionalRelevance: ['cgp', 'real_estate_broker'],
    difficulty: 'basic',
    crmLink: '/dashboard/simulateurs/capacite-emprunt',
    lastUpdated: '2025-01-01',
  },
]

export const CHUNKS_RETRAITE_PROTECTION: KnowledgeChunkV2[] = [
  {
    id: 'retraite-simulation',
    source: 'simulator-retraite',
    category: 'retraite',
    subcategory: 'simulation',
    title: 'Retraite — Pension, Trimestres et Gap',
    content: `Pension base (régime général) : SAM × Taux × (Trimestres validés / Trimestres requis).
Taux plein : 50% à l'âge légal (64 ans, réforme 2023) avec durée d'assurance complète.
Décote : -1.25%/trimestre manquant (max 20). Surcote : +1.25%/trimestre au-delà taux plein.
Complémentaire Agirc-Arrco : Points × Valeur (1.4159€ en 2024). Malus temporaire -10% si départ au taux plein.
Gap retraite = Revenus souhaités − Pension totale. Capital nécessaire ≈ Gap annuel / 3-4%.
Simulateur CRM projette scénarios par âge de départ.`,
    keywords: ['retraite', 'pension', 'trimestre', 'taux plein', 'decote', 'surcote', 'gap', 'agirc-arrco', 'points', 'age legal', '64 ans', 'sam'],
    legalReferences: ['CSS art. L351-1'],
    relatedChunkIds: ['per-salarie-2025', 'per-tns-2025'],
    professionalRelevance: ['cgp', 'tax_specialist', 'insurance_broker'],
    difficulty: 'intermediate',
    crmLink: '/dashboard/simulateurs/retraite',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'prevoyance-tns',
    source: 'simulator-prevoyance',
    category: 'protection-prevoyance',
    subcategory: 'prevoyance-tns',
    title: 'Prévoyance TNS — Protection du Travailleur Indépendant',
    content: `Risques : incapacité temporaire (IJ, franchise 3-90j), invalidité (1re/2e/3e cat.), décès (capital + rente éducation + rente conjoint).
Contrats Madelin (art. 154 bis) : primes déductibles du bénéfice.
Plafond déduction : 3.75% bénéfice + 7% PASS (max 3% de 8 PASS).
Attention : couverture obligatoire SSI très faible pour les TNS → complémentaire indispensable.
Simulateur CRM estime garanties nécessaires et cotisations.`,
    keywords: ['prevoyance', 'tns', 'independant', 'incapacite', 'invalidite', 'deces', 'madelin', 'ij', 'franchise', 'rente education'],
    legalReferences: ['CGI art. 154 bis'],
    relatedChunkIds: ['per-tns-2025', 'corporate-remuneration'],
    professionalRelevance: ['cgp', 'insurance_broker'],
    difficulty: 'intermediate',
    crmLink: '/dashboard/simulateurs/prevoyance-tns',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'audit-budget',
    source: 'audit-engine',
    category: 'budget-endettement',
    subcategory: 'audit',
    title: 'Audit Budgétaire — Moteur d\'Analyse CRM',
    content: `Analyse : revenus (salaires, locatifs, financiers, TNS), charges (logement, transport, crédits, divers).
Indicateurs : taux d'effort, taux d'épargne, reste à vivre, répartition 50/30/20.
Score santé budgétaire : excellent (>20% épargne), bon (>10%), attention (>0%), critique (<0%).
Recommandations et alertes automatiques selon le profil.`,
    keywords: ['budget', 'audit', 'revenus', 'charges', 'taux effort', 'taux epargne', 'reste a vivre', '50/30/20', 'sante budgetaire'],
    legalReferences: [],
    relatedChunkIds: ['immobilier-financement', 'audit-epargne-precaution'],
    professionalRelevance: ['cgp', 'insurance_broker'],
    difficulty: 'basic',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'audit-epargne-precaution',
    source: 'audit-engine',
    category: 'budget-endettement',
    subcategory: 'epargne-precaution',
    title: 'Épargne de Précaution — Recommandations',
    content: `Règle : 3 à 6 mois de charges fixes en épargne disponible (livrets réglementés).
Salarié : 3 mois minimum. TNS/indépendant : 6-12 mois (revenus irréguliers).
Support recommandé : Livret A + LDDS (34 950€ exo) + LEP si éligible.
Au-delà : fonds euros AV (disponible sous 72h, rendement supérieur).
Moteur d'audit CRM calcule le montant optimal selon le profil.`,
    keywords: ['epargne precaution', 'securite', '3 mois', '6 mois', 'livret', 'disponible', 'urgence', 'matelas securite'],
    legalReferences: [],
    relatedChunkIds: ['livrets-reglementes', 'audit-budget', 'av-gestion-contrat'],
    professionalRelevance: ['cgp', 'insurance_broker'],
    difficulty: 'basic',
    lastUpdated: '2025-01-01',
  },
  {
    id: 'audit-synthese',
    source: 'audit-engine',
    category: 'general',
    subcategory: 'audit-global',
    title: 'Audit Patrimonial Complet — Synthèse et Scoring',
    content: `Moteur V3 : Budget, Emprunt, Fiscalité (IR+IFI+optimisation+RF), Épargne précaution, Immobilier (rendement, PV, cash-flow), Financier (allocation, risque), Retraite (pension, gap), Succession (droits, AV, stratégies).
Score global 0-100, scores par thème, points forts/vigilance, actions prioritaires.
Préconisations auto : priorité, catégorie, montant estimé, horizon temporel, score d'impact.`,
    keywords: ['audit', 'patrimonial', 'synthese', 'score', 'preconisation', 'analyse', 'global', 'complet', 'bilan'],
    legalReferences: [],
    relatedChunkIds: ['audit-budget', 'retraite-simulation'],
    professionalRelevance: ['cgp', 'tax_specialist', 'insurance_broker'],
    difficulty: 'basic',
    lastUpdated: '2025-01-01',
  },
]

// ── Export agrégé ──
export const ALL_CORE_CHUNKS: KnowledgeChunkV2[] = [
  ...CHUNKS_FISCALITE,
  ...CHUNKS_ASSURANCE_VIE,
  ...CHUNKS_EPARGNE_RETRAITE,
  ...CHUNKS_ENVELOPPES,
  ...CHUNKS_SUCCESSION,
  ...CHUNKS_IMMOBILIER,
  ...CHUNKS_RETRAITE_PROTECTION,
]
