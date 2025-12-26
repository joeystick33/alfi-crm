'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card';
import { Badge } from '@/app/_common/components/ui/Badge';
import { Button } from '@/app/_common/components/ui/Button';
import { 
  Megaphone,
  Mail,
  MessageSquare,
  Phone,
  Play,
  Pause,
  Eye,
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { apiCall } from '@/app/_common/lib/api-client';
import { useRouter } from 'next/navigation';

export default function CampaignsWidget({ maxCampaigns = 3 }) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaigns, setActiveCampaigns] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, [maxCampaigns]);

  const loadCampaigns = async () => {
    try {
      const data = await apiCall(`/api/advisor/campaigns?status=EN_COURS,PROGRAMMEE&limit=${maxCampaigns}`);
      setCampaigns(data.campaigns || []);
      setActiveCampaigns(data.campaigns?.filter(c => c.status === 'EN_COURS').length || 0);
    } catch (error) {
      console.error('Erreur chargement campagnes:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseCampaign = async (campaignId, e) => {
    e.stopPropagation();
    setActionLoading(campaignId);
    try {
      await apiCall(`/api/advisor/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'PAUSE' })
      });
      await loadCampaigns();
    } catch (error) {
      console.error('Erreur pause campagne:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeCampaign = async (campaignId, e) => {
    e.stopPropagation();
    setActionLoading(campaignId);
    try {
      await apiCall(`/api/advisor/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'EN_COURS' })
      });
      await loadCampaigns();
    } catch (error) {
      console.error('Erreur reprise campagne:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeConfig = (type) => {
    const configs = {
      'EMAIL': {
        label: 'Email',
        icon: Mail,
        color: 'text-blue-600 bg-blue-100'
      },
      'SMS': {
        label: 'SMS',
        icon: MessageSquare,
        color: 'text-green-600 bg-green-100'
      },
      'PHONE': {
        label: 'Téléphone',
        icon: Phone,
        color: 'text-purple-600 bg-purple-100'
      },
      'MULTI_CANAL': {
        label: 'Multi-canal',
        icon: Megaphone,
        color: 'text-orange-600 bg-orange-100'
      }
    };
    return configs[type] || configs.EMAIL;
  };

  const getStatusConfig = (status) => {
    const configs = {
      'BROUILLON': {
        label: 'Brouillon',
        color: 'bg-gray-100 text-gray-700',
        icon: Clock
      },
      'PROGRAMMEE': {
        label: 'Programmée',
        color: 'bg-blue-100 text-blue-700',
        icon: Clock
      },
      'EN_COURS': {
        label: 'En cours',
        color: 'bg-green-100 text-green-700',
        icon: Play
      },
      'TERMINEE': {
        label: 'Terminée',
        color: 'bg-slate-100 text-slate-700',
        icon: CheckCircle
      },
      'PAUSE': {
        label: 'En pause',
        color: 'bg-amber-100 text-amber-700',
        icon: Pause
      },
      'ANNULEE': {
        label: 'Annulée',
        color: 'bg-red-100 text-red-700',
        icon: AlertCircle
      }
    };
    return configs[status] || configs.BROUILLON;
  };

  const calculateProgress = (campaign) => {
    if (!campaign.metrics || !campaign.recipients?.totalCount) return 0;
    const total = campaign.recipients.totalCount;
    const sent = campaign.metrics.sent || 0;
    return Math.round((sent / total) * 100);
  };

  const formatMetric = (value) => {
    if (value === undefined || value === null) return '0%';
    return `${Math.round(value)}%`;
  };

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Démarrée';
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Demain';
    if (diffDays <= 7) return `Dans ${diffDays}j`;
    
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Megaphone className="h-5 w-5 text-purple-600" />
            Campagnes
          </CardTitle>
          {activeCampaigns > 0 && (
            <Badge variant="default" className="bg-green-100 text-green-700">
              {activeCampaigns} active{activeCampaigns > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8">
            <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600 font-medium">
              Aucune campagne active
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Créez une campagne pour communiquer avec vos clients
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/dashboard/campaigns/new')}
            >
              Créer une campagne
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => {
              const typeConfig = getTypeConfig(campaign.type);
              const statusConfig = getStatusConfig(campaign.status);
              const TypeIcon = typeConfig.icon;
              const StatusIcon = statusConfig.icon;
              const progress = calculateProgress(campaign);
              const scheduledDate = formatDate(campaign.scheduling?.scheduledDate);
              const canPause = campaign.status === 'EN_COURS';
              const canResume = campaign.status === 'PAUSE';

              return (
                <div
                  key={campaign._id}
                  className="p-4 rounded-lg border border-slate-200 bg-white hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/dashboard/campaigns/${campaign._id}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {campaign.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {typeConfig.label}
                          </Badge>
                          <Badge className={`text-xs ${statusConfig.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          {scheduledDate && campaign.status === 'PROGRAMMEE' && (
                            <span className="text-xs text-slate-600">
                              {scheduledDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {canPause && (
                        <button
                          className="p-1.5 hover:bg-amber-100 rounded transition-colors"
                          onClick={(e) => handlePauseCampaign(campaign._id, e)}
                          disabled={actionLoading === campaign._id}
                          title="Mettre en pause"
                        >
                          <Pause className="h-4 w-4 text-amber-600" />
                        </button>
                      )}
                      {canResume && (
                        <button
                          className="p-1.5 hover:bg-green-100 rounded transition-colors"
                          onClick={(e) => handleResumeCampaign(campaign._id, e)}
                          disabled={actionLoading === campaign._id}
                          title="Reprendre"
                        >
                          <Play className="h-4 w-4 text-green-600" />
                        </button>
                      )}
                      <button
                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/campaigns/${campaign._id}`);
                        }}
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4 text-slate-600" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                        <Users className="h-3 w-3" />
                        <span className="text-xs">Cibles</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {campaign.recipients?.totalCount || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                        <Target className="h-3 w-3" />
                        <span className="text-xs">Ouverture</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatMetric(campaign.metrics?.openRate)}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs">Clic</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatMetric(campaign.metrics?.clickRate)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {campaign.status === 'EN_COURS' && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>Progression</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                        <span>{campaign.metrics?.sent || 0} envoyés</span>
                        <span>{campaign.recipients?.totalCount || 0} total</span>
                      </div>
                    </div>
                  )}

                  {/* Next Action */}
                  {campaign.nextAction && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 text-xs text-blue-700">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">
                          {campaign.nextAction.count} action{campaign.nextAction.count > 1 ? 's' : ''} à venir
                        </span>
                        {campaign.nextAction.dueDate && (
                          <span>• {formatDate(campaign.nextAction.dueDate)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* View All Button */}
        {!loading && campaigns.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => router.push('/dashboard/campaigns')}
          >
            Voir toutes les campagnes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
