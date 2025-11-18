import { Card } from '@/components/ui/Card'
import { Mail } from 'lucide-react'

export default function EmailsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Boîte email</h1>
        <p className="text-muted-foreground">Gmail / Outlook synchronisé</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Synchronisation email</h3>
          <p className="text-muted-foreground">
            Connectez votre boîte email pour centraliser vos communications
          </p>
        </div>
      </Card>
    </div>
  )
}
