'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { apiCall } from '@/lib/api-client';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function KYCWidget({ presentationMode = false }) {
  const [stats, setStats] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKYCData();
  }, []);

  const loadKYCData = async () => {
    try {
      setLoading(true);
      const [statsData, expiringData] = await Promise.all([
        apiCall('/api/advisor/kyc?stats=true'),
        apiCall('/api/advisor/kyc?expiring=true')
      ]);
      setStats(statsData);
      setExpiring(expiringData.kyc || []);
    } catch (error) {
      console.error('Erreur chargement KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cobalt" />
            KYC & Conformité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-cobalt border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (presentationMode) {
    return (
      <Card className="border-chambray/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-peacoat">
            <Shield className="h-5 w-5 text-cobalt" />
            Conformité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-sm text-slate-500">
            Informations masquées en Mode Présentation
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-chambray/20 hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cobalt" />
            <span className="text-peacoat">KYC & Conformité</span>
          </div>
          <Badge 
            className={cn(
              "text-xs",
              stats?.complianceRate >= 90 
                ? "bg-emerald-500" 
                : stats?.complianceRate >= 70 
                  ? "bg-orange-500" 
                  : "bg-red-500"
            )}
          >
            {stats?.complianceRate || 0}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats globales */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-lg bg-emerald-50 border border-emerald-200"
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Conformes</span>
            </div>
            <p className="text-2xl font-bold text-emerald-900">{stats?.compliant || 0}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-lg bg-orange-50 border border-orange-200"
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-700">Incomplets</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">{stats?.incomplete || 0}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-lg bg-red-50 border border-red-200"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-red-700">Expirés</span>
            </div>
            <p className="text-2xl font-bold text-red-900">{stats?.expired || 0}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-lg bg-slate-50 border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-700">Total</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats?.total || 0}</p>
          </motion.div>
        </div>

        {/* Documents expirant bientôt */}
        {expiring.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-peacoat flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Documents expirant (30j)
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {expiring.slice(0, 5).map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-orange-50/50 hover:bg-orange-50 transition-colors border border-orange-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {item.particulierId?.firstName} {item.particulierId?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.identity?.status === 'expiring_soon' && 'Pièce d\'identité'}
                      {item.mifid?.status === 'expiring_soon' && 'Questionnaire MIFID'}
                      {item.mandate?.status === 'expiring_soon' && 'Mandat'}
                    </p>
                  </div>
                  <Link href={`/dashboard/clients/${item.particulierId?._id}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Progress bar conformité */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Taux de conformité</span>
            <span className="font-semibold text-cobalt">{stats?.complianceRate || 0}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats?.complianceRate || 0}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                stats?.complianceRate >= 90 
                  ? "bg-emerald-500" 
                  : stats?.complianceRate >= 70 
                    ? "bg-orange-500" 
                    : "bg-red-500"
              )}
            />
          </div>
        </div>

        {/* CTA */}
        <Link href="/dashboard/documents">
          <Button 
            className="w-full bg-gradient-to-r from-cobalt to-chambray hover:from-cobalt-light hover:to-chambray-light text-white"
            size="sm"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Voir tous les dossiers
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
