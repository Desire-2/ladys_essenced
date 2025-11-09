import React, { useState, useEffect } from 'react';
import { Child, CycleData } from '../../types';
import { DataSection } from '../ui/DataSection';
import { EmptyState } from '../ui/EmptyState';
import CycleCalendar from '../../../../components/CycleCalendar';
import { api } from '../../../../lib/api/client';
import '../../../../styles/enhanced-cycle-tab.css';

interface CycleTabProps {
  selectedChild: number | null;
  children: Child[];
  cycleData: CycleData;
  calendarData: any;
  currentDate: Date;
  dataLoadingStates: any;
  dataErrors: any;
  dataAvailability: any;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  onRetryDataLoad: (dataType: string) => void;
  onCycleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  cycleError?: string;
}

export const CycleTab: React.FC<CycleTabProps> = ({
  selectedChild,
  children,
  cycleData,
  calendarData,
  currentDate,
  dataLoadingStates,
  dataErrors,
  dataAvailability,
  onNavigateMonth,
  onRetryDataLoad,
  onCycleSubmit,
  cycleError
}) => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [phaseGuidance, setPhaseGuidance] = useState<string>('');

  // Load intelligent cycle data
  useEffect(() => {
    loadIntelligentData();
  }, [selectedChild]);

  const loadIntelligentData = async () => {
    if (!dataAvailability.cycle) return;
    
    try {
      setLoadingPredictions(true);
      
      // Load predictions and insights
      const [predictionsData, insightsData, statsData] = await Promise.all([
        api.cycle.getPredictions(3, selectedChild),
        api.cycle.getInsights(selectedChild),
        api.cycle.getStats(selectedChild)
      ]);
      
      setPredictions(predictionsData);
      setInsights(insightsData);
      setCurrentPhase(statsData.basic_stats?.current_cycle_phase);
      
      // Set phase-specific guidance
      setPhaseGuidance(getPhaseGuidance(statsData.basic_stats?.current_cycle_phase));
      
    } catch (error) {
      console.error('Failed to load intelligent cycle data:', error);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const getPhaseGuidance = (phase: string | null) => {
    const guidance = {
      menstrual: 'Rest and self-care are important. Stay hydrated and consider gentle exercises like yoga.',
      follicular: 'Energy is rising! This is a great time for challenging workouts and new activities.',
      ovulation: 'Peak energy and fertility window. You may feel most confident and social.',
      luteal: 'Energy may be waning. Focus on winding down and preparing for your next cycle.'
    };
    return guidance[phase as keyof typeof guidance] || 'Track your symptoms and patterns for better insights.';
  };

  const getPhaseColor = (phase: string | null) => {
    const colors: Record<string, string> = {
      menstrual: '#FF5252',
      follicular: '#81C784',
      ovulation: '#FFD54F',
      luteal: '#9575CD'
    };
    return colors[phase || ''] || '#6c757d';
  };

  const getPhaseIcon = (phase: string | null) => {
    const icons: Record<string, string> = {
      menstrual: 'circle',
      follicular: 'seedling',
      ovulation: 'egg',
      luteal: 'moon'
    };
    return icons[phase || ''] || 'question';
  };
  return (
    <div className="cycle-tab-container" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Enhanced Current Phase Banner */}
      {currentPhase && (
        <div 
          className="card mb-4 text-white border-0 overflow-hidden position-relative phase-banner" 
          style={{ 
            background: `linear-gradient(135deg, ${getPhaseColor(currentPhase)}, ${getPhaseColor(currentPhase)}dd, ${getPhaseColor(currentPhase)}bb)`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            borderRadius: '20px'
          }}
        >
          {/* Decorative background elements */}
          <div 
            className="position-absolute" 
            style={{
              top: '-20px',
              right: '-20px',
              width: '120px',
              height: '120px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              filter: 'blur(40px)'
            }}
          ></div>
          <div 
            className="position-absolute" 
            style={{
              bottom: '-30px',
              left: '-30px',
              width: '80px',
              height: '80px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '50%',
              filter: 'blur(30px)'
            }}
          ></div>
          
          <div className="card-body position-relative" style={{ padding: 'clamp(1.5rem, 4vw, 2rem)' }}>
            <div className="row align-items-center g-3">
              <div className="col-auto">
                <div 
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 'clamp(60px, 15vw, 80px)',
                    height: 'clamp(60px, 15vw, 80px)',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: 'clamp(15px, 4vw, 20px)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                >
                  <i className={`fas fa-${getPhaseIcon(currentPhase)}`} style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}></i>
                </div>
              </div>
              <div className="col">
                <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center mb-2">
                  <h4 className="mb-1 mb-lg-0 text-capitalize fw-bold me-lg-3" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>
                    {currentPhase} Phase
                  </h4>
                  <span 
                    className="badge text-dark fw-semibold px-3 py-2"
                    style={{ 
                      background: 'rgba(255,255,255,0.9)',
                      borderRadius: '25px',
                      fontSize: 'clamp(0.7rem, 2vw, 0.75rem)'
                    }}
                  >
                    <i className="fas fa-pulse me-1"></i>
                    Active
                  </span>
                </div>
                <p className="mb-2 opacity-90" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', lineHeight: '1.5' }}>
                  <i className="fas fa-lightbulb me-2 opacity-75"></i>
                  {phaseGuidance}
                </p>
                {selectedChild && (
                  <div className="d-flex align-items-center opacity-85">
                    <i className="fas fa-user-circle me-2"></i>
                    <small style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                      Tracking for: <strong>{children.find(c => c.user_id === selectedChild)?.name}</strong>
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-3 g-md-4">
        {/* Left Column: Calendar and Intelligent Insights */}
        <div className="col-12 col-xl-8 col-lg-7">
          {/* Enhanced Calendar Section with Modern Design */}
          <div 
            className="card h-100 border-0 enhanced-card"
            style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fffe 100%)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
              borderRadius: 'clamp(16px, 4vw, 24px)',
              overflow: 'hidden'
            }}
          >
            {/* Modern Card Header */}
            <div 
              className="card-header border-0 text-white position-relative"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 4vw, 2rem)'
              }}
            >
              <div 
                className="position-absolute"
                style={{
                  top: '0',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  background: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="3" cy="3" r="3"/%3E%3Ccircle cx="13" cy="13" r="3"/%3E%3C/g%3E%3C/svg%3E") repeat'
                }}
              ></div>
              <div className="position-relative">
                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center">
                  <div 
                    className="me-0 me-sm-3 mb-2 mb-sm-0 d-flex align-items-center justify-content-center"
                    style={{
                      width: 'clamp(35px, 8vw, 40px)',
                      height: 'clamp(35px, 8vw, 40px)',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 'clamp(8px, 2vw, 12px)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <i className="fas fa-calendar-alt" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}></i>
                  </div>
                  <div>
                    <h5 className="mb-1 fw-bold" style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
                      Intelligent Cycle Calendar
                    </h5>
                    <p className="mb-0 opacity-90" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                      Track your cycle with AI-powered insights and predictions
                    </p>
                  </div>
                </div>
              </div>
              {dataAvailability.calendar && (
                <div className="position-absolute top-0 end-0 m-3">
                  <span 
                    className="badge text-success fw-semibold px-3 py-2"
                    style={{ 
                      background: 'rgba(255,255,255,0.9)',
                      borderRadius: '20px',
                      fontSize: '0.75rem'
                    }}
                  >
                    <i className="fas fa-check-circle me-1"></i>
                    Data Loaded
                  </span>
                </div>
              )}
            </div>
            
            <div className="card-body" style={{ padding: 'clamp(1rem, 4vw, 2rem)' }}>
              {dataLoadingStates.calendar ? (
                <div className="d-flex align-items-center justify-content-center py-5">
                  <div className="text-center">
                    <div 
                      className="spinner-border mb-3"
                      style={{ color: '#667eea' }}
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mb-0">Loading intelligent calendar...</p>
                  </div>
                </div>
              ) : dataErrors.calendar ? (
                <div className="alert alert-danger d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <div>
                    <strong>Unable to load calendar data</strong>
                    <div className="small mt-1">{dataErrors.calendar}</div>
                  </div>
                </div>
              ) : dataAvailability.calendar && calendarData ? (
                <>
                  <CycleCalendar 
                    calendarData={calendarData}
                    currentDate={currentDate}
                    onNavigateMonth={onNavigateMonth}
                  />
                  
                  {/* Enhanced Smart Predictions Preview */}
                  {predictions.length > 0 && (
                    <div className="mt-4">
                      <div 
                        className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center mb-3 p-3 rounded-3"
                        style={{ background: 'linear-gradient(135deg, #f093fb15, #f5f7fa)' }}
                      >
                        <div 
                          className="me-0 me-sm-3 mb-2 mb-sm-0 d-flex align-items-center justify-content-center"
                          style={{
                            width: 'clamp(35px, 8vw, 40px)',
                            height: 'clamp(35px, 8vw, 40px)',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            borderRadius: 'clamp(8px, 2vw, 12px)',
                            color: 'white'
                          }}
                        >
                          <i className="fas fa-crystal-ball" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}></i>
                        </div>
                        <div className="text-center text-sm-start">
                          <h6 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>Upcoming Predictions</h6>
                          <small className="text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>AI-powered cycle forecasting</small>
                        </div>
                      </div>
                      <div className="row g-2 g-md-3">
                        {predictions.slice(0, 2).map((prediction, index) => (
                          <div key={index} className="col-12 col-sm-6">
                            <div 
                              className="card border-0 h-100 prediction-card"
                              style={{
                                background: 'linear-gradient(135deg, #ffffff, #f8fffe)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                borderRadius: 'clamp(12px, 3vw, 16px)',
                                borderLeft: `4px solid ${prediction.confidence === 'high' ? '#28a745' : prediction.confidence === 'medium' ? '#ffc107' : '#6c757d'}`
                              }}
                            >
                              <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div className="d-flex align-items-center">
                                    <div 
                                      className="me-2 d-flex align-items-center justify-content-center"
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        background: 'linear-gradient(135deg, #ff6b6b, #ffa500)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      <i className="fas fa-calendar-alt"></i>
                                    </div>
                                    <h6 className="mb-0 fw-bold">
                                      Period #{prediction.cycle_number}
                                    </h6>
                                  </div>
                                  <span 
                                    className={`badge text-white fw-semibold px-2 py-1`}
                                    style={{ 
                                      background: prediction.confidence === 'high' ? '#28a745' : 
                                                 prediction.confidence === 'medium' ? '#ffc107' : '#6c757d',
                                      borderRadius: '20px',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    <i className={`fas fa-${prediction.confidence === 'high' ? 'check-circle' : 
                                                              prediction.confidence === 'medium' ? 'exclamation-circle' : 'question-circle'} me-1`}></i>
                                    {prediction.confidence}
                                  </span>
                                </div>
                                <div className="small text-muted mb-2">
                                  <i className="fas fa-calendar me-1"></i>
                                  {new Date(prediction.predicted_start).toLocaleDateString()} - 
                                  {new Date(prediction.predicted_end).toLocaleDateString()}
                                </div>
                                <div className="small">
                                  <i className="fas fa-egg me-1" style={{ color: '#ffa500' }}></i>
                                  <span className="fw-semibold">Ovulation:</span> {new Date(prediction.ovulation_date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                  <h6 className="text-muted">Calendar Unavailable</h6>
                  <p className="text-muted small mb-3">Unable to load calendar data. Please check your connection and try again.</p>
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => onRetryDataLoad('calendar')}
                  >
                    <i className="fas fa-redo me-1"></i>
                    Retry Loading
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column: Enhanced Logging Form and Quick Actions */}
        <div className="col-12 col-xl-4 col-lg-5">
          {/* Ultra-Modern Smart Phase-Aware Logging Form */}
          <div 
            className="card border-0 mb-3 mb-md-4 enhanced-card"
            style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fffe 100%)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
              borderRadius: 'clamp(16px, 4vw, 24px)',
              overflow: 'hidden'
            }}
          >
            <div 
              className="card-header text-white border-0 position-relative"
              style={{ 
                background: currentPhase ? 
                  `linear-gradient(135deg, ${getPhaseColor(currentPhase)}, ${getPhaseColor(currentPhase)}cc, ${getPhaseColor(currentPhase)}aa)` : 
                  'linear-gradient(135deg, #007bff, #0056b3)',
                padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1rem, 4vw, 2rem)'
              }}
            >
              {/* Background pattern */}
              <div 
                className="position-absolute"
                style={{
                  top: '0',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  background: 'url("data:image/svg+xml,%3Csvg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.06"%3E%3Ccircle cx="15" cy="15" r="2"/%3E%3Ccircle cx="5" cy="5" r="2"/%3E%3Ccircle cx="25" cy="25" r="2"/%3E%3C/g%3E%3C/svg%3E") repeat'
                }}
              ></div>
              
              <div className="position-relative">
                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center mb-1">
                  <div 
                    className="me-0 me-sm-3 mb-2 mb-sm-0 d-flex align-items-center justify-content-center"
                    style={{
                      width: 'clamp(40px, 10vw, 45px)',
                      height: 'clamp(40px, 10vw, 45px)',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 'clamp(12px, 3vw, 15px)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    <i className="fas fa-plus-circle" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}></i>
                  </div>
                  <div className="text-center text-sm-start">
                    <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>Log New Period</h5>
                    <small className="opacity-85" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>Quick and smart tracking</small>
                  </div>
                </div>
                {currentPhase && (
                  <div className="d-flex align-items-center mt-2">
                    <div 
                      className="me-2"
                      style={{
                        width: '8px',
                        height: '8px',
                        background: 'rgba(255,255,255,0.8)',
                        borderRadius: '50%'
                      }}
                    ></div>
                    <small className="opacity-90">Currently in <strong>{currentPhase} phase</strong></small>
                  </div>
                )}
              </div>
            </div>
            <div className="card-body" style={{ padding: 'clamp(1rem, 4vw, 2rem)' }}>
              {/* Enhanced Phase-specific guidance */}
              {currentPhase && (
                <div 
                  className="mb-3 p-3 rounded-3 border-0"
                  style={{
                    background: currentPhase === 'menstrual' ? 'linear-gradient(135deg, #ffebee, #ffcdd2)' :
                               currentPhase === 'follicular' ? 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' :
                               currentPhase === 'ovulation' ? 'linear-gradient(135deg, #fff3e0, #ffe0b2)' : 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                    border: `1px solid ${
                      currentPhase === 'menstrual' ? '#f44336' :
                      currentPhase === 'follicular' ? '#4caf50' :
                      currentPhase === 'ovulation' ? '#ff9800' : '#2196f3'
                    }33`
                  }}
                >
                  <div className="d-flex align-items-start">
                    <div 
                      className="me-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: '32px',
                        height: '32px',
                        background: currentPhase === 'menstrual' ? '#f44336' :
                                   currentPhase === 'follicular' ? '#4caf50' :
                                   currentPhase === 'ovulation' ? '#ff9800' : '#2196f3',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className={`fas fa-${getPhaseIcon(currentPhase)}`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold mb-1" style={{ fontSize: '0.9rem' }}>
                        Phase Guidance
                      </div>
                      <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                        {phaseGuidance}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={onCycleSubmit}>
                {cycleError && <div className="alert alert-danger">{cycleError}</div>}
                
                <div className="form-group mb-4">
                  <label htmlFor="startDate" className="form-label fw-semibold mb-2">
                    <i className="fas fa-calendar me-2" style={{ color: '#667eea' }}></i>
                    Start Date
                  </label>
                  <input 
                    type="date" 
                    className="form-control border-0 enhanced-input enhanced-focus"
                    style={{
                      background: 'linear-gradient(135deg, #f8f9fa, #ffffff)',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                      fontSize: '0.95rem'
                    }}
                    id="startDate" 
                    name="startDate"
                    required 
                  />
                </div>
                
                <div className="form-group mb-4">
                  <label htmlFor="endDate" className="form-label fw-semibold mb-2">
                    <i className="fas fa-calendar-check me-2" style={{ color: '#28a745' }}></i>
                    <span>End Date</span> 
                    <span 
                      className="ms-2 badge bg-light text-muted"
                      style={{ fontSize: '0.7rem', fontWeight: 'normal' }}
                    >
                      Optional
                    </span>
                  </label>
                  <input 
                    type="date" 
                    className="form-control border-0 enhanced-input enhanced-focus"
                    style={{
                      background: 'linear-gradient(135deg, #f8f9fa, #ffffff)',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                      fontSize: '0.95rem'
                    }}
                    id="endDate" 
                    name="endDate"
                  />
                </div>
                
                <div className="form-group mb-4">
                  <label className="form-label fw-semibold mb-3">
                    <i className="fas fa-thermometer-half me-2" style={{ color: '#ff6b6b' }}></i>
                    Flow Intensity
                  </label>
                  <div className="btn-group d-flex flex-column flex-sm-row" role="group">
                    <input type="radio" className="btn-check" name="flowIntensity" id="light" value="light" />
                    <label 
                      className="btn btn-outline-info border-0 fw-semibold flow-btn mb-2 mb-sm-0"
                      style={{
                        borderRadius: 'clamp(8px, 2vw, 12px)',
                        padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem)',
                        background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                        color: '#1565c0',
                        boxShadow: '0 2px 8px rgba(33,150,243,0.1)',
                        transition: 'all 0.2s ease',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                      }}
                      htmlFor="light"
                    >
                      💧 Light
                    </label>
                    
                    <input type="radio" className="btn-check" name="flowIntensity" id="medium" value="medium" />
                    <label 
                      className="btn btn-outline-warning border-0 fw-semibold mx-0 mx-sm-2 mb-2 mb-sm-0 flow-btn"
                      style={{
                        borderRadius: 'clamp(8px, 2vw, 12px)',
                        padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem)',
                        background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
                        color: '#e65100',
                        boxShadow: '0 2px 8px rgba(255,152,0,0.1)',
                        transition: 'all 0.2s ease',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                      }}
                      htmlFor="medium"
                    >
                      💧💧 Medium
                    </label>
                    
                    <input type="radio" className="btn-check" name="flowIntensity" id="heavy" value="heavy" />
                    <label 
                      className="btn btn-outline-danger border-0 fw-semibold flow-btn"
                      style={{
                        borderRadius: 'clamp(8px, 2vw, 12px)',
                        padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem)',
                        background: 'linear-gradient(135deg, #ffebee, #ffcdd2)',
                        color: '#c62828',
                        boxShadow: '0 2px 8px rgba(244,67,54,0.1)',
                        transition: 'all 0.2s ease',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                      }}
                      htmlFor="heavy"
                    >
                      💧💧💧 Heavy
                    </label>
                  </div>
                </div>
                
                <div className="form-group mb-4">
                  <label className="form-label fw-semibold mb-3">
                    <i className="fas fa-notes-medical me-2" style={{ color: '#9c27b0' }}></i>
                    Symptoms
                  </label>
                  <div 
                    className="p-3 rounded-3"
                    style={{
                      background: 'linear-gradient(135deg, #f3e5f5, #e1bee7)',
                      border: '1px solid rgba(156,39,176,0.2)'
                    }}
                  >
                    <div className="row g-1 g-md-2">
                      <div className="col-12 col-sm-6">
                        <div className="form-check mb-2">
                          <input 
                            className="form-check-input enhanced-checkbox" 
                            type="checkbox" 
                            name="symptoms" 
                            value="cramps" 
                            id="cramps"
                            style={{ borderRadius: '6px' }}
                          />
                          <label className="form-check-label fw-medium" htmlFor="cramps" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.9rem)' }}>
                            🩸 Cramps
                          </label>
                        </div>
                        <div className="form-check mb-2">
                          <input 
                            className="form-check-input enhanced-checkbox" 
                            type="checkbox" 
                            name="symptoms" 
                            value="bloating" 
                            id="bloating"
                            style={{ borderRadius: '6px' }}
                          />
                          <label className="form-check-label fw-medium" htmlFor="bloating" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.9rem)' }}>
                            🎈 Bloating
                          </label>
                        </div>
                        <div className="form-check mb-2">
                          <input 
                            className="form-check-input enhanced-checkbox" 
                            type="checkbox" 
                            name="symptoms" 
                            value="headache" 
                            id="headache"
                            style={{ borderRadius: '6px' }}
                          />
                          <label className="form-check-label fw-medium" htmlFor="headache" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.9rem)' }}>
                            🤕 Headache
                          </label>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <div className="form-check mb-2">
                          <input 
                            className="form-check-input enhanced-checkbox" 
                            type="checkbox" 
                            name="symptoms" 
                            value="mood_swings" 
                            id="mood_swings"
                            style={{ borderRadius: '6px' }}
                          />
                          <label className="form-check-label fw-medium" htmlFor="mood_swings" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.9rem)' }}>
                            😭 Mood Swings
                          </label>
                        </div>
                        <div className="form-check mb-2">
                          <input 
                            className="form-check-input enhanced-checkbox" 
                            type="checkbox" 
                            name="symptoms" 
                            value="fatigue" 
                            id="fatigue"
                            style={{ borderRadius: '6px' }}
                          />
                          <label className="form-check-label fw-medium" htmlFor="fatigue" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.9rem)' }}>
                            😴 Fatigue
                          </label>
                        </div>
                        <div className="form-check mb-2">
                          <input 
                            className="form-check-input enhanced-checkbox" 
                            type="checkbox" 
                            name="symptoms" 
                            value="acne" 
                            id="acne"
                            style={{ borderRadius: '6px' }}
                          />
                          <label className="form-check-label fw-medium" htmlFor="acne" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.9rem)' }}>
                            🔴 Acne
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="form-group mb-4">
                  <label htmlFor="notes" className="form-label fw-semibold mb-2">
                    <i className="fas fa-sticky-note me-2" style={{ color: '#ffc107' }}></i>
                    Notes
                  </label>
                  <textarea 
                    className="form-control border-0 enhanced-input enhanced-focus custom-scrollbar"
                    style={{
                      background: 'linear-gradient(135deg, #f8f9fa, #ffffff)',
                      borderRadius: 'clamp(8px, 2vw, 12px)',
                      padding: 'clamp(0.75rem, 3vw, 1rem)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                      fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
                      resize: 'vertical',
                      minHeight: 'clamp(80px, 15vw, 120px)'
                    }}
                    id="notes" 
                    name="notes"
                    rows={3}
                    placeholder="Any additional notes about your cycle, mood, or how you're feeling..."
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  className="btn w-100 text-white fw-bold border-0 submit-btn"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 'clamp(10px, 3vw, 15px)',
                    padding: 'clamp(0.7rem, 3vw, 0.85rem) clamp(0.8rem, 4vw, 1rem)',
                    fontSize: 'clamp(0.9rem, 3vw, 1rem)',
                    boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(102,126,234,0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(102,126,234,0.4)';
                  }}
                >
                  <i className="fas fa-save me-2 animated-icon"></i>
                  Save Period Log
                </button>
              </form>
            </div>
          </div>
          
          {/* Enhanced Smart Predictions Summary */}
          {predictions.length > 0 && (
            <div 
              className="card border-0 mt-4 enhanced-card"
              style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fffe 100%)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                borderRadius: '24px',
                overflow: 'hidden'
              }}
            >
              <div 
                className="card-header border-0 text-white position-relative"
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1rem, 4vw, 2rem)'
                }}
              >
                <div 
                  className="position-absolute"
                  style={{
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'url("data:image/svg+xml,%3Csvg width="25" height="25" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M12.5 0L15.5 8.5L25 12.5L15.5 16.5L12.5 25L9.5 16.5L0 12.5L9.5 8.5Z"/%3E%3C/g%3E%3C/svg%3E") repeat'
                  }}
                ></div>
                <div className="position-relative d-flex flex-column flex-sm-row align-items-start align-items-sm-center">
                  <div 
                    className="me-0 me-sm-3 mb-2 mb-sm-0 d-flex align-items-center justify-content-center"
                    style={{
                      width: 'clamp(35px, 8vw, 40px)',
                      height: 'clamp(35px, 8vw, 40px)',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 'clamp(8px, 2vw, 12px)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    <i className="fas fa-crystal-ball" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}></i>
                  </div>
                  <div className="text-center text-sm-start">
                    <h6 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>Smart Predictions</h6>
                    <small className="opacity-90" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>AI-powered cycle forecasting</small>
                  </div>
                </div>
              </div>
              <div className="card-body" style={{ padding: '2rem' }}>
                {predictions.slice(0, 2).map((prediction, index) => (
                  <div 
                    key={index} 
                    className={`mb-3 p-3 rounded-3 ${index < predictions.slice(0, 2).length - 1 ? 'mb-4' : ''}`}
                    style={{
                      background: 'linear-gradient(135deg, #f8f9fa, #ffffff)',
                      border: '1px solid rgba(102,126,234,0.1)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center">
                        <div 
                          className="me-2 d-flex align-items-center justify-content-center"
                          style={{
                            width: '32px',
                            height: '32px',
                            background: 'linear-gradient(135deg, #ff6b6b, #ffa500)',
                            borderRadius: '10px',
                            color: 'white',
                            fontSize: '0.8rem'
                          }}
                        >
                          <i className="fas fa-calendar-alt"></i>
                        </div>
                        <div className="fw-bold" style={{ color: '#333' }}>
                          Period #{prediction.cycle_number}
                        </div>
                      </div>
                      <span 
                        className={`badge text-white fw-semibold px-3 py-2`}
                        style={{ 
                          background: prediction.confidence === 'high' ? 'linear-gradient(135deg, #28a745, #20c997)' : 
                                     prediction.confidence === 'medium' ? 'linear-gradient(135deg, #ffc107, #fd7e14)' : 
                                     'linear-gradient(135deg, #6c757d, #495057)',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        <i className={`fas fa-${
                          prediction.confidence === 'high' ? 'check-circle' :
                          prediction.confidence === 'medium' ? 'exclamation-circle' : 'question-circle'
                        } me-1`}></i>
                        {prediction.confidence}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <div 
                        className="small fw-semibold mb-1 d-flex align-items-center"
                        style={{ color: '#495057' }}
                      >
                        <i className="fas fa-calendar me-2" style={{ color: '#667eea' }}></i>
                        Duration
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                        {new Date(prediction.predicted_start).toLocaleDateString()} - 
                        {new Date(prediction.predicted_end).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="row">
                      <div className="col-6">
                        <div 
                          className="small fw-semibold mb-1 d-flex align-items-center"
                          style={{ color: '#495057' }}
                        >
                          <i className="fas fa-egg me-2" style={{ color: '#ffa500' }}></i>
                          Ovulation
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                          {new Date(prediction.ovulation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div className="col-6">
                        <div 
                          className="small fw-semibold mb-1 d-flex align-items-center"
                          style={{ color: '#495057' }}
                        >
                          <i className="fas fa-calendar-day me-2" style={{ color: '#17a2b8' }}></i>
                          Cycle Length
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                          {Math.round(prediction.predicted_cycle_length)} days
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div 
                  className="text-center mt-3 p-3 rounded-3"
                  style={{ background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' }}
                >
                  <i className="fas fa-info-circle me-2" style={{ color: '#1565c0' }}></i>
                  <small style={{ color: '#1565c0', fontWeight: '500' }}>
                    Predictions improve with more tracking data
                  </small>
                </div>
              </div>
            </div>
          )}
          
          {/* Enhanced Health Tips */}
          {insights && (
            <div 
              className="card border-0 mt-4 enhanced-card"
              style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #f0fff4 100%)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                borderRadius: '24px',
                overflow: 'hidden'
              }}
            >
              <div 
                className="card-header border-0 text-white position-relative"
                style={{ 
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 50%, #17a2b8 100%)',
                  padding: '1.5rem 2rem'
                }}
              >
                <div 
                  className="position-absolute"
                  style={{
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'url("data:image/svg+xml,%3Csvg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="15" cy="15" r="8"/%3E%3Ccircle cx="5" cy="5" r="3"/%3E%3Ccircle cx="25" cy="25" r="3"/%3E%3C/g%3E%3C/svg%3E") repeat'
                  }}
                ></div>
                <div className="position-relative d-flex align-items-center">
                  <div 
                    className="me-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    <i className="fas fa-lightbulb"></i>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">Health Tips</h6>
                    <small className="opacity-90">Personalized wellness advice</small>
                  </div>
                </div>
              </div>
              <div className="card-body" style={{ padding: 'clamp(1rem, 4vw, 2rem)' }}>
                <div className="row g-2 g-md-3">
                  <div className="col-12">
                    <div 
                      className="p-3 rounded-3 d-flex align-items-center health-tip floating"
                      style={{
                        background: 'linear-gradient(135deg, #ffebee, #ffcdd2)',
                        border: '1px solid rgba(244,67,54,0.2)'
                      }}
                    >
                      <div 
                        className="me-3 d-flex align-items-center justify-content-center animated-icon"
                        style={{
                          width: '40px',
                          height: '40px',
                          background: '#f44336',
                          borderRadius: '12px',
                          color: 'white'
                        }}
                      >
                        <i className="fas fa-heartbeat"></i>
                      </div>
                      <div>
                        <div className="fw-bold mb-1 gradient-text" style={{ color: '#c62828' }}>Track Regularly</div>
                        <small style={{ color: '#d32f2f' }}>Consistent logging improves prediction accuracy</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div 
                      className="p-3 rounded-3 d-flex align-items-center health-tip floating"
                      style={{
                        background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                        border: '1px solid rgba(33,150,243,0.2)'
                      }}
                    >
                      <div 
                        className="me-3 d-flex align-items-center justify-content-center animated-icon"
                        style={{
                          width: '40px',
                          height: '40px',
                          background: '#2196f3',
                          borderRadius: '12px',
                          color: 'white'
                        }}
                      >
                        <i className="fas fa-water"></i>
                      </div>
                      <div>
                        <div className="fw-bold mb-1 gradient-text" style={{ color: '#1565c0' }}>Stay Hydrated</div>
                        <small style={{ color: '#1976d2' }}>Extra water helps during your period</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div 
                      className="p-3 rounded-3 d-flex align-items-center health-tip floating"
                      style={{
                        background: 'linear-gradient(135deg, #f3e5f5, #e1bee7)',
                        border: '1px solid rgba(156,39,176,0.2)'
                      }}
                    >
                      <div 
                        className="me-3 d-flex align-items-center justify-content-center animated-icon"
                        style={{
                          width: '40px',
                          height: '40px',
                          background: '#9c27b0',
                          borderRadius: '12px',
                          color: 'white'
                        }}
                      >
                        <i className="fas fa-moon"></i>
                      </div>
                      <div>
                        <div className="fw-bold mb-1 gradient-text" style={{ color: '#7b1fa2' }}>Quality Sleep</div>
                        <small style={{ color: '#8e24aa' }}>Good rest helps regulate your cycle</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};