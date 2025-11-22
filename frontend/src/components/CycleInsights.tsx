'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface CycleInsightsProps {
  userId?: number | null;
}

interface Prediction {
  cycle_number: number;
  predicted_start: string;
  predicted_end: string;
  ovulation_date: string;
  fertile_window_start: string;
  fertile_window_end: string;
  confidence: 'high' | 'medium' | 'low';
  predicted_cycle_length: number;
  predicted_period_length: number;
}

interface Insight {
  type: 'positive' | 'warning' | 'info';
  category: string;
  message: string;
  detail?: string;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  message: string;
  tips?: string[];
  phase?: string;
}

interface CycleStats {
  basic_stats: {
    average_cycle_length: number | null;
    average_period_length: number | null;
    weighted_cycle_length: number | null;
    total_logs: number;
    data_points: number;
    latest_period_start: string | null;
    days_since_period: number;
    current_cycle_phase: string | null;
  };
  predictions: Prediction[];
  variability: {
    variability: string;
    std_dev: number;
    coefficient_of_variation: number;
  } | null;
  symptom_analysis: {
    common_symptoms: Record<string, number>;
    symptom_patterns: any;
  };
  health_insights: Insight[];
  recommendation: string | {
    primary: string;
    confidence: string;
    trend: string;
  };
}

interface MLInsights {
  pattern_analysis: {
    patterns_detected: number;
    confidence: string;
    learning_status: string;
    user_profile: {
      regularity_score: number;
      predictability_index: number;
      trend_direction: string;
    };
  };
  anomaly_detection: {
    anomalies_detected: boolean;
    risk_level: string;
    recommendations: string[];
  };
  adaptive_learning: {
    accuracy_trend: string;
    improvement_potential: number;
    cycles_needed_for_optimization: number;
  };
  seasonal_patterns: {
    detected: boolean;
    monthly_variations: Record<string, number>;
    confidence: number;
  };
}

export default function CycleInsights({ userId }: CycleInsightsProps) {
  const [stats, setStats] = useState<CycleStats | null>(null);
  const [mlInsights, setMLInsights] = useState<MLInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { accessToken, loading: authLoading, makeAuthenticatedRequest } = useAuth();

  useEffect(() => {
    if (authLoading || !accessToken) {
      return;
    }
    loadStats();
    loadMLInsights();
  }, [userId, authLoading, accessToken, makeAuthenticatedRequest]);

  const loadStats = async () => {
    if (!accessToken) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      const query = userId ? `?user_id=${userId}` : '';
      const response = await makeAuthenticatedRequest(`/api/cycle-logs/stats${query}`);
      setStats(response);
    } catch (err: any) {
      console.error('Failed to load cycle insights:', err);
      setError('Unable to load cycle insights');
    } finally {
      setLoading(false);
    }
  };

  const loadMLInsights = async () => {
    if (!accessToken) {
      return;
    }
    try {
      const query = userId ? `?user_id=${userId}` : '';
      const response = await makeAuthenticatedRequest(`/api/cycle-logs/ml-insights${query}`);
      setMLInsights(response);
    } catch (err: any) {
      console.error('Failed to load ML insights:', err);
      // Don't show error for ML insights, just continue without them
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const badges = {
      high: { color: 'success', icon: 'check-circle', text: 'High Confidence' },
      medium: { color: 'warning', icon: 'exclamation-circle', text: 'Medium Confidence' },
      low: { color: 'secondary', icon: 'question-circle', text: 'Low Confidence' }
    };
    const badge = badges[confidence as keyof typeof badges] || badges.low;
    return (
      <span className={`badge bg-${badge.color} d-inline-flex align-items-center`}>
        <i className={`fas fa-${badge.icon} me-1`}></i>
        {badge.text}
      </span>
    );
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading intelligent insights...</p>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="alert alert-info">
        <i className="fas fa-lock me-2"></i>
        Please sign in to view intelligent cycle insights.
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="alert alert-warning">
        <i className="fas fa-exclamation-triangle me-2"></i>
        {error || 'No cycle data available yet. Start logging to see insights!'}
      </div>
    );
  }

  // Handle case when no cycle data exists yet
  if (!stats.basic_stats || (stats.basic_stats.total_logs === 0)) {
    return (
      <div className="cycle-insights">
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="mb-4">
              <i className="fas fa-calendar-plus fa-4x text-muted mb-3"></i>
              <h5 className="text-muted">Start Your Cycle Journey</h5>
              <p className="text-muted mb-4">
                Begin tracking your menstrual cycle to unlock intelligent insights, 
                accurate predictions, and personalized health recommendations.
              </p>
            </div>
            
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="text-center">
                  <i className="fas fa-chart-line fa-2x text-primary mb-2"></i>
                  <h6>Smart Predictions</h6>
                  <small className="text-muted">Get accurate forecasts up to 12 months ahead</small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center">
                  <i className="fas fa-heartbeat fa-2x text-success mb-2"></i>
                  <h6>Health Insights</h6>
                  <small className="text-muted">Understand your cycle patterns and phases</small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center">
                  <i className="fas fa-lightbulb fa-2x text-warning mb-2"></i>
                  <h6>Personal Tips</h6>
                  <small className="text-muted">Phase-specific guidance and recommendations</small>
                </div>
              </div>
            </div>
            
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              <strong>Getting Started:</strong> Log your first period to begin receiving intelligent insights. 
              The more you track, the more accurate your predictions become!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cycle-insights">
      {/* ML Learning Status Banner */}
      {mlInsights && (
        <div className="card mb-4 bg-gradient-primary text-white">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-auto">
                <i className="fas fa-brain fa-3x"></i>
              </div>
              <div className="col">
                <h5 className="mb-1">
                  <i className="fas fa-robot me-2"></i>
                  AI Learning Status: {mlInsights.pattern_analysis.learning_status}
                </h5>
                <p className="mb-0">
                  {mlInsights.pattern_analysis.patterns_detected} patterns detected • 
                  {mlInsights.pattern_analysis.confidence} confidence
                </p>
              </div>
              <div className="col-auto">
                <div className="text-end">
                  <div className="h3 mb-0">
                    {mlInsights.pattern_analysis.user_profile.regularity_score != null && 
                     !isNaN(mlInsights.pattern_analysis.user_profile.regularity_score)
                      ? `${Math.round(mlInsights.pattern_analysis.user_profile.regularity_score * 100)}%`
                      : 'N/A'}
                  </div>
                  <small>regularity score</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Phase Banner */}
      {stats.basic_stats?.current_cycle_phase && (
        <div 
          className="card mb-4 text-white" 
          style={{ 
            background: `linear-gradient(135deg, ${getPhaseColor(stats.basic_stats?.current_cycle_phase)}, ${getPhaseColor(stats.basic_stats?.current_cycle_phase)}dd)`,
            border: 'none'
          }}
        >
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-auto">
                <i className={`fas fa-${getPhaseIcon(stats.basic_stats?.current_cycle_phase)} fa-3x`}></i>
              </div>
              <div className="col">
                <h5 className="mb-1 text-capitalize">
                  {stats.basic_stats?.current_cycle_phase} Phase
                </h5>
                <p className="mb-0">
                  Day {stats.basic_stats?.days_since_period} since last period
                </p>
              </div>
              {stats.basic_stats?.weighted_cycle_length && (
                <div className="col-auto">
                  <div className="text-end">
                    <div className="h3 mb-0">{Math.round(stats.basic_stats.weighted_cycle_length)}</div>
                    <small>days avg cycle</small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cycle Regularity Card */}
      {stats.variability && (
        <div className="card mb-4">
          <div className="card-header bg-info text-white">
            <h6 className="mb-0">
              <i className="fas fa-chart-line me-2"></i>
              Cycle Regularity
            </h6>
          </div>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-capitalize fw-bold">
                {stats.variability.variability.replace('_', ' ')}
              </span>
              <span className={`badge ${
                stats.variability.variability === 'very_regular' ? 'bg-success' :
                stats.variability.variability === 'regular' ? 'bg-primary' :
                stats.variability.variability === 'somewhat_irregular' ? 'bg-warning' :
                'bg-danger'
              }`}>
                CV: {stats.variability.coefficient_of_variation.toFixed(1)}%
              </span>
            </div>
            <div className="progress" style={{ height: '8px' }}>
              <div 
                className={`progress-bar ${
                  stats.variability.coefficient_of_variation < 5 ? 'bg-success' :
                  stats.variability.coefficient_of_variation < 10 ? 'bg-primary' :
                  stats.variability.coefficient_of_variation < 20 ? 'bg-warning' :
                  'bg-danger'
                }`}
                style={{ width: `${Math.min(100, stats.variability.coefficient_of_variation * 5)}%` }}
              ></div>
            </div>
            <small className="text-muted d-block mt-2">
              Standard Deviation: {stats.variability.std_dev.toFixed(1)} days
            </small>
          </div>
        </div>
      )}

      {/* Next Predictions */}
      {stats.predictions && stats.predictions.length > 0 && (
        <div className="card mb-4 border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <div className="card-header border-0 position-relative" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '1.25rem 1.5rem'
          }}>
            {/* Decorative background elements */}
            <div className="position-absolute top-0 end-0 opacity-10" style={{ fontSize: '5rem', right: '-1rem', top: '-1rem' }}>
              <i className="fas fa-crystal-ball"></i>
            </div>
            <div className="position-relative d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-2 me-3" style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <i className="fas fa-magic text-white" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <div>
                  <h5 className="text-white mb-0 fw-bold">Intelligent Predictions</h5>
                  <small className="text-white opacity-90">AI-powered cycle forecasting</small>
                </div>
              </div>
              <span className="badge" style={{
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(10px)',
                padding: '8px 14px',
                fontSize: '0.8rem',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <i className="fas fa-chart-line me-1"></i>
                {stats.predictions.length} Cycles
              </span>
            </div>
          </div>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <div className="d-grid gap-3">
              {stats.predictions.slice(0, 3).map((prediction, index) => (
                <div 
                  key={index} 
                  className="position-relative overflow-hidden" 
                  style={{
                    background: index === 0 
                      ? 'linear-gradient(135deg, #ffeef8 0%, #fff5f7 100%)' 
                      : 'linear-gradient(135deg, #f8f9ff 0%, #fff5ff 100%)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    border: `2px solid ${index === 0 ? '#ffc9e8' : '#e8e6ff'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  {/* Next Period Badge */}
                  {index === 0 && (
                    <div className="position-absolute top-0 end-0 m-2">
                      <span className="badge" style={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        padding: '6px 12px',
                        fontSize: '0.7rem',
                        boxShadow: '0 2px 8px rgba(245, 87, 108, 0.3)'
                      }}>
                        <i className="fas fa-star me-1"></i>Next
                      </span>
                    </div>
                  )}

                  {/* Header Section */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle p-2 me-3" style={{
                        background: index === 0 ? 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        width: '42px',
                        height: '42px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}>
                        <i className="fas fa-calendar-day text-white" style={{ fontSize: '1rem' }}></i>
                      </div>
                      <div>
                        <h6 className="mb-1 fw-bold" style={{ 
                          color: index === 0 ? '#c44569' : '#764ba2',
                          fontSize: '1.05rem'
                        }}>
                          Cycle #{prediction.cycle_number}
                        </h6>
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ 
                            fontSize: '0.85rem',
                            color: '#6b7280',
                            fontWeight: '500'
                          }}>
                            <i className="fas fa-calendar-alt me-1" style={{ fontSize: '0.75rem' }}></i>
                            {formatDate(prediction.predicted_start)}
                          </span>
                          <i className="fas fa-arrow-right" style={{ fontSize: '0.7rem', color: '#d1d5db' }}></i>
                          <span style={{ 
                            fontSize: '0.85rem',
                            color: '#6b7280',
                            fontWeight: '500'
                          }}>
                            {formatDate(prediction.predicted_end)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {getConfidenceBadge(prediction.confidence)}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="row g-3">
                    {/* Ovulation Date */}
                    <div className="col-6">
                      <div className="p-3 rounded-3" style={{
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1.5px solid rgba(251, 191, 36, 0.3)'
                      }}>
                        <div className="d-flex align-items-center mb-2">
                          <div className="rounded-circle p-2 me-2" style={{
                            background: 'rgba(251, 191, 36, 0.2)',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <i className="fas fa-egg" style={{ fontSize: '0.85rem', color: '#f59e0b' }}></i>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: '600' }}>
                            Ovulation Day
                          </div>
                        </div>
                        <div className="fw-bold" style={{ 
                          fontSize: '0.95rem', 
                          color: '#78350f',
                          paddingLeft: '0.25rem'
                        }}>
                          {formatDate(prediction.ovulation_date)}
                        </div>
                      </div>
                    </div>

                    {/* Cycle Length */}
                    <div className="col-6">
                      <div className="p-3 rounded-3" style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1.5px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        <div className="d-flex align-items-center mb-2">
                          <div className="rounded-circle p-2 me-2" style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <i className="fas fa-chart-line" style={{ fontSize: '0.85rem', color: '#3b82f6' }}></i>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#1e3a8a', fontWeight: '600' }}>
                            Cycle Length
                          </div>
                        </div>
                        <div className="fw-bold" style={{ 
                          fontSize: '0.95rem', 
                          color: '#1e40af',
                          paddingLeft: '0.25rem'
                        }}>
                          {Math.round(prediction.predicted_cycle_length)} days
                        </div>
                      </div>
                    </div>

                    {/* Fertile Window */}
                    <div className="col-12">
                      <div className="p-3 rounded-3" style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1.5px solid rgba(16, 185, 129, 0.25)'
                      }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle p-2 me-2" style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <i className="fas fa-seedling" style={{ fontSize: '0.85rem', color: '#10b981' }}></i>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: '600' }}>
                                Fertile Window
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: '500' }}>
                                {formatDate(prediction.fertile_window_start)} - {formatDate(prediction.fertile_window_end)}
                              </div>
                            </div>
                          </div>
                          <span className="badge" style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#065f46',
                            fontSize: '0.75rem',
                            padding: '6px 10px'
                          }}>
                            <i className="fas fa-leaf me-1" style={{ fontSize: '0.65rem' }}></i>
                            Peak
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Period Duration */}
                    <div className="col-12">
                      <div className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{
                        background: 'rgba(139, 92, 246, 0.08)'
                      }}>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-clock text-purple me-2" style={{ color: '#8b5cf6', fontSize: '0.9rem' }}></i>
                          <span style={{ fontSize: '0.8rem', color: '#5b21b6', fontWeight: '500' }}>
                            Expected Period Duration
                          </span>
                        </div>
                        <span className="fw-bold" style={{ fontSize: '0.85rem', color: '#6d28d9' }}>
                          {Math.round(prediction.predicted_period_length)} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {stats.basic_stats?.data_points < 6 && (
              <div className="mt-3 p-3 rounded-3 position-relative overflow-hidden" style={{
                background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                border: '2px solid #bfdbfe'
              }}>
                <div className="d-flex align-items-start">
                  <div className="rounded-circle p-2 me-3 flex-shrink-0" style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fas fa-lightbulb" style={{ fontSize: '0.9rem', color: '#2563eb' }}></i>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1 fw-bold" style={{ color: '#1e40af', fontSize: '0.9rem' }}>
                      <i className="fas fa-chart-line me-1"></i>Improve Prediction Accuracy
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.85rem', color: '#1e3a8a', lineHeight: '1.5' }}>
                      {typeof stats.recommendation === 'string' 
                        ? stats.recommendation 
                        : stats.recommendation?.primary || 'Continue logging your cycles regularly to help our AI learn your unique patterns and provide more accurate predictions.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ML Anomaly Detection */}
      {mlInsights?.anomaly_detection && mlInsights.anomaly_detection.anomalies_detected && (
        <div className="card mb-4">
          <div className="card-header bg-warning text-dark">
            <h6 className="mb-0">
              <i className="fas fa-exclamation-triangle me-2"></i>
              AI Anomaly Detection
            </h6>
          </div>
          <div className="card-body">
            <div className="alert alert-warning">
              <div className="d-flex align-items-start">
                <i className="fas fa-shield-alt me-3 mt-1"></i>
                <div>
                  <strong>Irregular patterns detected</strong>
                  <div className="mt-2">
                    <span className={`badge bg-${
                      mlInsights.anomaly_detection.risk_level === 'high' ? 'danger' :
                      mlInsights.anomaly_detection.risk_level === 'medium' ? 'warning' : 'info'
                    }`}>
                      {mlInsights.anomaly_detection.risk_level} risk level
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {mlInsights.anomaly_detection.recommendations.map((rec, index) => (
              <div key={index} className="alert alert-info d-flex align-items-start mb-2">
                <i className="fas fa-lightbulb text-primary me-3 mt-1"></i>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ML Adaptive Learning Progress */}
      {mlInsights?.adaptive_learning && (
        <div className="card mb-4">
          <div className="card-header bg-info text-white">
            <h6 className="mb-0">
              <i className="fas fa-chart-line me-2"></i>
              Adaptive Learning Progress
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="text-center">
                  <div className={`h4 mb-1 text-${
                    mlInsights.adaptive_learning.accuracy_trend === 'improving' ? 'success' :
                    mlInsights.adaptive_learning.accuracy_trend === 'stable' ? 'primary' : 'warning'
                  }`}>
                    <i className={`fas fa-arrow-${
                      mlInsights.adaptive_learning.accuracy_trend === 'improving' ? 'up' :
                      mlInsights.adaptive_learning.accuracy_trend === 'stable' ? 'right' : 'down'
                    }`}></i>
                  </div>
                  <h6 className="text-capitalize">{mlInsights.adaptive_learning.accuracy_trend}</h6>
                  <small className="text-muted">Accuracy Trend</small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center">
                  <div className="h4 mb-1 text-success">
                    {Math.round(mlInsights.adaptive_learning.improvement_potential)}%
                  </div>
                  <h6>Improvement Potential</h6>
                  <small className="text-muted">With more data</small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center">
                  <div className="h4 mb-1 text-info">
                    {mlInsights.adaptive_learning.cycles_needed_for_optimization}
                  </div>
                  <h6>Cycles Needed</h6>
                  <small className="text-muted">For optimization</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ML Seasonal Patterns */}
      {mlInsights?.seasonal_patterns && mlInsights.seasonal_patterns.detected && (
        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h6 className="mb-0">
              <i className="fas fa-calendar-alt me-2"></i>
              Seasonal Patterns Detected
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-2">
              <div className="col-12 mb-3">
                <div className="alert alert-success">
                  <i className="fas fa-check-circle me-2"></i>
                  AI has detected seasonal patterns in your cycle with <strong>{Math.round(mlInsights.seasonal_patterns.confidence * 100)}% confidence</strong>
                </div>
              </div>
              {Object.entries(mlInsights.seasonal_patterns.monthly_variations).map(([month, variation]) => {
                const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const absVariation = Math.abs(variation);
                if (absVariation > 0.5) { // Only show significant variations
                  return (
                    <div key={month} className="col-md-6">
                      <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                        <span>{monthNames[parseInt(month)]}</span>
                        <span className={`badge bg-${variation > 0 ? 'warning' : 'info'}`}>
                          {variation > 0 ? '+' : ''}{variation.toFixed(1)} days
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      )}

      {/* Health Insights */}
      {stats.health_insights && stats.health_insights.length > 0 && (
        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h6 className="mb-0">
              <i className="fas fa-heartbeat me-2"></i>
              Health Insights
            </h6>
          </div>
          <div className="card-body">
            {stats.health_insights.map((insight, index) => (
              <div 
                key={index}
                className={`alert alert-${
                  insight.type === 'positive' ? 'success' :
                  insight.type === 'warning' ? 'warning' :
                  'info'
                } ${index < stats.health_insights.length - 1 ? 'mb-3' : 'mb-0'}`}
              >
                <div className="d-flex align-items-start">
                  <i className={`fas fa-${
                    insight.type === 'positive' ? 'check-circle' :
                    insight.type === 'warning' ? 'exclamation-triangle' :
                    'info-circle'
                  } me-2 mt-1`}></i>
                  <div className="flex-grow-1">
                    <strong className="d-block">{insight.message}</strong>
                    {insight.detail && (
                      <small className="text-muted">{insight.detail}</small>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Symptoms */}
      {stats.symptom_analysis && Object.keys(stats.symptom_analysis.common_symptoms).length > 0 && (
        <div className="card mb-4">
          <div className="card-header bg-warning text-dark">
            <h6 className="mb-0">
              <i className="fas fa-notes-medical me-2"></i>
              Common Symptoms
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-2">
              {Object.entries(stats.symptom_analysis.common_symptoms).slice(0, 6).map(([symptom, count], index) => (
                <div key={index} className="col-6">
                  <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                    <span className="text-capitalize small">{symptom.replace('_', ' ')}</span>
                    <span className="badge bg-warning text-dark">{count}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Recommendations */}
      {typeof stats.recommendation === 'object' && stats.recommendation && (
        <div className="card mb-4">
          <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <h6 className="mb-0 text-white">
              <i className="fas fa-lightbulb me-2"></i>
              AI-Enhanced Recommendations
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <div className="alert alert-primary border-0 mb-0">
                  <div className="d-flex align-items-start">
                    <i className="fas fa-brain text-primary me-3 mt-1"></i>
                    <div className="flex-grow-1">
                      <strong className="d-block mb-2">{stats.recommendation.primary}</strong>
                      <div className="row g-2 small">
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <i className="fas fa-chart-line text-info me-2"></i>
                            <span>{stats.recommendation.confidence}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <i className="fas fa-trending-up text-success me-2"></i>
                            <span>{stats.recommendation.trend}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Quality Score */}
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold">Data Quality</span>
            <span className="badge bg-primary">
              {stats.basic_stats?.total_logs || 0} cycles logged
            </span>
          </div>
          <div className="progress" style={{ height: '12px' }}>
            <div 
              className={`progress-bar ${
                (stats.basic_stats?.total_logs || 0) >= 12 ? 'bg-success' :
                (stats.basic_stats?.total_logs || 0) >= 6 ? 'bg-primary' :
                (stats.basic_stats?.total_logs || 0) >= 3 ? 'bg-warning' :
                'bg-danger'
              }`}
              style={{ width: `${Math.min(100, ((stats.basic_stats?.total_logs || 0) / 12) * 100)}%` }}
            >
              {Math.round(((stats.basic_stats?.total_logs || 0) / 12) * 100)}%
            </div>
          </div>
          <small className="text-muted d-block mt-2">
            {(stats.basic_stats?.total_logs || 0) < 6 
              ? `Log ${6 - (stats.basic_stats?.total_logs || 0)} more cycle(s) for basic accuracy`
              : (stats.basic_stats?.total_logs || 0) < 12
              ? `Log ${12 - (stats.basic_stats?.total_logs || 0)} more cycle(s) for maximum accuracy`
              : 'Maximum accuracy achieved! Keep logging to maintain precision'}
          </small>
        </div>
      </div>
    </div>
  );
}
