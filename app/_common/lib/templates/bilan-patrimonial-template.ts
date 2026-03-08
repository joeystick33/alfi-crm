/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseReportStyles } from '../services/pdf-generator'

export interface BilanPatrimonialData {
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
    situationFamiliale?: string
    regimeMatrimonial?: string
    enfants?: number
    profession?: string
    email?: string
    telephone?: string
  }
  conseiller: {
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
  }>
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
  return `${(value * 100).toFixed(2)}%`
}

function getPriorityClass(priority: string): string {
  switch (priority) {
    case 'HAUTE':
      return 'priorite-haute'
    case 'MOYENNE':
      return 'priorite-moyenne'
    case 'BASSE':
      return 'priorite-basse'
    default:
      return ''
  }
}

function getBadgeClass(priority: string): string {
  switch (priority) {
    case 'HAUTE':
      return 'badge-haute'
    case 'MOYENNE':
      return 'badge-moyenne'
    case 'BASSE':
      return 'badge-basse'
    default:
      return ''
  }
}

export function generateBilanPatrimonialHtml(data: BilanPatrimonialData): string {
  const totalActifs =
    data.patrimoine.immobilier.reduce((sum, a) => sum + a.valeur, 0) +
    data.patrimoine.financier.reduce((sum, a) => sum + a.valeur, 0) +
    data.patrimoine.professionnel.reduce((sum, a) => sum + a.valeur, 0)

  const totalPassifs = data.patrimoine.passifs.reduce((sum, p) => sum + p.capitalRestant, 0)
  const patrimoineNet = totalActifs - totalPassifs
  const capaciteEpargne = data.revenus.total - data.charges.total - data.charges.totalMensualitesCredits * 12

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bilan Patrimonial - ${data.client.prenom} ${data.client.nom}</title>
  <style>
    ${baseReportStyles}
  </style>
</head>
<body>

  <!-- PAGE 1: COUVERTURE -->
  <div class="page cover-page">
    ${data.cabinet?.logo ? `<img src="${data.cabinet.logo}" alt="Logo" class="logo">` : `
      <div class="logo" style="width: 100px; height: 100px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32pt; font-weight: 700;">
        ${data.cabinet?.nom?.charAt(0) || 'A'}
      </div>
    `}
    
    <h1>Bilan Patrimonial</h1>
    <p class="subtitle">Analyse complète et préconisations personnalisées</p>
    
    <div class="client-info">
      <p class="client-name">${data.client.prenom} ${data.client.nom}</p>
      <p class="date">Établi le ${formatDate(new Date())}</p>
    </div>
    
    <div style="margin-top: 40px; opacity: 0.8;">
      <p>Dossier N° ${data.dossier.reference}</p>
      <p style="font-size: 10pt; margin-top: 8px;">Conseiller : ${data.conseiller.prenom} ${data.conseiller.nom}</p>
    </div>
    
    <div class="cabinet-info">
      <p>${data.cabinet?.nom || 'Cabinet de Conseil en Gestion de Patrimoine'}</p>
      ${data.cabinet?.adresse ? `<p>${data.cabinet.adresse}</p>` : ''}
      ${data.cabinet?.telephone ? `<p>Tél : ${data.cabinet.telephone}</p>` : ''}
    </div>
  </div>

  <!-- PAGE 2: SYNTHÈSE -->
  <div class="page content-page">
    <div class="page-header">
      <h2>Synthèse Patrimoniale</h2>
    </div>
    
    <div class="page-content">
      <!-- Informations client -->
      <div class="section">
        <h3 class="section-title">Informations Personnelles</h3>
        <div class="card">
          <table style="margin-bottom: 0;">
            <tr>
              <td style="width: 25%; border: none;"><span class="text-muted">Nom complet</span></td>
              <td style="border: none; font-weight: 500;">${data.client.prenom} ${data.client.nom}</td>
              <td style="width: 25%; border: none;"><span class="text-muted">Date de naissance</span></td>
              <td style="border: none; font-weight: 500;">${formatDate(data.client.dateNaissance)}</td>
            </tr>
            <tr>
              <td style="border: none;"><span class="text-muted">Situation familiale</span></td>
              <td style="border: none; font-weight: 500;">${data.client.situationFamiliale || '-'}</td>
              <td style="border: none;"><span class="text-muted">Régime matrimonial</span></td>
              <td style="border: none; font-weight: 500;">${data.client.regimeMatrimonial || '-'}</td>
            </tr>
            <tr>
              <td style="border: none;"><span class="text-muted">Enfants</span></td>
              <td style="border: none; font-weight: 500;">${data.client.enfants || 0}</td>
              <td style="border: none;"><span class="text-muted">Profession</span></td>
              <td style="border: none; font-weight: 500;">${data.client.profession || '-'}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Indicateurs clés -->
      <div class="section">
        <h3 class="section-title">Indicateurs Clés</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <p class="stat-label">Patrimoine Brut</p>
            <p class="stat-value">${formatCurrency(totalActifs)}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Endettement</p>
            <p class="stat-value" style="color: #dc2626;">${formatCurrency(totalPassifs)}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Patrimoine Net</p>
            <p class="stat-value highlight">${formatCurrency(patrimoineNet)}</p>
          </div>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <p class="stat-label">Revenus Annuels</p>
            <p class="stat-value">${formatCurrency(data.revenus.total)}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Charges Annuelles</p>
            <p class="stat-value">${formatCurrency(data.charges.total + data.charges.totalMensualitesCredits * 12)}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Capacité d'Épargne</p>
            <p class="stat-value ${capaciteEpargne >= 0 ? 'highlight' : ''}" style="${capaciteEpargne < 0 ? 'color: #dc2626;' : ''}">${formatCurrency(capaciteEpargne)}</p>
          </div>
        </div>
      </div>

      <!-- Répartition graphique (placeholder) -->
      <div class="section">
        <h3 class="section-title">Répartition du Patrimoine</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="card">
            <p class="card-title mb-2">Actifs par catégorie</p>
            <table style="margin-bottom: 0;">
              <tr>
                <td style="border: none;">Immobilier</td>
                <td style="border: none; text-align: right; font-weight: 600;">${formatCurrency(data.patrimoine.immobilier.reduce((s, a) => s + a.valeur, 0))}</td>
              </tr>
              <tr>
                <td style="border: none;">Financier</td>
                <td style="border: none; text-align: right; font-weight: 600;">${formatCurrency(data.patrimoine.financier.reduce((s, a) => s + a.valeur, 0))}</td>
              </tr>
              <tr>
                <td style="border: none;">Professionnel</td>
                <td style="border: none; text-align: right; font-weight: 600;">${formatCurrency(data.patrimoine.professionnel.reduce((s, a) => s + a.valeur, 0))}</td>
              </tr>
            </table>
          </div>
          <div class="card">
            <p class="card-title mb-2">Taux d'endettement</p>
            <p style="font-size: 28pt; font-weight: 700; color: ${totalActifs > 0 ? (totalPassifs / totalActifs < 0.3 ? '#059669' : totalPassifs / totalActifs < 0.5 ? '#f59e0b' : '#dc2626') : '#1e3a5f'}; text-align: center; padding: 20px 0;">
              ${totalActifs > 0 ? ((totalPassifs / totalActifs) * 100).toFixed(1) : 0}%
            </p>
            <p class="text-muted text-center text-sm">Ratio passifs / actifs</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- PAGE 3: DÉTAIL DU PATRIMOINE -->
  <div class="page content-page">
    <div class="page-header">
      <h2>Détail du Patrimoine</h2>
    </div>
    
    <div class="page-content">
      ${data.patrimoine.immobilier.length > 0 ? `
        <div class="section">
          <h3 class="section-title">Patrimoine Immobilier</h3>
          <table>
            <thead>
              <tr>
                <th>Bien</th>
                <th>Type</th>
                <th>Localisation</th>
                <th class="text-right">Valeur</th>
              </tr>
            </thead>
            <tbody>
              ${data.patrimoine.immobilier.map(bien => `
                <tr>
                  <td>${bien.nom}</td>
                  <td>${bien.type}</td>
                  <td>${bien.location || '-'}</td>
                  <td class="amount">${formatCurrency(bien.valeur)}</td>
                </tr>
              `).join('')}
              <tr style="font-weight: 600; background: #f1f5f9;">
                <td colspan="3">Total Immobilier</td>
                <td class="amount">${formatCurrency(data.patrimoine.immobilier.reduce((s, a) => s + a.valeur, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : ''}

      ${data.patrimoine.financier.length > 0 ? `
        <div class="section">
          <h3 class="section-title">Patrimoine Financier</h3>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Type</th>
                <th class="text-right">Valeur</th>
              </tr>
            </thead>
            <tbody>
              ${data.patrimoine.financier.map(actif => `
                <tr>
                  <td>${actif.nom}</td>
                  <td>${actif.type}</td>
                  <td class="amount">${formatCurrency(actif.valeur)}</td>
                </tr>
              `).join('')}
              <tr style="font-weight: 600; background: #f1f5f9;">
                <td colspan="2">Total Financier</td>
                <td class="amount">${formatCurrency(data.patrimoine.financier.reduce((s, a) => s + a.valeur, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : ''}

      ${data.patrimoine.passifs.length > 0 ? `
        <div class="section">
          <h3 class="section-title">Passifs & Crédits</h3>
          <table>
            <thead>
              <tr>
                <th>Crédit</th>
                <th>Type</th>
                <th class="text-right">Capital Restant</th>
                <th class="text-right">Taux</th>
                <th class="text-right">Mensualité</th>
              </tr>
            </thead>
            <tbody>
              ${data.patrimoine.passifs.map(passif => `
                <tr>
                  <td>${passif.nom}</td>
                  <td>${passif.type}</td>
                  <td class="amount negative">${formatCurrency(passif.capitalRestant)}</td>
                  <td class="text-right">${formatPercent(passif.tauxInteret)}</td>
                  <td class="amount">${formatCurrency(passif.mensualite)}</td>
                </tr>
              `).join('')}
              <tr style="font-weight: 600; background: #f1f5f9;">
                <td colspan="2">Total Passifs</td>
                <td class="amount negative">${formatCurrency(totalPassifs)}</td>
                <td></td>
                <td class="amount">${formatCurrency(data.charges.totalMensualitesCredits)}/mois</td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : ''}
    </div>
  </div>

  ${data.preconisations && data.preconisations.length > 0 ? `
  <!-- PAGE 4: PRÉCONISATIONS -->
  <div class="page content-page">
    <div class="page-header">
      <h2>Préconisations</h2>
    </div>
    
    <div class="page-content">
      <p class="text-muted mb-3">
        Suite à l'analyse de votre situation patrimoniale, nous vous recommandons les actions suivantes :
      </p>
      
      ${data.preconisations.map((preco, index) => `
        <div class="preconisation ${getPriorityClass(preco.priorite)}">
          <div class="preconisation-header">
            <p class="preconisation-title">${index + 1}. ${preco.titre}</p>
            <span class="preconisation-badge ${getBadgeClass(preco.priorite)}">
              Priorité ${preco.priorite.toLowerCase()}
            </span>
          </div>
          <p class="preconisation-description">${preco.description}</p>
          ${preco.produit || preco.montantEstime || preco.objectif ? `
            <div class="preconisation-details">
              ${preco.produit ? `
                <div class="detail-item">
                  <span class="detail-label">Produit :</span>
                  <span class="detail-value">${preco.produit}</span>
                </div>
              ` : ''}
              ${preco.montantEstime ? `
                <div class="detail-item">
                  <span class="detail-label">Montant estimé :</span>
                  <span class="detail-value">${formatCurrency(preco.montantEstime)}</span>
                </div>
              ` : ''}
              ${preco.objectif ? `
                <div class="detail-item">
                  <span class="detail-label">Objectif :</span>
                  <span class="detail-value">${preco.objectif}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
          ${preco.avantages ? `
            <div style="margin-top: 12px; padding: 12px; background: #f0fdf4; border-radius: 6px;">
              <p class="text-sm" style="color: #059669;"><strong>Avantages :</strong> ${preco.avantages}</p>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <!-- PAGE FINALE: SIGNATURES -->
  <div class="page content-page">
    <div class="page-header">
      <h2>Validation du Document</h2>
    </div>
    
    <div class="page-content">
      <div class="card">
        <p class="text-muted mb-3">
          Ce document constitue un bilan patrimonial établi à partir des informations communiquées par le client. 
          Les préconisations formulées sont données à titre indicatif et ne constituent pas un engagement contractuel.
          Toute décision d'investissement doit faire l'objet d'une analyse approfondie et d'un conseil personnalisé.
        </p>
        
        <p class="text-sm text-muted">
          Document établi conformément aux obligations de conseil et d'information (articles L. 522-1 et suivants du Code des assurances).
        </p>
      </div>

      <div class="signature-area">
        <div class="signature-box">
          <p class="signature-label">Le Conseiller</p>
          <p class="signature-name">${data.conseiller.prenom} ${data.conseiller.nom}</p>
          <p class="text-sm text-muted" style="margin-top: 8px;">Date : ${formatDate(new Date())}</p>
        </div>
        <div class="signature-box">
          <p class="signature-label">Le Client</p>
          <p class="signature-name">${data.client.prenom} ${data.client.nom}</p>
          <p class="text-sm text-muted" style="margin-top: 8px;">Lu et approuvé</p>
        </div>
      </div>

      <div style="margin-top: 60px; text-align: center; color: #94a3b8; font-size: 9pt;">
        <p>${data.cabinet?.nom || 'Cabinet de Conseil en Gestion de Patrimoine'}</p>
        ${data.cabinet?.adresse ? `<p>${data.cabinet.adresse}</p>` : ''}
        <p style="margin-top: 8px;">Document confidentiel - Réf: ${data.dossier.reference}</p>
      </div>
    </div>
  </div>

</body>
</html>
  `
}

export default generateBilanPatrimonialHtml
