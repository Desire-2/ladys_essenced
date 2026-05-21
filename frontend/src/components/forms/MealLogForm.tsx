import React, { useState } from 'react';
import { Apple, Plus, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { MealLogFormData } from '../../lib/mealLogsApi';

interface MealLogFormProps {
  onSubmit: (data: MealLogFormData) => void;
  isLoading?: boolean;
}

export const MealLogForm: React.FC<MealLogFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [foodInput, setFoodInput] = useState('');
  const [foodItems, setFoodItems] = useState<string[]>([]);
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fats, setFats] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [moodAfter, setMoodAfter] = useState<string>('😊 Energized');

  const moods = [
    { label: '😊 Energized', value: '😊 Energized' },
    { label: '😴 Sleepy', value: '😴 Sleepy' },
    { label: '😋 Refreshed', value: '😋 Refreshed' },
    { label: '😔 Crampy', value: '😔 Crampy' },
  ];

  // Quick foods suggestion based on Rwandan nutritious crops
  const suggestedFoods = [
    'Porridge (Igikoma)', 'Beans (Ibihyimbo)', 'Cassava (Inyumbati)',
    'Amaranth Dodo (Imboga)', 'Sweet Potato (Ibijumba)', 'Avocado (Avoka)',
    'Hibiscus Tea (Umuti w’ihungabana)'
  ];

  const handleAddFoodItem = (food: string) => {
    const cleanFood = food.trim();
    if (cleanFood && !foodItems.includes(cleanFood)) {
      setFoodItems(prev => [...prev, cleanFood]);
    }
  };

  const handleAddCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddFoodItem(foodInput);
    setFoodInput('');
  };

  const handleRemoveFoodItem = (food: string) => {
    setFoodItems(prev => prev.filter(f => f !== food));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (foodItems.length === 0) {
      alert('Please add at least one logged food item.');
      return;
    }

    onSubmit({
      meal_type: mealType,
      food_items: foodItems,
      protein: parseFloat(protein) || undefined,
      carbs: parseFloat(carbs) || undefined,
      fats: parseFloat(fats) || undefined,
      calories: parseFloat(calories) || undefined,
      mood_after: moodAfter,
    });
  };

  return (
    <div className="space-y-5 text-left font-sans">
      
      {/* Meal Category Selectors */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Meal Category (Ibyo uriye ryari)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMealType(type)}
              className={`py-2 px-1 rounded-lg border text-center font-bold capitalize text-xs relative cursor-pointer ${
                mealType === type
                  ? 'border-terracotta bg-terracotta/10 text-terracotta shadow-sm'
                  : 'border-border bg-surface text-muted hover:border-muted'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic item tags input */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Food Items Logged (Ibiribwa)
        </label>
        <div className="flex gap-2">
          <Input
            value={foodInput}
            onChange={(e) => setFoodInput(e.target.value)}
            placeholder="e.g. Beans, Cassava, or Amaranth"
            icon={<Apple className="w-4 h-4" />}
            className="flex-grow"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddFoodItem(foodInput);
                setFoodInput('');
              }
            }}
          />
          <Button 
            variant="secondary" 
            onClick={handleAddCustomFood}
            className="shrink-0 h-[42px] px-3.5"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Selected food tags list */}
        {foodItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 border border-border rounded-lg bg-cream/20">
            {foodItems.map((food, i) => (
              <span 
                key={i} 
                className="inline-flex items-center gap-1 text-xs bg-surface border border-border px-2.5 py-1 rounded-full text-ink font-semibold"
              >
                {food}
                <button 
                  type="button" 
                  onClick={() => handleRemoveFoodItem(food)}
                  className="text-muted hover:text-mauve"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Suggested traditional meal helpers */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Nutritious local foods (Kanda uhitemo):</span>
        <div className="flex flex-wrap gap-1.5">
          {suggestedFoods.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAddFoodItem(sug)}
              className="text-[11px] bg-surface text-muted border border-border hover:border-sage hover:text-sage hover:bg-sage/5 transition-all py-1 px-2.5 rounded-full cursor-pointer font-medium"
            >
              + {sug}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-border my-2" />

      {/* Optional macro numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Input
          type="number"
          label="Protein (g)"
          placeholder="e.g. 15"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
        />
        <Input
          type="number"
          label="Carbs (g)"
          placeholder="e.g. 60"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
        />
        <Input
          type="number"
          label="Fats (g)"
          placeholder="e.g. 10"
          value={fats}
          onChange={(e) => setFats(e.target.value)}
        />
        <Input
          type="number"
          label="Calories (kcal)"
          placeholder="e.g. 350"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
      </div>

      {/* Mood Picker Row */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Mood After Meal (Akanyamuneza nyuma yo kurya)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {moods.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMoodAfter(m.value)}
              className={`py-2 px-1 rounded-lg border text-center cursor-pointer text-xs font-semibold ${
                moodAfter === m.value
                  ? 'border-sage bg-sage/10 text-sage'
                  : 'border-border bg-surface text-muted hover:bg-cream/20'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button 
          type="button" 
          onClick={handleFormSubmit}
          isLoading={isLoading} 
          className="w-full h-11"
        >
          Save Meal Log • Gika Ibyo Uriye
        </Button>
      </div>

    </div>
  );
};
export default MealLogForm;
