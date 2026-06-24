import React, { useMemo, useState } from 'react';
import { Calendar, AlertCircle, Heart, Moon, Zap, Activity, Dumbbell } from 'lucide-react';
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

/* ── Wellness field options ── */
const MOOD_OPTIONS = [
  { value: '', label: 'Not tracked', emoji: '—' },
  { value: 'very_low', label: 'Very Low', emoji: '😢' },
  { value: 'low', label: 'Low', emoji: '😟' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'very_good', label: 'Very Good', emoji: '😊' },
];

const ENERGY_OPTIONS = [
  { value: '', label: 'Not tracked', icon: '—' },
  { value: 'very_low', label: 'Very Low', icon: '⬇' },
  { value: 'low', label: 'Low', icon: '↓' },
  { value: 'moderate', label: 'Moderate', icon: '→' },
  { value: 'high', label: 'High', icon: '↑' },
];

const SLEEP_OPTIONS = [
  { value: '', label: 'Not tracked', icon: '—' },
  { value: 'poor', label: 'Poor', icon: '😴' },
  { value: 'fair', label: 'Fair', icon: '🛌' },
  { value: 'good', label: 'Good', icon: '🌟' },
  { value: 'excellent', label: 'Excellent', icon: '✨' },
];

const STRESS_OPTIONS = [
  { value: '', label: 'Not tracked', icon: '—' },
  { value: 'low', label: 'Low', icon: '🧘' },
  { value: 'moderate', label: 'Moderate', icon: '😰' },
  { value: 'high', label: 'High', icon: '😤' },
  { value: 'very_high', label: 'Very High', icon: '😫' },
];

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

  /* ── Wellness state ── */
  const [mood, setMood] = useState(initialData?.mood ?? '');
  const [energyLevel, setEnergyLevel] = useState(initialData?.energy_level ?? '');
  const [sleepQuality, setSleepQuality] = useState(initialData?.sleep_quality ?? '');
  const [stressLevel, setStressLevel] = useState(initialData?.stress_level ?? '');
  const [exerciseActivities, setExerciseActivities] = useState(initialData?.exercise_activities ?? '');

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
      mood: mood || undefined,
      energy_level: energyLevel || undefined,
      sleep_quality: sleepQuality || undefined,
      stress_level: stressLevel || undefined,
      exercise_activities: exerciseActivities.trim() || undefined,
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

      {/* ── Wellness Tracking Section ── */}
      <div className="border-t border-border pt-4 mt-2">
        <p className="text-xs font-black uppercase tracking-wider text-[#7A4F6D] mb-3 flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5" /> Wellness Tracking (Optional)
        </p>
        <p className="text-[10px] text-muted/80 mb-4 -mt-2">Track mood, energy, sleep, and more to unlock personalized wellness trends.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mood */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
              <Heart className="w-3 h-3 text-[#7A4F6D]" /> Mood
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="block w-full h-10 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-ink focus:border-[#7A4F6D] focus:ring-1 focus:ring-[#7A4F6D]/30 focus:outline-none cursor-pointer"
            >
              {MOOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.emoji} {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Energy Level */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#C4785A]" /> Energy
            </label>
            <select
              value={energyLevel}
              onChange={(e) => setEnergyLevel(e.target.value)}
              className="block w-full h-10 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-ink focus:border-[#C4785A] focus:ring-1 focus:ring-[#C4785A]/30 focus:outline-none cursor-pointer"
            >
              {ENERGY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sleep Quality */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
              <Moon className="w-3 h-3 text-[#8FAF8A]" /> Sleep Quality
            </label>
            <select
              value={sleepQuality}
              onChange={(e) => setSleepQuality(e.target.value)}
              className="block w-full h-10 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-ink focus:border-[#8FAF8A] focus:ring-1 focus:ring-[#8FAF8A]/30 focus:outline-none cursor-pointer"
            >
              {SLEEP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stress Level */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#A87C6A]" /> Stress Level
            </label>
            <select
              value={stressLevel}
              onChange={(e) => setStressLevel(e.target.value)}
              className="block w-full h-10 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-ink focus:border-[#A87C6A] focus:ring-1 focus:ring-[#A87C6A]/30 focus:outline-none cursor-pointer"
            >
              {STRESS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Exercise activities */}
        <div className="space-y-1.5 mt-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
            <Dumbbell className="w-3 h-3 text-[#6B8E6B]" /> Exercise Activities
          </label>
          <input
            type="text"
            value={exerciseActivities}
            onChange={(e) => setExerciseActivities(e.target.value)}
            placeholder="e.g. Walking, yoga, cycling — list your activities"
            className="block w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-ink placeholder:text-muted/50 focus:border-[#6B8E6B] focus:ring-1 focus:ring-[#6B8E6B]/30 focus:outline-none"
          />
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
