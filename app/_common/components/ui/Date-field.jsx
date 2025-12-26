import Input from '@/app/_common/components/ui/Input';
import { Label } from '@/app/_common/components/ui/label';

export function DateField({ label, value, onChange, ...props }) {
  return (
    <div className="space-y-2">
      {label && <Label className="text-xs font-medium">{label}</Label>}
      <Input
        type="date"
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  );
}
