'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Building2, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CreateCabinetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    plan: 'BUSINESS',
    maxUsers: '10',
    maxClients: '100',
    maxStorage: '10737418240', // 10GB
    
    // Admin user
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/superadmin/cabinets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cabinet: {
            name: formData.name,
            slug: formData.slug,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            plan: formData.plan,
          },
          quotas: {
            maxUsers: parseInt(formData.maxUsers),
            maxClients: parseInt(formData.maxClients),
            maxStorage: parseInt(formData.maxStorage),
          },
          adminUser: {
            email: formData.adminEmail,
            password: formData.adminPassword,
            firstName: formData.adminFirstName,
            lastName: formData.adminLastName,
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      router.push('/superadmin/cabinets')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/superadmin/cabinets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Créer un nouveau cabinet
          </h1>
          <p className="text-muted-foreground mt-1">
            Créer un cabinet et son administrateur principal
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations Cabinet */}
        <div className="bg-white p-6 rounded-lg border space-y-4">
          <h2 className="text-xl font-semibold">Informations du Cabinet</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nom du cabinet *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Cabinet Patrimoine"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="slug">Slug (identifiant unique) *</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                placeholder="cabinet-patrimoine"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="contact@cabinet.fr"
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="01 23 45 67 89"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Avenue, 75001 Paris"
              />
            </div>
          </div>
        </div>

        {/* Plan & Quotas */}
        <div className="bg-white p-6 rounded-lg border space-y-4">
          <h2 className="text-xl font-semibold">Plan & Quotas</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plan">Plan d'abonnement *</Label>
              <select
                id="plan"
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="TRIAL">TRIAL (Essai)</option>
                <option value="STARTER">STARTER</option>
                <option value="BUSINESS">BUSINESS</option>
                <option value="PREMIUM">PREMIUM</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>

            <div>
              <Label htmlFor="maxUsers">Nombre max d'utilisateurs *</Label>
              <Input
                id="maxUsers"
                name="maxUsers"
                type="number"
                value={formData.maxUsers}
                onChange={handleChange}
                required
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="maxClients">Nombre max de clients *</Label>
              <Input
                id="maxClients"
                name="maxClients"
                type="number"
                value={formData.maxClients}
                onChange={handleChange}
                required
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="maxStorage">Stockage max (octets) *</Label>
              <Input
                id="maxStorage"
                name="maxStorage"
                type="number"
                value={formData.maxStorage}
                onChange={handleChange}
                required
                min="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                10GB = 10737418240 octets
              </p>
            </div>
          </div>
        </div>

        {/* Admin User */}
        <div className="bg-white p-6 rounded-lg border space-y-4">
          <h2 className="text-xl font-semibold">Administrateur du Cabinet</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adminFirstName">Prénom *</Label>
              <Input
                id="adminFirstName"
                name="adminFirstName"
                value={formData.adminFirstName}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="adminLastName">Nom *</Label>
              <Input
                id="adminLastName"
                name="adminLastName"
                value={formData.adminLastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="adminEmail">Email *</Label>
              <Input
                id="adminEmail"
                name="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="adminPassword">Mot de passe *</Label>
              <Input
                id="adminPassword"
                name="adminPassword"
                type="password"
                value={formData.adminPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 6 caractères
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/superadmin/cabinets" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Créer le cabinet
          </Button>
        </div>
      </form>
    </div>
  )
}
