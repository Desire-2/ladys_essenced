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
  border-radius: clamp(8px, 2vw, 12px);
  padding: clamp(0.5rem, 3vw, 1.2rem) clamp(0.3rem, 2vw, 0.7rem);
  box-shadow: 0 1px 8px rgba(52, 73, 94, 0.04);
}
.calendar-header-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: clamp(0.1rem, 1vw, 0.2rem);
  margin-bottom: clamp(0.3rem, 1vw, 0.5rem);
}
.calendar-header-day {
  text-align: center;
  font-weight: 600;
  color: #7d3c98;
  font-size: clamp(0.8rem, 2.5vw, 1.1rem);
  letter-spacing: 0.3px;
  padding-bottom: clamp(0.1rem, 0.5vw, 0.2rem);
}
.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: clamp(0.1rem, 1vw, 0.2rem);
  margin-bottom: clamp(0.1rem, 0.5vw, 0.2rem);
}
.calendar-day {
  min-height: clamp(50px, 12vw, 80px);
  background: #fff;
  border-radius: clamp(6px, 1.5vw, 8px);
  cursor: pointer;
  transition: box-shadow 0.2s, background 0.2s, transform 0.1s;
  position: relative;
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(0.2rem, 1vw, 0.5rem);
}
.calendar-day:hover, .calendar-day:focus {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2;
  transform: scale(1.02);
}
.calendar-day.today {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border: 2px solid #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.3);
  font-weight: 600;
}
.calendar-day.today .day-number {
  color: #1565c0;
  font-weight: 800;
}
.calendar-day.period-day {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  color: #b71c1c;
  border: 1px solid #f44336;
  border-left: 4px solid #f44336;
}
.calendar-day.period-day .day-number {
  color: #b71c1c;
  font-weight: 700;
}
.calendar-day.ovulation-day {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  color: #e65100;
  border: 1px solid #ff9800;
  border-left: 4px solid #ff9800;
}
.calendar-day.ovulation-day .day-number {
  color: #e65100;
  font-weight: 700;
}
.calendar-day.high-fertility {
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
  color: #4a148c;
  border: 1px solid #9c27b0;
  border-left: 4px solid #9c27b0;
}
.calendar-day.high-fertility .day-number {
  color: #4a148c;
  font-weight: 700;
}
.calendar-day.safe-day {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  color: #1b5e20;
  border: 1px solid #4caf50;
  border-left: 4px solid #4caf50;
}
.calendar-day.safe-day .day-number {
  color: #1b5e20;
  font-weight: 700;
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
  padding: clamp(0.1rem, 0.5vw, 0.2rem) clamp(0.05rem, 0.25vw, 0.1rem);
}
  .day-number {
    font-size: clamp(0.9rem, 3vw, 1.3rem);
    font-weight: 700;
    color: inherit;
    letter-spacing: clamp(0.2px, 0.5vw, 0.5px);
    transition: color 0.2s;
  }
.cycle-day {
  font-size: clamp(0.6rem, 1.8vw, 0.75rem);
  color: inherit;
  opacity: 0.8;
  margin-top: clamp(1px, 0.3vw, 2px);
}
.fertility-indicator {
  font-size: clamp(0.8rem, 2.5vw, 1.1rem);
  margin-bottom: clamp(0.05rem, 0.25vw, 0.1rem);
}
.flow-intensity {
  font-size: clamp(0.8rem, 2.5vw, 1.1rem);
  margin-bottom: clamp(0.05rem, 0.25vw, 0.1rem);
}
.mood-indicator {
  font-size: clamp(0.8rem, 2.5vw, 1.1rem);
  margin-bottom: clamp(0.05rem, 0.25vw, 0.1rem);
}
.symptoms {
  display: flex;
  gap: clamp(0.05rem, 0.25vw, 0.1rem);
  margin-top: clamp(0.05rem, 0.25vw, 0.1rem);
  flex-wrap: wrap;
  justify-content: center;
}
.symptom-icon {
  font-size: clamp(0.7rem, 2vw, 1.1rem);
  margin-right: clamp(0.05rem, 0.25vw, 0.1rem);
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
.calendar-day.dimmed {
  opacity: 0.3;
  filter: grayscale(60%);
}
.calendar-day.highlighted {
  animation: highlightPulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 12px rgba(33, 150, 243, 0.6);
  z-index: 5;
}
@keyframes highlightPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 12px rgba(33, 150, 243, 0.6); }
  50% { transform: scale(1.03); box-shadow: 0 0 20px rgba(33, 150, 243, 0.8); }
}
.calendar-day.predicted {
  opacity: 0.7;
  border-style: dashed !important;
}
.calendar-day.predicted::after {
  content: '?';
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}
.calendar-day.ml-high-confidence {
  box-shadow: 0 0 8px rgba(40, 167, 69, 0.6);
  border: 2px solid #28a745 !important;
}
.calendar-day.ml-medium-confidence {
  box-shadow: 0 0 8px rgba(255, 193, 7, 0.6);
  border: 2px solid #ffc107 !important;
}
.calendar-day.ml-low-confidence {
  box-shadow: 0 0 8px rgba(220, 53, 69, 0.6);
  border: 2px solid #dc3545 !important;
}
.calendar-day.ml-pattern-match::before {
  content: '🧠';
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 8px;
  z-index: 10;
}
.calendar-day.anomaly-detected {
  position: relative;
  animation: anomalyPulse 2s ease-in-out infinite;
}
.calendar-day.anomaly-detected::before {
  content: '⚠️';
  position: absolute;
  top: 1px;
  left: 1px;
  font-size: 10px;
  z-index: 10;
}
@keyframes anomalyPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
  50% { box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.2); }
}
.ml-insights-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
.ml-confidence-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  z-index: 5;
}
.ml-confidence-high { background-color: #28a745; }
.ml-confidence-medium { background-color: #ffc107; }
.ml-confidence-low { background-color: #dc3545; }
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
  transition: all 0.2s;
  cursor: pointer;
  border: 2px solid transparent;
}
.legend-item:hover {
  background: #f0f0f0;
  transform: translateY(-1px);
}
.legend-item.active {
  background: #e3f2fd;
  border: 2px solid #2196f3;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}
.legend-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: inline-block;
  border: 1px solid #ddd;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.legend-color.period {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  border: 1px solid #f44336;
  border-left: 3px solid #f44336;
}
.legend-color.ovulation {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border: 1px solid #ff9800;
  border-left: 3px solid #ff9800;
}
.legend-color.fertile {
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
  border: 1px solid #9c27b0;
  border-left: 3px solid #9c27b0;
}
.legend-color.safe {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 1px solid #4caf50;
  border-left: 3px solid #4caf50;
}
.legend-color.today {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border: 2px solid #2196f3;
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

/* Enhanced Mobile Responsiveness for Calendar Grid */
@media (max-width: 480px) {
  .cycle-calendar {
    padding: 1rem 0.5rem !important;
    margin: 1rem auto !important;
  }
  
  .calendar-grid {
    padding: 0.5rem 0.3rem !important;
    border-radius: 8px !important;
  }
  
  .calendar-header-day {
    font-size: 0.7rem !important;
    padding-bottom: 0.1rem !important;
  }
  
  .calendar-day {
    min-height: 45px !important;
    border-radius: 4px !important;
    padding: 0.1rem !important;
  }
  
  .day-number {
    font-size: 0.85rem !important;
    font-weight: 600 !important;
  }
  
  .fertility-indicator,
  .flow-intensity,
  .mood-indicator {
    font-size: 0.7rem !important;
  }
  
  .symptom-icon {
    font-size: 0.6rem !important;
  }
  
  .symptoms {
    gap: 0.05rem !important;
    margin-top: 0.05rem !important;
  }
  
  .calendar-week {
    gap: 0.08rem !important;
    margin-bottom: 0.08rem !important;
  }
  
  .calendar-header-row {
    gap: 0.08rem !important;
    margin-bottom: 0.3rem !important;
  }
}

@media (max-width: 360px) {
  .calendar-day {
    min-height: 40px !important;
  }
  
  .day-number {
    font-size: 0.8rem !important;
  }
  
  .fertility-indicator,
  .flow-intensity,
  .mood-indicator,
  .symptom-icon {
    font-size: 0.65rem !important;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .calendar-day {
    min-height: 60px !important;
  }
  
  .day-number {
    font-size: 1rem !important;
  }
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
  is_fertility_day?: boolean;
  predicted?: boolean;
  symptoms: string[];
  notes: string;
  cycle_day?: number;
  fertility_level?: 'high' | 'medium' | 'low';
  mood?: string;
  flow_intensity?: 'light' | 'medium' | 'heavy';
  // ML Enhancement fields
  ml_confidence?: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  ml_pattern_match?: boolean;
  adaptive_learning_applied?: boolean;
  anomaly_detected?: boolean;
  seasonal_adjustment?: number;
  prediction_source?: 'ml_ensemble' | 'pattern_recognition' | 'adaptive_learning' | 'fallback';
}

interface CalendarProps {
  calendarData: {
    days: CalendarDay[];
    stats: {
      total_logs: number;
      average_cycle_length: number;
      next_predicted_period?: string;
    };
    ml_insights?: {
      adaptive_learning_status: 'active' | 'learning' | 'inactive';
      pattern_confidence: string;
      anomalies_detected: boolean;
      total_patterns_found: number;
      prediction_accuracy: number;
      seasonal_patterns_active: boolean;
    };
  } | null;
  currentDate: Date;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  onDayClick?: (day: CalendarDay) => void;
  showInsights?: boolean;
  showMLInsights?: boolean;
}

interface DayDetailModal {
  day: CalendarDay | null;
  isOpen: boolean;
}

type LegendFilter = 'all' | 'period' | 'ovulation' | 'fertile' | 'safe' | 'today';

const CycleCalendar: React.FC<CalendarProps> = ({ 
  calendarData, 
  currentDate, 
  onNavigateMonth,
  onDayClick,
  showInsights = true,
  showMLInsights = true
}) => {
  const [selectedDay, setSelectedDay] = useState<DayDetailModal>({ day: null, isOpen: false });
  const [activeLegendFilter, setActiveLegendFilter] = useState<LegendFilter>('all');

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
    
    // Apply dimmed class if legend filter is active
    if (activeLegendFilter) {
      const shouldDim = 
        (activeLegendFilter === 'period' && !day.is_period_day) ||
        (activeLegendFilter === 'ovulation' && !day.is_ovulation_day) ||
        (activeLegendFilter === 'fertile' && !day.is_fertility_day) ||
        (activeLegendFilter === 'safe' && (day.is_period_day || day.is_ovulation_day || day.is_fertility_day));
      
      if (shouldDim) {
        classes += ' dimmed';
      }
    }
    
    // Determine day type based on backend data
    if (day.is_period_day) {
      classes += ' period-day';
      if (day.is_period_start) classes += ' period-start';
      if (day.is_period_end) classes += ' period-end';
    } else if (day.is_ovulation_day) {
      classes += ' ovulation-day';
    } else if (day.is_fertility_day) {
      classes += ' high-fertility';
    } else if (!day.is_period_day && !day.is_ovulation_day && !day.is_fertility_day) {
      // Safe days are days that are not period, ovulation, or fertile
      classes += ' safe-day';
    }
    
    // Add logged class if there's any data
    if (day.symptoms.length > 0 || day.notes || day.flow_intensity || day.mood) {
      classes += ' logged';
    }
    
    // ML Enhancement classes
    if (showMLInsights && day.predicted) {
      classes += ' predicted';
      
      // ML Confidence levels
      if (day.ml_confidence === 'very_high' || day.ml_confidence === 'high') {
        classes += ' ml-high-confidence';
      } else if (day.ml_confidence === 'medium') {
        classes += ' ml-medium-confidence';
      } else if (day.ml_confidence === 'low' || day.ml_confidence === 'very_low') {
        classes += ' ml-low-confidence';
      }
      
      // Pattern matching indicator
      if (day.ml_pattern_match) {
        classes += ' ml-pattern-match';
      }
      
      // Anomaly detection
      if (day.anomaly_detected) {
        classes += ' anomaly-detected';
      }
    }
    
    return classes;
  };
  
  const handleLegendClick = (filterType: LegendFilter) => {
    setActiveLegendFilter(prev => prev === filterType ? 'all' : filterType);
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

      {/* ML Insights Banner */}
      {showMLInsights && calendarData?.ml_insights && (
        <div className="ml-insights-banner">
          <div className="row align-items-center">
            <div className="col-auto">
              <i className="fas fa-brain fa-2x"></i>
            </div>
            <div className="col">
              <h6 className="mb-1">
                <i className="fas fa-robot me-2"></i>
                AI-Enhanced Calendar
              </h6>
              <div className="small">
                {calendarData.ml_insights.total_patterns_found} patterns detected • 
                {Math.round(calendarData.ml_insights.prediction_accuracy * 100)}% accuracy • 
                {calendarData.ml_insights.adaptive_learning_status} learning
                {calendarData.ml_insights.anomalies_detected && (
                  <span className="ms-2">
                    <i className="fas fa-exclamation-triangle text-warning me-1"></i>
                    Anomalies detected
                  </span>
                )}
              </div>
            </div>
            <div className="col-auto">
              <div className="d-flex gap-2">
                {calendarData.ml_insights.seasonal_patterns_active && (
                  <span className="badge bg-light text-dark">
                    <i className="fas fa-calendar-alt me-1"></i>
                    Seasonal
                  </span>
                )}
                <span className={`badge bg-${
                  calendarData.ml_insights.adaptive_learning_status === 'active' ? 'success' :
                  calendarData.ml_insights.adaptive_learning_status === 'learning' ? 'warning' : 'secondary'
                }`}>
                  {calendarData.ml_insights.adaptive_learning_status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    title={`${day.notes || ''} ${day.symptoms?.join(', ') || ''}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="day-content">
                      <div className="day-number">{day.day_of_month}</div>
                      {day.is_ovulation_day && (
                        <div className="fertility-indicator" title="Ovulation Day">
                          🥚
                        </div>
                      )}
                      {day.is_fertility_day && !day.is_ovulation_day && (
                        <div className="fertility-indicator" title="Fertile Window">
                          🔥
                        </div>
                      )}
                      {day.flow_intensity && (
                        <div className="flow-intensity" title={`Flow: ${day.flow_intensity}`}>
                          {day.flow_intensity === 'heavy' && '🩸🩸🩸'}
                          {day.flow_intensity === 'medium' && '🩸🩸'}
                          {day.flow_intensity === 'light' && '🩸'}
                        </div>
                      )}
                      {day.symptoms && day.symptoms.length > 0 && (
                        <div className="symptoms">
                          {day.symptoms.slice(0, 2).map((symptom, idx) => (
                            <span key={idx} className="symptom-icon" title={symptom}>
                              {symptomIcons[symptom] || '•'}
                            </span>
                          ))}
                          {day.symptoms.length > 2 && (
                            <span className="more-symptoms">+{day.symptoms.length - 2}</span>
                          )}
                        </div>
                      )}
                      
                      {/* ML Confidence Indicator */}
                      {showMLInsights && day.predicted && day.ml_confidence && (
                        <div 
                          className={`ml-confidence-indicator ml-confidence-${
                            day.ml_confidence === 'very_high' || day.ml_confidence === 'high' ? 'high' :
                            day.ml_confidence === 'medium' ? 'medium' : 'low'
                          }`}
                          title={`ML Confidence: ${day.ml_confidence.replace('_', ' ')}`}
                        ></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Enhanced Legend */}
          <div className="calendar-legend mt-4 enhanced-legend">
            <h6 className="legend-title">
              Legend: 
              {activeLegendFilter !== 'all' && (
                <span style={{ fontSize: '0.85rem', color: '#2196f3', marginLeft: '0.5rem' }}>
                  (Click again to show all)
                </span>
              )}
            </h6>
            <div className="legend-row">
              <div 
                className={`legend-item ${activeLegendFilter === 'period' ? 'active' : ''}`}
                onClick={() => handleLegendClick('period')}
                role="button"
                tabIndex={0}
              >
                <span className="legend-color period"></span>
                <span className="legend-label">
                  <span className="legend-emoji">🩸</span>
                  Period
                </span>
              </div>
              <div 
                className={`legend-item ${activeLegendFilter === 'ovulation' ? 'active' : ''}`}
                onClick={() => handleLegendClick('ovulation')}
                role="button"
                tabIndex={0}
              >
                <span className="legend-color ovulation"></span>
                <span className="legend-label">
                  <span className="legend-emoji">🥚</span>
                  Ovulation Day
                </span>
              </div>
              <div 
                className={`legend-item ${activeLegendFilter === 'fertile' ? 'active' : ''}`}
                onClick={() => handleLegendClick('fertile')}
                role="button"
                tabIndex={0}
              >
                <span className="legend-color fertile"></span>
                <span className="legend-label">
                  <span className="legend-emoji">🔥</span>
                  Fertile Window
                </span>
              </div>
              <div 
                className={`legend-item ${activeLegendFilter === 'safe' ? 'active' : ''}`}
                onClick={() => handleLegendClick('safe')}
                role="button"
                tabIndex={0}
              >
                <span className="legend-color safe"></span>
                <span className="legend-label">
                  <span className="legend-emoji">✅</span>
                  Safe Days
                </span>
              </div>
              <div 
                className={`legend-item ${activeLegendFilter === 'today' ? 'active' : ''}`}
                onClick={() => handleLegendClick('today')}
                role="button"
                tabIndex={0}
              >
                <span className="legend-color today"></span>
                <span className="legend-label">
                  <span className="legend-emoji">📍</span>
                  Today
                </span>
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
              💡 Tip: Click on any legend item to highlight those days on the calendar
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
              {selectedDay.day.predicted && (
                <div className="alert alert-info mb-3" style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}>
                  <i className="fas fa-brain me-2"></i>
                  <strong>AI Prediction:</strong> This information is based on machine learning analysis
                  {selectedDay.day.ml_confidence && (
                    <div className="mt-2">
                      <span className={`badge bg-${
                        selectedDay.day.ml_confidence === 'very_high' || selectedDay.day.ml_confidence === 'high' ? 'success' :
                        selectedDay.day.ml_confidence === 'medium' ? 'warning' : 'danger'
                      }`}>
                        {selectedDay.day.ml_confidence.replace('_', ' ')} confidence
                      </span>
                      {selectedDay.day.prediction_source && (
                        <span className="badge bg-info ms-2">
                          {selectedDay.day.prediction_source.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ML Pattern Matching */}
              {showMLInsights && selectedDay.day.ml_pattern_match && (
                <div className="alert alert-success mb-3" style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}>
                  <i className="fas fa-check-circle me-2"></i>
                  <strong>Pattern Match:</strong> AI detected this matches your historical patterns
                </div>
              )}

              {/* Anomaly Detection */}
              {showMLInsights && selectedDay.day.anomaly_detected && (
                <div className="alert alert-warning mb-3" style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}>
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Anomaly Detected:</strong> This day shows irregular patterns compared to your cycle history
                </div>
              )}

              {/* Seasonal Adjustment */}
              {showMLInsights && selectedDay.day.seasonal_adjustment && Math.abs(selectedDay.day.seasonal_adjustment) > 0.5 && (
                <div className="alert alert-info mb-3" style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}>
                  <i className="fas fa-calendar-alt me-2"></i>
                  <strong>Seasonal Adjustment:</strong> AI applied {selectedDay.day.seasonal_adjustment > 0 ? '+' : ''}{selectedDay.day.seasonal_adjustment.toFixed(1)} day adjustment for this month
                </div>
              )}
              
              {selectedDay.day.is_period_day && (
                <div className="cycle-info mb-3">
                  <h6>
                    <i className="fas fa-tint me-2"></i>
                    Period Information
                  </h6>
                  <div className="info-grid">
                    {selectedDay.day.is_period_start && (
                      <div className="info-item">
                        <span className="info-label">Status:</span>
                        <span className="info-value">Period Start</span>
                      </div>
                    )}
                    {selectedDay.day.is_period_end && (
                      <div className="info-item">
                        <span className="info-label">Status:</span>
                        <span className="info-value">Period End</span>
                      </div>
                    )}
                    {selectedDay.day.flow_intensity && (
                      <div className="info-item">
                        <span className="info-label">Flow:</span>
                        <span className="info-value">{selectedDay.day.flow_intensity}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedDay.day.is_ovulation_day && (
                <div className="cycle-info mb-3" style={{ background: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
                  <h6>
                    <i className="fas fa-egg me-2"></i>
                    Ovulation Day
                  </h6>
                  <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0', color: '#e65100' }}>
                    This is your most fertile day. Likelihood of conception is highest.
                  </p>
                </div>
              )}
              
              {selectedDay.day.is_fertility_day && !selectedDay.day.is_ovulation_day && (
                <div className="cycle-info mb-3" style={{ background: '#f3e5f5', borderLeft: '4px solid #9c27b0' }}>
                  <h6>
                    <i className="fas fa-fire me-2"></i>
                    Fertile Window
                  </h6>
                  <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0', color: '#4a148c' }}>
                    You're in your fertile window. Pregnancy is possible during this time.
                  </p>
                </div>
              )}
              
              {!selectedDay.day.is_period_day && !selectedDay.day.is_ovulation_day && !selectedDay.day.is_fertility_day && selectedDay.day.is_current_month && (
                <div className="cycle-info mb-3" style={{ background: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
                  <h6>
                    <i className="fas fa-check-circle me-2"></i>
                    Safe Day
                  </h6>
                  <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0', color: '#1b5e20' }}>
                    Lower likelihood of fertility on this day.
                  </p>
                </div>
              )}
              
              {selectedDay.day.symptoms && selectedDay.day.symptoms.length > 0 && (
                <div className="symptoms-detail mb-3">
                  <h6>
                    <i className="fas fa-heart-pulse me-2"></i>
                    Symptoms
                  </h6>
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
                  <h6>
                    <i className="fas fa-clipboard me-2"></i>
                    Notes
                  </h6>
                  <p>{selectedDay.day.notes}</p>
                </div>
              )}
              
              {!selectedDay.day.is_period_day && (!selectedDay.day.symptoms || selectedDay.day.symptoms.length === 0) && !selectedDay.day.notes && (
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
