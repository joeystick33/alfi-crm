/**
 * ModernPieChart - Graphique en camembert moderne style Finary
 * Avec animations fluides, gradients et interactions
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useState } from 'react';

const GRADIENT_COLORS = [
  { start: '#667eea', end: '#764ba2' }, // Bleu-violet
  { start: '#f093fb', end: '#f5576c' }, // Rose
  { start: '#4facfe', end: '#00f2fe' }, // Cyan
  { start: '#43e97b', end: '#38f9d7' }, // Vert
  { start: '#fa709a', end: '#fee140' }, // Orange-rose
  { start: '#30cfd0', end: '#330867' }, // Bleu foncé
  { start: '#a8edea', end: '#fed6e3' }, // Pastel
  { start: '#ff9a9e', end: '#fecfef' }, // Rose clair
];

interface ModernPieChartProps {
  data: Array<{ name: string; value: number }>;
  formatValue?: (value: number) => string;
  title?: string;
}

export function ModernPieChart({ data, formatValue, title }: ModernPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string; total: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border rounded-lg p-4 shadow-lg animate-in fade-in-0 zoom-in-95">
          <p className="font-semibold mb-1">{data.name}</p>
          <p className="text-2xl font-bold" style={{ color: data.payload.fill }}>
            {formatValue ? formatValue(data.value) : data.value}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {((data.value / data.payload.total) * 100).toFixed(1)}% du total
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Ne pas afficher si < 5%

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-bold text-sm drop-shadow-lg"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Ajouter le total à chaque élément pour le tooltip
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const enrichedData = data.map((item) => ({ ...item, total }));

  return (
    <div className="relative">
      {title && (
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          {title}
        </h3>
      )}
      
      <div className="relative h-80 animate-in fade-in-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {GRADIENT_COLORS.map((color, index) => (
                <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={color.start} />
                  <stop offset="100%" stopColor={color.end} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={enrichedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={activeIndex !== null ? 110 : 100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {enrichedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#gradient-${index % GRADIENT_COLORS.length})`}
                  style={{
                    filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  strokeWidth={activeIndex === index ? 3 : 2}
                  stroke="white"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Centre du donut avec total */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-sm text-muted-foreground mb-1">Total</div>
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {formatValue ? formatValue(total) : total}
          </div>
        </div>
      </div>

      {/* Légende personnalisée moderne */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {enrichedData.map((entry, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${GRADIENT_COLORS[index % GRADIENT_COLORS.length].start}, ${GRADIENT_COLORS[index % GRADIENT_COLORS.length].end})`,
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{entry.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatValue ? formatValue(entry.value) : entry.value}
              </div>
            </div>
            <div className="text-sm font-semibold">
              {((entry.value / total) * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
