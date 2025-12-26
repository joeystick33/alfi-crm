'use client';

import { useState, useEffect, useCallback, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/_common/components/ui/Card';
import { ModernLineChart } from '@/app/_common/components/charts/ModernLineChart';
import { SaveSimulationButton } from '@/app/_common/components/SaveSimulationButton';
import { ArrowUpRight, TrendingUp, AlertTriangle, CheckCircle, Target, RefreshCw, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
// Motion removed for instant display

// --- UI Components "Fintech Pro" (Clean Light Mode) ---

type FloatingInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

type HeroCardColor = 'indigo' | 'emerald' | 'amber' | 'rose'

type HeroCardProps = {
  title: string
  value: string
  subtext?: string
  trend?: boolean
  color?: HeroCardColor
}

type SectionProps = {
  title: string
  icon: LucideIcon
  children: ReactNode
}

type RetirementProjectionPoint = {
  age: number
  savingsBalance: number
  totalContributions: number
}

type RetirementSimulationResult = {
  savingsAtRetirement: number
  retirementAge: number
  sustainableMonthlyIncome?: number
  totalContributions: number
  investmentGains: number
  isRetirementFeasible: boolean
  incomeShortfall: number
  projection: RetirementProjectionPoint[]
}

type RetirementSimulateApiResponse = {
  data?: RetirementSimulationResult
  result?: RetirementSimulationResult
  message?: string
}

const FloatingInput = ({ label, value, onChange, type = "text", ...props }: FloatingInputProps) => (
  <div className="relative group">
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="peer w-full bg-white border border-slate-200 rounded-xl px-4 pt-6 pb-2 text-slate-900 font-medium placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
      placeholder={label}
      {...props}
    />
    <label className="absolute left-4 top-4 text-xs text-slate-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-indigo-600 pointer-events-none">
      {label}
    </label>
  </div>
);

const HeroCard = ({ title, value, subtext, trend, color = "indigo" }: HeroCardProps) => {
  const stylesMap = {
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    rose: "bg-red-50 border-red-100 text-red-700",
  };

  const activeStyle = stylesMap[color] || stylesMap.indigo;

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-md", activeStyle)}>
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">{title}</p>
        <h4 className="text-3xl font-bold font-mono tracking-tight tabular-nums">{value}</h4>
        {subtext && <p className="text-sm opacity-70 mt-2">{subtext}</p>}
      </div>
      {trend && (
        <div className="absolute top-6 right-6 p-2 rounded-full bg-white/20 border border-white/10">
          <ArrowUpRight className="w-5 h-5 text-current" />
        </div>
      )}
    </div>
  );
};

export function RetirementSimulator() {
  const [currentAge, setCurrentAge] = useState('35');
  const [retirementAge, setRetirementAge] = useState('65');
  const [lifeExpectancy, setLifeExpectancy] = useState('85');
  const [currentSavings, setCurrentSavings] = useState('50000');
  const [monthlyContribution, setMonthlyContribution] = useState('500');
  const [expectedReturn, setExpectedReturn] = useState('5');
  const [inflationRate, setInflationRate] = useState('2');
  const [currentIncome, setCurrentIncome] = useState('50000');
  const [desiredReplacementRate, setDesiredReplacementRate] = useState('70');

  const [result, setResult] = useState<RetirementSimulationResult | null>(null);
  const [_loading, setLoading] = useState(false);
  const [_error, setError] = useState('');

  const simulateRetirement = useCallback(async () => {
    const age = parseFloat(currentAge) || 0;
    const retAge = parseFloat(retirementAge) || 0;
    const savings = parseFloat(currentSavings) || 0;

    // Basic Client-Side Validation to prevent API spam
    if (age <= 0 || retAge <= age) return;

    setLoading(true);
    try {
      const response = await fetch('/api/advisor/simulators/retirement/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAge: age,
          retirementAge: retAge,
          lifeExpectancy: parseFloat(lifeExpectancy) || 85,
          currentSavings: savings,
          monthlyContribution: parseFloat(monthlyContribution) || 0,
          expectedReturn: (parseFloat(expectedReturn) || 0) / 100,
          inflationRate: (parseFloat(inflationRate) || 0) / 100,
          currentIncome: parseFloat(currentIncome) || 0,
          desiredReplacementRate: (parseFloat(desiredReplacementRate) || 0) / 100
        })
      });

      const payload = (await response.json()) as RetirementSimulateApiResponse;
      if (!response.ok) throw new Error(payload?.message || 'Erreur');
      setResult(payload.data || payload.result);
      setError('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur'
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    currentAge,
    retirementAge,
    currentSavings,
    lifeExpectancy,
    monthlyContribution,
    expectedReturn,
    inflationRate,
    currentIncome,
    desiredReplacementRate,
  ]);

  // Real-time calculation with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      simulateRetirement();
    }, 600);
    return () => clearTimeout(timer);
  }, [simulateRetirement]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  // Chart Data Preparation
  const chartData = result?.projection?.map((p) => ({
    age: p.age,
    "Capital": p.savingsBalance,
    "Contributions": p.totalContributions
  })) || [];

  return (
    <div className="grid lg:grid-cols-12 gap-8 h-full min-h-[calc(100vh-140px)]">

      {/* LEFT: Inputs Panel (Scrollable) */}
      <div className="lg:col-span-4 space-y-8 overflow-y-auto pr-2 pb-20">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-2">
            <span className="text-indigo-600">Plan Retraite</span>
          </h2>
          <p className="text-slate-500">Configurez votre stratégie d'épargne.</p>
        </div>

        <div className="space-y-6">
          <Section title="Votre Profil" icon={Target}>
            <div className="grid grid-cols-2 gap-4">
              <FloatingInput label="Âge actuel" value={currentAge} onChange={(e) => setCurrentAge(e.target.value)} type="number" />
              <FloatingInput label="Départ à la retraite" value={retirementAge} onChange={(e) => setRetirementAge(e.target.value)} type="number" />
            </div>
            <FloatingInput label="Espérance de vie estimée" value={lifeExpectancy} onChange={(e) => setLifeExpectancy(e.target.value)} type="number" />
          </Section>

          <Section title="Situation Financière" icon={TrendingUp}>
            <FloatingInput label="Revenu annuel net (€)" value={currentIncome} onChange={(e) => setCurrentIncome(e.target.value)} type="number" />
            <div className="grid grid-cols-2 gap-4">
              <FloatingInput label="Épargne actuelle (€)" value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} type="number" />
              <FloatingInput label="Versement mensuel (€)" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} type="number" />
            </div>
          </Section>

          <Section title="Hypothèses" icon={RefreshCw}>
            <div className="grid grid-cols-2 gap-4">
              <FloatingInput label="Rendement annuel (%)" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} type="number" step="0.1" />
              <FloatingInput label="Inflation (%)" value={inflationRate} onChange={(e) => setInflationRate(e.target.value)} type="number" step="0.1" />
            </div>
            <FloatingInput label="Taux de remplacement (%)" value={desiredReplacementRate} onChange={(e) => setDesiredReplacementRate(e.target.value)} type="number" />
          </Section>
        </div>
      </div>

      {/* RIGHT: Results & Visuals (Sticky / Fixed) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Top Hero Cards */}
        {result ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HeroCard
              title="Capital à Terme"
              value={formatCurrency(result.savingsAtRetirement)}
              subtext={`à ${result.retirementAge} ans`}
              trend
              color="indigo"
            />
            <HeroCard
              title="Rente Mensuelle"
              value={formatCurrency(result.sustainableMonthlyIncome || 0)}
              subtext="Est. durable sur 25 ans"
              color="emerald"
            />
            <HeroCard
              title="Effort d'Épargne"
              value={formatCurrency(result.totalContributions)}
              subtext={`+${formatCurrency(result.investmentGains)} d'intérêts`}
              color="amber"
            />
          </div>
        ) : (
          <div className="h-32 rounded-2xl bg-slate-100" />
        )}

        {/* Main Chart Area */}
        <Card className="border shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-800">Projection de Patrimoine</CardTitle>
            <CardDescription>Évolution de votre capital jusqu'à l'age de départ.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {result ? (
              <ModernLineChart
                data={chartData}
                dataKeys={["Capital", "Contributions"]}
                xAxisKey="age"
                formatValue={formatCurrency}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">Chargement de la projection...</div>
            )}
          </CardContent>
        </Card>

        {/* Feasibility Alert */}
        {result && (
          <div className={cn(
            "p-4 rounded-xl border flex items-start gap-4",
            result.isRetirementFeasible
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          )}>
            {result.isRetirementFeasible ? <CheckCircle className="w-6 h-6 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-6 h-6 shrink-0 text-red-600" />}
            <div>
              <h4 className={cn("font-bold mb-1", result.isRetirementFeasible ? "text-emerald-700" : "text-red-700")}>
                {result.isRetirementFeasible ? "Objectif Atteignable" : "Attention : Déficit Projeté"}
              </h4>
              <p className="text-sm opacity-90">
                {result.isRetirementFeasible
                  ? "Votre stratégie d'épargne est suffisante pour maintenir votre niveau de vie."
                  : `Il vous manque environ ${formatCurrency(Math.abs(result.incomeShortfall))} par an pour atteindre votre cible.`}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          {/* Save Button Placeholder */}
          <SaveSimulationButton
            type="RETRAITE"
            defaultName={`Simulation Retraite - ${currentAge} ans`}
            parameters={{ currentAge, retirementAge, currentSavings, monthlyContribution }}
            results={result}
          />
        </div>

      </div>
    </div>
  );
}

const Section = ({ title, icon: Icon, children }: SectionProps) => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
      <Icon className="w-4 h-4" /> {title}
    </h3>
    <div className="space-y-3 pl-2 border-l-2 border-slate-200">
      {children}
    </div>
  </div>
);
