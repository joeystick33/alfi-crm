import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { EntretienService } from '@/app/_common/lib/services/entretien-service'
import { logger } from '@/app/_common/lib/logger'
function generateEntretienHTML(entretien: any) {
  const clientName = entretien.client
    ? `${entretien.client.firstName} ${entretien.client.lastName}`
    : entretien.prospectPrenom
      ? `${entretien.prospectPrenom} ${entretien.prospectNom || ''}`
      : 'Prospect'

  const dateStr = entretien.dateEntretien
    ? new Date(entretien.dateEntretien).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const dureeStr = entretien.duree
    ? `${Math.floor(entretien.duree / 60)} min`
    : '—'

  const conseillerName = entretien.conseiller
    ? `${entretien.conseiller.firstName} ${entretien.conseiller.lastName}`
    : '—'

  const typeLabels: Record<string, string> = {
    DECOUVERTE: 'Découverte',
    SUIVI_PERIODIQUE: 'Suivi périodique',
    BILAN_PATRIMONIAL: 'Bilan patrimonial',
    CONSEIL_PONCTUEL: 'Conseil ponctuel',
    SIGNATURE: 'Signature',
    AUTRE: 'Autre',
  }

  let contentHTML = ''

  if (entretien.traitementType === 'RESUME' && entretien.traitementResultat) {
    const r = entretien.traitementResultat
    contentHTML = `
      <h2>Résumé de l'entretien</h2>
      ${r.objet ? `<div class="section"><h3>Objet</h3><p>${r.objet}</p></div>` : ''}
      ${r.pointsCles?.length ? `
        <div class="section">
          <h3>Points clés</h3>
          <ul>${r.pointsCles.map((p: string) => `<li>${p}</li>`).join('')}</ul>
        </div>
      ` : ''}
      ${r.decisions?.length ? `
        <div class="section">
          <h3>Décisions prises</h3>
          <ul>${r.decisions.map((d: string) => `<li>${d}</li>`).join('')}</ul>
        </div>
      ` : ''}
      ${r.actionsASuivre?.length ? `
        <div class="section">
          <h3>Actions à suivre</h3>
          <table>
            <tr><th>Action</th><th>Responsable</th><th>Échéance</th></tr>
            ${r.actionsASuivre.map((a: any) => `<tr><td>${a.action}</td><td>${a.responsable}</td><td>${a.echeance || '—'}</td></tr>`).join('')}
          </table>
        </div>
      ` : ''}
      ${r.synthese ? `<div class="section"><h3>Synthèse</h3><p>${r.synthese}</p></div>` : ''}
      ${r.motifsAlerte?.length ? `
        <div class="section alert">
          <h3>⚠ Alertes</h3>
          <ul>${r.motifsAlerte.map((m: string) => `<li>${m}</li>`).join('')}</ul>
        </div>
      ` : ''}
    `
  } else if (entretien.traitementType === 'BILAN_PATRIMONIAL' && entretien.traitementResultat) {
    const r = entretien.traitementResultat
    contentHTML = `
      <h2>Bilan patrimonial</h2>
      ${r.situationFamiliale ? `
        <div class="section">
          <h3>Situation familiale</h3>
          <table>
            ${Object.entries(r.situationFamiliale).filter(([_, v]) => v != null).map(([k, v]) => `<tr><td>${k}</td><td><strong>${String(v)}</strong></td></tr>`).join('')}
          </table>
        </div>
      ` : ''}
      ${r.patrimoine ? `
        <div class="section">
          <h3>Patrimoine</h3>
          <div class="kpi-row">
            ${r.patrimoine.totalBrut != null ? `<div class="kpi"><span>Brut</span><strong>${Number(r.patrimoine.totalBrut).toLocaleString('fr-FR')} €</strong></div>` : ''}
            ${r.patrimoine.totalDettes != null ? `<div class="kpi red"><span>Dettes</span><strong>${Number(r.patrimoine.totalDettes).toLocaleString('fr-FR')} €</strong></div>` : ''}
            ${r.patrimoine.totalNet != null ? `<div class="kpi green"><span>Net</span><strong>${Number(r.patrimoine.totalNet).toLocaleString('fr-FR')} €</strong></div>` : ''}
          </div>
          ${r.patrimoine.immobilier?.length ? `
            <h4>Immobilier</h4>
            <table>
              <tr><th>Type</th><th>Valeur</th></tr>
              ${r.patrimoine.immobilier.map((b: any) => `<tr><td>${b.type}</td><td>${Number(b.valeur).toLocaleString('fr-FR')} €</td></tr>`).join('')}
            </table>
          ` : ''}
          ${r.patrimoine.financier?.length ? `
            <h4>Financier</h4>
            <table>
              <tr><th>Type</th><th>Montant</th></tr>
              ${r.patrimoine.financier.map((b: any) => `<tr><td>${b.type}</td><td>${Number(b.montant).toLocaleString('fr-FR')} €</td></tr>`).join('')}
            </table>
          ` : ''}
        </div>
      ` : ''}
      ${r.objectifs?.priorites?.length ? `
        <div class="section">
          <h3>Objectifs</h3>
          <ul>${r.objectifs.priorites.map((o: string) => `<li>${o}</li>`).join('')}</ul>
        </div>
      ` : ''}
      ${r.preconisationsPreliminaires?.length ? `
        <div class="section">
          <h3>Préconisations préliminaires</h3>
          ${r.preconisationsPreliminaires.map((p: any) => `
            <div class="preco">
              <div class="preco-header"><span class="badge">${p.priorite || 'moyenne'}</span> ${p.categorie ? `<span class="badge secondary">${p.categorie}</span>` : ''}</div>
              <strong>${p.titre}</strong>
              <p>${p.description}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${r.informationsManquantes?.length ? `
        <div class="section warning">
          <h3>Informations manquantes</h3>
          <ul>${r.informationsManquantes.map((m: string) => `<li>${m}</li>`).join('')}</ul>
        </div>
      ` : ''}
      ${r.scoreCompletude != null ? `
        <div class="section center">
          <p>Score de complétude du bilan</p>
          <div class="score">${r.scoreCompletude}/100</div>
        </div>
      ` : ''}
    `
  } else {
    // No treatment — show transcription
    const segments = Array.isArray(entretien.transcription) ? entretien.transcription : []
    contentHTML = `
      <h2>Transcription de l'entretien</h2>
      <div class="transcription">
        ${segments.map((s: any) => {
          const mins = Math.floor(s.timestamp / 60000)
          const secs = Math.floor((s.timestamp % 60000) / 1000)
          return `<div class="segment ${s.speaker}"><span class="time">${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}</span><span class="speaker-label">${s.speaker === 'conseiller' ? 'Conseiller' : 'Client'}</span><p>${s.text}</p></div>`
        }).join('')}
      </div>
    `
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11pt; color: #1a1a2e; line-height: 1.6; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #4338ca; }
  .header h1 { font-size: 18pt; color: #4338ca; margin-bottom: 4px; }
  .header .subtitle { color: #64748b; font-size: 10pt; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px; }
  .meta-item { background: #f8fafc; padding: 10px 14px; border-radius: 6px; border-left: 3px solid #4338ca; }
  .meta-item .label { font-size: 9pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-item .value { font-weight: 600; margin-top: 2px; }
  h2 { font-size: 16pt; color: #1e293b; margin: 24px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
  h3 { font-size: 12pt; color: #334155; margin: 16px 0 8px; }
  h4 { font-size: 10pt; color: #475569; margin: 12px 0 6px; }
  .section { margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 10pt; }
  th { background: #f1f5f9; font-weight: 600; color: #475569; }
  ul { padding-left: 20px; }
  li { margin-bottom: 6px; }
  .kpi-row { display: flex; gap: 12px; margin: 12px 0; }
  .kpi { flex: 1; text-align: center; padding: 12px; background: #eff6ff; border-radius: 6px; }
  .kpi span { font-size: 9pt; color: #3b82f6; }
  .kpi strong { display: block; font-size: 14pt; color: #1d4ed8; }
  .kpi.red { background: #fef2f2; }
  .kpi.red span { color: #dc2626; }
  .kpi.red strong { color: #b91c1c; }
  .kpi.green { background: #f0fdf4; }
  .kpi.green span { color: #16a34a; }
  .kpi.green strong { color: #15803d; }
  .preco { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; margin-bottom: 8px; }
  .preco-header { margin-bottom: 4px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 8pt; font-weight: 600; background: #fef3c7; color: #92400e; margin-right: 4px; }
  .badge.secondary { background: #f1f5f9; color: #475569; }
  .alert { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; }
  .alert h3 { color: #dc2626; }
  .warning { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 12px; }
  .warning h3 { color: #c2410c; }
  .center { text-align: center; }
  .score { font-size: 24pt; font-weight: 700; color: #4338ca; }
  .transcription { margin-top: 12px; }
  .segment { padding: 8px 12px; margin-bottom: 6px; border-radius: 8px; }
  .segment.conseiller { background: #eef2ff; border-left: 3px solid #4338ca; }
  .segment.client { background: #f8fafc; border-left: 3px solid #94a3b8; }
  .segment .time { font-size: 9pt; color: #94a3b8; margin-right: 8px; font-family: monospace; }
  .segment .speaker-label { font-size: 9pt; font-weight: 600; color: #475569; }
  .segment p { margin-top: 2px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 8pt; color: #94a3b8; text-align: center; }
  .consent-banner { background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; margin-bottom: 20px; font-size: 9pt; color: #854d0e; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${entretien.titre || 'Entretien client'}</h1>
      <div class="subtitle">${typeLabels[entretien.type] || entretien.type}</div>
    </div>
    <div style="text-align: right; font-size: 9pt; color: #64748b;">
      <div>Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-item"><div class="label">Client</div><div class="value">${clientName}</div></div>
    <div class="meta-item"><div class="label">Conseiller</div><div class="value">${conseillerName}</div></div>
    <div class="meta-item"><div class="label">Date de l'entretien</div><div class="value">${dateStr}</div></div>
    <div class="meta-item"><div class="label">Durée</div><div class="value">${dureeStr}</div></div>
  </div>

  ${entretien.consentementRecueilli ? `
    <div class="consent-banner">
      ✅ Consentement RGPD recueilli le ${entretien.consentementDate ? new Date(entretien.consentementDate).toLocaleDateString('fr-FR') : dateStr}
    </div>
  ` : ''}

  ${contentHTML}

  <div class="footer">
    <p>Document généré automatiquement — Entretien enregistré et transcrit avec l'accord du client.</p>
    <p>L'enregistrement audio n'a pas été conservé. Conformément au RGPD, le client peut demander la suppression de cette transcription.</p>
  </div>
</body>
</html>`
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Invalid user type', 400)

    const { id } = await params
    const service = new EntretienService(context.cabinetId, user.id, context.isSuperAdmin)
    const entretien = await service.getEntretien(id)

    const html = generateEntretienHTML(entretien)

    // Return HTML for client-side PDF generation (using print or a PDF lib)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="entretien-${id}.html"`,
      },
    })
  } catch (error) {
    logger.error('Error in POST /api/advisor/entretiens/[id]/pdf:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') return createErrorResponse('Unauthorized', 401)
    if (error instanceof Error && error.message === 'Entretien non trouvé') return createErrorResponse('Entretien non trouvé', 404)
    return createErrorResponse('Internal server error', 500)
  }
}
