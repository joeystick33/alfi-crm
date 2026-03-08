/**
 * Configuration centrale des backends simulateurs
 * Java Spring Boot (5) + Node.js (6) = 11 backends
 */

export interface BackendConfig {
  key: string
  name: string
  type: 'java' | 'nodejs'
  port: number
  baseUrl: string
  healthEndpoint: string
  endpoints: {
    path: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'SUPPRESSION'
    description: string
  }[]
}

// URLs des backends (configurables via env)
const getBackendUrl = (envKey: string, defaultPort: number): string => {
  return process.env[envKey] || `http://localhost:${defaultPort}`
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const BACKEND_CONFIGS: BackendConfig[] = [
  // ============================================
  // JAVA SPRING BOOT BACKENDS -> MIGRATED TO NEXT.JS
  // ============================================
  {
    key: 'assurance-vie',
    name: 'Simulateur Assurance-Vie',
    type: 'java', // Kept for compatibility but routes to Next.js
    port: 3000,
    baseUrl: `${APP_URL}/api/advisor/simulators/assurance-vie`,
    healthEndpoint: '', // Internal routes don't have dedicated health endpoint yet, but main health check handles it
    endpoints: [
      { path: '/simulate', method: 'POST', description: 'Simulation assurance-vie' }, // Path adapted relative to new baseUrl
      // { path: '/compare', method: 'POST', description: 'Comparaison contrats AV' }, // Not yet ported
    ],
  },
  {
    key: 'patrimoine', // Still external/missing
    name: 'Simulateur Patrimonial',
    type: 'java',
    port: 8081,
    baseUrl: getBackendUrl('JAVA_PATRIMOINE_URL', 8081),
    healthEndpoint: '/actuator/health',
    endpoints: [
      { path: '/api/lifeinsurance/analyze', method: 'POST', description: 'Analyse assurance-vie' },
    ],
  },
  {
    key: 'per-salaries',
    name: 'Simulateur PER Salariés',
    type: 'java',
    port: 3000,
    baseUrl: `${APP_URL}/api/advisor/simulators/per-salaries`,
    healthEndpoint: '',
    endpoints: [
      { path: '/simulate', method: 'POST', description: 'Simulation PER salarié' },
    ],
  },
  {
    key: 'immobilier',
    name: 'Simulateur Immobilier',
    type: 'java',
    port: 3000,
    baseUrl: `${APP_URL}/api/advisor/simulators/immobilier`,
    healthEndpoint: '',
    endpoints: [
      { path: '/simulate', method: 'POST', description: 'Simulation investissement' },
    ],
  },
  {
    key: 'prevoyance-tns',
    name: 'Simulateur Prévoyance TNS',
    type: 'java',
    port: 3000,
    baseUrl: `${APP_URL}/api/advisor/simulators/prevoyance-tns`,
    healthEndpoint: '',
    endpoints: [
      { path: '/simulate', method: 'POST', description: 'Simulation couverture' },
    ],
  },

  // ============================================
  // NODE.JS BACKENDS -> MIGRATED TO NEXT.JS
  // ============================================
  {
    key: 'capacite-emprunt',
    name: 'Calculateur Capacité d\'Emprunt',
    type: 'nodejs',
    port: 3000,
    baseUrl: `${APP_URL}/api/advisor/simulators/capacite-emprunt`,
    healthEndpoint: '',
    endpoints: [
      { path: '/calculate', method: 'POST', description: 'Calcul capacité' },
    ],
  },
  {
    key: 'mensualite', // Still external/missing
    name: 'Calculateur Mensualité Crédit',
    type: 'nodejs',
    port: 3002,
    baseUrl: getBackendUrl('NODE_MENSUALITE_URL', 3002),
    healthEndpoint: '/health',
    endpoints: [
      { path: '/api/mensualite/calculate', method: 'POST', description: 'Calcul mensualité' },
    ],
  },
  {
    key: 'enveloppe-fiscale', // Still external/missing
    name: 'Calculateur Enveloppe Fiscale TNS',
    type: 'nodejs',
    port: 3003,
    baseUrl: getBackendUrl('NODE_ENVELOPPE_FISCALE_URL', 3003),
    healthEndpoint: '/health',
    endpoints: [
      { path: '/api/enveloppe-fiscale/calculate', method: 'POST', description: 'Calcul enveloppe' },
    ],
  },
  {
    key: 'per-tns', // Still external/missing
    name: 'Simulateur PER TNS',
    type: 'nodejs',
    port: 3004,
    baseUrl: getBackendUrl('NODE_PER_TNS_URL', 3004),
    healthEndpoint: '/health',
    endpoints: [
      { path: '/api/per-tns/simulate', method: 'POST', description: 'Simulation PER TNS' },
    ],
  },
  {
    key: 'ptz', // Still external/missing
    name: 'Simulateur PTZ 2025',
    type: 'nodejs',
    port: 3005,
    baseUrl: getBackendUrl('NODE_PTZ_URL', 3005),
    healthEndpoint: '/health',
    endpoints: [
      { path: '/api/ptz/eligibility', method: 'POST', description: 'Éligibilité PTZ' },
    ],
  },
  {
    key: 'epargne',
    name: 'Simulateur Épargne Flexible',
    type: 'nodejs',
    port: 3000,
    baseUrl: `${APP_URL}/api/advisor/simulators/epargne`,
    healthEndpoint: '',
    endpoints: [
      { path: '/simulate', method: 'POST', description: 'Simulation épargne' },
    ],
  },
]

/**
 * Récupère la configuration d'un backend par sa clé
 */
export function getBackendConfig(key: string): BackendConfig | undefined {
  return BACKEND_CONFIGS.find(b => b.key === key)
}

/**
 * Récupère tous les backends d'un type donné
 */
export function getBackendsByType(type: 'java' | 'nodejs'): BackendConfig[] {
  return BACKEND_CONFIGS.filter(b => b.type === type)
}
