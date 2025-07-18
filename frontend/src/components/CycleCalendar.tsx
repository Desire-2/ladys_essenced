import React, { useState, useEffect } from 'react';
import '../styles/cycle-calendar.css';

// Add extra styles for enhanced UI/UX
const enhancedStyles = `
.cycle-calendar {
  background: #fff;
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
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.calendar-header-day {
  flex: 1;
  text-align: center;
  font-weight: 600;
  color: #7d3c98;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  padding-bottom: 0.2rem;
}
.calendar-week {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.2rem;
}
.calendar-day {
  flex: 1;
  min-height: 70px;
  background: #fff;
  border-radius: 10px;
  margin: 0 0.1rem;
  box-shadow: 0 1px 4px rgba(52, 73, 94, 0.04);
  cursor: pointer;
  transition: box-shadow 0.2s, background 0.2s, transform 0.1s;
  position: relative;
  border: 2px solid transparent;
}
.calendar-day:hover, .calendar-day:focus {
  box-shadow: 0 4px 16px rgba(155, 89, 182, 0.13);
  background: #f9e7f7;
  border: 2px solid #a569bd;
  z-index: 2;
  transform: scale(1.04);
}
.calendar-day.today {
  border: 2px solid #f39c12;
  background: #fffbe6;
}
.calendar-day.period-day {
  background: #fdeef0;
  border: 2px solid #e74c3c;
}
.calendar-day.ovulation-day {
  background: #fff7e6;
  border: 2px solid #f39c12;
}
.calendar-day.high-fertility {
  box-shadow: 0 0 0 2px #f9e79f inset;
}
.calendar-day.medium-fertility {
  box-shadow: 0 0 0 2px #d6eaf8 inset;
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
    font-size: 1.2rem;
    font-weight: 700;
    color: #e67e22; /* Changed from purple to a vibrant orange for better visibility */
    text-shadow: 0 1px 2px #fff6, 0 0px 2px #e67e221a;
    letter-spacing: 0.5px;
    transition: color 0.2s;
  }
.cycle-day {
  font-size: 0.85rem;
  color: #a569bd;
  margin-bottom: 0.1rem;
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
  padding: 1.2rem 1rem 1.2rem 1rem;
  margin-top: 2rem;
}
.legend-title {
  color: #7d3c98;
  font-weight: 600;
  font-size: 1.1rem;
}
.legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem 0;
}
.legend-col {
  flex: 1 1 0;
  min-width: 220px;
}
.legend-section-title {
  font-weight: 700;
  color: #a569bd;
  margin-bottom: 0.5rem;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.4rem;
  padding: 0.2rem 0.1rem;
  border-radius: 6px;
  transition: background 0.2s;
}
.legend-item:focus, .legend-item:hover {
  background: #f9e7f7;
  outline: none;
}
.legend-color {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 0.3rem;
}
.legend-color.today {
  background: #f39c12;
}
.legend-color.period-day {
  background: #e74c3c;
}
.phase-color {
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.fertility-emoji {
  font-size: 1.2rem;
  margin-right: 0.3rem;
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

// Inject enhanced styles into the document head
if (typeof window !== 'undefined' && !document.getElementById('cycle-calendar-enhanced-styles')) {
  const style = document.createElement('style');
  style.id = 'cycle-calendar-enhanced-styles';
  style.innerHTML = enhancedStyles;
  document.head.appendChild(style);
}

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
  const [view, setView] = useState<'calendar' | 'insights'>('calendar');
  const [filterSymptoms, setFilterSymptoms] = useState<string[]>([]);

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
    if (day.is_period_day) classes += ' period-day';
    if (day.is_period_start) classes += ' period-start';
    if (day.is_period_end) classes += ' period-end';
    if (day.is_ovulation_day) classes += ' ovulation-day';
    
    // Add fertility classes
    const fertility = getFertilityLevel(day.cycle_day);
    if (fertility === 'high' && !day.is_period_day) classes += ' high-fertility';
    if (fertility === 'medium' && !day.is_period_day) classes += ' medium-fertility';
    
    // Add phase classes
    const phase = getCurrentPhase(day.cycle_day);
    if (phase) classes += ` phase-${phase.name.toLowerCase()}`;
    
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

  return (
    <div className="cycle-calendar">
      {/* Enhanced Header with Phase Info */}
      <div className="calendar-header-enhanced">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={() => onNavigateMonth('prev')}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <div className="text-center">
            <h5 className="mb-1">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h5>
            {getPhaseInfo() && (
              <div className="current-phase">
                <span 
                  className="phase-indicator"
                  style={{ backgroundColor: getPhaseInfo()?.phase.color }}
                ></span>
                <small className="text-muted">
                  {getPhaseInfo()?.phase.name} Phase - Day {getPhaseInfo()?.dayInPhase}/{getPhaseInfo()?.totalDays}
                </small>
              </div>
            )}
          </div>
          
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={() => onNavigateMonth('next')}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        {/* View Toggle */}
        <div className="view-toggle mb-3">
          <div className="btn-group w-100" role="group">
            <button 
              className={`btn ${view === 'calendar' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setView('calendar')}
            >
              <i className="fas fa-calendar-alt me-1"></i>
              Calendar
            </button>
            <button 
              className={`btn ${view === 'insights' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setView('insights')}
            >
              <i className="fas fa-chart-line me-1"></i>
              Insights
            </button>
          </div>
        </div>
      </div>

      {view === 'calendar' ? (
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
                      
                      {day.cycle_day && (
                        <div className="cycle-day">Day {day.cycle_day}</div>
                      )}
                      
                      {/* Fertility indicator */}
                      {day.cycle_day && (
                        <div className={`fertility-indicator fertility-${getFertilityLevel(day.cycle_day)}`}>
                          {getFertilityLevel(day.cycle_day) === 'high' && '🥚'}
                          {getFertilityLevel(day.cycle_day) === 'medium' && '🌱'}
                          {getFertilityLevel(day.cycle_day) === 'low' && '💧'}
                        </div>
                      )}

                      {/* Flow intensity for period days */}
                      {day.is_period_day && day.flow_intensity && (
                        <div className="flow-intensity">
                          {day.flow_intensity === 'heavy' && '🔴🔴🔴'}
                          {day.flow_intensity === 'medium' && '🔴🔴'}
                          {day.flow_intensity === 'light' && '🔴'}
                        </div>
                      )}

                      {/* Mood indicator */}
                      {day.mood && (
                        <div className="mood-indicator">
                          {moodEmojis[day.mood]}
                        </div>
                      )}
                      
                      {/* Symptoms */}
                      {day.symptoms.length > 0 && (
                        <div className="symptoms">
                          {day.symptoms.slice(0, 3).map(symptom => (
                            <span key={symptom} className="symptom-icon" title={symptom}>
                              {symptomIcons[symptom] || '•'}
                            </span>
                          ))}
                          {day.symptoms.length > 3 && (
                            <span className="more-symptoms">+{day.symptoms.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Enhanced Legend */}
          <div className="calendar-legend mt-4 enhanced-legend">
            <h6 className="mb-3 legend-title">
              <i className="fas fa-info-circle me-2"></i>
              <span>Legend & Quick Info</span>
            </h6>
            <div className="row legend-row">
              <div className="col-md-4 legend-col">
                <h6 className="text-muted small legend-section-title">CYCLE PHASES</h6>
                {phases.map(phase => (
                  <div key={phase.name} className="legend-item" tabIndex={0} aria-label={`${phase.name} phase: ${phase.description}`}
                    title={`${phase.name} phase: ${phase.description}`}
                  >
                    <span 
                      className="legend-color phase-color"
                      style={{ backgroundColor: phase.color }}
                    ></span>
                    <small>
                      <strong>{phase.name}</strong> <span className="d-none d-md-inline">- {phase.description}</span>
                    </small>
                  </div>
                ))}
              </div>
              <div className="col-md-4 legend-col">
                <h6 className="text-muted small legend-section-title">FERTILITY</h6>
                <div className="legend-item" tabIndex={0} title="High fertility (ovulation window)" aria-label="High fertility (ovulation window)">
                  <span className="fertility-emoji">🥚</span>
                  <small>High fertility <span className="d-none d-md-inline">(ovulation window)</span></small>
                </div>
                <div className="legend-item" tabIndex={0} title="Medium fertility" aria-label="Medium fertility">
                  <span className="fertility-emoji">🌱</span>
                  <small>Medium fertility</small>
                </div>
                <div className="legend-item" tabIndex={0} title="Low fertility" aria-label="Low fertility">
                  <span className="fertility-emoji">💧</span>
                  <small>Low fertility</small>
                </div>
                <h6 className="text-muted small mt-3 legend-section-title">INDICATORS</h6>
                <div className="legend-item" tabIndex={0} title="Today" aria-label="Today">
                  <span className="legend-color today"></span>
                  <small>Today</small>
                </div>
                <div className="legend-item" tabIndex={0} title="Period Day" aria-label="Period Day">
                  <span className="legend-color period-day"></span>
                  <small>Period Day</small>
                </div>
              </div>
              <div className="col-md-4 legend-col">
                <h6 className="text-muted small legend-section-title">UPCOMING EVENTS</h6>
                {getUpcomingEvents().length === 0 && (
                  <div className="upcoming-event empty-upcoming" tabIndex={0} aria-label="No upcoming events">
                    <i className="fas fa-calendar-alt me-2 text-muted"></i>
                    <small>No upcoming events</small>
                  </div>
                )}
                {getUpcomingEvents().map((event, index) => (
                  <div
                    key={index}
                    className="upcoming-event"
                    tabIndex={0}
                    aria-label={event.is_ovulation_day ? `Ovulation on ${new Date(event.date).toLocaleDateString()}` : `Period starts on ${new Date(event.date).toLocaleDateString()}`}
                    title={event.is_ovulation_day ? `Ovulation on ${new Date(event.date).toLocaleDateString()}` : `Period starts on ${new Date(event.date).toLocaleDateString()}`}
                  >
                    <div className="d-flex align-items-center">
                      <span className="event-icon me-2">
                        {event.is_ovulation_day ? (
                          <span role="img" aria-label="Egg" style={{ fontSize: '1.5rem' }}>🥚</span>
                        ) : (
                          <span role="img" aria-label="Period" style={{ fontSize: '1.5rem' }}>🔴</span>
                        )}
                      </span>
                      <small>
                        <strong style={{ color: event.is_ovulation_day ? '#f39c12' : '#e74c3c' }}>{new Date(event.date).toLocaleDateString()}</strong>
                        <br />
                        <span style={{ color: event.is_ovulation_day ? '#f39c12' : '#e74c3c', fontWeight: 600 }}>
                          {event.is_ovulation_day ? 'Ovulation' : 'Period starts'}
                        </span>
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Insights View */
        <div className="insights-view">
          <div className="row">
            <div className="col-md-6">
              <div className="insight-card">
                <h6><i className="fas fa-chart-pie me-2"></i>Cycle Statistics</h6>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-number">{calendarData?.stats.average_cycle_length}</div>
                    <div className="stat-label">Avg Cycle Length</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{calendarData?.stats.total_logs}</div>
                    <div className="stat-label">Cycles Tracked</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">
                      {calendarData?.days.filter(d => d.is_period_day).length}
                    </div>
                    <div className="stat-label">Period Days This Month</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="insight-card">
                <h6><i className="fas fa-symptoms me-2"></i>Top Symptoms</h6>
                <div className="symptom-list">
                  {getSymptomSummary().map(([symptom, count]) => (
                    <div key={symptom} className="symptom-stat">
                      <span className="symptom-icon">{symptomIcons[symptom] || '•'}</span>
                      <span className="symptom-name">{symptom.replace('_', ' ')}</span>
                      <span className="symptom-count">{count} days</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-md-12">
              <div className="insight-card">
                <h6><i className="fas fa-lightbulb me-2"></i>Personalized Tips</h6>
                <div className="tips-grid">
                  {getPhaseInfo() && (
                    <div className="tip-item">
                      <div className="tip-icon">💡</div>
                      <div className="tip-content">
                        <strong>Current Phase:</strong> {getPhaseInfo()?.phase.description}
                        <br />
                        <small>Focus on {getPhaseInfo()?.phase.name === 'Menstrual' ? 'rest and self-care' : 
                                        getPhaseInfo()?.phase.name === 'Follicular' ? 'energy and new activities' :
                                        getPhaseInfo()?.phase.name === 'Ovulation' ? 'peak fertility window' :
                                        'preparing for next cycle'}</small>
                      </div>
                    </div>
                  )}
                  
                  <div className="tip-item">
                    <div className="tip-icon">🥗</div>
                    <div className="tip-content">
                      <strong>Nutrition:</strong> Focus on iron-rich foods during menstruation
                      <br />
                      <small>Spinach, lean meats, and legumes help replenish iron levels</small>
                    </div>
                  </div>
                  
                  <div className="tip-item">
                    <div className="tip-icon">💧</div>
                    <div className="tip-content">
                      <strong>Hydration:</strong> Drink 8-10 glasses of water daily
                      <br />
                      <small>Helps reduce bloating and supports overall cycle health</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
