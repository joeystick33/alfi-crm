"use client";

import { useState } from 'react';
import { Calendar, Clock, MapPin, Video, Plus, Check, X } from 'lucide-react';

export default function RendezVousPage() {
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  const appointments = [
    {
      id: 1,
      title: 'Bilan patrimonial annuel',
      date: '2024-11-15',
      time: '14:00',
      duration: '1h30',
      type: 'cabinet',
      location: '15 Avenue des Champs-Élysées, Paris',
      status: 'confirmed',
      advisor: 'Sophie Martin'
    },
    {
      id: 2,
      title: 'Point sur investissement locatif',
      date: '2024-11-22',
      time: '10:00',
      duration: '1h',
      type: 'visio',
      meetingLink: 'https://meet.fin3crm.com/abc123',
      status: 'confirmed',
      advisor: 'Sophie Martin'
    },
    {
      id: 3,
      title: 'Suivi trimestriel',
      date: '2024-12-10',
      time: '15:00',
      duration: '45min',
      type: 'cabinet',
      location: '15 Avenue des Champs-Élysées, Paris',
      status: 'pending',
      advisor: 'Sophie Martin'
    }
  ];

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.date) >= new Date()
  ).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Rendez-vous</h1>
          <p className="text-gray-600 mt-1">
            {upcomingAppointments.length} rendez-vous à venir
          </p>
        </div>
        <button
          onClick={() => setShowNewAppointment(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Demander un rendez-vous
        </button>
      </div>

      {/* Prochain RDV */}
      {upcomingAppointments.length > 0 && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
          <p className="text-blue-100 mb-2">Prochain rendez-vous</p>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {upcomingAppointments[0].title}
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {new Date(upcomingAppointments[0].date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{upcomingAppointments[0].time} • {upcomingAppointments[0].duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  {upcomingAppointments[0].type === 'visio' ? (
                    <>
                      <Video className="w-5 h-5" />
                      <span>Visioconférence</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      <span>{upcomingAppointments[0].location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {upcomingAppointments[0].type === 'visio' && (
              <a
                href={upcomingAppointments[0].meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Rejoindre
              </a>
            )}
          </div>
        </div>
      )}

      {/* Rendez-vous à venir */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">À venir</h2>
        <div className="space-y-3">
          {upcomingAppointments.map((apt: any) => (
            <div
              key={apt.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {apt.title}
                    </h3>
                    {apt.status === 'confirmed' ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Confirmé
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        En attente
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(apt.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{apt.time} • {apt.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {apt.type === 'visio' ? (
                        <>
                          <Video className="w-4 h-4" />
                          <span>Visioconférence</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          <span>Au cabinet</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-2">
                    Avec {apt.advisor}
                  </p>
                </div>

                <div className="flex gap-2">
                  {apt.type === 'visio' && apt.status === 'confirmed' && (
                    <a
                      href={apt.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Rejoindre
                    </a>
                  )}
                  <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 text-sm font-medium rounded-lg transition-colors">
                    Modifier
                  </button>
                  <button className="px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nouveau RDV */}
      {showNewAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Demander un rendez-vous
              </h3>
              <button
                onClick={() => setShowNewAppointment(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Bilan patrimonial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de rendez-vous
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="cabinet">Au cabinet</option>
                  <option value="visio">Visioconférence</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (optionnel)
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Précisez vos disponibilités ou le sujet..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewAppointment(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Envoyer la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
