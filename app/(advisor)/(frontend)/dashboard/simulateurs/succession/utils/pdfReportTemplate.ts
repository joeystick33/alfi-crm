/**
 * Générateur de rapport HTML professionnel pour export PDF.
 * Produit un document HTML autonome avec CSS @page A4,
 * page de garde, toutes les sections, et page de clôture.
 */

/* ── helpers ───────────────────────────────────── */
const fmtEur = (v: number | null | undefined): string => {
  if (v == null || isNaN(v)) return '0 €';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
};
const pctFmt = (v: number | null | undefined): string => {
  if (v == null) return '0 %';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(v) + ' %';
};
const ASSET_LABELS: Record<string, string> = {
  RESIDENCE_PRINCIPALE: 'Immobilier',
  TITRES_SOCIETE: 'Titres de société',
  BIENS_RURAUX_GFA: 'Biens ruraux / GFA',
  BOIS_FORETS: 'Bois et forêts',
  MONUMENT_HISTORIQUE: 'Monument historique',
  OEUVRE_ART: 'Oeuvre d art',
  BIENS_AGRICOLES: 'Biens agricoles',
  IMMOBILIER: 'Immobilier',
  FINANCIER: 'Financier',
  PROFESSIONNEL: 'Professionnel',
  MOBILIER: 'Mobilier',
  AUTRE: 'Patrimoine divers',
};
const humanizeLabel = (value: unknown): string => {
  if (value == null) return '—';
  const raw = String(value).trim();
  if (!raw) return '—';
  const cleaned = raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').toLowerCase();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};
const readableAssetLabel = (value: unknown): string => {
  if (value == null) return '—';
  const key = String(value).trim();
  if (!key) return '—';
  return ASSET_LABELS[key] || humanizeLabel(key);
};
const pickMeaningful = (...candidates: unknown[]): string | null => {
  for (const c of candidates) {
    if (c == null) continue;
    const s = String(c).trim();
    if (!s) continue;
    if (['AUTRE', 'autre', 'OTHER', 'other', 'DIVERS', 'divers'].includes(s)) continue;
    return s;
  }
  return null;
};

/* ── USF scale (art. 669 CGI) ──────────────────── */
const USF_SCALE: [number, number][] = [
  [20, 90], [30, 80], [40, 70], [50, 60], [60, 50], [70, 40], [80, 30], [90, 20], [91, 10],
];
const getUsfPct = (age: number) => {
  for (const [maxAge, pct] of USF_SCALE) { if (age <= maxAge) return pct; }
  return 10;
};
const getNpPct = (age: number) => 100 - getUsfPct(age);
const getFiscalValueForRow = (h: any): number => {
  if (!h || typeof h !== 'object') return 0;
  return h.valeurFiscaleDroit
    ?? h.valeurTaxable
    ?? h.taxableValue
    ?? h.assietteFiscale
    ?? h.baseAvantAbattement
    ?? h.baseTaxable
    ?? h.montantTransmis
    ?? 0;
};

/* ── types ─────────────────────────────────────── */
export interface ReportData {
  simulationData: any;
  base: any;
  clientName: string;
  isMarie: boolean;
  isPacse: boolean;
  isConcubin: boolean;
  isCelibataire: boolean;
  ddvSelected: boolean;
  hasTestament?: boolean;
  allCommonChildren?: boolean;
  nbEnfants: number;
  bestLegal: any;
  bestDdv: any;
  legalChartData: any[];
  ddvChartData: any[];
  conseillerNom?: string;
  conseillerEmail?: string;
  conseillerTel?: string;
  conseillerSiteWeb?: string;
  cabinetNom?: string;
  resultatInverse?: any; // Full inverse scenario results (mode couple: spouse dies first)
}

/* ══════════════════════════════════════════════════ */
/*  MAIN EXPORT                                       */
/* ══════════════════════════════════════════════════ */
export function generateReportHTML(d: ReportData): string {
  /* base = data.resultatsBase (raw API response), or data itself as fallback */
  const meta = d.base?.metadata;
  const patrimoine = d.base?.patrimoine;
  const sc1 = d.base?.scenario1;
  const sc2 = d.base?.scenario2;
  const legalScenarios: any[] = d.base?.scenariosLegaux || [];
  const ddvScenarios: any[] = d.base?.scenariosDDV || [];
  /* optimisations may be overwritten at top level by a separate API call */
  const optim = d.base?.optimisations || (d as any)._optimisations;
  const alertes: any[] = d.base?.alertes || [];
  const showSecondDeath = d.isMarie || (d.isPacse && !!d.hasTestament);
  const allCommonChildren = d.allCommonChildren !== false;
  const invResult = d.resultatInverse;
  const invSc1 = invResult?.scenario1;
  const invSc2 = invResult?.scenario2;

  /* DEBUG: log what we received so we can trace missing data */
  console.log('[PDF Template] base keys:', d.base ? Object.keys(d.base) : 'null');
  console.log('[PDF Template] sc1:', !!sc1, '| sc2:', !!sc2, '| patrimoine:', !!patrimoine, '| meta:', !!meta);
  console.log('[PDF Template] legal:', legalScenarios.length, '| ddv:', ddvScenarios.length, '| alertes:', alertes.length);

  const dateEtude = meta?.dateEtude || new Date().toLocaleDateString('fr-FR');
  const ageClient = meta?.client?.age || d.simulationData?.identite?.age || 55;
  const ageUsufruitier = d.simulationData?.conjoint?.age;
  const sexeClient = meta?.client?.sexe || d.simulationData?.identite?.sexe || 'M';
  const esperanceVie = sexeClient === 'F' ? 85 : 80;
  const civilite = meta?.client?.sexe === 'F' ? 'Madame' : 'Monsieur';
  const abattementParEnfant = 100000;
  const maxDonation = d.nbEnfants * abattementParEnfant;
  const enfantsDeclares = Array.isArray(d.simulationData?.enfants) ? d.simulationData.enfants : [];
  const scenarioComparisonEconomy = (invSc1 && sc1)
    ? Math.abs(
        ((sc1?.droitsSuccession || 0) + (sc2?.droitsSuccession || 0)) -
        ((invSc1?.droitsSuccession || 0) + (invSc2?.droitsSuccession || 0))
      )
    : null;

  const refNum = `DS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  /* ── section builder ─────────────────────────── */
  let sectionNum = 0;
  const section = (title: string, content: string, opts?: { subtitle?: string }) => {
    sectionNum++;
    return `
      <div class="section">
        <div class="section-header">
          <span class="section-num">${String(sectionNum).padStart(2, '0')}</span>
          <div>
            <h2 class="section-title">${title}</h2>
            ${opts?.subtitle ? `<p class="section-subtitle">${opts.subtitle}</p>` : ''}
          </div>
        </div>
        ${content}
      </div>`;
  };

  /* ── bar chart builder (pure HTML/CSS) ────────── */
  const barChart = (items: { label: string; value: number; color?: string }[], opts?: { title?: string; commentary?: string }) => {
    const maxVal = Math.max(...items.map(i => Math.abs(i.value)), 1);
    let html = `<div class="bar-chart">`;
    const commentary = opts?.commentary || "Lecture : plus la barre est longue, plus le montant correspondant est élevé.";
    if (opts?.title) html += `<p style="font-size:12px;font-weight:700;color:#0c2340;margin-bottom:8px">${opts.title}</p>`;
    items.forEach(item => {
      const pct = Math.max(2, (Math.abs(item.value) / maxVal) * 100);
      const cls = item.color || 'teal';
      html += `<div class="bar-row"><div class="bar-label">${item.label}</div><div class="bar-track"><div class="bar-fill ${cls}" style="width:${pct.toFixed(1)}%"></div></div><div class="bar-amount">${fmtEur(item.value)}</div></div>`;
    });
    html += `<p class="chart-caption">${commentary}</p>`;
    html += `</div>`;
    return html;
  };

  /* ── SVG color palette (same as frontend Recharts) ── */
  const CHART_COLORS = ['#0c2340','#0d7377','#c9a84c','#6d28d9','#d35244','#16365c','#14a3a8','#e8d48b'];

  /* ── SVG donut chart builder ──────────────────── */
  const svgDonut = (items: { name: string; value: number }[], opts?: { title?: string; commentary?: string }) => {
    const total = items.reduce((sum, x) => sum + x.value, 0);
    if (total === 0 || items.length === 0) return '';
    const w = 460, chartH = 200;
    const legendRows = Math.ceil(items.length / 2);
    const legendH = legendRows * 22 + 10;
    const h = chartH + legendH;
    const cx = w / 2, cy = chartH / 2;
    const outerR = 80, innerR = 50;

    const commentary = opts?.commentary || "Lecture : chaque secteur représente la part d'une catégorie dans votre patrimoine global.";
    let svg = '';
    if (opts?.title) svg += `<p style="font-size:12px;font-weight:700;color:#0c2340;margin-bottom:6px">${opts.title}</p>`;
    svg += `<div style="text-align:center;margin:8px 0"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="font-family:'Segoe UI',sans-serif">`;

    let angle = -Math.PI / 2;
    if (items.length === 1) {
      svg += `<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${CHART_COLORS[0]}" stroke="white" stroke-width="2"/>`;
      svg += `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="white"/>`;
    } else {
      items.forEach((item, i) => {
        const sweep = (item.value / total) * 2 * Math.PI;
        if (sweep < 0.01) return;
        const endAngle = angle + sweep;
        const large = sweep > Math.PI ? 1 : 0;
        const x1 = cx + outerR * Math.cos(angle), y1 = cy + outerR * Math.sin(angle);
        const x2 = cx + outerR * Math.cos(endAngle), y2 = cy + outerR * Math.sin(endAngle);
        const x3 = cx + innerR * Math.cos(endAngle), y3 = cy + innerR * Math.sin(endAngle);
        const x4 = cx + innerR * Math.cos(angle), y4 = cy + innerR * Math.sin(angle);
        svg += `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${outerR},${outerR} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} L${x3.toFixed(1)},${y3.toFixed(1)} A${innerR},${innerR} 0 ${large} 0 ${x4.toFixed(1)},${y4.toFixed(1)} Z" fill="${CHART_COLORS[i % CHART_COLORS.length]}" stroke="white" stroke-width="2"/>`;
        const mid = angle + sweep / 2;
        const lblR = (outerR + innerR) / 2;
        const lx = cx + lblR * Math.cos(mid), ly = cy + lblR * Math.sin(mid);
        const pctVal = ((item.value / total) * 100);
        if (pctVal >= 8) {
          svg += `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" font-size="10" fill="white" font-weight="700">${pctVal.toFixed(0)}%</text>`;
        }
        angle = endAngle;
      });
    }
    svg += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="9" fill="#8894a7">Total</text>`;
    svg += `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="14" fill="#0c2340" font-weight="800">${fmtEur(total)}</text>`;
    items.forEach((item, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const lx = 40 + col * (w / 2);
      const ly = chartH + 10 + row * 20;
      const pct2 = ((item.value / total) * 100).toFixed(0);
      svg += `<rect x="${lx}" y="${ly}" width="10" height="10" rx="2" fill="${CHART_COLORS[i % CHART_COLORS.length]}"/>`;
      svg += `<text x="${lx + 14}" y="${ly + 9}" font-size="9.5" fill="#3a4a5c">${item.name} — ${fmtEur(item.value)} (${pct2}%)</text>`;
    });
    svg += `</svg></div>`;
    svg += `<p class="chart-caption">${commentary}</p>`;
    return svg;
  };

  /* ── SVG horizontal bar chart builder ─────────── */
  const svgHBar = (items: { label: string; value: number; color?: string }[], opts?: { title?: string; labelWidth?: number; commentary?: string }) => {
    if (items.length === 0) return '';
    const maxVal = Math.max(...items.map(i => Math.abs(i.value)), 1);
    const labelW = opts?.labelWidth || 110;
    const barMaxW = 230;
    const w = labelW + barMaxW + 120;
    const barH = 26, gap = 8;
    const titleH = opts?.title ? 28 : 0;
    const h = titleH + items.length * (barH + gap) + 4;

    const commentary = opts?.commentary || "Lecture : les montants sont comparés à échelle identique, de haut en bas.";
    let svg = `<div style="margin:12px 0"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="font-family:'Segoe UI',sans-serif">`;
    if (opts?.title) svg += `<text x="0" y="18" font-size="11" font-weight="700" fill="#0c2340">${opts.title}</text>`;
    items.forEach((item, i) => {
      const y = titleH + i * (barH + gap);
      const barLen = Math.max(6, (Math.abs(item.value) / maxVal) * barMaxW);
      const color = item.color || CHART_COLORS[i % CHART_COLORS.length];
      svg += `<text x="${labelW - 8}" y="${y + barH / 2 + 4}" text-anchor="end" font-size="10" fill="#3a4a5c" font-weight="600">${item.label}</text>`;
      svg += `<rect x="${labelW}" y="${y + 1}" width="${barLen.toFixed(0)}" height="${barH - 2}" rx="4" fill="${color}"/>`;
      svg += `<text x="${labelW + barLen + 8}" y="${y + barH / 2 + 4}" font-size="10" fill="#0c2340" font-weight="700">${fmtEur(item.value)}</text>`;
    });
    svg += `</svg><p class="chart-caption">${commentary}</p></div>`;
    return svg;
  };

  /* ── SVG vertical bar chart builder ─────────── */
  const svgVBar = (items: { label: string; value: number; color?: string }[], opts?: { title?: string; height?: number; commentary?: string }) => {
    if (items.length === 0) return '';
    const maxVal = Math.max(...items.map(i => Math.abs(i.value)), 1);
    const chartW = 420, chartH = opts?.height || 160;
    const padL = 70, padR = 20, padT = opts?.title ? 30 : 10, padB = 30;
    const w = chartW, h = chartH + padT + padB;
    const plotW = chartW - padL - padR;
    const plotH = chartH;
    const barW = Math.min(50, (plotW / items.length) * 0.6);
    const barGap = (plotW - barW * items.length) / (items.length + 1);

    const commentary = opts?.commentary || "Lecture : plus la barre est haute, plus le coût ou le gain associé est important.";
    let svg = `<div style="margin:14px 0"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="font-family:'Segoe UI',sans-serif">`;
    if (opts?.title) svg += `<text x="${padL}" y="18" font-size="11" font-weight="700" fill="#0c2340">${opts.title}</text>`;

    // Grid lines
    const gridSteps = 4;
    for (let g = 0; g <= gridSteps; g++) {
      const gy = padT + plotH - (g / gridSteps) * plotH;
      const gVal = (g / gridSteps) * maxVal;
      svg += `<line x1="${padL}" y1="${gy}" x2="${padL + plotW}" y2="${gy}" stroke="#e8ecf1" stroke-width="1" stroke-dasharray="3,3"/>`;
      svg += `<text x="${padL - 6}" y="${gy + 3}" text-anchor="end" font-size="8" fill="#8894a7">${fmtEur(gVal)}</text>`;
    }
    // Baseline
    svg += `<line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" stroke="#d1d9e0" stroke-width="1"/>`;

    items.forEach((item, i) => {
      const color = item.color || CHART_COLORS[i % CHART_COLORS.length];
      const barHt = (Math.abs(item.value) / maxVal) * plotH;
      const x = padL + barGap + i * (barW + barGap);
      const y = padT + plotH - barHt;
      svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${barHt.toFixed(1)}" rx="4" fill="${color}"/>`;
      // Value on top
      svg += `<text x="${(x + barW / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" font-size="8" fill="#0c2340" font-weight="700">${fmtEur(item.value)}</text>`;
      // Label below
      svg += `<text x="${(x + barW / 2).toFixed(1)}" y="${(padT + plotH + 14).toFixed(1)}" text-anchor="middle" font-size="8.5" fill="#5a6a7a">${item.label}</text>`;
    });
    svg += `</svg><p class="chart-caption">${commentary}</p></div>`;
    return svg;
  };

  /* ── table builder ───────────────────────────── */
  const table = (headers: string[], rows: string[][], opts?: { highlightLast?: boolean; compact?: boolean }) => {
    const cls = opts?.compact ? 'data-table compact' : 'data-table';
    const ths = headers.map(h => `<th>${h}</th>`).join('');
    const trs = rows.map((cols, i) => {
      const isLast = i === rows.length - 1 && opts?.highlightLast;
      const cls2 = isLast ? ' class="row-total"' : '';
      return `<tr${cls2}>${cols.map(c => `<td>${c}</td>`).join('')}</tr>`;
    }).join('');
    return `<table class="${cls}"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  };

  /* ══════════════════════════════════════════════ */
  /*  SECTIONS                                      */
  /* ══════════════════════════════════════════════ */

  /* ── 1. Situation ─────────────────────────────── */
  const etapesIntro = d.isMarie
    ? 'régime matrimonial, dévolution légale, fiscalité, options du conjoint survivant'
    : d.isPacse
      ? 'droits du partenaire, dévolution légale, fiscalité'
      : d.isConcubin
        ? 'situation du concubin, dévolution légale, fiscalité'
        : 'dévolution légale, fiscalité, stratégies de transmission';
  let situationText = `<p>${civilite} ${d.clientName}, vous avez entre les mains votre <b>diagnostic successoral</b>. Anticiper sa succession, c'est protéger ses proches : savoir ce qu'ils recevront, combien l'État prélèvera, et surtout <em>quels leviers activer</em> pour optimiser la transmission de votre patrimoine. Ce rapport analyse étape par étape — ${etapesIntro} — et vous propose des <b>stratégies d'optimisation chiffrées</b> adaptées à votre situation personnelle. Chaque section est conçue pour être compréhensible, même sans connaissance juridique préalable.</p>`;

  situationText += `<p>Cette simulation porte sur la succession de <b>${civilite} ${d.clientName}</b>, âgé(e) de <b>${ageClient} ans</b>.`;
  if (d.isMarie) situationText += ` Vous êtes <b>marié(e)</b> sous le régime <b>${meta?.regimeMatrimonial || meta?.statutMatrimonial || 'communauté réduite aux acquêts'}</b>.`;
  if (d.isPacse) situationText += ` Vous êtes <b>pacsé(e)</b>.`;
  if (d.isConcubin) situationText += ` Vous êtes en <b>concubinage</b>.`;
  if (d.isCelibataire) situationText += ` Vous êtes <b>célibataire</b>. Votre succession sera dévolue selon les règles des ordres et degrés du Code civil.`;
  situationText += `</p>`;

  if (d.simulationData?.conjoint?.prenom) {
    const label = d.isMarie ? 'conjoint survivant(e)' : d.isPacse ? 'partenaire de PACS' : 'concubin(e)';
    situationText += `<p>Votre ${label} est <b>${d.simulationData.conjoint.prenom} ${d.simulationData.conjoint.nom || ''}</b>, âgé(e) de <b>${d.simulationData.conjoint.age || '–'} ans</b>.`;
    if (d.ddvSelected) situationText += ` Une <b>Donation au Dernier Vivant</b> est en place.`;
    situationText += `</p>`;
  }

  if (d.nbEnfants > 0) {
    situationText += `<p>Vous avez <b>${d.nbEnfants} enfant(s)</b>, qui sont vos héritiers réservataires. La loi leur garantit une part minimale de votre patrimoine (la <em>réserve héréditaire</em>).</p>`;
    if (enfantsDeclares.length > 0) {
      const enfantsList = enfantsDeclares.map((enfant: any, idx: number) => {
        const prenomNom = `${enfant?.prenom || `Enfant ${idx + 1}`} ${enfant?.nom || ''}`.trim();
        const ageTxt = enfant?.age != null ? `${enfant.age} ans` : 'âge non renseigné';
        return `<li><b>${prenomNom}</b> — ${ageTxt}</li>`;
      }).join('');
      situationText += `<div class="info-box green"><div class="info-box-title">Enfants déclarés</div><ul class="children-list">${enfantsList}</ul></div>`;
    }
  } else {
    situationText += `<p>Vous n'avez pas d'enfant. En l'absence d'héritiers réservataires, vous disposez d'une liberté totale pour organiser votre transmission par testament.</p>`;
  }

  situationText += `<div class="note"><b>Date de l'étude :</b> ${dateEtude} — Ce rapport est une simulation à visée pédagogique basée sur la législation fiscale en vigueur. Il ne remplace pas le conseil personnalisé d'un notaire ou d'un conseiller en gestion de patrimoine.</div>`;

  const s1 = section('Votre situation', situationText, { subtitle: 'Les informations qui déterminent le cadre juridique et fiscal de votre succession' });

  /* ── 2. Patrimoine ─────────────────────────────── */
  let patrimoineHTML = `<p>La première étape d'une succession consiste à dresser l'<b>inventaire complet du patrimoine</b> : tous les biens (immobiliers, financiers, professionnels, etc.) et toutes les dettes. C'est à partir du <em>patrimoine net</em> (biens − dettes) que sera calculée la masse successorale.</p>`;
  patrimoineHTML += `<p>Votre patrimoine brut s'élève à <b>${fmtEur(patrimoine?.totalBrut)}</b>. Après déduction des dettes (<b>${fmtEur((patrimoine?.totalBrut || 0) - (patrimoine?.totalNet || 0))}</b>), votre <b>patrimoine net est de ${fmtEur(patrimoine?.totalNet)}</b>.${d.isMarie ? ' Ce patrimoine net sera ensuite partagé entre la part du conjoint et la part successorale lors de la liquidation du régime matrimonial (étape suivante).' : ' Ce patrimoine net constitue directement la base de calcul de votre succession.'}</p>`;

  if (patrimoine?.actifs?.length > 0) {
    const actifsSaisie = Array.isArray(d.simulationData?.actifs) ? d.simulationData.actifs : [];
    const rows = patrimoine.actifs.map((a: any, idx: number) => {
      const actifSaisi = actifsSaisie[idx] || {};
      const rawNature = pickMeaningful(
        a?.nature,
        a?.conditions?.sousType ||
        a?.conditions?.nature ||
        a?.conditions?.metadonnees?.nature ||
        actifSaisi?.conditions?.sousType,
        actifSaisi?.conditions?.metadonnees?.nature ||
        actifSaisi?.usage,
        actifSaisi?.conditions?.metadonnees?.sousType
      );
      const rawType = pickMeaningful(
        actifSaisi?.conditions?.metadonnees?.type_frontend,
        actifSaisi?.type_frontend,
        actifSaisi?.type,
        a?.conditions?.metadonnees?.type_frontend,
        a?.type
      );
      const designation =
        a?.designation ||
        a?.libelle ||
        actifSaisi?.conditions?.metadonnees?.intitule ||
        actifSaisi?.intitule ||
        '–';
      return [
        readableAssetLabel(rawType || a?.type || 'AUTRE'),
        humanizeLabel(rawNature || a?.conditions?.sousType || '—'),
        designation,
        fmtEur(a.valeur),
        fmtEur(a.dette),
        fmtEur(a.valeurNette),
      ];
    });
    rows.push([
      '<b>Total</b>', '', '', `<b>${fmtEur(patrimoine.totalBrut)}</b>`,
      `<b>${fmtEur((patrimoine.totalBrut || 0) - (patrimoine.totalNet || 0))}</b>`,
      `<b>${fmtEur(patrimoine.totalNet)}</b>`,
    ]);
    patrimoineHTML += table(['Type', 'Nature', 'Désignation', 'Valeur', 'Dette', 'Net'], rows, { highlightLast: true });
  }

  if (patrimoine?.repartition) {
    const r = patrimoine.repartition;
    const repRows = [
      { name: 'Immobilier', value: r.immobilier?.total || 0 },
      { name: 'Financier', value: r.financier?.total || 0 },
      { name: 'Professionnel', value: r.professionnel?.total || 0 },
      { name: 'Autre', value: r.autre?.total || 0 },
    ].filter(x => x.value > 0);
    const totalVal = repRows.reduce((s, x) => s + x.value, 0);
    if (repRows.length > 0 && totalVal > 0) {
      patrimoineHTML += `<h3 class="sub-title">Répartition du patrimoine</h3>`;
      patrimoineHTML += svgDonut(repRows, {
        title: '',
        commentary: "Ce graphique montre la composition de votre patrimoine. Plus un secteur est important, plus cette catégorie pèse dans votre succession."
      });
      patrimoineHTML += table(
        ['Catégorie', 'Montant', 'Part'],
        repRows.map(x => [x.name, fmtEur(x.value), `${((x.value / totalVal) * 100).toFixed(1)} %`]),
        { compact: true }
      );
    }
  }

  const s2 = section('Votre patrimoine', patrimoineHTML, { subtitle: 'Première étape : inventorier l\'ensemble de vos biens et dettes' });

  /* ── 3. Liquidation régime matrimonial ───────── */
  let s3 = '';
  if (d.isMarie && sc1?.liquidation) {
    const liq = sc1.liquidation;
    const liqHTML = `
      <p>Lorsqu'on est marié, <b>tout le patrimoine ne rentre pas dans la succession</b>. Il faut d'abord « liquider » le régime matrimonial, c'est-à-dire séparer ce qui appartient au conjoint survivant de ce qui constitue la part du défunt.</p>
      <p>Sous le régime de la <b>${meta?.regimeMatrimonial || meta?.statutMatrimonial || 'communauté réduite aux acquêts'}</b>, les biens communs sont partagés en deux : la moitié revient automatiquement au conjoint survivant (ce n'est pas un héritage, c'est sa propriété). Seule l'autre moitié, ajoutée aux biens propres du défunt, constitue la <em>masse successorale</em> à partager entre les héritiers.</p>
      <p>Concrètement, sur un patrimoine net total de <b>${fmtEur(patrimoine?.totalNet)}</b>, la part entrant dans la succession est de <b>${fmtEur(liq.actifSuccessoral)}</b>.</p>
      ${table(
        ['Poste', 'Montant', 'Explication'],
        [
          ['Biens propres du défunt', fmtEur(liq.biensPropreDefunt), 'Biens acquis avant le mariage ou reçus par donation/succession'],
          ['Biens communs du couple', fmtEur(liq.biensCommuns), 'Biens acquis pendant le mariage (partagés 50/50)'],
          ['Part du conjoint (hors succession)', fmtEur(liq.partConjoint), '= moitié des biens communs → reste au conjoint'],
          ['Part du défunt (= masse successorale)', fmtEur(liq.partDefunt), '= biens propres + moitié des biens communs'],
          [`<b>Actif net successoral</b>`, `<b>${fmtEur(liq.actifSuccessoral)}</b>`, "C'est cette somme qui sera partagée entre les héritiers"],
        ],
        { highlightLast: true }
      )}`;
    s3 = section('Liquidation du régime matrimonial', liqHTML, { subtitle: 'Deuxième étape : déterminer ce qui entre réellement dans la succession' });
  }

  /* ── 4. Masse successorale ─────────────────────── */
  let s4 = '';
  if (sc1?.masse) {
    const m = sc1.masse;
    const rpAllowanceDeclared = Number(m.abattementResidence || 0);
    const rpAllowanceInferred = Number(m.civil || 0) - Number(m.fiscale || 0);
    const rpAllowance = rpAllowanceDeclared > 0 ? rpAllowanceDeclared : (rpAllowanceInferred > 0 ? rpAllowanceInferred : 0);
    const rpBaseDeclared = Number(m.baseResidenceAvantAbattement || 0);
    const rpBaseUsed = rpBaseDeclared > 0 ? rpBaseDeclared : (rpAllowance > 0 ? rpAllowance / 0.20 : 0);
    const reserveFraction = d.nbEnfants === 1 ? '1/2' : d.nbEnfants === 2 ? '2/3' : '3/4';
    const qdFraction = d.nbEnfants === 1 ? '1/2' : d.nbEnfants === 2 ? '1/3' : '1/4';
    const massRows: any[] = [
      ['Masse de calcul (civil)', fmtEur(m.civil), 'Base pour déterminer réserve et QD (art. 922 C.civ)'],
      ['Réserve héréditaire', fmtEur(m.reserve), `Part garantie aux ${d.nbEnfants} enfant(s) — intouchable`],
      ['Quotité disponible', fmtEur(m.quotiteDisponible), 'Part librement transmissible (conjoint, tiers, legs)'],
    ];
    if (rpAllowance > 0) {
      massRows.push(
        ['Abattement résidence (20 %)', `- ${fmtEur(rpAllowance)}`, 'Art. 764 bis CGI — appliqué sur la résidence principale retenue'],
        ['Base RP retenue', fmtEur(rpBaseUsed), 'Valeur de résidence principale prise en compte pour l\'abattement'],
      );
    }
    massRows.push([`<b>Masse fiscale</b>`, `<b>${fmtEur(m.fiscale)}</b>`, 'Base de calcul des droits de succession']);
    const masseHTML = `
      <p>La <b>masse de calcul</b> (art. 922 C.civ) est le montant à partir duquel on détermine deux choses essentielles : la <em>réserve héréditaire</em> (part intouchable réservée à vos enfants) et la <em>quotité disponible</em> (part que vous pouvez transmettre librement, par exemple au conjoint ou à un tiers via un testament).</p>
      ${d.nbEnfants > 0
        ? `<p>Avec <b>${d.nbEnfants} enfant(s)</b>, la loi impose une réserve héréditaire de <b>${reserveFraction}</b> du patrimoine, soit <b>${fmtEur(m.reserve)}</b>. La quotité disponible — la part librement transmissible — est de <b>${fmtEur(m.quotiteDisponible)}</b> (${qdFraction} du patrimoine).</p>`
        : `<p>En l'absence d'enfant, il n'y a pas de réserve héréditaire. Vous disposez d'une <b>liberté totale de transmission</b>.</p>`
      }
      <p>La <b>masse fiscale</b> (<b>${fmtEur(m.fiscale)}</b>) est la base sur laquelle seront calculés les droits de succession de chaque héritier.</p>
      <p>Règle de calcul : l'abattement RP s'applique sur la <b>part de résidence principale qui entre dans la succession</b>. Si la RP est un bien commun, <b>seule la moitié</b> est retenue, puis on applique 20 % sur cette base.</p>
      ${rpAllowance > 0
        ? `<p>Détail fiscal : <b>${fmtEur(m.fiscale)}</b> = ${fmtEur(m.civil)} - ${fmtEur(rpAllowance)}. L'abattement de ${fmtEur(rpAllowance)} correspond à 20 % d'une valeur de résidence principale retenue de <b>${fmtEur(rpBaseUsed)}</b>. Formule : abattement RP = 20 % × base RP successorale.</p>`
        : ''
      }
      ${table(
        ['Élément', 'Montant', 'Signification'],
        massRows,
        { highlightLast: true }
      )}`;
    s4 = section('Masse successorale & réserve héréditaire', masseHTML, { subtitle: `${d.isMarie ? 'Troisième' : 'Deuxième'} étape : déterminer les limites de ce que vous pouvez transmettre librement` });
  }

  /* ── 5. Dévolution légale ──────────────────────── */
  let s5 = '';
  if (sc1) {
    let legalHTML = '';

    // Introduction pédagogique
    legalHTML += `<p>Avant d'examiner le résultat effectif de votre simulation, il est important de comprendre le <b>cadre légal</b> applicable. En l'absence de testament, c'est le <b>Code civil (art. 731 et suivants)</b> qui détermine la répartition de la succession. On parle alors de <em>dévolution légale</em> ou <em>succession ab intestat</em>.</p>`;

    // ── PACS ──
    if (d.isPacse) {
      legalHTML += `<div class="info-box red"><div class="info-box-title">🚨 PACS — Aucun droit successoral légal (art. 515-6 C.civ)</div>Contrairement au conjoint marié, le partenaire de PACS n'est PAS héritier légal. Sans testament, il ne reçoit rien de la succession. En revanche, s'il est institué légataire par testament, il bénéficie de la même exonération fiscale que le conjoint marié (loi TEPA 2007, art. 796-0 bis CGI).</div>`;
      legalHTML += `<p><b>Situation légale du partenaire de PACS :</b> Le partenaire pacsé ne figure pas parmi les héritiers légaux définis par le Code civil. En l'absence de testament, <b>il ne reçoit aucune part de la succession</b>.</p>`;
      if (d.nbEnfants > 0) {
        legalHTML += `<p>Les <b>${d.nbEnfants} enfant(s)</b> héritent de la totalité de la succession en <b>pleine propriété</b>, à parts égales (art. 734 C.civ). Chaque enfant bénéficie d'un abattement de <b>100 000 €</b> (art. 779 CGI).</p>`;
      }
      // Tableau PACS vs Mariage
      legalHTML += `<h3 class="sub-title" style="margin-top:12px">PACS vs Mariage — Comparaison des droits successoraux</h3>`;
      legalHTML += table(
        ['Critère', 'PACS', 'Mariage'],
        [
          ['<b>Héritier légal ?</b>', '<span style="color:#d35244;font-weight:700">Non — aucun droit sans testament</span>', '<span style="color:#0d7377;font-weight:700">Oui — héritier légal de plein droit</span>'],
          ['<b>Avec testament</b>', 'Peut recevoir la quotité disponible (QD)', 'Peut recevoir la QD + options légales (USF ou 1/4 PP)'],
          ['<b>Fiscalité</b>', '<span style="color:#0d7377">Exonéré (art. 796-0 bis CGI)</span>', '<span style="color:#0d7377">Exonéré (art. 796-0 bis CGI)</span>'],
          ['<b>Droit au logement</b>', 'Droit temporaire d\'un an (art. 763 C.civ)', 'Droit viager possible (art. 764 C.civ)'],
          ['<b>Réserve héréditaire</b>', 'Aucune part réservataire', 'Aucune part réservataire (mais droits légaux)'],
        ],
        { compact: true }
      );
      legalHTML += `<div class="verdict"><b>Recommandation :</b> Il est <b>indispensable</b> de rédiger un <b>testament</b> pour protéger votre partenaire pacsé. Sans testament, il ne recevra <b>rien</b>. L'<b>assurance-vie</b> constitue également un levier puissant pour transmettre hors succession.</div>`;
    }

    // ── CONCUBIN ──
    if (d.isConcubin) {
      legalHTML += `<div class="info-box red"><div class="info-box-title">🚨 Concubinage — Aucun droit successoral, taxation à 60 %</div>Le concubin n'a AUCUN droit successoral légal. Même avec un testament, les sommes transmises sont taxées au taux forfaitaire de 60 % (art. 777 CGI), après un abattement dérisoire de 1 594 € seulement.</div>`;
      legalHTML += `<p><b>Situation légale du concubin :</b> Le concubinage (union libre) n'est pas reconnu par le droit successoral. Le concubin est considéré comme un <b>tiers</b>. En l'absence de testament, <b>il ne reçoit strictement rien</b>.</p>`;
      if (d.nbEnfants > 0) {
        legalHTML += `<p>Les <b>${d.nbEnfants} enfant(s)</b> héritent de la totalité en <b>pleine propriété</b>, à parts égales.</p>`;
      }
      // Tableau comparatif Concubinage vs PACS vs Mariage
      legalHTML += `<h3 class="sub-title" style="margin-top:12px">Concubinage vs PACS vs Mariage — Impact fiscal</h3>`;
      legalHTML += table(
        ['Critère', 'Concubinage', 'PACS', 'Mariage'],
        [
          ['<b>Héritier légal ?</b>', '<span style="color:#d35244;font-weight:700">Non</span>', '<span style="color:#d35244;font-weight:700">Non</span>', '<span style="color:#0d7377;font-weight:700">Oui</span>'],
          ['<b>Abattement</b>', '<span style="color:#d35244">1 594 € seulement</span>', '<span style="color:#0d7377">Exonération totale</span>', '<span style="color:#0d7377">Exonération totale</span>'],
          ['<b>Taux d\'imposition</b>', '<span style="color:#d35244;font-weight:700">60 % forfaitaire</span>', '<span style="color:#0d7377">0 % (exonéré)</span>', '<span style="color:#0d7377">0 % (exonéré)</span>'],
          ['<b>Protection du logement</b>', 'Aucune protection légale', 'Droit temporaire d\'un an', 'Droit viager possible'],
          ['<b>Exemple : legs de 100 000 €</b>', '<span style="color:#d35244;font-weight:700">59 044 € de droits</span>', '<span style="color:#0d7377">0 € de droits</span>', '<span style="color:#0d7377">0 € de droits</span>'],
        ],
        { compact: true }
      );
      legalHTML += `<div class="verdict"><b>Recommandation urgente :</b> La situation fiscale du concubinage est <b>extrêmement défavorable</b>. Pistes : <b>PACS ou mariage</b> (exonération totale), <b>assurance-vie</b> (152 500 € d'abattement/bénéficiaire avant 70 ans), <b>tontine</b> ou <b>SCI</b> pour la transmission progressive.</div>`;
    }

    // ── CÉLIBATAIRE ──
    if (d.isCelibataire) {
      if (d.nbEnfants > 0) {
        legalHTML += `<div class="info-box"><div class="info-box-title">⚖️ Dévolution légale — Célibataire avec ${d.nbEnfants} enfant(s)</div>En l'absence de conjoint, vos ${d.nbEnfants} enfant(s) héritent de la totalité de la succession en pleine propriété, à parts égales (art. 734 C.civ). Chaque enfant bénéficie d'un abattement de 100 000 € (art. 779 CGI). Il n'y a pas de démembrement puisqu'il n'y a pas de conjoint survivant.</div>`;
        legalHTML += `<p><b>Répartition :</b> Chaque enfant reçoit <b>1/${d.nbEnfants}e</b> en pleine propriété. La transmission est directe, sans démembrement.</p>`;
        legalHTML += `<p><b>Fiscalité :</b> Chaque enfant bénéficie d'un <b>abattement de 100 000 €</b> (art. 779 CGI). Au-delà, les droits sont calculés selon le barème progressif en ligne directe (de 5 % à 45 %). L'abattement se reconstitue tous les 15 ans.</p>`;
        legalHTML += `<p><b>Pas de second décès :</b> En l'absence de conjoint, il n'y a pas de simulation de « second décès ». La totalité du patrimoine est transmise en une seule fois aux enfants.</p>`;
        legalHTML += `<h3 class="sub-title" style="margin-top:12px">Barème des droits en ligne directe (enfants)</h3>`;
        legalHTML += table(
          ['Tranche (après abattement)', 'Taux'],
          [
            ['Jusqu\'à 8 072 €', '5 %'],
            ['De 8 072 € à 12 109 €', '10 %'],
            ['De 12 109 € à 15 932 €', '15 %'],
            ['De 15 932 € à 552 324 €', '20 %'],
            ['De 552 324 € à 902 838 €', '30 %'],
            ['De 902 838 € à 1 805 677 €', '40 %'],
            ['Au-delà de 1 805 677 €', '45 %'],
          ],
          { compact: true }
        );
      } else {
        legalHTML += `<div class="info-box"><div class="info-box-title">⚖️ Dévolution légale — Célibataire sans enfant</div>En l'absence de conjoint et d'enfant, la succession est dévolue selon le système des ordres et degrés défini par le Code civil (art. 734 et suivants). Les héritiers sont déterminés selon leur proximité de parenté avec le défunt.</div>`;
        legalHTML += `<p><b>Ordre des héritiers (art. 734 C.civ) :</b> Le Code civil définit quatre ordres d'héritiers. Un ordre prime sur les suivants : si des héritiers existent dans le premier ordre, les ordres inférieurs sont exclus.</p>`;
        legalHTML += `<h3 class="sub-title" style="margin-top:12px">Ordres d'héritiers et fiscalité applicable</h3>`;
        legalHTML += table(
          ['Ordre', 'Héritiers', 'Abattement', 'Taux'],
          [
            ['<b>1er</b>', 'Descendants (enfants, petits-enfants)', '100 000 € par enfant', '5 % à 45 % (barème progressif)'],
            ['<b>2e</b>', 'Parents + frères et sœurs', 'Parents : 100 000 € chacun — Fratrie : 15 932 €', 'Parents : 5-45 % — Fratrie : 35 % puis 45 %'],
            ['<b>3e</b>', 'Ascendants autres (grands-parents)', 'Aucun abattement spécifique', '5 % à 45 %'],
            ['<b>4e</b>', 'Collatéraux ordinaires (oncles, tantes, cousins)', '1 594 €', '55 % ou 60 %'],
          ],
          { compact: true }
        );

        legalHTML += `<p style="margin-top:14px"><b>Cas le plus fréquent — Parents et fratrie :</b> Si vos deux parents sont vivants, ils reçoivent chacun <b>1/4 en pleine propriété</b> (droit de retour légal). Les <b>frères et sœurs</b> se partagent la <b>moitié restante</b> à parts égales. Si un seul parent est vivant, il reçoit 1/4 et la fratrie 3/4. Si aucun parent n'est vivant, la fratrie hérite de la totalité.</p>`;
        legalHTML += `<p><b>Abattement spécifique fratrie :</b> Chaque frère ou sœur bénéficie d'un abattement de <b>15 932 €</b> (art. 779 CGI). Les droits sont ensuite calculés au taux de <b>35 %</b> jusqu'à 24 430 € puis <b>45 %</b> au-delà. L'exonération totale s'applique si le frère/la sœur est célibataire, veuf(ve), divorcé(e) ou séparé(e), âgé(e) de plus de 50 ans ou infirme, et a vécu avec le défunt pendant les 5 années précédant le décès (art. 796-0 ter CGI).</p>`;
      }
    }

    // ── MARIÉ — Options légales A et B ──
    if (d.isMarie) {
      legalHTML += `<div class="info-box"><div class="info-box-title">⚖️ Règles légales applicables (art. 757 C.civ)</div>${d.nbEnfants > 0
        ? `En présence du conjoint survivant et de ${d.nbEnfants} enfant(s) commun(s), le conjoint a le choix entre deux options prévues par la loi : (A) l'usufruit de la totalité de la succession, ou (B) 1/4 en pleine propriété. Les enfants se partagent le reste à parts égales. Nous allons analyser ces deux options en détail ci-dessous.`
        : `En l'absence d'enfant, le conjoint survivant hérite de la totalité ou partage avec les parents du défunt selon les règles des ordres et degrés (art. 757-2 C.civ).`
      }</div>`;

      if (d.nbEnfants > 0) {
        // Explications détaillées Option A et Option B
        legalHTML += `<p style="margin-top:12px"><b>Option A — Usufruit de la totalité (art. 757 al. 1 C.civ) :</b> Le conjoint survivant reçoit l'<em>usufruit</em> de la totalité des biens composant la succession. Concrètement, il conserve la jouissance complète du patrimoine : il peut habiter le logement, percevoir les loyers et revenus des placements, mais <b>ne peut pas vendre les biens sans l'accord des enfants</b> nus-propriétaires. Les enfants reçoivent la <em>nue-propriété</em> de tous les biens et sont taxés uniquement sur la valeur de cette nue-propriété, calculée selon le <b>barème fiscal de l'article 669 du CGI</b> (qui dépend de l'âge de l'usufruitier). Au décès du conjoint survivant, l'usufruit s'éteint automatiquement (art. 617 C.civ) : la nue-propriété rejoint la pleine propriété <b>sans aucun droit de succession supplémentaire</b> à payer. Seuls les biens propres du conjoint décédé seront taxés.</p>`;
        legalHTML += `<p><b>Option B — 1/4 en pleine propriété (art. 757 al. 2 C.civ) :</b> Le conjoint survivant reçoit <b>1/4 de la succession en toute propriété</b>. Les enfants se partagent les 3/4 restants en pleine propriété, à parts égales. Cette option est juridiquement plus simple (pas de démembrement) et donne au conjoint la libre disposition du quart reçu (il peut le vendre, le donner, etc.). En revanche, elle offre <b>moins de protection sur le logement</b> (droit temporaire d'un an au lieu du maintien intégral). Sur le plan fiscal, les enfants sont taxés sur une base plus importante (valeur en pleine propriété des 3/4). Au décès du conjoint, son patrimoine — comprenant le 1/4 hérité en pleine propriété + ses propres biens — <b>sera intégralement retaxé</b> dans sa propre succession.</p>`;

        // Tableau qualitatif comparatif
        legalHTML += `<h3 class="sub-title" style="margin-top:14px">Comparaison qualitative des deux options légales</h3>`;
        legalHTML += table(
          ['Critère', 'Option A — Usufruit total', 'Option B — 1/4 Pleine Propriété'],
          [
            ['<b>Part du conjoint</b>', '100 % en usufruit (jouissance de tous les biens)', '25 % en pleine propriété (libre disposition)'],
            ['<b>Part des enfants</b>', '100 % en nue-propriété (pas de jouissance immédiate)', '75 % en pleine propriété (propriété immédiate)'],
            ['<b>Protection du logement</b>', 'Maintien intégral — le conjoint peut rester à vie', 'Droit temporaire d\'un an minimum (art. 763 C.civ)'],
            ['<b>Fiscalité au 1er décès</b>', 'Enfants taxés sur la <em>nue-propriété</em> uniquement (décote selon l\'âge)', 'Enfants taxés sur la <em>pleine propriété</em> des 3/4 reçus (base plus élevée)'],
            ['<b>Mécanisme au 2nd décès</b>', 'L\'usufruit s\'éteint (art. 617) → NP rejoint PP <b>sans droits supplémentaires</b>', 'Le 1/4 PP hérité est <b>retaxé</b> dans la succession du conjoint'],
            ['<b>Actif taxable au 2nd décès</b>', 'Uniquement les biens propres du conjoint', 'Biens propres + le 1/4 PP reçu au 1er décès'],
          ],
          { compact: true }
        );
      }

      // Graphique comparatif
      if (legalScenarios.length > 0) {
        legalHTML += `<h3 class="sub-title" style="margin-top:14px">Comparaison visuelle des options légales</h3>`;
        const legalChartDroits = legalScenarios.map((ls: any) => {
          const fd = ls.premierDeces;
          const sd = ls.secondDeces;
          const td = (fd?.droitsSuccession || 0) + (sd?.droitsSuccession || 0);
          return { label: ls.optionLabel || ls.optionCode, value: td, color: '#d35244' };
        });
        legalHTML += svgVBar(legalChartDroits, { title: 'Total des droits de succession (2 décès)' });

        const legalChartNet = legalScenarios.map((ls: any) => {
          const fd = ls.premierDeces;
          const sd = ls.secondDeces;
          const tn = (fd?.transmissionNette || 0) + (sd?.transmissionNette || 0);
          return { label: ls.optionLabel || ls.optionCode, value: tn, color: '#0d7377' };
        });
        legalHTML += svgVBar(legalChartNet, { title: 'Transmission nette totale aux héritiers' });
      }

      // Tableau chiffré synthétique
      if (legalScenarios.length > 0) {
        legalHTML += `<h3 class="sub-title" style="margin-top:14px">Bilan chiffré des options légales (1er + 2nd décès)</h3>`;
        const legalRows = legalScenarios.map((ls: any) => {
          const fd = ls.premierDeces;
          const sd = ls.secondDeces;
          const td = (fd?.droitsSuccession || 0) + (sd?.droitsSuccession || 0);
          const tn = (fd?.transmissionNette || 0) + (sd?.transmissionNette || 0);
          return [
            `<b>${ls.optionLabel || ls.optionCode}</b>`,
            fmtEur(fd?.actifSuccessoral), fmtEur(fd?.droitsSuccession),
            fmtEur(sd?.actifSuccessoral), fmtEur(sd?.droitsSuccession),
            `<b>${fmtEur(td)}</b>`, `<b>${fmtEur(tn)}</b>`,
          ];
        });
        legalHTML += table(
          ['Option', 'Actif 1er décès', 'Droits 1er', 'Actif 2nd décès', 'Droits 2nd', 'Total droits', 'Net total'],
          legalRows,
          { compact: true }
        );

        // Détail par option (1er décès + 2nd décès avec héritiers)
        legalScenarios.forEach((ls: any, i: number) => {
          const fd = ls.premierDeces;
          const sd = ls.secondDeces;
          const totalDroits = (fd?.droitsSuccession || 0) + (sd?.droitsSuccession || 0);
          const isBest = d.bestLegal && d.legalChartData[i]?.totalDroits === d.bestLegal.totalDroits;
          const isOptionA = i === 0;

          legalHTML += `<div class="option-block${isBest ? ' best' : ''}">`;
          legalHTML += `<span class="option-badge${isBest ? ' best' : ''}">${isBest ? 'RECOMMANDÉE' : `OPTION ${String.fromCharCode(65 + i)}`}</span>`;
          legalHTML += `<h4 class="minor-title">${ls.optionLabel}</h4>`;

          // 1er décès
          legalHTML += `<div style="padding:12px 14px;background:#f0f4f8;border-radius:8px;margin-bottom:12px">`;
          legalHTML += `<p class="minor-subtitle">① Premier décès</p>`;
          legalHTML += `<p>${isOptionA
            ? `Le conjoint survivant reçoit l'<b>usufruit de la totalité</b> des biens successoraux (${fmtEur(fd?.actifSuccessoral)}). Les ${d.nbEnfants} enfant(s) reçoivent la <em>nue-propriété</em>, répartie à parts égales. Le conjoint est <b>exonéré de droits</b> (art. 796-0 bis CGI).`
            : `Le conjoint survivant reçoit <b>1/4 en pleine propriété</b> de l'actif successoral (${fmtEur(fd?.actifSuccessoral)}). Les ${d.nbEnfants} enfant(s) se partagent les <b>3/4 restants en pleine propriété</b>. Le conjoint est <b>exonéré de droits</b>.`
          }</p>`;
          legalHTML += `<div class="kpi-row" style="margin:6px 0"><div class="kpi"><div class="kpi-label">Actif</div><div class="kpi-value">${fmtEur(fd?.actifSuccessoral)}</div></div><div class="kpi"><div class="kpi-label">Droits</div><div class="kpi-value coral">${fmtEur(fd?.droitsSuccession)}</div></div><div class="kpi"><div class="kpi-label">Net transmis</div><div class="kpi-value teal">${fmtEur(fd?.transmissionNette)}</div></div></div>`;
          if (fd?.heritiers?.length > 0) {
            const fdRows = fd.heritiers.map((h: any) => [
              `<b>${h.nom}</b>`, h.typeDroit || '–', fmtEur(h.montantTransmis),
              fmtEur(getFiscalValueForRow(h)), fmtEur(h.abattement), fmtEur(h.baseApresAbattement),
              h.droits > 0 ? fmtEur(h.droits) : '<span style="color:#0d7377">Exonéré</span>',
            ]);
            legalHTML += table(['Héritier', 'Droit reçu', 'Valeur part (civile)', 'Valeur fiscale du droit', 'Abattement', 'Base taxable nette', 'Droits'], fdRows, { compact: true });
            if (isOptionA && typeof ageUsufruitier === 'number') {
              legalHTML += `<p class="chart-caption">Base fiscale art. 669 CGI (usufruitier ${ageUsufruitier} ans) : usufruit ${getUsfPct(ageUsufruitier)} % / nue-propriété ${getNpPct(ageUsufruitier)} %.</p>`;
            }
          }
          legalHTML += `</div>`;

          // 2nd décès
          legalHTML += `<div style="padding:12px 14px;background:${isOptionA ? '#f0faf9' : '#fdf8f3'};border-radius:8px;margin-bottom:12px">`;
          legalHTML += `<p class="minor-subtitle">② Second décès</p>`;
          legalHTML += `<p>${isOptionA
            ? `Au décès du conjoint, l'usufruit s'éteint (art. 617 C.civ). La nue-propriété rejoint la pleine propriété <b>sans droits supplémentaires</b>. L'actif taxable ne comprend que les biens propres du conjoint : <b>${fmtEur(sd?.actifSuccessoral)}</b>.`
            : `Au décès du conjoint, son patrimoine — biens propres + le 1/4 PP reçu au 1er décès — est <b>intégralement retaxé</b>. L'actif taxable est de <b>${fmtEur(sd?.actifSuccessoral)}</b>.`
          }</p>`;
          legalHTML += `<div class="kpi-row" style="margin:6px 0"><div class="kpi"><div class="kpi-label">Actif</div><div class="kpi-value">${fmtEur(sd?.actifSuccessoral)}</div></div><div class="kpi"><div class="kpi-label">Droits</div><div class="kpi-value coral">${fmtEur(sd?.droitsSuccession)}</div></div><div class="kpi"><div class="kpi-label">Net transmis</div><div class="kpi-value teal">${fmtEur(sd?.transmissionNette)}</div></div></div>`;
          if (sd?.heritiers?.length > 0) {
            const sdRows = sd.heritiers.map((h: any) => [
              `<b>${h.nom}</b>`, h.typeDroit || '–', fmtEur(h.montantTransmis),
              fmtEur(getFiscalValueForRow(h)), fmtEur(h.abattement), fmtEur(h.baseApresAbattement),
              h.droits > 0 ? fmtEur(h.droits) : '<span style="color:#0d7377">Exonéré</span>',
            ]);
            legalHTML += table(['Héritier', 'Droit reçu', 'Valeur part (civile)', 'Valeur fiscale du droit', 'Abattement', 'Base taxable nette', 'Droits'], sdRows, { compact: true });
          }
          legalHTML += `</div>`;

          // Coût fiscal total
          legalHTML += `<div class="kpi-row"><div class="kpi highlight-kpi"><div class="kpi-label">Coût fiscal total (2 décès)</div><div class="kpi-value coral">${fmtEur(totalDroits)}</div></div></div>`;
          legalHTML += `</div>`; // end option-block
        });
      }

      if (d.bestLegal) {
        legalHTML += `<div class="recommendation" style="margin-top:12px"><b>Recommandation :</b> L'option <span class="highlight">${d.bestLegal.name}</span> est la plus avantageuse fiscalement avec un total de droits de <b>${fmtEur(d.bestLegal.totalDroits)}</b> sur les deux décès.</div>`;
      }
    }

    s5 = section('Dévolution légale — Le cadre ab intestat', legalHTML, { subtitle: 'Ce que prévoit la loi en l\'absence de testament ou de donation au dernier vivant' });
  }

  /* ── 6. Dévolution effective — 1er décès ──────── */
  let s6 = '';
  if (sc1) {
    const sc1Label = sc1.label || (d.isMarie && sc1.optionConjoint ? sc1.optionConjoint : 'Dévolution légale (ab intestat)');
    const sc1Defunt = sc1.defunt || meta?.client;
    let devHTML = `<div class="info-box" style="margin-bottom:12px"><div class="info-box-title">${sc1Label}</div>Décès ${sc1Defunt ? `de ${sc1Defunt.prenom || ''} ${sc1Defunt.nom || ''}`.trim() : 'du client'}</div>`;

    // Heir detail cards (matching web's individual cards)
    if (sc1.heritiers?.length > 0) {
      sc1.heritiers.forEach((h: any) => {
        const isExonere = h.droits === 0;
        devHTML += `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;margin-bottom:6px;background:#f8f9fc;border-radius:8px;border-left:3px solid ${isExonere ? '#0d7377' : '#c9a84c'}">`;
        devHTML += `<div style="flex:1"><b>${h.nom}</b> <span style="font-size:12px;color:#5a6a7a">— ${h.lien || '–'} · ${h.typeDroit || 'Pleine propriété'} · ${pctFmt(h.quotite)}</span></div>`;
        devHTML += `<div style="text-align:right;font-size:12px"><b>${fmtEur(h.montantTransmis)}</b> <span style="color:${isExonere ? '#0d7377' : '#c9a84c'};font-size:12px">(droits : ${isExonere ? 'Exonéré' : fmtEur(h.droits)})</span></div>`;
        devHTML += `</div>`;
      });
    }

    // Summary table
    if (sc1.heritiers?.length > 0) {
      const hRows = sc1.heritiers.map((h: any) => [
        h.nom, h.lien || '–', h.typeDroit || '–', pctFmt(h.quotite),
        fmtEur(h.montantTransmis), fmtEur(h.droits),
      ]);
      hRows.push([
        '<b>Total</b>', '', '', '',
        `<b>${fmtEur(sc1.transmissionNette)}</b>`,
        `<b>${fmtEur(sc1.droitsSuccession)}</b>`,
      ]);
      devHTML += table(
        ['Héritier', 'Lien', 'Droit', 'Quotité', 'Transmis', 'Droits'],
        hRows, { highlightLast: true, compact: true }
      );
    }

    devHTML += `
      <div class="kpi-row">
        <div class="kpi"><div class="kpi-label">Actif successoral</div><div class="kpi-value">${fmtEur(sc1.actifSuccessoral)}</div></div>
        <div class="kpi"><div class="kpi-label">Droits de succession</div><div class="kpi-value coral">${fmtEur(sc1.droitsSuccession)}</div></div>
        <div class="kpi"><div class="kpi-label">Frais notaire</div><div class="kpi-value">${fmtEur(sc1.fraisNotaire)}</div></div>
        <div class="kpi"><div class="kpi-label">Transmission nette</div><div class="kpi-value teal">${fmtEur(sc1.transmissionNette)}</div></div>
      </div>`;

    // Graphiques héritiers (montant transmis + droits) — SVG vertical bars matching web Recharts style
    if (sc1.heritiers?.length > 0) {
      const heirItems = sc1.heritiers.map((h: any) => ({
        label: h.nom?.split(' ')[0] || h.nom || '?',
        transmis: h.montantTransmis || 0,
        droits: h.droits || 0,
      }));
      devHTML += `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:12px">`;
      devHTML += svgVBar(
        heirItems.map((hi: any) => ({ label: hi.label, value: hi.transmis, color: '#0c2340' })),
        { title: 'Montant transmis par héritier', height: 180 }
      );
      devHTML += svgVBar(
        heirItems.map((hi: any) => ({ label: hi.label, value: hi.droits, color: '#d35244' })),
        { title: 'Droits de succession par héritier', height: 180 }
      );
      devHTML += `</div>`;
    }

    s6 = section('Dévolution effective — Premier décès', devHTML, { subtitle: 'Résultat concret de la simulation selon l\'option retenue' });
  }

  /* ── 7. Synthèse des abattements fiscaux ────────── */
  let s7 = '';
  if (sc1?.heritiers?.length > 0) {
    let fiscHTML = `<p>Avant de payer des droits de succession, chaque héritier bénéficie d'un <b>abattement fiscal</b> : une somme déduite de la valeur reçue avant le calcul des droits. L'abattement dépend du <b>lien de parenté</b> avec le défunt. Plus le lien est proche, plus l'abattement est élevé.</p>`;
    fiscHTML += `<p><b>Abattements légaux en vigueur :</b> Conjoint ou partenaire de PACS → <b>exonération totale</b> (art. 796-0 bis CGI) ; Enfant → <b>100 000 €</b> par parent (art. 779 CGI) ; Petit-enfant → <b>1 594 €</b> ; Frère/sœur → <b>15 932 €</b> ; Neveu/nièce → <b>7 967 €</b>. Ces abattements se <b>reconstituent tous les 15 ans</b>.</p>`;

    // Helper to derive the legal abattement label from lien
    const abattementLegalLabel = (h: any): string => {
      const lien = (h.lien || '').toLowerCase();
      if (lien.includes('conjoint') || lien.includes('partenaire') || lien.includes('pacs')) return 'Exonération totale';
      if (lien.includes('ligne directe') || lien.includes('direct')) return h.handicape ? '100 000 € + 159 325 €' : '100 000 €';
      if (lien.includes('frère') || lien.includes('sœur') || lien.includes('soeur') || lien.includes('collatéral')) return '15 932 €';
      if (lien.includes('neveu') || lien.includes('nièce') || lien.includes('niece')) return '7 967 €';
      return fmtEur(h.abattement);
    };

    fiscHTML += `<h3 class="sub-title" style="margin-top:14px">Abattements utilisés — 1er décès</h3>`;
    const fiscRows = sc1.heritiers.map((h: any) => {
      const isExonere = h.droits === 0;
      return [
        `<b>${h.nom}</b>${h.handicape ? ' <span class="badge" style="background:#7c3aed">♿</span>' : ''}`,
        h.lien || '–',
        fmtEur(h.montantTransmis),
        `<span style="color:#0d7377">${abattementLegalLabel(h)}</span>${h.handicape && !(h.lien || '').toLowerCase().includes('conjoint') ? '<br/><span style="font-size:12px;color:#7c3aed">dont 159 325 € handicap</span>' : ''}`,
        isExonere ? 'N/A (exonéré)' : fmtEur(h.abattement),
        isExonere ? '–' : fmtEur(h.baseApresAbattement),
        isExonere ? '<span style="color:#0d7377;font-weight:700">Exonéré</span>' : `<span style="color:#c9a84c;font-weight:700">${fmtEur(h.droits)}</span>`,
      ];
    });
    // Total row
    const totalBaseTaxable = sc1.heritiers.reduce((a: number, h: any) => a + (h.baseApresAbattement || 0), 0);
    fiscRows.push([
      '<b>Total fiscal</b>', '', '—', '', '', `<b>${fmtEur(totalBaseTaxable)}</b>`,
      `<b style="color:#c9a84c">${fmtEur(sc1.droitsSuccession)}</b>`,
    ]);
    fiscHTML += table(
      ['Héritier', 'Lien de parenté', 'Part reçue', 'Abattement légal', 'Abattement utilisé', 'Base taxable', 'Droits'],
      fiscRows, { highlightLast: true, compact: true }
    );
    fiscHTML += `<p class="chart-caption">Note : en démembrement, l'usufruit du conjoint et la nue-propriété des enfants portent sur les mêmes biens. Les "parts reçues" ne s'additionnent donc pas comme des montants indépendants.</p>`;

    // Notary fees footnote
    fiscHTML += `<div class="note" style="margin-top:10px"><b>Frais de notaire estimés : ${fmtEur(sc1.fraisNotaire)}</b> — Ces frais couvrent les émoluments du notaire, les formalités administratives et la publicité foncière. Ils s'ajoutent aux droits de succession et sont à la charge des héritiers.</div>`;

    s7 = section('Synthèse des abattements fiscaux', fiscHTML, { subtitle: 'Récapitulatif des abattements utilisés et de leur impact sur les droits' });
  }

  /* ── 7b. Détails fiscaux AV / Donations / Legs ── */
  let s7b = '';
  const fd_details = d.base?.detailsFiscaux;
  if (fd_details) {
    let detailHTML = '';

    // ── Assurance-vie ──
    if (fd_details.detailAssuranceVie?.length > 0) {
      detailHTML += `<h3 style="color:#0c2340;font-size:13px;margin:0 0 6px">Assurance-vie — Fiscalité par bénéficiaire</h3>`;
      detailHTML += `<p style="margin-bottom:8px">L'assurance-vie bénéficie d'un <b>régime fiscal autonome</b>. Deux régimes coexistent :</p>`;
      detailHTML += `<ul style="margin:0 0 8px 16px;line-height:1.6;font-size:12px">`;
      detailHTML += `<li><b>Art. 990 I CGI</b> (avant 70 ans) : abattement de 152 500 € par bénéficiaire, puis 20 % / 31,25 %. En cas de démembrement, l'abattement est proratisé (art. 669 CGI).</li>`;
      detailHTML += `<li><b>Art. 757 B CGI</b> (après 70 ans) : seules les primes sont taxées (intérêts exonérés), abattement global de 30 500 €.</li>`;
      detailHTML += `</ul>`;
      detailHTML += `<p style="margin-bottom:6px">Le conjoint/PACS est <b>totalement exonéré</b> dans les deux régimes.</p>`;

      const avRows = fd_details.detailAssuranceVie.map((av: any) => [
        `<b>${av.beneficiaire}</b>`,
        av.lien === 'CONJOINT' || av.lien === 'PACS' ? 'Conjoint/PACS' : av.lien === 'ENFANT' ? 'Enfant' : av.lien || '–',
        av.exonere ? '–' : fmtEur(av.capital990I),
        av.exonere ? '<span style="color:#0d7377">Exonéré</span>' : fmtEur(av.abattement990I),
        av.exonere ? '–' : fmtEur(av.baseTaxable990I),
        av.exonere ? '<span style="color:#0d7377">Exonéré</span>' : fmtEur(av.taxe990I),
        av.primes757B > 0 ? fmtEur(av.primes757B) : '–',
        av.exonere ? '<span style="color:#0d7377">Exonéré</span>' : av.primes757B > 0 ? fmtEur(av.abattement757B) : '–',
        av.exonere ? '–' : av.reintegre757B > 0 ? fmtEur(av.reintegre757B) : '–',
      ]);
      const total990I = fd_details.detailAssuranceVie.filter((a: any) => !a.exonere).reduce((s: number, a: any) => s + (a.taxe990I || 0), 0);
      const total757B = fd_details.detailAssuranceVie.filter((a: any) => !a.exonere).reduce((s: number, a: any) => s + (a.reintegre757B || 0), 0);
      avRows.push([
        '<b>Total</b>', '', '', '', '',
        `<b style="color:#c9a84c">${fmtEur(total990I)}</b>`,
        '', '',
        `<b>${fmtEur(total757B)}</b>`,
      ]);
      detailHTML += table(
        ['Bénéficiaire', 'Lien', 'Capital (990 I)', 'Abatt. (990 I)', 'Base taxable', 'Taxe 990 I', 'Primes (757 B)', 'Abatt. (757 B)', 'Réintégré'],
        avRows, { compact: true }
      );
    }

    // ── Donations rappelées ──
    if (fd_details.detailDonationsRappelees?.length > 0) {
      detailHTML += `<h3 style="color:#0c2340;font-size:13px;margin:18px 0 6px">Donations — Rapport fiscal (art. 784 CGI)</h3>`;
      detailHTML += `<p style="margin-bottom:8px">Les donations consenties dans les <b>15 ans précédant le décès</b> sont rappelées fiscalement. Le montant est ajouté à la base taxable pour déterminer la tranche marginale. Les droits déjà payés constituent un <b>crédit d'impôt</b>.</p>`;

      const donRows = fd_details.detailDonationsRappelees.map((don: any) => [
        `<b>${don.beneficiaire}</b>`,
        fmtEur(don.montant),
        don.dateDonation ? new Date(don.dateDonation).toLocaleDateString('fr-FR') : '–',
        don.rapportable ? '✓' : '✗',
        don.rappele ? '<span style="color:#d35244;font-weight:700">Oui</span>' : '<span style="color:#0d7377">Non</span>',
        fmtEur(don.montantRappele),
        fmtEur(don.abattementInitial),
        fmtEur(don.abattementApresRappel),
      ]);
      detailHTML += table(
        ['Bénéficiaire', 'Montant', 'Date', 'Rapportable', 'Rappelée', 'Montant rappelé', 'Abatt. initial', 'Abatt. restant'],
        donRows, { compact: true }
      );
      detailHTML += `<div class="info-box" style="margin-top:6px;background:#fef6e4;border-color:#e8d5a3;color:#7a6520"><b>Impact :</b> Les donations rappelées augmentent la base taxable cumulée (art. 784 CGI), pouvant faire monter la tranche marginale d'imposition.</div>`;
    }

    // ── Legs particuliers ──
    if (fd_details.detailLegs?.length > 0) {
      detailHTML += `<h3 style="color:#0c2340;font-size:13px;margin:18px 0 6px">Legs particuliers — Déduction et fiscalité</h3>`;
      detailHTML += `<p style="margin-bottom:8px">Les legs sont <b>déduits de la masse successorale</b> avant répartition, et <b>taxés individuellement</b>. Le conjoint/PACS légataire est exonéré.</p>`;
      if (fd_details.totalLegsDeduits > 0) {
        detailHTML += `<div class="info-box green" style="margin-bottom:8px"><b>Total des legs déduits :</b> ${fmtEur(fd_details.totalLegsDeduits)}</div>`;
      }
      const legRows = fd_details.detailLegs.map((leg: any) => [
        `<b>${leg.legataire}</b>`,
        leg.lien || 'Tiers',
        fmtEur(leg.montant),
        leg.droits > 0 ? fmtEur(leg.droits) : '<span style="color:#0d7377">Exonéré</span>',
      ]);
      const totalLegDroits = fd_details.detailLegs.reduce((s: number, l: any) => s + (l.droits || 0), 0);
      legRows.push([
        '<b>Total</b>', '',
        `<b>${fmtEur(fd_details.detailLegs.reduce((s: number, l: any) => s + (l.montant || 0), 0))}</b>`,
        `<b style="color:#c9a84c">${fmtEur(totalLegDroits)}</b>`,
      ]);
      detailHTML += table(
        ['Légataire', 'Lien', 'Montant', 'Droits'],
        legRows, { compact: true }
      );
    }

    if (detailHTML) {
      s7b = section('Détails fiscaux : Assurance-vie, Donations & Legs', detailHTML, { subtitle: 'Ventilation détaillée de la fiscalité par bénéficiaire' });
    }
  }

  /* ── 8. Second décès ──────────────────────────── */
  let s8 = '';
  if (showSecondDeath && sc2 && sc2.label !== 'Non applicable') {
    let sd2HTML = `<p>Au décès du conjoint survivant, sa succession propre est transmise aux enfants. L'actif taxable dépend de l'option choisie au premier décès :</p>`;

    // Explication contextuelle de la composition de l'actif
    const optionChoisie = sc1?.optionConjoint || '';
    const isUSF = optionChoisie.toLowerCase().includes('usufruit');
    if (isUSF) {
      sd2HTML += `<div class="info-box green"><div class="info-box-title">Composition de l'actif au second décès (option Usufruit)</div>L'usufruit détenu par le conjoint survivant s'éteint automatiquement à son décès (art. 617 C.civ). La nue-propriété détenue par les enfants se reconstitue en pleine propriété <b>sans aucun droit supplémentaire</b>. L'actif taxable au second décès se compose <b>uniquement des biens propres du conjoint</b> (sa part dans la communauté).</div>`;
    } else {
      sd2HTML += `<div class="info-box"><div class="info-box-title">Composition de l'actif au second décès</div>Le patrimoine du conjoint survivant comprend ses biens propres${optionChoisie ? ` + la part reçue en pleine propriété au premier décès` : ''}. Cette masse est <b>intégralement taxée</b> dans sa propre succession.</div>`;
    }

    if (sc2.heritiers?.length > 0) {
      const sdRows = sc2.heritiers.map((h: any) => [
        h.nom, h.lien || '–', pctFmt(h.quotite),
        fmtEur(h.montantTransmis), fmtEur(h.abattement || 0),
        fmtEur(h.baseApresAbattement || 0), fmtEur(h.droits),
      ]);
      sdRows.push([
        '<b>Total</b>', '', '', `<b>${fmtEur(sc2.transmissionNette)}</b>`,
        '', '', `<b>${fmtEur(sc2.droitsSuccession)}</b>`,
      ]);
      sd2HTML += table(
        ['Héritier', 'Lien', 'Quotité', 'Transmis', 'Abattement', 'Base taxable', 'Droits'],
        sdRows, { highlightLast: true, compact: true }
      );
    }

    sd2HTML += `
      <div class="kpi-row">
        <div class="kpi"><div class="kpi-label">Actif successoral</div><div class="kpi-value">${fmtEur(sc2.actifSuccessoral)}</div></div>
        <div class="kpi"><div class="kpi-label">Droits 2nd décès</div><div class="kpi-value coral">${fmtEur(sc2.droitsSuccession)}</div></div>
        <div class="kpi"><div class="kpi-label">Transmission nette</div><div class="kpi-value teal">${fmtEur(sc2.transmissionNette)}</div></div>
      </div>
      <div class="kpi-row" style="margin-top:8px">
        <div class="kpi highlight-kpi"><div class="kpi-label">Coût fiscal global (2 décès)</div><div class="kpi-value coral">${fmtEur((sc1?.droitsSuccession || 0) + (sc2.droitsSuccession || 0))}</div></div>
      </div>`;

    // Graphiques héritiers 2nd décès — SVG vertical bars
    if (sc2.heritiers?.length > 0) {
      const sd2Items = sc2.heritiers.map((h: any) => ({
        label: h.nom?.split(' ')[0] || h.nom || '?',
        transmis: h.montantTransmis || 0,
        droits: h.droits || 0,
      }));
      sd2HTML += `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:12px">`;
      sd2HTML += svgVBar(
        sd2Items.map((hi: any) => ({ label: hi.label, value: hi.transmis, color: '#0c2340' })),
        { title: 'Montant transmis par héritier (2nd décès)', height: 180 }
      );
      sd2HTML += svgVBar(
        sd2Items.map((hi: any) => ({ label: hi.label, value: hi.droits, color: '#d35244' })),
        { title: 'Droits par héritier (2nd décès)', height: 180 }
      );
      sd2HTML += `</div>`;
    }

    s8 = section('Second décès — Succession du conjoint', sd2HTML, { subtitle: 'Transmission au décès du conjoint survivant' });
  }

  /* ── 8bis. Explication DDV ─────────────────────── */
  let s8bis = '';
  if (showSecondDeath && d.isMarie && d.nbEnfants > 0) {
    let ddvExplHTML = `<p>La <b>Donation au Dernier Vivant (DDV)</b>, aussi appelée <em>donation entre époux</em>, est un acte notarié qui permet d'<b>élargir les droits du conjoint survivant</b> au-delà des deux options légales (usufruit total ou 1/4 PP). Elle offre une <b>troisième option</b> : la quotité disponible en pleine propriété.</p>`;

    ddvExplHTML += `<div class="info-box"><div class="info-box-title">⚖️ Les 3 options offertes par la DDV (art. 1094-1 C.civ)</div>Avec une DDV en place, le conjoint survivant peut choisir entre : <b>(1)</b> l'usufruit de la totalité, <b>(2)</b> 1/4 en pleine propriété + 3/4 en usufruit, ou <b>(3)</b> la quotité disponible en pleine propriété (${d.nbEnfants === 1 ? '1/2' : d.nbEnfants === 2 ? '1/3' : '1/4'} du patrimoine). Le choix se fait au moment du décès, en toute connaissance de cause.</div>`;

    ddvExplHTML += `<h3 class="sub-title" style="margin-top:12px">Les 3 options DDV en détail</h3>`;
    ddvExplHTML += table(
      ['Option DDV', 'Part du conjoint', 'Part des enfants', 'Mécanisme au 2nd décès'],
      [
        ['<b>Usufruit total</b>', '100 % en usufruit', '100 % en nue-propriété', 'USF s\'éteint → NP rejoint PP sans droits'],
        ['<b>1/4 PP + 3/4 USF</b>', '1/4 en PP + 3/4 en usufruit', '3/4 en NP (dont 1/4 reçu en PP)', '1/4 PP retaxé + USF sur 3/4 s\'éteint'],
        [`<b>QD en PP (${d.nbEnfants === 1 ? '1/2' : d.nbEnfants === 2 ? '1/3' : '1/4'})</b>`, `${d.nbEnfants === 1 ? '1/2' : d.nbEnfants === 2 ? '1/3' : '1/4'} en pleine propriété`, `${d.nbEnfants === 1 ? '1/2' : d.nbEnfants === 2 ? '2/3' : '3/4'} en pleine propriété`, 'QD PP intégralement retaxée'],
      ],
      { compact: true }
    );

    ddvExplHTML += `<h3 class="sub-title" style="margin-top:14px">Pourquoi est-elle intéressante ?</h3>`;
    ddvExplHTML += `<p>• <b>Coût modique :</b> 200 à 400 € de frais de notaire pour la mettre en place.</p>`;
    ddvExplHTML += `<p>• <b>Flexibilité maximale :</b> le conjoint choisit l'option la plus adaptée au moment du décès (et non à l'avance).</p>`;
    ddvExplHTML += `<p>• <b>Révocable :</b> la DDV peut être révoquée à tout moment (sauf si elle est consentie par contrat de mariage).</p>`;
    ddvExplHTML += `<p>• <b>Impact fiscal :</b> la DDV ne crée pas de droits de succession supplémentaires — le conjoint reste exonéré (art. 796-0 bis CGI).</p>`;

    if (!d.ddvSelected) {
      ddvExplHTML += `<div class="verdict"><b>⚠️ Aucune DDV en place actuellement.</b> Nous recommandons fortement la mise en place d'une DDV chez votre notaire (200–400 €). C'est l'un des gestes les plus simples et les plus efficaces pour protéger le conjoint survivant.</div>`;
    } else {
      ddvExplHTML += `<div class="recommendation"><b>✅ Une DDV est déjà en place.</b> Le conjoint survivant pourra choisir parmi les 3 options ci-dessous au moment du décès.</div>`;
    }

    s8bis = section('La Donation au Dernier Vivant (DDV)', ddvExplHTML, { subtitle: 'Un outil essentiel pour protéger le conjoint survivant' });
  }

  /* ── 9. Comparatif DDV ─────────────────────────── */
  let s9 = '';
  if (ddvScenarios.length > 0) {
    let ddvHTML = `<p>Comparaison chiffrée des 3 options DDV sur les deux décès (1er décès du défunt + 2nd décès du conjoint survivant) :</p>`;

    // Graphique comparatif DDV
    const ddvChartDroits2 = ddvScenarios.map((ddv: any) => {
      const fd = ddv.premierDeces;
      const sd = ddv.secondDeces;
      return { label: ddv.optionLabel || ddv.optionCode, value: (fd?.droitsSuccession || 0) + (sd?.droitsSuccession || 0), color: '#d35244' };
    });
    ddvHTML += svgVBar(ddvChartDroits2, { title: 'Total des droits de succession par option DDV (2 décès)' });

    const ddvChartNet2 = ddvScenarios.map((ddv: any) => {
      const fd = ddv.premierDeces;
      const sd = ddv.secondDeces;
      return { label: ddv.optionLabel || ddv.optionCode, value: (fd?.transmissionNette || 0) + (sd?.transmissionNette || 0), color: '#0d7377' };
    });
    ddvHTML += svgVBar(ddvChartNet2, { title: 'Transmission nette totale par option DDV' });

    // Tableau synthétique
    const ddvRows = ddvScenarios.map((ddv: any) => {
      const fd = ddv.premierDeces;
      const sd = ddv.secondDeces;
      const td = (fd?.droitsSuccession || 0) + (sd?.droitsSuccession || 0);
      const tn = (fd?.transmissionNette || 0) + (sd?.transmissionNette || 0);
      return [
        `<b>${ddv.optionLabel || ddv.optionCode}</b>`,
        fmtEur(fd?.actifSuccessoral), fmtEur(fd?.droitsSuccession),
        fmtEur(sd?.actifSuccessoral), fmtEur(sd?.droitsSuccession),
        `<b>${fmtEur(td)}</b>`, `<b>${fmtEur(tn)}</b>`,
      ];
    });
    ddvHTML += table(
      ['Option DDV', 'Actif 1er', 'Droits 1er', 'Actif 2nd', 'Droits 2nd', 'Total droits', 'Net total'],
      ddvRows, { compact: true }
    );

    // Détail par option DDV (1er + 2nd décès avec héritiers)
    ddvScenarios.forEach((ddv: any, i: number) => {
      const fd = ddv.premierDeces;
      const sd = ddv.secondDeces;
      const totalDroits = (fd?.droitsSuccession || 0) + (sd?.droitsSuccession || 0);
      const isBest = d.bestDdv && d.ddvChartData[i]?.totalDroits === d.bestDdv.totalDroits;

      ddvHTML += `<div class="option-block${isBest ? ' best' : ''}">`;
      ddvHTML += `<span class="option-badge${isBest ? ' best' : ''}">${isBest ? 'OPTION OPTIMALE' : `OPTION ${i + 1}`}</span>`;
          ddvHTML += `<h4 class="minor-title">${ddv.optionLabel || ddv.optionCode}</h4>`;

      // 1er décès
      ddvHTML += `<div style="padding:12px 14px;background:#f0f4f8;border-radius:8px;margin-bottom:12px">`;
      ddvHTML += `<p class="minor-subtitle">① Premier décès</p>`;
      ddvHTML += `<div class="kpi-row" style="margin:6px 0"><div class="kpi"><div class="kpi-label">Actif</div><div class="kpi-value">${fmtEur(fd?.actifSuccessoral)}</div></div><div class="kpi"><div class="kpi-label">Droits</div><div class="kpi-value coral">${fmtEur(fd?.droitsSuccession)}</div></div><div class="kpi"><div class="kpi-label">Net transmis</div><div class="kpi-value teal">${fmtEur(fd?.transmissionNette)}</div></div></div>`;
      if (fd?.heritiers?.length > 0) {
        const fdRows = fd.heritiers.map((h: any) => [
          `<b>${h.nom}</b>`, h.typeDroit || '–', fmtEur(h.montantTransmis),
          fmtEur(getFiscalValueForRow(h)), fmtEur(h.abattement), fmtEur(h.baseApresAbattement),
          h.droits > 0 ? fmtEur(h.droits) : '<span style="color:#0d7377">Exonéré</span>',
        ]);
        ddvHTML += table(['Héritier', 'Droit', 'Valeur (civile)', 'Valeur fiscale du droit', 'Abattement', 'Base taxable nette', 'Droits'], fdRows, { compact: true });
        const isUsfLike = String(ddv.optionCode || ddv.optionLabel || '').toLowerCase().includes('usuf');
        if (isUsfLike && typeof ageUsufruitier === 'number') {
          ddvHTML += `<p class="chart-caption">Base fiscale art. 669 CGI (usufruitier ${ageUsufruitier} ans) : usufruit ${getUsfPct(ageUsufruitier)} % / nue-propriété ${getNpPct(ageUsufruitier)} %.</p>`;
        }
      }
      ddvHTML += `</div>`;

      // 2nd décès
      ddvHTML += `<div style="padding:12px 14px;background:#f0faf9;border-radius:8px;margin-bottom:12px">`;
      ddvHTML += `<p class="minor-subtitle">② Second décès</p>`;
      ddvHTML += `<div class="kpi-row" style="margin:6px 0"><div class="kpi"><div class="kpi-label">Actif</div><div class="kpi-value">${fmtEur(sd?.actifSuccessoral)}</div></div><div class="kpi"><div class="kpi-label">Droits</div><div class="kpi-value coral">${fmtEur(sd?.droitsSuccession)}</div></div><div class="kpi"><div class="kpi-label">Net transmis</div><div class="kpi-value teal">${fmtEur(sd?.transmissionNette)}</div></div></div>`;
      if (sd?.heritiers?.length > 0) {
        const sdRows = sd.heritiers.map((h: any) => [
          `<b>${h.nom}</b>`, h.typeDroit || '–', fmtEur(h.montantTransmis),
          fmtEur(getFiscalValueForRow(h)), fmtEur(h.abattement), fmtEur(h.baseApresAbattement),
          h.droits > 0 ? fmtEur(h.droits) : '<span style="color:#0d7377">Exonéré</span>',
        ]);
        ddvHTML += table(['Héritier', 'Droit', 'Valeur (civile)', 'Valeur fiscale du droit', 'Abattement', 'Base taxable nette', 'Droits'], sdRows, { compact: true });
      }
      ddvHTML += `</div>`;

      // Coût fiscal total
      ddvHTML += `<div class="kpi-row"><div class="kpi highlight-kpi"><div class="kpi-label">Coût fiscal total (2 décès)</div><div class="kpi-value coral">${fmtEur(totalDroits)}</div></div></div>`;
      ddvHTML += `</div>`; // end option-block
    });

    if (d.bestDdv) {
      ddvHTML += `<div class="recommendation" style="margin-top:12px"><b>Recommandation :</b> L'option DDV <span class="highlight">${d.bestDdv.name}</span> est la plus avantageuse avec un total de droits de <b>${fmtEur(d.bestDdv.totalDroits)}</b> sur les deux décès.</div>`;
    }

    s9 = section('Comparatif chiffré des options DDV', ddvHTML, { subtitle: 'Analyse détaillée des 3 options de la Donation au Dernier Vivant' });
  }

  /* ── 9bis. Comparatif couple (mode couple) ────── */
  let s9bis = '';
  if (invResult && sc1 && invSc1) {
    const droitsA = sc1.droitsSuccession || 0;
    const droitsB = invSc1.droitsSuccession || 0;
    const netA = sc1.transmissionNette || 0;
    const netB = invSc1.transmissionNette || 0;
    const sc2A = sc2?.droitsSuccession || 0;
    const sc2B = invSc2?.droitsSuccession || 0;
    const totalA = droitsA + sc2A;
    const totalB = droitsB + sc2B;
    const meilleur = totalA <= totalB ? 'A' : 'B';
    const economie = Math.abs(totalA - totalB);
    const conjointName = invResult.metadata?.client
      ? `${invResult.metadata.client.prenom} ${invResult.metadata.client.nom}`
      : d.simulationData?.conjoint?.prenom || 'Conjoint';

    let coupleHTML = `<p style="margin-bottom:10px">Ce comparatif mesure l'impact fiscal de l'<b>ordre des décès</b> au sein du couple. Le patrimoine, le régime matrimonial et les enfants sont identiques. Seul le rôle défunt / survivant est inversé.</p>`;
    coupleHTML += `<p style="margin-bottom:12px"><b>Scénario A :</b> ${d.clientName} décède en premier.<br/><b>Scénario B :</b> ${conjointName} décède en premier.</p>`;

    // Comparison table
    const compRows = [
      ['<b>Droits 1er décès</b>', fmtEur(droitsA), fmtEur(droitsB), fmtEur(Math.abs(droitsA - droitsB))],
      ['<b>Transmission nette 1er décès</b>', `<span style="color:#0d7377">${fmtEur(netA)}</span>`, `<span style="color:#0d7377">${fmtEur(netB)}</span>`, fmtEur(Math.abs(netA - netB))],
    ];
    if (showSecondDeath) {
      compRows.push(['<b>Droits 2nd décès</b>', fmtEur(sc2A), fmtEur(sc2B), fmtEur(Math.abs(sc2A - sc2B))]);
    }
    compRows.push([
      `<b>Total droits${showSecondDeath ? ' (1er + 2nd)' : ''}</b>`,
      `<b style="color:${meilleur === 'A' ? '#0d7377' : '#d35244'}">${fmtEur(totalA)}</b>`,
      `<b style="color:${meilleur === 'B' ? '#0d7377' : '#d35244'}">${fmtEur(totalB)}</b>`,
      `<b style="color:#0d7377">${fmtEur(economie)}</b>`,
    ]);
    coupleHTML += table(
      ['', `Scénario A — ${d.clientName}`, `Scénario B — ${conjointName}`, 'Écart'],
      compRows, { compact: true }
    );

    // Verdict
    if (economie > 0) {
      coupleHTML += `<div class="recommendation" style="margin-top:14px"><b>Verdict :</b> Le <span class="highlight">Scénario ${meilleur}</span> (${meilleur === 'A' ? d.clientName : conjointName} décède en premier) est fiscalement plus avantageux avec une économie totale de <b>${fmtEur(economie)}</b>. Cette différence s'explique par les abattements, la composition du patrimoine propre de chaque époux, et le mécanisme de reconstitution au second décès.</div>`;
    } else {
      coupleHTML += `<div class="recommendation" style="margin-top:14px">Les deux scénarios produisent un coût fiscal identique. L'ordre des décès n'a pas d'impact différenciant dans votre situation.</div>`;
    }

    // Detail Scenario A
    coupleHTML += `<div style="margin-top:16px;padding:12px 14px;background:#f0f4f8;border-radius:8px">`;
    coupleHTML += `<p class="minor-subtitle" style="margin-bottom:8px">Scénario A — ${d.clientName} décède en premier</p>`;
    coupleHTML += `<div class="kpi-row"><div class="kpi"><div class="kpi-label">Actif successoral</div><div class="kpi-value">${fmtEur(sc1.actifSuccessoral)}</div></div><div class="kpi"><div class="kpi-label">Droits</div><div class="kpi-value coral">${fmtEur(droitsA)}</div></div><div class="kpi"><div class="kpi-label">Net transmis</div><div class="kpi-value teal">${fmtEur(netA)}</div></div></div>`;
    if (sc1.heritiers?.length > 0) {
      const hRowsA = sc1.heritiers.map((h: any) => [
        `<b>${h.nom}</b>`, fmtEur(h.montantTransmis), fmtEur(h.abattement), fmtEur(h.baseApresAbattement),
        h.droits > 0 ? fmtEur(h.droits) : '<span style="color:#0d7377">Exonéré</span>',
      ]);
      coupleHTML += table(['Héritier', 'Part', 'Abattement', 'Base taxable', 'Droits'], hRowsA, { compact: true });
    }
    coupleHTML += `</div>`;

    // Detail Scenario B
    coupleHTML += `<div style="margin-top:14px;padding:12px 14px;background:#fdf8f3;border-radius:8px">`;
    coupleHTML += `<p class="minor-subtitle" style="margin-bottom:8px">Scénario B — ${conjointName} décède en premier</p>`;
    coupleHTML += `<div class="kpi-row"><div class="kpi"><div class="kpi-label">Actif successoral</div><div class="kpi-value">${fmtEur(invSc1.actifSuccessoral)}</div></div><div class="kpi"><div class="kpi-label">Droits</div><div class="kpi-value coral">${fmtEur(droitsB)}</div></div><div class="kpi"><div class="kpi-label">Net transmis</div><div class="kpi-value teal">${fmtEur(netB)}</div></div></div>`;
    if (invSc1.heritiers?.length > 0) {
      const hRowsB = invSc1.heritiers.map((h: any) => [
        `<b>${h.nom}</b>`, fmtEur(h.montantTransmis), fmtEur(h.abattement), fmtEur(h.baseApresAbattement),
        h.droits > 0 ? fmtEur(h.droits) : '<span style="color:#0d7377">Exonéré</span>',
      ]);
      coupleHTML += table(['Héritier', 'Part', 'Abattement', 'Base taxable', 'Droits'], hRowsB, { compact: true });
    }
    coupleHTML += `</div>`;

    // Hypothèses et limites block
    coupleHTML += `<div style="margin-top:16px;padding:10px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;color:#6b7280;line-height:1.5">`;
    coupleHTML += `<p style="font-weight:700;color:#374151;margin-bottom:4px;font-size:12px">Hypothèses et limites de cette comparaison</p>`;
    coupleHTML += `<ul style="margin:0;padding-left:14px">`;
    coupleHTML += `<li>Les biens propres de chaque époux sont inversés selon le propriétaire renseigné. Les biens communs restent partagés selon le régime matrimonial.</li>`;
    coupleHTML += `<li>Les donations, legs et contrats d'assurance-vie sont rattachés au conjoint qui les a souscrits. Seules les libéralités du défunt concerné sont prises en compte dans chaque scénario.</li>`;
    coupleHTML += `<li>Le 2nd décès utilise la famille du conjoint survivant (parents, fratrie) si elle a été renseignée. À défaut, un héritier d'ordre 3/4 estimé est utilisé.</li>`;
    coupleHTML += `<li>Cette simulation est indicative et ne constitue pas un acte juridique. Consultez votre notaire pour une analyse définitive.</li>`;
    coupleHTML += `</ul></div>`;

    s9bis = section('Comparatif des ordres de décès', coupleHTML, { subtitle: 'Analyse de l\'impact fiscal selon qui décède en premier — même patrimoine, deux scénarios' });
  }

  const rawStrategies: any[] = optim?.strategies || [];
  const normalizedStrategies: any[] = rawStrategies.map((s: any) => {
    const titre = (s?.titre || '').toLowerCase();
    const isScenarioComparison = titre.includes('comparaison') && titre.includes('scénario');
    if (isScenarioComparison && scenarioComparisonEconomy != null) {
      return { ...s, economie: scenarioComparisonEconomy };
    }
    return s;
  });
  const adjustedEconomiePotentielle = normalizedStrategies.reduce((sum: number, s: any) => {
    const eco = Number(s?.economie || 0);
    return eco > 0 ? sum + eco : sum;
  }, 0);

  /* ── 10. Synthèse des recommandations ──────────── */
  let s10 = '';
  if (sc1) {
    let synthHTML = `<p>Avant de passer aux stratégies d'optimisation détaillées, voici un récapitulatif des principales recommandations issues de l'analyse de votre dossier. Ces préconisations tiennent compte de ${d.isMarie ? 'votre régime matrimonial, de ' : ''}la composition de votre patrimoine, et des résultats des différents scénarios simulés.</p><div class="synth-grid">`;

    synthHTML += `<div class="synth-card"><div class="synth-label">1er décès — Droits</div><div class="synth-value">${fmtEur(sc1.droitsSuccession)}</div><div class="synth-hint">Taux effectif : ${sc1.actifSuccessoral > 0 ? ((sc1.droitsSuccession / sc1.actifSuccessoral) * 100).toFixed(1) : '0'} %</div></div>`;

    if (showSecondDeath && sc2 && sc2.label !== 'Non applicable') {
      synthHTML += `<div class="synth-card warn"><div class="synth-label">2nd décès — Droits</div><div class="synth-value">${fmtEur(sc2.droitsSuccession)}</div><div class="synth-hint">Coût global : ${fmtEur((sc1.droitsSuccession || 0) + (sc2.droitsSuccession || 0))}</div></div>`;
    }

    if (d.bestLegal) {
      synthHTML += `<div class="synth-card"><div class="synth-label">Option légale recommandée</div><div class="synth-value" style="font-size:12px">${d.bestLegal.name}</div><div class="synth-hint">Total droits : ${fmtEur(d.bestLegal.totalDroits)}</div></div>`;
    }
    if (d.bestDdv) {
      synthHTML += `<div class="synth-card"><div class="synth-label">Option DDV recommandée</div><div class="synth-value" style="font-size:12px">${d.bestDdv.name}</div><div class="synth-hint">Total droits : ${fmtEur(d.bestDdv.totalDroits)}</div></div>`;
    }
    if (adjustedEconomiePotentielle > 0) {
      synthHTML += `<div class="synth-card"><div class="synth-label">Économie potentielle</div><div class="synth-value teal">${fmtEur(adjustedEconomiePotentielle)}</div><div class="synth-hint">${normalizedStrategies.length || 0} stratégie(s) identifiée(s)</div></div>`;
    }

    synthHTML += `</div>`;

    // Graphique synthèse : décomposition de la transmission
    {
      const actif = sc1.actifSuccessoral || 0;
      const droits1 = sc1.droitsSuccession || 0;
      const frais = sc1.fraisNotaire || 0;
      const net1 = sc1.transmissionNette || 0;
      const droits2 = (showSecondDeath && sc2 && sc2.label !== 'Non applicable') ? (sc2.droitsSuccession || 0) : 0;
      const synthItems: { label: string; value: number; color: string }[] = [];
      if (actif > 0) synthItems.push({ label: 'Actif successoral', value: actif, color: '#0c2340' });
      if (droits1 > 0) synthItems.push({ label: 'Droits 1er décès', value: droits1, color: '#d35244' });
      if (droits2 > 0) synthItems.push({ label: 'Droits 2nd décès', value: droits2, color: '#c9a84c' });
      if (frais > 0) synthItems.push({ label: 'Frais de notaire', value: frais, color: '#8894a7' });
      if (net1 > 0) synthItems.push({ label: 'Transmission nette', value: net1, color: '#0d7377' });
      if (adjustedEconomiePotentielle > 0) synthItems.push({ label: 'Économie potentielle', value: adjustedEconomiePotentielle, color: '#14a3a8' });
      if (synthItems.length > 0) {
        synthHTML += svgHBar(synthItems, { title: 'Vue d\'ensemble de la transmission', labelWidth: 140 });
      }
    }

    // Verdict
    let verdict = '';
    if (d.isMarie) {
      if (d.bestDdv) verdict += `L'option <b>${d.bestDdv.name}</b> (DDV) est la plus avantageuse avec un coût global de ${fmtEur(d.bestDdv.totalDroits)}.`;
      else if (d.bestLegal) verdict += `L'option légale <b>${d.bestLegal.name}</b> est la plus avantageuse avec un coût global de ${fmtEur(d.bestLegal.totalDroits)}.`;
      if (!d.ddvSelected) verdict += ` <b>Nous recommandons en priorité la mise en place d'une DDV</b> (200–400 € de frais notariés).`;
    } else {
      verdict += `Les droits de succession s'élèvent à <b>${fmtEur(sc1.droitsSuccession)}</b> pour une transmission nette de ${fmtEur(sc1.transmissionNette)}.`;
    }
    if (adjustedEconomiePotentielle > 0) {
      verdict += ` Les stratégies d'optimisation permettraient une économie de <b>${fmtEur(adjustedEconomiePotentielle)}</b>.`;
    }
    synthHTML += `<div class="verdict"><b>Verdict :</b> ${verdict}</div>`;

    s10 = section('Synthèse des recommandations', synthHTML, { subtitle: 'Récapitulatif de nos préconisations' });
  }

  /* ── 11. Optimisations — 100 % piloté par le backend ── */
  let s11 = '';
  {
    const actifSucc = sc1?.actifSuccessoral || 0;
    const strategies: any[] = normalizedStrategies;
    const nbHeritiers = sc1?.heritiers?.length || 0;

    let optimHTML = `<p>Ce plan d'action tient compte de votre âge (<b>${ageClient} ans</b>), de l'espérance de vie statistique (~${esperanceVie} ans), et des seuils fiscaux clés. Les montants sont calculés à partir de votre patrimoine réel et de vos <b>${nbHeritiers} héritier(s)</b>.</p>`;

    // ── Timeline dynamique basée sur les stratégies backend ──
    optimHTML += `<div class="timeline">`;

    // Aujourd'hui — résumé des actions immédiates
    const immediateStrategies = strategies.filter((s: any) => {
      const d2 = (s.delai || '').toLowerCase();
      return d2.includes('possible') || d2.includes('immédiat');
    });
    optimHTML += `<div class="tl-item"><div class="tl-dot active"></div><div class="tl-content"><div class="tl-age">${ageClient} ans — Aujourd'hui</div><div class="tl-title">Actions immédiates à mettre en œuvre</div>`;
    if (immediateStrategies.length > 0) {
      immediateStrategies.forEach((s: any) => {
        optimHTML += `<div class="tl-desc">${s.titre}${s.economie > 0 ? ` — économie estimée : <b>${fmtEur(s.economie)}</b>` : ''}.</div>`;
      });
    } else {
      optimHTML += `<div class="tl-desc">Réaliser un bilan patrimonial complet.</div>`;
    }
    optimHTML += `</div></div>`;

    // 70 ans — seuil AV (si client < 70 et AV strategy exists)
    const avStrategy = strategies.find((s: any) => (s.titre || '').toLowerCase().includes('assurance-vie'));
    if (ageClient < 70 && avStrategy) {
      optimHTML += `<div class="tl-item"><div class="tl-dot coral"></div><div class="tl-content"><div class="tl-age">70 ans (dans ${70 - ageClient} ans)</div><div class="tl-title">Seuil critique : assurance-vie (art. 990 I CGI)</div><div class="tl-desc">${avStrategy.description}</div></div></div>`;
    }

    // USF bracket (only for married)
    if (d.isMarie) {
      const currentUsfPct = getUsfPct(ageClient);
      const currentNpPct = 100 - currentUsfPct;
      const currentBracketIdx = USF_SCALE.findIndex(([maxAge]) => ageClient <= maxAge);
      const nextUsfBracket = currentBracketIdx >= 0 && currentBracketIdx < USF_SCALE.length - 1
        ? USF_SCALE[currentBracketIdx + 1] : null;
      const nextBracketAge = nextUsfBracket ? nextUsfBracket[0] : null;
      const nextBracketUsfPct = nextUsfBracket ? nextUsfBracket[1] : null;
      if (nextBracketAge && nextBracketAge > ageClient) {
        const npNext = 100 - (nextBracketUsfPct || 0);
        optimHTML += `<div class="tl-item"><div class="tl-dot teal"></div><div class="tl-content"><div class="tl-age">${nextBracketAge} ans (dans ${nextBracketAge - ageClient} ans)</div><div class="tl-title">Changement tranche usufruit (art. 669 CGI)</div><div class="tl-desc">NP passe de ${currentNpPct}% à ${npNext}%. Surcoût potentiel : +${fmtEur(actifSucc * (npNext - currentNpPct) / 100)} de base taxable.</div></div></div>`;
      }
    }

    // Espérance de vie
    const nbCycles = Math.max(0, Math.floor((esperanceVie - ageClient) / 15));
    optimHTML += `<div class="tl-item"><div class="tl-dot muted"></div><div class="tl-content"><div class="tl-age">~${esperanceVie} ans — Espérance de vie</div><div class="tl-title">Horizon statistique (INSEE ${meta?.client?.sexe === 'F' ? 'femme' : 'homme'})</div><div class="tl-desc">Nombre de cycles de donation (15 ans) restants : ~${nbCycles}. Potentiel de transmission en franchise : ${fmtEur(maxDonation * nbCycles)}.</div></div></div>`;

    optimHTML += `</div>`; // end timeline

    // ── USF table (married only) ──
    if (d.isMarie) {
      optimHTML += `<h3 class="sub-title" style="margin-top:16px">Barème de l'usufruit — Art. 669 CGI</h3>`;
      const usfRows = USF_SCALE.map(([maxAge, usfPct], i) => {
        const npPctVal = 100 - usfPct;
        const minAge = i === 0 ? 0 : USF_SCALE[i - 1][0] + 1;
        const isCurrent = ageClient >= minAge && ageClient <= maxAge;
        const label = maxAge <= 90 ? `≤ ${maxAge} ans` : '≥ 91 ans';
        return [
          isCurrent ? `<b>${label}</b> <span class="badge">VOUS</span>` : label,
          `${usfPct} %`, `${npPctVal} %`,
          `NP = ${fmtEur(actifSucc * npPctVal / 100)}`,
        ];
      });
      optimHTML += table(['Âge', 'USF', 'NP', `Impact sur ${fmtEur(actifSucc)}`], usfRows, { compact: true });
    }

    // ── Stratégies détaillées — 100 % depuis le backend ──
    optimHTML += `<h3 class="sub-title" style="margin-top:16px">Stratégies détaillées</h3>`;

    if (strategies.length === 0) {
      optimHTML += `<p>Aucune stratégie d'optimisation identifiée pour votre situation actuelle.</p>`;
    }
    strategies.forEach((strat: any) => {
      const badge = strat.delai
        ? `<div class="strat-badge">${strat.recommande ? 'Recommandé' : ''} — ${strat.delai}</div>`
        : (strat.recommande ? '<div class="strat-badge">Recommandé</div>' : '');
      optimHTML += `<div class="strategy${strat.recommande ? ' recommended' : ''}">${badge}<h4>${strat.titre}</h4><p>${strat.description}</p>`;
      if (strat.economie > 0) {
        optimHTML += `<div class="kpi-row" style="margin-top:8px"><div class="kpi"><div class="kpi-label">Économie estimée</div><div class="kpi-value teal">${fmtEur(strat.economie)}</div></div>${strat.delai ? `<div class="kpi"><div class="kpi-label">Échéance</div><div class="kpi-value">${strat.delai}</div></div>` : ''}</div>`;
      }
      optimHTML += `</div>`;
    });

    // ── Alertes ──
    if (alertes.length > 0) {
      optimHTML += `<h3 class="sub-title" style="margin-top:16px">Points d'attention</h3>`;
      alertes.forEach((a: any) => {
        const aType = a.type?.toLowerCase() || 'info';
        const alertClass = aType === 'danger' ? 'error' : aType;
        const icon = aType === 'warning' ? '⚠️' : (aType === 'error' || aType === 'danger') ? '🚨' : aType === 'success' ? '✅' : 'ℹ️';
        optimHTML += `<div class="alert ${alertClass}"><span class="alert-icon">${icon}</span><div><b>${a.titre}</b><br/>${a.message}</div></div>`;
      });
    }

    s11 = section('Plan d\'action patrimonial', optimHTML, { subtitle: 'Stratégies d\'optimisation chiffrées avec calendrier adapté à votre situation' });
  }

  /* ══════════════════════════════════════════════════ */
  /*  ASSEMBLE                                          */
  /* ══════════════════════════════════════════════════ */
  const conseillerNom = d.conseillerNom || 'Votre conseiller en gestion de patrimoine';
  const conseillerEmail = d.conseillerEmail || '';
  const conseillerTel = d.conseillerTel || '';
  const cabinetNom = d.cabinetNom || 'Cabinet de conseil patrimonial';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Diagnostic Successoral — ${d.clientName}</title>
<style>
/* ═══ RESET & BASE ═══ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 12px; }
body {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
  color: #1a2a3a; line-height: 1.6; background: white;
  padding: 0; margin: 0;
}
.content-wrap { max-width: 100%; margin: 0 auto; padding: 0; }

/* ═══ @PAGE A4 ═══ */
@page { size: A4 portrait; margin: 16mm 16mm 16mm 16mm; }
@media print {
  .no-break { break-inside: avoid; page-break-inside: avoid; }
  .cover { min-height: 100vh; page-break-after: always; }
  .closing { page-break-before: always; }

  /* ── Orphan protection : ne jamais laisser un titre seul en bas de page ── */
  .section-header { break-after: avoid; page-break-after: avoid; }
  .sub-title { break-after: avoid; page-break-after: avoid; }
  h3, h4 { break-after: avoid; page-break-after: avoid; }

  /* ── Garder les blocs cohérents ensemble ── */
  .section { break-inside: auto; page-break-inside: auto; }
  .info-box { break-inside: avoid; page-break-inside: avoid; }
  .kpi-row { break-inside: auto; page-break-inside: auto; }
  .option-block { break-inside: auto; page-break-inside: auto; }
  .strategy { break-inside: auto; page-break-inside: auto; }
  .alert { break-inside: avoid; page-break-inside: avoid; }
  .data-table { break-inside: auto; page-break-inside: auto; }
  .bar-chart { break-inside: auto; page-break-inside: auto; }
  .verdict { break-inside: auto; page-break-inside: auto; }
  .recommendation { break-inside: auto; page-break-inside: auto; }
  .synth-grid { break-inside: auto; page-break-inside: auto; }
  .tl-item { break-inside: avoid; page-break-inside: avoid; }
  .data-table tr { break-inside: avoid; page-break-inside: avoid; }
}

/* ═══ COVER PAGE ═══ */
.cover {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  min-height: 750px; text-align: center; padding: 60px 40px;
  background: linear-gradient(160deg, #0c2340 0%, #16365c 45%, #0d7377 100%);
  color: white;
}
.cover-logo {
  width: 80px; height: 80px; border-radius: 50%;
  background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 800; letter-spacing: 2px; margin-bottom: 32px;
}
.cover h1 { font-size: 34px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 8px; }
.cover .cover-sub { font-size: 16px; opacity: 0.85; margin-bottom: 36px; font-weight: 400; }
.cover-client { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
.cover-date { font-size: 13px; opacity: 0.7; margin-bottom: 4px; }
.cover-ref { font-size: 12px; opacity: 0.5; margin-top: 40px; letter-spacing: 1px; }
.cover-line {
  width: 60px; height: 3px; background: rgba(201,168,76,0.8);
  border-radius: 2px; margin: 24px auto;
}

/* ═══ CLOSING PAGE ═══ */
.closing {
  display: flex; flex-direction: column; justify-content: center;
  min-height: 500px; padding: 50px 40px; text-align: center;
}
.closing h2 { font-size: 26px; color: #0c2340; margin-bottom: 24px; font-weight: 800; }
.advisor-card {
  background: #f0f4f8; border-radius: 10px; padding: 24px 30px;
  max-width: 400px; margin: 0 auto 30px; text-align: left;
  border-left: 4px solid #0d7377;
}
.advisor-card p { font-size: 12px; margin-bottom: 6px; color: #3a4a5c; }
.advisor-card b { color: #0c2340; }
.closing-disclaimer {
  max-width: 520px; margin: 0 auto; font-size: 12px; color: #8894a7;
  line-height: 1.6; text-align: justify;
}
.closing-steps { max-width: 460px; margin: 24px auto 0; text-align: left; }
.closing-steps h3 { font-size: 18px; color: #0c2340; margin-bottom: 12px; font-weight: 700; }
.closing-steps li { font-size: 12px; color: #3a4a5c; margin-bottom: 8px; line-height: 1.5; }

/* ═══ SECTIONS ═══ */
.section { margin-bottom: 28px; }
.section-header {
  display: flex; align-items: center; gap: 12px;
  border-bottom: 2px solid #0c2340; padding-bottom: 8px; margin-bottom: 14px;
}
.section-num { font-size: 24px; font-weight: 800; color: #0d7377; }
.section-title { font-size: 19px; font-weight: 700; color: #0c2340; }
.section-subtitle { font-size: 13px; color: #5a6a7a; font-weight: 400; margin-top: 2px; }
.sub-title { font-size: 15px; font-weight: 700; color: #0c2340; margin-bottom: 8px; margin-top: 18px; }
.section p { font-size: 12px; color: #3a4a5c; margin-bottom: 8px; line-height: 1.6; }
.info-box { background: #eff6ff; border-left: 4px solid #16365c; border-radius: 6px; padding: 12px 16px; margin: 12px 0; font-size: 12px; line-height: 1.6; }
.info-box.green { background: #f0fafa; border-left-color: #0d7377; }
.info-box.red { background: #fef2f2; border-left-color: #d35244; }
.info-box-title { font-weight: 700; color: #0c2340; margin-bottom: 4px; font-size: 13px; }
.minor-title { font-size: 14px; color: #0c2340; font-weight: 700; margin-bottom: 10px; }
.minor-subtitle { font-size: 12px; color: #0c2340; font-weight: 700; margin-bottom: 6px; }
.option-block { margin-top: 18px; padding: 16px 18px; background: #f8f9fc; border-radius: 8px; border: 1px solid #e2e5ee; break-inside: avoid; }
.option-block.best { border-left: 4px solid #0d7377; background: #f0fafa; }
.option-badge { display: inline-block; font-size: 12px; background: #0c2340; color: white; padding: 3px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.option-badge.best { background: #0d7377; }

/* ═══ TABLES ═══ */
.data-table {
  width: 100%; border-collapse: collapse; margin: 8px 0;
  font-size: 11px; table-layout: fixed; word-break: break-word;
}
.data-table th {
  background: #0c2340; color: white; font-weight: 600;
  padding: 6px 7px; text-align: left; font-size: 11px;
  border-bottom: 2px solid #0d7377;
  white-space: normal;
  overflow-wrap: anywhere;
}
.data-table td {
  padding: 5px 7px; border-bottom: 1px solid #e2e5ee;
  vertical-align: top;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: auto;
}
.data-table tr:nth-child(even) td { background: #f8f9fc; }
.data-table .row-total td {
  background: #e6f7f7 !important; font-weight: 700;
  border-top: 2px solid #0d7377;
}
.data-table.compact { font-size: 11px; }
.data-table.compact th { padding: 5px 6px; font-size: 11px; }
.data-table.compact td { padding: 4px 6px; }

/* ═══ KPIs ═══ */
.kpi-row { display: flex; gap: 12px; margin: 14px 0; flex-wrap: wrap; }
.kpi {
  flex: 1; min-width: 100px; background: #f0f4f8; border-radius: 8px;
  padding: 12px 16px; border-left: 3px solid #0c2340;
}
.kpi-label { font-size: 12px; color: #5a6a7a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
.kpi-value { font-size: 16px; font-weight: 800; color: #0c2340; }
.kpi-value.teal { color: #0d7377; }
.kpi-value.coral { color: #d35244; }
.highlight-kpi { background: #fff4e6; border-left-color: #c9a84c; }

/* ═══ BAR CHART ═══ */
.bar-chart { margin: 18px 0; padding: 14px 16px; background: #f8f9fc; border-radius: 8px; border: 1px solid #e8ecf2; }
.bar-chart > p { margin-bottom: 12px !important; }
.bar-row { display: flex; align-items: center; margin-bottom: 10px; }
.bar-row:last-child { margin-bottom: 0; }
.bar-label { width: 180px; font-size: 12px; color: #3a4a5c; text-align: right; padding-right: 14px; flex-shrink: 0; font-weight: 500; }
.bar-track { flex: 1; height: 28px; background: #e2e8f0; border-radius: 6px; overflow: hidden; position: relative; }
.bar-fill { height: 100%; border-radius: 6px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; font-size: 12px; font-weight: 700; color: white; min-width: 4px; }
.bar-fill.teal { background: linear-gradient(90deg, #0d7377, #11a0a5); }
.bar-fill.coral { background: linear-gradient(90deg, #d35244, #e8786c); }
.bar-fill.navy { background: linear-gradient(90deg, #0c2340, #1c4470); }
.bar-fill.gold { background: linear-gradient(90deg, #c9a84c, #dfc06a); }
.bar-amount { font-size: 12px; color: #0c2340; font-weight: 800; margin-left: 12px; white-space: nowrap; flex-shrink: 0; }
.chart-caption {
  margin-top: 8px;
  font-size: 12px;
  color: #5a6a7a;
  line-height: 1.55;
}

.children-list {
  margin: 6px 0 0 18px;
  padding: 0;
}

.children-list li {
  margin-bottom: 4px;
}

/* ═══ RECOMMENDATION / VERDICT ═══ */
.recommendation {
  background: #e6f7f7; border: 1px solid #b2e0e0; border-radius: 8px;
  padding: 12px 16px; margin: 14px 0; font-size: 12px; line-height: 1.6;
}
.highlight { color: #0d7377; font-weight: 700; }
.verdict {
  background: #0c2340; color: white; border-radius: 8px;
  padding: 16px 20px; margin: 16px 0; font-size: 12px; line-height: 1.6;
}
.verdict b { color: #c9a84c; }
.note {
  background: #fff7ed; border: 1px solid #f0d9b5; border-radius: 6px;
  padding: 8px 12px; font-size: 12px; color: #7a5c2e; line-height: 1.5; margin-top: 10px;
}

/* ═══ SYNTH GRID ═══ */
.synth-grid { display: flex; flex-wrap: wrap; gap: 12px; margin: 14px 0; }
.synth-card {
  flex: 1; min-width: 140px; background: #f0f4f8; border-radius: 8px;
  padding: 14px 16px; border-top: 3px solid #0d7377;
}
.synth-card.warn { border-top-color: #c9a84c; }
.synth-label { font-size: 12px; color: #5a6a7a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
.synth-value { font-size: 16px; font-weight: 800; color: #0c2340; }
.synth-value.teal { color: #0d7377; }
.synth-hint { font-size: 12px; color: #5a6a7a; margin-top: 4px; }

/* ═══ TIMELINE ═══ */
.timeline { position: relative; padding-left: 24px; margin: 14px 0; border-left: 2px solid #d1d9e0; }
.tl-item { position: relative; padding: 0 0 16px 16px; }
.tl-dot {
  position: absolute; left: -29px; top: 2px;
  width: 12px; height: 12px; border-radius: 50%;
  background: #d1d9e0; border: 2px solid white;
}
.tl-dot.active { background: #0d7377; }
.tl-dot.coral { background: #d35244; }
.tl-dot.teal { background: #0d7377; }
.tl-dot.muted { background: #8894a7; }
.tl-age { font-size: 12px; font-weight: 700; color: #0c2340; margin-bottom: 2px; }
.tl-title { font-size: 12px; font-weight: 600; color: #3a4a5c; margin-bottom: 2px; }
.tl-desc { font-size: 12px; color: #5a6a7a; line-height: 1.5; }

/* ═══ STRATEGIES ═══ */
.strategy {
  background: #f8f9fc; border: 1px solid #e2e5ee; border-radius: 8px;
  padding: 12px 16px; margin-bottom: 10px; break-inside: avoid;
}
.strategy.recommended { border-left: 4px solid #0d7377; background: #f0fafa; }
.strategy h4 { font-size: 14px; color: #0c2340; margin-bottom: 4px; }
.strategy p { font-size: 12px; color: #3a4a5c; margin-bottom: 4px; }
.strat-badge {
  display: inline-block; font-size: 12px; background: #0d7377; color: white;
  padding: 2px 8px; border-radius: 3px; font-weight: 700; margin-bottom: 6px;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.strat-saving { font-size: 12px; color: #0d7377; font-weight: 600; }

/* ═══ ALERTS ═══ */
.alert {
  display: flex; gap: 8px; padding: 8px 12px; border-radius: 6px;
  margin-bottom: 6px; font-size: 12px; break-inside: avoid;
}
.alert.warning { background: #fff7ed; border-left: 3px solid #c9a84c; }
.alert.error { background: #fef2f2; border-left: 3px solid #d35244; }
.alert.success { background: #f0fafa; border-left: 3px solid #0d7377; }
.alert.info { background: #eff6ff; border-left: 3px solid #16365c; }
.alert-icon { font-size: 13px; flex-shrink: 0; }

/* ═══ BADGE ═══ */
.badge {
  display: inline-block; font-size: 12px; background: #0d7377; color: white;
  padding: 2px 6px; border-radius: 3px; font-weight: 700; vertical-align: middle;
  margin-left: 4px;
}

.traceability-box {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 14px;
  background: #f0f4f8;
  border-radius: 8px;
  border: 1px solid #d1d9e0;
  margin-bottom: 8px;
  font-size: 12px;
  color: #5a6a7a;
}

.scope-box {
  padding: 10px 14px;
  background: #fffbeb;
  border-radius: 8px;
  border: 1px solid #fcd34d;
  margin-bottom: 16px;
  font-size: 12px;
  color: #92400e;
  line-height: 1.6;
}

.scope-title {
  font-weight: 700;
  margin-bottom: 3px;
}

svg, img {
  max-width: 100%;
  height: auto;
}
</style>
</head>
<body>

<!-- ═══ COVER PAGE ═══ -->
<div class="cover">
  <div class="cover-logo">SMP</div>
  <h1>Diagnostic Successoral</h1>
  <div class="cover-sub">Rapport confidentiel</div>
  <div class="cover-line"></div>
  <div class="cover-client">${civilite} ${d.clientName}</div>
  <div class="cover-date">Établi le ${dateEtude}</div>
  <div class="cover-ref">${refNum}</div>
</div>

<!-- ═══ CONTENT ═══ -->
<div class="content-wrap">

<!-- Traçabilité -->
<div class="traceability-box">
  <span><b>Réf.</b> ${refNum}</span>
  <span>|</span>
  <span><b>Date d'étude :</b> ${dateEtude}</span>
  <span>|</span>
  <span><b>Année fiscale :</b> ${meta?.anneeFiscale || new Date().getFullYear()}</span>
  <span>|</span>
  <span><b>Moteur :</b> v2.1 — barème DMTG ${new Date().getFullYear()}</span>
</div>

<!-- Périmètre et limites -->
<div class="scope-box">
  <div class="scope-title">⚠ Périmètre et limites de cette simulation</div>
  <div>
    Ce diagnostic est une <b>estimation indicative</b> fondée sur les informations déclarées et la législation fiscale en vigueur
    au ${dateEtude}. Il <b>ne constitue pas un acte juridique</b> et ne se substitue pas à une consultation notariale.
    Les éléments non couverts incluent : régimes internationaux, trust, SCI à l'IS, démembrement croisé complexe,
    et toute situation requérant une analyse sur mesure.
    ${d.isConcubin ? " Le concubin n'a aucun droit légal dans la succession : seuls le testament et l'assurance-vie permettent de le protéger." : ''}
  </div>
</div>

${s1}
${s2}
${s3}
${s4}
${s5}
${s6}
${s7}
${s7b}
${s8}
${s8bis}
${s9}
${s9bis}
${s10}
${s11}
</div>

<!-- ═══ CLOSING PAGE ═══ -->
<div class="closing page-break">
  <h2>Votre conseiller</h2>
  <div class="advisor-card">
    <p><b>${conseillerNom}</b></p>
    ${conseillerEmail ? `<p>✉ ${conseillerEmail}</p>` : ''}
    ${conseillerTel ? `<p>☏ ${conseillerTel}</p>` : ''}
    ${d.conseillerSiteWeb ? `<p>🌐 ${d.conseillerSiteWeb}</p>` : ''}
    <p><b>${cabinetNom}</b></p>
  </div>

  <div class="closing-steps">
    <h3>Prochaines étapes recommandées</h3>
    <ol>
      <li>Prenez rendez-vous avec votre notaire pour valider les préconisations de ce rapport.</li>
      ${d.isMarie && !d.ddvSelected ? '<li><b>Priorité :</b> mettre en place une Donation au Dernier Vivant (DDV).</li>' : ''}
      ${d.nbEnfants > 0 ? '<li>Étudier la faisabilité de donations anticipées aux enfants.</li>' : ''}
      ${ageClient < 70 ? '<li>Optimiser vos contrats d\'assurance-vie avant le seuil de 70 ans.</li>' : ''}
      <li>Revoir ce diagnostic dans 2 à 3 ans ou en cas de changement de situation.</li>
    </ol>
  </div>

  <div class="closing-disclaimer" style="margin-top: 32px;">
    <b>Avertissement :</b> Ce document a un caractère informatif et pédagogique. Il est établi sur la base
    des informations déclarées et de la législation fiscale en vigueur au ${dateEtude}.
    Il ne constitue ni un acte juridique, ni un conseil fiscal personnalisé, ni une recommandation d'investissement.
    Les montants indiqués sont des estimations. Les calculs d'espérance de vie sont basés sur les tables INSEE 2024
    et ont une valeur indicative. Consultez votre notaire ou conseiller en gestion de patrimoine pour toute
    mise en œuvre. Les auteurs déclinent toute responsabilité en cas d'utilisation de ce document sans
    accompagnement professionnel.
  </div>
</div>

</body>
</html>`;
}
