// ============================================================
// Règles fiscales 2026 — fidèlement portées depuis fiscal-rules.yml
// ============================================================

import type { FiscalRules } from './types'

export const FISCAL_RULES_2026: FiscalRules = {
  year: 2026,

  abatementsByLink: {
    DIRECT_LINE:  { amount: 100_000 },
    SIBLINGS:     { amount: 15_932 },
    NIECE_NEPHEW: { amount: 7_967 },
    GRANDPARENT:  { amount: 100_000 },
    UNCLE_AUNT:   { amount: 1_594 },
    OTHERS:       { amount: 1_594 },
  },

  scalesByLink: {
    DIRECT_LINE: {
      slices: [
        { upperLimitInc: 8_072,     rate: 0.05 },
        { upperLimitInc: 12_109,    rate: 0.10 },
        { upperLimitInc: 15_932,    rate: 0.15 },
        { upperLimitInc: 552_324,   rate: 0.20 },
        { upperLimitInc: 902_838,   rate: 0.30 },
        { upperLimitInc: 1_805_677, rate: 0.40 },
        { upperLimitInc: null,      rate: 0.45 },
      ],
    },
    SIBLINGS: {
      slices: [
        { upperLimitInc: 24_430, rate: 0.35 },
        { upperLimitInc: null,   rate: 0.45 },
      ],
    },
    NIECE_NEPHEW: {
      slices: [
        { upperLimitInc: null, rate: 0.55 },
      ],
    },
    GRANDPARENT: {
      slices: [
        { upperLimitInc: 8_072,     rate: 0.05 },
        { upperLimitInc: 12_109,    rate: 0.10 },
        { upperLimitInc: 15_932,    rate: 0.15 },
        { upperLimitInc: 552_324,   rate: 0.20 },
        { upperLimitInc: 902_838,   rate: 0.30 },
        { upperLimitInc: 1_805_677, rate: 0.40 },
        { upperLimitInc: null,      rate: 0.45 },
      ],
    },
    UNCLE_AUNT: {
      slices: [
        { upperLimitInc: null, rate: 0.55 },
      ],
    },
    OTHERS: {
      slices: [
        { upperLimitInc: null, rate: 0.60 },
      ],
    },
  },

  usufructLevels: [
    { maxAgeInclus: 20, pctUsufruit: 90 },
    { maxAgeInclus: 30, pctUsufruit: 80 },
    { maxAgeInclus: 40, pctUsufruit: 70 },
    { maxAgeInclus: 50, pctUsufruit: 60 },
    { maxAgeInclus: 60, pctUsufruit: 50 },
    { maxAgeInclus: 70, pctUsufruit: 40 },
    { maxAgeInclus: 80, pctUsufruit: 30 },
    { maxAgeInclus: 90, pctUsufruit: 20 },
    { maxAgeInclus: 91, pctUsufruit: 10 },
  ],

  abatementsPrincipalResidencePct: 0.20,
  disabilityAllowance: 159_325,
  donationRecallYears: 15,

  // Assurance-vie art. 990 I CGI (versements avant 70 ans)
  lifeInsuranceBefore70GlobalAbatement: 152_500,
  lifeInsurance990IRate1: 0.20,
  lifeInsurance990IRate2: 0.3125,
  lifeInsurance990IThreshold: 700_000,

  // Assurance-vie art. 757 B CGI (versements après 70 ans)
  lifeInsuranceAfter70ReintegrationThreshold: 30_500,
}

export function getFiscalRules(year: number): FiscalRules {
  // Pour l'instant, seul 2026 est supporté
  if (year >= 2026) return FISCAL_RULES_2026
  // Fallback: mêmes règles (les barèmes n'ont pas changé significativement)
  return FISCAL_RULES_2026
}
