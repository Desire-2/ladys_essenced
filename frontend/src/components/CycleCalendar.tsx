'use client';

import React, { useState, useEffect } from 'react';
import '../styles/cycle-calendar.css';

// Add extra styles for enhanced UI/UX
const enhancedStyles = `
.cycle-calendar {
  background: #360505ff;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(52, 73, 94, 0.08);
  padding: 2.5rem 2rem 2rem 2rem;
  max-width: 900px;
  margin: 2rem auto;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  position: relative;
}
.calendar-header-enhanced {
  background: linear-gradient(90deg, #f8fafc 60%, #f9e7f7 100%);
  border-radius: 12px;
  padding: 1.2rem 1rem 1rem 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(241, 196, 15, 0.06);
}
.calendar-header-enhanced h5 {
  font-weight: 700;
  color: #7d3c98;
  letter-spacing: 0.5px;
}
.current-phase {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.2rem;
}
.phase-indicator {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-block;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.view-toggle .btn-group .btn {
  font-weight: 500;
  font-size: 1rem;
  border-radius: 8px !important;
  transition: background 0.2s, color 0.2s;
}
.calendar-grid {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.2rem 0.7rem 1.2rem 0.7rem;
  box-shadow: 0 1px 8px rgba(52, 73, 94, 0.04);
}
.calendar-header-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.2rem;
  margin-bottom: 0.5rem;
}
.calendar-header-day {
  text-align: center;
  font-weight: 600;
  color: #7d3c98;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  padding-bottom: 0.2rem;
}
.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.2rem;
  margin-bottom: 0.2rem;
}
.calendar-day {
  min-height: 80px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: box-shadow 0.2s, background 0.2s, transform 0.1s;
  position: relative;
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.calendar-day:hover, .calendar-day:focus {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2;
  transform: scale(1.02);
}
.calendar-day.today {
  border: 3px solid #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}
.calendar-day.period-day {
  background: #dc3545;
  color: #fff;
  border: 1px solid #c82333;
}
.calendar-day.ovulation-day {
  background: #ffc107;
  color: #000;
  border: 1px solid #e0a800;
}
.calendar-day.high-fertility {
  background: #ffc107;
  color: #000;
  border: 1px solid #e0a800;
}
.calendar-day.safe-day {
  background: #28a745;
  color: #fff;
  border: 1px solid #218838;
}
.calendar-day.logged {
  position: relative;
}
.calendar-day.logged::after {
  content: '✓';
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 14px;
  font-weight: bold;
  color: inherit;
}
.calendar-day .day-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0.2rem 0.1rem;
}
  .day-number {
    font-size: 1.3rem;
    font-weight: 700;
    color: inherit;
    letter-spacing: 0.5px;
    transition: color 0.2s;
  }
.cycle-day {
  font-size: 0.75rem;
  color: inherit;
  opacity: 0.8;
  margin-top: 2px;
}
.fertility-indicator {
  font-size: 1.1rem;
  margin-bottom: 0.1rem;
}
.flow-intensity {
  font-size: 1.1rem;
  margin-bottom: 0.1rem;
}
.mood-indicator {
  font-size: 1.1rem;
  margin-bottom: 0.1rem;
}
.symptoms {
  display: flex;
  gap: 0.1rem;
  margin-top: 0.1rem;
}
.symptom-icon {
  font-size: 1.1rem;
  margin-right: 0.1rem;
}
.more-symptoms {
  font-size: 0.9rem;
  color: #7d3c98;
  margin-left: 0.1rem;
}
.calendar-day.other-month {
  opacity: 0.45;
  background: #f4f6f7;
  color: #b2babb;
  pointer-events: none;
}
.calendar-legend.enhanced-legend {
  background: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 1px 8px rgba(52, 73, 94, 0.04);
  padding: 1.2rem 1rem;
  margin-top: 2rem;
}
.legend-title {
  color: #333;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}
.legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  transition: background 0.2s;
}
.legend-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: inline-block;
  border: 1px solid #ddd;
}
.legend-color.period {
  background: #dc3545;
}
.legend-color.fertile {
  background: #ffc107;
}
.legend-color.safe {
  background: #28a745;
}
.legend-color.today {
  background: #fff;
  border: 3px solid #3498db;
}
.legend-label {
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}
.legend-emoji {
  font-size: 1.2rem;
  margin-right: 0.3rem;
}
/* Recent Cycle History Styles */
.recent-cycle-history {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.history-title {
  color: #333;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  border-left: 4px solid #dc3545;
  padding-left: 0.75rem;
}
.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  border-left: 4px solid #dc3545;
  transition: all 0.2s;
}
.history-item:hover {
  background: #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateX(4px);
}
.history-date {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}
.history-duration {
  color: #495057;
  font-size: 0.85rem;
  background: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}
.history-symptoms {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #6c757d;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}
.history-symptoms i {
  font-size: 0.75rem;
}
.upcoming-event {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(52, 73, 94, 0.07);
  padding: 0.5rem 0.7rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  transition: box-shadow 0.2s, background 0.2s;
  cursor: pointer;
}
.upcoming-event:focus, .upcoming-event:hover {
  background: #f9e7f7;
  box-shadow: 0 2px 8px #a569bd33;
}
.upcoming-event .event-icon {
  font-size: 1.3rem;
  display: flex;
  align-items: center;
}
.upcoming-event.empty-upcoming {
  background: #f4f6f7;
  color: #b2babb;
  box-shadow: none;
}
.insights-view {
  background: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 1px 8px rgba(52, 73, 94, 0.04);
  padding: 2rem 1.5rem;
  margin-top: 1.5rem;
}
.insight-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(52, 73, 94, 0.07);
  padding: 1.2rem 1rem;
  margin-bottom: 1.2rem;
}
.stats-grid {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.7rem;
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #7d3c98;
}
.stat-label {
  font-size: 0.95rem;
  color: #a569bd;
}
.symptom-list {
  margin-top: 0.7rem;
}
.symptom-stat {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.4rem;
}
.symptom-name {
  font-size: 1rem;
  color: #7d3c98;
  text-transform: capitalize;
}
.symptom-count {
  font-size: 0.95rem;
  color: #a569bd;
}
.tips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  margin-top: 0.7rem;
}
.tip-item {
  background: #f9e7f7;
  border-radius: 8px;
  padding: 0.8rem 1rem;
  flex: 1 1 220px;
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  box-shadow: 0 1px 4px rgba(155, 89, 182, 0.07);
}
.tip-icon {
  font-size: 1.5rem;
  margin-right: 0.3rem;
}
.tip-content {
  font-size: 1rem;
  color: #7d3c98;
}
.day-detail-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(52, 73, 94, 0.18);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s;
}
.modal-content {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(52, 73, 94, 0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  min-width: 340px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
}
.modal-header h5 {
  font-weight: 700;
  color: #7d3c98;
  font-size: 1.2rem;
}
.btn-close {
  background: none;
  border: none;
  font-size: 1.3rem;
  color: #a569bd;
  cursor: pointer;
  transition: color 0.2s;
}
.btn-close:hover {
  color: #e74c3c;
}
.modal-body {
  font-size: 1rem;
  color: #34495e;
}
.cycle-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 0.7rem 1rem;
  margin-bottom: 1rem;
}
.info-grid {
  display: flex;
  gap: 1.2rem;
  margin-top: 0.5rem;
}
.info-item {
  flex: 1;
  font-size: 1rem;
}
.info-label {
  color: #a569bd;
  font-weight: 600;
}
.info-value {
  color: #7d3c98;
  font-weight: 700;
  margin-left: 0.2rem;
}
.symptoms-detail {
  margin-bottom: 1rem;
}
.symptom-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.3rem;
}
.symptom-tag {
  background: #fdeef0;
  color: #e74c3c;
  border-radius: 6px;
  padding: 0.2rem 0.7rem;
  font-size: 0.98rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.notes-detail {
  background: #f8fafc;
  border-radius: 8px;
  padding: 0.7rem 1rem;
  margin-bottom: 1rem;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

interface CalendarDay {
  date: string;
  day_of_month: number;
  is_current_month: boolean;
  is_today: boolean;
  is_period_day: boolean;
  is_period_start: boolean;
  is_period_end: boolean;
  is_ovulation_day: boolean;
  symptoms: string[];
  notes: string;
  cycle_day?: number;
  fertility_level?: 'high' | 'medium' | 'low';
  mood?: string;
  flow_intensity?: 'light' | 'medium' | 'heavy';
}

interface CalendarProps {
  calendarData: {
    days: CalendarDay[];
    stats: {
      total_logs: number;
      average_cycle_length: number;
      next_predicted_period?: string;
    };
  } | null;
  currentDate: Date;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  onDayClick?: (day: CalendarDay) => void;
  showInsights?: boolean;
}

interface DayDetailModal {
  day: CalendarDay | null;
  isOpen: boolean;
}

const CycleCalendar: React.FC<CalendarProps> = ({ 
  calendarData, 
  currentDate, 
  onNavigateMonth,
  onDayClick,
  showInsights = true
}) => {
  const [selectedDay, setSelectedDay] = useState<DayDetailModal>({ day: null, isOpen: false });

  // Inject enhanced styles into the document head on client-side only
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('cycle-calendar-enhanced-styles')) {
      const style = document.createElement('style');
      style.id = 'cycle-calendar-enhanced-styles';
      style.innerHTML = enhancedStyles;
      document.head.appendChild(style);
    }
  }, []);

  // Enhanced symptoms list with icons
  const symptomIcons: { [key: string]: string } = {
    'cramps': '🩸',
    'bloating': '🎈',
    'headache': '🤕',
    'fatigue': '😴',
    'mood_swings': '😭',
    'acne': '🔴',
    'breast_tenderness': '💗',
    'back_pain': '🦴',
    'nausea': '🤢',
    'diarrhea': '💩',
    'constipation': '🚫',
    'insomnia': '🌙',
    'anxiety': '😰',
    'irritability': '😠',
    'cravings': '🍫'
  };

  const moodEmojis: { [key: string]: string } = {
    'happy': '😊',
    'sad': '😢',
    'angry': '😠',
    'anxious': '😰',
    'calm': '😌',
    'energetic': '⚡',
    'tired': '😴'
  };

  const phases = [
    { name: 'Menstrual', days: [1, 2, 3, 4, 5], color: '#e74c3c', description: 'Period days' },
    { name: 'Follicular', days: [6, 7, 8, 9, 10, 11, 12, 13], color: '#3498db', description: 'Pre-ovulation' },
    { name: 'Ovulation', days: [14], color: '#f39c12', description: 'Most fertile' },
    { name: 'Luteal', days: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28], color: '#9b59b6', description: 'Post-ovulation' }
  ];

  const getCurrentPhase = (cycleDay?: number) => {
    if (!cycleDay) return null;
    return phases.find(phase => phase.days.includes(cycleDay));
  };

  const getFertilityLevel = (cycleDay?: number): 'high' | 'medium' | 'low' => {
    if (!cycleDay) return 'low';
    if (cycleDay >= 12 && cycleDay <= 16) return 'high';
    if (cycleDay >= 8 && cycleDay <= 18) return 'medium';
    return 'low';
  };
  if (!calendarData) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading calendar...</span>
        </div>
        <p className="text-muted">Loading calendar data...</p>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Group days into weeks
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < calendarData.days.length; i += 7) {
    weeks.push(calendarData.days.slice(i, i + 7));
  }

  const getDayClasses = (day: CalendarDay) => {
    let classes = 'calendar-day';
    
    if (!day.is_current_month) classes += ' other-month';
    if (day.is_today) classes += ' today';
    
    // Determine day type based on cycle
    if (day.is_period_day) {
      classes += ' period-day';
    } else if (day.is_ovulation_day || (day.cycle_day && day.cycle_day >= 12 && day.cycle_day <= 16)) {
      classes += ' high-fertility ovulation-day';
    } else if (day.cycle_day && ((day.cycle_day >= 1 && day.cycle_day <= 7) || day.cycle_day >= 19)) {
      classes += ' safe-day';
    }
    
    // Add logged class if there's any data
    if (day.symptoms.length > 0 || day.notes || day.flow_intensity || day.mood) {
      classes += ' logged';
    }
    
    return classes;
  };

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay({ day, isOpen: true });
    if (onDayClick) onDayClick(day);
  };

  const getPhaseInfo = () => {
    if (!calendarData) return null;
    
    const todayData = calendarData.days.find(d => d.is_today);
    if (!todayData?.cycle_day) return null;
    
    const currentPhase = getCurrentPhase(todayData.cycle_day);
    if (!currentPhase) return null;
    
    const daysInPhase = currentPhase.days.indexOf(todayData.cycle_day) + 1;
    const totalPhaseDays = currentPhase.days.length;
    
    return { phase: currentPhase, dayInPhase: daysInPhase, totalDays: totalPhaseDays };
  };

  const getUpcomingEvents = () => {
    if (!calendarData) return [];
    
    const today = new Date();
    const upcoming = calendarData.days
      .filter(d => new Date(d.date) >= today && (d.is_ovulation_day || d.is_period_start))
      .slice(0, 3);
    
    return upcoming;
  };

  const getSymptomSummary = () => {
    if (!calendarData) return [];
    
    const symptomCount: { [key: string]: number } = {};
    calendarData.days.forEach(day => {
      day.symptoms.forEach(symptom => {
        symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
      });
    });
    
    return Object.entries(symptomCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getRecentCycles = () => {
    if (!calendarData) return [];
    
    // Group period days into cycles
    const cycles: Array<{
      startDate: string;
      endDate: string;
      duration: string;
      symptoms: string[];
    }> = [];
    
    let currentCycle: CalendarDay[] = [];
    
    calendarData.days.forEach((day, index) => {
      if (day.is_period_day) {
        currentCycle.push(day);
      } else if (currentCycle.length > 0) {
        // End of a cycle
        const startDate = new Date(currentCycle[0].date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const endDate = new Date(currentCycle[currentCycle.length - 1].date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const duration = `${currentCycle.length}d`;
        
        // Collect unique symptoms from the cycle
        const symptomsSet = new Set<string>();
        currentCycle.forEach(day => {
          day.symptoms.forEach(symptom => symptomsSet.add(symptom.replace('_', ' ')));
        });
        
        cycles.push({
          startDate,
          endDate,
          duration,
          symptoms: Array.from(symptomsSet).slice(0, 3) // Limit to 3 symptoms
        });
        
        currentCycle = [];
      }
    });
    
    // Handle last cycle if it exists
    if (currentCycle.length > 0) {
      const startDate = new Date(currentCycle[0].date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      const endDate = new Date(currentCycle[currentCycle.length - 1].date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      const duration = `${currentCycle.length}d`;
      
      const symptomsSet = new Set<string>();
      currentCycle.forEach(day => {
        day.symptoms.forEach(symptom => symptomsSet.add(symptom.replace('_', ' ')));
      });
      
      cycles.push({
        startDate,
        endDate,
        duration,
        symptoms: Array.from(symptomsSet).slice(0, 3)
      });
    }
    
    return cycles.slice(-3).reverse(); // Return last 3 cycles, most recent first
  };

  return (
    <div className="cycle-calendar">
      {/* Enhanced Header */}
      <div className="calendar-header-enhanced">
        {/* Next Predicted Period Info Box */}
        {calendarData?.stats?.next_predicted_period && (
          <div className="alert alert-info mb-3 d-flex align-items-center">
            <i className="fas fa-calendar-alt me-2"></i>
            <strong>Next Predicted Period:</strong>
            <span className="ms-2">
              {new Date(calendarData.stats.next_predicted_period).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
              })}
              {' to '}
              {new Date(new Date(calendarData.stats.next_predicted_period).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
              })}
            </span>
          </div>
        )}
        
        <div className="d-flex justify-content-between align-items-center">
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={() => onNavigateMonth('prev')}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <div className="text-center">
            <h5 className="mb-0">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h5>
          </div>
          
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={() => onNavigateMonth('next')}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Calendar View */}
      <>
          {/* Calendar Grid */}
          <div className="calendar-grid">
            {/* Day headers */}
            <div className="calendar-header-row">
              {dayNames.map(day => (
                <div key={day} className="calendar-header-day">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar weeks */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="calendar-week">
                {week.map((day, dayIndex) => (
                  <div 
                    key={`${weekIndex}-${dayIndex}`} 
                    className={getDayClasses(day)}
                    title={`${day.notes} ${day.symptoms.join(', ')}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="day-content">
                      <div className="day-number">{day.day_of_month}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Enhanced Legend */}
          <div className="calendar-legend mt-4 enhanced-legend">
            <h6 className="legend-title">Legend:</h6>
            <div className="legend-row">
              <div className="legend-item">
                <span className="legend-color period"></span>
                <span className="legend-label">
                  <span className="legend-emoji">🩸</span>
                  Period
                </span>
              </div>
              <div className="legend-item">
                <span className="legend-color fertile"></span>
                <span className="legend-label">
                  <span className="legend-emoji">🔥</span>
                  Fertile Window
                </span>
              </div>
              <div className="legend-item">
                <span className="legend-color safe"></span>
                <span className="legend-label">
                  <span className="legend-emoji">✓</span>
                  Safe Days
                </span>
              </div>
              <div className="legend-item">
                <span className="legend-color today"></span>
                <span className="legend-label">Today</span>
              </div>
            </div>
          </div>

          {/* Recent Cycle History */}
          <div className="recent-cycle-history">
            <h6 className="history-title">Recent Cycle History</h6>
            {getRecentCycles().length > 0 ? (
              getRecentCycles().map((cycle, index) => (
                <div key={index} className="history-item">
                  <div>
                    <div className="history-date">
                      {cycle.startDate} - {cycle.endDate}
                    </div>
                    {cycle.symptoms && cycle.symptoms.length > 0 && (
                      <div className="history-symptoms">
                        <i className="fas fa-heart-pulse"></i>
                        <span>{cycle.symptoms.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <div className="history-duration">{cycle.duration}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted py-3">
                <i className="fas fa-calendar-alt me-2"></i>
                No recent cycle data available
              </div>
            )}
          </div>
        </>

      {/* Day Detail Modal */}
      {selectedDay.isOpen && selectedDay.day && (
        <div className="day-detail-modal" onClick={() => setSelectedDay({ day: null, isOpen: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>
                <i className="fas fa-calendar-day me-2"></i>
                {new Date(selectedDay.day.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h5>
              <button 
                className="btn-close"
                onClick={() => setSelectedDay({ day: null, isOpen: false })}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {selectedDay.day.cycle_day && (
                <div className="cycle-info mb-3">
                  <h6>Cycle Information</h6>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Cycle Day:</span>
                      <span className="info-value">{selectedDay.day.cycle_day}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Phase:</span>
                      <span className="info-value">
                        {getCurrentPhase(selectedDay.day.cycle_day)?.name}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Fertility:</span>
                      <span className="info-value">
                        {getFertilityLevel(selectedDay.day.cycle_day)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedDay.day.symptoms.length > 0 && (
                <div className="symptoms-detail mb-3">
                  <h6>Symptoms</h6>
                  <div className="symptom-tags">
                    {selectedDay.day.symptoms.map(symptom => (
                      <span key={symptom} className="symptom-tag">
                        {symptomIcons[symptom] || '•'} {symptom.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedDay.day.notes && (
                <div className="notes-detail">
                  <h6>Notes</h6>
                  <p>{selectedDay.day.notes}</p>
                </div>
              )}
              
              {(!selectedDay.day.symptoms.length && !selectedDay.day.notes) && (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-clipboard me-2"></i>
                  No data recorded for this day
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CycleCalendar;
