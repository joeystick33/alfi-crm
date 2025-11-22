'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Link2,
  Shield,
  BarChart3,
  Lightbulb,
  UserPlus,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/Tooltip';

/**
 * ServicesSidebar - Sidebar services droite FIXE
 * INNOVATION UNIQUE vs concurrents (inspiré Wealthcome)
 * Accès rapide aux services clés du CRM patrimonial
 */
export default function ServicesSidebar({
  className = '',
  contextualAction = null,
  collapsed: collapsedProp,
  onCollapsedChange,
  onExpandedChange,
  stats = {}
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(
    typeof collapsedProp === 'boolean' ? collapsedProp : true
  );
  const [isHovering, setIsHovering] = useState(false);

  const isControlled = typeof collapsedProp === 'boolean';
  const collapsed = isControlled ? collapsedProp : internalCollapsed;
  const isExpanded = !collapsed || isHovering;

  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  const handleToggleCollapsed = () => {
    const next = !collapsed;
    if (!isControlled) {
      setInternalCollapsed(next);
    }
    setIsHovering(false);
    onCollapsedChange?.(next);
  };

  const handleMouseEnter = () => {
    if (collapsed) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (collapsed) {
      setIsHovering(false);
    }
  };

  const normalizedStats = {
    actionsCRM: stats.actionsCRM ?? stats.actionsCrm ?? 0,
    documents: stats.documents ?? 0,
    conformiteAlerts: stats.conformiteAlerts ?? 0,
    suggestions: stats.suggestions ?? 0,
    reclamations: stats.reclamations ?? 0,
  };

  const formatBadge = (value) => (value && value > 0 ? String(value) : null);

  const serviceGroups = [
    {
      id: 'operations',
      title: 'Opérations quotidiennes',
      caption: 'Accès rapide aux actions terrain',
      items: [
        {
          id: 'actions-crm',
          name: 'Actions CRM',
          shortLabel: 'CRM',
          description: 'Tâches, rappels et campagnes à traiter',
          icon: UserPlus,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          href: '/dashboard/taches',
          badge: formatBadge(normalizedStats.actionsCRM)
        },
        {
          id: 'aggregation',
          name: 'Agrégation',
          shortLabel: 'Agrég.',
          description: 'Connexion aux comptes externes et flux bancaires',
          icon: Link2,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          href: '/dashboard/clients',
          badge: null
        },
        {
          id: 'documents',
          name: 'Documents & GED',
          shortLabel: 'Docs',
          description: 'Modèles officiels, GED et signature',
          icon: FileText,
          color: 'text-slate-600',
          bgColor: 'bg-slate-50',
          href: '/dashboard/documents',
          badge: formatBadge(normalizedStats.documents)
        }
      ]
    },
    {
      id: 'pilotage',
      title: 'Pilotage & conformité',
      caption: 'Suivi des indicateurs clés cabinet',
      items: [
        {
          id: 'pilotage',
          name: 'Pilotage cabinet',
          shortLabel: 'Pilotage',
          description: 'KPIs temps réel et tableaux de bord analytics',
          icon: BarChart3,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          href: '/dashboard/analytics',
          badge: null
        },
        {
          id: 'compliance',
          name: 'Conformité & KYC',
          shortLabel: 'CCF',
          description: 'Contrôles réglementaires, KYC, MIFID et LCB-FT',
          icon: Shield,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          href: '/dashboard/conformite',
          badge: formatBadge(normalizedStats.conformiteAlerts)
        },
        {
          id: 'suggestions',
          name: 'Suggestions IA',
          shortLabel: 'IA',
          description: 'Opportunités détectées automatiquement',
          icon: Lightbulb,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          href: '/dashboard/opportunities',
          badge: formatBadge(normalizedStats.suggestions)
        }
      ]
    }
  ];

  return (
    <div
      className={`fixed top-16 right-0 bottom-0 z-30 transition-all duration-300 ${
        isExpanded ? 'w-[22rem]' : 'w-[4.75rem]'
      } ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Bouton collapse/expand */}
      <button
        onClick={handleToggleCollapsed}
        className="absolute -left-3 top-6 z-40 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
        aria-label={collapsed ? 'Étendre' : 'Réduire'}
      >
        {collapsed ? (
          <ChevronLeft className="w-3 h-3 text-slate-600" />
        ) : (
          <ChevronRight className="w-3 h-3 text-slate-600" />
        )}
      </button>

      {/* Container principal */}
      <div className="h-full glass-effect border-l border-slate-200/60 overflow-y-auto">
        <div className="p-4 space-y-3">
          {/* Header */}
          {isExpanded ? (
            <div className="space-y-6">
              {serviceGroups.map((group) => (
                <div key={group.id} className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {group.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {group.caption}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((service) => {
                      const Icon = service.icon;
                      return (
                        <a
                          key={service.id}
                          href={service.href}
                          className="group block"
                        >
                          <Card className="border-slate-200/60 hover:border-slate-300/80 transition-all duration-200 p-3 hover:shadow-lg">
                            <div className="flex items-start gap-3">
                              <div className={`${service.bgColor} p-2 rounded-lg transition-transform group-hover:scale-110`}>
                                <Icon className={`w-4 h-4 ${service.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-slate-950">
                                      {service.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                      {service.description}
                                    </p>
                                  </div>
                                  {service.badge && (
                                    <Badge variant="destructive" className="text-[11px] px-2">
                                      {service.badge}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 pt-3">
              {serviceGroups.map((group, groupIndex) => (
                <div key={group.id} className="flex flex-col items-center gap-3">
                  {group.items.map((service) => {
                    const Icon = service.icon;
                    return (
                      <TooltipProvider key={service.id} delayDuration={120}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={service.href}
                              className="group flex flex-col items-center gap-1 rounded-2xl border border-transparent px-2.5 py-2 hover:border-slate-200/80 hover:bg-white/60 transition-all"
                            >
                              <div className={`${service.bgColor} p-2 rounded-lg transition-transform group-hover:scale-110`}>
                                <Icon className={`w-4 h-4 ${service.color}`} />
                              </div>
                              <span className="text-[10px] font-semibold text-slate-500 tracking-wide">
                                {service.shortLabel || service.name}
                              </span>
                              {service.badge && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  {service.badge}
                                </Badge>
                              )}
                            </a>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`${service.bgColor} p-1.5 rounded-lg`}>
                                <Icon className={`w-3.5 h-3.5 ${service.color}`} />
                              </div>
                              <span className="font-semibold text-sm">{service.name}</span>
                            </div>
                            <p className="text-xs text-slate-100/90 leading-relaxed">
                              {service.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                  {groupIndex < serviceGroups.length - 1 && (
                    <div className="h-px w-8 bg-slate-200/70"></div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CTA Contextuel */}
          {isExpanded && contextualAction && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <Button
                onClick={contextualAction.onClick}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {contextualAction.icon && <contextualAction.icon className="w-4 h-4 mr-2" />}
                {contextualAction.label}
              </Button>
            </div>
          )}

          {/* Info footer (collapsed) */}
          {isExpanded && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Système opérationnel
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
