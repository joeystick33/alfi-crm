'use client';

import { Users, Euro, Target, Calendar } from 'lucide-react';
import KPICard from './KPICard';
import { formatCurrency } from '@/lib/utils';

export default function QuickStats({ data, loading, onCardClick }) {
  const stats = [
    {
      id: 'revenue',
      title: 'CA du Mois',
      value: formatCurrency(data?.revenue?.total || 0),
      evolution: data?.revenue?.evolution || 0,
      evolutionType: (data?.revenue?.evolution || 0) >= 0 ? 'positive' : 'negative',
      subtitle: `Objectif: ${formatCurrency(data?.revenue?.target || 0)}`,
      icon: Euro,
      onClick: () => onCardClick?.('revenue'),
    },
    {
      id: 'projects',
      title: 'Projets Actifs',
      value: data?.projects?.active || 0,
      subtitle: data?.projects?.details || '',
      icon: Target,
      badge: data?.projects?.urgent || 0,
      onClick: () => onCardClick?.('projects'),
    },
    {
      id: 'appointments',
      title: 'RDV Semaine',
      value: data?.appointments?.week || 0,
      subtitle: `Aujourd'hui: ${data?.appointments?.today || 0}`,
      icon: Calendar,
      badge: data?.appointments?.today || 0,
      onClick: () => onCardClick?.('appointments'),
    },
    {
      id: 'clients',
      title: 'Clients Actifs',
      value: data?.clients?.total || 0,
      evolution: data?.clients?.new || 0,
      evolutionType: 'positive',
      subtitle: `${data?.clients?.prospects || 0} prospects`,
      icon: Users,
      onClick: () => onCardClick?.('clients'),
    },
  ];

  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      role="region"
      aria-label="Statistiques rapides"
      aria-live="polite"
      aria-busy={loading}
    >
      {stats.map((stat) => (
        <KPICard key={stat.id} {...stat} loading={loading} />
      ))}
    </div>
  );
}
