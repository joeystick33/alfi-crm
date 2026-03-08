'use client'

/**
 * BilanPatrimonialWizard - Wizard complet pour créer un Bilan Patrimonial
 * Selon SPEC_DOSSIERS_INTEGRES.md
 * 
 * Étapes:
 * 1. COLLECTE - Visualisation des données client importées
 * 2. ANALYSE - Sélection des simulations à inclure
 * 3. PRÉCONISATIONS - Ajout/édition des recommandations
 * 4. VALIDATION - Prévisualisation du PDF
 * 5. GÉNÉRATION - Téléchargement du PDF final
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { runAuditPatrimonialComplet, type AuditPatrimonialComplet, type AuditInputData } from './audit-patrimonial-engine'
import { useAI } from '../../../hooks/useAI'
import { useBudgetSummary } from '../../../hooks/useBudgetSummary'
import { useFiscaliteSummary } from '../../../hooks/useFiscaliteSummary'
import { usePatrimoineSummary } from '../../../hooks/usePatrimoineSummary'
import { useClientCalculators } from '../../../hooks/useClientCalculators'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/_common/components/ui/Dialog'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Label } from '@/app/_common/components/ui/Label'
import { Badge } from '@/app/_common/components/ui/Badge'
import { useToast } from '@/app/_common/hooks/use-toast'
import { formatCurrency, formatDate } from '@/app/_common/lib/utils'
import { 
  ChevronLeft, ChevronRight, Check, Download, Eye, Loader2,
  User, Wallet, Home, CreditCard, Target, FileText,
  Plus, Trash2, Calculator, TrendingUp, Shield, AlertTriangle,
  PieChart, Clock, Users, Banknote, BarChart3,
  DollarSign, Scale, ArrowUpRight, Sparkles,
  Gift, Briefcase,
  ChevronDown, ChevronUp, Landmark, CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
interface Actif {
  id: string
  type: string
  category: string
  name: string
  value: number
}

interface Passif {
  id: string
  type: string
  name: string
  remainingAmount: number
  monthlyPayment: number
  interestRate: number
}

interface Simulation {
  id: string
  type: string
  name: string
  createdAt: string
  resultats?: Record<string, unknown>
  parametres?: Record<string, unknown>
}

interface Preconisation {
  id: string
  titre: string
  description: string
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE'
  produit?: string
  montantEstime?: number
  categorie?: string
  objectif?: string
  avantages?: string
  risques?: string
  horizonTemporel?: 'court' | 'moyen' | 'long'
  impactFiscalAnnuel?: number
  scoreImpact?: number
}

interface ConseillerInfo {
  id?: string
  firstName: string
  lastName: string
  email?: string
}

interface CabinetInfo {
  id?: string
  name: string
  email?: string
  phone?: string
}

interface ClientData {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  birthDate?: string
  maritalStatus?: string
  matrimonialRegime?: string
  numberOfChildren?: number
  profession?: string
  annualIncome?: number
  actifs: Actif[]
  passifs: Passif[]
  simulations: Simulation[]
  conseiller?: ConseillerInfo
}

// AuditPatrimonialComplet is imported from ./audit-patrimonial-engine

interface BilanPatrimonialWizardProps {
  open: boolean
  onClose: () => void
  clientId: string
  clientData?: ClientData
}

type WizardStep = 'COLLECTE' | 'AUDIT' | 'ANALYSE' | 'PRECONISATION' | 'VALIDATION' | 'GENERATION'

const STEPS: { id: WizardStep; label: string; icon: React.ElementType }[] = [
  { id: 'COLLECTE', label: 'Données', icon: User },
  { id: 'AUDIT', label: 'Audit', icon: Shield },
  { id: 'ANALYSE', label: 'Études', icon: BarChart3 },
  { id: 'PRECONISATION', label: 'Préconisations', icon: Target },
  { id: 'VALIDATION', label: 'Aperçu', icon: Eye },
  { id: 'GENERATION', label: 'Génération', icon: Download },
]

const PRIORITY_COLORS = {
  HAUTE: 'bg-red-100 text-red-700 border-red-200',
  MOYENNE: 'bg-amber-100 text-amber-700 border-amber-200',
  BASSE: 'bg-green-100 text-green-700 border-green-200',
}

export function BilanPatrimonialWizard({ open, onClose, clientId, clientData: initialClientData }: BilanPatrimonialWizardProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<WizardStep>('COLLECTE')
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Data states
  const [clientData, setClientData] = useState<ClientData | null>(initialClientData || null)
  const [cabinetInfo, setCabinetInfo] = useState<CabinetInfo | null>(null)
  const [selectedSimulations, setSelectedSimulations] = useState<string[]>([])
  const [preconisations, setPreconisations] = useState<Preconisation[]>([])
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  
  const [auditData, setAuditData] = useState<AuditPatrimonialComplet | null>(null)
  const [auditTab, setAuditTab] = useState<string>('synthese')

  // ── Hooks pré-calcul : réutilise les calculs existants des tabs Client360 ──
  const budgetSummary = useBudgetSummary(
    clientId,
    clientData?.maritalStatus,
    clientData?.numberOfChildren,
    clientData?.annualIncome,
    clientData?.passifs?.map(p => ({ id: p.id, type: p.type, monthlyPayment: p.monthlyPayment }))
  )
  const fiscaliteSummary = useFiscaliteSummary(
    clientId,
    clientData?.maritalStatus,
    clientData?.numberOfChildren,
    undefined, // familyMembers — pas dispo dans clientData, le hook charge ses propres données
    clientData?.annualIncome,
    clientData?.profession,
  )
  const patrimoineSummary = usePatrimoineSummary(clientId)
  const calculators = useClientCalculators(clientId)

  // AI hook
  const ai = useAI()
  const [enrichingPrecoId, setEnrichingPrecoId] = useState<string | null>(null)

  // Études détaillées — expanded state
  const [expandedAxes, setExpandedAxes] = useState<string[]>([])

  // New preconisation form
  const [newPreco, setNewPreco] = useState<Partial<Preconisation>>({
    titre: '',
    description: '',
    priorite: 'MOYENNE',
  })

  // AI enrichment for a preconisation
  const handleEnrichPreco = useCallback(async (precoId: string) => {
    const preco = preconisations.find(p => p.id === precoId)
    if (!preco) return
    setEnrichingPrecoId(precoId)
    try {
      const enriched = await ai.enrichPreconisation({
        titre: preco.titre,
        categorie: 'patrimoine',
        produit: preco.produit,
        montantEstime: preco.montantEstime,
        objectif: preco.description || preco.titre,
        clientAge: clientData?.birthDate ? Math.floor((Date.now() - new Date(clientData.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 45,
        clientTmi: auditData?.fiscalite?.ir?.tmi || 30,
        clientCapaciteEpargne: auditData?.budget?.capaciteEpargneMensuelle || 500,
        clientPatrimoineNet: patrimoineNet || 100000,
      })
      if (enriched) {
        setPreconisations(prev => prev.map(p => p.id === precoId ? { ...p, description: enriched } : p))
        toast({ title: 'Pr\u00e9conisation enrichie', description: 'La description a \u00e9t\u00e9 compl\u00e9t\u00e9e par l\'IA.' })
      }
    } finally {
      setEnrichingPrecoId(null)
    }
  }, [preconisations, ai, clientData, auditData, toast])


  // Reset states when dialog closes, fetch when it opens
  useEffect(() => {
    if (open) {
      fetchClientData()
    } else {
      setCurrentStep('COLLECTE')
      setClientData(initialClientData || null)
      setCabinetInfo(null)
      setSelectedSimulations([])
      setPreconisations([])
      setPreviewHtml(null)
      setAuditData(null)
      setNewPreco({ titre: '', description: '', priorite: 'MOYENNE' })
    }
  }, [open, clientId])

  const fetchClientData = async () => {
    setIsLoading(true)
    try {
      // Charger le client avec toutes ses relations (include=all)
      const clientRes = await fetch(`/api/advisor/clients/${clientId}?include=all`)
      
      if (!clientRes.ok) {
        throw new Error('Impossible de charger le client')
      }
      
      const responseJson = await clientRes.json()
      // L'API retourne { data: {...}, timestamp } — on déemballe
      const clientBase = responseJson.data || responseJson
      
      // Extraire les actifs (formatClient aplatit déjà ClientActif → Actif)
      const actifs: Actif[] = (clientBase.actifs || []).map((a: any) => ({
        id: a.id || a.clientActifId || `actif-${Math.random()}`,
        type: a.type || 'AUTRE',
        category: a.category || 'AUTRE',
        name: a.name || a.nom || 'Actif',
        value: Number(a.value || a.valeur || 0),
      }))
      
      // Extraire les passifs
      const passifs: Passif[] = (clientBase.passifs || []).map((p: any) => ({
        id: p.id,
        type: p.type || 'AUTRE',
        name: p.name || p.libelle || 'Passif',
        remainingAmount: Number(p.remainingAmount || p.capitalRestantDu || 0),
        monthlyPayment: Number(p.monthlyPayment || p.mensualiteTotale || 0),
        interestRate: Number(p.interestRate || p.tauxNominal || 0),
      }))

      // Extraire les simulations directement depuis les données client si incluses,
      // sinon les charger séparément
      let formattedSims: Simulation[] = []
      const rawSims = clientBase.simulations || []
      formattedSims = rawSims.map((s: any) => ({
        id: s.id,
        type: s.type || s.simulateurType || 'AUTRE',
        name: s.name || s.nom || 'Simulation',
        createdAt: s.createdAt,
        resultats: s.results || s.resultats,
        parametres: s.parameters || s.parametres,
      }))
      
      // Extraire le conseiller depuis la réponse
      const conseillerData: ConseillerInfo | undefined = clientBase.conseiller ? {
        id: clientBase.conseiller.id,
        firstName: clientBase.conseiller.firstName || '',
        lastName: clientBase.conseiller.lastName || '',
        email: clientBase.conseiller.email || undefined,
      } : undefined

      const newClientData: ClientData = {
        id: clientBase.id,
        firstName: clientBase.firstName,
        lastName: clientBase.lastName,
        email: clientBase.email,
        phone: clientBase.phone || clientBase.mobile,
        birthDate: clientBase.birthDate,
        maritalStatus: clientBase.maritalStatus,
        matrimonialRegime: clientBase.matrimonialRegime || clientBase.marriageRegime,
        numberOfChildren: clientBase.numberOfChildren,
        profession: clientBase.profession,
        annualIncome: Number(clientBase.annualIncome || 0),
        actifs,
        passifs,
        simulations: formattedSims,
        conseiller: conseillerData,
      }
      setClientData(newClientData)

      // Charger le cabinet
      try {
        const cabRes = await fetch('/api/advisor/cabinet')
        if (cabRes.ok) {
          const cabJson = await cabRes.json()
          const cab = cabJson.data || cabJson
          if (cab && cab.name) {
            setCabinetInfo({ id: cab.id, name: cab.name, email: cab.email, phone: cab.phone })
          }
        }
      } catch { /* cabinet info is optional */ }

      // L'audit complet sera lancé quand l'utilisateur passera à l'étape AUDIT
      // (appels API lourds — on ne les lance pas au chargement initial)
    } catch (error) {
      console.error('Error fetching client data:', error)
      toast({ title: 'Erreur', description: 'Impossible de charger les données client', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = async () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep)
    if (currentIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentIndex + 1].id
      if (nextStep === 'AUDIT' && !auditData && clientData) {
        // Lancer l'audit — moteur synchrone, données pré-calculées par les hooks
        setIsLoading(true)
        setCurrentStep(nextStep)
        try {
          // Construire les détails revenus/charges depuis les données clientData
          const totalRev = budgetSummary.totalRevenus || 1
          const totalChg = budgetSummary.totalCharges || 1
          const calcData = calculators.clientData

          const auditInput: AuditInputData = {
            client: {
              id: clientData.id,
              firstName: clientData.firstName,
              lastName: clientData.lastName,
              birthDate: clientData.birthDate,
              maritalStatus: clientData.maritalStatus,
              matrimonialRegime: clientData.matrimonialRegime,
              numberOfChildren: clientData.numberOfChildren,
              profession: clientData.profession,
              annualIncome: clientData.annualIncome,
            },
            actifs: clientData.actifs,
            passifs: clientData.passifs,
            budgetSummary,
            fiscaliteSummary,
            patrimoineSummary,
            calculators: {
              budgetAnalysis: calculators.budgetAnalysis,
              debtCapacity: calculators.debtCapacity,
              incomeTax: calculators.incomeTax,
              wealthTax: calculators.wealthTax,
              taxOptimization: calculators.taxOptimization,
              emergencyFund: calculators.emergencyFund,
              retirementSimulation: calculators.retirementSimulation,
            },
            detailRevenus: [
              { categorie: 'Salaires', montant: calcData?.salaires || 0, poids: totalRev > 0 ? ((calcData?.salaires || 0) / totalRev) * 100 : 0 },
              { categorie: 'Revenus locatifs', montant: calcData?.revenusLocatifs || 0, poids: totalRev > 0 ? ((calcData?.revenusLocatifs || 0) / totalRev) * 100 : 0 },
              { categorie: 'Revenus financiers', montant: calcData?.revenusInvestissement || 0, poids: totalRev > 0 ? ((calcData?.revenusInvestissement || 0) / totalRev) * 100 : 0 },
              { categorie: 'Autres', montant: calcData?.autresRevenus || 0, poids: totalRev > 0 ? ((calcData?.autresRevenus || 0) / totalRev) * 100 : 0 },
            ].filter(r => r.montant > 0),
            detailCharges: [
              { categorie: 'Logement', montant: calcData?.chargesLogement || 0, poids: totalChg > 0 ? ((calcData?.chargesLogement || 0) / totalChg) * 100 : 0 },
              { categorie: 'Transport', montant: calcData?.chargesTransport || 0, poids: totalChg > 0 ? ((calcData?.chargesTransport || 0) / totalChg) * 100 : 0 },
              { categorie: 'Alimentation', montant: calcData?.chargesAlimentation || 0, poids: totalChg > 0 ? ((calcData?.chargesAlimentation || 0) / totalChg) * 100 : 0 },
              { categorie: 'Autres', montant: calcData?.autresCharges || 0, poids: totalChg > 0 ? ((calcData?.autresCharges || 0) / totalChg) * 100 : 0 },
            ].filter(c => c.montant > 0),
            salaires: calcData?.salaires || 0,
            revenusLocatifs: calcData?.revenusLocatifs || 0,
            revenusInvestissement: calcData?.revenusInvestissement || 0,
            chargesLogement: calcData?.chargesLogement || 0,
            chargesTransport: calcData?.chargesTransport || 0,
            chargesAlimentation: calcData?.chargesAlimentation || 0,
          }

          const audit = runAuditPatrimonialComplet(auditInput)
          setAuditData(audit)

          // Auto-populate préconisations from engine if none added manually
          if (audit.preconisationsAuto && audit.preconisationsAuto.length > 0 && preconisations.length === 0) {
            const autoPrecos: Preconisation[] = audit.preconisationsAuto.map((ap, idx) => ({
              id: `auto-${idx}-${Date.now()}`,
              titre: ap.titre,
              description: ap.description,
              priorite: ap.priorite,
              produit: ap.produit || undefined,
              montantEstime: ap.montantEstime || undefined,
              categorie: ap.categorie,
              objectif: ap.objectif,
              avantages: ap.avantages,
              risques: ap.risques || undefined,
              horizonTemporel: ap.horizonTemporel,
              impactFiscalAnnuel: ap.impactFiscalAnnuel || undefined,
              scoreImpact: ap.scoreImpact,
            }))
            setPreconisations(autoPrecos)
          }
        } catch (e) {
          console.error('Erreur audit patrimonial:', e)
          toast({ title: 'Erreur', description: 'Erreur lors du calcul de l\'audit', variant: 'destructive' })
        } finally {
          setIsLoading(false)
        }
        return
      }
      if (nextStep === 'VALIDATION') {
        generatePreview()
      }
      setCurrentStep(nextStep)
    }
  }

  const handlePrev = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id)
    }
  }

  const toggleSimulation = (simId: string) => {
    setSelectedSimulations(prev => 
      prev.includes(simId) ? prev.filter(id => id !== simId) : [...prev, simId]
    )
  }

  const addPreconisation = () => {
    if (!newPreco.titre?.trim()) {
      toast({ title: 'Erreur', description: 'Le titre est requis', variant: 'destructive' })
      return
    }
    
    const preco: Preconisation = {
      id: `preco-${Date.now()}`,
      titre: newPreco.titre || '',
      description: newPreco.description || '',
      priorite: newPreco.priorite as 'HAUTE' | 'MOYENNE' | 'BASSE',
      produit: newPreco.produit,
      montantEstime: newPreco.montantEstime,
    }
    
    setPreconisations(prev => [...prev, preco])
    setNewPreco({ titre: '', description: '', priorite: 'MOYENNE' })
  }

  const removePreconisation = (id: string) => {
    setPreconisations(prev => prev.filter(p => p.id !== id))
  }

  const generatePreview = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/advisor/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'BILAN_PATRIMONIAL',
          id: clientId,
          options: { preview: true },
          selectedSimulations,
          preconisations,
          audit: auditData,
        }),
      })
      
      if (response.ok) {
        const html = await response.text()
        setPreviewHtml(html)
      }
    } catch (error) {
      console.error('Error generating preview:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/advisor/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'BILAN_PATRIMONIAL',
          id: clientId,
          selectedSimulations,
          preconisations,
          audit: auditData,
        }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: 'Erreur lors de la génération' }))
        throw new Error(errBody?.error || 'Erreur lors de la génération')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Bilan_Patrimonial_${clientData?.lastName}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({ title: 'PDF généré', description: 'Le bilan patrimonial a été téléchargé', variant: 'success' })
      onClose()
    } catch (error) {
      console.error('Error generating PDF:', error)
      const msg = error instanceof Error ? error.message : 'Impossible de générer le PDF'
      toast({ title: 'Erreur PDF', description: msg.slice(0, 200), variant: 'destructive' })
    } finally {
      setIsGenerating(false)
    }
  }

  // Mapping enums → labels FR
  const mapMaritalStatus = (s?: string) => {
    if (!s) return undefined
    const m: Record<string, string> = {
      SINGLE: 'Célibataire', MARRIED: 'Marié(e)', PACS: 'Pacsé(e)',
      DIVORCED: 'Divorcé(e)', WIDOWED: 'Veuf/Veuve', COHABITING: 'Concubinage', SEPARATED: 'Séparé(e)',
    }
    return m[s] || s
  }

  const mapCategory = (c: string) => {
    const m: Record<string, string> = {
      IMMOBILIER: 'Immobilier', FINANCIER: 'Financier',
      EPARGNE_SALARIALE: 'Épargne salariale', EPARGNE_RETRAITE: 'Épargne retraite',
      PROFESSIONNEL: 'Professionnel', MOBILIER: 'Biens mobiliers', AUTRE: 'Autres',
    }
    return m[c] || c
  }

  const mapType = (t: string) => {
    const m: Record<string, string> = {
      REAL_ESTATE_MAIN: 'Résidence principale', REAL_ESTATE_RENTAL: 'Locatif',
      REAL_ESTATE_SECONDARY: 'Secondaire', REAL_ESTATE_COMMERCIAL: 'Commercial',
      SCPI: 'SCPI', SCI: 'SCI', OPCI: 'OPCI',
      LIFE_INSURANCE: 'Assurance-vie', PEA: 'PEA', PER: 'PER',
      SECURITIES_ACCOUNT: 'Compte-titres', BANK_ACCOUNT: 'Compte bancaire',
      SAVINGS_ACCOUNT: 'Épargne', PEL: 'PEL', CEL: 'CEL',
      MORTGAGE: 'Emprunt immobilier', CONSUMER_LOAN: 'Crédit conso',
      CAR_LOAN: 'Crédit auto', PROFESSIONAL_LOAN: 'Prêt pro',
      REVOLVING_CREDIT: 'Renouvelable', IN_FINE_LOAN: 'In fine',
    }
    return m[t] || t.replace(/_/g, ' ')
  }

  const mapSimType = (t: string) => {
    const m: Record<string, string> = {
      CREDIT_IMMOBILIER: 'Crédit immobilier', ASSURANCE_VIE: 'Assurance-vie',
      PER: 'PER', RETRAITE: 'Retraite', PREVOYANCE: 'Prévoyance',
      SUCCESSION: 'Succession', DONATION: 'Donation', IFI: 'IFI',
      IMPOT_REVENU: 'Impôt sur le revenu', DEFISCALISATION: 'Défiscalisation',
      INVESTISSEMENT_LOCATIF: 'Investissement locatif', SCPI: 'SCPI',
      EPARGNE: 'Épargne', BUDGET: 'Budget', PATRIMOINE: 'Patrimoine',
    }
    return m[t] || t.replace(/_/g, ' ')
  }

  // Calculate totals
  const totalActifs = clientData?.actifs.reduce((sum, a) => sum + (a.value || 0), 0) || 0
  const totalPassifs = clientData?.passifs.reduce((sum, p) => sum + (p.remainingAmount || 0), 0) || 0
  const totalMensualites = clientData?.passifs.reduce((sum, p) => sum + (p.monthlyPayment || 0), 0) || 0
  const patrimoineNet = totalActifs - totalPassifs

  // Group actifs by category (with FR labels)
  const actifsByCategory = clientData?.actifs.reduce((acc, actif) => {
    const cat = mapCategory(actif.category || 'AUTRE')
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(actif)
    return acc
  }, {} as Record<string, Actif[]>) || {}

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-0 border-b-0">
          {/* Premium header with subtle gradient */}
          <div className="bg-gradient-to-r from-[#7373FF]/[0.04] via-indigo-50/30 to-transparent rounded-xl px-5 py-4 mb-3">
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#7373FF]/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#7373FF]" />
              </div>
              <div>
                <span>Bilan Patrimonial</span>
                {clientData && (
                  <span className="text-sm font-normal text-gray-500 ml-2">— {clientData.firstName} {clientData.lastName}</span>
                )}
              </div>
            </DialogTitle>
          </div>
          
          {/* Steps indicator — compact, elegant */}
          <div className="flex items-center justify-center gap-1 px-2 pb-4">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon
              const isCompleted = index < currentStepIndex
              const isCurrent = step.id === currentStep
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (isCompleted) setCurrentStep(step.id as WizardStep)
                    }}
                    disabled={!isCompleted}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                      isCompleted && 'bg-[#7373FF]/10 text-[#7373FF] hover:bg-[#7373FF]/20 cursor-pointer',
                      isCurrent && 'bg-[#7373FF] text-white shadow-sm shadow-[#7373FF]/25',
                      !isCompleted && !isCurrent && 'text-gray-400'
                    )}
                  >
                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : <StepIcon className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      'w-6 h-px mx-0.5',
                      isCompleted ? 'bg-[#7373FF]/40' : 'bg-gray-200'
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/40">
          {isLoading && currentStep === 'COLLECTE' ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#7373FF]/10 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#7373FF]" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">Chargement des données</p>
                <p className="text-sm text-gray-500 mt-1">Récupération du profil, patrimoine et simulations...</p>
              </div>
            </div>
          ) : (
            <>
              {/* ÉTAPE 1: COLLECTE */}
              {currentStep === 'COLLECTE' && clientData && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-[#7373FF]/10 to-transparent p-4 rounded-xl border border-[#7373FF]/20">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <User className="h-5 w-5 text-[#7373FF]" />
                      Données importées automatiquement
                    </h3>
                    <p className="text-sm text-gray-600">
                      Les informations ci-dessous sont extraites de la fiche client et seront incluses dans le bilan.
                    </p>
                  </div>

                  {/* Client Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white border rounded-xl p-5">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <User className="h-4 w-4" /> Identité
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Nom complet</span>
                          <span className="font-medium">{clientData.firstName} {clientData.lastName}</span>
                        </div>
                        {clientData.birthDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Date de naissance</span>
                            <span>{formatDate(clientData.birthDate)}</span>
                          </div>
                        )}
                        {clientData.maritalStatus && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Situation familiale</span>
                            <span>{mapMaritalStatus(clientData.maritalStatus)}</span>
                          </div>
                        )}
                        {clientData.numberOfChildren !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Enfants</span>
                            <span>{clientData.numberOfChildren}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border rounded-xl p-5">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Wallet className="h-4 w-4" /> Situation professionnelle
                      </h4>
                      <div className="space-y-2 text-sm">
                        {clientData.profession && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Profession</span>
                            <span className="font-medium">{clientData.profession}</span>
                          </div>
                        )}
                        {clientData.annualIncome && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Revenus annuels</span>
                            <span className="font-medium text-emerald-600">{formatCurrency(clientData.annualIncome)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cabinet & Conseiller */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white border rounded-xl p-5">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> Cabinet
                      </h4>
                      <div className="space-y-2 text-sm">
                        {cabinetInfo ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Nom</span>
                              <span className="font-medium">{cabinetInfo.name}</span>
                            </div>
                            {cabinetInfo.email && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Email</span>
                                <span className="text-gray-700">{cabinetInfo.email}</span>
                              </div>
                            )}
                            {cabinetInfo.phone && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Téléphone</span>
                                <span className="text-gray-700">{cabinetInfo.phone}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-400 italic">Non renseigné</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border rounded-xl p-5">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <User className="h-4 w-4" /> Conseiller
                      </h4>
                      <div className="space-y-2 text-sm">
                        {clientData.conseiller ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Nom</span>
                              <span className="font-medium">{clientData.conseiller.firstName} {clientData.conseiller.lastName}</span>
                            </div>
                            {clientData.conseiller.email && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Email</span>
                                <span className="text-gray-700">{clientData.conseiller.email}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-400 italic">Aucun conseiller assigné</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Patrimoine Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                      <p className="text-sm text-emerald-600 font-medium">Total Actifs</p>
                      <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalActifs)}</p>
                      <p className="text-xs text-emerald-500 mt-1">{clientData.actifs.length} actifs</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 text-red-600" />
                      <p className="text-sm text-red-600 font-medium">Total Passifs</p>
                      <p className="text-2xl font-bold text-red-700">{formatCurrency(totalPassifs)}</p>
                      <p className="text-xs text-red-500 mt-1">{clientData.passifs.length} crédits</p>
                    </div>
                    <div className="bg-[#7373FF]/10 border border-[#7373FF]/30 rounded-xl p-5 text-center">
                      <Wallet className="h-8 w-8 mx-auto mb-2 text-[#7373FF]" />
                      <p className="text-sm text-[#7373FF] font-medium">Patrimoine Net</p>
                      <p className="text-2xl font-bold text-[#7373FF]">{formatCurrency(patrimoineNet)}</p>
                    </div>
                  </div>

                  {/* Actifs by category */}
                  <div className="bg-white border rounded-xl p-5">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Home className="h-4 w-4" /> Détail des actifs
                    </h4>
                    {Object.keys(actifsByCategory).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(actifsByCategory).map(([category, actifs]) => (
                          <div key={category} className="border-b last:border-0 pb-3 last:pb-0">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">{category}</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(actifs.reduce((s, a) => s + a.value, 0))}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {actifs.map(actif => (
                                <div key={actif.id} className="flex justify-between text-sm pl-4">
                                  <span className="text-gray-500">{actif.name} <span className="text-gray-400 text-xs">({mapType(actif.type)})</span></span>
                                  <span>{formatCurrency(actif.value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Aucun actif renseigné</p>
                    )}
                  </div>

                  {/* Passifs detail */}
                  <div className="bg-white border rounded-xl p-5">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Détail des passifs
                    </h4>
                    {clientData.passifs.length > 0 ? (
                      <div className="space-y-2">
                        {clientData.passifs.map(passif => (
                          <div key={passif.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                            <div>
                              <span className="text-gray-700 font-medium">{passif.name}</span>
                              <span className="text-gray-400 text-xs ml-2">({mapType(passif.type)})</span>
                              {passif.interestRate > 0 && (
                                <span className="text-gray-400 text-xs ml-2">• {passif.interestRate.toFixed(2)}%</span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-red-600 font-semibold">{formatCurrency(passif.remainingAmount)}</span>
                              {passif.monthlyPayment > 0 && (
                                <span className="text-gray-400 text-xs ml-2">({formatCurrency(passif.monthlyPayment)}/mois)</span>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-200">
                          <span className="text-sm font-semibold text-gray-700">Total mensualités</span>
                          <span className="text-sm font-bold text-red-600">{formatCurrency(totalMensualites)}/mois</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Aucun crédit en cours</p>
                    )}
                  </div>
                </div>
              )}

              {/* ÉTAPE 2: AUDIT PATRIMONIAL COMPLET */}
              {currentStep === 'AUDIT' && (
                <div className="space-y-4">
                  {isLoading || !auditData ? (
                    <div className="flex flex-col items-center justify-center h-60 gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-[#7373FF]" />
                      <div className="text-center">
                        <p className="font-medium text-gray-900">Audit patrimonial en cours...</p>
                        <p className="text-sm text-gray-500 mt-1">Appel des calculateurs budget, fiscalité, retraite, emprunt...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Tabs Navigation */}
                      <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
                        {[
                          { id: 'synthese', label: 'Synthèse', icon: BarChart3 },
                          { id: 'budget', label: 'Budget', icon: Wallet },
                          { id: 'emprunt', label: 'Emprunt', icon: Banknote },
                          { id: 'fiscalite', label: 'Fiscalité', icon: Scale },
                          { id: 'immobilier', label: 'Immobilier', icon: Home },
                          { id: 'financier', label: 'Financier', icon: PieChart },
                          { id: 'retraite', label: 'Retraite', icon: Clock },
                          { id: 'succession', label: 'Succession', icon: Users },
                        ].map(tab => (
                          <button key={tab.id} onClick={() => setAuditTab(tab.id)}
                            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                              auditTab === tab.id ? 'bg-[#7373FF] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}>
                            <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* TAB: SYNTHÈSE */}
                      {auditTab === 'synthese' && (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-br from-[#7373FF]/5 to-indigo-50 border border-indigo-200 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-semibold text-gray-900">Score patrimonial global</h4>
                              <div className={cn('text-3xl font-black', auditData.synthese.scoreGlobal >= 70 ? 'text-emerald-600' : auditData.synthese.scoreGlobal >= 45 ? 'text-amber-600' : 'text-red-600')}>
                                {auditData.synthese.scoreGlobal}<span className="text-lg font-medium text-gray-400">/100</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-5">
                              <div className={cn('h-3 rounded-full', auditData.synthese.scoreGlobal >= 70 ? 'bg-emerald-500' : auditData.synthese.scoreGlobal >= 45 ? 'bg-amber-500' : 'bg-red-500')}
                                style={{ width: `${auditData.synthese.scoreGlobal}%` }} />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {auditData.synthese.scores.map(s => (
                                <div key={s.theme} className="bg-white/80 rounded-lg p-3 text-center border">
                                  <p className="text-[10px] text-gray-500 leading-tight mb-1">{s.theme}</p>
                                  <p className="text-lg font-bold" style={{ color: s.couleur }}>{s.score}</p>
                                  <p className="text-[10px] font-medium" style={{ color: s.couleur }}>{s.verdict}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed bg-white border rounded-xl p-4">{auditData.synthese.narratifGlobal}</p>
                          {auditData.synthese.pointsForts.length > 0 && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                              <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Points forts</p>
                              {auditData.synthese.pointsForts.map((p, i) => <p key={i} className="text-sm text-emerald-800 ml-5">• {p}</p>)}
                            </div>
                          )}
                          {auditData.synthese.pointsVigilance.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                              <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Points de vigilance</p>
                              {auditData.synthese.pointsVigilance.map((p, i) => <p key={i} className="text-sm text-amber-800 ml-5">• {p}</p>)}
                            </div>
                          )}
                          {auditData.synthese.actionsPrioritaires.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                              <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1"><ArrowUpRight className="h-3.5 w-3.5" /> Actions prioritaires</p>
                              {auditData.synthese.actionsPrioritaires.map((p, i) => <p key={i} className="text-sm text-red-800 ml-5">• {p}</p>)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB: BUDGET */}
                      {auditTab === 'budget' && (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 bg-white border rounded-xl p-4 leading-relaxed">{auditData.budget.narratif}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-emerald-50 rounded-xl p-4 text-center"><p className="text-xs text-emerald-600">Revenus</p><p className="text-lg font-bold text-emerald-700">{formatCurrency(auditData.budget.revenusMensuels)}<span className="text-xs font-normal">/m</span></p></div>
                            <div className="bg-red-50 rounded-xl p-4 text-center"><p className="text-xs text-red-600">Charges</p><p className="text-lg font-bold text-red-700">{formatCurrency(auditData.budget.chargesMensuelles)}<span className="text-xs font-normal">/m</span></p></div>
                            <div className="bg-blue-50 rounded-xl p-4 text-center"><p className="text-xs text-blue-600">Capacité épargne</p><p className="text-lg font-bold text-blue-700">{formatCurrency(auditData.budget.capaciteEpargneMensuelle)}<span className="text-xs font-normal">/m</span></p></div>
                            <div className={cn('rounded-xl p-4 text-center', auditData.budget.tauxEffort > 50 ? 'bg-red-50' : auditData.budget.tauxEffort > 33 ? 'bg-amber-50' : 'bg-gray-50')}>
                              <p className="text-xs text-gray-600">Taux d&apos;effort</p><p className={cn('text-lg font-bold', auditData.budget.tauxEffort > 50 ? 'text-red-700' : auditData.budget.tauxEffort > 33 ? 'text-amber-700' : 'text-gray-900')}>{auditData.budget.tauxEffort.toFixed(1)}%</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white border rounded-xl p-4"><p className="text-xs text-gray-500 mb-1">Taux d&apos;épargne</p><p className="text-xl font-bold text-gray-900">{auditData.budget.tauxEpargne.toFixed(1)}%</p></div>
                            <div className="bg-white border rounded-xl p-4"><p className="text-xs text-gray-500 mb-1">Reste à vivre</p><p className="text-xl font-bold text-gray-900">{formatCurrency(auditData.budget.resteAVivre)}/m</p></div>
                          </div>
                          {/* Détail des revenus */}
                          {auditData.budget.detailRevenus.length > 0 && (
                            <div className="bg-white border rounded-xl p-4">
                              <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Wallet className="h-4 w-4 text-emerald-500" /> Détail des revenus</h5>
                              <div className="space-y-2">
                                {auditData.budget.detailRevenus.map((r, i) => (
                                  <div key={i} className="flex items-center gap-3">
                                    <div className="flex-1"><div className="flex items-center justify-between mb-1"><span className="text-sm text-gray-700">{r.categorie.replace(/_/g, ' ')}</span><span className="text-sm font-semibold">{formatCurrency(r.montant)}/m</span></div><div className="bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(r.poids, 100)}%` }} /></div></div>
                                    <span className="text-xs text-gray-400 w-12 text-right">{r.poids.toFixed(0)}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Détail des charges */}
                          {auditData.budget.detailCharges.length > 0 && (
                            <div className="bg-white border rounded-xl p-4">
                              <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4 text-red-500" /> Détail des charges</h5>
                              <div className="space-y-2">
                                {auditData.budget.detailCharges.map((c, i) => (
                                  <div key={i} className="flex items-center gap-3">
                                    <div className="flex-1"><div className="flex items-center justify-between mb-1"><span className="text-sm text-gray-700">{c.categorie.replace(/_/g, ' ')}</span><span className="text-sm font-semibold">{formatCurrency(c.montant)}/m</span></div><div className="bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-red-400" style={{ width: `${Math.min(c.poids, 100)}%` }} /></div></div>
                                    <span className="text-xs text-gray-400 w-12 text-right">{c.poids.toFixed(0)}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Répartition idéale 50/30/20 */}
                          {auditData.budget.repartitionIdeale && (
                            <div className="bg-white border rounded-xl p-4">
                              <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><PieChart className="h-4 w-4 text-indigo-500" /> Règle 50/30/20 — Répartition idéale vs réelle</h5>
                              <div className="space-y-3">
                                {auditData.budget.repartitionIdeale.map((r, i) => (
                                  <div key={i}>
                                    <div className="flex items-center justify-between mb-1"><span className="text-xs text-gray-600">{r.categorie}</span><span className="text-xs font-medium">{r.actuel.toFixed(0)}% / {r.recommande}%</span></div>
                                    <div className="flex gap-1 h-2">
                                      <div className="bg-gray-200 rounded-full flex-1 relative overflow-hidden"><div className="absolute inset-y-0 left-0 bg-indigo-400 rounded-full" style={{ width: `${Math.min(r.actuel, 100)}%` }} /><div className="absolute inset-y-0 left-0 border-r-2 border-indigo-800" style={{ left: `${r.recommande}%` }} /></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {auditData.budget.alertes.map((a, i) => <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">{a}</div>)}
                        </div>
                      )}

                      {/* TAB: EMPRUNT */}
                      {auditTab === 'emprunt' && (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 bg-white border rounded-xl p-4 leading-relaxed">{auditData.emprunt.narratif}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className={cn('rounded-xl p-4 text-center', auditData.emprunt.tauxEndettementActuel > 33 ? 'bg-red-50' : 'bg-gray-50')}>
                              <p className="text-xs text-gray-600">Endettement actuel</p><p className={cn('text-xl font-bold', auditData.emprunt.tauxEndettementActuel > 33 ? 'text-red-600' : 'text-gray-900')}>{auditData.emprunt.tauxEndettementActuel.toFixed(1)}%</p><p className="text-[10px] text-gray-400">norme: 33%</p>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-4 text-center"><p className="text-xs text-emerald-600">Capacité résiduelle</p><p className="text-xl font-bold text-emerald-700">{formatCurrency(auditData.emprunt.capaciteEndettementResiduelle)}<span className="text-xs font-normal">/m</span></p></div>
                            <div className="bg-blue-50 rounded-xl p-4 text-center"><p className="text-xs text-blue-600">Mensualité max</p><p className="text-xl font-bold text-blue-700">{formatCurrency(auditData.emprunt.mensualiteMaxSupportable)}<span className="text-xs font-normal">/m</span></p></div>
                          </div>
                          <div className="bg-white border rounded-xl p-4">
                            <h5 className="text-sm font-semibold text-gray-900 mb-3">Enveloppes de financement possibles</h5>
                            <div className="space-y-2">
                              {auditData.emprunt.enveloppes.map((e, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                  <div><span className="font-medium text-gray-900">{e.duree} ans</span><span className="text-xs text-gray-400 ml-2">à {e.tauxInteret}%</span></div>
                                  <span className="text-lg font-bold text-[#7373FF]">{formatCurrency(e.montantMax)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB: FISCALITÉ */}
                      {auditTab === 'fiscalite' && (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 bg-white border rounded-xl p-4 leading-relaxed">{auditData.fiscalite.narratif}</p>
                          {auditData.fiscalite.ir && (
                            <div className="bg-white border rounded-xl p-4 space-y-4">
                              <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><DollarSign className="h-4 w-4 text-amber-500" /> Impôt sur le revenu — Détail du calcul</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-red-50 rounded-lg p-3 text-center"><p className="text-xs text-gray-500">IR total</p><p className="text-lg font-bold text-red-600">{formatCurrency(auditData.fiscalite.ir.impotTotal)}</p></div>
                                <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-xs text-gray-500">TMI</p><p className="text-lg font-bold text-gray-900">{auditData.fiscalite.ir.tmi.toFixed(0)}%</p></div>
                                <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-xs text-gray-500">Taux effectif</p><p className="text-lg font-bold text-gray-900">{(auditData.fiscalite.ir.tauxEffectif * 100).toFixed(1)}%</p></div>
                                <div className="bg-emerald-50 rounded-lg p-3 text-center"><p className="text-xs text-emerald-600">Revenu net</p><p className="text-lg font-bold text-emerald-700">{formatCurrency(auditData.fiscalite.ir.revenuNetApresImpot)}</p></div>
                              </div>
                              {/* Étapes du calcul */}
                              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                                <div className="flex justify-between text-xs"><span className="text-gray-500">Revenu brut global</span><span className="font-medium">{formatCurrency(auditData.fiscalite.ir.revenuBrut)}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-gray-500">− Déductions (10%)</span><span className="font-medium text-red-600">−{formatCurrency(auditData.fiscalite.ir.deductions)}</span></div>
                                <div className="flex justify-between text-xs border-t pt-1"><span className="text-gray-600 font-medium">= Revenu imposable</span><span className="font-bold">{formatCurrency(auditData.fiscalite.ir.revenuImposable)}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-gray-500">÷ Nombre de parts</span><span className="font-medium">{auditData.fiscalite.ir.nombreParts}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-gray-500">= Quotient familial</span><span className="font-medium">{formatCurrency(auditData.fiscalite.ir.quotientFamilial)}</span></div>
                                {auditData.fiscalite.ir.decote > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Décote</span><span className="font-medium text-emerald-600">−{formatCurrency(auditData.fiscalite.ir.decote)}</span></div>}
                                {auditData.fiscalite.ir.cehr > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">CEHR (hauts revenus)</span><span className="font-medium text-red-600">+{formatCurrency(auditData.fiscalite.ir.cehr)}</span></div>}
                              </div>
                              {/* Détail par tranche */}
                              {auditData.fiscalite.ir.tranches.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-700 mb-2">Barème progressif par tranche</p>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead><tr className="border-b"><th className="text-left py-1 text-gray-500 font-medium">Tranche</th><th className="text-right py-1 text-gray-500 font-medium">Base</th><th className="text-right py-1 text-gray-500 font-medium">Impôt</th></tr></thead>
                                      <tbody>
                                        {auditData.fiscalite.ir.tranches.map((t, i) => (
                                          <tr key={i} className="border-b border-gray-100"><td className="py-1.5">{t.taux.toFixed(0)}%</td><td className="text-right font-medium">{formatCurrency(t.base)}</td><td className="text-right font-medium text-red-600">{formatCurrency(t.impot)}</td></tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                              {/* Narratif IR détaillé */}
                              {auditData.fiscalite.ir.narratif && <p className="text-xs text-gray-500 italic leading-relaxed">{auditData.fiscalite.ir.narratif}</p>}
                            </div>
                          )}
                          {/* IFI */}
                          {auditData.fiscalite.ifi?.assujetti && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                              <h5 className="text-sm font-semibold text-amber-800">IFI — Assujetti</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div><p className="text-[10px] text-gray-500">Patrimoine brut</p><p className="text-sm font-bold">{formatCurrency(auditData.fiscalite.ifi.patrimoineImmobilierBrut)}</p></div>
                                <div><p className="text-[10px] text-gray-500">Abattement RP (30%)</p><p className="text-sm font-bold text-emerald-600">−{formatCurrency(auditData.fiscalite.ifi.abattementRP)}</p></div>
                                <div><p className="text-[10px] text-gray-500">Imposable</p><p className="text-sm font-bold">{formatCurrency(auditData.fiscalite.ifi.patrimoineImposable)}</p></div>
                                <div><p className="text-[10px] text-red-500">IFI estimé</p><p className="text-sm font-bold text-red-600">{formatCurrency(auditData.fiscalite.ifi.montantIFI)}</p></div>
                              </div>
                              {auditData.fiscalite.ifi.narratif && <p className="text-xs text-amber-700 italic">{auditData.fiscalite.ifi.narratif}</p>}
                            </div>
                          )}
                          {!auditData.fiscalite.ifi?.assujetti && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                              <h5 className="text-sm font-semibold text-emerald-800 mb-1">IFI — Non assujetti</h5>
                              <p className="text-xs text-emerald-700">{auditData.fiscalite.ifi.narratif}</p>
                            </div>
                          )}
                          {/* Impact revenus fonciers */}
                          {auditData.fiscalite.impactRevenusFonciers && (
                            <div className="bg-white border rounded-xl p-4 space-y-2">
                              <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Home className="h-4 w-4 text-blue-500" /> Fiscalité des revenus fonciers</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div><p className="text-[10px] text-gray-500">Revenus fonciers</p><p className="text-sm font-bold">{formatCurrency(auditData.fiscalite.impactRevenusFonciers.revenusFonciersAnnuels)}/an</p></div>
                                <div><p className="text-[10px] text-gray-500">Régime</p><p className="text-sm font-bold">{auditData.fiscalite.impactRevenusFonciers.regimeFiscal}</p></div>
                                <div><p className="text-[10px] text-gray-500">Taux global</p><p className="text-sm font-bold">{auditData.fiscalite.impactRevenusFonciers.tauxImpositionGlobal.toFixed(1)}%</p></div>
                                <div><p className="text-[10px] text-red-500">Total fiscalité</p><p className="text-sm font-bold text-red-600">{formatCurrency(auditData.fiscalite.impactRevenusFonciers.totalFiscaliteFonciere)}/an</p></div>
                              </div>
                              {auditData.fiscalite.impactRevenusFonciers.narratif && <p className="text-xs text-gray-500 italic">{auditData.fiscalite.impactRevenusFonciers.narratif}</p>}
                            </div>
                          )}
                          {/* Optimisation */}
                          {auditData.fiscalite.optimisation && auditData.fiscalite.optimisation.strategies.length > 0 && (
                            <div className="bg-white border rounded-xl p-4">
                              <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" /> Optimisation fiscale — jusqu&apos;à {formatCurrency(auditData.fiscalite.optimisation.economiesPotentielles)} d&apos;économies</h5>
                              {auditData.fiscalite.optimisation.strategies.map((s, i) => (
                                <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0">
                                  <Badge className={cn('text-[10px] mt-0.5', s.priorite === 'high' ? 'bg-red-100 text-red-700' : s.priorite === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700')}>{s.priorite === 'high' ? 'Prioritaire' : s.priorite === 'medium' ? 'Recommandé' : 'Optionnel'}</Badge>
                                  <div className="flex-1"><p className="text-sm font-medium text-gray-900">{s.nom}</p><p className="text-xs text-gray-500">{s.description}</p></div>
                                  <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">+{formatCurrency(s.economie)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB: IMMOBILIER */}
                      {auditTab === 'immobilier' && (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 bg-white border rounded-xl p-4 leading-relaxed">{auditData.immobilier.narratif}</p>
                          {/* KPIs globaux */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[10px] text-gray-500">Total immobilier</p><p className="text-lg font-bold">{formatCurrency(auditData.immobilier.totalImmobilier)}</p></div>
                            <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[10px] text-gray-500">Net (après crédits)</p><p className="text-lg font-bold">{formatCurrency(auditData.immobilier.patrimoineImmobilierNet)}</p></div>
                            <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[10px] text-gray-500">Cash-flow global</p><p className={cn('text-lg font-bold', auditData.immobilier.cashFlowGlobalMensuel >= 0 ? 'text-emerald-600' : 'text-red-600')}>{auditData.immobilier.cashFlowGlobalMensuel >= 0 ? '+' : ''}{formatCurrency(auditData.immobilier.cashFlowGlobalMensuel)}/m</p></div>
                            <div className={cn('rounded-xl p-3 text-center', auditData.immobilier.concentrationRisque ? 'bg-red-50' : 'bg-gray-50')}><p className="text-[10px] text-gray-500">Poids patrimoine</p><p className={cn('text-lg font-bold', auditData.immobilier.concentrationRisque ? 'text-red-600' : '')}>{auditData.immobilier.poidsPatrimoine.toFixed(0)}%</p></div>
                          </div>
                          {/* Détail par bien */}
                          {auditData.immobilier.biens.map(b => (
                            <div key={b.id} className="bg-white border rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div><span className="font-semibold text-gray-900">{b.nom}</span><Badge variant="outline" className="text-xs ml-2">{mapType(b.type)}</Badge></div>
                                <span className="text-lg font-bold">{formatCurrency(b.valeur)}</span>
                              </div>
                              <div className="flex items-center gap-2"><span className="text-xs text-gray-400">{b.poidsPatrimoine.toFixed(1)}% du patrimoine</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-1.5"><div className={cn('h-1.5 rounded-full', b.poidsPatrimoine > 40 ? 'bg-red-500' : 'bg-emerald-500')} style={{ width: `${Math.min(b.poidsPatrimoine, 100)}%` }} /></div>
                              </div>
                              {/* Métriques locatives */}
                              {b.loyerMensuel && (
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                  <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-[10px] text-gray-500">Loyer</p><p className="text-sm font-bold">{formatCurrency(b.loyerMensuel)}/m</p></div>
                                  <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-[10px] text-gray-500">Rdt brut</p><p className="text-sm font-bold text-blue-600">{b.rendementLocatifBrut?.toFixed(1)}%</p></div>
                                  <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-[10px] text-gray-500">Rdt net</p><p className="text-sm font-bold">{b.rendementLocatifNet?.toFixed(1)}%</p></div>
                                  <div className={cn('rounded-lg p-2 text-center', (b.cashFlowMensuel || 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50')}><p className="text-[10px] text-gray-500">Cash-flow</p><p className={cn('text-sm font-bold', (b.cashFlowMensuel || 0) >= 0 ? 'text-emerald-600' : 'text-red-600')}>{formatCurrency(b.cashFlowMensuel || 0)}/m</p></div>
                                  {b.tri && <div className="bg-indigo-50 rounded-lg p-2 text-center"><p className="text-[10px] text-gray-500">TRI 20 ans</p><p className="text-sm font-bold text-indigo-700">{b.tri.toFixed(1)}%</p></div>}
                                </div>
                              )}
                              {/* Scénarios revente multi-horizons */}
                              {b.scenarioRevente && b.scenarioRevente.horizons.length > 1 && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-[10px] font-semibold text-gray-600 mb-2">Scénarios de revente (+2%/an)</p>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-[10px]">
                                      <thead><tr className="border-b"><th className="text-left py-0.5 text-gray-400">Horizon</th><th className="text-right py-0.5 text-gray-400">Prix</th><th className="text-right py-0.5 text-gray-400">PV brute</th><th className="text-right py-0.5 text-gray-400">Fiscalité</th><th className="text-right py-0.5 text-gray-400">Net vendeur</th><th className="text-right py-0.5 text-gray-400">Gain net</th></tr></thead>
                                      <tbody>
                                        {b.scenarioRevente.horizons.map((h, i) => (
                                          <tr key={i} className="border-b border-gray-100">
                                            <td className="py-1">{h.annees} ans</td>
                                            <td className="text-right">{formatCurrency(h.prixEstime)}</td>
                                            <td className="text-right text-emerald-600">+{formatCurrency(h.plusValueBrute)}</td>
                                            <td className="text-right text-red-600">{formatCurrency(h.totalFiscalite)}</td>
                                            <td className="text-right font-medium">{formatCurrency(h.netVendeur)}</td>
                                            <td className={cn('text-right font-medium', h.gainNetTotal >= 0 ? 'text-emerald-600' : 'text-red-600')}>{h.gainNetTotal >= 0 ? '+' : ''}{formatCurrency(h.gainNetTotal)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-1 italic">{b.scenarioRevente.narratif}</p>
                                </div>
                              )}
                              {/* Fiscalité locative */}
                              {b.fiscaliteLocative && (
                                <div className="bg-amber-50 rounded-lg p-2 grid grid-cols-3 gap-2 text-center">
                                  <div><p className="text-[10px] text-gray-500">Régime</p><p className="text-xs font-bold">{b.fiscaliteLocative.regimeFiscal}</p></div>
                                  <div><p className="text-[10px] text-gray-500">Taux global</p><p className="text-xs font-bold">{b.fiscaliteLocative.tauxImpositionGlobal.toFixed(0)}%</p></div>
                                  <div><p className="text-[10px] text-red-500">Fiscal/an</p><p className="text-xs font-bold text-red-600">{formatCurrency(b.fiscaliteLocative.totalAnnuel)}</p></div>
                                </div>
                              )}
                              <p className="text-xs text-gray-500 italic">{b.analyse}</p>
                            </div>
                          ))}
                          {auditData.immobilier.biens.length === 0 && <p className="text-sm text-gray-400 italic text-center py-8">Aucun bien immobilier détenu</p>}
                        </div>
                      )}

                      {/* TAB: FINANCIER */}
                      {auditTab === 'financier' && (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 bg-white border rounded-xl p-4 leading-relaxed">{auditData.financier.narratif}</p>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white border rounded-xl p-4 text-center"><p className="text-xs text-gray-500">Total financier</p><p className="text-lg font-bold">{formatCurrency(auditData.financier.totalFinancier)}</p></div>
                            <div className="bg-white border rounded-xl p-4 text-center"><p className="text-xs text-gray-500">Diversification</p><p className="text-lg font-bold" style={{ color: auditData.financier.scoreDiversification >= 70 ? '#10b981' : '#f59e0b' }}>{auditData.financier.scoreDiversification}/100</p></div>
                            <div className="bg-white border rounded-xl p-4 text-center"><p className="text-xs text-gray-500">Risque</p><p className="text-lg font-bold" style={{ color: auditData.financier.scoreRisque > 50 ? '#ef4444' : '#10b981' }}>{auditData.financier.scoreRisque}/100</p></div>
                          </div>
                          {/* Allocation par risque */}
                          {auditData.financier.allocationParRisque.length > 0 && (
                            <div className="bg-white border rounded-xl p-4">
                              <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-indigo-500" /> Allocation par niveau de risque</h5>
                              <div className="space-y-2">
                                {auditData.financier.allocationParRisque.map((r, i) => (
                                  <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-600 w-16">{r.risque}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                                      <div className={cn('h-3 rounded-full', r.risque === 'Faible' ? 'bg-emerald-400' : r.risque === 'Modéré' ? 'bg-amber-400' : 'bg-red-400')} style={{ width: `${Math.min(r.poids, 100)}%` }} />
                                    </div>
                                    <span className="text-xs font-semibold w-20 text-right">{formatCurrency(r.valeur)} ({r.poids.toFixed(0)}%)</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Allocation par liquidité */}
                          {auditData.financier.allocationParLiquidite.length > 0 && (
                            <div className="bg-white border rounded-xl p-4">
                              <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" /> Allocation par liquidité</h5>
                              <div className="space-y-2">
                                {auditData.financier.allocationParLiquidite.map((l, i) => (
                                  <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-600 w-16">{l.liquidite}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                                      <div className={cn('h-3 rounded-full', l.liquidite === 'Immédiate' ? 'bg-blue-400' : l.liquidite === 'Moyenne' ? 'bg-indigo-400' : 'bg-gray-400')} style={{ width: `${Math.min(l.poids, 100)}%` }} />
                                    </div>
                                    <span className="text-xs font-semibold w-20 text-right">{formatCurrency(l.valeur)} ({l.poids.toFixed(0)}%)</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Recommandation allocation cible */}
                          {auditData.financier.recommandationAllocation.length > 0 && (
                            <div className="bg-white border rounded-xl p-4">
                              <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-amber-500" /> Allocation recommandée vs actuelle</h5>
                              <div className="space-y-3">
                                {auditData.financier.recommandationAllocation.map((r, i) => (
                                  <div key={i}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-600">{r.categorie}</span>
                                      <span className={cn('text-xs font-medium', r.ecart > 10 ? 'text-red-600' : r.ecart < -10 ? 'text-amber-600' : 'text-emerald-600')}>{r.actuel}% / cible {r.cible}% ({r.ecart > 0 ? '+' : ''}{r.ecart}%)</span>
                                    </div>
                                    <div className="flex gap-0.5 h-2">
                                      <div className="bg-gray-200 rounded-full flex-1 relative overflow-hidden">
                                        <div className={cn('absolute inset-y-0 left-0 rounded-full', r.ecart > 10 ? 'bg-red-400' : r.ecart < -10 ? 'bg-amber-400' : 'bg-emerald-400')} style={{ width: `${Math.min(r.actuel, 100)}%` }} />
                                        <div className="absolute inset-y-0 border-r-2 border-gray-700" style={{ left: `${r.cible}%` }} />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Détail actifs */}
                          {auditData.financier.actifs.map(a => (
                            <div key={a.id} className="bg-white border rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between"><span className="font-medium text-sm">{a.nom}</span><div className="text-right"><span className="font-bold">{formatCurrency(a.valeur)}</span><span className="text-xs text-gray-400 ml-1">({a.poidsPortefeuille.toFixed(0)}%)</span></div></div>
                              <div className="flex gap-2 flex-wrap">
                                <Badge className={cn('text-[10px]', a.risque === 'faible' ? 'bg-emerald-50 text-emerald-700' : a.risque === 'eleve' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}>Risque: {a.risque}</Badge>
                                <Badge className={cn('text-[10px]', a.liquidite === 'immediate' ? 'bg-blue-50 text-blue-700' : a.liquidite === 'faible' ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-600')}>Liquidité: {a.liquidite}</Badge>
                                <Badge className="text-[10px] bg-indigo-50 text-indigo-700">{a.enveloppeFiscale.split('(')[0].trim()}</Badge>
                              </div>
                              <p className="text-xs text-gray-500 italic">{a.commentaire}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* TAB: RETRAITE */}
                      {auditTab === 'retraite' && (
                        <div className="space-y-4">
                          {auditData.retraite ? (
                            <>
                              <p className="text-sm text-gray-600 bg-white border rounded-xl p-4 leading-relaxed">{auditData.retraite.narratif}</p>
                              {/* Estimation pension */}
                              <div className="bg-white border rounded-xl p-4 space-y-3">
                                <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Banknote className="h-4 w-4 text-indigo-500" /> Estimation de votre pension</h5>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div className="bg-indigo-50 rounded-lg p-3 text-center"><p className="text-[10px] text-gray-500">Pension totale</p><p className="text-lg font-bold text-indigo-700">{formatCurrency(auditData.retraite.estimationPension.pensionTotaleMensuelle)}<span className="text-xs font-normal">/m</span></p></div>
                                  <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-[10px] text-gray-500">Base CNAV</p><p className="text-sm font-bold">{formatCurrency(auditData.retraite.estimationPension.pensionBaseMensuelle)}</p></div>
                                  <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-[10px] text-gray-500">Complémentaire</p><p className="text-sm font-bold">{formatCurrency(auditData.retraite.estimationPension.pensionComplementaireMensuelle)}</p></div>
                                  <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-[10px] text-gray-500">Taux remplacement</p><p className="text-sm font-bold">{auditData.retraite.estimationPension.tauxRemplacement.toFixed(0)}%</p></div>
                                </div>
                                {/* Trimestres */}
                                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                                  <div className="flex justify-between text-xs"><span className="text-gray-500">Trimestres validés</span><span className="font-medium">{auditData.retraite.estimationPension.trimestresValides}</span></div>
                                  <div className="flex justify-between text-xs"><span className="text-gray-500">Trimestres futurs estimés</span><span className="font-medium">+{auditData.retraite.estimationPension.trimestresRestants}</span></div>
                                  <div className="flex justify-between text-xs border-t pt-1"><span className="text-gray-600 font-medium">Total / Requis</span><span className="font-bold">{auditData.retraite.estimationPension.trimestresValides + auditData.retraite.estimationPension.trimestresRestants} / {auditData.retraite.estimationPension.trimestresRequis}</span></div>
                                  {auditData.retraite.estimationPension.trimestresManquants > 0 && <div className="flex justify-between text-xs"><span className="text-red-600">Trimestres manquants</span><span className="font-bold text-red-600">{auditData.retraite.estimationPension.trimestresManquants}</span></div>}
                                  <div className="flex justify-between text-xs"><span className="text-gray-500">Décote / Surcote</span><span className={cn('font-medium', auditData.retraite.estimationPension.decoteSurcote < 0 ? 'text-red-600' : 'text-emerald-600')}>{auditData.retraite.estimationPension.decoteSurcoteLabel}</span></div>
                                  <div className="flex justify-between text-xs"><span className="text-gray-500">Points AGIRC-ARRCO</span><span className="font-medium">{auditData.retraite.estimationPension.pointsComplementaires.toLocaleString()} × {auditData.retraite.estimationPension.valeurPoint}€</span></div>
                                </div>
                              </div>
                              {/* Gap analysis */}
                              <div className={cn('border rounded-xl p-4 space-y-2', auditData.retraite.analyseGap.gapMensuel > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200')}>
                                <h5 className={cn('text-sm font-semibold', auditData.retraite.analyseGap.gapMensuel > 0 ? 'text-red-800' : 'text-emerald-800')}>Analyse du gap retraite</h5>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  <div><p className="text-[10px] text-gray-500">Revenu souhaité (70%)</p><p className="text-sm font-bold">{formatCurrency(auditData.retraite.analyseGap.revenuSouhaite)}/m</p></div>
                                  <div><p className="text-[10px] text-gray-500">Pension estimée</p><p className="text-sm font-bold">{formatCurrency(auditData.retraite.analyseGap.pensionEstimee)}/m</p></div>
                                  <div><p className="text-[10px] text-gray-500">Gap mensuel</p><p className={cn('text-sm font-bold', auditData.retraite.analyseGap.gapMensuel > 0 ? 'text-red-600' : 'text-emerald-600')}>{auditData.retraite.analyseGap.gapMensuel > 0 ? formatCurrency(auditData.retraite.analyseGap.gapMensuel) : 'Aucun'}</p></div>
                                  {auditData.retraite.analyseGap.capitalNecessaire4Pct > 0 && <div><p className="text-[10px] text-gray-500">Capital nécessaire (4%)</p><p className="text-sm font-bold text-amber-700">{formatCurrency(auditData.retraite.analyseGap.capitalNecessaire4Pct)}</p></div>}
                                </div>
                                <p className="text-xs text-gray-600 italic">{auditData.retraite.analyseGap.narratif}</p>
                              </div>
                              {/* Évolution par âge de départ */}
                              {auditData.retraite.evolutionParAge.length > 0 && (
                                <div className="bg-white border rounded-xl p-4">
                                  <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-blue-500" /> Évolution de la pension selon l&apos;âge de départ</h5>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead><tr className="border-b"><th className="text-left py-1 text-gray-500">Âge</th><th className="text-right py-1 text-gray-500">Trim.</th><th className="text-right py-1 text-gray-500">Décote</th><th className="text-right py-1 text-gray-500">Pension</th><th className="text-right py-1 text-gray-500">Taux</th><th className="text-right py-1 text-gray-500">Diff.</th></tr></thead>
                                      <tbody>
                                        {auditData.retraite.evolutionParAge.map((e, i) => (
                                          <tr key={i} className={cn('border-b border-gray-100', e.estChoisi && 'bg-indigo-50 font-medium', e.estOptimal && 'bg-emerald-50')}>
                                            <td className="py-1.5">{e.age} ans {e.estChoisi ? '✓' : ''}{e.estOptimal ? '⭐' : ''}</td>
                                            <td className="text-right">{e.trimestres}{e.trimestresManquants > 0 ? <span className="text-red-500 ml-0.5">({-e.trimestresManquants})</span> : ''}</td>
                                            <td className={cn('text-right', e.decoteSurcotePct < 0 ? 'text-red-600' : e.decoteSurcotePct > 0 ? 'text-emerald-600' : '')}>{e.decoteSurcoteLabel}</td>
                                            <td className="text-right font-medium">{formatCurrency(e.pensionMensuelle)}</td>
                                            <td className="text-right">{e.tauxRemplacement.toFixed(0)}%</td>
                                            <td className={cn('text-right', e.differenceVsChoisi > 0 ? 'text-emerald-600' : e.differenceVsChoisi < 0 ? 'text-red-600' : '')}>{e.differenceVsChoisi > 0 ? '+' : ''}{e.differenceVsChoisi !== 0 ? formatCurrency(e.differenceVsChoisi) : '—'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-2">✓ = âge choisi | ⭐ = âge optimal (taux plein)</p>
                                </div>
                              )}
                              {/* 3 Scénarios projections */}
                              <div className="grid grid-cols-3 gap-3">
                                {auditData.retraite.scenarios.map(sc => (
                                  <div key={sc.label} className={cn('border rounded-xl p-4 text-center', sc.faisable ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200')}>
                                    <p className="text-xs font-semibold text-gray-700 mb-2">{sc.label}</p>
                                    <p className="text-[10px] text-gray-400">Rendement {sc.rendement}% • Départ {sc.ageDepart} ans</p>
                                    <p className="text-lg font-bold mt-2">{formatCurrency(sc.capitalRetraite)}</p>
                                    <p className="text-xs text-gray-500">capital à la retraite</p>
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <p className={cn('text-sm font-bold', sc.faisable ? 'text-emerald-700' : 'text-red-600')}>{formatCurrency(sc.revenuDurable)}/m</p>
                                      <p className="text-[10px] text-gray-400">revenu durable</p>
                                    </div>
                                    {sc.gapMensuel > 0 && <p className="text-xs text-red-600 mt-1 font-medium">Gap: {formatCurrency(sc.gapMensuel)}/m</p>}
                                    {sc.capitalEpuiseAge && <p className="text-[10px] text-red-500 mt-1">Capital épuisé à {sc.capitalEpuiseAge} ans</p>}
                                  </div>
                                ))}
                              </div>
                              {/* Épargne retraite dédiée */}
                              {auditData.retraite.detailEpargneRetraite.length > 0 && (
                                <div className="bg-white border rounded-xl p-4">
                                  <h5 className="text-xs font-semibold text-gray-700 mb-2">Épargne retraite dédiée — {formatCurrency(auditData.retraite.epargneRetraiteActuelle)}</h5>
                                  <div className="space-y-1">
                                    {auditData.retraite.detailEpargneRetraite.map((d, i) => (
                                      <div key={i} className="flex items-center justify-between text-xs"><span className="text-gray-600">{d.support}</span><span className="font-medium">{formatCurrency(d.montant)}</span></div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {auditData.retraite.recommandations.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                  <p className="text-xs font-semibold text-blue-700 mb-2">Recommandations retraite</p>
                                  {auditData.retraite.recommandations.map((r, i) => <p key={i} className="text-sm text-blue-800 ml-2">• {r.description}</p>)}
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-gray-400 italic text-center py-8">Données insuffisantes pour la projection retraite</p>
                          )}
                        </div>
                      )}

                      {/* TAB: SUCCESSION */}
                      {auditTab === 'succession' && (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 bg-white border rounded-xl p-4 leading-relaxed">{auditData.succession.narratif}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[10px] text-gray-500">Patrimoine net</p><p className="text-lg font-bold">{formatCurrency(auditData.succession.patrimoineNetTaxable)}</p></div>
                            <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[10px] text-gray-500">Héritiers</p><p className="text-lg font-bold">{auditData.succession.nbEnfants || 1}</p></div>
                            <div className="bg-emerald-50 rounded-xl p-3 text-center"><p className="text-[10px] text-gray-500">Abattements</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(auditData.succession.abattementTotal)}</p></div>
                            <div className="bg-red-50 rounded-xl p-3 text-center"><p className="text-[10px] text-red-500">Droits estimés</p><p className="text-lg font-bold text-red-600">{formatCurrency(auditData.succession.droitsEstimes)}</p></div>
                            <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[10px] text-gray-500">Taux effectif</p><p className="text-lg font-bold">{auditData.succession.tauxEffectif.toFixed(1)}%</p></div>
                          </div>
                          {/* Détail par héritier avec tranches DMTG */}
                          {auditData.succession.detailParHeritier.length > 0 && (
                            <div className="bg-white border rounded-xl p-4 space-y-3">
                              <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Users className="h-4 w-4 text-indigo-500" /> Détail par héritier</h5>
                              {auditData.succession.detailParHeritier.map((h, i) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-800">{h.lien}</span>
                                    <span className="text-sm font-bold text-red-600">Droits : {formatCurrency(h.droits)}</span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2 text-center">
                                    <div><p className="text-[10px] text-gray-400">Part brute</p><p className="text-xs font-medium">{formatCurrency(h.partBrute)}</p></div>
                                    <div><p className="text-[10px] text-gray-400">Abattement</p><p className="text-xs font-medium text-emerald-600">−{formatCurrency(h.abattement)}</p></div>
                                    <div><p className="text-[10px] text-gray-400">Taxable</p><p className="text-xs font-medium">{formatCurrency(h.taxable)}</p></div>
                                    <div><p className="text-[10px] text-gray-400">Taux effectif</p><p className="text-xs font-medium">{h.tauxEffectif.toFixed(1)}%</p></div>
                                  </div>
                                  {/* Tranches DMTG */}
                                  {h.tranches.length > 0 && (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-[10px]">
                                        <thead><tr className="border-b"><th className="text-left py-0.5 text-gray-400">Taux</th><th className="text-right py-0.5 text-gray-400">Base taxable</th><th className="text-right py-0.5 text-gray-400">Droits</th></tr></thead>
                                        <tbody>
                                          {h.tranches.map((t, j) => (
                                            <tr key={j} className="border-b border-gray-100"><td className="py-0.5">{t.taux.toFixed(0)}%</td><td className="text-right">{formatCurrency(t.base)}</td><td className="text-right text-red-600">{formatCurrency(t.impot)}</td></tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Assurance-vie enrichi */}
                          {auditData.succession.impactAssuranceVie && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
                              <h5 className="text-sm font-semibold text-indigo-800 flex items-center gap-2"><Shield className="h-4 w-4" /> Impact Assurance-Vie</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div><p className="text-[10px] text-gray-500">Total AV</p><p className="text-sm font-bold">{formatCurrency(auditData.succession.impactAssuranceVie.totalAV)}</p></div>
                                <div><p className="text-[10px] text-gray-500">Avant 70 ans (990 I)</p><p className="text-sm font-bold">{formatCurrency(auditData.succession.impactAssuranceVie.versementsAvant70)}</p></div>
                                <div><p className="text-[10px] text-gray-500">Après 70 ans (757 B)</p><p className="text-sm font-bold">{formatCurrency(auditData.succession.impactAssuranceVie.versementsApres70)}</p></div>
                                <div><p className="text-[10px] text-emerald-600">Économie vs DMTG</p><p className="text-sm font-bold text-emerald-700">{formatCurrency(auditData.succession.impactAssuranceVie.economieVsDMTG)}</p></div>
                              </div>
                              <div className="bg-white/50 rounded-lg p-2 grid grid-cols-3 gap-2 text-center">
                                <div><p className="text-[10px] text-gray-500">Abatt. 990 I</p><p className="text-xs font-bold text-emerald-600">{formatCurrency(auditData.succession.impactAssuranceVie.abattement990I)}</p></div>
                                <div><p className="text-[10px] text-gray-500">Droits 990 I</p><p className="text-xs font-bold text-red-600">{formatCurrency(auditData.succession.impactAssuranceVie.droits990I)}</p></div>
                                <div><p className="text-[10px] text-gray-500">Droits 757 B</p><p className="text-xs font-bold text-red-600">{formatCurrency(auditData.succession.impactAssuranceVie.droits757B)}</p></div>
                              </div>
                              {auditData.succession.impactAssuranceVie.narratif && <p className="text-xs text-indigo-700 italic">{auditData.succession.impactAssuranceVie.narratif}</p>}
                            </div>
                          )}
                          {/* Stratégies d'optimisation */}
                          {auditData.succession.strategiesOptimisation.length > 0 && (
                            <div className="bg-white border rounded-xl p-4">
                              <h5 className="text-sm font-semibold text-gray-900 mb-3">Stratégies d&apos;optimisation</h5>
                              {auditData.succession.strategiesOptimisation.map((s, i) => (
                                <div key={i} className="py-3 border-b last:border-0 space-y-1">
                                  <div className="flex items-start gap-3">
                                    <Badge className={cn('text-[10px] mt-0.5', s.priorite === 'haute' ? 'bg-red-100 text-red-700' : s.priorite === 'moyenne' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700')}>{s.priorite}</Badge>
                                    <div className="flex-1"><p className="text-sm font-medium text-gray-900">{s.strategie}</p><p className="text-xs text-gray-500">{s.description}</p></div>
                                    {s.economieEstimee > 0 && <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">~{formatCurrency(s.economieEstimee)}</span>}
                                  </div>
                                  <p className="text-xs text-gray-400 ml-8 italic">{s.detailMiseEnOeuvre}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ÉTAPE 3: ANALYSE — Météo patrimoniale & études détaillées */}
              {currentStep === 'ANALYSE' && (() => {
                if (!auditData) {
                  return (
                    <div className="flex flex-col items-center justify-center h-60 gap-4">
                      <AlertTriangle className="h-10 w-10 text-amber-400" />
                      <p className="text-sm text-gray-600">L&apos;audit patrimonial n&apos;a pas encore été généré. Revenez à l&apos;étape précédente.</p>
                    </div>
                  )
                }

                const ad = auditData

                // ── Constats agrégés depuis tous les domaines ──
                interface Constat { type: 'alerte' | 'vigilance' | 'opportunite' | 'positif'; theme: string; message: string; impact?: number }
                const constats: Constat[] = []

                // Budget
                ad.budget.alertes.forEach(a => constats.push({ type: 'alerte', theme: 'Budget', message: a }))
                if (ad.budget.scoreSante === 'excellent') constats.push({ type: 'positif', theme: 'Budget', message: `Taux d'épargne de ${ad.budget.tauxEpargne.toFixed(1)}% — budget maîtrisé` })
                else if (ad.budget.scoreSante === 'attention' || ad.budget.scoreSante === 'critique') constats.push({ type: 'vigilance', theme: 'Budget', message: `Taux d'épargne de ${ad.budget.tauxEpargne.toFixed(1)}% — capacité d'épargne insuffisante` })
                if (ad.budget.capaciteEpargneMensuelle > 500) constats.push({ type: 'opportunite', theme: 'Budget', message: `${formatCurrency(ad.budget.capaciteEpargneMensuelle)}/mois de capacité d'épargne à orienter`, impact: ad.budget.capaciteEpargneAnnuelle })

                // Emprunt
                if (ad.emprunt.tauxEndettementActuel > 33) constats.push({ type: 'alerte', theme: 'Endettement', message: `Taux d'endettement à ${ad.emprunt.tauxEndettementActuel.toFixed(1)}% — au-delà du seuil HCSF 35%` })
                else if (ad.emprunt.tauxEndettementActuel < 20) constats.push({ type: 'positif', theme: 'Endettement', message: `Taux d'endettement maîtrisé à ${ad.emprunt.tauxEndettementActuel.toFixed(1)}%` })
                if (ad.emprunt.capaciteEndettementResiduelle > 0) constats.push({ type: 'opportunite', theme: 'Emprunt', message: `Capacité d'emprunt résiduelle de ${formatCurrency(ad.emprunt.capaciteEndettementResiduelle)}/mois`, impact: ad.emprunt.enveloppes[1]?.montantMax || 0 })

                // Fiscalité
                if (ad.fiscalite.ir) {
                  constats.push({ type: ad.fiscalite.ir.tmi >= 30 ? 'vigilance' : 'positif', theme: 'Fiscalité', message: `TMI à ${ad.fiscalite.ir.tmi.toFixed(0)}% — IR estimé ${formatCurrency(ad.fiscalite.ir.impotTotal)}` })
                }
                if (ad.fiscalite.ifi.assujetti) constats.push({ type: 'vigilance', theme: 'IFI', message: `Assujetti IFI — ${formatCurrency(ad.fiscalite.ifi.montantIFI)} estimé` })
                else constats.push({ type: 'positif', theme: 'IFI', message: 'Non assujetti à l\'IFI' })
                ad.fiscalite.optimisation?.strategies.filter(s => s.priorite === 'high').forEach(s => constats.push({ type: 'opportunite', theme: 'Fiscalité', message: `${s.nom} — économie estimée ${formatCurrency(s.economie)}/an`, impact: s.economie }))
                if (ad.fiscalite.optimisation && ad.fiscalite.optimisation.economiesPotentielles > 500) constats.push({ type: 'opportunite', theme: 'Fiscalité', message: `Total optimisation fiscale identifiée : ${formatCurrency(ad.fiscalite.optimisation.economiesPotentielles)}/an`, impact: ad.fiscalite.optimisation.economiesPotentielles })
                if (ad.fiscalite.impactRevenusFonciers) constats.push({ type: 'vigilance', theme: 'Fiscalité', message: `Fiscalité foncière de ${formatCurrency(ad.fiscalite.impactRevenusFonciers.totalFiscaliteFonciere)}/an (TMI+PS ${ad.fiscalite.impactRevenusFonciers.tauxImpositionGlobal.toFixed(0)}%)` })

                // Épargne de précaution
                if (ad.epargnePrecaution.gap > 0) constats.push({ type: ad.epargnePrecaution.priorite === 'critical' ? 'alerte' : 'vigilance', theme: 'Épargne', message: `Gap épargne de précaution de ${formatCurrency(ad.epargnePrecaution.gap)} — ${ad.epargnePrecaution.moisCouverts.toFixed(1)} mois couverts vs 6 recommandés` })
                else constats.push({ type: 'positif', theme: 'Épargne', message: `Épargne de précaution constituée — ${ad.epargnePrecaution.moisCouverts.toFixed(1)} mois couverts` })

                // Immobilier
                if (ad.immobilier.concentrationRisque) constats.push({ type: 'vigilance', theme: 'Immobilier', message: `Concentration immobilière élevée (${ad.immobilier.poidsPatrimoine.toFixed(0)}% du patrimoine) — risque de liquidité` })
                if (ad.immobilier.cashFlowGlobalMensuel < 0) constats.push({ type: 'vigilance', theme: 'Immobilier', message: `Effort de trésorerie immobilier : ${formatCurrency(Math.abs(ad.immobilier.cashFlowGlobalMensuel))}/mois` })
                else if (ad.immobilier.cashFlowGlobalMensuel > 0) constats.push({ type: 'positif', theme: 'Immobilier', message: `Cash-flow immobilier positif : +${formatCurrency(ad.immobilier.cashFlowGlobalMensuel)}/mois` })
                ad.immobilier.biens.filter(b => b.rendementLocatifBrut !== null && b.rendementLocatifBrut < 3).forEach(b => constats.push({ type: 'vigilance', theme: 'Immobilier', message: `${b.nom} : rendement brut faible (${b.rendementLocatifBrut?.toFixed(1)}%)` }))

                // Financier
                if (ad.financier.scoreDiversification < 40) constats.push({ type: 'vigilance', theme: 'Financier', message: `Diversification insuffisante (score ${ad.financier.scoreDiversification}/100) — concentration excessive` })
                else if (ad.financier.scoreDiversification >= 70) constats.push({ type: 'positif', theme: 'Financier', message: `Patrimoine financier bien diversifié (score ${ad.financier.scoreDiversification}/100)` })

                // Retraite
                if (ad.retraite) {
                  if (ad.retraite.analyseGap.gapMensuel > 0) constats.push({ type: 'alerte', theme: 'Retraite', message: `Gap de revenus retraite de ${formatCurrency(ad.retraite.analyseGap.gapMensuel)}/mois — capital nécessaire ${formatCurrency(ad.retraite.analyseGap.capitalNecessaire4Pct)}` })
                  else constats.push({ type: 'positif', theme: 'Retraite', message: `Revenus retraite estimés suffisants — pension ${formatCurrency(ad.retraite.estimationPension.pensionTotaleMensuelle)}/mois` })
                  if (ad.retraite.estimationPension.trimestresManquants > 0) constats.push({ type: 'vigilance', theme: 'Retraite', message: `${ad.retraite.estimationPension.trimestresManquants} trimestres manquants — décote de ${ad.retraite.estimationPension.decoteSurcote.toFixed(1)}%` })
                }

                // Succession
                if (ad.succession.droitsEstimes > 0) constats.push({ type: 'vigilance', theme: 'Transmission', message: `Droits de succession estimés à ${formatCurrency(ad.succession.droitsEstimes)} (taux effectif ${ad.succession.tauxEffectif.toFixed(1)}%)` })
                ad.succession.strategiesOptimisation.filter(s => s.priorite === 'haute').forEach(s => constats.push({ type: 'opportunite', theme: 'Transmission', message: `${s.strategie} — économie estimée ${formatCurrency(s.economieEstimee)}`, impact: s.economieEstimee }))
                if (ad.succession.impactAssuranceVie && ad.succession.impactAssuranceVie.economieVsDMTG > 0) constats.push({ type: 'positif', theme: 'Transmission', message: `Assurance-vie : économie de ${formatCurrency(ad.succession.impactAssuranceVie.economieVsDMTG)} vs DMTG classique` })

                constats.sort((a, b) => {
                  const order = { alerte: 0, vigilance: 1, opportunite: 2, positif: 3 }
                  return order[a.type] - order[b.type]
                })

                // ── Études détaillées ──
                const ETUDES = [
                  { id: 'budget', label: 'Budget & Trésorerie', icon: Wallet, bg: 'bg-emerald-50', ic: 'text-emerald-600',
                    scoreKey: 'Budget & Épargne',
                    narratif: ad.budget.narratif,
                    metrics: [
                      { k: 'rev', l: 'Revenus mensuels', v: ad.budget.revenusMensuels },
                      { k: 'chg', l: 'Charges mensuelles', v: ad.budget.chargesMensuelles },
                      { k: 'rav', l: 'Reste à vivre', v: ad.budget.resteAVivre, c: ad.budget.resteAVivre >= 0 ? 'text-emerald-600' : 'text-red-600' },
                      { k: 'txe', l: 'Taux d\'épargne', v: `${ad.budget.tauxEpargne.toFixed(1)}%`, c: ad.budget.tauxEpargne >= 20 ? 'text-emerald-600' : 'text-amber-600' },
                      { k: 'eff', l: 'Taux d\'effort', v: `${ad.budget.tauxEffort.toFixed(1)}%`, c: ad.budget.tauxEffort > 50 ? 'text-red-600' : 'text-gray-900' },
                      { k: 'cap', l: 'Capacité épargne', v: ad.budget.capaciteEpargneMensuelle, c: 'text-blue-600' },
                    ],
                    recos: ad.budget.recommandations,
                  },
                  { id: 'emprunt', label: 'Capacité d\'emprunt', icon: CreditCard, bg: 'bg-sky-50', ic: 'text-sky-600',
                    scoreKey: 'Capacité d\'emprunt',
                    narratif: ad.emprunt.narratif,
                    metrics: [
                      { k: 'txend', l: 'Taux endettement', v: `${ad.emprunt.tauxEndettementActuel.toFixed(1)}%`, c: ad.emprunt.tauxEndettementActuel > 33 ? 'text-red-600' : 'text-emerald-600' },
                      { k: 'capres', l: 'Capacité résiduelle', v: ad.emprunt.capaciteEndettementResiduelle },
                      { k: 'mensmax', l: 'Mensualité max HCSF', v: ad.emprunt.mensualiteMaxSupportable },
                      ...ad.emprunt.enveloppes.map((e, i) => ({ k: `env${i}`, l: `Emprunt ${e.duree} ans (${e.tauxInteret}%)`, v: e.montantMax, c: 'text-blue-600' as string })),
                    ],
                    recos: ad.emprunt.recommandations,
                  },
                  { id: 'fiscalite', label: 'Fiscalité', icon: Landmark, bg: 'bg-amber-50', ic: 'text-amber-600',
                    scoreKey: 'Fiscalité',
                    narratif: ad.fiscalite.narratif,
                    metrics: [
                      ...(ad.fiscalite.ir ? [
                        { k: 'ir', l: 'IR total', v: ad.fiscalite.ir.impotTotal, c: 'text-red-600' },
                        { k: 'tmi', l: 'TMI', v: `${ad.fiscalite.ir.tmi.toFixed(0)}%` },
                        { k: 'txeff', l: 'Taux effectif', v: `${(ad.fiscalite.ir.tauxEffectif * 100).toFixed(1)}%` },
                        { k: 'revnet', l: 'Revenu net après IR', v: ad.fiscalite.ir.revenuNetApresImpot, c: 'text-emerald-600' },
                      ] : []),
                      { k: 'ifi', l: 'IFI', v: ad.fiscalite.ifi.assujetti ? ad.fiscalite.ifi.montantIFI : 'Non assujetti', c: ad.fiscalite.ifi.assujetti ? 'text-red-600' : 'text-emerald-600' },
                      ...(ad.fiscalite.optimisation ? [{ k: 'eco', l: 'Économies identifiées', v: ad.fiscalite.optimisation.economiesPotentielles, c: 'text-blue-600' }] : []),
                    ],
                    recos: ad.fiscalite.optimisation?.strategies.map(s => `${s.nom} (${s.priorite}) — ${s.description}`) || [],
                  },
                  { id: 'epargne', label: 'Épargne de précaution', icon: Shield, bg: 'bg-cyan-50', ic: 'text-cyan-600',
                    scoreKey: 'Épargne de précaution',
                    narratif: ad.epargnePrecaution.narratif,
                    metrics: [
                      { k: 'liq', l: 'Épargne liquide', v: ad.epargnePrecaution.epargneLiquideActuelle },
                      { k: 'cible', l: 'Objectif (6 mois)', v: ad.epargnePrecaution.montantCible },
                      { k: 'gap', l: 'Gap', v: ad.epargnePrecaution.gap, c: ad.epargnePrecaution.gap > 0 ? 'text-red-600' : 'text-emerald-600' },
                      { k: 'mois', l: 'Mois couverts', v: `${ad.epargnePrecaution.moisCouverts.toFixed(1)} mois`, c: ad.epargnePrecaution.moisCouverts >= 6 ? 'text-emerald-600' : 'text-amber-600' },
                    ],
                    recos: ad.epargnePrecaution.planConstitution ? [`Mettre en place un virement de ${formatCurrency(ad.epargnePrecaution.planConstitution.montantMensuel)}/mois pendant ${ad.epargnePrecaution.planConstitution.moisEpargne} mois`] : [],
                  },
                  { id: 'immobilier', label: 'Patrimoine immobilier', icon: Home, bg: 'bg-rose-50', ic: 'text-rose-600',
                    scoreKey: 'Immobilier',
                    narratif: ad.immobilier.narratif,
                    metrics: [
                      { k: 'tot', l: 'Total immobilier', v: ad.immobilier.totalImmobilier },
                      { k: 'poids', l: 'Poids patrimoine', v: `${ad.immobilier.poidsPatrimoine.toFixed(0)}%`, c: ad.immobilier.concentrationRisque ? 'text-red-600' : 'text-gray-900' },
                      { k: 'rdt', l: 'Rendement moyen brut', v: `${ad.immobilier.rendementMoyenBrut.toFixed(1)}%` },
                      { k: 'cf', l: 'Cash-flow global', v: ad.immobilier.cashFlowGlobalMensuel, c: ad.immobilier.cashFlowGlobalMensuel >= 0 ? 'text-emerald-600' : 'text-red-600' },
                      { k: 'net', l: 'Patrimoine immo net', v: ad.immobilier.patrimoineImmobilierNet, c: 'text-blue-600' },
                    ],
                    recos: ad.immobilier.biens.filter(b => b.analyse).map(b => b.analyse),
                  },
                  { id: 'financier', label: 'Patrimoine financier', icon: TrendingUp, bg: 'bg-violet-50', ic: 'text-violet-600',
                    scoreKey: 'Financier',
                    narratif: ad.financier.narratif,
                    metrics: [
                      { k: 'tot', l: 'Total financier', v: ad.financier.totalFinancier },
                      { k: 'poids', l: 'Poids patrimoine', v: `${ad.financier.poidsPatrimoine.toFixed(0)}%` },
                      { k: 'risque', l: 'Score risque', v: `${ad.financier.scoreRisque}/100` },
                      { k: 'divers', l: 'Score diversification', v: `${ad.financier.scoreDiversification}/100`, c: ad.financier.scoreDiversification >= 70 ? 'text-emerald-600' : 'text-amber-600' },
                    ],
                    recos: ad.financier.recommandationAllocation.filter(r => Math.abs(r.ecart) > 5).map(r => `${r.categorie} : actuel ${r.actuel.toFixed(0)}% → cible ${r.cible.toFixed(0)}% (écart ${r.ecart > 0 ? '+' : ''}${r.ecart.toFixed(0)}%)`),
                  },
                  { id: 'retraite', label: 'Retraite', icon: Briefcase, bg: 'bg-teal-50', ic: 'text-teal-600',
                    scoreKey: 'Retraite',
                    narratif: ad.retraite?.narratif || 'Données insuffisantes pour la projection retraite.',
                    metrics: ad.retraite ? [
                      { k: 'pen', l: 'Pension estimée', v: ad.retraite.estimationPension.pensionTotaleMensuelle, c: 'text-emerald-600' },
                      { k: 'txr', l: 'Taux remplacement', v: `${ad.retraite.estimationPension.tauxRemplacement.toFixed(0)}%` },
                      { k: 'gap', l: 'Gap mensuel', v: ad.retraite.analyseGap.gapMensuel, c: ad.retraite.analyseGap.gapMensuel > 0 ? 'text-red-600' : 'text-emerald-600' },
                      { k: 'capnec', l: 'Capital nécessaire (4%)', v: ad.retraite.analyseGap.capitalNecessaire4Pct, c: 'text-blue-600' },
                      { k: 'trim', l: 'Trimestres manquants', v: `${ad.retraite.estimationPension.trimestresManquants}`, c: ad.retraite.estimationPension.trimestresManquants > 0 ? 'text-amber-600' : 'text-emerald-600' },
                      { k: 'agtp', l: 'Âge taux plein', v: `${ad.retraite.estimationPension.ageTauxPlein} ans` },
                    ] : [],
                    recos: ad.retraite?.recommandations.map(r => r.description) || [],
                  },
                  { id: 'succession', label: 'Transmission & Succession', icon: Gift, bg: 'bg-pink-50', ic: 'text-pink-600',
                    scoreKey: 'Transmission',
                    narratif: ad.succession.narratif,
                    metrics: [
                      { k: 'pat', l: 'Patrimoine net taxable', v: ad.succession.patrimoineNetTaxable },
                      { k: 'droits', l: 'Droits estimés', v: ad.succession.droitsEstimes, c: ad.succession.droitsEstimes > 0 ? 'text-red-600' : 'text-emerald-600' },
                      { k: 'txeff', l: 'Taux effectif', v: `${ad.succession.tauxEffectif.toFixed(1)}%` },
                      { k: 'abatt', l: 'Abattements totaux', v: ad.succession.abattementTotal, c: 'text-emerald-600' },
                      ...(ad.succession.impactAssuranceVie ? [{ k: 'av', l: 'Économie AV vs DMTG', v: ad.succession.impactAssuranceVie.economieVsDMTG, c: 'text-blue-600' }] : []),
                    ],
                    recos: ad.succession.strategiesOptimisation.map(s => `[${s.priorite.toUpperCase()}] ${s.strategie} — ${s.detailMiseEnOeuvre}`),
                  },
                ]

                const toggleAxe = (axeId: string) => setExpandedAxes((prev: string[]) => prev.includes(axeId) ? prev.filter((a: string) => a !== axeId) : [...prev, axeId])

                const getScoreForEtude = (scoreKey: string) => ad.synthese.scores.find(s => s.theme === scoreKey)

                const selectedEtudesCount = selectedSimulations.filter(s => s.startsWith('etude-')).length

                // Auto-select all études on first render if none selected
                if (selectedSimulations.filter(s => s.startsWith('etude-')).length === 0 && ETUDES.length > 0) {
                  const etudeIds = ETUDES.map(e => `etude-${e.id}`)
                  setSelectedSimulations(prev => [...prev.filter(s => !s.startsWith('etude-')), ...etudeIds])
                }

                const M = (key: string, label: string, value: string | number, color?: string) => (
                  <div key={key} className="bg-white/70 rounded-lg p-2 text-center border border-gray-100">
                    <p className="text-[10px] text-gray-500 leading-tight">{label}</p>
                    <p className={cn('text-sm font-bold mt-0.5', color || 'text-gray-900')}>{typeof value === 'number' ? formatCurrency(value) : value}</p>
                  </div>
                )

                return (
                <div className="space-y-5">

                  {/* ═══ 1. MÉTÉO PATRIMONIALE ═══ */}
                  <div className="bg-gradient-to-br from-[#7373FF]/5 via-indigo-50/50 to-white border border-indigo-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-[#7373FF]" />
                          Météo patrimoniale
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Diagnostic automatique sur 8 axes — {constats.length} constats identifiés</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn('text-4xl font-black', ad.synthese.scoreGlobal >= 70 ? 'text-emerald-600' : ad.synthese.scoreGlobal >= 45 ? 'text-amber-500' : 'text-red-500')}>
                          {ad.synthese.scoreGlobal}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-500">/100</div>
                          <div className="text-[10px] text-gray-400 uppercase">Score global</div>
                        </div>
                      </div>
                    </div>

                    {/* Barre de score global */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div className={cn('h-2.5 rounded-full transition-all duration-700', ad.synthese.scoreGlobal >= 70 ? 'bg-emerald-500' : ad.synthese.scoreGlobal >= 45 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${ad.synthese.scoreGlobal}%` }} />
                    </div>

                    {/* Scores par axe */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ad.synthese.scores.map(s => (
                        <div key={s.theme} className="bg-white rounded-xl p-3 border text-center hover:shadow-sm transition-shadow">
                          <p className="text-[10px] text-gray-500 leading-tight mb-1.5 font-medium truncate">{s.theme}</p>
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.couleur }} />
                            <span className="text-xl font-black" style={{ color: s.couleur }}>{s.score}</span>
                          </div>
                          <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: s.couleur }}>{s.verdict}</p>
                        </div>
                      ))}
                    </div>

                    {/* Narratif global */}
                    <p className="text-xs text-gray-600 mt-4 leading-relaxed bg-white/60 rounded-lg p-3 border border-gray-100">{ad.synthese.narratifGlobal}</p>
                  </div>

                  {/* ═══ 2. CONSTATS & ALERTES ═══ */}
                  <div className="bg-white border rounded-xl p-4">
                    <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Constats &amp; alertes
                      <span className="text-[10px] font-normal text-gray-400 ml-1">
                        {constats.filter(c => c.type === 'alerte').length} alertes · {constats.filter(c => c.type === 'vigilance').length} vigilances · {constats.filter(c => c.type === 'opportunite').length} opportunités · {constats.filter(c => c.type === 'positif').length} points forts
                      </span>
                    </h4>
                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                      {constats.map((c, i) => (
                        <div key={i} className={cn('flex items-start gap-2.5 p-2.5 rounded-lg text-xs leading-snug', {
                          'bg-red-50 border border-red-200 text-red-800': c.type === 'alerte',
                          'bg-amber-50 border border-amber-200 text-amber-800': c.type === 'vigilance',
                          'bg-blue-50 border border-blue-200 text-blue-800': c.type === 'opportunite',
                          'bg-emerald-50 border border-emerald-200 text-emerald-800': c.type === 'positif',
                        })}>
                          <div className="shrink-0 mt-0.5">
                            {c.type === 'alerte' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                            {c.type === 'vigilance' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                            {c.type === 'opportunite' && <Sparkles className="w-3.5 h-3.5 text-blue-500" />}
                            {c.type === 'positif' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold">[{c.theme}]</span> {c.message}
                          </div>
                          {c.impact !== undefined && c.impact > 0 && (
                            <span className="shrink-0 font-bold text-[10px] px-1.5 py-0.5 rounded bg-white/50">{formatCurrency(c.impact)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ═══ 3. ÉTUDES DÉTAILLÉES PAR AXE ═══ */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-[#7373FF]" />
                      Études détaillées — {selectedEtudesCount}/{ETUDES.length} sélectionnées pour le rapport
                    </h4>

                    {ETUDES.map(etude => {
                      const AxeIcon = etude.icon
                      const isExpanded = expandedAxes.includes(etude.id)
                      const scoreData = getScoreForEtude(etude.scoreKey)
                      const isSelected = selectedSimulations.includes(`etude-${etude.id}`)

                      return (
                        <div key={etude.id} className="rounded-xl border bg-white overflow-hidden">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleAxe(etude.id)}
                              className="flex-1 flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', etude.bg)}>
                                <AxeIcon className={cn('w-4.5 h-4.5', etude.ic)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-gray-900">{etude.label}</span>
                                  {scoreData && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${scoreData.couleur}15`, color: scoreData.couleur }}>
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: scoreData.couleur }} />
                                      {scoreData.score}/100 · {scoreData.verdict}
                                    </span>
                                  )}
                                </div>
                                {scoreData && <p className="text-xs text-gray-500 truncate mt-0.5">{scoreData.commentaire}</p>}
                              </div>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                            </button>
                            <button
                              onClick={() => {
                                const id = `etude-${etude.id}`
                                setSelectedSimulations(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
                              }}
                              className={cn('w-6 h-6 rounded border-2 flex items-center justify-center transition-colors mr-3 shrink-0',
                                isSelected ? 'border-[#7373FF] bg-[#7373FF]' : 'border-gray-300 hover:border-gray-400'
                              )}
                              title={isSelected ? 'Retirer du rapport' : 'Inclure dans le rapport'}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="border-t px-4 pb-4 pt-3 space-y-3">
                              {/* Narratif */}
                              <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">{etude.narratif}</p>

                              {/* Métriques */}
                              {etude.metrics.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {etude.metrics.map(m => M(m.k, m.l, m.v, m.c))}
                                </div>
                              )}

                              {/* Recommandations */}
                              {etude.recos.length > 0 && (
                                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                                  <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                    <Target className="w-3 h-3" /> Recommandations & stratégies
                                  </p>
                                  <div className="space-y-1">
                                    {etude.recos.slice(0, 5).map((r, i) => (
                                      <p key={i} className="text-xs text-blue-900 leading-snug pl-3 border-l-2 border-blue-200">{r}</p>
                                    ))}
                                    {etude.recos.length > 5 && <p className="text-[10px] text-blue-500 pl-3">+{etude.recos.length - 5} autre(s)...</p>}
                                  </div>
                                </div>
                              )}

                              {/* Détails spécifiques immobilier */}
                              {etude.id === 'immobilier' && ad.immobilier.biens.length > 0 && (
                                <div className="bg-rose-50/30 border border-rose-100 rounded-lg p-3">
                                  <p className="text-[10px] font-semibold text-rose-700 uppercase tracking-wide mb-2">Détail des biens ({ad.immobilier.biens.length})</p>
                                  <div className="space-y-1.5">
                                    {ad.immobilier.biens.map(b => (
                                      <div key={b.id} className="flex items-center gap-2 text-xs bg-white rounded-lg p-2 border">
                                        <Home className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                        <span className="font-medium text-gray-900 truncate">{b.nom}</span>
                                        <span className="text-gray-500">{formatCurrency(b.valeur)}</span>
                                        <span className="text-gray-400">({b.poidsPatrimoine.toFixed(0)}%)</span>
                                        {b.rendementLocatifBrut !== null && <span className={cn('ml-auto font-semibold', b.rendementLocatifBrut >= 5 ? 'text-emerald-600' : b.rendementLocatifBrut >= 3 ? 'text-amber-600' : 'text-red-600')}>{b.rendementLocatifBrut.toFixed(1)}% brut</span>}
                                        {b.cashFlowMensuel !== null && <span className={cn('font-semibold', b.cashFlowMensuel >= 0 ? 'text-emerald-600' : 'text-red-600')}>{b.cashFlowMensuel >= 0 ? '+' : ''}{formatCurrency(b.cashFlowMensuel)}/m</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Détails spécifiques financier */}
                              {etude.id === 'financier' && ad.financier.actifs.length > 0 && (
                                <div className="bg-violet-50/30 border border-violet-100 rounded-lg p-3">
                                  <p className="text-[10px] font-semibold text-violet-700 uppercase tracking-wide mb-2">Portefeuille ({ad.financier.actifs.length} actifs)</p>
                                  <div className="space-y-1.5">
                                    {ad.financier.actifs.map(a => (
                                      <div key={a.id} className="flex items-center gap-2 text-xs bg-white rounded-lg p-2 border">
                                        <TrendingUp className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                        <span className="font-medium text-gray-900 truncate">{a.nom}</span>
                                        <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">{a.enveloppeFiscale}</Badge>
                                        <span className="text-gray-500">{formatCurrency(a.valeur)}</span>
                                        <span className={cn('ml-auto text-[10px] px-1 py-0.5 rounded font-semibold',
                                          a.risque === 'faible' ? 'bg-emerald-100 text-emerald-700' : a.risque === 'modere' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                        )}>{a.risque}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Détails spécifiques retraite — scénarios */}
                              {etude.id === 'retraite' && ad.retraite && ad.retraite.scenarios.length > 0 && (
                                <div className="bg-teal-50/30 border border-teal-100 rounded-lg p-3">
                                  <p className="text-[10px] font-semibold text-teal-700 uppercase tracking-wide mb-2">Scénarios de projection ({ad.retraite.scenarios.length})</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {ad.retraite.scenarios.map((sc, i) => (
                                      <div key={i} className={cn('bg-white rounded-lg p-2.5 border text-center', sc.faisable ? 'border-emerald-200' : 'border-red-200')}>
                                        <p className="text-[10px] font-semibold text-gray-600 mb-1">{sc.label}</p>
                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(sc.capitalRetraite)}</p>
                                        <p className="text-[10px] text-gray-500">{formatCurrency(sc.revenuDurable)}/mois durable</p>
                                        <p className={cn('text-[10px] font-bold mt-1', sc.faisable ? 'text-emerald-600' : 'text-red-600')}>{sc.faisable ? 'Faisable' : `Gap ${formatCurrency(sc.gapMensuel)}/m`}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Détails spécifiques succession — héritiers */}
                              {etude.id === 'succession' && ad.succession.detailParHeritier.length > 0 && (
                                <div className="bg-pink-50/30 border border-pink-100 rounded-lg p-3">
                                  <p className="text-[10px] font-semibold text-pink-700 uppercase tracking-wide mb-2">Détail par héritier</p>
                                  <div className="space-y-1.5">
                                    {ad.succession.detailParHeritier.map((h, i) => (
                                      <div key={i} className="flex items-center gap-2 text-xs bg-white rounded-lg p-2 border">
                                        <Users className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                                        <span className="font-medium text-gray-900">{h.lien}</span>
                                        <span className="text-gray-500">Part {formatCurrency(h.partBrute)}</span>
                                        <span className="text-emerald-600">Abatt. {formatCurrency(h.abattement)}</span>
                                        <span className="text-red-600 ml-auto font-semibold">Droits {formatCurrency(h.droits)} ({h.tauxEffectif.toFixed(1)}%)</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* ═══ 4. RÉSUMÉ SÉLECTION ═══ */}
                  <div className="bg-[#7373FF]/5 border border-[#7373FF]/20 rounded-lg p-3 flex items-center justify-between">
                    <p className="text-sm text-[#7373FF] font-medium">
                      <strong>{selectedEtudesCount}</strong> étude(s) sélectionnée(s) pour le rapport
                    </p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="text-xs h-7 text-[#7373FF]" onClick={() => setSelectedSimulations(prev => [...prev.filter(s => !s.startsWith('etude-')), ...ETUDES.map(e => `etude-${e.id}`)])}>
                        Tout sélectionner
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7 text-gray-400" onClick={() => setSelectedSimulations(prev => prev.filter(s => !s.startsWith('etude-')))}>
                        Tout désélectionner
                      </Button>
                    </div>
                  </div>
                </div>
                )
              })()}

              {/* ÉTAPE 3: PRÉCONISATIONS */}
              {currentStep === 'PRECONISATION' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      Préconisations personnalisées
                      {preconisations.some(p => p.id.startsWith('auto-')) && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                          {preconisations.filter(p => p.id.startsWith('auto-')).length} auto-générée(s) par l&apos;audit
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {auditData?.preconisationsAuto && auditData.preconisationsAuto.length > 0
                        ? `${auditData.preconisationsAuto.length} préconisations ont été générées automatiquement par l'analyse de l'audit patrimonial. Chaque recommandation est classée par priorité, horizon temporel et impact estimé. Vous pouvez les modifier, en supprimer ou en ajouter de nouvelles.`
                        : 'Ajoutez vos recommandations personnalisées pour le client.'}
                    </p>
                  </div>

                  {/* Synthèse rapide des préconisations */}
                  {preconisations.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-white border rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900">{preconisations.length}</div>
                        <div className="text-xs text-gray-500">Préconisations</div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-red-600">{preconisations.filter(p => p.priorite === 'HAUTE').length}</div>
                        <div className="text-xs text-red-600">Prioritaires</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {preconisations.filter(p => p.impactFiscalAnnuel && p.impactFiscalAnnuel > 0).length > 0
                            ? formatCurrency(preconisations.reduce((s, p) => s + (p.impactFiscalAnnuel || 0), 0))
                            : '—'}
                        </div>
                        <div className="text-xs text-blue-600">Économie fiscale/an</div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-emerald-600">
                          {preconisations.filter(p => p.montantEstime && p.montantEstime > 0).length > 0
                            ? formatCurrency(preconisations.reduce((s, p) => s + (p.montantEstime || 0), 0))
                            : '—'}
                        </div>
                        <div className="text-xs text-emerald-600">Investissements</div>
                      </div>
                    </div>
                  )}

                  {/* Add new preconisation */}
                  <div className="bg-white border rounded-xl p-5">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Plus className="h-4 w-4 text-gray-400" />
                      Ajouter une préconisation manuelle
                    </h4>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Titre *</Label>
                          <Input
                            value={newPreco.titre || ''}
                            onChange={e => setNewPreco({ ...newPreco, titre: e.target.value })}
                            placeholder="Ex: Optimisation fiscale via PER"
                          />
                        </div>
                        <div>
                          <Label>Priorité</Label>
                          <select
                            value={newPreco.priorite}
                            onChange={e => setNewPreco({ ...newPreco, priorite: e.target.value as any })}
                            className="w-full h-10 px-3 border rounded-md text-sm"
                          >
                            <option value="HAUTE">Haute</option>
                            <option value="MOYENNE">Moyenne</option>
                            <option value="BASSE">Basse</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={newPreco.description || ''}
                          onChange={e => setNewPreco({ ...newPreco, description: e.target.value })}
                          placeholder="Décrivez votre recommandation..."
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Produit suggéré (optionnel)</Label>
                          <Input
                            value={newPreco.produit || ''}
                            onChange={e => setNewPreco({ ...newPreco, produit: e.target.value })}
                            placeholder="Ex: PER Axa"
                          />
                        </div>
                        <div>
                          <Label>Montant estimé (optionnel)</Label>
                          <Input
                            type="number"
                            value={newPreco.montantEstime || ''}
                            onChange={e => setNewPreco({ ...newPreco, montantEstime: parseFloat(e.target.value) || undefined })}
                            placeholder="Ex: 10000"
                          />
                        </div>
                      </div>
                      <Button onClick={addPreconisation} className="w-fit">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>

                  {/* List of preconisations */}
                  {preconisations.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Plan d&apos;actions ({preconisations.length} préconisations)
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400"></span> Auto</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Manuelle</span>
                        </div>
                      </div>
                      {preconisations.map((preco, index) => {
                        const isAuto = preco.id.startsWith('auto-')
                        const catLabels: Record<string, string> = {
                          budget: 'Budget', fiscalite: 'Fiscalité', immobilier: 'Immobilier',
                          financier: 'Financier', retraite: 'Retraite', succession: 'Succession',
                          protection: 'Protection', epargne: 'Épargne',
                        }
                        const horizonLabels: Record<string, string> = {
                          court: 'Court terme', moyen: 'Moyen terme', long: 'Long terme',
                        }
                        return (
                          <div
                            key={preco.id}
                            className={cn(
                              "border rounded-xl p-4 transition-colors",
                              isAuto ? "bg-indigo-50/50 border-indigo-200/60" : "bg-white"
                            )}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                <span className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold",
                                  isAuto ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"
                                )}>{index + 1}</span>
                                {isAuto && <span className="text-[10px] text-indigo-500 font-medium">AUTO</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-gray-900">{preco.titre}</span>
                                  <Badge className={cn('text-xs', PRIORITY_COLORS[preco.priorite])}>
                                    {preco.priorite === 'HAUTE' ? '⚡ Prioritaire' : preco.priorite === 'MOYENNE' ? 'Recommandé' : 'À considérer'}
                                  </Badge>
                                  {preco.categorie && (
                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                      {catLabels[preco.categorie] || preco.categorie}
                                    </span>
                                  )}
                                  {preco.horizonTemporel && (
                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                      {horizonLabels[preco.horizonTemporel] || preco.horizonTemporel}
                                    </span>
                                  )}
                                </div>
                                {preco.description && (
                                  <p className="text-sm text-gray-500 mt-1">{preco.description}</p>
                                )}

                                {/* Métriques clés */}
                                <div className="flex flex-wrap gap-3 mt-2">
                                  {preco.produit && (
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                      {preco.produit}
                                    </span>
                                  )}
                                  {preco.montantEstime ? (
                                    <span className="text-xs font-semibold text-gray-700">
                                      Montant : {formatCurrency(preco.montantEstime)}
                                    </span>
                                  ) : null}
                                  {preco.impactFiscalAnnuel ? (
                                    <span className="text-xs font-semibold text-emerald-600">
                                      Économie fiscale : +{formatCurrency(preco.impactFiscalAnnuel)}/an
                                    </span>
                                  ) : null}
                                </div>

                                {/* Avantages / Risques / Objectif */}
                                {(preco.avantages || preco.risques || preco.objectif) && (
                                  <div className="mt-2 grid grid-cols-1 gap-1.5">
                                    {preco.objectif && (
                                      <div className="flex items-start gap-1.5 text-xs">
                                        <Target className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-600"><strong className="text-gray-700">Objectif :</strong> {preco.objectif}</span>
                                      </div>
                                    )}
                                    {preco.avantages && (
                                      <div className="flex items-start gap-1.5 text-xs">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-600"><strong className="text-emerald-700">Avantages :</strong> {preco.avantages}</span>
                                      </div>
                                    )}
                                    {preco.risques && (
                                      <div className="flex items-start gap-1.5 text-xs">
                                        <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-600"><strong className="text-amber-700">Risques :</strong> {preco.risques}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Impact score bar */}
                                {preco.scoreImpact != null && preco.scoreImpact > 0 && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] text-gray-400">Impact</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"
                                        style={{ width: `${Math.min(preco.scoreImpact, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-bold text-indigo-600">{preco.scoreImpact}/100</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 flex-shrink-0">
                                {ai.isAvailable && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEnrichPreco(preco.id)}
                                    disabled={enrichingPrecoId === preco.id}
                                    className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                    title="Enrichir par IA"
                                  >
                                    {enrichingPrecoId === preco.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePreconisation(preco.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {preconisations.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
                      <Target className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">Aucune préconisation ajoutée</p>
                      <p className="text-sm text-gray-400">
                        Lancez l&apos;audit (étape précédente) pour générer des préconisations automatiques, ou ajoutez-en manuellement.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ÉTAPE 4: VALIDATION - Aperçu */}
              {currentStep === 'VALIDATION' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-xl border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      Aperçu du document
                    </h3>
                    <p className="text-sm text-gray-600">
                      Vérifiez le contenu avant de générer le PDF final.
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white border rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm">Client</span>
                      </div>
                      <p className="font-medium">{clientData?.firstName} {clientData?.lastName}</p>
                    </div>
                    <div className="bg-white border rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-sm">Études</span>
                      </div>
                      <p className="font-medium">{selectedSimulations.length} incluse(s)</p>
                    </div>
                    <div className="bg-white border rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <Target className="h-4 w-4" />
                        <span className="text-sm">Préconisations</span>
                      </div>
                      <p className="font-medium">{preconisations.length} ajoutée(s)</p>
                    </div>
                    <div className="bg-white border rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <Shield className="h-4 w-4" />
                        <span className="text-sm">Score global</span>
                      </div>
                      <p className="font-medium">{auditData?.synthese?.scoreGlobal ?? '—'}<span className="text-xs text-gray-400">/100</span></p>
                    </div>
                  </div>

                  {/* Preview iframe */}
                  {isLoading ? (
                    <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl border">
                      <Loader2 className="h-8 w-8 animate-spin text-[#7373FF]" />
                      <span className="ml-3 text-gray-600">Génération de l&apos;aperçu...</span>
                    </div>
                  ) : previewHtml ? (
                    <div className="border rounded-xl overflow-hidden bg-white shadow-inner" style={{ height: '500px' }}>
                      <iframe
                        srcDoc={previewHtml}
                        className="w-full h-full"
                        title="Aperçu du bilan patrimonial"
                        style={{ border: 'none' }}
                      />
                    </div>
                  ) : (
                    <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl border">
                      <p className="text-gray-500">Aperçu non disponible</p>
                    </div>
                  )}
                </div>
              )}

              {/* ÉTAPE 5: GÉNÉRATION */}
              {currentStep === 'GENERATION' && (
                <div className="flex flex-col items-center justify-center py-12">
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-[#7373FF]/10 flex items-center justify-center">
                          <Loader2 className="h-10 w-10 animate-spin text-[#7373FF]" />
                        </div>
                        <div className="absolute -inset-3 rounded-3xl border-2 border-[#7373FF]/20 animate-pulse" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Génération en cours</h3>
                        <p className="text-sm text-gray-500">Mise en page du PDF, calcul des graphiques et assemblage des sections...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7373FF]/15 to-indigo-100 flex items-center justify-center mb-6 shadow-sm">
                        <FileText className="h-10 w-10 text-[#7373FF]" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Prêt à générer</h3>
                      <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                        Le bilan patrimonial de <strong className="text-gray-900">{clientData?.firstName} {clientData?.lastName}</strong> est prêt à être généré avec {selectedSimulations.length} étude(s) et {preconisations.length} préconisation(s).
                      </p>
                      {auditData?.synthese && (
                        <div className="flex items-center gap-3 mb-8 bg-white border rounded-xl px-5 py-3">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Shield className="h-4 w-4 text-indigo-500" />
                            <span className="text-gray-500">Score</span>
                            <strong className="text-indigo-600">{auditData.synthese.scoreGlobal}/100</strong>
                          </div>
                          <div className="w-px h-4 bg-gray-200" />
                          <span className="text-sm text-gray-500">{auditData.synthese.scores.length} axes</span>
                          <div className="w-px h-4 bg-gray-200" />
                          <span className="text-sm text-gray-500">{preconisations.filter(p => p.priorite === 'HAUTE').length} prioritaires</span>
                        </div>
                      )}
                      <Button
                        size="lg"
                        onClick={handleGenerate}
                        className="bg-[#7373FF] hover:bg-[#5c5ce6] text-white px-8 shadow-md shadow-[#7373FF]/25 hover:shadow-lg hover:shadow-[#7373FF]/30 transition-all"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Télécharger le PDF
                      </Button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with navigation */}
        {currentStep !== 'GENERATION' && (
          <div className="border-t bg-white">
            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
              <div
                className="h-full bg-gradient-to-r from-[#7373FF] to-indigo-400 transition-all duration-500 ease-out"
                style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>
            <div className="px-6 py-3 flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === currentStepIndex ? 'w-6 bg-[#7373FF]' : i < currentStepIndex ? 'w-1.5 bg-[#7373FF]/40' : 'w-1.5 bg-gray-200'
                    )}
                  />
                ))}
              </div>

              <Button onClick={handleNext} className="bg-[#7373FF] hover:bg-[#5c5ce6] shadow-sm shadow-[#7373FF]/20">
                {currentStepIndex === STEPS.length - 2 ? 'Finaliser' : 'Suivant'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default BilanPatrimonialWizard
