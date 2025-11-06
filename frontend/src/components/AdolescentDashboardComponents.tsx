/**
 * Modern Adolescent Dashboard Components
 * Visual, emoji-heavy components for young women
 * Designed for low-literacy users with maximum visual appeal
 */

import React, { useState } from 'react';
import { Card, Badge, ProgressBar, Button, GradientBg } from '../UILibrary';

/**
 * CycleQuickLogger
 * Super simple 3-step cycle logging interface
 */
export const CycleQuickLogger: React.FC<{
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}> = ({ onSubmit, isLoading = false }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    startDate: '',
    flowLevel: '',
  });

  const handleSubmit = () => {
    onSubmit(data);
    setData({ startDate: '', flowLevel: '' });
    setStep(1);
  };

  return (
    <GradientBg variant="cycle" className="p-6 rounded-xl">
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-600 mb-2">Step {step} of 3</p>
          <ProgressBar value={step} max={3} color="primary" />
        </div>

        {step === 1 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 mb-4">📅 When did your period start?</p>
            <input
              type="date"
              value={data.startDate}
              onChange={(e) => setData({ ...data, startDate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button
              fullWidth
              className="mt-6"
              onClick={() => setStep(2)}
              disabled={!data.startDate}
            >
              Next ➜
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 mb-6">🩸 How's your flow?</p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { emoji: '🩸', label: 'Light', value: 'light' },
                { emoji: '🩸🩸', label: 'Medium', value: 'medium' },
                { emoji: '🩸🩸🩸', label: 'Heavy', value: 'heavy' },
              ].map((flow) => (
                <button
                  key={flow.value}
                  onClick={() => setData({ ...data, flowLevel: flow.value })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    data.flowLevel === flow.value
                      ? 'bg-rose-100 border-rose-500 scale-105'
                      : 'bg-white border-gray-200 hover:border-rose-300'
                  }`}
                >
                  <span className="text-3xl block mb-2">{flow.emoji}</span>
                  <span className="font-semibold text-sm">{flow.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button fullWidth onClick={() => setStep(3)} disabled={!data.flowLevel}>
                Next ➜
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 mb-6">✅ Ready to save?</p>
            <div className="bg-rose-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600">
                📅 {new Date(data.startDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">🩸 {data.flowLevel} flow</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setStep(2)}>
                ← Edit
              </Button>
              <Button
                fullWidth
                onClick={handleSubmit}
                loading={isLoading}
              >
                💾 Save Log
              </Button>
            </div>
          </div>
        )}
      </div>
    </GradientBg>
  );
};

/**
 * SymptomPicker
 * Visual emoji-based symptom selector
 */
export const SymptomPicker: React.FC<{
  selectedSymptoms?: string[];
  onSelect: (symptoms: string[]) => void;
  maxSelections?: number;
}> = ({ selectedSymptoms = [], onSelect, maxSelections = 999 }) => {
  const [selected, setSelected] = useState<string[]>(selectedSymptoms);

  const symptoms = [
    { emoji: '😣', label: 'Cramps', value: 'cramps' },
    { emoji: '🤢', label: 'Nausea', value: 'nausea' },
    { emoji: '😴', label: 'Tired', value: 'tired' },
    { emoji: '🤕', label: 'Headache', value: 'headache' },
    { emoji: '😤', label: 'Mood Swings', value: 'mood_swings' },
    { emoji: '🫧', label: 'Bloating', value: 'bloating' },
    { emoji: '🌶️', label: 'Hot Flashes', value: 'hot_flashes' },
    { emoji: '😎', label: 'None', value: 'none' },
  ];

  const toggleSymptom = (value: string) => {
    let newSelected: string[];

    if (value === 'none') {
      newSelected = selected.includes('none') ? [] : ['none'];
    } else {
      const filtered = selected.filter((s) => s !== 'none');
      if (filtered.includes(value)) {
        newSelected = filtered.filter((s) => s !== value);
      } else {
        newSelected = filtered.length >= maxSelections ? [...filtered.slice(1), value] : [...filtered, value];
      }
    }

    setSelected(newSelected);
    onSelect(newSelected);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {symptoms.map((symptom) => (
        <button
          key={symptom.value}
          onClick={() => toggleSymptom(symptom.value)}
          className={`p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
            selected.includes(symptom.value)
              ? 'bg-rose-100 border-rose-500 shadow-md'
              : 'bg-white border-gray-200 hover:border-rose-300'
          }`}
        >
          <span className="text-4xl block mb-2">{symptom.emoji}</span>
          <span className="font-semibold text-xs md:text-sm">{symptom.label}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * MoodTracker
 * Emoji-based daily mood tracking
 */
export const MoodTracker: React.FC<{
  onMoodSelect: (mood: string) => void;
  onEnergySelect: (energy: string) => void;
  onStressSelect: (stress: string) => void;
}> = ({ onMoodSelect, onEnergySelect, onStressSelect }) => {
  const [mood, setMood] = useState('😊');
  const [energy, setEnergy] = useState('normal');
  const [stress, setStress] = useState('normal');

  const moodOptions = [
    { emoji: '😍', label: 'Excellent', value: 'excellent' },
    { emoji: '😊', label: 'Good', value: 'good' },
    { emoji: '😐', label: 'Okay', value: 'okay' },
    { emoji: '😔', label: 'Bad', value: 'bad' },
  ];

  const energyOptions = [
    { emoji: '⚡', label: 'High', value: 'high' },
    { emoji: '⚙️', label: 'Normal', value: 'normal' },
    { emoji: '🔋', label: 'Low', value: 'low' },
  ];

  const stressOptions = [
    { emoji: '😌', label: 'Relaxed', value: 'relaxed' },
    { emoji: '😐', label: 'Normal', value: 'normal' },
    { emoji: '😰', label: 'Stressed', value: 'stressed' },
  ];

  return (
    <div className="space-y-8">
      {/* Mood */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">😊 How's your mood?</h3>
        <div className="grid grid-cols-4 gap-3">
          {moodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setMood(option.emoji);
                onMoodSelect(option.value);
              }}
              className={`p-4 rounded-lg border-2 transition-all transform hover:scale-110 ${
                mood === option.emoji
                  ? 'bg-amber-100 border-amber-500 shadow-lg scale-110'
                  : 'bg-white border-gray-200 hover:border-amber-300'
              }`}
            >
              <span className="text-4xl">{option.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">⚡ Energy Level?</h3>
        <div className="grid grid-cols-3 gap-4">
          {energyOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setEnergy(option.value);
                onEnergySelect(option.value);
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                energy === option.value
                  ? 'bg-green-100 border-green-500 shadow-md'
                  : 'bg-white border-gray-200 hover:border-green-300'
              }`}
            >
              <span className="text-3xl block mb-2">{option.emoji}</span>
              <span className="font-semibold text-sm">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stress */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">😌 Stress Level?</h3>
        <div className="grid grid-cols-3 gap-4">
          {stressOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setStress(option.value);
                onStressSelect(option.value);
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                stress === option.value
                  ? 'bg-blue-100 border-blue-500 shadow-md'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
            >
              <span className="text-3xl block mb-2">{option.emoji}</span>
              <span className="font-semibold text-sm">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * CyclePhaseGuide
 * Nutrition and wellness guide based on cycle phase
 */
export const CyclePhaseGuide: React.FC<{
  cycleDay?: number;
  totalDays?: number;
}> = ({ cycleDay = 15, totalDays = 28 }) => {
  const isFollicular = cycleDay <= 14;
  const phase = isFollicular ? 'follicular' : 'luteal';

  return (
    <Card
      variant="elevated"
      className={`border-l-4 ${
        isFollicular ? 'border-l-green-500 bg-green-50' : 'border-l-rose-500 bg-rose-50'
      }`}
    >
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        {isFollicular ? '🌱 Follicular Phase' : '🌙 Luteal Phase'}
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {isFollicular ? (
          <>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-2xl mb-1">🥗</p>
              <p className="text-xs font-semibold text-gray-600">Fresh vegetables</p>
              <p className="text-xs text-gray-500">Leafy greens, berries</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-2xl mb-1">💪</p>
              <p className="text-xs font-semibold text-gray-600">Exercise</p>
              <p className="text-xs text-gray-500">High intensity workouts</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-2xl mb-1">🌅</p>
              <p className="text-xs font-semibold text-gray-600">Energy</p>
              <p className="text-xs text-gray-500">Often feel energized</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-2xl mb-1">🧠</p>
              <p className="text-xs font-semibold text-gray-600">Mood</p>
              <p className="text-xs text-gray-500">Usually more upbeat</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-2xl mb-1">🥩</p>
              <p className="text-xs font-semibold text-gray-600">Protein</p>
              <p className="text-xs text-gray-500">Red meat, beans</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-2xl mb-1">🧘‍♀️</p>
              <p className="text-xs font-semibold text-gray-600">Exercise</p>
              <p className="text-xs text-gray-500">Gentle, restorative</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-2xl mb-1">😴</p>
              <p className="text-xs font-semibold text-gray-600">Rest</p>
              <p className="text-xs text-gray-500">Need more sleep</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-2xl mb-1">💧</p>
              <p className="text-xs font-semibold text-gray-600">Hydration</p>
              <p className="text-xs text-gray-500">Stay well hydrated</p>
            </div>
          </>
        )}
      </div>

      <Badge variant={isFollicular ? 'success' : 'warning'}>
        {isFollicular ? '📅 Days 1-14' : '📅 Days 15-28'}
      </Badge>
    </Card>
  );
};

/**
 * MealQuickLogger
 * Simple meal logging interface
 */
export const MealQuickLogger: React.FC<{
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}> = ({ onSubmit, isLoading = false }) => {
  const [mealType, setMealType] = useState('breakfast');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    onSubmit({ mealType, description });
    setDescription('');
  };

  const mealEmojis = {
    breakfast: '🌅',
    lunch: '🍽️',
    dinner: '🌙',
    snack: '🍿',
  };

  return (
    <Card variant="elevated" className="border-l-4 border-l-green-500 bg-green-50">
      <h3 className="text-lg font-bold text-gray-900 mb-4">🍽️ What did you eat?</h3>

      <div className="space-y-4">
        {/* Meal Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Meal Type</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(mealEmojis).map(([type, emoji]) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  mealType === type
                    ? 'bg-green-100 border-green-500 shadow-md'
                    : 'bg-white border-gray-200 hover:border-green-300'
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <p className="text-xs font-semibold capitalize mt-1">{type}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            What did you eat?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Rice with beans and vegetables..."
            className="w-full px-4 py-3 border border-green-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
          />
        </div>

        {/* Submit */}
        <Button
          fullWidth
          onClick={handleSubmit}
          disabled={!description.trim()}
          loading={isLoading}
        >
          💾 Save Meal
        </Button>
      </div>
    </Card>
  );
};

/**
 * HealthTip
 * Single health tip with icon
 */
export const HealthTip: React.FC<{
  emoji: string;
  title: string;
  description: string;
}> = ({ emoji, title, description }) => {
  return (
    <Card className="flex gap-4">
      <span className="text-4xl flex-shrink-0">{emoji}</span>
      <div>
        <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Card>
  );
};

/**
 * AppointmentBookingSimple
 * Simplified appointment booking
 */
export const AppointmentBookingSimple: React.FC<{
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    reason: '',
    preferredDate: '',
  });

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({ reason: '', preferredDate: '' });
  };

  return (
    <Card variant="elevated" className="border-l-4 border-l-blue-500 bg-blue-50">
      <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Schedule an Appointment</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Why do you need an appointment?
          </label>
          <select
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select reason...</option>
            <option value="general_checkup">General Health Checkup</option>
            <option value="cycle_issues">Cycle Issues</option>
            <option value="contraception">Contraception Advice</option>
            <option value="nutrition">Nutrition Consultation</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Preferred Date
          </label>
          <input
            type="date"
            value={formData.preferredDate}
            onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
            className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button
          fullWidth
          onClick={handleSubmit}
          disabled={!formData.reason || !formData.preferredDate}
          loading={isLoading}
        >
          📅 Book Appointment
        </Button>
      </div>
    </Card>
  );
};
