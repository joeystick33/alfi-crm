import DatePicker from './DatePicker';

export default function RangePicker({
  startLabel = 'Date de début',
  endLabel = 'Date de fin',
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  error,
  disabled = false,
  className = '',
}) {
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <DatePicker
        label={startLabel}
        value={startValue}
        onChange={onStartChange}
        max={endValue}
        disabled={disabled}
        error={error}
      />
      <DatePicker
        label={endLabel}
        value={endValue}
        onChange={onEndChange}
        min={startValue}
        disabled={disabled}
        error={error}
      />
    </div>
  );
}
