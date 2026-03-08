/* eslint-disable @typescript-eslint/no-explicit-any */
import { PdfDocumentBuilder } from './pdf-document-builder'
import { generateGauge, generateKpiCard, generateRadarChart, generateProjectionChart, generateScoreBadge } from './pdf-styles-premium'
import { fmtEur, fmtPct, fmtDateLongue, escapeHtml } from './pdf-utils'
// pdf-components no longer needed — strategic decision cards are built inline

// ═══════════════════ INTERFACES ═══════════════════

export interface PrevTnsAlerte { type: 'danger' | 'warning' | 'info' | 'success'; titre: string; message: string }

export interface PrevTnsSectionIJ {
  ijJour: number; ijMensuel: number; ijJourPhase2: number; ijMensuelPhase2: number
  regime: string
  phase1: { debut: number; fin: number; source: string; ijJour: number; carence: number }
  phase2: { debut: number; fin: number | null; source: string; ijJour: number } | null
  franchise: number; dureeMax: string; tauxCouverture: number; ecart: number; objectif: number
  alertes: PrevTnsAlerte[]; explication: string; conseils: string[]
  simulation: Array<{ mois: number; joursArret: number; joursTravailles: number; ijTotal: number; revenuTravail: number; totalMois: number; source: string; perte: number; tauxMaintien: number }>
}

export interface PrevTnsSectionInvalidite {
  renteMensuelle: number; renteAnnuelle: number; tauxCouverture: number; ecart: number; objectif: number
  invaliditePartielle: boolean; invaliditeTotale: boolean; conditionsObtention: string
  alertes: PrevTnsAlerte[]; explication: string; conseils: string[]
  details: { categoriesExistantes: Array<{ nom: string; taux: string; montant: number }>; delaiCarence: string; duree: string }
}

export interface PrevTnsSectionDeces {
  capitalBase: number; capitalDoubleAccident: boolean; tauxCouverture: number; ecart: number; objectif: number
  moisDeRevenus: number; beneficiaires: string
  alertes: PrevTnsAlerte[]; explication: string; conseils: string[]
  detailObjectif: { remplacementRevenu: number; liquidationPro: number; educationEnfants: number; conjoint: number; total: number }
}

export interface PrevTnsSynthese {
  scoreGlobal: number; niveau: string; couleur: string; resume: string
  priorites: Array<{ rang: number; domaine: string; urgence: string; action: string; impact: string }>
  perteMaximale: { mensuelle: number; annuelle: number; description: string }
  recommandationPrincipale: string; pointsForts: string[]; pointsFaibles: string[]
}

export interface RapportPrevoyanceTnsData {
  formData: { profession: string; codeCaisse: string; classeValue: string; revenuAn: number; age: number; situation: string; nbEnfants: number; chargePerso: number; chargePro: number }
  sections: { ij: PrevTnsSectionIJ; invalidite: PrevTnsSectionInvalidite; deces: PrevTnsSectionDeces }
  synthese: PrevTnsSynthese
  params2025: { annee: number; pass: number }
  hasCPAM: boolean; isCNBF: boolean
  madelin?: { plafondDeductible: number; revenuBase: number }
  client: { nom: string; prenom: string }
  conseiller?: { nom: string; prenom: string; titre?: string }
  cabinet?: { nom: string; adresse?: string }
  reference?: string; date?: Date
}

// ═══════════════════ HELPERS — HUMANISATION ═══════════════════

function qualTaux(t: number): { label: string; color: string; jugement: string; urgence: string } {
  if (t >= 90) return { label: 'Excellente', color: '#059669', jugement: 'Le niveau de couverture est satisfaisant et ne nécessite pas d\'action correctrice immédiate.', urgence: 'surveillance' }
  if (t >= 70) return { label: 'Satisfaisante', color: '#16a34a', jugement: 'La couverture apparaît globalement acceptable, mais une optimisation reste envisageable.', urgence: 'optimisation' }
  if (t >= 50) return { label: 'Partielle', color: '#ca8a04', jugement: 'La couverture demeure fragile et ne permet pas d\'absorber un sinistre prolongé sans difficulté financière.', urgence: 'à traiter à court terme' }
  if (t >= 25) return { label: 'Insuffisante', color: '#ea580c', jugement: 'Le niveau de protection est nettement insuffisant pour maintenir l\'équilibre financier du foyer en cas de sinistre.', urgence: 'prioritaire' }
  return { label: 'Critique', color: '#dc2626', jugement: 'La situation présente une vulnérabilité forte qui expose le foyer à un risque financier majeur et justifie une action correctrice rapide.', urgence: 'immédiate' }
}

function labelSituation(s: string): string {
  return ({ celibataire: 'Célibataire', couple: 'En couple sans enfant', enfants: 'En couple avec enfants', monoparental: 'Parent célibataire' } as Record<string, string>)[s] || s
}

const CAISSE_FULL: Record<string, string> = {
  'CARMF': 'la Caisse Autonome de Retraite des Médecins de France (CARMF)',
  'CARPIMKO': 'la Caisse Autonome de Retraite et de Prévoyance des Infirmiers, Masseurs-Kinésithérapeutes, Pédicures-Podologues, Orthophonistes et Orthoptistes (CARPIMKO)',
  'CAVEC': 'la Caisse d\'Assurance Vieillesse des Experts-Comptables et Commissaires aux Comptes (CAVEC)',
  'CARCDSF': 'la Caisse Autonome de Retraite des Chirurgiens-Dentistes et des Sages-Femmes (CARCDSF)',
  'CIPAV': 'la Caisse Interprofessionnelle de Prévoyance et d\'Assurance Vieillesse (CIPAV)',
  'CNBF': 'la Caisse Nationale des Barreaux Français (CNBF)',
  'CAVP': 'la Caisse d\'Assurance Vieillesse des Pharmaciens (CAVP)',
  'CARPV': 'la Caisse Autonome de Retraite et de Prévoyance des Vétérinaires (CARPV)',
  'CAVOM': 'la Caisse d\'Assurance Vieillesse des Officiers Ministériels (CAVOM)',
  'CPRN': 'la Caisse de Prévoyance et de Retraite des Notaires (CPRN)',
  'CAVAMAC': 'la Caisse d\'Allocation Vieillesse des Agents Généraux et Mandataires d\'Assurances (CAVAMAC)',
  'SSI': 'le régime de la Sécurité Sociale des Indépendants (SSI)',
  'MSA': 'le régime de la Mutualité Sociale Agricole (MSA)',
  'CPAM': 'la Caisse Primaire d\'Assurance Maladie (CPAM)',
}
const CAISSE_SHORT: Record<string, string> = {
  'CARMF': 'la CARMF', 'CARPIMKO': 'la CARPIMKO', 'CAVEC': 'la CAVEC', 'CARCDSF': 'la CARCDSF',
  'CIPAV': 'la CIPAV', 'CNBF': 'la CNBF', 'CAVP': 'la CAVP', 'CARPV': 'la CARPV',
  'CAVOM': 'la CAVOM', 'CPRN': 'la CPRN', 'CAVAMAC': 'la CAVAMAC',
  'SSI': 'le SSI', 'MSA': 'la MSA', 'CPAM': 'la CPAM',
}

function humanizeCaisse(code: string): string {
  return CAISSE_FULL[code.toUpperCase()] || `votre caisse de retraite (${escapeHtml(code)})`
}
function humanizeCaisseShort(code: string): string {
  return CAISSE_SHORT[code.toUpperCase()] || `votre caisse (${escapeHtml(code)})`
}

function humanizeSource(source: string): string {
  if (!source) return ''
  const s = source.toLowerCase().trim()
  if (s.includes('cpam') || s.includes('assurance maladie')) return 'la Sécurité sociale (CPAM)'
  if (s.includes('ssi') || s.includes('indépendant')) return 'la Sécurité sociale des indépendants (SSI)'
  if (s.includes('msa')) return 'la Mutualité sociale agricole (MSA)'
  for (const [code] of Object.entries(CAISSE_SHORT)) {
    if (s.includes(code.toLowerCase())) return CAISSE_SHORT[code]
  }
  return escapeHtml(source)
}

function humanizeProfession(profession: string): string {
  if (!profession) return 'Professionnel indépendant'
  return profession
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim() || 'Professionnel indépendant'
}

function safeField(val: any, fallback?: string): string {
  if (val === null || val === undefined || val === '' || val === 'null' || val === 'undefined' || val === 'N/A') return fallback || ''
  const s = String(val).trim()
  return s.length > 0 ? s : (fallback || '')
}

function dominantRisque(d: RapportPrevoyanceTnsData): { domaine: string; taux: number; ecart: number; label: string } {
  const risques = [
    { domaine: 'arrêt de travail', taux: d.sections.ij.tauxCouverture, ecart: d.sections.ij.ecart, label: 'les indemnités journalières' },
    { domaine: 'invalidité', taux: d.sections.invalidite.tauxCouverture, ecart: d.sections.invalidite.ecart, label: 'la rente d\'invalidité' },
    { domaine: 'décès', taux: d.sections.deces.tauxCouverture, ecart: d.sections.deces.ecart, label: 'le capital décès' },
  ]
  return risques.reduce((min, r) => r.taux < min.taux ? r : min, risques[0])
}

function renderAvis(texte: string): string {
  return `
    <div class="prev-avis">
      <div class="prev-avis-titre">Avis du conseiller</div>
      <div class="prev-avis-texte">${texte}</div>
    </div>`
}

function renderOrientation(titre: string, action: string, objectif: string, urgence: string): string {
  return `
    <div class="prev-orientation">
      <div class="prev-orientation-titre">${escapeHtml(titre)}</div>
      <div class="prev-orientation-body">
        <div><span class="prev-orientation-label">Action à mener :</span> ${escapeHtml(action)}</div>
        <div><span class="prev-orientation-label">Objectif :</span> ${escapeHtml(objectif)}</div>
        <div><span class="prev-orientation-label">Degré d'urgence :</span> <strong>${escapeHtml(urgence)}</strong></div>
      </div>
    </div>`
}

// ═══════════════════ STYLES ═══════════════════

const prevStyles = `
  .prev-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin: 14px 0; }
  .prev-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 14px 0; }
  .prev-card { background: #f8fafc; border-radius: 10px; padding: 16px; border: 1px solid #e2e8f0; }
  .prev-card-accent { background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%); border: 1.5px solid #c7d2fe; border-radius: 10px; padding: 18px; }
  .prev-card-danger { background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 10px; padding: 18px; }
  .prev-card-warning { background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 10px; padding: 18px; }
  .prev-card-success { background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 10px; padding: 18px; }
  .prev-titre-section { font-size: 11pt; font-weight: 700; color: #1e293b; margin: 0 0 6px 0; }
  .prev-texte { font-size: 9.5pt; color: #334155; line-height: 1.65; }
  .prev-texte-muted { font-size: 8.5pt; color: #64748b; line-height: 1.5; }
  .prev-metric-label { font-size: 7.5pt; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 600; }
  .prev-metric-value { font-size: 16pt; font-weight: 800; line-height: 1.1; }
  .prev-metric-sub { font-size: 8pt; color: #64748b; margin-top: 2px; }
  .prev-qual-badge { display: inline-block; font-size: 8pt; font-weight: 700; padding: 3px 10px; border-radius: 100px; }
  .prev-narratif { font-size: 10pt; color: #1e293b; line-height: 1.75; margin: 12px 0; }
  .prev-narratif strong { color: #0f172a; }
  .prev-callout { border-left: 4px solid; border-radius: 0 8px 8px 0; padding: 14px 16px; margin: 14px 0; }
  .prev-callout-danger { border-color: #ef4444; background: #fef2f2; }
  .prev-callout-warning { border-color: #f59e0b; background: #fffbeb; }
  .prev-callout-info { border-color: #3b82f6; background: #eff6ff; }
  .prev-callout-success { border-color: #10b981; background: #f0fdf4; }
  .prev-prio-badge { display: inline-block; font-size: 7.5pt; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-right: 6px; }
  .prev-prio-critique { background: #fecaca; color: #991b1b; }
  .prev-prio-elevee { background: #fed7aa; color: #9a3412; }
  .prev-prio-intermediaire { background: #fef08a; color: #854d0e; }
  .prev-prio-secondaire { background: #d1fae5; color: #065f46; }
  .prev-separator { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
  .prev-score-container { text-align: center; padding: 10px 0; }
  .prev-projection-bar { height: 8px; border-radius: 4px; display: inline-block; }
  .prev-table-mini { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin: 10px 0; }
  .prev-table-mini th { background: #f1f5f9; padding: 6px 10px; text-align: left; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
  .prev-table-mini td { padding: 5px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  .prev-table-mini tr:last-child td { border-bottom: none; }
  .prev-actions-list { list-style: none; padding: 0; margin: 0; }
  .prev-actions-list li { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 9.5pt; color: #1e293b; display: flex; align-items: flex-start; gap: 8px; }
  .prev-actions-list li:last-child { border-bottom: none; }
  .prev-action-num { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: #6366f1; color: white; font-size: 8pt; font-weight: 700; flex-shrink: 0; }
  .prev-avis { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-left: 4px solid #4338ca; border-radius: 0 10px 10px 0; padding: 16px 18px; margin: 18px 0; page-break-inside: avoid; }
  .prev-avis-titre { font-size: 9pt; font-weight: 700; color: #4338ca; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .prev-avis-texte { font-size: 10pt; color: #1e293b; line-height: 1.7; font-style: italic; }
  .prev-orientation { background: #ffffff; border: 1.5px solid #c7d2fe; border-radius: 10px; padding: 16px 18px; margin: 12px 0; page-break-inside: avoid; }
  .prev-orientation-titre { font-size: 10pt; font-weight: 700; color: #4338ca; margin-bottom: 8px; }
  .prev-orientation-body { font-size: 9pt; color: #334155; line-height: 1.6; }
  .prev-orientation-body div { margin-bottom: 4px; }
  .prev-orientation-label { font-weight: 600; color: #64748b; }
  .prev-fiche-action { background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 14px 0; page-break-inside: avoid; }
  .prev-fiche-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .prev-fiche-num { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: #6366f1; color: white; font-size: 12pt; font-weight: 800; flex-shrink: 0; }
  .prev-fiche-titre { font-size: 11pt; font-weight: 700; color: #1e293b; }
  .prev-fiche-desc { font-size: 9.5pt; color: #334155; line-height: 1.65; margin-bottom: 12px; }
  .prev-fiche-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
  .prev-fiche-meta-item { font-size: 8.5pt; color: #475569; line-height: 1.5; }
  .prev-fiche-meta-label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 7pt; letter-spacing: 0.3px; display: block; margin-bottom: 2px; }
  .prev-transition { font-size: 9.5pt; color: #64748b; line-height: 1.6; margin: 16px 0 6px 0; font-style: italic; border-left: 3px solid #e2e8f0; padding-left: 12px; }
`

// ═══════════════════ SECTION BUILDERS ═══════════════════

function buildSyntheseExecutive(d: RapportPrevoyanceTnsData): string {
  const syn = d.synthese
  const f = d.formData
  const ij = d.sections.ij
  const inv = d.sections.invalidite
  const dec = d.sections.deces
  const revMens = Math.round(f.revenuAn / 12)
  const dom = dominantRisque(d)

  const qIJ = qualTaux(ij.tauxCouverture)
  const qInv = qualTaux(inv.tauxCouverture)
  const qDec = qualTaux(dec.tauxCouverture)

  const radar = generateRadarChart([
    { label: 'Arrêt de travail', score: Math.round(ij.tauxCouverture), maxScore: 100 },
    { label: 'Invalidité', score: Math.round(inv.tauxCouverture), maxScore: 100 },
    { label: 'Décès', score: Math.round(dec.tauxCouverture), maxScore: 100 },
  ], 200)

  const scoreBadge = generateScoreBadge(syn.scoreGlobal, 100, 'lg')
  const gaugeIJ = generateGauge(Math.round(ij.tauxCouverture), 100, 100, qIJ.color, 'Arrêt de travail')
  const gaugeInv = generateGauge(Math.round(inv.tauxCouverture), 100, 100, qInv.color, 'Invalidité')
  const gaugeDec = generateGauge(Math.round(dec.tauxCouverture), 100, 100, qDec.color, 'Décès')

  // Dominant diagnosis — positioned narrative
  const profLabel = humanizeProfession(f.profession)
  const caisseLabel = humanizeCaisseShort(f.codeCaisse)

  let diagnosticNarratif = ''
  if (syn.scoreGlobal < 40) {
    diagnosticNarratif = `L'analyse de la couverture sociale de ${profLabel}, affilié(e) à ${caisseLabel}, met en évidence <strong style="color:#dc2626;">une situation de protection nettement insuffisante</strong>. Le risque principal identifié concerne <strong>${dom.domaine}</strong>, avec un taux de couverture de seulement ${fmtPct(dom.taux)}. Au regard du revenu mensuel de ${fmtEur(revMens)} et des charges déclarées, cette situation expose le foyer à une perte financière significative en cas de sinistre.`
  } else if (syn.scoreGlobal < 70) {
    diagnosticNarratif = `L'analyse de la couverture sociale de ${profLabel}, affilié(e) à ${caisseLabel}, révèle <strong style="color:#ca8a04;">une protection partielle qui mérite d'être renforcée</strong>. Le point de fragilité principal porte sur <strong>${dom.domaine}</strong> (couverture de ${fmtPct(dom.taux)}). Bien que certains postes soient couverts de manière acceptable, des écarts subsistent et nécessitent une attention ciblée.`
  } else {
    diagnosticNarratif = `L'analyse de la couverture sociale de ${profLabel}, affilié(e) à ${caisseLabel}, fait apparaître <strong style="color:#059669;">une protection globalement satisfaisante</strong>. Les trois piliers de couverture sont à un niveau acceptable, même si des marges d'optimisation existent, notamment sur ${dom.domaine} (${fmtPct(dom.taux)}).`
  }

  // Actions clés (top 3) — with positioned urgency
  const topActions = syn.priorites.slice(0, 3)
  const actionsHtml = topActions.map((p, i) => {
    const urgColor = p.urgence.toLowerCase().includes('critique') || p.urgence.toLowerCase().includes('haute') || p.urgence.toLowerCase().includes('elev') ? '#dc2626' : p.urgence.toLowerCase().includes('moyen') || p.urgence.toLowerCase().includes('interm') ? '#ca8a04' : '#059669'
    return `
    <li><span class="prev-action-num">${i + 1}</span>
      <div>
        <strong>${escapeHtml(p.domaine)}</strong> <span class="prev-prio-badge" style="background:${urgColor}15;color:${urgColor};">${escapeHtml(p.urgence)}</span>
        <div class="prev-texte" style="margin-top:3px;">${escapeHtml(p.action)}</div>
        <div class="prev-texte-muted" style="margin-top:2px;">Bénéfice attendu : ${escapeHtml(p.impact)}</div>
      </div>
    </li>`
  }).join('')

  return `
    <div class="prev-grid-2" style="align-items:start;">
      <div>
        <div class="prev-card-accent" style="text-align:center;margin-bottom:14px;">
          <div class="prev-metric-label" style="margin-bottom:8px;">Score de protection global</div>
          ${scoreBadge}
          <div class="prev-texte-muted" style="margin-top:8px;">${escapeHtml(syn.niveau)}</div>
        </div>
        <div class="prev-grid-3" style="margin:0;">
          <div style="text-align:center;">${gaugeIJ}</div>
          <div style="text-align:center;">${gaugeInv}</div>
          <div style="text-align:center;">${gaugeDec}</div>
        </div>
      </div>
      <div style="text-align:center;">
        ${radar}
      </div>
    </div>

    <div class="prev-narratif">
      ${diagnosticNarratif}
    </div>

    ${syn.perteMaximale.mensuelle > 0 ? `
    <div class="prev-callout prev-callout-danger">
      <div class="prev-titre-section" style="color:#991b1b;">Exposition financière maximale</div>
      <div class="prev-texte">
        En cas de sinistre majeur, compte tenu du niveau de charges déclaré et du revenu de ${fmtEur(revMens)}/mois,
        la perte nette de revenu peut atteindre <strong style="color:#dc2626;">${fmtEur(syn.perteMaximale.mensuelle)}/mois</strong>
        soit <strong style="color:#dc2626;">${fmtEur(syn.perteMaximale.annuelle)}/an</strong>.
        Ce montant représente la différence entre le revenu actuel et les prestations versées par le régime obligatoire.
      </div>
    </div>` : ''}

    <div class="prev-card" style="margin-top:14px;">
      <div class="prev-titre-section">Hiérarchie des actions à engager</div>
      <ul class="prev-actions-list">${actionsHtml}</ul>
    </div>

    ${syn.pointsForts.length > 0 || syn.pointsFaibles.length > 0 ? `
    <div class="prev-grid-2" style="margin-top:14px;">
      ${syn.pointsFaibles.length > 0 ? `
      <div class="prev-card-danger">
        <div class="prev-titre-section" style="color:#991b1b;">Points de fragilité identifiés</div>
        <ul style="padding-left:16px;margin:6px 0 0;">
          ${syn.pointsFaibles.map(p => `<li class="prev-texte" style="margin-bottom:4px;">${escapeHtml(p)}</li>`).join('')}
        </ul>
      </div>` : '<div></div>'}
      ${syn.pointsForts.length > 0 ? `
      <div class="prev-card-success">
        <div class="prev-titre-section" style="color:#065f46;">Éléments favorables</div>
        <ul style="padding-left:16px;margin:6px 0 0;">
          ${syn.pointsForts.map(p => `<li class="prev-texte" style="margin-bottom:4px;">${escapeHtml(p)}</li>`).join('')}
        </ul>
      </div>` : '<div></div>'}
    </div>` : ''}

    ${renderAvis(
      syn.scoreGlobal < 40
        ? `Au regard de l'ensemble des éléments analysés, la protection sociale de ce dossier présente des insuffisances marquées qui appellent une intervention structurée. La priorité porte sur ${dom.domaine}, mais l'ensemble des trois piliers nécessite un examen approfondi dans le cadre d'une démarche de mise en conformité avec les besoins réels du foyer.`
        : syn.scoreGlobal < 70
          ? `Ce dossier présente un profil de protection intermédiaire. Certains postes sont couverts de manière acceptable, mais les écarts identifiés — notamment sur ${dom.domaine} — justifient la mise en place d'actions correctives ciblées. L'objectif n'est pas de multiplier les garanties, mais de renforcer précisément les points de vulnérabilité.`
          : `La couverture sociale analysée est globalement satisfaisante. Les ajustements envisageables relèvent davantage de l'optimisation que de l'urgence. Il convient néanmoins de surveiller l'évolution de la situation familiale et professionnelle, qui pourrait modifier les besoins de protection à moyen terme.`
    )}

    <div class="prev-transition">Les pages suivantes détaillent l'analyse de chaque pilier de protection, en commençant par la situation personnelle et professionnelle retenue pour ce bilan.</div>
  `
}
function buildProfil(d: RapportPrevoyanceTnsData): string {
  const f = d.formData
  const revMens = Math.round(f.revenuAn / 12)
  const chargesTot = f.chargePerso + f.chargePro
  const resteVivre = revMens - chargesTot
  const tauxCharges = revMens > 0 ? Math.round(chargesTot / revMens * 100) : 0

  const profLabel = humanizeProfession(f.profession)
  const caisseFullLabel = humanizeCaisse(f.codeCaisse)
  const enfantsText = f.nbEnfants > 0 ? `${f.nbEnfants} enfant${f.nbEnfants > 1 ? 's' : ''} à charge` : 'sans enfant à charge'
  const classeText = safeField(f.classeValue)

  const kpi1 = generateKpiCard('Revenu annuel net', fmtEur(f.revenuAn), { sublabel: `${fmtEur(revMens)}/mois`, color: '#6366f1', bgColor: '#eef2ff' })
  const kpi2 = generateKpiCard('Âge', `${f.age} ans`, { sublabel: labelSituation(f.situation), color: '#0f172a', bgColor: '#f8fafc' })
  const kpi3 = generateKpiCard('Charges mensuelles', fmtEur(chargesTot), { sublabel: `${tauxCharges}% du revenu`, color: chargesTot > revMens * 0.5 ? '#dc2626' : '#ca8a04', bgColor: chargesTot > revMens * 0.5 ? '#fef2f2' : '#fffbeb' })
  const kpi4 = generateKpiCard('Reste à vivre', fmtEur(resteVivre), { sublabel: 'Après charges incompressibles', color: resteVivre > 0 ? '#059669' : '#dc2626', bgColor: resteVivre > 0 ? '#f0fdf4' : '#fef2f2' })

  // Personalized narrative — no raw labels
  let narratif = `Le présent bilan concerne <strong>${profLabel}</strong>, âgé(e) de ${f.age} ans, exerçant en tant que travailleur non salarié et affilié(e) à ${caisseFullLabel}.`
  if (classeText) narratif += ` La cotisation retenue correspond à la classe ${escapeHtml(classeText)}, qui détermine le niveau des prestations obligatoires.`
  narratif += ` La situation familiale déclarée est : <strong>${labelSituation(f.situation).toLowerCase()}</strong>, ${enfantsText}.`
  narratif += `<br/><br/>Le revenu professionnel net retenu pour l'analyse s'élève à <strong>${fmtEur(f.revenuAn)} par an</strong>, soit <strong>${fmtEur(revMens)} par mois</strong>. Ce revenu constitue la base de calcul des prestations du régime obligatoire et sert de référence pour mesurer les écarts de couverture.`

  // Charges table — only if charges > 0
  let chargesHtml = ''
  if (chargesTot > 0) {
    chargesHtml = `
    <table class="prev-table-mini">
      <tr><th colspan="2" style="font-size:9pt;">Structure des charges incompressibles</th></tr>
      ${f.chargePerso > 0 ? `<tr><td>Charges personnelles (loyer, crédits, assurances, alimentation…)</td><td style="text-align:right;font-weight:700;">${fmtEur(f.chargePerso)}/mois</td></tr>` : ''}
      ${f.chargePro > 0 ? `<tr><td>Charges professionnelles (cotisations, local, matériel, assurance RC…)</td><td style="text-align:right;font-weight:700;">${fmtEur(f.chargePro)}/mois</td></tr>` : ''}
      <tr style="background:#f1f5f9;font-weight:700;"><td>Total des charges incompressibles</td><td style="text-align:right;">${fmtEur(chargesTot)}/mois</td></tr>
      <tr><td>Reste à vivre mensuel (revenu net − charges)</td><td style="text-align:right;font-weight:700;color:${resteVivre >= 0 ? '#059669' : '#dc2626'};">${fmtEur(resteVivre)}/mois</td></tr>
    </table>`
  }

  // Judgment on financial vulnerability
  let jugement = ''
  if (tauxCharges >= 70) {
    jugement = `Avec un taux de charges incompressibles de ${tauxCharges}% du revenu, la marge de manœuvre financière est très étroite. En cas de sinistre réduisant le revenu, le risque de déficit est quasi immédiat. Cette structure de charges amplifie considérablement la gravité de toute insuffisance de couverture.`
  } else if (tauxCharges >= 50) {
    jugement = `Les charges incompressibles représentent ${tauxCharges}% du revenu mensuel, ce qui laisse un reste à vivre de ${fmtEur(resteVivre)}/mois. Ce niveau de charges constitue un facteur d'exposition notable : en cas de baisse de revenu liée à un sinistre, l'équilibre du foyer serait rapidement compromis.`
  } else if (tauxCharges >= 30) {
    jugement = `Le rapport charges/revenu (${tauxCharges}%) se situe dans une zone raisonnable, avec un reste à vivre de ${fmtEur(resteVivre)}/mois. Cette marge offre une certaine capacité d'absorption temporaire, sans toutefois dispenser d'une couverture complémentaire adaptée.`
  } else {
    jugement = `Le niveau de charges déclaré est relativement modéré (${tauxCharges}% du revenu), ce qui confère une capacité de résistance financière supérieure à la moyenne. Cette marge ne doit cependant pas masquer l'importance d'une couverture structurée sur le long terme.`
  }

  return `
    <div class="prev-grid-2" style="grid-template-columns:1fr 1fr 1fr 1fr;">
      ${kpi1}${kpi2}${kpi3}${kpi4}
    </div>

    <div class="prev-narratif">${narratif}</div>

    ${chargesHtml}

    ${renderAvis(jugement + ' C\'est ce montant de charges incompressibles — ' + fmtEur(chargesTot) + '/mois — qui constitue le seuil plancher de protection : toute couverture inférieure à ce niveau expose le foyer à un risque de déficit structurel.')}

    <div class="prev-transition">L'analyse qui suit examine successivement les trois piliers de la protection sociale obligatoire — arrêt de travail, invalidité et décès — au regard de cette situation personnelle et professionnelle.</div>
  `
}
function buildAnalyseIJ(d: RapportPrevoyanceTnsData): string {
  const ij = d.sections.ij
  const f = d.formData
  const revMens = Math.round(f.revenuAn / 12)
  const chargesTot = f.chargePerso + f.chargePro
  const q = qualTaux(ij.tauxCouverture)

  const caisseShort = humanizeCaisseShort(f.codeCaisse)

  // Gauge de couverture
  const gauge = generateGauge(Math.round(ij.tauxCouverture), 100, 160, q.color, 'Couverture arrêt de travail')

  // KPIs
  const kpiIJ = generateKpiCard('Indemnité journalière', `${fmtEur(ij.ijJour)}`, { sublabel: `soit ${fmtEur(ij.ijMensuel)}/mois`, color: '#6366f1', bgColor: '#eef2ff' })
  const kpiFranchise = generateKpiCard('Délai de carence', `${ij.franchise} jours`, { sublabel: ij.franchise > 0 ? `Perte sèche estimée : ${fmtEur(Math.round(revMens / 30 * ij.franchise))}` : 'Indemnisation dès le premier jour', color: ij.franchise >= 90 ? '#dc2626' : ij.franchise > 0 ? '#ca8a04' : '#059669', bgColor: ij.franchise >= 90 ? '#fef2f2' : ij.franchise > 0 ? '#fffbeb' : '#f0fdf4' })
  const kpiEcart = generateKpiCard('Déficit mensuel', fmtEur(ij.ecart), { sublabel: ij.ecart > 0 ? 'Manque pour couvrir le revenu' : 'Revenu couvert intégralement', color: ij.ecart > 0 ? '#dc2626' : '#059669', bgColor: ij.ecart > 0 ? '#fef2f2' : '#f0fdf4' })

  // Narrative — franchise
  let narratifFranchise = ''
  if (ij.franchise >= 90) {
    const perteFranchise = Math.round(revMens / 30 * ij.franchise)
    narratifFranchise = `
      <div class="prev-callout prev-callout-danger">
        <div class="prev-titre-section" style="color:#991b1b;">Délai de carence de ${ij.franchise} jours — Vulnérabilité majeure</div>
        <div class="prev-texte">
          Le régime de ${caisseShort} impose un délai de carence de <strong>${ij.franchise} jours</strong>
          pendant lequel aucune indemnité n'est versée. Cette période représente une perte sèche de
          <strong style="color:#dc2626;">${fmtEur(perteFranchise)}</strong>.
          Pendant ces ${Math.round(ij.franchise / 30)} mois sans revenu de remplacement, les charges incompressibles
          de <strong>${fmtEur(chargesTot)}/mois</strong> continuent de courir intégralement.
          Ce délai constitue le point de vulnérabilité le plus immédiat de votre couverture : il est indispensable
          de disposer d'une épargne de précaution d'au minimum <strong>${fmtEur(perteFranchise)}</strong>
          ou de souscrire une prévoyance complémentaire avec un délai de carence réduit (7 à 15 jours).
        </div>
      </div>`
  } else if (ij.franchise > 0 && ij.franchise < 90) {
    narratifFranchise = `
      <div class="prev-callout prev-callout-warning">
        <div class="prev-texte"><strong>Délai de carence de ${ij.franchise} jours :</strong> aucune indemnité n'est versée pendant les ${ij.franchise} premiers jours d'arrêt,
        ce qui représente une perte de ${fmtEur(Math.round(revMens / 30 * ij.franchise))}. Ce délai, bien que modéré, peut être réduit par la souscription d'une prévoyance complémentaire à franchise courte.</div>
      </div>`
  } else {
    narratifFranchise = `
      <div class="prev-callout prev-callout-success">
        <div class="prev-texte"><strong>Indemnisation immédiate :</strong> le régime applicable prévoit une prise en charge dès le premier jour d'arrêt, ce qui constitue un élément favorable de votre couverture.</div>
      </div>`
  }

  // Phase 2 narrative
  let narratifPhase2 = ''
  if (ij.phase2) {
    const diff = ij.phase2.ijJour - ij.phase1.ijJour
    const diffMens = Math.round(Math.abs(diff) * 30)
    narratifPhase2 = `
      <div class="prev-card" style="margin-top:14px;">
        <div class="prev-titre-section">Évolution de l'indemnisation au cours de l'arrêt</div>
        <div class="prev-texte">
          <strong>Première période (du ${ij.phase1.debut}e au ${ij.phase1.fin}e jour) :</strong> l'indemnisation est assurée par ${humanizeSource(ij.phase1.source)} à hauteur de ${fmtEur(ij.phase1.ijJour)}/jour, soit environ ${fmtEur(Math.round(ij.phase1.ijJour * 30))}/mois.<br/>
          <strong>Seconde période (à partir du ${ij.phase2.debut}e jour) :</strong> ${humanizeSource(ij.phase2.source)} prend le relais avec une indemnité de ${fmtEur(ij.phase2.ijJour)}/jour, soit environ ${fmtEur(Math.round(ij.phase2.ijJour * 30))}/mois.
          ${diff < 0 ? `<br/><span style="color:#dc2626;font-weight:600;">Ce changement de régime entraîne une baisse de ${fmtEur(diffMens)}/mois, ce qui aggrave le déficit de couverture à partir de ce seuil.</span>` : ''}
          ${diff > 0 ? `<br/><span style="color:#059669;font-weight:600;">Ce changement de régime entraîne une hausse de ${fmtEur(diffMens)}/mois, améliorant partiellement la couverture sur la durée.</span>` : ''}
        </div>
      </div>`
  }

  // Reste à vivre pendant arrêt
  const resteArret = ij.ijMensuel - chargesTot
  let narratifResteVivre = ''
  if (ij.ecart > 0) {
    narratifResteVivre = `
      <div class="prev-grid-2" style="margin-top:14px;">
        <div class="prev-card-success">
          <div class="prev-titre-section" style="color:#065f46;">Mois normal</div>
          <table class="prev-table-mini">
            <tr><td>Revenus nets</td><td style="text-align:right;font-weight:700;color:#059669;">${fmtEur(revMens)}</td></tr>
            <tr><td>Charges</td><td style="text-align:right;">−${fmtEur(chargesTot)}</td></tr>
            <tr style="font-weight:700;"><td>Reste à vivre</td><td style="text-align:right;color:#059669;">${fmtEur(revMens - chargesTot)}</td></tr>
          </table>
        </div>
        <div class="${resteArret < 0 ? 'prev-card-danger' : 'prev-card-warning'}">
          <div class="prev-titre-section" style="color:${resteArret < 0 ? '#991b1b' : '#92400e'};">Pendant l'arrêt</div>
          <table class="prev-table-mini">
            <tr><td>IJ mensuelles</td><td style="text-align:right;font-weight:700;color:#6366f1;">${fmtEur(ij.ijMensuel)}</td></tr>
            <tr><td>Charges</td><td style="text-align:right;">−${fmtEur(chargesTot)}</td></tr>
            <tr style="font-weight:700;"><td>Reste à vivre</td><td style="text-align:right;color:${resteArret < 0 ? '#dc2626' : '#ca8a04'};">${fmtEur(resteArret)}</td></tr>
          </table>
        </div>
      </div>`
  }

  // Projection chart (3 ans)
  let projectionHtml = ''
  if (ij.simulation && ij.simulation.length > 0) {
    const projData = ij.simulation.map(s => ({ x: s.mois, y: s.tauxMaintien, label: `M${s.mois}` }))
    const annotations: Array<{ x: number; label: string; color: string }> = []
    if (ij.franchise > 0) annotations.push({ x: Math.ceil(ij.franchise / 30), label: 'Fin franchise', color: '#ef4444' })
    if (ij.phase2) annotations.push({ x: Math.ceil(ij.phase2.debut / 30), label: 'Chgt régime', color: '#8b5cf6' })

    const chart = generateProjectionChart(projData, 480, 150, {
      xLabel: 'Mois', yLabel: '% maintien',
      fillColor: 'rgba(99,102,241,0.08)', strokeColor: '#6366f1',
      annotations,
    })

    // Cumuls par année
    const sim = ij.simulation
    const a1 = sim.filter(s => s.mois <= 12)
    const a2 = sim.filter(s => s.mois > 12 && s.mois <= 24)
    const a3 = sim.filter(s => s.mois > 24)
    const cumul = (arr: typeof sim) => ({ ij: arr.reduce((s, m) => s + m.ijTotal, 0), perte: arr.reduce((s, m) => s + m.perte, 0) })
    const c1 = cumul(a1), c2 = cumul(a2), c3 = cumul(a3)
    const totalPerte = c1.perte + c2.perte + c3.perte

    projectionHtml = `
      <hr class="prev-separator"/>
      <div class="prev-titre-section">Projection sur 3 ans d'arrêt complet</div>
      <div style="text-align:center;margin:10px 0;">${chart}</div>
      <div class="prev-grid-3">
        <div class="prev-card" style="text-align:center;">
          <div class="prev-metric-label">Année 1</div>
          <div class="prev-metric-value" style="color:#6366f1;font-size:13pt;">${fmtEur(c1.ij)}</div>
          <div class="prev-metric-sub">IJ perçues</div>
          <div style="color:#dc2626;font-size:9pt;font-weight:700;margin-top:4px;">−${fmtEur(c1.perte)} de perte</div>
        </div>
        <div class="prev-card" style="text-align:center;">
          <div class="prev-metric-label">Année 2</div>
          <div class="prev-metric-value" style="color:#6366f1;font-size:13pt;">${fmtEur(c2.ij)}</div>
          <div class="prev-metric-sub">IJ perçues</div>
          <div style="color:#dc2626;font-size:9pt;font-weight:700;margin-top:4px;">−${fmtEur(c2.perte)} de perte</div>
        </div>
        <div class="prev-card" style="text-align:center;">
          <div class="prev-metric-label">Année 3</div>
          <div class="prev-metric-value" style="color:#6366f1;font-size:13pt;">${fmtEur(c3.ij)}</div>
          <div class="prev-metric-sub">IJ perçues</div>
          <div style="color:#dc2626;font-size:9pt;font-weight:700;margin-top:4px;">−${fmtEur(c3.perte)} de perte</div>
        </div>
      </div>
      <div class="prev-callout prev-callout-danger" style="margin-top:10px;">
        <div class="prev-texte">
          <strong>Impact cumulé sur 3 ans :</strong> perte totale de <strong style="color:#dc2626;">${fmtEur(totalPerte)}</strong>
          pour ${fmtEur(c1.ij + c2.ij + c3.ij)} d'IJ perçues contre ${fmtEur(revMens * 36)} de revenus normaux.
        </div>
      </div>`
  }

  // Judgment + Orientation
  let jugementIJ = ''
  if (ij.tauxCouverture < 25) {
    jugementIJ = `La couverture en cas d'arrêt de travail est très insuffisante. Avec seulement ${fmtPct(ij.tauxCouverture)} du revenu maintenu par le régime obligatoire, le déficit mensuel de ${fmtEur(ij.ecart)} rendrait impossible le maintien des charges courantes. Ce risque doit être traité en priorité absolue, car c'est le sinistre le plus probable et le plus immédiat pour un professionnel indépendant.`
  } else if (ij.tauxCouverture < 50) {
    jugementIJ = `La couverture arrêt de travail demeure fragile. Le régime obligatoire ne permet de maintenir que ${fmtPct(ij.tauxCouverture)} du revenu, laissant un déficit de ${fmtEur(ij.ecart)}/mois qui compromettrait rapidement l'équilibre financier du foyer. Ce poste constitue un sujet important à traiter à court terme.`
  } else if (ij.tauxCouverture < 70) {
    jugementIJ = `La couverture arrêt de travail est partiellement assurée (${fmtPct(ij.tauxCouverture)} du revenu), mais l'écart résiduel de ${fmtEur(ij.ecart)}/mois reste significatif, en particulier si l'arrêt se prolonge au-delà de quelques mois. Une optimisation ciblée permettrait de sécuriser ce poste.`
  } else {
    jugementIJ = `La couverture en cas d'arrêt de travail est satisfaisante, avec ${fmtPct(ij.tauxCouverture)} du revenu maintenu. Ce niveau de protection offre une marge de sécurité raisonnable. Il convient néanmoins de vérifier que ce niveau se maintient dans la durée, notamment en cas de changement de phase d'indemnisation.`
  }

  const orientationIJ = ij.ecart > 0
    ? renderOrientation(
        'Renforcer la couverture en indemnités journalières',
        'Souscrire une prévoyance complémentaire couvrant le déficit mensuel identifié, avec un délai de carence adapté au régime obligatoire',
        `Réduire le manque mensuel de ${fmtEur(ij.ecart)} pour sécuriser le maintien des charges incompressibles pendant la durée de l'arrêt`,
        q.urgence
      )
    : ''

  return `
    <div class="prev-grid-2" style="align-items:start;">
      <div style="text-align:center;">
        ${gauge}
        <div class="prev-qual-badge" style="background:${q.color}15;color:${q.color};margin-top:8px;">Couverture ${q.label.toLowerCase()}</div>
      </div>
      <div class="prev-grid-3" style="margin:0;">
        ${kpiIJ}${kpiFranchise}${kpiEcart}
      </div>
    </div>

    <div class="prev-narratif">
      En cas d'arrêt de travail, le régime obligatoire applicable — ${safeField(ij.regime) ? `<strong>${escapeHtml(ij.regime)}</strong>` : `celui de ${caisseShort}`} —
      verse des indemnités journalières de <strong>${fmtEur(ij.ijJour)} par jour</strong>, soit environ <strong>${fmtEur(ij.ijMensuel)} par mois</strong>.
      Rapporté au revenu mensuel de ${fmtEur(revMens)}, cela représente un taux de maintien de
      <strong style="color:${q.color};">${fmtPct(ij.tauxCouverture)}</strong>.
      ${ij.ecart > 0
        ? ` Le déficit mensuel s'établit à <strong style="color:#dc2626;">${fmtEur(ij.ecart)}</strong>, montant qui devrait être compensé par une couverture complémentaire ou une épargne de précaution.`
        : ` Le revenu est intégralement couvert par le régime obligatoire, ce qui constitue un point favorable.`}
      ${safeField(ij.dureeMax) ? ` La durée maximale d'indemnisation est de <strong>${escapeHtml(ij.dureeMax)}</strong>.` : ''}
    </div>

    ${narratifFranchise}
    ${narratifPhase2}
    ${narratifResteVivre}
    ${projectionHtml}

    ${renderAvis(jugementIJ)}
    ${orientationIJ}

    <div class="prev-transition">L'analyse se poursuit avec le deuxième pilier de protection : la couverture en cas d'invalidité permanente, risque moins fréquent mais aux conséquences financières potentiellement plus lourdes et durables.</div>
  `
}
function buildAnalyseInvalidite(d: RapportPrevoyanceTnsData): string {
  const inv = d.sections.invalidite
  const f = d.formData
  const revMens = Math.round(f.revenuAn / 12)
  const chargesTot = f.chargePerso + f.chargePro
  const q = qualTaux(inv.tauxCouverture)
  const annRetraite = Math.max(1, 65 - f.age)
  const caisseShort = humanizeCaisseShort(f.codeCaisse)

  const gauge = generateGauge(Math.round(inv.tauxCouverture), 100, 160, q.color, 'Couverture invalidité')
  const kpiRente = generateKpiCard('Rente mensuelle', fmtEur(inv.renteMensuelle), { sublabel: `soit ${fmtEur(inv.renteAnnuelle)}/an`, color: '#6366f1', bgColor: '#eef2ff' })
  const kpiEcart = generateKpiCard('Déficit mensuel', fmtEur(inv.ecart), { sublabel: inv.ecart > 0 ? 'Manque pour couvrir le revenu' : 'Revenu couvert', color: inv.ecart > 0 ? '#dc2626' : '#059669', bgColor: inv.ecart > 0 ? '#fef2f2' : '#f0fdf4' })
  const perteTotale = inv.ecart * 12 * annRetraite
  const kpiLT = generateKpiCard('Perte cumulée estimée', fmtEur(perteTotale), { sublabel: `Projection sur ${annRetraite} ans`, color: perteTotale > 0 ? '#dc2626' : '#059669', bgColor: perteTotale > 0 ? '#fef2f2' : '#f0fdf4' })

  // Catégories de la caisse — humanized
  let categoriesHtml = ''
  if (inv.details?.categoriesExistantes?.length > 0) {
    const rows = inv.details.categoriesExistantes.map(c =>
      `<tr><td style="font-weight:600;">${escapeHtml(c.nom)}</td><td style="text-align:center;">${escapeHtml(c.taux)}</td><td style="text-align:right;font-weight:700;">${fmtEur(c.montant)}/an</td></tr>`
    ).join('')
    categoriesHtml = `
      <div class="prev-card" style="margin-top:14px;">
        <div class="prev-titre-section">Barème d'invalidité de ${caisseShort}</div>
        <table class="prev-table-mini">
          <tr><th>Catégorie</th><th style="text-align:center;">Taux d'invalidité reconnu</th><th style="text-align:right;">Rente annuelle versée</th></tr>
          ${rows}
        </table>
        ${safeField(inv.details.delaiCarence) ? `<div class="prev-texte-muted" style="margin-top:6px;">Délai de carence applicable : ${escapeHtml(inv.details.delaiCarence)}</div>` : ''}
        ${safeField(inv.details.duree) ? `<div class="prev-texte-muted">Durée de versement : ${escapeHtml(inv.details.duree)}</div>` : ''}
      </div>`
  }

  // Impact long terme — personalized
  const resteInv = inv.renteMensuelle - chargesTot
  let impactLT = ''
  if (inv.ecart > 0) {
    impactLT = `
      <div class="prev-callout prev-callout-danger" style="margin-top:14px;">
        <div class="prev-titre-section" style="color:#991b1b;">Projection des conséquences financières à long terme</div>
        <div class="prev-texte">
          En cas d'invalidité totale et définitive, la rente versée par ${caisseShort} s'élèverait à <strong>${fmtEur(inv.renteMensuelle)}/mois</strong>.
          ${resteInv < 0
            ? ` Ce montant ne couvre même pas les charges incompressibles déclarées de ${fmtEur(chargesTot)}/mois, générant un déficit structurel de <strong style="color:#dc2626;">${fmtEur(Math.abs(resteInv))}/mois</strong> dès le premier mois.`
            : ` Ce montant couvre les charges incompressibles de ${fmtEur(chargesTot)}/mois, mais ne laisse qu'un reste à vivre de ${fmtEur(resteInv)}/mois contre ${fmtEur(revMens - chargesTot)} en situation normale.`}
          <br/><br/>
          À l'âge de ${f.age} ans, le manque à gagner cumulé jusqu'à l'âge de la retraite (estimé à 65 ans, soit ${annRetraite} ans) s'élèverait à
          <strong style="color:#dc2626;">${fmtEur(perteTotale)}</strong>. L'invalidité constitue le risque financier le plus lourd pour un travailleur non salarié,
          car il s'inscrit dans la durée et ne bénéficie d'aucun mécanisme de compensation automatique.
        </div>
      </div>`
  }

  // Conditions — only if meaningful
  let conditionsHtml = ''
  if (safeField(inv.conditionsObtention)) {
    conditionsHtml = `
      <div class="prev-callout prev-callout-info" style="margin-top:14px;">
        <div class="prev-texte"><strong>Conditions d'accès à la rente d'invalidité :</strong> ${escapeHtml(inv.conditionsObtention)}</div>
      </div>`
  }

  // Professional judgment
  let jugementInv = ''
  if (inv.tauxCouverture < 25) {
    jugementInv = `La couverture invalidité est très dégradée. Avec une rente représentant seulement ${fmtPct(inv.tauxCouverture)} du revenu actuel, le risque d'invalidité expose ce foyer à une situation de précarité financière durable. Ce poste constitue, par sa durée potentielle et son ampleur, le risque le plus lourd du bilan. Il doit faire l'objet d'une action correctrice prioritaire.`
  } else if (inv.tauxCouverture < 50) {
    jugementInv = `La couverture invalidité reste insuffisante pour absorber les charges fixes du foyer sur la durée. Le déficit mensuel de ${fmtEur(inv.ecart)}, projeté sur ${annRetraite} ans, génère une perte cumulée considérable. Ce risque doit être traité en priorité car le régime obligatoire ne permet pas de maintenir l'équilibre financier.`
  } else if (inv.tauxCouverture < 70) {
    jugementInv = `La situation reste partiellement protégée, mais elle demeure fragile en cas d'invalidité prolongée. L'écart de ${fmtEur(inv.ecart)}/mois, s'il peut sembler gérable à court terme, représente une érosion significative du niveau de vie sur la durée. Un renforcement ciblé est recommandé.`
  } else {
    jugementInv = `La couverture invalidité atteint un niveau globalement acceptable (${fmtPct(inv.tauxCouverture)}). Ce résultat est un élément favorable du bilan. Il convient néanmoins de vérifier les conditions d'éligibilité et les éventuelles exclusions pour s'assurer que cette protection est effective dans tous les scénarios.`
  }

  const orientationInv = inv.ecart > 0
    ? renderOrientation(
        'Renforcer la rente d\'invalidité',
        'Mettre en place une garantie complémentaire d\'invalidité professionnelle permettant de compenser le déficit identifié',
        `Sécuriser un revenu de remplacement d'au moins ${fmtEur(chargesTot)}/mois pour couvrir les charges incompressibles en cas d'invalidité durable`,
        q.urgence
      )
    : ''

  return `
    <div class="prev-grid-2" style="align-items:start;">
      <div style="text-align:center;">
        ${gauge}
        <div class="prev-qual-badge" style="background:${q.color}15;color:${q.color};margin-top:8px;">Couverture ${q.label.toLowerCase()}</div>
      </div>
      <div class="prev-grid-3" style="margin:0;">
        ${kpiRente}${kpiEcart}${kpiLT}
      </div>
    </div>

    <div class="prev-narratif">
      En cas d'invalidité totale et définitive, ${caisseShort} verserait une rente de
      <strong>${fmtEur(inv.renteMensuelle)} par mois</strong> (${fmtEur(inv.renteAnnuelle)}/an), ce qui représente
      <strong style="color:${q.color};">${fmtPct(inv.tauxCouverture)}</strong> du revenu actuel.
      ${inv.ecart > 0
        ? ` Le déficit mensuel s'établit à <strong style="color:#dc2626;">${fmtEur(inv.ecart)}</strong>. Contrairement à l'arrêt de travail, ce déficit peut se prolonger sur plusieurs décennies, ce qui en amplifie considérablement l'impact.`
        : ` La rente couvre l'intégralité du revenu actuel, ce qui constitue un élément de sécurité appréciable.`}
    </div>

    ${categoriesHtml}
    ${impactLT}
    ${conditionsHtml}

    ${renderAvis(jugementInv)}
    ${orientationInv}

    <div class="prev-transition">Le dernier pilier de l'analyse porte sur la couverture en cas de décès, dont les enjeux touchent directement à la protection des proches et à la pérennité financière du foyer.</div>
  `
}
function buildAnalyseDeces(d: RapportPrevoyanceTnsData): string {
  const dec = d.sections.deces
  const f = d.formData
  const revMens = Math.round(f.revenuAn / 12)
  const q = qualTaux(dec.tauxCouverture)
  const caisseShort = humanizeCaisseShort(f.codeCaisse)
  const hasFamille = f.situation !== 'celibataire' || f.nbEnfants > 0

  const gauge = generateGauge(Math.round(dec.tauxCouverture), 100, 160, q.color, 'Couverture décès')
  const kpiCapital = generateKpiCard('Capital versé', fmtEur(dec.capitalBase), { sublabel: `Équivalent de ${dec.moisDeRevenus} mois de revenu`, color: '#6366f1', bgColor: '#eef2ff' })
  const kpiObjectif = generateKpiCard('Capital nécessaire estimé', fmtEur(dec.objectif), { sublabel: 'Objectif de protection calculé', color: '#0f172a', bgColor: '#f8fafc' })
  const kpiEcart = generateKpiCard('Écart', fmtEur(dec.ecart), { sublabel: dec.ecart > 0 ? 'Capital manquant' : 'Objectif couvert', color: dec.ecart > 0 ? '#dc2626' : '#059669', bgColor: dec.ecart > 0 ? '#fef2f2' : '#f0fdf4' })

  // Détail de l'objectif — only show lines with positive values
  let objectifHtml = ''
  if (dec.detailObjectif) {
    const obj = dec.detailObjectif
    const lines: string[] = []
    if (obj.remplacementRevenu > 0) lines.push(`<tr><td>Maintien du niveau de vie des proches (remplacement de revenu)</td><td style="text-align:right;font-weight:700;">${fmtEur(obj.remplacementRevenu)}</td></tr>`)
    if (obj.liquidationPro > 0) lines.push(`<tr><td>Apurement des engagements professionnels (dettes, local, matériel)</td><td style="text-align:right;font-weight:700;">${fmtEur(obj.liquidationPro)}</td></tr>`)
    if (obj.educationEnfants > 0) lines.push(`<tr><td>Financement de l'éducation des enfants (scolarité, études supérieures)</td><td style="text-align:right;font-weight:700;">${fmtEur(obj.educationEnfants)}</td></tr>`)
    if (obj.conjoint > 0) lines.push(`<tr><td>Capital de sécurité pour le conjoint</td><td style="text-align:right;font-weight:700;">${fmtEur(obj.conjoint)}</td></tr>`)

    if (lines.length > 0) {
      objectifHtml = `
        <div class="prev-card" style="margin-top:14px;">
          <div class="prev-titre-section">Décomposition du besoin en capital</div>
          <table class="prev-table-mini">
            ${lines.join('')}
            <tr style="background:#f1f5f9;font-weight:700;"><td>Besoin total estimé</td><td style="text-align:right;">${fmtEur(obj.total)}</td></tr>
          </table>
          <div class="prev-texte-muted" style="margin-top:6px;">
            Le régime obligatoire de ${caisseShort} prévoit un capital de <strong>${fmtEur(dec.capitalBase)}</strong>${dec.capitalDoubleAccident ? ' (doublé en cas de décès accidentel)' : ''}.
            ${dec.ecart > 0
              ? ` L'écart entre le capital versé et le besoin estimé s'élève à <strong style="color:#dc2626;">${fmtEur(dec.ecart)}</strong>.`
              : ` Le capital versé couvre le besoin estimé.`}
          </div>
        </div>`
    }
  }

  // Impact familial — deeply personalized
  let narratifFamille = ''
  if (hasFamille && dec.ecart > 0) {
    let contexteFamilial = ''
    if (f.nbEnfants > 0 && f.situation !== 'celibataire') {
      contexteFamilial = `Dans la configuration familiale retenue — ${labelSituation(f.situation).toLowerCase()} avec ${f.nbEnfants} enfant${f.nbEnfants > 1 ? 's' : ''} à charge —, la disparition du professionnel entraînerait la suppression totale du revenu d'activité. Le conjoint et les enfants se retrouveraient avec un capital de ${fmtEur(dec.capitalBase)}, soit l'équivalent de seulement ${dec.moisDeRevenus} mois de revenus.`
    } else if (f.nbEnfants > 0) {
      contexteFamilial = `En tant que parent célibataire avec ${f.nbEnfants} enfant${f.nbEnfants > 1 ? 's' : ''} à charge, la protection en cas de décès revêt une importance particulière. Le capital de ${fmtEur(dec.capitalBase)} représente ${dec.moisDeRevenus} mois de revenus, ce qui ne suffirait pas à assurer la stabilité financière des enfants à moyen terme.`
    } else {
      contexteFamilial = `Pour un foyer en couple, la disparition du professionnel supprimerait le revenu principal. Le capital de ${fmtEur(dec.capitalBase)} offre une marge de ${dec.moisDeRevenus} mois, ce qui reste limité au regard des engagements financiers du foyer.`
    }
    narratifFamille = `
      <div class="prev-callout prev-callout-danger" style="margin-top:14px;">
        <div class="prev-titre-section" style="color:#991b1b;">Conséquences pour le foyer</div>
        <div class="prev-texte">
          ${contexteFamilial}
          ${dec.moisDeRevenus < 24
            ? ` Ce délai est insuffisant pour permettre aux proches de réorganiser leur situation financière dans des conditions acceptables.`
            : ` Ce délai offre une marge relative, mais demeure limité face aux engagements de long terme (logement, éducation, niveau de vie).`}
          ${safeField(dec.beneficiaires) ? `<br/>Bénéficiaires désignés au contrat : <strong>${escapeHtml(dec.beneficiaires)}</strong>.` : ''}
        </div>
      </div>`
  } else if (!hasFamille) {
    narratifFamille = `
      <div class="prev-callout prev-callout-info" style="margin-top:14px;">
        <div class="prev-texte">
          En l'absence de personnes à charge, la couverture décès revêt un caractère moins urgent que les deux piliers précédents.
          Toutefois, si des engagements financiers existent (emprunts professionnels, cautions, investissements en cours),
          un capital décès reste pertinent pour protéger le patrimoine et les éventuels ayants droit.
        </div>
      </div>`
  }

  // Professional judgment
  let jugementDeces = ''
  if (!hasFamille) {
    jugementDeces = `En l'absence de personnes à charge directes, ce poste ne constitue pas une priorité de premier rang. Il relève davantage de l'optimisation patrimoniale que de l'urgence. L'attention doit se porter prioritairement sur les risques d'arrêt de travail et d'invalidité.`
  } else if (dec.tauxCouverture < 25) {
    jugementDeces = `Le niveau de couverture décès est très insuffisant au regard de la composition du foyer. Le capital prévu par ${caisseShort} ne permettrait pas aux proches de faire face aux engagements courants au-delà de quelques mois. Ce risque, bien que moins fréquent, doit être recalibré en urgence pour un foyer avec personnes à charge.`
  } else if (dec.tauxCouverture < 50) {
    jugementDeces = `Le capital décès prévu couvre moins de la moitié du besoin estimé. Pour un foyer ${f.nbEnfants > 0 ? 'avec enfants' : 'en couple'}, ce niveau de protection mérite d'être renforcé afin de sécuriser la transition financière des proches en cas de disparition prématurée.`
  } else if (dec.tauxCouverture < 70) {
    jugementDeces = `Le niveau de couverture décès est présent mais mérite d'être recalibré au regard des besoins familiaux identifiés. L'écart résiduel de ${fmtEur(dec.ecart)} peut être comblé par une garantie complémentaire ciblée, dont le coût peut être partiellement optimisé via le dispositif Madelin.`
  } else {
    jugementDeces = `La couverture décès atteint un niveau satisfaisant (${fmtPct(dec.tauxCouverture)} de l'objectif). Ce résultat constitue un point favorable du bilan. Il convient de vérifier régulièrement l'adéquation de ce capital avec l'évolution des besoins familiaux et des engagements financiers.`
  }

  const orientationDeces = (dec.ecart > 0 && hasFamille)
    ? renderOrientation(
        'Réévaluer le capital décès',
        'Compléter le capital obligatoire par une garantie décès adaptée à la composition du foyer et aux engagements financiers',
        `Couvrir l'écart de ${fmtEur(dec.ecart)} pour atteindre l'objectif de protection estimé à ${fmtEur(dec.objectif)}`,
        hasFamille && dec.tauxCouverture < 50 ? 'prioritaire' : 'à traiter à moyen terme'
      )
    : ''

  return `
    <div class="prev-grid-2" style="align-items:start;">
      <div style="text-align:center;">
        ${gauge}
        <div class="prev-qual-badge" style="background:${q.color}15;color:${q.color};margin-top:8px;">Couverture ${q.label.toLowerCase()}</div>
      </div>
      <div class="prev-grid-3" style="margin:0;">
        ${kpiCapital}${kpiObjectif}${kpiEcart}
      </div>
    </div>

    <div class="prev-narratif">
      En cas de décès, le régime obligatoire de ${caisseShort} prévoit le versement d'un capital de
      <strong>${fmtEur(dec.capitalBase)}</strong>${dec.capitalDoubleAccident ? ' (doublé en cas de décès accidentel)' : ''}.
      Ce montant représente l'équivalent de <strong>${dec.moisDeRevenus} mois</strong> de revenu actuel
      et couvre <strong style="color:${q.color};">${fmtPct(dec.tauxCouverture)}</strong> de l'objectif de protection calculé
      en fonction de la situation familiale et des engagements financiers déclarés.
    </div>

    ${objectifHtml}
    ${narratifFamille}

    ${renderAvis(jugementDeces)}
    ${orientationDeces}

    <div class="prev-transition">Au-delà du renforcement des garanties, il existe un levier fiscal permettant d'améliorer la protection tout en réduisant la charge nette des cotisations : le dispositif Madelin.</div>
  `
}
function buildMadelin(d: RapportPrevoyanceTnsData): string {
  if (!d.madelin) {
    return `
      <div class="prev-callout prev-callout-info">
        <div class="prev-texte">
          Le calcul du plafond Madelin n'a pas pu être réalisé pour cette simulation.
          Le dispositif Madelin permet aux travailleurs non salariés de déduire de leur revenu imposable
          les cotisations versées au titre de la prévoyance complémentaire. Ce levier peut significativement
          réduire le coût net d'une couverture renforcée. Une évaluation personnalisée est recommandée.
        </div>
      </div>`
  }

  const mad = d.madelin
  const f = d.formData
  const revenuAn = f.revenuAn
  const dom = dominantRisque(d)

  // Estimation TMI (simplifiée pour le rapport)
  let tmi = 0.30
  if (revenuAn <= 11294) tmi = 0
  else if (revenuAn <= 28797) tmi = 0.11
  else if (revenuAn <= 82341) tmi = 0.30
  else if (revenuAn <= 177106) tmi = 0.41
  else tmi = 0.45

  const economieMax = Math.round(mad.plafondDeductible * tmi)
  const coutReel100 = Math.round(100 * (1 - tmi))
  const tmiPct = Math.round(tmi * 100)

  const kpiPlafond = generateKpiCard('Plafond de déduction', fmtEur(mad.plafondDeductible), { sublabel: 'Montant déductible par an', color: '#6366f1', bgColor: '#eef2ff' })
  const kpiEconomie = generateKpiCard('Économie fiscale maximale', fmtEur(economieMax), { sublabel: `À la tranche marginale de ${tmiPct}%`, color: '#059669', bgColor: '#f0fdf4' })
  const kpiCout = generateKpiCard('Coût réel pour 100 € cotisés', `${coutReel100} €`, { sublabel: `${tmiPct} € pris en charge par l'État`, color: '#6366f1', bgColor: '#eef2ff' })

  // Personalized narrative linking to identified gaps
  const ecartTotalMens = d.sections.ij.ecart + d.sections.invalidite.ecart
  const ecartTotalAn = ecartTotalMens * 12

  return `
    <div class="prev-grid-3">
      ${kpiPlafond}${kpiEconomie}${kpiCout}
    </div>

    <div class="prev-narratif">
      Le dispositif <strong>Loi Madelin</strong> permet aux travailleurs non salariés de déduire de leur revenu imposable
      les cotisations versées au titre de la prévoyance complémentaire. Ce mécanisme réduit le coût réel de la couverture
      et constitue un levier stratégique pour renforcer la protection sociale tout en optimisant la charge fiscale.
    </div>

    <div class="prev-card-accent">
      <div class="prev-titre-section" style="color:#4338ca;">Application à votre situation</div>
      <div class="prev-texte">
        Au regard du revenu professionnel retenu de <strong>${fmtEur(revenuAn)} par an</strong>
        (base de calcul Madelin : ${fmtEur(mad.revenuBase)}), le plafond annuel de déduction s'élève à
        <strong>${fmtEur(mad.plafondDeductible)}</strong>.
        <br/><br/>
        À la tranche marginale d'imposition estimée de <strong>${tmiPct}%</strong>,
        chaque euro de cotisation Madelin ne représente qu'un coût net de <strong>${coutReel100} centimes</strong> :
        les <strong>${tmiPct} centimes</strong> restants sont économisés sous forme de réduction d'impôt sur le revenu.
        <br/><br/>
        En utilisant l'intégralité du plafond disponible, l'économie d'impôt annuelle atteindrait
        <strong style="color:#059669;">${fmtEur(economieMax)}</strong>. Ce montant peut être mis en regard
        du coût d'une couverture complémentaire visant à combler les déficits identifiés dans les sections précédentes.
      </div>
    </div>

    ${ecartTotalAn > 0 ? `
    <div class="prev-callout prev-callout-success" style="margin-top:14px;">
      <div class="prev-texte">
        <strong>Mise en perspective :</strong> Les déficits de couverture identifiés sur l'arrêt de travail et l'invalidité
        représentent un manque cumulé d'environ <strong>${fmtEur(ecartTotalMens)}/mois</strong> (${fmtEur(ecartTotalAn)}/an).
        Le coût net d'une cotisation Madelin destinée à combler ces écarts serait réduit de ${tmiPct}% grâce à la déduction fiscale,
        ce qui rend l'effort financier nettement plus accessible qu'il n'y paraît au premier abord.
      </div>
    </div>` : ''}

    ${renderAvis(
      tmi >= 0.30
        ? `À une tranche marginale de ${tmiPct}%, le levier fiscal Madelin est particulièrement efficace. Pour chaque euro investi en prévoyance, l'État prend en charge ${tmiPct} centimes. Ce rapport coût/bénéfice exceptionnel justifie pleinement l'utilisation de ce dispositif comme véhicule principal de renforcement de la couverture. La priorité consiste à affecter le plafond disponible aux garanties les plus déficitaires, en commençant par ${dom.label}.`
        : tmi >= 0.11
          ? `Le levier fiscal Madelin reste avantageux à votre tranche marginale de ${tmiPct}%, même si l'effet est moins spectaculaire qu'aux tranches supérieures. Il est recommandé d'utiliser ce dispositif de manière ciblée, en orientant les cotisations vers ${dom.label} qui constitue le poste le plus déficitaire du bilan.`
          : `À votre niveau de revenu, la tranche marginale est faible (${tmiPct}%), ce qui limite l'avantage fiscal du dispositif Madelin. L'intérêt de la couverture complémentaire reste cependant entier du point de vue de la protection sociale. Le coût doit être évalué au regard du risque financier encouru en l'absence de couverture.`
    )}

    <div class="prev-transition">L'ensemble des constats et jugements formulés dans les sections précédentes se traduit maintenant en un plan d'action structuré, hiérarchisé par ordre de priorité et d'impact.</div>
  `
}
function buildRecommandations(d: RapportPrevoyanceTnsData): string {
  const syn = d.synthese
  const f = d.formData
  if (!syn.priorites || syn.priorites.length === 0) {
    return `<div class="prev-narratif">L'analyse n'a pas mis en évidence de déficit de couverture nécessitant une action correctrice immédiate. La protection sociale actuelle apparaît adaptée à la situation déclarée. Il est néanmoins recommandé de réévaluer cette couverture en cas d'évolution de la situation professionnelle ou familiale.</div>`
  }

  const nbCritiques = syn.priorites.filter(p => ['critique', 'elevee'].includes(p.urgence.toLowerCase())).length
  const nbTotal = syn.priorites.length
  const dom = dominantRisque(d)
  const profLabel = humanizeProfession(f.profession)

  // Strategic intro — positioned
  let introNarratif = `L'analyse des trois piliers de protection a permis d'identifier <strong>${nbTotal} action${nbTotal > 1 ? 's' : ''} concrète${nbTotal > 1 ? 's' : ''}</strong> à engager`
  if (nbCritiques > 0) {
    introNarratif += `, dont <strong style="color:#dc2626;">${nbCritiques}</strong> revêt${nbCritiques > 1 ? 'ent' : ''} un caractère prioritaire`
  }
  introNarratif += `. Pour ${profLabel}, la démarche doit suivre l'ordre de priorité présenté ci-dessous : chaque action est justifiée par un constat précis du bilan et assortie d'un objectif mesurable.`

  // Build strategic decision cards
  const fichesHtml = syn.priorites.map((p, i) => {
    const urgLower = p.urgence.toLowerCase()
    const urgColor = urgLower.includes('critique') || urgLower.includes('haute') || urgLower.includes('elev') ? '#dc2626' : urgLower.includes('moyen') || urgLower.includes('interm') ? '#ca8a04' : '#059669'
    const urgBg = urgLower.includes('critique') || urgLower.includes('haute') || urgLower.includes('elev') ? '#fef2f2' : urgLower.includes('moyen') || urgLower.includes('interm') ? '#fffbeb' : '#f0fdf4'
    const urgLabel = urgLower.includes('critique') ? 'Priorité absolue' : urgLower.includes('elev') || urgLower.includes('haute') ? 'Prioritaire' : urgLower.includes('moyen') || urgLower.includes('interm') ? 'Important' : 'Optimisation'

    return `
      <div class="prev-fiche-action" style="border-left: 4px solid ${urgColor};">
        <div class="prev-fiche-header">
          <span class="prev-fiche-num" style="background:${urgColor};">${i + 1}</span>
          <div>
            <div class="prev-fiche-titre">${escapeHtml(p.domaine)}</div>
            <span class="prev-prio-badge" style="background:${urgBg};color:${urgColor};margin-top:4px;">${urgLabel}</span>
          </div>
        </div>
        <div class="prev-fiche-desc">${escapeHtml(p.action)}</div>
        <div class="prev-fiche-meta">
          <div class="prev-fiche-meta-item">
            <span class="prev-fiche-meta-label">Risque traité</span>
            ${escapeHtml(p.domaine)}
          </div>
          <div class="prev-fiche-meta-item">
            <span class="prev-fiche-meta-label">Degré d'urgence</span>
            <strong style="color:${urgColor};">${urgLabel}</strong>
          </div>
          <div class="prev-fiche-meta-item">
            <span class="prev-fiche-meta-label">Objectif recherché</span>
            ${escapeHtml(p.action)}
          </div>
          <div class="prev-fiche-meta-item">
            <span class="prev-fiche-meta-label">Bénéfice attendu</span>
            ${escapeHtml(p.impact)}
          </div>
        </div>
      </div>`
  }).join('')

  return `
    <div class="prev-narratif">${introNarratif}</div>

    ${safeField(syn.recommandationPrincipale) ? `
    <div class="prev-card-accent" style="margin-bottom:16px;">
      <div class="prev-titre-section" style="color:#4338ca;">Orientation principale du conseil</div>
      <div class="prev-texte">${escapeHtml(syn.recommandationPrincipale)}</div>
    </div>` : ''}

    ${fichesHtml}

    ${renderAvis(
      nbCritiques >= 2
        ? `Le plan d'action révèle plusieurs postes nécessitant une intervention rapide. Il est recommandé d'engager les actions 1 et 2 simultanément si possible, car elles portent sur les risques les plus lourds du bilan. L'objectif n'est pas de souscrire un maximum de garanties, mais de cibler précisément les déficits qui conditionnent la stabilité financière du foyer.`
        : nbCritiques === 1
          ? `Une action prioritaire se dégage clairement du bilan. Elle doit être traitée en premier et conditionne la solidité globale de la couverture. Les actions suivantes relèvent de l'optimisation et peuvent être échelonnées dans le temps.`
          : `Les actions identifiées relèvent principalement de l'optimisation. La couverture existante assure un socle de protection, mais les ajustements proposés permettraient de sécuriser davantage la situation et de tirer parti du levier fiscal disponible.`
    )}
  `
}
function buildConclusion(d: RapportPrevoyanceTnsData): string {
  const syn = d.synthese
  const f = d.formData
  const ij = d.sections.ij
  const inv = d.sections.invalidite
  const dec = d.sections.deces
  const dom = dominantRisque(d)
  const profLabel = humanizeProfession(f.profession)
  const caisseShort = humanizeCaisseShort(f.codeCaisse)
  const hasFamille = f.situation !== 'celibataire' || f.nbEnfants > 0

  const qIJ = qualTaux(ij.tauxCouverture)
  const qInv = qualTaux(inv.tauxCouverture)
  const qDec = qualTaux(dec.tauxCouverture)

  const recap = `
    <table class="prev-table-mini" style="margin-bottom:16px;">
      <tr><th>Pilier de protection</th><th style="text-align:center;">Taux de couverture</th><th style="text-align:center;">Appréciation</th><th style="text-align:right;">Déficit mensuel</th></tr>
      <tr>
        <td style="font-weight:600;">Arrêt de travail</td>
        <td style="text-align:center;font-weight:700;color:${qIJ.color};">${fmtPct(ij.tauxCouverture)}</td>
        <td style="text-align:center;"><span class="prev-qual-badge" style="background:${qIJ.color}15;color:${qIJ.color};">${qIJ.label}</span></td>
        <td style="text-align:right;font-weight:700;color:${ij.ecart > 0 ? '#dc2626' : '#059669'};">${ij.ecart > 0 ? '−' + fmtEur(ij.ecart) : 'Couvert'}</td>
      </tr>
      <tr>
        <td style="font-weight:600;">Invalidité</td>
        <td style="text-align:center;font-weight:700;color:${qInv.color};">${fmtPct(inv.tauxCouverture)}</td>
        <td style="text-align:center;"><span class="prev-qual-badge" style="background:${qInv.color}15;color:${qInv.color};">${qInv.label}</span></td>
        <td style="text-align:right;font-weight:700;color:${inv.ecart > 0 ? '#dc2626' : '#059669'};">${inv.ecart > 0 ? '−' + fmtEur(inv.ecart) : 'Couvert'}</td>
      </tr>
      <tr>
        <td style="font-weight:600;">Décès</td>
        <td style="text-align:center;font-weight:700;color:${qDec.color};">${fmtPct(dec.tauxCouverture)}</td>
        <td style="text-align:center;"><span class="prev-qual-badge" style="background:${qDec.color}15;color:${qDec.color};">${qDec.label}</span></td>
        <td style="text-align:right;font-weight:700;color:${dec.ecart > 0 ? '#dc2626' : '#059669'};">${dec.ecart > 0 ? '−' + fmtEur(dec.ecart) : 'Couvert'}</td>
      </tr>
    </table>`

  const nbInsuffisants = [ij, inv, dec].filter(s => s.tauxCouverture < 50).length

  // Incarnated conclusion narrative
  let conclusionNarratif = ''
  if (syn.scoreGlobal < 40) {
    conclusionNarratif = `L'analyse met en évidence une protection sociale <strong>nettement insuffisante</strong> pour ${profLabel}, affilié(e) à ${caisseShort}. Le principal point de fragilité concerne <strong>${dom.domaine}</strong> (${fmtPct(dom.taux)}), mais ${nbInsuffisants > 1 ? nbInsuffisants + ' piliers sur trois présentent des insuffisances marquées' : 'ce déficit seul justifie une intervention rapide'}.<br/><br/>La priorité n'est pas d'ajouter indistinctement des garanties, mais de <strong>sécuriser d'abord les postes qui conditionnent la stabilité financière du foyer</strong>. Le recours à un contrat de prévoyance complémentaire, adossé au dispositif Madelin, permettrait de réduire significativement les déficits identifiés. <strong>Une mise en œuvre rapide est recommandée.</strong>`
  } else if (syn.scoreGlobal < 70) {
    conclusionNarratif = `L'analyse révèle une couverture sociale <strong>partiellement satisfaisante</strong> pour ${profLabel}. Si certains postes atteignent un niveau acceptable, le bilan fait apparaître des écarts significatifs, notamment sur <strong>${dom.domaine}</strong> (${fmtPct(dom.taux)}).<br/><br/>L'ordre de traitement recommandé place ${dom.domaine} en tête des priorités. L'objectif n'est pas d'atteindre une couverture maximale sur tous les postes, mais de <strong>renforcer précisément les points de vulnérabilité</strong> qui, en cas de sinistre, compromettraient l'équilibre financier du foyer.`
  } else {
    conclusionNarratif = `L'analyse fait apparaître une couverture sociale <strong>globalement satisfaisante</strong> pour ${profLabel}. Les trois piliers de protection atteignent des niveaux acceptables, ce qui constitue un socle solide.<br/><br/>Les ajustements envisageables relèvent davantage de l'optimisation que de l'urgence. Il convient néanmoins de <strong>surveiller l'évolution de la situation</strong> — professionnelle, familiale, et réglementaire — susceptible de modifier les besoins de protection à moyen terme.`
  }

  // Personalized next steps
  const deficits = [ij.ecart > 0 ? 'indemnités journalières' : '', inv.ecart > 0 ? 'rente invalidité' : '', dec.ecart > 0 ? 'capital décès' : ''].filter(Boolean)
  const etapes: string[] = []
  if (nbInsuffisants > 0) {
    etapes.push(`Engager un échange avec votre conseiller pour définir le cahier des charges d'une couverture complémentaire ciblée sur ${dom.label}`)
    etapes.push(`Comparer les solutions du marché en privilégiant les contrats couvrant les déficits identifiés (${deficits.join(', ')})`)
  } else {
    etapes.push('Programmer un point annuel de suivi pour vérifier l\'adéquation de la couverture avec l\'évolution de votre situation')
  }
  if (d.madelin) etapes.push('Optimiser l\'utilisation du plafond Madelin pour réduire le coût net de la protection complémentaire')
  if (hasFamille) etapes.push('Vérifier et mettre à jour les clauses bénéficiaires des contrats existants au regard de la situation familiale actuelle')
  etapes.push('Planifier une réévaluation du bilan en cas de changement de situation (revenu, famille, régime d\'affiliation)')

  const etapesHtml = etapes.map((e, i) => `<li><span class="prev-action-num">${i + 1}</span><div>${escapeHtml(e)}</div></li>`).join('')

  return `
    ${recap}

    <div class="prev-narratif">${conclusionNarratif}</div>

    <div class="prev-card" style="margin-top:14px;">
      <div class="prev-titre-section">Suite à donner</div>
      <ul class="prev-actions-list">${etapesHtml}</ul>
    </div>

    <div class="prev-callout prev-callout-info" style="margin-top:14px;">
      <div class="prev-texte">
        Ce bilan a été établi sur la base des données déclarées et des barèmes en vigueur
        au ${fmtDateLongue(d.date || new Date())}. Les montants présentés sont des estimations fondées
        sur les règles de ${caisseShort} applicables à la date d'analyse. Ce document constitue un outil
        d'aide à la décision et ne se substitue pas à un conseil personnalisé. Votre conseiller est à
        votre disposition pour approfondir chaque point et vous accompagner dans la mise en œuvre
        des recommandations formulées.
      </div>
    </div>
  `
}
function buildAnnexeProjection(d: RapportPrevoyanceTnsData): string {
  const sim = d.sections.ij.simulation
  if (!sim || sim.length === 0) return ''

  const revMens = Math.round(d.formData.revenuAn / 12)
  const caisseShort = humanizeCaisseShort(d.formData.codeCaisse)
  const classeText = safeField(d.formData.classeValue)
  let perteCumulee = 0

  const rows = sim.map(s => {
    perteCumulee += s.perte
    const barColor = s.tauxMaintien >= 80 ? '#10b981' : s.tauxMaintien >= 50 ? '#f59e0b' : s.tauxMaintien >= 1 ? '#ef4444' : '#dc2626'
    return `<tr>
      <td style="font-weight:600;">Mois ${s.mois}</td>
      <td style="text-align:center;">${humanizeSource(s.source) || '—'}</td>
      <td style="text-align:right;">${fmtEur(s.ijTotal)}</td>
      <td style="text-align:right;">${fmtEur(revMens)}</td>
      <td style="text-align:right;color:#dc2626;">−${fmtEur(s.perte)}</td>
      <td style="text-align:center;font-weight:700;color:${barColor};">${s.tauxMaintien}%</td>
      <td style="text-align:right;font-weight:700;color:#991b1b;">−${fmtEur(Math.round(perteCumulee))}</td>
    </tr>`
  }).join('')

  return `
    <div class="prev-texte-muted" style="margin-bottom:10px;">
      Projection mois par mois d'un arrêt de travail complet sur 36 mois, selon les règles de ${caisseShort}${classeText ? ` (classe ${escapeHtml(classeText)})` : ''}.
      Revenu mensuel de référence : ${fmtEur(revMens)}.
    </div>
    <table class="prev-table-mini" style="font-size:7.5pt;">
      <thead>
        <tr>
          <th>Période</th>
          <th style="text-align:center;">Organisme payeur</th>
          <th style="text-align:right;">Indemnités du mois</th>
          <th style="text-align:right;">Revenu normal</th>
          <th style="text-align:right;">Perte du mois</th>
          <th style="text-align:center;">Taux de maintien</th>
          <th style="text-align:right;">Perte cumulée</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="prev-texte-muted" style="margin-top:8px;">
      Les montants sont calculés jour par jour selon les règles du régime obligatoire et intègrent les changements
      de phase d'indemnisation (délai de carence, première période, seconde période le cas échéant).
      La perte cumulée représente le manque à gagner total depuis le début de l'arrêt.
    </div>
  `
}

// ═══════════════════ MAIN GENERATOR ═══════════════════

export function generateRapportPrevoyanceTnsHtml(data: RapportPrevoyanceTnsData): string {
  const clientNom = `${escapeHtml(data.client.prenom)} ${escapeHtml(data.client.nom)}`
  const ref = data.reference || `PREV-${Date.now().toString(36).toUpperCase()}`

  const builder = new PdfDocumentBuilder()
    .setMeta({ titre: `Bilan de Protection Sociale — ${clientNom}` })
    .addCustomStyles(prevStyles)

  builder.setCover({
    titre: 'Bilan de Protection Sociale',
    sousTitre: `Prévoyance du travailleur non salarié — ${humanizeProfession(data.formData.profession)} — ${humanizeCaisseShort(data.formData.codeCaisse)}`,
    badge: '🛡️ Prévoyance',
    clientNom,
    clientInfo: `Référence : ${ref}`,
    cabinetNom: data.cabinet?.nom || 'Cabinet de Conseil',
    date: data.date || new Date(),
    reference: ref,
    conseillerNom: data.conseiller ? `${data.conseiller.prenom} ${data.conseiller.nom}` : undefined,
  })

  builder.addChapter('Synthèse Exécutive', buildSyntheseExecutive(data))
  builder.addChapter('Votre Situation', buildProfil(data))
  builder.addChapter('Analyse — Arrêt de Travail', buildAnalyseIJ(data))
  builder.addChapter('Analyse — Invalidité', buildAnalyseInvalidite(data))
  builder.addChapter('Analyse — Décès', buildAnalyseDeces(data))
  builder.addChapter('Optimisation Fiscale Madelin', buildMadelin(data))
  builder.addChapter('Plan d\'Action', buildRecommandations(data))
  builder.addChapter('Conclusion', buildConclusion(data))

  const annexe = buildAnnexeProjection(data)
  if (annexe) builder.addAnnexe('Projection Détaillée — 36 mois', annexe)

  builder.setMentions({
    cabinetNom: data.cabinet?.nom || 'Cabinet de Conseil',
    cabinetAdresse: data.cabinet?.adresse,
    reference: ref,
    date: data.date || new Date(),
    mentions: [
      'Ce document est un bilan indicatif basé sur les paramètres déclarés et les barèmes en vigueur. Il ne constitue pas un conseil personnalisé ni un engagement contractuel.',
      'Les montants présentés sont des estimations calculées à partir des règles de votre caisse de retraite et du régime obligatoire. Les garanties réelles peuvent varier selon votre situation exacte.',
      'Nous vous recommandons de consulter votre conseiller pour une analyse personnalisée et la mise en place des solutions adaptées à votre situation.',
    ],
  })

  return builder.build()
}

export default generateRapportPrevoyanceTnsHtml
