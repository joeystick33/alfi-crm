'use client';

/**
 * Complete Form Example with React Hook Form and Zod Validation
 * Dependencies installed: react-hook-form, @hookform/resolvers, zod
 */

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Radio, { RadioGroup } from '@/components/ui/Radio';
import DatePicker from '@/components/ui/DatePicker';
import FileUpload from '@/components/ui/FileUpload';
import { Button } from '@/components/ui/Button';

// Example Zod schema for form validation
const formSchema = z.object({
  firstName: z.string().min(2, {
    message: 'Le prénom doit contenir au moins 2 caractères.',
  }),
  lastName: z.string().min(2, {
    message: 'Le nom doit contenir au moins 2 caractères.',
  }),
  email: z.string().email({
    message: 'Veuillez entrer une adresse email valide.',
  }),
  phone: z.string().regex(/^[0-9]{10}$/, {
    message: 'Le numéro de téléphone doit contenir 10 chiffres.',
  }),
  birthDate: z.string().min(1, {
    message: 'La date de naissance est requise.',
  }),
  bio: z.string().max(500, {
    message: 'La biographie ne peut pas dépasser 500 caractères.',
  }).optional(),
  accountType: z.enum(['personal', 'business']),
  acceptTerms: z.boolean().refine((val: any) => val === true, {
    message: 'Vous devez accepter les conditions d\'utilisation.',
  }),
  newsletter: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function FormExample() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      bio: '',
      accountType: 'personal',
      acceptTerms: false,
      newsletter: false,
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log('Form submitted:', data);
    alert('Formulaire soumis avec succès !');
    // Handle form submission
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Exemple de Formulaire avec Zod</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Text Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jean"
                      error={form.formState.errors.firstName?.message}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Dupont"
                      error={form.formState.errors.lastName?.message}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jean.dupont@example.com"
                      error={form.formState.errors.email?.message}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="0612345678"
                      error={form.formState.errors.phone?.message}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Date Picker */}
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de naissance</FormLabel>
                <FormControl>
                  <DatePicker
                    error={form.formState.errors.birthDate?.message}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Textarea */}
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Biographie</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Parlez-nous de vous..."
                    rows={4}
                    maxLength={500}
                    showCount
                    error={form.formState.errors.bio?.message}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Décrivez brièvement votre parcours professionnel.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Radio Group */}
          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de compte</FormLabel>
                <FormControl>
                  <RadioGroup>
                    <Radio
                      label="Personnel"
                      description="Pour un usage personnel"
                      value="personal"
                      checked={field.value === 'personal'}
                      onChange={field.onChange}
                    />
                    <Radio
                      label="Professionnel"
                      description="Pour un usage professionnel"
                      value="business"
                      checked={field.value === 'business'}
                      onChange={field.onChange}
                    />
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Checkboxes */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Checkbox
                      label="J'accepte les conditions d'utilisation"
                      checked={field.value}
                      onChange={field.onChange}
                      error={form.formState.errors.acceptTerms?.message}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newsletter"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Checkbox
                      label="Je souhaite recevoir la newsletter"
                      description="Recevez nos dernières actualités par email"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* File Upload Example (not in schema for simplicity) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Envoi en cours...' : 'Soumettre'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Réinitialiser
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
