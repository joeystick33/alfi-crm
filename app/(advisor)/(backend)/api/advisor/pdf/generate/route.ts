/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { PdfGenerator } from '@/app/_common/lib/services/pdf-generator'
import { 
  generateBilanPatrimonialPremiumHtml,
  generateFicheClientHtml,
  generateRapportSimulationHtml,
  generateFactureHtml,
  generateRapportConseilHtml,
  generateLettreMissionHtml,
  generateDiagnosticSuccessoralHtml,
  generateEntreeRelationHtml,
  generateDeclarationAdequationHtml,
  generateRapportPrevoyanceTnsHtml,
} from '@/app/_common/lib/templates'
import type { DiagnosticSuccessoralData } from '@/app/_common/lib/templates/diagnostic-successoral-template'
import type { EntreeRelationData } from '@/app/_common/lib/templates/entree-relation-template'
import type { DeclarationAdequationData } from '@/app/_common/lib/templates/declaration-adequation-template'
import type { RapportPrevoyanceTnsData } from '@/app/_common/lib/templates/rapport-prevoyance-tns-template'
import { logger } from '@/app/_common/lib/logger'
type PdfType = 'BILAN_PATRIMONIAL' | 'FICHE_CLIENT' | 'SIMULATION' | 'FACTURE' | 'RAPPORT_CONSEIL' | 'LETTRE_MISSION' | 'DIAGNOSTIC_SUCCESSORAL' | 'ENTREE_RELATION' | 'DECLARATION_ADEQUATION' | 'RAPPORT_PREVOYANCE_TNS'

/**
 * POST /api/advisor/pdf/generate
 * API unifiée pour générer tous types de PDF
 * 
 * Body: { type: PdfType, id: string, options?: { preview?: boolean } }
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { type, id, options } = body as { type: PdfType; id: string; options?: { preview?: boolean } }

    if (!type || !id) {
      return createErrorResponse('Type et ID requis', 400)
    }

    let html: string

    switch (type) {
      case 'FICHE_CLIENT':
        html = await generateClientPdf(id, context.cabinetId)
        break
      case 'BILAN_PATRIMONIAL':
        html = await generateBilanPdf(id, context.cabinetId, body)
        break
      case 'SIMULATION':
        html = await generateSimulationPdf(id, context.cabinetId, body)
        break
      case 'FACTURE':
        html = await generateFacturePdf(id, context.cabinetId)
        break
      case 'RAPPORT_CONSEIL':
        html = await generateRapportConseilPdf(id, context.cabinetId)
        break
      case 'LETTRE_MISSION':
        html = await generateLettreMissionPdf(id, context.cabinetId)
        break
      case 'DIAGNOSTIC_SUCCESSORAL':
        html = await generateDiagnosticSuccessoralPdf(body.diagnosticData, context.cabinetId)
        break
      case 'ENTREE_RELATION':
        html = await generateEntreeRelationPdf(id, context.cabinetId, body.entreeRelationData)
        break
      case 'DECLARATION_ADEQUATION':
        html = generateDeclarationAdequationHtml(body.adequationData as DeclarationAdequationData)
        break
      case 'RAPPORT_PREVOYANCE_TNS':
        html = generateRapportPrevoyanceTnsHtml(body.prevoyanceTnsData as RapportPrevoyanceTnsData)
        break
      default:
        return createErrorResponse('Type de PDF non supporté', 400)
    }

    // Retourner HTML pour preview
    if (options?.preview) {
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // Générer le PDF
    const pdfBuffer = await PdfGenerator.generateFromHtml(html, {
      format: 'A4',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      displayHeaderFooter: false,
      printBackground: true,
    })

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type.toLowerCase()}_${id}.pdf"`,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    logger.error('Error generating PDF:', { error: msg, stack })
    return createErrorResponse(`${msg}${stack ? ` | STACK: ${stack.slice(0, 500)}` : ''}`, 500)
  }
}

// ============================================================
// GÉNÉRATEURS PAR TYPE
// ============================================================

async function generateClientPdf(clientId: string, cabinetId: string): Promise<string> {
  // Récupérer client avec toutes les relations
  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId },
    include: {
      conseiller: { select: { firstName: true, lastName: true, email: true, phone: true } },
      actifs: { include: { actif: true } },
      passifs: true,
      contrats: true,
      objectifs: true,
      familyMembers: true,
    },
  })

  if (!client) throw new Error('Client non trouvé')

  const cabinet = await prisma.cabinet.findUnique({ where: { id: cabinetId } })

  // Extraire les actifs depuis ClientActif
  const actifs = client.actifs.map(ca => ca.actif)
  const totalActifs = actifs.reduce((sum, a) => sum + Number(a.value || 0), 0)

  // Passifs directement liés au client
  const passifs = client.passifs
  const totalPassifs = passifs.reduce((sum, p) => sum + Number(p.remainingAmount || 0), 0)

  // Répartition par catégorie
  const repartition: Array<{ label: string; value: number; color: string }> = []
  const catColors: Record<string, string> = {
    IMMOBILIER: '#3b82f6',
    FINANCIER: '#8b5cf6',
    EPARGNE_SALARIALE: '#f59e0b',
    EPARGNE_RETRAITE: '#10b981',
    PROFESSIONNEL: '#ef4444',
    MOBILIER: '#6366f1',
    AUTRE: '#94a3b8',
  }

  const parCategorie = actifs.reduce((acc, a) => {
    const cat = a.category || 'AUTRE'
    acc[cat] = (acc[cat] || 0) + Number(a.value || 0)
    return acc
  }, {} as Record<string, number>)

  Object.entries(parCategorie).forEach(([cat, val]) => {
    if (val > 0) {
      repartition.push({ 
        label: formatCategoryLabel(cat), 
        value: val, 
        color: catColors[cat] || '#94a3b8' 
      })
    }
  })

  // Parser l'adresse JSON
  const address = client.address as any
  const adresseStr = address ? (
    typeof address === 'string' ? address :
    [address.street, address.postalCode, address.city, address.country].filter(Boolean).join(', ')
  ) : undefined

  return generateFicheClientHtml({
    client: {
      id: client.id,
      civilite: client.civilite || undefined,
      nom: client.lastName,
      prenom: client.firstName,
      nomUsage: client.nomUsage || undefined,
      dateNaissance: client.birthDate || undefined,
      lieuNaissance: client.birthPlace || undefined,
      nationalite: client.nationality || undefined,
      situationFamiliale: client.maritalStatus || undefined,
      regimeMatrimonial: client.matrimonialRegime || client.marriageRegime || undefined,
      enfants: client.numberOfChildren || 0,
      personnesACharge: client.dependents || 0,
      profession: client.profession || undefined,
      categorieProfession: client.professionCategory || undefined,
      employeur: client.employerName || undefined,
      typeContrat: client.employmentType || undefined,
      revenuAnnuel: client.annualIncome ? Number(client.annualIncome) : undefined,
      email: client.email || undefined,
      telephone: client.phone || undefined,
      mobile: client.mobile || undefined,
      adresse: adresseStr,
      residenceFiscale: client.taxResidenceCountry || client.fiscalResidence || undefined,
      profilRisque: client.riskProfile || undefined,
      horizonInvestissement: client.investmentHorizon || undefined,
      kycStatus: client.kycStatus || undefined,
      isPEP: client.isPEP || false,
      origineDesFonds: client.originOfFunds || undefined,
    },
    conseiller: client.conseiller ? {
      nom: client.conseiller.lastName,
      prenom: client.conseiller.firstName,
      email: client.conseiller.email,
      telephone: client.conseiller.phone || undefined,
    } : undefined,
    cabinet: cabinet ? {
      nom: cabinet.name,
      adresse: formatCabinetAddress(cabinet.address),
      telephone: cabinet.phone || undefined,
      email: cabinet.email || undefined,
    } : undefined,
    patrimoine: {
      totalActifs,
      totalPassifs,
      patrimoineNet: totalActifs - totalPassifs,
      repartition,
      actifs: actifs.map(a => ({
        categorie: a.category,
        type: a.type,
        nom: a.name,
        valeur: Number(a.value || 0),
        description: a.description || undefined,
      })),
      passifs: passifs.map(p => ({
        type: p.type,
        nom: p.name,
        capitalInitial: Number(p.initialAmount || 0),
        capitalRestant: Number(p.remainingAmount || 0),
        mensualite: Number(p.monthlyPayment || 0),
        taux: Number(p.interestRate || 0),
        dateDebut: p.startDate,
        dateFin: p.endDate,
      })),
    },
    famille: client.familyMembers.map(m => ({
      relation: m.relationship,
      prenom: m.firstName,
      nom: m.lastName || undefined,
      dateNaissance: m.birthDate || undefined,
      aCharge: m.isDependent || false,
    })),
    contrats: client.contrats.map((c: any) => ({
      type: c.type,
      assureur: c.provider || undefined,
      numero: c.contractNumber || undefined,
      statut: c.status,
    })),
    objectifs: client.objectifs.map(o => ({
      titre: o.name,
      description: o.description || undefined,
      priorite: o.priority,
      montantCible: o.targetAmount ? Number(o.targetAmount) : undefined,
      echeance: o.targetDate || undefined,
      statut: o.status,
    })),
    fiscalite: {
      trancheMarginal: client.taxBracket || undefined,
      tauxIR: client.irTaxRate ? Number(client.irTaxRate) : undefined,
      assujettIFI: client.ifiSubject || false,
      montantIFI: client.ifiAmount ? Number(client.ifiAmount) : undefined,
    },
  })
}

async function generateBilanPdf(clientId: string, cabinetId: string, body?: any): Promise<string> {
  // Récupérer le client avec toutes ses relations patrimoniales
  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId },
    include: {
      actifs: { include: { actif: true } },
      passifs: true,
      familyMembers: true,
      contrats: true,
      objectifs: true,
      conseiller: { select: { firstName: true, lastName: true, email: true, phone: true } },
    },
  }) as any

  if (!client) throw new Error('Client non trouvé')

  const cabinet = await prisma.cabinet.findUnique({ where: { id: cabinetId } }) as any

  // Charger les revenus réels depuis la table revenues
  let revenues: any[] = []
  try {
    revenues = await prisma.revenue.findMany({ where: { clientId } })
  } catch { /* table may not exist */ }

  // Charger les dépenses réelles depuis la table expenses
  let expenses: any[] = []
  try {
    expenses = await prisma.expense.findMany({ where: { clientId } })
  } catch { /* table may not exist */ }

  // Charger les simulations du client
  let simulations: any[] = []
  try {
    simulations = await prisma.simulation.findMany({
      where: { clientId, cabinetId },
      orderBy: { createdAt: 'desc' },
    })
  } catch { /* table may not exist */ }

  // Extraire les actifs depuis ClientActif
  const actifs = client.actifs.map((ca: any) => ca.actif)
  const passifs = client.passifs

  // Calculs patrimoine
  const totalMensualites = passifs.reduce((sum: number, p: any) => sum + Number(p.monthlyPayment || 0), 0)

  // Calcul des revenus réels (annualisés)
  const calcAnnualRevenues = (revs: any[]): number => {
    if (!revs || revs.length === 0) return client.annualIncome ? Number(client.annualIncome) : 0
    return revs.reduce((sum: number, r: any) => {
      const amount = Number(r.amount || 0)
      const freq = (r.frequency || 'MENSUEL').toUpperCase()
      switch (freq) {
        case 'MENSUEL': return sum + amount * 12
        case 'TRIMESTRIEL': return sum + amount * 4
        case 'SEMESTRIEL': return sum + amount * 2
        case 'ANNUEL': return sum + amount
        case 'PONCTUEL': return sum + amount
        default: return sum + amount * 12
      }
    }, 0)
  }

  // Calcul des charges réelles (annualisées), HORS crédits
  const calcAnnualExpenses = (exps: any[]): number => {
    if (!exps || exps.length === 0) return 0
    return exps.reduce((sum: number, e: any) => {
      const amount = Number(e.amount || 0)
      const freq = (e.frequency || 'MENSUEL').toUpperCase()
      switch (freq) {
        case 'MENSUEL': return sum + amount * 12
        case 'TRIMESTRIEL': return sum + amount * 4
        case 'SEMESTRIEL': return sum + amount * 2
        case 'ANNUEL': return sum + amount
        case 'PONCTUEL': return sum + amount
        default: return sum + amount * 12
      }
    }, 0)
  }

  const totalRevenus = calcAnnualRevenues(revenues)
  const totalChargesHorsCredits = calcAnnualExpenses(expenses)
  const totalCharges = totalChargesHorsCredits + (totalMensualites * 12)

  // Filtrer les simulations sélectionnées par le wizard si fournies
  const selectedSimulationIds: string[] = body?.selectedSimulations || []
  const filteredSimulations = selectedSimulationIds.length > 0
    ? simulations.filter((s: any) => selectedSimulationIds.includes(s.id))
    : simulations.slice(0, 5) // Par défaut, max 5 dernières

  // Préconisations fournies par le wizard
  const bodyPreconisations = body?.preconisations || []

  // Générer une référence de bilan basée sur le client
  const bilanReference = `BP-${client.lastName.toUpperCase().slice(0, 3)}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`

  // Mapper les catégories vers des labels lisibles
  const mapCategory = (cat: string) => {
    const labels: Record<string, string> = {
      IMMOBILIER: 'Immobilier', FINANCIER: 'Financier', EPARGNE_SALARIALE: 'Épargne salariale',
      EPARGNE_RETRAITE: 'Épargne retraite', PROFESSIONNEL: 'Professionnel',
      MOBILIER: 'Biens mobiliers', AUTRE: 'Autres',
    }
    return labels[cat] || cat
  }

  const mapType = (type: string) => {
    const labels: Record<string, string> = {
      REAL_ESTATE_MAIN: 'Résidence principale', REAL_ESTATE_RENTAL: 'Locatif',
      REAL_ESTATE_SECONDARY: 'Résidence secondaire', REAL_ESTATE_COMMERCIAL: 'Commercial',
      SCPI: 'SCPI', SCI: 'SCI', OPCI: 'OPCI',
      LIFE_INSURANCE: 'Assurance-vie', CAPITALIZATION_CONTRACT: 'Contrat de capitalisation',
      SECURITIES_ACCOUNT: 'Compte-titres', PEA: 'PEA', PEA_PME: 'PEA-PME',
      BANK_ACCOUNT: 'Compte bancaire', SAVINGS_ACCOUNT: 'Épargne', PEL: 'PEL', CEL: 'CEL',
      PER: 'PER', PERP: 'PERP', MADELIN: 'Madelin',
      PEE: 'PEE', PERCO: 'PERCO', PERECO: 'PERECO',
      COMPANY_SHARES: 'Parts de société', GOODWILL: 'Fonds de commerce',
      MORTGAGE: 'Emprunt immobilier', CONSUMER_LOAN: 'Crédit conso',
      CAR_LOAN: 'Crédit auto', STUDENT_LOAN: 'Prêt étudiant',
      PROFESSIONAL_LOAN: 'Prêt professionnel', REVOLVING_CREDIT: 'Crédit renouvelable',
      IN_FINE_LOAN: 'Prêt in fine', BRIDGE_LOAN: 'Prêt relais',
    }
    return labels[type] || type.replace(/_/g, ' ')
  }

  const mapSituationFamiliale = (status: string | null | undefined) => {
    if (!status) return undefined
    const labels: Record<string, string> = {
      SINGLE: 'Célibataire', MARRIED: 'Marié(e)', PACS: 'Pacsé(e)',
      DIVORCED: 'Divorcé(e)', WIDOWED: 'Veuf/Veuve', COHABITING: 'Concubinage',
      SEPARATED: 'Séparé(e)',
    }
    return labels[status] || status
  }

  const mapRegimeMatrimonial = (regime: string | null | undefined) => {
    if (!regime) return undefined
    const labels: Record<string, string> = {
      COMMUNAUTE_LEGALE: 'Communauté légale réduite aux acquêts',
      COMMUNAUTE_UNIVERSELLE: 'Communauté universelle',
      SEPARATION_BIENS: 'Séparation de biens',
      PARTICIPATION_ACQUETS: 'Participation aux acquêts',
    }
    return labels[regime] || regime
  }

  return generateBilanPatrimonialPremiumHtml({
    dossier: {
      id: client.id,
      reference: bilanReference,
      type: 'BILAN_PATRIMONIAL',
      categorie: 'PATRIMOINE',
      createdAt: new Date(),
    },
    client: {
      nom: client.lastName,
      prenom: client.firstName,
      dateNaissance: client.birthDate || undefined,
      situationFamiliale: mapSituationFamiliale(client.maritalStatus),
      regimeMatrimonial: mapRegimeMatrimonial(client.matrimonialRegime || client.marriageRegime),
      enfants: client.numberOfChildren || 0,
      profession: client.profession || undefined,
      email: client.email || undefined,
      telephone: client.phone || client.mobile || undefined,
    },
    conseiller: client.conseiller ? {
      nom: client.conseiller.lastName || '',
      prenom: client.conseiller.firstName || '',
      email: client.conseiller.email || undefined,
      telephone: client.conseiller.phone || undefined,
    } : { nom: '', prenom: '', email: cabinet?.email || undefined },
    cabinet: cabinet ? {
      nom: cabinet.name,
      adresse: formatCabinetAddress(cabinet.address),
      telephone: cabinet.phone || undefined,
      email: cabinet.email || undefined,
    } : undefined,
    patrimoine: {
      immobilier: actifs.filter((a: any) => a.category === 'IMMOBILIER').map((a: any) => ({
        type: mapType(a.type),
        nom: a.name,
        valeur: Number(a.value || 0),
        location: a.location || undefined,
      })),
      financier: actifs.filter((a: any) => ['FINANCIER', 'EPARGNE_SALARIALE', 'EPARGNE_RETRAITE'].includes(a.category)).map((a: any) => ({
        type: mapType(a.type),
        nom: a.name,
        valeur: Number(a.value || 0),
      })),
      professionnel: actifs.filter((a: any) => ['PROFESSIONNEL', 'MOBILIER', 'AUTRE'].includes(a.category)).map((a: any) => ({
        nom: a.name,
        valeur: Number(a.value || 0),
      })),
      passifs: passifs.map((p: any) => ({
        type: mapType(p.type),
        nom: p.name,
        capitalRestant: Number(p.remainingAmount || 0),
        tauxInteret: Number(p.interestRate || 0),
        mensualite: Number(p.monthlyPayment || 0),
      })),
    },
    revenus: {
      total: totalRevenus,
      details: revenues.map((r: any) => ({
        type: r.category || r.type || 'Autre',
        montant: Number(r.amount || 0),
        frequence: r.frequency || 'MENSUEL',
      })),
    },
    charges: { total: totalChargesHorsCredits, totalMensualitesCredits: totalMensualites },
    simulations: filteredSimulations.map((s: any) => ({
      type: s.type,
      nom: s.name,
      parametres: s.parameters || {},
      resultats: s.results || {},
    })),
    preconisations: bodyPreconisations.length > 0 ? bodyPreconisations : undefined,
    audit: body?.audit || undefined,
  })
}

async function generateSimulationPdf(simulationId: string, cabinetId: string, body?: any): Promise<string> {
  // --- Mode inline : le composant ExportSimulationActions envoie simulationData directement ---
  if (body?.simulationData) {
    const sd = body.simulationData
    const cabinet = await prisma.cabinet.findUnique({ where: { id: cabinetId } })
    return generateRapportSimulationHtml({
      reference: sd.reference || `SIM-${simulationId.slice(0, 8).toUpperCase()}`,
      date: sd.date ? new Date(sd.date) : new Date(),
      type: sd.type || 'AUTRE',
      titre: sd.titre || 'Simulation',
      client: {
        nom: sd.client?.nom || 'Client',
        prenom: sd.client?.prenom || '',
        email: sd.client?.email,
      },
      conseiller: sd.conseiller ? { nom: sd.conseiller.nom, prenom: sd.conseiller.prenom } : undefined,
      cabinet: cabinet ? {
        nom: cabinet.name,
        adresse: typeof cabinet.address === 'string' ? cabinet.address : undefined,
      } : undefined,
      parametres: sd.parametres || [],
      resultats: sd.resultats || [],
      echeancier: sd.echeancier,
      avertissements: sd.avertissements,
      notes: sd.notes,
    })
  }

  // --- Mode DB : lookup par ID dans la base de données ---
  let simulation: any = null
  
  try {
    simulation = await (prisma as any).dossierSimulation.findFirst({
      where: { id: simulationId },
      include: {
        dossier: {
          include: {
            client: true,
            conseiller: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })
  } catch { /* Model may not exist */ }

  if (!simulation) {
    // Fallback: chercher dans Simulation classique
    simulation = await prisma.simulation.findFirst({
      where: { id: simulationId },
      include: {
        client: true,
      },
    })
  }

  if (!simulation) throw new Error('Simulation non trouvée')

  const cabinet = await prisma.cabinet.findUnique({ where: { id: cabinetId } })
  const client = simulation.dossier?.client || simulation.client
  const conseiller = simulation.dossier?.conseiller

  const parametres = simulation.parametres || {}
  const resultats = simulation.resultats || {}

  return generateRapportSimulationHtml({
    reference: `SIM-${simulation.id.slice(0, 8).toUpperCase()}`,
    date: simulation.createdAt || new Date(),
    type: simulation.type || 'AUTRE',
    titre: simulation.nom || simulation.name || 'Simulation',
    client: {
      nom: client?.lastName || 'Client',
      prenom: client?.firstName || '',
      email: client?.email,
    },
    conseiller: conseiller ? {
      nom: conseiller.lastName,
      prenom: conseiller.firstName,
    } : undefined,
    cabinet: cabinet ? {
      nom: cabinet.name,
      adresse: typeof cabinet.address === 'string' ? cabinet.address : undefined,
    } : undefined,
    parametres: Object.entries(parametres).map(([key, value]) => ({
      label: formatParamLabel(key),
      valeur: value as any,
      unite: getParamUnit(key),
    })),
    resultats: Object.entries(resultats).map(([key, value]) => ({
      label: formatParamLabel(key),
      valeur: value as any,
      unite: getParamUnit(key),
      important: key.includes('total') || key.includes('mensualite') || key.includes('cout'),
    })),
  })
}

async function generateFacturePdf(factureId: string, cabinetId: string): Promise<string> {
  const facture = await prisma.invoice.findFirst({
    where: { id: factureId, cabinetId },
    include: {
      client: true,
    } as any,
  }) as any

  if (!facture) throw new Error('Facture non trouvée')

  const cabinet = await prisma.cabinet.findUnique({ where: { id: cabinetId } }) as any

  // Parser l'adresse client
  const clientAddress = facture.client.address as any
  const clientAdresseStr = clientAddress ? (
    typeof clientAddress === 'string' ? clientAddress :
    [clientAddress.street, clientAddress.postalCode, clientAddress.city].filter(Boolean).join(', ')
  ) : undefined

  return generateFactureHtml({
    numero: facture.invoiceNumber || facture.id.slice(0, 8).toUpperCase(),
    date: facture.issueDate || facture.createdAt,
    dateEcheance: facture.dueDate,
    statut: facture.status as any,
    emetteur: {
      nom: cabinet?.name || 'Cabinet',
      adresse: formatCabinetAddress(cabinet?.address),
      telephone: cabinet?.phone || undefined,
      email: cabinet?.email || undefined,
      siret: cabinet?.siret || undefined,
    },
    client: {
      nom: facture.client.lastName,
      prenom: facture.client.firstName,
      adresse: clientAdresseStr,
      email: facture.client.email || undefined,
    },
    lignes: (facture.invoiceLines || []).map((l: any) => ({
      description: l.description || l.label || 'Prestation',
      quantite: Number(l.quantity || 1),
      prixUnitaire: Number(l.unitPrice || l.amount || 0),
      tva: Number(l.taxRate || l.vatRate || 20),
      total: Number(l.totalHT || l.amount || 0),
    })),
    sousTotal: Number(facture.totalHT || facture.amount || 0),
    totalTVA: Number(facture.totalTVA || 0),
    totalTTC: Number(facture.totalTTC || facture.amount || 0),
    conditions: 'Paiement à réception de facture par virement bancaire.',
  })
}

async function generateRapportConseilPdf(dossierId: string, cabinetId: string): Promise<string> {
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    include: {
      client: true,
      conseiller: { select: { firstName: true, lastName: true, email: true } },
    } as any,
  }) as any

  if (!dossier) throw new Error('Dossier non trouvé')

  const cabinet = await prisma.cabinet.findUnique({ where: { id: cabinetId } }) as any

  // Préconisations
  let preconisations: any[] = []
  try {
    preconisations = await (prisma as any).dossierPreconisation.findMany({
      where: { dossierId },
      orderBy: { ordre: 'asc' },
    })
  } catch { /* Model may not exist */ }

  return generateRapportConseilHtml({
    dossier: {
      id: dossier.id,
      reference: dossier.reference,
      type: dossier.type,
      categorie: dossier.categorie,
      createdAt: dossier.createdAt,
      objet: dossier.nom || 'Conseil patrimonial',
    },
    client: {
      nom: dossier.client.lastName,
      prenom: dossier.client.firstName,
      email: dossier.client.email || undefined,
      telephone: dossier.client.phone || dossier.client.mobile || undefined,
    },
    conseiller: {
      nom: dossier.conseiller.lastName,
      prenom: dossier.conseiller.firstName,
      email: dossier.conseiller.email,
    },
    cabinet: cabinet ? {
      nom: cabinet.name,
      adresse: typeof cabinet.address === 'string' ? cabinet.address : undefined,
      telephone: cabinet.phone || undefined,
      email: cabinet.email || undefined,
    } : undefined,
    contexte: dossier.description || 'Accompagnement patrimonial personnalisé.',
    objectifs: ['Optimisation fiscale', 'Préparation de la retraite', 'Transmission du patrimoine'],
    analyse: {
      situation: 'Analyse de la situation patrimoniale globale du client.',
      constats: ['Patrimoine diversifié', 'Capacité d\'épargne disponible'],
      opportunites: ['Optimisation de l\'enveloppe fiscale', 'Diversification des placements'],
      risques: ['Concentration sur l\'immobilier', 'Horizon de placement à adapter'],
    },
    recommandations: preconisations.map((p, i) => ({
      titre: p.titre,
      description: p.description || '',
      priorite: p.priorite || 'MOYENNE',
      produit: p.produit,
      montant: p.montantEstime ? Number(p.montantEstime) : undefined,
      avantages: p.avantages ? [p.avantages] : undefined,
    })),
    conclusion: 'Ces recommandations visent à optimiser votre situation patrimoniale tout en respectant vos objectifs personnels et votre profil de risque.',
  })
}

async function generateLettreMissionPdf(dossierId: string, cabinetId: string): Promise<string> {
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    include: {
      client: true,
      conseiller: { select: { firstName: true, lastName: true, email: true } },
    },
  })

  if (!dossier) throw new Error('Dossier non trouvé')

  const cabinet = await prisma.cabinet.findUnique({ where: { id: cabinetId } })

  const clientData = dossier.client as any
  const cabinetData = cabinet as any
  
  // Parser l'adresse client si c'est un JSON
  const clientAddress = clientData.address as any
  const addressStr = clientAddress ? (
    typeof clientAddress === 'string' ? clientAddress :
    [clientAddress.street, clientAddress.postalCode, clientAddress.city].filter(Boolean).join(', ')
  ) : undefined

  return generateLettreMissionHtml({
    reference: `LM-${dossier.reference}`,
    date: new Date(),
    client: {
      civilite: clientData.civilite || undefined,
      nom: clientData.lastName,
      prenom: clientData.firstName,
      adresse: addressStr,
      codePostal: clientAddress?.postalCode || undefined,
      ville: clientAddress?.city || undefined,
      email: clientData.email || undefined,
      telephone: clientData.phone || clientData.mobile || undefined,
    },
    conseiller: {
      nom: dossier.conseiller.lastName,
      prenom: dossier.conseiller.firstName,
      email: dossier.conseiller.email,
      titre: 'Conseiller en Gestion de Patrimoine',
    },
    cabinet: {
      nom: cabinetData?.name || 'Cabinet',
      adresse: typeof cabinetData?.address === 'string' ? cabinetData.address : undefined,
      telephone: cabinetData?.phone || undefined,
      email: cabinetData?.email || undefined,
      siret: cabinetData?.siret || undefined,
      orias: cabinetData?.orias || undefined,
    },
    mission: {
      type: 'Conseil en Gestion de Patrimoine',
      objet: dossier.nom || 'Accompagnement patrimonial',
      perimetre: [
        'Analyse de la situation patrimoniale globale',
        'Étude des objectifs patrimoniaux',
        'Préconisations personnalisées',
        'Suivi de la mise en œuvre des recommandations',
      ],
      duree: '12 mois renouvelables par tacite reconduction',
    },
    obligations: {
      conseiller: [
        'Agir avec diligence, loyauté et impartialité',
        'Fournir des conseils adaptés au profil du client',
        'Respecter le secret professionnel',
        'Informer le client de tout conflit d\'intérêts potentiel',
      ],
      client: [
        'Fournir les informations nécessaires à la réalisation de la mission',
        'Informer le conseiller de tout changement de situation',
        'Régler les honoraires selon les modalités convenues',
      ],
    },
    confidentialite: 'Le conseiller s\'engage à respecter la confidentialité des informations communiquées par le client dans le cadre de la présente mission.',
    conflitsInterets: 'Le conseiller déclare n\'avoir aucun conflit d\'intérêts susceptible d\'affecter son indépendance dans le cadre de cette mission.',
  })
}

async function generateDiagnosticSuccessoralPdf(diagnosticData: DiagnosticSuccessoralData | undefined, cabinetId: string): Promise<string> {
  if (!diagnosticData) {
    throw new Error('Les données du diagnostic successoral sont requises (diagnosticData)')
  }

  // Enrichir avec les données du cabinet si disponibles
  if (!diagnosticData.metadata.cabinetConseiller) {
    try {
      const cabinet = await prisma.cabinet.findUnique({ where: { id: cabinetId } })
      if (cabinet) {
        diagnosticData.metadata.cabinetConseiller = cabinet.name
      }
    } catch { /* ignore */ }
  }

  return generateDiagnosticSuccessoralHtml(diagnosticData)
}

// ============================================================
// HELPERS
// ============================================================

function formatCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    IMMOBILIER: 'Immobilier',
    FINANCIER: 'Placements financiers',
    EPARGNE_SALARIALE: 'Épargne salariale',
    EPARGNE_RETRAITE: 'Épargne retraite',
    PROFESSIONNEL: 'Actifs professionnels',
    MOBILIER: 'Biens mobiliers',
    AUTRE: 'Autres actifs',
  }
  return labels[category] || category
}

function formatCabinetAddress(address: any): string | undefined {
  if (!address) return undefined
  if (typeof address === 'string') return address
  return [address.street, address.postalCode, address.city, address.country].filter(Boolean).join(', ') || undefined
}

function formatParamLabel(key: string): string {
  const labels: Record<string, string> = {
    montant: 'Montant',
    montantEmprunt: 'Montant emprunté',
    montantAchat: 'Prix d\'achat',
    duree: 'Durée',
    dureeEmprunt: 'Durée du prêt',
    taux: 'Taux d\'intérêt',
    tauxNominal: 'Taux nominal',
    tauxAssurance: 'Taux assurance',
    apport: 'Apport personnel',
    mensualite: 'Mensualité',
    mensualiteHorsAssurance: 'Mensualité hors assurance',
    mensualiteAvecAssurance: 'Mensualité avec assurance',
    coutTotal: 'Coût total du crédit',
    coutTotalCredit: 'Coût total',
    interetsTotal: 'Total des intérêts',
    capital: 'Capital',
    capitalEmprunte: 'Capital emprunté',
    assurance: 'Assurance',
    coutAssurance: 'Coût de l\'assurance',
    fraisNotaire: 'Frais de notaire',
    fraisDossier: 'Frais de dossier',
    tauxEndettement: 'Taux d\'endettement',
    capaciteEmprunt: 'Capacité d\'emprunt',
    resteAVivre: 'Reste à vivre',
    economieImpot: 'Économie d\'impôt',
    rendementBrut: 'Rendement brut',
    rendementNet: 'Rendement net',
    cashflow: 'Cash-flow mensuel',
    tri: 'TRI',
    van: 'VAN',
  }
  return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
}

// ============================================================
// ENTRÉE EN RELATION PDF
// ============================================================
async function generateEntreeRelationPdf(clientId: string, cabinetId: string, overrideData?: Partial<EntreeRelationData>): Promise<string> {
  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId },
    include: {
      conseiller: { select: { firstName: true, lastName: true, email: true, phone: true } },
    },
  })
  if (!client) throw new Error('Client non trouvé')

  const cabinet = await prisma.cabinet.findUnique({ where: { id: cabinetId } })
  if (!cabinet) throw new Error('Cabinet non trouvé')

  const address = client.address as any

  const data: EntreeRelationData = {
    reference: `DER-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${clientId.slice(-4).toUpperCase()}`,
    date: new Date(),
    client: {
      civilite: client.civilite || undefined,
      nom: client.lastName,
      prenom: client.firstName,
      dateNaissance: client.birthDate || undefined,
      lieuNaissance: client.birthPlace || undefined,
      nationalite: client.nationality || undefined,
      adresse: address?.street || undefined,
      codePostal: address?.postalCode || undefined,
      ville: address?.city || undefined,
      email: client.email || undefined,
      telephone: client.phone || (client as any).mobilePhone || undefined,
      profession: client.profession || undefined,
      situationFamiliale: client.maritalStatus || undefined,
      regimeMatrimonial: client.matrimonialRegime || client.marriageRegime || undefined,
    },
    conseiller: {
      nom: client.conseiller?.lastName || '',
      prenom: client.conseiller?.firstName || '',
      email: client.conseiller?.email || undefined,
      telephone: client.conseiller?.phone || undefined,
    },
    cabinet: {
      nom: cabinet.name,
      adresse: (cabinet as any).address || undefined,
      siret: (cabinet as any).siret || undefined,
      orias: (cabinet as any).orias || undefined,
      email: (cabinet as any).email || undefined,
      telephone: (cabinet as any).phone || undefined,
    },
    statuts: {
      cif: true,
      iobsp: false,
      ias: true,
      cjA: true,
    },
    remuneration: {
      honoraires: true,
      commissions: true,
      retrocessions: true,
    },
    ...overrideData,
  }

  return generateEntreeRelationHtml(data)
}

function getParamUnit(key: string): string | undefined {
  const lowerKey = key.toLowerCase()
  if (lowerKey.includes('montant') || lowerKey.includes('capital') || lowerKey.includes('mensualite') || 
      lowerKey.includes('cout') || lowerKey.includes('apport') || lowerKey.includes('frais') ||
      lowerKey.includes('economie') || lowerKey.includes('cashflow') || lowerKey.includes('reste') ||
      lowerKey.includes('capacite') || lowerKey.includes('van') || lowerKey.includes('loyer')) {
    return '€'
  }
  if (lowerKey.includes('taux') || lowerKey.includes('rendement') || lowerKey.includes('tri')) return '%'
  if (lowerKey.includes('duree') && !lowerKey.includes('annee')) return 'mois'
  if (lowerKey.includes('annee')) return 'ans'
  return undefined
}
