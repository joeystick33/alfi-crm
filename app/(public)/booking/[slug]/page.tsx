'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Loader2, CheckCircle2, User } from 'lucide-react'

interface AppointmentTypePublic {
  id: string
  name: string
  description?: string
  duration: number
  color: string
  location?: string
  price?: number
}

interface ConseillerPublic {
  firstName: string
  lastName: string
  avatar?: string
  cabinet: { name: string }
}

interface Slot {
  start: string
  end: string
  available: boolean
}

export default function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [step, setStep] = useState<'type' | 'date' | 'time' | 'info' | 'done'>('type')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Données chargées
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentTypePublic[]>([])
  const [conseiller, setConseiller] = useState<ConseillerPublic | null>(null)

  // Sélection utilisateur
  const [selectedType, setSelectedType] = useState<AppointmentTypePublic | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Formulaire
  const [clientNom, setClientNom] = useState('')
  const [clientPrenom, setClientPrenom] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientTelephone, setClientTelephone] = useState('')
  const [clientNotes, setClientNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Calendrier
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Charger les données publiques du conseiller
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/public/booking/${slug}`)
        if (!res.ok) throw new Error('Page de réservation non trouvée')
        const data = await res.json()
        setAppointmentTypes(data.data?.appointmentTypes || [])
        setConseiller(data.data?.conseiller || null)

        // Si un seul type, le sélectionner automatiquement
        const types = data.data?.appointmentTypes || []
        if (types.length === 1) {
          setSelectedType(types[0])
          setStep('date')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [slug])

  // Charger les créneaux pour une date
  const loadSlots = useCallback(async (date: Date) => {
    if (!selectedType) return
    setLoadingSlots(true)
    setSlots([])
    try {
      const dateStr = date.toISOString().slice(0, 10)
      const res = await fetch(`/api/public/booking/${slug}/slots?date=${dateStr}&appointmentTypeId=${selectedType.id}`)
      if (res.ok) {
        const data = await res.json()
        setSlots(data.data?.slots || [])
      }
    } catch (err) {
      console.error('Erreur chargement créneaux:', err)
    } finally {
      setLoadingSlots(false)
    }
  }, [slug, selectedType])

  useEffect(() => {
    if (selectedDate && selectedType) loadSlots(selectedDate)
  }, [selectedDate, selectedType, loadSlots])

  // Soumettre la réservation
  const handleSubmit = async () => {
    if (!selectedType || !selectedSlot || !clientNom || !clientEmail) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/booking/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentTypeId: selectedType.id,
          startDate: selectedSlot.start,
          endDate: selectedSlot.end,
          clientNom,
          clientPrenom,
          clientEmail,
          clientTelephone: clientTelephone || undefined,
          notes: clientNotes || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erreur lors de la réservation')
      }
      setStep('done')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Calendrier mini
  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

    const cells: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = []
    const prevDays = new Date(year, month, 0).getDate()
    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push({ day: prevDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevDays - i) })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, isCurrentMonth: true, date: new Date(year, month, d) })
    }
    while (cells.length < 42) {
      const d = cells.length - daysInMonth - startOffset + 1
      cells.push({ day: d, isCurrentMonth: false, date: new Date(year, month + 1, d) })
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-800">{MOIS[month]} {year}</span>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(j => (
            <div key={j} className="text-xs font-medium text-gray-400">{j}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            const isPast = cell.date < today
            const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6
            const isSelected = selectedDate && cell.date.toDateString() === selectedDate.toDateString()
            const isDisabled = isPast || !cell.isCurrentMonth

            return (
              <button
                key={i}
                onClick={() => {
                  if (isDisabled) return
                  setSelectedDate(cell.date)
                  setSelectedSlot(null)
                }}
                disabled={isDisabled}
                className={`w-10 h-10 rounded-full text-sm flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-emerald-600 text-white' :
                  isDisabled ? 'text-gray-200 cursor-not-allowed' :
                  isWeekend ? 'text-gray-400 hover:bg-gray-100' :
                  'text-gray-700 hover:bg-emerald-50'
                }`}
              >
                {cell.day}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error && step !== 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Page non trouvée</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 text-white p-6">
          {conseiller && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-lg font-bold">
                {conseiller.firstName[0]}{conseiller.lastName[0]}
              </div>
              <div>
                <div className="font-semibold">{conseiller.firstName} {conseiller.lastName}</div>
                <div className="text-emerald-200 text-sm">{conseiller.cabinet.name}</div>
              </div>
            </div>
          )}
          <h1 className="text-xl font-bold">Prendre rendez-vous</h1>
          <p className="text-emerald-200 text-sm mt-1">Sélectionnez le type de rendez-vous et un créneau disponible</p>
        </div>

        <div className="p-6">
          {/* ═══ Étape 1 : Choix du type ═══ */}
          {step === 'type' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Quel type de rendez-vous ?</h2>
              <div className="space-y-3">
                {appointmentTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => { setSelectedType(type); setStep('date') }}
                    className="w-full flex items-center gap-4 p-4 border-2 rounded-xl hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors text-left"
                    style={{ borderColor: type.color + '40' }}
                  >
                    <div className="w-3 h-10 rounded-full" style={{ backgroundColor: type.color }} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{type.name}</div>
                      {type.description && <div className="text-sm text-gray-500">{type.description}</div>}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{type.duration} min</span>
                        {type.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{type.location}</span>}
                        {type.price != null && type.price > 0 && <span>{type.price} €</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Étape 2 : Choix de la date + créneau ═══ */}
          {step === 'date' && selectedType && (
            <div>
              <button onClick={() => { setStep('type'); setSelectedDate(null); setSelectedSlot(null) }} className="text-sm text-emerald-600 hover:underline mb-3 inline-block">
                &larr; Changer le type
              </button>
              <div className="bg-emerald-50 rounded-lg p-3 mb-4 text-sm">
                <div className="font-medium text-emerald-800">{selectedType.name}</div>
                <div className="text-emerald-600 text-xs flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3" />{selectedType.duration} min
                  {selectedType.location && <><MapPin className="w-3 h-3 ml-2" />{selectedType.location}</>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calendrier */}
                <div>{renderCalendar()}</div>

                {/* Créneaux */}
                <div>
                  {!selectedDate ? (
                    <div className="text-center text-gray-400 text-sm pt-8">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Sélectionnez une date
                    </div>
                  ) : loadingSlots ? (
                    <div className="text-center pt-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm pt-8">
                      Aucun créneau disponible ce jour
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
                        {slots.map((slot, i) => {
                          const isSelected = selectedSlot?.start === slot.start
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                setSelectedSlot(slot)
                                setStep('info')
                              }}
                              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50'
                              }`}
                            >
                              {new Date(slot.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ Étape 3 : Informations du client ═══ */}
          {step === 'info' && selectedType && selectedSlot && (
            <div>
              <button onClick={() => setStep('date')} className="text-sm text-emerald-600 hover:underline mb-3 inline-block">
                &larr; Changer le créneau
              </button>

              {/* Récapitulatif */}
              <div className="bg-emerald-50 rounded-lg p-3 mb-4 text-sm">
                <div className="font-medium text-emerald-800">{selectedType.name}</div>
                <div className="text-emerald-600 text-xs mt-1">
                  {new Date(selectedSlot.start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {' à '}
                  {new Date(selectedSlot.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {new Date(selectedSlot.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <h2 className="text-lg font-semibold text-gray-800 mb-4">Vos coordonnées</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input type="text" value={clientNom} onChange={e => setClientNom(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <input type="text" value={clientPrenom} onChange={e => setClientPrenom(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input type="tel" value={clientTelephone} onChange={e => setClientTelephone(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
                  <textarea value={clientNotes} onChange={e => setClientNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" placeholder="Précisez l'objet de votre rendez-vous..." />
                </div>
              </div>

              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting || !clientNom || !clientEmail}
                className="w-full mt-4 px-4 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                {submitting ? 'Réservation en cours...' : 'Confirmer le rendez-vous'}
              </button>
            </div>
          )}

          {/* ═══ Étape 4 : Confirmation ═══ */}
          {step === 'done' && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Rendez-vous confirmé !</h2>
              <p className="text-gray-500 text-sm mb-4">
                Un email de confirmation vous a été envoyé à <strong>{clientEmail}</strong>.
              </p>
              {selectedType && selectedSlot && (
                <div className="bg-emerald-50 rounded-lg p-4 inline-block text-left text-sm">
                  <div className="font-medium text-emerald-800">{selectedType.name}</div>
                  <div className="text-emerald-600 mt-1">
                    {new Date(selectedSlot.start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="text-emerald-600">
                    {new Date(selectedSlot.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {' — '}
                    {new Date(selectedSlot.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {selectedType.location && (
                    <div className="text-emerald-600 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />{selectedType.location}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 text-center text-xs text-gray-400">
          Propulsé par Aura CRM
        </div>
      </div>
    </div>
  )
}
