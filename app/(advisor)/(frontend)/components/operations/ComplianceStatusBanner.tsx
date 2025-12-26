"use client"

/**
 * Composant ComplianceStatusBanner
 * 
 * Affiche le statut de conformité d'un client lors de la création d'opération.
 * Bloque si non conforme avec message explicatif et propose les actions correctives.
 * 
 * @module app/(advisor)/(frontend)/components/operations/ComplianceStatusBanner
 * @requirements 25.1-25.3
 */

import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { cn } from '@/app/_common/lib/utils'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  FileText,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

// ============================================================================
// Types
// ============================================================================

interface ComplianceIssue {
  type: string
  severity: 'LOW' | 'WARNING' | 'HIGH' | 'CRITICAL'
  description: string
  actionRequired: string
  actionUrl: string
}

interface CorrectiveAction {
  action: string
  url: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface ComplianceCheckResult {
  isCompliant: boolean
  kycStatus: 'VALID' | 'INCOMPLETE' | 'EXPIRED'
  mifidStatus: 'VALID' | 'MISSING' | 'OUTDATED'
  lcbftStatus: 'CLEAR' | 'PENDING_REVIEW' | 'HIGH_RISK'
  issues: ComplianceIssue[]
  correctiveActions: CorrectiveAction[]
}

interface ComplianceStatusBannerProps {
  clientId: string
  onComplianceChange?: (isCompliant: boolean) => void
  className?: string
}

// ============================================================================
// API Hook
// ============================================================================

function useComplianceCheck(clientId: string) {
  return useQuery<{ data: ComplianceCheckResult }>({
    queryKey: ['compliance-check', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/compliance/check?clientId=${clientId}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification de conformité')
      }
      return response.json()
    },
    enabled: !!clientId,
    staleTime: 30000, // 30 seconds
  })
}

// ============================================================================
// Sub-components
// ============================================================================

function StatusIndicator({
  label,
  status,
  statusLabel,
}: {
  label: string
  status: 'valid' | 'warning' | 'error'
  statusLabel: string
}) {
  const Icon = status === 'valid' ? CheckCircle2 : status === 'warning' ? AlertTriangle : XCircle
  const colorClass = status === 'valid' 
    ? 'text-emerald-600' 
    : status === 'warning' 
      ? 'text-amber-600' 
      : 'text-rose-600'

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', colorClass)} />
        <span className={cn('text-sm font-medium', colorClass)}>{statusLabel}</span>
      </div>
    </div>
  )
}

function CorrectiveActionItem({ action }: { action: CorrectiveAction }) {
  const priorityColors = {
    HIGH: 'bg-rose-100 text-rose-700 border-rose-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW: 'bg-gray-100 text-gray-700 border-gray-200',
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        <Badge 
          variant="default" 
          size="xs"
          className={priorityColors[action.priority]}
        >
          {action.priority === 'HIGH' ? 'Urgent' : action.priority === 'MEDIUM' ? 'Important' : 'Optionnel'}
        </Badge>
        <span className="text-sm text-gray-700">{action.action}</span>
      </div>
      <Link href={action.url}>
        <Button variant="ghost" size="sm" className="gap-1 text-[#7373FF]">
          Résoudre
          <ExternalLink className="h-3 w-3" />
        </Button>
      </Link>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ComplianceStatusBanner({
  clientId,
  onComplianceChange,
  className,
}: ComplianceStatusBannerProps) {
  const [showDetails, setShowDetails] = useState(false)
  const { data, isLoading, error } = useComplianceCheck(clientId)

  // Notify parent of compliance status changes
  const complianceData = data?.data
  if (complianceData && onComplianceChange) {
    onComplianceChange(complianceData.isCompliant)
  }

  if (isLoading) {
    return (
      <div className={cn('p-4 rounded-lg border border-gray-200 bg-gray-50', className)}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !complianceData) {
    return (
      <div className={cn('p-4 rounded-lg border border-amber-200 bg-amber-50', className)}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">Vérification impossible</p>
            <p className="text-sm text-amber-700">
              Impossible de vérifier la conformité du client. Veuillez réessayer.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { isCompliant, kycStatus, mifidStatus, lcbftStatus, issues, correctiveActions } = complianceData

  // Determine KYC status display
  const kycStatusDisplay = {
    status: kycStatus === 'VALID' ? 'valid' : kycStatus === 'INCOMPLETE' ? 'warning' : 'error',
    label: kycStatus === 'VALID' ? 'Valide' : kycStatus === 'INCOMPLETE' ? 'Incomplet' : 'Expiré',
  } as const

  // Determine MiFID status display
  const mifidStatusDisplay = {
    status: mifidStatus === 'VALID' ? 'valid' : mifidStatus === 'OUTDATED' ? 'warning' : 'error',
    label: mifidStatus === 'VALID' ? 'À jour' : mifidStatus === 'OUTDATED' ? 'Obsolète' : 'Manquant',
  } as const

  // Determine LCB-FT status display
  const lcbftStatusDisplay = {
    status: lcbftStatus === 'CLEAR' ? 'valid' : lcbftStatus === 'PENDING_REVIEW' ? 'warning' : 'error',
    label: lcbftStatus === 'CLEAR' ? 'OK' : lcbftStatus === 'PENDING_REVIEW' ? 'À vérifier' : 'Risque élevé',
  } as const

  const hasBlockingIssues = issues.some(i => i.severity === 'HIGH' || i.severity === 'CRITICAL')

  return (
    <div className={cn(
      'rounded-lg border overflow-hidden',
      isCompliant 
        ? 'border-emerald-200 bg-emerald-50' 
        : hasBlockingIssues
          ? 'border-rose-200 bg-rose-50'
          : 'border-amber-200 bg-amber-50',
      className
    )}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isCompliant 
              ? 'bg-emerald-100' 
              : hasBlockingIssues
                ? 'bg-rose-100'
                : 'bg-amber-100'
          )}>
            <Shield className={cn(
              'h-5 w-5',
              isCompliant 
                ? 'text-emerald-600' 
                : hasBlockingIssues
                  ? 'text-rose-600'
                  : 'text-amber-600'
            )} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className={cn(
                'font-semibold',
                isCompliant 
                  ? 'text-emerald-900' 
                  : hasBlockingIssues
                    ? 'text-rose-900'
                    : 'text-amber-900'
              )}>
                {isCompliant 
                  ? 'Client conforme' 
                  : hasBlockingIssues
                    ? 'Client non conforme - Opération bloquée'
                    : 'Attention requise'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="gap-1"
              >
                {showDetails ? 'Masquer' : 'Détails'}
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            <p className={cn(
              'text-sm mt-1',
              isCompliant 
                ? 'text-emerald-700' 
                : hasBlockingIssues
                  ? 'text-rose-700'
                  : 'text-amber-700'
            )}>
              {isCompliant 
                ? 'Tous les contrôles de conformité sont validés. Vous pouvez procéder à l\'opération.'
                : hasBlockingIssues
                  ? 'Des problèmes de conformité bloquent la création de cette opération. Veuillez les résoudre avant de continuer.'
                  : 'Certains éléments nécessitent votre attention mais ne bloquent pas l\'opération.'}
            </p>
          </div>
        </div>
      </div>

      {/* Details Section */}
      {showDetails && (
        <div className="border-t border-gray-200 bg-white p-4 space-y-4">
          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase">KYC</span>
              </div>
              <StatusIndicator
                label=""
                status={kycStatusDisplay.status}
                statusLabel={kycStatusDisplay.label}
              />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase">MiFID</span>
              </div>
              <StatusIndicator
                label=""
                status={mifidStatusDisplay.status}
                statusLabel={mifidStatusDisplay.label}
              />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase">LCB-FT</span>
              </div>
              <StatusIndicator
                label=""
                status={lcbftStatusDisplay.status}
                statusLabel={lcbftStatusDisplay.label}
              />
            </div>
          </div>

          {/* Issues List */}
          {issues.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Problèmes détectés ({issues.length})
              </h4>
              <div className="space-y-2">
                {issues.map((issue, index) => (
                  <div
                    key={index}
                    className={cn(
                      'p-3 rounded-lg border',
                      issue.severity === 'CRITICAL' || issue.severity === 'HIGH'
                        ? 'bg-rose-50 border-rose-200'
                        : 'bg-amber-50 border-amber-200'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {issue.severity === 'CRITICAL' || issue.severity === 'HIGH' ? (
                        <XCircle className="h-4 w-4 text-rose-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      )}
                      <div>
                        <p className={cn(
                          'text-sm font-medium',
                          issue.severity === 'CRITICAL' || issue.severity === 'HIGH'
                            ? 'text-rose-900'
                            : 'text-amber-900'
                        )}>
                          {issue.description}
                        </p>
                        <p className={cn(
                          'text-xs mt-1',
                          issue.severity === 'CRITICAL' || issue.severity === 'HIGH'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        )}>
                          Action: {issue.actionRequired}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Corrective Actions */}
          {correctiveActions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Actions correctives suggérées
              </h4>
              <div className="space-y-2">
                {correctiveActions.map((action, index) => (
                  <CorrectiveActionItem key={index} action={action} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ComplianceStatusBanner
