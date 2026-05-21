import React from 'react';
import { cn } from '../../lib/utils';

interface CycleCalendarProps {
  lastPeriodStart: string;
  cycleLength?: number;
  periodLength?: number;
}

export const CycleCalendar: React.FC<CycleCalendarProps> = ({
  lastPeriodStart,
  cycleLength = 28,
  periodLength = 5,
}) => {
  const start = new Date(lastPeriodStart || Date.now());
  const today = new Date();
  
  // Create current month dates (grid of 35 days)
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // First day of current month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon, etc.
  
  // Days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Cycle predictions logic relative to dates
  const isPeriodDay = (date: Date): boolean => {
    // Check if within logged period log range
    const diffTime = date.getTime() - start.getTime();
    if (diffTime < 0) return false;
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
    const cycleDay = diffDays % cycleLength;
    return cycleDay < periodLength;
  };

  const isFertileDay = (date: Date): boolean => {
    const diffTime = date.getTime() - start.getTime();
    if (diffTime < 0) return false;
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
    const cycleDay = diffDays % cycleLength;
    // Fertile window usually day 11 to day 16
    return cycleDay >= 11 && cycleDay <= 16;
  };

  const isToday = (date: Date): boolean => {
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const calculateCycleDay = (date: Date): number | null => {
    if (!lastPeriodStart) return null;
    const startDate = new Date(lastPeriodStart);
    // Use midnight comparison to get clean integer days because difference in hours can mess up math
    const d1 = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = d2.getTime() - d1.getTime();
    if (diffTime < 0) return null; // Date is before the cycle start
    
    // Calculate total complete days between the dates
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
    // Cycle day is 1-indexed (Day 1 to cycleLength)
    const cycleDay = (diffDays % cycleLength) + 1;
    return cycleDay;
  };

  const currentCycleDay = calculateCycleDay(today);

  // Generate grid cells
  const dayCells = [];
  // Fill empty spaces up to starting day
  for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
    dayCells.push(null);
  }
  
  // Fill days of month
  for (let d = 1; d <= daysInMonth; d++) {
    dayCells.push(new Date(currentYear, currentMonth, d));
  }

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="font-sans border border-border p-5 rounded-xl bg-surface select-none">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-heading font-semibold text-ink text-base">
          {monthNames[currentMonth]} {currentYear}
        </h4>
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-terracotta" />
            <span className="text-muted font-medium">Period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-mauve" />
            <span className="text-muted font-medium">Fertile</span>
          </div>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted mb-2 gap-1">
        {weekDays.map((wd, i) => (
          <div key={i} className="py-1">{wd}</div>
        ))}
      </div>

      {/* Days grid of 7 cols */}
      <div className="grid grid-cols-7 text-center grid-rows-5 gap-1 text-sm">
        {dayCells.map((cell, idx) => {
          if (!cell) {
            return <div key={idx} className="p-1 text-transparent bg-transparent" />;
          }

          const period = isPeriodDay(cell);
          const fertile = isFertileDay(cell);
          const current = isToday(cell);
          const cellCycleDay = calculateCycleDay(cell);

          return (
            <div
              key={idx}
              title={cellCycleDay ? `Cycle Day ${cellCycleDay}` : undefined}
              className={cn(
                'p-1.5 rounded-lg flex items-center justify-center font-semibold transition-all relative group cursor-pointer',
                period && 'bg-[#C4785A]/15 text-[#C4785A] border border-[#C4785A]/20',
                fertile && 'bg-[#7A4F6D]/15 text-[#7A4F6D] border border-[#7A4F6D]/20',
                !period && !fertile && 'hover:bg-cream text-ink bg-surface',
                current && 'ring-2 ring-[#7A4F6D] bg-[#7A4F6D] text-white font-bold hover:bg-[#7A4F6D]/90'
              )}
            >
              <span className="z-10">{cell.getDate()}</span>
              
              {current && cellCycleDay && (
                <span className="absolute -top-1 -right-1 bg-[#C4785A] text-white rounded-full text-[8px] px-1 h-3.5 min-w-3.5 flex items-center justify-center font-bold shadow-sm" title={`Today is Cycle Day ${cellCycleDay}`}>
                  {cellCycleDay}
                </span>
              )}

              {cellCycleDay && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden group-hover:block z-25 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap pointer-events-none transition-all duration-150">
                  Cycle Day {cellCycleDay}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bilingual Cycle Phase Banner */}
      {currentCycleDay && (
        <div className="mt-4 p-3 bg-[#7A4F6D]/5 border border-[#7A4F6D]/10 rounded-[16px] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-left select-none">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#7A4F6D] tracking-wider block">Today's Cycle Day • Umunsi</span>
            <span className="text-lg font-extrabold text-ink font-heading flex items-baseline gap-1">
              Day {currentCycleDay} 
              <span className="text-xs font-semibold text-muted font-sans">
                of {cycleLength}-day cycle
              </span>
            </span>
          </div>
          <div className="sm:text-right">
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Est. Phase • Igice kigeze</span>
            <span className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full border inline-block mt-0.5",
              currentCycleDay <= periodLength && "bg-[#C4785A]/10 text-[#C4785A] border-[#C4785A]/20",
              currentCycleDay > periodLength && currentCycleDay < 11 && "bg-[#8FAF8A]/10 text-[#8FAF8A] border-[#8FAF8A]/20",
              currentCycleDay >= 11 && currentCycleDay <= 16 && "bg-[#7A4F6D]/10 text-[#7A4F6D] border-[#7A4F6D]/20",
              currentCycleDay > 16 && "bg-zinc-100 text-zinc-600 border-zinc-200"
            )}>
              {currentCycleDay <= periodLength && "Menstruation • Imihango"}
              {currentCycleDay > periodLength && currentCycleDay < 11 && "Follicular Phase • Ubuzima busanzwe"}
              {currentCycleDay >= 11 && currentCycleDay <= 16 && "Fertile window • Uburumbuke"}
              {currentCycleDay > 16 && "Luteal Phase • Imbere y'imihango"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
export default CycleCalendar;
