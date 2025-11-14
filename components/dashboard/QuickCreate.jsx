'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Plus,
  UserPlus,
  Calendar,
  FileText,
  CheckSquare,
  Mail,
  TrendingUp,
  Briefcase,
  ChevronDown,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { apiCall } from '@/lib/api';

const CREATE_ACTIONS = [
  {
    id: 'client',
    label: 'Nouveau client',
    icon: UserPlus,
    shortcut: 'N+C',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    route: '/dashboard/clients/nouveau'
  },
  {
    id: 'appointment',
    label: 'Rendez-vous',
    icon: Calendar,
    shortcut: 'N+R',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    hasQuickForm: true
  },
  {
    id: 'task',
    label: 'Tâche',
    icon: CheckSquare,
    shortcut: 'N+T',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    hasQuickForm: true
  },
  {
    id: 'document',
    label: 'Document',
    icon: FileText,
    shortcut: 'N+D',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    route: '/dashboard/documents/nouveau'
  },
  {
    id: 'opportunity',
    label: 'Opportunité',
    icon: TrendingUp,
    shortcut: 'N+O',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    hasQuickForm: true
  },
  {
    id: 'project',
    label: 'Projet',
    icon: Briefcase,
    shortcut: 'N+P',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    route: '/dashboard/projets/nouveau'
  },
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    shortcut: 'N+E',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    hasQuickForm: true
  }
];

export default function QuickCreate({ className, onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // N key combinations
      if (e.key === 'n' || e.key === 'N') {
        const nextKeyHandler = (nextEvent) => {
          nextEvent.preventDefault();
          
          const action = CREATE_ACTIONS.find(a => {
            const shortcutKey = a.shortcut.split('+')[1].toLowerCase();
            return shortcutKey === nextEvent.key.toLowerCase();
          });

          if (action) {
            handleActionClick(action);
          }

          window.removeEventListener('keydown', nextKeyHandler);
        };

        window.addEventListener('keydown', nextKeyHandler);
        
        // Remove listener after 1 second if no second key pressed
        setTimeout(() => {
          window.removeEventListener('keydown', nextKeyHandler);
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleActionClick = (action) => {
    setIsOpen(false);
    
    if (action.hasQuickForm) {
      setActiveModal(action.id);
    } else if (action.route) {
      router.push(action.route);
    }
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  const handleModalSuccess = () => {
    setActiveModal(null);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <div className={cn('relative', className)} ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
            'transition-colors text-sm font-medium text-white',
            isOpen && 'bg-blue-700 dark:bg-blue-600'
          )}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Créer</span>
          <ChevronDown className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Création rapide
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Utilisez N + lettre pour créer
              </p>
            </div>

            {/* Actions List */}
            <div className="py-2">
              {CREATE_ACTIONS.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
                  >
                    <div className={cn(
                      'flex-shrink-0 p-2 rounded-lg transition-transform',
                      action.bgColor,
                      'group-hover:scale-110'
                    )}>
                      <Icon className={cn('h-4 w-4', action.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.label}
                      </span>
                    </div>

                    <kbd className="flex-shrink-0 px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                      {action.shortcut}
                    </kbd>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Create Modals */}
      {activeModal === 'appointment' && (
        <QuickAppointmentModal
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
      
      {activeModal === 'task' && (
        <QuickTaskModal
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
      
      {activeModal === 'opportunity' && (
        <QuickOpportunityModal
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
      
      {activeModal === 'email' && (
        <QuickEmailModal
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}

/**
 * Quick Appointment Modal
 */
function QuickAppointmentModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    dateDebut: '',
    heureDebut: '',
    duree: '60',
    clientId: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiCall('/advisor/appointments', {
        method: 'POST',
        body: {
          ...formData,
          dateDebut: `${formData.dateDebut}T${formData.heureDebut}:00`,
          dateFin: new Date(
            new Date(`${formData.dateDebut}T${formData.heureDebut}:00`).getTime() + 
            parseInt(formData.duree) * 60000
          ).toISOString()
        }
      });

      if (response.success) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <QuickModal
      title="Nouveau rendez-vous"
      icon={Calendar}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titre"
          value={formData.titre}
          onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
          required
          placeholder="Ex: Réunion de suivi"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={formData.dateDebut}
            onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
            required
          />

          <Input
            label="Heure"
            type="time"
            value={formData.heureDebut}
            onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
            required
          />
        </div>

        <Input
          label="Durée (minutes)"
          type="number"
          value={formData.duree}
          onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
          min="15"
          step="15"
          required
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer'}
          </Button>
        </div>
      </form>
    </QuickModal>
  );
}

/**
 * Quick Task Modal
 */
function QuickTaskModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    echeance: '',
    priorite: 'MOYENNE'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiCall('/advisor/tasks', {
        method: 'POST',
        body: formData
      });

      if (response.success) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <QuickModal
      title="Nouvelle tâche"
      icon={CheckSquare}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titre"
          value={formData.titre}
          onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
          required
          placeholder="Ex: Appeler le client"
        />

        <Input
          label="Échéance"
          type="date"
          value={formData.echeance}
          onChange={(e) => setFormData({ ...formData, echeance: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Priorité
          </label>
          <div className="flex gap-2">
            {['BASSE', 'MOYENNE', 'HAUTE'].map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => setFormData({ ...formData, priorite: priority })}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                  formData.priorite === priority
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer'}
          </Button>
        </div>
      </form>
    </QuickModal>
  );
}

/**
 * Quick Opportunity Modal
 */
function QuickOpportunityModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    montant: '',
    probabilite: '50'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiCall('/advisor/opportunities', {
        method: 'POST',
        body: {
          ...formData,
          montant: parseFloat(formData.montant),
          probabilite: parseInt(formData.probabilite)
        }
      });

      if (response.success) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <QuickModal
      title="Nouvelle opportunité"
      icon={TrendingUp}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titre"
          value={formData.titre}
          onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
          required
          placeholder="Ex: Assurance vie"
        />

        <Input
          label="Montant estimé (€)"
          type="number"
          value={formData.montant}
          onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
          required
          min="0"
          step="100"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Probabilité: {formData.probabilite}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={formData.probabilite}
            onChange={(e) => setFormData({ ...formData, probabilite: e.target.value })}
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer'}
          </Button>
        </div>
      </form>
    </QuickModal>
  );
}

/**
 * Quick Email Modal
 */
function QuickEmailModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    destinataire: '',
    sujet: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiCall('/advisor/emails/send', {
        method: 'POST',
        body: formData
      });

      if (response.success) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <QuickModal
      title="Nouvel email"
      icon={Mail}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Destinataire"
          type="email"
          value={formData.destinataire}
          onChange={(e) => setFormData({ ...formData, destinataire: e.target.value })}
          required
          placeholder="email@exemple.com"
        />

        <Input
          label="Sujet"
          value={formData.sujet}
          onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Envoi...' : 'Envoyer'}
          </Button>
        </div>
      </form>
    </QuickModal>
  );
}

/**
 * Reusable Quick Modal Component
 */
function QuickModal({ title, icon: Icon, onClose, children }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-20 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            </div>
            
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
