// FILE: lib/services/reference-data.service.ts

import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'
import { revalidateTag } from 'next/cache'

// ===========================================
// TYPES
// ===========================================

export type RefDomain =
  | 'ACTIF_TYPE'
  | 'ACTIF_CATEGORY'
  | 'PASSIF_TYPE'
  | 'CONTRAT_TYPE'
  | 'DOCUMENT_TYPE'
  | 'DOCUMENT_CATEGORY'
  | 'OBJECTIF_TYPE'
  | 'PROJET_TYPE'
  | 'OPPORTUNITE_TYPE'
  | 'TACHE_TYPE'
  | 'RDV_TYPE'
  | 'SIMULATION_TYPE'
  | 'DOSSIER_TYPE'
  | 'KYC_DOC_TYPE'
  | 'KYC_CHECK_TYPE'
  | 'RECLAMATION_TYPE'
  | 'REVENUE_CATEGORY'
  | 'EXPENSE_CATEGORY'
  | 'BIEN_MOBILIER_TYPE'

export interface ReferenceItem {
  id: string
  domain: string
  code: string
  label: string
  labelEn: string | null
  category: string | null
  sortOrder: number
  isSystem: boolean
  isActive: boolean
  metadata: Record<string, unknown> | null
}

export interface SelectOption {
  value: string
  label: string
  category?: string | null
}

export interface GroupedSelectOptions {
  category: string
  options: SelectOption[]
}

// ===========================================
// CACHE CONFIGURATION
// ===========================================

const CACHE_TTL = 3600 // 1 heure en secondes
const CACHE_TAGS = ['reference-data']

// ===========================================
// SERVICE FUNCTIONS
// ===========================================

/**
 * Récupère toutes les données de référence pour un domaine
 * Résultat mis en cache pendant 1h
 */
export const getReferenceData = unstable_cache(
  async (domain: RefDomain): Promise<ReferenceItem[]> => {
    const items = await prisma.referenceData.findMany({
      where: { 
        domain, 
        isActive: true 
      },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { label: 'asc' }
      ],
    })
    
    return items as ReferenceItem[]
  },
  ['reference-data'],
  { 
    revalidate: CACHE_TTL,
    tags: CACHE_TAGS 
  }
)

/**
 * Récupère un item spécifique par domain et code
 */
export const getReferenceItem = unstable_cache(
  async (domain: RefDomain, code: string): Promise<ReferenceItem | null> => {
    const item = await prisma.referenceData.findUnique({
      where: { 
        domain_code: { domain, code } 
      },
    })
    
    return item as ReferenceItem | null
  },
  ['reference-data-item'],
  { 
    revalidate: CACHE_TTL,
    tags: CACHE_TAGS 
  }
)

/**
 * Vérifie si un code est valide pour un domaine
 */
export async function isValidCode(domain: RefDomain, code: string): Promise<boolean> {
  const item = await getReferenceItem(domain, code)
  return item !== null && item.isActive
}

/**
 * Récupère le label d'un code
 * Retourne le code si non trouvé
 */
export async function getLabel(
  domain: RefDomain, 
  code: string, 
  lang: 'fr' | 'en' = 'fr'
): Promise<string> {
  const item = await getReferenceItem(domain, code)
  
  if (!item) return code
  
  if (lang === 'en' && item.labelEn) {
    return item.labelEn
  }
  
  return item.label
}

/**
 * Récupère les options pour un select/dropdown
 */
export async function getSelectOptions(domain: RefDomain): Promise<SelectOption[]> {
  const items = await getReferenceData(domain)
  
  return items.map(item => ({
    value: item.code,
    label: item.label,
    category: item.category,
  }))
}

/**
 * Récupère les options groupées par catégorie
 */
export async function getGroupedSelectOptions(domain: RefDomain): Promise<GroupedSelectOptions[]> {
  const items = await getReferenceData(domain)
  
  const grouped = items.reduce((acc, item) => {
    const category = item.category || 'Autre'
    
    if (!acc[category]) {
      acc[category] = []
    }
    
    acc[category].push({
      value: item.code,
      label: item.label,
    })
    
    return acc
  }, {} as Record<string, SelectOption[]>)
  
  return Object.entries(grouped).map(([category, options]) => ({
    category,
    options,
  }))
}

/**
 * Récupère les metadata d'un type
 */
export async function getTypeMetadata<T = Record<string, unknown>>(
  domain: RefDomain, 
  code: string
): Promise<T | null> {
  const item = await getReferenceItem(domain, code)
  return (item?.metadata as T) || null
}

// ===========================================
// CACHE INVALIDATION
// ===========================================

/**
 * Invalide le cache des données de référence
 * À appeler après modification en admin
 */
export function invalidateReferenceDataCache(): void {
  revalidateTag('reference-data')
}

// ===========================================
// BULK OPERATIONS (pour seed/admin)
// ===========================================

export interface CreateReferenceDataInput {
  domain: RefDomain
  code: string
  label: string
  labelEn?: string
  category?: string
  sortOrder?: number
  isSystem?: boolean
  metadata?: Record<string, unknown>
}

/**
 * Crée ou met à jour une entrée (upsert)
 */
export async function upsertReferenceData(input: CreateReferenceDataInput): Promise<ReferenceItem> {
  const result = await prisma.referenceData.upsert({
    where: { 
      domain_code: { 
        domain: input.domain, 
        code: input.code 
      } 
    },
    update: {
      label: input.label,
      labelEn: input.labelEn,
      category: input.category,
      sortOrder: input.sortOrder ?? 0,
      metadata: input.metadata,
    },
    create: {
      domain: input.domain,
      code: input.code,
      label: input.label,
      labelEn: input.labelEn,
      category: input.category,
      sortOrder: input.sortOrder ?? 0,
      isSystem: input.isSystem ?? false,
      metadata: input.metadata,
    },
  })
  
  // Invalider le cache
  invalidateReferenceDataCache()
  
  return result as ReferenceItem
}

/**
 * Désactive un code (soft delete)
 */
export async function deactivateReferenceData(domain: RefDomain, code: string): Promise<void> {
  await prisma.referenceData.update({
    where: { 
      domain_code: { domain, code } 
    },
    data: { 
      isActive: false 
    },
  })
  
  invalidateReferenceDataCache()
}
