'use client'

/**
 * Hook pour récupérer et calculer les données patrimoniales d'un client
 * Centralise les appels API et les calculs pour tous les tabs Client360
 */

import { useState, useEffect, useCallback } from 'react'

// Types pour les données patrimoniales
export interface PatrimoineData {
  // Actifs
  actifs: ActifData[]
  totalActifs: number
  actifsByType: Record<string, { total: number; count: number; items: ActifData[] }>
  
  // Biens mobiliers
  biensMobiliers: BienMobilierData[]
  totalMobilier: number
  
  // Passifs / Crédits
  credits: CreditData[]
  totalCredits: number
  totalMensualites: number
  
  // Budget
  revenus: RevenuData[]
  totalRevenusMensuel: number
  totalRevenusAnnuel: number
  
  charges: ChargeData[]
  totalChargesMensuel: number
  totalChargesAnnuel: number
  
  // Calculs
  patrimoineNet: number
  patrimoineBrut: number
  capaciteEpargne: number
  tauxEpargne: number
  tauxEndettement: number
  capaciteEndettement: number
  
  // Répartition pour charts
  repartitionPatrimoine: PatrimoineRepartition[]
  repartitionActifs: PatrimoineRepartition[]
  evolutionPatrimoine: PatrimoineEvolution[]
  
  // Méta
  lastUpdate: Date
  isLoading: boolean
  error: string | null
}

export interface ActifData {
  id: string
  name: string
  type: string
  category: string
  value: number
  acquisitionValue?: number
  acquisitionDate?: string
  managedByFirm: boolean
  details?: Record<string, unknown>
}

export interface BienMobilierData {
  id: string
  type: string
  categorie: string
  libelle: string
  valeurActuelle: number
  valeurAcquisition: number
  plusValueLatente: number
}

export interface CreditData {
  id: string
  libelle: string
  type: string
  organisme: string
  montantInitial: number
  capitalRestantDu: number
  mensualiteTotale: number
  tauxNominal: number
  dateFin: string
  dureeRestanteMois: number
}

export interface RevenuData {
  id: string
  libelle: string
  categorie: string
  montant: number
  frequence: string
  montantAnnuel: number
  fiscalite: string
  estRecurrent: boolean
}

export interface ChargeData {
  id: string
  libelle: string
  categorie: string
  montant: number
  frequence: string
  montantAnnuel: number
  estFixe: boolean
  estDeductible: boolean
}

export interface PatrimoineRepartition {
  name: string
  value: number
  color: string
  percentage: number
  count: number
}

export interface PatrimoineEvolution {
  date: string
  label: string
  patrimoine: number
  actifs: number
  passifs: number
}

// Couleurs par catégorie
const PATRIMOINE_COLORS: Record<string, string> = {
  IMMOBILIER: '#3B82F6',      // Blue
  FINANCIER: '#10B981',       // Emerald
  PROFESSIONNEL: '#8B5CF6',   // Purple
  MOBILIER: '#F59E0B',        // Amber
  LIQUIDITES: '#06B6D4',      // Cyan
  AUTRE: '#6B7280',           // Gray
}

// Hook principal
export function useClientPatrimoine(clientId: string) {
  const [data, setData] = useState<Partial<PatrimoineData>>({
    actifs: [],
    biensMobiliers: [],
    credits: [],
    revenus: [],
    charges: [],
    isLoading: true,
    error: null,
  })

  const fetchAll = useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Fetch toutes les données en parallèle
      const [actifsRes, biensMobiliersRes, creditsRes, revenusRes, chargesRes] = await Promise.all([
        fetch(`/api/advisor/clients/${clientId}/actifs`).then(r => r.json()).catch(() => ({ data: { actifs: [] } })),
        fetch(`/api/advisor/clients/${clientId}/biens-mobiliers`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/advisor/clients/${clientId}/credits`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/advisor/clients/${clientId}/revenues`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/advisor/clients/${clientId}/expenses`).then(r => r.json()).catch(() => ({ data: [] })),
      ])

      // Extraire les données
      const actifs: ActifData[] = actifsRes?.data?.actifs || []
      const biensMobiliers: BienMobilierData[] = biensMobiliersRes?.data || []
      const credits: CreditData[] = creditsRes?.data || []
      const revenus: RevenuData[] = revenusRes?.data || []
      const charges: ChargeData[] = chargesRes?.data || []

      // Calculer les totaux
      const totalActifs = actifs.reduce((sum, a) => sum + Number(a.value || 0), 0)
      const totalMobilier = biensMobiliers.reduce((sum, b) => sum + Number(b.valeurActuelle || 0), 0)
      const totalCredits = credits.reduce((sum, c) => sum + Number(c.capitalRestantDu || 0), 0)
      const totalMensualites = credits.reduce((sum, c) => sum + Number(c.mensualiteTotale || 0), 0)
      
      // Revenus et charges
      const totalRevenusMensuel = revenus.reduce((sum, r) => {
        const montant = Number(r.montant || 0)
        if (r.frequence === 'ANNUEL') return sum + montant / 12
        if (r.frequence === 'TRIMESTRIEL') return sum + montant / 3
        if (r.frequence === 'SEMESTRIEL') return sum + montant / 6
        return sum + montant
      }, 0)
      
      const totalChargesMensuel = charges.reduce((sum, c) => {
        const montant = Number(c.montant || 0)
        if (c.frequence === 'ANNUEL') return sum + montant / 12
        if (c.frequence === 'TRIMESTRIEL') return sum + montant / 3
        if (c.frequence === 'SEMESTRIEL') return sum + montant / 6
        return sum + montant
      }, 0)

      // Calculs patrimoniaux
      const patrimoineBrut = totalActifs + totalMobilier
      const patrimoineNet = patrimoineBrut - totalCredits
      const capaciteEpargne = totalRevenusMensuel - totalChargesMensuel - totalMensualites
      const tauxEpargne = totalRevenusMensuel > 0 ? (capaciteEpargne / totalRevenusMensuel) * 100 : 0
      const tauxEndettement = totalRevenusMensuel > 0 ? (totalMensualites / totalRevenusMensuel) * 100 : 0
      const capaciteEndettement = Math.max(0, (totalRevenusMensuel * 0.35) - totalMensualites)

      // Grouper les actifs par type
      const actifsByType: Record<string, { total: number; count: number; items: ActifData[] }> = {}
      actifs.forEach(actif => {
        const type = actif.type || 'AUTRE'
        if (!actifsByType[type]) {
          actifsByType[type] = { total: 0, count: 0, items: [] }
        }
        actifsByType[type].total += Number(actif.value || 0)
        actifsByType[type].count++
        actifsByType[type].items.push(actif)
      })

      // Répartition du patrimoine pour les charts
      const repartitionPatrimoine: PatrimoineRepartition[] = []
      Object.entries(actifsByType).forEach(([type, data]) => {
        if (data.total > 0) {
          repartitionPatrimoine.push({
            name: type === 'IMMOBILIER' ? 'Immobilier' :
                  type === 'FINANCIER' ? 'Financier' :
                  type === 'PROFESSIONNEL' ? 'Professionnel' : 'Autre',
            value: data.total,
            color: PATRIMOINE_COLORS[type] || PATRIMOINE_COLORS.AUTRE,
            percentage: patrimoineBrut > 0 ? (data.total / patrimoineBrut) * 100 : 0,
            count: data.count,
          })
        }
      })

      // Ajouter les biens mobiliers si présents
      if (totalMobilier > 0) {
        repartitionPatrimoine.push({
          name: 'Mobilier',
          value: totalMobilier,
          color: PATRIMOINE_COLORS.MOBILIER,
          percentage: patrimoineBrut > 0 ? (totalMobilier / patrimoineBrut) * 100 : 0,
          count: biensMobiliers.length,
        })
      }

      // Trier par valeur décroissante
      repartitionPatrimoine.sort((a, b) => b.value - a.value)

      // Évolution du patrimoine (simulée pour l'instant - à connecter à un historique)
      const evolutionPatrimoine: PatrimoineEvolution[] = generatePatrimoineEvolution(patrimoineBrut, totalCredits)

      setData({
        actifs,
        totalActifs,
        actifsByType,
        biensMobiliers,
        totalMobilier,
        credits,
        totalCredits,
        totalMensualites,
        revenus,
        totalRevenusMensuel,
        totalRevenusAnnuel: totalRevenusMensuel * 12,
        charges,
        totalChargesMensuel,
        totalChargesAnnuel: totalChargesMensuel * 12,
        patrimoineNet,
        patrimoineBrut,
        capaciteEpargne,
        tauxEpargne,
        tauxEndettement,
        capaciteEndettement,
        repartitionPatrimoine,
        repartitionActifs: repartitionPatrimoine.filter(r => r.name !== 'Mobilier'),
        evolutionPatrimoine,
        lastUpdate: new Date(),
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('Erreur chargement patrimoine:', error)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des données',
      }))
    }
  }, [clientId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    ...data,
    refresh: fetchAll,
  } as PatrimoineData & { refresh: () => Promise<void> }
}

// Génère une évolution simulée du patrimoine (12 derniers mois)
function generatePatrimoineEvolution(currentBrut: number, currentPassifs: number): PatrimoineEvolution[] {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
  const now = new Date()
  const evolution: PatrimoineEvolution[] = []

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthIndex = date.getMonth()
    
    // Simulation d'une croissance de ~0.5% par mois
    const growthFactor = Math.pow(1.005, i)
    const actifs = currentBrut / growthFactor
    const passifs = currentPassifs * (1 + (i * 0.008)) // Les passifs diminuent légèrement
    
    evolution.push({
      date: date.toISOString(),
      label: months[monthIndex],
      actifs: Math.round(actifs),
      passifs: Math.round(passifs),
      patrimoine: Math.round(actifs - passifs),
    })
  }

  return evolution
}

export default useClientPatrimoine
