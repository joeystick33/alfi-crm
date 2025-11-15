# Form Components Usage Guide

## Quick Start

### Standalone Usage (No Dependencies Required)

```tsx
import { Input } from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';

function MyForm() {
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [agreed, setAgreed] = useState(false);

  return (
    <form>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <Textarea
        label="Bio"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={500}
        showCount
      />
      
      <Checkbox
        label="I agree to terms"
        checked={agreed}
        onChange={setAgreed}
      />
      
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### With React Hook Form + Zod (Recommended)

First, install dependencies:
```bash
npm install react-hook-form @hookform/resolvers/zod zod
```

Then use with validation:
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
import { Input } from '@/components/ui/Input';

const schema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(2, 'Minimum 2 caractères'),
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', name: '' },
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  error={form.formState.errors.email?.message}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
}
```

## Available Components

### Input
Text, email, password, number, tel, etc.
```tsx
<Input
  label="Email"
  type="email"
  placeholder="email@example.com"
  error="Error message"
  helperText="Helper text"
  leftIcon={<Icon />}
  rightIcon={<Icon />}
  required
  disabled
/>
```

### Textarea
Multi-line text input with character counter
```tsx
<Textarea
  label="Description"
  rows={4}
  maxLength={500}
  showCount
  error="Error message"
  helperText="Helper text"
/>
```

### Checkbox
Single checkbox with label and description
```tsx
<Checkbox
  label="I agree"
  description="Optional description"
  checked={value}
  onChange={(checked) => setValue(checked)}
  error="Error message"
/>
```

### Radio & RadioGroup
Radio buttons with grouping
```tsx
<RadioGroup>
  <Radio
    label="Option 1"
    value="opt1"
    checked={value === 'opt1'}
    onChange={(val) => setValue(val)}
  />
  <Radio
    label="Option 2"
    value="opt2"
    checked={value === 'opt2'}
    onChange={(val) => setValue(val)}
  />
</RadioGroup>
```

### DatePicker
Native date input with calendar icon
```tsx
<DatePicker
  label="Birth Date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
  min="1900-01-01"
  max="2024-12-31"
/>
```

### FileUpload
Drag-and-drop file upload
```tsx
<FileUpload
  accept=".pdf,.doc"
  multiple
  maxSize={5 * 1024 * 1024}
  onUpload={(files) => handleFiles(files)}
/>
```

## Common Validation Patterns (Zod)

```tsx
// Email
email: z.string().email('Email invalide')

// Required string with min length
name: z.string().min(2, 'Minimum 2 caractères')

// Optional with max length
bio: z.string().max(500).optional()

// Phone (French format)
phone: z.string().regex(/^[0-9]{10}$/, 'Format: 0612345678')

// Enum
type: z.enum(['personal', 'business'])

// Boolean with validation
terms: z.boolean().refine((val) => val === true, {
  message: 'Vous devez accepter',
})

// Password with requirements
password: z.string()
  .min(8, 'Minimum 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[0-9]/, 'Au moins un chiffre')

// Conditional validation
z.object({
  hasCompany: z.boolean(),
  companyName: z.string().optional(),
}).refine(
  (data) => !data.hasCompany || data.companyName,
  { message: 'Requis', path: ['companyName'] }
)
```

## Examples

- **SimpleFormExample.tsx** - Working example without dependencies
- **FormExample.tsx** - Full example with React Hook Form + Zod (requires dependencies)

## Documentation

See `components/forms/README.md` for complete API reference and advanced usage.

## Migration from CRM

All form components have been migrated and enhanced:
- ✅ TypeScript support
- ✅ React Hook Form integration
- ✅ Zod validation
- ✅ Improved accessibility
- ✅ Dark mode support
- ✅ Consistent API

## Support

For issues or questions:
- Check `components/forms/README.md` for detailed documentation
- See examples in `components/forms/`
- Refer to React Hook Form docs: https://react-hook-form.com/
- Refer to Zod docs: https://zod.dev/
