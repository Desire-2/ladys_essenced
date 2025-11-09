'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api/client';

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
  recommendation: string;
}

export default function CycleInsights({ userId }: CycleInsightsProps) {
  const [stats, setStats] = useState<CycleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.cycle.getStats(userId);
      setStats(response);
    } catch (err: any) {
      console.error('Failed to load cycle insights:', err);
      setError('Unable to load cycle insights');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading intelligent insights...</p>
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
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h6 className="mb-0">
              <i className="fas fa-crystal-ball me-2"></i>
              Intelligent Predictions
            </h6>
          </div>
          <div className="card-body">
            {stats.predictions.slice(0, 3).map((prediction, index) => (
              <div key={index} className={`prediction-item ${index < stats.predictions.length - 1 ? 'border-bottom pb-3 mb-3' : ''}`}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="mb-1">
                      <i className="fas fa-calendar-alt text-danger me-2"></i>
                      Period #{prediction.cycle_number}
                    </h6>
                    <div className="text-muted small">
                      {formatDate(prediction.predicted_start)} - {formatDate(prediction.predicted_end)}
                    </div>
                  </div>
                  {getConfidenceBadge(prediction.confidence)}
                </div>
                
                <div className="row g-2 small">
                  <div className="col-6">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-egg text-warning me-2"></i>
                      <div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Ovulation</div>
                        <div className="fw-bold">{formatDate(prediction.ovulation_date)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-chart-line text-info me-2"></i>
                      <div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Cycle Length</div>
                        <div className="fw-bold">{Math.round(prediction.predicted_cycle_length)} days</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {stats.basic_stats?.data_points < 6 && (
              <div className="alert alert-info mt-3 mb-0">
                <i className="fas fa-info-circle me-2"></i>
                <small>
                  <strong>Tip:</strong> {stats.recommendation}
                </small>
              </div>
            )}
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
                (stats.basic_stats?.total_logs || 0) >= 6 ? 'bg-success' :
                (stats.basic_stats?.total_logs || 0) >= 3 ? 'bg-warning' :
                'bg-danger'
              }`}
              style={{ width: `${Math.min(100, ((stats.basic_stats?.total_logs || 0) / 6) * 100)}%` }}
            >
              {Math.round(((stats.basic_stats?.total_logs || 0) / 6) * 100)}%
            </div>
          </div>
          <small className="text-muted d-block mt-2">
            {(stats.basic_stats?.total_logs || 0) < 6 
              ? `Log ${6 - (stats.basic_stats?.total_logs || 0)} more cycle(s) for best accuracy`
              : 'Excellent! Your predictions are highly accurate'}
          </small>
        </div>
      </div>
    </div>
  );
}
