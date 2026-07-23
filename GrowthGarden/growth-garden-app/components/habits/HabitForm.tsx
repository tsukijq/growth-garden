'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ScheduleType } from '@/lib/types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface HabitFormProps {
  /** Server action to call on submit */
  action: (formData: FormData) => Promise<{
    success: boolean;
    error?: string;
    fieldErrors?: Record<string, string>;
  }>;
  /** Pre-populated values for editing */
  defaultValues?: {
    name?: string;
    schedule_type?: ScheduleType;
    schedule_days?: number[] | null;
  };
  /** Submit button text */
  submitLabel?: string;
}

export function HabitForm({ action, defaultValues, submitLabel = 'Create Habit' }: HabitFormProps) {
  const router = useRouter();
  const [name, setName] = useState(defaultValues?.name || '');
  const [scheduleType, setScheduleType] = useState<ScheduleType>(defaultValues?.schedule_type || 'daily');
  const [scheduleDays, setScheduleDays] = useState<number[]>(defaultValues?.schedule_days || []);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [isPending, setIsPending] = useState(false);

  // Clear schedule_days when switching to daily
  useEffect(() => {
    if (scheduleType === 'daily') {
      setScheduleDays([]);
    }
  }, [scheduleType]);

  function toggleDay(day: number) {
    if (scheduleType === 'weekly') {
      // Weekly: exactly one day
      setScheduleDays([day]);
    } else {
      // Custom: toggle multiple days
      setScheduleDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsPending(true);

    const formData = new FormData();
    formData.set('name', name);
    formData.set('schedule_type', scheduleType);
    if (scheduleDays.length > 0) {
      formData.set('schedule_days', scheduleDays.join(','));
    }

    const result = await action(formData);

    setIsPending(false);

    if (result.success) {
      router.push('/habits');
      router.refresh();
    } else {
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
      if (result.error) {
        setGeneralError(result.error);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {/* Habit Name */}
      <div>
        <label htmlFor="habit-name" className="text-xs text-[#6b7a6b] mb-1 block">
          Habit name
        </label>
        <input
          id="habit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="e.g. Morning meditation"
          aria-describedby={fieldErrors.name ? 'habit-name-error' : undefined}
          aria-invalid={!!fieldErrors.name}
          className={`w-full px-4 py-3 bg-white border rounded-lg text-[#1F2A1F] focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30 focus:border-[#4A7C59] transition-colors ${
            fieldErrors.name ? 'border-[#c44030]' : 'border-[#e2e5da]'
          }`}
        />
        <div className="flex justify-between mt-1">
          {fieldErrors.name && (
            <p id="habit-name-error" role="alert" className="text-xs text-[#c44030]">
              {fieldErrors.name}
            </p>
          )}
          <p className="text-xs text-[#6b7a6b] ml-auto">{name.length}/50</p>
        </div>
      </div>

      {/* Schedule Type */}
      <div>
        <label className="text-xs text-[#6b7a6b] mb-2 block">Schedule</label>
        <div className="flex gap-2">
          {(['daily', 'weekly', 'custom'] as ScheduleType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setScheduleType(type)}
              aria-pressed={scheduleType === type}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                scheduleType === type
                  ? 'bg-[#4A7C59] text-white'
                  : 'bg-white border border-[#e2e5da] text-[#6b7a6b] hover:border-[#4A7C59] hover:text-[#1F2A1F]'
              }`}
            >
              {type === 'daily' ? 'Daily' : type === 'weekly' ? 'Weekly' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {/* Day Picker (for weekly/custom) */}
      {scheduleType !== 'daily' && (
        <div>
          <label className="text-xs text-[#6b7a6b] mb-2 block">
            {scheduleType === 'weekly' ? 'Choose a day' : 'Select days'}
          </label>
          <div className="flex gap-1.5" role="group" aria-label="Day selection">
            {DAY_LABELS.map((label, index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggleDay(index)}
                aria-pressed={scheduleDays.includes(index)}
                aria-label={label}
                className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  scheduleDays.includes(index)
                    ? 'bg-[#4A7C59] text-white'
                    : 'bg-white border border-[#e2e5da] text-[#6b7a6b] hover:border-[#4A7C59]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {fieldErrors.schedule && (
            <p role="alert" className="text-xs text-[#c44030] mt-1">
              {fieldErrors.schedule}
            </p>
          )}
        </div>
      )}

      {/* General Error */}
      {generalError && (
        <p role="alert" className="text-sm text-[#c44030] bg-[#c44030]/5 px-4 py-2.5 rounded-lg">
          {generalError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-lg bg-[#4A7C59] text-white font-medium hover:bg-[#3d6b4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
