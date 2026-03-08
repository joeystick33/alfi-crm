/**
 * =============================================================================
 * EXTENSION PRÉVOYANCE & RETRAITE TNS / PROFESSIONS LIBÉRALES — ALFI CRM
 * =============================================================================
 *
 * 📅 Année : 2026 | 📋 Version : 2026.1.0 | 🔄 MAJ : 06/03/2026
 *
 * Sources : URSSAF, CNAVPL, CIPAV, CARMF, CARPIMKO, CAVEC, CNBF,
 *           CPAM/Ameli, Décret n°2024-688, LFSS 2026
 * =============================================================================
 */

export { PREVOYANCE_RETRAITE } from './fiscal-rules-prevoyance-data'

export type {
  PrevoyanceCPAMConfig,
  PrevoyanceTNSConfig,
  MadelinPrevoyanceConfig,
  CotisationsTNSConfig,
  RetraiteBaseCNAVPLConfig,
  CaissePLConfig,
  PrevoyanceRetraiteConfig,
} from './fiscal-rules-prevoyance-types'

export {
  calculIJCPAM,
  calculCotisationBaseCNAVPL,
  calculPensionBaseCNAVPL,
  calculPlafondMadelinPrevoyance,
  calculCotisationsTNS,
} from './fiscal-rules-prevoyance-helpers'
