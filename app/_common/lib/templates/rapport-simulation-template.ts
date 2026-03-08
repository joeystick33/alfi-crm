/* eslint-disable @typescript-eslint/no-explicit-any */
import { PdfDocumentBuilder } from './pdf-document-builder'
import {
  renderKeyValueTable,
  renderEncadreList,
  renderEncadre,
  renderTable,
  type TableColumn,
} from './pdf-components'
import { fmtEur, fmtValeurUnite } from './pdf-utils'

export interface RapportSimulationData {
  reference: string
  date: Date
  type: 'CREDIT_IMMOBILIER' | 'PTZ' | 'ENVELOPPE_FISCALE' | 'RETRAITE' | 'SUCCESSION' | 'INVESTISSEMENT' | 'AUTRE'
  titre: string
  client: {
    nom: string
    prenom: string
    email?: string
  }
  conseiller?: {
    nom: string
    prenom: string
  }
  cabinet?: {
    nom: string
    adresse?: string
  }
  parametres: Array<{
    label: string
    valeur: string | number
    unite?: string
  }>
  resultats: Array<{
    label: string
    valeur: string | number
    unite?: string
    important?: boolean
  }>
  graphique?: {
    type: 'bar' | 'line' | 'pie'
    data: Array<{ label: string; value: number; color?: string }>
  }
  echeancier?: Array<{
    periode: string
    capital?: number
    interets?: number
    assurance?: number
    mensualite?: number
    capitalRestant?: number
  }>
  avertissements?: string[]
  notes?: string
}

function getSimulationBadge(type: string): string {
  switch (type) {
    case 'CREDIT_IMMOBILIER': return '🏠 Simulation'
    case 'PTZ': return '🏡 Simulation'
    case 'ENVELOPPE_FISCALE': return '📊 Simulation'
    case 'RETRAITE': return '👴 Simulation'
    case 'SUCCESSION': return '📜 Simulation'
    case 'INVESTISSEMENT': return '📈 Simulation'
    default: return '🧮 Simulation'
  }
}

export function generateRapportSimulationHtml(data: RapportSimulationData): string {
  const builder = new PdfDocumentBuilder()

  // 1. Couverture
  builder.setCover({
    titre: data.titre,
    sousTitre: 'Résultats de simulation personnalisée',
    badge: getSimulationBadge(data.type),
    clientNom: `${data.client.prenom} ${data.client.nom}`,
    clientInfo: `Référence : ${data.reference}`,
    cabinetNom: data.cabinet?.nom || 'Cabinet de Conseil',
    date: data.date,
    reference: data.reference,
    conseillerNom: data.conseiller ? `${data.conseiller.prenom} ${data.conseiller.nom}` : undefined,
  })

  // 2. Chapitre : Paramètres & Résultats
  const parametresHtml = renderKeyValueTable(
    data.parametres.map(p => ({
      label: p.label,
      valeur: typeof p.valeur === 'number' ? p.valeur : String(p.valeur),
      unite: p.unite,
      important: false,
    })),
    { titre: '📥 Paramètres de la simulation' }
  )

  const resultatsHtml = renderKeyValueTable(
    data.resultats.map(r => ({
      label: r.label,
      valeur: typeof r.valeur === 'number' ? r.valeur : String(r.valeur),
      unite: r.unite,
      important: r.important,
    })),
    { titre: '📊 Résultats' }
  )

  const avertissementsHtml = data.avertissements && data.avertissements.length > 0
    ? renderEncadreList('attention', 'Points d\'attention', data.avertissements)
    : ''

  builder.addChapter('Détail de la Simulation', `
    <div class="section">${parametresHtml}</div>
    <div class="section">${resultatsHtml}</div>
    ${avertissementsHtml}
  `)

  // 3. Chapitre : Échéancier (si présent)
  if (data.echeancier && data.echeancier.length > 0) {
    const first = data.echeancier[0]
    const columns: TableColumn[] = [
      { key: 'periode', label: 'Période', width: '20%' },
    ]
    if (first.capital !== undefined) columns.push({ key: 'capital', label: 'Capital', align: 'right', format: (v: number) => fmtEur(v) })
    if (first.interets !== undefined) columns.push({ key: 'interets', label: 'Intérêts', align: 'right', format: (v: number) => fmtEur(v) })
    if (first.assurance !== undefined) columns.push({ key: 'assurance', label: 'Assurance', align: 'right', format: (v: number) => fmtEur(v) })
    if (first.mensualite !== undefined) columns.push({ key: 'mensualite', label: 'Mensualité', align: 'right', format: (v: number) => fmtEur(v) })
    if (first.capitalRestant !== undefined) columns.push({ key: 'capitalRestant', label: 'Capital restant', align: 'right', format: (v: number) => fmtEur(v) })

    const echeancierHtml = renderTable(columns, data.echeancier, {
      titre: '📅 Tableau d\'amortissement',
      maxRows: 25,
      showOverflowMessage: true,
    })

    builder.addChapter('Échéancier', `<div class="section">${echeancierHtml}</div>`)
  }

  // 4. Chapitre : Informations importantes
  const notesHtml = data.notes
    ? renderEncadre({ type: 'commentaire', titre: 'Notes du conseiller', contenu: `<p style="color: #475569; line-height: 1.7;">${data.notes}</p>` })
    : ''

  builder.addChapter('Informations importantes', `
    ${notesHtml}
  `)

  // 5. Mentions finales
  builder.setMentions({
    cabinetNom: data.cabinet?.nom || 'Cabinet de Conseil',
    cabinetAdresse: data.cabinet?.adresse,
    reference: data.reference,
    date: new Date(),
    mentions: [
      'Avertissement : Cette simulation est fournie à titre indicatif et ne constitue pas une offre de prêt ni un engagement contractuel. Les résultats présentés sont basés sur les paramètres renseignés et peuvent varier en fonction de l\'évolution des taux et des conditions du marché.',
      'Les informations contenues dans ce document ne constituent pas un conseil en investissement personnalisé. Avant toute décision, nous vous recommandons de consulter un professionnel qualifié.',
    ],
  })

  return builder.build()
}

export default generateRapportSimulationHtml
