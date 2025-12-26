/**
 * CONFIGURATION CENTRALISÉE DES APIs EXTERNES
 * APIs 100% gratuites du gouvernement français
 */

export const API_CONFIG = {
  // API SIRENE - Recherche d'Entreprises (GRATUITE)
  SIRENE: {
    baseUrl: 'https://recherche-entreprises.api.gouv.fr',
    endpoints: { search: '/search' },
    rateLimit: 7,
    timeout: 10000,
    enabled: true,
  },

  // API BAN - Base Adresse Nationale (GRATUITE)
  BAN: {
    baseUrl: 'https://api-adresse.data.gouv.fr',
    endpoints: { search: '/search/', reverse: '/reverse/' },
    timeout: 5000,
    enabled: true,
  },

  // API Géo - Données Géographiques (GRATUITE)
  GEO: {
    baseUrl: 'https://geo.api.gouv.fr',
    endpoints: { communes: '/communes', departements: '/departements' },
    timeout: 5000,
    enabled: true,
  },

  // Conventions Collectives (DONNÉES LOCALES)
  CONVENTIONS: {
    enabled: true,
    source: 'local',
  },
} as const

export const ENV_KEYS = {
  API_ENTREPRISE_TOKEN: process.env.API_ENTREPRISE_TOKEN,
  CACHE_TTL_ENTREPRISE: parseInt(process.env.CACHE_TTL_ENTREPRISE || '86400'),
} as const

export function isApiEnabled(apiName: keyof typeof API_CONFIG): boolean {
  return API_CONFIG[apiName].enabled
}
