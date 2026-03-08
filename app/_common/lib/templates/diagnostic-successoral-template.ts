/* eslint-disable @typescript-eslint/no-explicit-any */
import { PdfDocumentBuilder } from './pdf-document-builder'
import {
  generateDonutChart,
  generateHorizontalBarChart,
  generateKpiCard,
} from './pdf-styles-premium'
import { fmtEur, fmtPct, fmtDateLongue, escapeHtml } from './pdf-utils'

// ============================================================================
// TYPES — Contrat de données pour le diagnostic successoral
// ============================================================================

export interface HeritierDroits {
  nom: string
  lien: string
  droitRecu: string
  valeurPart: number
  abattement: number
  baseTaxable: number
  droits: number
  exonere: boolean
  tranches?: Array<{ taux: number; base: number; impot: number }>
}

export interface OptionDevolution {
  label: string
  premierDeces: {
    actifSuccessoral: number
    droitsSuccession: number
    transmissionNette: number
    fraisNotaire: number
    heritiers: HeritierDroits[]
  }
  secondDeces: {
    compositionActif: string
    actifSuccessoral: number
    droitsSuccession: number
    transmissionNette: number
    heritiers: HeritierDroits[]
  }
  coutFiscalTotal: number
}

export interface StrategieOptimisation {
  titre: string
  description: string
  priorite: 'immediate' | 'recommandee' | 'optionnelle'
  cout?: string
  economieEstimee: number
  echeance?: string
  details?: string[]
}

export interface DiagnosticSuccessoralData {
  metadata: {
    dateEtude: string
    nomConseiller?: string
    cabinetConseiller?: string
    cabinetLogo?: string
    reference?: string
  }

  situation: {
    client: {
      prenom: string
      nom: string
      age: number
      sexe: 'M' | 'F'
      dateNaissance?: string
    }
    conjoint?: {
      prenom: string
      nom: string
      age: number
      sexe: 'M' | 'F'
      dateNaissance?: string
    }
    regimeMatrimonial?: string
    enfants: Array<{
      prenom: string
      age?: number
      commun: boolean
    }>
    hasDDV: boolean
  }

  patrimoine: {
    brut: number
    dettes: number
    net: number
    actifs: Array<{
      type: string
      designation: string
      valeur: number
      dette: number
      net: number
      detenteur: 'propre_client' | 'propre_conjoint' | 'commun'
    }>
    repartition: Array<{
      categorie: string
      montant: number
      pourcentage: number
      color?: string
    }>
  }

  liquidation: {
    biensPropresDéfunt: number
    biensCommunsCouple: number
    partConjointHorsSuccession: number
    partDefunt: number
    actifNetSuccessoral: number
    lignes: Array<{
      poste: string
      montant: number
      explication?: string
    }>
  }

  masseSuccessorale: {
    masseDeCalcul: number
    reserveHereditaire: number
    quotiteDisponible: number
    masseFiscale: number
  }

  devolutionLegale: {
    optionA: OptionDevolution
    optionB: OptionDevolution
    recommandation: 'A' | 'B'
    comparatif: {
      criteres: Array<{
        label: string
        optionA: string
        optionB: string
        avantage: 'A' | 'B' | 'egal'
      }>
    }
  }

  ddv?: {
    clauses: Array<{
      label: string
      description: string
      option: OptionDevolution
    }>
    recommandation: string
    comparatif: {
      criteres: Array<{
        label: string
        values: string[]
        meilleur: number
      }>
    }
  }

  baremeUsufruit: {
    ageUsufruitier: number
    valeurUSF: number
    valeurNP: number
    tableau: Array<{
      trancheAge: string
      valeurUSF: string
      valeurNP: string
    }>
  }

  recommandations: {
    optionLegaleRecommandee: string
    optionDDVRecommandee?: string
    coutFiscalActuel: {
      premierDeces: number
      secondDeces: number
      total: number
      tauxEffectif: number
      transmissionNette: number
    }
    economiePotentielle: number
    strategies: StrategieOptimisation[]
    calendrier?: Array<{
      etape: string
      titre: string
      description: string
      calculs?: string[]
    }>
  }
}

// ============================================================================
// HELPERS
// ============================================================================


// Design tokens spécifiques au diagnostic successoral
const DS = {
  primary: '#2B7A78',
  primaryLight: '#3AAFA9',
  secondary: '#D4A84B',
  danger: '#E07A5F',
  success: '#48BB78',
  text: '#2D3748',
  textSecondary: '#718096',
  textLight: '#A0AEC0',
  bgPage: '#FFFFFF',
  bgSection: '#F7FAFC',
  bgHighlight: '#EDF7F6',
  bgWarning: '#FFF8E7',
  borderLight: '#E2E8F0',
  borderCard: '#E8ECEF',
}

// ============================================================================
// CSS additionnel spécifique au diagnostic successoral
// ============================================================================

const diagnosticStyles = `
  /* Design tokens override pour diagnostic successoral */
  :root {
    --ds-primary: ${DS.primary};
    --ds-primary-light: ${DS.primaryLight};
    --ds-secondary: ${DS.secondary};
    --ds-danger: ${DS.danger};
    --ds-success: ${DS.success};
    --ds-text: ${DS.text};
    --ds-text-secondary: ${DS.textSecondary};
    --ds-bg-section: ${DS.bgSection};
    --ds-bg-highlight: ${DS.bgHighlight};
    --ds-bg-warning: ${DS.bgWarning};
    --ds-border: ${DS.borderLight};
  }

  body {
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, system-ui, sans-serif;
    font-size: 10pt;
    color: var(--ds-text);
  }

  /* Section numérotée */
  .ds-section {
    margin-bottom: 32px;
    break-inside: avoid;
  }

  .ds-section-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 20px;
    break-after: avoid;
  }

  .ds-section-numero {
    width: 36px;
    height: 36px;
    background: var(--ds-primary);
    color: white;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 14pt;
    flex-shrink: 0;
  }

  .ds-section-title {
    font-size: 16pt;
    font-weight: 800;
    color: var(--ds-primary);
    letter-spacing: -0.3px;
    margin-bottom: 2px;
  }

  .ds-section-subtitle {
    font-size: 9pt;
    color: var(--ds-text-secondary);
    line-height: 1.4;
  }

  /* Encadré recommandation */
  .ds-encadre {
    background: var(--ds-bg-section);
    border: 1px solid var(--ds-border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    break-inside: avoid;
    position: relative;
  }

  .ds-encadre--highlight {
    background: var(--ds-bg-highlight);
    border-color: var(--ds-primary-light);
  }

  .ds-encadre--warning {
    background: var(--ds-bg-warning);
    border-color: #ECC94B;
  }

  .ds-encadre--recommended {
    border-left: 4px solid var(--ds-primary);
  }

  .ds-badge {
    display: inline-block;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 3px 10px;
    border-radius: 100px;
    margin-bottom: 10px;
  }

  .ds-badge--recommended {
    background: rgba(43,122,120,0.12);
    color: var(--ds-primary);
  }

  .ds-badge--warning {
    background: rgba(224,122,95,0.12);
    color: var(--ds-danger);
  }

  .ds-badge--info {
    background: rgba(212,168,75,0.12);
    color: var(--ds-secondary);
  }

  /* Bloc de résultats chiffrés */
  .ds-resultats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    break-inside: avoid;
    margin-bottom: 16px;
  }

  .ds-resultats-grid--3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .ds-resultat-box {
    background: white;
    border: 1px solid var(--ds-border);
    border-radius: 10px;
    padding: 16px;
    text-align: center;
  }

  .ds-resultat-box--accent {
    background: var(--ds-bg-highlight);
    border-color: var(--ds-primary-light);
  }

  .ds-resultat-box--danger {
    background: rgba(224,122,95,0.06);
    border-color: rgba(224,122,95,0.3);
  }

  .ds-resultat-box--success {
    background: rgba(72,187,120,0.06);
    border-color: rgba(72,187,120,0.3);
  }

  .ds-resultat-label {
    font-size: 7pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--ds-text-secondary);
    margin-bottom: 6px;
  }

  .ds-resultat-montant {
    font-size: 16pt;
    font-weight: 800;
    color: var(--ds-text);
    letter-spacing: -0.5px;
  }

  .ds-resultat-montant--success { color: var(--ds-success); }
  .ds-resultat-montant--danger { color: var(--ds-danger); }
  .ds-resultat-montant--primary { color: var(--ds-primary); }

  /* Tableaux diagnostic */
  .ds-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    break-inside: avoid;
  }

  .ds-table th {
    background: var(--ds-primary);
    color: white;
    padding: 10px 14px;
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: left;
    border: none;
  }

  .ds-table th:last-child,
  .ds-table td:last-child {
    text-align: right;
  }

  .ds-table td {
    padding: 10px 14px;
    font-size: 9pt;
    border-bottom: 1px solid var(--ds-border);
    vertical-align: middle;
  }

  .ds-table tr:last-child td {
    border-bottom: none;
  }

  .ds-table .ds-row-total {
    background: var(--ds-bg-section);
    font-weight: 700;
  }

  .ds-table .ds-row-total td {
    border-top: 2px solid var(--ds-primary);
    border-bottom: none;
  }

  /* Comparatif côte à côte */
  .ds-comparatif {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
    break-inside: avoid;
  }

  .ds-comparatif-col {
    background: white;
    border: 1px solid var(--ds-border);
    border-radius: 12px;
    padding: 20px;
  }

  .ds-comparatif-col--recommended {
    border: 2px solid var(--ds-primary);
    position: relative;
  }

  .ds-comparatif-col--recommended::after {
    content: '★ RECOMMANDÉE';
    position: absolute;
    top: -10px;
    left: 16px;
    background: var(--ds-primary);
    color: white;
    font-size: 7pt;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 100px;
    letter-spacing: 0.5px;
  }

  .ds-comparatif-title {
    font-size: 11pt;
    font-weight: 700;
    color: var(--ds-primary);
    margin-bottom: 12px;
  }

  /* Info ligne */
  .ds-info-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 6px 0;
    border-bottom: 1px solid var(--ds-border);
  }

  .ds-info-row:last-child {
    border-bottom: none;
  }

  .ds-info-label {
    font-size: 9pt;
    color: var(--ds-text-secondary);
  }

  .ds-info-value {
    font-size: 9pt;
    font-weight: 600;
    color: var(--ds-text);
  }

  /* Stratégies */
  .ds-strategie {
    background: white;
    border: 1px solid var(--ds-border);
    border-radius: 12px;
    padding: 18px;
    margin-bottom: 12px;
    break-inside: avoid;
  }

  .ds-strategie-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .ds-strategie-title {
    font-size: 11pt;
    font-weight: 700;
    color: var(--ds-text);
  }

  .ds-strategie-desc {
    font-size: 9pt;
    color: var(--ds-text-secondary);
    line-height: 1.5;
    margin-bottom: 10px;
  }

  .ds-strategie-details {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--ds-border);
  }

  .ds-strategie-detail-label {
    font-size: 7pt;
    color: var(--ds-text-light);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .ds-strategie-detail-value {
    font-size: 9pt;
    font-weight: 600;
    color: var(--ds-text);
  }

  /* Calendrier */
  .ds-timeline {
    position: relative;
    padding-left: 28px;
  }

  .ds-timeline::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--ds-border);
  }

  .ds-timeline-item {
    position: relative;
    margin-bottom: 16px;
    break-inside: avoid;
  }

  .ds-timeline-dot {
    position: absolute;
    left: -22px;
    top: 4px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--ds-primary);
    border: 2px solid white;
    box-shadow: 0 0 0 2px var(--ds-primary);
  }

  .ds-timeline-title {
    font-size: 10pt;
    font-weight: 700;
    color: var(--ds-text);
    margin-bottom: 4px;
  }

  .ds-timeline-desc {
    font-size: 9pt;
    color: var(--ds-text-secondary);
    line-height: 1.5;
  }

  .ds-timeline-etape {
    font-size: 7pt;
    font-weight: 700;
    color: var(--ds-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  /* Disclaimer */
  .ds-disclaimer {
    margin-top: 40px;
    padding: 16px;
    background: var(--ds-bg-section);
    border-radius: 8px;
    font-size: 7pt;
    color: var(--ds-text-secondary);
    line-height: 1.5;
  }

  /* Cover override pour diagnostic */
  .ds-cover {
    background: linear-gradient(135deg, ${DS.primary} 0%, #1a5c5a 60%, #133e3d 100%);
  }

  .ds-cover .cover-badge {
    background: rgba(58,175,169,0.2);
    border-color: rgba(58,175,169,0.4);
    color: ${DS.primaryLight};
  }

  .ds-cover .cover-logo-icon {
    background: linear-gradient(135deg, ${DS.primaryLight} 0%, ${DS.primary} 100%);
  }
`

// ============================================================================
// SECTION BUILDERS — Chaque section du diagnostic
// ============================================================================

function buildCoverPage(data: DiagnosticSuccessoralData): string {
  const client = data.situation.client
  const conjoint = data.situation.conjoint
  const meta = data.metadata

  return `
  <div class="page cover ds-cover">
    <div class="cover-header">
      <div class="cover-logo">
        <div class="cover-logo-icon">${meta.cabinetConseiller?.charAt(0) || 'A'}</div>
        <span class="cover-logo-text">${meta.cabinetConseiller || 'Cabinet Conseil'}</span>
      </div>
      <div class="cover-date">${fmtDateLongue(meta.dateEtude)}</div>
    </div>

    <div class="cover-main">
      <div class="cover-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        DIAGNOSTIC SUCCESSORAL
      </div>
      <div class="cover-title" style="font-size:36pt;">Diagnostic<br/>Successoral</div>
      <div class="cover-subtitle">Analyse complète de votre situation successorale, droits de succession estimés et stratégies d'optimisation</div>

      <div class="cover-client-card">
        <div class="cover-client-label">ÉTABLI POUR</div>
        <div class="cover-client-name">${client.prenom} ${client.nom}${conjoint ? ` & ${conjoint.prenom} ${conjoint.nom}` : ''}</div>
        <div class="cover-client-info">
          ${data.situation.regimeMatrimonial ? `${data.situation.regimeMatrimonial}` : ''}
          ${data.situation.enfants.length > 0 ? ` — ${data.situation.enfants.length} enfant${data.situation.enfants.length > 1 ? 's' : ''}` : ''}
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div class="cover-footer-item">
        <span>Patrimoine net</span><br/>
        <span class="cover-footer-value">${fmtEur(data.patrimoine.net)}</span>
      </div>
      <div class="cover-footer-item">
        <span>Droits estimés</span><br/>
        <span class="cover-footer-value">${fmtEur(data.recommandations.coutFiscalActuel.total)}</span>
      </div>
      <div class="cover-footer-item">
        <span>Économie possible</span><br/>
        <span class="cover-footer-value">${fmtEur(data.recommandations.economiePotentielle)}</span>
      </div>
      ${meta.nomConseiller ? `<div class="cover-footer-item"><span>Conseiller</span><br/><span class="cover-footer-value">${meta.nomConseiller}</span></div>` : ''}
    </div>
  </div>`
}

function buildSectionSituation(data: DiagnosticSuccessoralData): string {
  const { client, conjoint, enfants, regimeMatrimonial, hasDDV } = data.situation

  return `
  <div class="page content-page" style="padding:50px;">
    <div class="page-header">
      <div class="page-title">Votre situation</div>
      <div class="page-number">1</div>
    </div>

    <div class="ds-section">
      <div class="ds-section-header">
        <div class="ds-section-numero">1</div>
        <div>
          <div class="ds-section-title">Situation familiale</div>
          <div class="ds-section-subtitle">Les informations qui déterminent le cadre juridique et fiscal de votre succession</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:20px;">
        <div class="ds-encadre">
          <div style="font-size:8pt;font-weight:600;color:${DS.textSecondary};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">DÉFUNT PRÉSUMÉ</div>
          <div class="ds-info-row"><span class="ds-info-label">Nom</span><span class="ds-info-value">${client.prenom} ${client.nom}</span></div>
          <div class="ds-info-row"><span class="ds-info-label">Âge</span><span class="ds-info-value">${client.age} ans</span></div>
          ${client.dateNaissance ? `<div class="ds-info-row"><span class="ds-info-label">Date de naissance</span><span class="ds-info-value">${client.dateNaissance}</span></div>` : ''}
          <div class="ds-info-row"><span class="ds-info-label">Sexe</span><span class="ds-info-value">${client.sexe === 'M' ? 'Masculin' : 'Féminin'}</span></div>
        </div>

        ${conjoint ? `
        <div class="ds-encadre">
          <div style="font-size:8pt;font-weight:600;color:${DS.textSecondary};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">CONJOINT SURVIVANT</div>
          <div class="ds-info-row"><span class="ds-info-label">Nom</span><span class="ds-info-value">${conjoint.prenom} ${conjoint.nom}</span></div>
          <div class="ds-info-row"><span class="ds-info-label">Âge</span><span class="ds-info-value">${conjoint.age} ans</span></div>
          ${conjoint.dateNaissance ? `<div class="ds-info-row"><span class="ds-info-label">Date de naissance</span><span class="ds-info-value">${conjoint.dateNaissance}</span></div>` : ''}
        </div>` : '<div></div>'}
      </div>

      ${regimeMatrimonial ? `
      <div class="ds-encadre ds-encadre--highlight">
        <div class="ds-info-row"><span class="ds-info-label">Régime matrimonial</span><span class="ds-info-value">${regimeMatrimonial}</span></div>
        <div class="ds-info-row"><span class="ds-info-label">Donation entre époux (DDV)</span><span class="ds-info-value">${hasDDV ? '✅ Oui' : '❌ Non'}</span></div>
      </div>` : ''}

      ${enfants.length > 0 ? `
      <div style="margin-top:16px;">
        <div style="font-size:10pt;font-weight:700;color:${DS.primary};margin-bottom:10px;">Enfants (${enfants.length})</div>
        <table class="ds-table">
          <thead><tr><th>Prénom</th><th>Âge</th><th>Lien</th></tr></thead>
          <tbody>
            ${enfants.map(e => `<tr>
              <td style="font-weight:600;">${e.prenom}</td>
              <td>${e.age ? `${e.age} ans` : '-'}</td>
              <td>${e.commun ? 'Enfant commun' : 'Enfant non commun'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''}
    </div>
  </div>`
}

function buildSectionPatrimoine(data: DiagnosticSuccessoralData): string {
  const { patrimoine } = data
  const defaultColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#94a3b8']

  const chartData = patrimoine.repartition.map((r, i) => ({
    label: r.categorie,
    value: r.montant,
    color: r.color || defaultColors[i % defaultColors.length],
  }))

  return `
  <div class="page content-page" style="padding:50px;">
    <div class="page-header">
      <div class="page-title">Patrimoine</div>
      <div class="page-number">2</div>
    </div>

    <div class="ds-section">
      <div class="ds-section-header">
        <div class="ds-section-numero">2</div>
        <div>
          <div class="ds-section-title">Composition du patrimoine</div>
          <div class="ds-section-subtitle">Inventaire détaillé des actifs et passifs du couple</div>
        </div>
      </div>

      <div class="ds-resultats-grid ds-resultats-grid--3">
        ${generateKpiCard('Patrimoine brut', fmtEur(patrimoine.brut), { color: DS.primary, bgColor: DS.bgHighlight })}
        ${generateKpiCard('Dettes', fmtEur(patrimoine.dettes), { color: DS.danger, bgColor: 'rgba(224,122,95,0.06)' })}
        ${generateKpiCard('Patrimoine net', fmtEur(patrimoine.net), { color: patrimoine.net >= 0 ? DS.success : DS.danger, bgColor: patrimoine.net >= 0 ? 'rgba(72,187,120,0.06)' : 'rgba(224,122,95,0.06)' })}
      </div>

      ${chartData.length > 0 ? `
      <div class="card" style="margin-top:16px;">
        <div class="card-header">
          <span class="card-title">Répartition du patrimoine</span>
        </div>
        <div class="chart-container" style="padding:16px;">
          ${generateDonutChart(chartData, 160, 22, { centerLabel: 'Net', centerValue: fmtEur(patrimoine.net) })}
        </div>
      </div>` : ''}

      ${patrimoine.actifs.length > 0 ? `
      <div style="margin-top:16px;">
        <table class="ds-table allow-break">
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Type</th>
              <th>Détenteur</th>
              <th>Valeur brute</th>
              <th>Dettes</th>
              <th>Valeur nette</th>
            </tr>
          </thead>
          <tbody>
            ${patrimoine.actifs.map(a => `<tr>
              <td style="font-weight:600;">${a.designation}</td>
              <td>${a.type}</td>
              <td>${a.detenteur === 'commun' ? 'Commun' : a.detenteur === 'propre_client' ? 'Propre client' : 'Propre conjoint'}</td>
              <td style="text-align:right;">${fmtEur(a.valeur)}</td>
              <td style="text-align:right;color:${DS.danger};">${a.dette > 0 ? fmtEur(a.dette) : '-'}</td>
              <td style="text-align:right;font-weight:600;">${fmtEur(a.net)}</td>
            </tr>`).join('')}
            <tr class="ds-row-total">
              <td colspan="3"><strong>TOTAL</strong></td>
              <td style="text-align:right;font-weight:700;">${fmtEur(patrimoine.brut)}</td>
              <td style="text-align:right;font-weight:700;color:${DS.danger};">${fmtEur(patrimoine.dettes)}</td>
              <td style="text-align:right;font-weight:700;">${fmtEur(patrimoine.net)}</td>
            </tr>
          </tbody>
        </table>
      </div>` : ''}
    </div>
  </div>`
}

function buildSectionLiquidation(data: DiagnosticSuccessoralData): string {
  const { liquidation } = data

  return `
  <div class="page content-page" style="padding:50px;">
    <div class="page-header">
      <div class="page-title">Liquidation</div>
      <div class="page-number">3</div>
    </div>

    <div class="ds-section">
      <div class="ds-section-header">
        <div class="ds-section-numero">3</div>
        <div>
          <div class="ds-section-title">Liquidation du régime matrimonial</div>
          <div class="ds-section-subtitle">Détermination de la masse successorale après liquidation des intérêts patrimoniaux du couple</div>
        </div>
      </div>

      <div class="ds-encadre ds-encadre--highlight" style="margin-bottom:20px;">
        <div style="font-size:9pt;color:${DS.textSecondary};line-height:1.6;">
          Avant de déterminer les droits de chaque héritier, il convient de liquider le régime matrimonial pour séparer les biens propres du défunt des biens communs. Le conjoint survivant récupère sa part de communauté <em>hors succession</em>.
        </div>
      </div>

      <table class="ds-table">
        <thead><tr><th>Poste</th><th>Montant</th></tr></thead>
        <tbody>
          ${liquidation.lignes.map(l => `<tr>
            <td>
              <div style="font-weight:600;">${l.poste}</div>
              ${l.explication ? `<div style="font-size:8pt;color:${DS.textSecondary};margin-top:2px;">${l.explication}</div>` : ''}
            </td>
            <td style="text-align:right;font-weight:600;">${fmtEur(l.montant)}</td>
          </tr>`).join('')}
          <tr class="ds-row-total">
            <td><strong>ACTIF NET SUCCESSORAL</strong></td>
            <td style="text-align:right;font-weight:800;font-size:12pt;color:${DS.primary};">${fmtEur(liquidation.actifNetSuccessoral)}</td>
          </tr>
        </tbody>
      </table>

      <div class="ds-resultats-grid" style="margin-top:16px;">
        <div class="ds-resultat-box">
          <div class="ds-resultat-label">BIENS PROPRES DÉFUNT</div>
          <div class="ds-resultat-montant">${fmtEur(liquidation.biensPropresDéfunt)}</div>
        </div>
        <div class="ds-resultat-box">
          <div class="ds-resultat-label">BIENS COMMUNS DU COUPLE</div>
          <div class="ds-resultat-montant">${fmtEur(liquidation.biensCommunsCouple)}</div>
        </div>
        <div class="ds-resultat-box ds-resultat-box--accent">
          <div class="ds-resultat-label">PART CONJOINT (HORS SUCCESSION)</div>
          <div class="ds-resultat-montant ds-resultat-montant--primary">${fmtEur(liquidation.partConjointHorsSuccession)}</div>
        </div>
        <div class="ds-resultat-box ds-resultat-box--accent">
          <div class="ds-resultat-label">MASSE SUCCESSORALE</div>
          <div class="ds-resultat-montant ds-resultat-montant--primary">${fmtEur(liquidation.partDefunt)}</div>
        </div>
      </div>
    </div>
  </div>`
}

function buildSectionMasseSuccessorale(data: DiagnosticSuccessoralData): string {
  const { masseSuccessorale } = data

  return `
  <div class="ds-section section-principale" style="padding:0 50px 50px;">
    <div class="ds-section-header">
      <div class="ds-section-numero">4</div>
      <div>
        <div class="ds-section-title">Masse successorale et réserve</div>
        <div class="ds-section-subtitle">Répartition entre réserve héréditaire et quotité disponible</div>
      </div>
    </div>

    <div class="ds-resultats-grid">
      ${generateKpiCard('Masse de calcul', fmtEur(masseSuccessorale.masseDeCalcul), { color: DS.primary, bgColor: DS.bgHighlight, icon: '📊' })}
      ${generateKpiCard('Réserve héréditaire', fmtEur(masseSuccessorale.reserveHereditaire), { color: '#6366f1', bgColor: 'rgba(99,102,241,0.06)', icon: '🔒' })}
      ${generateKpiCard('Quotité disponible', fmtEur(masseSuccessorale.quotiteDisponible), { color: DS.secondary, bgColor: 'rgba(212,168,75,0.06)', icon: '📋' })}
      ${generateKpiCard('Masse fiscale', fmtEur(masseSuccessorale.masseFiscale), { color: DS.danger, bgColor: 'rgba(224,122,95,0.06)', icon: '💰' })}
    </div>

    <div class="ds-encadre" style="margin-top:16px;">
      <div style="font-size:9pt;color:${DS.textSecondary};line-height:1.6;">
        <strong style="color:${DS.text};">Rappel juridique :</strong> La réserve héréditaire est la part du patrimoine qui revient obligatoirement aux héritiers réservataires (enfants). La quotité disponible est la part dont le défunt peut librement disposer par testament ou donation au dernier vivant.
      </div>
    </div>

    ${data.situation.enfants.length > 0 ? `
    <div style="margin-top:12px;">
      ${generateHorizontalBarChart([
        { label: 'Réserve', value: masseSuccessorale.reserveHereditaire, color: '#6366f1' },
        { label: 'Q. disponible', value: masseSuccessorale.quotiteDisponible, color: DS.secondary },
      ], 480, 24, 20, { showValues: true, formatAsCurrency: true, maxValue: masseSuccessorale.masseDeCalcul })}
    </div>` : ''}
  </div>`
}

function buildSectionDevolution(data: DiagnosticSuccessoralData): string {
  const { devolutionLegale } = data
  const optA = devolutionLegale.optionA
  const optB = devolutionLegale.optionB
  const recommandee = devolutionLegale.recommandation

  function renderHeritierTable(heritiers: HeritierDroits[]): string {
    return `
    <table class="ds-table" style="font-size:8pt;">
      <thead><tr><th>Héritier</th><th>Droit reçu</th><th>Valeur</th><th>Abattement</th><th>Base taxable</th><th>Droits</th></tr></thead>
      <tbody>
        ${heritiers.map(h => `<tr>
          <td style="font-weight:600;">${h.nom}</td>
          <td>${h.droitRecu}</td>
          <td style="text-align:right;">${fmtEur(h.valeurPart)}</td>
          <td style="text-align:right;">${fmtEur(h.abattement)}</td>
          <td style="text-align:right;">${fmtEur(h.baseTaxable)}</td>
          <td style="text-align:right;font-weight:600;color:${h.exonere ? DS.success : DS.danger};">${h.exonere ? 'Exonéré' : fmtEur(h.droits)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`
  }

  function renderOptionCard(opt: OptionDevolution, letter: string, isRecommended: boolean): string {
    return `
    <div class="ds-comparatif-col${isRecommended ? ' ds-comparatif-col--recommended' : ''}">
      <div class="ds-comparatif-title">${opt.label}</div>

      <div style="margin-bottom:12px;">
        <div style="font-size:8pt;font-weight:600;color:${DS.textSecondary};text-transform:uppercase;margin-bottom:6px;">1er décès</div>
        ${renderHeritierTable(opt.premierDeces.heritiers)}
        <div class="ds-resultats-grid" style="margin-top:8px;">
          <div class="ds-resultat-box"><div class="ds-resultat-label">DROITS</div><div class="ds-resultat-montant" style="font-size:12pt;color:${opt.premierDeces.droitsSuccession === 0 ? DS.success : DS.danger};">${opt.premierDeces.droitsSuccession === 0 ? '0 €' : fmtEur(opt.premierDeces.droitsSuccession)}</div></div>
          <div class="ds-resultat-box"><div class="ds-resultat-label">TRANSMISSION NETTE</div><div class="ds-resultat-montant" style="font-size:12pt;">${fmtEur(opt.premierDeces.transmissionNette)}</div></div>
        </div>
      </div>

      <div style="margin-bottom:12px;">
        <div style="font-size:8pt;font-weight:600;color:${DS.textSecondary};text-transform:uppercase;margin-bottom:6px;">2nd décès</div>
        ${renderHeritierTable(opt.secondDeces.heritiers)}
        <div class="ds-resultats-grid" style="margin-top:8px;">
          <div class="ds-resultat-box"><div class="ds-resultat-label">DROITS</div><div class="ds-resultat-montant" style="font-size:12pt;color:${opt.secondDeces.droitsSuccession === 0 ? DS.success : DS.danger};">${fmtEur(opt.secondDeces.droitsSuccession)}</div></div>
          <div class="ds-resultat-box"><div class="ds-resultat-label">TRANSMISSION NETTE</div><div class="ds-resultat-montant" style="font-size:12pt;">${fmtEur(opt.secondDeces.transmissionNette)}</div></div>
        </div>
      </div>

      <div class="ds-resultat-box ds-resultat-box--accent" style="margin-top:12px;">
        <div class="ds-resultat-label">COÛT FISCAL TOTAL (2 DÉCÈS)</div>
        <div class="ds-resultat-montant ds-resultat-montant--danger" style="font-size:14pt;">${fmtEur(opt.coutFiscalTotal)}</div>
      </div>
    </div>`
  }

  return `
  <div class="page content-page section-principale" style="padding:50px;">
    <div class="page-header">
      <div class="page-title">Dévolution légale</div>
      <div class="page-number">5</div>
    </div>

    <div class="ds-section">
      <div class="ds-section-header">
        <div class="ds-section-numero">5</div>
        <div>
          <div class="ds-section-title">Options de dévolution légale</div>
          <div class="ds-section-subtitle">Comparaison des deux options offertes au conjoint survivant (art. 757 du Code civil)</div>
        </div>
      </div>

      <div class="ds-comparatif">
        ${renderOptionCard(optA, 'A', recommandee === 'A')}
        ${renderOptionCard(optB, 'B', recommandee === 'B')}
      </div>

      ${devolutionLegale.comparatif.criteres.length > 0 ? `
      <div style="margin-top:16px;">
        <div style="font-size:10pt;font-weight:700;color:${DS.primary};margin-bottom:10px;">Synthèse comparative</div>
        <table class="ds-table">
          <thead><tr><th>Critère</th><th>${optA.label}</th><th>${optB.label}</th></tr></thead>
          <tbody>
            ${devolutionLegale.comparatif.criteres.map(c => `<tr>
              <td style="font-weight:600;">${c.label}</td>
              <td style="${c.avantage === 'A' ? `font-weight:700;color:${DS.success};` : ''}">${c.optionA}</td>
              <td style="${c.avantage === 'B' ? `font-weight:700;color:${DS.success};` : ''}">${c.optionB}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''}
    </div>
  </div>`
}

function buildSectionDDV(data: DiagnosticSuccessoralData): string {
  if (!data.ddv || data.ddv.clauses.length === 0) return ''

  const { ddv } = data

  return `
  <div class="page content-page section-principale" style="padding:50px;">
    <div class="page-header">
      <div class="page-title">Donation au dernier vivant</div>
      <div class="page-number">6</div>
    </div>

    <div class="ds-section">
      <div class="ds-section-header">
        <div class="ds-section-numero">6</div>
        <div>
          <div class="ds-section-title">Options de la DDV</div>
          <div class="ds-section-subtitle">Analyse des clauses de la donation entre époux et leur impact fiscal</div>
        </div>
      </div>

      ${ddv.clauses.map((clause, i) => `
      <div class="ds-encadre${ddv.recommandation === clause.label ? ' ds-encadre--recommended' : ''}" style="margin-bottom:16px;">
        ${ddv.recommandation === clause.label ? '<div class="ds-badge ds-badge--recommended">RECOMMANDÉE</div>' : ''}
        <div style="font-size:11pt;font-weight:700;color:${DS.primary};margin-bottom:6px;">${clause.label}</div>
        <div style="font-size:9pt;color:${DS.textSecondary};margin-bottom:12px;line-height:1.5;">${clause.description}</div>

        <div class="ds-resultats-grid ds-resultats-grid--3">
          <div class="ds-resultat-box">
            <div class="ds-resultat-label">DROITS 1ER DÉCÈS</div>
            <div class="ds-resultat-montant" style="font-size:12pt;color:${clause.option.premierDeces.droitsSuccession === 0 ? DS.success : DS.danger};">${fmtEur(clause.option.premierDeces.droitsSuccession)}</div>
          </div>
          <div class="ds-resultat-box">
            <div class="ds-resultat-label">DROITS 2ND DÉCÈS</div>
            <div class="ds-resultat-montant" style="font-size:12pt;color:${DS.danger};">${fmtEur(clause.option.secondDeces.droitsSuccession)}</div>
          </div>
          <div class="ds-resultat-box ds-resultat-box--accent">
            <div class="ds-resultat-label">COÛT FISCAL TOTAL</div>
            <div class="ds-resultat-montant ds-resultat-montant--danger" style="font-size:12pt;">${fmtEur(clause.option.coutFiscalTotal)}</div>
          </div>
        </div>
      </div>`).join('')}

      ${ddv.comparatif.criteres.length > 0 ? `
      <table class="ds-table" style="margin-top:16px;">
        <thead>
          <tr>
            <th>Critère</th>
            ${ddv.clauses.map(c => `<th>${c.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${ddv.comparatif.criteres.map(c => `<tr>
            <td style="font-weight:600;">${c.label}</td>
            ${c.values.map((v, i) => `<td style="${i === c.meilleur ? `font-weight:700;color:${DS.success};` : ''}">${v}</td>`).join('')}
          </tr>`).join('')}
        </tbody>
      </table>` : ''}
    </div>
  </div>`
}

function buildSectionBaremeUsufruit(data: DiagnosticSuccessoralData): string {
  const { baremeUsufruit } = data

  return `
  <div class="ds-section" style="padding:0 50px 50px;">
    <div class="ds-section-header">
      <div class="ds-section-numero">7</div>
      <div>
        <div class="ds-section-title">Barème fiscal de l'usufruit</div>
        <div class="ds-section-subtitle">Article 669 du Code Général des Impôts — valeur fiscale de l'usufruit et de la nue-propriété</div>
      </div>
    </div>

    <div class="ds-resultats-grid ds-resultats-grid--3" style="margin-bottom:16px;">
      ${generateKpiCard('Âge de l\'usufruitier', `${baremeUsufruit.ageUsufruitier} ans`, { color: DS.primary, bgColor: DS.bgHighlight })}
      ${generateKpiCard('Valeur usufruit', fmtPct(baremeUsufruit.valeurUSF, 0), { color: DS.secondary, bgColor: 'rgba(212,168,75,0.06)' })}
      ${generateKpiCard('Valeur nue-propriété', fmtPct(baremeUsufruit.valeurNP, 0), { color: '#6366f1', bgColor: 'rgba(99,102,241,0.06)' })}
    </div>

    <table class="ds-table">
      <thead><tr><th>Tranche d'âge</th><th>Usufruit</th><th>Nue-propriété</th></tr></thead>
      <tbody>
        ${baremeUsufruit.tableau.map(r => {
          const isCurrentAge = baremeUsufruit.ageUsufruitier >= parseInt(r.trancheAge)
          return `<tr style="${isCurrentAge ? `background:${DS.bgHighlight};` : ''}">
            <td style="font-weight:${isCurrentAge ? '700' : '400'};">${r.trancheAge}</td>
            <td style="text-align:right;font-weight:${isCurrentAge ? '700' : '400'};">${r.valeurUSF}</td>
            <td style="text-align:right;font-weight:${isCurrentAge ? '700' : '400'};">${r.valeurNP}</td>
          </tr>`
        }).join('')}
      </tbody>
    </table>
  </div>`
}

function buildSectionRecommandations(data: DiagnosticSuccessoralData): string {
  const { recommandations } = data

  const prioriteLabels: Record<string, { label: string; cssClass: string }> = {
    immediate: { label: 'IMMÉDIATE', cssClass: 'ds-badge--warning' },
    recommandee: { label: 'RECOMMANDÉE', cssClass: 'ds-badge--recommended' },
    optionnelle: { label: 'OPTIONNELLE', cssClass: 'ds-badge--info' },
  }

  return `
  <div class="page content-page section-principale" style="padding:50px;">
    <div class="page-header">
      <div class="page-title">Recommandations</div>
      <div class="page-number">8</div>
    </div>

    <div class="ds-section">
      <div class="ds-section-header">
        <div class="ds-section-numero">8</div>
        <div>
          <div class="ds-section-title">Bilan fiscal et recommandations</div>
          <div class="ds-section-subtitle">Synthèse des droits estimés et stratégies d'optimisation identifiées</div>
        </div>
      </div>

      <!-- Bilan fiscal actuel -->
      <div class="ds-encadre ds-encadre--highlight" style="margin-bottom:20px;">
        <div style="font-size:10pt;font-weight:700;color:${DS.primary};margin-bottom:12px;">Coût fiscal actuel estimé</div>
        <div class="ds-resultats-grid ds-resultats-grid--3">
          <div class="ds-resultat-box">
            <div class="ds-resultat-label">1ER DÉCÈS</div>
            <div class="ds-resultat-montant ds-resultat-montant--danger">${fmtEur(recommandations.coutFiscalActuel.premierDeces)}</div>
          </div>
          <div class="ds-resultat-box">
            <div class="ds-resultat-label">2ND DÉCÈS</div>
            <div class="ds-resultat-montant ds-resultat-montant--danger">${fmtEur(recommandations.coutFiscalActuel.secondDeces)}</div>
          </div>
          <div class="ds-resultat-box ds-resultat-box--danger">
            <div class="ds-resultat-label">TOTAL DROITS</div>
            <div class="ds-resultat-montant ds-resultat-montant--danger">${fmtEur(recommandations.coutFiscalActuel.total)}</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid ${DS.borderLight};">
          <div style="font-size:9pt;color:${DS.textSecondary};">Taux effectif d'imposition</div>
          <div style="font-size:11pt;font-weight:700;color:${DS.danger};">${fmtPct(recommandations.coutFiscalActuel.tauxEffectif)}</div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;">
          <div style="font-size:9pt;color:${DS.textSecondary};">Transmission nette aux héritiers</div>
          <div style="font-size:11pt;font-weight:700;color:${DS.success};">${fmtEur(recommandations.coutFiscalActuel.transmissionNette)}</div>
        </div>
      </div>

      ${recommandations.economiePotentielle > 0 ? `
      <div class="ds-encadre ds-encadre--recommended" style="margin-bottom:20px;">
        <div class="ds-badge ds-badge--recommended">ÉCONOMIE POTENTIELLE</div>
        <div style="font-size:22pt;font-weight:800;color:${DS.success};letter-spacing:-0.5px;">${fmtEur(recommandations.economiePotentielle)}</div>
        <div style="font-size:9pt;color:${DS.textSecondary};margin-top:4px;">d'économie de droits de succession estimée grâce aux stratégies d'optimisation recommandées</div>
      </div>` : ''}

      <!-- Option recommandée -->
      <div style="font-size:9pt;color:${DS.textSecondary};margin-bottom:6px;font-weight:600;">OPTION LÉGALE RECOMMANDÉE</div>
      <div style="font-size:11pt;font-weight:700;color:${DS.primary};margin-bottom:${recommandations.optionDDVRecommandee ? '6' : '20'}px;">${recommandations.optionLegaleRecommandee}</div>
      ${recommandations.optionDDVRecommandee ? `
      <div style="font-size:9pt;color:${DS.textSecondary};margin-bottom:6px;font-weight:600;">CLAUSE DDV RECOMMANDÉE</div>
      <div style="font-size:11pt;font-weight:700;color:${DS.primary};margin-bottom:20px;">${recommandations.optionDDVRecommandee}</div>` : ''}

      <!-- Stratégies -->
      ${recommandations.strategies.length > 0 ? `
      <div style="font-size:10pt;font-weight:700;color:${DS.primary};margin-bottom:12px;">Stratégies d'optimisation</div>
      ${recommandations.strategies.map((s, i) => {
        const p = prioriteLabels[s.priorite] || prioriteLabels.optionnelle
        return `
        <div class="ds-strategie">
          <div class="ds-strategie-header">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:24px;height:24px;background:${DS.primary};color:white;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10pt;flex-shrink:0;">${i + 1}</div>
              <div class="ds-strategie-title">${s.titre}</div>
            </div>
            <div class="ds-badge ${p.cssClass}">${p.label}</div>
          </div>
          <div class="ds-strategie-desc">${s.description}</div>
          ${s.details && s.details.length > 0 ? `<ul style="font-size:8pt;color:${DS.textSecondary};margin:0 0 10px 16px;line-height:1.6;">
            ${s.details.map(d => `<li>${d}</li>`).join('')}
          </ul>` : ''}
          <div class="ds-strategie-details">
            ${s.economieEstimee > 0 ? `<div><div class="ds-strategie-detail-label">Économie estimée</div><div class="ds-strategie-detail-value" style="color:${DS.success};">${fmtEur(s.economieEstimee)}</div></div>` : ''}
            ${s.cout ? `<div><div class="ds-strategie-detail-label">Coût</div><div class="ds-strategie-detail-value">${s.cout}</div></div>` : ''}
            ${s.echeance ? `<div><div class="ds-strategie-detail-label">Échéance</div><div class="ds-strategie-detail-value">${s.echeance}</div></div>` : ''}
          </div>
        </div>`
      }).join('')}` : ''}
    </div>
  </div>`
}

function buildSectionCalendrier(data: DiagnosticSuccessoralData): string {
  if (!data.recommandations.calendrier || data.recommandations.calendrier.length === 0) return ''

  return `
  <div class="ds-section" style="padding:0 50px 50px;">
    <div class="ds-section-header">
      <div class="ds-section-numero">9</div>
      <div>
        <div class="ds-section-title">Plan d'action</div>
        <div class="ds-section-subtitle">Calendrier de mise en œuvre des recommandations</div>
      </div>
    </div>

    <div class="ds-timeline">
      ${data.recommandations.calendrier.map(c => `
      <div class="ds-timeline-item">
        <div class="ds-timeline-dot"></div>
        <div class="ds-timeline-etape">${c.etape}</div>
        <div class="ds-timeline-title">${c.titre}</div>
        <div class="ds-timeline-desc">${c.description}</div>
        ${c.calculs && c.calculs.length > 0 ? `<ul style="font-size:8pt;color:${DS.textSecondary};margin:6px 0 0 16px;line-height:1.5;">
          ${c.calculs.map(calc => `<li>${calc}</li>`).join('')}
        </ul>` : ''}
      </div>`).join('')}
    </div>
  </div>`
}

function buildDisclaimer(data: DiagnosticSuccessoralData): string {
  return `
  <div class="ds-disclaimer">
    <strong>Avertissement :</strong> Ce document est établi à titre informatif sur la base des éléments déclarés par le client et de la législation fiscale en vigueur au ${fmtDateLongue(data.metadata.dateEtude)}. 
    Il ne constitue pas un acte juridique et ne saurait engager la responsabilité du conseiller. Les montants indiqués sont des estimations qui peuvent varier en fonction de l'évolution de la législation, 
    de la valorisation des actifs et de la situation personnelle du client. Il est recommandé de consulter un notaire pour la mise en œuvre des préconisations.
    ${data.metadata.cabinetConseiller ? `<br/><br/>Document établi par <strong>${data.metadata.cabinetConseiller}</strong>${data.metadata.nomConseiller ? ` — ${data.metadata.nomConseiller}` : ''}.` : ''}
  </div>`
}

// ============================================================================
// GÉNÉRATEUR PRINCIPAL
// ============================================================================

export function generateDiagnosticSuccessoralHtml(data: DiagnosticSuccessoralData): string {
  const builder = new PdfDocumentBuilder()
    .setMeta({ titre: `Diagnostic Successoral — ${data.situation.client.prenom} ${data.situation.client.nom}` })
    .addCustomStyles(diagnosticStyles)

  // Couverture personnalisée (le diagnostic a sa propre couverture avec couleurs teal)
  builder.addRawContent(buildCoverPage(data))

  // Chapitres — chaque section builder produit un bloc HTML complet
  builder.addRawContent(buildSectionSituation(data))
  builder.addRawContent(buildSectionPatrimoine(data))
  builder.addRawContent(buildSectionLiquidation(data))
  builder.addRawContent(buildSectionMasseSuccessorale(data))
  builder.addRawContent(buildSectionDevolution(data))

  const ddvHtml = buildSectionDDV(data)
  if (ddvHtml) builder.addRawContent(ddvHtml)

  builder.addRawContent(buildSectionBaremeUsufruit(data))
  builder.addRawContent(buildSectionRecommandations(data))

  const calendrierHtml = buildSectionCalendrier(data)
  if (calendrierHtml) builder.addRawContent(calendrierHtml)

  builder.addRawContent(buildDisclaimer(data))

  return builder.build()
}
