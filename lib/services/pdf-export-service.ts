/**
 * Service de génération de rapports PDF professionnels
 * Intègre le branding cabinet (logo, couleurs)
 * Support multi-langue (FR/EN)
 * Génère des rapports avec graphiques et tableaux
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types pour les options de génération PDF
export interface PDFOptions {
  locale?: 'fr' | 'en';
  cabinetInfo?: CabinetInfo;
  includeCharts?: boolean;
  includeFooter?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export interface CabinetInfo {
  name: string;
  logo?: string; // Base64 ou URL
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}

// Traductions pour les rapports
const translations = {
  fr: {
    // En-têtes communs
    generatedOn: 'Généré le',
    page: 'Page',
    of: 'sur',
    confidential: 'CONFIDENTIEL',
    
    // Sections
    clientInformation: 'Informations Client',
    wealthSummary: 'Synthèse Patrimoniale',
    assets: 'Actifs',
    liabilities: 'Passifs',
    contracts: 'Contrats',
    documents: 'Documents',
    objectives: 'Objectifs',
    simulations: 'Simulations',
    
    // Champs
    name: 'Nom',
    type: 'Type',
    value: 'Valeur',
    date: 'Date',
    status: 'Statut',
    description: 'Description',
    total: 'Total',
    netWealth: 'Patrimoine Net',
    managedAssets: 'Actifs Gérés',
    unmanagedAssets: 'Actifs Non Gérés',
    
    // Types de clients
    PARTICULIER: 'Particulier',
    PROFESSIONNEL: 'Professionnel',
    
    // Statuts
    PROSPECT: 'Prospect',
    ACTIF: 'Actif',
    INACTIF: 'Inactif',
    ARCHIVED: 'Archivé',
  },
  en: {
    // Common headers
    generatedOn: 'Generated on',
    page: 'Page',
    of: 'of',
    confidential: 'CONFIDENTIAL',
    
    // Sections
    clientInformation: 'Client Information',
    wealthSummary: 'Wealth Summary',
    assets: 'Assets',
    liabilities: 'Liabilities',
    contracts: 'Contracts',
    documents: 'Documents',
    objectives: 'Objectives',
    simulations: 'Simulations',
    
    // Fields
    name: 'Name',
    type: 'Type',
    value: 'Value',
    date: 'Date',
    status: 'Status',
    description: 'Description',
    total: 'Total',
    netWealth: 'Net Wealth',
    managedAssets: 'Managed Assets',
    unmanagedAssets: 'Unmanaged Assets',
    
    // Client types
    PARTICULIER: 'Individual',
    PROFESSIONNEL: 'Professional',
    
    // Statuses
    PROSPECT: 'Prospect',
    ACTIF: 'Active',
    INACTIF: 'Inactive',
    ARCHIVED: 'Archived',
  },
};

/**
 * Classe de base pour la génération de PDF
 */
export class PDFGenerator {
  private doc: jsPDF;
  private options: Required<PDFOptions>;
  private currentY: number = 20;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 20;
  private translations: typeof translations.fr;

  constructor(options: PDFOptions = {}) {
    const orientation = options.orientation || 'portrait';
    this.doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    this.options = {
      locale: options.locale || 'fr',
      cabinetInfo: options.cabinetInfo || { name: 'Cabinet ALFI' },
      includeCharts: options.includeCharts ?? true,
      includeFooter: options.includeFooter ?? true,
      orientation,
    };

    this.translations = translations[this.options.locale];
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
  }

  /**
   * Ajoute l'en-tête du document avec branding cabinet
   */
  private addHeader(title: string) {
    const { cabinetInfo } = this.options;
    const colors = cabinetInfo.colors || {
      primary: '#1e40af',
      secondary: '#64748b',
      accent: '#0ea5e9',
    };

    // Ligne de couleur en haut
    this.doc.setFillColor(colors.primary);
    this.doc.rect(0, 0, this.pageWidth, 8, 'F');

    // Logo (si disponible)
    if (cabinetInfo.logo) {
      try {
        this.doc.addImage(cabinetInfo.logo, 'PNG', this.margin, 12, 30, 15);
      } catch (error) {
        console.warn('Failed to add logo:', error);
      }
    }

    // Nom du cabinet
    this.doc.setFontSize(16);
    this.doc.setTextColor(colors.primary);
    this.doc.setFont('helvetica', 'bold');
    const cabinetNameX = cabinetInfo.logo ? this.margin + 35 : this.margin;
    this.doc.text(cabinetInfo.name, cabinetNameX, 20);

    // Coordonnées du cabinet (petite taille)
    if (cabinetInfo.address || cabinetInfo.phone || cabinetInfo.email) {
      this.doc.setFontSize(8);
      this.doc.setTextColor(colors.secondary);
      this.doc.setFont('helvetica', 'normal');
      let contactY = 25;
      
      if (cabinetInfo.address) {
        this.doc.text(cabinetInfo.address, cabinetNameX, contactY);
        contactY += 3;
      }
      if (cabinetInfo.phone) {
        this.doc.text(`Tél: ${cabinetInfo.phone}`, cabinetNameX, contactY);
        contactY += 3;
      }
      if (cabinetInfo.email) {
        this.doc.text(cabinetInfo.email, cabinetNameX, contactY);
      }
    }

    // Titre du document (centré)
    this.doc.setFontSize(18);
    this.doc.setTextColor(colors.primary);
    this.doc.setFont('helvetica', 'bold');
    const titleWidth = this.doc.getTextWidth(title);
    this.doc.text(title, (this.pageWidth - titleWidth) / 2, 45);

    // Date de génération
    const dateText = `${this.translations.generatedOn} ${new Date().toLocaleDateString(
      this.options.locale === 'fr' ? 'fr-FR' : 'en-US'
    )}`;
    this.doc.setFontSize(9);
    this.doc.setTextColor(colors.secondary);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(dateText, this.pageWidth - this.margin, 20, { align: 'right' });

    // Marque "CONFIDENTIEL"
    this.doc.setFontSize(10);
    this.doc.setTextColor(200, 0, 0);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.translations.confidential, this.pageWidth - this.margin, 25, {
      align: 'right',
    });

    this.currentY = 55;
  }

  /**
   * Ajoute le pied de page avec numérotation
   */
  private addFooter() {
    if (!this.options.includeFooter) return;

    const pageCount = this.doc.getNumberOfPages();
    const colors = this.options.cabinetInfo?.colors || { secondary: '#64748b' };

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Ligne de séparation
      this.doc.setDrawColor(colors.secondary);
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);

      // Numéro de page
      this.doc.setFontSize(9);
      this.doc.setTextColor(colors.secondary);
      this.doc.setFont('helvetica', 'normal');
      const pageText = `${this.translations.page} ${i} ${this.translations.of} ${pageCount}`;
      this.doc.text(pageText, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });

      // Site web du cabinet (si disponible)
      if (this.options.cabinetInfo?.website) {
        this.doc.text(this.options.cabinetInfo.website, this.pageWidth - this.margin, this.pageHeight - 10, {
          align: 'right',
        });
      }
    }
  }

  /**
   * Vérifie si on a besoin d'une nouvelle page
   */
  private checkPageBreak(requiredSpace: number = 20) {
    if (this.currentY + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      this.currentY = 20;
      return true;
    }
    return false;
  }

  /**
   * Ajoute une section avec titre
   */
  addSection(title: string) {
    this.checkPageBreak(15);

    const colors = this.options.cabinetInfo?.colors || { primary: '#1e40af' };

    this.doc.setFontSize(14);
    this.doc.setTextColor(colors.primary);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);

    // Ligne sous le titre
    this.currentY += 2;
    this.doc.setDrawColor(colors.primary);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);

    this.currentY += 8;
  }

  /**
   * Ajoute un paragraphe de texte
   */
  addText(text: string, options: { fontSize?: number; bold?: boolean; color?: string } = {}) {
    this.checkPageBreak(10);

    this.doc.setFontSize(options.fontSize || 10);
    this.doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
    this.doc.setTextColor(options.color || '#000000');

    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin);
    this.doc.text(lines, this.margin, this.currentY);

    this.currentY += lines.length * 5 + 3;
  }

  /**
   * Ajoute un tableau avec autoTable
   */
  addTable(
    headers: string[],
    rows: any[][],
    options: {
      columnStyles?: any;
      footerRows?: any[][];
    } = {}
  ) {
    this.checkPageBreak(30);

    const colors = this.options.cabinetInfo?.colors || {
      primary: '#1e40af',
      secondary: '#64748b',
    };

    autoTable(this.doc, {
      head: [headers],
      body: rows,
      foot: options.footerRows,
      startY: this.currentY,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: colors.primary,
        textColor: '#ffffff',
        fontStyle: 'bold',
        halign: 'left',
      },
      footStyles: {
        fillColor: colors.secondary,
        textColor: '#ffffff',
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: '#f8fafc',
      },
      columnStyles: options.columnStyles || {},
      didDrawPage: (data) => {
        this.currentY = data.cursor?.y || this.currentY;
      },
    });

    this.currentY += 10;
  }

  /**
   * Ajoute une paire clé-valeur
   */
  addKeyValue(key: string, value: string | number, options: { bold?: boolean } = {}) {
    this.checkPageBreak(8);

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor('#374151');
    this.doc.text(`${key}:`, this.margin, this.currentY);

    this.doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
    this.doc.setTextColor('#000000');
    this.doc.text(String(value), this.margin + 50, this.currentY);

    this.currentY += 6;
  }

  /**
   * Ajoute un espace vertical
   */
  addSpace(height: number = 5) {
    this.currentY += height;
  }

  /**
   * Finalise le document et retourne le blob
   */
  finalize(title: string): Blob {
    this.addHeader(title);
    this.addFooter();
    return this.doc.output('blob');
  }

  /**
   * Télécharge le PDF
   */
  download(filename: string, title: string) {
    this.addHeader(title);
    this.addFooter();
    this.doc.save(filename);
  }

  /**
   * Retourne le document jsPDF pour manipulation avancée
   */
  getDocument(): jsPDF {
    return this.doc;
  }

  /**
   * Obtient les traductions
   */
  getTranslations() {
    return this.translations;
  }

  /**
   * Formate un montant en devise
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat(this.options.locale === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  /**
   * Formate une date
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(this.options.locale === 'fr' ? 'fr-FR' : 'en-US');
  }
}

/**
 * Génère un rapport client complet
 */
export async function generateClientReport(
  clientData: any,
  options: PDFOptions = {}
): Promise<Blob> {
  const pdf = new PDFGenerator(options);
  const t = pdf.getTranslations();

  // Section: Informations Client
  pdf.addSection(t.clientInformation);
  
  pdf.addKeyValue(t.name, `${clientData.firstName} ${clientData.lastName}`);
  pdf.addKeyValue(t.type, t[clientData.clientType as keyof typeof t] || clientData.clientType);
  pdf.addKeyValue(t.status, t[clientData.status as keyof typeof t] || clientData.status);
  
  if (clientData.email) pdf.addKeyValue('Email', clientData.email);
  if (clientData.phone) pdf.addKeyValue('Téléphone', clientData.phone);
  if (clientData.birthDate) pdf.addKeyValue('Date de naissance', pdf.formatDate(clientData.birthDate));
  
  pdf.addSpace(10);

  // Section: Synthèse Patrimoniale
  if (clientData.wealth) {
    pdf.addSection(t.wealthSummary);
    
    pdf.addKeyValue(t.netWealth, pdf.formatCurrency(clientData.wealth.netWealth || 0), { bold: true });
    pdf.addKeyValue(t.managedAssets, pdf.formatCurrency(clientData.wealth.managedAssets || 0));
    pdf.addKeyValue(t.unmanagedAssets, pdf.formatCurrency(clientData.wealth.unmanagedAssets || 0));
    
    pdf.addSpace(10);
  }

  return pdf.finalize(`Rapport Client - ${clientData.firstName} ${clientData.lastName}`);
}

/**
 * Génère un rapport de patrimoine
 */
export async function generatePatrimoineReport(
  clientData: any,
  patrimoineData: { actifs: any[]; passifs: any[]; contrats: any[] },
  options: PDFOptions = {}
): Promise<Blob> {
  const pdf = new PDFGenerator(options);
  const t = pdf.getTranslations();

  // En-tête client
  pdf.addText(`Client: ${clientData.firstName} ${clientData.lastName}`, {
    fontSize: 12,
    bold: true,
  });
  pdf.addSpace(5);

  // Section: Actifs
  if (patrimoineData.actifs && patrimoineData.actifs.length > 0) {
    pdf.addSection(t.assets);

    const headers = [t.name, t.type, t.value, t.date];
    const rows = patrimoineData.actifs.map((actif) => [
      actif.name || '',
      actif.type || '',
      pdf.formatCurrency(actif.currentValue || 0),
      actif.purchaseDate ? pdf.formatDate(actif.purchaseDate) : '',
    ]);

    const totalActifs = patrimoineData.actifs.reduce(
      (sum, a) => sum + (a.currentValue || 0),
      0
    );

    pdf.addTable(headers, rows, {
      columnStyles: {
        2: { halign: 'right' },
      },
      footerRows: [[t.total, '', pdf.formatCurrency(totalActifs), '']],
    });
  }

  // Section: Passifs
  if (patrimoineData.passifs && patrimoineData.passifs.length > 0) {
    pdf.addSection(t.liabilities);

    const headers = [t.name, t.type, 'Capital restant', 'Mensualité'];
    const rows = patrimoineData.passifs.map((passif) => [
      passif.name || '',
      passif.type || '',
      pdf.formatCurrency(passif.remainingAmount || 0),
      pdf.formatCurrency(passif.monthlyPayment || 0),
    ]);

    const totalPassifs = patrimoineData.passifs.reduce(
      (sum, p) => sum + (p.remainingAmount || 0),
      0
    );

    pdf.addTable(headers, rows, {
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
      footerRows: [[t.total, '', pdf.formatCurrency(totalPassifs), '']],
    });
  }

  // Section: Contrats
  if (patrimoineData.contrats && patrimoineData.contrats.length > 0) {
    pdf.addSection(t.contracts);

    const headers = [t.name, t.type, 'Fournisseur', t.value];
    const rows = patrimoineData.contrats.map((contrat) => [
      contrat.name || '',
      contrat.contractType || '',
      contrat.provider || '',
      pdf.formatCurrency(contrat.currentValue || 0),
    ]);

    pdf.addTable(headers, rows, {
      columnStyles: {
        3: { halign: 'right' },
      },
    });
  }

  return pdf.finalize(`Rapport Patrimoine - ${clientData.firstName} ${clientData.lastName}`);
}

/**
 * Génère un rapport de simulation
 */
export async function generateSimulationReport(
  simulationData: any,
  clientData: any,
  options: PDFOptions = {}
): Promise<Blob> {
  const pdf = new PDFGenerator(options);
  const t = pdf.getTranslations();

  // En-tête
  pdf.addText(`Client: ${clientData.firstName} ${clientData.lastName}`, {
    fontSize: 12,
    bold: true,
  });
  pdf.addSpace(5);

  // Informations simulation
  pdf.addSection(t.simulations);
  
  pdf.addKeyValue('Type', simulationData.simulationType);
  pdf.addKeyValue('Nom', simulationData.name || '');
  if (simulationData.description) {
    pdf.addKeyValue('Description', simulationData.description);
  }
  pdf.addKeyValue(t.date, pdf.formatDate(simulationData.savedAt || new Date()));
  
  pdf.addSpace(10);

  // Résultats
  if (simulationData.results) {
    pdf.addSection('Résultats');
    
    const results = simulationData.results;
    
    // Afficher les résultats selon le type
    if (typeof results === 'object') {
      Object.entries(results).forEach(([key, value]) => {
        if (typeof value === 'number') {
          pdf.addKeyValue(key, pdf.formatCurrency(value));
        } else if (typeof value === 'string' || typeof value === 'boolean') {
          pdf.addKeyValue(key, String(value));
        }
      });
    }
  }

  return pdf.finalize(`Simulation - ${simulationData.name || simulationData.simulationType}`);
}

/**
 * Génère un rapport de documents
 */
export async function generateDocumentsReport(
  documents: any[],
  clientData: any,
  options: PDFOptions = {}
): Promise<Blob> {
  const pdf = new PDFGenerator(options);
  const t = pdf.getTranslations();

  // En-tête
  pdf.addText(`Client: ${clientData.firstName} ${clientData.lastName}`, {
    fontSize: 12,
    bold: true,
  });
  pdf.addSpace(5);

  // Section: Documents
  pdf.addSection(t.documents);

  if (documents && documents.length > 0) {
    const headers = ['Nom', 'Catégorie', 'Type', 'Date', 'Statut'];
    const rows = documents.map((doc) => [
      doc.name || doc.fileName || '',
      doc.documentCategory || '',
      doc.documentType || '',
      doc.uploadedAt ? pdf.formatDate(doc.uploadedAt) : '',
      doc.signatureStatus || 'N/A',
    ]);

    pdf.addTable(headers, rows);
  } else {
    pdf.addText('Aucun document disponible.');
  }

  return pdf.finalize(`Documents - ${clientData.firstName} ${clientData.lastName}`);
}

export default PDFGenerator;
