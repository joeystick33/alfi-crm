/**
 * Script de diagnostic PDF — teste si Puppeteer peut imprimer le template bilan patrimonial.
 * Usage: node scripts/test-pdf-print.mjs
 */
import puppeteer from 'puppeteer'
import fs from 'fs'

// Check if we have a dumped HTML from the route
let html
const dumpPath = '/tmp/bilan-debug.html'
if (fs.existsSync(dumpPath)) {
  html = fs.readFileSync(dumpPath, 'utf8')
  console.log(`[TEST] Using dumped HTML from ${dumpPath} (${(html.length / 1024).toFixed(1)} KB)`)
} else {
  // Generate a minimal test HTML with the same CSS structure
  console.log('[TEST] No dump found, generating minimal test HTML')
  html = generateMinimalTestHtml()
}

console.log(`[TEST] HTML size: ${(html.length / 1024).toFixed(1)} KB`)
console.log(`[TEST] Number of .page divs: ${(html.match(/class="page/g) || []).length}`)
console.log(`[TEST] Number of SVGs: ${(html.match(/<svg/g) || []).length}`)
console.log(`[TEST] Number of linear-gradients: ${(html.match(/linear-gradient/g) || []).length}`)

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
})

const page = await browser.newPage()
await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })

// Listen for page errors
page.on('pageerror', err => console.error('[PAGE ERROR]', err.message))
page.on('console', msg => {
  if (msg.type() === 'error') console.error('[CONSOLE ERROR]', msg.text())
})

await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise(r => setTimeout(r, 500))

// Test 1: Print with full options (same as route)
console.log('\n--- Test 1: Full options (printBackground:true, margin:0) ---')
try {
  await page.pdf({
    path: '/tmp/bilan-test-1.pdf',
    format: 'A4',
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    printBackground: true,
    tagged: false,
    waitForFonts: false,
    outline: false,
    preferCSSPageSize: false,
    scale: 1,
    timeout: 60000,
  })
  console.log('✅ Test 1 PASSED — /tmp/bilan-test-1.pdf')
} catch (e) {
  console.error('❌ Test 1 FAILED:', e.message)
}

// Test 2: No backgrounds
console.log('\n--- Test 2: printBackground:false ---')
try {
  await page.pdf({
    path: '/tmp/bilan-test-2.pdf',
    format: 'A4',
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    printBackground: false,
    tagged: false,
    waitForFonts: false,
    outline: false,
    preferCSSPageSize: false,
    timeout: 60000,
  })
  console.log('✅ Test 2 PASSED — /tmp/bilan-test-2.pdf')
} catch (e) {
  console.error('❌ Test 2 FAILED:', e.message)
}

// Test 3: Strip gradients first
console.log('\n--- Test 3: Stripped gradients + printBackground:true ---')
await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise(r => setTimeout(r, 300))
await page.evaluate(() => {
  document.querySelectorAll('*').forEach(el => {
    const s = el.style
    if (s.background?.includes('gradient')) {
      const m = s.background.match(/#[0-9a-fA-F]{3,8}/)
      s.background = m ? m[0] : '#f8fafc'
    }
    if (s.backgroundImage?.includes('gradient')) s.backgroundImage = 'none'
  })
})
try {
  await page.pdf({
    path: '/tmp/bilan-test-3.pdf',
    format: 'A4',
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    printBackground: true,
    tagged: false,
    waitForFonts: false,
    outline: false,
    preferCSSPageSize: false,
    timeout: 60000,
  })
  console.log('✅ Test 3 PASSED — /tmp/bilan-test-3.pdf')
} catch (e) {
  console.error('❌ Test 3 FAILED:', e.message)
}

// Test 4: Strip gradients AND SVGs
console.log('\n--- Test 4: Stripped gradients + SVGs removed ---')
await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise(r => setTimeout(r, 300))
await page.evaluate(() => {
  document.querySelectorAll('*').forEach(el => {
    const s = el.style
    if (s.background?.includes('gradient')) {
      const m = s.background.match(/#[0-9a-fA-F]{3,8}/)
      s.background = m ? m[0] : '#f8fafc'
    }
    if (s.backgroundImage?.includes('gradient')) s.backgroundImage = 'none'
  })
  document.querySelectorAll('svg').forEach(el => el.remove())
})
try {
  await page.pdf({
    path: '/tmp/bilan-test-4.pdf',
    format: 'A4',
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    printBackground: true,
    tagged: false,
    waitForFonts: false,
    outline: false,
    preferCSSPageSize: false,
    timeout: 60000,
  })
  console.log('✅ Test 4 PASSED — /tmp/bilan-test-4.pdf')
} catch (e) {
  console.error('❌ Test 4 FAILED:', e.message)
}

// Test 5: Strip everything heavy + remove page-break constraints
console.log('\n--- Test 5: No page-breaks, no SVGs, no gradients ---')
await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise(r => setTimeout(r, 300))
await page.evaluate(() => {
  document.querySelectorAll('*').forEach(el => {
    const s = el.style
    if (s.background?.includes('gradient')) {
      const m = s.background.match(/#[0-9a-fA-F]{3,8}/)
      s.background = m ? m[0] : '#f8fafc'
    }
    if (s.backgroundImage?.includes('gradient')) s.backgroundImage = 'none'
  })
  document.querySelectorAll('svg').forEach(el => el.remove())
  // Remove all page-break constraints
  const style = document.createElement('style')
  style.textContent = `
    .page { page-break-after: auto !important; }
    .cover { min-height: auto !important; height: auto !important; }
  `
  document.head.appendChild(style)
})
try {
  await page.pdf({
    path: '/tmp/bilan-test-5.pdf',
    format: 'A4',
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    printBackground: true,
    tagged: false,
    waitForFonts: false,
    outline: false,
    preferCSSPageSize: false,
    timeout: 60000,
  })
  console.log('✅ Test 5 PASSED — /tmp/bilan-test-5.pdf')
} catch (e) {
  console.error('❌ Test 5 FAILED:', e.message)
}

await browser.close()
console.log('\n[TEST] Done.')

// ---------------------------------------------------------------
function generateMinimalTestHtml() {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  :root { --primary: #0f172a; --accent: #3b82f6; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: sans-serif; font-size: 10pt; color: #1e293b; background: white; }
  .page { padding: 0; page-break-after: always; position: relative; }
  .page:last-child { page-break-after: avoid; }
  .cover { min-height: 297mm; background: #0f172a; display: flex; flex-direction: column; color: white; }
  .content-page { padding: 48px; }
  .card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 16px; }
</style></head>
<body>
  <div class="page cover">
    <div style="padding: 80px 50px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
      <h1 style="font-size: 36pt; font-weight: 900;">Bilan Patrimonial</h1>
      <p style="font-size: 14pt; margin-top: 16px; opacity: 0.7;">Client Test — 01/01/2025</p>
    </div>
  </div>
  <div class="page content-page">
    <h2>Synthèse Patrimoniale</h2>
    <div class="card"><p>Patrimoine net : 500 000 €</p></div>
    <div class="card"><p>Revenus annuels : 60 000 €</p></div>
  </div>
  <div class="page content-page">
    <h2>Analyse Budget</h2>
    <div class="card"><p>Capacité d'épargne : 1 200 €/mois</p></div>
  </div>
</body></html>`
}
