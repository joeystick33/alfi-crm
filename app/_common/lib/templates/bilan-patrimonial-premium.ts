/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  premiumReportStyles,
  generateDonutChart,
  generateGauge,
  generateRadarChart,
  generateWaterfallChart,
  generateHorizontalBarChart,
  generateProjectionChart,
  generateStackedComparison,
  generateKpiCard,
  generateScoreBadge,
} from './pdf-styles-premium'

export interface BilanPatrimonialPremiumData {
  dossier: {
    id: string
    reference: string
    type: string
    categorie?: string
    createdAt: Date
  }
  client: {
    nom: string
    prenom: string
    dateNaissance?: Date | null
    age?: number
    situationFamiliale?: string
    regimeMatrimonial?: string
    enfants?: number
    profession?: string
    email?: string
    telephone?: string
  }
  conseiller?: {
    nom: string
    prenom: string
    email?: string
    telephone?: string
  }
  cabinet?: {
    nom: string
    adresse?: string
    telephone?: string
    email?: string
    logo?: string
    siren?: string
    opiasNumber?: string
    cifNumber?: string
    rcpAssureur?: string
    mediateur?: string
  }
  patrimoine: {
    immobilier: Array<{
      type: string
      nom: string
      valeur: number
      location?: string
    }>
    financier: Array<{
      type: string
      nom: string
      valeur: number
    }>
    professionnel: Array<{
      nom: string
      valeur: number
    }>
    passifs: Array<{
      type: string
      nom: string
      capitalRestant: number
      tauxInteret: number
      mensualite: number
    }>
  }
  revenus: {
    total: number
    details?: Array<{
      type: string
      montant: number
      frequence: string
    }>
  }
  charges: {
    total: number
    totalMensualitesCredits: number
  }
  simulations?: Array<{
    type: string
    nom: string
    parametres: any
    resultats: any
  }>
  preconisations?: Array<{
    titre: string
    description: string
    priorite: 'HAUTE' | 'MOYENNE' | 'BASSE'
    produit?: string
    montantEstime?: number
    objectif?: string
    risques?: string
    avantages?: string
    categorie?: string
    horizonTemporel?: 'court' | 'moyen' | 'long'
    impactFiscalAnnuel?: number
    scoreImpact?: number
  }>
  audit?: {
    dateAudit?: string
    nomClient?: string
    budget?: {
      revenusMensuels: number
      chargesMensuelles: number
      mensualitesCredits: number
      resteAVivre: number
      capaciteEpargneMensuelle: number
      capaciteEpargneAnnuelle: number
      tauxEffort: number
      tauxEpargne: number
      scoreSante: string
      narratif: string
      alertes: string[]
      detailRevenus: { categorie: string; montant: number; poids: number }[]
      detailCharges: { categorie: string; montant: number; poids: number }[]
      repartitionIdeale?: { categorie: string; actuel: number; recommande: number }[]
    }
    emprunt?: {
      tauxEndettementActuel: number
      capaciteEndettementResiduelle: number
      mensualiteMaxSupportable: number
      enveloppes: { duree: number; tauxInteret: number; montantMax: number; interetsTotal?: number }[]
      narratif: string
    }
    fiscalite?: {
      ir?: {
        revenuBrut: number; deductions: number; revenuImposable: number
        nombreParts: number; quotientFamilial: number
        impotBrut: number; plafonnementQF: number; decote: number; cehr: number; impotTotal: number
        contributionsSociales: number; tmi: number; tauxEffectif: number
        tranches: { taux: number; base: number; impot: number }[]
        revenuNetApresImpot: number; narratif: string
      } | null
      ifi?: { patrimoineImmobilierBrut: number; abattementRP: number; dettesDeductibles: number; patrimoineImposable: number; montantIFI: number; assujetti: boolean; narratif: string } | null
      impactRevenusFonciers?: { revenusFonciersAnnuels: number; regimeFiscal: string; baseImposable: number; irFoncier: number; psFoncier: number; totalFiscaliteFonciere: number; tauxImpositionGlobal: number; narratif: string } | null
      optimisation?: { economiesPotentielles: number; strategies: { nom: string; description: string; economie: number; priorite: string; detailMiseEnOeuvre: string }[] } | null
      narratif: string
    }
    epargnePrecaution?: {
      montantCible: number
      epargneLiquideActuelle: number
      gap: number
      priorite: string
      narratif: string
      detailEpargneLiquide?: { support: string; montant: number }[]
      moisCouverts?: number
      planConstitution?: { moisEpargne: number; montantMensuel: number } | null
    }
    immobilier?: {
      totalImmobilier: number
      poidsPatrimoine: number
      patrimoineImmobilierNet: number
      cashFlowGlobalMensuel: number
      concentrationRisque: boolean
      biens: Array<{
        nom: string; type: string; valeur: number; poidsPatrimoine: number
        loyerMensuel?: number; chargesAnnuelles?: number; cashFlowMensuel?: number; tri?: number
        rendementLocatifBrut: number | null; rendementLocatifNet: number | null
        scenarioRevente: { horizons: { annees: number; prixEstime: number; plusValueBrute: number; totalFiscalite: number; netVendeur: number; gainNetTotal: number }[]; narratif: string } | null
        fiscaliteLocative?: { regimeFiscal: string; tauxImpositionGlobal: number; totalAnnuel: number }
        analyse: string
      }>
      narratif: string
    }
    financier?: {
      totalFinancier: number
      scoreDiversification: number
      scoreRisque: number
      allocationParType: { type: string; valeur: number; poids: number }[]
      allocationParRisque: { risque: string; valeur: number; poids: number }[]
      allocationParLiquidite: { liquidite: string; valeur: number; poids: number }[]
      recommandationAllocation: { categorie: string; actuel: number; cible: number; ecart: number }[]
      actifs: Array<{
        nom: string; type: string; valeur: number; poidsPatrimoine: number; poidsPortefeuille: number
        risque: string; liquidite: string; enveloppeFiscale: string; commentaire: string
      }>
      narratif: string
    }
    retraite?: {
      ageActuel: number
      estimationPension: {
        pensionBaseMensuelle: number; pensionComplementaireMensuelle: number; pensionTotaleMensuelle: number
        tauxRemplacement: number; trimestresValides: number; trimestresRestants: number
        trimestresRequis: number; trimestresManquants: number
        decoteSurcote: number; decoteSurcoteLabel: string
        pointsComplementaires: number; valeurPoint: number
      }
      evolutionParAge: { age: number; trimestres: number; trimestresManquants: number; decoteSurcotePct: number; decoteSurcoteLabel: string; pensionMensuelle: number; tauxRemplacement: number; differenceVsChoisi: number; estChoisi: boolean; estOptimal: boolean }[]
      analyseGap: { revenuSouhaite: number; pensionEstimee: number; gapMensuel: number; capitalNecessaire4Pct: number; narratif: string }
      detailEpargneRetraite: { support: string; montant: number }[]
      epargneRetraiteActuelle: number
      scenarios: Array<{
        label: string; rendement: number; ageDepart: number
        capitalRetraite: number; revenuDurable: number; gapMensuel: number
        capitalEpuiseAge: number | null; faisable: boolean
      }>
      recommandations: { priorite: string; description: string }[]
      narratif: string
    } | null
    succession?: {
      patrimoineNetTaxable: number
      situationFamiliale: string
      regimeMatrimonial: string
      nbEnfants: number
      droitsEstimes: number
      tauxEffectif: number
      abattementTotal: number
      detailParHeritier: { lien: string; partBrute: number; abattement: number; taxable: number; droits: number; tauxEffectif: number; tranches: { taux: number; base: number; impot: number }[] }[]
      impactAssuranceVie?: { totalAV: number; versementsAvant70: number; versementsApres70: number; abattement990I: number; taxable990I: number; droits990I: number; abattement757B: number; taxable757B: number; droits757B: number; droitsTotalAV: number; economieVsDMTG: number; narratif: string } | null
      strategiesOptimisation: { strategie: string; description: string; economieEstimee: number; priorite: string; detailMiseEnOeuvre: string }[]
      narratif: string
    }
    synthese?: {
      scoreGlobal: number
      scores: { theme: string; score: number; verdict: string; couleur: string; commentaire: string }[]
      pointsForts: string[]
      pointsVigilance: string[]
      actionsPrioritaires: string[]
      narratifGlobal: string
    }
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

function calculateAge(birthDate: Date | null | undefined): number {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// ============================================================================
// FONCTIONS D'ANALYSE AUTOMATIQUE
// ============================================================================

function generateDiagnosticPatrimonial(params: {
  totalActifs: number
  totalPassifs: number
  patrimoineNet: number
  tauxEndettement: number
  capaciteEpargne: number
  totalImmobilier: number
  totalFinancier: number
  revenus: number
  age: number
  enfants: number
  situationFamiliale?: string
}): string {
  const { totalActifs, totalPassifs, patrimoineNet, tauxEndettement, capaciteEpargne, totalImmobilier, totalFinancier, revenus, age, enfants, situationFamiliale } = params
  
  const analyses: string[] = []
  
  // Analyse du patrimoine global
  if (patrimoineNet > 1000000) {
    analyses.push(`Votre patrimoine net de ${formatCurrency(patrimoineNet)} vous place dans une situation financière confortable. Cette assise patrimoniale solide vous offre une marge de manœuvre importante pour diversifier vos placements et optimiser votre fiscalité.`)
  } else if (patrimoineNet > 300000) {
    analyses.push(`Avec un patrimoine net de ${formatCurrency(patrimoineNet)}, vous disposez d'une base patrimoniale saine qui mérite d'être développée et optimisée. L'enjeu principal réside dans la diversification de vos actifs et la constitution d'une épargne de précaution adaptée.`)
  } else if (patrimoineNet > 0) {
    analyses.push(`Votre patrimoine net de ${formatCurrency(patrimoineNet)} constitue un premier socle qu'il convient de consolider. La priorité devrait être donnée à la constitution d'une épargne de précaution et à la réduction progressive de votre endettement.`)
  } else {
    analyses.push(`Votre situation patrimoniale actuelle présente un endettement net de ${formatCurrency(Math.abs(patrimoineNet))}. Il est essentiel de mettre en place une stratégie de désendettement progressive tout en maintenant une capacité d'épargne minimale.`)
  }

  // Analyse de l'endettement
  if (tauxEndettement > 50) {
    analyses.push(`Votre taux d'endettement de ${tauxEndettement.toFixed(1)}% est élevé et nécessite une attention particulière. Nous recommandons de prioriser le remboursement anticipé des crédits les plus coûteux et d'éviter tout nouvel engagement à court terme.`)
  } else if (tauxEndettement > 33) {
    analyses.push(`Avec un taux d'endettement de ${tauxEndettement.toFixed(1)}%, vous êtes proche du seuil communément admis de 33%. Une gestion prudente de vos engagements est recommandée avant tout nouveau projet d'investissement.`)
  } else if (tauxEndettement > 0) {
    analyses.push(`Votre taux d'endettement de ${tauxEndettement.toFixed(1)}% reste maîtrisé et vous laisse une capacité d'emprunt significative pour d'éventuels projets futurs.`)
  }

  // Analyse de la répartition
  const tauxImmo = totalActifs > 0 ? (totalImmobilier / totalActifs) * 100 : 0
  const tauxFinancier = totalActifs > 0 ? (totalFinancier / totalActifs) * 100 : 0

  if (tauxImmo > 80) {
    analyses.push(`Votre patrimoine est fortement concentré sur l'immobilier (${tauxImmo.toFixed(0)}%). Cette situation génère un risque de liquidité en cas de besoin urgent et une exposition importante aux fluctuations du marché immobilier. Nous recommandons de diversifier progressivement vers des actifs financiers plus liquides.`)
  } else if (tauxImmo > 60) {
    analyses.push(`La part immobilière de votre patrimoine (${tauxImmo.toFixed(0)}%) est significative. Si ce positionnement offre une certaine stabilité, il serait judicieux de renforcer la composante financière pour améliorer la liquidité globale de votre patrimoine.`)
  } else if (tauxFinancier > 80) {
    analyses.push(`Votre patrimoine est principalement composé d'actifs financiers (${tauxFinancier.toFixed(0)}%). Cette allocation offre une bonne liquidité mais pourrait bénéficier d'une diversification vers l'immobilier pour profiter de l'effet de levier du crédit et des avantages fiscaux associés.`)
  }

  // Analyse de la capacité d'épargne
  if (capaciteEpargne > 0) {
    const tauxEpargne = revenus > 0 ? (capaciteEpargne / revenus) * 100 : 0
    if (tauxEpargne > 20) {
      analyses.push(`Votre capacité d'épargne annuelle de ${formatCurrency(capaciteEpargne)} (${tauxEpargne.toFixed(0)}% de vos revenus) est excellente. Cette marge de manœuvre vous permet d'envisager des placements à moyen et long terme avec sérénité.`)
    } else if (tauxEpargne > 10) {
      analyses.push(`Votre capacité d'épargne de ${formatCurrency(capaciteEpargne)} représente ${tauxEpargne.toFixed(0)}% de vos revenus, ce qui constitue un effort d'épargne correct qu'il conviendrait d'optimiser via des versements programmés.`)
    } else {
      analyses.push(`Votre capacité d'épargne de ${formatCurrency(capaciteEpargne)} reste modeste. Il serait pertinent d'analyser vos postes de dépenses pour identifier des économies potentielles et améliorer votre capacité d'investissement.`)
    }
  } else {
    analyses.push(`Votre budget présente actuellement un déficit de ${formatCurrency(Math.abs(capaciteEpargne))} par an. Il est impératif de rééquilibrer votre budget avant d'envisager de nouveaux investissements.`)
  }

  // Analyse selon l'âge et la situation familiale
  if (age < 35) {
    analyses.push(`À ${age} ans, vous êtes dans une phase de constitution patrimoniale. C'est le moment idéal pour profiter de l'effet temps sur les placements long terme et maximiser l'utilisation de l'effet de levier du crédit immobilier.`)
  } else if (age < 50) {
    analyses.push(`À ${age} ans, vous êtes dans une phase de développement patrimonial. L'enjeu est de diversifier vos actifs tout en préparant progressivement votre retraite via des dispositifs adaptés (PER, assurance-vie).`)
  } else if (age < 60) {
    analyses.push(`À ${age} ans, la préparation de votre retraite devient prioritaire. Il est temps de sécuriser progressivement vos placements et d'optimiser la transmission de votre patrimoine.`)
  } else {
    analyses.push(`À ${age} ans, la gestion de votre patrimoine doit privilégier la sécurité et les revenus complémentaires. L'optimisation de la transmission et la protection du conjoint ${situationFamiliale?.toLowerCase().includes('marié') ? 'sont essentielles' : 'mérite attention'}.`)
  }

  if (enfants > 0) {
    analyses.push(`Avec ${enfants} enfant${enfants > 1 ? 's' : ''}, la question de la transmission patrimoniale et de la protection familiale doit être intégrée à votre stratégie globale. Les donations et l'assurance-vie constituent des outils privilégiés à considérer.`)
  }

  return analyses.join('\n\n')
}

type Preco = {
  titre: string; description: string; priorite: 'HAUTE' | 'MOYENNE' | 'BASSE'
  produit?: string; montantEstime?: number; objectif?: string; risques?: string
  avantages?: string; categorie?: string; horizonTemporel?: 'court' | 'moyen' | 'long'
  impactFiscalAnnuel?: number; scoreImpact?: number
}

function generateRecommandationsAuto(params: {
  tauxEndettement: number; capaciteEpargne: number; tauxImmo: number
  tauxFinancier: number; age: number; revenus: number; patrimoineNet: number
  audit?: BilanPatrimonialPremiumData['audit']
}): Preco[] {
  const { tauxEndettement, capaciteEpargne, tauxImmo, tauxFinancier, age, revenus, patrimoineNet, audit } = params
  const recs: Preco[] = []

  // ── 1. ENDETTEMENT ──
  if (tauxEndettement > 40) {
    const mens = audit?.emprunt?.mensualiteMaxSupportable ?? 0
    recs.push({
      titre: 'Restructuration urgente de l\'endettement',
      description: `Votre taux d'endettement de ${tauxEndettement.toFixed(1)}% dépasse le seuil HCSF de 35%. Avec des mensualités de ${formatCurrency(mens)}, nous recommandons un regroupement de crédits pour retrouver une capacité résiduelle et respecter les normes prudentielles.`,
      priorite: 'HAUTE', objectif: 'Ramener le taux d\'endettement sous 33% (norme HCSF)',
      categorie: 'Endettement', horizonTemporel: 'court',
      produit: 'Regroupement de crédits / Renégociation',
      montantEstime: mens > 0 ? Math.round(mens * 12 * 0.15) : undefined,
      avantages: 'Réduction des mensualités, amélioration du reste à vivre, conformité HCSF',
      risques: 'Allongement de la durée totale, coût du crédit potentiellement plus élevé',
      scoreImpact: 90
    })
  } else if (tauxEndettement > 33) {
    recs.push({
      titre: 'Surveillance de l\'endettement',
      description: `Votre taux d'endettement de ${tauxEndettement.toFixed(1)}% est à la limite du seuil HCSF. Envisagez des remboursements anticipés si la trésorerie le permet.`,
      priorite: 'MOYENNE', objectif: 'Maintenir le taux sous 33%',
      categorie: 'Endettement', horizonTemporel: 'court', scoreImpact: 65
    })
  }

  // ── 2. ÉPARGNE DE PRÉCAUTION ──
  if (audit?.epargnePrecaution) {
    const ep = audit.epargnePrecaution
    const manque = ep.gap > 0 ? ep.gap : (ep.montantCible - ep.epargneLiquideActuelle)
    if (manque > 0) {
      const plan = ep.planConstitution ? ` Plan proposé : ${formatCurrency(ep.planConstitution.montantMensuel)}/mois pendant ${ep.planConstitution.moisEpargne} mois.` : ''
      const moisCouv = ep.moisCouverts ?? 0
      recs.push({
        titre: 'Constitution de l\'épargne de précaution',
        description: `Votre épargne de précaution de ${formatCurrency(ep.epargneLiquideActuelle)} ne couvre que ${moisCouv.toFixed(1)} mois de charges. Objectif : ${formatCurrency(ep.montantCible)}. Manque : ${formatCurrency(manque)}.${plan}`,
        priorite: ep.priorite === 'critical' || ep.priorite === 'high' ? 'HAUTE' : 'MOYENNE',
        objectif: `Atteindre ${formatCurrency(ep.montantCible)}`,
        categorie: 'Épargne', horizonTemporel: 'court',
        produit: 'Livret A + LDDS (3% net, liquidité immédiate)',
        montantEstime: manque,
        avantages: 'Liquidité immédiate, rendement garanti net d\'impôt',
        risques: 'Rendement réel potentiellement négatif si inflation élevée',
        scoreImpact: ep.priorite === 'critical' ? 95 : 75
      })
    }
  } else if (capaciteEpargne > 0) {
    const obj = revenus * 0.5
    recs.push({
      titre: 'Constitution d\'une épargne de précaution',
      description: `Constituez 6 mois de revenus (~${formatCurrency(obj)}) sur supports liquides sécurisés.`,
      priorite: 'MOYENNE', objectif: 'Sécuriser 6 mois de charges', categorie: 'Épargne',
      horizonTemporel: 'court', produit: 'Livret A + LDDS', montantEstime: obj, scoreImpact: 70
    })
  }

  // ── 3. FISCALITÉ — PER + Optimisation IR ──
  if (audit?.fiscalite?.ir) {
    const ir = audit.fiscalite.ir
    const tmi = ir.tmi; const irEst = ir.impotTotal ?? 0
    if (tmi >= 30 && irEst > 5000) {
      const plafond = tmi >= 41 ? 32419 : 10000
      const eco = Math.round(plafond * tmi / 100)
      recs.push({
        titre: `Optimisation fiscale via PER (TMI ${tmi}%)`,
        description: `TMI à ${tmi}% et IR estimé ${formatCurrency(irEst)} : versements PER déductibles (art. 163 quatervicies CGI). Plafond estimé ${formatCurrency(plafond)}, économie IR ~${formatCurrency(eco)}/an.`,
        priorite: tmi >= 41 ? 'HAUTE' : 'MOYENNE',
        objectif: `Réduire l'IR de ${formatCurrency(eco)}/an`, categorie: 'Fiscalité',
        horizonTemporel: 'court', produit: 'PER individuel', montantEstime: plafond,
        impactFiscalAnnuel: eco,
        avantages: `Déduction à ${tmi}%, capital retraite, sortie en capital possible`,
        risques: 'Capital bloqué jusqu\'à la retraite, fiscalité à la sortie', scoreImpact: tmi >= 41 ? 90 : 75
      })
    }
    if (audit.fiscalite.optimisation?.strategies?.length) {
      const s = audit.fiscalite.optimisation.strategies[0]
      if (s && !recs.some(r => r.categorie === 'Fiscalité')) {
        recs.push({
          titre: s.nom, description: s.description,
          priorite: s.priorite === 'high' ? 'HAUTE' : s.priorite === 'medium' ? 'MOYENNE' : 'BASSE',
          objectif: `Économie ~${formatCurrency(s.economie ?? 0)}/an`, categorie: 'Fiscalité',
          horizonTemporel: 'moyen', impactFiscalAnnuel: s.economie, scoreImpact: 70
        })
      }
    }
  }

  // ── 4. IFI ──
  if (audit?.fiscalite?.ifi?.assujetti) {
    const ifi = audit.fiscalite.ifi
    recs.push({
      titre: 'Réduction de l\'IFI',
      description: `Patrimoine immobilier imposable ${formatCurrency(ifi.patrimoineImposable)}, IFI estimé ${formatCurrency(ifi.montantIFI)}. Stratégies : donation temporaire d'usufruit (art. 669 CGI), nue-propriété, arbitrage vers actifs financiers non assujettis.`,
      priorite: ifi.montantIFI > 5000 ? 'HAUTE' : 'MOYENNE',
      objectif: `Réduire l'IFI de ${formatCurrency(ifi.montantIFI)}`, categorie: 'Fiscalité',
      horizonTemporel: 'moyen', produit: 'Donation usufruit / Nue-propriété / PEA-AV',
      impactFiscalAnnuel: ifi.montantIFI,
      avantages: 'Réduction directe IFI, préparation transmission',
      risques: 'Perte jouissance temporaire, risque marchés financiers', scoreImpact: 80
    })
  }

  // ── 5. DIVERSIFICATION ──
  if (tauxImmo > 70) {
    recs.push({
      titre: 'Rééquilibrage patrimonial — Diversification financière',
      description: `Patrimoine concentré à ${tauxImmo.toFixed(0)}% sur l'immobilier : risque de liquidité et concentration. Rééquilibrage progressif vers allocation cible 60/40 immo/financier.`,
      priorite: tauxImmo > 85 ? 'HAUTE' : 'MOYENNE',
      objectif: 'Allocation 60% immo / 40% financier', categorie: 'Allocation',
      horizonTemporel: 'moyen', produit: 'Assurance-vie multisupport + PEA',
      montantEstime: Math.round(patrimoineNet * 0.15),
      avantages: 'Meilleure liquidité, diversification risque, fiscalité AV/PEA avantageuse',
      risques: 'Volatilité marchés, timing cession immo', scoreImpact: tauxImmo > 85 ? 80 : 65
    })
  } else if (tauxFinancier > 80 && patrimoineNet > 100000) {
    recs.push({
      titre: 'Diversification vers l\'immobilier',
      description: `Patrimoine à ${tauxFinancier.toFixed(0)}% financier. L'immobilier locatif via SCPI ou en direct offre effet de levier du crédit, revenus réguliers et avantages fiscaux.`,
      priorite: 'MOYENNE', objectif: 'Introduire 20-30% d\'immobilier', categorie: 'Allocation',
      horizonTemporel: 'moyen', produit: 'SCPI / Immobilier locatif direct',
      montantEstime: Math.round(patrimoineNet * 0.2),
      avantages: 'Effet de levier, revenus complémentaires, réduction base imposable',
      risques: 'Illiquidité, vacance locative, frais d\'entrée SCPI', scoreImpact: 65
    })
  }

  // ── 6. RETRAITE ──
  if (audit?.retraite) {
    const ret = audit.retraite
    const gap = ret.analyseGap?.gapMensuel ?? 0
    if (gap > 0 && age >= 35 && age < 62) {
      const annees = Math.max(1, 62 - age)
      const effortMensuel = Math.round((gap * 12) / annees / 12)
      const pensionEst = ret.estimationPension?.pensionTotaleMensuelle ?? 0
      recs.push({
        titre: 'Combler le gap retraite',
        description: `Gap estimé de ${formatCurrency(gap)}/mois entre revenus actuels et pension estimée (${formatCurrency(pensionEst)}/mois). ${annees} ans avant l'âge légal : effort d'épargne complémentaire de ~${formatCurrency(effortMensuel)}/mois recommandé.`,
        priorite: age >= 50 ? 'HAUTE' : 'MOYENNE',
        objectif: `Combler ${formatCurrency(gap)}/mois de gap retraite`, categorie: 'Retraite',
        horizonTemporel: 'long', produit: 'PER + Assurance-vie',
        montantEstime: effortMensuel * 12,
        avantages: 'Revenus complémentaires garantis, déduction fiscale PER',
        risques: 'Hypothèses pension susceptibles d\'évoluer', scoreImpact: age >= 50 ? 85 : 70
      })
    }
  } else if (age >= 40 && age < 60) {
    recs.push({
      titre: 'Préparation retraite', description: 'Renforcez votre épargne retraite via PER et assurance-vie.',
      priorite: age >= 50 ? 'HAUTE' : 'MOYENNE', objectif: 'Préparer la retraite',
      categorie: 'Retraite', horizonTemporel: 'long', produit: 'PER + AV', scoreImpact: 70
    })
  }

  // ── 7. SUCCESSION ──
  if (audit?.succession) {
    const succ = audit.succession
    const droitsEst = succ.droitsEstimes ?? 0
    if (droitsEst > 10000) {
      recs.push({
        titre: 'Optimisation successorale',
        description: `DMTG estimés à ${formatCurrency(droitsEst)} sur un patrimoine net taxable de ${formatCurrency(succ.patrimoineNetTaxable)}. Stratégies recommandées : donations anticipées (abattements renouvelables tous les 15 ans), démembrement de propriété, assurance-vie (art. 990 I CGI — abattement 152 500 €/bénéficiaire).`,
        priorite: droitsEst > 50000 ? 'HAUTE' : 'MOYENNE',
        objectif: `Réduire les DMTG de ${formatCurrency(Math.round(droitsEst * 0.3))}`,
        categorie: 'Transmission', horizonTemporel: 'long',
        produit: 'Donations / Démembrement / Assurance-vie',
        montantEstime: Math.round(droitsEst * 0.3),
        avantages: 'Réduction significative des droits, anticipation de la transmission, effet cliquet des abattements',
        risques: 'Irrévocabilité des donations, risque de requalification', scoreImpact: droitsEst > 50000 ? 90 : 70
      })
    }
  }

  // ── 8. PROTECTION FAMILIALE ──
  recs.push({
    titre: 'Audit de la protection familiale',
    description: 'Vérification de l\'adéquation des contrats de prévoyance (décès, invalidité, incapacité) avec votre situation actuelle, vos charges et vos personnes à charge.',
    priorite: 'BASSE', objectif: 'Sécuriser la famille en cas d\'aléa',
    categorie: 'Prévoyance', horizonTemporel: 'court', scoreImpact: 50
  })

  // Trier par scoreImpact décroissant, max 8
  return recs.sort((a, b) => (b.scoreImpact ?? 0) - (a.scoreImpact ?? 0)).slice(0, 8)
}

/**
 * Render préconisation pages for the PDF, paginated (max 3 per page to respect A4).
 */
function renderPreconisationPages(
  preconisations: Array<any>,
  fmtCurrency: (v: number) => string,
  pageLabel: string = '',
): string {
  if (!preconisations || preconisations.length === 0) return ''

  const PER_PAGE = 3
  const pages: string[] = []

  for (let pageIdx = 0; pageIdx < Math.ceil(preconisations.length / PER_PAGE); pageIdx++) {
    const slice = preconisations.slice(pageIdx * PER_PAGE, (pageIdx + 1) * PER_PAGE)
    const isFirst = pageIdx === 0

    const cards = slice.map((preco: any, sliceIdx: number) => {
      const index = pageIdx * PER_PAGE + sliceIdx
      const prio = (preco.priorite || 'MOYENNE').toLowerCase()

      return `
      <div class="preco-card priority-${prio}" style="page-break-inside: avoid; margin-bottom: 14px;">
        <div class="preco-header">
          <div style="display: flex; align-items: flex-start; gap: 10px;">
            <div class="preco-number">${index + 1}</div>
            <div>
              <div class="preco-title">${preco.titre}</div>
              <div style="display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                ${preco.categorie ? `<span style="font-size: 7pt; padding: 2px 8px; border-radius: 100px; background: rgba(99,102,241,0.1); color: #6366f1; font-weight: 600;">${preco.categorie}</span>` : ''}
                ${preco.horizonTemporel ? `<span style="font-size: 7pt; padding: 2px 8px; border-radius: 100px; background: #f1f5f9; color: #64748b; font-weight: 500;">${preco.horizonTemporel === 'court' ? '⚡ Court terme' : preco.horizonTemporel === 'moyen' ? '📅 Moyen terme' : '🎯 Long terme'}</span>` : ''}
              </div>
            </div>
          </div>
          <span class="preco-priority priority-${prio}">
            ${preco.priorite === 'HAUTE' ? '⚡ Prioritaire' : preco.priorite === 'MOYENNE' ? '📌 Recommandé' : '📋 À considérer'}
          </span>
        </div>
        
        <p class="preco-description">${preco.description}</p>
        
        ${preco.produit || preco.montantEstime || preco.objectif || preco.impactFiscalAnnuel ? `
          <div class="preco-details">
            ${preco.produit ? `<div class="preco-detail"><span class="preco-detail-label">Produit / support</span><span class="preco-detail-value">${preco.produit}</span></div>` : ''}
            ${preco.montantEstime ? `<div class="preco-detail"><span class="preco-detail-label">Montant estimé</span><span class="preco-detail-value" style="font-weight: 800; color: #0f172a;">${fmtCurrency(preco.montantEstime)}</span></div>` : ''}
            ${preco.impactFiscalAnnuel ? `<div class="preco-detail"><span class="preco-detail-label">Impact fiscal estimé</span><span class="preco-detail-value" style="font-weight: 800; color: #10b981;">+${fmtCurrency(preco.impactFiscalAnnuel)}/an</span></div>` : ''}
            ${preco.objectif ? `<div class="preco-detail"><span class="preco-detail-label">Objectif visé</span><span class="preco-detail-value">${preco.objectif}</span></div>` : ''}
          </div>
        ` : ''}
        
        <div style="display: flex; gap: 10px; margin-top: 8px;">
          ${preco.avantages ? `
            <div style="flex: 1; padding: 8px 10px; background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.15); border-radius: 8px;">
              <div style="font-size: 8pt; font-weight: 700; color: #10b981; margin-bottom: 3px;">✓ Avantages</div>
              <div style="font-size: 8.5pt; color: #065f46; line-height: 1.4;">${preco.avantages}</div>
            </div>
          ` : ''}
          ${preco.risques ? `
            <div style="flex: 1; padding: 8px 10px; background: rgba(239,68,68,0.04); border: 1px solid rgba(239,68,68,0.12); border-radius: 8px;">
              <div style="font-size: 8pt; font-weight: 700; color: #ef4444; margin-bottom: 3px;">⚠ Risques</div>
              <div style="font-size: 8.5pt; color: #991b1b; line-height: 1.4;">${preco.risques}</div>
            </div>
          ` : ''}
        </div>

        ${preco.scoreImpact ? `
        <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 8pt; color: #64748b;">Impact estimé</span>
          <div style="flex: 1; background: #e2e8f0; border-radius: 100px; height: 6px; overflow: hidden;">
            <div style="height: 100%; border-radius: 100px; width: ${Math.min(preco.scoreImpact, 100)}%; background: linear-gradient(90deg, #3b82f6, #8b5cf6);"></div>
          </div>
          <span style="font-size: 9pt; font-weight: 700; color: #6366f1;">${preco.scoreImpact}/100</span>
        </div>
        ` : ''}
      </div>`
    }).join('')

    pages.push(`
    <div class="page content-page${isFirst ? ' chapter-break' : ''}" data-page-label="${pageLabel}">
      <div class="page-header">
        <h2 class="page-title">Nos Préconisations${!isFirst ? ' (suite)' : ''}</h2>
      </div>
      ${isFirst ? `<p style="color: #64748b; margin-bottom: 16px; font-size: 10pt; line-height: 1.6;">
        Suite à l'analyse approfondie de votre situation patrimoniale, nous vous recommandons les actions suivantes,
        classées par ordre de priorité et d'impact. Ces préconisations sont personnalisées en fonction de vos données réelles.
      </p>` : ''}
      ${cards}
    </div>`)
  }

  return pages.join('')
}

/**
 * Render per-bien immobilier detail pages for the PDF.
 * Extracted to avoid deeply nested template literal escaping.
 */
function renderBienImmobilierPages(
  biens: Array<{ nom: string; type: string; valeur: number; poidsPatrimoine: number; rendementLocatifBrut?: number; rendementLocatifNet?: number; analyse: string; scenarioRevente?: { horizons: Array<{ annees: number; prixEstime: number; plusValueBrute: number; totalFiscalite: number; netVendeur: number }> } }>,
  totalBiens: number,
  fmtCurrency: (v: number) => string,
  pageLabel: string = '',
  kpiCard: (label: string, value: string, opts?: any) => string,
): string {
  if (!biens || biens.length === 0) return ''

  return biens.map((b, bienIndex) => {
    const horizonsHtml = b.scenarioRevente && b.scenarioRevente.horizons.length > 0
      ? b.scenarioRevente.horizons.map(h => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px; font-size: 10pt; font-weight: 600;">${h.annees} ans</td>
          <td style="padding: 10px; text-align: right; font-size: 10pt; font-weight: 700;">${fmtCurrency(h.prixEstime)}</td>
          <td style="padding: 10px; text-align: right; font-size: 10pt; font-weight: 700; color: #10b981;">+${fmtCurrency(h.plusValueBrute)}</td>
          <td style="padding: 10px; text-align: right; font-size: 10pt; color: #ef4444;">${fmtCurrency(h.totalFiscalite)}</td>
          <td style="padding: 10px; text-align: right; font-size: 11pt; font-weight: 800; color: #3b82f6;">${fmtCurrency(h.netVendeur)}</td>
        </tr>
      `).join('')
      : ''

    const lastHorizon = b.scenarioRevente && b.scenarioRevente.horizons.length > 0
      ? b.scenarioRevente.horizons[b.scenarioRevente.horizons.length - 1]
      : null

    const reventeBlock = b.scenarioRevente && b.scenarioRevente.horizons.length > 0 ? `
      <div class="card">
        <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Scénarios de revente — Plus-value immobilière</div>
        <p style="font-size: 8.5pt; color: #64748b; margin-bottom: 10px; line-height: 1.5;">Simulation basée sur une hypothèse de revalorisation annuelle. La fiscalité tient compte des abattements pour durée de détention (IR : exonération en 22 ans, PS : exonération en 30 ans).</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 10px; text-align: left; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Horizon</th>
              <th style="padding: 10px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Prix estimé</th>
              <th style="padding: 10px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Plus-value brute</th>
              <th style="padding: 10px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Fiscalité PV</th>
              <th style="padding: 10px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Net vendeur</th>
            </tr>
          </thead>
          <tbody>${horizonsHtml}</tbody>
        </table>
        ${lastHorizon ? `
        <div style="margin-top: 10px; padding: 10px; background: rgba(59,130,246,0.04); border-radius: 8px;">
          <p style="font-size: 8.5pt; color: #1e40af; line-height: 1.5; margin: 0;">
            <strong>Horizon optimal :</strong> La revente à ${lastHorizon.annees} ans offre un net vendeur de ${fmtCurrency(lastHorizon.netVendeur)}, grâce aux abattements pour durée de détention progressifs.
          </p>
        </div>
        ` : ''}
      </div>
    ` : ''

    return `
    <div class="page content-page" data-page-label="${pageLabel}">
      <div class="page-header">
        <h2 class="page-title">Bien Immobilier ${bienIndex + 1}/${totalBiens} — ${b.nom}</h2>
      </div>
      <div class="section">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 16px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 16pt; font-weight: 900; color: #0f172a;">${b.nom}</div>
            <div style="display: flex; gap: 8px; margin-top: 6px;">
              <span style="font-size: 8pt; padding: 3px 10px; border-radius: 100px; background: rgba(59,130,246,0.1); color: #3b82f6; font-weight: 600;">${b.type.replace(/_/g, ' ')}</span>
              <span style="font-size: 8pt; padding: 3px 10px; border-radius: 100px; background: #f1f5f9; color: #64748b; font-weight: 600;">${b.poidsPatrimoine.toFixed(1)}% du patrimoine</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 24pt; font-weight: 900; color: #3b82f6;">${fmtCurrency(b.valeur)}</div>
            <div style="font-size: 9pt; color: #64748b;">Valeur estimée</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;">
          ${kpiCard('Valeur', fmtCurrency(b.valeur), { icon: '🏠', sublabel: 'Estimation' })}
          ${kpiCard('Poids', b.poidsPatrimoine.toFixed(1) + '%', { icon: '📊', color: b.poidsPatrimoine > 40 ? '#ef4444' : '#10b981', sublabel: b.poidsPatrimoine > 40 ? 'Concentration élevée' : 'Équilibré' })}
          ${b.rendementLocatifBrut ? kpiCard('Rdt brut', b.rendementLocatifBrut.toFixed(1) + '%', { icon: '📈', color: b.rendementLocatifBrut > 5 ? '#10b981' : '#f59e0b', sublabel: 'Rendement locatif' }) : kpiCard('Rdt brut', '—', { icon: '📈', sublabel: 'Non locatif' })}
          ${b.rendementLocatifNet ? kpiCard('Rdt net', (b.rendementLocatifNet || 0).toFixed(1) + '%', { icon: '💰', sublabel: 'Après charges' }) : kpiCard('Rdt net', '—', { icon: '💰', sublabel: 'N/A' })}
        </div>
        <div class="card" style="margin-bottom: 16px; border-left: 4px solid #6366f1;">
          <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Analyse du bien</div>
          <p style="font-size: 10pt; color: #334155; line-height: 1.7; margin: 0;">${b.analyse}</p>
        </div>
        ${reventeBlock}
      </div>
    </div>
    `
  }).join('')
}

/**
 * Render simulation result pages for the PDF.
 * Extracted as a standalone function to avoid deeply nested template literal escaping issues.
 */
function renderSimulationPages(
  simulations: Array<{ type: string; nom: string; parametres: any; resultats: any }>,
  fmtCurrency: (v: number) => string,
  fmtDate: (d: Date) => string,
  pageLabel: string = '',
  kpiCard: (label: string, value: string, opts?: any) => string,
): string {
  if (!simulations || simulations.length === 0) return ''

  const typeLabels: Record<string, string> = {
    SUCCESSION_SMP: 'Diagnostic Successoral',
    TRANSMISSION_PATRIMOINE: 'Transmission du Patrimoine',
    RETRAITE: 'Simulation Retraite',
    CREDIT_IMMOBILIER: 'Simulation Crédit Immobilier',
    ASSURANCE_VIE: 'Simulation Assurance-Vie',
    OPTIMISATION_FISCALE: 'Optimisation Fiscale',
    PROJECTION_INVESTISSEMENT: "Projection d'Investissement",
    ANALYSE_BUDGET: 'Analyse Budgétaire',
  }

  return simulations.map((sim, simIdx) => {
    const label = typeLabels[sim.type] || sim.type.replace(/_/g, ' ')
    const r = sim.resultats || {}
    const p = sim.parametres || {}

    // ── Succession / Transmission ──
    if (sim.type === 'SUCCESSION_SMP' || sim.type === 'TRANSMISSION_PATRIMOINE') {
      const sc1 = r.scenario1 || r
      const sc2 = r.scenario2
      const patrimoine = r.patrimoine || {}
      const pNet = patrimoine.actifNet ?? sc1.netAsset ?? sc1.actifNet ?? 0
      const masse = sc1.fiscalInheritanceAsset ?? sc1.masseSuccessorale ?? sc1.grossAsset ?? pNet
      const droits = sc1.totalRights ?? sc1.droitsNets ?? sc1.droitsSuccession ?? 0
      const fraisN = r.scenarioMeta?.notaryFees ?? Math.round(masse * 0.02)
      const netTransmis = Math.max(0, masse - droits - fraisN)
      const heirs: any[] = sc1.heirs || sc1.heritiers || []
      const alertes: any[] = r.alertes || []
      const legalScenarios: any[] = r.scenariosLegaux || []

      const heirsTableRows = heirs.map((h: any) => {
        const name = h.name || h.nom || '—'
        const rel = h.relationship || h.lien || '—'
        const quota = ((h.quotaPercentage ?? h.quotaPct ?? 0) as number).toFixed(1)
        const brut = h.grossValueReceived ?? h.montantBrut ?? 0
        const abat = h.abatement ?? h.abattement ?? 0
        const dr = h.rights ?? h.droits ?? 0
        const net = Math.max(0, brut - dr)
        return `<tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px; font-size: 10pt; font-weight: 600; color: #0f172a;">${name}</td>
          <td style="padding: 8px; font-size: 9pt; color: #64748b;">${rel}</td>
          <td style="padding: 8px; text-align: right; font-size: 9pt;">${quota}%</td>
          <td style="padding: 8px; text-align: right; font-size: 10pt; font-weight: 600;">${fmtCurrency(brut)}</td>
          <td style="padding: 8px; text-align: right; font-size: 9pt; color: #10b981;">${fmtCurrency(abat)}</td>
          <td style="padding: 8px; text-align: right; font-size: 10pt; font-weight: 700; color: #ef4444;">${fmtCurrency(dr)}</td>
          <td style="padding: 8px; text-align: right; font-size: 10pt; font-weight: 700; color: #10b981;">${fmtCurrency(net)}</td>
        </tr>`
      }).join('')

      const alertesHtml = alertes.map((a: any) =>
        `<div style="background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; padding: 10px; margin-bottom: 6px; font-size: 9pt; color: #92400e;">
          ⚠️ ${typeof a === 'string' ? a : (a.message || a.description || JSON.stringify(a))}
        </div>`
      ).join('')

      let page1 = `
      <div class="page content-page${simIdx === 0 ? ' chapter-break' : ''}" data-page-label="${pageLabel}">
        <div class="page-header">
          <h2 class="page-title">Simulation ${simIdx + 1} — ${label}</h2>
        </div>

        <div style="background: rgba(99,102,241,0.05); border: 1px solid rgba(99,102,241,0.2); border-radius: 12px; padding: 14px; margin-bottom: 16px;">
          <div style="font-size: 11pt; font-weight: 700; color: #4f46e5; margin-bottom: 4px;">${sim.nom}</div>
          <div style="font-size: 9pt; color: #64748b;">Type : ${label} • Date : ${fmtDate(new Date())}</div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
          ${kpiCard('Patrimoine net', fmtCurrency(pNet), { icon: '🏦', sublabel: 'Valorisation globale' })}
          ${kpiCard('Masse successorale', fmtCurrency(masse), { icon: '📊', sublabel: 'Base taxable' })}
          ${kpiCard('Droits estimés', fmtCurrency(droits), { icon: '🏛', color: '#ef4444', sublabel: 'Taux effectif : ' + (masse > 0 ? (droits / masse * 100).toFixed(1) : '0') + '%' })}
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
          ${kpiCard('Frais de notaire', fmtCurrency(fraisN), { icon: '📝', color: '#f59e0b', sublabel: 'Estimation' })}
          ${kpiCard('Net transmis', fmtCurrency(netTransmis), { icon: '💚', color: '#10b981', sublabel: 'Aux héritiers' })}
          ${kpiCard('Nb héritiers', String(heirs.length || '-'), { icon: '👥', sublabel: 'Bénéficiaires' })}
        </div>

        ${heirs.length > 0 ? `
        <div class="card" style="margin-bottom: 14px;">
          <div class="card-title" style="margin-bottom: 10px;">Répartition entre héritiers — 1er décès</div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead><tr style="background: #f8fafc;">
              <th style="padding: 8px; text-align: left; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Héritier</th>
              <th style="padding: 8px; text-align: left; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Lien</th>
              <th style="padding: 8px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Quote-part</th>
              <th style="padding: 8px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Montant brut</th>
              <th style="padding: 8px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Abattement</th>
              <th style="padding: 8px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Droits</th>
              <th style="padding: 8px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Net reçu</th>
            </tr></thead>
            <tbody>${heirsTableRows}</tbody>
          </table>
        </div>
        ` : ''}

        ${alertes.length > 0 ? `<div style="margin-bottom: 12px;">${alertesHtml}</div>` : ''}
      </div>`

      // ── Page 2: 2nd death + legal scenarios ──
      let page2 = ''
      if (sc2) {
        const droits2 = sc2.totalRights ?? sc2.droitsNets ?? sc2.droitsSuccession ?? 0
        const heirs2: any[] = sc2.heirs || sc2.heritiers || []
        const heirs2Rows = heirs2.map((h: any) => `<tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px; font-weight: 600;">${h.name || h.nom || '—'}</td>
          <td style="padding: 8px; text-align: right;">${((h.quotaPercentage ?? h.quotaPct ?? 0) as number).toFixed(1)}%</td>
          <td style="padding: 8px; text-align: right; font-weight: 600;">${fmtCurrency(h.grossValueReceived ?? h.montantBrut ?? 0)}</td>
          <td style="padding: 8px; text-align: right; font-weight: 700; color: #ef4444;">${fmtCurrency(h.rights ?? h.droits ?? 0)}</td>
        </tr>`).join('')

        const legalRows = legalScenarios.map((ls: any, lsIdx: number) => `<tr style="border-bottom: 1px solid #f1f5f9; ${lsIdx === 0 ? 'background: rgba(16,185,129,0.04);' : ''}">
          <td style="padding: 10px; font-size: 10pt; font-weight: ${lsIdx === 0 ? '700' : '500'}; color: #0f172a;">${ls.name || ls.label || ls.option || '—'}${lsIdx === 0 ? ' <span style="font-size: 7pt; padding: 2px 8px; border-radius: 100px; background: rgba(16,185,129,0.1); color: #10b981; margin-left: 6px;">Recommandé</span>' : ''}</td>
          <td style="padding: 10px; text-align: right; font-size: 11pt; font-weight: 700; color: #ef4444;">${fmtCurrency(ls.droits ?? ls.totalRights ?? 0)}</td>
          <td style="padding: 10px; text-align: right; font-size: 11pt; font-weight: 700; color: #10b981;">${fmtCurrency(ls.netTransmis ?? 0)}</td>
        </tr>`).join('')

        page2 = `
        <div class="page content-page" data-page-label="${pageLabel}">
          <div class="page-header">
            <h2 class="page-title">Simulation ${simIdx + 1} — ${label} (suite)</h2>
          </div>

          <div class="section">
            <div class="section-header">
              <div class="section-icon">👥</div>
              <div>
                <div class="section-title">2nd décès — Conjoint survivant</div>
                <div class="section-subtitle">Impact cumulé des deux décès</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px;">
              ${kpiCard('Droits 2nd décès', fmtCurrency(droits2), { icon: '🏛', color: '#ef4444', sublabel: 'Conjoint décédé' })}
              ${kpiCard('Cumul droits', fmtCurrency(droits + droits2), { icon: '📋', color: '#ef4444', sublabel: '1er + 2nd décès' })}
              ${kpiCard('Net final transmis', fmtCurrency(Math.max(0, masse - droits - droits2 - fraisN)), { icon: '💚', color: '#10b981', sublabel: 'Total famille' })}
            </div>

            ${heirs2.length > 0 ? `
            <div class="card" style="margin-bottom: 14px;">
              <div class="card-title" style="margin-bottom: 10px;">Héritiers — 2nd décès</div>
              <table style="width: 100%; border-collapse: collapse;">
                <thead><tr style="background: #f8fafc;">
                  <th style="padding: 8px; text-align: left; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Héritier</th>
                  <th style="padding: 8px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Quote-part</th>
                  <th style="padding: 8px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Montant brut</th>
                  <th style="padding: 8px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Droits</th>
                </tr></thead>
                <tbody>${heirs2Rows}</tbody>
              </table>
            </div>
            ` : ''}
          </div>

          ${legalScenarios.length > 0 ? `
          <div class="section" style="margin-top: 16px;">
            <div class="section-header">
              <div class="section-icon">⚖️</div>
              <div>
                <div class="section-title">Comparatif des options successorales</div>
                <div class="section-subtitle">Scénarios légaux et donation au dernier vivant</div>
              </div>
            </div>
            <div class="card">
              <table style="width: 100%; border-collapse: collapse;">
                <thead><tr style="background: #f8fafc;">
                  <th style="padding: 10px; text-align: left; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Option</th>
                  <th style="padding: 10px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Droits estimés</th>
                  <th style="padding: 10px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Net transmis</th>
                </tr></thead>
                <tbody>${legalRows}</tbody>
              </table>
            </div>
          </div>
          ` : ''}
        </div>`
      }

      return page1 + page2
    }

    // ── Other simulation types (generic rendering) ──
    const paramEntries = Object.entries(p).filter(([k]) => !k.startsWith('_')).slice(0, 12)
    const resultEntries = Object.entries(r).filter(([k, v]) => !k.startsWith('_') && typeof v !== 'object').slice(0, 16)

    const paramRows = paramEntries.map(([k, v]) =>
      `<div style="display: flex; justify-content: space-between; padding: 6px 10px; background: #f8fafc; border-radius: 6px;">
        <span style="font-size: 9pt; color: #64748b;">${k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
        <span style="font-size: 9pt; font-weight: 600; color: #0f172a;">${typeof v === 'number' ? ((v as number) > 1000 ? fmtCurrency(v as number) : (v as number).toLocaleString('fr-FR')) : String(v ?? '-')}</span>
      </div>`
    ).join('')

    const resultRows = resultEntries.map(([k, v]) =>
      `<div style="display: flex; justify-content: space-between; padding: 8px 10px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #6366f1;">
        <span style="font-size: 9pt; color: #64748b;">${k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
        <span style="font-size: 10pt; font-weight: 700; color: #0f172a;">${typeof v === 'number' ? ((v as number) > 1000 ? fmtCurrency(v as number) : (v as number).toLocaleString('fr-FR')) : String(v ?? '-')}</span>
      </div>`
    ).join('')

    return `
    <div class="page content-page${simIdx === 0 ? ' chapter-break' : ''}" data-page-label="${pageLabel}">
      <div class="page-header">
        <h2 class="page-title">Simulation ${simIdx + 1} — ${label}</h2>
      </div>

      <div style="background: rgba(99,102,241,0.05); border: 1px solid rgba(99,102,241,0.2); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <div style="font-size: 12pt; font-weight: 700; color: #4f46e5; margin-bottom: 4px;">${sim.nom}</div>
        <div style="font-size: 9pt; color: #64748b;">Type : ${label}</div>
      </div>

      ${paramEntries.length > 0 ? `
      <div class="card" style="margin-bottom: 16px;">
        <div class="card-title" style="margin-bottom: 10px;">Paramètres de la simulation</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">${paramRows}</div>
      </div>
      ` : ''}

      ${resultEntries.length > 0 ? `
      <div class="card">
        <div class="card-title" style="margin-bottom: 10px;">Résultats</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">${resultRows}</div>
      </div>
      ` : ''}
    </div>`
  }).join('')
}

export function generateBilanPatrimonialPremiumHtml(data: BilanPatrimonialPremiumData): string {
  const totalImmobilier = data.patrimoine.immobilier.reduce((sum, a) => sum + a.valeur, 0)
  const totalFinancier = data.patrimoine.financier.reduce((sum, a) => sum + a.valeur, 0)
  const totalProfessionnel = data.patrimoine.professionnel.reduce((sum, a) => sum + a.valeur, 0)
  const totalActifs = totalImmobilier + totalFinancier + totalProfessionnel
  const totalPassifs = data.patrimoine.passifs.reduce((sum, p) => sum + p.capitalRestant, 0)
  const patrimoineNet = totalActifs - totalPassifs
  // Fallback: si revenus.total est 0 mais l'audit budget a des revenus, utiliser l'audit
  const revenusAnnuelsEffectifs = data.revenus.total > 0 ? data.revenus.total : (data.audit?.budget?.revenusMensuels ? (data.audit.budget.revenusMensuels * 12) : 0)
  const revenusMensuels = revenusAnnuelsEffectifs / 12
  const tauxEndettement = revenusMensuels > 0 ? (data.charges.totalMensualitesCredits / revenusMensuels) * 100 : 0
  const capaciteEpargne = revenusAnnuelsEffectifs - data.charges.total - data.charges.totalMensualitesCredits * 12
  const clientAge = data.client.age || calculateAge(data.client.dateNaissance)
  
  // Taux de répartition
  const tauxImmo = totalActifs > 0 ? (totalImmobilier / totalActifs) * 100 : 0
  const tauxFinancier = totalActifs > 0 ? (totalFinancier / totalActifs) * 100 : 0

  // Générer le diagnostic automatique
  const diagnosticText = generateDiagnosticPatrimonial({
    totalActifs,
    totalPassifs,
    patrimoineNet,
    tauxEndettement,
    capaciteEpargne,
    totalImmobilier,
    totalFinancier,
    revenus: revenusAnnuelsEffectifs,
    age: clientAge,
    enfants: data.client.enfants || 0,
    situationFamiliale: data.client.situationFamiliale,
  })

  // Générer les recommandations automatiques si aucune n'est fournie
  const preconisations = data.preconisations && data.preconisations.length > 0 
    ? data.preconisations 
    : generateRecommandationsAuto({
        tauxEndettement,
        capaciteEpargne,
        tauxImmo,
        tauxFinancier,
        age: clientAge,
        revenus: revenusAnnuelsEffectifs,
        patrimoineNet,
        audit: data.audit,
      })

  // Couleurs pour les graphiques
  const colors = {
    immobilier: '#3b82f6',
    financier: '#8b5cf6',
    professionnel: '#10b981',
    passifs: '#ef4444',
  }

  // Données pour le donut chart
  const patrimoineChartData = [
    { label: 'Immobilier', value: totalImmobilier, color: colors.immobilier },
    { label: 'Financier', value: totalFinancier, color: colors.financier },
    { label: 'Professionnel', value: totalProfessionnel, color: colors.professionnel },
  ].filter(d => d.value > 0)

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bilan Patrimonial - ${data.client.prenom} ${data.client.nom}</title>
  <style>${premiumReportStyles}</style>
</head>
<body>

  <!-- ==================== PAGE 1: COUVERTURE ==================== -->
  <div class="page cover">
    <div class="cover-accent"></div>
    <div class="cover-header">
      <div class="cover-logo">
        <div class="cover-logo-icon">${data.cabinet?.nom?.charAt(0) || 'A'}</div>
        <span class="cover-logo-text">${data.cabinet?.nom || 'Cabinet Conseil'}</span>
      </div>
      <div class="cover-date">${formatDate(new Date())}</div>
    </div>

    <div class="cover-main">
      <div class="cover-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        Rapport Confidentiel
      </div>
      
      <h1 class="cover-title">Bilan Patrimonial</h1>
      <p class="cover-subtitle">
        Analyse approfondie et recommandations personnalisées pour la gestion et l'optimisation de votre patrimoine.
      </p>

      <div class="cover-client-card">
        <div class="cover-client-label">Établi pour</div>
        <div class="cover-client-name">${data.client.prenom} ${data.client.nom}</div>
        <div class="cover-client-info">
          ${clientAge ? `${clientAge} ans` : ''}
          ${data.client.situationFamiliale ? ` • ${data.client.situationFamiliale}` : ''}
          ${data.client.enfants ? ` • ${data.client.enfants} enfant(s)` : ''}
          ${data.client.profession ? ` • ${data.client.profession}` : ''}
        </div>
        <!-- Mini KPIs patrimoine sur la cover -->
        <div style="display: flex; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 7pt; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px;">Patrimoine net</div>
            <div style="font-size: 14pt; font-weight: 800; color: ${patrimoineNet >= 0 ? '#34d399' : '#f87171'}; margin-top: 2px;">${formatCurrency(patrimoineNet)}</div>
          </div>
          <div style="flex: 1; text-align: center; border-left: 1px solid rgba(255,255,255,0.1);">
            <div style="font-size: 7pt; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px;">Revenus annuels</div>
            <div style="font-size: 14pt; font-weight: 800; color: #34d399; margin-top: 2px;">${formatCurrency(revenusAnnuelsEffectifs)}</div>
          </div>
          <div style="flex: 1; text-align: center; border-left: 1px solid rgba(255,255,255,0.1);">
            <div style="font-size: 7pt; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px;">Actifs</div>
            <div style="font-size: 14pt; font-weight: 800; color: white; margin-top: 2px;">${formatCurrency(totalActifs)}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div class="cover-footer-item">
        <span>Référence</span><br>
        <span class="cover-footer-value">${data.dossier.reference}</span>
      </div>
      <div class="cover-footer-item">
        <span>Conseiller</span><br>
        <span class="cover-footer-value">${data.conseiller?.prenom || ''} ${data.conseiller?.nom || ''}</span>
      </div>
      <div class="cover-footer-item">
        <span>Contact</span><br>
        <span class="cover-footer-value">${data.conseiller?.email || data.cabinet?.email || '-'}</span>
      </div>
      <div class="cover-footer-item">
        <span>Date d'édition</span><br>
        <span class="cover-footer-value">${formatDate(new Date())}</span>
      </div>
    </div>
  </div>

  <!-- ==================== SOMMAIRE ==================== -->
  <div class="page content-page toc-section" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Sommaire</h2>
    </div>

    <div class="toc-intro">
      <p style="font-size: 10pt; color: #64748b; margin-bottom: 16px; line-height: 1.7;">
        Ce bilan patrimonial constitue une étude approfondie et personnalisée de votre situation, élaborée à partir des données collectées lors de nos échanges. 
        Il couvre l'ensemble des thématiques patrimoniales — budget, épargne, fiscalité, immobilier, financier, retraite et succession — et aboutit à des préconisations concrètes et chiffrées, adaptées à vos objectifs de vie.
      </p>
      <div style="background: rgba(99,102,241,0.04); border: 1px solid rgba(99,102,241,0.15); border-radius: 10px; padding: 14px; margin-bottom: 16px;">
        <div style="font-size: 9pt; font-weight: 700; color: #6366f1; margin-bottom: 6px;">Comment lire ce document</div>
        <p style="font-size: 9pt; color: #334155; line-height: 1.7; margin: 0 0 4px 0;"><strong>Sections I à IV</strong> — Votre situation actuelle : synthèse patrimoniale, profil personnel, diagnostic et inventaire détaillé.</p>
        <p style="font-size: 9pt; color: #334155; line-height: 1.7; margin: 0 0 4px 0;"><strong>Sections V à XIII</strong> — L'audit détaillé : score, budget, emprunt, fiscalité (IR/IFI/foncier), immobilier, financier, enveloppes fiscales, retraite et succession.</p>
        <p style="font-size: 9pt; color: #334155; line-height: 1.7; margin: 0 0 4px 0;"><strong>Sections XIV à XV</strong> — Simulations personnalisées et préconisations concrètes classées par priorité et impact estimé.</p>
        <p style="font-size: 9pt; color: #334155; line-height: 1.7; margin: 0 0 8px 0;"><strong>Sections XVI à XVIII</strong> — Glossaire (39 termes), références réglementaires (20 textes), mentions légales et validation formelle.</p>
        <p style="font-size: 8.5pt; color: #6366f1; margin: 0; line-height: 1.5;">
          Les couleurs utilisées dans ce rapport vous guident : <span style="color: #10b981; font-weight: 700;">le vert</span> indique une situation favorable, 
          <span style="color: #f59e0b; font-weight: 700;">l'orange</span> un point d'attention, et <span style="color: #ef4444; font-weight: 700;">le rouge</span> un sujet nécessitant une action rapide.
        </p>
      </div>
    </div>

    <div class="toc-list" style="border-top: 2px solid #0f172a; padding-top: 16px;">
      ${[
        { num: 'I', title: 'Synthèse Patrimoniale', desc: 'Vue d\'ensemble de votre patrimoine, indicateurs clés et répartition des actifs' },
        { num: 'II', title: 'Informations Personnelles & Contexte', desc: 'Votre profil, situation familiale, régime matrimonial et conseiller référent' },
        { num: 'III', title: 'Diagnostic Patrimonial', desc: 'Analyse qualitative de votre situation, points clés et allocation' },
        { num: 'IV', title: 'Inventaire Détaillé du Patrimoine', desc: 'Immobilier, financier, professionnel, passifs & bilan actif/passif' },
        { num: 'V', title: 'Audit — Score & Points Forts / Vigilance', desc: 'Notation multi-dimensionnelle, radar et analyse détaillée' },
        { num: 'VI', title: 'Audit — Bilan Budgétaire & Épargne', desc: 'Revenus, charges, capacité d\'épargne, taux d\'effort et épargne de précaution' },
        { num: 'VII', title: 'Audit — Capacité d\'Emprunt', desc: 'Taux d\'endettement, capacité résiduelle et enveloppes de financement' },
        { num: 'VIII', title: 'Audit — Situation Fiscale (IR & IFI)', desc: 'Barème IR, cascade fiscale, IFI, optimisations et revenus fonciers' },
        { num: 'IX', title: 'Audit — Patrimoine Immobilier', desc: 'Synthèse, analyse bien par bien, rendements et scénarios de revente' },
        { num: 'X', title: 'Audit — Patrimoine Financier', desc: 'Allocation, diversification, risque, détail des actifs et enveloppes fiscales' },
        { num: 'XI', title: 'Guide — Enveloppes Fiscales Comparées', desc: 'Comparatif AV vs PEA vs PER vs CTO : plafonds, fiscalité, succession' },
        { num: 'XII', title: 'Audit — Projection Retraite', desc: 'Système français, estimation pension, évolution par âge, scénarios et leviers' },
        { num: 'XIII', title: 'Audit — Succession & Transmission', desc: 'DMTG, héritiers, art. 669 CGI, calendrier donation, AV et stratégies' },
        { num: 'XIV', title: 'Résultats des Simulations', desc: 'Simulations détaillées réalisées pour votre situation' },
        { num: 'XV', title: 'Nos Préconisations', desc: 'Recommandations personnalisées classées par priorité et impact estimé' },
        { num: 'XVI', title: 'Glossaire & Références Réglementaires', desc: '39 termes définis (A-Z) et 20 références légales citées' },
        { num: 'XVII', title: 'Avertissements & Mentions Légales', desc: 'Limites, protection des données, identité professionnelle (ORIAS, RCP)' },
        { num: 'XVIII', title: 'Validation du Document', desc: 'Signatures et engagement des parties' },
      ].map((item, i) => `
        <div class="toc-item">
          <div class="toc-num" style="background: ${i < 4 ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : i < 13 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #10b981, #059669)'};">${item.num}</div>
          <div class="toc-label">
            <div class="toc-label-title">${item.title}</div>
            <div class="toc-label-desc">${item.desc}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="toc-note">
      <p style="font-size: 9pt; color: #1e40af; line-height: 1.6; margin: 0;">
        <strong>Note méthodologique :</strong> Les analyses présentées dans ce document reposent sur les informations déclarées par le client, 
        les barèmes fiscaux en vigueur au ${formatDate(new Date())}, et les hypothèses de projection retenues d'un commun accord. 
        Les montants sont exprimés en euros courants sauf mention contraire.
      </p>
    </div>
  </div>

  <!-- ==================== CHAPITRE I: SYNTHÈSE ==================== -->
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Synthèse Patrimoniale</h2>
    </div>

    <!-- Introduction pédagogique -->
    <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #f8fafc, #eff6ff); border-radius: 12px; border-left: 4px solid #3b82f6;">
      <p style="margin: 0 0 8px 0;">Cette page présente <strong>les 6 indicateurs essentiels</strong> qui résument votre situation patrimoniale. Ils constituent le point de départ de toute analyse et permettent d'évaluer rapidement votre santé financière globale.</p>
      <p style="margin: 0; font-size: 9pt; color: #64748b;">Chaque indicateur est accompagné d'un code couleur : <span style="color: #10b981; font-weight: 600;">vert</span> = situation saine, <span style="color: #f59e0b; font-weight: 600;">orange</span> = point d'attention, <span style="color: #ef4444; font-weight: 600;">rouge</span> = action recommandée.</p>
    </div>

    <!-- KPIs principaux avec explications intégrées -->
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
      <div class="card" style="border-left: 4px solid ${patrimoineNet >= 0 ? '#3b82f6' : '#ef4444'}; padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Patrimoine Net</div>
          <div style="font-size: 18pt; font-weight: 900; color: ${patrimoineNet >= 0 ? '#0f172a' : '#ef4444'};">${formatCurrency(patrimoineNet)}</div>
        </div>
        <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">Actifs (${formatCurrency(totalActifs)}) − Passifs (${formatCurrency(totalPassifs)}). C'est votre <strong>richesse réelle</strong> : tout ce que vous possédez, diminué de tout ce que vous devez. Indicateur n°1 de votre santé financière.</div>
      </div>
      <div class="card" style="border-left: 4px solid ${tauxEndettement > 50 ? '#ef4444' : tauxEndettement > 33 ? '#f59e0b' : '#10b981'}; padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Taux d'endettement</div>
          <div style="font-size: 18pt; font-weight: 900; color: ${tauxEndettement > 50 ? '#ef4444' : tauxEndettement > 33 ? '#f59e0b' : '#10b981'};">${tauxEndettement.toFixed(1)}%</div>
        </div>
        <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">${formatCurrency(totalPassifs)} de dettes. ${tauxEndettement <= 33 ? 'Inférieur au seuil HCSF (35 %) — bonne maîtrise de l\'endettement.' : tauxEndettement <= 50 ? 'Supérieur au seuil HCSF (35 %) — attention à la capacité d\'emprunt future.' : 'Endettement élevé (>50 %) — réduire les dettes est prioritaire.'}</div>
      </div>
      <div class="card" style="border-left: 4px solid #10b981; padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Revenus annuels nets</div>
          <div style="font-size: 18pt; font-weight: 900; color: #10b981;">${formatCurrency(revenusAnnuelsEffectifs)}</div>
        </div>
        <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">Soit <strong>${formatCurrency(revenusMensuels)}/mois</strong>. Tous revenus confondus (salaires, foncier, dividendes, pensions). Base de calcul de votre capacité d'épargne et d'emprunt.</div>
      </div>
      <div class="card" style="border-left: 4px solid ${capaciteEpargne >= 0 ? '#3b82f6' : '#ef4444'}; padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Capacité d'épargne</div>
          <div style="font-size: 18pt; font-weight: 900; color: ${capaciteEpargne >= 0 ? '#3b82f6' : '#ef4444'};">${formatCurrency(capaciteEpargne)}<span style="font-size: 9pt; color: #94a3b8;">/an</span></div>
        </div>
        <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">${capaciteEpargne >= 0 ? `Soit <strong>${formatCurrency(capaciteEpargne / 12)}/mois</strong>. Taux d'épargne : ${revenusAnnuelsEffectifs > 0 ? ((capaciteEpargne / revenusAnnuelsEffectifs) * 100).toFixed(0) : 0}%. ${capaciteEpargne / revenusAnnuelsEffectifs >= 0.15 ? 'Au-dessus de 15 % — excellent levier patrimonial.' : 'En dessous de 15 % — un effort est recommandé.'}` : 'Situation déficitaire : vos charges dépassent vos revenus. Action corrective urgente.'}</div>
      </div>
    </div>

    <!-- Patrimoine brut + charges en résumé compact -->
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px;">
      <div style="padding: 10px 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #8b5cf6;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 8.5pt; font-weight: 700; color: #0f172a;">Patrimoine Brut</div>
          <div style="font-size: 12pt; font-weight: 900; color: #0f172a;">${formatCurrency(totalActifs)}</div>
        </div>
        <p style="font-size: 8pt; color: #64748b; line-height: 1.4; margin: 4px 0 0 0;">${data.patrimoine.immobilier.length + data.patrimoine.financier.length} actifs. Somme de tous vos biens avant déduction des dettes.</p>
      </div>
      <div style="padding: 10px 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #ef4444;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 8.5pt; font-weight: 700; color: #0f172a;">Charges Annuelles</div>
          <div style="font-size: 12pt; font-weight: 900; color: #ef4444;">${formatCurrency(data.charges.total + data.charges.totalMensualitesCredits * 12)}</div>
        </div>
        <p style="font-size: 8pt; color: #64748b; line-height: 1.4; margin: 4px 0 0 0;">Dont ${formatCurrency(data.charges.totalMensualitesCredits * 12)}/an de crédits et ${formatCurrency(data.charges.total)}/an de charges courantes.</p>
      </div>
    </div>

    <!-- Graphique répartition patrimoine — Donut premium avec légende -->
    <div class="card" style="margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
        <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16pt;">📊</div>
        <div>
          <div style="font-size: 12pt; font-weight: 700; color: #0f172a;">Répartition du Patrimoine</div>
          <div style="font-size: 9pt; color: #64748b;">Ventilation par classe d'actifs — Un patrimoine équilibré combine immobilier, financier et éventuellement professionnel</div>
        </div>
      </div>
      <div style="padding: 8px 0;">
        ${generateDonutChart(patrimoineChartData, 170, 22, { centerLabel: 'Patrimoine', centerValue: formatCurrency(totalActifs) })}
      </div>
      ${totalPassifs > 0 ? `<div style="margin-top: 12px; padding: 12px; background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 9pt; color: #ef4444; font-weight: 600;">Passifs (crédits en cours)</span>
        <span style="font-size: 11pt; font-weight: 800; color: #ef4444;">${formatCurrency(totalPassifs)}</span>
      </div>` : ''}
      <p style="font-size: 8.5pt; color: #64748b; line-height: 1.5; margin: 10px 0 0 0;">
        <strong>Pourquoi diversifier ?</strong> Répartir son patrimoine entre plusieurs classes d'actifs (immobilier, financier, professionnel) permet de réduire le risque global. 
        Si l'une des classes subit une baisse de valeur, les autres peuvent compenser. Les professionnels recommandent généralement un ratio immobilier/financier proche de 60/40.
      </p>
    </div>

  </div>

  <!-- ==================== CHAPITRE II: INFORMATIONS PERSONNELLES ==================== -->
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Informations Personnelles & Contexte</h2>
    </div>

    <!-- Introduction pédagogique -->
    <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 16px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #f0fdf4); border-radius: 12px; border-left: 4px solid #10b981;">
      <p style="margin: 0;">Votre situation personnelle — âge, situation familiale, régime matrimonial, nombre d'enfants — détermine directement votre <strong>fiscalité</strong> (nombre de parts, quotient familial), vos <strong>droits sociaux</strong> (retraite, protection), et les <strong>règles de succession</strong> qui s'appliqueront. Ces informations sont le socle sur lequel repose l'ensemble de notre analyse.</p>
    </div>

    <div class="section">
      <div class="card" style="padding: 28px;">
        <div class="card-header" style="margin-bottom: 20px;">
          <span class="card-title" style="font-size: 13pt;">Profil du Client</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
          <div style="padding: 16px; background: #f8fafc; border-radius: 12px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Identité</div>
            <div style="font-size: 14pt; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${data.client.prenom} ${data.client.nom}</div>
            <div style="font-size: 10pt; color: #64748b;">${formatDate(data.client.dateNaissance)} ${clientAge ? `(${clientAge} ans)` : ''}</div>
          </div>
          <div style="padding: 16px; background: #f8fafc; border-radius: 12px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Profession</div>
            <div style="font-size: 14pt; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${data.client.profession || '-'}</div>
            <div style="font-size: 10pt; color: #64748b;">Revenus annuels : ${formatCurrency(revenusAnnuelsEffectifs)}</div>
          </div>
          <div style="padding: 16px; background: #f8fafc; border-radius: 12px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Situation familiale</div>
            <div style="font-size: 14pt; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${data.client.situationFamiliale || '-'}</div>
            <div style="font-size: 10pt; color: #64748b;">${data.client.enfants ? `${data.client.enfants} enfant(s) à charge` : 'Pas d\'enfant déclaré'}</div>
          </div>
          <div style="padding: 16px; background: #f8fafc; border-radius: 12px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Régime matrimonial</div>
            <div style="font-size: 14pt; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${data.client.regimeMatrimonial || '-'}</div>
            <div style="font-size: 10pt; color: #64748b;">Impact sur la liquidation successorale</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact -->
    <div class="section">
      <div class="card" style="padding: 28px;">
        <div class="card-header" style="margin-bottom: 20px;">
          <span class="card-title" style="font-size: 13pt;">Coordonnées</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
          <div>
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Email</div>
            <div style="font-size: 11pt; font-weight: 600; color: #3b82f6;">${data.client.email || '-'}</div>
          </div>
          <div>
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Téléphone</div>
            <div style="font-size: 11pt; font-weight: 600;">${data.client.telephone || '-'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contexte patrimonial -->
    <div class="section">
      <div class="card" style="padding: 28px; border-left: 4px solid #6366f1;">
        <div class="card-header" style="margin-bottom: 16px;">
          <span class="card-title" style="font-size: 13pt;">Contexte Patrimonial</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8fafc; border-radius: 10px;">
            <div style="font-size: 18pt;">🏠</div>
            <div><div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Biens immobiliers</div><div style="font-size: 12pt; font-weight: 700;">${data.patrimoine.immobilier.length} bien(s) — ${formatCurrency(totalImmobilier)}</div></div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8fafc; border-radius: 10px;">
            <div style="font-size: 18pt;">💹</div>
            <div><div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Actifs financiers</div><div style="font-size: 12pt; font-weight: 700;">${data.patrimoine.financier.length} ligne(s) — ${formatCurrency(totalFinancier)}</div></div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8fafc; border-radius: 10px;">
            <div style="font-size: 18pt;">🏢</div>
            <div><div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Actifs professionnels</div><div style="font-size: 12pt; font-weight: 700;">${data.patrimoine.professionnel.length} actif(s) — ${formatCurrency(totalProfessionnel)}</div></div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8fafc; border-radius: 10px;">
            <div style="font-size: 18pt;">📋</div>
            <div><div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Crédits en cours</div><div style="font-size: 12pt; font-weight: 700; color: #ef4444;">${data.patrimoine.passifs.length} crédit(s) — ${formatCurrency(totalPassifs)}</div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conseiller référent -->
    <div class="section">
      <div style="padding: 20px; background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: 16px; color: white;">
        <div style="font-size: 8pt; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Votre conseiller référent</div>
        <div style="font-size: 14pt; font-weight: 700;">${data.conseiller?.prenom || ''} ${data.conseiller?.nom || ''}</div>
        <div style="font-size: 10pt; color: rgba(255,255,255,0.7); margin-top: 4px;">${data.conseiller?.email || ''} ${data.conseiller?.telephone ? `• ${data.conseiller.telephone}` : ''}</div>
        <div style="font-size: 10pt; color: rgba(255,255,255,0.7); margin-top: 2px;">${data.cabinet?.nom || ''} ${data.cabinet?.adresse ? `— ${data.cabinet.adresse}` : ''}</div>
      </div>
    </div>
  </div>

  <!-- ==================== CHAPITRE III: DIAGNOSTIC PATRIMONIAL ==================== -->
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Diagnostic Patrimonial</h2>
    </div>

    <div class="section">
      <div class="card" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0;">
        <div class="card-header" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
          <span class="card-title" style="display: flex; align-items: center; gap: 10px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Analyse de votre situation
          </span>
        </div>
        <div style="font-size: 10.5pt; line-height: 1.8; color: #334155; text-align: justify;">
          ${diagnosticText.split('\n\n').map(paragraph => `
            <p style="margin-bottom: 16px; padding-left: 16px; border-left: 3px solid #3b82f6;">${paragraph}</p>
          `).join('')}
        </div>
      </div>
    </div>

  </div>

  <!-- ==================== Diagnostic — sous-section Points Clés ==================== -->
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Diagnostic — Points Clés</h2>
    </div>

    <!-- Introduction pédagogique -->
    <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 16px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #f0fdf4); border-radius: 12px; border-left: 4px solid #10b981;">
      <p style="margin: 0;">Les quatre indicateurs ci-dessous résument votre situation sur les axes fondamentaux de la gestion de patrimoine. Chaque axe est évalué de manière indépendante pour vous donner une vision claire de vos forces et des points à travailler en priorité.</p>
    </div>

    <div class="section">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        <div class="card" style="padding: 20px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: ${patrimoineNet >= 0 ? '#dcfce7' : '#fee2e2'}; display: flex; align-items: center; justify-content: center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${patrimoineNet >= 0 ? '#16a34a' : '#dc2626'}" stroke-width="2">
                ${patrimoineNet >= 0 ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
              </svg>
            </div>
            <div>
              <div style="font-size: 9pt; color: #64748b; text-transform: uppercase;">Patrimoine</div>
              <div style="font-size: 12pt; font-weight: 700; color: ${patrimoineNet >= 0 ? '#16a34a' : '#dc2626'};">${patrimoineNet >= 0 ? 'Positif' : 'À consolider'}</div>
            </div>
          </div>
          <p style="font-size: 9pt; color: #64748b; line-height: 1.6; margin: 0 0 6px 0;">${patrimoineNet >= 0 ? `Votre patrimoine net de ${formatCurrency(patrimoineNet)} est positif : la valeur de vos actifs dépasse celle de vos dettes. C'est une base solide pour vos projets futurs, que ce soit un investissement immobilier, une préparation retraite ou une transmission.` : `Votre patrimoine net est négatif (${formatCurrency(patrimoineNet)}), ce qui signifie que vos dettes dépassent la valeur de vos actifs. Il est important de rééquilibrer cette situation en priorité, par exemple en remboursant les crédits les plus coûteux ou en augmentant la valeur de vos actifs.`}</p>
          <p style="font-size: 8pt; color: #94a3b8; line-height: 1.4; margin: 0; font-style: italic;">Rappel : le patrimoine net = total des actifs − total des dettes. C'est l'indicateur le plus fiable de votre « richesse réelle ».</p>
        </div>

        <div class="card" style="padding: 20px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: ${tauxEndettement <= 33 ? '#dcfce7' : tauxEndettement <= 50 ? '#fef3c7' : '#fee2e2'}; display: flex; align-items: center; justify-content: center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${tauxEndettement <= 33 ? '#16a34a' : tauxEndettement <= 50 ? '#d97706' : '#dc2626'}" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
              </svg>
            </div>
            <div>
              <div style="font-size: 9pt; color: #64748b; text-transform: uppercase;">Endettement</div>
              <div style="font-size: 12pt; font-weight: 700; color: ${tauxEndettement <= 33 ? '#16a34a' : tauxEndettement <= 50 ? '#d97706' : '#dc2626'};">${tauxEndettement <= 33 ? 'Maîtrisé' : tauxEndettement <= 50 ? 'À surveiller' : 'Élevé'} — ${tauxEndettement.toFixed(1)}%</div>
            </div>
          </div>
          <p style="font-size: 9pt; color: #64748b; line-height: 1.6; margin: 0 0 6px 0;">${tauxEndettement <= 33 ? `Avec un taux d'endettement de ${tauxEndettement.toFixed(1)}%, vous restez sous le seuil de 35 % fixé par le Haut Conseil de Stabilité Financière (HCSF). Cela signifie que vous disposez d'une capacité résiduelle pour contracter un nouveau crédit si nécessaire.` : tauxEndettement <= 50 ? `Votre taux d'endettement de ${tauxEndettement.toFixed(1)}% dépasse le seuil de 35 % recommandé par le HCSF. L'obtention d'un nouveau crédit sera difficile auprès des banques tant que ce ratio ne sera pas ramené sous ce seuil.` : `Votre taux d'endettement de ${tauxEndettement.toFixed(1)}% est significativement au-dessus du seuil de 35 % fixé par le HCSF. Un plan de désendettement prioritaire est recommandé pour restaurer votre capacité financière.`}</p>
          <p style="font-size: 8pt; color: #94a3b8; line-height: 1.4; margin: 0; font-style: italic;">Rappel : le taux d'endettement = mensualités de crédits ÷ revenus mensuels. Le HCSF limite ce ratio à 35 % depuis janvier 2022.</p>
        </div>

        <div class="card" style="padding: 20px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: ${capaciteEpargne >= 0 ? '#dcfce7' : '#fee2e2'}; display: flex; align-items: center; justify-content: center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${capaciteEpargne >= 0 ? '#16a34a' : '#dc2626'}" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <div style="font-size: 9pt; color: #64748b; text-transform: uppercase;">Épargne</div>
              <div style="font-size: 12pt; font-weight: 700; color: ${capaciteEpargne >= 0 ? '#16a34a' : '#dc2626'};">${capaciteEpargne >= 0 ? 'Capacité positive' : 'Budget déficitaire'}</div>
            </div>
          </div>
          <p style="font-size: 9pt; color: #64748b; line-height: 1.6; margin: 0 0 6px 0;">${capaciteEpargne >= 0 ? `Vous dégagez une capacité d'épargne de ${formatCurrency(capaciteEpargne / 12)}/mois (soit ${formatCurrency(capaciteEpargne)}/an). C'est ce « reste à vivre » après toutes charges et crédits qui constitue votre levier pour préparer l'avenir : épargne de précaution, investissement, préparation de la retraite.` : `Votre budget est actuellement déficitaire : vos charges et crédits dépassent vos revenus de ${formatCurrency(Math.abs(capaciteEpargne / 12))}/mois. Avant tout projet d'investissement, il est impératif de rétablir l'équilibre budgétaire en réduisant certaines charges ou en augmentant vos revenus.`}</p>
          <p style="font-size: 8pt; color: #94a3b8; line-height: 1.4; margin: 0; font-style: italic;">Rappel : les professionnels recommandent un taux d'épargne d'au moins 10 à 20 % des revenus nets pour construire un patrimoine durablement.</p>
        </div>

        <div class="card" style="padding: 20px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: ${tauxImmo > 70 || tauxFinancier > 80 ? '#fef3c7' : '#dcfce7'}; display: flex; align-items: center; justify-content: center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${tauxImmo > 70 || tauxFinancier > 80 ? '#d97706' : '#16a34a'}" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12l2 2 4-4"/>
              </svg>
            </div>
            <div>
              <div style="font-size: 9pt; color: #64748b; text-transform: uppercase;">Diversification</div>
              <div style="font-size: 12pt; font-weight: 700; color: ${tauxImmo > 70 || tauxFinancier > 80 ? '#d97706' : '#16a34a'};">${tauxImmo > 70 || tauxFinancier > 80 ? 'À améliorer' : 'Équilibrée'} — ${tauxImmo.toFixed(0)}% immo / ${tauxFinancier.toFixed(0)}% fin.</div>
            </div>
          </div>
          <p style="font-size: 9pt; color: #64748b; line-height: 1.6; margin: 0 0 6px 0;">${tauxImmo > 70 ? `Votre patrimoine est fortement concentré sur l'immobilier (${tauxImmo.toFixed(0)}%). Cette surexposition vous rend vulnérable à un retournement du marché immobilier et limite votre liquidité. Diversifier vers des actifs financiers (assurance-vie, PEA, SCPI) permettrait de réduire ce risque.` : tauxFinancier > 80 ? `Votre patrimoine est très majoritairement financier (${tauxFinancier.toFixed(0)}%). Bien que la liquidité soit un atout, l'absence d'actifs immobiliers vous prive de la stabilité et de l'effet de levier du crédit. Un investissement immobilier pourrait rééquilibrer votre allocation.` : `Votre patrimoine est bien réparti entre immobilier (${tauxImmo.toFixed(0)}%) et financier (${tauxFinancier.toFixed(0)}%). Cette diversification naturelle vous protège contre les fluctuations d'un seul marché et constitue un atout majeur.`}</p>
          <p style="font-size: 8pt; color: #94a3b8; line-height: 1.4; margin: 0; font-style: italic;">Rappel : la diversification est le seul « repas gratuit » en finance. Un ratio équilibré réduit le risque global sans diminuer le rendement attendu.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== CHAPITRE IV: INVENTAIRE DU PATRIMOINE ==================== -->
  ${data.patrimoine.immobilier.length > 0 ? `
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Inventaire — Patrimoine Immobilier</h2>
    </div>

    <!-- Introduction pédagogique -->
    <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 16px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #eff6ff); border-radius: 12px; border-left: 4px solid #3b82f6;">
      <p style="margin: 0;">L'immobilier constitue souvent le socle du patrimoine des Français. Cette section recense <strong>l'ensemble de vos biens immobiliers</strong> — résidence principale, investissements locatifs, résidences secondaires — avec leur valeur estimée et leur poids dans votre patrimoine global. L'objectif est de vérifier que votre exposition immobilière reste cohérente avec vos objectifs et votre profil de risque.</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
      ${generateKpiCard('Valeur totale', formatCurrency(totalImmobilier), { icon: '🏠', color: '#3b82f6', sublabel: `${data.patrimoine.immobilier.length} bien(s)` })}
      ${generateKpiCard('Poids patrimoine', `${tauxImmo.toFixed(1)}%`, { icon: '📊', color: tauxImmo > 70 ? '#f59e0b' : '#10b981', sublabel: tauxImmo > 70 ? 'Concentration élevée' : 'Équilibré' })}
      ${generateKpiCard('Patrimoine net', formatCurrency(patrimoineNet), { icon: '🏦', sublabel: 'Actifs − Passifs' })}
    </div>

    <div class="table-container">
      <div class="table-header">
        <span class="table-title">Détail des biens immobiliers</span>
        <span class="card-badge badge-success">${formatCurrency(totalImmobilier)}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Bien</th>
            <th>Type</th>
            <th>Localisation</th>
            <th style="text-align: right;">Valeur</th>
            <th style="text-align: right;">Poids</th>
          </tr>
        </thead>
        <tbody>
          ${data.patrimoine.immobilier.map(bien => `
            <tr>
              <td class="td-main">${bien.nom}</td>
              <td>${bien.type}</td>
              <td>${bien.location || '-'}</td>
              <td class="td-amount">${formatCurrency(bien.valeur)}</td>
              <td style="text-align: right; font-size: 9pt; color: #64748b;">${totalActifs > 0 ? ((bien.valeur / totalActifs) * 100).toFixed(1) : '0'}%</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot class="table-footer">
          <tr>
            <td colspan="3">Total Immobilier</td>
            <td class="td-amount">${formatCurrency(totalImmobilier)}</td>
            <td style="text-align: right;">${tauxImmo.toFixed(1)}%</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Donut répartition immobilier par type -->
    <div class="card" style="margin-top: 16px;">
      <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 10px;">Répartition par type de bien</div>
      ${(() => {
        const immoByType: Record<string, number> = {}
        data.patrimoine.immobilier.forEach(b => { immoByType[b.type] = (immoByType[b.type] || 0) + b.valeur })
        const immoColors = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b']
        return generateDonutChart(
          Object.entries(immoByType).map(([type, val], i) => ({ label: type, value: val, color: immoColors[i % immoColors.length] })),
          150, 18, { centerLabel: 'Immobilier', centerValue: formatCurrency(totalImmobilier) }
        )
      })()}
    </div>
  </div>
  ` : ''}

  <!-- ==================== PAGE: INVENTAIRE PATRIMOINE FINANCIER ==================== -->
  ${data.patrimoine.financier.length > 0 ? `
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Inventaire — Patrimoine Financier</h2>
    </div>

    <!-- Introduction pédagogique -->
    <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 16px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #f5f3ff); border-radius: 12px; border-left: 4px solid #8b5cf6;">
      <p style="margin: 0 0 6px 0;">Le patrimoine financier regroupe <strong>tous vos placements et liquidités</strong> : comptes bancaires, livrets d'épargne, assurance-vie, PEA, PER, comptes-titres, SCPI en parts, etc. Contrairement à l'immobilier, ces actifs sont généralement plus liquides (disponibles rapidement) mais aussi plus sensibles aux fluctuations des marchés.</p>
      <p style="margin: 0; font-size: 9pt; color: #64748b;">Le choix de l'enveloppe fiscale (AV, PEA, PER, CTO) est déterminant pour optimiser la fiscalité de vos gains. Chaque enveloppe obéit à des règles spécifiques détaillées dans l'audit financier.</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
      ${generateKpiCard('Valeur totale', formatCurrency(totalFinancier), { icon: '💹', color: '#8b5cf6', sublabel: `${data.patrimoine.financier.length} ligne(s)` })}
      ${generateKpiCard('Poids patrimoine', `${tauxFinancier.toFixed(1)}%`, { icon: '📊', color: tauxFinancier > 80 ? '#f59e0b' : '#10b981', sublabel: tauxFinancier > 80 ? 'Concentration élevée' : 'Équilibré' })}
      ${generateKpiCard('Ratio Immo/Fin', `${tauxImmo.toFixed(0)}/${tauxFinancier.toFixed(0)}`, { icon: '⚖️', sublabel: 'Immobilier / Financier' })}
    </div>

    <div class="table-container">
      <div class="table-header">
        <span class="table-title">Détail des actifs financiers</span>
        <span class="card-badge badge-success">${formatCurrency(totalFinancier)}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th>Type / Enveloppe</th>
            <th style="text-align: right;">Valeur</th>
            <th style="text-align: right;">Poids</th>
          </tr>
        </thead>
        <tbody>
          ${data.patrimoine.financier.map(actif => `
            <tr>
              <td class="td-main">${actif.nom}</td>
              <td>${actif.type}</td>
              <td class="td-amount">${formatCurrency(actif.valeur)}</td>
              <td style="text-align: right; font-size: 9pt; color: #64748b;">${totalFinancier > 0 ? ((actif.valeur / totalFinancier) * 100).toFixed(1) : '0'}%</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot class="table-footer">
          <tr>
            <td colspan="2">Total Financier</td>
            <td class="td-amount">${formatCurrency(totalFinancier)}</td>
            <td style="text-align: right;">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Donut répartition financier par type -->
    <div class="card" style="margin-top: 16px;">
      <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 10px;">Répartition par type de support</div>
      ${(() => {
        const finByType: Record<string, number> = {}
        data.patrimoine.financier.forEach(a => { finByType[a.type] = (finByType[a.type] || 0) + a.valeur })
        const finColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']
        return generateDonutChart(
          Object.entries(finByType).map(([type, val], i) => ({ label: type, value: val, color: finColors[i % finColors.length] })),
          150, 18, { centerLabel: 'Financier', centerValue: formatCurrency(totalFinancier) }
        )
      })()}
    </div>
  </div>
  ` : ''}

  <!-- ==================== PAGE: INVENTAIRE PASSIFS & CRÉDITS ==================== -->
  ${data.patrimoine.passifs.length > 0 ? `
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Inventaire — Passifs & Crédits</h2>
    </div>

    <!-- Introduction pédagogique -->
    <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 16px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #fef2f2); border-radius: 12px; border-left: 4px solid #ef4444;">
      <p style="margin: 0 0 6px 0;">Les passifs représentent <strong>l'ensemble de vos dettes</strong> : crédits immobiliers, crédits à la consommation, prêts professionnels, etc. L'endettement n'est pas négatif en soi — un crédit immobilier à taux bas est un levier puissant de constitution de patrimoine — mais il doit rester maîtrisé.</p>
      <p style="margin: 0; font-size: 9pt; color: #64748b;">Le Haut Conseil de Stabilité Financière (HCSF) impose aux banques de ne pas accorder de crédit si le taux d'endettement dépasse <strong>35 %</strong> des revenus nets, et la durée d'emprunt ne doit pas excéder <strong>25 ans</strong> (27 ans pour le neuf avec différé).</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
      ${generateKpiCard('Total dettes', formatCurrency(totalPassifs), { icon: '📋', color: '#ef4444', sublabel: `${data.patrimoine.passifs.length} crédit(s)` })}
      ${generateKpiCard('Mensualités', formatCurrency(data.charges.totalMensualitesCredits), { icon: '📅', color: '#f59e0b', sublabel: '/mois' })}
      ${generateKpiCard('Taux endettement', `${tauxEndettement.toFixed(1)}%`, { icon: tauxEndettement > 33 ? '⚠️' : '✅', color: tauxEndettement > 33 ? '#ef4444' : '#10b981', sublabel: tauxEndettement > 33 ? 'Dépasse 33% HCSF' : 'Conforme HCSF' })}
      ${generateKpiCard('Coût annuel', formatCurrency(data.charges.totalMensualitesCredits * 12), { icon: '💸', color: '#ef4444', sublabel: 'Remboursements' })}
    </div>

    <div class="table-container">
      <div class="table-header">
        <span class="table-title">Détail des crédits en cours</span>
        <span class="card-badge badge-danger">${formatCurrency(totalPassifs)}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Crédit</th>
            <th>Type</th>
            <th style="text-align: right;">Capital Restant</th>
            <th style="text-align: right;">Taux</th>
            <th style="text-align: right;">Mensualité</th>
            <th style="text-align: right;">Coût annuel</th>
          </tr>
        </thead>
        <tbody>
          ${data.patrimoine.passifs.map(passif => `
            <tr>
              <td class="td-main">${passif.nom}</td>
              <td>${passif.type}</td>
              <td class="td-amount negative">${formatCurrency(passif.capitalRestant)}</td>
              <td style="text-align: right;">${formatPercent(passif.tauxInteret)}</td>
              <td class="td-amount">${formatCurrency(passif.mensualite)}</td>
              <td class="td-amount" style="color: #ef4444;">${formatCurrency(passif.mensualite * 12)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot class="table-footer">
          <tr>
            <td colspan="2">Total Passifs</td>
            <td class="td-amount">${formatCurrency(totalPassifs)}</td>
            <td></td>
            <td class="td-amount">${formatCurrency(data.charges.totalMensualitesCredits)}/mois</td>
            <td class="td-amount">${formatCurrency(data.charges.totalMensualitesCredits * 12)}/an</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Ratio dette / actif -->
    <div class="card" style="margin-top: 16px;">
      <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Ratio d'endettement patrimonial</div>
      <p style="font-size: 8.5pt; color: #64748b; line-height: 1.5; margin: 0 0 10px 0;">Ce ratio mesure la part de vos actifs financée par de la dette. Un ratio inférieur à 30 % traduit un patrimoine solide, entre 30 % et 50 % une utilisation raisonnable du levier, et au-delà de 50 % un endettement significatif qui mérite attention. À 100 %, la totalité de vos actifs est compensée par des dettes, et votre patrimoine net est nul.</p>
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="flex: 1; background: #e2e8f0; border-radius: 100px; height: 18px; overflow: hidden;">
          <div style="height: 100%; border-radius: 100px; width: ${totalActifs > 0 ? Math.min((totalPassifs / totalActifs) * 100, 100) : 0}%; background: linear-gradient(90deg, #f59e0b, #ef4444);"></div>
        </div>
        <span style="font-size: 12pt; font-weight: 800; color: ${totalActifs > 0 && (totalPassifs / totalActifs) > 0.5 ? '#ef4444' : '#0f172a'};">${totalActifs > 0 ? ((totalPassifs / totalActifs) * 100).toFixed(1) : '0'}%</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 8px;">
        <span style="font-size: 8pt; color: #10b981; font-weight: 600;">0% — Aucune dette</span>
        <span style="font-size: 8pt; color: #f59e0b; font-weight: 600;">50% — Seuil d'attention</span>
        <span style="font-size: 8pt; color: #ef4444; font-weight: 600;">100% — Patrimoine nul</span>
      </div>
    </div>
  </div>
  ` : ''}

  <!-- ==================== PAGE: BILAN ACTIF / PASSIF ==================== -->
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Bilan Actif / Passif</h2>
    </div>

    <!-- Introduction pédagogique -->
    <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 16px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #eff6ff); border-radius: 12px; border-left: 4px solid #6366f1;">
      <p style="margin: 0 0 6px 0;">Le bilan actif/passif fonctionne comme un <strong>bilan comptable personnel</strong> : d'un côté, tout ce que vous possédez (actifs immobiliers, financiers, professionnels), de l'autre, tout ce que vous devez (crédits en cours). La différence entre les deux donne votre <strong>patrimoine net</strong>, qui est l'indicateur le plus fiable de votre richesse réelle.</p>
      <p style="margin: 0; font-size: 9pt; color: #64748b;">Ce tableau consolidé vous permet de visualiser d'un seul coup d'œil la structure de votre patrimoine, d'identifier les déséquilibres éventuels (surconcentration, endettement excessif) et de mesurer votre progression dans le temps.</p>
    </div>

    <div class="card" style="margin-bottom: 20px; padding: 24px;">
      <div style="font-size: 11pt; font-weight: 700; color: #0f172a; margin-bottom: 16px;">Vue consolidée</div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 12px 16px; text-align: left; font-size: 10pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Catégorie</th>
            <th style="padding: 12px 16px; text-align: right; font-size: 10pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Montant</th>
            <th style="padding: 12px 16px; text-align: right; font-size: 10pt; color: #64748b; border-bottom: 2px solid #e2e8f0;">Poids</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px 16px; font-weight: 600; color: #3b82f6;">🏠 Patrimoine Immobilier</td>
            <td style="padding: 12px 16px; text-align: right; font-weight: 700; font-size: 12pt;">${formatCurrency(totalImmobilier)}</td>
            <td style="padding: 12px 16px; text-align: right; font-size: 10pt; color: #64748b;">${tauxImmo.toFixed(1)}%</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px 16px; font-weight: 600; color: #8b5cf6;">💹 Patrimoine Financier</td>
            <td style="padding: 12px 16px; text-align: right; font-weight: 700; font-size: 12pt;">${formatCurrency(totalFinancier)}</td>
            <td style="padding: 12px 16px; text-align: right; font-size: 10pt; color: #64748b;">${tauxFinancier.toFixed(1)}%</td>
          </tr>
          ${totalProfessionnel > 0 ? `<tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px 16px; font-weight: 600; color: #10b981;">🏢 Patrimoine Professionnel</td>
            <td style="padding: 12px 16px; text-align: right; font-weight: 700; font-size: 12pt;">${formatCurrency(totalProfessionnel)}</td>
            <td style="padding: 12px 16px; text-align: right; font-size: 10pt; color: #64748b;">${totalActifs > 0 ? ((totalProfessionnel / totalActifs) * 100).toFixed(1) : '0'}%</td>
          </tr>` : ''}
          <tr style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border-bottom: 2px solid #3b82f6;">
            <td style="padding: 14px 16px; font-weight: 800; font-size: 11pt; color: #0f172a;">TOTAL ACTIFS BRUTS</td>
            <td style="padding: 14px 16px; text-align: right; font-weight: 900; font-size: 14pt; color: #0f172a;">${formatCurrency(totalActifs)}</td>
            <td style="padding: 14px 16px; text-align: right; font-weight: 700; color: #0f172a;">100%</td>
          </tr>
          ${totalPassifs > 0 ? `<tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px 16px; font-weight: 600; color: #ef4444;">📋 Total Passifs (Crédits)</td>
            <td style="padding: 12px 16px; text-align: right; font-weight: 700; font-size: 12pt; color: #ef4444;">-${formatCurrency(totalPassifs)}</td>
            <td style="padding: 12px 16px;"></td>
          </tr>` : ''}
          <tr style="background: ${patrimoineNet >= 0 ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)'};">
            <td style="padding: 14px 16px; font-weight: 800; font-size: 11pt; color: ${patrimoineNet >= 0 ? '#16a34a' : '#dc2626'};">PATRIMOINE NET</td>
            <td style="padding: 14px 16px; text-align: right; font-weight: 900; font-size: 16pt; color: ${patrimoineNet >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(patrimoineNet)}</td>
            <td style="padding: 14px 16px;"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Graphiques comparatifs -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div class="card" style="text-align: center;">
        <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 10px;">Répartition des Actifs</div>
        ${generateDonutChart(patrimoineChartData, 150, 18, { centerLabel: 'Actifs', centerValue: formatCurrency(totalActifs) })}
      </div>
      <div class="card">
        <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 10px;">Composition du patrimoine</div>
        ${generateHorizontalBarChart([
          { label: 'Immobilier', value: totalImmobilier, color: '#3b82f6' },
          { label: 'Financier', value: totalFinancier, color: '#8b5cf6' },
          ...(totalProfessionnel > 0 ? [{ label: 'Professionnel', value: totalProfessionnel, color: '#10b981' }] : []),
          ...(totalPassifs > 0 ? [{ label: 'Passifs', value: totalPassifs, color: '#ef4444' }] : []),
        ], 220, 20, 14)}
      </div>
    </div>
  </div>

  <!-- ==================== CHAPITRE V: AUDIT PATRIMONIAL ==================== -->
  ${data.audit ? `
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit Patrimonial — Synthèse & Budget</h2>
    </div>

    ${data.audit.synthese ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📊</div>
        <div>
          <div class="section-title">Score Patrimonial Global</div>
          <div class="section-subtitle">Évaluation multi-dimensionnelle de votre situation</div>
        </div>
      </div>

      <!-- Introduction pédagogique -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #eff6ff); border-radius: 12px; border-left: 4px solid #6366f1;">
        <p style="margin: 0 0 6px 0;">Votre <strong>score patrimonial</strong> est une note sur 100 qui synthétise la qualité globale de votre situation financière. Il est calculé en combinant plusieurs dimensions : budget, épargne, endettement, fiscalité, diversification, retraite et succession.</p>
        <p style="margin: 0; font-size: 9pt; color: #64748b;"><strong>Lecture :</strong> un score supérieur à 70/100 traduit une situation saine. Entre 45 et 70, des améliorations sont possibles. En dessous de 45, des actions correctives sont recommandées. Le graphique radar ci-dessous détaille chaque dimension pour identifier précisément les axes de progrès.</p>
      </div>

      <!-- Score global + Radar chart côte à côte -->
      <div class="card" style="margin-bottom: 16px;">
        <div style="display: flex; align-items: flex-start; gap: 24px;">
          <!-- Score global + gauge -->
          <div style="flex-shrink: 0; text-align: center;">
            ${generateGauge(data.audit.synthese.scoreGlobal, 100, 160, undefined, 'Score Patrimonial')}
          </div>
          <!-- Radar chart -->
          <div style="flex: 1; display: flex; justify-content: center;">
            ${generateRadarChart(data.audit.synthese.scores.map(s => ({ label: s.theme, score: s.score })), 210)}
          </div>
        </div>
        <!-- Scores détaillés avec explications -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 16px;">
          ${data.audit.synthese.scores.map(s => `
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: ${s.score >= 70 ? 'rgba(16,185,129,0.04)' : s.score >= 45 ? 'rgba(245,158,11,0.04)' : 'rgba(239,68,68,0.04)'}; border-radius: 10px; border: 1px solid ${s.score >= 70 ? 'rgba(16,185,129,0.15)' : s.score >= 45 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'};">
              <div style="flex-shrink: 0; width: 48px; text-align: center;">
                <div style="font-size: 20pt; font-weight: 900; color: ${s.couleur};">${s.score}</div>
                <div style="font-size: 6.5pt; color: #94a3b8;">/100</div>
              </div>
              <div style="flex: 1; border-left: 1px solid ${s.score >= 70 ? 'rgba(16,185,129,0.2)' : s.score >= 45 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}; padding-left: 10px;">
                <div style="font-size: 8.5pt; font-weight: 700; color: #0f172a; margin-bottom: 2px;">${s.theme}</div>
                <div style="font-size: 7.5pt; color: ${s.couleur}; font-weight: 600;">${s.verdict}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Narratif global -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.7; margin-bottom: 14px; padding: 14px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #6366f1;">${data.audit.synthese.narratifGlobal}</div>

      <!-- Grille d'interprétation des scores -->
      <div style="font-size: 9pt; color: #334155; line-height: 1.6; padding: 12px; background: #f8fafc; border-radius: 10px;">
        <p style="margin: 0 0 6px 0; font-weight: 700;">Comment lire les scores ?</p>
        <div style="display: flex; gap: 12px;">
          <div style="flex: 1; padding: 6px 8px; background: rgba(16,185,129,0.06); border-radius: 6px; border: 1px solid rgba(16,185,129,0.15);"><span style="font-weight: 800; color: #10b981;">70-100 :</span> <span style="font-size: 8.5pt;">Situation saine, à maintenir.</span></div>
          <div style="flex: 1; padding: 6px 8px; background: rgba(245,158,11,0.06); border-radius: 6px; border: 1px solid rgba(245,158,11,0.15);"><span style="font-weight: 800; color: #f59e0b;">45-69 :</span> <span style="font-size: 8.5pt;">Améliorations possibles.</span></div>
          <div style="flex: 1; padding: 6px 8px; background: rgba(239,68,68,0.06); border-radius: 6px; border: 1px solid rgba(239,68,68,0.15);"><span style="font-weight: 800; color: #ef4444;">0-44 :</span> <span style="font-size: 8.5pt;">Actions correctives urgentes.</span></div>
        </div>
      </div>
    </div>
    ` : ''}
  </div>

  <!-- ==================== PAGE: AUDIT — POINTS FORTS & VIGILANCE ==================== -->
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit — Points Forts & Points de Vigilance</h2>
    </div>

    ${data.audit.synthese ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🎯</div>
        <div>
          <div class="section-title">Analyse détaillée de votre situation</div>
          <div class="section-subtitle">Identification des forces et des axes d'amélioration</div>
        </div>
      </div>

      <!-- Points forts détaillés -->
      ${data.audit.synthese.pointsForts.length > 0 ? `
      <div style="background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: #dcfce7; display: flex; align-items: center; justify-content: center;"><span style="font-size: 14pt;">✓</span></div>
          <div style="font-size: 12pt; font-weight: 700; color: #16a34a;">Points forts identifiés</div>
        </div>
        ${data.audit.synthese.pointsForts.map((p, i) => `
          <div style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; ${i < data.audit!.synthese!.pointsForts.length - 1 ? 'border-bottom: 1px solid rgba(16,185,129,0.15);' : ''}">
            <div style="width: 22px; height: 22px; border-radius: 6px; background: #dcfce7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 9pt; font-weight: 800; color: #16a34a;">${i + 1}</div>
            <p style="font-size: 10pt; color: #065f46; line-height: 1.6; margin: 0;">${p}</p>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- Points de vigilance détaillés -->
      ${data.audit.synthese.pointsVigilance.length > 0 ? `
      <div style="background: rgba(245,158,11,0.05); border: 1px solid rgba(245,158,11,0.2); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: #fef3c7; display: flex; align-items: center; justify-content: center;"><span style="font-size: 14pt;">⚠</span></div>
          <div style="font-size: 12pt; font-weight: 700; color: #d97706;">Points de vigilance</div>
        </div>
        ${data.audit.synthese.pointsVigilance.map((p, i) => `
          <div style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; ${i < data.audit!.synthese!.pointsVigilance.length - 1 ? 'border-bottom: 1px solid rgba(245,158,11,0.15);' : ''}">
            <div style="width: 22px; height: 22px; border-radius: 6px; background: #fef3c7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 9pt; font-weight: 800; color: #d97706;">${i + 1}</div>
            <p style="font-size: 10pt; color: #92400e; line-height: 1.6; margin: 0;">${p}</p>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- Actions prioritaires détaillées -->
      ${data.audit.synthese.actionsPrioritaires.length > 0 ? `
      <div style="background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; padding: 20px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: #fee2e2; display: flex; align-items: center; justify-content: center;"><span style="font-size: 14pt;">🎯</span></div>
          <div style="font-size: 12pt; font-weight: 700; color: #dc2626;">Actions prioritaires</div>
        </div>
        ${data.audit.synthese.actionsPrioritaires.map((p, i) => `
          <div style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; ${i < data.audit!.synthese!.actionsPrioritaires.length - 1 ? 'border-bottom: 1px solid rgba(239,68,68,0.15);' : ''}">
            <div style="width: 22px; height: 22px; border-radius: 6px; background: #fee2e2; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 9pt; font-weight: 800; color: #dc2626;">${i + 1}</div>
            <p style="font-size: 10pt; color: #991b1b; line-height: 1.6; margin: 0;">${p}</p>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
    ` : ''}
  </div>

  <!-- ==================== PAGE: BUDGET & ÉPARGNE ==================== -->
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit — Bilan Budgétaire & Épargne</h2>
    </div>

    ${data.audit.budget ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">💰</div>
        <div>
          <div class="section-title">Bilan Budgétaire</div>
          <div class="section-subtitle">Revenus, charges et capacité d'épargne</div>
        </div>
      </div>

      <!-- Introduction pédagogique -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #f0fdf4); border-radius: 12px; border-left: 4px solid #10b981;">
        <p style="margin: 0 0 6px 0;">L'analyse budgétaire est la <strong>pierre angulaire</strong> de toute stratégie patrimoniale. Avant de chercher à optimiser votre fiscalité ou à investir, il est essentiel de comprendre comment se répartissent vos flux financiers mensuels : combien entre, combien sort, et combien il vous reste pour épargner.</p>
        <p style="margin: 0; font-size: 9pt; color: #64748b;"><strong>Indicateurs clés :</strong> le <strong>taux d'épargne</strong> (épargne ÷ revenus) devrait idéalement dépasser 15 %. Le <strong>taux d'effort</strong> (crédits + charges fixes ÷ revenus) ne devrait pas dépasser 50 % pour préserver un reste à vivre confortable.</p>
      </div>

      <!-- KPIs budget avec explications -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 14px;">
        <div class="card" style="border-left: 4px solid #10b981; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Revenus mensuels nets</div>
            <div style="font-size: 18pt; font-weight: 900; color: #10b981;">${formatCurrency(data.audit.budget.revenusMensuels)}</div>
          </div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">Soit <strong>${formatCurrency(data.audit.budget.revenusMensuels * 12)}/an</strong>. Inclut salaires, revenus fonciers, dividendes et autres revenus récurrents. Ce montant constitue la base de calcul de tous vos ratios budgétaires.</div>
        </div>
        <div class="card" style="border-left: 4px solid #ef4444; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Charges mensuelles totales</div>
            <div style="font-size: 18pt; font-weight: 900; color: #ef4444;">${formatCurrency(data.audit.budget.chargesMensuelles)}</div>
          </div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">Soit <strong>${formatCurrency(data.audit.budget.chargesMensuelles * 12)}/an</strong> (${data.audit.budget.revenusMensuels > 0 ? ((data.audit.budget.chargesMensuelles / data.audit.budget.revenusMensuels) * 100).toFixed(0) : 0}% des revenus). Inclut charges courantes, mensualités de crédit, impôts et cotisations.</div>
        </div>
        <div class="card" style="border-left: 4px solid #3b82f6; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Capacité d'épargne</div>
            <div style="font-size: 18pt; font-weight: 900; color: #3b82f6;">${formatCurrency(data.audit.budget.capaciteEpargneMensuelle)}</div>
          </div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">Taux d'épargne : <strong>${data.audit.budget.tauxEpargne.toFixed(1)}%</strong>. ${data.audit.budget.tauxEpargne >= 20 ? 'Excellent — vous dégagez une marge confortable pour investir et constituer votre patrimoine.' : data.audit.budget.tauxEpargne >= 10 ? 'Correct — un effort supplémentaire permettrait d\'accélérer la constitution de patrimoine (cible : 15-20 %).' : 'Insuffisant — il est urgent de réduire les charges ou d\'augmenter les revenus. Un taux <10 % ne permet pas de construire un patrimoine.'}</div>
        </div>
        <div class="card" style="border-left: 4px solid ${data.audit.budget.tauxEffort > 50 ? '#ef4444' : data.audit.budget.tauxEffort > 33 ? '#f59e0b' : '#10b981'}; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Taux d'effort</div>
            <div style="font-size: 18pt; font-weight: 900; color: ${data.audit.budget.tauxEffort > 50 ? '#ef4444' : data.audit.budget.tauxEffort > 33 ? '#f59e0b' : '#10b981'};">${data.audit.budget.tauxEffort.toFixed(1)}%</div>
          </div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">${data.audit.budget.tauxEffort <= 33 ? 'Maîtrisé (<33 %) — charges fixes raisonnables, bon reste à vivre.' : data.audit.budget.tauxEffort <= 50 ? 'Élevé (33-50 %) — vos charges fixes captent une part importante de vos revenus. Marge de manœuvre réduite pour l\'épargne.' : 'Critique (>50 %) — plus de la moitié de vos revenus partent en charges fixes. Risque financier en cas d\'imprévu.'} Seuil HCSF : 35 % pour les crédits seuls.</div>
        </div>
      </div>

      <!-- Graphiques revenus / charges -->
      <div class="card" style="margin-bottom: 12px;">
        <div style="display: flex; gap: 20px;">
          <div style="flex: 1;">
            <div style="font-size: 9pt; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Répartition des revenus</div>
            ${data.audit.budget.detailRevenus.length > 0 ? generateHorizontalBarChart(
              data.audit.budget.detailRevenus.slice(0, 5).map(d => ({ label: d.categorie, value: d.montant, color: '#10b981' })),
              220, 16, 10
            ) : '<div style="font-size:9pt;color:#94a3b8;">Pas de détail disponible</div>'}
          </div>
          <div style="flex: 1;">
            <div style="font-size: 9pt; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Répartition des charges</div>
            ${data.audit.budget.detailCharges.length > 0 ? generateHorizontalBarChart(
              data.audit.budget.detailCharges.slice(0, 5).map(d => ({ label: d.categorie, value: d.montant, color: '#ef4444' })),
              220, 16, 10
            ) : '<div style="font-size:9pt;color:#94a3b8;">Pas de détail disponible</div>'}
          </div>
        </div>
      </div>

      <!-- Narratif + alertes -->
      <div style="font-size: 9.5pt; color: #334155; line-height: 1.7; margin-bottom: 8px; padding: 12px; background: #f8fafc; border-radius: 10px;">${data.audit.budget.narratif}</div>
      ${data.audit.budget.alertes.map(a => `<div style="background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.15); border-radius: 8px; padding: 8px 12px; margin-top: 6px; font-size: 8.5pt; color: #991b1b;">⚠️ ${a}</div>`).join('')}
    </div>
    ` : ''}

    ` : ''}
  </div>

  <!-- ==================== PAGE: ÉPARGNE DE PRÉCAUTION ==================== -->
  ${data.audit.epargnePrecaution ? `
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit — Épargne de Précaution</h2>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">🛡</div>
        <div>
          <div class="section-title">Réserve de Sécurité Financière</div>
          <div class="section-subtitle">Analyse de votre matelas de sécurité — Recommandation : 3 à 6 mois de charges courantes</div>
        </div>
      </div>

      <!-- Introduction pédagogique -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #fefce8); border-radius: 12px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0 0 6px 0;"><strong>Qu'est-ce que l'épargne de précaution ?</strong> C'est la réserve d'argent immédiatement disponible (livret A, LDDS, fonds euros) destinée à faire face aux imprévus de la vie : perte d'emploi, panne de véhicule, travaux urgents, problème de santé. Elle constitue le <strong>premier étage de toute stratégie patrimoniale</strong>.</p>
        <p style="margin: 0; font-size: 9pt; color: #64748b;"><strong>Combien faut-il ?</strong> La recommandation des professionnels est de détenir entre <strong>3 et 6 mois de charges courantes</strong> en épargne liquide. Pour un salarié en CDI, 3 mois peuvent suffire. Pour un indépendant ou en cas de revenus variables, 6 mois ou plus sont recommandés. Cette réserve ne doit jamais être investie dans des placements risqués ou illiquides.</p>
      </div>

      <p style="font-size: 10.5pt; color: #334155; line-height: 1.8; margin-bottom: 16px;">${data.audit.epargnePrecaution.narratif}</p>

      <!-- KPIs épargne précaution avec explications -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 14px;">
        <div class="card" style="border-left: 4px solid #f59e0b; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Objectif (6 mois de charges)</div>
            <div style="font-size: 18pt; font-weight: 900; color: #f59e0b;">${formatCurrency(data.audit.epargnePrecaution.montantCible)}</div>
          </div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">Calculé comme <strong>6 × ${formatCurrency(data.audit.epargnePrecaution.montantCible / 6)}</strong> de charges mensuelles courantes. Ce montant vous permet de faire face à 6 mois sans revenu (perte d'emploi, arrêt maladie, transition professionnelle).</div>
        </div>
        <div class="card" style="border-left: 4px solid ${data.audit.epargnePrecaution.gap > 0 ? '#f59e0b' : '#10b981'}; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Épargne liquide actuelle</div>
            <div style="font-size: 18pt; font-weight: 900; color: ${data.audit.epargnePrecaution.gap > 0 ? '#f59e0b' : '#10b981'};">${formatCurrency(data.audit.epargnePrecaution.epargneLiquideActuelle)}</div>
          </div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">Couvre <strong>${data.audit.epargnePrecaution.moisCouverts?.toFixed(1) || '0'} mois</strong> de charges. ${data.audit.epargnePrecaution.gap > 0 ? `Gap de <strong style="color: #ef4444;">${formatCurrency(data.audit.epargnePrecaution.gap)}</strong> à combler en priorité — avant tout autre investissement.` : 'Objectif atteint ✅ — votre matelas de sécurité est constitué, vous pouvez investir le surplus.'}</div>
        </div>
      </div>

      <!-- Jauge visuelle couverture -->
      <div class="card" style="margin-bottom: 14px;">
        <div style="font-size: 9pt; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Niveau de couverture</div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="flex: 1; background: #e2e8f0; border-radius: 100px; height: 16px; overflow: hidden;">
            <div style="height: 100%; border-radius: 100px; width: ${Math.min(((data.audit.epargnePrecaution.epargneLiquideActuelle / data.audit.epargnePrecaution.montantCible) * 100), 100)}%; background: linear-gradient(90deg, ${data.audit.epargnePrecaution.gap > 0 ? '#f59e0b, #ef4444' : '#10b981, #059669'});"></div>
          </div>
          <span style="font-size: 11pt; font-weight: 800; color: ${data.audit.epargnePrecaution.gap > 0 ? '#f59e0b' : '#10b981'};">${data.audit.epargnePrecaution.montantCible > 0 ? ((data.audit.epargnePrecaution.epargneLiquideActuelle / data.audit.epargnePrecaution.montantCible) * 100).toFixed(0) : 0}%</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 8pt; color: #64748b;">
          <span>0 mois</span><span style="color: #f59e0b; font-weight: 600;">3 mois (minimum)</span><span style="color: #10b981; font-weight: 600;">6 mois (cible)</span>
        </div>
        <div style="margin-top: 8px; font-size: 8.5pt; color: #64748b; line-height: 1.5;"><strong>Supports recommandés :</strong> Livret A (plafond 22 950 €, taux 2,4 %), LDDS (plafond 12 000 €), fonds euros assurance-vie (disponible sous 72h). Ces supports sont garantis en capital et immédiatement disponibles — ne jamais placer votre épargne de précaution sur des supports risqués ou bloqués.</div>
      </div>

      <!-- Détail épargne liquide -->
      ${data.audit.epargnePrecaution.detailEpargneLiquide && data.audit.epargnePrecaution.detailEpargneLiquide.length > 0 ? `
      <div class="card" style="margin-bottom: 16px;">
        <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 10px;">Détail de votre épargne liquide disponible</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 10px; text-align: left; font-size: 9pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Support</th>
              <th style="padding: 10px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Montant</th>
              <th style="padding: 10px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Part</th>
            </tr>
          </thead>
          <tbody>
            ${data.audit.epargnePrecaution.detailEpargneLiquide.map(d => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; font-size: 10pt; font-weight: 600; color: #0f172a;">${d.support}</td>
                <td style="padding: 10px; text-align: right; font-size: 11pt; font-weight: 700;">${formatCurrency(d.montant)}</td>
                <td style="padding: 10px; text-align: right; font-size: 9pt; color: #64748b;">${data.audit!.epargnePrecaution!.epargneLiquideActuelle > 0 ? ((d.montant / data.audit!.epargnePrecaution!.epargneLiquideActuelle) * 100).toFixed(0) : '0'}%</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px; font-weight: 800; font-size: 10pt;">TOTAL</td>
              <td style="padding: 10px; text-align: right; font-weight: 800; font-size: 12pt; color: #3b82f6;">${formatCurrency(data.audit.epargnePrecaution.epargneLiquideActuelle)}</td>
              <td style="padding: 10px; text-align: right; font-weight: 700;">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
      ` : ''}

      <!-- Plan de constitution -->
      ${data.audit.epargnePrecaution.planConstitution ? `
      <div style="background: linear-gradient(135deg, rgba(59,130,246,0.05), rgba(99,102,241,0.05)); border: 1px solid rgba(59,130,246,0.2); border-radius: 12px; padding: 20px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: #dbeafe; display: flex; align-items: center; justify-content: center;"><span style="font-size: 14pt;">💡</span></div>
          <div style="font-size: 12pt; font-weight: 700; color: #1e40af;">Plan de constitution recommandé</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
          <div style="text-align: center; padding: 14px; background: white; border-radius: 10px;">
            <div style="font-size: 8pt; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Effort mensuel</div>
            <div style="font-size: 16pt; font-weight: 900; color: #3b82f6;">${formatCurrency(data.audit.epargnePrecaution.planConstitution.montantMensuel)}</div>
            <div style="font-size: 8pt; color: #64748b;">/mois</div>
          </div>
          <div style="text-align: center; padding: 14px; background: white; border-radius: 10px;">
            <div style="font-size: 8pt; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Durée</div>
            <div style="font-size: 16pt; font-weight: 900; color: #6366f1;">${data.audit.epargnePrecaution.planConstitution.moisEpargne}</div>
            <div style="font-size: 8pt; color: #64748b;">mois</div>
          </div>
          <div style="text-align: center; padding: 14px; background: white; border-radius: 10px;">
            <div style="font-size: 8pt; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Objectif</div>
            <div style="font-size: 16pt; font-weight: 900; color: #10b981;">${formatCurrency(data.audit.epargnePrecaution.montantCible)}</div>
            <div style="font-size: 8pt; color: #64748b;">cible</div>
          </div>
        </div>
        <p style="font-size: 9pt; color: #1e40af; margin-top: 12px; line-height: 1.5;">
          En épargnant ${formatCurrency(data.audit.epargnePrecaution.planConstitution.montantMensuel)}/mois, vous atteindrez votre objectif de réserve de précaution en ${data.audit.epargnePrecaution.planConstitution.moisEpargne} mois. 
          Nous recommandons un placement sur livret A ou LDDS pour garantir la disponibilité immédiate.
        </p>
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <!-- ==================== PAGE: CAPACITÉ D'EMPRUNT ==================== -->
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit — Capacité d'Emprunt</h2>
    </div>

    ${data.audit.emprunt ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🏦</div>
        <div>
          <div class="section-title">Capacité d'Emprunt</div>
          <div class="section-subtitle">Enveloppe de financement pour de nouveaux projets</div>
        </div>
      </div>

      <!-- Introduction pédagogique -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #eff6ff); border-radius: 12px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0 0 6px 0;"><strong>Comment est calculée votre capacité d'emprunt ?</strong> Les banques évaluent votre capacité à rembourser un crédit en se basant sur deux critères principaux : votre <strong>taux d'endettement</strong> (qui ne doit pas dépasser 35 % de vos revenus nets selon la norme HCSF) et votre <strong>reste à vivre</strong> (le montant qu'il vous reste après toutes charges et crédits).</p>
        <p style="margin: 0; font-size: 9pt; color: #64748b;"><strong>Lecture du tableau :</strong> la « capacité résiduelle » est la marge mensuelle dont vous disposez avant d'atteindre le plafond de 35 %. La « mensualité max supportable » est le montant maximal que vous pourriez consacrer à un nouveau crédit. Les enveloppes ci-dessous traduisent ces mensualités en montants empruntables selon la durée et le taux.</p>
      </div>

      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #eff6ff); border-radius: 12px; border-left: 4px solid #6366f1;">
        ${data.audit.emprunt.narratif}
      </div>

      <!-- KPIs emprunt avec explications -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px;">
        <div class="card" style="border-left: 4px solid ${data.audit.emprunt.tauxEndettementActuel > 33 ? '#ef4444' : data.audit.emprunt.tauxEndettementActuel > 25 ? '#f59e0b' : '#10b981'}; padding: 14px;">
          <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Endettement actuel</div>
          <div style="font-size: 20pt; font-weight: 900; color: ${data.audit.emprunt.tauxEndettementActuel > 33 ? '#ef4444' : '#0f172a'}; margin-bottom: 4px;">${data.audit.emprunt.tauxEndettementActuel.toFixed(1)}%</div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.4;">${data.audit.emprunt.tauxEndettementActuel <= 25 ? 'Confortable — large marge pour de nouveaux projets.' : data.audit.emprunt.tauxEndettementActuel <= 33 ? 'Marge réduite — proche du seuil HCSF.' : 'Au-delà du seuil HCSF (35 %) — refinancement ou remboursement prioritaire.'}</div>
        </div>
        <div class="card" style="border-left: 4px solid #10b981; padding: 14px;">
          <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Capacité résiduelle</div>
          <div style="font-size: 20pt; font-weight: 900; color: #10b981; margin-bottom: 4px;">${formatCurrency(data.audit.emprunt.capaciteEndettementResiduelle)}<span style="font-size: 9pt; color: #94a3b8;">/m</span></div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.4;">Marge mensuelle avant le plafond HCSF de 35 %. = (35 % × revenus) − mensualités actuelles.</div>
        </div>
        <div class="card" style="border-left: 4px solid #3b82f6; padding: 14px;">
          <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Mensualité max supportable</div>
          <div style="font-size: 20pt; font-weight: 900; color: #3b82f6; margin-bottom: 4px;">${formatCurrency(data.audit.emprunt.mensualiteMaxSupportable)}<span style="font-size: 9pt; color: #94a3b8;">/m</span></div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.4;">Montant mensuel maximum pour un nouveau crédit, en respectant la norme HCSF.</div>
        </div>
      </div>
      <div class="card" style="margin-top: 12px;">
        <div class="card-title" style="margin-bottom: 12px;">Enveloppes de financement possibles</div>
        <p style="font-size: 9pt; color: #64748b; line-height: 1.5; margin-bottom: 10px;">Le tableau ci-dessous présente le montant maximal que vous pourriez emprunter en fonction de la durée du crédit et du taux d'intérêt estimé. Ces montants sont calculés sur la base de votre capacité résiduelle d'endettement et ne tiennent pas compte de l'apport personnel ni des frais de notaire.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr style="background: #f8fafc;">
            <th style="padding: 8px; text-align: left; font-size: 9pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Durée</th>
            <th style="padding: 8px; text-align: center; font-size: 9pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Taux</th>
            <th style="padding: 8px; text-align: right; font-size: 9pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Montant max</th>
          </tr></thead>
          <tbody>
            ${data.audit.emprunt.enveloppes.map(e => `<tr>
              <td style="padding: 10px 8px; font-size: 10pt; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${e.duree} ans</td>
              <td style="padding: 10px 8px; text-align: center; font-size: 10pt; color: #64748b; border-bottom: 1px solid #f1f5f9;">${e.tauxInteret}%</td>
              <td style="padding: 10px 8px; text-align: right; font-size: 12pt; font-weight: 800; color: #3b82f6; border-bottom: 1px solid #f1f5f9;">${formatCurrency(e.montantMax)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}
  </div>

  <!-- ==================== CHAPITRE VIII: FISCALITÉ ==================== -->
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit — Situation Fiscale</h2>
    </div>

    ${data.audit.fiscalite ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📋</div>
        <div>
          <div class="section-title">Situation Fiscale</div>
          <div class="section-subtitle">Impôt sur le revenu, IFI et pistes d'optimisation</div>
        </div>
      </div>

      <!-- Explication du mécanisme IR -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px;">
        <p style="margin: 0 0 8px 0;">L'impôt sur le revenu (IR) est calculé selon un <strong>barème progressif</strong> (art. 197 CGI). Le mécanisme suit 3 étapes : (1) on divise le revenu imposable par le nombre de <strong>parts fiscales</strong> (quotient familial), (2) on applique le barème sur ce quotient, (3) on multiplie le résultat par le nombre de parts.</p>
      </div>

      <!-- Barème 2025 -->
      <div class="card" style="margin-bottom: 14px; border-left: 4px solid #ef4444;">
        <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin-bottom: 8px;">📊 Barème progressif de l'IR 2025 (revenus 2024)</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr style="background: #f8fafc;">
            <th style="padding: 6px 10px; text-align: left; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Tranche de revenu (par part)</th>
            <th style="padding: 6px 10px; text-align: center; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Taux</th>
            <th style="padding: 6px 10px; text-align: right; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Impôt max tranche</th>
          </tr></thead>
          <tbody>
            <tr><td style="padding: 5px 10px; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">Jusqu'à 11 294 €</td><td style="text-align: center; font-size: 9pt; font-weight: 600; color: #10b981; border-bottom: 1px solid #f1f5f9;">0 %</td><td style="text-align: right; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">0 €</td></tr>
            <tr><td style="padding: 5px 10px; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">11 294 € à 28 797 €</td><td style="text-align: center; font-size: 9pt; font-weight: 600; border-bottom: 1px solid #f1f5f9;">11 %</td><td style="text-align: right; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">1 925 €</td></tr>
            <tr><td style="padding: 5px 10px; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">28 797 € à 82 341 €</td><td style="text-align: center; font-size: 9pt; font-weight: 600; border-bottom: 1px solid #f1f5f9;">30 %</td><td style="text-align: right; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">16 063 €</td></tr>
            <tr><td style="padding: 5px 10px; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">82 341 € à 177 106 €</td><td style="text-align: center; font-size: 9pt; font-weight: 600; border-bottom: 1px solid #f1f5f9;">41 %</td><td style="text-align: right; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">38 854 €</td></tr>
            <tr style="background: rgba(239,68,68,0.04);"><td style="padding: 5px 10px; font-size: 9pt; font-weight: 700;">Au-delà de 177 106 €</td><td style="text-align: center; font-size: 9pt; font-weight: 700; color: #ef4444;">45 %</td><td style="text-align: right; font-size: 9pt; font-weight: 700;">∞</td></tr>
          </tbody>
        </table>
        <div style="font-size: 8.5pt; color: #64748b; margin-top: 6px;"><strong>Plafonnement QF :</strong> l'avantage lié aux demi-parts supplémentaires est plafonné à 1 759 €/demi-part (2025). <strong>CEHR :</strong> contribution exceptionnelle sur les hauts revenus — 3 % entre 250 000 € et 500 000 € (célibataire) ou 4 % au-delà.</div>
      </div>

      ${data.audit.fiscalite.ir ? `
      <!-- KPIs IR avec explications -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 14px;">
        <div class="card" style="border-left: 4px solid #ef4444; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Impôt sur le revenu</div>
            <div style="font-size: 18pt; font-weight: 900; color: #ef4444;">${formatCurrency(data.audit.fiscalite.ir.impotTotal)}<span style="font-size: 9pt; color: #94a3b8;">/an</span></div>
          </div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">Soit <strong>${formatCurrency(data.audit.fiscalite.ir.impotTotal / 12)}/mois</strong>. TMI à <strong>${data.audit.fiscalite.ir.tmi.toFixed(0)}%</strong> : seul votre dernier euro de revenu est taxé à ce taux. Taux effectif réel : <strong>${(data.audit.fiscalite.ir.tauxEffectif * 100).toFixed(1)}%</strong> (impôt ÷ revenu).</div>
        </div>
        <div class="card" style="border-left: 4px solid #10b981; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Revenu net après impôt</div>
            <div style="font-size: 18pt; font-weight: 900; color: #10b981;">${formatCurrency(data.audit.fiscalite.ir.revenuNetApresImpot)}<span style="font-size: 9pt; color: #94a3b8;">/an</span></div>
          </div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">Soit <strong>${formatCurrency(data.audit.fiscalite.ir.revenuNetApresImpot / 12)}/mois</strong>. Quotient familial : ${formatCurrency(data.audit.fiscalite.ir.quotientFamilial)} (revenu imposable ÷ nombre de parts). Vous conservez <strong>${((1 - data.audit.fiscalite.ir.tauxEffectif) * 100).toFixed(0)}%</strong> de vos revenus bruts.</div>
        </div>
      </div>

      <!-- Waterfall chart -->
      <div class="card" style="margin-bottom: 12px;">
        <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Cascade fiscale : du revenu brut au revenu net</div>
        <div style="font-size: 8.5pt; color: #64748b; line-height: 1.5; margin-bottom: 8px;">Ce graphique décompose les étapes du calcul : revenu brut → déductions → IR brut → décote éventuelle → CEHR éventuelle → prélèvements sociaux → revenu net final.</div>
        ${generateWaterfallChart([
          { label: 'Revenu brut', value: data.audit.fiscalite.ir.revenuBrut, type: 'add' },
          { label: 'Déductions', value: data.audit.fiscalite.ir.deductions, type: 'subtract' },
          { label: 'IR brut', value: data.audit.fiscalite.ir.impotBrut, type: 'subtract' },
          ...(data.audit.fiscalite.ir.decote > 0 ? [{ label: 'Décote', value: data.audit.fiscalite.ir.decote, type: 'add' as const }] : []),
          ...(data.audit.fiscalite.ir.cehr > 0 ? [{ label: 'CEHR', value: data.audit.fiscalite.ir.cehr, type: 'subtract' as const }] : []),
          { label: 'PS', value: data.audit.fiscalite.ir.contributionsSociales, type: 'subtract' },
          { label: 'Net final', value: data.audit.fiscalite.ir.revenuNetApresImpot, type: 'total' },
        ], 440, 170)}
        <div style="font-size: 8pt; color: #94a3b8; margin-top: 6px; text-align: center;">🟢 Ajout | 🔴 Prélèvement | 🟣 Solde final</div>
      </div>

      <!-- Détail tranches en tableau -->
      ${data.audit.fiscalite.ir.tranches.length > 0 ? `
      <div class="card" style="margin-bottom: 12px;">
        <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Votre imposition tranche par tranche</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr style="background: #f8fafc;">
            <th style="padding: 5px 8px; text-align: center; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Taux</th>
            <th style="padding: 5px 8px; text-align: right; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Base taxable</th>
            <th style="padding: 5px 8px; text-align: right; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Impôt</th>
          </tr></thead>
          <tbody>
            ${data.audit.fiscalite.ir.tranches.map(t => `
              <tr style="background: ${t.impot > 0 ? 'transparent' : 'rgba(16,185,129,0.04)'};">
                <td style="padding: 5px 8px; text-align: center; font-size: 10pt; font-weight: 800; color: ${t.impot > 0 ? '#ef4444' : '#10b981'}; border-bottom: 1px solid #f1f5f9;">${t.taux.toFixed(0)}%</td>
                <td style="padding: 5px 8px; text-align: right; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">${formatCurrency(t.base)}</td>
                <td style="padding: 5px 8px; text-align: right; font-size: 9pt; font-weight: 700; border-bottom: 1px solid #f1f5f9;">${formatCurrency(t.impot)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot><tr style="border-top: 2px solid #e2e8f0;">
            <td style="padding: 6px 8px; font-weight: 800; text-align: center; font-size: 9pt;">Total</td>
            <td style="padding: 6px 8px; text-align: right; font-size: 9pt;"></td>
            <td style="padding: 6px 8px; text-align: right; font-size: 10pt; font-weight: 900; color: #ef4444;">${formatCurrency(data.audit.fiscalite.ir.impotBrut)}</td>
          </tr></tfoot>
        </table>
      </div>
      ` : ''}
      ` : ''}

      <!-- Narratif IR -->
      <div style="font-size: 9.5pt; color: #334155; line-height: 1.7; padding: 12px; background: #f8fafc; border-radius: 10px; margin-top: 10px;">${data.audit.fiscalite.narratif}</div>
    </div>
    ` : ''}
  </div>

  <!-- ==================== PAGE: IFI & OPTIMISATION FISCALE ==================== -->
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit — IFI & Optimisation Fiscale</h2>
    </div>

    ${data.audit.fiscalite ? `
    <div class="section">
      <!-- Introduction pédagogique IFI -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #fefce8); border-radius: 12px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0 0 6px 0;"><strong>Qu'est-ce que l'IFI ?</strong> L'Impôt sur la Fortune Immobilière (art. 977 CGI) concerne les foyers dont le <strong>patrimoine immobilier net taxable dépasse 1 300 000 €</strong> au 1er janvier de l'année. Il remplace l'ancien ISF depuis 2018 et ne porte que sur les actifs immobiliers (hors actifs financiers, professionnels et mobiliers). Le barème est progressif, de 0,50 % à 1,50 %.</p>
        <p style="margin: 0; font-size: 9pt; color: #64748b;"><strong>Ce qui est taxable :</strong> résidence principale (abattement de 30 %), résidences secondaires, investissements locatifs, SCPI, OPCI, parts de SCI immobilières. <strong>Ce qui est exonéré :</strong> biens professionnels, actifs financiers (assurance-vie, PEA, CTO), biens mobiliers. Des stratégies de démembrement ou de restructuration peuvent réduire significativement l'assiette taxable.</p>
      </div>

      <!-- IFI -->
      ${data.audit.fiscalite.ifi?.assujetti ? `
      <div class="section-header">
        <div class="section-icon">🏛</div>
        <div>
          <div class="section-title">Impôt sur la Fortune Immobilière (IFI)</div>
          <div class="section-subtitle">Art. 977 et suivants du CGI — Patrimoine immobilier net taxable supérieur à 1 300 000 €</div>
        </div>
      </div>

      <!-- KPIs IFI avec explications -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px;">
        <div class="card" style="border-left: 4px solid #0f172a; padding: 14px;">
          <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Patrimoine immobilier net</div>
          <div style="font-size: 18pt; font-weight: 900; color: #0f172a; margin-bottom: 4px;">${formatCurrency(data.audit.fiscalite.ifi.patrimoineImposable)}</div>
          <div style="font-size: 8pt; color: #334155; line-height: 1.4;">Valeur vénale des biens immobiliers − dettes déductibles − abattement 30 % RP.</div>
        </div>
        <div class="card" style="border-left: 4px solid #ef4444; padding: 14px;">
          <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">IFI dû</div>
          <div style="font-size: 18pt; font-weight: 900; color: #ef4444; margin-bottom: 4px;">${formatCurrency(data.audit.fiscalite.ifi.montantIFI)}<span style="font-size: 9pt; color: #94a3b8;">/an</span></div>
          <div style="font-size: 8pt; color: #334155; line-height: 1.4;">Soit ${formatCurrency(data.audit.fiscalite.ifi.montantIFI / 12)}/mois. À déclarer et payer chaque année au 15 septembre.</div>
        </div>
        <div class="card" style="border-left: 4px solid #f59e0b; padding: 14px;">
          <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Taux effectif IFI</div>
          <div style="font-size: 18pt; font-weight: 900; color: #f59e0b; margin-bottom: 4px;">${data.audit.fiscalite.ifi.patrimoineImposable > 0 ? ((data.audit.fiscalite.ifi.montantIFI / data.audit.fiscalite.ifi.patrimoineImposable) * 100).toFixed(2) : '0'}%</div>
          <div style="font-size: 8pt; color: #334155; line-height: 1.4;">Charge fiscale réelle sur votre patrimoine immobilier. Le barème progressif va de 0,50 % à 1,50 %.</div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 14px; border-left: 4px solid #f59e0b;">
        <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin-bottom: 8px;">📊 Barème IFI 2025 (art. 977 CGI)</div>
        <div style="font-size: 8.5pt; color: #64748b; line-height: 1.5; margin-bottom: 8px;">Le seuil de taxation est fixé à 1 300 000 €, mais le barème s'applique à partir de 800 000 €. Une décote s'applique entre 1 300 000 € et 1 400 000 € (17 500 € − 1,25 % × patrimoine).</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr style="background: #f8fafc;">
            <th style="padding: 8px; text-align: left; font-size: 9pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Tranche</th>
            <th style="padding: 8px; text-align: center; font-size: 9pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Taux</th>
          </tr></thead>
          <tbody>
            ${[
              { tranche: 'Jusqu\'à 800 000 €', taux: '0%' },
              { tranche: '800 001 € — 1 300 000 €', taux: '0,50%' },
              { tranche: '1 300 001 € — 2 570 000 €', taux: '0,70%' },
              { tranche: '2 570 001 € — 5 000 000 €', taux: '1,00%' },
              { tranche: '5 000 001 € — 10 000 000 €', taux: '1,25%' },
              { tranche: 'Au-delà de 10 000 000 €', taux: '1,50%' },
            ].map(t => `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px; font-size: 9pt;">${t.tranche}</td><td style="padding: 8px; text-align: center; font-size: 10pt; font-weight: 700; color: #ef4444;">${t.taux}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      ` : `
      <div class="section-header">
        <div class="section-icon">🏛</div>
        <div>
          <div class="section-title">Impôt sur la Fortune Immobilière (IFI)</div>
          <div class="section-subtitle">Art. 977 et suivants du CGI</div>
        </div>
      </div>
      <div style="background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 18pt;">✅</span>
          <div>
            <div style="font-size: 11pt; font-weight: 700; color: #16a34a;">Non assujetti à l'IFI</div>
            <div style="font-size: 9pt; color: #065f46; margin-top: 4px;">Votre patrimoine immobilier net taxable est inférieur au seuil d'assujettissement de 1 300 000 €.</div>
          </div>
        </div>
      </div>
      `}

      <!-- Optimisation fiscale -->
      ${data.audit.fiscalite.optimisation && data.audit.fiscalite.optimisation.strategies.length > 0 ? `
      <div style="margin-top: 16px;">
        <div class="section-header">
          <div class="section-icon">💡</div>
          <div>
            <div class="section-title">Leviers d'Optimisation Fiscale</div>
            <div class="section-subtitle">Stratégies identifiées pour réduire votre charge fiscale</div>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, rgba(16,185,129,0.04), rgba(59,130,246,0.04)); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="font-size: 11pt; font-weight: 700; color: #0f172a;">Économies potentielles identifiées</div>
            <div style="font-size: 20pt; font-weight: 900; color: #10b981;">Jusqu'à ${formatCurrency(data.audit.fiscalite.optimisation.economiesPotentielles)}/an</div>
          </div>

          ${data.audit.fiscalite.optimisation.strategies.map((s, i) => `
            <div style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 0; ${i < data.audit.fiscalite!.optimisation!.strategies.length - 1 ? 'border-bottom: 1px solid rgba(16,185,129,0.15);' : ''}">
              <div style="width: 28px; height: 28px; border-radius: 8px; background: ${s.priorite === 'high' ? 'rgba(239,68,68,0.1)' : s.priorite === 'medium' ? 'rgba(245,158,11,0.1)' : '#f1f5f9'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 11pt; font-weight: 800; color: ${s.priorite === 'high' ? '#ef4444' : s.priorite === 'medium' ? '#f59e0b' : '#64748b'};">${i + 1}</div>
              <div style="flex: 1;">
                <p style="font-size: 11pt; font-weight: 700; color: #0f172a; margin: 0;">${s.nom}</p>
                <p style="font-size: 9pt; color: #64748b; margin: 4px 0 0 0; line-height: 1.6;">${s.description}</p>
                <div style="display: flex; gap: 8px; margin-top: 6px;">
                  <span style="font-size: 7pt; padding: 2px 8px; border-radius: 100px; font-weight: 600; ${s.priorite === 'high' ? 'background: rgba(239,68,68,0.1); color: #ef4444;' : s.priorite === 'medium' ? 'background: rgba(245,158,11,0.1); color: #f59e0b;' : 'background: #f1f5f9; color: #64748b;'}">Priorité ${s.priorite === 'high' ? 'haute' : s.priorite === 'medium' ? 'moyenne' : 'basse'}</span>
                </div>
              </div>
              <div style="text-align: right; flex-shrink: 0;">
                <span style="font-size: 14pt; font-weight: 900; color: #10b981;">+${formatCurrency(s.economie)}</span>
                <div style="font-size: 7pt; color: #94a3b8;">/an</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>
    ` : ''}
  </div>

  <!-- ==================== PAGE: REVENUS FONCIERS — ANALYSE DÉTAILLÉE ==================== -->
  ${data.audit.fiscalite?.impactRevenusFonciers ? `
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit — Revenus Fonciers</h2>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">🏘</div>
        <div>
          <div class="section-title">Fiscalité des revenus fonciers</div>
          <div class="section-subtitle">Régime d'imposition, charges déductibles et optimisation</div>
        </div>
      </div>

      <!-- Introduction pédagogique -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #fef2f2); border-radius: 12px; border-left: 4px solid #ef4444;">
        <p style="margin: 0 0 6px 0;"><strong>Comment sont imposés les revenus fonciers ?</strong> Les loyers perçus d'une location nue sont imposés dans la catégorie des <strong>revenus fonciers</strong>. Deux régimes existent : le <strong>micro-foncier</strong> (abattement forfaitaire de 30 %, si revenus fonciers < 15 000 €/an) et le <strong>régime réel</strong> (déduction des charges réelles : intérêts d'emprunt, travaux, assurance, gestion, taxe foncière…).</p>
        <p style="margin: 0; font-size: 9pt; color: #64748b;"><strong>Double imposition :</strong> les revenus fonciers sont soumis à l'IR au barème progressif (votre TMI) <strong>et</strong> aux prélèvements sociaux (17,2 %). Soit un taux global pouvant atteindre ${data.audit.fiscalite.ir?.tmi ? `${data.audit.fiscalite.ir.tmi + 17.2}%` : '47,2 %'} pour les TMI à 30 %, et jusqu'à 62,2 % pour les TMI à 45 %. Le choix du régime est donc crucial.</p>
      </div>

      <!-- KPIs revenus fonciers -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px;">
        <div class="card" style="border-left: 4px solid #3b82f6; padding: 14px;">
          <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Revenus fonciers bruts</div>
          <div style="font-size: 18pt; font-weight: 900; color: #0f172a; margin-bottom: 4px;">${formatCurrency(data.audit.fiscalite.impactRevenusFonciers.revenusFonciersAnnuels)}<span style="font-size: 8pt; color: #94a3b8;">/an</span></div>
          <div style="font-size: 8pt; color: #334155; line-height: 1.4;">Total des loyers perçus avant charges et impôts. Soit ${formatCurrency(data.audit.fiscalite.impactRevenusFonciers.revenusFonciersAnnuels / 12)}/mois.</div>
        </div>
        <div class="card" style="border-left: 4px solid #ef4444; padding: 14px;">
          <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Fiscalité totale foncière</div>
          <div style="font-size: 18pt; font-weight: 900; color: #ef4444; margin-bottom: 4px;">${formatCurrency(data.audit.fiscalite.impactRevenusFonciers.totalFiscaliteFonciere)}<span style="font-size: 8pt; color: #94a3b8;">/an</span></div>
          <div style="font-size: 8pt; color: #334155; line-height: 1.4;">IR foncier (${formatCurrency(data.audit.fiscalite.impactRevenusFonciers.irFoncier)}) + PS (${formatCurrency(data.audit.fiscalite.impactRevenusFonciers.psFoncier)}).</div>
        </div>
        <div class="card" style="border-left: 4px solid ${data.audit.fiscalite.impactRevenusFonciers.tauxImpositionGlobal > 40 ? '#ef4444' : data.audit.fiscalite.impactRevenusFonciers.tauxImpositionGlobal > 30 ? '#f59e0b' : '#10b981'}; padding: 14px;">
          <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Taux d'imposition global</div>
          <div style="font-size: 18pt; font-weight: 900; color: ${data.audit.fiscalite.impactRevenusFonciers.tauxImpositionGlobal > 40 ? '#ef4444' : data.audit.fiscalite.impactRevenusFonciers.tauxImpositionGlobal > 30 ? '#f59e0b' : '#10b981'}; margin-bottom: 4px;">${data.audit.fiscalite.impactRevenusFonciers.tauxImpositionGlobal.toFixed(1)}%</div>
          <div style="font-size: 8pt; color: #334155; line-height: 1.4;">TMI (${data.audit.fiscalite.ir?.tmi || '—'}%) + PS (17,2 %). ${data.audit.fiscalite.impactRevenusFonciers.tauxImpositionGlobal > 40 ? 'Taux élevé — optimisation recommandée.' : 'Taux contenu.'}</div>
        </div>
      </div>

      <!-- Régime fiscal actuel -->
      <div class="card" style="margin-bottom: 14px;">
        <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin-bottom: 8px;">📋 Votre régime fiscal actuel : ${data.audit.fiscalite.impactRevenusFonciers.regimeFiscal}</div>
        <div style="font-size: 9.5pt; color: #334155; line-height: 1.7;">
          ${data.audit.fiscalite.impactRevenusFonciers.regimeFiscal === 'micro-foncier'
            ? `<p style="margin: 0 0 6px 0;">Vous êtes au <strong>micro-foncier</strong> : un abattement forfaitaire de 30 % est appliqué sur vos loyers bruts, sans possibilité de déduire les charges réelles. Ce régime est simple mais pas toujours optimal.</p>
               <p style="margin: 0;">Base imposable = ${formatCurrency(data.audit.fiscalite.impactRevenusFonciers.revenusFonciersAnnuels)} × 70 % = <strong>${formatCurrency(data.audit.fiscalite.impactRevenusFonciers.baseImposable)}</strong>.</p>`
            : `<p style="margin: 0 0 6px 0;">Vous êtes au <strong>régime réel</strong> : vous déduisez les charges réellement engagées (intérêts d'emprunt, travaux, assurance PNO, frais de gestion, taxe foncière…). Ce régime est avantageux si vos charges dépassent 30 % des loyers.</p>
               <p style="margin: 0;">Base imposable après déduction des charges : <strong>${formatCurrency(data.audit.fiscalite.impactRevenusFonciers.baseImposable)}</strong>.</p>`
          }
        </div>
      </div>

      <!-- Comparatif micro vs réel -->
      <div class="card" style="border-left: 4px solid #8b5cf6; margin-bottom: 14px;">
        <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin-bottom: 8px;">⚖️ Comparatif Micro-Foncier vs Régime Réel</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr style="background: #f8fafc;">
            <th style="padding: 6px 10px; text-align: left; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Critère</th>
            <th style="padding: 6px 10px; text-align: center; font-size: 8pt; color: #3b82f6; font-weight: 700; border-bottom: 1px solid #e2e8f0;">Micro-foncier</th>
            <th style="padding: 6px 10px; text-align: center; font-size: 8pt; color: #8b5cf6; font-weight: 700; border-bottom: 1px solid #e2e8f0;">Régime réel</th>
          </tr></thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 5px 10px; font-size: 9pt; font-weight: 600;">Condition</td><td style="padding: 5px 10px; text-align: center; font-size: 9pt;">Loyers < 15 000 €/an</td><td style="padding: 5px 10px; text-align: center; font-size: 9pt;">Aucune</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 5px 10px; font-size: 9pt; font-weight: 600;">Abattement / Déductions</td><td style="padding: 5px 10px; text-align: center; font-size: 9pt;">Forfait 30 %</td><td style="padding: 5px 10px; text-align: center; font-size: 9pt;">Charges réelles</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 5px 10px; font-size: 9pt; font-weight: 600;">Intérêts d'emprunt</td><td style="padding: 5px 10px; text-align: center; font-size: 9pt; color: #ef4444;">Non déductibles</td><td style="padding: 5px 10px; text-align: center; font-size: 9pt; color: #10b981; font-weight: 700;">Déductibles</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 5px 10px; font-size: 9pt; font-weight: 600;">Travaux</td><td style="padding: 5px 10px; text-align: center; font-size: 9pt; color: #ef4444;">Non déductibles</td><td style="padding: 5px 10px; text-align: center; font-size: 9pt; color: #10b981; font-weight: 700;">Déductibles (10 700 €/an max déficit)</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 5px 10px; font-size: 9pt; font-weight: 600;">Déficit foncier</td><td style="padding: 5px 10px; text-align: center; font-size: 9pt; color: #ef4444;">Impossible</td><td style="padding: 5px 10px; text-align: center; font-size: 9pt; color: #10b981; font-weight: 700;">Imputable sur revenu global (10 700 €)</td></tr>
            <tr><td style="padding: 5px 10px; font-size: 9pt; font-weight: 600;">Complexité</td><td style="padding: 5px 10px; text-align: center; font-size: 9pt; color: #10b981;">Très simple</td><td style="padding: 5px 10px; text-align: center; font-size: 9pt; color: #f59e0b;">Comptabilité détaillée</td></tr>
          </tbody>
        </table>
        <div style="font-size: 8pt; color: #64748b; margin-top: 6px; line-height: 1.5;">💡 <strong>Règle empirique :</strong> si vos charges réelles (intérêts + travaux + gestion + taxe foncière + assurance) dépassent 30 % de vos loyers bruts, le régime réel est plus avantageux. L'option pour le réel est irrévocable pendant 3 ans.</div>
      </div>

      <!-- Narratif -->
      <div style="font-size: 9.5pt; color: #334155; line-height: 1.7; padding: 12px; background: #f8fafc; border-radius: 10px;">${data.audit.fiscalite.impactRevenusFonciers.narratif}</div>
    </div>
  </div>
  ` : ''}

  <!-- ==================== CHAPITRE IX: PATRIMOINE IMMOBILIER ==================== -->
  ${data.audit.immobilier ? `
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit — Patrimoine Immobilier — Synthèse</h2>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">🏠</div>
        <div>
          <div class="section-title">Vue d'ensemble du patrimoine immobilier</div>
          <div class="section-subtitle">${data.audit.immobilier.biens.length} bien(s) — Analyse détaillée et scénarios de revente</div>
        </div>
      </div>

      <!-- Introduction pédagogique -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #eff6ff); border-radius: 12px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0 0 6px 0;">Cette section analyse en profondeur votre <strong>patrimoine immobilier</strong>. Pour chaque bien, nous évaluons sa valeur estimée, son poids dans votre patrimoine global, son rendement locatif (s'il est mis en location), et sa performance potentielle en cas de revente à différents horizons.</p>
        <p style="margin: 0; font-size: 9pt; color: #64748b;"><strong>Rendement locatif brut</strong> = loyers annuels ÷ valeur du bien. Un rendement brut supérieur à 5 % est considéré comme bon. Le <strong>rendement net</strong> tient compte des charges, taxe foncière, assurance, et vacance locative. La <strong>concentration</strong> mesure le risque lié à une surexposition sur un seul bien : au-delà de 40 % du patrimoine, le risque est considéré comme élevé.</p>
      </div>

      <p style="font-size: 10.5pt; color: #334155; line-height: 1.8; margin-bottom: 16px;">${data.audit.immobilier.narratif}</p>

      <!-- Tableau récapitulatif -->
      <div class="table-container" style="margin-bottom: 16px;">
        <div class="table-header">
          <span class="table-title">Récapitulatif des biens immobiliers</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Bien</th>
              <th>Type</th>
              <th style="text-align: right;">Valeur</th>
              <th style="text-align: right;">Poids</th>
              <th style="text-align: right;">Rdt brut</th>
            </tr>
          </thead>
          <tbody>
            ${data.audit.immobilier.biens.map(b => `
              <tr>
                <td class="td-main">${b.nom}</td>
                <td>${b.type.replace(/_/g, ' ')}</td>
                <td class="td-amount">${formatCurrency(b.valeur)}</td>
                <td style="text-align: right; font-size: 9pt; color: #64748b;">${b.poidsPatrimoine.toFixed(1)}%</td>
                <td style="text-align: right; font-size: 9pt; color: #3b82f6;">${b.rendementLocatifBrut ? b.rendementLocatifBrut.toFixed(1) + '%' : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot class="table-footer">
            <tr>
              <td colspan="2">Total Immobilier</td>
              <td class="td-amount">${formatCurrency(totalImmobilier)}</td>
              <td style="text-align: right;">${tauxImmo.toFixed(1)}%</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Concentration / Diversification -->
      <div class="card">
        <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Concentration immobilière</div>
        <div style="font-size: 8.5pt; color: #64748b; line-height: 1.5; margin-bottom: 10px;">Poids de chaque bien dans votre patrimoine total. Un bien pesant plus de <strong style="color: #ef4444;">40 %</strong> du patrimoine représente un risque de concentration élevé (illiquidité, dépendance géographique, risque locatif). Diversifier entre plusieurs biens et zones géographiques réduit ce risque.</div>
        ${data.audit.immobilier.biens.map(b => `
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <div style="width: 140px; font-size: 9pt; font-weight: 600; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.nom}</div>
            <div style="flex: 1; background: #e2e8f0; border-radius: 100px; height: 14px; overflow: hidden;">
              <div style="height: 100%; border-radius: 100px; width: ${Math.min(b.poidsPatrimoine, 100)}%; background: ${b.poidsPatrimoine > 40 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #6366f1)'};"></div>
            </div>
            <div style="width: 60px; text-align: right; font-size: 10pt; font-weight: 800; color: ${b.poidsPatrimoine > 40 ? '#ef4444' : '#0f172a'};">${b.poidsPatrimoine.toFixed(1)}%</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <!-- ==================== PAGES: DÉTAIL PAR BIEN IMMOBILIER ==================== -->
  ${renderBienImmobilierPages(data.audit.immobilier.biens, data.audit.immobilier.biens.length, formatCurrency, `Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}`, generateKpiCard)}
  ` : ''}

  <!-- ==================== CHAPITRE X: PATRIMOINE FINANCIER ==================== -->
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit — Patrimoine Financier</h2>
    </div>

    ${data.audit.financier ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📈</div>
        <div>
          <div class="section-title">Patrimoine Financier</div>
          <div class="section-subtitle">Allocation, diversification et enveloppes fiscales</div>
        </div>
      </div>

      <!-- Introduction pédagogique -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #f5f3ff); border-radius: 12px; border-left: 4px solid #8b5cf6;">
        <p style="margin: 0 0 6px 0;">L'analyse de votre <strong>patrimoine financier</strong> repose sur trois piliers : la <strong>diversification</strong> (ne pas mettre tous ses œufs dans le même panier), le <strong>niveau de risque</strong> (adapté à votre profil investisseur et votre horizon), et le <strong>choix des enveloppes fiscales</strong> (chaque enveloppe — AV, PEA, PER, CTO — offre un cadre fiscal différent).</p>
        <p style="margin: 0; font-size: 9pt; color: #64748b;"><strong>Score de diversification :</strong> mesure la répartition de vos actifs entre différentes classes (actions, obligations, immobilier pierre-papier, fonds euros, liquidités). Plus le score est élevé, mieux vos risques sont répartis. <strong>Score de sécurité :</strong> inverse du risque — un score élevé signifie un portefeuille prudent. Le graphique « Actuel vs Cible » compare votre allocation actuelle à celle recommandée pour votre profil.</p>
      </div>

      <!-- KPIs financier avec explications -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 14px;">
        <div class="card" style="border-left: 4px solid #8b5cf6; padding: 14px;">
          <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Total financier</div>
          <div style="font-size: 18pt; font-weight: 900; color: #0f172a; margin-bottom: 4px;">${formatCurrency(data.audit.financier.totalFinancier)}</div>
          <div style="font-size: 8pt; color: #334155; line-height: 1.4;">${data.audit.financier.actifs.length} ligne(s) d'investissement. ${data.audit.financier.totalFinancier > 0 && totalActifs > 0 ? `Représente <strong>${((data.audit.financier.totalFinancier / totalActifs) * 100).toFixed(0)}%</strong> de votre patrimoine brut.` : ''}</div>
        </div>
        <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          ${generateGauge(data.audit.financier.scoreDiversification, 100, 100, undefined, 'Diversification')}
          <div style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">${data.audit.financier.scoreDiversification >= 70 ? 'Bien réparti' : data.audit.financier.scoreDiversification >= 40 ? 'À améliorer' : 'Concentré'}</div>
        </div>
        <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          ${generateGauge(100 - data.audit.financier.scoreRisque, 100, 100, undefined, 'Sécurité')}
          <div style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">${data.audit.financier.scoreRisque <= 30 ? 'Profil prudent' : data.audit.financier.scoreRisque <= 60 ? 'Profil équilibré' : 'Profil dynamique'}</div>
        </div>
      </div>

      <!-- Donut allocation par type + Comparaison actuel/cible -->
      <div class="card" style="margin-bottom: 12px;">
        <div style="display: flex; gap: 20px;">
          <div style="flex: 1;">
            <div style="font-size: 9pt; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Allocation par type</div>
            ${(() => {
              const allocationColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']
              return generateDonutChart(
                data.audit.financier!.allocationParType.map((a, i) => ({ label: a.type, value: a.valeur, color: allocationColors[i % allocationColors.length] })),
                140, 18, { centerLabel: 'Financier', centerValue: formatCurrency(data.audit.financier!.totalFinancier) }
              )
            })()}
          </div>
          ${data.audit.financier.recommandationAllocation.length > 0 ? `
          <div style="flex: 1;">
            <div style="font-size: 9pt; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Allocation actuelle vs cible</div>
            ${generateStackedComparison(
              data.audit.financier!.recommandationAllocation.slice(0, 4).map((r, i) => ({
                label: r.categorie,
                actuel: r.actuel,
                cible: r.cible,
                color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][i % 4]
              })),
              220, 14
            )}
          </div>` : ''}
        </div>
      </div>

      <!-- Narratif -->
      <div style="font-size: 9.5pt; color: #334155; line-height: 1.7; padding: 12px; background: #f8fafc; border-radius: 10px; margin-top: 12px;">${data.audit.financier.narratif}</div>
    </div>
    ` : ''}
  </div>

  <!-- ==================== PAGE: PATRIMOINE FINANCIER — DÉTAIL ACTIFS ==================== -->
  ${data.audit.financier ? `
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit — Actifs Financiers — Détail</h2>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">📋</div>
        <div>
          <div class="section-title">Détail des actifs financiers</div>
          <div class="section-subtitle">${data.audit.financier.actifs.length} ligne(s) — Analyse risque, enveloppe et liquidité</div>
        </div>
      </div>

      <!-- Introduction pédagogique -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #f5f3ff); border-radius: 12px; border-left: 4px solid #8b5cf6;">
        <p style="margin: 0 0 6px 0;"><strong>Lecture du tableau :</strong> chaque ligne représente un actif financier avec son enveloppe fiscale, son niveau de risque, sa liquidité (disponibilité) et son poids dans votre portefeuille.</p>
        <p style="margin: 0; font-size: 9pt; color: #64748b;">
          <strong>Enveloppes fiscales :</strong> l'<strong>assurance-vie (AV)</strong> offre un cadre fiscal avantageux après 8 ans (abattement de 4 600 €/an sur les gains, ou 9 200 € pour un couple). Le <strong>PEA</strong> exonère les plus-values d'IR après 5 ans. Le <strong>PER</strong> permet de déduire les versements de vos revenus imposables. Le <strong>CTO</strong> (compte-titres) est le plus flexible mais soumis au PFU de 30 %. 
          <strong>Risque :</strong> « faible » = fonds euros, livrets ; « modéré » = SCPI, obligations ; « élevé » = actions, private equity.
        </p>
      </div>

      <div class="table-container" style="margin-bottom: 16px;">
        <div class="table-header">
          <span class="table-title">Portefeuille financier complet</span>
          <span class="card-badge badge-success">${formatCurrency(data.audit.financier.totalFinancier)}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Actif</th>
              <th>Enveloppe</th>
              <th>Risque</th>
              <th>Liquidité</th>
              <th style="text-align: right;">Valeur</th>
              <th style="text-align: right;">Poids</th>
            </tr>
          </thead>
          <tbody>
            ${data.audit.financier.actifs.map(a => `
              <tr>
                <td class="td-main">${a.nom}</td>
                <td><span style="font-size: 7.5pt; padding: 2px 8px; border-radius: 100px; background: rgba(59,130,246,0.1); color: #3b82f6; font-weight: 600;">${a.enveloppeFiscale}</span></td>
                <td><span style="font-size: 7.5pt; padding: 2px 8px; border-radius: 100px; font-weight: 600; background: ${a.risque === 'faible' ? 'rgba(16,185,129,0.1)' : a.risque === 'eleve' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'}; color: ${a.risque === 'faible' ? '#10b981' : a.risque === 'eleve' ? '#ef4444' : '#f59e0b'};">${a.risque}</span></td>
                <td><span style="font-size: 7.5pt; color: #64748b;">${a.liquidite}</span></td>
                <td class="td-amount">${formatCurrency(a.valeur)}</td>
                <td style="text-align: right; font-size: 9pt; color: #64748b;">${a.poidsPortefeuille.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot class="table-footer">
            <tr>
              <td colspan="4">Total Portefeuille</td>
              <td class="td-amount">${formatCurrency(data.audit.financier.totalFinancier)}</td>
              <td style="text-align: right;">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Recommandations allocation -->
      ${data.audit.financier.recommandationAllocation.length > 0 ? `
      <div class="card">
        <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Recommandations d'allocation</div>
        ${data.audit.financier.recommandationAllocation.map(r => `
          <div style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
            <div style="width: 100px; font-size: 9pt; font-weight: 600; color: #0f172a;">${r.categorie}</div>
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="font-size: 8pt; color: #64748b;">Actuel</span>
                <div style="flex: 1; background: #e2e8f0; border-radius: 100px; height: 8px; overflow: hidden;"><div style="height: 100%; border-radius: 100px; width: ${Math.min(r.actuel, 100)}%; background: #3b82f6;"></div></div>
                <span style="font-size: 9pt; font-weight: 700; width: 35px; text-align: right;">${r.actuel.toFixed(0)}%</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 8pt; color: #64748b;">Cible  </span>
                <div style="flex: 1; background: #e2e8f0; border-radius: 100px; height: 8px; overflow: hidden;"><div style="height: 100%; border-radius: 100px; width: ${Math.min(r.cible, 100)}%; background: #10b981;"></div></div>
                <span style="font-size: 9pt; font-weight: 700; width: 35px; text-align: right; color: #10b981;">${r.cible.toFixed(0)}%</span>
              </div>
            </div>
            <div style="width: 50px; text-align: center; font-size: 10pt; font-weight: 800; color: ${Math.abs(r.actuel - r.cible) > 10 ? '#ef4444' : '#10b981'};">${r.actuel > r.cible ? '↓' : r.actuel < r.cible ? '↑' : '='}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <!-- ==================== CHAPITRE XI: ENVELOPPES FISCALES ==================== -->
  ${data.audit.financier ? `
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Guide — Enveloppes Fiscales Comparées</h2>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">📦</div>
        <div>
          <div class="section-title">Comparatif des enveloppes d'investissement</div>
          <div class="section-subtitle">Assurance-Vie, PEA, PER, Compte-Titres — Avantages, limites et fiscalité</div>
        </div>
      </div>

      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #f5f3ff); border-radius: 12px; border-left: 4px solid #8b5cf6;">
        <p style="margin: 0 0 6px 0;">Le choix de l'<strong>enveloppe fiscale</strong> est aussi important que le choix du support d'investissement. Chaque enveloppe offre un cadre fiscal, juridique et successoral distinct. Le tableau ci-dessous compare les quatre principales enveloppes disponibles pour les résidents fiscaux français.</p>
        <p style="margin: 0; font-size: 9pt; color: #64748b;"><strong>Principe :</strong> diversifier ses enveloppes permet de combiner les avantages de chacune — liquidité du CTO, avantage fiscal du PEA, déductibilité du PER, transmission de l'AV.</p>
      </div>

      <!-- Tableau comparatif complet -->
      <div class="table-container" style="margin-bottom: 14px;">
        <div class="table-header">
          <span class="table-title">Tableau comparatif des enveloppes fiscales</span>
        </div>
        <table style="font-size: 8.5pt;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 8px 10px; font-size: 7.5pt; width: 100px;">Critère</th>
              <th style="padding: 8px 10px; font-size: 7.5pt; text-align: center; background: rgba(99,102,241,0.05); color: #6366f1;">Assurance-Vie</th>
              <th style="padding: 8px 10px; font-size: 7.5pt; text-align: center; background: rgba(59,130,246,0.05); color: #3b82f6;">PEA</th>
              <th style="padding: 8px 10px; font-size: 7.5pt; text-align: center; background: rgba(16,185,129,0.05); color: #10b981;">PER</th>
              <th style="padding: 8px 10px; font-size: 7.5pt; text-align: center;">CTO</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="padding: 6px 10px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Plafond</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Illimité</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">150 000 €</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Illimité</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Illimité</td></tr>
            <tr><td style="padding: 6px 10px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Supports</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Fonds €, UC, SCPI, PE</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Actions EU, ETF EU</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Fonds €, UC, ETF</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Tout (mondial)</td></tr>
            <tr><td style="padding: 6px 10px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Fiscalité gains</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">PFU 30 % ou abatt. 4 600 €/9 200 € après 8 ans</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Exonéré IR après 5 ans (PS 17,2 % sur gains)</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">IR barème à la sortie (capital/rente)</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">PFU 30 % ou barème IR</td></tr>
            <tr><td style="padding: 6px 10px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Déductibilité</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Non</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Non</td><td style="padding: 6px 10px; text-align: center; font-weight: 700; color: #10b981; border-bottom: 1px solid #f1f5f9;">Oui (10 % revenus N-1)</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Non</td></tr>
            <tr><td style="padding: 6px 10px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Liquidité</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Rachats à tout moment</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Libre après 5 ans (clôture avant)</td><td style="padding: 6px 10px; text-align: center; color: #ef4444; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Bloqué jusqu'à retraite</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Totale</td></tr>
            <tr><td style="padding: 6px 10px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Succession</td><td style="padding: 6px 10px; text-align: center; font-weight: 700; color: #6366f1; border-bottom: 1px solid #f1f5f9;">Hors succession (152 500 €/bénéf.)</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Dans la succession</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Clause bénéf. possible</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Dans la succession</td></tr>
            <tr><td style="padding: 6px 10px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">Nb contrats</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Illimité</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">1 par personne</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Illimité</td><td style="padding: 6px 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">Illimité</td></tr>
            <tr><td style="padding: 6px 10px; font-weight: 600; color: #0f172a;">Idéal pour</td><td style="padding: 6px 10px; text-align: center; font-size: 8pt; color: #6366f1; font-weight: 600;">Épargne long terme, transmission, complément retraite</td><td style="padding: 6px 10px; text-align: center; font-size: 8pt; color: #3b82f6; font-weight: 600;">Investissement actions européennes, capitalisation</td><td style="padding: 6px 10px; text-align: center; font-size: 8pt; color: #10b981; font-weight: 600;">Préparation retraite, défiscalisation TMI ≥ 30 %</td><td style="padding: 6px 10px; text-align: center; font-size: 8pt; font-weight: 600;">Flexibilité, accès marchés mondiaux, trading</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Points clés par enveloppe -->
      <div class="envelopes-grid">
        <div class="card" style="border-left: 4px solid #6366f1; padding: 14px;">
          <div style="font-size: 9pt; font-weight: 800; color: #6366f1; margin-bottom: 6px;">🛡 Assurance-Vie</div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.6;">
            <p style="margin: 0 0 4px 0;">• <strong>Avant 8 ans :</strong> PFU 30 % sur les gains (12,8 % IR + 17,2 % PS)</p>
            <p style="margin: 0 0 4px 0;">• <strong>Après 8 ans :</strong> abattement de 4 600 €/an (9 200 € couple) sur les gains, puis 24,7 % ou barème IR + PS</p>
            <p style="margin: 0 0 4px 0;">• <strong>Transmission :</strong> 152 500 € par bénéficiaire (art. 990 I) si primes versées avant 70 ans</p>
            <p style="margin: 0;">• <strong>Atout :</strong> enveloppe multi-support (fonds €, UC, SCPI, PE), clause bénéficiaire sur mesure</p>
          </div>
        </div>
        <div class="card" style="border-left: 4px solid #3b82f6; padding: 14px;">
          <div style="font-size: 9pt; font-weight: 800; color: #3b82f6; margin-bottom: 6px;">📈 PEA (Plan d'Épargne en Actions)</div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.6;">
            <p style="margin: 0 0 4px 0;">• <strong>Plafond :</strong> 150 000 € (PEA classique) + 225 000 € (PEA-PME)</p>
            <p style="margin: 0 0 4px 0;">• <strong>Après 5 ans :</strong> gains exonérés d'IR, seuls les PS (17,2 %) restent dus</p>
            <p style="margin: 0 0 4px 0;">• <strong>Avant 5 ans :</strong> retrait = clôture du plan + PFU sur les gains</p>
            <p style="margin: 0;">• <strong>Atout :</strong> fiscalité la plus avantageuse pour les actions européennes</p>
          </div>
        </div>
        <div class="card" style="border-left: 4px solid #10b981; padding: 14px;">
          <div style="font-size: 9pt; font-weight: 800; color: #10b981; margin-bottom: 6px;">🎯 PER (Plan d'Épargne Retraite)</div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.6;">
            <p style="margin: 0 0 4px 0;">• <strong>Déductibilité :</strong> versements déductibles du revenu imposable (plafond 10 % revenus, max ~35 194 €)</p>
            <p style="margin: 0 0 4px 0;">• <strong>Sortie :</strong> capital ou rente à la retraite, soumis à l'IR</p>
            <p style="margin: 0 0 4px 0;">• <strong>Blocage :</strong> épargne bloquée sauf cas exceptionnels (achat RP, invalidité, décès conjoint…)</p>
            <p style="margin: 0;">• <strong>Atout :</strong> effet de levier fiscal immédiat si TMI ≥ 30 %, mutualisation impôt actif/retraité</p>
          </div>
        </div>
        <div class="card" style="border-left: 4px solid #94a3b8; padding: 14px;">
          <div style="font-size: 9pt; font-weight: 800; color: #64748b; margin-bottom: 6px;">💼 CTO (Compte-Titres Ordinaire)</div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.6;">
            <p style="margin: 0 0 4px 0;">• <strong>Fiscalité :</strong> PFU 30 % (12,8 % IR + 17,2 % PS) ou option barème progressif</p>
            <p style="margin: 0 0 4px 0;">• <strong>Avantage :</strong> aucun plafond, accès à tous les marchés mondiaux, aucune contrainte de durée</p>
            <p style="margin: 0 0 4px 0;">• <strong>Succession :</strong> dans l'actif successoral, purge des plus-values latentes au décès</p>
            <p style="margin: 0;">• <strong>Atout :</strong> liquidité totale, univers d'investissement illimité, pas de contrainte géographique</p>
          </div>
        </div>
      </div>

      <!-- Recommandation personnalisée -->
      <div style="padding: 14px; background: linear-gradient(135deg, rgba(59,130,246,0.03), rgba(99,102,241,0.03)); border: 1px solid rgba(59,130,246,0.15); border-radius: 12px;">
        <div style="font-size: 9pt; font-weight: 700; color: #3b82f6; margin-bottom: 6px;">💡 Recommandation pour votre profil</div>
        <div style="font-size: 9pt; color: #334155; line-height: 1.7;">
          ${data.audit.fiscalite?.ir?.tmi && data.audit.fiscalite.ir.tmi >= 30 
            ? `<p style="margin: 0 0 4px 0;">Avec un TMI de <strong>${data.audit.fiscalite.ir.tmi}%</strong>, le <strong>PER</strong> est un levier fiscal puissant : chaque euro versé vous fait économiser ${data.audit.fiscalite.ir.tmi} centimes d'IR immédiatement. À combiner avec l'assurance-vie pour la transmission.</p>`
            : `<p style="margin: 0 0 4px 0;">L'<strong>assurance-vie</strong> reste l'enveloppe la plus polyvalente pour votre profil : épargne à moyen/long terme, transmission optimisée, et rachats possibles à tout moment. Le <strong>PEA</strong> est incontournable pour investir en actions européennes avec la meilleure fiscalité.</p>`
          }
          <p style="margin: 0; font-size: 8.5pt; color: #64748b;">La combinaison idéale dépend de vos objectifs : épargne de précaution (livrets), moyen terme (AV/PEA), retraite (PER), flexibilité (CTO). Votre conseiller vous accompagne pour optimiser la répartition entre ces enveloppes.</p>
        </div>
      </div>
    </div>
  </div>
  ` : ''}

  <!-- ==================== CHAPITRE XII: RETRAITE ==================== -->
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit Retraite — Le système français expliqué</h2>
    </div>

    ${data.audit.retraite ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🏛</div>
        <div>
          <div class="section-title">Comprendre le système de retraite français</div>
          <div class="section-subtitle">Fondamentaux indispensables pour interpréter votre projection</div>
        </div>
      </div>

      <div style="font-size: 10pt; color: #334155; line-height: 1.9; margin-bottom: 14px;">
        <p style="margin: 0 0 10px 0;">Le système de retraite français repose sur la <strong>répartition</strong> : les cotisations des actifs financent les pensions des retraités. Vos droits sont calculés selon des règles légales déterminant le montant de votre pension future. Elle se construit sur <strong>deux étages obligatoires</strong> :</p>
      </div>

      <!-- Étage 1 : Retraite de base -->
      <div class="card" style="margin-bottom: 12px; border-left: 4px solid #6366f1;">
        <div style="font-size: 11pt; font-weight: 800; color: #0f172a; margin-bottom: 8px;">🏛 Étage 1 — Retraite de base (CNAV)</div>
        <div style="font-size: 9.5pt; color: #334155; line-height: 1.8;">
          <p style="margin: 0 0 6px 0;">Gérée par la CNAV (salariés privé), MSA (agriculteurs) ou SSI (indépendants). Formule :</p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 10px; margin: 6px 0; text-align: center;">
            <div style="font-size: 10pt; font-weight: 700; color: #6366f1; font-family: monospace;">Pension = SAM × Taux × (Trimestres validés ÷ Trimestres requis)</div>
          </div>
          <p style="margin: 6px 0 4px 0;"><strong>SAM :</strong> moyenne des 25 meilleures années de salaire brut (plafonnées au PASS : 47 100 € en 2025).</p>
          <p style="margin: 0 0 4px 0;"><strong>Taux :</strong> maximum 50 % (« taux plein »). <strong>Décote</strong> : −0,625 %/trimestre manquant. <strong>Surcote</strong> : +1,25 %/trimestre supplémentaire.</p>
          <p style="margin: 0;"><strong>Proratisation :</strong> si 150 trimestres validés sur 172 requis → pension × 150/172 = 87,2 %.</p>
        </div>
      </div>

      <!-- Étage 2 : Complémentaire -->
      <div class="card" style="margin-bottom: 12px; border-left: 4px solid #8b5cf6;">
        <div style="font-size: 11pt; font-weight: 800; color: #0f172a; margin-bottom: 8px;">📊 Étage 2 — Complémentaire (AGIRC-ARRCO)</div>
        <div style="font-size: 9.5pt; color: #334155; line-height: 1.8;">
          <p style="margin: 0 0 6px 0;">Système à <strong>points</strong> : vos cotisations sont converties en points chaque année. À la liquidation :</p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 10px; margin: 6px 0; text-align: center;">
            <div style="font-size: 10pt; font-weight: 700; color: #8b5cf6; font-family: monospace;">Pension complémentaire = Nombre de points × Valeur du point (${data.audit.retraite.estimationPension.valeurPoint} €)</div>
          </div>
          <p style="margin: 6px 0 4px 0;"><strong>Vos points :</strong> ${data.audit.retraite.estimationPension.pointsComplementaires.toLocaleString()} points → <strong>${formatCurrency(data.audit.retraite.estimationPension.pensionComplementaireMensuelle)}/mois</strong>.</p>
          <p style="margin: 0;"><strong>Malus temporaire :</strong> −10 % pendant 3 ans si départ dès le taux plein (sauf si décalage d'1 an ou départ après 67 ans).</p>
        </div>
      </div>

      <!-- Trimestres -->
      <div class="card" style="border-left: 4px solid #f59e0b;">
        <div style="font-size: 11pt; font-weight: 800; color: #0f172a; margin-bottom: 8px;">📅 Les trimestres : clé de voûte du système</div>
        <div style="font-size: 9.5pt; color: #334155; line-height: 1.7;">
          <p style="margin: 0 0 6px 0;">1 trimestre validé = revenu ≥ 150 × SMIC horaire (~1 747 € brut en 2025). Max 4/an.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 6px 0;">
            <thead><tr style="background: #f8fafc;">
              <th style="padding: 5px 8px; text-align: left; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Naissance</th>
              <th style="padding: 5px 8px; text-align: center; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Âge légal</th>
              <th style="padding: 5px 8px; text-align: center; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Trimestres</th>
            </tr></thead>
            <tbody>
              <tr><td style="padding: 4px 8px; font-size: 8.5pt; border-bottom: 1px solid #f1f5f9;">1961</td><td style="text-align: center; font-size: 8.5pt; border-bottom: 1px solid #f1f5f9;">62 ans</td><td style="text-align: center; font-size: 8.5pt; border-bottom: 1px solid #f1f5f9;">168</td></tr>
              <tr><td style="padding: 4px 8px; font-size: 8.5pt; border-bottom: 1px solid #f1f5f9;">1962</td><td style="text-align: center; font-size: 8.5pt; border-bottom: 1px solid #f1f5f9;">62,5 ans</td><td style="text-align: center; font-size: 8.5pt; border-bottom: 1px solid #f1f5f9;">169</td></tr>
              <tr><td style="padding: 4px 8px; font-size: 8.5pt; border-bottom: 1px solid #f1f5f9;">1963</td><td style="text-align: center; font-size: 8.5pt; border-bottom: 1px solid #f1f5f9;">63 ans</td><td style="text-align: center; font-size: 8.5pt; border-bottom: 1px solid #f1f5f9;">170</td></tr>
              <tr><td style="padding: 4px 8px; font-size: 8.5pt; border-bottom: 1px solid #f1f5f9;">1964</td><td style="text-align: center; font-size: 8.5pt; border-bottom: 1px solid #f1f5f9;">63,5 ans</td><td style="text-align: center; font-size: 8.5pt; border-bottom: 1px solid #f1f5f9;">171</td></tr>
              <tr style="background: rgba(99,102,241,0.04);"><td style="padding: 4px 8px; font-size: 8.5pt; font-weight: 700;">≥ 1965</td><td style="text-align: center; font-size: 8.5pt; font-weight: 700;">64 ans</td><td style="text-align: center; font-size: 8.5pt; font-weight: 700;">172</td></tr>
            </tbody>
          </table>
          <p style="margin: 6px 0 0 0; font-size: 8.5pt; color: #64748b;">Taux plein automatique à <strong>67 ans</strong> quel que soit le nombre de trimestres. Décote avant = définitive.</p>
        </div>
      </div>
    </div>
    ` : ''}
  </div>

  <!-- ==================== PAGE: RETRAITE — ESTIMATION DÉTAILLÉE ==================== -->
  ${data.audit.retraite ? `
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit Retraite — Votre estimation détaillée</h2>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">📋</div>
        <div>
          <div class="section-title">Estimation personnalisée de votre pension</div>
          <div class="section-subtitle">Calcul basé sur votre carrière et vos droits acquis</div>
        </div>
      </div>

      <!-- Narratif personnalisé -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #eff6ff); border-radius: 12px; border-left: 4px solid #3b82f6;">
        ${data.audit.retraite.narratif}
      </div>

      <!-- KPIs avec explications -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 14px;">
        <div class="card" style="border-left: 4px solid #6366f1; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Pension totale estimée</div>
            <div style="font-size: 18pt; font-weight: 900; color: #6366f1;">${formatCurrency(data.audit.retraite.estimationPension.pensionTotaleMensuelle)}<span style="font-size: 9pt; color: #94a3b8;">/mois</span></div>
          </div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.6;">Base (${formatCurrency(data.audit.retraite.estimationPension.pensionBaseMensuelle)}) + Complémentaire (${formatCurrency(data.audit.retraite.estimationPension.pensionComplementaireMensuelle)}). Soit ~<strong>${formatCurrency(data.audit.retraite.estimationPension.pensionTotaleMensuelle * 0.909)}/mois net</strong> après prélèvements sociaux (9,1 %).</div>
        </div>
        <div class="card" style="border-left: 4px solid ${data.audit.retraite.estimationPension.tauxRemplacement >= 60 ? '#10b981' : data.audit.retraite.estimationPension.tauxRemplacement >= 45 ? '#f59e0b' : '#ef4444'}; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Taux de remplacement</div>
            <div style="font-size: 18pt; font-weight: 900; color: ${data.audit.retraite.estimationPension.tauxRemplacement >= 60 ? '#10b981' : data.audit.retraite.estimationPension.tauxRemplacement >= 45 ? '#f59e0b' : '#ef4444'};">${data.audit.retraite.estimationPension.tauxRemplacement.toFixed(0)}%</div>
          </div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.6;">${data.audit.retraite.estimationPension.tauxRemplacement >= 60 ? 'Taux dans la fourchette haute — bonne couverture obligatoire.' : data.audit.retraite.estimationPension.tauxRemplacement >= 45 ? 'Taux moyen — baisse de revenus significative à anticiper.' : 'Taux faible (fréquent pour hauts revenus / carrières courtes) — effort d\'épargne conséquent nécessaire.'} Moyenne France : 74 % (non-cadre), 54 % (cadre sup.).</div>
        </div>
      </div>

      <!-- Bilan trimestres détaillé -->
      <div class="card" style="margin-bottom: 14px;">
        <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin-bottom: 10px;">📅 Bilan de vos trimestres</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;">
          <div style="background: #f8fafc; border-radius: 10px; padding: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 9.5pt; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;"><span style="color: #334155; font-weight: 600;">Trimestres validés</span><span style="font-weight: 800; color: #6366f1;">${data.audit.retraite.estimationPension.trimestresValides}</span></div>
            <div style="display: flex; justify-content: space-between; font-size: 9.5pt; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;"><span style="color: #334155;">Trimestres futurs (projection)</span><span style="font-weight: 700; color: #10b981;">+${data.audit.retraite.estimationPension.trimestresRestants}</span></div>
            <div style="display: flex; justify-content: space-between; font-size: 9.5pt; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0;"><span style="font-weight: 700;">Total projeté / Requis</span><span style="font-weight: 900;">${data.audit.retraite.estimationPension.trimestresValides + data.audit.retraite.estimationPension.trimestresRestants} / ${data.audit.retraite.estimationPension.trimestresRequis}</span></div>
            ${data.audit.retraite.estimationPension.trimestresManquants > 0 ? `<div style="padding: 6px; background: rgba(239,68,68,0.04); border-radius: 6px; display: flex; justify-content: space-between; font-size: 9.5pt;"><span style="color: #ef4444; font-weight: 600;">⚠️ Trimestres manquants</span><span style="font-weight: 900; color: #ef4444;">${data.audit.retraite.estimationPension.trimestresManquants}</span></div>` : `<div style="padding: 6px; background: rgba(16,185,129,0.04); border-radius: 6px; display: flex; justify-content: space-between; font-size: 9.5pt;"><span style="color: #10b981; font-weight: 600;">✅ Taux plein atteint</span><span style="font-weight: 900; color: #10b981;">OK</span></div>`}
          </div>
          <div style="font-size: 9pt; color: #334155; line-height: 1.7;">
            <p style="margin: 0 0 6px 0;"><strong>Décote / Surcote :</strong> <span style="font-weight: 700; color: ${data.audit.retraite.estimationPension.decoteSurcote < 0 ? '#ef4444' : '#10b981'};">${data.audit.retraite.estimationPension.decoteSurcoteLabel}</span>. ${data.audit.retraite.estimationPension.decoteSurcote < 0 ? 'Chaque trimestre manquant = −0,625 % sur le taux, perte définitive.' : 'Chaque trimestre au-delà = +1,25 %, bonus à vie.'}</p>
            <p style="margin: 0 0 6px 0;"><strong>Points AGIRC-ARRCO :</strong> ${data.audit.retraite.estimationPension.pointsComplementaires.toLocaleString()} × ${data.audit.retraite.estimationPension.valeurPoint} € = <strong>${formatCurrency(data.audit.retraite.estimationPension.pointsComplementaires * data.audit.retraite.estimationPension.valeurPoint)}/an</strong>.</p>
            <p style="margin: 0;"><strong>Décomposition :</strong> base = ${data.audit.retraite.estimationPension.pensionTotaleMensuelle > 0 ? ((data.audit.retraite.estimationPension.pensionBaseMensuelle / data.audit.retraite.estimationPension.pensionTotaleMensuelle) * 100).toFixed(0) : 0}% / complémentaire = ${data.audit.retraite.estimationPension.pensionTotaleMensuelle > 0 ? ((data.audit.retraite.estimationPension.pensionComplementaireMensuelle / data.audit.retraite.estimationPension.pensionTotaleMensuelle) * 100).toFixed(0) : 0}% de votre pension.</p>
          </div>
        </div>
      </div>

      <!-- GAP ANALYSIS -->
      <div style="background: ${data.audit.retraite.analyseGap.gapMensuel > 0 ? 'linear-gradient(135deg, rgba(239,68,68,0.02), rgba(239,68,68,0.05))' : 'linear-gradient(135deg, rgba(16,185,129,0.02), rgba(16,185,129,0.05))'}; border: 2px solid ${data.audit.retraite.analyseGap.gapMensuel > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}; border-radius: 14px; padding: 18px; margin-bottom: 14px;">
        <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin-bottom: 10px;">🎯 Analyse du gap retraite</div>
        <div style="font-size: 9.5pt; color: #334155; line-height: 1.7; margin-bottom: 10px;">Le gap retraite mesure l'écart entre le revenu dont vous aurez besoin (70 % du revenu actuel) et votre pension. Ce gap doit être comblé par votre épargne (AV, PER, immobilier…).</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 10px;">
          <div style="text-align: center; padding: 12px; background: white; border-radius: 10px;">
            <div style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase;">Revenu souhaité (70 %)</div>
            <div style="font-size: 16pt; font-weight: 900; color: #0f172a; margin-top: 4px;">${formatCurrency(data.audit.retraite.analyseGap.revenuSouhaite)}/m</div>
            <div style="font-size: 8pt; color: #64748b;">${formatCurrency(data.audit.retraite.analyseGap.revenuSouhaite * 12)}/an</div>
          </div>
          <div style="text-align: center; padding: 12px; background: white; border-radius: 10px;">
            <div style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase;">Pension estimée</div>
            <div style="font-size: 16pt; font-weight: 900; color: #6366f1; margin-top: 4px;">${formatCurrency(data.audit.retraite.analyseGap.pensionEstimee)}/m</div>
            <div style="font-size: 8pt; color: #64748b;">${formatCurrency(data.audit.retraite.analyseGap.pensionEstimee * 12)}/an</div>
          </div>
        </div>
        <div style="text-align: center; padding: 12px; border-top: 2px dashed ${data.audit.retraite.analyseGap.gapMensuel > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'};">
          <div style="font-size: 8pt; color: #64748b; text-transform: uppercase;">Gap mensuel</div>
          <div style="font-size: 22pt; font-weight: 900; color: ${data.audit.retraite.analyseGap.gapMensuel > 0 ? '#ef4444' : '#10b981'};">${data.audit.retraite.analyseGap.gapMensuel > 0 ? formatCurrency(data.audit.retraite.analyseGap.gapMensuel) + '/m' : 'Aucun gap'}</div>
          ${data.audit.retraite.analyseGap.gapMensuel > 0 ? `<div style="font-size: 9pt; color: #64748b; margin-top: 4px;">soit ${formatCurrency(data.audit.retraite.analyseGap.gapMensuel * 12)}/an de revenus complémentaires nécessaires</div>` : ''}
        </div>
      </div>

      ${data.audit.retraite.analyseGap.capitalNecessaire4Pct > 0 ? `
      <!-- Règle des 4 % -->
      <div class="card" style="border-left: 4px solid #f59e0b;">
        <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin-bottom: 6px;">💡 Capital nécessaire — Règle des 4 %</div>
        <div style="font-size: 9.5pt; color: #334155; line-height: 1.7;">
          <p style="margin: 0 0 6px 0;">Pour combler ${formatCurrency(data.audit.retraite.analyseGap.gapMensuel)}/mois (${formatCurrency(data.audit.retraite.analyseGap.gapMensuel * 12)}/an), la <strong>règle des 4 %</strong> (étude Trinity) estime le capital nécessaire : retrait de 4 %/an = survie du portefeuille >95 % sur 30 ans.</p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 10px; margin: 6px 0; text-align: center;">
            <div style="font-size: 9pt; color: #64748b;">Capital = Gap annuel ÷ 4 % = ${formatCurrency(data.audit.retraite.analyseGap.gapMensuel * 12)} ÷ 0,04</div>
            <div style="font-size: 16pt; font-weight: 900; color: #f59e0b; margin-top: 4px;">${formatCurrency(data.audit.retraite.analyseGap.capitalNecessaire4Pct)}</div>
          </div>
          <p style="margin: 6px 0 0 0; font-size: 8.5pt; color: #64748b;">Ce capital doit être constitué au moment du départ, placé sur supports diversifiés. Un taux de 3-3,5 % est plus prudent en période de taux bas.</p>
        </div>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <!-- ==================== PAGE: RETRAITE — ÉVOLUTION PAR ÂGE ==================== -->
  ${data.audit.retraite ? `
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit Retraite — Évolution par âge de départ</h2>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">📈</div>
        <div>
          <div class="section-title">Impact de l'âge de départ sur votre pension</div>
          <div class="section-subtitle">Chaque année supplémentaire modifie sensiblement votre pension</div>
        </div>
      </div>

      <div style="font-size: 9.5pt; color: #334155; line-height: 1.7; margin-bottom: 12px;">
        <p style="margin: 0 0 8px 0;">L'âge de départ a un <strong>impact majeur et irréversible</strong>. Trois mécanismes se cumulent :</p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 8px 0;">
          <div style="padding: 8px; background: rgba(239,68,68,0.04); border-radius: 8px; border: 1px solid rgba(239,68,68,0.15);">
            <div style="font-size: 8.5pt; font-weight: 700; color: #ef4444; margin-bottom: 3px;">📉 Départ anticipé</div>
            <div style="font-size: 8pt; color: #334155; line-height: 1.4;">Décote −0,625 %/trim. + coeff. AGIRC-ARRCO réduit. Double pénalité définitive.</div>
          </div>
          <div style="padding: 8px; background: rgba(16,185,129,0.04); border-radius: 8px; border: 1px solid rgba(16,185,129,0.15);">
            <div style="font-size: 8.5pt; font-weight: 700; color: #10b981; margin-bottom: 3px;">✅ Taux plein</div>
            <div style="font-size: 8pt; color: #334155; line-height: 1.4;">Tous trimestres requis validés. Taux 50 %. Pension « nominale ».</div>
          </div>
          <div style="padding: 8px; background: rgba(99,102,241,0.04); border-radius: 8px; border: 1px solid rgba(99,102,241,0.15);">
            <div style="font-size: 8.5pt; font-weight: 700; color: #6366f1; margin-bottom: 3px;">📈 Départ différé</div>
            <div style="font-size: 8pt; color: #334155; line-height: 1.4;">Surcote +1,25 %/trim. + bonus AGIRC-ARRCO (+10 % si +2 ans). À vie.</div>
          </div>
        </div>
      </div>

      <!-- Graphique de projection -->
      ${data.audit.retraite.evolutionParAge.length > 0 ? `
      <div class="card projection-chart-container">
        <div class="card-title" style="margin-bottom: 10px;">Courbe de projection : pension mensuelle selon l'âge</div>
        ${generateProjectionChart(
          data.audit.retraite!.evolutionParAge.map(e => ({ x: e.age, y: e.pensionMensuelle, label: `${e.age}` })),
          440, 155,
          {
            xLabel: 'Âge de départ',
            fillColor: 'rgba(99,102,241,0.08)',
            strokeColor: '#6366f1',
            annotations: [
              ...data.audit.retraite!.evolutionParAge.filter(e => e.estChoisi).map(e => ({ x: e.age, label: `Choisi (${e.age})`, color: '#3b82f6' })),
              ...data.audit.retraite!.evolutionParAge.filter(e => e.estOptimal && !e.estChoisi).map(e => ({ x: e.age, label: `Taux plein (${e.age})`, color: '#10b981' })),
            ]
          }
        )}
        <div style="display: flex; gap: 16px; margin-top: 8px; justify-content: center;">
          <span style="font-size: 8pt; color: #3b82f6; font-weight: 600;">🔵 Âge choisi</span>
          <span style="font-size: 8pt; color: #10b981; font-weight: 600;">🟢 Taux plein</span>
        </div>
      </div>

      <!-- Tableau détaillé par âge -->
      <div class="table-container" style="margin-bottom: 14px;">
        <div class="table-header">
          <span class="table-title">Détail de la pension par âge de départ</span>
        </div>
        <table>
          <thead><tr>
            <th>Âge</th>
            <th style="text-align: center;">Décote / Surcote</th>
            <th style="text-align: right;">Pension /mois</th>
            <th style="text-align: right;">Pension /an</th>
            <th style="text-align: center;">Taux rempl.</th>
            <th style="text-align: center;">Statut</th>
          </tr></thead>
          <tbody>
            ${data.audit.retraite!.evolutionParAge.map(e => `
              <tr style="background: ${e.estChoisi ? 'rgba(59,130,246,0.06)' : e.estOptimal ? 'rgba(16,185,129,0.04)' : 'transparent'};">
                <td style="font-weight: 800; font-size: 10pt;">${e.age} ans</td>
                <td style="text-align: center;"><span style="font-size: 7.5pt; padding: 2px 8px; border-radius: 100px; font-weight: 600; background: ${e.decoteSurcotePct < 0 ? 'rgba(239,68,68,0.1)' : e.decoteSurcotePct > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)'}; color: ${e.decoteSurcotePct < 0 ? '#ef4444' : e.decoteSurcotePct > 0 ? '#10b981' : '#6366f1'};">${e.decoteSurcoteLabel}</span></td>
                <td class="td-amount" style="font-weight: 700;">${formatCurrency(e.pensionMensuelle)}</td>
                <td class="td-amount" style="font-size: 9pt; color: #64748b;">${formatCurrency(e.pensionMensuelle * 12)}</td>
                <td style="text-align: center; font-weight: 600;">${e.tauxRemplacement.toFixed(0)}%</td>
                <td style="text-align: center;">${e.estChoisi ? '<span style="font-size: 7pt; padding: 2px 6px; border-radius: 100px; font-weight: 700; background: rgba(59,130,246,0.15); color: #3b82f6;">CHOISI</span>' : e.estOptimal ? '<span style="font-size: 7pt; padding: 2px 6px; border-radius: 100px; font-weight: 700; background: rgba(16,185,129,0.15); color: #10b981;">TAUX PLEIN</span>' : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Interprétation du tableau -->
      <div style="font-size: 9pt; color: #334155; line-height: 1.7; padding: 12px; background: #f8fafc; border-radius: 10px;">
        <p style="margin: 0 0 4px 0;"><strong>Lecture :</strong> la ligne bleue = âge choisi. La ligne verte = taux plein. Entre un départ à ${data.audit.retraite!.evolutionParAge.length > 0 ? data.audit.retraite!.evolutionParAge[0].age : '62'} et ${data.audit.retraite!.evolutionParAge.length > 0 ? data.audit.retraite!.evolutionParAge[data.audit.retraite!.evolutionParAge.length - 1].age : '67'} ans : écart de <strong>${data.audit.retraite!.evolutionParAge.length > 1 ? formatCurrency(data.audit.retraite!.evolutionParAge[data.audit.retraite!.evolutionParAge.length - 1].pensionMensuelle - data.audit.retraite!.evolutionParAge[0].pensionMensuelle) : '—'}/mois</strong>, soit <strong>${data.audit.retraite!.evolutionParAge.length > 1 ? formatCurrency((data.audit.retraite!.evolutionParAge[data.audit.retraite!.evolutionParAge.length - 1].pensionMensuelle - data.audit.retraite!.evolutionParAge[0].pensionMensuelle) * 12 * 25) : '—'} cumulés sur 25 ans</strong>.</p>
      </div>
      ` : ''}
    </div>
    ` : ''}
  </div>

  <!-- ==================== PAGE: RETRAITE — SCÉNARIOS & RECOMMANDATIONS ==================== -->
  ${data.audit.retraite ? `
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit Retraite — Scénarios & Recommandations</h2>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">🔮</div>
        <div>
          <div class="section-title">Trois scénarios de retraite comparés</div>
          <div class="section-subtitle">Prudent, équilibré et dynamique — quel capital, quel revenu durable ?</div>
        </div>
      </div>

      <div style="font-size: 9.5pt; color: #334155; line-height: 1.7; margin-bottom: 12px;">
        <p style="margin: 0 0 6px 0;">Nous simulons trois scénarios différant par le <strong>rendement moyen</strong> de votre épargne et l'<strong>âge de départ</strong>. Pour chacun : capital accumulé au départ, revenu durable (règle des 4 %), et gap résiduel éventuel.</p>
        <p style="margin: 0; font-size: 8.5pt; color: #64748b;"><strong>Vert = faisable :</strong> pension + revenus du capital ≥ revenu cible. <strong>Rouge = déficitaire :</strong> gap subsiste → augmenter l'épargne, accepter un niveau de vie réduit, ou différer le départ.</p>
      </div>

      <!-- Cartes scénarios -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px;">
        ${data.audit.retraite.scenarios.map(sc => `
          <div style="padding: 16px 12px; border-radius: 14px; border: 2px solid ${sc.faisable ? '#10b981' : '#ef4444'}; background: ${sc.faisable ? 'linear-gradient(135deg, rgba(16,185,129,0.02), rgba(16,185,129,0.06))' : 'linear-gradient(135deg, rgba(239,68,68,0.02), rgba(239,68,68,0.06))'};">
            <div style="text-align: center; margin-bottom: 10px;">
              <p style="font-size: 10pt; font-weight: 800; color: #0f172a; margin: 0 0 2px 0;">${sc.label}</p>
              <p style="font-size: 8pt; color: #94a3b8; margin: 0;">Rdt ${sc.rendement}% • Départ ${sc.ageDepart} ans</p>
            </div>
            <div style="text-align: center; padding: 12px 0; border-top: 1px solid ${sc.faisable ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; border-bottom: 1px solid ${sc.faisable ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; margin-bottom: 10px;">
              <div style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase;">Capital accumulé</div>
              <div style="font-size: 18pt; font-weight: 900; color: #0f172a; margin-top: 4px;">${formatCurrency(sc.capitalRetraite)}</div>
            </div>
            <div style="font-size: 8.5pt;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="color: #64748b;">Revenu durable (4%)</span><span style="font-weight: 700; color: ${sc.faisable ? '#10b981' : '#0f172a'};">${formatCurrency(sc.revenuDurable)}/m</span></div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="color: #64748b;">+ Pension régimes</span><span style="font-weight: 700;">${formatCurrency(data.audit.retraite!.analyseGap.pensionEstimee)}/m</span></div>
              <div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px dashed #e2e8f0;"><span style="font-weight: 700;">= Revenu total</span><span style="font-weight: 900; color: ${sc.faisable ? '#10b981' : '#ef4444'};">${formatCurrency(sc.revenuDurable + data.audit.retraite!.analyseGap.pensionEstimee)}/m</span></div>
            </div>
            ${sc.gapMensuel > 0 ? `<div style="margin-top: 8px; padding: 6px; background: rgba(239,68,68,0.06); border-radius: 6px; text-align: center; font-size: 8pt; color: #ef4444; font-weight: 600;">Gap: ${formatCurrency(sc.gapMensuel)}/m${sc.capitalEpuiseAge ? ` • Épuisé à ${sc.capitalEpuiseAge} ans` : ''}</div>` : `<div style="margin-top: 8px; padding: 6px; background: rgba(16,185,129,0.06); border-radius: 6px; text-align: center; font-size: 8pt; color: #10b981; font-weight: 700;">✅ Objectif atteint</div>`}
          </div>
        `).join('')}
      </div>

      <!-- Tableau comparatif des scénarios -->
      <div class="table-container" style="margin-bottom: 14px;">
        <div class="table-header"><span class="table-title">Comparaison chiffrée des 3 scénarios</span></div>
        <table>
          <thead><tr>
            <th>Indicateur</th>
            ${data.audit.retraite.scenarios.map(sc => `<th style="text-align: center;">${sc.label}</th>`).join('')}
          </tr></thead>
          <tbody>
            <tr><td style="font-weight: 600;">Rendement hypothèse</td>${data.audit.retraite.scenarios.map(sc => `<td style="text-align: center;">${sc.rendement}%</td>`).join('')}</tr>
            <tr><td style="font-weight: 600;">Âge de départ</td>${data.audit.retraite.scenarios.map(sc => `<td style="text-align: center;">${sc.ageDepart} ans</td>`).join('')}</tr>
            <tr><td style="font-weight: 600;">Capital à la retraite</td>${data.audit.retraite.scenarios.map(sc => `<td style="text-align: center; font-weight: 700;">${formatCurrency(sc.capitalRetraite)}</td>`).join('')}</tr>
            <tr><td style="font-weight: 600;">Revenu durable /mois</td>${data.audit.retraite.scenarios.map(sc => `<td style="text-align: center; font-weight: 700; color: ${sc.faisable ? '#10b981' : '#ef4444'};">${formatCurrency(sc.revenuDurable)}</td>`).join('')}</tr>
            <tr><td style="font-weight: 600;">Gap résiduel /mois</td>${data.audit.retraite.scenarios.map(sc => `<td style="text-align: center; font-weight: 700; color: ${sc.gapMensuel > 0 ? '#ef4444' : '#10b981'};">${sc.gapMensuel > 0 ? formatCurrency(sc.gapMensuel) : '✅ Aucun'}</td>`).join('')}</tr>
            <tr><td style="font-weight: 600;">Viabilité</td>${data.audit.retraite.scenarios.map(sc => `<td style="text-align: center;"><span style="font-size: 8pt; padding: 2px 8px; border-radius: 100px; font-weight: 700; background: ${sc.faisable ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${sc.faisable ? '#10b981' : '#ef4444'};">${sc.faisable ? 'Viable' : 'Déficitaire'}</span></td>`).join('')}</tr>
          </tbody>
        </table>
      </div>

      <!-- Recommandations retraite -->
      ${data.audit.retraite.recommandations.length > 0 ? `
      <div style="border: 2px solid rgba(59,130,246,0.2); border-radius: 14px; padding: 16px; background: linear-gradient(135deg, rgba(59,130,246,0.02), rgba(59,130,246,0.06));">
        <div style="font-size: 10pt; font-weight: 800; color: #3b82f6; margin-bottom: 10px;">📋 Recommandations pour préparer votre retraite</div>
        <div style="font-size: 9.5pt; color: #334155; line-height: 1.7; margin-bottom: 10px;">Ces recommandations sont personnalisées en fonction de votre situation (trimestres, gap, âge, profil de risque). Elles doivent être mises en œuvre progressivement, en commençant par les actions les plus impactantes :</div>
        ${data.audit.retraite.recommandations.map((r, i) => `
          <div style="display: flex; gap: 10px; padding: 10px 0; ${i < data.audit.retraite!.recommandations.length - 1 ? 'border-bottom: 1px solid rgba(59,130,246,0.1);' : ''}">
            <div style="width: 24px; height: 24px; border-radius: 6px; background: rgba(59,130,246,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 10pt; font-weight: 900; color: #3b82f6;">${i + 1}</div>
            <div style="flex: 1; font-size: 9.5pt; color: #1e293b; line-height: 1.6;">${r.description}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- Leviers complémentaires -->
      <div style="margin-top: 14px; font-size: 9pt; color: #334155; line-height: 1.7; padding: 14px; background: #f8fafc; border-radius: 10px;">
        <p style="margin: 0 0 6px 0; font-weight: 700;">💡 Leviers complémentaires à explorer</p>
        <p style="margin: 0 0 4px 0;">• <strong>PER (Plan d'Épargne Retraite) :</strong> versements déductibles de l'IR (plafond : 10 % des revenus N-1, max ~35 194 € en 2025). Sortie en capital ou rente à la retraite. Levier fiscal puissant si TMI ≥ 30 %.</p>
        <p style="margin: 0 0 4px 0;">• <strong>Assurance-vie :</strong> enveloppe multi-support, fiscalement avantageuse après 8 ans (abattement 4 600 €/an sur les gains). Permet des retraits programmés en complément de pension.</p>
        <p style="margin: 0 0 4px 0;">• <strong>Immobilier locatif :</strong> revenus complémentaires pérennes (loyers), avec possibilité de revente progressive du patrimoine immobilier.</p>
        <p style="margin: 0;">• <strong>Rachat de trimestres :</strong> possible sous conditions (études supérieures, années incomplètes). Coût variable selon l'âge et les revenus — à analyser au cas par cas avec votre caisse de retraite.</p>
      </div>
    </div>
    ` : ''}
  </div>

  <!-- ==================== CHAPITRE XIII: SUCCESSION & TRANSMISSION ==================== -->
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Audit — Succession & Transmission</h2>
    </div>

    ${data.audit.succession ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">👥</div>
        <div>
          <div class="section-title">Audit Succession & Transmission</div>
          <div class="section-subtitle">DMTG estimés et stratégies d'optimisation</div>
        </div>
      </div>

      <!-- Introduction pédagogique -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #fef2f2); border-radius: 12px; border-left: 4px solid #ef4444;">
        <p style="margin: 0 0 6px 0;"><strong>Comment fonctionne la succession en France ?</strong> Au décès, votre patrimoine est transmis à vos héritiers après déduction des <strong>droits de mutation à titre gratuit (DMTG)</strong>. En ligne directe (parent → enfant), chaque héritier bénéficie d'un abattement de <strong>100 000 €</strong> (art. 779 CGI), renouvelable tous les 15 ans. Au-delà de cet abattement, un barème progressif de 5 % à 45 % s'applique (art. 777 CGI).</p>
        <p style="margin: 0; font-size: 9pt; color: #64748b;"><strong>L'assurance-vie</strong> bénéficie d'un régime fiscal distinct, hors succession civile : les primes versées avant 70 ans donnent droit à un abattement de <strong>152 500 € par bénéficiaire</strong> (art. 990 I CGI), puis un prélèvement de 20 % jusqu'à 700 000 € et 31,25 % au-delà. Les primes versées après 70 ans sont soumises aux DMTG classiques après un abattement global de <strong>30 500 €</strong> (art. 757 B CGI), mais les intérêts générés sont exonérés. Anticiper la transmission permet de réduire significativement la charge fiscale pour vos héritiers.</p>
      </div>

      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #eff6ff); border-radius: 12px; border-left: 4px solid #3b82f6;">
        ${data.audit.succession.narratif}
      </div>

      <!-- KPIs avec explications -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 14px;">
        <div class="card" style="border-left: 4px solid #0f172a; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Patrimoine net taxable</div>
            <div style="font-size: 18pt; font-weight: 900; color: #0f172a;">${formatCurrency(data.audit.succession.patrimoineNetTaxable)}</div>
          </div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">Actifs totaux − dettes − biens exonérés. C'est l'assiette sur laquelle les DMTG sont calculés, répartie entre ${data.audit.succession.nbEnfants || 1} héritier(s) en ligne directe.</div>
        </div>
        <div class="card" style="border-left: 4px solid #ef4444; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase;">Droits de succession estimés</div>
            <div style="font-size: 18pt; font-weight: 900; color: #ef4444;">${formatCurrency(data.audit.succession.droitsEstimes)}</div>
          </div>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">Taux effectif : <strong>${data.audit.succession.tauxEffectif.toFixed(1)}%</strong> du patrimoine net. Par héritier : ~${formatCurrency(data.audit.succession.droitsEstimes / (data.audit.succession.nbEnfants || 1))} de droits à payer dans les 6 mois suivant le décès.</div>
        </div>
      </div>

      <!-- Barème DMTG en ligne directe -->
      <div class="card" style="margin-bottom: 14px; border-left: 4px solid #f59e0b;">
        <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin-bottom: 8px;">📊 Barème des droits de succession en ligne directe (art. 777 CGI)</div>
        <div style="font-size: 9pt; color: #64748b; line-height: 1.5; margin-bottom: 8px;">Après abattement de 100 000 € par héritier (art. 779 CGI), le surplus est taxé par tranches progressives :</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr style="background: #f8fafc;">
            <th style="padding: 6px 10px; text-align: left; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Tranche taxable</th>
            <th style="padding: 6px 10px; text-align: center; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Taux</th>
          </tr></thead>
          <tbody>
            <tr><td style="padding: 5px 10px; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">Jusqu'à 8 072 €</td><td style="text-align: center; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">5 %</td></tr>
            <tr><td style="padding: 5px 10px; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">8 072 € à 12 109 €</td><td style="text-align: center; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">10 %</td></tr>
            <tr><td style="padding: 5px 10px; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">12 109 € à 15 932 €</td><td style="text-align: center; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">15 %</td></tr>
            <tr><td style="padding: 5px 10px; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">15 932 € à 552 324 €</td><td style="text-align: center; font-size: 9pt; font-weight: 600; border-bottom: 1px solid #f1f5f9;">20 %</td></tr>
            <tr><td style="padding: 5px 10px; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">552 324 € à 902 838 €</td><td style="text-align: center; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">30 %</td></tr>
            <tr><td style="padding: 5px 10px; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">902 838 € à 1 805 677 €</td><td style="text-align: center; font-size: 9pt; border-bottom: 1px solid #f1f5f9;">40 %</td></tr>
            <tr style="background: rgba(239,68,68,0.04);"><td style="padding: 5px 10px; font-size: 9pt; font-weight: 700;">Au-delà de 1 805 677 €</td><td style="text-align: center; font-size: 9pt; font-weight: 700; color: #ef4444;">45 %</td></tr>
          </tbody>
        </table>
        <div style="font-size: 8.5pt; color: #64748b; margin-top: 6px;">En ligne directe, la tranche à 20 % est la plus large (jusqu'à 552 k€) et concerne la majorité des successions françaises. Au-delà de 1,8 M€ par héritier (après abattement), le taux marginal atteint 45 %.</div>
      </div>

      <!-- Impact Assurance-Vie détaillé -->
      ${data.audit.succession.impactAssuranceVie ? `
      <div class="card" style="border-left: 4px solid #6366f1;">
        <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin-bottom: 8px;">🛡 Impact de l'assurance-vie sur la transmission</div>
        <div style="font-size: 9pt; color: #334155; line-height: 1.6; margin-bottom: 10px;">L'assurance-vie échappe à la succession civile. Les capitaux sont transmis directement aux bénéficiaires désignés, avec un régime fiscal propre (art. 990 I pour les primes avant 70 ans, art. 757 B après 70 ans).</div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
          <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px;">
            <div style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase;">Total en AV</div>
            <div style="font-size: 14pt; font-weight: 900; color: #0f172a; margin-top: 4px;">${formatCurrency(data.audit.succession.impactAssuranceVie.totalAV)}</div>
          </div>
          <div style="text-align: center; padding: 10px; background: rgba(16,185,129,0.04); border-radius: 8px;">
            <div style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase;">Abattement art. 990 I</div>
            <div style="font-size: 14pt; font-weight: 900; color: #10b981; margin-top: 4px;">${formatCurrency(data.audit.succession.impactAssuranceVie.abattement990I)}</div>
            <div style="font-size: 7.5pt; color: #64748b;">152 500 € × nb bénéficiaires</div>
          </div>
          <div style="text-align: center; padding: 10px; background: rgba(239,68,68,0.04); border-radius: 8px;">
            <div style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase;">Droits sur AV</div>
            <div style="font-size: 14pt; font-weight: 900; color: #ef4444; margin-top: 4px;">${formatCurrency(data.audit.succession.impactAssuranceVie.droitsTotalAV)}</div>
            <div style="font-size: 7.5pt; color: #64748b;">20 % puis 31,25 %</div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Détail par héritier -->
      ${data.audit.succession.detailParHeritier.length > 0 ? `
      <div class="card" style="margin-top: 14px;">
        <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin-bottom: 6px;">👥 Détail par héritier — Droits estimés</div>
        <div style="font-size: 8.5pt; color: #64748b; line-height: 1.5; margin-bottom: 10px;">Chaque héritier en ligne directe bénéficie d'un abattement de 100 000 € (art. 779 CGI). Le surplus est soumis au barème progressif. Le tableau détaille le calcul pour chaque héritier identifié.</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr style="background: #f8fafc;">
            <th style="padding: 6px 8px; text-align: left; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Héritier</th>
            <th style="padding: 6px 8px; text-align: right; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Part brute</th>
            <th style="padding: 6px 8px; text-align: right; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Abattement</th>
            <th style="padding: 6px 8px; text-align: right; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Taxable</th>
            <th style="padding: 6px 8px; text-align: right; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Droits</th>
            <th style="padding: 6px 8px; text-align: right; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Taux eff.</th>
          </tr></thead>
          <tbody>
            ${data.audit.succession.detailParHeritier.map(h => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px 8px; font-size: 9pt; font-weight: 600; color: #0f172a;">${h.lien}</td>
                <td style="padding: 6px 8px; text-align: right; font-size: 9pt;">${formatCurrency(h.partBrute)}</td>
                <td style="padding: 6px 8px; text-align: right; font-size: 9pt; color: #10b981;">−${formatCurrency(h.abattement)}</td>
                <td style="padding: 6px 8px; text-align: right; font-size: 9pt;">${formatCurrency(h.taxable)}</td>
                <td style="padding: 6px 8px; text-align: right; font-size: 10pt; font-weight: 800; color: #ef4444;">${formatCurrency(h.droits)}</td>
                <td style="padding: 6px 8px; text-align: right; font-size: 9pt; color: #f59e0b;">${h.tauxEffectif.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot><tr style="border-top: 2px solid #e2e8f0; background: #f8fafc;">
            <td style="padding: 6px 8px; font-weight: 800; font-size: 9pt;">Total</td>
            <td style="padding: 6px 8px; text-align: right; font-size: 9pt; font-weight: 700;">${formatCurrency(data.audit.succession.detailParHeritier.reduce((s, h) => s + h.partBrute, 0))}</td>
            <td style="padding: 6px 8px; text-align: right; font-size: 9pt; color: #10b981;">−${formatCurrency(data.audit.succession.abattementTotal)}</td>
            <td style="padding: 6px 8px; text-align: right; font-size: 9pt;"></td>
            <td style="padding: 6px 8px; text-align: right; font-size: 10pt; font-weight: 900; color: #ef4444;">${formatCurrency(data.audit.succession.droitsEstimes)}</td>
            <td style="padding: 6px 8px; text-align: right; font-size: 9pt; font-weight: 700; color: #f59e0b;">${data.audit.succession.tauxEffectif.toFixed(1)}%</td>
          </tr></tfoot>
        </table>
      </div>
      ` : ''}
    </div>
    ` : ''}
  </div>

  <!-- ==================== PAGE: SUCCESSION — BARÈME DÉMEMBREMENT & STRATÉGIES ==================== -->
  ${data.audit.succession ? `
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Succession — Démembrement & Outils de Transmission</h2>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">⚖️</div>
        <div>
          <div class="section-title">Le démembrement de propriété (art. 669 CGI)</div>
          <div class="section-subtitle">Outil majeur d'optimisation de la transmission patrimoniale</div>
        </div>
      </div>

      <!-- Introduction pédagogique démembrement -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #f5f3ff); border-radius: 12px; border-left: 4px solid #8b5cf6;">
        <p style="margin: 0 0 6px 0;"><strong>Qu'est-ce que le démembrement ?</strong> Il consiste à séparer la <strong>pleine propriété</strong> d'un bien en deux droits distincts : l'<strong>usufruit</strong> (droit d'utiliser le bien et d'en percevoir les revenus) et la <strong>nue-propriété</strong> (droit de disposer du bien, sans pouvoir l'utiliser ni en percevoir les revenus tant que l'usufruit existe).</p>
        <p style="margin: 0 0 6px 0;"><strong>Intérêt fiscal :</strong> en donnant la nue-propriété à vos enfants tout en conservant l'usufruit, vous transmettez le bien avec une <strong>décote fiscale importante</strong> (seule la valeur de la nue-propriété est soumise aux DMTG). Au décès de l'usufruitier, l'usufruit s'éteint automatiquement et le nu-propriétaire devient plein propriétaire <strong>sans aucun droit supplémentaire</strong> (art. 1133 CGI).</p>
        <p style="margin: 0; font-size: 9pt; color: #64748b;"><strong>Plus le donateur est jeune, plus la nue-propriété est faible</strong> (car l'usufruit conservé est valorisé davantage). C'est pourquoi anticiper les donations est fiscalement optimal.</p>
      </div>

      <!-- Tableau art. 669 CGI -->
      <div class="card" style="border-left: 4px solid #8b5cf6; margin-bottom: 14px;">
        <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin-bottom: 8px;">📊 Barème fiscal du démembrement (art. 669 CGI)</div>
        <div style="font-size: 8.5pt; color: #64748b; line-height: 1.5; margin-bottom: 8px;">Ce barème est utilisé par l'administration fiscale pour évaluer la valeur de l'usufruit et de la nue-propriété lors d'une donation ou d'une succession. ${clientAge > 0 ? `<strong>À ${clientAge} ans</strong>, la valeur de votre usufruit est estimée à <strong>${clientAge < 21 ? '90' : clientAge < 31 ? '80' : clientAge < 41 ? '70' : clientAge < 51 ? '60' : clientAge < 61 ? '50' : clientAge < 71 ? '40' : clientAge < 81 ? '30' : clientAge < 91 ? '20' : '10'}%</strong> de la pleine propriété.` : ''}</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr style="background: linear-gradient(135deg, #f8fafc, #f5f3ff);">
            <th style="padding: 6px 10px; text-align: left; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Âge de l'usufruitier</th>
            <th style="padding: 6px 10px; text-align: center; font-size: 8pt; color: #8b5cf6; font-weight: 700; border-bottom: 1px solid #e2e8f0;">Usufruit</th>
            <th style="padding: 6px 10px; text-align: center; font-size: 8pt; color: #3b82f6; font-weight: 700; border-bottom: 1px solid #e2e8f0;">Nue-propriété</th>
          </tr></thead>
          <tbody>
            ${[
              { age: 'Moins de 21 ans', usufruit: '90 %', np: '10 %' },
              { age: '21 à 30 ans', usufruit: '80 %', np: '20 %' },
              { age: '31 à 40 ans', usufruit: '70 %', np: '30 %' },
              { age: '41 à 50 ans', usufruit: '60 %', np: '40 %' },
              { age: '51 à 60 ans', usufruit: '50 %', np: '50 %' },
              { age: '61 à 70 ans', usufruit: '40 %', np: '60 %' },
              { age: '71 à 80 ans', usufruit: '30 %', np: '70 %' },
              { age: '81 à 90 ans', usufruit: '20 %', np: '80 %' },
              { age: 'Plus de 91 ans', usufruit: '10 %', np: '90 %' },
            ].map(r => {
              const isCurrentAge = clientAge > 0 && (
                (r.age === 'Moins de 21 ans' && clientAge < 21) ||
                (r.age === '21 à 30 ans' && clientAge >= 21 && clientAge <= 30) ||
                (r.age === '31 à 40 ans' && clientAge >= 31 && clientAge <= 40) ||
                (r.age === '41 à 50 ans' && clientAge >= 41 && clientAge <= 50) ||
                (r.age === '51 à 60 ans' && clientAge >= 51 && clientAge <= 60) ||
                (r.age === '61 à 70 ans' && clientAge >= 61 && clientAge <= 70) ||
                (r.age === '71 à 80 ans' && clientAge >= 71 && clientAge <= 80) ||
                (r.age === '81 à 90 ans' && clientAge >= 81 && clientAge <= 90) ||
                (r.age === 'Plus de 91 ans' && clientAge >= 91)
              )
              return `<tr style="background: ${isCurrentAge ? 'rgba(99,102,241,0.08)' : 'transparent'}; border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 5px 10px; font-size: 9pt; ${isCurrentAge ? 'font-weight: 700; color: #6366f1;' : ''}">${r.age}${isCurrentAge ? ' ← Vous' : ''}</td>
                <td style="padding: 5px 10px; text-align: center; font-size: 9pt; font-weight: 600; color: #8b5cf6;">${r.usufruit}</td>
                <td style="padding: 5px 10px; text-align: center; font-size: 9pt; font-weight: 600; color: #3b82f6;">${r.np}</td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Exemple chiffré de démembrement -->
      ${clientAge > 0 ? `
      <div class="card" style="background: linear-gradient(135deg, rgba(99,102,241,0.03), rgba(59,130,246,0.03)); border: 1px solid rgba(99,102,241,0.15); margin-bottom: 14px;">
        <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin-bottom: 8px;">💡 Exemple chiffré pour votre situation</div>
        <div style="font-size: 9.5pt; color: #334155; line-height: 1.7;">
          <p style="margin: 0 0 6px 0;">Si vous donnez la nue-propriété d'un bien valant <strong>500 000 €</strong> à vos ${data.audit.succession.nbEnfants || 1} enfant(s) :</p>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 8px 0;">
            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px;">
              <div style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase;">Usufruit conservé</div>
              <div style="font-size: 14pt; font-weight: 900; color: #8b5cf6; margin-top: 4px;">${formatCurrency(500000 * (clientAge < 21 ? 0.9 : clientAge < 31 ? 0.8 : clientAge < 41 ? 0.7 : clientAge < 51 ? 0.6 : clientAge < 61 ? 0.5 : clientAge < 71 ? 0.4 : clientAge < 81 ? 0.3 : clientAge < 91 ? 0.2 : 0.1))}</div>
            </div>
            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px;">
              <div style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase;">NP transmise (taxable)</div>
              <div style="font-size: 14pt; font-weight: 900; color: #3b82f6; margin-top: 4px;">${formatCurrency(500000 * (clientAge < 21 ? 0.1 : clientAge < 31 ? 0.2 : clientAge < 41 ? 0.3 : clientAge < 51 ? 0.4 : clientAge < 61 ? 0.5 : clientAge < 71 ? 0.6 : clientAge < 81 ? 0.7 : clientAge < 91 ? 0.8 : 0.9))}</div>
            </div>
            <div style="text-align: center; padding: 10px; background: rgba(16,185,129,0.04); border-radius: 8px;">
              <div style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase;">Économie DMTG</div>
              <div style="font-size: 14pt; font-weight: 900; color: #10b981; margin-top: 4px;">~${formatCurrency(500000 * (clientAge < 21 ? 0.9 : clientAge < 31 ? 0.8 : clientAge < 41 ? 0.7 : clientAge < 51 ? 0.6 : clientAge < 61 ? 0.5 : clientAge < 71 ? 0.4 : clientAge < 81 ? 0.3 : clientAge < 91 ? 0.2 : 0.1) * 0.2)}</div>
              <div style="font-size: 7pt; color: #64748b;">vs pleine propriété</div>
            </div>
          </div>
          <p style="margin: 6px 0 0 0; font-size: 8.5pt; color: #64748b;">Au décès, l'usufruit s'éteint et vos enfants deviennent <strong>pleins propriétaires sans aucun droit supplémentaire</strong> (art. 1133 CGI). Si vous attendez 15 ans, l'abattement de 100 000 € par enfant est de nouveau disponible pour une seconde donation.</p>
        </div>
      </div>
      ` : ''}

      <!-- Calendrier de donation sur 15 ans -->
      <div class="card" style="border-left: 4px solid #10b981;">
        <div style="font-size: 10pt; font-weight: 800; color: #0f172a; margin-bottom: 6px;">📅 Calendrier de transmission sur 30 ans</div>
        <div style="font-size: 8.5pt; color: #64748b; line-height: 1.5; margin-bottom: 10px;">L'abattement de 100 000 € par enfant se renouvelle tous les 15 ans. En planifiant vos donations, vous pouvez transmettre des sommes considérables en franchise de droits.</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr style="background: #f8fafc;">
            <th style="padding: 5px 8px; text-align: left; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Période</th>
            <th style="padding: 5px 8px; text-align: center; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Votre âge</th>
            <th style="padding: 5px 8px; text-align: right; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Abattement par enfant</th>
            <th style="padding: 5px 8px; text-align: right; font-size: 8pt; color: #64748b; border-bottom: 1px solid #e2e8f0;">Total transmis (${data.audit.succession.nbEnfants || 1} enf.)</th>
            <th style="padding: 5px 8px; text-align: right; font-size: 8pt; color: #10b981; border-bottom: 1px solid #e2e8f0;">Cumul en franchise</th>
          </tr></thead>
          <tbody>
            <tr style="background: rgba(16,185,129,0.04); border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 5px 8px; font-size: 9pt; font-weight: 600;">1ère donation</td>
              <td style="padding: 5px 8px; text-align: center; font-size: 9pt;">${clientAge > 0 ? `${clientAge} ans` : 'Aujourd\'hui'}</td>
              <td style="padding: 5px 8px; text-align: right; font-size: 9pt;">100 000 €</td>
              <td style="padding: 5px 8px; text-align: right; font-size: 9pt; font-weight: 600;">${formatCurrency(100000 * (data.audit.succession.nbEnfants || 1))}</td>
              <td style="padding: 5px 8px; text-align: right; font-size: 9pt; font-weight: 700; color: #10b981;">${formatCurrency(100000 * (data.audit.succession.nbEnfants || 1))}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 5px 8px; font-size: 9pt; font-weight: 600;">2ème donation (J+15 ans)</td>
              <td style="padding: 5px 8px; text-align: center; font-size: 9pt;">${clientAge > 0 ? `${clientAge + 15} ans` : '+15 ans'}</td>
              <td style="padding: 5px 8px; text-align: right; font-size: 9pt;">100 000 €</td>
              <td style="padding: 5px 8px; text-align: right; font-size: 9pt; font-weight: 600;">${formatCurrency(100000 * (data.audit.succession.nbEnfants || 1))}</td>
              <td style="padding: 5px 8px; text-align: right; font-size: 9pt; font-weight: 700; color: #10b981;">${formatCurrency(200000 * (data.audit.succession.nbEnfants || 1))}</td>
            </tr>
            <tr style="background: rgba(16,185,129,0.04);">
              <td style="padding: 5px 8px; font-size: 9pt; font-weight: 700;">Total en franchise de droits</td>
              <td style="padding: 5px 8px; text-align: center; font-size: 9pt; font-weight: 600;">${clientAge > 0 ? `${clientAge + 30} ans` : '+30 ans'}</td>
              <td style="padding: 5px 8px; text-align: right; font-size: 9pt;">200 000 €</td>
              <td colspan="2" style="padding: 5px 8px; text-align: right; font-size: 12pt; font-weight: 900; color: #10b981;">${formatCurrency(200000 * (data.audit.succession.nbEnfants || 1))}</td>
            </tr>
          </tbody>
        </table>
        <div style="font-size: 8pt; color: #64748b; margin-top: 6px; line-height: 1.5;">💡 En combinant <strong>donation en nue-propriété + abattement 100 k€ renouvelable</strong>, il est possible de transmettre un patrimoine considérable avec un impact fiscal très réduit. S'ajoute l'assurance-vie avec l'abattement de 152 500 € par bénéficiaire (art. 990 I).</div>
      </div>
    </div>
  </div>
  ` : ''}

  <!-- ==================== PAGE: SUCCESSION — STRATÉGIES D'OPTIMISATION ==================== -->
  ${data.audit.succession && data.audit.succession.strategiesOptimisation.length > 0 ? `
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Succession — Stratégies d'Optimisation</h2>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">💡</div>
        <div>
          <div class="section-title">Stratégies d'optimisation successorale</div>
          <div class="section-subtitle">Leviers identifiés pour réduire les droits de mutation à titre gratuit</div>
        </div>
      </div>

      <!-- Introduction pédagogique -->
      <div style="font-size: 10pt; color: #334155; line-height: 1.8; margin-bottom: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc, #f0fdf4); border-radius: 12px; border-left: 4px solid #10b981;">
        <p style="margin: 0 0 6px 0;"><strong>Pourquoi optimiser la transmission ?</strong> Sans anticipation, les droits de succession peuvent représenter entre 5 % et 45 % de la part transmise à chaque héritier en ligne directe. Il existe cependant de nombreux leviers légaux pour réduire cette charge : donations anticipées (avec abattement renouvelable tous les 15 ans), assurance-vie (régime fiscal distinct), démembrement de propriété (art. 669 CGI), et structuration du patrimoine.</p>
        <p style="margin: 0; font-size: 9pt; color: #64748b;"><strong>L'anticipation est la clé :</strong> plus vous commencez tôt à transmettre, plus vous profitez du renouvellement des abattements et de la valorisation des biens transmis en nue-propriété. Les stratégies ci-dessous sont classées par ordre de priorité et accompagnées d'une estimation de l'économie réalisable.</p>
      </div>

      <!-- Économie potentielle totale -->
      <div style="background: linear-gradient(135deg, rgba(16,185,129,0.04), rgba(59,130,246,0.04)); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 20px; margin-bottom: 16px; text-align: center;">
        <div style="font-size: 9pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Économie potentielle totale estimée</div>
        <div style="font-size: 28pt; font-weight: 900; color: #10b981; margin-top: 6px;">~${formatCurrency(data.audit.succession.strategiesOptimisation.reduce((sum, s) => sum + (s.economieEstimee || 0), 0))}</div>
        <div style="font-size: 9pt; color: #64748b; margin-top: 4px;">Sur ${data.audit.succession.strategiesOptimisation.length} stratégie(s) identifiée(s)</div>
      </div>

      <!-- Stratégies détaillées -->
      ${data.audit.succession.strategiesOptimisation.map((s, i) => `
        <div class="card" style="margin-bottom: 12px; border-left: 4px solid ${s.priorite === 'haute' ? '#ef4444' : s.priorite === 'moyenne' ? '#f59e0b' : '#10b981'};">
          <div style="display: flex; align-items: flex-start; gap: 14px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: ${s.priorite === 'haute' ? 'rgba(239,68,68,0.1)' : s.priorite === 'moyenne' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 12pt; font-weight: 900; color: ${s.priorite === 'haute' ? '#ef4444' : s.priorite === 'moyenne' ? '#f59e0b' : '#10b981'};">${i + 1}</div>
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="font-size: 11pt; font-weight: 700; color: #0f172a;">${s.strategie}</div>
                <span style="font-size: 7pt; padding: 3px 10px; border-radius: 100px; font-weight: 600; ${s.priorite === 'haute' ? 'background: rgba(239,68,68,0.1); color: #ef4444;' : s.priorite === 'moyenne' ? 'background: rgba(245,158,11,0.1); color: #f59e0b;' : 'background: rgba(16,185,129,0.1); color: #10b981;'}">Priorité ${s.priorite}</span>
              </div>
              <p style="font-size: 10pt; color: #334155; line-height: 1.7; margin: 0 0 8px 0;">${s.description}</p>
              ${s.economieEstimee > 0 ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 9pt; color: #64748b;">Économie estimée :</span>
                <span style="font-size: 14pt; font-weight: 900; color: #10b981;">~${formatCurrency(s.economieEstimee)}</span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('')}

      <!-- Rappel réglementaire -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 8px;">
        <div style="font-size: 9pt; font-weight: 700; color: #64748b; margin-bottom: 6px;">Rappel réglementaire</div>
        <p style="font-size: 8.5pt; color: #64748b; line-height: 1.6; margin: 0;">
          Les droits de succession sont régis par les articles 777 et suivants du CGI. L'abattement en ligne directe est de 100 000 € par parent et par enfant (art. 779 CGI), renouvelable tous les 15 ans. 
          L'assurance-vie bénéficie d'un régime fiscal favorable (art. 990 I pour les primes versées avant 70 ans : abattement de 152 500 € par bénéficiaire ; art. 757 B pour les primes versées après 70 ans : abattement global de 30 500 €).
        </p>
      </div>
    </div>
  </div>
  ` : ''}

  <!-- ==================== PAGES: SIMULATIONS ==================== -->
  ${renderSimulationPages(data.simulations || [], formatCurrency, formatDate, `Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}`, generateKpiCard)}

  <!-- ==================== PAGES: NOS PRÉCONISATIONS ==================== -->
  ${renderPreconisationPages(preconisations, formatCurrency, `Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}`)}

  <!-- ==================== CHAPITRE XVI: GLOSSAIRE ==================== -->
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Glossaire & Références Réglementaires</h2>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">📖</div>
        <div>
          <div class="section-title">Glossaire des termes utilisés</div>
          <div class="section-subtitle">Définitions des principaux concepts patrimoniaux et fiscaux</div>
        </div>
      </div>

      <!-- Glossaire A-L -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
        ${[
          { terme: 'Abattement', def: 'Réduction forfaitaire appliquée avant le calcul de l\'impôt. Ex : 100 000 € en succession directe, 30 % sur la RP pour l\'IFI.' },
          { terme: 'Actif net (patrimoine net)', def: 'Total des actifs (immobilier + financier + professionnel) diminué de l\'ensemble des dettes et passifs.' },
          { terme: 'AV (Assurance-Vie)', def: 'Contrat d\'épargne multi-support. Fiscalité avantageuse après 8 ans (abattement 4 600 €/9 200 €). Hors succession via art. 990 I et 757 B CGI.' },
          { terme: 'Barème progressif', def: 'Mode de calcul où le taux augmente par tranches successives (IR, DMTG). Chaque tranche est taxée à son propre taux.' },
          { terme: 'Cash-flow net', def: 'Différence entre les revenus locatifs perçus et l\'ensemble des charges (crédit, taxe foncière, gestion, assurance, fiscalité).' },
          { terme: 'CEHR', def: 'Contribution Exceptionnelle sur les Hauts Revenus — surtaxe de 3 % (250k-500k €) ou 4 % (>500k €) sur le RFR.' },
          { terme: 'CTO', def: 'Compte-Titres Ordinaire — enveloppe d\'investissement sans plafond ni contrainte, soumise au PFU 30 % ou barème IR.' },
          { terme: 'Décote', def: 'Réduction d\'impôt appliquée aux contribuables modestes (IR) ou aux patrimoines proches du seuil (IFI entre 1,3M et 1,4M €).' },
          { terme: 'Déficit foncier', def: 'Excédent de charges déductibles sur les revenus fonciers. Imputable sur le revenu global dans la limite de 10 700 €/an.' },
          { terme: 'Démembrement', def: 'Séparation de la pleine propriété en usufruit (jouissance/revenus) et nue-propriété (disposition). Art. 669 CGI fixe le barème fiscal.' },
          { terme: 'DMTG', def: 'Droits de Mutation à Titre Gratuit — droits de succession et de donation calculés sur l\'actif net taxable après abattements.' },
          { terme: 'Donation-partage', def: 'Acte notarié permettant de répartir son patrimoine de son vivant entre héritiers, figeant les valeurs au jour de la donation.' },
          { terme: 'Épargne de précaution', def: 'Réserve de liquidités couvrant 3 à 6 mois de charges courantes, placée sur supports sûrs et disponibles (livrets réglementés).' },
          { terme: 'Fonds euros', def: 'Support d\'assurance-vie à capital garanti, investissant principalement en obligations. Rendement moyen ~2,5 % en 2024.' },
          { terme: 'HCSF', def: 'Haut Conseil de Stabilité Financière — norme limitant le taux d\'endettement à 35 % des revenus nets et la durée de crédit à 25 ans.' },
          { terme: 'IFI', def: 'Impôt sur la Fortune Immobilière — taxe annuelle sur le patrimoine immobilier net > 1,3 M€. Barème de 0,50 % à 1,50 %.' },
          { terme: 'IR', def: 'Impôt sur le Revenu — impôt progressif calculé sur le revenu net imposable du foyer fiscal, divisé par le nombre de parts (QF).' },
          { terme: 'LMNP/LMP', def: 'Location Meublée Non Professionnelle / Professionnelle. Régime BIC permettant l\'amortissement du bien (vs revenus fonciers en nu).' },
        ].map(g => `
          <div style="padding: 8px 10px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #6366f1;">
            <div style="font-size: 9pt; font-weight: 700; color: #0f172a; margin-bottom: 2px;">${g.terme}</div>
            <div style="font-size: 8pt; color: #64748b; line-height: 1.4;">${g.def}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <!-- ==================== PAGE: GLOSSAIRE (SUITE) & RÉFÉRENCES ==================== -->
  <div class="page content-page" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Glossaire & Références (suite)</h2>
    </div>

    <div class="section">
      <!-- Glossaire M-Z -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;">
        ${[
          { terme: 'Micro-foncier', def: 'Régime simplifié pour revenus fonciers < 15 000 €/an. Abattement forfaitaire de 30 %, pas de déduction de charges réelles.' },
          { terme: 'Nue-propriété', def: 'Droit de disposer du bien sans pouvoir l\'utiliser ni en percevoir les revenus. Sa valeur fiscale dépend de l\'âge de l\'usufruitier (art. 669 CGI).' },
          { terme: 'OPCI', def: 'Organisme de Placement Collectif Immobilier — fonds mixte (immobilier + valeurs mobilières). Plus liquide que les SCPI.' },
          { terme: 'Parts fiscales', def: 'Nombre de parts du foyer fiscal (1 par adulte + 0,5 par enfant à charge, 1 à partir du 3ème). Détermine le quotient familial.' },
          { terme: 'PEA', def: 'Plan d\'Épargne en Actions — plafond 150 000 €. Exonération IR sur les gains après 5 ans, PS (17,2 %) restent dus.' },
          { terme: 'PER', def: 'Plan d\'Épargne Retraite — versements déductibles du revenu imposable (plafond 10 % revenus N-1). Bloqué jusqu\'à la retraite sauf exceptions.' },
          { terme: 'PFU (Flat Tax)', def: 'Prélèvement Forfaitaire Unique de 30 % (12,8 % IR + 17,2 % PS) sur les revenus de capitaux mobiliers et plus-values.' },
          { terme: 'Plafonnement QF', def: 'Avantage maximal du quotient familial : 1 759 €/demi-part supplémentaire (2025). Limite l\'effet des parts sur l\'impôt.' },
          { terme: 'PS', def: 'Prélèvements Sociaux — 17,2 % (CSG 9,2 % + CRDS 0,5 % + prélèvement solidarité 7,5 %) sur revenus du patrimoine.' },
          { terme: 'PV immobilière', def: 'Plus-Value de cession immobilière. Abattement progressif : exonération IR après 22 ans, PS après 30 ans de détention.' },
          { terme: 'QF (Quotient Familial)', def: 'Revenu imposable ÷ nombre de parts. Permet de moduler l\'impôt selon la composition du foyer.' },
          { terme: 'Rendement brut', def: 'Loyers annuels ÷ prix d\'achat du bien × 100. Ne tient pas compte des charges, taxes et fiscalité.' },
          { terme: 'Rendement net', def: 'Loyers − charges − fiscalité) ÷ prix d\'achat × 100. Indicateur de performance réelle de l\'investissement locatif.' },
          { terme: 'Règle des 4 %', def: 'Taux de retrait annuel soutenable d\'un capital retraite sans l\'épuiser sur 25-30 ans (étude Trinity, ajustée à l\'inflation).' },
          { terme: 'SCPI', def: 'Société Civile de Placement Immobilier — « pierre-papier ». Investissement immobilier mutualisé, revenus distribués trimestriellement.' },
          { terme: 'SCI', def: 'Société Civile Immobilière — structure juridique permettant de détenir et gérer de l\'immobilier à plusieurs (gestion, transmission facilitée).' },
          { terme: 'Taux d\'effort', def: 'Rapport entre les charges fixes (logement, crédits) et les revenus du ménage. Norme HCSF : max 35 %.' },
          { terme: 'TMI', def: 'Tranche Marginale d\'Imposition — taux auquel est imposé le dernier euro de revenu. Détermine le « prix » fiscal d\'un euro supplémentaire.' },
          { terme: 'TRI', def: 'Taux de Rendement Interne — indicateur de performance d\'un investissement intégrant flux de trésorerie, plus-value et durée.' },
          { terme: 'UC (Unités de Compte)', def: 'Supports d\'investissement en assurance-vie ou PER non garantis en capital (actions, obligations, SCPI, ETF…).' },
          { terme: 'Usufruit', def: 'Droit d\'utiliser un bien et d\'en percevoir les revenus sans en être propriétaire. S\'éteint au décès de l\'usufruitier.' },
        ].map(g => `
          <div style="padding: 8px 10px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #8b5cf6;">
            <div style="font-size: 9pt; font-weight: 700; color: #0f172a; margin-bottom: 2px;">${g.terme}</div>
            <div style="font-size: 8pt; color: #64748b; line-height: 1.4;">${g.def}</div>
          </div>
        `).join('')}
      </div>

      <div class="section-header" style="margin-top: 12px;">
        <div class="section-icon">⚖️</div>
        <div>
          <div class="section-title">Références réglementaires</div>
          <div class="section-subtitle">Textes de loi et articles du Code général des impôts cités dans ce rapport</div>
        </div>
      </div>

      <div class="card">
        ${[
          { ref: 'Art. 197 CGI', desc: 'Barème progressif de l\'impôt sur le revenu (5 tranches : 0 %, 11 %, 30 %, 41 %, 45 %)' },
          { ref: 'Art. 163 quatervicies CGI', desc: 'Déductibilité des versements PER (plafond 10 % des revenus, max ~35 194 €)' },
          { ref: 'Art. 200-0 A CGI', desc: 'Plafonnement global des niches fiscales (10 000 €/an, 18 000 € outre-mer/SOFICA)' },
          { ref: 'Art. 199 undecies B CGI', desc: 'Réduction d\'impôt pour investissement outre-mer (Girardin)' },
          { ref: 'Art. 150 VB CGI', desc: 'Plus-values immobilières des particuliers — abattements pour durée de détention' },
          { ref: 'Art. 669 CGI', desc: 'Barème fiscal du démembrement de propriété (usufruit/nue-propriété par tranche d\'âge)' },
          { ref: 'Art. 779 CGI', desc: 'Abattement de 100 000 € en ligne directe (renouvelable tous les 15 ans)' },
          { ref: 'Art. 777 CGI', desc: 'Barème des droits de succession en ligne directe (5 % à 45 %)' },
          { ref: 'Art. 790 G CGI', desc: 'Don familial de sommes d\'argent (abattement supplémentaire de 31 865 €, donateur < 80 ans)' },
          { ref: 'Art. 990 I CGI', desc: 'Fiscalité de l\'assurance-vie au décès — primes versées avant 70 ans (abatt. 152 500 €/bénéf.)' },
          { ref: 'Art. 757 B CGI', desc: 'Fiscalité de l\'assurance-vie au décès — primes versées après 70 ans (abatt. global 30 500 €)' },
          { ref: 'Art. 1133 CGI', desc: 'Extinction de l\'usufruit au décès : le nu-propriétaire devient plein propriétaire sans droits' },
          { ref: 'Art. 125-0 A CGI', desc: 'Fiscalité des rachats d\'assurance-vie en cours de contrat (PFU ou barème + abattements)' },
          { ref: 'Art. 977 CGI', desc: 'Impôt sur la Fortune Immobilière (IFI) — seuil, barème et obligations déclaratives' },
          { ref: 'Art. L. 522-1 C. Ass.', desc: 'Obligations de conseil du courtier en assurance — devoir de conseil personnalisé' },
          { ref: 'Art. L. 541-8-1 CMF', desc: 'Obligations d\'information du CIF — adéquation des recommandations au profil du client' },
          { ref: 'Dir. MIF II (2014/65/UE)', desc: 'Directive européenne sur les marchés d\'instruments financiers — protection des investisseurs' },
          { ref: 'Dir. DDA (2016/97/UE)', desc: 'Directive sur la distribution d\'assurances — devoir de conseil et transparence' },
          { ref: 'Norme HCSF (2021)', desc: 'Plafonnement du taux d\'endettement à 35 % des revenus nets et durée de crédit à 25 ans' },
          { ref: 'RGPD (UE 2016/679)', desc: 'Règlement européen sur la protection des données personnelles — droits d\'accès et d\'effacement' },
        ].map(r => `
          <div style="display: flex; gap: 10px; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <div style="width: 170px; font-size: 8.5pt; font-weight: 700; color: #6366f1; flex-shrink: 0;">${r.ref}</div>
            <div style="font-size: 8.5pt; color: #334155; line-height: 1.4;">${r.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <!-- ==================== CHAPITRE XVII: AVERTISSEMENTS ==================== -->
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Avertissements & Mentions Légales</h2>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">⚠️</div>
        <div>
          <div class="section-title">Avertissements importants</div>
          <div class="section-subtitle">À lire attentivement avant toute prise de décision</div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 14px; border-left: 4px solid #f59e0b;">
        <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Nature du document</div>
        <p style="font-size: 9.5pt; color: #334155; line-height: 1.7; margin: 0;">
          Ce bilan patrimonial est un document d'analyse et de conseil personnalisé, établi à partir des informations communiquées par le client à la date de sa rédaction. 
          Il ne constitue en aucun cas une offre, une sollicitation ou une recommandation d'achat ou de vente de produits financiers, immobiliers ou d'assurance.
        </p>
      </div>

      <div class="card" style="margin-bottom: 14px; border-left: 4px solid #f59e0b;">
        <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Limites des projections</div>
        <p style="font-size: 9.5pt; color: #334155; line-height: 1.7; margin: 0;">
          Les projections et simulations présentées reposent sur des hypothèses économiques, fiscales et démographiques qui peuvent évoluer. 
          Les résultats passés ne préjugent pas des résultats futurs. Les rendements utilisés dans les scénarios sont purement illustratifs et ne garantissent aucun résultat.
          La fiscalité applicable est celle en vigueur à la date du document et peut être modifiée par le législateur.
        </p>
      </div>

      <div class="card" style="margin-bottom: 14px; border-left: 4px solid #f59e0b;">
        <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Responsabilité du client</div>
        <p style="font-size: 9.5pt; color: #334155; line-height: 1.7; margin: 0;">
          Le client s'engage sur l'exactitude et l'exhaustivité des informations fournies. Toute omission ou inexactitude pourrait affecter 
          la pertinence de l'analyse et des préconisations formulées. Le client est invité à signaler tout changement de situation 
          (familiale, professionnelle, patrimoniale, fiscale) susceptible de modifier les conclusions de ce bilan.
        </p>
      </div>

      <div class="card" style="margin-bottom: 14px; border-left: 4px solid #f59e0b;">
        <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Cadre réglementaire</div>
        <p style="font-size: 9.5pt; color: #334155; line-height: 1.7; margin: 0;">
          Ce document est établi conformément aux obligations de conseil et d'information prévues par :
        </p>
        <ul style="font-size: 9pt; color: #334155; line-height: 1.8; margin: 8px 0 0 16px; padding: 0;">
          <li>Les articles L. 522-1 et suivants du Code des assurances (courtage en assurance)</li>
          <li>L'article L. 541-8-1 du Code monétaire et financier (conseil en investissement financier)</li>
          <li>La directive MIF II (2014/65/UE) et son règlement délégué (EU) 2017/565</li>
          <li>La directive DDA (2016/97/UE) sur la distribution d'assurances</li>
          <li>Le règlement RGPD (UE 2016/679) relatif à la protection des données personnelles</li>
        </ul>
      </div>

      <div class="card" style="border-left: 4px solid #3b82f6; margin-bottom: 14px;">
        <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Protection des données</div>
        <p style="font-size: 9.5pt; color: #334155; line-height: 1.7; margin: 0;">
          Les données personnelles collectées dans le cadre de ce bilan sont traitées conformément au RGPD (UE 2016/679). Elles sont strictement confidentielles 
          et ne seront communiquées à aucun tiers sans le consentement préalable du client, sauf obligation légale. 
          Le client dispose d'un droit d'accès, de rectification, d'effacement et de portabilité de ses données auprès du responsable de traitement.
        </p>
      </div>

      <!-- Identité professionnelle du cabinet -->
      <div class="card" style="border-left: 4px solid #6366f1;">
        <div style="font-size: 10pt; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Identité professionnelle</div>
        <div style="font-size: 9pt; color: #334155; line-height: 1.8;">
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${data.cabinet?.nom ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #64748b; width: 180px; font-size: 8.5pt;">Cabinet</td><td style="padding: 3px 0; font-size: 9pt;">${data.cabinet.nom}</td></tr>` : ''}
              ${data.cabinet?.adresse ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #64748b; width: 180px; font-size: 8.5pt;">Adresse</td><td style="padding: 3px 0; font-size: 9pt;">${data.cabinet.adresse}</td></tr>` : ''}
              ${data.cabinet?.email ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #64748b; width: 180px; font-size: 8.5pt;">Email</td><td style="padding: 3px 0; font-size: 9pt;">${data.cabinet.email}</td></tr>` : ''}
              ${data.cabinet?.telephone ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #64748b; width: 180px; font-size: 8.5pt;">Téléphone</td><td style="padding: 3px 0; font-size: 9pt;">${data.cabinet.telephone}</td></tr>` : ''}
              ${data.cabinet?.siren ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #64748b; width: 180px; font-size: 8.5pt;">SIREN</td><td style="padding: 3px 0; font-size: 9pt;">${data.cabinet.siren}</td></tr>` : ''}
              ${data.cabinet?.opiasNumber ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #64748b; width: 180px; font-size: 8.5pt;">N° ORIAS</td><td style="padding: 3px 0; font-size: 9pt;">${data.cabinet.opiasNumber} <span style="font-size: 7.5pt; color: #94a3b8;">(vérifiable sur orias.fr)</span></td></tr>` : ''}
              ${data.cabinet?.cifNumber ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #64748b; width: 180px; font-size: 8.5pt;">N° CIF</td><td style="padding: 3px 0; font-size: 9pt;">${data.cabinet.cifNumber}</td></tr>` : ''}
              ${data.cabinet?.rcpAssureur ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #64748b; width: 180px; font-size: 8.5pt;">Assurance RCP</td><td style="padding: 3px 0; font-size: 9pt;">${data.cabinet.rcpAssureur}</td></tr>` : ''}
              ${data.cabinet?.mediateur ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #64748b; width: 180px; font-size: 8.5pt;">Médiateur</td><td style="padding: 3px 0; font-size: 9pt;">${data.cabinet.mediateur}</td></tr>` : ''}
            </tbody>
          </table>
        </div>
        <div style="font-size: 8pt; color: #64748b; margin-top: 8px; line-height: 1.5; padding-top: 8px; border-top: 1px solid #f1f5f9;">
          Le statut et les habilitations de l'intermédiaire sont vérifiables auprès de l'ORIAS (www.orias.fr). En cas de réclamation, le client peut s'adresser au médiateur désigné ci-dessus ou, à défaut, à l'AMF (www.amf-france.org) ou l'ACPR (acpr.banque-france.fr).
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== CHAPITRE XVIII: VALIDATION ==================== -->
  <div class="page content-page chapter-break" data-page-label="Bilan Patrimonial — ${data.client.prenom} ${data.client.nom} | Confidentiel | ${data.cabinet?.nom || ''}">
    <div class="page-header">
      <h2 class="page-title">Validation du Document</h2>
    </div>

    <div class="signature-section">
      <div class="signature-intro">
        <p style="margin-bottom: 12px;">
          <strong>Avertissement :</strong> Ce document constitue un bilan patrimonial établi à partir des informations 
          communiquées par le client. Les valeurs mentionnées sont indicatives et peuvent évoluer dans le temps.
        </p>
        <p style="margin-bottom: 12px;">
          Les préconisations formulées sont données à titre de conseil et ne constituent pas un engagement contractuel. 
          Toute décision d'investissement doit faire l'objet d'une analyse approfondie et personnalisée.
        </p>
        <p>
          Document établi conformément aux obligations de conseil et d'information prévues par les articles 
          L. 522-1 et suivants du Code des assurances et L. 541-8-1 du Code monétaire et financier.
        </p>
      </div>

      <div class="signature-grid">
        <div class="signature-box">
          <div class="signature-role">Le Conseiller</div>
          <div class="signature-line"></div>
          <div class="signature-name">${data.conseiller?.prenom || ''} ${data.conseiller?.nom || ''}</div>
          <div class="signature-date">Fait à ____________, le ${formatDate(new Date())}</div>
        </div>
        <div class="signature-box">
          <div class="signature-role">Le Client</div>
          <div class="signature-line"></div>
          <div class="signature-name">${data.client.prenom} ${data.client.nom}</div>
          <div class="signature-date">Lu et approuvé, signature précédée de la mention "Bon pour accord"</div>
        </div>
      </div>
    </div>

    <div style="margin-top: 80px; text-align: center; color: #94a3b8; font-size: 9pt;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 12pt;">
          ${data.cabinet?.nom?.charAt(0) || 'A'}
        </div>
        <span style="font-weight: 600; color: #0f172a;">${data.cabinet?.nom || 'Cabinet de Conseil en Gestion de Patrimoine'}</span>
      </div>
      ${data.cabinet?.adresse ? `<p>${data.cabinet.adresse}</p>` : ''}
      ${data.cabinet?.telephone || data.cabinet?.email ? `
        <p style="margin-top: 4px;">
          ${data.cabinet.telephone ? `Tél : ${data.cabinet.telephone}` : ''}
          ${data.cabinet.telephone && data.cabinet.email ? ' • ' : ''}
          ${data.cabinet.email ? data.cabinet.email : ''}
        </p>
      ` : ''}
      <p style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        Document confidentiel • Référence : ${data.dossier.reference} • Généré le ${formatDate(new Date())}
      </p>
    </div>
  </div>

</body>
</html>
  `
}

export default generateBilanPatrimonialPremiumHtml
