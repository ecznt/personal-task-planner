'use client';

import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  7: 'Pazar',
};

export type RecurrenceFormValues = {
  readonly mode: 'CALENDAR_BASED' | 'COMPLETION_BASED';
  readonly frequency: 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  readonly interval: number;
  readonly selectedWeekdays: number[];
  readonly dayOfMonth: number | null;
  readonly monthOfYear: number | null;
};

type RecurrenceFormProps = {
  readonly onSubmit: (values: RecurrenceFormValues) => void;
  readonly onCancel: () => void;
  readonly isPending: boolean;
  readonly error: string | undefined;
};

export function RecurrenceForm({ onSubmit, onCancel, isPending, error }: RecurrenceFormProps) {
  const [frequency, setFrequency] = useState('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<number | null>(null);
  const [monthOfYear, setMonthOfYear] = useState<number | null>(null);

  const handleSubmit = () => {
    onSubmit({
      mode: 'CALENDAR_BASED',
      frequency: frequency as RecurrenceFormValues['frequency'],
      interval,
      selectedWeekdays,
      dayOfMonth,
      monthOfYear,
    });
  };

  return (
    <div className="mt-1 space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Field>
        <FieldLabel>Sıklık</FieldLabel>
        <Select
          value={frequency}
          onChange={(e) => {
            setFrequency(e.target.value);
            setSelectedWeekdays([]);
            setDayOfMonth(null);
            setMonthOfYear(null);
          }}
        >
          <option value="DAILY">Her gün</option>
          <option value="WEEKDAYS">Her iş günü</option>
          <option value="WEEKLY">Her hafta</option>
          <option value="MONTHLY">Her ay</option>
          <option value="YEARLY">Her yıl</option>
        </Select>
      </Field>

      {frequency !== 'WEEKDAYS' && (
        <Field>
          <FieldLabel>Her ... bir</FieldLabel>
          <Input
            type="number"
            min={1}
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value) || 1)}
            className="h-8"
          />
        </Field>
      )}

      {frequency === 'WEEKLY' && (
        <Field>
          <FieldLabel>Günler</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setSelectedWeekdays((prev) =>
                    prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
                  );
                }}
                className={`rounded-lg border px-3 py-1 text-sm transition-all duration-150 ${
                  selectedWeekdays.includes(day)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-transparent hover:bg-muted'
                }`}
              >
                {WEEKDAY_LABELS[day]}
              </button>
            ))}
          </div>
        </Field>
      )}

      {frequency === 'MONTHLY' && (
        <Field>
          <FieldLabel>Ayın günü</FieldLabel>
          <Input
            type="number"
            min={1}
            max={31}
            value={dayOfMonth ?? ''}
            onChange={(e) => setDayOfMonth(e.target.value ? Number(e.target.value) : null)}
            placeholder="1-31"
            className="h-8"
          />
        </Field>
      )}

      {frequency === 'YEARLY' && (
        <>
          <Field>
            <FieldLabel>Ay</FieldLabel>
            <Input
              type="number"
              min={1}
              max={12}
              value={monthOfYear ?? ''}
              onChange={(e) => setMonthOfYear(e.target.value ? Number(e.target.value) : null)}
              placeholder="1-12"
              className="h-8"
            />
          </Field>
          <Field>
            <FieldLabel>Gün</FieldLabel>
            <Input
              type="number"
              min={1}
              max={31}
              value={dayOfMonth ?? ''}
              onChange={(e) => setDayOfMonth(e.target.value ? Number(e.target.value) : null)}
              placeholder="1-31"
              className="h-8"
            />
          </Field>
        </>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="transition-transform duration-150 active:scale-[0.97]"
        >
          İptal
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || (frequency === 'WEEKLY' && selectedWeekdays.length === 0)}
          className="transition-transform duration-150 active:scale-[0.97]"
        >
          {isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  );
}
