'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import Textarea from '@/app/_common/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useClients, useCreateInvoice } from '@/app/_common/hooks/use-api'
import { ArrowLeft, Plus, Trash2, FileText, Save } from 'lucide-react'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  tva: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const { data: clientsData } = useClients()
  const createMutation = useCreateInvoice()

   
  const clientsResponse = (clientsData as any)?.data
  const clients = Array.isArray(clientsResponse?.data)
    ? clientsResponse.data
    : Array.isArray(clientsResponse)
      ? clientsResponse
      : []

  const [formData, setFormData] = useState({
    clientId: '',
    dueDate: '',
    description: '',
    notes: '',
  })

  const [items, setItems] = useState<InvoiceItem[]>([])

  // Initialiser les items côté client uniquement pour éviter mismatch hydratation
  useState(() => {
    setItems([{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, tva: 20 }])
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const totals = useMemo(() => {
    let totalHT = 0
    let totalTVA = 0
    items.forEach((item) => {
      const lineHT = item.quantity * item.unitPrice
      totalHT += lineHT
      totalTVA += lineHT * (item.tva / 100)
    })
    return { totalHT, totalTVA, totalTTC: totalHT + totalTVA }
  }, [items])

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, tva: 20 }])
  }

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) setItems(items.filter((item) => item.id !== id))
  }

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map((item) => {
      if (item.id !== id) return item
      
      let processedValue = value
      if (field === 'quantity' || field === 'unitPrice' || field === 'tva') {
        processedValue = Number(value)
      }
      
      return { ...item, [field]: processedValue }
    }))
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.clientId) newErrors.clientId = 'Veuillez sélectionner un client'
    if (!formData.dueDate) newErrors.dueDate = "La date d'échéance est requise"
    const validItems = items.filter((item) => item.description.trim() !== '')
    if (validItems.length === 0) newErrors.items = 'Au moins une ligne avec description est requise'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const validItems = items
      .filter((item) => item.description.trim() !== '')
      .map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        tva: Number(item.tva),
      }))

    const payload = {
      clientId: formData.clientId,
      dueDate: new Date(formData.dueDate).toISOString(), // ISO complet
      description: formData.description || undefined,
      notes: formData.notes || undefined,
      items: validItems,
    }

    console.log('Payload sent:', payload)

    try {
      await createMutation.mutateAsync(payload)
      router.push('/dashboard/facturation')
    } catch (error) {
      console.error('Erreur création facture:', error)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nouvelle facture</h1>
          <p className="text-slate-600">Créez une nouvelle facture pour un client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                  <SelectTrigger className={errors.clientId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c: { id: string; firstName: string; lastName: string }) => (
                      <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && <p className="text-sm text-red-500">{errors.clientId}</p>}
              </div>
              <div className="space-y-2">
                <Label>Date d&apos;échéance *</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className={errors.dueDate ? 'border-red-500' : ''}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la facture (optionnel)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lignes de facture</span>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errors.items && <p className="text-sm text-red-500 mb-4">{errors.items}</p>}
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-slate-50 rounded-lg">
                  <div className="col-span-12 md:col-span-4">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      placeholder="Description du service"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Label className="text-xs">Quantité</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Label className="text-xs">Prix HT (€)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <Label className="text-xs">TVA (%)</Label>
                    <Select value={String(item.tva)} onValueChange={(v) => handleItemChange(item.id, 'tva', parseFloat(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5.5">5,5%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 md:col-span-2 flex justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} disabled={items.length === 1}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex flex-col items-end space-y-1">
                <div className="flex justify-between w-48"><span className="text-slate-600">Total HT:</span><span className="font-medium">{formatCurrency(totals.totalHT)}</span></div>
                <div className="flex justify-between w-48"><span className="text-slate-600">TVA:</span><span className="font-medium">{formatCurrency(totals.totalTVA)}</span></div>
                <div className="flex justify-between w-48 text-lg"><span className="font-semibold">Total TTC:</span><span className="font-bold text-primary">{formatCurrency(totals.totalTTC)}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>Notes internes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes visibles uniquement par vous (optionnel)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Création...' : 'Créer la facture'}
          </Button>
        </div>
      </form>
    </div>
  )
}
