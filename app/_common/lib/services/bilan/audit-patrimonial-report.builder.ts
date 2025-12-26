/**
 * Builder pour le Rapport d'Audit Patrimonial Premium
 * Transforme les données de l'audit en rapport structuré
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuditPatrimonialComplet = any

import type {
  RapportAuditPatrimonial,
  ScoresAudit,
  ScoreDetaille,
  NiveauDiagnostic,
  SectionRapport,
} from './audit-patrimonial-report.types'

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)} %`
}

function getNiveauFromScore(score: number): NiveauDiagnostic {
  if (score >= 80) return 'EXCELLENT'
  if (score >= 60) return 'BON'
  if (score >= 40) return 'CORRECT'
  if (score >= 20) return 'INSUFFISANT'
  return 'CRITIQUE'
}

function getCouleurFromNiveau(niveau: NiveauDiagnostic): string {
  const couleurs: Record<NiveauDiagnostic, string> = {
    EXCELLENT: '#10b981',
    BON: '#22c55e',
    CORRECT: '#f59e0b',
    INSUFFISANT: '#f97316',
    CRITIQUE: '#ef4444',
  }
  return couleurs[niveau]
}

function getIconeFromNiveau(niveau: NiveauDiagnostic): string {
  const icones: Record<NiveauDiagnostic, string> = {
    EXCELLENT: '🌟',
    BON: '✅',
    CORRECT: '⚠️',
    INSUFFISANT: '🔶',
    CRITIQUE: '🚨',
  }
  return icones[niveau]
}

function buildScoreDetaille(score: number, commentaire: string): ScoreDetaille {
  const niveau = getNiveauFromScore(score)
  return {
    valeur: score,
    niveau,
    couleur: getCouleurFromNiveau(niveau),
    icone: getIconeFromNiveau(niveau),
    commentaire,
  }
}

// =============================================================================
// CALCUL DES SCORES
// =============================================================================

function calculerScores(audit: AuditPatrimonialComplet): ScoresAudit {
  const scoreSituation = audit.situationPersonnelle ? 75 : 30
  const scorePatrimoine = audit.auditPatrimonial ? 
    Math.min(100, 50 + (audit.auditPatrimonial.patrimoineNet > 0 ? 30 : 0) + 
    (audit.auditPatrimonial.actifsImmobiliers?.length > 0 ? 10 : 0) +
    (audit.auditPatrimonial.actifsFinanciers?.length > 0 ? 10 : 0)) : 30
  const scoreBudget = audit.analyseBudgetaire ?
    Math.min(100, 40 + (audit.analyseBudgetaire.tauxEpargne > 10 ? 30 : audit.analyseBudgetaire.tauxEpargne > 5 ? 15 : 0) +
    (audit.analyseBudgetaire.tauxEndettement < 33 ? 30 : audit.analyseBudgetaire.tauxEndettement < 50 ? 15 : 0)) : 30
  const scoreFiscalite = audit.analyseBudgetaire?.fiscalite ?
    Math.min(100, 50 + (audit.analyseBudgetaire.fiscalite.tmi < 30 ? 30 : 15) + 20) : 40
  const scoreSuccession = audit.analyseSuccessorale ?
    Math.min(100, 50 + (audit.analyseSuccessorale.strategiesOptimisation?.length > 0 ? 30 : 0) + 20) : 30
  const scoreObjectifs = audit.objectifsPatrimoniaux ?
    Math.min(100, 40 + (audit.objectifsPatrimoniaux.objectifs?.length > 0 ? 30 : 0) +
    (audit.objectifsPatrimoniaux.profilRisque ? 20 : 0) + 10) : 30
  const scoreStrategie = audit.strategiePatrimoniale ?
    Math.min(100, 50 + (audit.strategiePatrimoniale.recommandations?.length > 0 ? 30 : 0) + 20) : 30
  
  const scoreGlobal = Math.round(
    (scoreSituation + scorePatrimoine + scoreBudget + scoreFiscalite + 
     scoreSuccession + scoreObjectifs + scoreStrategie) / 7
  )

  return {
    global: buildScoreDetaille(scoreGlobal, `Score patrimonial global basé sur l'analyse de 7 domaines clés.`),
    situationPersonnelle: buildScoreDetaille(scoreSituation, 'Complétude des informations personnelles et familiales.'),
    patrimoine: buildScoreDetaille(scorePatrimoine, 'Structure et diversification du patrimoine.'),
    budget: buildScoreDetaille(scoreBudget, 'Équilibre budgétaire et capacité d\'épargne.'),
    fiscalite: buildScoreDetaille(scoreFiscalite, 'Optimisation fiscale et pression fiscale.'),
    succession: buildScoreDetaille(scoreSuccession, 'Préparation successorale et transmission.'),
    objectifs: buildScoreDetaille(scoreObjectifs, 'Définition et progression vers les objectifs.'),
    strategie: buildScoreDetaille(scoreStrategie, 'Pertinence et cohérence de la stratégie.'),
  }
}

// =============================================================================
// CONSTRUCTION DES SECTIONS
// =============================================================================

function buildSectionSituationPersonnelle(audit: AuditPatrimonialComplet): SectionRapport {
  const sp = audit.situationPersonnelle
  
  const regimeLabel: Record<string, string> = {
    'CELIBATAIRE': 'Célibataire',
    'CONCUBINAGE': 'Concubinage',
    'PACS_SEPARATION': 'PACS - Séparation de biens',
    'PACS_INDIVISION': 'PACS - Indivision',
    'MARIAGE_COMMUNAUTE_REDUITE_ACQUETS': 'Mariage - Communauté réduite aux acquêts',
    'MARIAGE_COMMUNAUTE_UNIVERSELLE': 'Mariage - Communauté universelle',
    'MARIAGE_SEPARATION_BIENS': 'Mariage - Séparation de biens',
    'MARIAGE_PARTICIPATION_ACQUETS': 'Mariage - Participation aux acquêts',
  }

  return {
    id: 'situation-personnelle',
    numero: 1,
    titre: 'Situation Personnelle & Familiale',
    sousTitre: 'Analyse du contexte personnel, familial et professionnel',
    icone: '👤',
    contenu: [
      {
        titre: 'Situation civile',
        contenu: sp ? 
          `Vous êtes actuellement sous le régime ${regimeLabel[sp.regimeMatrimonial] || sp.regimeMatrimonial}. ${
            sp.enfants?.length ? `Vous avez ${sp.enfants.length} enfant(s)${sp.enfants.filter(e => e.aCharge).length > 0 ? `, dont ${sp.enfants.filter(e => e.aCharge).length} à charge` : ''}.` : 'Vous n\'avez pas d\'enfant déclaré.'
          }` : 'Informations à compléter.',
      },
      {
        titre: 'Situation professionnelle',
        contenu: sp?.employeur ? 
          `Vous exercez actuellement chez ${sp.employeur}${sp.anciennete ? ` depuis ${sp.anciennete} ans` : ''}.` : 
          'Informations professionnelles à compléter.',
      },
      ...(sp?.donationsEffectuees?.length ? [{
        titre: 'Donations antérieures',
        contenu: `${sp.donationsEffectuees.length} donation(s) réalisée(s) pour un montant total de ${formatCurrency(sp.donationsEffectuees.reduce((sum, d) => sum + d.montant, 0))}.`,
      }] : []),
    ],
    indicateursClés: [
      { label: 'Régime matrimonial', valeur: sp ? regimeLabel[sp.regimeMatrimonial] || '-' : '-', statut: 'neutral' },
      { label: 'Enfants', valeur: sp?.enfants?.length?.toString() || '0', statut: 'neutral' },
      { label: 'Enfants à charge', valeur: sp?.enfants?.filter(e => e.aCharge).length?.toString() || '0', statut: 'neutral' },
      { label: 'Testament rédigé', valeur: sp?.testamentRedige ? 'Oui' : 'Non', statut: sp?.testamentRedige ? 'success' : 'warning' },
    ],
    alertes: !sp?.testamentRedige ? [{
      type: 'warning',
      titre: 'Testament',
      message: 'Aucun testament n\'est rédigé. Il est recommandé de formaliser vos volontés pour protéger vos proches.',
      action: 'Prendre rendez-vous avec un notaire',
    }] : undefined,
  }
}

function buildSectionPatrimoine(audit: AuditPatrimonialComplet): SectionRapport {
  const ap = audit.auditPatrimonial
  const totalActifs = ap?.totalActifs || 0
  const totalPassifs = ap?.totalPassifs || 0
  const patrimoineNet = ap?.patrimoineNet || (totalActifs - totalPassifs)
  
  const repartition = ap?.repartitionParCategorie || []

  return {
    id: 'patrimoine',
    numero: 2,
    titre: 'Audit Patrimonial',
    sousTitre: 'Inventaire et analyse de la structure patrimoniale',
    icone: '🏠',
    contenu: [
      {
        titre: 'Vue d\'ensemble',
        contenu: `Votre patrimoine brut s'élève à ${formatCurrency(totalActifs)}, avec un endettement de ${formatCurrency(totalPassifs)}, soit un patrimoine net de ${formatCurrency(patrimoineNet)}.`,
        style: 'important',
      },
      {
        titre: 'Structure patrimoniale',
        contenu: repartition.length > 0 ? 
          `Votre patrimoine est composé de : ${repartition.map(r => `${r.categorie} (${r.pourcentage.toFixed(0)}%)`).join(', ')}.` :
          'La répartition de votre patrimoine nécessite une analyse plus détaillée.',
      },
      ...(ap?.actifsImmobiliers?.length ? [{
        titre: 'Patrimoine immobilier',
        contenu: `Vous détenez ${ap.actifsImmobiliers.length} bien(s) immobilier(s) pour une valeur totale de ${formatCurrency(ap.actifsImmobiliers.reduce((sum, a) => sum + a.valeur, 0))}.`,
      }] : []),
      ...(ap?.passifs?.length ? [{
        titre: 'Endettement',
        contenu: `Vous avez ${ap.passifs.length} crédit(s) en cours pour un capital restant dû total de ${formatCurrency(totalPassifs)}, avec des mensualités cumulées de ${formatCurrency(ap.passifs.reduce((sum, p) => sum + (p.mensualite || 0), 0))}.`,
      }] : []),
    ],
    indicateursClés: [
      { label: 'Patrimoine brut', valeur: formatCurrency(totalActifs), statut: 'neutral' },
      { label: 'Passifs', valeur: formatCurrency(totalPassifs), statut: totalPassifs > totalActifs * 0.5 ? 'warning' : 'neutral' },
      { label: 'Patrimoine net', valeur: formatCurrency(patrimoineNet), statut: patrimoineNet > 0 ? 'success' : 'danger' },
      { label: 'Taux d\'endettement patrimonial', valeur: totalActifs > 0 ? formatPercent((totalPassifs / totalActifs) * 100) : '0 %', statut: (totalPassifs / totalActifs) > 0.5 ? 'warning' : 'success' },
    ],
    graphiques: [
      {
        type: 'pie',
        titre: 'Répartition du patrimoine',
        donnees: repartition.map(r => ({
          label: r.categorie,
          valeur: r.pourcentage,
          couleur: r.categorie === 'Immobilier' ? '#3b82f6' : r.categorie === 'Financier' ? '#10b981' : r.categorie === 'Professionnel' ? '#8b5cf6' : '#6b7280',
        })),
      },
    ],
    tableaux: ap?.actifsImmobiliers?.length ? [{
      titre: 'Détail des actifs immobiliers',
      entetes: ['Type', 'Libellé', 'Valeur', 'Localisation'],
      lignes: ap.actifsImmobiliers.map(a => [
        a.type || '-',
        a.libelle || '-',
        formatCurrency(a.valeur),
        '-',
      ]),
    }] : undefined,
  }
}

function buildSectionBudget(audit: AuditPatrimonialComplet): SectionRapport {
  const ab = audit.analyseBudgetaire
  const totalRevenus = ab?.totalRevenus || 0
  const totalCharges = ab?.totalCharges || 0
  const tauxEpargne = ab?.tauxEpargne || 0
  const tauxEndettement = ab?.tauxEndettement || 0

  return {
    id: 'budget',
    numero: 3,
    titre: 'Analyse Budgétaire',
    sousTitre: 'Revenus, charges et capacité d\'épargne',
    icone: '💰',
    contenu: [
      {
        titre: 'Équilibre budgétaire',
        contenu: `Vos revenus annuels s'élèvent à ${formatCurrency(totalRevenus)}, soit ${formatCurrency(totalRevenus / 12)} par mois. Vos charges représentent ${formatCurrency(totalCharges)} par an, soit ${formatCurrency(totalCharges / 12)} par mois.`,
      },
      {
        titre: 'Capacité d\'épargne',
        contenu: tauxEpargne >= 15 ? 
          `Votre taux d'épargne de ${formatPercent(tauxEpargne)} est excellent et témoigne d'une bonne gestion budgétaire. Cela vous permet de constituer un patrimoine régulier.` :
          tauxEpargne >= 10 ?
          `Votre taux d'épargne de ${formatPercent(tauxEpargne)} est correct. Il existe une marge de progression pour accélérer la constitution de votre patrimoine.` :
          `Votre taux d'épargne de ${formatPercent(tauxEpargne)} est faible. Une optimisation de vos charges pourrait permettre d'améliorer votre capacité d'épargne.`,
        style: tauxEpargne < 10 ? 'encadre' : 'normal',
      },
      {
        titre: 'Endettement',
        contenu: tauxEndettement <= 33 ?
          `Votre taux d'endettement de ${formatPercent(tauxEndettement)} respecte les normes HCSF et vous offre une marge de manœuvre pour de nouveaux projets.` :
          tauxEndettement <= 50 ?
          `Votre taux d'endettement de ${formatPercent(tauxEndettement)} est élevé. Tout nouveau crédit sera difficile à obtenir.` :
          `Votre taux d'endettement de ${formatPercent(tauxEndettement)} est très élevé et nécessite une attention particulière.`,
      },
    ],
    indicateursClés: [
      { label: 'Revenus annuels', valeur: formatCurrency(totalRevenus), statut: 'neutral' },
      { label: 'Charges annuelles', valeur: formatCurrency(totalCharges), statut: 'neutral' },
      { label: 'Épargne annuelle', valeur: formatCurrency(totalRevenus - totalCharges), statut: (totalRevenus - totalCharges) > 0 ? 'success' : 'danger' },
      { label: 'Taux d\'épargne', valeur: formatPercent(tauxEpargne), statut: tauxEpargne >= 15 ? 'success' : tauxEpargne >= 10 ? 'neutral' : 'warning' },
      { label: 'Taux d\'endettement', valeur: formatPercent(tauxEndettement), statut: tauxEndettement <= 33 ? 'success' : tauxEndettement <= 50 ? 'warning' : 'danger' },
    ],
    graphiques: [
      {
        type: 'gauge',
        titre: 'Taux d\'endettement HCSF',
        donnees: [{ label: 'Endettement', valeur: tauxEndettement }],
      },
    ],
    alertes: tauxEndettement > 33 ? [{
      type: 'warning',
      titre: 'Endettement élevé',
      message: `Votre taux d'endettement de ${formatPercent(tauxEndettement)} dépasse le seuil HCSF de 35%. Cela peut limiter vos possibilités de financement.`,
      action: 'Étudier les options de renégociation ou remboursement anticipé',
    }] : undefined,
  }
}

function buildSectionFiscalite(audit: AuditPatrimonialComplet): SectionRapport {
  const fisc = audit.analyseBudgetaire?.fiscalite
  const tmi = fisc?.tmi || 0
  const revenuImposable = fisc?.revenuImposable || 0
  const impot = fisc?.impotRevenu || 0

  return {
    id: 'fiscalite',
    numero: 4,
    titre: 'Analyse Fiscale',
    sousTitre: 'Situation fiscale et leviers d\'optimisation',
    icone: '📊',
    contenu: [
      {
        titre: 'Situation fiscale actuelle',
        contenu: `Avec un revenu imposable de ${formatCurrency(revenuImposable)}, vous êtes dans la tranche marginale d'imposition à ${tmi}%. Votre impôt sur le revenu s'élève à ${formatCurrency(impot)}.`,
      },
      {
        titre: 'Analyse de la pression fiscale',
        contenu: tmi >= 41 ?
          `Votre TMI élevée (${tmi}%) offre un fort effet de levier sur les dispositifs de déduction fiscale. Chaque euro déductible vous fait économiser ${tmi} centimes d'impôt.` :
          tmi >= 30 ?
          `Votre TMI de ${tmi}% permet de bénéficier d'un effet de levier intéressant sur les dispositifs de défiscalisation, notamment le PER.` :
          `Avec une TMI de ${tmi}%, les dispositifs de déduction fiscale sont moins prioritaires. Privilégiez la capitalisation via l'assurance-vie ou le PEA.`,
      },
    ],
    indicateursClés: [
      { label: 'Revenu imposable', valeur: formatCurrency(revenuImposable), statut: 'neutral' },
      { label: 'TMI', valeur: `${tmi} %`, statut: tmi >= 41 ? 'warning' : 'neutral' },
      { label: 'Impôt sur le revenu', valeur: formatCurrency(impot), statut: 'neutral' },
      { label: 'Taux effectif', valeur: revenuImposable > 0 ? formatPercent((impot / revenuImposable) * 100) : '0 %', statut: 'neutral' },
    ],
    recommandations: tmi >= 30 ? [{
      numero: 1,
      titre: 'Ouverture d\'un PER',
      description: `Avec votre TMI de ${tmi}%, les versements sur un PER vous permettent d'économiser ${tmi}% du montant versé en impôt, dans la limite des plafonds.`,
      impact: 'FORT',
      urgence: 'COURT_TERME',
      domaine: 'Fiscalité',
      economieEstimee: revenuImposable * 0.1 * (tmi / 100),
    }] : undefined,
  }
}

function buildSectionSuccession(audit: AuditPatrimonialComplet): SectionRapport {
  const succ = audit.analyseSuccessorale
  const droitsEstimes = succ?.simulationPredeceClient?.droitsSuccession || 0
  const strategies = succ?.strategiesOptimisation || []

  return {
    id: 'succession',
    numero: 5,
    titre: 'Analyse Successorale',
    sousTitre: 'Transmission et optimisation des droits de succession',
    icone: '👨‍👩‍👧‍👦',
    contenu: [
      {
        titre: 'Simulation des droits de succession',
        contenu: `En l'état actuel de votre patrimoine et de votre situation familiale, les droits de succession estimés s'élèvent à ${formatCurrency(droitsEstimes)}.`,
        style: droitsEstimes > 50000 ? 'encadre' : 'normal',
      },
      ...(strategies.length > 0 ? [{
        titre: 'Stratégies d\'optimisation identifiées',
        contenu: `${strategies.length} stratégie(s) d'optimisation ont été identifiées pour réduire la charge successorale et faciliter la transmission.`,
      }] : [{
        titre: 'Optimisation successorale',
        contenu: 'Une analyse plus approfondie est nécessaire pour identifier les stratégies d\'optimisation adaptées à votre situation.',
      }]),
    ],
    indicateursClés: [
      { label: 'Droits estimés', valeur: formatCurrency(droitsEstimes), statut: droitsEstimes > 100000 ? 'warning' : 'neutral' },
      { label: 'Stratégies identifiées', valeur: strategies.length.toString(), statut: strategies.length > 0 ? 'success' : 'warning' },
    ],
    recommandations: strategies.map((s, i) => ({
      numero: i + 1,
      titre: s.nom,
      description: s.description || `Cette stratégie permet une économie estimée de ${formatCurrency(s.economie || 0)}.`,
      impact: (s.economie || 0) > 50000 ? 'FORT' as const : 'MOYEN' as const,
      urgence: 'MOYEN_TERME' as const,
      domaine: 'Succession',
      economieEstimee: s.economie,
    })),
  }
}

function buildSectionObjectifs(audit: AuditPatrimonialComplet): SectionRapport {
  const obj = audit.objectifsPatrimoniaux
  const profilRisque = obj?.profilRisque || 'NON_DEFINI'
  const objectifs = obj?.objectifs || []

  const profilLabels: Record<string, string> = {
    'SECURITAIRE': 'Sécuritaire - Priorité à la préservation du capital',
    'PRUDENT': 'Prudent - Recherche de rendement avec risque limité',
    'EQUILIBRE': 'Équilibré - Compromis rendement/risque',
    'DYNAMIQUE': 'Dynamique - Acceptation de volatilité pour plus de performance',
    'OFFENSIF': 'Offensif - Recherche de performance maximale',
    'NON_DEFINI': 'Non défini',
  }

  return {
    id: 'objectifs',
    numero: 6,
    titre: 'Objectifs Patrimoniaux',
    sousTitre: 'Profil investisseur et objectifs de placement',
    icone: '🎯',
    contenu: [
      {
        titre: 'Profil investisseur',
        contenu: `Votre profil de risque a été déterminé comme "${profilLabels[profilRisque] || profilRisque}". ${
          obj?.tolerancePerte ? `Vous acceptez une perte maximale de ${obj.tolerancePerte}% sur votre portefeuille.` : ''
        }`,
      },
      ...(objectifs.length > 0 ? [{
        titre: 'Objectifs identifiés',
        contenu: `Vous avez défini ${objectifs.length} objectif(s) patrimonial(aux) : ${objectifs.map(o => o.libelle).join(', ')}.`,
      }] : [{
        titre: 'Objectifs',
        contenu: 'Aucun objectif patrimonial n\'a encore été formalisé. Il est important de définir vos objectifs pour construire une stratégie adaptée.',
      }]),
    ],
    indicateursClés: [
      { label: 'Profil de risque', valeur: profilRisque.replace('_', ' '), statut: 'neutral' },
      { label: 'Objectifs définis', valeur: objectifs.length.toString(), statut: objectifs.length > 0 ? 'success' : 'warning' },
      { label: 'Tolérance perte', valeur: obj?.tolerancePerte ? `${obj.tolerancePerte} %` : 'Non défini', statut: 'neutral' },
      { label: 'Horizon', valeur: obj?.horizonInvestissement ? `${obj.horizonInvestissement} ans` : 'Non défini', statut: 'neutral' },
    ],
    tableaux: objectifs.length > 0 ? [{
      titre: 'Liste des objectifs',
      entetes: ['Priorité', 'Objectif', 'Montant cible', 'Échéance'],
      lignes: objectifs.map(o => [
        o.priorite?.toString() || '-',
        o.libelle,
        o.montantCible ? formatCurrency(o.montantCible) : '-',
        o.horizon || '-',
      ]),
    }] : undefined,
  }
}

function buildSectionStrategie(audit: AuditPatrimonialComplet): SectionRapport {
  const strat = audit.strategiePatrimoniale
  const recommandations = strat?.recommandations || []
  const allocationCible = strat?.allocationCible || []

  return {
    id: 'strategie',
    numero: 7,
    titre: 'Stratégie Patrimoniale',
    sousTitre: 'Recommandations et plan d\'action',
    icone: '🚀',
    contenu: [
      {
        titre: 'Allocation d\'actifs recommandée',
        contenu: allocationCible.length > 0 ?
          `L'allocation cible recommandée est la suivante : ${allocationCible.map(a => `${a.categorie} (${a.pourcentageCible}%)`).join(', ')}.` :
          'L\'allocation cible sera définie en fonction de votre profil de risque et de vos objectifs.',
      },
      {
        titre: 'Recommandations stratégiques',
        contenu: recommandations.length > 0 ?
          `${recommandations.length} recommandation(s) ont été formulées pour optimiser votre situation patrimoniale.` :
          'Les recommandations stratégiques seront établies après analyse complète de votre situation.',
      },
    ],
    indicateursClés: [
      { label: 'Recommandations', valeur: recommandations.length.toString(), statut: recommandations.length > 0 ? 'success' : 'warning' },
    ],
    graphiques: allocationCible.length > 0 ? [{
      type: 'pie',
      titre: 'Allocation cible',
      donnees: allocationCible.map(a => ({
        label: a.categorie,
        valeur: a.pourcentageCible,
        couleur: a.categorie.includes('Actions') ? '#ef4444' : a.categorie.includes('Obligations') ? '#3b82f6' : a.categorie.includes('Immobilier') ? '#f59e0b' : '#10b981',
      })),
    }] : undefined,
    recommandations: recommandations.slice(0, 5).map((r, i) => ({
      numero: i + 1,
      titre: r.titre,
      description: r.description,
      impact: r.impact,
      urgence: r.priorite || 'COURT_TERME',
      domaine: r.type || 'Général',
    })),
  }
}

function buildSectionConclusion(audit: AuditPatrimonialComplet, scores: ScoresAudit): SectionRapport {
  const pointsForts = audit.pointsForts || []
  const pointsVigilance = audit.pointsVigilance || []

  return {
    id: 'conclusion',
    numero: 8,
    titre: 'Conclusion & Prochaines Étapes',
    sousTitre: 'Synthèse et plan d\'action',
    icone: '✨',
    contenu: [
      {
        titre: 'Diagnostic global',
        contenu: `Votre score patrimonial global est de ${scores.global.valeur}/100, ce qui correspond à un niveau "${scores.global.niveau}". ${scores.global.commentaire}`,
        style: 'important',
      },
      ...(pointsForts.length > 0 ? [{
        titre: 'Points forts identifiés',
        contenu: pointsForts.map(p => `• ${p}`).join('\n'),
      }] : []),
      ...(pointsVigilance.length > 0 ? [{
        titre: 'Points de vigilance',
        contenu: pointsVigilance.map(p => `• ${p}`).join('\n'),
      }] : []),
      {
        titre: 'Prochaines étapes',
        contenu: 'Un entretien de restitution permettra de détailler les recommandations et de définir ensemble le calendrier de mise en œuvre des actions prioritaires.',
      },
    ],
    indicateursClés: [
      { label: 'Score global', valeur: `${scores.global.valeur}/100`, statut: scores.global.valeur >= 60 ? 'success' : scores.global.valeur >= 40 ? 'neutral' : 'warning' },
      { label: 'Points forts', valeur: pointsForts.length.toString(), statut: 'success' },
      { label: 'Points de vigilance', valeur: pointsVigilance.length.toString(), statut: pointsVigilance.length > 3 ? 'warning' : 'neutral' },
    ],
    graphiques: [{
      type: 'radar',
      titre: 'Scores par domaine',
      donnees: [
        { label: 'Situation', valeur: scores.situationPersonnelle.valeur },
        { label: 'Patrimoine', valeur: scores.patrimoine.valeur },
        { label: 'Budget', valeur: scores.budget.valeur },
        { label: 'Fiscalité', valeur: scores.fiscalite.valeur },
        { label: 'Succession', valeur: scores.succession.valeur },
        { label: 'Objectifs', valeur: scores.objectifs.valeur },
        { label: 'Stratégie', valeur: scores.strategie.valeur },
      ],
    }],
  }
}

// =============================================================================
// BUILDER PRINCIPAL
// =============================================================================

export function buildRapportAuditPatrimonial(
  audit: AuditPatrimonialComplet,
  clientInfo: { nom: string; prenom: string; email?: string; dateNaissance?: string },
  cabinetInfo: { nom: string; conseiller: string; logo?: string; orias?: string }
): RapportAuditPatrimonial {
  const scores = calculerScores(audit)
  const sp = audit.situationPersonnelle

  return {
    id: audit.id || `audit-${Date.now()}`,
    dateGeneration: new Date(),
    version: '1.0',
    
    client: {
      nom: clientInfo.nom,
      prenom: clientInfo.prenom,
      email: clientInfo.email,
      dateNaissance: clientInfo.dateNaissance,
      situationFamiliale: sp?.regimeMatrimonial || 'Non renseigné',
      regimeMatrimonial: sp?.regimeMatrimonial,
      nombreEnfants: sp?.enfants?.length || 0,
      profession: sp?.employeur,
      conjoint: sp?.conjoint ? {
        nom: sp.conjoint.nom || '',
        prenom: sp.conjoint.prenom || '',
        dateNaissance: sp.conjoint.dateNaissance,
        profession: sp.conjoint.profession,
      } : undefined,
      enfants: sp?.enfants?.map(e => ({
        prenom: e.prenom,
        dateNaissance: e.dateNaissance,
        aCharge: e.aCharge,
      })),
    },
    
    cabinet: {
      nom: cabinetInfo.nom,
      conseiller: cabinetInfo.conseiller,
      logo: cabinetInfo.logo,
      orias: cabinetInfo.orias,
    },
    
    scores,
    
    syntheseExecutive: {
      introduction: `Ce rapport présente l'analyse complète de votre situation patrimoniale au ${new Date().toLocaleDateString('fr-FR')}. Il couvre 7 domaines clés : situation personnelle, patrimoine, budget, fiscalité, succession, objectifs et stratégie.`,
      pointsForts: audit.pointsForts || [],
      pointsVigilance: audit.pointsVigilance || [],
      actionsImmediates: (audit.strategiePatrimoniale?.recommandations || []).slice(0, 3).map((r, i) => ({
        numero: i + 1,
        titre: r.titre,
        description: r.description,
        impact: 'FORT' as const,
        urgence: 'IMMEDIATE' as const,
        domaine: r.type || 'Général',
      })),
    },
    
    sections: {
      situationPersonnelle: buildSectionSituationPersonnelle(audit),
      patrimoine: buildSectionPatrimoine(audit),
      budget: buildSectionBudget(audit),
      fiscalite: buildSectionFiscalite(audit),
      succession: buildSectionSuccession(audit),
      objectifs: buildSectionObjectifs(audit),
      strategie: buildSectionStrategie(audit),
      conclusion: buildSectionConclusion(audit, scores),
    },
    
    donnees: {
      patrimoine: {
        totalActifs: audit.auditPatrimonial?.totalActifs || 0,
        totalPassifs: audit.auditPatrimonial?.totalPassifs || 0,
        patrimoineNet: audit.auditPatrimonial?.patrimoineNet || 0,
        immobilier: {
          total: audit.auditPatrimonial?.actifsImmobiliers?.reduce((s, a) => s + a.valeur, 0) || 0,
          pourcentage: 0,
          details: audit.auditPatrimonial?.actifsImmobiliers?.map(a => ({
            type: a.type,
            libelle: a.libelle || '',
            valeur: a.valeur,
            localisation: undefined,
            revenus: a.revenuLocatif,
          })) || [],
        },
        financier: {
          total: audit.auditPatrimonial?.actifsFinanciers?.reduce((s, a) => s + a.valeur, 0) || 0,
          pourcentage: 0,
          details: audit.auditPatrimonial?.actifsFinanciers?.map(a => ({
            type: a.type,
            libelle: a.libelle || '',
            valeur: a.valeur,
            etablissement: a.etablissement,
            dateOuverture: a.dateOuverture,
          })) || [],
        },
        professionnel: { total: 0, pourcentage: 0, details: [] },
        autre: { total: 0, pourcentage: 0, details: [] },
        passifs: {
          total: audit.auditPatrimonial?.totalPassifs || 0,
          details: audit.auditPatrimonial?.passifs?.map(p => ({
            type: p.type,
            libelle: p.libelle || '',
            capitalRestant: p.capitalRestantDu,
            mensualite: p.mensualite || 0,
            tauxInteret: p.tauxInteret || 0,
            dureeRestante: p.dureeRestante || 0,
          })) || [],
        },
      },
      budget: {
        revenusTotaux: audit.analyseBudgetaire?.totalRevenus || 0,
        revenusDetails: audit.analyseBudgetaire?.revenus?.map(r => ({
          categorie: r.type,
          montant: r.montantAnnuel,
          frequence: 'Annuel',
        })) || [],
        chargesTotales: audit.analyseBudgetaire?.totalCharges || 0,
        chargesDetails: audit.analyseBudgetaire?.charges?.map(c => ({
          categorie: c.type,
          montant: c.montantAnnuel,
          frequence: 'Annuel',
        })) || [],
        capaciteEpargne: (audit.analyseBudgetaire?.totalRevenus || 0) - (audit.analyseBudgetaire?.totalCharges || 0),
        tauxEpargne: audit.analyseBudgetaire?.tauxEpargne || 0,
        tauxEndettement: audit.analyseBudgetaire?.tauxEndettement || 0,
        resteAVivre: 0,
        revenuImposable: audit.analyseBudgetaire?.fiscalite?.revenuImposable || 0,
        impotRevenu: audit.analyseBudgetaire?.fiscalite?.impotRevenu || 0,
        tmi: audit.analyseBudgetaire?.fiscalite?.tmi || 0,
        tauxEffectif: 0,
        protectionSociale: [],
      },
      succession: {
        massSuccessorale: audit.auditPatrimonial?.patrimoineNet || 0,
        abattementsDisponibles: [],
        droitsEstimes: audit.analyseSuccessorale?.simulationPredeceClient?.droitsSuccession || 0,
        tauxGlobal: 0,
        repartitionHeritiers: audit.analyseSuccessorale?.simulationPredeceClient?.heritiers?.map(h => ({
          heritier: h.beneficiaire,
          part: h.partCivile,
          montant: h.partCivile,
          droits: h.droits,
        })) || [],
        strategies: audit.analyseSuccessorale?.strategiesOptimisation?.map(s => ({
          nom: s.nom,
          description: s.description || '',
          economie: s.economie || 0,
          complexite: 'MOYENNE' as const,
          delai: '',
        })) || [],
      },
      objectifs: {
        profilRisque: audit.objectifsPatrimoniaux?.profilRisque || 'NON_DEFINI',
        tolerancePerte: audit.objectifsPatrimoniaux?.tolerancePerte || 0,
        horizonPlacement: audit.objectifsPatrimoniaux?.horizonInvestissement ? `${audit.objectifsPatrimoniaux.horizonInvestissement} ans` : '',
        objectifs: audit.objectifsPatrimoniaux?.objectifs?.map(o => ({
          libelle: o.libelle,
          priorite: o.priorite === 'HAUTE' ? 1 : o.priorite === 'MOYENNE' ? 2 : 3,
          montantCible: o.montantCible,
          echeance: o.horizon,
        })) || [],
        contraintes: audit.objectifsPatrimoniaux?.contraintesSpecifiques || [],
        exclusionsESG: audit.objectifsPatrimoniaux?.exclusionsESG,
      },
      strategie: {
        allocationActuelle: [],
        allocationCible: audit.strategiePatrimoniale?.allocationCible?.map(a => ({
          classe: a.categorie,
          pourcentage: a.pourcentageCible,
          montant: 0,
          ecart: (a.pourcentageCible || 0) - (a.pourcentageActuel || 0),
        })) || [],
        recommandations: audit.strategiePatrimoniale?.recommandations?.map((r, i) => ({
          numero: i + 1,
          titre: r.titre,
          description: r.description,
          impact: r.impact,
          urgence: 'COURT_TERME' as const,
          domaine: r.type || 'Général',
        })) || [],
        actionsCalendrier: audit.strategiePatrimoniale?.calendrierActions?.map(a => ({
          date: a.echeance,
          action: a.action,
          priorite: 'MOYENNE' as const,
        })) || [],
      },
    },
    
    mentionsLegales: `Ce document est établi à titre informatif et ne constitue pas un conseil en investissement au sens de la réglementation MIF II. Les informations contenues dans ce rapport sont basées sur les éléments déclarés par le client à la date de l'audit. Toute décision d'investissement doit faire l'objet d'une analyse personnalisée tenant compte de l'ensemble de la situation du client.`,
    
    disclaimer: `${cabinetInfo.nom} - Conseil en Gestion de Patrimoine${cabinetInfo.orias ? ` - ORIAS n°${cabinetInfo.orias}` : ''}. Document confidentiel destiné uniquement à ${clientInfo.prenom} ${clientInfo.nom}.`,
  }
}
