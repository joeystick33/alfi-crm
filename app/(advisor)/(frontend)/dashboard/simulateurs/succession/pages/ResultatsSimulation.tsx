import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { useSuccessionStore } from '../store/successionStore';
import { useAnalysesIntelligentes } from '../hooks/useAnalysesIntelligentes';
import { useDownloadPDF } from '../hooks/useDownloadPDF';
import { useCurrencyFormatter, usePercentageFormatter } from './hooks_useCurrencyFormatter';
import { Icon, useToast, Container, VStack, Text, Button, HStack } from '../compat';
import { FiHome, FiDownload, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import s from './ResultatsSimulation.module.css';

const CHART_COLORS = ['#0c2340','#0d7377','#c9a84c','#6d28d9','#d35244','#16365c','#14a3a8','#e8d48b'];

/* ── Custom Tooltip ──────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(12,35,64,0.95)', borderRadius: 8, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)', border: 'none',
    }}>
      {label && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem', marginBottom: 6, fontWeight: 600 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>{p.name}</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', marginLeft: 'auto' }}>
            {typeof p.value === 'number' ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── SVG Gradient Defs for Charts ────────────────── */
const ChartGradients = () => (
  <defs>
    <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#14a3a8" stopOpacity={0.95} />
      <stop offset="100%" stopColor="#0d7377" stopOpacity={0.85} />
    </linearGradient>
    <linearGradient id="gradCoral" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#e8705a" stopOpacity={0.95} />
      <stop offset="100%" stopColor="#d35244" stopOpacity={0.85} />
    </linearGradient>
    <linearGradient id="gradNavy" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#16365c" stopOpacity={0.95} />
      <stop offset="100%" stopColor="#0c2340" stopOpacity={0.85} />
    </linearGradient>
    <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#d4b85c" stopOpacity={0.95} />
      <stop offset="100%" stopColor="#c9a84c" stopOpacity={0.85} />
    </linearGradient>
  </defs>
);

const fmt = (v: number | null | undefined) => {
  if (v == null) return '0 €';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
};
const pct = (v: number | null | undefined) => {
  if (v == null) return '0 %';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(v) + ' %';
};

const USF_SCALE_ART669: [number, number][] = [
  [20, 90], [30, 80], [40, 70], [50, 60], [60, 50], [70, 40], [80, 30], [90, 20], [91, 10],
];
const getUsfPctArt669 = (age: number): number => {
  for (const [maxAge, pctValue] of USF_SCALE_ART669) {
    if (age <= maxAge) return pctValue;
  }
  return 10;
};
const getNpPctArt669 = (age: number): number => 100 - getUsfPctArt669(age);
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

/* ──────────────────────────────────────────────── */
/* SECTION WRAPPER                                   */
/* ──────────────────────────────────────────────── */
function SectionBlock({ id, num, title, subtitle, bg, refCb, children }: {
  id: string; num: number; title: string; subtitle: string; bg?: 'white' | 'gray';
  refCb: (el: HTMLElement | null) => void; children: React.ReactNode;
}) {
  return (
    <section id={id} ref={refCb} className={`${s.section} ${bg === 'white' ? s.sectionWhite : s.sectionGray}`}>
      <div className={s.sectionHeader}>
        <span className={s.sectionNumber}>{num}</span>
        <div className={s.sectionTitleGroup}>
          <h2 className={s.sectionTitle}>{title}</h2>
          <p className={s.sectionSubtitle}>{subtitle}</p>
        </div>
      </div>
      <div className={s.sectionDivider} />
      {children}
    </section>
  );
}

/* ──────────────────────────────────────────────── */
/* KPI CARD                                          */
/* ──────────────────────────────────────────────── */
function Kpi({ label, value, color = 'Blue', hint }: { label: string; value: string; color?: string; hint?: string }) {
  const colorClass = (s as any)[`kpiCard${color}`] || s.kpiCardBlue;
  const valueClass = (s as any)[`kpiValue${color}`] || s.kpiValueBlue;
  return (
    <div className={`${s.kpiCard} ${colorClass}`}>
      <div className={s.kpiLabel}>{label}</div>
      <div className={`${s.kpiValue} ${valueClass}`}>{value}</div>
      {hint && <div className={s.kpiHint}>{hint}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────── */
/* INFO BOX                                          */
/* ──────────────────────────────────────────────── */
function InfoBox({ icon, title, text, color = 'Blue' }: { icon: string; title: string; text: string; color?: string }) {
  const boxClass = (s as any)[`infoBox${color}`] || s.infoBoxBlue;
  return (
    <div className={`${s.infoBox} ${boxClass}`}>
      <span className={s.infoBoxIcon}>{icon}</span>
      <div className={s.infoBoxContent}>
        <div className={s.infoBoxTitle}>{title}</div>
        <div className={s.infoBoxText}>{text}</div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────── */
/* SCROLL TOP                                        */
/* ──────────────────────────────────────────────── */
function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 300);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  if (!show) return null;
  return <button className={s.scrollTopButton} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>;
}

/* ──────────────────────────────────────────────── */
/* ERROR FALLBACK                                    */
/* ──────────────────────────────────────────────── */
function ErrorFallback({ error, resetErrorBoundary }: { error: any; resetErrorBoundary: () => void }) {
  const navigate = useNavigate();
  return (
    <Container maxW="7xl" py={16}>
      <VStack spacing={4} align="center">
        <Icon as={FiAlertTriangle} boxSize={12} color="red.500" />
        <Text fontSize="xl" fontWeight="bold" color="red.500">Erreur lors du chargement</Text>
        <Text color="gray.600" textAlign="center">{error.message}</Text>
        <HStack spacing={3}>
          <Button onClick={resetErrorBoundary} colorScheme="blue">Réessayer</Button>
          <Button onClick={() => navigate('/')} variant="outline">Accueil</Button>
        </HStack>
      </VStack>
    </Container>
  );
}

/* ══════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                    */
/* ══════════════════════════════════════════════════ */
function ResultatsSimulation() {
  const navigate = useNavigate();
  const toast = useToast();
  const { simulationData, advisorProfile } = useSuccessionStore();
  const { data, loading, error } = useAnalysesIntelligentes(simulationData);
  const { downloadPDF, loading: pdfLoading } = useDownloadPDF();

  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeNav, setActiveNav] = useState('metadata');

  const setRef = useCallback((id: string) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(id, el); else sectionRefs.current.delete(id);
  }, []);

  const scrollTo = useCallback((id: string) => {
    sectionRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // IntersectionObserver
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting && e.target.id) setActiveNav(e.target.id); });
    }, { threshold: 0.2, rootMargin: '-120px 0px -50% 0px' });
    sectionRefs.current.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [data]);

  /* ── Derived data ─────────────────────────────── */
  const base = data?.resultatsBase || data;
  const meta = base?.metadata;
  const patrimoine = base?.patrimoine;
  const sc1 = base?.scenario1;
  const sc2 = base?.scenario2;
  const ddvScenarios: any[] = base?.scenariosDDV || [];
  const legalScenarios: any[] = base?.scenariosLegaux || [];
  const optim = base?.optimisations || data?.optimisations;
  const alertes = base?.alertes || [];
  const fiscalDetails = base?.detailsFiscaux;
  const ageUsufruitier = simulationData?.conjoint?.age ?? null;
  const rpAllowance = (() => {
    const declared = Number(sc1?.masse?.abattementResidence || 0);
    if (declared > 0) return declared;
    const civil = Number(sc1?.masse?.civil || 0);
    const fiscal = Number(sc1?.masse?.fiscale || 0);
    const inferred = civil - fiscal;
    return inferred > 0 ? inferred : 0;
  })();
  const rpBaseUsed = Number(sc1?.masse?.baseResidenceAvantAbattement || 0) > 0
    ? Number(sc1?.masse?.baseResidenceAvantAbattement || 0)
    : (rpAllowance > 0 ? rpAllowance / 0.20 : 0);

  const clientName = meta?.client ? `${meta.client.prenom} ${meta.client.nom}` : simulationData?.identite?.prenom || 'Client';
  const statutLower = (simulationData?.statut_matrimonial || '').toLowerCase();
  const isMarie = statutLower.includes('mari');
  const isPacse = statutLower.includes('pacs');
  const isConcubin = statutLower.includes('concubin');
  const isCelibataire = statutLower.includes('libataire') || (!isMarie && !isPacse && !isConcubin);
  const hasPartner = isMarie || isPacse || isConcubin;
  const ddvSelected = !!simulationData?.presence_ddv;
  const hasTestament = !!simulationData?.testament_partenaire;
  const allCommonChildren = simulationData?.enfants_tous_communs !== false; // default true
  const showSecondDeath = isMarie || (isPacse && hasTestament);

  /* ── Mode couple (inversion ordre des décès) ── */
  const resultatInverse = data?.resultatInverse || base?.resultatInverse || null;
  const hasInverse = !!resultatInverse;
  const [activeScenario, setActiveScenario] = useState<'A' | 'B' | 'comparatif'>('A');

  const inverseClientName = resultatInverse?.metadata?.client
    ? `${resultatInverse.metadata.client.prenom} ${resultatInverse.metadata.client.nom}`
    : simulationData?.conjoint?.prenom || 'Conjoint';

  const comparatifSummary = useMemo(() => {
    if (!hasInverse || !sc1 || !resultatInverse?.scenario1) return null;
    const droitsA = sc1.droitsSuccession || 0;
    const droitsB = resultatInverse.scenario1?.droitsSuccession || 0;
    const netA = sc1.transmissionNette || 0;
    const netB = resultatInverse.scenario1?.transmissionNette || 0;
    const fraisNotaireA = sc1.fraisNotaire || 0;
    const fraisNotaireB = resultatInverse.scenario1?.fraisNotaire || 0;
    const sc2A = sc2?.droitsSuccession || 0;
    const sc2B = resultatInverse?.scenario2?.droitsSuccession || 0;
    const totalA = droitsA + sc2A;
    const totalB = droitsB + sc2B;
    return {
      droitsA, droitsB, netA, netB,
      fraisNotaireA, fraisNotaireB,
      sc2A, sc2B, totalA, totalB,
      meilleur: totalA <= totalB ? 'A' : 'B',
      economie: Math.abs(totalA - totalB),
    };
  }, [hasInverse, sc1, sc2, resultatInverse]);

  /* ── Navigation items ────────────────────────── */
  const navItems = useMemo(() => {
    const items = [
      { id: 'metadata', label: 'Identité & Dossier' },
      { id: 'patrimoine', label: 'Patrimoine' },
    ];
    if (isMarie) items.push({ id: 'liquidation', label: 'Liquidation régime' });
    items.push({ id: 'masse', label: 'Masse successorale' });
    items.push({ id: 'devolution-legale', label: 'Dévolution légale' });
    items.push({ id: 'devolution', label: 'Dévolution effective' });
    items.push({ id: 'fiscal', label: 'Liquidation fiscale' });
    if (fiscalDetails?.detailAssuranceVie?.length > 0 || fiscalDetails?.detailDonationsRappelees?.length > 0 || fiscalDetails?.detailLegs?.length > 0) {
      items.push({ id: 'details-fiscaux', label: 'Détails AV / Donations / Legs' });
    }
    if (showSecondDeath) items.push({ id: 'second-deces', label: '2nd décès' });
    if (ddvScenarios.length > 0) items.push({ id: 'comparatif-ddv', label: 'Comparatif DDV' });
    if (hasInverse) items.push({ id: 'comparatif-couple', label: 'Comparatif couple' });
    items.push({ id: 'synthese', label: 'Synthèse' });
    items.push({ id: 'optimisations', label: 'Optimisations' });
    return items;
  }, [isMarie, isPacse, isConcubin, isCelibataire, ddvScenarios.length, showSecondDeath, hasInverse]);

  /* ── Patrimoine chart data ─────────────────── */
  const patrimoineChartData = useMemo(() => {
    if (!patrimoine?.repartition) return [];
    const r = patrimoine.repartition;
    return [
      { name: 'Immobilier', value: r.immobilier?.total || 0 },
      { name: 'Financier', value: r.financier?.total || 0 },
      { name: 'Professionnel', value: r.professionnel?.total || 0 },
      { name: 'Divers', value: r.autre?.total || 0 },
    ].filter(d => d.value > 0);
  }, [patrimoine]);

  const actifsSaisie = useMemo(() => Array.isArray(simulationData?.actifs) ? simulationData.actifs : [], [simulationData]);

  /* ── Heirs bar chart data ─────────────────── */
  const heirsChartData = useMemo(() => {
    if (!sc1?.heritiers) return [];
    return sc1.heritiers.map((h: any) => ({
      name: h.nom?.split(' ')[0] || h.nom,
      transmis: h.montantTransmis || 0,
      droits: h.droits || 0,
    }));
  }, [sc1]);

  /* ── Legal scenarios chart data ───────────── */
  const legalChartData = useMemo(() => {
    if (legalScenarios.length === 0) return [];
    return legalScenarios.map((ls: any) => {
      const fd = ls.premierDeces;
      const sd = ls.secondDeces;
      return {
        name: ls.optionLabel || ls.optionCode,
        droits1: fd?.droitsSuccession || 0,
        droits2: sd?.droitsSuccession || 0,
        totalDroits: (fd?.droitsSuccession || 0) + (sd?.droitsSuccession || 0),
        netTotal: (fd?.transmissionNette || 0) + (sd?.transmissionNette || 0),
      };
    });
  }, [legalScenarios]);

  /* ── Best legal option ─────────────────────── */
  const bestLegal = useMemo(() => {
    if (legalChartData.length === 0) return null;
    return legalChartData.reduce((best, cur) => cur.totalDroits < best.totalDroits ? cur : best, legalChartData[0]);
  }, [legalChartData]);

  /* ── DDV comparison chart data ─────────────── */
  const ddvChartData = useMemo(() => {
    if (ddvScenarios.length === 0) return [];
    return ddvScenarios.map((ddv: any) => {
      const fd = ddv.premierDeces;
      const sd = ddv.secondDeces;
      return {
        name: ddv.optionLabel?.replace('Option DDV : ', '') || ddv.optionCode,
        droits1: fd?.droitsSuccession || 0,
        droits2: sd?.droitsSuccession || 0,
        totalDroits: (fd?.droitsSuccession || 0) + (sd?.droitsSuccession || 0),
        netTotal: (fd?.transmissionNette || 0) + (sd?.transmissionNette || 0),
      };
    });
  }, [ddvScenarios]);

  /* ── Best DDV option ───────────────────────── */
  const bestDdv = useMemo(() => {
    if (ddvChartData.length === 0) return null;
    return ddvChartData.reduce((best, cur) => cur.totalDroits < best.totalDroits ? cur : best, ddvChartData[0]);
  }, [ddvChartData]);

  /* ── Nombre d'enfants ──────────────────────── */
  const nbEnfants = simulationData?.nombre_enfants || simulationData?.enfants?.length || 0;

  /* ── Référence stable du diagnostic ────────── */
  const refNum = useMemo(() => `DS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`, []);

  /* ── PDF handler ─────────────────────────────── */
  const handlePDF = useCallback(async () => {
    try {
      await downloadPDF({
        simulationData, base, clientName,
        isMarie, isPacse, isConcubin, isCelibataire,
        ddvSelected, hasTestament, allCommonChildren, nbEnfants,
        bestLegal, bestDdv,
        legalChartData, ddvChartData,
        conseillerNom: `${advisorProfile?.prenom || ''} ${advisorProfile?.nom || ''}`.trim() || undefined,
        conseillerEmail: advisorProfile?.email || undefined,
        conseillerTel: advisorProfile?.telephone || undefined,
        cabinetNom: advisorProfile?.cabinetNom || undefined,
        conseillerSiteWeb: advisorProfile?.siteWeb || undefined,
        resultatInverse: resultatInverse || undefined,
      });
    } catch {
      toast({ title: 'Erreur PDF', status: 'error', duration: 3000, position: 'top' });
    }
  }, [downloadPDF, simulationData, advisorProfile, base, clientName, isMarie, isPacse, isConcubin, isCelibataire, ddvSelected, hasTestament, allCommonChildren, nbEnfants, bestLegal, bestDdv, legalChartData, ddvChartData, resultatInverse, toast]);

  /* ── Loading ─────────────────────────────────── */
  if (loading && !data) {
    return (
      <div className={s.loadingContainer}>
        <div className={s.loadingSpinner} />
        <div className={s.loadingText}>Calcul de votre simulation successorale...</div>
      </div>
    );
  }

  if (error) return <ErrorFallback error={error} resetErrorBoundary={() => window.location.reload()} />;

  return (
    <div className={s.container}>
      {/* ═══ HEADER ═══ */}
      <header className={s.header}>
        <div className={s.headerContent}>
          <div>
            <h1 className={s.headerTitle}>Diagnostic Successoral</h1>
            <p className={s.headerSubtitle}>{clientName} — Étude du {meta?.dateEtude || new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          <div className={s.headerActions}>
            <button className={s.headerButton} onClick={() => navigate('/simulateur')}><Icon as={FiArrowLeft} boxSize={3.5} /> Modifier</button>
            <button className={s.headerButton} onClick={() => navigate('/')}><Icon as={FiHome} boxSize={3.5} /> Accueil</button>
            <button className={`${s.headerButtonPrimary} ${pdfLoading ? s.headerButtonDisabled : ''}`} onClick={handlePDF} disabled={pdfLoading}>
              <Icon as={FiDownload} boxSize={3.5} /> {pdfLoading ? 'Génération...' : 'Export PDF'}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ LAYOUT: SIDEBAR + CONTENT ═══ */}
      <div className={s.layoutWrapper}>
        {/* ── Left sidebar navigation ── */}
        <nav className={s.sidebar}>
          <div className={s.sidebarTitle}>Navigation</div>
          {navItems.map(n => (
            <button key={n.id} className={`${s.navItem} ${activeNav === n.id ? s.navItemActive : ''}`} onClick={() => scrollTo(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>

        {/* ── Content area ── */}
        <div className={s.contentArea} ref={reportRef}>

          {/* ═══ HERO — Introduction au diagnostic ═══ */}
          <div className={s.heroIntro}>
            <div className={s.heroIntroInner}>
              {meta?.client?.sexe === 'F' ? 'Madame' : 'Monsieur'} <strong>{clientName}</strong>,
              vous avez entre les mains votre <strong>diagnostic successoral</strong>.
              Anticiper sa succession, c'est protéger ses proches : savoir ce qu'ils recevront,
              combien l'État prélèvera, et surtout <em>quels leviers activer</em> pour optimiser
              la transmission de votre patrimoine. Ce rapport analyse étape par étape —{' '}
              {isMarie
                ? 'régime matrimonial, dévolution légale, fiscalité, options du conjoint survivant'
                : isPacse
                  ? 'droits du partenaire, dévolution légale, fiscalité'
                  : isConcubin
                    ? 'situation du concubin, dévolution légale, fiscalité'
                    : 'dévolution légale, fiscalité, stratégies de transmission'}{' '}
              — et vous
              propose des <strong>stratégies d'optimisation chiffrées</strong> adaptées à votre
              situation personnelle. Chaque section est conçue pour être compréhensible, même
              sans connaissance juridique préalable.
            </div>
          </div>

          {/* ═══ BANDEAU TRAÇABILITÉ ═══ */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '0.75rem 1rem', background: '#f0f4f8', borderRadius: 10, border: '1px solid #d1d9e0', marginBottom: '0.75rem', fontSize: '0.78rem', color: '#5a6a7a' }}>
            <span><strong>Réf.</strong> {refNum}</span>
            <span>|</span>
            <span><strong>Date d'étude :</strong> {meta?.dateEtude || new Date().toLocaleDateString('fr-FR')}</span>
            <span>|</span>
            <span><strong>Année fiscale :</strong> {meta?.anneeFiscale || new Date().getFullYear()}</span>
            <span>|</span>
            <span><strong>Moteur :</strong> v2.1 — barème DMTG {new Date().getFullYear()}</span>
          </div>

          {/* ═══ BANDEAU COUVERTURE / LIMITES ═══ */}
          <div style={{ padding: '0.75rem 1rem', background: '#fffbeb', borderRadius: 10, border: '1px solid #fcd34d', marginBottom: '1.25rem', fontSize: '0.78rem', color: '#92400e', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '1rem' }}>⚠</span> Périmètre et limites de cette simulation
            </div>
            <div>
              Ce diagnostic est une <strong>estimation indicative</strong> fondée sur les informations déclarées et la législation fiscale en vigueur
              au {new Date().toLocaleDateString('fr-FR')}. Il <strong>ne constitue pas un acte juridique</strong> et ne se substitue pas à une consultation notariale.
              {' '}Les éléments non couverts incluent : régimes internationaux, trust, SCI à l'IS, démembrement croisé complexe,
              et toute situation requérant une analyse sur mesure.
              {hasPartner && !isMarie && !isPacse && ' Le concubin n\'a aucun droit légal dans la succession : seuls le testament et l\'assurance-vie permettent de le protéger.'}
            </div>
          </div>

          {/* ═══ MAIN ═══ */}
          <main className={s.main}>

        {/* ──────────────────────────────────────────── */}
        {/* SECTION 1 : MÉTADONNÉES                      */}
        {/* ──────────────────────────────────────────── */}
        <SectionBlock id="metadata" num={1} title="Votre situation" subtitle="Les informations qui déterminent le cadre juridique et fiscal de votre succession" refCb={setRef('metadata')}>
          <div className={s.commentary}>
            <p style={{ marginBottom: '0.8rem' }}>
              Cette simulation porte sur la succession de <strong>{meta?.client?.sexe === 'F' ? 'Madame' : 'Monsieur'} {clientName}</strong>,
              âgé(e) de <strong>{meta?.client?.age || simulationData?.identite?.age || '–'} ans</strong>.
              {isMarie && <> Vous êtes <strong>marié(e)</strong> sous le régime {meta?.statutMatrimonial ? <><strong>{meta.statutMatrimonial}</strong></> : <>de la communauté</>}.</>}
              {isPacse && <> Vous êtes <strong>pacsé(e)</strong>. Le PACS ne confère aucun droit successoral légal au partenaire survivant — un testament est indispensable pour le protéger.</>}
              {isConcubin && <> Vous êtes en <strong>concubinage</strong> (union libre). Le concubin est considéré comme un tiers pour le droit successoral, avec une fiscalité très défavorable (60 %).</>}
              {isCelibataire && <> Vous êtes <strong>célibataire</strong>. Votre succession sera dévolue selon les règles des ordres et degrés du Code civil.</>}
            </p>
            {hasPartner && simulationData?.conjoint?.prenom && (
              <p style={{ marginBottom: '0.8rem' }}>
                Votre {isMarie ? 'conjoint' : isPacse ? 'partenaire de PACS' : 'concubin'} survivant(e)
                est <strong>{simulationData.conjoint.prenom} {simulationData.conjoint.nom || ''}</strong>,
                âgé(e) de <strong>{simulationData.conjoint.age || '–'} ans</strong>.
                {ddvSelected && <> Une <strong>Donation au Dernier Vivant (DDV)</strong> est en place, ce qui élargit les droits du conjoint survivant au-delà des options légales.</>}
              </p>
            )}
            <p style={{ marginBottom: '0.8rem' }}>
              {nbEnfants > 0
                ? <>Vous avez <strong>{nbEnfants} enfant(s)</strong>, qui sont vos héritiers réservataires. La loi leur garantit une part minimale de votre patrimoine (la <em>réserve héréditaire</em>).</>
                : <>Vous n'avez pas d'enfant. En l'absence d'héritiers réservataires, vous disposez d'une liberté totale pour organiser votre transmission par testament.</>
              }
            </p>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#fff7ed', borderRadius: 10, border: '1px solid #f0d9b5', fontSize: '0.82rem', color: '#7a5c2e', lineHeight: 1.6 }}>
            <strong>Date de l'étude :</strong> {meta?.dateEtude || new Date().toLocaleDateString('fr-FR')} —
            Ce rapport est une simulation à visée pédagogique basée sur la législation fiscale en vigueur. Il ne remplace pas le conseil personnalisé d'un notaire ou d'un conseiller en gestion de patrimoine.
          </div>
        </SectionBlock>

        {/* ──────────────────────────────────────────── */}
        {/* SECTION 2 : PATRIMOINE                       */}
        {/* ──────────────────────────────────────────── */}
        <SectionBlock id="patrimoine" num={2} title="Votre patrimoine" subtitle="Première étape : inventorier l'ensemble de vos biens et dettes" bg="white" refCb={setRef('patrimoine')}>
          <div className={s.commentary}>
            <p style={{ marginBottom: '0.8rem' }}>
              La première étape d'une succession consiste à dresser l'<strong>inventaire complet du patrimoine</strong> :
              tous les biens (immobiliers, financiers, professionnels, etc.) et toutes les dettes.
              C'est à partir du <strong>patrimoine net</strong> (biens − dettes) que sera calculée la masse successorale.
            </p>
            <p>
              Votre patrimoine brut s'élève à <strong>{fmt(patrimoine?.totalBrut)}</strong>.
              Après déduction des dettes (<strong>{fmt((patrimoine?.totalBrut || 0) - (patrimoine?.totalNet || 0))}</strong>),
              votre <strong>patrimoine net est de {fmt(patrimoine?.totalNet)}</strong>.
              {isMarie && <> Ce patrimoine net sera ensuite partagé entre la part du conjoint et la part successorale lors de la liquidation du régime matrimonial (étape suivante).</>}
              {!isMarie && <> Ce patrimoine net constitue directement la base de calcul de votre succession.</>}
            </p>
          </div>

          <div className={s.chartsRow}>
            {/* Pie chart répartition */}
            {patrimoineChartData.length > 0 && (
              <div className={s.chartContainer}>
                <h3 className={s.chartTitle}>Répartition du patrimoine</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={patrimoineChartData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                      paddingAngle={3} cornerRadius={4}
                      animationBegin={0} animationDuration={800} animationEasing="ease-out"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#8894a7', strokeWidth: 1 }}
                    >
                      {patrimoineChartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom" height={36} iconType="circle" iconSize={8}
                      formatter={(value: string) => <span style={{ color: '#3a4a5c', fontSize: '0.72rem', fontWeight: 500 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tableau des actifs */}
            {patrimoine?.actifs && patrimoine.actifs.length > 0 && (
              <div className={s.chartContainer}>
                <h3 className={s.chartTitle}>Détail des actifs</h3>
                <table className={s.dataTable}>
                  <thead><tr><th>Type</th><th>Nature</th><th>Désignation</th><th>Valeur</th><th>Dette</th><th>Net</th></tr></thead>
                  <tbody>
                    {patrimoine.actifs.map((a: any, i: number) => {
                      const actifSaisi: any = actifsSaisie[i] || {};
                      const nature = pickMeaningful(
                        a?.nature,
                        a?.conditions?.sousType,
                        a?.conditions?.nature,
                        a?.conditions?.metadonnees?.nature,
                        actifSaisi?.conditions?.sousType,
                        actifSaisi?.conditions?.metadonnees?.nature,
                        actifSaisi?.usage
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
                      return (
                        <tr key={i}>
                          <td>{readableAssetLabel(rawType || a?.type || 'AUTRE')}</td>
                          <td>{humanizeLabel(nature || a?.conditions?.sousType || '—')}</td>
                          <td>{designation}</td>
                          <td>{fmt(a.valeur)}</td><td>{fmt(a.dette)}</td><td>{fmt(a.valeurNette)}</td>
                        </tr>
                      );
                    })}
                    <tr className={s.rowTotal}>
                      <td colSpan={3}>Total</td><td>{fmt(patrimoine.totalBrut)}</td>
                      <td>{fmt((patrimoine.totalBrut || 0) - (patrimoine.totalNet || 0))}</td>
                      <td>{fmt(patrimoine.totalNet)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SectionBlock>

        {/* ──────────────────────────────────────────── */}
        {/* SECTION 3 : LIQUIDATION RÉGIME MATRIMONIAL   */}
        {/* ──────────────────────────────────────────── */}
        {isMarie && sc1?.liquidation && (
          <SectionBlock id="liquidation" num={3} title="Liquidation du régime matrimonial" subtitle="Deuxième étape : déterminer ce qui entre réellement dans la succession" refCb={setRef('liquidation')}>
            <div className={s.commentary}>
              <p style={{ marginBottom: '0.8rem' }}>
                Lorsqu'on est marié, <strong>tout le patrimoine ne rentre pas dans la succession</strong>.
                Il faut d'abord « liquider » le régime matrimonial, c'est-à-dire <strong>séparer ce qui
                appartient au conjoint survivant</strong> de ce qui constitue la part du défunt.
              </p>
              <p style={{ marginBottom: '0.8rem' }}>
                Sous le régime de la <strong>{meta?.statutMatrimonial || 'communauté'}</strong>,
                les biens communs sont partagés en deux : <strong>la moitié revient automatiquement au
                conjoint survivant</strong> (ce n'est pas un héritage, c'est sa propriété).
                Seule l'autre moitié, ajoutée aux biens propres du défunt, constitue la <strong>masse successorale</strong> à partager entre les héritiers.
              </p>
              <p>
                Concrètement, sur un patrimoine net total de <strong>{fmt(patrimoine?.totalNet)}</strong>,
                la part entrant dans la succession est de <strong>{fmt(sc1.liquidation.actifSuccessoral)}</strong>.
              </p>
            </div>

            <table className={s.dataTable} style={{ marginTop: '1.25rem' }}>
              <thead><tr><th>Poste</th><th>Montant</th><th>Explication</th></tr></thead>
              <tbody>
                <tr><td>Biens propres du défunt</td><td>{fmt(sc1.liquidation.biensPropreDefunt)}</td><td style={{ fontSize: '0.8rem', color: '#5a6a7a' }}>Biens acquis avant le mariage ou reçus par donation/succession</td></tr>
                <tr><td>Biens communs du couple</td><td>{fmt(sc1.liquidation.biensCommuns)}</td><td style={{ fontSize: '0.8rem', color: '#5a6a7a' }}>Biens acquis pendant le mariage (partagés 50/50)</td></tr>
                <tr className={s.rowSubtotal}><td>Part du conjoint (hors succession)</td><td>{fmt(sc1.liquidation.partConjoint)}</td><td style={{ fontSize: '0.8rem', color: '#5a6a7a' }}>= moitié des biens communs → reste au conjoint</td></tr>
                <tr className={s.rowSubtotal}><td>Part du défunt (= masse successorale)</td><td>{fmt(sc1.liquidation.partDefunt)}</td><td style={{ fontSize: '0.8rem', color: '#5a6a7a' }}>= biens propres + moitié des biens communs</td></tr>
                <tr className={s.rowTotal}><td>Actif net successoral</td><td>{fmt(sc1.liquidation.actifSuccessoral)}</td><td style={{ fontSize: '0.8rem', fontWeight: 700 }}>C'est cette somme qui sera partagée entre les héritiers</td></tr>
              </tbody>
            </table>
          </SectionBlock>
        )}

        {/* ──────────────────────────────────────────── */}
        {/* SECTION 4 : MASSE SUCCESSORALE               */}
        {/* ──────────────────────────────────────────── */}
        <SectionBlock id="masse" num={isMarie ? 4 : 3} title="Masse successorale & réserve héréditaire" subtitle={isMarie ? 'Troisième étape : déterminer les limites de ce que vous pouvez transmettre librement' : 'Deuxième étape : déterminer les limites de ce que vous pouvez transmettre librement'} bg="white" refCb={setRef('masse')}>
          {sc1?.masse && (
            <>
              <div className={s.commentary}>
                <p style={{ marginBottom: '0.8rem' }}>
                  La <strong>masse de calcul</strong> (art. 922 C.civ) est le montant à partir duquel on détermine
                  deux choses essentielles : la <strong>réserve héréditaire</strong> (part intouchable réservée à vos enfants)
                  et la <strong>quotité disponible</strong> (part que vous pouvez transmettre librement, par exemple au conjoint
                  ou à un tiers via un testament).
                </p>
                {nbEnfants > 0 ? (
                  <p style={{ marginBottom: '0.8rem' }}>
                    Avec <strong>{nbEnfants} enfant(s)</strong>, la loi impose une réserve héréditaire
                    de <strong>{nbEnfants === 1 ? '1/2' : nbEnfants === 2 ? '2/3' : '3/4'}</strong> du patrimoine,
                    soit <strong>{fmt(sc1.masse.reserve)}</strong>. La quotité disponible — la part librement transmissible — est
                    de <strong>{fmt(sc1.masse.quotiteDisponible)}</strong>
                    {' '}({nbEnfants === 1 ? '1/2' : nbEnfants === 2 ? '1/3' : '1/4'} du patrimoine).
                  </p>
                ) : (
                  <p style={{ marginBottom: '0.8rem' }}>
                    En l'absence d'enfant, il n'y a <strong>pas de réserve héréditaire</strong> (sauf cas particulier des
                    ascendants privilégiés). Vous disposez d'une <strong>liberté totale</strong> pour transmettre
                    l'intégralité de votre patrimoine à la personne de votre choix.
                  </p>
                )}
                <p>
                  La <strong>masse fiscale</strong> (<strong>{fmt(sc1.masse.fiscale)}</strong>) est la base sur laquelle
                  seront calculés les droits de succession de chaque héritier.
                  {sc1.masse.abattementResidence ? <> Elle tient compte de l'<strong>abattement de 20 % sur la résidence principale</strong> (art. 764 bis CGI), soit une économie de <strong>{fmt(sc1.masse.abattementResidence)}</strong>.</> : ''}
                </p>
                <p style={{ marginTop: '0.45rem' }}>
                  Règle de calcul : l'abattement RP s'applique sur la <strong>part de résidence principale qui entre dans la succession</strong>.
                  Si la RP est un bien commun, <strong>seule la moitié</strong> est retenue, puis on applique 20 % sur cette base.
                </p>
                {rpAllowance > 0 && (
                  <p style={{ marginTop: '0.45rem' }}>
                    Détail fiscal : <strong>{fmt(sc1.masse.fiscale)}</strong> = {fmt(sc1.masse.civil)} - {fmt(rpAllowance)}.
                    L'abattement de {fmt(rpAllowance)} correspond à 20 % d'une valeur de résidence principale retenue de <strong>{fmt(rpBaseUsed)}</strong>.
                    {' '}Formule: abattement RP = 20 % × base RP successorale.
                  </p>
                )}
              </div>

              <div style={{ overflowX: 'auto', marginTop: '1.25rem' }}>
                <table className={s.dataTable}>
                  <thead><tr><th>Élément</th><th>Montant</th><th>Signification</th></tr></thead>
                  <tbody>
                    <tr><td><strong>Masse de calcul (civil)</strong></td><td>{fmt(sc1.masse.civil)}</td><td style={{ fontSize: '0.8rem', color: '#5a6a7a' }}>Base pour déterminer réserve et QD (art. 922 C.civ)</td></tr>
                    <tr><td><strong>Réserve héréditaire</strong></td><td style={{ color: '#c9a84c', fontWeight: 700 }}>{fmt(sc1.masse.reserve)}</td><td style={{ fontSize: '0.8rem', color: '#5a6a7a' }}>Part garantie aux {nbEnfants} enfant(s) — intouchable</td></tr>
                    <tr><td><strong>Quotité disponible</strong></td><td style={{ color: '#0d7377', fontWeight: 700 }}>{fmt(sc1.masse.quotiteDisponible)}</td><td style={{ fontSize: '0.8rem', color: '#5a6a7a' }}>Part librement transmissible (conjoint, tiers, legs)</td></tr>
                    {rpAllowance > 0 && (
                      <>
                        <tr><td><strong>Abattement résidence (20 %)</strong></td><td>- {fmt(rpAllowance)}</td><td style={{ fontSize: '0.8rem', color: '#5a6a7a' }}>Art. 764 bis CGI — appliqué sur la résidence principale retenue</td></tr>
                        <tr><td><strong>Base RP retenue</strong></td><td>{fmt(rpBaseUsed)}</td><td style={{ fontSize: '0.8rem', color: '#5a6a7a' }}>Valeur de résidence principale prise en compte pour l'abattement</td></tr>
                      </>
                    )}
                    <tr className={s.rowTotal}><td><strong>Masse fiscale</strong></td><td>{fmt(sc1.masse.fiscale)}</td><td style={{ fontSize: '0.8rem', fontWeight: 700 }}>Base de calcul des droits de succession</td></tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </SectionBlock>

        {/* ──────────────────────────────────────────── */}
        {/* SECTION 5 : DÉVOLUTION LÉGALE (AB INTESTAT)   */}
        {/* ──────────────────────────────────────────── */}
        {sc1 && (
          <SectionBlock id="devolution-legale" num={isMarie ? 5 : 4} title="Dévolution légale — Le cadre ab intestat" subtitle="Ce que prévoit la loi en l'absence de testament ou de donation au dernier vivant" refCb={setRef('devolution-legale')}>

            {/* ── PARTIE 1 : Introduction pédagogique ── */}
            <div className={s.commentary}>
              <p>
                Avant d'examiner le résultat effectif de votre simulation, il est important de comprendre
                le <strong>cadre légal</strong> applicable. En l'absence de testament, c'est le
                <strong> Code civil (art. 731 et suivants)</strong> qui détermine la répartition de la succession.
                On parle alors de <em>dévolution légale</em> ou <em>succession ab intestat</em>.
              </p>
            </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* PACS — Aucun droit successoral légal           */}
            {/* ═══════════════════════════════════════════════ */}
            {isPacse && (
              <>
                <InfoBox icon="🚨" title="PACS — Aucun droit successoral légal (art. 515-6 C.civ)"
                  text="Contrairement au conjoint marié, le partenaire de PACS n'est PAS héritier légal. Sans testament, il ne reçoit rien de la succession. En revanche, s'il est institué légataire par testament, il bénéficie de la même exonération fiscale que le conjoint marié (loi TEPA 2007, art. 796-0 bis CGI)."
                  color="Red" />

                <div className={s.commentary} style={{ marginTop: '1.5rem' }}>
                  <p style={{ marginBottom: '0.8rem' }}>
                    <strong>Situation légale du partenaire de PACS :</strong> Le partenaire pacsé ne figure pas parmi
                    les héritiers légaux définis par le Code civil. En l'absence de testament, <strong>il ne reçoit
                    aucune part de la succession</strong>. Les héritiers légaux sont :
                  </p>
                  {nbEnfants > 0 ? (
                    <p style={{ marginBottom: '0.8rem' }}>
                      Les <strong>{nbEnfants} enfant(s)</strong> héritent de la totalité de la succession en <strong>pleine
                      propriété</strong>, à parts égales (art. 734 C.civ). Chaque enfant bénéficie d'un abattement
                      de <strong>100 000 €</strong> (art. 779 CGI), puis les droits sont calculés selon le barème
                      progressif en ligne directe (5 % à 45 %).
                    </p>
                  ) : (
                    <p style={{ marginBottom: '0.8rem' }}>
                      En l'absence d'enfant, la succession est dévolue selon les <strong>ordres et degrés</strong> :
                      les parents du défunt (s'ils sont vivants) reçoivent chacun 1/4 en pleine propriété (droit de
                      retour légal, art. 738-2 C.civ), le reste étant partagé entre les frères et sœurs. Si les
                      parents sont prédécédés, les frères et sœurs héritent de tout. En l'absence de fratrie,
                      les parents héritent de la totalité.
                    </p>
                  )}
                </div>

                <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
                  <h3 className={s.chartTitle}>PACS vs Mariage — Comparaison des droits successoraux</h3>
                  <table className={s.dataTable}>
                    <thead>
                      <tr>
                        <th style={{ minWidth: 180 }}>Critère</th>
                        <th>PACS</th>
                        <th>Mariage</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Héritier légal ?</strong></td>
                        <td style={{ color: '#d35244', fontWeight: 700 }}>Non — aucun droit sans testament</td>
                        <td style={{ color: '#0d7377', fontWeight: 700 }}>Oui — héritier légal de plein droit</td>
                      </tr>
                      <tr>
                        <td><strong>Avec testament</strong></td>
                        <td>Peut recevoir la quotité disponible (QD)</td>
                        <td>Peut recevoir la QD + options légales (USF ou 1/4 PP)</td>
                      </tr>
                      <tr>
                        <td><strong>Fiscalité</strong></td>
                        <td style={{ color: '#0d7377' }}>Exonéré de droits de succession (art. 796-0 bis CGI)</td>
                        <td style={{ color: '#0d7377' }}>Exonéré de droits de succession (art. 796-0 bis CGI)</td>
                      </tr>
                      <tr>
                        <td><strong>Droit au logement</strong></td>
                        <td>Droit temporaire d'un an (art. 763 C.civ) — sur le logement commun uniquement</td>
                        <td>Droit viager au logement possible (art. 764 C.civ)</td>
                      </tr>
                      <tr>
                        <td><strong>Réserve héréditaire</strong></td>
                        <td>Aucune part réservataire</td>
                        <td>Aucune part réservataire (mais droits légaux)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className={s.verdictBox} style={{ marginTop: '1.5rem' }}>
                  <div className={s.verdictTitle}>Recommandation pour les partenaires de PACS</div>
                  <div className={s.verdictText}>
                    Il est <strong>indispensable</strong> de rédiger un <span className={s.verdictHighlight}>testament</span> pour
                    protéger votre partenaire pacsé. Sans testament, il ne recevra <strong>rien</strong> de votre succession.
                    {nbEnfants > 0
                      ? <> Avec un testament, vous pouvez lui léguer jusqu'à la <strong>quotité disponible</strong> (soit {nbEnfants === 1 ? 'la moitié' : nbEnfants === 2 ? 'un tiers' : 'un quart'} de votre patrimoine). Le partenaire pacsé bénéficie de la même <strong>exonération totale de droits</strong> que le conjoint marié.</>
                      : <> En l'absence d'enfant et de parents vivants, vous pouvez lui léguer la <strong>totalité</strong> de votre patrimoine par testament. Le partenaire pacsé bénéficie de la même <strong>exonération totale de droits</strong> que le conjoint marié.</>
                    }
                    {' '}L'<strong>assurance-vie</strong> constitue également un levier puissant pour transmettre hors succession.
                  </div>
                </div>
              </>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* CONCUBINAGE — Aucun droit, taxation à 60%      */}
            {/* ═══════════════════════════════════════════════ */}
            {isConcubin && (
              <>
                <InfoBox icon="🚨" title="Concubinage — Aucun droit successoral, taxation à 60 %"
                  text="Le concubin n'a AUCUN droit successoral légal. Même avec un testament, les sommes transmises au concubin sont taxées au taux forfaitaire de 60 % (art. 777 CGI, taux entre non-parents), après un abattement dérisoire de 1 594 € seulement. C'est la situation la plus défavorable fiscalement."
                  color="Red" />

                <div className={s.commentary} style={{ marginTop: '1.5rem' }}>
                  <p style={{ marginBottom: '0.8rem' }}>
                    <strong>Situation légale du concubin :</strong> Le concubinage (union libre) n'est pas reconnu par le
                    droit successoral. Le concubin est considéré comme un <strong>tiers</strong> vis-à-vis de la succession.
                    En l'absence de testament, <strong>il ne reçoit strictement rien</strong>.
                  </p>
                  {nbEnfants > 0 ? (
                    <p style={{ marginBottom: '0.8rem' }}>
                      Les <strong>{nbEnfants} enfant(s)</strong> héritent de la totalité de la succession en <strong>pleine
                      propriété</strong>, à parts égales. Chaque enfant bénéficie de l'abattement de 100 000 €
                      et du barème progressif en ligne directe.
                    </p>
                  ) : (
                    <p style={{ marginBottom: '0.8rem' }}>
                      En l'absence d'enfant, la succession est dévolue aux héritiers par le sang selon les ordres
                      et degrés : parents, puis frères et sœurs, puis neveux/nièces, etc. Le concubin n'hérite jamais
                      automatiquement.
                    </p>
                  )}
                  <p style={{ marginBottom: '0.8rem' }}>
                    <strong>Même avec un testament</strong>, le concubin ne peut recevoir que la <strong>quotité disponible</strong>
                    {nbEnfants > 0 ? ` (${nbEnfants === 1 ? '1/2' : nbEnfants === 2 ? '1/3' : '1/4'} du patrimoine en présence de ${nbEnfants} enfant(s))` : ''}.
                    Et cette part sera taxée à <strong>60 %</strong> après seulement <strong>1 594 € d'abattement</strong>.
                  </p>
                </div>

                <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
                  <h3 className={s.chartTitle}>Concubinage vs PACS vs Mariage — Impact fiscal</h3>
                  <table className={s.dataTable}>
                    <thead>
                      <tr>
                        <th style={{ minWidth: 180 }}>Critère</th>
                        <th>Concubinage</th>
                        <th>PACS</th>
                        <th>Mariage</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Héritier légal ?</strong></td>
                        <td style={{ color: '#d35244', fontWeight: 700 }}>Non</td>
                        <td style={{ color: '#d35244', fontWeight: 700 }}>Non</td>
                        <td style={{ color: '#0d7377', fontWeight: 700 }}>Oui</td>
                      </tr>
                      <tr>
                        <td><strong>Abattement</strong></td>
                        <td style={{ color: '#d35244' }}>1 594 € seulement</td>
                        <td style={{ color: '#0d7377' }}>Exonération totale</td>
                        <td style={{ color: '#0d7377' }}>Exonération totale</td>
                      </tr>
                      <tr>
                        <td><strong>Taux d'imposition</strong></td>
                        <td style={{ color: '#d35244', fontWeight: 700 }}>60 % forfaitaire</td>
                        <td style={{ color: '#0d7377' }}>0 % (exonéré)</td>
                        <td style={{ color: '#0d7377' }}>0 % (exonéré)</td>
                      </tr>
                      <tr>
                        <td><strong>Protection du logement</strong></td>
                        <td>Aucune protection légale</td>
                        <td>Droit temporaire d'un an</td>
                        <td>Droit viager possible</td>
                      </tr>
                      <tr>
                        <td><strong>Exemple : legs de 100 000 €</strong></td>
                        <td style={{ color: '#d35244', fontWeight: 700 }}>59 044 € de droits</td>
                        <td style={{ color: '#0d7377' }}>0 € de droits</td>
                        <td style={{ color: '#0d7377' }}>0 € de droits</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className={s.verdictBox} style={{ marginTop: '1.5rem' }}>
                  <div className={s.verdictTitle}>Recommandation urgente pour les concubins</div>
                  <div className={s.verdictText}>
                    La situation fiscale du concubinage est <strong>extrêmement défavorable</strong>. Pour protéger
                    votre concubin, plusieurs pistes s'offrent à vous :
                    <ul style={{ margin: '0.5rem 0 0.5rem 1.2rem', lineHeight: 1.8 }}>
                      <li><strong>PACS ou mariage</strong> : permet une exonération totale de droits de succession entre partenaires</li>
                      <li><strong>Assurance-vie</strong> : les capitaux versés avant 70 ans bénéficient d'un abattement de 152 500 € par bénéficiaire (art. 990 I CGI), puis taxation à 20 %/31,25 % — bien plus favorable que les 60 %</li>
                      <li><strong>Tontine</strong> : sur un bien immobilier, permet au survivant de devenir propriétaire, mais avec taxation aux droits de mutation à titre onéreux</li>
                      <li><strong>SCI</strong> : possibilité de transmettre des parts de manière progressive</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* CÉLIBATAIRE — Transmission directe             */}
            {/* ═══════════════════════════════════════════════ */}
            {isCelibataire && (
              <>
                {nbEnfants > 0 ? (
                  <>
                    <InfoBox icon="⚖️" title={`Dévolution légale — Célibataire avec ${nbEnfants} enfant(s)`}
                      text={`En l'absence de conjoint, vos ${nbEnfants} enfant(s) héritent de la totalité de la succession en pleine propriété, à parts égales (art. 734 C.civ). Chaque enfant bénéficie d'un abattement de 100 000 € (art. 779 CGI). Il n'y a pas de démembrement (usufruit/nue-propriété) puisqu'il n'y a pas de conjoint survivant.`}
                      color="Blue" />

                    <div className={s.commentary} style={{ marginTop: '1.5rem' }}>
                      <p style={{ marginBottom: '0.8rem' }}>
                        <strong>Répartition de la succession :</strong> Chaque enfant reçoit <strong>1/{nbEnfants}e</strong> de
                        la succession en pleine propriété. La transmission est directe, sans démembrement
                        (pas d'usufruit ni de nue-propriété), ce qui simplifie considérablement la situation juridique et fiscale.
                      </p>
                      <p style={{ marginBottom: '0.8rem' }}>
                        <strong>Fiscalité :</strong> Chaque enfant bénéficie d'un <strong>abattement personnel de 100 000 €</strong> (art. 779 CGI).
                        Au-delà, les droits sont calculés selon le <strong>barème progressif en ligne directe</strong> (de 5 % pour
                        la tranche jusqu'à 8 072 € à 45 % au-delà de 1 805 677 €). L'abattement se reconstitue tous les 15 ans.
                      </p>
                      <p>
                        <strong>Pas de second décès :</strong> En l'absence de conjoint, il n'y a pas de simulation de « second décès ».
                        La totalité du patrimoine est transmise en une seule fois aux enfants.
                      </p>
                    </div>

                    <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
                      <h3 className={s.chartTitle}>Barème des droits en ligne directe (enfants)</h3>
                      <table className={s.dataTable}>
                        <thead>
                          <tr>
                            <th>Tranche (après abattement)</th>
                            <th>Taux</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td>Jusqu'à 8 072 €</td><td>5 %</td></tr>
                          <tr><td>De 8 072 € à 12 109 €</td><td>10 %</td></tr>
                          <tr><td>De 12 109 € à 15 932 €</td><td>15 %</td></tr>
                          <tr><td>De 15 932 € à 552 324 €</td><td>20 %</td></tr>
                          <tr><td>De 552 324 € à 902 838 €</td><td>30 %</td></tr>
                          <tr><td>De 902 838 € à 1 805 677 €</td><td>40 %</td></tr>
                          <tr><td>Au-delà de 1 805 677 €</td><td>45 %</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <>
                    <InfoBox icon="⚖️" title="Dévolution légale — Célibataire sans enfant"
                      text="En l'absence de conjoint et d'enfant, la succession est dévolue selon le système des ordres et degrés défini par le Code civil (art. 734 et suivants). Les héritiers sont déterminés selon leur proximité de parenté avec le défunt."
                      color="Blue" />

                    <div className={s.commentary} style={{ marginTop: '1.5rem' }}>
                      <p style={{ marginBottom: '0.8rem' }}>
                        <strong>Ordre des héritiers (art. 734 C.civ) :</strong> Le Code civil définit quatre ordres d'héritiers.
                        Un ordre prime sur les suivants : si des héritiers existent dans le premier ordre, les ordres inférieurs
                        sont exclus.
                      </p>
                    </div>

                    <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                      <h3 className={s.chartTitle}>Ordres d'héritiers et fiscalité applicable</h3>
                      <table className={s.dataTable}>
                        <thead>
                          <tr>
                            <th style={{ minWidth: 60 }}>Ordre</th>
                            <th>Héritiers</th>
                            <th>Abattement</th>
                            <th>Taux</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>1er</strong></td>
                            <td>Descendants (enfants, petits-enfants)</td>
                            <td>100 000 € par enfant</td>
                            <td>5 % à 45 % (barème progressif)</td>
                          </tr>
                          <tr>
                            <td><strong>2e</strong></td>
                            <td>Parents + frères et sœurs</td>
                            <td>Parents : 100 000 € chacun — Fratrie : 15 932 €</td>
                            <td>Parents : 5-45 % — Fratrie : 35 % puis 45 %</td>
                          </tr>
                          <tr>
                            <td><strong>3e</strong></td>
                            <td>Ascendants autres (grands-parents)</td>
                            <td>Aucun abattement spécifique</td>
                            <td>5 % à 45 %</td>
                          </tr>
                          <tr>
                            <td><strong>4e</strong></td>
                            <td>Collatéraux ordinaires (oncles, tantes, cousins)</td>
                            <td>1 594 €</td>
                            <td>55 % ou 60 %</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className={s.commentary} style={{ marginTop: '1.5rem' }}>
                      <p style={{ marginBottom: '0.8rem' }}>
                        <strong>Cas le plus fréquent — Parents et fratrie :</strong> Si vos deux parents sont vivants,
                        ils reçoivent chacun <strong>1/4 en pleine propriété</strong> (droit de retour légal). Les
                        <strong> frères et sœurs</strong> se partagent la <strong>moitié restante</strong> à parts égales.
                        Si un seul parent est vivant, il reçoit 1/4 et la fratrie 3/4. Si aucun parent n'est vivant,
                        la fratrie hérite de la totalité.
                      </p>
                      <p>
                        <strong>Abattement spécifique fratrie :</strong> Chaque frère ou sœur bénéficie d'un abattement
                        de <strong>15 932 €</strong> (art. 779 CGI). Les droits sont ensuite calculés au taux de
                        <strong> 35 %</strong> jusqu'à 24 430 € puis <strong>45 %</strong> au-delà.
                        L'exonération totale s'applique si le frère/la sœur est célibataire, veuf(ve), divorcé(e)
                        ou séparé(e), âgé(e) de plus de 50 ans ou infirme, et a vécu avec le défunt pendant les
                        5 années précédant le décès (art. 796-0 ter CGI).
                      </p>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* MARIÉ — Options légales A et B (existant)      */}
            {/* ═══════════════════════════════════════════════ */}
            {isMarie && (
              <>
                <InfoBox icon="⚖️" title="Règles légales applicables (art. 757 C.civ)"
                  text={nbEnfants > 0
                    ? allCommonChildren
                      ? `En présence du conjoint survivant et de ${nbEnfants} enfant(s) commun(s), le conjoint a le choix entre deux options prévues par la loi : (A) l'usufruit de la totalité de la succession, ou (B) 1/4 en pleine propriété. Les enfants se partagent le reste à parts égales. Nous allons analyser ces deux options en détail ci-dessous.`
                      : `En présence du conjoint survivant et de ${nbEnfants} enfant(s) dont au moins un n'est pas commun, le conjoint survivant reçoit obligatoirement 1/4 en pleine propriété (art. 757 al. 2 C.civ). L'option de l'usufruit total n'est pas disponible lorsque tous les enfants ne sont pas issus des deux époux.`
                    : `En l'absence d'enfant, le conjoint survivant hérite de la totalité ou partage avec les parents du défunt selon les règles des ordres et degrés (art. 757-2 C.civ).`
                  }
                  color="Blue" />
              </>
            )}

            {isMarie && nbEnfants > 0 && (
              <>
                {/* ── PARTIE 2 : Explications détaillées des deux options ── */}
                <div className={s.commentary} style={{ marginTop: '1.5rem' }}>
                  <p style={{ marginBottom: '0.8rem' }}>
                    <strong>Option A — Usufruit de la totalité (art. 757 al. 1 C.civ) :</strong> Le conjoint survivant
                    reçoit l'<em>usufruit</em> de la totalité des biens composant la succession. Concrètement, il conserve
                    la jouissance complète du patrimoine : il peut habiter le logement, percevoir les loyers et revenus
                    des placements, mais <strong>ne peut pas vendre les biens sans l'accord des enfants</strong> nus-propriétaires.
                    Les enfants reçoivent la <em>nue-propriété</em> de tous les biens et sont taxés uniquement sur la valeur
                    de cette nue-propriété, calculée selon le <strong>barème fiscal de l'article 669 du CGI</strong> (qui dépend
                    de l'âge de l'usufruitier). Au décès du conjoint survivant, l'usufruit s'éteint automatiquement
                    (art. 617 C.civ) : la nue-propriété rejoint la pleine propriété <strong>sans aucun droit de succession
                    supplémentaire</strong> à payer. Seuls les biens propres du conjoint décédé seront taxés.
                  </p>
                  <p>
                    <strong>Option B — 1/4 en pleine propriété (art. 757 al. 2 C.civ) :</strong> Le conjoint survivant
                    reçoit <strong>1/4 de la succession en toute propriété</strong>. Les enfants se partagent les 3/4 restants
                    en pleine propriété, à parts égales. Cette option est juridiquement plus simple (pas de démembrement)
                    et donne au conjoint la libre disposition du quart reçu (il peut le vendre, le donner, etc.).
                    En revanche, elle offre <strong>moins de protection sur le logement</strong> (droit temporaire d'un an
                    au lieu du maintien intégral). Sur le plan fiscal, les enfants sont taxés sur une base plus importante
                    (valeur en pleine propriété des 3/4). Au décès du conjoint, son patrimoine — comprenant le 1/4 hérité
                    en pleine propriété + ses propres biens — <strong>sera intégralement retaxé</strong> dans sa propre succession.
                  </p>
                </div>

                {/* ── PARTIE 3 : Tableau pédagogique comparatif (critères qualitatifs) ── */}
                <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
                  <h3 className={s.chartTitle}>Comparaison qualitative des deux options légales</h3>
                  <table className={s.dataTable}>
                    <thead>
                      <tr>
                        <th style={{ minWidth: 180 }}>Critère</th>
                        <th>Option A — Usufruit total</th>
                        <th>Option B — 1/4 Pleine Propriété</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Part du conjoint</strong></td>
                        <td>100 % en usufruit (jouissance de tous les biens)</td>
                        <td>25 % en pleine propriété (libre disposition)</td>
                      </tr>
                      <tr>
                        <td><strong>Part des enfants</strong></td>
                        <td>100 % en nue-propriété (pas de jouissance immédiate)</td>
                        <td>75 % en pleine propriété (propriété immédiate)</td>
                      </tr>
                      <tr>
                        <td><strong>Protection du logement</strong></td>
                        <td>Maintien intégral — le conjoint peut rester dans le logement à vie</td>
                        <td>Droit temporaire d'un an minimum (art. 763 C.civ), puis dépend de la volonté des enfants</td>
                      </tr>
                      <tr>
                        <td><strong>Fiscalité au 1er décès</strong></td>
                        <td>Enfants taxés sur la <em>nue-propriété</em> uniquement (décote selon l'âge, barème art. 669 CGI)</td>
                        <td>Enfants taxés sur la <em>pleine propriété</em> des 3/4 reçus (base plus élevée)</td>
                      </tr>
                      <tr>
                        <td><strong>Mécanisme au 2nd décès</strong></td>
                        <td>L'usufruit s'éteint (art. 617 C.civ) → la NP rejoint la PP <strong>sans droits supplémentaires</strong></td>
                        <td>Le 1/4 PP hérité par le conjoint est <strong>retaxé</strong> dans sa propre succession</td>
                      </tr>
                      <tr>
                        <td><strong>Actif taxable au 2nd décès</strong></td>
                        <td>Uniquement les biens propres du conjoint (sa part de communauté)</td>
                        <td>Biens propres + le 1/4 PP reçu au 1er décès</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── PARTIE 4 : Détail par option avec explications contextuelles ── */}
            {legalScenarios.length >= 2 && (
              <>

                {legalScenarios.map((ls: any, i: number) => {
                  const fd = ls.premierDeces;
                  const sd = ls.secondDeces;
                  const totalDroits = (fd?.droitsSuccession || 0) + (sd?.droitsSuccession || 0);
                  const isBest = bestLegal && legalChartData[i]?.totalDroits === bestLegal.totalDroits;
                  const isOptionA = i === 0;
                  return (
                    <div key={i} className={`${s.optionCard} ${isBest ? s.optionCardBest : ''}`} style={{ marginTop: '2rem' }}>
                      <span className={`${s.optionBadge} ${isBest ? s.optionBadgeBest : ''}`}>
                        {isBest ? 'RECOMMANDÉE' : `OPTION ${String.fromCharCode(65 + i)}`}
                      </span>
                      <h3 className={s.optionTitle}>{ls.optionLabel}</h3>

                      {/* ─── 1er décès ─── */}
                      <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#f8f9fc', borderRadius: 10, border: '1px solid #e2e5ee' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0c2340', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#0c2340', color: '#fff', fontSize: '0.7rem', fontWeight: 800 }}>1</span>
                          Premier décès — {fd?.defunt?.nom} {fd?.defunt?.prenom}
                        </h4>
                        <div className={s.commentary} style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                          <p>
                            {isOptionA
                              ? <>Le conjoint survivant reçoit l'<strong>usufruit de la totalité</strong> des biens successoraux ({fmt(fd?.actifSuccessoral)}). Les {nbEnfants} enfant(s) reçoivent la <em>nue-propriété</em>, répartie à parts égales. Ils sont taxés uniquement sur la valeur de la nue-propriété (décote selon l'âge de l'usufruitier, barème art. 669 CGI). Le conjoint survivant est <strong>exonéré de droits de succession</strong> (art. 796-0 bis CGI).</>
                              : <>Le conjoint survivant reçoit <strong>1/4 en pleine propriété</strong> de l'actif successoral ({fmt(fd?.actifSuccessoral)}). Les {nbEnfants} enfant(s) se partagent les <strong>3/4 restants en pleine propriété</strong>, à parts égales. Chaque héritier est taxé sur la valeur en pleine propriété de sa part. Le conjoint est <strong>exonéré de droits de succession</strong>.</>
                            }
                          </p>
                        </div>
                        <div className={s.kpiGrid}>
                          <Kpi label="Actif successoral" value={fmt(fd?.actifSuccessoral)} color="Blue" />
                          <Kpi label="Droits de succession" value={fmt(fd?.droitsSuccession)} color="Orange" />
                          <Kpi label="Transmission nette" value={fmt(fd?.transmissionNette)} color="Green" />
                        </div>
                        {fd?.heritiers && fd.heritiers.length > 0 && (
                          <table className={s.dataTable} style={{ marginTop: '0.75rem' }}>
                            <thead><tr><th>Héritier</th><th>Droit reçu</th><th>Valeur part (civile)</th><th>Valeur fiscale du droit</th><th>Abattement</th><th>Base taxable nette</th><th>Droits</th></tr></thead>
                            <tbody>
                              {fd.heritiers.map((h: any, j: number) => (
                                <tr key={j}>
                                  <td><strong>{h.nom}</strong></td>
                                  <td>{h.typeDroit}</td>
                                  <td>{fmt(h.montantTransmis)}</td>
                                  <td>{fmt(getFiscalValueForRow(h))}</td>
                                  <td>{fmt(h.abattement)}</td>
                                  <td>{fmt(h.baseApresAbattement)}</td>
                                  <td style={{ fontWeight: 700, color: h.droits > 0 ? '#c9a84c' : '#0d7377' }}>{h.droits > 0 ? fmt(h.droits) : 'Exonéré'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {isOptionA && (
                          <p style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: '#5a6a7a' }}>
                            Base fiscale art. 669 CGI{typeof ageUsufruitier === 'number' ? ` (usufruitier ${ageUsufruitier} ans)` : ''} :
                            usufruit <strong>{typeof ageUsufruitier === 'number' ? getUsfPctArt669(ageUsufruitier) : '—'} %</strong> / nue-propriété <strong>{typeof ageUsufruitier === 'number' ? getNpPctArt669(ageUsufruitier) : '—'} %</strong>.
                          </p>
                        )}
                      </div>

                      {/* ─── 2nd décès — avec explication contextuelle ─── */}
                      <div style={{ marginTop: '1.25rem', padding: '1rem', background: isOptionA ? '#f0faf9' : '#fdf8f3', borderRadius: 10, border: isOptionA ? '1px solid #b2dfdb' : '1px solid #ecdcc8' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0c2340', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#0c2340', color: '#fff', fontSize: '0.7rem', fontWeight: 800 }}>2</span>
                          Second décès — {sd?.defunt?.nom} {sd?.defunt?.prenom}
                        </h4>

                        {/* Explication détaillée de la composition de l'actif au 2nd décès */}
                        <div className={s.commentary} style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                          {isOptionA ? (
                            <>
                              <p style={{ marginBottom: '0.5rem' }}>
                                <strong>Composition de l'actif au second décès :</strong> Au décès du conjoint survivant,
                                l'usufruit qu'il détenait sur les biens successoraux <strong>s'éteint automatiquement</strong> (art. 617 C.civ).
                                La nue-propriété détenue par les enfants se reconstitue en pleine propriété
                                <strong> sans aucun droit de succession supplémentaire</strong> à payer sur cette reconstitution.
                              </p>
                              <p style={{ marginBottom: '0.5rem' }}>
                                L'actif taxable au second décès se compose <strong>uniquement des biens propres du conjoint survivant</strong> :
                                sa part dans la communauté (ou ses biens propres selon le régime matrimonial) au jour de son décès,
                                soit un actif successoral de <strong>{fmt(sd?.actifSuccessoral)}</strong>.
                              </p>
                              <p>
                                <strong>Héritiers :</strong> Les {nbEnfants} enfant(s) héritent de ces biens propres en <strong>pleine propriété</strong>, à parts égales.
                              </p>
                            </>
                          ) : (
                            <>
                              <p style={{ marginBottom: '0.5rem' }}>
                                <strong>Composition de l'actif au second décès :</strong> Le patrimoine du conjoint survivant
                                au jour de son décès comprend <strong>deux composantes</strong> :
                              </p>
                              <ul style={{ margin: '0.25rem 0 0.5rem 1.2rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                <li>Ses <strong>biens propres</strong> : sa part dans la communauté (ou ses biens propres selon le régime matrimonial)</li>
                                <li>Le <strong>1/4 en pleine propriété hérité au premier décès</strong>, qui fait désormais partie intégrante de son patrimoine</li>
                              </ul>
                              <p style={{ marginBottom: '0.5rem' }}>
                                L'ensemble constitue un actif successoral de <strong>{fmt(sd?.actifSuccessoral)}</strong>,
                                qui sera <strong>intégralement retaxé</strong> dans la succession du conjoint. Le 1/4 reçu
                                lors du premier décès subit donc une <strong>double imposition</strong> : une première fois
                                dans la succession du défunt (exonéré pour le conjoint, mais pas pour le calcul global),
                                puis une seconde fois dans la succession du conjoint.
                              </p>
                              <p>
                                <strong>Héritiers :</strong> Les {nbEnfants} enfant(s) héritent de la totalité du patrimoine du conjoint en <strong>pleine propriété</strong>, à parts égales.
                              </p>
                            </>
                          )}
                        </div>

                        <div className={s.kpiGrid}>
                          <Kpi label="Actif successoral" value={fmt(sd?.actifSuccessoral)} color="Blue" />
                          <Kpi label="Droits de succession" value={fmt(sd?.droitsSuccession)} color="Orange" />
                          <Kpi label="Transmission nette" value={fmt(sd?.transmissionNette)} color="Green" />
                        </div>
                        {sd?.heritiers && sd.heritiers.length > 0 && (
                          <table className={s.dataTable} style={{ marginTop: '0.75rem' }}>
                            <thead><tr><th>Héritier</th><th>Valeur part (civile)</th><th>Valeur fiscale du droit</th><th>Abattement</th><th>Base taxable nette</th><th>Droits</th></tr></thead>
                            <tbody>
                              {sd.heritiers.map((h: any, j: number) => (
                                <tr key={j}>
                                  <td><strong>{h.nom}</strong></td>
                                  <td>{fmt(h.montantTransmis)}</td>
                                  <td>{fmt(getFiscalValueForRow(h))}</td>
                                  <td>{fmt(h.abattement)}</td>
                                  <td>{fmt(h.baseApresAbattement)}</td>
                                  <td style={{ fontWeight: 700, color: '#c9a84c' }}>{fmt(h.droits)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Bilan option */}
                      <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: isBest ? '#e6f7f7' : '#f8f9fc', borderRadius: 12, border: isBest ? '2px solid #0d7377' : '1px solid #e2e5ee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0c2340' }}>Coût fiscal total (1er + 2nd décès)</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: isBest ? '#0d7377' : '#d35244' }}>{fmt(totalDroits)}</span>
                        </div>
                        {isBest && (
                          <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#0d7377', fontWeight: 600 }}>
                            Option la plus avantageuse fiscalement sur l'ensemble des deux décès
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* ── PARTIE 5 : Bilan comparatif + Recommandation ── */}
                <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: '#f8f9fc', borderRadius: 14, border: '1px solid #e2e5ee' }}>
                  <h3 className={s.chartTitle} style={{ marginBottom: '0.75rem' }}>Bilan comparatif — Synthèse fiscale sur les deux décès</h3>
                  <div className={s.commentary} style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                    <p>
                      Après avoir analysé chaque option en détail, voici la <strong>synthèse chiffrée</strong> permettant
                      de comparer le coût fiscal global (1er + 2nd décès) et la transmission nette totale aux héritiers.
                    </p>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className={s.dataTable}>
                      <thead>
                        <tr>
                          <th style={{ minWidth: 180 }}>Option légale</th>
                          <th>Droits 1er décès</th>
                          <th>Actif taxable 2nd décès</th>
                          <th>Droits 2nd décès</th>
                          <th style={{ fontWeight: 700 }}>Total droits (2 décès)</th>
                          <th style={{ fontWeight: 700 }}>Transmission nette totale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {legalScenarios.map((ls: any, i: number) => {
                          const fd = ls.premierDeces;
                          const sd = ls.secondDeces;
                          const totalDroits = (fd?.droitsSuccession || 0) + (sd?.droitsSuccession || 0);
                          const totalNet = (fd?.transmissionNette || 0) + (sd?.transmissionNette || 0);
                          const isBest = bestLegal && legalChartData[i]?.totalDroits === bestLegal.totalDroits;
                          return (
                            <tr key={i} style={isBest ? { background: '#e6f7f7' } : {}}>
                              <td><strong>{ls.optionLabel}</strong>{isBest && <span style={{ marginLeft: 6, fontSize: '0.7rem', background: '#0d7377', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>MEILLEURE</span>}</td>
                              <td style={{ color: '#c9a84c' }}>{fmt(fd?.droitsSuccession)}</td>
                              <td>{fmt(sd?.actifSuccessoral)}</td>
                              <td style={{ color: '#c9a84c' }}>{fmt(sd?.droitsSuccession)}</td>
                              <td style={{ fontWeight: 700, color: isBest ? '#0d7377' : '#d35244' }}>{fmt(totalDroits)}</td>
                              <td style={{ fontWeight: 700, color: '#0d7377' }}>{fmt(totalNet)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {legalChartData.length > 0 && (
                    <div className={s.chartsRow}>
                      <div className={s.chartContainer}>
                        <h3 className={s.chartTitle}>Droits au 1er décès</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={legalChartData} margin={{ left: 10, right: 10, top: 10, bottom: 5 }} barCategoryGap="25%">
                            <ChartGradients />
                            <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#5a6a7a' }} axisLine={{ stroke: '#d1d9e0' }} tickLine={false} />
                            <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 9, fill: '#8894a7' }} axisLine={false} tickLine={false} width={70} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(13,115,119,0.06)', radius: 4 }} />
                            <Bar dataKey="droits1" name="Droits 1er décès" fill="url(#gradTeal)" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className={s.chartContainer}>
                        <h3 className={s.chartTitle}>Droits au 2nd décès</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={legalChartData} margin={{ left: 10, right: 10, top: 10, bottom: 5 }} barCategoryGap="25%">
                            <ChartGradients />
                            <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#5a6a7a' }} axisLine={{ stroke: '#d1d9e0' }} tickLine={false} />
                            <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 9, fill: '#8894a7' }} axisLine={false} tickLine={false} width={70} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(211,82,68,0.06)', radius: 4 }} />
                            <Bar dataKey="droits2" name="Droits 2nd décès" fill="url(#gradCoral)" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {bestLegal && (
                    <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', background: '#e6f7f7', borderRadius: 10, border: '2px solid #0d7377' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0c2340', marginBottom: '0.5rem' }}>Recommandation</div>
                      <div style={{ fontSize: '0.85rem', color: '#1a2a3a', lineHeight: 1.7 }}>
                        Au regard du coût fiscal global sur les deux décès, l'option <strong style={{ color: '#0d7377' }}>{bestLegal.name}</strong> est
                        la plus avantageuse avec un total de droits de <strong style={{ color: '#0d7377' }}>{fmt(bestLegal.totalDroits)}</strong>,
                        pour une transmission nette cumulée de <strong style={{ color: '#0d7377' }}>{fmt(bestLegal.netTotal)}</strong>.
                        {bestLegal.name.toLowerCase().includes('usufruit') && (
                          <> Cette option permet au conjoint survivant de conserver la jouissance intégrale du patrimoine tout au long de sa vie (logement, revenus), tout en minimisant la fiscalité grâce au mécanisme de la nue-propriété (barème art. 669 CGI). Au second décès, l'extinction de l'usufruit reconstitue la pleine propriété des enfants <strong>sans aucune taxation supplémentaire</strong>.</>
                        )}
                        {bestLegal.name.toLowerCase().includes('pleine') && (
                          <> Cette option donne au conjoint la libre disposition immédiate d'un quart du patrimoine, mais entraîne un coût fiscal plus élevé au second décès car le quart reçu est retaxé dans sa propre succession.</>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </SectionBlock>
        )}

        {/* ──────────────────────────────────────────── */}
        {/* SECTION 6 : DÉVOLUTION EFFECTIVE — 1er DÉCÈS */}
        {/* ──────────────────────────────────────────── */}
        <SectionBlock id="devolution" num={isMarie ? 6 : 4} title="Dévolution effective — Premier décès" subtitle="Résultat concret de la simulation selon l'option retenue" refCb={setRef('devolution')}>
          {sc1 && (
            <>
              {/* Option affichée */}
              <div className={s.cardGrid}>
                <div className={`${s.optionCard} ${s.optionCardActive}`}>
                  {sc1.optionConjoint && <span className={`${s.optionBadge} ${s.optionBadgeGreen}`}>OPTION CHOISIE</span>}
                  <h3 className={s.optionTitle}>{sc1.optionConjoint ? `Option : ${sc1.optionConjoint}` : 'Dévolution légale (ab intestat)'}</h3>
                  <p className={s.optionSubtitle}>{sc1.label}</p>

                  {sc1.heritiers?.map((h: any, i: number) => (
                    <div key={i} className={s.heirRow}>
                      <div>
                        <span className={s.heirName}>{h.nom}</span>
                        <span className={s.heirDetail}> — {h.lien} · {h.typeDroit} · {pct(h.quotite)}</span>
                        {h.handicape && <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 4, fontSize: '0.7rem', background: '#e9d5ff', color: '#6b21a8', fontWeight: 600 }}>♿ Handicapé</span>}
                      </div>
                      <div>
                        <span className={s.heirAmount}>{fmt(h.montantTransmis)}</span>
                        {h.droits > 0 && <span className={s.heirTax}> (droits : {fmt(h.droits)})</span>}
                      </div>
                    </div>
                  ))}

                  <div className={s.heirRow} style={{ marginTop: '0.75rem', borderTop: '2px solid #0c2340', paddingTop: '0.75rem' }}>
                    <span className={s.heirName}>Total droits de succession</span>
                    <span className={s.heirAmount} style={{ color: '#c9a84c' }}>{fmt(sc1.droitsSuccession)}</span>
                  </div>
                  <div className={s.heirRow}>
                    <span className={s.heirName}>Frais de notaire</span>
                    <span className={s.heirAmount}>{fmt(sc1.fraisNotaire)}</span>
                  </div>
                  <div className={s.heirRow} style={{ borderTop: '2px solid #0d7377', paddingTop: '0.5rem' }}>
                    <span className={s.heirName} style={{ fontSize: '0.95rem' }}>Transmission nette</span>
                    <span className={s.heirAmount} style={{ color: '#0d7377', fontSize: '1.1rem' }}>{fmt(sc1.transmissionNette)}</span>
                  </div>
                </div>

              </div>

              {/* Graphique répartition héritiers — séparé en 2 */}
              {heirsChartData.length > 0 && (
                <div className={s.chartsRow}>
                  <div className={s.chartContainer}>
                    <h3 className={s.chartTitle}>Montant transmis par héritier</h3>
                    <ResponsiveContainer width="100%" height={Math.max(160, heirsChartData.length * 52 + 40)}>
                      <BarChart data={heirsChartData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 5 }} barCategoryGap="30%">
                        <ChartGradients />
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" horizontal={false} />
                        <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 9, fill: '#8894a7' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: '#3a4a5c', fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(12,35,64,0.04)', radius: 4 }} />
                        <Bar dataKey="transmis" name="Montant transmis" fill="url(#gradNavy)" radius={[0, 6, 6, 0]} animationDuration={800} animationEasing="ease-out" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={s.chartContainer}>
                    <h3 className={s.chartTitle}>Droits de succession par héritier</h3>
                    <ResponsiveContainer width="100%" height={Math.max(160, heirsChartData.length * 52 + 40)}>
                      <BarChart data={heirsChartData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 5 }} barCategoryGap="30%">
                        <ChartGradients />
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" horizontal={false} />
                        <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 9, fill: '#8894a7' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: '#3a4a5c', fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(211,82,68,0.04)', radius: 4 }} />
                        <Bar dataKey="droits" name="Droits de succession" fill="url(#gradCoral)" radius={[0, 6, 6, 0]} animationDuration={800} animationEasing="ease-out" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </SectionBlock>

        {/* ──────────────────────────────────────────── */}
        {/* SECTION 6 : LIQUIDATION FISCALE DÉTAILLÉE    */}
        {/* ──────────────────────────────────────────── */}
        <SectionBlock id="fiscal" num={isMarie ? 7 : 5} title="Synthèse des abattements fiscaux" subtitle="Récapitulatif des abattements utilisés et de leur impact sur les droits" bg="white" refCb={setRef('fiscal')}>
          {sc1?.heritiers && sc1.heritiers.length > 0 && (
            <>
              <div className={s.commentary}>
                <p style={{ marginBottom: '0.8rem' }}>
                  Avant de payer des droits de succession, chaque héritier bénéficie d'un <strong>abattement fiscal</strong> :
                  une somme déduite de la valeur reçue avant le calcul des droits. L'abattement dépend du <strong>lien de parenté</strong> avec le défunt.
                  Plus le lien est proche, plus l'abattement est élevé.
                </p>
                <p style={{ marginBottom: '0.8rem' }}>
                  <strong>Abattements légaux en vigueur :</strong> Conjoint ou partenaire de PACS → <strong>exonération totale</strong> (art. 796-0 bis CGI) ;
                  Enfant → <strong>100 000 €</strong> par parent (art. 779 CGI) ;
                  Petit-enfant → <strong>1 594 €</strong> ;
                  Frère/sœur → <strong>15 932 €</strong> ;
                  Neveu/nièce → <strong>7 967 €</strong>.
                  Ces abattements se <strong>reconstituent tous les 15 ans</strong>.
                </p>
                {simulationData?.donations && simulationData.donations.length > 0 && (
                  <p style={{ marginBottom: '0.8rem', color: '#d35244' }}>
                    <strong>Attention — Donations antérieures :</strong> Des donations effectuées dans les <strong>15 dernières
                    années</strong> ont été déclarées. Elles viennent en <strong>diminution de l'abattement disponible</strong> au
                    jour du décès (rapport fiscal, art. 784 CGI). L'abattement résiduel de chaque héritier est
                    recalculé en conséquence dans le tableau ci-dessous.
                  </p>
                )}
              </div>

              {/* Tableau des abattements — 1er décès */}
              <div style={{ marginTop: '1.25rem' }}>
                <h3 className={s.chartTitle}>Abattements utilisés — 1er décès</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className={s.dataTable}>
                    <thead>
                      <tr>
                        <th>Héritier</th>
                        <th>Lien de parenté</th>
                        <th>Part reçue</th>
                        <th>Abattement légal</th>
                        <th>Abattement utilisé</th>
                        <th>Base taxable</th>
                        <th>Droits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sc1.heritiers.map((h: any, i: number) => {
                        const isExonere = h.droits === 0;
                        return (
                          <tr key={i} className={isExonere ? s.rowHighlight : ''}>
                            <td><strong>{h.nom}</strong>{h.handicape && <span style={{ marginLeft: 4, padding: '1px 5px', borderRadius: 4, fontSize: '0.65rem', background: '#e9d5ff', color: '#6b21a8', fontWeight: 600 }}>♿</span>}</td>
                            <td>{h.lien}</td>
                            <td>{fmt(h.montantTransmis)}</td>
                            <td style={{ color: '#0d7377' }}>
                              {h.lien?.includes('Conjoint') || h.lien?.includes('Partenaire') || h.lien?.includes('PACS')
                                ? 'Exonération totale'
                                : h.lien?.toLowerCase().includes('ligne directe') || h.lien?.toLowerCase().includes('direct')
                                  ? (h.handicape ? '100 000 € + 159 325 €' : '100 000 €')
                                : h.lien?.toLowerCase().includes('frère') || h.lien?.toLowerCase().includes('sœur') || h.lien?.toLowerCase().includes('soeur') || h.lien?.toLowerCase().includes('collatéral') ? '15 932 €'
                                : h.lien?.toLowerCase().includes('neveu') || h.lien?.toLowerCase().includes('nièce') || h.lien?.toLowerCase().includes('niece') ? '7 967 €'
                                : fmt(h.abattement)
                              }
                              {h.handicape && !h.lien?.includes('Conjoint') && <div style={{ fontSize: '0.7rem', color: '#6b21a8' }}>dont 159 325 € handicap</div>}
                            </td>
                            <td style={{ fontWeight: 600 }}>{isExonere ? 'N/A (exonéré)' : fmt(h.abattement)}</td>
                            <td>{isExonere ? '–' : fmt(h.baseApresAbattement)}</td>
                            <td style={{ fontWeight: 700, color: isExonere ? '#0d7377' : '#c9a84c' }}>{isExonere ? 'Exonéré' : fmt(h.droits)}</td>
                          </tr>
                        );
                      })}
                      <tr className={s.rowTotal}>
                        <td colSpan={2}>Total</td>
                        <td>{fmt(sc1.heritiers.reduce((a: number, h: any) => a + (h.montantTransmis || 0), 0))}</td>
                        <td></td><td></td><td></td>
                        <td style={{ color: '#c9a84c' }}>{fmt(sc1.droitsSuccession)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tableau des abattements — 2nd décès (si applicable) */}
              {showSecondDeath && sc2 && sc2.heritiers && sc2.heritiers.length > 0 && sc2.label !== 'Non applicable' && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h3 className={s.chartTitle}>Abattements utilisés — 2nd décès (conjoint survivant)</h3>
                  <div className={s.commentary} style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    <p>
                      Au second décès, les enfants bénéficient d'un <strong>nouvel abattement de 100 000 €</strong> chacun
                      sur la succession du conjoint survivant (l'abattement s'applique <strong>par parent</strong>, donc
                      chaque enfant dispose de 100 000 € d'abattement côté père ET 100 000 € côté mère).
                      {simulationData?.donations && simulationData.donations.length > 0 && <> Si des donations ont été consenties par le conjoint survivant dans les 15 dernières années, l'abattement disponible est réduit en conséquence.</>}
                    </p>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className={s.dataTable}>
                      <thead>
                        <tr>
                          <th>Héritier</th>
                          <th>Part reçue</th>
                          <th>Abattement utilisé</th>
                          <th>Base taxable</th>
                          <th>Droits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sc2.heritiers.map((h: any, i: number) => (
                          <tr key={i}>
                            <td><strong>{h.nom}</strong></td>
                            <td>{fmt(h.montantTransmis)}</td>
                            <td>{fmt(h.abattement)}</td>
                            <td>{fmt(h.baseApresAbattement)}</td>
                            <td style={{ fontWeight: 700, color: '#c9a84c' }}>{fmt(h.droits)}</td>
                          </tr>
                        ))}
                        <tr className={s.rowTotal}>
                          <td>Total</td>
                          <td>{fmt(sc2.heritiers.reduce((a: number, h: any) => a + (h.montantTransmis || 0), 0))}</td>
                          <td></td><td></td>
                          <td style={{ color: '#c9a84c' }}>{fmt(sc2.droitsSuccession)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', background: '#f0f7ff', borderRadius: 10, border: '1px solid #c5d9f0', fontSize: '0.82rem', color: '#1a4a7a', lineHeight: 1.6 }}>
                <strong>Frais de notaire estimés :</strong> {fmt(sc1.fraisNotaire)} — Ces frais couvrent les émoluments du notaire,
                les formalités administratives et la publicité foncière. Ils s'ajoutent aux droits de succession et sont à la charge des héritiers.
              </div>
            </>
          )}
        </SectionBlock>

        {/* ──────────────────────────────────────────── */}
        {/* SECTION : DÉTAILS FISCAUX AV / DONATIONS / LEGS */}
        {/* ──────────────────────────────────────────── */}
        {(fiscalDetails?.detailAssuranceVie?.length > 0 || fiscalDetails?.detailDonationsRappelees?.length > 0 || fiscalDetails?.detailLegs?.length > 0) && (
          <SectionBlock id="details-fiscaux" num={isMarie ? 8 : 6} title="Détails fiscaux : Assurance-vie, Donations & Legs" subtitle="Ventilation détaillée de la fiscalité par bénéficiaire" bg="white" refCb={setRef('details-fiscaux')}>

            {/* ── Assurance-vie ── */}
            {fiscalDetails?.detailAssuranceVie?.length > 0 && (
              <>
                <h3 className={s.chartTitle} style={{ marginBottom: '0.5rem' }}>Assurance-vie — Fiscalité par bénéficiaire</h3>
                <div className={s.commentary} style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                  <p>
                    L'assurance-vie bénéficie d'un <strong>régime fiscal autonome</strong>, distinct des droits de succession classiques.
                    Deux régimes coexistent selon l'âge de l'assuré au moment des versements :
                  </p>
                  <ul style={{ margin: '0.4rem 0 0.4rem 1.2rem', lineHeight: 1.7 }}>
                    <li><strong>Art. 990 I CGI</strong> (versements avant 70 ans) : abattement de <strong>152 500 €</strong> par bénéficiaire sur le capital décès, puis taxation à 20 % jusqu'à 700 000 € et 31,25 % au-delà. En cas de <strong>démembrement</strong>, l'abattement est proratisé selon la valeur de la nue-propriété (barème art. 669 CGI).</li>
                    <li><strong>Art. 757 B CGI</strong> (versements après 70 ans) : seules les <strong>primes versées</strong> sont soumises aux droits de succession (les intérêts et plus-values sont <strong>exonérés</strong>), après un abattement global de <strong>30 500 €</strong> partagé entre tous les bénéficiaires.</li>
                  </ul>
                  <p>Le conjoint survivant et le partenaire de PACS sont <strong>totalement exonérés</strong> dans les deux régimes.</p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className={s.dataTable}>
                    <thead>
                      <tr>
                        <th>Bénéficiaire</th>
                        <th>Lien</th>
                        <th style={{ textAlign: 'center' }}>Capital (990 I)</th>
                        <th style={{ textAlign: 'center' }}>Abattement (990 I)</th>
                        <th style={{ textAlign: 'center' }}>Base taxable</th>
                        <th style={{ textAlign: 'center' }}>Taxe 990 I</th>
                        <th style={{ textAlign: 'center' }}>Primes (757 B)</th>
                        <th style={{ textAlign: 'center' }}>Abattement (757 B)</th>
                        <th style={{ textAlign: 'center' }}>Réintégré</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fiscalDetails.detailAssuranceVie.map((av: any, i: number) => (
                        <tr key={i} className={av.exonere ? s.rowHighlight : ''}>
                          <td><strong>{av.beneficiaire}</strong></td>
                          <td>{av.lien === 'CONJOINT' || av.lien === 'PACS' ? 'Conjoint / PACS' : av.lien === 'ENFANT' ? 'Enfant' : av.lien}</td>
                          <td style={{ textAlign: 'right' }}>{av.exonere ? '–' : fmt(av.capital990I)}</td>
                          <td style={{ textAlign: 'right', color: '#0d7377' }}>{av.exonere ? 'Exonéré' : fmt(av.abattement990I)}</td>
                          <td style={{ textAlign: 'right' }}>{av.exonere ? '–' : fmt(av.baseTaxable990I)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: av.exonere ? '#0d7377' : '#c9a84c' }}>{av.exonere ? 'Exonéré' : fmt(av.taxe990I)}</td>
                          <td style={{ textAlign: 'right' }}>{av.primes757B > 0 ? fmt(av.primes757B) : '–'}</td>
                          <td style={{ textAlign: 'right', color: '#0d7377' }}>{av.exonere ? 'Exonéré' : av.primes757B > 0 ? fmt(av.abattement757B) : '–'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{av.exonere ? '–' : av.reintegre757B > 0 ? fmt(av.reintegre757B) : '–'}</td>
                        </tr>
                      ))}
                      <tr className={s.rowTotal}>
                        <td colSpan={5}>Total taxe art. 990 I</td>
                        <td style={{ textAlign: 'right', color: '#c9a84c' }}>{fmt(fiscalDetails.detailAssuranceVie.filter((av: any) => !av.exonere).reduce((a: number, av: any) => a + (av.taxe990I || 0), 0))}</td>
                        <td colSpan={2}>Total réintégré (757 B)</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(fiscalDetails.detailAssuranceVie.filter((av: any) => !av.exonere).reduce((a: number, av: any) => a + (av.reintegre757B || 0), 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Donations rappelées ── */}
            {fiscalDetails?.detailDonationsRappelees?.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 className={s.chartTitle} style={{ marginBottom: '0.5rem' }}>Donations — Rapport fiscal (art. 784 CGI)</h3>
                <div className={s.commentary} style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                  <p>
                    Les donations consenties dans les <strong>15 années précédant le décès</strong> sont <strong>rappelées fiscalement</strong> (art. 784 CGI).
                    Concrètement, le montant de la donation est ajouté à la part successorale du bénéficiaire pour déterminer la tranche marginale
                    d'imposition. L'abattement utilisé lors de la donation vient réduire celui disponible pour la succession.
                    En revanche, les droits déjà payés lors de la donation constituent un <strong>crédit d'impôt</strong> déductible des droits de succession.
                  </p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className={s.dataTable}>
                    <thead>
                      <tr>
                        <th>Bénéficiaire</th>
                        <th style={{ textAlign: 'right' }}>Montant</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'center' }}>Rapportable</th>
                        <th style={{ textAlign: 'center' }}>Rappelée</th>
                        <th style={{ textAlign: 'right' }}>Montant rappelé</th>
                        <th style={{ textAlign: 'right' }}>Abattement initial</th>
                        <th style={{ textAlign: 'right' }}>Abattement restant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fiscalDetails.detailDonationsRappelees.map((don: any, i: number) => (
                        <tr key={i}>
                          <td><strong>{don.beneficiaire}</strong></td>
                          <td style={{ textAlign: 'right' }}>{fmt(don.montant)}</td>
                          <td>{don.dateDonation ? new Date(don.dateDonation).toLocaleDateString('fr-FR') : '–'}</td>
                          <td style={{ textAlign: 'center' }}>{don.rapportable ? '✓' : '✗'}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: don.rappele ? '#d35244' : '#0d7377' }}>{don.rappele ? 'Oui' : 'Non'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: don.rappele ? '#d35244' : undefined }}>{fmt(don.montantRappele)}</td>
                          <td style={{ textAlign: 'right' }}>{fmt(don.abattementInitial)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: don.rappele && don.abattementApresRappel < don.abattementInitial ? '#d35244' : '#0d7377' }}>{fmt(don.abattementApresRappel)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: '#fef6e4', borderRadius: 8, border: '1px solid #e8d5a3', fontSize: '0.82rem', color: '#7a6520', lineHeight: 1.6 }}>
                  <strong>Impact :</strong> Les donations rappelées augmentent la base taxable cumulée (art. 784 CGI), ce qui peut faire monter la tranche marginale d'imposition. Les droits déjà acquittés sur ces donations sont imputés comme crédit d'impôt.
                </div>
              </div>
            )}

            {/* ── Legs particuliers ── */}
            {fiscalDetails?.detailLegs?.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 className={s.chartTitle} style={{ marginBottom: '0.5rem' }}>Legs particuliers — Déduction et fiscalité</h3>
                <div className={s.commentary} style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                  <p>
                    Les legs particuliers sont des biens ou sommes attribués par testament à des personnes désignées (légataires).
                    Ils sont <strong>déduits de la masse successorale</strong> avant la répartition entre les héritiers universels,
                    et <strong>taxés individuellement</strong> selon le lien de parenté entre le légataire et le défunt.
                    Le conjoint survivant ou partenaire de PACS légataire est <strong>exonéré de droits</strong>.
                  </p>
                </div>
                {fiscalDetails.totalLegsDeduits > 0 && (
                  <div style={{ marginBottom: '0.75rem', padding: '0.6rem 1rem', background: '#f0f7ff', borderRadius: 8, border: '1px solid #c5d9f0', fontSize: '0.85rem', color: '#1a4a7a' }}>
                    <strong>Total des legs déduits de la masse successorale :</strong> {fmt(fiscalDetails.totalLegsDeduits)}
                  </div>
                )}
                <div style={{ overflowX: 'auto' }}>
                  <table className={s.dataTable}>
                    <thead>
                      <tr>
                        <th>Légataire</th>
                        <th>Lien de parenté</th>
                        <th style={{ textAlign: 'right' }}>Montant du legs</th>
                        <th style={{ textAlign: 'right' }}>Droits de succession</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fiscalDetails.detailLegs.map((leg: any, i: number) => {
                        const isExonere = leg.droits === 0;
                        return (
                          <tr key={i} className={isExonere ? s.rowHighlight : ''}>
                            <td><strong>{leg.legataire}</strong></td>
                            <td>{leg.lien}</td>
                            <td style={{ textAlign: 'right' }}>{fmt(leg.montant)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: isExonere ? '#0d7377' : '#c9a84c' }}>{isExonere ? 'Exonéré' : fmt(leg.droits)}</td>
                          </tr>
                        );
                      })}
                      <tr className={s.rowTotal}>
                        <td colSpan={2}>Total</td>
                        <td style={{ textAlign: 'right' }}>{fmt(fiscalDetails.detailLegs.reduce((a: number, l: any) => a + (l.montant || 0), 0))}</td>
                        <td style={{ textAlign: 'right', color: '#c9a84c' }}>{fmt(fiscalDetails.detailLegs.reduce((a: number, l: any) => a + (l.droits || 0), 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </SectionBlock>
        )}

        {/* ──────────────────────────────────────────── */}
        {/* SECTION 7 : SIMULATION 2nd DÉCÈS             */}
        {/* ──────────────────────────────────────────── */}
        {showSecondDeath && (
          <SectionBlock id="second-deces" num={8} title="La Donation au Dernier Vivant (DDV)" subtitle="Un outil essentiel pour protéger votre conjoint et optimiser la transmission" refCb={setRef('second-deces')}>
            <div className={s.commentary}>
              <p style={{ marginBottom: '0.8rem' }}>
                La <strong>Donation au Dernier Vivant (DDV)</strong>, aussi appelée <em>donation entre époux</em>,
                est un acte notarié par lequel chaque époux donne à l'autre des droits supplémentaires sur sa
                succession future. Elle est <strong>réciproque</strong> (chacun protège l'autre),
                <strong> révocable à tout moment</strong>, et ne prend effet qu'<strong>au décès</strong> du donateur.
              </p>
              <p style={{ marginBottom: '0.8rem' }}>
                <strong>Pourquoi est-elle intéressante ?</strong> Sans DDV, le conjoint survivant est limité aux
                options légales de l'article 757 du Code civil (usufruit total ou 1/4 en pleine propriété).
                Avec une DDV, il accède à une <strong>troisième option</strong> : recevoir la
                <strong> quotité disponible en pleine propriété</strong> (art. 1094-1 C.civ), ce qui lui donne
                une liberté de disposition bien plus grande.
              </p>
            </div>

            <div style={{ overflowX: 'auto', marginTop: '1.25rem' }}>
              <h3 className={s.chartTitle}>Les 3 options offertes par la DDV</h3>
              <table className={s.dataTable}>
                <thead>
                  <tr>
                    <th style={{ minWidth: 160 }}>Option</th>
                    <th>Ce que reçoit le conjoint</th>
                    <th>Ce que reçoivent les enfants</th>
                    <th>Avantage principal</th>
                    <th>Inconvénient</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Usufruit total</strong></td>
                    <td>Usufruit de 100 % des biens</td>
                    <td>Nue-propriété à parts égales</td>
                    <td style={{ color: '#0d7377' }}>Jouissance totale (logement, revenus) — coût fiscal minimal au 2nd décès</td>
                    <td style={{ color: '#d35244' }}>Pas de propriété pleine — accord des NP requis pour vendre</td>
                  </tr>
                  <tr>
                    <td><strong>1/4 PP + 3/4 USF</strong></td>
                    <td>1/4 en pleine propriété + 3/4 en usufruit</td>
                    <td>Nue-propriété des 3/4</td>
                    <td style={{ color: '#0d7377' }}>Équilibre propriété / jouissance</td>
                    <td style={{ color: '#d35244' }}>Le 1/4 PP est retaxé au 2nd décès</td>
                  </tr>
                  <tr>
                    <td><strong>QD en pleine propriété</strong></td>
                    <td>Quotité disponible ({nbEnfants === 1 ? '1/2' : nbEnfants === 2 ? '1/3' : '1/4'}) en PP</td>
                    <td>Réserve héréditaire en PP</td>
                    <td style={{ color: '#0d7377' }}>Liberté totale de disposition sur la QD</td>
                    <td style={{ color: '#d35244' }}>Coût fiscal plus élevé au 2nd décès (double imposition)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={s.commentary} style={{ marginTop: '1.5rem' }}>
              <p style={{ marginBottom: '0.8rem' }}>
                <strong>Coût de la DDV :</strong> La mise en place d'une DDV coûte environ <strong>200 à 400 €</strong> de
                frais de notaire. Elle est <strong>réciproque</strong> (les deux époux se protègent mutuellement dans
                le même acte) et <strong>révocable</strong> à tout moment par l'un ou l'autre des époux, sans que le
                conjoint n'en soit informé.
              </p>
              <p style={{ marginBottom: '0.8rem' }}>
                <strong>Impact fiscal :</strong> Le conjoint survivant est <strong>exonéré de droits de succession</strong> (art. 796-0 bis CGI)
                quelle que soit l'option choisie. L'impact fiscal se joue au <strong>second décès</strong> :
                plus le conjoint reçoit en pleine propriété, plus son patrimoine sera important au second décès, et donc
                plus les enfants paieront de droits à ce moment-là.
              </p>
              <p>
                <strong>Le choix ne se fait qu'au décès :</strong> C'est le conjoint survivant qui choisit l'option au moment
                de la succession, en fonction de sa situation à ce moment-là (âge, besoins, revenus, etc.).
                La DDV ne fige rien à l'avance.
              </p>
            </div>

            {ddvSelected ? (
              <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: '#e6f7f7', borderRadius: 10, border: '2px solid #0d7377' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0d7377', marginBottom: '0.5rem' }}>DDV en place dans votre dossier</div>
                <div style={{ fontSize: '0.85rem', color: '#1a2a3a', lineHeight: 1.7 }}>
                  Vous avez indiqué qu'une DDV est déjà en place. La section suivante (« Comparatif DDV ») analyse
                  en détail l'impact fiscal de chacune des 3 options sur les deux décès, avec les montants calculés
                  pour votre situation, afin de vous aider à anticiper le choix optimal.
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: '#fff7ed', borderRadius: 10, border: '2px solid #e8a838' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#7a5c2e', marginBottom: '0.5rem' }}>Aucune DDV en place</div>
                <div style={{ fontSize: '0.85rem', color: '#1a2a3a', lineHeight: 1.7 }}>
                  Vous n'avez pas indiqué de DDV dans votre dossier. <strong>Nous vous recommandons fortement d'en mettre une en place</strong> :
                  pour un coût modique (200–400 €), elle offre une protection considérable au conjoint survivant et
                  une flexibilité fiscale importante. Consultez votre notaire pour la rédiger.
                  Pour simuler l'impact des différentes options DDV, retournez au simulateur et activez l'option DDV.
                </div>
              </div>
            )}
          </SectionBlock>
        )}

        {/* ──────────────────────────────────────────── */}
        {/* SECTION DDV : COMPARATIF OPTIONS DDV          */}
        {/* ──────────────────────────────────────────── */}
        {ddvScenarios.length > 0 && (
          <SectionBlock id="comparatif-ddv" num={9} title="Comparatif chiffré des options DDV" subtitle="Analyse détaillée de chaque option avec calcul sur les deux décès" bg="white" refCb={setRef('comparatif-ddv')}>

            <div className={s.commentary}>
              <p>
                Après avoir compris le fonctionnement de la DDV (section précédente), passons aux <strong>calculs
                concrets</strong> pour votre situation. Chaque option est analysée ci-dessous avec le détail des
                héritiers, des droits et des explications sur la composition de l'actif au second décès.
              </p>
            </div>

            {/* ── Détail par option DDV avec explications pédagogiques ── */}
            {ddvScenarios.map((ddv: any, i: number) => {
              const fd = ddv.premierDeces;
              const sd = ddv.secondDeces;
              const totalDroits = (fd?.droitsSuccession || 0) + (sd?.droitsSuccession || 0);
              const isBest = bestDdv && ddvChartData[i]?.totalDroits === bestDdv.totalDroits;
              const optCode = (ddv.optionCode || '').toUpperCase();
              const isUsf = optCode.includes('USUFRUIT');
              const isQuartPP = optCode.includes('QUART') && !optCode.includes('TOUTE');
              const isQD = optCode.includes('TOUTE') || optCode.includes('QUOTITE');
              return (
                <div key={i} className={`${s.optionCard} ${isBest ? s.optionCardBest : ''}`} style={{ marginTop: '2rem' }}>
                  <span className={`${s.optionBadge} ${isBest ? s.optionBadgeBest : ''}`}>
                    {isBest ? 'OPTION OPTIMALE' : `OPTION ${String.fromCharCode(65 + i)}`}
                  </span>
                  <h3 className={s.optionTitle}>{ddv.optionLabel}</h3>

                  {/* ─── 1er décès DDV ─── */}
                  <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#f8f9fc', borderRadius: 10, border: '1px solid #e2e5ee' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0c2340', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#0c2340', color: '#fff', fontSize: '0.7rem', fontWeight: 800 }}>1</span>
                      Premier décès — {fd?.defunt?.nom} {fd?.defunt?.prenom}
                    </h4>
                    <div className={s.commentary} style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                      <p>
                        {isUsf && <>Avec cette option, le conjoint survivant reçoit l'<strong>usufruit de la totalité</strong> des biens successoraux ({fmt(fd?.actifSuccessoral)}). Les {nbEnfants} enfant(s) reçoivent la <em>nue-propriété</em> à parts égales. Ils sont taxés uniquement sur la valeur de la nue-propriété (décote art. 669 CGI). Le conjoint est <strong>exonéré</strong>.</>}
                        {isQuartPP && <>Avec cette option, le conjoint survivant reçoit <strong>1/4 en pleine propriété + 3/4 en usufruit</strong> de l'actif successoral ({fmt(fd?.actifSuccessoral)}). Les enfants reçoivent la nue-propriété des 3/4 restants. Le conjoint cumule jouissance et propriété partielle. Les enfants sont taxés sur la nue-propriété uniquement.</>}
                        {isQD && <>Avec cette option, le conjoint survivant reçoit la <strong>quotité disponible en pleine propriété</strong> ({nbEnfants === 1 ? '1/2' : nbEnfants === 2 ? '1/3' : '1/4'} de l'actif successoral de {fmt(fd?.actifSuccessoral)}). Les enfants reçoivent la réserve héréditaire en pleine propriété. Chacun est taxé sur la valeur en pleine propriété de sa part.</>}
                        {!isUsf && !isQuartPP && !isQD && <>Le conjoint survivant reçoit sa part selon l'option choisie. Les enfants se partagent le reste à parts égales.</>}
                      </p>
                    </div>
                    <div className={s.kpiGrid}>
                      <Kpi label="Actif successoral" value={fmt(fd?.actifSuccessoral)} color="Blue" />
                      <Kpi label="Droits de succession" value={fmt(fd?.droitsSuccession)} color="Orange" />
                      <Kpi label="Transmission nette" value={fmt(fd?.transmissionNette)} color="Green" />
                    </div>
                    {fd?.heritiers && fd.heritiers.length > 0 && (
                      <table className={s.dataTable} style={{ marginTop: '0.75rem' }}>
                        <thead><tr><th>Héritier</th><th>Droit reçu</th><th>Valeur part (civile)</th><th>Valeur fiscale du droit</th><th>Abattement</th><th>Base taxable nette</th><th>Droits</th></tr></thead>
                        <tbody>
                          {fd.heritiers.map((h: any, j: number) => (
                            <tr key={j}>
                              <td><strong>{h.nom}</strong></td>
                              <td>{h.typeDroit}</td>
                              <td>{fmt(h.montantTransmis)}</td>
                              <td>{fmt(getFiscalValueForRow(h))}</td>
                              <td>{fmt(h.abattement)}</td>
                              <td>{fmt(h.baseApresAbattement)}</td>
                              <td style={{ fontWeight: 700, color: h.droits > 0 ? '#c9a84c' : '#0d7377' }}>{h.droits > 0 ? fmt(h.droits) : 'Exonéré'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {(isUsf || isQuartPP) && (
                      <p style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: '#5a6a7a' }}>
                        Base fiscale art. 669 CGI{typeof ageUsufruitier === 'number' ? ` (usufruitier ${ageUsufruitier} ans)` : ''} :
                        usufruit <strong>{typeof ageUsufruitier === 'number' ? getUsfPctArt669(ageUsufruitier) : '—'} %</strong> / nue-propriété <strong>{typeof ageUsufruitier === 'number' ? getNpPctArt669(ageUsufruitier) : '—'} %</strong>.
                      </p>
                    )}
                  </div>

                  {/* ─── 2nd décès DDV — avec explication contextuelle ─── */}
                  <div style={{ marginTop: '1.25rem', padding: '1rem', background: isUsf ? '#f0faf9' : '#fdf8f3', borderRadius: 10, border: isUsf ? '1px solid #b2dfdb' : '1px solid #ecdcc8' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0c2340', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#0c2340', color: '#fff', fontSize: '0.7rem', fontWeight: 800 }}>2</span>
                      Second décès — {sd?.defunt?.nom} {sd?.defunt?.prenom}
                    </h4>

                    <div className={s.commentary} style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                      {isUsf ? (
                        <>
                          <p style={{ marginBottom: '0.5rem' }}>
                            <strong>Composition de l'actif au second décès :</strong> Au décès du conjoint survivant,
                            l'usufruit qu'il détenait s'<strong>éteint automatiquement</strong> (art. 617 C.civ).
                            La nue-propriété détenue par les enfants se reconstitue en pleine propriété
                            <strong> sans aucun droit de succession supplémentaire</strong>.
                          </p>
                          <p style={{ marginBottom: '0.5rem' }}>
                            L'actif taxable se compose <strong>uniquement des biens propres du conjoint survivant</strong> :
                            sa part dans la communauté au jour de son décès, soit <strong>{fmt(sd?.actifSuccessoral)}</strong>.
                          </p>
                          <p>
                            <strong>Héritiers :</strong> Les {nbEnfants} enfant(s) héritent de ces biens propres en <strong>pleine propriété</strong>, à parts égales.
                          </p>
                        </>
                      ) : isQuartPP ? (
                        <>
                          <p style={{ marginBottom: '0.5rem' }}>
                            <strong>Composition de l'actif au second décès :</strong> Le patrimoine du conjoint comprend
                            <strong> deux composantes</strong> :
                          </p>
                          <ul style={{ margin: '0.25rem 0 0.5rem 1.2rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
                            <li>Ses <strong>biens propres</strong> (sa part dans la communauté)</li>
                            <li>Le <strong>1/4 en pleine propriété reçu au 1er décès</strong> — qui fait partie de son patrimoine</li>
                          </ul>
                          <p style={{ marginBottom: '0.5rem' }}>
                            L'usufruit des 3/4 s'éteint automatiquement (art. 617 C.civ) → pas de droits supplémentaires
                            sur cette partie. Mais le 1/4 PP reçu est <strong>retaxé</strong> dans la succession du conjoint.
                            L'actif total au 2nd décès : <strong>{fmt(sd?.actifSuccessoral)}</strong>.
                          </p>
                          <p>
                            <strong>Héritiers :</strong> Les {nbEnfants} enfant(s) héritent en <strong>pleine propriété</strong>, à parts égales.
                          </p>
                        </>
                      ) : isQD ? (
                        <>
                          <p style={{ marginBottom: '0.5rem' }}>
                            <strong>Composition de l'actif au second décès :</strong> Le patrimoine du conjoint comprend
                            <strong> deux composantes</strong> :
                          </p>
                          <ul style={{ margin: '0.25rem 0 0.5rem 1.2rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
                            <li>Ses <strong>biens propres</strong> (sa part dans la communauté)</li>
                            <li>La <strong>quotité disponible en pleine propriété reçue au 1er décès</strong> ({nbEnfants === 1 ? '1/2' : nbEnfants === 2 ? '1/3' : '1/4'} de la succession)</li>
                          </ul>
                          <p style={{ marginBottom: '0.5rem' }}>
                            La totalité de ce patrimoine est <strong>retaxée</strong> dans la succession du conjoint.
                            La QD reçue au 1er décès subit une <strong>double imposition</strong> :
                            exonérée pour le conjoint au 1er décès, mais taxée au 2nd décès pour les enfants.
                            L'actif total : <strong>{fmt(sd?.actifSuccessoral)}</strong>.
                          </p>
                          <p>
                            <strong>Héritiers :</strong> Les {nbEnfants} enfant(s) héritent de la totalité en <strong>pleine propriété</strong>, à parts égales.
                          </p>
                        </>
                      ) : (
                        <p>
                          <strong>Composition de l'actif au second décès :</strong> Le patrimoine du conjoint au jour de son décès
                          constitue l'actif successoral de <strong>{fmt(sd?.actifSuccessoral)}</strong>, transmis aux enfants en pleine propriété.
                        </p>
                      )}
                    </div>

                    <div className={s.kpiGrid}>
                      <Kpi label="Actif successoral" value={fmt(sd?.actifSuccessoral)} color="Blue" />
                      <Kpi label="Droits de succession" value={fmt(sd?.droitsSuccession)} color="Orange" />
                      <Kpi label="Transmission nette" value={fmt(sd?.transmissionNette)} color="Green" />
                    </div>
                    {sd?.heritiers && sd.heritiers.length > 0 && (
                      <table className={s.dataTable} style={{ marginTop: '0.75rem' }}>
                        <thead><tr><th>Héritier</th><th>Valeur part (civile)</th><th>Valeur fiscale du droit</th><th>Abattement</th><th>Base taxable nette</th><th>Droits</th></tr></thead>
                        <tbody>
                          {sd.heritiers.map((h: any, j: number) => (
                            <tr key={j}>
                              <td><strong>{h.nom}</strong></td>
                              <td>{fmt(h.montantTransmis)}</td>
                              <td>{fmt(getFiscalValueForRow(h))}</td>
                              <td>{fmt(h.abattement)}</td>
                              <td>{fmt(h.baseApresAbattement)}</td>
                              <td style={{ fontWeight: 700, color: '#c9a84c' }}>{fmt(h.droits)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Bilan option DDV */}
                  <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: isBest ? '#e6f7f7' : '#f8f9fc', borderRadius: 12, border: isBest ? '2px solid #0d7377' : '1px solid #e2e5ee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0c2340' }}>Coût fiscal total (1er + 2nd décès)</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: isBest ? '#0d7377' : '#d35244' }}>{fmt(totalDroits)}</span>
                    </div>
                    {isBest && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#0d7377', fontWeight: 600 }}>
                        Option DDV la plus avantageuse fiscalement sur l'ensemble des deux décès
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* ── Bilan comparatif DDV + Recommandation (fusionné) ── */}
            <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: '#f8f9fc', borderRadius: 14, border: '1px solid #e2e5ee' }}>
              <h3 className={s.chartTitle} style={{ marginBottom: '0.75rem' }}>Bilan comparatif — Synthèse fiscale des options DDV</h3>
              <div className={s.commentary} style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                <p>
                  Après avoir analysé chaque option en détail, voici la <strong>synthèse chiffrée</strong> permettant
                  de comparer le coût fiscal global (1er + 2nd décès) et la transmission nette totale aux héritiers
                  pour chaque option DDV.
                </p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className={s.dataTable}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: 160 }}>Option DDV</th>
                      <th>Actif 1er décès</th>
                      <th>Droits 1er décès</th>
                      <th>Actif 2nd décès</th>
                      <th>Droits 2nd décès</th>
                      <th style={{ fontWeight: 700 }}>Total droits</th>
                      <th style={{ fontWeight: 700 }}>Transmission nette totale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ddvScenarios.map((ddv: any, i: number) => {
                      const fd = ddv.premierDeces;
                      const sd = ddv.secondDeces;
                      const totalDroits = (fd?.droitsSuccession || 0) + (sd?.droitsSuccession || 0);
                      const totalNet = (fd?.transmissionNette || 0) + (sd?.transmissionNette || 0);
                      const isBest = bestDdv && ddvChartData[i]?.totalDroits === bestDdv.totalDroits;
                      return (
                        <tr key={i} style={isBest ? { background: '#e6f7f7' } : {}}>
                          <td><strong>{ddv.optionLabel}</strong>{isBest && <span style={{ marginLeft: 6, fontSize: '0.7rem', background: '#0d7377', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>MEILLEURE</span>}</td>
                          <td>{fmt(fd?.actifSuccessoral)}</td>
                          <td style={{ color: '#c9a84c' }}>{fmt(fd?.droitsSuccession)}</td>
                          <td>{fmt(sd?.actifSuccessoral)}</td>
                          <td style={{ color: '#c9a84c' }}>{fmt(sd?.droitsSuccession)}</td>
                          <td style={{ fontWeight: 700, color: isBest ? '#0d7377' : '#d35244' }}>{fmt(totalDroits)}</td>
                          <td style={{ fontWeight: 700, color: '#0d7377' }}>{fmt(totalNet)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {ddvChartData.length > 0 && (
                <div className={s.chartsRow}>
                  <div className={s.chartContainer}>
                    <h3 className={s.chartTitle}>Droits au 1er décès (DDV)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={ddvChartData} margin={{ left: 10, right: 10, top: 10, bottom: 5 }} barCategoryGap="20%">
                        <ChartGradients />
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#5a6a7a' }} axisLine={{ stroke: '#d1d9e0' }} tickLine={false} />
                        <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 9, fill: '#8894a7' }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(13,115,119,0.06)', radius: 4 }} />
                        <Bar dataKey="droits1" name="Droits 1er décès" fill="url(#gradTeal)" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={s.chartContainer}>
                    <h3 className={s.chartTitle}>Droits au 2nd décès (DDV)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={ddvChartData} margin={{ left: 10, right: 10, top: 10, bottom: 5 }} barCategoryGap="20%">
                        <ChartGradients />
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#5a6a7a' }} axisLine={{ stroke: '#d1d9e0' }} tickLine={false} />
                        <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 9, fill: '#8894a7' }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(211,82,68,0.06)', radius: 4 }} />
                        <Bar dataKey="droits2" name="Droits 2nd décès" fill="url(#gradCoral)" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {bestDdv && (
                <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', background: '#e6f7f7', borderRadius: 10, border: '2px solid #0d7377' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0c2340', marginBottom: '0.5rem' }}>Recommandation</div>
                  <div style={{ fontSize: '0.85rem', color: '#1a2a3a', lineHeight: 1.7 }}>
                    Au regard du coût fiscal global sur les deux décès, l'option <strong style={{ color: '#0d7377' }}>{bestDdv.name}</strong> est
                    la plus avantageuse avec un total de droits de <strong style={{ color: '#0d7377' }}>{fmt(bestDdv.totalDroits)}</strong>,
                    pour une transmission nette cumulée de <strong style={{ color: '#0d7377' }}>{fmt(bestDdv.netTotal)}</strong>.
                    {bestDdv.name.toLowerCase().includes('usufruit') && !bestDdv.name.toLowerCase().includes('1/4') && (
                      <> Cette option permet au conjoint survivant de conserver la jouissance intégrale de tous les biens. Au second décès, l'usufruit s'éteint et la nue-propriété se reconstitue en pleine propriété <strong>sans aucune taxation supplémentaire</strong>, minimisant le coût fiscal global.</>
                    )}
                    {bestDdv.name.toLowerCase().includes('1/4') && (
                      <> Cette option offre un équilibre entre propriété immédiate (1/4 PP) et jouissance (3/4 USF), avec un coût fiscal intermédiaire au second décès.</>
                    )}
                    {bestDdv.name.toLowerCase().includes('quotit') && (
                      <> Cette option donne au conjoint la libre disposition de la quotité disponible en pleine propriété, mais entraîne un coût fiscal plus élevé au second décès (double imposition).</>
                    )}
                  </div>
                </div>
              )}
            </div>
          </SectionBlock>
        )}

        {/* ──────────────────────────────────────────── */}
        {/* SECTION COMPARATIF COUPLE (mode couple)       */}
        {/* ──────────────────────────────────────────── */}
        {hasInverse && comparatifSummary && (
          <SectionBlock id="comparatif-couple" num={isMarie ? 10 : 7} title="Comparatif des ordres de décès" subtitle="Analyse de l'impact fiscal selon qui décède en premier — même patrimoine, deux scénarios" bg="white" refCb={setRef('comparatif-couple')}>

            <div className={s.commentary}>
              <p style={{ marginBottom: '0.8rem' }}>
                Ce comparatif vous permet de mesurer l'impact fiscal de l'<strong>ordre des décès</strong> au sein du couple.
                Le patrimoine, le régime matrimonial et les enfants sont identiques dans les deux scénarios.
                Seul le rôle <em>défunt / survivant</em> est inversé.
              </p>
              <p>
                <strong>Scénario A :</strong> {clientName} décède en premier — {simulationData?.conjoint?.prenom || 'Conjoint'} survit.<br/>
                <strong>Scénario B :</strong> {simulationData?.conjoint?.prenom || 'Conjoint'} décède en premier — {clientName} survit.
              </p>
            </div>

            {/* Avertissement données conjoint incomplètes */}
            {(() => {
              const pp = simulationData?.parents_partenaire;
              const fp = simulationData?.fratrie_partenaire;
              const spouseParentsProvided = pp && (pp.pere?.vivant || pp.mere?.vivant);
              const spouseSiblingsProvided = fp && fp.length > 0;
              const hasChildren = (simulationData?.nombre_enfants || 0) > 0;
              const needsWarning = !hasChildren && !spouseParentsProvided && !spouseSiblingsProvided;
              if (!needsWarning) return null;
              return (
                <div style={{ padding: '0.65rem 1rem', background: '#fffbeb', borderRadius: 8, border: '1px solid #fcd34d', marginBottom: '1rem', fontSize: '0.78rem', color: '#92400e', lineHeight: 1.5 }}>
                  <strong>Hypothèse simplificatrice :</strong> Les parents et la fratrie du conjoint n'ont pas été renseignés.
                  Le scénario B utilise des héritiers d'ordre 3/4 par défaut pour la dévolution.
                  Pour un comparatif plus précis, renseignez la famille du conjoint dans l'étape « Famille ».
                </div>
              );
            })()}

            {/* ── Tabs Scénario A / B ── */}
            <div style={{ display: 'flex', gap: 8, marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              {(['A', 'B', 'comparatif'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveScenario(tab)} style={{
                  padding: '0.5rem 1.25rem', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem',
                  border: activeScenario === tab ? '2px solid #0c2340' : '1px solid #d1d9e0',
                  background: activeScenario === tab ? '#0c2340' : '#fff',
                  color: activeScenario === tab ? '#fff' : '#0c2340',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {tab === 'A' ? `Scénario A — ${clientName}` : tab === 'B' ? `Scénario B — ${inverseClientName}` : 'Vue comparative'}
                </button>
              ))}
            </div>

            {/* ── Vue comparative (tableau) ── */}
            {activeScenario === 'comparatif' && (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className={s.dataTable}>
                    <thead>
                      <tr>
                        <th style={{ minWidth: 200 }}></th>
                        <th style={{ textAlign: 'center' }}>Scénario A<br/><span style={{ fontWeight: 400, fontSize: '0.75rem' }}>{clientName} décède</span></th>
                        <th style={{ textAlign: 'center' }}>Scénario B<br/><span style={{ fontWeight: 400, fontSize: '0.75rem' }}>{inverseClientName} décède</span></th>
                        <th style={{ textAlign: 'center' }}>Écart</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Droits 1er décès</strong></td>
                        <td style={{ textAlign: 'center' }}>{fmt(comparatifSummary.droitsA)}</td>
                        <td style={{ textAlign: 'center' }}>{fmt(comparatifSummary.droitsB)}</td>
                        <td style={{ textAlign: 'center', color: comparatifSummary.droitsA <= comparatifSummary.droitsB ? '#0d7377' : '#d35244', fontWeight: 700 }}>
                          {fmt(Math.abs(comparatifSummary.droitsA - comparatifSummary.droitsB))}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Frais de notaire 1er décès</strong></td>
                        <td style={{ textAlign: 'center' }}>{fmt(comparatifSummary.fraisNotaireA)}</td>
                        <td style={{ textAlign: 'center' }}>{fmt(comparatifSummary.fraisNotaireB)}</td>
                        <td style={{ textAlign: 'center' }}>{fmt(Math.abs(comparatifSummary.fraisNotaireA - comparatifSummary.fraisNotaireB))}</td>
                      </tr>
                      <tr>
                        <td><strong>Transmission nette 1er décès</strong></td>
                        <td style={{ textAlign: 'center', color: '#0d7377', fontWeight: 700 }}>{fmt(comparatifSummary.netA)}</td>
                        <td style={{ textAlign: 'center', color: '#0d7377', fontWeight: 700 }}>{fmt(comparatifSummary.netB)}</td>
                        <td style={{ textAlign: 'center' }}>{fmt(Math.abs(comparatifSummary.netA - comparatifSummary.netB))}</td>
                      </tr>
                      {showSecondDeath && (
                        <tr>
                          <td><strong>Droits 2nd décès</strong></td>
                          <td style={{ textAlign: 'center' }}>{fmt(comparatifSummary.sc2A)}</td>
                          <td style={{ textAlign: 'center' }}>{fmt(comparatifSummary.sc2B)}</td>
                          <td style={{ textAlign: 'center' }}>{fmt(Math.abs(comparatifSummary.sc2A - comparatifSummary.sc2B))}</td>
                        </tr>
                      )}
                      <tr style={{ background: comparatifSummary.meilleur === 'A' ? '#e6f7f7' : '#fdf8f3', fontWeight: 700 }}>
                        <td><strong>Total droits (1er + 2nd)</strong></td>
                        <td style={{ textAlign: 'center', color: comparatifSummary.meilleur === 'A' ? '#0d7377' : '#d35244' }}>{fmt(comparatifSummary.totalA)}</td>
                        <td style={{ textAlign: 'center', color: comparatifSummary.meilleur === 'B' ? '#0d7377' : '#d35244' }}>{fmt(comparatifSummary.totalB)}</td>
                        <td style={{ textAlign: 'center', color: '#0d7377', fontWeight: 800 }}>{fmt(comparatifSummary.economie)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ── Verdict ── */}
                <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', background: '#e6f7f7', borderRadius: 10, border: '2px solid #0d7377' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0c2340', marginBottom: '0.4rem' }}>Verdict</div>
                  <div style={{ fontSize: '0.85rem', color: '#1a2a3a', lineHeight: 1.7 }}>
                    {comparatifSummary.economie > 0 ? (
                      <>
                        Le <strong style={{ color: '#0d7377' }}>Scénario {comparatifSummary.meilleur}</strong> ({comparatifSummary.meilleur === 'A' ? clientName : inverseClientName} décède en premier)
                        est fiscalement plus avantageux avec une économie totale de{' '}
                        <strong style={{ color: '#0d7377' }}>{fmt(comparatifSummary.economie)}</strong> sur l'ensemble des deux décès.
                        Cette différence s'explique par les abattements, la composition du patrimoine propre de chaque époux,
                        et le mécanisme de reconstitution (usufruit/nue-propriété) au second décès.
                      </>
                    ) : (
                      <>Les deux scénarios produisent un coût fiscal identique. L'ordre des décès n'a pas d'impact différenciant dans votre situation.</>
                    )}
                  </div>
                </div>

                {/* ── Hypothèses appliquées ── */}
                <div style={{ marginTop: '1rem', padding: '0.65rem 1rem', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, color: '#374151', marginBottom: '0.25rem', fontSize: '0.78rem' }}>Hypothèses appliquées</div>
                  <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                    <li>Les biens propres sont inversés selon le propriétaire renseigné (propre client ↔ propre conjoint). Les biens communs restent partagés selon le régime matrimonial.</li>
                    <li>Seules les libéralités (donations, legs, AV) du défunt concerné sont prises en compte dans chaque scénario.</li>
                    <li>Le 2nd décès utilise la famille du conjoint (parents, fratrie) si renseignée, sinon un héritier estimé d'ordre 3/4.</li>
                  </ul>
                </div>
              </>
            )}

            {/* ── Vue Scénario A (détail) ── */}
            {activeScenario === 'A' && sc1 && (
              <div style={{ padding: '1rem', background: '#f8f9fc', borderRadius: 10, border: '1px solid #e2e5ee' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0c2340', marginBottom: '0.75rem' }}>
                  Scénario A — {clientName} décède en premier
                </h4>
                <div className={s.kpiGrid}>
                  <Kpi label="Actif successoral" value={fmt(sc1.actifSuccessoral)} color="Blue" />
                  <Kpi label="Droits de succession" value={fmt(sc1.droitsSuccession)} color="Orange" />
                  <Kpi label="Transmission nette" value={fmt(sc1.transmissionNette)} color="Green" />
                  <Kpi label="Taux de transmission" value={pct(sc1.tauxTransmission)} color="Blue" />
                </div>
                {sc1.heritiers && sc1.heritiers.length > 0 && (
                  <table className={s.dataTable} style={{ marginTop: '0.75rem' }}>
                    <thead><tr><th>Héritier</th><th>Part</th><th>Abattement</th><th>Base taxable</th><th>Droits</th></tr></thead>
                    <tbody>
                      {sc1.heritiers.map((h: any, j: number) => (
                        <tr key={j}>
                          <td><strong>{h.nom}</strong></td>
                          <td>{fmt(h.montantTransmis)}</td>
                          <td>{fmt(h.abattement)}</td>
                          <td>{fmt(h.baseApresAbattement)}</td>
                          <td style={{ fontWeight: 700, color: h.droits > 0 ? '#c9a84c' : '#0d7377' }}>{h.droits > 0 ? fmt(h.droits) : 'Exonéré'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── Vue Scénario B (détail) ── */}
            {activeScenario === 'B' && resultatInverse?.scenario1 && (
              <div style={{ padding: '1rem', background: '#fdf8f3', borderRadius: 10, border: '1px solid #ecdcc8' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0c2340', marginBottom: '0.75rem' }}>
                  Scénario B — {inverseClientName} décède en premier
                </h4>
                <div className={s.kpiGrid}>
                  <Kpi label="Actif successoral" value={fmt(resultatInverse.scenario1.actifSuccessoral)} color="Blue" />
                  <Kpi label="Droits de succession" value={fmt(resultatInverse.scenario1.droitsSuccession)} color="Orange" />
                  <Kpi label="Transmission nette" value={fmt(resultatInverse.scenario1.transmissionNette)} color="Green" />
                  <Kpi label="Taux de transmission" value={pct(resultatInverse.scenario1.tauxTransmission)} color="Blue" />
                </div>
                {resultatInverse.scenario1.heritiers && resultatInverse.scenario1.heritiers.length > 0 && (
                  <table className={s.dataTable} style={{ marginTop: '0.75rem' }}>
                    <thead><tr><th>Héritier</th><th>Part</th><th>Abattement</th><th>Base taxable</th><th>Droits</th></tr></thead>
                    <tbody>
                      {resultatInverse.scenario1.heritiers.map((h: any, j: number) => (
                        <tr key={j}>
                          <td><strong>{h.nom}</strong></td>
                          <td>{fmt(h.montantTransmis)}</td>
                          <td>{fmt(h.abattement)}</td>
                          <td>{fmt(h.baseApresAbattement)}</td>
                          <td style={{ fontWeight: 700, color: h.droits > 0 ? '#c9a84c' : '#0d7377' }}>{h.droits > 0 ? fmt(h.droits) : 'Exonéré'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

          </SectionBlock>
        )}

        {/* ──────────────────────────────────────────── */}
        {/* SECTION SYNTHÈSE DES RECOMMANDATIONS         */}
        {/* ──────────────────────────────────────────── */}
        {sc1 && (
          <SectionBlock id="synthese" num={hasInverse ? (isMarie ? 11 : 8) : (isMarie ? 10 : 6)} title="Synthèse des recommandations" subtitle="Récapitulatif de nos préconisations issues de l'analyse de votre situation" refCb={setRef('synthese')}>
            <div className={s.commentary}>
              <p>
                Avant de passer aux stratégies d'optimisation détaillées, voici un <strong>récapitulatif</strong> des
                principales recommandations issues de l'analyse de votre dossier. Ces préconisations tiennent
                compte de {isMarie ? 'votre régime matrimonial, de ' : ''}la composition de votre patrimoine, et des résultats
                des différents scénarios simulés.
              </p>
            </div>

            <div className={s.syntheseGrid}>
              {/* Résultat scénario 1 */}
              <div className={`${s.syntheseCard} ${s.syntheseCardBest}`}>
                <div className={s.syntheseLabel}>Situation actuelle — 1er décès</div>
                <div className={s.syntheseValue}>{fmt(sc1.droitsSuccession)}</div>
                <div className={s.syntheseHint}>
                  Droits de succession sur un actif de {fmt(sc1.actifSuccessoral)}.
                  {sc1.actifSuccessoral > 0 && <> Taux effectif : <strong>{((sc1.droitsSuccession / sc1.actifSuccessoral) * 100).toFixed(1)} %</strong>.</>}
                  {' '}Transmission nette : {fmt(sc1.transmissionNette)}.
                </div>
              </div>

              {/* Résultat scénario 2 si applicable */}
              {showSecondDeath && sc2 && sc2.label !== 'Non applicable' && (
                <div className={`${s.syntheseCard} ${s.syntheseCardWarn}`}>
                  <div className={s.syntheseLabel}>Second décès ({isMarie ? 'conjoint' : 'partenaire'} survivant)</div>
                  <div className={s.syntheseValue}>{fmt(sc2.droitsSuccession)}</div>
                  <div className={s.syntheseHint}>
                    Droits au décès du conjoint survivant.
                    Coût fiscal global sur les deux décès : <strong>{fmt((sc1.droitsSuccession || 0) + (sc2.droitsSuccession || 0))}</strong>.
                  </div>
                </div>
              )}

              {/* Meilleure option légale */}
              {bestLegal && (
                <div className={`${s.syntheseCard} ${s.syntheseCardBest}`}>
                  <div className={s.syntheseLabel}>Option légale recommandée</div>
                  <div className={s.syntheseValue} style={{ fontSize: '1rem' }}>{bestLegal.name}</div>
                  <div className={s.syntheseHint}>
                    Coût fiscal total (2 décès) : <strong>{fmt(bestLegal.totalDroits)}</strong>.
                    Transmission nette cumulée : {fmt(bestLegal.netTotal)}.
                  </div>
                </div>
              )}

              {/* Meilleure option DDV */}
              {bestDdv && (
                <div className={`${s.syntheseCard} ${s.syntheseCardBest}`}>
                  <div className={s.syntheseLabel}>Option DDV recommandée</div>
                  <div className={s.syntheseValue} style={{ fontSize: '1rem' }}>{bestDdv.name}</div>
                  <div className={s.syntheseHint}>
                    Coût fiscal total (2 décès) : <strong>{fmt(bestDdv.totalDroits)}</strong>.
                    Transmission nette cumulée : {fmt(bestDdv.netTotal)}.
                  </div>
                </div>
              )}

              {/* DDV non en place */}
              {isMarie && !ddvSelected && (
                <div className={`${s.syntheseCard} ${s.syntheseCardWarn}`}>
                  <div className={s.syntheseLabel}>Action prioritaire</div>
                  <div className={s.syntheseValue} style={{ fontSize: '1rem', color: '#b8860b' }}>Mettre en place une DDV</div>
                  <div className={s.syntheseHint}>
                    Coût : 200–400 € chez le notaire. Ouvre 3 options de protection du conjoint au lieu de 2.
                    {bestLegal && <> Économie potentielle : accès à l'option optimale DDV.</>}
                  </div>
                </div>
              )}

              {/* Économie potentielle optimisation */}
              {optim?.economiePotentielle > 0 && (
                <div className={`${s.syntheseCard} ${s.syntheseCardBest}`}>
                  <div className={s.syntheseLabel}>Économie potentielle (optimisations)</div>
                  <div className={s.syntheseValue} style={{ color: '#0d7377' }}>{fmt(optim.economiePotentielle)}</div>
                  <div className={s.syntheseHint}>
                    En appliquant les {optim.strategies?.length || 0} stratégies identifiées ci-après.
                    {sc1.droitsSuccession > 0 && <> Soit {((optim.economiePotentielle / sc1.droitsSuccession) * 100).toFixed(0)} % des droits actuels.</>}
                  </div>
                </div>
              )}
            </div>

            {/* Verdict global */}
            <div className={s.verdictBox}>
              <div className={s.verdictTitle}>Verdict de notre analyse</div>
              <div className={s.verdictText}>
                {isMarie ? (
                  <>
                    {bestDdv ? (
                      <>L'option <span className={s.verdictHighlight}>{bestDdv.name}</span> (DDV) est la plus avantageuse
                        fiscalement avec un coût global de {fmt(bestDdv.totalDroits)} sur les deux décès.</>
                    ) : bestLegal ? (
                      <>L'option légale <span className={s.verdictHighlight}>{bestLegal.name}</span> est la plus avantageuse
                        fiscalement avec un coût global de {fmt(bestLegal.totalDroits)} sur les deux décès.</>
                    ) : (
                      <>Les droits de succession s'élèvent à {fmt(sc1.droitsSuccession)} au premier décès.</>
                    )}
                    {!ddvSelected && <> <strong>Nous recommandons en priorité la mise en place d'une DDV</strong> (200–400 € de frais notariés) pour élargir les options de protection du conjoint.</>}
                    {optim?.economiePotentielle > 0 && <> Les stratégies d'optimisation détaillées dans la section suivante permettraient une économie supplémentaire de <span className={s.verdictHighlight}>{fmt(optim.economiePotentielle)}</span>.</>}
                  </>
                ) : (
                  <>
                    Les droits de succession s'élèvent à <span className={s.verdictHighlight}>{fmt(sc1.droitsSuccession)}</span> pour
                    une transmission nette de {fmt(sc1.transmissionNette)}.
                    {optim?.economiePotentielle > 0 && <> Les stratégies détaillées ci-après permettraient d'économiser jusqu'à <span className={s.verdictHighlight}>{fmt(optim.economiePotentielle)}</span>.</>}
                  </>
                )}
              </div>
            </div>
          </SectionBlock>
        )}

        {/* ──────────────────────────────────────────── */}
        {/* SECTION OPTIMISATIONS — Timeline + stratégies */}
        {/* ──────────────────────────────────────────── */}
        <SectionBlock id="optimisations" num={isMarie ? 11 : 7} title="Plan d'action patrimonial" subtitle="Stratégies d'optimisation chiffrées avec calendrier adapté à votre situation" bg="white" refCb={setRef('optimisations')}>

          {(() => {
            const ageClient = meta?.client?.age || simulationData?.identite?.age || 55;
            const ageConjoint = simulationData?.conjoint?.age || null;
            const sexeClient = meta?.client?.sexe || simulationData?.identite?.sexe || 'M';
            const esperanceVie = sexeClient === 'F' ? 85 : 80;
            const actifSucc = sc1?.actifSuccessoral || 0;
            const nbHeritiers = sc1?.heritiers?.length || 0;

            const USF_SCALE: [number, number][] = [
              [20, 90], [30, 80], [40, 70], [50, 60], [60, 50], [70, 40], [80, 30], [90, 20], [91, 10],
            ];
            const getUsfPct = (age: number) => {
              for (const [maxAge, pct] of USF_SCALE) {
                if (age <= maxAge) return pct;
              }
              return 10;
            };
            const getNpPct = (age: number) => 100 - getUsfPct(age);
            const currentUsfPct = getUsfPct(ageClient);
            const currentNpPct = getNpPct(ageClient);

            const currentBracketIdx = USF_SCALE.findIndex(([maxAge]) => ageClient <= maxAge);
            const nextUsfBracket = currentBracketIdx >= 0 && currentBracketIdx < USF_SCALE.length - 1
              ? USF_SCALE[currentBracketIdx + 1] : null;
            const nextBracketAge = nextUsfBracket ? nextUsfBracket[0] : null;
            const nextBracketUsfPct = nextUsfBracket ? nextUsfBracket[1] : null;

            // ── 100 % piloté par le backend ──
            const backendStrategies: any[] = optim?.strategies || [];

            // Timeline dynamique basée sur les stratégies backend
            const immediateStrats = backendStrategies.filter((st: any) => {
              const dl = (st.delai || '').toLowerCase();
              return dl.includes('possible') || dl.includes('immédiat');
            });
            const avStrat = backendStrategies.find((st: any) => (st.titre || '').toLowerCase().includes('assurance-vie'));

            const timelineItems: {
              age: number | string; dotClass: string;
              title: string; desc: string; calc?: string;
            }[] = [];

            // Aujourd'hui — actions immédiates depuis le backend
            const immediateDesc = immediateStrats.length > 0
              ? immediateStrats.map((st: any) => `${st.titre}${st.economie > 0 ? ` — économie : ${fmt(st.economie)}` : ''}`).join('. ') + '.'
              : 'Réaliser un bilan patrimonial complet.';
            timelineItems.push({
              age: `${ageClient} ans — Aujourd'hui`,
              dotClass: s.timelineDotActive,
              title: 'Actions immédiates à mettre en œuvre',
              desc: isMarie && !ddvSelected
                ? 'Mettre en place une DDV chez le notaire (200–400 €). ' + immediateDesc
                : immediateDesc,
            });

            // 70 ans — seuil AV (si < 70 et stratégie AV existe dans le backend)
            if (ageClient < 70 && avStrat) {
              timelineItems.push({
                age: `70 ans (dans ${70 - ageClient} ans)`,
                dotClass: s.timelineDotCoral,
                title: 'Seuil critique : assurance-vie (art. 990 I CGI)',
                desc: avStrat.description,
              });
            }

            // USF bracket (marié uniquement)
            if (nextBracketAge && nextBracketAge > ageClient && isMarie) {
              const npNow = currentNpPct;
              const npNext = 100 - (nextBracketUsfPct || 0);
              timelineItems.push({
                age: `${nextBracketAge} ans (dans ${nextBracketAge - ageClient} ans)`,
                dotClass: s.timelineDotTeal,
                title: `Changement de tranche usufruit (art. 669 CGI)`,
                desc: `NP passe de ${npNow} % à ${npNext} %. Surcoût potentiel : +${fmt(actifSucc * (npNext - npNow) / 100)} de base taxable.`,
              });
            }

            // Espérance de vie
            const nbCycles = Math.max(0, Math.floor((esperanceVie - ageClient) / 15));
            timelineItems.push({
              age: `~${esperanceVie} ans — Espérance de vie`,
              dotClass: s.timelineDotMuted,
              title: `Horizon statistique (INSEE ${sexeClient === 'F' ? 'femme' : 'homme'})`,
              desc: `Cycles de donation (15 ans) restants : ~${nbCycles}.`
                + (isMarie && ageConjoint
                  ? ` Âge du conjoint : ${ageConjoint} ans — barème USF conjoint : ${getUsfPct(ageConjoint)} % USF / ${getNpPct(ageConjoint)} % NP.`
                  : ''),
            });

            return (
              <>
                <div className={s.commentary}>
                  <p style={{ marginBottom: '0.8rem' }}>
                    Ce plan d'action tient compte de votre <strong>âge ({ageClient} ans)</strong>,
                    {ageConjoint && <> de l'âge de votre conjoint (<strong>{ageConjoint} ans</strong>),</>}
                    {' '}de l'<strong>espérance de vie statistique (~{esperanceVie} ans)</strong>,
                    et des <strong>seuils fiscaux clés</strong>.
                    Les montants sont calculés à partir de votre patrimoine réel et de vos <strong>{nbHeritiers} héritier(s)</strong>.
                  </p>
                  {isMarie && (
                    <p>
                      <strong>Barème usufruit actuel (art. 669 CGI) :</strong> à {ageClient} ans,
                      l'usufruit est évalué à <strong>{currentUsfPct} %</strong> et la nue-propriété
                      à <strong>{currentNpPct} %</strong> de la valeur du bien.
                      {ageConjoint && <> Pour votre conjoint ({ageConjoint} ans) : USF {getUsfPct(ageConjoint)} % / NP {getNpPct(ageConjoint)} %.</>}
                    </p>
                  )}
                </div>

                {/* ── Timeline visuelle ── */}
                <h3 className={s.chartTitle} style={{ marginTop: '1.5rem' }}>Calendrier patrimonial personnalisé</h3>
                <div className={s.timeline}>
                  {timelineItems.map((item, i) => (
                    <div key={i} className={s.timelineItem}>
                      <div className={`${s.timelineDot} ${item.dotClass}`} />
                      <div className={s.timelineAge}>{item.age}</div>
                      <div className={s.timelineTitle}>{item.title}</div>
                      <div className={s.timelineDesc}>{item.desc}</div>
                      {item.calc && (
                        <div className={s.timelineCalc}>
                          {item.calc}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* ── Barème USF art. 669 CGI (marié uniquement) ── */}
                {isMarie && (
                  <div style={{ marginTop: '2rem' }}>
                    <h3 className={s.chartTitle}>Barème de l'usufruit — Art. 669 CGI</h3>
                    <div className={s.commentary} style={{ marginBottom: '0.75rem' }}>
                      <p>
                        Ce barème détermine la <strong>valeur fiscale</strong> de l'usufruit et de la nue-propriété
                        en fonction de l'âge de l'usufruitier. Plus l'usufruitier est âgé, moins l'usufruit vaut
                        (et plus la nue-propriété est élevée), ce qui augmente la base taxable des nus-propriétaires.
                      </p>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className={s.dataTable}>
                        <thead>
                          <tr>
                            <th>Âge de l'usufruitier</th>
                            <th>Valeur USF</th>
                            <th>Valeur NP</th>
                            <th>Impact sur actif de {fmt(actifSucc)}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {USF_SCALE.map(([maxAge, usfPct], i) => {
                            const npPctVal = 100 - usfPct;
                            const minAge = i === 0 ? 0 : USF_SCALE[i - 1][0] + 1;
                            const isCurrentBracket = ageClient >= minAge && ageClient <= maxAge;
                            return (
                              <tr key={maxAge} style={isCurrentBracket ? { background: '#e6f7f7' } : {}}>
                                <td>
                                  <strong>{maxAge <= 90 ? `≤ ${maxAge} ans` : '≥ 91 ans'}</strong>
                                  {isCurrentBracket && <span style={{ marginLeft: 8, fontSize: '0.68rem', background: '#0d7377', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>VOUS</span>}
                                </td>
                                <td style={{ color: '#b8860b', fontWeight: 600 }}>{usfPct} %</td>
                                <td style={{ color: '#0d7377', fontWeight: 600 }}>{npPctVal} %</td>
                                <td style={{ fontSize: '0.8rem', color: '#5a6a7a' }}>
                                  NP = {fmt(actifSucc * npPctVal / 100)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Stratégies détaillées — 100 % depuis le backend ── */}
                <h3 className={s.chartTitle} style={{ marginTop: '2rem', marginBottom: '1rem' }}>Stratégies détaillées</h3>

                {backendStrategies.length === 0 && (
                  <p style={{ color: '#5a6a7a' }}>Aucune stratégie d'optimisation identifiée pour votre situation actuelle.</p>
                )}

                {backendStrategies.map((strat: any, i: number) => (
                  <div key={`strat-${i}`} className={`${s.strategyCard} ${strat.recommande ? s.strategyCardRecommended : ''}`}>
                    {strat.recommande && (
                      <span className={s.strategyBadge}>
                        {strat.delai ? `Recommandé — ${strat.delai}` : 'Recommandé'}
                      </span>
                    )}
                    <h3 className={s.strategyTitle}>{strat.titre}</h3>
                    <p className={s.strategyDesc}>{strat.description}</p>
                    <div className={s.strategyFooter}>
                      <div>
                        <div className={s.strategySavingLabel}>Économie estimée</div>
                        <div className={s.strategySaving}>{strat.economie > 0 ? fmt(strat.economie) : '–'}</div>
                      </div>
                      {strat.delai && <div className={s.strategyDeadline}>{strat.delai}</div>}
                    </div>
                  </div>
                ))}

                {/* ── Alertes ── */}
                {alertes.length > 0 && (
                  <div style={{ marginTop: '2rem' }}>
                    <h3 className={s.chartTitle} style={{ marginBottom: '1rem' }}>Points d'attention</h3>
                    {alertes.map((a: any, i: number) => {
                      const aType = a.type?.toLowerCase() || 'info';
                      const typeClass = aType === 'warning' ? s.alertWarning
                        : (aType === 'error' || aType === 'danger') ? s.alertError
                        : aType === 'success' ? s.alertSuccess : s.alertInfo;
                      const icon = aType === 'warning' ? '⚠️'
                        : (aType === 'error' || aType === 'danger') ? '🚨'
                        : aType === 'success' ? '✅' : 'ℹ️';
                      return (
                        <div key={i} className={`${s.alertCard} ${typeClass}`}>
                          <span className={s.alertIcon}>{icon}</span>
                          <div className={s.alertContent}>
                            <div className={s.alertTitle}>{a.titre}</div>
                            <div className={s.alertMessage}>{a.message}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Disclaimer ── */}
                <div style={{ marginTop: '2rem', padding: '0.75rem 1rem', background: '#f8f9fc', borderRadius: 10, border: '1px solid #e2e5ee', fontSize: '0.76rem', color: '#5a6a7a', lineHeight: 1.6 }}>
                  Les économies indiquées sont des estimations basées sur la législation fiscale en vigueur (2026) et les données de votre simulation.
                  L'espérance de vie est indicative (INSEE 2024). Consultez votre notaire ou conseiller en gestion de patrimoine pour une mise en œuvre adaptée.
                </div>
              </>
            );
          })()}
        </SectionBlock>
          </main>
        </div>{/* end contentArea */}
      </div>{/* end layoutWrapper */}

      <ScrollTop />

    </div>
  );
}

export default function ResultatsSimulationWithErrorBoundary() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ResultatsSimulation />
    </ErrorBoundary>
  );
}
