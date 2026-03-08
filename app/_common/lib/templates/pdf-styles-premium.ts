/**
 * Styles CSS Premium pour les rapports PDF — WeasyPrint
 * Utilise les règles @page CSS Paged Media Level 3 natives
 */

export const premiumReportStyles = `
  :root {
    --primary: #0f172a;
    --primary-light: #1e293b;
    --accent: #3b82f6;
    --accent-solid: #3b82f6;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    --text: #1e293b;
    --text-muted: #64748b;
    --text-light: #94a3b8;
    --border: #e2e8f0;
    --bg-light: #f8fafc;
    --bg-card: #ffffff;
  }
  
  * { margin: 0; padding: 0; box-sizing: border-box; }

  /* ================================================================
     @page — WeasyPrint CSS Paged Media
     ================================================================ */

  @page {
    size: 210mm 297mm;
    margin: 18mm 14mm 20mm 14mm;

    @bottom-left {
      content: string(footer-label, first);
      font-size: 7.5pt;
      color: #94a3b8;
    }

    @bottom-right {
      content: "Page " counter(page) " / " counter(pages);
      font-size: 7.5pt;
      color: #94a3b8;
    }
  }

  /* Page de couverture : plein bord, aucune marge, pas de footer */
  @page cover-page {
    margin: 0;
    @bottom-left { content: none; }
    @bottom-right { content: none; }
  }

  /* Pages de contenu : héritent de @page par défaut */
  @page content {
    /* marges et footer hérités de @page */
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.6;
    color: var(--text);
    background: white;
    -webkit-print-color-adjust: exact;
  }
  
  .page {
    padding: 0;
    position: relative;
  }

  /* Saut de page uniquement pour les grands chapitres */
  .chapter-break {
    break-before: page;
  }

  /* Répétition des en-têtes de tableau sur chaque page */
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  
  /* COVER PAGE — named page for zero-margin full bleed */
  .cover {
    page: cover-page;
    break-before: auto;
    min-height: 297mm;
    background: #0f172a;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: visible;
  }
  
  /* Subtle decorative accent line on cover */
  .cover-accent {
    position: absolute;
    top: 0;
    right: 0;
    width: 40%;
    height: 4px;
    background: #3b82f6;
  }
  
  .cover-header {
    padding: 40px 50px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
    z-index: 1;
  }
  
  .cover-logo {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }
  
  .cover-logo-icon {
    width: 48px;
    height: 48px;
    background: var(--accent-solid);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20pt;
    font-weight: 800;
    color: white;
  }
  
  .cover-logo-text {
    color: white;
    font-size: 14pt;
    font-weight: 700;
    letter-spacing: -0.5px;
    white-space: nowrap;
  }
  
  .cover-date {
    color: rgba(255,255,255,0.6);
    font-size: 10pt;
  }
  
  .cover-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 50px 60px;
    position: relative;
    z-index: 1;
  }
  
  .cover-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #60a5fa;
    padding: 8px 16px;
    border-radius: 100px;
    font-size: 9pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 24px;
  }
  
  .cover-title {
    color: white;
    font-size: 42pt;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -1.5px;
    margin-bottom: 16px;
    max-width: 500px;
  }
  
  .cover-subtitle {
    color: rgba(255,255,255,0.7);
    font-size: 14pt;
    font-weight: 400;
    max-width: 450px;
    line-height: 1.5;
  }
  
  .cover-client-card {
    margin-top: 50px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 30px;
    max-width: 400px;
  }
  
  .cover-client-label {
    color: rgba(255,255,255,0.5);
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  
  .cover-client-name {
    color: white;
    font-size: 18pt;
    font-weight: 700;
    margin-bottom: 4px;
  }
  
  .cover-client-info {
    color: rgba(255,255,255,0.6);
    font-size: 10pt;
  }
  
  .cover-footer {
    padding: 30px 50px;
    border-top: 1px solid rgba(255,255,255,0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 1;
  }
  
  .cover-footer-item {
    color: rgba(255,255,255,0.5);
    font-size: 9pt;
  }
  
  .cover-footer-value {
    color: white;
    font-weight: 600;
  }
  
  /* CONTENT PAGES — named page with running footer via @page margin box */
  .content-page {
    page: content;
    string-set: footer-label attr(data-page-label);
    padding: 24px 0 24px 0;
    background: var(--bg-light);
    position: relative;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 3px solid var(--primary);
  }
  
  .page-title {
    font-size: 22pt;
    font-weight: 800;
    color: var(--primary);
    letter-spacing: -0.5px;
  }
  
  .page-number {
    background: var(--primary);
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 11pt;
  }
  
  /* SECTIONS */
  .section { margin-bottom: 32px; }
  
  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }
  
  .section-icon {
    width: 40px;
    height: 40px;
    background: var(--accent-solid);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 16pt;
  }
  
  .section-title {
    font-size: 14pt;
    font-weight: 700;
    color: var(--primary);
  }
  
  .section-subtitle {
    font-size: 10pt;
    color: var(--text-muted);
  }
  
  /* CARDS */
  .card {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid #f1f5f9;
    margin-bottom: 16px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .card-title {
    font-size: 11pt;
    font-weight: 600;
    color: var(--text);
  }
  
  .card-badge {
    font-size: 8pt;
    padding: 4px 10px;
    border-radius: 100px;
    font-weight: 600;
  }
  
  .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success); }
  .badge-warning { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
  .badge-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
  
  /* STATS GRID */
  .stats-row {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .stat-card {
    flex: 1;
    background: var(--bg-card);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid #f1f5f9;
    position: relative;
    overflow: hidden;
  }
  
  .stat-card.highlight {
    background: var(--accent-solid);
    color: white;
  }
  
  .stat-card.highlight .stat-label,
  .stat-card.highlight .stat-change {
    color: rgba(255,255,255,0.8);
  }
  
  .stat-icon {
    width: 44px;
    height: 44px;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }
  
  .stat-card.highlight .stat-icon {
    background: rgba(255,255,255,0.2);
  }
  
  .stat-label {
    font-size: 9pt;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 22pt;
    font-weight: 800;
    letter-spacing: -1px;
    margin-bottom: 4px;
  }
  
  .stat-change {
    font-size: 9pt;
    color: var(--text-muted);
  }
  
  .stat-change.positive { color: var(--success); }
  .stat-change.negative { color: var(--danger); }
  
  /* TABLES */
  .table-container {
    background: var(--bg-card);
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #f1f5f9;
  }
  
  .table-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .table-title {
    font-size: 12pt;
    font-weight: 700;
    color: var(--primary);
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th {
    background: var(--bg-light);
    padding: 14px 24px;
    text-align: left;
    font-size: 9pt;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--border);
  }
  
  td {
    padding: 16px 24px;
    font-size: 10pt;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }
  
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--bg-light); }
  
  .td-main { font-weight: 600; color: var(--primary); }
  .td-sub { font-size: 9pt; color: var(--text-muted); }
  .td-amount { font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }
  .td-amount.positive { color: var(--success); }
  .td-amount.negative { color: var(--danger); }
  
  .table-footer { background: var(--primary); color: white; }
  .table-footer td { padding: 16px 24px; font-weight: 700; border: none; }
  
  /* CHARTS */
  .chart-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 20px;
    justify-content: center;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 9pt;
  }
  
  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  
  /* PRECONISATIONS */
  .preco-card {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 16px;
    border: 1px solid #f1f5f9;
    border-left: 4px solid var(--accent);
    position: relative;
  }
  
  .preco-card.priority-high { border-left: 4px solid var(--danger); }
  .preco-card.priority-medium { border-left: 4px solid var(--warning); }
  .preco-card.priority-low { border-left: 4px solid var(--success); }
  
  .preco-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  
  .preco-number {
    width: 28px;
    height: 28px;
    background: var(--accent-solid);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 11pt;
    margin-right: 12px;
    flex-shrink: 0;
  }
  
  .preco-title {
    font-size: 12pt;
    font-weight: 700;
    color: var(--primary);
    flex: 1;
  }
  
  .preco-priority {
    font-size: 8pt;
    padding: 4px 12px;
    border-radius: 100px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .priority-high { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
  .priority-medium { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
  .priority-low { background: rgba(16, 185, 129, 0.1); color: var(--success); }
  
  .preco-description {
    color: var(--text-muted);
    font-size: 10pt;
    line-height: 1.6;
    margin-bottom: 16px;
  }
  
  .preco-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }
  
  .preco-detail { display: flex; flex-direction: column; gap: 4px; }
  .preco-detail-label { font-size: 8pt; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; }
  .preco-detail-value { font-size: 10pt; font-weight: 600; color: var(--primary); }
  
  .preco-benefits {
    background: rgba(16, 185, 129, 0.05);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 12px;
    padding: 16px;
    margin-top: 16px;
  }
  
  .preco-benefits-title {
    font-size: 9pt;
    font-weight: 600;
    color: var(--success);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .preco-benefits-text { font-size: 10pt; color: var(--text); line-height: 1.5; }
  
  /* SIGNATURE */
  .signature-section { margin-top: 60px; }
  
  .signature-intro {
    background: var(--bg-light);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 40px;
    font-size: 10pt;
    color: var(--text-muted);
    line-height: 1.6;
  }
  
  .signature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
  }
  
  .signature-box { text-align: center; }
  
  .signature-role {
    font-size: 9pt;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 60px;
  }
  
  .signature-line { border-bottom: 1px solid var(--border); margin-bottom: 12px; }
  .signature-name { font-size: 11pt; font-weight: 600; color: var(--primary); }
  .signature-date { font-size: 9pt; color: var(--text-muted); margin-top: 8px; }
  
  /* UTILITIES */
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-2 { gap: 8px; }
  .gap-4 { gap: 16px; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-bold { font-weight: 700; }
  .font-medium { font-weight: 500; }
  .text-sm { font-size: 9pt; }
  .text-lg { font-size: 14pt; }
  .text-xl { font-size: 18pt; }
  .text-muted { color: var(--text-muted); }
  .text-success { color: var(--success); }
  .text-danger { color: var(--danger); }
  .mb-2 { margin-bottom: 8px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-6 { margin-bottom: 24px; }
  .mt-auto { margin-top: auto; }
  .w-full { width: 100%; }

  /* ============================================================
     RÈGLES DE PAGINATION — WeasyPrint CSS Paged Media
     Document imprimé professionnel — Cabinet CGP
     ============================================================ */

  /* ---- Reset global : aucun break automatique ---- */
  section, article, div, h1, h2, h3 {
    break-before: auto;
    break-after: auto;
  }

  /* ---- Grands conteneurs : autoriser la coupure ---- */
  .page,
  .section,
  .stats-row,
  .table-container,
  .chart-container,
  .resultats-grid,
  .detail-actifs,
  .bloc-resultat,
  .content-page {
    break-inside: auto;
  }

  /* ---- Petits blocs atomiques : ne jamais couper ---- */
  .card,
  .stat-card,
  .preco-card,
  .encadre,
  .encadre-recommandation,
  .signature-section,
  .toc-item {
    break-inside: avoid;
  }

  /* ---- Titres : ne jamais laisser orphelin en bas de page ---- */
  .page-header {
    break-inside: avoid;
    break-after: avoid;
  }

  h1, h2, h3,
  .page-title,
  .section-title,
  .section-header,
  .subsection-title {
    break-after: avoid;
  }

  /* ---- Garder le titre avec le premier bloc qui suit ---- */
  .section-header + .card,
  .section-header + .stats-row,
  .section-header + .table-container,
  .section-header + div,
  .page-header + .section,
  .page-header + .card,
  .page-header + div {
    break-before: avoid;
  }

  /* ---- Tables : laisser couper, répéter le header ---- */
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    break-inside: auto;
  }

  tr {
    break-inside: avoid;
  }

  th, td {
    padding: 5px 7px;
    vertical-align: top;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  /* ---- Graphiques print-safe ---- */
  .chart-block {
    width: 100%;
    max-width: 170mm;
    margin: 0 auto 6mm auto;
    break-inside: avoid;
  }

  .chart-block img,
  .chart-block svg,
  .chart-block canvas {
    display: block;
    width: 100%;
    max-width: 100%;
    height: auto;
    max-height: 85mm;
  }

  img, svg, canvas {
    max-width: 100%;
    height: auto;
  }

  svg {
    max-width: 100%;
    height: auto;
  }

  /* ---- Veuves et orphelins ---- */
  p {
    widows: 3;
    orphans: 3;
  }

  /* ---- Saut de page explicite (usage manuel uniquement) ---- */
  .page-break-before {
    break-before: page;
  }

  /* ============================================================
     SOMMAIRE (TOC)
     ============================================================ */

  .toc-section {
    break-before: page;
  }

  .toc-section .page-header {
    break-after: avoid;
    margin-bottom: 6mm;
  }

  .toc-intro {
    break-after: avoid;
  }

  .toc-list {
    break-inside: auto;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .toc-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 0;
    border-bottom: 1px solid #f1f5f9;
  }

  .toc-num {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 8pt;
    font-weight: 800;
    flex-shrink: 0;
  }

  .toc-label {
    flex: 1;
  }

  .toc-label-title {
    font-size: 11pt;
    font-weight: 700;
    color: #0f172a;
  }

  .toc-label-desc {
    font-size: 8.5pt;
    color: #64748b;
    margin-top: 2px;
  }

  .toc-note {
    margin-top: 24px;
    padding: 16px;
    background: rgba(59,130,246,0.04);
    border: 1px solid rgba(59,130,246,0.15);
    border-radius: 12px;
  }

  /* ============================================================
     ENVELOPPES FISCALES — grid 2 colonnes
     ============================================================ */

  .envelopes-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }

  .envelopes-grid > .card {
    break-inside: avoid;
  }

  /* ============================================================
     GRAPHIQUE RETRAITE — labels print-safe
     ============================================================ */

  .projection-chart-container {
    break-inside: avoid;
    margin-bottom: 14px;
  }

  .projection-chart-container svg {
    max-height: 170px;
    width: 100%;
  }

  .projection-chart-container svg text {
    font-size: 7pt;
  }

  /* ============================================================
     FOOTER HTML — masqué (remplacé par @page native)
     ============================================================ */

  .footer,
  .doc-footer,
  .fixed-footer {
    display: none !important;
  }

  /* STRING-SET pour le footer @page — défini dans .content-page ci-dessus (ligne ~239) */

  /* ============================================================
     ENCADRÉS MÉTIER — Composants standardisés
     ============================================================ */

  .encadre {
    break-inside: avoid;
    margin-bottom: 16px;
    border-radius: 12px;
    padding: 20px 24px;
  }

  .encadre .card-header {
    margin-bottom: 8px;
  }

  .encadre .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11pt;
  }

  /* ============================================================
     SOUS-SECTIONS
     ============================================================ */

  .subsection-title {
    font-size: 11pt;
    font-weight: 700;
    color: var(--primary);
    margin: 20px 0 12px 0;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
    break-after: avoid;
  }

  /* ============================================================
     ANNEXES — En-têtes spécifiques
     ============================================================ */

  .annexe-header {
    break-before: page;
  }

  .annexe-header .page-title {
    font-size: 18pt;
    color: var(--text-muted);
  }

  .annexe-header .annexe-subtitle {
    font-size: 14pt;
    color: var(--primary);
    font-weight: 700;
    margin-top: 4px;
  }

  /* ============================================================
     GRILLES DE CONTENU — Layouts réutilisables
     ============================================================ */

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .grid-2 > *,
  .grid-3 > * {
    break-inside: avoid;
  }

  /* ============================================================
     INTRO / CONTEXTE — Bloc d'introduction standardisé
     ============================================================ */

  .intro-block {
    background: var(--bg-light);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid var(--border);
    break-inside: avoid;
  }

  .intro-block p {
    font-size: 10pt;
    color: var(--text);
    line-height: 1.7;
    margin-bottom: 8px;
  }

  .intro-block p:last-child {
    margin-bottom: 0;
  }

  /* ============================================================
     HIGHLIGHT METRIC — Chiffre clé mis en exergue
     ============================================================ */

  .metric-highlight {
    text-align: center;
    padding: 20px;
    background: var(--bg-card);
    border-radius: 16px;
    border: 1px solid #f1f5f9;
    break-inside: avoid;
  }

  .metric-highlight .metric-label {
    font-size: 9pt;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  .metric-highlight .metric-value {
    font-size: 26pt;
    font-weight: 800;
    color: var(--primary);
    letter-spacing: -1px;
    line-height: 1;
  }

  .metric-highlight .metric-sub {
    font-size: 9pt;
    color: var(--text-muted);
    margin-top: 6px;
  }

  .metric-highlight.metric-success .metric-value { color: var(--success); }
  .metric-highlight.metric-danger .metric-value { color: var(--danger); }
  .metric-highlight.metric-warning .metric-value { color: var(--warning); }
  .metric-highlight.metric-accent .metric-value { color: var(--accent); }
`

// ============================================================================
// CHART GENERATORS — SVG inline pour PDF professionnel
// ============================================================================

const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
const fmtNum = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)

/**
 * Donut chart premium avec légende intégrée et total central
 */
export function generateDonutChart(
  data: Array<{ label: string; value: number; color: string }>,
  size: number = 180,
  strokeWidth: number = 24,
  options?: { centerLabel?: string; centerValue?: string; showLegend?: boolean }
): string {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return '<div style="text-align:center;color:#94a3b8;font-size:9pt;padding:20px;">Aucune donnée</div>'

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  let currentOffset = 0
  const paths = data.filter(d => d.value > 0).map((item) => {
    const percentage = item.value / total
    const strokeDasharray = circumference * percentage
    const strokeDashoffset = -currentOffset
    currentOffset += strokeDasharray
    return `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${item.color}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeDasharray} ${circumference}" stroke-dashoffset="${strokeDashoffset}" transform="rotate(-90 ${center} ${center})" stroke-linecap="round"/>`
  }).join('')

  const centerText = options?.centerValue || fmtEur(total)
  const centerLabel = options?.centerLabel || 'Total'

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#f1f5f9" stroke-width="${strokeWidth}"/>
    ${paths}
    <text x="${center}" y="${center - 8}" text-anchor="middle" style="font-size: 7pt; fill: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">${centerLabel}</text>
    <text x="${center}" y="${center + 12}" text-anchor="middle" style="font-size: 13pt; font-weight: 800; fill: #0f172a;">${centerText}</text>
  </svg>`

  if (options?.showLegend === false) return svg

  const legend = data.filter(d => d.value > 0).map(d => {
    const pct = Math.round((d.value / total) * 100)
    return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
      <div style="width:10px;height:10px;border-radius:3px;background:${d.color};flex-shrink:0;"></div>
      <span style="flex:1;font-size:8pt;color:#64748b;">${d.label}</span>
      <span style="font-size:8pt;font-weight:700;color:#0f172a;">${pct}%</span>
    </div>`
  }).join('')

  return `<div style="display:flex;align-items:center;gap:24px;">
    <div style="flex-shrink:0;">${svg}</div>
    <div style="flex:1;min-width:120px;">${legend}</div>
  </div>`
}

/**
 * Barres horizontales avec labels et pourcentages
 */
export function generateHorizontalBarChart(
  data: Array<{ label: string; value: number; color: string }>,
  width: number = 400,
  barHeight: number = 20,
  gap: number = 16,
  options?: { showValues?: boolean; formatAsCurrency?: boolean; maxValue?: number }
): string {
  if (data.length === 0) return ''
  const maxVal = options?.maxValue || Math.max(...data.map(d => d.value))
  if (maxVal === 0) return ''
  const labelWidth = 100
  const valueWidth = 80
  const barAreaWidth = width - labelWidth - valueWidth - 16
  const totalHeight = data.length * (barHeight + gap) - gap + 8

  const bars = data.map((item, i) => {
    const barW = Math.max(2, (item.value / maxVal) * barAreaWidth)
    const y = i * (barHeight + gap)
    const formattedValue = options?.formatAsCurrency !== false ? fmtEur(item.value) : fmtNum(item.value)
    return `<g transform="translate(0, ${y})">
      <text x="${labelWidth - 8}" y="${barHeight / 2}" dy="0.35em" text-anchor="end" style="font-size:8pt;fill:#64748b;font-weight:500;">${item.label}</text>
      <rect x="${labelWidth}" y="2" width="${barW}" height="${barHeight - 4}" rx="4" fill="${item.color}" opacity="0.85"/>
      <rect x="${labelWidth}" y="2" width="${barW}" height="${barHeight - 4}" rx="4" fill="url(#barShine)" opacity="0.3"/>
      <text x="${labelWidth + barW + 8}" y="${barHeight / 2}" dy="0.35em" style="font-size:8pt;font-weight:700;fill:#0f172a;">${formattedValue}</text>
    </g>`
  }).join('')

  return `<svg width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
    <defs><linearGradient id="barShine" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="white" stop-opacity="0.5"/><stop offset="100%" stop-color="white" stop-opacity="0"/></linearGradient></defs>
    ${bars}
  </svg>`
}

/**
 * Gauge semi-circulaire avec label et couleur dynamique
 */
export function generateGauge(
  value: number,
  max: number = 100,
  size: number = 140,
  color?: string,
  label?: string
): string {
  const percentage = Math.min(Math.max(value / max, 0), 1)
  const autoColor = percentage >= 0.7 ? '#10b981' : percentage >= 0.45 ? '#f59e0b' : '#ef4444'
  const strokeColor = color || autoColor
  const r = (size - 20) / 2
  const cx = size / 2
  const cy = size / 2

  // Semi-circle arc
  const startAngle = Math.PI
  const endAngle = 2 * Math.PI
  const bgPath = describeArc(cx, cy, r, startAngle, endAngle)
  const valueAngle = startAngle + (endAngle - startAngle) * percentage
  const valuePath = describeArc(cx, cy, r, startAngle, valueAngle)
  const displayVal = Math.round(value)

  return `<div style="text-align:center;">
    <svg width="${size}" height="${size / 2 + 24}" viewBox="0 0 ${size} ${size / 2 + 24}">
      <path d="${bgPath}" fill="none" stroke="#f1f5f9" stroke-width="14" stroke-linecap="round"/>
      <path d="${valuePath}" fill="none" stroke="${strokeColor}" stroke-width="14" stroke-linecap="round"/>
      <text x="${cx}" y="${cy - 2}" text-anchor="middle" style="font-size:22pt;font-weight:800;fill:${strokeColor};">${displayVal}</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" style="font-size:7pt;fill:#94a3b8;font-weight:500;">/ ${max}</text>
    </svg>
    ${label ? `<div style="font-size:8pt;color:#64748b;font-weight:600;margin-top:-4px;">${label}</div>` : ''}
  </div>`
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
}

/**
 * Radar chart / spider chart pour scores multi-dimensionnels
 */
export function generateRadarChart(
  data: Array<{ label: string; score: number; maxScore?: number; color?: string }>,
  size: number = 220
): string {
  const n = data.length
  if (n < 3) return ''
  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 30

  // Grilles concentriques
  const gridLevels = [0.25, 0.5, 0.75, 1.0]
  const gridPaths = gridLevels.map(level => {
    const points = Array.from({ length: n }, (_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2
      const r = maxR * level
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
    }).join(' ')
    return `<polygon points="${points}" fill="none" stroke="#e2e8f0" stroke-width="${level === 1 ? 1.5 : 0.5}"/>`
  }).join('')

  // Axes
  const axes = data.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return `<line x1="${cx}" y1="${cy}" x2="${cx + maxR * Math.cos(angle)}" y2="${cy + maxR * Math.sin(angle)}" stroke="#e2e8f0" stroke-width="0.5"/>`
  }).join('')

  // Polygon des valeurs
  const valuePoints = data.map((d, i) => {
    const maxS = d.maxScore || 100
    const ratio = Math.min(d.score / maxS, 1)
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return `${cx + maxR * ratio * Math.cos(angle)},${cy + maxR * ratio * Math.sin(angle)}`
  }).join(' ')

  // Labels
  const labels = data.map((d, i) => {
    const maxS = d.maxScore || 100
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    const labelR = maxR + 18
    const x = cx + labelR * Math.cos(angle)
    const y = cy + labelR * Math.sin(angle)
    const anchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end'
    const scoreColor = d.score >= maxS * 0.7 ? '#10b981' : d.score >= maxS * 0.45 ? '#f59e0b' : '#ef4444'
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" dy="0.35em" style="font-size:7pt;fill:#64748b;font-weight:600;">${d.label}</text>
    <text x="${x}" y="${y + 11}" text-anchor="${anchor}" style="font-size:8pt;fill:${scoreColor};font-weight:800;">${d.score}</text>`
  }).join('')

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${gridPaths}
    ${axes}
    <polygon points="${valuePoints}" fill="rgba(99,102,241,0.15)" stroke="#6366f1" stroke-width="2" stroke-linejoin="round"/>
    ${data.map((d, i) => {
      const maxS = d.maxScore || 100
      const ratio = Math.min(d.score / maxS, 1)
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2
      const x = cx + maxR * ratio * Math.cos(angle)
      const y = cy + maxR * ratio * Math.sin(angle)
      return `<circle cx="${x}" cy="${y}" r="4" fill="white" stroke="#6366f1" stroke-width="2"/>`
    }).join('')}
    ${labels}
  </svg>`
}

/**
 * Waterfall chart pour décomposition fiscale (revenus → déductions → impôt)
 */
export function generateWaterfallChart(
  steps: Array<{ label: string; value: number; type: 'add' | 'subtract' | 'total' }>,
  width: number = 460,
  height: number = 200
): string {
  if (steps.length === 0) return ''
  const padLeft = 10
  const padRight = 10
  const padTop = 20
  const padBottom = 30
  const chartW = width - padLeft - padRight
  const chartH = height - padTop - padBottom
  const barW = Math.min(48, (chartW / steps.length) * 0.65)
  const barGap = (chartW - barW * steps.length) / (steps.length + 1)

  // Calculate running total
  let running = 0
  const bars = steps.map(s => {
    if (s.type === 'total') {
      const result = { start: 0, end: running, val: running, ...s }
      return result
    }
    const start = running
    running += s.type === 'add' ? s.value : -s.value
    return { start, end: running, val: s.type === 'add' ? s.value : -s.value, ...s }
  })

  const allValues = bars.flatMap(b => [b.start, b.end, Math.abs(b.val)])
  const maxVal = Math.max(...allValues, 1)
  const scale = chartH / (maxVal * 1.15)

  const rects = bars.map((b, i) => {
    const x = padLeft + barGap + i * (barW + barGap)
    const top = Math.min(b.start, b.end)
    const barH = Math.abs(b.end - b.start)
    const y = padTop + (maxVal * 1.15 - top - barH) * scale
    const h = Math.max(2, barH * scale)
    const color = b.type === 'total' ? '#6366f1' : b.type === 'add' ? '#10b981' : '#ef4444'
    const displayVal = b.type === 'total' ? fmtEur(b.end) : (b.type === 'add' ? '+' : '-') + fmtEur(Math.abs(b.val))

    // Connector line to next bar
    const connector = i < bars.length - 1 ? `<line x1="${x + barW}" y1="${padTop + (maxVal * 1.15 - b.end) * scale}" x2="${x + barW + barGap}" y2="${padTop + (maxVal * 1.15 - b.end) * scale}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3,3"/>` : ''

    return `<g>
      <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="3" fill="${color}" opacity="0.9"/>
      <text x="${x + barW / 2}" y="${y - 5}" text-anchor="middle" style="font-size:7pt;font-weight:700;fill:${color};">${displayVal}</text>
      <text x="${x + barW / 2}" y="${height - 6}" text-anchor="middle" style="font-size:6pt;fill:#94a3b8;font-weight:500;" transform="rotate(-20, ${x + barW / 2}, ${height - 6})">${b.label}</text>
      ${connector}
    </g>`
  }).join('')

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <line x1="${padLeft}" y1="${padTop + maxVal * 1.15 * scale}" x2="${width - padRight}" y2="${padTop + maxVal * 1.15 * scale}" stroke="#e2e8f0" stroke-width="1"/>
    ${rects}
  </svg>`
}

/**
 * Barres empilées pour comparaison actuel vs recommandé (ex: allocation)
 */
export function generateStackedComparison(
  data: Array<{ label: string; actuel: number; cible: number; color: string }>,
  width: number = 400,
  barHeight: number = 18
): string {
  if (data.length === 0) return ''
  const rowHeight = barHeight * 2 + 16
  const labelW = 90
  const barArea = width - labelW - 60
  const totalHeight = data.length * rowHeight + 8

  const rows = data.map((d, i) => {
    const y = i * rowHeight
    const actW = Math.max(2, (d.actuel / 100) * barArea)
    const cibW = Math.max(2, (d.cible / 100) * barArea)
    const ecart = d.actuel - d.cible
    const ecartColor = Math.abs(ecart) < 5 ? '#10b981' : '#f59e0b'

    return `<g transform="translate(0, ${y})">
      <text x="${labelW - 8}" y="${barHeight}" text-anchor="end" style="font-size:8pt;fill:#334155;font-weight:600;">${d.label}</text>
      <rect x="${labelW}" y="4" width="${actW}" height="${barHeight - 4}" rx="3" fill="${d.color}" opacity="0.8"/>
      <text x="${labelW + actW + 6}" y="${barHeight - 2}" style="font-size:7pt;fill:#0f172a;font-weight:700;">${d.actuel.toFixed(0)}%</text>
      <rect x="${labelW}" y="${barHeight + 4}" width="${cibW}" height="${barHeight - 4}" rx="3" fill="${d.color}" opacity="0.3"/>
      <text x="${labelW + cibW + 6}" y="${barHeight * 2}" style="font-size:7pt;fill:#94a3b8;">${d.cible.toFixed(0)}% cible</text>
      <text x="${width - 8}" y="${barHeight + 2}" text-anchor="end" style="font-size:7pt;fill:${ecartColor};font-weight:600;">${ecart > 0 ? '+' : ''}${ecart.toFixed(0)}pp</text>
    </g>`
  }).join('')

  return `<svg width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">${rows}</svg>`
}

/**
 * Mini sparkline pour projection (retraite, capital, etc.)
 */
export function generateProjectionChart(
  data: Array<{ x: number; y: number; label?: string }>,
  width: number = 400,
  height: number = 140,
  options?: { xLabel?: string; yLabel?: string; fillColor?: string; strokeColor?: string; annotations?: Array<{ x: number; label: string; color: string }> }
): string {
  if (data.length < 2) return ''
  const padL = 60
  const padR = 20
  const padT = 16
  const padB = 30
  const chartW = width - padL - padR
  const chartH = height - padT - padB

  const xMin = Math.min(...data.map(d => d.x))
  const xMax = Math.max(...data.map(d => d.x))
  const yMin = 0
  const yMax = Math.max(...data.map(d => d.y)) * 1.1 || 1

  const toX = (v: number) => padL + ((v - xMin) / (xMax - xMin || 1)) * chartW
  const toY = (v: number) => padT + chartH - ((v - yMin) / (yMax - yMin || 1)) * chartH

  const linePoints = data.map(d => `${toX(d.x)},${toY(d.y)}`).join(' ')
  const areaPoints = `${toX(data[0].x)},${toY(0)} ${linePoints} ${toX(data[data.length - 1].x)},${toY(0)}`

  const fillColor = options?.fillColor || 'rgba(99,102,241,0.1)'
  const strokeColor = options?.strokeColor || '#6366f1'

  // Y-axis labels
  const yTicks = 4
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = yMin + (yMax - yMin) * (i / yTicks)
    const y = toY(val)
    return `<text x="${padL - 8}" y="${y}" text-anchor="end" dy="0.35em" style="font-size:7pt;fill:#94a3b8;">${fmtEur(val)}</text>
    <line x1="${padL}" y1="${y}" x2="${padL + chartW}" y2="${y}" stroke="#f1f5f9" stroke-width="0.5"/>`
  }).join('')

  // X-axis labels (every 5th point or so)
  const xStep = Math.max(1, Math.floor(data.length / 6))
  const xLabels = data.filter((_, i) => i % xStep === 0 || i === data.length - 1).map(d => {
    return `<text x="${toX(d.x)}" y="${height - 6}" text-anchor="middle" style="font-size:7pt;fill:#94a3b8;">${d.label || d.x}</text>`
  }).join('')

  // Annotations
  const annotations = (options?.annotations || []).map(a => {
    const x = toX(a.x)
    return `<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + chartH}" stroke="${a.color}" stroke-width="1.5" stroke-dasharray="4,3"/>
    <text x="${x}" y="${padT - 4}" text-anchor="middle" style="font-size:6pt;fill:${a.color};font-weight:600;">${a.label}</text>`
  }).join('')

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${yLabels}
    ${xLabels}
    <polygon points="${areaPoints}" fill="${fillColor}"/>
    <polyline points="${linePoints}" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${data.length <= 20 ? data.map(d => `<circle cx="${toX(d.x)}" cy="${toY(d.y)}" r="3" fill="white" stroke="${strokeColor}" stroke-width="1.5"/>`).join('') : ''}
    ${annotations}
    ${options?.xLabel ? `<text x="${padL + chartW / 2}" y="${height}" text-anchor="middle" style="font-size:7pt;fill:#94a3b8;">${options.xLabel}</text>` : ''}
  </svg>`
}

/**
 * KPI card HTML avec icône, valeur, et indicateur de tendance
 */
export function generateKpiCard(
  label: string,
  value: string,
  options?: { sublabel?: string; color?: string; bgColor?: string; icon?: string; trend?: 'up' | 'down' | 'neutral'; trendLabel?: string }
): string {
  const color = options?.color || '#0f172a'
  const bg = options?.bgColor || '#f8fafc'
  const trendIcon = options?.trend === 'up' ? '↑' : options?.trend === 'down' ? '↓' : ''
  const trendColor = options?.trend === 'up' ? '#10b981' : options?.trend === 'down' ? '#ef4444' : '#94a3b8'

  return `<div style="background:${bg};border-radius:14px;padding:18px 16px;text-align:center;position:relative;overflow:hidden;">
    ${options?.icon ? `<div style="font-size:18pt;margin-bottom:6px;">${options.icon}</div>` : ''}
    <div style="font-size:7pt;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:6px;">${label}</div>
    <div style="font-size:18pt;font-weight:800;color:${color};letter-spacing:-0.5px;line-height:1;">${value}</div>
    ${options?.sublabel ? `<div style="font-size:7pt;color:#94a3b8;margin-top:4px;">${options.sublabel}</div>` : ''}
    ${options?.trendLabel ? `<div style="font-size:7pt;color:${trendColor};font-weight:600;margin-top:4px;">${trendIcon} ${options.trendLabel}</div>` : ''}
  </div>`
}

/**
 * Score badge coloré
 */
export function generateScoreBadge(score: number, max: number = 100, size: 'sm' | 'md' | 'lg' = 'md'): string {
  const pct = score / max
  const color = pct >= 0.7 ? '#10b981' : pct >= 0.45 ? '#f59e0b' : '#ef4444'
  const bg = pct >= 0.7 ? 'rgba(16,185,129,0.1)' : pct >= 0.45 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'
  const label = pct >= 0.7 ? 'Bon' : pct >= 0.45 ? 'Attention' : 'Critique'
  const fontSize = size === 'lg' ? '28pt' : size === 'md' ? '20pt' : '14pt'
  const padding = size === 'lg' ? '20px 24px' : size === 'md' ? '14px 18px' : '8px 12px'

  return `<div style="display:inline-flex;flex-direction:column;align-items:center;background:${bg};border-radius:14px;padding:${padding};">
    <span style="font-size:${fontSize};font-weight:900;color:${color};line-height:1;">${score}</span>
    <span style="font-size:7pt;color:${color};font-weight:600;margin-top:4px;">${label}</span>
  </div>`
}

export default premiumReportStyles
