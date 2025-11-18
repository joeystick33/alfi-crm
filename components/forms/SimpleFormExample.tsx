'use client';

/**
 * Simple Form Example - Works without additional dependencies
 * This demonstrates the form components in standalone mode
 */

import * as React from 'react';
import { Input } from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Radio, { RadioGroup } from '@/components/ui/Radio';
import DatePicker from '@/components/ui/DatePicker';
import FileUpload from '@/components/ui/FileUpload';
import { Button } from '@/components/ui/Button';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  bio: string;
  accountType: 'personal' | 'business';
  acceptTerms: boolean;
  newsletter: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  bio?: string;
  accountType?: string;
  acceptTerms?: string;
}

export default function SimpleFormExample() {
  const [formData, setFormData] = React.useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    bio: '',
    accountType: 'personal',
    acceptTerms: false,
    newsletter: false,
  });

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.firstName.length < 2) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères.';
    }

    if (formData.lastName.length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caractères.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Veuillez entrer une adresse email valide.';
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Le numéro de téléphone doit contenir 10 chiffres.';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'La date de naissance est requise.';
    }

    if (formData.bio.length > 500) {
      newErrors.bio = 'La biographie ne peut pas dépasser 500 caractères.';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Vous devez accepter les conditions d'utilisation.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve: any) => setTimeout(resolve, 1000));

    console.log('Form submitted:', formData);
    alert('Formulaire soumis avec succès !');

    setIsSubmitting(false);
  };

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      bio: '',
      accountType: 'personal',
      acceptTerms: false,
      newsletter: false,
    });
    setErrors({});
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Exemple de Formulaire Simple</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Text Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Prénom"
            placeholder="Jean"
            value={formData.firstName}
            onChange={(e: any) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            error={errors.firstName}
            required
          />

          <Input
            label="Nom"
            placeholder="Dupont"
            value={formData.lastName}
            onChange={(e: any) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            error={errors.lastName}
            required
          />
        </div>

        {/* Email and Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="jean.dupont@example.com"
            value={formData.email}
            onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
          />

          <Input
            label="Téléphone"
            type="tel"
            placeholder="0612345678"
            value={formData.phone}
            onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })}
            error={errors.phone}
            required
          />
        </div>

        {/* Date Picker */}
        <DatePicker
          label="Date de naissance"
          value={formData.birthDate}
          onChange={(e: any) =>
            setFormData({ ...formData, birthDate: e.target.value })
          }
          error={errors.birthDate}
          required
        />

        {/* Textarea */}
        <Textarea
          label="Biographie"
          placeholder="Parlez-nous de vous..."
          rows={4}
          maxLength={500}
          showCount
          value={formData.bio}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
            setFormData({ ...formData, bio: e.target.value })
          }
          error={errors.bio}
          helperText="Décrivez brièvement votre parcours professionnel."
        />

        {/* Radio Group */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type de compte
          </label>
          <RadioGroup>
            <Radio
              label="Personnel"
              description="Pour un usage personnel"
              value="personal"
              checked={formData.accountType === 'personal'}
              onChange={(value: any) =>
                setFormData({ ...formData, accountType: value as 'personal' | 'business' })
              }
            />
            <Radio
              label="Professionnel"
              description="Pour un usage professionnel"
              value="business"
              checked={formData.accountType === 'business'}
              onChange={(value: any) =>
                setFormData({ ...formData, accountType: value as 'personal' | 'business' })
              }
            />
          </RadioGroup>
        </div>

        {/* Checkboxes */}
        <div className="space-y-4">
          <Checkbox
            label="J'accepte les conditions d'utilisation"
            checked={formData.acceptTerms}
            onChange={(checked: any) =>
              setFormData({ ...formData, acceptTerms: checked })
            }
            error={errors.acceptTerms}
          />

          <Checkbox
            label="Je souhaite recevoir la newsletter"
            description="Recevez nos dernières actualités par email"
            checked={formData.newsletter}
            onChange={(checked: any) =>
              setFormData({ ...formData, newsletter: checked })
            }
          />
        </div>

        {/* File Upload Example */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Documents
          </label>
          <FileUpload
            accept=".pdf,.doc,.docx"
            multiple
            maxSize={10 * 1024 * 1024}
            onUpload={(files: any) => console.log('Files uploaded:', files)}
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi en cours...' : 'Soumettre'}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            Réinitialiser
          </Button>
        </div>
      </form>
    </div>
  );
}
