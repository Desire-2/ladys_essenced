import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';

interface NutritionDonutProps {
  protein?: number;
  carbs?: number;
  fats?: number;
  hasData?: boolean;
}

export const NutritionDonut: React.FC<NutritionDonutProps> = ({
  protein = 0,
  carbs = 0,
  fats = 0,
  hasData = false,
}) => {
  const data = [
    { name: 'Protein', value: protein || 0, color: '#8FAF8A' },
    { name: 'Carbs', value: carbs || 0, color: '#C4785A' },
    { name: 'Fats', value: fats || 0, color: '#7A4F6D' },
  ];

  const total = protein + carbs + fats;
  const isEmpty = !hasData || total === 0;

  if (isEmpty) {
    return (
      <div className="w-full font-sans select-none flex flex-col items-center justify-center py-8 text-center">
        <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-3">
          <span className="text-[10px] text-muted font-semibold uppercase tracking-wider">No meals</span>
        </div>
        <p className="text-xs text-muted max-w-[200px]">
          Log today&apos;s meals to see your protein, carbs, and fats breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full font-sans select-none flex flex-col items-center">
      <div className="w-full h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#FDFAF6',
                border: '1px solid #E8DDD4',
                borderRadius: '8px',
                fontFamily: 'DM Sans',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-semibold text-muted tracking-wider uppercase">Macros</span>
          <span className="text-xl font-extrabold font-heading text-ink">{total}g</span>
          <span className="text-[9px] text-muted">Today</span>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-1 text-xs font-semibold">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5 text-muted">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span>
              {item.name}: <strong className="text-ink">{item.value}g</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default NutritionDonut;
