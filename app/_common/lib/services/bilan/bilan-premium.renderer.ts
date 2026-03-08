
/**
 * Renderer PDF Premium avec Puppeteer
 * Génère un PDF haute qualité avec graphiques Chart.js
 */

import puppeteer from 'puppeteer'
import type { BilanPremiumData } from './bilan-premium.types'
import { generatePremiumTemplate } from './bilan-premium.template'
import { logger } from '@/app/_common/lib/logger'
export interface PdfRenderOptions {
  format?: 'A4' | 'Letter'
  printBackground?: boolean
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  displayHeaderFooter?: boolean
}

const DEFAULT_OPTIONS: PdfRenderOptions = {
  format: 'A4',
  printBackground: true,
  margin: {
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
  },
  displayHeaderFooter: false,
}

/**
 * Génère un PDF premium à partir des données du bilan
 * @param data Données complètes du bilan premium
 * @param options Options de rendu PDF
 * @returns Buffer du PDF généré
 */
export async function renderPremiumPdf(
  data: BilanPremiumData,
  options: PdfRenderOptions = {}
): Promise<Buffer> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
  
  // Génération du HTML
  const html = generatePremiumTemplate(data)
  
  // Lancement de Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  })
  
  try {
    const page = await browser.newPage()
    
    // Configuration de la page
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000,
    })
    
    // Attendre que Chart.js soit chargé et les graphiques rendus
    await page.waitForFunction(() => {
      const w = window as unknown as { Chart?: unknown }
      return typeof w.Chart !== 'undefined'
    }, { timeout: 10000 }).catch(() => {
      logger.warn('Chart.js not loaded, continuing without charts')
    })
    
    // Attendre un peu pour le rendu des graphiques
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Génération du PDF
    const pdfBuffer = await page.pdf({
      format: mergedOptions.format,
      printBackground: mergedOptions.printBackground,
      margin: mergedOptions.margin,
      displayHeaderFooter: mergedOptions.displayHeaderFooter,
      preferCSSPageSize: true,
    })
    
    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

/**
 * Génère un PDF premium et le sauvegarde dans un fichier
 * @param data Données complètes du bilan premium
 * @param outputPath Chemin du fichier de sortie
 * @param options Options de rendu PDF
 */
export async function renderPremiumPdfToFile(
  data: BilanPremiumData,
  outputPath: string,
  options: PdfRenderOptions = {}
): Promise<void> {
  const fs = await import('fs/promises')
  const buffer = await renderPremiumPdf(data, options)
  await fs.writeFile(outputPath, buffer)
}

/**
 * Génère le HTML du bilan premium (pour prévisualisation)
 * @param data Données complètes du bilan premium
 * @returns HTML complet
 */
export function renderPremiumHtml(data: BilanPremiumData): string {
  return generatePremiumTemplate(data)
}
