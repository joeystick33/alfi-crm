'use client'
import React from 'react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from 'recharts';

interface BarChartProps {
  data: Array<{
    label: string;
    droitsSuccession: number;
    transmissionNette: number;
    actifSuccessoral?: number;
  }>;
  title?: string;
  height?: number;
}

export default function BarChart({ data, title, height = 350 }: BarChartProps) {
  
  const chartData = data.map(item => ({
    name: item.label,
    droits: item.droitsSuccession,
    transmission: item.transmissionNette,
    total: item.actifSuccessoral || item.droitsSuccession + item.transmissionNette
  }));
  
  const formatEuros = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k€`;
    return `${value}€`;
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{label}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#e74c3c' }} />
            <span>Droits : {formatEuros(payload[0].value)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#16a085' }} />
            <span>Transmission nette : {formatEuros(payload[1].value)}</span>
          </div>
          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0', fontWeight: 600 }}>
            Total : {formatEuros(payload[0].payload.total)}
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    }}>
      {title && <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: 600 }}>{title}</h3>}
      
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart 
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#64748b', fontSize: 14 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis 
            tickFormatter={formatYAxis}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15, 76, 129, 0.05)' }} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          
          <Bar 
            dataKey="droits" 
            name="Droits de succession"
            fill="#e74c3c"
            radius={[8, 8, 0, 0]}
            animationBegin={0}
            animationDuration={800}
          />
          
          <Bar 
            dataKey="transmission" 
            name="Transmission nette"
            fill="#16a085"
            radius={[8, 8, 0, 0]}
            animationBegin={200}
            animationDuration={800}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
