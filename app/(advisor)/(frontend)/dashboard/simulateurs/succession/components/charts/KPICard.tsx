'use client'
import React from 'react';

interface KPICardProps {
  icon?: string;
  label: string;
  value: string;
  subValue?: string;
  color?: 'primary' | 'warning' | 'success' | 'info';
  badge?: string;
  trend?: 'up' | 'down';
}

const colorMap = {
  primary: '#0f4c81',
  warning: '#e67e22',
  success: '#16a085',
  info: '#3498db'
};

export default function KPICard({ 
  icon, 
  label, 
  value, 
  subValue, 
  color = 'primary', 
  badge, 
  trend 
}: KPICardProps) {
  const mainColor = colorMap[color];
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
      borderLeft: `5px solid ${mainColor}`
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
    }}
    >
      {badge && (
        <span style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          backgroundColor: mainColor,
          color: 'white',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          {badge}
        </span>
      )}
      
      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{
          fontSize: '0.85rem',
          color: '#64748b',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {label}
        </div>
      </div>
      
      <div style={{
        fontSize: '2rem',
        fontWeight: 700,
        color: '#1e293b',
        margin: '0.5rem 0',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {value}
        {trend && (
          <span style={{
            fontSize: '1rem',
            color: trend === 'up' ? '#16a085' : '#e74c3c'
          }}>
            {trend === 'up' ? '↗' : '↘'}
          </span>
        )}
      </div>
      
      {subValue && (
        <div style={{
          fontSize: '0.875rem',
          color: '#64748b',
          marginTop: '0.25rem'
        }}>
          {subValue}
        </div>
      )}
    </div>
  );
}
