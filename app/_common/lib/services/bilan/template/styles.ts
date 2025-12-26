/**
 * Styles CSS et couleurs pour le template premium
 */

export const COLORS = {
  primary: '#7373FF',
  secondary: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dark: '#0F1115',
  muted: '#6b7280',
  light: '#f3f4f6',
  white: '#ffffff',
  chart: ['#7373FF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'],
}

export function getScoreColor(score: number): string {
  if (score >= 80) return COLORS.secondary
  if (score >= 60) return COLORS.primary
  if (score >= 40) return COLORS.warning
  return COLORS.danger
}

export function generateCSS(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: ${COLORS.dark};
      background: ${COLORS.white};
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 12mm;
      page-break-after: always;
      position: relative;
      background: ${COLORS.white};
    }
    
    .page:last-child { page-break-after: auto; }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 2px solid ${COLORS.primary};
      margin-bottom: 15px;
    }
    
    .page-title {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: ${COLORS.primary};
    }
    
    .page-number { font-size: 10px; color: ${COLORS.muted}; }
    
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: 280mm;
    }
    
    .cover-logo {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: ${COLORS.primary};
      margin-bottom: 30px;
    }
    
    .cover-title {
      font-family: 'Outfit', sans-serif;
      font-size: 32px;
      font-weight: 700;
      color: ${COLORS.dark};
      margin-bottom: 10px;
    }
    
    .cover-subtitle { font-size: 16px; color: ${COLORS.muted}; margin-bottom: 40px; }
    .cover-client { font-size: 22px; font-weight: 600; color: ${COLORS.dark}; margin-bottom: 5px; }
    .cover-date { font-size: 12px; color: ${COLORS.muted}; }
    
    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin: 20px auto;
      border: 6px solid;
    }
    
    .score-value { font-family: 'Outfit', sans-serif; font-size: 36px; font-weight: 700; }
    .score-label { font-size: 10px; color: ${COLORS.muted}; }
    
    .card {
      background: ${COLORS.white};
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }
    
    .card-header {
      font-family: 'Outfit', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: ${COLORS.dark};
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .card-highlight { border-left: 4px solid ${COLORS.primary}; }
    .card-success { border-left: 4px solid ${COLORS.secondary}; background: #f0fdf4; }
    .card-warning { border-left: 4px solid ${COLORS.warning}; background: #fffbeb; }
    .card-danger { border-left: 4px solid ${COLORS.danger}; background: #fef2f2; }
    
    .grid { display: grid; gap: 12px; }
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-4 { grid-template-columns: repeat(4, 1fr); }
    
    .kpi { text-align: center; padding: 10px; }
    .kpi-value { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 700; color: ${COLORS.dark}; }
    .kpi-label { font-size: 10px; color: ${COLORS.muted}; margin-top: 2px; }
    .kpi-trend { font-size: 10px; margin-top: 2px; }
    .kpi-trend.positive { color: ${COLORS.secondary}; }
    .kpi-trend.negative { color: ${COLORS.danger}; }
    
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: ${COLORS.primary}; color: ${COLORS.white}; padding: 8px; text-align: left; font-weight: 600; }
    td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) { background: #f9fafb; }
    
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    
    .chart-container { position: relative; height: 180px; margin: 10px 0; }
    .chart-container-small { height: 120px; }
    .chart-container-large { height: 220px; }
    
    .gauge { position: relative; width: 100%; height: 80px; margin: 10px 0; }
    .gauge-bar { position: absolute; bottom: 20px; left: 0; right: 0; height: 12px; background: #e5e7eb; border-radius: 6px; overflow: hidden; }
    .gauge-fill { height: 100%; border-radius: 6px; }
    .gauge-value { position: absolute; bottom: 40px; font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700; }
    .gauge-labels { position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 9px; color: ${COLORS.muted}; }
    
    .progress { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin: 5px 0; }
    .progress-fill { height: 100%; border-radius: 4px; }
    
    .action-item { display: flex; gap: 10px; padding: 10px; border-left: 3px solid ${COLORS.primary}; margin-bottom: 8px; background: #f9fafb; }
    .action-number { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700; color: ${COLORS.primary}; width: 25px; }
    .action-content { flex: 1; }
    .action-title { font-weight: 600; margin-bottom: 2px; }
    .action-desc { font-size: 10px; color: ${COLORS.muted}; }
    
    .page-footer {
      position: absolute;
      bottom: 10mm;
      left: 12mm;
      right: 12mm;
      font-size: 8px;
      color: ${COLORS.muted};
      text-align: center;
      border-top: 1px solid #e5e7eb;
      padding-top: 5px;
    }
    
    .text-primary { color: ${COLORS.primary}; }
    .text-success { color: ${COLORS.secondary}; }
    .text-warning { color: ${COLORS.warning}; }
    .text-danger { color: ${COLORS.danger}; }
    .text-muted { color: ${COLORS.muted}; }
    .font-bold { font-weight: 600; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    
    @media print { .page { margin: 0; padding: 10mm; } }
  `
}
