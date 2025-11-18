import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { User, Save } from 'lucide-react'

export default function ProfilPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mon profil</h1>
        <p className="text-muted-foreground">Informations personnelles et mot de passe</p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Informations personnelles</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nom complet</label>
            <input 
              type="text" 
              className="w-full mt-1 px-3 py-2 border rounded-md"
              placeholder="Votre nom"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input 
              type="email" 
              className="w-full mt-1 px-3 py-2 border rounded-md"
              placeholder="votre@email.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Téléphone</label>
            <input 
              type="tel" 
              className="w-full mt-1 px-3 py-2 border rounded-md"
              placeholder="+33 6 12 34 56 78"
            />
          </div>
        </div>
        <div className="mt-6">
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Sécurité</h2>
        <Button variant="outline">Changer le mot de passe</Button>
      </Card>
    </div>
  )
}
