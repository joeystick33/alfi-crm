"use client";

import { useState } from 'react';
import { X, AlertCircle, CheckCircle, Copy } from 'lucide-react';

interface CreateOrganizationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface OrgData {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  plan: 'TRIAL' | 'STARTER' | 'BUSINESS' | 'PREMIUM' | 'ENTERPRISE' | 'CUSTOM';
  trialDays: number;
}

interface AdminData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface CreatedData {
  cabinet: {
    id: string;
    name: string;
    slug: string;
  };
  adminUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  generatedPassword?: string;
}

export default function CreateOrganizationModal({ onClose, onSuccess }: CreateOrganizationModalProps) {
  const [step, setStep] = useState(1); // 1: Info org, 2: Admin user, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdData, setCreatedData] = useState<CreatedData | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');

  const [orgData, setOrgData] = useState<OrgData>({
    name: '',
    slug: '',
    email: '',
    phone: '',
    plan: 'TRIAL',
    trialDays: 30,
  });

  const [adminData, setAdminData] = useState<AdminData>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleOrgNameChange = (name: string) => {
    setOrgData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleCreateOrganization = async () => {
    try {
      setLoading(true);
      setError(null);

      // Générer un mot de passe si nécessaire
      const password = adminData.password || generatePassword();
      setGeneratedPassword(password);

      const response = await fetch('/api/superadmin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orgData,
          adminUser: {
            ...adminData,
            password,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      const data = await response.json();
      setCreatedData(data);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyAllCredentials = () => {
    if (!createdData) return;
    
    const text = `
Cabinet: ${createdData.cabinet.name}
URL: ${window.location.origin}/login
Email: ${createdData.adminUser.email}
Mot de passe: ${generatedPassword}
    `.trim();
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Créer un Cabinet
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 1 && 'Informations du cabinet'}
              {step === 2 && 'Compte administrateur'}
              {step === 3 && 'Identifiants générés'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s: number) => (
              <div key={s} className="flex-1">
                <div className={`h-2 rounded-full transition-all ${
                  s <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Organisation Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du Cabinet *
                </label>
                <input
                  type="text"
                  value={orgData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleOrgNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Cabinet Dupont & Associés"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Identifiant (slug) *
                </label>
                <input
                  type="text"
                  value={orgData.slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="cabinet-dupont"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Utilisé dans l'URL et les identifiants
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email du Cabinet *
                </label>
                <input
                  type="email"
                  value={orgData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="contact@cabinet.fr"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={orgData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Initial
                  </label>
                  <select
                    value={orgData.plan}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOrgData(prev => ({ ...prev, plan: e.target.value as OrgData['plan'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="TRIAL">Trial (Gratuit - 14 jours)</option>
                    <option value="STARTER">Starter (59€/mois) - CRM</option>
                    <option value="BUSINESS">Business (99€/mois) - CRM + Calculateurs</option>
                    <option value="PREMIUM">Premium (199€/mois) - Accès complet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée d'essai (jours)
                  </label>
                  <input
                    type="number"
                    value={orgData.trialDays}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgData(prev => ({ ...prev, trialDays: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    min="0"
                    max="90"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Admin User */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Cabinet:</strong> {orgData.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={adminData.firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Jean"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={adminData.lastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={adminData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="jean.dupont@cabinet.fr"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe (optionnel)
                </label>
                <input
                  type="password"
                  value={adminData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Laisser vide pour générer automatiquement"
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si vide, un mot de passe sécurisé sera généré automatiquement
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && createdData && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Cabinet créé avec succès !
                </h3>
                <p className="text-sm text-gray-500">
                  Voici les identifiants de connexion
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <label className="text-xs text-gray-500">Cabinet</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-semibold text-gray-900">
                      {createdData.cabinet.name}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500">URL de connexion</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-sm text-gray-900">
                      {window.location.origin}/login
                    </span>
                    <button
                      onClick={() => copyToClipboard(window.location.origin + '/login')}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Copier"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Email</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-sm text-gray-900">
                      {createdData.adminUser.email}
                    </span>
                    <button
                      onClick={() => copyToClipboard(createdData.adminUser.email)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Copier"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Mot de passe</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-sm text-gray-900">
                      {generatedPassword}
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedPassword)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Copier"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <strong>Important:</strong> Copiez ces identifiants maintenant. 
                  Le mot de passe ne sera plus affiché.
                </div>
              </div>

              <button
                onClick={copyAllCredentials}
                className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copier tous les identifiants
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          {step < 3 && (
            <>
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  disabled={loading}
                >
                  Retour
                </button>
              )}
              
              {step === 1 && (
                <button
                  onClick={() => setStep(2)}
                  disabled={!orgData.name || !orgData.slug || !orgData.email}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              )}

              {step === 2 && (
                <button
                  onClick={handleCreateOrganization}
                  disabled={
                    loading || 
                    !adminData.firstName || 
                    !adminData.lastName ||
                    !adminData.email
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Création...' : 'Créer le Cabinet'}
                </button>
              )}
            </>
          )}

          {step === 3 && (
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Terminer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
