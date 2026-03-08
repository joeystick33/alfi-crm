import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { generateReportHTML, type ReportData } from '../utils/pdfReportTemplate';

export { type ReportData } from '../utils/pdfReportTemplate';

interface DownloadPDFResult {
  /** Génère le HTML du rapport côté frontend, l'envoie au service Puppeteer, et télécharge le PDF */
  downloadPDF: (reportData: ReportData) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook d'export PDF professionnel — Puppeteer côté serveur.
 *
 * Stratégie : le frontend génère le HTML complet du rapport (même template
 * que la prévisualisation), puis l'envoie au microservice Node.js (Puppeteer)
 * qui le rend en PDF vectoriel A4 avec texte sélectionnable.
 *
 * Avantage : source unique de vérité pour le contenu (pdfReportTemplate.ts),
 * le service PDF n'est qu'un moteur de rendu pur.
 */
export function useDownloadPDF(): DownloadPDFResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadPDF = useCallback(async (reportData: ReportData) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Générer le HTML complet côté frontend
      const html = generateReportHTML(reportData);

      // 2. Envoyer le HTML au service Puppeteer pour rendu PDF
      const response = await axios.post('/api/advisor/simulators/succession-smp/pdf', {
        reportData,
        clientName: reportData.clientName,
      }, {
        responseType: 'blob',
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' },
      });

      // 3. Télécharger le PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const clientSlug = (reportData.clientName || 'client').replace(/\s+/g, '-');
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `diagnostic-successoral-${clientSlug}-${dateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      const axiosErr = err as AxiosError;
      let finalError: Error;

      if (axios.isAxiosError(axiosErr) && axiosErr.code === 'ECONNABORTED') {
        finalError = new Error(
          "Le service PDF ne répond pas à temps. Vérifiez que le microservice PDF est démarré (`cd pdf-service && npm run dev`) puis réessayez."
        );
      } else if (axios.isAxiosError(axiosErr) && (axiosErr.code === 'ERR_NETWORK' || axiosErr.message.includes('Network Error'))) {
        finalError = new Error(
          "Impossible de joindre le service PDF. Vérifiez que le microservice PDF est démarré (`cd pdf-service && npm run dev`)."
        );
      } else if (axios.isAxiosError(axiosErr) && axiosErr.response?.status === 404) {
        finalError = new Error(
          "Endpoint PDF CRM introuvable. Vérifiez que la route /api/advisor/simulators/succession-smp/pdf est bien disponible."
        );
      } else {
        finalError = err as Error;
      }

      setError(finalError);
      console.error('Erreur lors de la génération du PDF:', err);
      throw finalError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { downloadPDF, loading, error };
}
