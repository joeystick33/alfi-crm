# Form Components Documentation

This directory contains form components migrated from CRM and adapted for use with React Hook Form and Zod validation in alfi-crm.

## Overview

All form components have been converted to TypeScript and are fully compatible with:
- **React Hook Form** - For form state management
- **Zod** - For schema validation
- **Accessibility** - ARIA attributes and keyboard navigation
- **Dark Mode** - Full dark mode support

## Components

### Form Components (React Hook Form Integration)

Located in `components/ui/`:

- **Form.tsx** - Form context provider and field components
- **Input.tsx** - Text input with validation
- **Textarea.tsx** - Multi-line text input
- **Checkbox.tsx** - Checkbox with label and description
- **Radio.tsx** - Radio button with RadioGroup
- **DatePicker.tsx** - Date input with calendar icon
- **FileUpload.tsx** - Drag-and-drop file upload

### Usage with React Hook Form and Zod

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import Input from '@/components/ui/Input';

// Define your schema
const schema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
});

type FormValues = z.infer<typeof schema>;

function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      name: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input
                  placeholder="Votre nom"
                  error={form.formState.errors.name?.message}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <button type="submit">Soumettre</button>
      </form>
    </Form>
  );
}
```

## Component Details

### Input

```tsx
<Input
  label="Email"
  type="email"
  placeholder="email@example.com"
  error="Message d'erreur"
  helperText="Texte d'aide"
  leftIcon={<Icon />}
  rightIcon={<Icon />}
  required
  disabled
  fullWidth
/>
```

**Props:**
- `label?: string` - Label text
- `error?: string` - Error message
- `helperText?: string` - Helper text below input
- `leftIcon?: ReactNode` - Icon on the left
- `rightIcon?: ReactNode` - Icon on the right
- `fullWidth?: boolean` - Full width input
- `required?: boolean` - Required field
- `disabled?: boolean` - Disabled state

### Textarea

```tsx
<Textarea
  label="Description"
  rows={4}
  maxLength={500}
  showCount
  error="Message d'erreur"
  helperText="Texte d'aide"
  required
/>
```

**Props:**
- `label?: string` - Label text
- `rows?: number` - Number of rows (default: 4)
- `maxLength?: number` - Maximum character count
- `showCount?: boolean` - Show character counter
- `error?: string` - Error message
- `helperText?: string` - Helper text
- `required?: boolean` - Required field

### Checkbox

```tsx
<Checkbox
  label="J'accepte les conditions"
  description="Description optionnelle"
  checked={value}
  onChange={(checked) => setValue(checked)}
  error="Message d'erreur"
  disabled
/>
```

**Props:**
- `label?: string` - Label text
- `description?: string` - Description text
- `checked?: boolean` - Checked state
- `onChange?: (checked: boolean) => void` - Change handler
- `error?: string` - Error message
- `disabled?: boolean` - Disabled state

### Radio & RadioGroup

```tsx
<RadioGroup>
  <Radio
    label="Option 1"
    description="Description de l'option 1"
    value="option1"
    checked={value === 'option1'}
    onChange={(value) => setValue(value)}
  />
  <Radio
    label="Option 2"
    value="option2"
    checked={value === 'option2'}
    onChange={(value) => setValue(value)}
  />
</RadioGroup>
```

**Radio Props:**
- `label?: string` - Label text
- `description?: string` - Description text
- `value: string` - Radio value
- `checked?: boolean` - Checked state
- `onChange?: (value: string) => void` - Change handler
- `name?: string` - Radio group name
- `error?: string` - Error message

### DatePicker

```tsx
<DatePicker
  label="Date de naissance"
  value={date}
  onChange={(e) => setDate(e.target.value)}
  min="1900-01-01"
  max="2024-12-31"
  error="Message d'erreur"
  required
/>
```

**Props:**
- `label?: string` - Label text
- `value?: string` - Date value (YYYY-MM-DD)
- `onChange?: (e: ChangeEvent) => void` - Change handler
- `min?: string` - Minimum date
- `max?: string` - Maximum date
- `error?: string` - Error message
- `required?: boolean` - Required field

### FileUpload

```tsx
<FileUpload
  accept=".pdf,.doc,.docx"
  multiple
  maxSize={5 * 1024 * 1024} // 5MB
  onUpload={(files) => handleFiles(files)}
  disabled
/>
```

**Props:**
- `accept?: string` - Accepted file types
- `multiple?: boolean` - Allow multiple files
- `maxSize?: number` - Maximum file size in bytes (default: 5MB)
- `onUpload?: (files: File[]) => void` - Upload handler
- `disabled?: boolean` - Disabled state

## Validation with Zod

### Common Validation Patterns

```tsx
import * as z from 'zod';

// Email validation
email: z.string().email('Email invalide')

// Required string with min length
name: z.string().min(2, 'Minimum 2 caractères')

// Optional string with max length
bio: z.string().max(500, 'Maximum 500 caractères').optional()

// Phone number (French format)
phone: z.string().regex(/^[0-9]{10}$/, 'Format: 0612345678')

// Date validation
birthDate: z.string().min(1, 'Date requise')

// Enum validation
accountType: z.enum(['personal', 'business'], {
  required_error: 'Sélectionnez un type',
})

// Boolean with custom validation
acceptTerms: z.boolean().refine((val) => val === true, {
  message: 'Vous devez accepter les conditions',
})

// Number validation
age: z.number().min(18, 'Minimum 18 ans').max(120, 'Maximum 120 ans')

// Custom validation
password: z.string()
  .min(8, 'Minimum 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[0-9]/, 'Au moins un chiffre')
```

### Complex Validation

```tsx
// Conditional validation
const schema = z.object({
  hasCompany: z.boolean(),
  companyName: z.string().optional(),
}).refine(
  (data) => {
    if (data.hasCompany) {
      return data.companyName && data.companyName.length > 0;
    }
    return true;
  },
  {
    message: 'Le nom de l\'entreprise est requis',
    path: ['companyName'],
  }
);

// Password confirmation
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});
```

## Accessibility Features

All form components include:

- ✅ Proper ARIA labels and descriptions
- ✅ Error announcements with `role="alert"`
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Screen reader compatibility
- ✅ Required field indicators

## Dark Mode Support

All components automatically adapt to dark mode using Tailwind's `dark:` variants.

## Migration Notes

### Changes from CRM Components

1. **TypeScript Conversion**: All components now use TypeScript with proper type definitions
2. **Zod Integration**: Full support for Zod schema validation
3. **React Hook Form**: Optimized for use with React Hook Form
4. **Improved Accessibility**: Enhanced ARIA attributes and keyboard navigation
5. **Consistent API**: Unified prop naming and behavior across components

### Breaking Changes

- `onChange` handlers now use proper TypeScript types
- Some prop names have been standardized (e.g., `helperText` instead of `helper`)
- File upload now returns `File[]` instead of mixed types

## Examples

See `FormExample.tsx` for a complete working example with all form components and Zod validation.

## Testing

Form components should be tested with:
- Unit tests for individual components
- Integration tests with React Hook Form
- Validation tests with Zod schemas
- Accessibility tests with screen readers

## Best Practices

1. **Always use Zod schemas** for validation
2. **Provide clear error messages** in French
3. **Use FormField wrapper** for React Hook Form integration
4. **Include helper text** for complex fields
5. **Test accessibility** with keyboard navigation
6. **Handle loading states** during form submission
7. **Provide feedback** on successful submission

## Support

For issues or questions about form components, refer to:
- React Hook Form docs: https://react-hook-form.com/
- Zod docs: https://zod.dev/
- Accessibility guidelines: https://www.w3.org/WAI/WCAG21/quickref/
