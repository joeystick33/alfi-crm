/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SERVICE SCRAPING ANIL - AIDES LOCALES ACCESSION PROPRIÉTÉ
 * Source: https://www.anil.org/aides-locales-accession-propriete/
 * 86+ aides régionales/départementales référencées
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { PRETS_REGIONAUX_2025 } from './parameters-ptz'
import { CacheFichier } from './cache-fichier'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface AideLocale {
  id: string
  nom: string
  organisme: string
  type: 'pret' | 'subvention' | 'bonification'
  departement: string
  region: string
  montantMin?: number
  montantMax: number
  taux: number
  dureeMax?: number
  conditions: string[]
  cumulable: string[]
  urlSource?: string
  dateMAJ: string
}

export interface AideLocaleRecherche {
  codeInsee: string
  departement: string
  region: string
  aides: AideLocale[]
  total: number
  capaciteBoost: number // Montant total des aides cumulables
}

// ══════════════════════════════════════════════════════════════════════════════
// MAPPING DÉPARTEMENTS → RÉGIONS
// ══════════════════════════════════════════════════════════════════════════════

const DEPARTEMENTS_REGIONS: Record<string, string> = {
  // Île-de-France
  '75': 'ile-de-france', '77': 'ile-de-france', '78': 'ile-de-france',
  '91': 'ile-de-france', '92': 'ile-de-france', '93': 'ile-de-france',
  '94': 'ile-de-france', '95': 'ile-de-france',
  // PACA
  '04': 'paca', '05': 'paca', '06': 'paca', '13': 'paca', '83': 'paca', '84': 'paca',
  // Nouvelle-Aquitaine
  '16': 'nouvelle-aquitaine', '17': 'nouvelle-aquitaine', '19': 'nouvelle-aquitaine',
  '23': 'nouvelle-aquitaine', '24': 'nouvelle-aquitaine', '33': 'nouvelle-aquitaine',
  '40': 'nouvelle-aquitaine', '47': 'nouvelle-aquitaine', '64': 'nouvelle-aquitaine',
  '79': 'nouvelle-aquitaine', '86': 'nouvelle-aquitaine', '87': 'nouvelle-aquitaine',
  // Occitanie
  '09': 'occitanie', '11': 'occitanie', '12': 'occitanie', '30': 'occitanie',
  '31': 'occitanie', '32': 'occitanie', '34': 'occitanie', '46': 'occitanie',
  '48': 'occitanie', '65': 'occitanie', '66': 'occitanie', '81': 'occitanie', '82': 'occitanie',
  // Bretagne
  '22': 'bretagne', '29': 'bretagne', '35': 'bretagne', '56': 'bretagne',
  // Auvergne-Rhône-Alpes
  '01': 'auvergne-rhone-alpes', '03': 'auvergne-rhone-alpes', '07': 'auvergne-rhone-alpes',
  '15': 'auvergne-rhone-alpes', '26': 'auvergne-rhone-alpes', '38': 'auvergne-rhone-alpes',
  '42': 'auvergne-rhone-alpes', '43': 'auvergne-rhone-alpes', '63': 'auvergne-rhone-alpes',
  '69': 'auvergne-rhone-alpes', '73': 'auvergne-rhone-alpes', '74': 'auvergne-rhone-alpes',
  // Hauts-de-France
  '02': 'hauts-de-france', '59': 'hauts-de-france', '60': 'hauts-de-france',
  '62': 'hauts-de-france', '80': 'hauts-de-france',
  // Normandie
  '14': 'normandie', '27': 'normandie', '50': 'normandie', '61': 'normandie', '76': 'normandie',
  // Grand Est
  '08': 'grand-est', '10': 'grand-est', '51': 'grand-est', '52': 'grand-est',
  '54': 'grand-est', '55': 'grand-est', '57': 'grand-est', '67': 'grand-est',
  '68': 'grand-est', '88': 'grand-est',
  // Pays de la Loire
  '44': 'pays-de-la-loire', '49': 'pays-de-la-loire', '53': 'pays-de-la-loire',
  '72': 'pays-de-la-loire', '85': 'pays-de-la-loire',
  // Centre-Val de Loire
  '18': 'centre-val-de-loire', '28': 'centre-val-de-loire', '36': 'centre-val-de-loire',
  '37': 'centre-val-de-loire', '41': 'centre-val-de-loire', '45': 'centre-val-de-loire',
  // Bourgogne-Franche-Comté
  '21': 'bourgogne-franche-comte', '25': 'bourgogne-franche-comte', '39': 'bourgogne-franche-comte',
  '58': 'bourgogne-franche-comte', '70': 'bourgogne-franche-comte', '71': 'bourgogne-franche-comte',
  '89': 'bourgogne-franche-comte', '90': 'bourgogne-franche-comte',
  // Corse
  '2A': 'corse', '2B': 'corse',
  // DOM-TOM
  '971': 'guadeloupe', '972': 'martinique', '973': 'guyane', '974': 'reunion', '976': 'mayotte',
}

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Récupère les aides locales pour un département donné
 * 1. Vérifie le cache fichier JSON
 * 2. Sinon, utilise les données statiques (parameters-emprunt.ts)
 * 3. Sauvegarde dans le cache pour les prochaines requêtes
 */
export async function getAidesLocales(departement: string): Promise<AideLocale[]> {
  const region = DEPARTEMENTS_REGIONS[departement]
  
  if (!region) {
    console.warn(`[ANIL] Département ${departement} non trouvé dans le mapping régions`)
    return []
  }

  // 1. Vérifier le cache fichier
  const aidesCachees = CacheFichier.getCachedAidesDepartement(departement)
  if (aidesCachees && aidesCachees.length > 0) {
    console.log(`[ANIL] Aides département ${departement} trouvées dans le cache (${aidesCachees.length} aides)`)
    return aidesCachees
  }

  // 2. Données statiques (parameters-emprunt.ts)
  const aidesStatiques = getAidesStatiques(departement, region)
  
  // 3. Sauvegarder dans le cache fichier
  if (aidesStatiques.length > 0) {
    CacheFichier.setCachedAidesDepartement(departement, region, aidesStatiques)
    console.log(`[ANIL] ${aidesStatiques.length} aides sauvegardées dans le cache pour ${departement}`)
  }
  
  return aidesStatiques
}

/**
 * Récupère les aides depuis les données statiques
 */
function getAidesStatiques(departement: string, region: string): AideLocale[] {
  const regionData = PRETS_REGIONAUX_2025[region]
  
  if (!regionData) {
    return []
  }

  return regionData.aides.map((aide, index) => ({
    id: `${region}-${index}`,
    nom: aide.nom,
    organisme: aide.organisme,
    type: 'pret' as const,
    departement,
    region: regionData.region,
    montantMin: aide.montantMin,
    montantMax: aide.montantMax,
    taux: aide.taux,
    conditions: aide.conditions,
    cumulable: aide.cumulable,
    dateMAJ: '2025-12-01',
  }))
}

/**
 * Recherche les aides locales pour un code INSEE de commune
 */
export async function rechercherAidesParCommune(codeInsee: string): Promise<AideLocaleRecherche> {
  // Extraire le département du code INSEE (2 premiers chiffres, ou 3 pour DOM-TOM)
  let departement: string
  if (codeInsee.startsWith('97') || codeInsee.startsWith('98')) {
    departement = codeInsee.substring(0, 3)
  } else {
    departement = codeInsee.substring(0, 2)
  }

  const region = DEPARTEMENTS_REGIONS[departement] || 'inconnu'
  const aides = await getAidesLocales(departement)
  
  // Calculer le boost de capacité (somme des montants max cumulables)
  const capaciteBoost = aides.reduce((sum, aide) => sum + aide.montantMax, 0)

  return {
    codeInsee,
    departement,
    region,
    aides,
    total: aides.length,
    capaciteBoost,
  }
}

/**
 * Vérifie l'éligibilité aux aides locales selon le profil
 */
export function verifierEligibiliteAidesLocales(
  aides: AideLocale[],
  profil: {
    primoAccedant: boolean
    revenus: number
    situationPro: string
    typeLogement: 'neuf' | 'ancien'
  }
): AideLocale[] {
  return aides.filter(aide => {
    // Vérifier les conditions de base
    const conditionsLower = aide.conditions.map(c => c.toLowerCase())
    
    // Primo-accédant souvent requis
    if (conditionsLower.some(c => c.includes('primo')) && !profil.primoAccedant) {
      return false
    }
    
    // Vérification type logement si spécifié
    if (conditionsLower.some(c => c.includes('neuf')) && profil.typeLogement === 'ancien') {
      // Seulement si c'est "neuf uniquement"
      if (!conditionsLower.some(c => c.includes('ancien'))) {
        return false
      }
    }
    
    return true
  })
}

// ══════════════════════════════════════════════════════════════════════════════
// SCRAPING ANIL (À ACTIVER AVEC PUPPETEER CÔTÉ SERVEUR)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Scrape les aides ANIL pour un département
 * ATTENTION: Nécessite Puppeteer - À exécuter côté serveur uniquement
 * 
 * @example
 * // Installation: npm install puppeteer
 * const aides = await scrapeANILDepartement('92')
 */
export async function scrapeANILDepartement(_departement: string): Promise<AideLocale[]> {
  // TODO: Implémenter avec Puppeteer quand le serveur est configuré
  // Pour l'instant, on retourne les données statiques
  
  /*
  const puppeteer = require('puppeteer');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // URL ANIL par département
  const url = `https://www.anil.org/aides-locales-accession-propriete/departement/${departement}/`;
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  // Extraire les aides
  const aides = await page.evaluate(() => {
    const items = document.querySelectorAll('.aide-item, .aide-card, [data-aide]');
    return Array.from(items).map(el => ({
      nom: el.querySelector('.title, h3, h4')?.textContent?.trim() || '',
      organisme: el.querySelector('.organisme, .source')?.textContent?.trim() || '',
      montant: el.querySelector('.montant, .amount')?.textContent?.trim() || '',
      conditions: el.querySelector('.conditions, .eligibility')?.textContent?.trim() || '',
      url: el.querySelector('a')?.href || '',
    }));
  });
  
  await browser.close();
  
  // Parser et formater les résultats
  return aides.map((a, i) => ({
    id: `anil-${departement}-${i}`,
    nom: a.nom,
    organisme: a.organisme,
    type: 'pret' as const,
    departement,
    region: DEPARTEMENTS_REGIONS[departement] || 'inconnu',
    montantMax: parseMontant(a.montant),
    taux: 0,
    conditions: parseConditions(a.conditions),
    cumulable: [],
    urlSource: a.url,
    dateMAJ: new Date().toISOString().split('T')[0],
  }));
  */
  
  console.warn('[ANIL] Scraping non activé - utilisation des données statiques')
  return []
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════════════════════

export const ANILService = {
  getAidesLocales,
  rechercherAidesParCommune,
  verifierEligibiliteAidesLocales,
  scrapeANILDepartement,
  DEPARTEMENTS_REGIONS,
}

export default ANILService
