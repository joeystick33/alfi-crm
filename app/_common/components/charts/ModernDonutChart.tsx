"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CHART_COLORS = [
    { start: '#6E6EFF', end: '#4F46E5', solid: '#6E6EFF' }, // Indigo
    { start: '#10B981', end: '#059669', solid: '#10B981' }, // Emerald
    { start: '#F59E0B', end: '#D97706', solid: '#F59E0B' }, // Amber
    { start: '#EC4899', end: '#DB2777', solid: '#EC4899' }, // Pink
    { start: '#8B5CF6', end: '#7C3AED', solid: '#8B5CF6' }, // Violet
];

interface ModernDonutChartProps {
    data: Array<{ name: string; value: number;[key: string]: any }>;
    title?: string;
    formatValue?: (value: number) => string;
    colors?: string[]; // Custom colors
}

export function ModernDonutChart({ data, title, formatValue, colors }: ModernDonutChartProps) {

    const getGradientColors = (index: number) => {
        if (colors && colors[index % colors.length]) {
            return { start: colors[index % colors.length], end: colors[index % colors.length] };
        }
        return CHART_COLORS[index % CHART_COLORS.length];
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0F111A]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-xl">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
                        <span className="text-sm font-medium text-slate-200">{payload[0].name}</span>
                    </div>
                    <span className="text-lg font-bold text-slate-100 font-mono">
                        {formatValue ? formatValue(payload[0].value) : payload[0].value}
                    </span>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full relative" style={{ minHeight: 300 }}>
            {title && (
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 text-center">
                    {title}
                </h3>
            )}
            <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                    <defs>
                        {data.map((_, index) => {
                            const color = getGradientColors(index);
                            return (
                                <linearGradient key={index} id={`donutGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor={color.start} />
                                    <stop offset="100%" stopColor={color.end} />
                                </linearGradient>
                            );
                        })}
                    </defs>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={`url(#donutGradient-${index})`}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry: any) => (
                            <span className="text-sm font-medium text-slate-400 ml-2">{value}</span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Center Text (Total or Label) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

            </div>
        </div>
    );
}
