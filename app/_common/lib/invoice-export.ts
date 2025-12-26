/**
 * Invoice Export Utilities
 * Export invoices to PDF, Word (DOCX), and Excel (XLSX) formats
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface InvoiceExportData {
  invoiceNumber: string
  issueDate: string
  dueDate?: string
  status: string
  client: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
    address?: string
  }
  conseiller?: {
    firstName: string
    lastName: string
  }
  cabinet?: {
    name: string
    address?: string
    phone?: string
    email?: string
    siret?: string
  }
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    tva: number
    totalHT: number
    totalTTC: number
  }>
  amountHT: number
  tva: number
  amountTTC: number
  notes?: string
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyée',
  PAID: 'Payée',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulée',
}

/**
 * Export invoice to PDF
 */
export function exportInvoiceToPDF(invoice: InvoiceExportData): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE', pageWidth / 2, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`N° ${invoice.invoiceNumber}`, pageWidth / 2, 28, { align: 'center' })

  // Status badge
  doc.setFontSize(10)
  doc.text(`Statut: ${STATUS_LABELS[invoice.status] || invoice.status}`, pageWidth / 2, 35, { align: 'center' })
  
  // Dates
  let yPos = 50
  doc.setFontSize(10)
  doc.text(`Date d'émission: ${formatDate(invoice.issueDate)}`, 14, yPos)
  if (invoice.dueDate) {
    doc.text(`Date d'échéance: ${formatDate(invoice.dueDate)}`, pageWidth - 14, yPos, { align: 'right' })
  }
  
  // Cabinet info (left)
  yPos = 65
  if (invoice.cabinet) {
    doc.setFont('helvetica', 'bold')
    doc.text('Émetteur:', 14, yPos)
    doc.setFont('helvetica', 'normal')
    yPos += 6
    doc.text(invoice.cabinet.name || 'Cabinet', 14, yPos)
    if (invoice.cabinet.address) {
      yPos += 5
      doc.text(invoice.cabinet.address, 14, yPos)
    }
    if (invoice.cabinet.phone) {
      yPos += 5
      doc.text(`Tél: ${invoice.cabinet.phone}`, 14, yPos)
    }
    if (invoice.cabinet.siret) {
      yPos += 5
      doc.text(`SIRET: ${invoice.cabinet.siret}`, 14, yPos)
    }
  }
  
  // Client info (right)
  yPos = 65
  doc.setFont('helvetica', 'bold')
  doc.text('Client:', pageWidth - 80, yPos)
  doc.setFont('helvetica', 'normal')
  yPos += 6
  doc.text(`${invoice.client.firstName} ${invoice.client.lastName}`, pageWidth - 80, yPos)
  if (invoice.client.email) {
    yPos += 5
    doc.text(invoice.client.email, pageWidth - 80, yPos)
  }
  if (invoice.client.phone) {
    yPos += 5
    doc.text(invoice.client.phone, pageWidth - 80, yPos)
  }
  if (invoice.client.address) {
    yPos += 5
    doc.text(invoice.client.address, pageWidth - 80, yPos)
  }
  
  // Items table
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    `${item.tva}%`,
    formatCurrency(item.totalHT),
    formatCurrency(item.totalTTC),
  ])
  
  autoTable(doc, {
    startY: 110,
    head: [['Description', 'Qté', 'Prix unit. HT', 'TVA', 'Total HT', 'Total TTC']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { halign: 'center', cellWidth: 15 },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 25 },
    },
  })
  
  // Totals
  const finalY = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY) + 10
  
  doc.setFontSize(10)
  doc.text('Total HT:', pageWidth - 70, finalY)
  doc.text(formatCurrency(invoice.amountHT), pageWidth - 14, finalY, { align: 'right' })
  
  doc.text('TVA:', pageWidth - 70, finalY + 7)
  doc.text(formatCurrency(invoice.amountHT * (invoice.tva / 100)), pageWidth - 14, finalY + 7, { align: 'right' })
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Total TTC:', pageWidth - 70, finalY + 16)
  doc.text(formatCurrency(invoice.amountTTC), pageWidth - 14, finalY + 16, { align: 'right' })
  
  // Notes
  if (invoice.notes) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Notes:', 14, finalY + 30)
    doc.text(invoice.notes, 14, finalY + 36, { maxWidth: pageWidth - 28 })
  }
  
  // Footer
  doc.setFontSize(8)
  doc.setTextColor(128)
  doc.text('Document généré automatiquement', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })
  
  // Download
  doc.save(`facture-${invoice.invoiceNumber}.pdf`)
}

/**
 * Export invoice to Word (HTML-based DOCX)
 */
export function exportInvoiceToWord(invoice: InvoiceExportData): void {
  const itemsRows = invoice.items.map(item => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.description}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.unitPrice)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.tva}%</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.totalTTC)}</td>
    </tr>
  `).join('')

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
    <head>
      <meta charset="utf-8">
      <title>Facture ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; color: #1e40af; }
        .header { text-align: center; margin-bottom: 30px; }
        .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .info-box { width: 45%; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #3b82f6; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border: 1px solid #ddd; }
        .totals { text-align: right; margin-top: 20px; }
        .total-row { margin: 5px 0; }
        .grand-total { font-size: 18px; font-weight: bold; margin-top: 10px; }
        .notes { margin-top: 30px; padding: 15px; background: #f8fafc; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FACTURE</h1>
        <p><strong>N° ${invoice.invoiceNumber}</strong></p>
        <p>Statut: ${STATUS_LABELS[invoice.status] || invoice.status}</p>
        <p>Date d'émission: ${formatDate(invoice.issueDate)}${invoice.dueDate ? ` | Échéance: ${formatDate(invoice.dueDate)}` : ''}</p>
      </div>
      
      <table style="margin-bottom: 30px;">
        <tr>
          <td style="width: 50%; vertical-align: top; border: none;">
            <strong>Client:</strong><br>
            ${invoice.client.firstName} ${invoice.client.lastName}<br>
            ${invoice.client.email || ''}<br>
            ${invoice.client.phone || ''}
          </td>
          <td style="width: 50%; vertical-align: top; border: none; text-align: right;">
            ${invoice.conseiller ? `<strong>Conseiller:</strong><br>${invoice.conseiller.firstName} ${invoice.conseiller.lastName}` : ''}
          </td>
        </tr>
      </table>
      
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">Qté</th>
            <th style="text-align: right;">Prix unit. HT</th>
            <th style="text-align: center;">TVA</th>
            <th style="text-align: right;">Total TTC</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-row">Total HT: ${formatCurrency(invoice.amountHT)}</div>
        <div class="total-row">TVA: ${formatCurrency(invoice.amountHT * (invoice.tva / 100))}</div>
        <div class="grand-total">Total TTC: ${formatCurrency(invoice.amountTTC)}</div>
      </div>
      
      ${invoice.notes ? `<div class="notes"><strong>Notes:</strong><br>${invoice.notes}</div>` : ''}
    </body>
    </html>
  `

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `facture-${invoice.invoiceNumber}.doc`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Export invoice to Excel (CSV format compatible with Excel)
 */
export function exportInvoiceToExcel(invoice: InvoiceExportData): void {
  const BOM = '\uFEFF'
  
  let csv = BOM
  csv += `FACTURE N° ${invoice.invoiceNumber}\n`
  csv += `Date d'émission;${formatDate(invoice.issueDate)}\n`
  if (invoice.dueDate) {
    csv += `Date d'échéance;${formatDate(invoice.dueDate)}\n`
  }
  csv += `Statut;${STATUS_LABELS[invoice.status] || invoice.status}\n`
  csv += `\n`
  csv += `CLIENT\n`
  csv += `Nom;${invoice.client.firstName} ${invoice.client.lastName}\n`
  if (invoice.client.email) csv += `Email;${invoice.client.email}\n`
  if (invoice.client.phone) csv += `Téléphone;${invoice.client.phone}\n`
  csv += `\n`
  csv += `LIGNES DE FACTURE\n`
  csv += `Description;Quantité;Prix unitaire HT;TVA %;Total HT;Total TTC\n`
  
  invoice.items.forEach(item => {
    csv += `${item.description};${item.quantity};${item.unitPrice};${item.tva};${item.totalHT};${item.totalTTC}\n`
  })
  
  csv += `\n`
  csv += `TOTAUX\n`
  csv += `Total HT;${invoice.amountHT}\n`
  csv += `TVA;${invoice.amountHT * (invoice.tva / 100)}\n`
  csv += `Total TTC;${invoice.amountTTC}\n`
  
  if (invoice.notes) {
    csv += `\n`
    csv += `NOTES\n`
    csv += `${invoice.notes.replace(/\n/g, ' ')}\n`
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `facture-${invoice.invoiceNumber}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// Type pour les données API brutes
interface APIInvoiceData {
  invoiceNumber?: string
  issueDate: string
  dueDate?: string
  status: string
  client?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
  }
  conseiller?: {
    firstName?: string
    lastName?: string
  }
  cabinet?: {
    name?: string
    address?: string
    phone?: string
    email?: string
    siret?: string
  }
  items?: Array<{
    description?: string
    quantity?: number
    unitPrice?: number
    tva?: number
    totalHT?: number
    totalTTC?: number
  }>
  amountHT?: number
  tva?: number
  amountTTC?: number
  notes?: string
}

/**
 * Convert API invoice data to export format
 */
export function prepareInvoiceForExport(apiInvoice: APIInvoiceData): InvoiceExportData {
  return {
    invoiceNumber: apiInvoice.invoiceNumber || 'N/A',
    issueDate: apiInvoice.issueDate,
    dueDate: apiInvoice.dueDate,
    status: apiInvoice.status,
    client: {
      firstName: apiInvoice.client?.firstName || '',
      lastName: apiInvoice.client?.lastName || '',
      email: apiInvoice.client?.email,
      phone: apiInvoice.client?.phone,
      address: apiInvoice.client?.address,
    },
    conseiller: apiInvoice.conseiller ? {
      firstName: apiInvoice.conseiller.firstName || '',
      lastName: apiInvoice.conseiller.lastName || '',
    } : undefined,
    cabinet: apiInvoice.cabinet ? {
      name: apiInvoice.cabinet.name || '',
      address: apiInvoice.cabinet.address,
      phone: apiInvoice.cabinet.phone,
      email: apiInvoice.cabinet.email,
      siret: apiInvoice.cabinet.siret,
    } : undefined,
    items: (apiInvoice.items || []).map((item) => ({
      description: item.description || '',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      tva: Number(item.tva) || 20,
      totalHT: Number(item.totalHT) || Number(item.unitPrice) * Number(item.quantity),
      totalTTC: Number(item.totalTTC) || 0,
    })),
    amountHT: Number(apiInvoice.amountHT) || 0,
    tva: Number(apiInvoice.tva) || 20,
    amountTTC: Number(apiInvoice.amountTTC) || 0,
    notes: apiInvoice.notes,
  }
}
