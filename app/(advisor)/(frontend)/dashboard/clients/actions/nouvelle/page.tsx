'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Badge } from '@/app/_common/components/ui/Badge';
import { Input } from '@/app/_common/components/ui/Input';
import Textarea from '@/app/_common/components/ui/Textarea';
import { Stepper } from '@/app/_common/components/ui/Stepper';
import { api } from '@/app/_common/lib/api-client';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Rocket,
  Target,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Constants & Types ────────────────────────────────────────────────────────

const CAMPAIGN_TYPES = [
  { value: 'EMAIL', label: 'Email', icon: Mail, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { value: 'SMS', label: 'SMS', icon: MessageSquare, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { value: 'PHONE', label: 'Appel', icon: Phone, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { value: 'MEETING', label: 'Réunion', icon: Users, color: 'bg-purple-50 text-purple-600 border-purple-200' },
] as const;

type CampaignType = (typeof CAMPAIGN_TYPES)[number]['value'];

const SEGMENTS = [
  { value: 'PROSPECT', label: 'Prospects', description: 'Contacts non encore clients' },
  { value: 'CLIENT_ACTIF', label: 'Clients actifs', description: 'Clients avec activité récente' },
  { value: 'CLIENT_INACTIF', label: 'Clients inactifs', description: 'Clients sans activité depuis 6 mois' },
  { value: 'VIP', label: 'VIP', description: 'Clients à fort patrimoine' },
  { value: 'RETRAITE', label: 'Retraite', description: 'Clients proches de la retraite' },
  { value: 'EPARGNE', label: 'Épargne', description: 'Clients avec projets d\'épargne' },
] as const;

const RECURRENCES = [
  { value: 'PONCTUELLE', label: 'Ponctuelle', description: 'Envoi unique' },
  { value: 'HEBDO', label: 'Hebdomadaire', description: 'Chaque semaine' },
  { value: 'MENSUELLE', label: 'Mensuelle', description: 'Chaque mois' },
] as const;

type RecurrenceType = (typeof RECURRENCES)[number]['value'];

interface EmailTemplate {
  id: string;
  name: string;
  subject?: string;
  content?: string;
}

interface ClientPreview {
  id: string;
  name: string;
  email?: string;
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface CampaignForm {
  // Step 1
  name: string;
  objective: string;
  type: CampaignType;
  description: string;
  // Step 2
  segment: string;
  minPatrimoine: string;
  maxPatrimoine: string;
  lastActivityDays: string;
  // Step 3
  templateId: string;
  messageContent: string;
  scriptContent: string;
  // Step 4
  scheduledAt: string;
  recurrence: RecurrenceType;
}

const INITIAL_FORM: CampaignForm = {
  name: '',
  objective: '',
  type: 'EMAIL',
  description: '',
  segment: '',
  minPatrimoine: '',
  maxPatrimoine: '',
  lastActivityDays: '',
  templateId: '',
  messageContent: '',
  scriptContent: '',
  scheduledAt: '',
  recurrence: 'PONCTUELLE',
};

const STEPS = [
  { label: 'Définir', description: 'Nom & type' },
  { label: 'Cibler', description: 'Segments & filtres' },
  { label: 'Message', description: 'Contenu' },
  { label: 'Planifier', description: 'Date & lancement' },
];

// ─── Main page component ──────────────────────────────────────────────────────

export default function NouvelleCampagnePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<CampaignForm>(INITIAL_FORM);
  const [stepErrors, setStepErrors] = useState<string | null>(null);

  // Remote state
  const [clientsPreview, setClientsPreview] = useState<ClientPreview[]>([]);
  const [clientsCount, setClientsCount] = useState<number | null>(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const update = <K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStepErrors(null);
  };

  // ── Step 2: load clients preview ───────────────────────────────────────────

  const loadClientsPreview = useCallback(async (segment: string) => {
    if (!segment) {
      setClientsPreview([]);
      setClientsCount(null);
      return;
    }
    setLoadingClients(true);
    try {
      const res = await api.get(`/advisor/clients?segment=${segment}&limit=100`) as any;
      const list: ClientPreview[] = res?.clients ?? res?.data ?? [];
      setClientsPreview(list.slice(0, 6));
      setClientsCount(res?.total ?? list.length);
    } catch {
      setClientsPreview([]);
      setClientsCount(null);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    if (currentStep === 1 && form.segment) {
      loadClientsPreview(form.segment);
    }
  }, [currentStep, form.segment, loadClientsPreview]);

  // ── Step 3: load email templates ───────────────────────────────────────────

  useEffect(() => {
    if (currentStep === 2 && form.type === 'EMAIL' && emailTemplates.length === 0) {
      setLoadingTemplates(true);
      api.get('/advisor/email-templates')
        .then((res: any) => {
          setEmailTemplates(res?.templates ?? res?.data ?? []);
        })
        .catch(() => {
          setEmailTemplates([]);
        })
        .finally(() => setLoadingTemplates(false));
    }
  }, [currentStep, form.type, emailTemplates.length]);

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateStep = (): boolean => {
    if (currentStep === 0) {
      if (!form.name.trim()) {
        setStepErrors('Le nom de la campagne est requis.');
        return false;
      }
    }
    if (currentStep === 1) {
      if (!form.segment) {
        setStepErrors('Veuillez sélectionner un segment.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (form.type === 'EMAIL' && !form.messageContent.trim() && !form.templateId) {
        setStepErrors('Choisissez un template ou rédigez un message.');
        return false;
      }
      if ((form.type === 'PHONE' || form.type === 'MEETING') && !form.scriptContent.trim()) {
        setStepErrors('Rédigez un script d\'appel.');
        return false;
      }
      if (form.type === 'SMS' && !form.messageContent.trim()) {
        setStepErrors('Rédigez le message SMS.');
        return false;
      }
    }
    setStepErrors(null);
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStepErrors(null);
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post('/advisor/clients/actions', {
        title: form.name,
        objective: form.objective,
        segmentKey: form.segment,
        segmentLabel: SEGMENTS.find((s) => s.value === form.segment)?.label ?? form.segment,
        channels: [form.type],
        scheduledAt: form.scheduledAt || null,
        notes: form.description,
        messageContent: form.type === 'EMAIL' ? form.messageContent : undefined,
        templateId: form.templateId || undefined,
        scriptContent: ['PHONE', 'MEETING'].includes(form.type) ? form.scriptContent : undefined,
        recurrence: form.recurrence,
      });
      router.push('/dashboard/clients/actions');
    } catch (err) {
      console.error('Erreur création campagne:', err);
      setSubmitError(err instanceof Error ? err.message : 'Impossible de créer la campagne');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Step renderers ───────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Nom de la campagne <span className="text-destructive">*</span>
        </label>
        <Input
          value={form.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('name', e.target.value)}
          placeholder="Ex : Campagne retraite – Mars 2026"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Objectif
        </label>
        <Input
          value={form.objective}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('objective', e.target.value)}
          placeholder="Ex : Proposer un entretien PER"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Type de campagne <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CAMPAIGN_TYPES.map((ct) => {
            const Icon = ct.icon;
            const selected = form.type === ct.value;
            return (
              <button
                key={ct.value}
                type="button"
                onClick={() => update('type', ct.value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                  selected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50'
                )}
              >
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', ct.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn('text-xs font-semibold', selected ? 'text-primary' : 'text-foreground')}>
                  {ct.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Description (optionnel)
        </label>
        <Textarea
          value={form.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('description', e.target.value)}
          rows={3}
          placeholder="Détails internes, contexte de la campagne…"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Segment cible <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SEGMENTS.map((seg) => {
            const selected = form.segment === seg.value;
            return (
              <button
                key={seg.value}
                type="button"
                onClick={() => update('segment', seg.value)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50'
                )}
              >
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  selected ? 'bg-primary/10' : 'bg-muted'
                )}>
                  <Users className={cn('h-4 w-4', selected ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <div>
                  <p className="text-sm font-medium">{seg.label}</p>
                  <p className="text-xs text-muted-foreground">{seg.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Patrimoine min (€)
          </label>
          <Input
            type="number"
            value={form.minPatrimoine}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('minPatrimoine', e.target.value)}
            placeholder="Ex : 50000"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Patrimoine max (€)
          </label>
          <Input
            type="number"
            value={form.maxPatrimoine}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('maxPatrimoine', e.target.value)}
            placeholder="Ex : 500000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Dernière activité (jours max)
        </label>
        <Input
          type="number"
          value={form.lastActivityDays}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('lastActivityDays', e.target.value)}
          placeholder="Ex : 90 (clients actifs dans les 90 derniers jours)"
        />
      </div>

      {/* Clients preview */}
      {form.segment && (
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Aperçu de l&apos;audience
            </p>
            {loadingClients ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : clientsCount !== null ? (
              <Badge variant="primary" size="xs">
                {clientsCount} client{clientsCount !== 1 ? 's' : ''} ciblé{clientsCount !== 1 ? 's' : ''}
              </Badge>
            ) : null}
          </div>
          {clientsPreview.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {clientsPreview.map((c) => (
                <Badge key={c.id} variant="outline" size="xs">
                  {c.name || c.email || 'Contact'}
                </Badge>
              ))}
              {clientsCount !== null && clientsCount > clientsPreview.length && (
                <Badge variant="outline" size="xs" className="text-muted-foreground">
                  +{clientsCount - clientsPreview.length} autres
                </Badge>
              )}
            </div>
          ) : loadingClients ? (
            <p className="mt-2 text-xs text-muted-foreground">Chargement…</p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Aucun client trouvé pour ce segment.</p>
          )}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => {
    if (form.type === 'EMAIL') {
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Template email
            </label>
            {loadingTemplates ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des templates…
              </div>
            ) : emailTemplates.length > 0 ? (
              <div className="grid gap-2">
                {emailTemplates.map((tpl) => {
                  const selected = form.templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => update('templateId', selected ? '' : tpl.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all',
                        selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      )}
                    >
                      <FileText className={cn('h-5 w-5 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} />
                      <div>
                        <p className="text-sm font-medium">{tpl.name}</p>
                        {tpl.subject && <p className="text-xs text-muted-foreground">Objet : {tpl.subject}</p>}
                      </div>
                      {selected && <CheckCircle className="ml-auto h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun template disponible. Rédigez votre message ci-dessous.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contenu du message {!form.templateId && <span className="text-destructive">*</span>}
            </label>
            <Textarea
              value={form.messageContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('messageContent', e.target.value)}
              rows={6}
              placeholder="Rédigez votre email ici…"
            />
          </div>
        </div>
      );
    }

    if (form.type === 'SMS') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Message SMS <span className="text-destructive">*</span>
              </label>
              <span className="text-xs text-muted-foreground">{form.messageContent.length}/160</span>
            </div>
            <Textarea
              value={form.messageContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('messageContent', e.target.value)}
              rows={4}
              maxLength={160}
              placeholder="Votre message court (160 caractères max)…"
            />
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            Les SMS de plus de 160 caractères seront facturés en 2 SMS.
          </div>
        </div>
      );
    }

    // PHONE / MEETING
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Script d&apos;appel / trame de réunion <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={form.scriptContent}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('scriptContent', e.target.value)}
            rows={8}
            placeholder={
              form.type === 'PHONE'
                ? 'Bonjour [Prénom], je vous contacte au sujet de… \n\n1. Accroche :\n2. Qualification :\n3. Proposition :\n4. Clôture :'
                : 'Agenda de la réunion :\n\n1. Présentation :\n2. Point retraite :\n3. Proposition :\n4. Prochaines étapes :'
            }
          />
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const selectedType = CAMPAIGN_TYPES.find((t) => t.value === form.type);
    const selectedSegment = SEGMENTS.find((s) => s.value === form.segment);
    const selectedRecurrence = RECURRENCES.find((r) => r.value === form.recurrence);

    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Date de début
            </label>
            <Input
              type="date"
              value={form.scheduledAt}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('scheduledAt', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Récurrence
            </label>
            <div className="space-y-1.5">
              {RECURRENCES.map((rec) => (
                <button
                  key={rec.value}
                  type="button"
                  onClick={() => update('recurrence', rec.value)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                    form.recurrence === rec.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <span className="font-medium">{rec.label}</span>
                  <span className="text-xs text-muted-foreground">{rec.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Récapitulatif de la campagne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">{form.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="outline" size="xs">{selectedType?.label ?? '—'}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Segment</span>
              <Badge variant="outline" size="xs">{selectedSegment?.label ?? '—'}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Audience estimée</span>
              <span className="font-medium text-primary">
                {clientsCount !== null ? `${clientsCount} contact${clientsCount !== 1 ? 's' : ''}` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Récurrence</span>
              <span className="font-medium">{selectedRecurrence?.label ?? '—'}</span>
            </div>
            {form.scheduledAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date de début</span>
                <span className="font-medium">
                  {new Date(form.scheduledAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {submitError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {submitError}
          </p>
        )}
      </div>
    );
  };

  // ─── Layout ────────────────────────────────────────────────────────────────

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/clients/actions')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouvelle campagne commerciale</h1>
          <p className="text-sm text-muted-foreground">
            Créez et planifiez une action commerciale en 4 étapes.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <Stepper steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />

      {/* Step card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {currentStep === 0 && <Target className="h-5 w-5 text-primary" />}
            {currentStep === 1 && <Users className="h-5 w-5 text-primary" />}
            {currentStep === 2 && <FileText className="h-5 w-5 text-primary" />}
            {currentStep === 3 && <Calendar className="h-5 w-5 text-primary" />}
            {STEPS[currentStep].label} — {STEPS[currentStep].description}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stepContent[currentStep]()}

          {stepErrors && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {stepErrors}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Précédent
        </Button>

        {isLastStep ? (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            Lancer la campagne
          </Button>
        ) : (
          <Button onClick={handleNext} className="gap-2">
            Suivant
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
