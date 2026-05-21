import React, { useMemo, useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { CycleLogFormData } from '../../lib/cycleLogsApi';

interface CycleLogFormProps {
  onSubmit: (data: CycleLogFormData) => void;
  initialData?: CycleLogFormData;
  isLoading?: boolean;
  submitLabel?: string;
}

const todayIso = () => new Date().toISOString().split('T')[0];

export const CycleLogForm: React.FC<CycleLogFormProps> = ({
  onSubmit,
  initialData,
  isLoading,
  submitLabel = 'Save Period Record • Gika Amakuru',
}) => {
  const [startDate, setStartDate] = useState(
    initialData?.start_date?.split('T')[0] || todayIso()
  );
  const [endDate, setEndDate] = useState(initialData?.end_date?.split('T')[0] || '');
  const [flowLevel, setFlowLevel] = useState<'light' | 'medium' | 'heavy'>(
    initialData?.flow_level || 'medium'
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
    initialData?.symptoms || []
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [errorMsg, setErrorMsg] = useState('');

  const maxDate = todayIso();

  const periodDays = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return null;
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    return days;
  }, [startDate, endDate]);

  const symptomsList = [
    'Cramps',
    'Headache',
    'Bloating',
    'Mood Swings',
    'Fatigue / Tiredness',
    'Back Pain',
    'Acne',
    'Nausea',
  ];

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!startDate) {
      setErrorMsg('Period start date is required.');
      return;
    }

    if (startDate > maxDate) {
      setErrorMsg('Start date cannot be in the future.');
      return;
    }

    if (endDate && endDate > maxDate) {
      setErrorMsg('End date cannot be in the future.');
      return;
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      setErrorMsg('Period end date cannot be before start date.');
      return;
    }

    onSubmit({
      start_date: startDate,
      end_date: endDate || undefined,
      flow_level: flowLevel,
      symptoms: selectedSymptoms,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5 text-left font-sans">
      {errorMsg && (
        <div className="p-3.5 bg-mauve/10 border border-mauve/20 rounded-xl text-xs text-mauve font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-mauve shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          type="date"
          label="Start date * (Igihe byatangiye)"
          value={startDate}
          max={maxDate}
          onChange={(e) => setStartDate(e.target.value)}
          icon={<Calendar className="w-4 h-4" />}
          required
        />
        <Input
          type="date"
          label="End date (Igihe byarangiriye)"
          value={endDate}
          min={startDate || undefined}
          max={maxDate}
          onChange={(e) => setEndDate(e.target.value)}
          icon={<Calendar className="w-4 h-4" />}
        />
      </div>

      {periodDays != null && (
        <p className="text-xs text-sage font-semibold bg-sage/10 border border-sage/20 rounded-lg px-3 py-2">
          Period length: {periodDays} day{periodDays !== 1 ? 's' : ''} (saved automatically on the server)
        </p>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Flow Intensity (Uburemere)
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'medium', 'heavy'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFlowLevel(level)}
              className={`py-3 px-4 rounded-xl border text-center transition-all cursor-pointer font-bold capitalize text-xs relative overflow-hidden ${
                flowLevel === level
                  ? 'border-terracotta bg-terracotta/10 text-terracotta ring-1 ring-terracotta'
                  : 'border-border bg-surface text-muted hover:border-muted'
              }`}
            >
              {level}
              {level === 'light' && (
                <p className="text-[10px] font-medium text-muted mt-0.5">Mild flow</p>
              )}
              {level === 'medium' && (
                <p className="text-[10px] font-medium text-muted mt-0.5">Average</p>
              )}
              {level === 'heavy' && (
                <p className="text-[10px] font-medium text-muted mt-0.5">Strong flow</p>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Symptoms Experienced (Ibimenyetso)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {symptomsList.map((symptom) => {
            const isChecked = selectedSymptoms.includes(symptom);
            return (
              <button
                key={symptom}
                type="button"
                onClick={() => toggleSymptom(symptom)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs text-left cursor-pointer transition-colors ${
                  isChecked
                    ? 'border-sage bg-sage/10 text-sage font-semibold'
                    : 'border-border bg-surface text-muted hover:bg-cream/40'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded border border-current flex items-center justify-center text-[10px]">
                  {isChecked && '✓'}
                </span>
                <span className="truncate">{symptom}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-left font-sans">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
          Notes (Ikindi wandika)
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Felt slightly moody in the morning. Hibiscus tea helped."
          className="block w-full rounded-md border border-border bg-surface p-3 text-sm text-ink transition-all focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:outline-none"
        />
      </div>

      <div className="pt-2">
        <Button type="submit" isLoading={isLoading} className="w-full h-11">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
export default CycleLogForm;
