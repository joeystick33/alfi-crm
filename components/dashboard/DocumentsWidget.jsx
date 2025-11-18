'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  FileText, 
  Upload, 
  Download,
  Eye,
  FileSignature,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  HardDrive,
  Search,
  Filter
} from 'lucide-react';
import { apiCall } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export default function DocumentsWidget({ maxDocuments = 5, showStats = true }) {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    pendingSignatures: 0,
    expiringSoon: 0,
    storageUsed: 0,
    storageLimit: 1000 // 1GB default
  });
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [maxDocuments]);

  const loadDocuments = async () => {
    try {
      const data = await apiCall(`/api/advisor/widgets/documents?limit=${maxDocuments}`);
      setDocuments(data.documents || []);
      
      // Calculate stats from documents
      const pending = data.documents?.filter(d => d.status === 'PENDING' && d.requiresSignature).length || 0;
      const expiring = data.documents?.filter(d => {
        if (!d.dueDate) return false;
        const daysUntil = Math.ceil((new Date(d.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 7 && daysUntil >= 0;
      }).length || 0;
      
      setStats({
        totalDocuments: data.total || 0,
        pendingSignatures: pending,
        expiringSoon: expiring,
        storageUsed: 0, // Would come from API
        storageLimit: 1000
      });
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'PENDING': {
        label: 'En attente',
        color: 'bg-amber-100 text-amber-700',
        icon: Clock
      },
      'MISSING': {
        label: 'Manquant',
        color: 'bg-red-100 text-red-700',
        icon: AlertCircle
      },
      'REJECTED': {
        label: 'Rejeté',
        color: 'bg-red-100 text-red-700',
        icon: XCircle
      },
      'COMPLETED': {
        label: 'Complété',
        color: 'bg-green-100 text-green-700',
        icon: CheckCircle
      },
      'SIGNED': {
        label: 'Signé',
        color: 'bg-blue-100 text-blue-700',
        icon: FileSignature
      }
    };
    return configs[status] || configs.PENDING;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      'HAUTE': {
        color: 'border-red-300 bg-red-50',
        badge: 'destructive'
      },
      'MOYENNE': {
        color: 'border-orange-300 bg-orange-50',
        badge: 'warning'
      },
      'NORMALE': {
        color: 'border-slate-300 bg-slate-50',
        badge: 'secondary'
      }
    };
    return configs[priority] || configs.NORMALE;
  };

  const getTypeLabel = (type) => {
    const labels = {
      'CONTRACT': 'Contrat',
      'KYC': 'KYC',
      'REPORT': 'Rapport',
      'CORRESPONDENCE': 'Correspondance',
      'ADMINISTRATIVE': 'Administratif',
      'OTHER': 'Autre'
    };
    return labels[type] || type;
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Handle file upload
      console.log('Files dropped:', e.dataTransfer.files);
      // TODO: Implement upload logic
    }
  }, []);

  const handleFileInput = useCallback(async (e) => {
    if (e.target.files && e.target.files[0]) {
      // Handle file upload
      console.log('Files selected:', e.target.files);
      // TODO: Implement upload logic
    }
  }, []);

  const formatStorageSize = (mb) => {
    if (mb < 1) return `${Math.round(mb * 1024)} KB`;
    if (mb < 1024) return `${Math.round(mb)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const storagePercentage = (stats.storageUsed / stats.storageLimit) * 100;

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <FileText className="h-5 w-5 text-blue-600" />
            Documents
          </CardTitle>
          <div className="flex items-center gap-2">
            {stats.pendingSignatures > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <FileSignature className="h-3 w-3" />
                {stats.pendingSignatures}
              </Badge>
            )}
            {stats.expiringSoon > 0 && (
              <Badge variant="warning" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {stats.expiringSoon}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Storage Stats */}
        {showStats && (
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-blue-700" />
                <span className="text-xs text-blue-700 font-medium">Stockage</span>
              </div>
              <span className="text-xs text-blue-900 font-semibold">
                {formatStorageSize(stats.storageUsed)} / {formatStorageSize(stats.storageLimit)}
              </span>
            </div>
            <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-blue-700">
              <span>{stats.totalDocuments} documents</span>
              <span>{Math.round(storagePercentage)}% utilisé</span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Drag & Drop Upload Zone */}
        <div
          className={`mb-4 p-4 border-2 border-dashed rounded-lg transition-all ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 font-medium mb-1">
              Glissez vos fichiers ici
            </p>
            <p className="text-xs text-slate-500 mb-2">
              ou
            </p>
            <label htmlFor="file-upload">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => document.getElementById('file-upload').click()}
              >
                Parcourir
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600 font-medium">
              Aucun document en attente
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Les documents nécessitant une action apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const statusConfig = getStatusConfig(doc.status);
              const priorityConfig = getPriorityConfig(doc.priority);
              const StatusIcon = statusConfig.icon;
              const isUrgent = doc.priority === 'HAUTE' || (doc.dueLabel && doc.dueLabel.includes('Expiré'));

              return (
                <div
                  key={doc.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${priorityConfig.color}`}
                  onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <FileText className="h-4 w-4 text-slate-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {doc.name}
                        </p>
                        {doc.client && (
                          <p className="text-xs text-slate-600">
                            {doc.client.firstName} {doc.client.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Preview
                        }}
                      >
                        <Eye className="h-4 w-4 text-slate-600" />
                      </button>
                      <button
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Download
                        }}
                      >
                        <Download className="h-4 w-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(doc.type)}
                    </Badge>
                    <Badge className={`text-xs ${statusConfig.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                    {isUrgent && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                  </div>
                  
                  {/* Due Date */}
                  {doc.dueLabel && (
                    <div className={`flex items-center gap-1 text-xs ${
                      doc.dueLabel.includes('Expiré') ? 'text-red-600 font-medium' : 'text-slate-600'
                    }`}>
                      <Clock className="h-3 w-3" />
                      <span>{doc.dueLabel}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Actions */}
        {!loading && documents.length > 0 && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => router.push('/dashboard/documents')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Tous les documents
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => router.push('/dashboard/documents?filter=pending-signature')}
            >
              <FileSignature className="h-4 w-4 mr-2" />
              À signer ({stats.pendingSignatures})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
