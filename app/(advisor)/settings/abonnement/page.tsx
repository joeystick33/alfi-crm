import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditCard, Check } from 'lucide-react'

export default function AbonnementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Abonnement & Quotas</h1>
        <p className="text-muted-foreground">Gérez votre abonnement et suivez vos quotas</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Plan actuel</h2>
            <p className="text-muted-foreground">Professionnel</p>
          </div>
          <Button>Changer de plan</Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <span>100 clients maximum</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <span>Tous les simulateurs</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <span>Support prioritaire</span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Utilisation des quotas</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Clients</span>
              <span className="text-sm font-medium">0 / 100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Stockage</span>
              <span className="text-sm font-medium">0 GB / 50 GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
