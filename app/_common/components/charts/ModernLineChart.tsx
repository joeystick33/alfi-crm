/**
 * ModernLineChart - Graphique en aires "Fintech Pro" (Style Finary/Stripe)
 * Avec dégradés, animations fluides et curseur précis
 */

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Couleurs "Deep Professional" - Sobres et Élégantes
const CHART_COLORS = [
  { stroke: '#6E6EFF', fill: '#6E6EFF' }, // Indigo (Primary)
  { stroke: '#10B981', fill: '#10B981' }, // Emerald (Success)
  { stroke: '#F59E0B', fill: '#F59E0B' }, // Amber (Warning)
  { stroke: '#EC4899', fill: '#EC4899' }, // Pink
  { stroke: '#8B5CF6', fill: '#8B5CF6' }, // Violet
];

interface ModernLineChartProps {
  data: Array<Record<string, unknown>>;
  dataKeys: string[];
  xAxisKey?: string;
  title?: string;
  formatValue?: (value: number) => string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export function ModernLineChart({
  data,
  dataKeys,
  xAxisKey = 'name',
  title,
  formatValue,
  xAxisLabel,
  yAxisLabel
}: ModernLineChartProps) {

  // Custom Cursor (Vertical Line Only - Fintech Standard)
  const CustomCursor = (props: any) => {
    const { points, width, height } = props;
    if (!points || !points.length) return null;
    const { x, y } = points[0];
    return (
      <line
        x1={x} y1={0} x2={x} y2={height}
        stroke="hsl(var(--muted-foreground))"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
    );
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F111A]/90 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl animate-in fade-in-0 zoom-in-95 ring-1 ring-white/5">
          <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">{label}</p>
          <div className="space-y-2">
            {payload.map((entry, index: number) => (
              <div key={index} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                    style={{ backgroundColor: entry.color, color: entry.color }}
                  />
                  <span className="text-sm font-medium text-slate-200">{entry.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-100 tabular-nums">
                  {formatValue ? formatValue(entry.value) : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative w-full h-full">
      {title && (
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          {title}
        </h3>
      )}

      <div className="h-[300px] w-full animate-in fade-in-0 duration-700">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              {dataKeys.map((_, index) => (
                <linearGradient key={index} id={`colorGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[index % CHART_COLORS.length].fill} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS[index % CHART_COLORS.length].fill} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return `${value}`;
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={<CustomCursor />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={(value) => <span className="text-sm text-slate-400 font-medium ml-1">{value}</span>}
            />
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[index % CHART_COLORS.length].stroke}
                fill={`url(#colorGradient-${index})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: 'white', className: 'animate-pulse' }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
