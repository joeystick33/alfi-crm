'use client'
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DonutChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
    type?: string;
  }>;
  title?: string;
  height?: number;
}

const COLORS: Record<string, string> = {
  immobilier: '#0f4c81',
  financier: '#16a085',
  professionnel: '#e67e22',
  autre: '#9b59b6'
};

export default function DonutChart({ data, title, height = 300 }: DonutChartProps) {
  
  const chartData = data.map(item => ({
    name: item.label,
    value: item.value,
    color: item.color || COLORS[item.type || ''] || '#94a3b8'
  }));
  
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  
  const formatEuros = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const renderLabel = (entry: any) => {
    const percent = ((entry.value / total) * 100).toFixed(1);
    return `${percent}%`;
  };
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{ fontWeight: 600, color: '#1e293b', margin: '0 0 0.5rem 0' }}>
            {payload[0].name}
          </p>
          <p style={{ fontSize: '1.25rem', color: '#0f4c81', margin: '0 0 0.25rem 0', fontWeight: 700 }}>
            {formatEuros(payload[0].value)}
          </p>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            {((payload[0].value / total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };
  
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {payload.map((entry: any, index: number) => (
          <li key={index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem',
            borderRadius: '6px',
            transition: 'background-color 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{
              width: '16px',
              height: '16px',
              borderRadius: '3px',
              backgroundColor: entry.color,
              flexShrink: 0
            }} />
            <span style={{ flex: 1, color: '#475569', fontSize: '0.95rem' }}>
              {entry.value}
            </span>
            <span style={{ color: '#0f4c81', fontWeight: 600, fontSize: '0.95rem' }}>
              {formatEuros(chartData[index].value)}
            </span>
          </li>
        ))}
      </ul>
    );
  };
  
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      position: 'relative'
    }}>
      {title && <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: 600 }}>{title}</h3>}
      
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
      
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f4c81', lineHeight: 1 }}>
          {formatEuros(total)}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
          Total
        </div>
      </div>
    </div>
  );
}
