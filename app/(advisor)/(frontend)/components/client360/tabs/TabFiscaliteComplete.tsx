'use client'

/**
 * TabFiscaliteComplete - Module Fiscalité complet
 * IR, IFI, simulations fiscales avec UI/UX améliorée
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Progress } from '@/app/_common/components/ui/Progress'
import { formatCurrency } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  Calculator, Building2, Wallet, TrendingUp, FileDown, AlertTriangle, Lightbulb, 
  PiggyBank, Home, Loader2, Users, Heart, Briefcase, Euro, Info,
  Gift, Shield, Landmark, BarChart3, Save, CheckCircle2, AlertCircle
} from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'
import { useClientCalculators } from '../../../hooks/useClientCalculators'

interface TabFiscaliteCompleteProps {
  clientId: string
  client: ClientDetail
}

// Barème IR 2024 (revenus 2023)
const IR_BRACKETS_2024 = [
  { min: 0, max: 11294, rate: 0, label: '0%', color: '#10B981' },
  { min: 11294, max: 28797, rate: 11, label: '11%', color: '#3B82F6' },
  { min: 28797, max: 82341, rate: 30, label: '30%', color: '#F59E0B' },
  { min: 82341, max: 177106, rate: 41, label: '41%', color: '#F97316' },
  { min: 177106, max: Infinity, rate: 45, label: '45%', color: '#EF4444' },
]

// Barème IFI 2024
const IFI_BRACKETS_2024 = [
  { min: 0, max: 800000, rate: 0, label: 'Exonéré', color: '#10B981' },
  { min: 800000, max: 1300000, rate: 0.5, label: '0,50%', color: '#3B82F6' },
  { min: 1300000, max: 2570000, rate: 0.7, label: '0,70%', color: '#F59E0B' },
  { min: 2570000, max: 5000000, rate: 1, label: '1,00%', color: '#F97316' },
  { min: 5000000, max: 10000000, rate: 1.25, label: '1,25%', color: '#EF4444' },
  { min: 10000000, max: Infinity, rate: 1.5, label: '1,50%', color: '#991B1B' },
]

// Situations familiales pour le calcul des parts
const SITUATIONS_FAMILIALES = [
  { value: 'celibataire', label: 'Célibataire', parts: 1 },
  { value: 'marie', label: 'Marié(e) / Pacsé(e)', parts: 2 },
  { value: 'divorce', label: 'Divorcé(e)', parts: 1 },
  { value: 'veuf', label: 'Veuf(ve)', parts: 1 },
  { value: 'parent_isole', label: 'Parent isolé', parts: 1.5 },
]

// Types de revenus
const TYPES_REVENUS = [
  { value: 'salaires', label: 'Salaires et traitements', abattement: 10 },
  { value: 'tns', label: 'Revenus TNS (BIC/BNC)', abattement: 0 },
  { value: 'fonciers', label: 'Revenus fonciers', abattement: 0 },
  { value: 'capitaux', label: 'Revenus de capitaux mobiliers', abattement: 0 },
  { value: 'pensions', label: 'Pensions et retraites', abattement: 10 },
]

const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#F97316', '#EF4444', '#991B1B']

export function TabFiscaliteComplete({ clientId, client }: TabFiscaliteCompleteProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('synthese')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [chartsReady, setChartsReady] = useState(false)
  
  // Hook pour les calculateurs (données provenant des APIs)
  const calculators = useClientCalculators(clientId)
  
  // =============================================================================
  // STATE - Données IR
  // =============================================================================
  
  // Déterminer la situation familiale depuis le client
  const situationInitiale = useMemo(() => {
    const status = client.maritalStatus?.toUpperCase() || ''
    if (['MARRIED', 'MARIE', 'PACS', 'CIVIL_UNION'].includes(status)) return 'marie'
    if (['DIVORCED', 'DIVORCE'].includes(status)) return 'divorce'
    if (['WIDOWED', 'VEUF'].includes(status)) return 'veuf'
    return 'celibataire'
  }, [client.maritalStatus])
  
  // Compter les enfants à charge depuis familyMembers (plus fiable que numberOfChildren)
  const enfantsFromFamily = useMemo(() => {
    const members = (client.familyMembers || []) as Array<Record<string, unknown>>
    let nbCharge = 0
    let nbGardeAlternee = 0
    
    members.forEach(m => {
      const relation = String(m.relationship || m.relation || m.role || '').toUpperCase()
      const isEnfant = relation.includes('ENFANT') || relation.includes('CHILD')
      const isDependent = Boolean(m.isFiscalDependent || m.isDependent || m.aCharge)
      const gardeAlternee = Boolean(m.gardeAlternee || m.sharedCustody)
      
      if (isEnfant && isDependent) {
        if (gardeAlternee) {
          nbGardeAlternee++
        } else {
          nbCharge++
        }
      }
    })
    
    // Fallback sur numberOfChildren si pas de familyMembers détaillés
    if (nbCharge === 0 && nbGardeAlternee === 0 && Number(client.numberOfChildren) > 0) {
      nbCharge = Number(client.numberOfChildren)
    }
    
    return { nbCharge, nbGardeAlternee }
  }, [client.familyMembers, client.numberOfChildren])
  
  // Les revenus seront chargés depuis l'API dans le useEffect
  // Valeurs initiales à 0, mises à jour après chargement
  const [irData, setIrData] = useState({
    // Revenus - chargés depuis l'API /revenues
    salaires: 0,
    revenusTNS: 0,
    revenusFonciers: 0,
    revenusCapitaux: 0,
    pensions: 0,
    autresRevenus: 0,
    // Situation familiale - pré-remplie depuis le client et familyMembers
    situation: situationInitiale,
    nbEnfantsCharge: enfantsFromFamily.nbCharge,
    nbEnfantsGardeAlternee: enfantsFromFamily.nbGardeAlternee,
    parentIsole: false,
    // Déductions
    pensionsAlimentaires: 0,
    fraisReels: 0,
    epargneRetraite: 0,
    deficitsFonciers: 0,
    // Réductions et crédits
    dons: 0,
    emploiDomicile: 0,
    gardeEnfants: 0,
    investissementLocatif: 0,
    autresReductions: 0,
  })

  // =============================================================================
  // STATE - Données IFI
  // =============================================================================
  

  // Calcul détaillé du patrimoine immobilier depuis les actifs du client
  const patrimoineFromClient = useMemo(() => {
    const actifs = (client.actifs || []) as Array<Record<string, unknown>>
    let immobilierResidencePrincipale = 0
    let immobilierLocatif = 0
    let immobilierSecondaire = 0
    let scpiOpci = 0
    let partsSCI = 0
    
    actifs.forEach((a) => {
      const type = String(a.type || '').toUpperCase()
      const valeur = Number(a.value) || Number(a.valeur) || 0
      
      if (type === 'RESIDENCE_PRINCIPALE' || type === 'REAL_ESTATE_MAIN') {
        immobilierResidencePrincipale += valeur
      } else if (type.includes('LOCATIF') || type === 'REAL_ESTATE_RENTAL' || type === 'IMMOBILIER_LOCATIF') {
        immobilierLocatif += valeur
      } else if (type === 'RESIDENCE_SECONDAIRE' || type === 'REAL_ESTATE_SECONDARY') {
        immobilierSecondaire += valeur
      } else if (type === 'SCPI' || type === 'OPCI') {
        scpiOpci += valeur
      } else if (type === 'SCI') {
        partsSCI += valeur
      }
    })
    
    return { immobilierResidencePrincipale, immobilierLocatif, immobilierSecondaire, scpiOpci, partsSCI }
  }, [client.actifs])
  
  // Calcul des dettes immobilières déductibles depuis les passifs du client
  const dettesImmobilieres = useMemo(() => {
    const passifs = (client.passifs || []) as Array<Record<string, unknown>>
    let total = 0
    
    passifs.forEach((p) => {
      const type = String(p.type || '').toUpperCase()
      // Dettes immobilières déductibles de l'IFI
      if (type.includes('MORTGAGE') || type.includes('IMMOBILIER') || type === 'CREDIT_IMMOBILIER' || type === 'PRET_IMMOBILIER') {
        total += Number(p.remainingAmount) || Number(p.capitalRestant) || 0
      }
    })
    
    return total
  }, [client.passifs])
  
  const [ifiData, setIfiData] = useState({
    // Patrimoine immobilier - pré-rempli depuis les actifs du client
    immobilierResidencePrincipale: patrimoineFromClient.immobilierResidencePrincipale,
    immobilierLocatif: patrimoineFromClient.immobilierLocatif,
    immobilierSecondaire: patrimoineFromClient.immobilierSecondaire,
    scpiOpci: patrimoineFromClient.scpiOpci,
    // Abattements et passif - pré-remplis
    abattementRP: Math.round(patrimoineFromClient.immobilierResidencePrincipale * 0.3),
    dettesDeductibles: dettesImmobilieres,
    // Autres actifs IFI
    partsSCI: patrimoineFromClient.partsSCI,
  })

  // =============================================================================
  // STATE - Simulations
  // =============================================================================
  
  const [showPerSimulation, setShowPerSimulation] = useState(false)
  const [perAmount, setPerAmount] = useState(5000)

  // =============================================================================
  // DATA LOADING - Charger les vrais revenus depuis l'API
  // =============================================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les revenus et les membres de famille depuis l'API
        const [revenusRes, familyRes, taxDataRes] = await Promise.all([
          fetch(`/api/advisor/clients/${clientId}/revenues`).catch(() => null),
          fetch(`/api/advisor/clients/${clientId}/family`).catch(() => null),
          fetch(`/api/advisor/clients/${clientId}/taxation/data`).catch(() => null),
        ])
        
        // Traiter les membres de famille pour compter les enfants à charge
        if (familyRes?.ok) {
          const data = await familyRes.json()
          const members = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])
          
          let nbCharge = 0
          let nbGardeAlternee = 0
          
          members.forEach((m: Record<string, unknown>) => {
            const relation = String(m.relationship || m.relation || m.role || '').toUpperCase()
            const isEnfant = relation.includes('ENFANT') || relation.includes('CHILD')
            const isDependent = Boolean(m.isFiscalDependent || m.isDependent || m.aCharge)
            const gardeAlternee = Boolean(m.gardeAlternee || m.sharedCustody)
            
            if (isEnfant && isDependent) {
              if (gardeAlternee) {
                nbGardeAlternee++
              } else {
                nbCharge++
              }
            }
          })
          
          // Mettre à jour si on a trouvé des enfants
          if (nbCharge > 0 || nbGardeAlternee > 0) {
            setIrData(prev => ({
              ...prev,
              nbEnfantsCharge: nbCharge,
              nbEnfantsGardeAlternee: nbGardeAlternee,
            }))
          }
        }
        
        // Traiter les revenus
        let salaires = 0
        let revenusTNS = 0
        let revenusFonciers = 0
        let revenusCapitaux = 0
        let pensions = 0
        let autresRevenus = 0
        
        if (revenusRes?.ok) {
          const data = await revenusRes.json()
          const revenus = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])
          
          const categoriesSalaires = ['SALAIRE', 'PRIME', 'BONUS', 'HEURES_SUP', 'AVANTAGE_NATURE']
          const categoriesTNS = ['REVENUS_TNS', 'BIC', 'BNC', 'BA', 'MICRO_ENTREPRISE', 'DIVIDENDES', 'HONORAIRES']
          const categoriesFonciers = ['REVENUS_FONCIERS', 'LOYERS', 'SCI', 'SCPI', 'LMNP', 'LMP']
          const categoriesCapitaux = ['INTERETS', 'DIVIDENDES_CAPITAUX', 'PLUS_VALUES', 'REVENUS_CAPITAUX']
          const categoriesPensions = ['PENSION_RETRAITE', 'PENSION_INVALIDITE', 'PENSION_ALIMENTAIRE_RECUE', 'RENTE_VIAGERE']
          
          revenus.forEach((r: Record<string, unknown>) => {
            const cat = String(r.category || r.categorie || '').toUpperCase()
            const freq = String(r.frequency || r.frequence || 'MENSUEL').toUpperCase()
            let montant = Number(r.montant || r.amount || 0)
            
            // Annualiser le montant selon la fréquence
            if (freq === 'MENSUEL') montant *= 12
            else if (freq === 'TRIMESTRIEL') montant *= 4
            else if (freq === 'SEMESTRIEL') montant *= 2
            // ANNUEL et PONCTUEL restent tels quels
            
            if (categoriesSalaires.includes(cat)) salaires += montant
            else if (categoriesTNS.includes(cat)) revenusTNS += montant
            else if (categoriesFonciers.includes(cat)) revenusFonciers += montant
            else if (categoriesCapitaux.includes(cat)) revenusCapitaux += montant
            else if (categoriesPensions.includes(cat)) pensions += montant
            else autresRevenus += montant
          })
        }
        
        // Si aucun revenu trouvé dans la table revenues, utiliser client.annualIncome
        const totalRevenus = salaires + revenusTNS + revenusFonciers + revenusCapitaux + pensions + autresRevenus
        const clientAnnualIncome = Number(client.annualIncome) || 0
        
        if (totalRevenus === 0 && clientAnnualIncome > 0) {
          // Utiliser le revenu annuel du client comme salaire par défaut
          // La profession peut aider à déterminer le type de revenu
          const profession = String(client.profession || '').toLowerCase()
          if (profession.includes('libéral') || profession.includes('médecin') || profession.includes('avocat') || profession.includes('indépendant')) {
            revenusTNS = clientAnnualIncome
          } else {
            salaires = clientAnnualIncome
          }
        }
        
        // Mettre à jour les données IR avec les revenus (réels ou depuis client.annualIncome)
        if (salaires > 0 || revenusTNS > 0 || revenusFonciers > 0 || revenusCapitaux > 0 || pensions > 0 || autresRevenus > 0) {
          setIrData(prev => ({
            ...prev,
            salaires,
            revenusTNS,
            revenusFonciers,
            revenusCapitaux,
            pensions,
            autresRevenus,
          }))
        }
        
        // Traiter les données fiscales sauvegardées (déductions, réductions, etc.)
        if (taxDataRes?.ok) {
          const data = await taxDataRes.json()
          if (data.data?.ir) {
            // Ne pas écraser les revenus chargés depuis l'API, juste les autres champs
            const { salaires: _s, revenusTNS: _t, revenusFonciers: _f, revenusCapitaux: _c, pensions: _p, autresRevenus: _a, ...otherIrData } = data.data.ir
            setIrData(prev => ({ ...prev, ...otherIrData }))
          }
          if (data.data?.ifi) setIfiData(prev => ({ ...prev, ...data.data.ifi }))
        }
      } catch { /* use defaults */ }
      finally { setLoading(false) }
    }
    fetchData()
  }, [clientId])

  useEffect(() => {
    const frame = requestAnimationFrame(() => setChartsReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // =============================================================================
  // CALCULS IR
  // =============================================================================
  
  // Calcul des parts fiscales
  const partsFiscales = useMemo(() => {
    const sitConfig = SITUATIONS_FAMILIALES.find(s => s.value === irData.situation)
    let parts = sitConfig?.parts || 1
    
    // Enfants à charge
    if (irData.nbEnfantsCharge >= 1) parts += 0.5
    if (irData.nbEnfantsCharge >= 2) parts += 0.5
    if (irData.nbEnfantsCharge >= 3) parts += (irData.nbEnfantsCharge - 2) * 1
    
    // Garde alternée (demi-parts)
    parts += irData.nbEnfantsGardeAlternee * 0.25
    
    // Parent isolé
    if (irData.parentIsole && irData.nbEnfantsCharge > 0) parts += 0.5
    
    return parts
  }, [irData.situation, irData.nbEnfantsCharge, irData.nbEnfantsGardeAlternee, irData.parentIsole])

  // Calcul du revenu net imposable
  const irCalculation = useMemo(() => {
    // 1. Revenus bruts totaux
    const revenusBruts = irData.salaires + irData.revenusTNS + irData.revenusFonciers + 
                         irData.revenusCapitaux + irData.pensions + irData.autresRevenus
    
    // 2. Abattement 10% sur salaires et pensions (sauf frais réels)
    const abattementSalaires = irData.fraisReels > 0 
      ? irData.fraisReels 
      : Math.min(irData.salaires * 0.10, 14171) // Plafond 2024
    const abattementPensions = Math.min(irData.pensions * 0.10, 4321) // Plafond 2024
    
    // 3. Revenu net global
    const revenuNetGlobal = revenusBruts - abattementSalaires - abattementPensions - 
                            irData.deficitsFonciers - irData.pensionsAlimentaires
    
    // 4. Revenu net imposable (après déduction épargne retraite)
    const plafondEpargneRetraite = Math.max(4399, revenusBruts * 0.10) // 10% du revenu, min 4399€
    const deductionEpargneRetraite = Math.min(irData.epargneRetraite, plafondEpargneRetraite)
    const revenuNetImposable = Math.max(0, revenuNetGlobal - deductionEpargneRetraite)
    
    // 5. Quotient familial
    const quotientFamilial = revenuNetImposable / partsFiscales
    
    // 6. Calcul de l'impôt par tranches
    let impotBrut = 0
    let tmi = 0
    const bracketDetails: { bracket: string; base: number; rate: number; amount: number; color: string }[] = []
    
    for (const bracket of IR_BRACKETS_2024) {
      if (quotientFamilial > bracket.min) {
        const taxableInBracket = Math.min(quotientFamilial, bracket.max) - bracket.min
        const taxAmount = taxableInBracket * (bracket.rate / 100)
        impotBrut += taxAmount
        tmi = bracket.rate
        if (taxAmount > 0) {
          bracketDetails.push({
            bracket: bracket.label,
            base: Math.round(taxableInBracket * partsFiscales),
            rate: bracket.rate,
            amount: Math.round(taxAmount * partsFiscales),
            color: bracket.color
          })
        }
      }
    }
    impotBrut = Math.round(impotBrut * partsFiscales)
    
    // 7. Réductions d'impôt
    const reductionDons = Math.min(irData.dons * 0.66, revenuNetImposable * 0.20) // 66% dans la limite de 20% du revenu
    const reductionEmploiDomicile = Math.min(irData.emploiDomicile * 0.50, 12000) // 50% plafonné
    const reductionGardeEnfants = Math.min(irData.gardeEnfants * 0.50, 1750 * irData.nbEnfantsCharge) // 50% plafonné
    const totalReductions = reductionDons + reductionEmploiDomicile + reductionGardeEnfants + irData.investissementLocatif + irData.autresReductions
    
    // 8. Impôt net
    const impotNet = Math.max(0, impotBrut - totalReductions)
    const tauxEffectif = revenuNetImposable > 0 ? (impotNet / revenuNetImposable) * 100 : 0
    const mensualite = Math.round(impotNet / 12)
    
    return {
      revenusBruts,
      revenuNetGlobal,
      revenuNetImposable,
      quotientFamilial: Math.round(quotientFamilial),
      partsFiscales,
      impotBrut,
      totalReductions: Math.round(totalReductions),
      impotNet,
      tmi,
      tauxEffectif,
      mensualite,
      bracketDetails,
      deductionEpargneRetraite,
      plafondEpargneRetraite
    }
  }, [irData, partsFiscales])

  // =============================================================================
  // CALCULS IFI
  // =============================================================================
  
  const ifiCalculation = useMemo(() => {
    // Base brute
    const baseBrute = ifiData.immobilierResidencePrincipale + ifiData.immobilierLocatif + 
                      ifiData.immobilierSecondaire + ifiData.scpiOpci + ifiData.partsSCI
    
    // Base nette après abattement RP et dettes
    const baseNette = Math.max(0, baseBrute - ifiData.abattementRP - ifiData.dettesDeductibles)
    
    // Seuil d'assujettissement : 1 300 000 €
    if (baseNette < 1300000) {
      return { baseBrute, baseNette, impot: 0, bracket: 'Non assujetti', tauxMoyen: 0, assujetti: false }
    }
    
    // Calcul par tranches
    let impot = 0
    let currentBracket = IFI_BRACKETS_2024[0]
    
    for (const bracket of IFI_BRACKETS_2024) {
      if (baseNette > bracket.min) {
        const taxableInBracket = Math.min(baseNette, bracket.max) - bracket.min
        impot += taxableInBracket * (bracket.rate / 100)
        if (baseNette <= bracket.max) {
          currentBracket = bracket
          break
        }
        currentBracket = bracket
      }
    }
    
    const tauxMoyen = baseNette > 0 ? (impot / baseNette) * 100 : 0
    
    return { baseBrute, baseNette, impot: Math.round(impot), bracket: currentBracket.label, tauxMoyen, assujetti: true }
  }, [ifiData])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSaveFiscalData = useCallback(async () => {
    setSaving(true)
    try {
      await fetch(`/api/advisor/clients/${clientId}/taxation/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ir: irData, ifi: ifiData }),
      })
      toast({ title: 'Données fiscales enregistrées' })
    } catch {
      toast({ title: 'Erreur lors de l\'enregistrement', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }, [clientId, irData, ifiData, toast])

  const handleExport = useCallback(async () => {
    toast({ title: 'Export en cours', description: 'Génération du rapport fiscal PDF...' })
    try {
      const response = await fetch(`/api/advisor/clients/${clientId}/reports/fiscalite?format=pdf`)
      if (!response.ok) throw new Error('Erreur')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-fiscal-${clientId}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({ title: 'Rapport fiscal généré', variant: 'success' })
    } catch {
      toast({ title: 'Erreur génération PDF', variant: 'destructive' })
    }
  }, [clientId, toast])

  // Données graphique tranches IR
  const irChartData = irCalculation.bracketDetails.map((b) => ({
    name: b.bracket,
    montant: b.amount,
    fill: b.color,
  }))

  // Économie PER
  const perEconomy = Math.round((perAmount * irCalculation.tmi) / 100)

  // Placeholder pour les graphiques
  const ChartPlaceholder = ({ label = 'Chargement...' }: { label?: string }) => (
    <div className="h-full min-h-[12rem] flex flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
      <Loader2 className="h-5 w-5 animate-spin mb-2 text-indigo-500" />
      <span>{label}</span>
    </div>
  )

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Calculator className="h-6 w-6 text-indigo-600" />
            </div>
            Fiscalité
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-14">
            Impôt sur le revenu, IFI et optimisation fiscale
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveFiscalData} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />Exporter PDF
          </Button>
        </div>
      </div>

      {/* KPIs principaux - Équation fiscale */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[140px] p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(irCalculation.revenusBruts)}</p>
              <p className="text-xs text-gray-600">Revenus bruts</p>
            </div>
            <span className="text-gray-300 text-xl">−</span>
            <div className="flex-1 min-w-[140px] p-4 bg-amber-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(irCalculation.impotNet)}</p>
              <p className="text-xs text-amber-600">IR annuel</p>
            </div>
            <span className="text-gray-300 text-xl">−</span>
            <div className="flex-1 min-w-[140px] p-4 bg-purple-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-700">{ifiCalculation.assujetti ? formatCurrency(ifiCalculation.impot) : '0 €'}</p>
              <p className="text-xs text-purple-600">IFI</p>
            </div>
            <span className="text-gray-300 text-xl">=</span>
            <div className="flex-1 min-w-[140px] p-4 bg-emerald-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-emerald-700">
                {formatCurrency(irCalculation.revenusBruts - irCalculation.impotNet - (ifiCalculation.assujetti ? ifiCalculation.impot : 0))}
              </p>
              <p className="text-xs text-emerald-600">Net après impôts</p>
            </div>
          </div>

          {/* Indicateurs clés */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
            <div className="text-center">
              <p className="text-lg font-bold text-indigo-600">{irCalculation.tmi}%</p>
              <p className="text-xs text-gray-500">Tranche marginale (TMI)</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{irCalculation.tauxEffectif.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Taux effectif</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-600">{irCalculation.partsFiscales}</p>
              <p className="text-xs text-gray-500">Parts fiscales</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600">{formatCurrency(irCalculation.mensualite)}</p>
              <p className="text-xs text-gray-500">Prélèvement mensuel</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1 h-auto flex-wrap">
          <TabsTrigger value="synthese" className="data-[state=active]:bg-white">
            <BarChart3 className="h-4 w-4 mr-2 text-indigo-600" />Synthèse
          </TabsTrigger>
          <TabsTrigger value="ir" className="data-[state=active]:bg-white">
            <Calculator className="h-4 w-4 mr-2 text-blue-600" />Impôt sur le Revenu
          </TabsTrigger>
          <TabsTrigger value="ifi" className="data-[state=active]:bg-white">
            <Building2 className="h-4 w-4 mr-2 text-amber-600" />IFI
          </TabsTrigger>
          <TabsTrigger value="optimisation" className="data-[state=active]:bg-white">
            <Lightbulb className="h-4 w-4 mr-2 text-[#7373FF]" />Optimisation
          </TabsTrigger>
        </TabsList>

        {/* ============================================================= */}
        {/* ONGLET SYNTHÈSE */}
        {/* ============================================================= */}
        <TabsContent value="synthese" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Répartition IR par tranches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Impôt sur le Revenu
                </CardTitle>
                <CardDescription>Décomposition par tranches du barème progressif</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {irCalculation.bracketDetails.length > 0 ? (
                    irCalculation.bracketDetails.map((b, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-16 text-sm font-medium" style={{ color: b.color }}>{b.bracket}</div>
                        <div className="flex-1">
                          <Progress 
                            value={(b.amount / irCalculation.impotBrut) * 100} 
                            className="h-3"
                            style={{ ['--progress-color' as string]: b.color } as React.CSSProperties}
                          />
                        </div>
                        <div className="w-24 text-right text-sm font-semibold">{formatCurrency(b.amount)}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Aucun impôt à payer</p>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Impôt brut</span>
                    <span className="font-semibold">{formatCurrency(irCalculation.impotBrut)}</span>
                  </div>
                  {irCalculation.totalReductions > 0 && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">Réductions/Crédits</span>
                      <span className="font-semibold text-emerald-600">-{formatCurrency(irCalculation.totalReductions)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <span className="font-medium">Impôt net</span>
                    <span className="text-xl font-bold text-blue-700">{formatCurrency(irCalculation.impotNet)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Situation IFI */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-600" />
                  Impôt sur la Fortune Immobilière
                </CardTitle>
                <CardDescription>Patrimoine immobilier net taxable</CardDescription>
              </CardHeader>
              <CardContent>
                {ifiCalculation.assujetti ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <span className="font-medium text-amber-800">Assujetti à l'IFI</span>
                      </div>
                      <p className="text-sm text-amber-700">
                        Le patrimoine immobilier net de {formatCurrency(ifiCalculation.baseNette)} dépasse le seuil de 1 300 000 €.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Base brute</span>
                        <span className="font-medium">{formatCurrency(ifiCalculation.baseBrute)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Abattements et dettes</span>
                        <span className="font-medium text-emerald-600">-{formatCurrency(ifiCalculation.baseBrute - ifiCalculation.baseNette)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Base nette taxable</span>
                        <span className="font-medium">{formatCurrency(ifiCalculation.baseNette)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-amber-100 rounded-lg">
                      <span className="font-medium text-amber-800">IFI à payer</span>
                      <span className="text-2xl font-bold text-amber-700">{formatCurrency(ifiCalculation.impot)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h4 className="font-medium text-emerald-800 mb-2">Non assujetti à l'IFI</h4>
                    <p className="text-sm text-gray-600">
                      Le patrimoine immobilier net de {formatCurrency(ifiCalculation.baseNette)} est inférieur au seuil d'assujettissement de 1 300 000 €.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Explication pédagogique */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-indigo-600" />
                Comprendre votre fiscalité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Tranche Marginale d'Imposition (TMI) : {irCalculation.tmi}%
                </h4>
                <p className="text-sm text-blue-700">
                  Votre TMI est la tranche du barème dans laquelle se situe votre dernier euro de revenu imposable.
                  {irCalculation.tmi > 0 && (
                    <> C'est le taux qui s'applique à chaque euro supplémentaire gagné, et aussi le taux d'économie pour chaque euro déduit (comme un versement PER).</>
                  )}
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Taux effectif d'imposition : {irCalculation.tauxEffectif.toFixed(1)}%
                </h4>
                <p className="text-sm text-purple-700">
                  C'est le pourcentage réel de votre revenu qui part en impôt. Il est plus faible que la TMI car l'impôt est calculé par tranches progressives.
                </p>
              </div>
              
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <h4 className="font-medium text-emerald-800 mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Quotient familial : {irCalculation.partsFiscales} parts
                </h4>
                <p className="text-sm text-emerald-700">
                  Le quotient familial divise votre revenu par le nombre de parts avant application du barème, ce qui réduit l'impôt pour les familles.
                  {irData.nbEnfantsCharge > 0 && (
                    <> Avec {irData.nbEnfantsCharge} enfant{irData.nbEnfantsCharge > 1 ? 's' : ''} à charge, vous bénéficiez de parts supplémentaires.</>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================= */}
        {/* ONGLET IR */}
        {/* ============================================================= */}
        <TabsContent value="ir" className="mt-4 space-y-6">
          {/* Situation familiale */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Situation familiale
              </CardTitle>
              <CardDescription>Ces informations déterminent le nombre de parts fiscales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Situation</Label>
                  <Select value={irData.situation} onValueChange={(v) => setIrData({...irData, situation: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SITUATIONS_FAMILIALES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Enfants à charge</Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={irData.nbEnfantsCharge} 
                    onChange={(e) => setIrData({...irData, nbEnfantsCharge: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Enfants en garde alternée</Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={irData.nbEnfantsGardeAlternee} 
                    onChange={(e) => setIrData({...irData, nbEnfantsGardeAlternee: Number(e.target.value)})} 
                  />
                </div>
              </div>
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-indigo-700">Nombre de parts fiscales calculé</span>
                <Badge className="bg-indigo-100 text-indigo-800 text-lg px-3">{partsFiscales}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Revenus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-emerald-600" />
                Revenus annuels
              </CardTitle>
              <CardDescription>Tous les revenus du foyer fiscal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    Salaires et traitements
                  </Label>
                  <Input 
                    type="number" 
                    value={irData.salaires} 
                    onChange={(e) => setIrData({...irData, salaires: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                  <p className="text-xs text-gray-500">Abattement 10% automatique (max 14 171 €)</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-gray-400" />
                    Revenus TNS (BIC/BNC)
                  </Label>
                  <Input 
                    type="number" 
                    value={irData.revenusTNS} 
                    onChange={(e) => setIrData({...irData, revenusTNS: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    Revenus fonciers
                  </Label>
                  <Input 
                    type="number" 
                    value={irData.revenusFonciers} 
                    onChange={(e) => setIrData({...irData, revenusFonciers: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    Revenus de capitaux mobiliers
                  </Label>
                  <Input 
                    type="number" 
                    value={irData.revenusCapitaux} 
                    onChange={(e) => setIrData({...irData, revenusCapitaux: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-gray-400" />
                    Pensions et retraites
                  </Label>
                  <Input 
                    type="number" 
                    value={irData.pensions} 
                    onChange={(e) => setIrData({...irData, pensions: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                  <p className="text-xs text-gray-500">Abattement 10% automatique (max 4 321 €)</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-gray-400" />
                    Autres revenus
                  </Label>
                  <Input 
                    type="number" 
                    value={irData.autresRevenus} 
                    onChange={(e) => setIrData({...irData, autresRevenus: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                </div>
              </div>
              <div className="mt-4 p-3 bg-emerald-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-emerald-700">Total des revenus bruts</span>
                <span className="font-bold text-emerald-800">{formatCurrency(irCalculation.revenusBruts)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Déductions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Charges déductibles
              </CardTitle>
              <CardDescription>Ces montants réduisent le revenu imposable</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pensions alimentaires versées</Label>
                  <Input 
                    type="number" 
                    value={irData.pensionsAlimentaires} 
                    onChange={(e) => setIrData({...irData, pensionsAlimentaires: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frais réels (si &gt; 10%)</Label>
                  <Input 
                    type="number" 
                    value={irData.fraisReels} 
                    onChange={(e) => setIrData({...irData, fraisReels: Number(e.target.value)})} 
                    placeholder="0 € (abattement 10% par défaut)"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-gray-400" />
                    Versements épargne retraite (PER, PERP, Madelin)
                  </Label>
                  <Input 
                    type="number" 
                    value={irData.epargneRetraite} 
                    onChange={(e) => setIrData({...irData, epargneRetraite: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                  <p className="text-xs text-gray-500">
                    Plafond: {formatCurrency(irCalculation.plafondEpargneRetraite)} (10% du revenu, min 4 399 €)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Déficits fonciers imputables</Label>
                  <Input 
                    type="number" 
                    value={irData.deficitsFonciers} 
                    onChange={(e) => setIrData({...irData, deficitsFonciers: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Réductions et crédits d'impôt */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-600" />
                Réductions et crédits d'impôt
              </CardTitle>
              <CardDescription>Ces montants réduisent directement l'impôt à payer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dons aux associations</Label>
                  <Input 
                    type="number" 
                    value={irData.dons} 
                    onChange={(e) => setIrData({...irData, dons: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                  <p className="text-xs text-gray-500">Réduction de 66%, plafonnée à 20% du revenu</p>
                </div>
                <div className="space-y-2">
                  <Label>Emploi à domicile</Label>
                  <Input 
                    type="number" 
                    value={irData.emploiDomicile} 
                    onChange={(e) => setIrData({...irData, emploiDomicile: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                  <p className="text-xs text-gray-500">Crédit de 50%, plafonné à 12 000 €</p>
                </div>
                <div className="space-y-2">
                  <Label>Frais de garde d'enfants</Label>
                  <Input 
                    type="number" 
                    value={irData.gardeEnfants} 
                    onChange={(e) => setIrData({...irData, gardeEnfants: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                  <p className="text-xs text-gray-500">Crédit de 50%, plafonné à 1 750 € / enfant</p>
                </div>
                <div className="space-y-2">
                  <Label>Investissement locatif (Pinel, Denormandie...)</Label>
                  <Input 
                    type="number" 
                    value={irData.investissementLocatif} 
                    onChange={(e) => setIrData({...irData, investissementLocatif: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                </div>
              </div>
              {irCalculation.totalReductions > 0 && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-purple-700">Total des réductions/crédits</span>
                  <span className="font-bold text-purple-800">{formatCurrency(irCalculation.totalReductions)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Résultat IR */}
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Calculator className="h-5 w-5" />
                Résultat du calcul IR
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Revenus bruts totaux</span>
                  <span className="font-semibold">{formatCurrency(irCalculation.revenusBruts)}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Revenu net imposable</span>
                  <span className="font-semibold">{formatCurrency(irCalculation.revenuNetImposable)}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Quotient familial ({partsFiscales} parts)</span>
                  <span className="font-semibold">{formatCurrency(irCalculation.quotientFamilial)}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Impôt brut</span>
                  <span className="font-semibold">{formatCurrency(irCalculation.impotBrut)}</span>
                </div>
                {irCalculation.totalReductions > 0 && (
                  <div className="flex justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-emerald-700">Réductions/Crédits d'impôt</span>
                    <span className="font-semibold text-emerald-700">-{formatCurrency(irCalculation.totalReductions)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-4 bg-blue-100 rounded-lg border border-blue-200">
                  <div>
                    <span className="font-medium text-blue-800">Impôt net à payer</span>
                    <p className="text-xs text-blue-600">TMI: {irCalculation.tmi}% • Taux effectif: {irCalculation.tauxEffectif.toFixed(1)}%</p>
                  </div>
                  <span className="text-3xl font-bold text-blue-700">{formatCurrency(irCalculation.impotNet)}</span>
                </div>
                <p className="text-center text-sm text-gray-500">
                  Soit un prélèvement mensuel de <strong>{formatCurrency(irCalculation.mensualite)}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================= */}
        {/* ONGLET IFI */}
        {/* ============================================================= */}
        <TabsContent value="ifi" className="mt-4 space-y-6">
          {/* Patrimoine immobilier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-600" />
                Patrimoine immobilier
              </CardTitle>
              <CardDescription>
                Valeur vénale au 1er janvier de l'année d'imposition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-gray-400" />
                    Résidence principale
                  </Label>
                  <Input 
                    type="number" 
                    value={ifiData.immobilierResidencePrincipale} 
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setIfiData({...ifiData, immobilierResidencePrincipale: val, abattementRP: Math.round(val * 0.3)})
                    }} 
                    placeholder="0 €"
                  />
                  <p className="text-xs text-gray-500">Abattement de 30% appliqué automatiquement</p>
                </div>
                <div className="space-y-2">
                  <Label>Immobilier locatif</Label>
                  <Input 
                    type="number" 
                    value={ifiData.immobilierLocatif} 
                    onChange={(e) => setIfiData({...ifiData, immobilierLocatif: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Résidence(s) secondaire(s)</Label>
                  <Input 
                    type="number" 
                    value={ifiData.immobilierSecondaire} 
                    onChange={(e) => setIfiData({...ifiData, immobilierSecondaire: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SCPI, OPCI (quote-part immobilière)</Label>
                  <Input 
                    type="number" 
                    value={ifiData.scpiOpci} 
                    onChange={(e) => setIfiData({...ifiData, scpiOpci: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parts de SCI</Label>
                  <Input 
                    type="number" 
                    value={ifiData.partsSCI} 
                    onChange={(e) => setIfiData({...ifiData, partsSCI: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-amber-700">Patrimoine immobilier brut</span>
                <span className="font-bold text-amber-800">{formatCurrency(ifiCalculation.baseBrute)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Déductions IFI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                Abattements et passif déductible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Abattement résidence principale (30%)</Label>
                  <Input 
                    type="number" 
                    value={ifiData.abattementRP} 
                    onChange={(e) => setIfiData({...ifiData, abattementRP: Number(e.target.value)})} 
                  />
                  <p className="text-xs text-gray-500">Calculé automatiquement: 30% de {formatCurrency(ifiData.immobilierResidencePrincipale)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Dettes déductibles</Label>
                  <Input 
                    type="number" 
                    value={ifiData.dettesDeductibles} 
                    onChange={(e) => setIfiData({...ifiData, dettesDeductibles: Number(e.target.value)})} 
                    placeholder="0 €"
                  />
                  <p className="text-xs text-gray-500">Emprunts immobiliers, travaux...</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Résultat IFI */}
          <Card className={ifiCalculation.assujetti ? "border-amber-200" : "border-emerald-200"}>
            <CardHeader className={ifiCalculation.assujetti ? "bg-amber-50" : "bg-emerald-50"}>
              <CardTitle className={`flex items-center gap-2 ${ifiCalculation.assujetti ? "text-amber-800" : "text-emerald-800"}`}>
                <Building2 className="h-5 w-5" />
                Résultat du calcul IFI
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Patrimoine immobilier brut</span>
                  <span className="font-semibold">{formatCurrency(ifiCalculation.baseBrute)}</span>
                </div>
                <div className="flex justify-between p-3 bg-emerald-50 rounded-lg">
                  <span className="text-emerald-700">Abattements et dettes</span>
                  <span className="font-semibold text-emerald-700">-{formatCurrency(ifiData.abattementRP + ifiData.dettesDeductibles)}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Base nette taxable</span>
                  <span className="font-semibold">{formatCurrency(ifiCalculation.baseNette)}</span>
                </div>
                
                {ifiCalculation.assujetti ? (
                  <>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Tranche applicable</span>
                      <Badge className="bg-amber-100 text-amber-800">{ifiCalculation.bracket}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-amber-100 rounded-lg border border-amber-200">
                      <div>
                        <span className="font-medium text-amber-800">IFI à payer</span>
                        <p className="text-xs text-amber-600">Taux moyen: {ifiCalculation.tauxMoyen.toFixed(2)}%</p>
                      </div>
                      <span className="text-3xl font-bold text-amber-700">{formatCurrency(ifiCalculation.impot)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center p-6 bg-emerald-100 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 mr-3" />
                    <div>
                      <span className="font-medium text-emerald-800">Non assujetti à l'IFI</span>
                      <p className="text-xs text-emerald-600">Seuil d'assujettissement: 1 300 000 €</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Barème IFI */}
          <Card>
            <CardHeader>
              <CardTitle>Barème IFI 2024</CardTitle>
              <CardDescription>Le seuil d'assujettissement est de 1 300 000 € de patrimoine immobilier net</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {IFI_BRACKETS_2024.map((b, i) => (
                  <div key={i} className={`p-3 rounded-lg border text-center ${ifiCalculation.baseNette >= b.min && ifiCalculation.baseNette < b.max ? 'bg-indigo-600 text-white' : 'bg-gray-50'}`}>
                    <p className="font-bold">{b.label}</p>
                    <p className="text-xs opacity-80">{b.min === 0 ? 'Jusqu\'à 800k€' : b.max === Infinity ? `+ ${(b.min/1000000).toFixed(0)}M€` : `${(b.min/1000000).toFixed(1)}-${(b.max/1000000).toFixed(1)}M€`}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================= */}
        {/* ONGLET OPTIMISATION */}
        {/* ============================================================= */}
        <TabsContent value="optimisation" className="mt-4 space-y-6">
          
          {/* Dashboard économies potentielles */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border border-gray-200 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Économie PER potentielle</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(Math.min(perAmount, Math.max(0, irCalculation.plafondEpargneRetraite - irData.epargneRetraite)) * (irCalculation.tmi / 100))}
                    </p>
                  </div>
                  <div className="p-3 bg-[#7373FF]/10 rounded-xl">
                    <PiggyBank className="h-6 w-6 text-[#7373FF]" />
                  </div>
                </div>
                <p className="text-gray-400 text-xs mt-2">Sur un versement de {formatCurrency(perAmount)}</p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Plafond dons disponible</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(Math.max(0, irCalculation.revenuNetImposable * 0.20 - irData.dons))}
                    </p>
                  </div>
                  <div className="p-3 bg-[#7373FF]/10 rounded-xl">
                    <Gift className="h-6 w-6 text-[#7373FF]" />
                  </div>
                </div>
                <p className="text-gray-400 text-xs mt-2">Réduction de 66% sur ce montant</p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Crédit emploi domicile</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(Math.max(0, (12000 + irData.nbEnfantsCharge * 1500) - irData.emploiDomicile) * 0.5)}
                    </p>
                  </div>
                  <div className="p-3 bg-[#7373FF]/10 rounded-xl">
                    <Users className="h-6 w-6 text-[#7373FF]" />
                  </div>
                </div>
                <p className="text-gray-400 text-xs mt-2">Plafond: {formatCurrency(12000 + irData.nbEnfantsCharge * 1500)}</p>
              </CardContent>
            </Card>

            <Card className={`border ${ifiCalculation.assujetti ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${ifiCalculation.assujetti ? 'text-amber-700' : 'text-gray-500'}`}>
                      {ifiCalculation.assujetti ? 'Réduction IFI possible' : 'Non assujetti IFI'}
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${ifiCalculation.assujetti ? 'text-amber-800' : 'text-gray-400'}`}>
                      {ifiCalculation.assujetti ? formatCurrency(Math.min(ifiCalculation.impot, 45000)) : '—'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${ifiCalculation.assujetti ? 'bg-amber-100' : 'bg-gray-200'}`}>
                    <Building2 className={`h-6 w-6 ${ifiCalculation.assujetti ? 'text-amber-600' : 'text-gray-400'}`} />
                  </div>
                </div>
                <p className={`text-xs mt-2 ${ifiCalculation.assujetti ? 'text-amber-600' : 'text-gray-400'}`}>
                  {ifiCalculation.assujetti ? 'Via investissement PME' : 'Seuil: 1,3 M€'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Simulation PER interactive */}
          <Card className="overflow-hidden border border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#7373FF]/10 rounded-xl">
                    <PiggyBank className="h-6 w-6 text-[#7373FF]" />
                  </div>
                  <div>
                    <CardTitle>Simulateur Plan d'Épargne Retraite (PER)</CardTitle>
                    <CardDescription>Optimisez votre fiscalité tout en préparant votre retraite</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
                  TMI {irCalculation.tmi}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Côté gauche - Simulation */}
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-gray-700 font-medium">Versement annuel envisagé</Label>
                      <span className="text-2xl font-bold text-[#7373FF]">{formatCurrency(perAmount)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max={Math.max(10000, irCalculation.plafondEpargneRetraite)} 
                      step="100"
                      value={perAmount} 
                      onChange={(e) => setPerAmount(Number(e.target.value))} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7373FF]"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0 €</span>
                      <span>Plafond: {formatCurrency(irCalculation.plafondEpargneRetraite)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Revenu imposable actuel</p>
                      <p className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(irCalculation.revenuNetImposable)}</p>
                    </div>
                    <div className="p-4 bg-[#7373FF]/5 rounded-xl text-center border border-[#7373FF]/20">
                      <p className="text-xs text-[#5c5ce6] uppercase tracking-wide">Après versement PER</p>
                      <p className="text-xl font-bold text-[#7373FF] mt-1">{formatCurrency(Math.max(0, irCalculation.revenuNetImposable - perAmount))}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#7373FF] rounded-xl text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-sm">Votre économie d'impôt</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(perEconomy)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/80 text-sm">Soit par mois</p>
                        <p className="text-xl font-semibold mt-1">{formatCurrency(perEconomy / 12)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Côté droit - Détails */}
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#7373FF]" />
                      Utilisation du plafond
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Plafond 2024</span>
                        <span className="font-medium">{formatCurrency(irCalculation.plafondEpargneRetraite)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Déjà utilisé</span>
                        <span className="font-medium text-gray-500">-{formatCurrency(irData.epargneRetraite)}</span>
                      </div>
                      <div className="h-px bg-gray-200 my-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Disponible</span>
                        <span className="font-bold text-[#7373FF]">{formatCurrency(Math.max(0, irCalculation.plafondEpargneRetraite - irData.epargneRetraite))}</span>
                      </div>
                    </div>
                    <Progress 
                      value={((irData.epargneRetraite + perAmount) / irCalculation.plafondEpargneRetraite) * 100} 
                      className="h-3 mt-4"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Utilisé: {Math.round(((irData.epargneRetraite + perAmount) / irCalculation.plafondEpargneRetraite) * 100)}%</span>
                      <span>{perAmount > (irCalculation.plafondEpargneRetraite - irData.epargneRetraite) ? '⚠️ Dépasse le plafond' : '✓ Dans le plafond'}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4 text-gray-500" />
                      À retenir
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-[#7373FF] flex-shrink-0" />
                        <span>Économie immédiate sur l'impôt de l'année</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-[#7373FF] flex-shrink-0" />
                        <span>Capital disponible à la retraite (rente ou capital)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                        <span>Imposition à la sortie (souvent à un taux plus faible)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommandations personnalisées avec priorité */}
          <Card className="border border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#7373FF]/10 rounded-xl">
                    <Lightbulb className="h-6 w-6 text-[#7373FF]" />
                  </div>
                  <div>
                    <CardTitle>Recommandations personnalisées</CardTitle>
                    <CardDescription>Stratégies d'optimisation adaptées à votre profil fiscal</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Priorité haute si TMI >= 30% */}
              {irCalculation.tmi >= 30 && irData.epargneRetraite < irCalculation.plafondEpargneRetraite && (
                <div className="p-5 rounded-xl border border-[#7373FF]/30 bg-[#7373FF]/5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#7373FF]/10 rounded-xl">
                      <PiggyBank className="h-6 w-6 text-[#7373FF]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-[#7373FF] text-white">Priorité haute</Badge>
                        <Badge variant="outline" className="text-[#5c5ce6] border-[#7373FF]/30">Économie jusqu'à {formatCurrency((irCalculation.plafondEpargneRetraite - irData.epargneRetraite) * (irCalculation.tmi / 100))}</Badge>
                      </div>
                      <p className="font-semibold text-gray-800 text-lg">Maximiser vos versements PER</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Avec une TMI de {irCalculation.tmi}%, chaque euro versé sur votre PER vous fait économiser {(irCalculation.tmi / 100).toFixed(2)} € d'impôt immédiatement. 
                        Il vous reste <strong>{formatCurrency(irCalculation.plafondEpargneRetraite - irData.epargneRetraite)}</strong> de plafond disponible cette année.
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <Button size="sm" className="bg-[#7373FF] hover:bg-[#5c5ce6]">
                          <Calculator className="h-4 w-4 mr-2" />
                          Simuler un versement
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Déficit foncier */}
              {irData.revenusFonciers > 0 && (
                <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-xl">
                      <Home className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-gray-700 border-gray-300">Revenus fonciers: {formatCurrency(irData.revenusFonciers)}</Badge>
                      </div>
                      <p className="font-semibold text-gray-800">Stratégie déficit foncier</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Réalisez des travaux d'amélioration ou de réparation sur vos biens locatifs. 
                        Vous pouvez déduire jusqu'à <strong>10 700 €</strong> de vos revenus globaux, 
                        soit une économie potentielle de <strong>{formatCurrency(10700 * (irCalculation.tmi / 100))}</strong> à votre TMI.
                      </p>
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                          <div>
                            <p className="text-gray-500">Plafond imputation</p>
                            <p className="font-bold text-gray-800">10 700 €</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Report possible</p>
                            <p className="font-bold text-gray-800">10 ans</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Économie max</p>
                            <p className="font-bold text-[#7373FF]">{formatCurrency(10700 * (irCalculation.tmi / 100))}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dons aux associations */}
              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Gift className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-gray-700 border-gray-300">Réduction 66%</Badge>
                      {irData.dons > 0 && <Badge className="bg-gray-100 text-gray-700">Déjà {formatCurrency(irData.dons)} déclarés</Badge>}
                    </div>
                    <p className="font-semibold text-gray-800">Dons aux associations</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Vos dons aux associations d'intérêt général ouvrent droit à une réduction d'impôt de 66% du montant, 
                      dans la limite de 20% du revenu imposable.
                    </p>
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Plafond pour vous</p>
                          <p className="font-bold text-gray-800">{formatCurrency(irCalculation.revenuNetImposable * 0.20)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Réduction maximale</p>
                          <p className="font-bold text-[#7373FF]">{formatCurrency(irCalculation.revenuNetImposable * 0.20 * 0.66)}</p>
                        </div>
                      </div>
                      <Progress 
                        value={(irData.dons / (irCalculation.revenuNetImposable * 0.20)) * 100} 
                        className="h-2 mt-3"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Emploi à domicile */}
              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Users className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-gray-700 border-gray-300">Crédit d'impôt 50%</Badge>
                      {irData.nbEnfantsCharge > 0 && <Badge className="bg-gray-100 text-gray-700">+{formatCurrency(irData.nbEnfantsCharge * 1500)} plafond enfants</Badge>}
                    </div>
                    <p className="font-semibold text-gray-800">Emploi à domicile</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Les dépenses d'emploi à domicile (ménage, jardinage, garde d'enfants, soutien scolaire, aide aux personnes âgées...) 
                      ouvrent droit à un crédit d'impôt de 50%.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                        <p className="text-xs text-gray-500">Votre plafond</p>
                        <p className="font-bold text-gray-800">{formatCurrency(12000 + irData.nbEnfantsCharge * 1500)}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                        <p className="text-xs text-gray-500">Crédit max</p>
                        <p className="font-bold text-[#7373FF]">{formatCurrency((12000 + irData.nbEnfantsCharge * 1500) * 0.5)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stratégies calculées par l'API */}
              {calculators.taxOptimization?.recommendations && calculators.taxOptimization.recommendations.length > 0 && (
                <div className="p-5 rounded-xl border border-gray-200 bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-[#7373FF]/10 rounded-xl">
                      <Calculator className="h-5 w-5 text-[#7373FF]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Stratégies calculées par nos simulateurs</p>
                      <p className="text-xs text-gray-500">Basées sur votre profil fiscal réel</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {calculators.taxOptimization.recommendations.map((reco, idx) => {
                      const priority = reco.taxSaving >= 2000 ? 'high' : reco.taxSaving >= 500 ? 'medium' : 'low'
                      return (
                      <div key={idx} className={`p-4 rounded-lg border ${
                        priority === 'high' ? 'bg-[#7373FF]/5 border-[#7373FF]/20' :
                        priority === 'medium' ? 'bg-gray-50 border-gray-200' :
                        'bg-gray-50 border-gray-100'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800">{reco.name}</p>
                            <Badge variant="outline" className={
                              priority === 'high' ? 'text-[#5c5ce6] border-[#7373FF]/30' :
                              'text-gray-600 border-gray-300'
                            }>
                              {priority === 'high' ? 'Priorité haute' : 
                               priority === 'medium' ? 'Priorité moyenne' : 'À considérer'}
                            </Badge>
                          </div>
                          <span className={`font-bold ${
                            priority === 'high' ? 'text-[#7373FF]' : 'text-gray-700'
                          }`}>
                            {formatCurrency(reco.taxSaving)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{reco.description}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {reco.maxAmount > 0 ? `Montant max: ${formatCurrency(reco.maxAmount)}` : `Type: ${reco.type}`}
                        </p>
                      </div>
                      )
                    })}
                  </div>
                  {(calculators.taxOptimization.totalPotentialSavings || calculators.taxOptimization.potentialSavings) > 0 && (
                    <div className="mt-4 p-3 bg-[#7373FF]/10 rounded-lg border border-[#7373FF]/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Économie totale potentielle</span>
                        <span className="text-lg font-bold text-[#7373FF]">
                          {formatCurrency(calculators.taxOptimization.totalPotentialSavings || calculators.taxOptimization.potentialSavings)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Réduction IFI - si assujetti */}
              {ifiCalculation.assujetti && (
                <div className="p-5 rounded-xl border border-amber-200 bg-amber-50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-amber-600 text-white">Action recommandée</Badge>
                        <Badge variant="outline" className="text-amber-700 border-amber-300">IFI: {formatCurrency(ifiCalculation.impot)}</Badge>
                      </div>
                      <p className="font-semibold text-gray-800 text-lg">Stratégies de réduction IFI</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Vous êtes assujetti à l'IFI pour un montant de <strong>{formatCurrency(ifiCalculation.impot)}</strong>. 
                        Plusieurs solutions permettent de réduire significativement cet impôt.
                      </p>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <p className="font-medium text-gray-800">Investissement PME</p>
                          <p className="text-sm text-gray-600 mt-1">Réduction de 50% du montant investi, plafonnée à 45 000 €</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Pour annuler votre IFI: investir {formatCurrency(Math.min(ifiCalculation.impot * 2, 90000))}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <p className="font-medium text-gray-800">Dons à fondations</p>
                          <p className="text-sm text-gray-600 mt-1">Réduction de 75% du don, plafonnée à 50 000 €</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Pour annuler votre IFI: donner {formatCurrency(Math.min(ifiCalculation.impot / 0.75, 66667))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Garde d'enfants si enfants à charge */}
              {irData.nbEnfantsCharge > 0 && (
                <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-xl">
                      <Heart className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-gray-700 border-gray-300">Crédit 50%</Badge>
                        <Badge className="bg-gray-100 text-gray-700">{irData.nbEnfantsCharge} enfant(s) à charge</Badge>
                      </div>
                      <p className="font-semibold text-gray-800">Frais de garde d'enfants</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Les frais de garde d'enfants de moins de 6 ans (crèche, assistante maternelle, garde à domicile...) 
                        ouvrent droit à un crédit d'impôt de 50%, plafonné à 3 500 € par enfant (soit 1 750 € de crédit).
                      </p>
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Plafond dépenses</p>
                            <p className="font-bold text-gray-800">{formatCurrency(irData.nbEnfantsCharge * 3500)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Crédit max</p>
                            <p className="font-bold text-[#7373FF]">{formatCurrency(irData.nbEnfantsCharge * 1750)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}

export default TabFiscaliteComplete
