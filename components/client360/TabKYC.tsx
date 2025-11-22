'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Download,
  Upload
} from 'lucide-react'

interface TabKYCProps {
  clientId: string
}

export function TabKYC({ clientId }: TabKYCProps) {
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'expired'>('pending')

  const kycDocuments = [
    { id: 1, name: 'Pièce d\'identité', status: 'verified', date: '2024-01-15' },
    { id: 2, name: 'Justificatif de domicile', status: 'verified', date: '2024-01-15' },
    { id: 3, name: 'Avis d\'imposition', status: 'pending', date: null },
    { id: 4, name: 'RIB', status: 'verified', date: '2024-01-15' },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Vérifié</Badge>
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />En attente</Badge>
      case 'expired':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Expiré</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Statut KYC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Statut global</p>
              {getStatusBadge(kycStatus)}
            </div>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Ajouter un document
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents KYC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kycDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    {doc.date && (
                      <p className="text-sm text-muted-foreground">
                        Vérifié le {new Date(doc.date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(doc.status)}
                  {doc.status === 'verified' && (
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations réglementaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Profil investisseur</p>
              <p className="text-sm text-muted-foreground">Équilibré</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Catégorie MIF</p>
              <p className="text-sm text-muted-foreground">Client de détail</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Dernière mise à jour</p>
              <p className="text-sm text-muted-foreground">15 janvier 2024</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
