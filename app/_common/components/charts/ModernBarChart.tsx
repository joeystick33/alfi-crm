/**
 * ModernBarChart - Graphique en barres moderne style Finary
 * Avec gradients, animations et effets 3D
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const GRADIENT_COLORS = [
  { start: '#667eea', end: '#764ba2' },
  { start: '#f093fb', end: '#f5576c' },
  { start: '#4facfe', end: '#00f2fe' },
  { start: '#43e97b', end: '#38f9d7' },
  { start: '#fa709a', end: '#fee140' },
];

interface ModernBarChartProps {
  data: Array<{ name: string; [key: string]: string | number }>;
  dataKeys: string[];
  title?: string;
  formatValue?: (value: number) => string;
  stacked?: boolean;
}

export function ModernBarChart({ data, dataKeys, title, formatValue, stacked = false }: ModernBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg p-4 shadow-lg animate-in fade-in-0 zoom-in-95">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: { color: string; name: string; value: number }, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-bold" style={{ color: entry.color }}>
                {formatValue ? formatValue(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      {title && (
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          {title}
        </h3>
      )}
      
      <div className="h-80 animate-in fade-in-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              {GRADIENT_COLORS.map((color: { start: string; end: string }, index: number) => (
                <linearGradient key={index} id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color.start} />
                  <stop offset="100%" stopColor={color.end} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return String(value);
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
            {dataKeys.map((key: string, index: number) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`url(#barGradient-${index % GRADIENT_COLORS.length})`}
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
                animationEasing="ease-out"
                stackId={stacked ? 'stack' : undefined}
              >
                {data.map((_entry: { name: string; [key: string]: string | number }, idx: number) => (
                  <Cell
                    key={`cell-${idx}`}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
