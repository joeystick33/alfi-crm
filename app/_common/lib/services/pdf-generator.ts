/* eslint-disable @typescript-eslint/no-explicit-any */
import { execFile } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const execFileAsync = promisify(execFile)

export interface PdfGeneratorOptions {
  format?: 'A4' | 'Letter'
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  headerTemplate?: string
  footerTemplate?: string
  displayHeaderFooter?: boolean
  printBackground?: boolean
}

// WeasyPrint binary — configurable via env for production
const WEASYPRINT_BIN = process.env.WEASYPRINT_BIN
  || path.join(os.homedir(), 'Library/Python/3.9/bin/weasyprint')

// macOS Homebrew library path for WeasyPrint native dependencies (Pango, GLib, Cairo)
const HOMEBREW_LIB = '/opt/homebrew/lib'

const WEASYPRINT_TIMEOUT_MS = 120_000

export class PdfGenerator {
  /**
   * Génère un PDF à partir de HTML en utilisant WeasyPrint.
   *
   * WeasyPrint gère nativement :
   * - @page (taille, marges, en-tête/pied)
   * - break-inside: avoid / break-before: page
   * - thead { display: table-header-group } (répétition en-têtes)
   * - linear-gradient, SVG inline, CSS Grid, Flexbox
   *
   * Aucun chunking nécessaire — WeasyPrint n'a pas les limites du print engine Chromium.
   */
  static async generateFromHtml(
    html: string,
    _options: PdfGeneratorOptions = {}
  ): Promise<Buffer> {
    const tmpDir = os.tmpdir()
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const htmlFile = path.join(tmpDir, `pdf-in-${id}.html`)
    const pdfFile = path.join(tmpDir, `pdf-out-${id}.pdf`)

    try {
      fs.writeFileSync(htmlFile, html, 'utf-8')
      console.log(`[PDF] WeasyPrint input: ${(html.length / 1024).toFixed(1)} KB → ${htmlFile}`)

      const env: Record<string, string> = { ...process.env as Record<string, string> }
      // macOS: WeasyPrint needs Homebrew libs (libgobject, libpango, libcairo)
      if (process.platform === 'darwin') {
        env.DYLD_LIBRARY_PATH = env.DYLD_LIBRARY_PATH
          ? `${HOMEBREW_LIB}:${env.DYLD_LIBRARY_PATH}`
          : HOMEBREW_LIB
      }

      const startMs = Date.now()
      const result = await execFileAsync(
        WEASYPRINT_BIN,
        [htmlFile, pdfFile],
        { env, timeout: WEASYPRINT_TIMEOUT_MS, maxBuffer: 50 * 1024 * 1024 } as any
      )
      const stderr = String(result.stderr || '')

      if (stderr) {
        // WeasyPrint logs font/CSS warnings to stderr — non-fatal
        const lines = stderr.split('\n').filter(l => l.trim()).slice(0, 5)
        if (lines.length > 0) {
          console.warn(`[PDF] WeasyPrint warnings (${lines.length} lines):`, lines.join(' | '))
        }
      }

      const pdfBuffer = fs.readFileSync(pdfFile)
      const elapsed = ((Date.now() - startMs) / 1000).toFixed(1)
      console.log(`[PDF] Done in ${elapsed}s — ${(pdfBuffer.length / 1024).toFixed(1)} KB`)
      return pdfBuffer

    } catch (err: any) {
      // Provide actionable error message
      if (err.code === 'ENOENT') {
        throw new Error(
          `WeasyPrint not found at "${WEASYPRINT_BIN}". ` +
          'Install: pip3 install weasyprint && brew install pango glib cairo. ' +
          'Set WEASYPRINT_BIN env var if installed elsewhere.'
        )
      }
      throw new Error(`WeasyPrint PDF generation failed: ${err.message || err}`)
    } finally {
      try { fs.unlinkSync(htmlFile) } catch {}
      try { fs.unlinkSync(pdfFile) } catch {}
    }
  }

  /**
   * Génère un PDF à partir d'un template avec des données
   */
  static async generateFromTemplate(
    templateFn: (data: any) => string,
    data: any,
    options: PdfGeneratorOptions = {}
  ): Promise<Buffer> {
    const html = templateFn(data)
    return this.generateFromHtml(html, options)
  }
}

// Styles CSS de base réutilisables pour les rapports
export const baseReportStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
    background: white;
  }
  
  .page {
    page-break-after: always;
    padding: 0;
  }
  
  .page:last-child {
    page-break-after: avoid;
  }
  
  /* Cover page */
  .cover-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
    color: white;
    padding: 60px;
  }
  
  .cover-page .logo {
    width: 120px;
    height: 120px;
    margin-bottom: 40px;
  }
  
  .cover-page h1 {
    font-size: 32pt;
    font-weight: 700;
    margin-bottom: 16px;
    letter-spacing: -0.5px;
  }
  
  .cover-page .subtitle {
    font-size: 16pt;
    font-weight: 300;
    opacity: 0.9;
    margin-bottom: 60px;
  }
  
  .cover-page .client-info {
    background: rgba(255,255,255,0.1);
    padding: 30px 50px;
    border-radius: 12px;
    margin-bottom: 40px;
  }
  
  .cover-page .client-name {
    font-size: 20pt;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .cover-page .date {
    font-size: 12pt;
    opacity: 0.8;
  }
  
  .cover-page .cabinet-info {
    position: absolute;
    bottom: 60px;
    font-size: 10pt;
    opacity: 0.7;
  }
  
  /* Content pages */
  .content-page {
    padding: 0;
  }
  
  .page-header {
    background: #1e3a5f;
    color: white;
    padding: 20px 30px;
    margin-bottom: 30px;
  }
  
  .page-header h2 {
    font-size: 18pt;
    font-weight: 600;
  }
  
  .page-content {
    padding: 0 30px;
  }
  
  /* Section styles */
  .section {
    margin-bottom: 30px;
  }
  
  .section-title {
    font-size: 14pt;
    font-weight: 600;
    color: #1e3a5f;
    border-bottom: 2px solid #1e3a5f;
    padding-bottom: 8px;
    margin-bottom: 16px;
  }
  
  .subsection-title {
    font-size: 12pt;
    font-weight: 600;
    color: #2d5a87;
    margin-bottom: 12px;
  }
  
  /* Cards */
  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .card-title {
    font-size: 11pt;
    font-weight: 600;
    color: #334155;
  }
  
  .card-value {
    font-size: 14pt;
    font-weight: 700;
    color: #1e3a5f;
  }
  
  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  
  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  
  th {
    background: #f1f5f9;
    font-weight: 600;
    color: #475569;
    font-size: 10pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  td {
    font-size: 10pt;
  }
  
  tr:hover td {
    background: #f8fafc;
  }
  
  .amount {
    font-weight: 600;
    text-align: right;
  }
  
  .amount.positive {
    color: #059669;
  }
  
  .amount.negative {
    color: #dc2626;
  }
  
  /* Stats grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .stat-card {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: 8px;
    padding: 20px;
    text-align: center;
  }
  
  .stat-label {
    font-size: 9pt;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 20pt;
    font-weight: 700;
    color: #1e3a5f;
  }
  
  .stat-value.highlight {
    color: #059669;
  }
  
  /* Charts placeholder */
  .chart-container {
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    margin-bottom: 20px;
  }
  
  /* Preconisations */
  .preconisation {
    background: white;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #1e3a5f;
    border-radius: 0 8px 8px 0;
    padding: 20px;
    margin-bottom: 16px;
  }
  
  .preconisation.priorite-haute {
    border-left-color: #dc2626;
  }
  
  .preconisation.priorite-moyenne {
    border-left-color: #f59e0b;
  }
  
  .preconisation.priorite-basse {
    border-left-color: #10b981;
  }
  
  .preconisation-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  
  .preconisation-title {
    font-size: 12pt;
    font-weight: 600;
    color: #1e3a5f;
  }
  
  .preconisation-badge {
    font-size: 8pt;
    padding: 4px 10px;
    border-radius: 20px;
    font-weight: 500;
    text-transform: uppercase;
  }
  
  .badge-haute {
    background: #fee2e2;
    color: #dc2626;
  }
  
  .badge-moyenne {
    background: #fef3c7;
    color: #d97706;
  }
  
  .badge-basse {
    background: #d1fae5;
    color: #059669;
  }
  
  .preconisation-description {
    font-size: 10pt;
    color: #475569;
    margin-bottom: 12px;
  }
  
  .preconisation-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    font-size: 9pt;
  }
  
  .detail-item {
    display: flex;
    gap: 8px;
  }
  
  .detail-label {
    color: #94a3b8;
  }
  
  .detail-value {
    font-weight: 500;
    color: #334155;
  }
  
  /* Signature area */
  .signature-area {
    margin-top: 60px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
  }
  
  .signature-box {
    border-top: 1px solid #cbd5e1;
    padding-top: 16px;
    text-align: center;
  }
  
  .signature-label {
    font-size: 9pt;
    color: #64748b;
    margin-bottom: 60px;
  }
  
  .signature-name {
    font-size: 10pt;
    font-weight: 500;
  }
  
  /* Utilities */
  .text-right {
    text-align: right;
  }
  
  .text-center {
    text-align: center;
  }
  
  .mb-0 { margin-bottom: 0; }
  .mb-1 { margin-bottom: 8px; }
  .mb-2 { margin-bottom: 16px; }
  .mb-3 { margin-bottom: 24px; }
  .mb-4 { margin-bottom: 32px; }
  
  .font-bold { font-weight: 700; }
  .font-medium { font-weight: 500; }
  
  .text-sm { font-size: 9pt; }
  .text-lg { font-size: 14pt; }
  .text-xl { font-size: 18pt; }
  
  .text-muted { color: #64748b; }
  .text-primary { color: #1e3a5f; }
  .text-success { color: #059669; }
  .text-danger { color: #dc2626; }
`

export default PdfGenerator
