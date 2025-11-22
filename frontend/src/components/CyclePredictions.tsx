'use client';

import React, { useState, useEffect } from 'react';
import { cycleAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useChildAccess } from '../contexts/ChildAccessContext';

interface MLPrediction {
  cycle_number: number;
  predicted_start: string;
  predicted_end: string;
  ovulation_date: string;
  fertile_window_start: string;
  fertile_window_end: string;
  confidence: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  predicted_cycle_length: number;
  predicted_period_length: number;
  trend_adjustment: number;
  ml_enhanced_data: {
    total_cycles: number;
    outliers_detected: number;
    ml_patterns_detected: number;
    anomalies_detected: boolean;
    adaptive_learning_status: 'active' | 'learning' | 'inactive';
    pattern_confidence: string;
    seasonal_patterns: boolean;
    user_cycle_profile: {
      regularity_score?: number;
      trend_direction?: string;
      predictability_index?: number;
    };
    prediction_accuracy_trend: any;
    confidence_factors: {
      data_volume: boolean;
      ml_confidence: boolean;
      pattern_recognition: boolean;
      adaptive_learning: boolean;
      anomaly_free: boolean;
      trend_stability: boolean;
    };
    health_insights: {
      anomaly_risk: {
        level: string;
        description?: string;
      };
      pattern_health_score: {
        overall_score: number;
        status: string;
      };
      recommendations: string[];
    };
  };
}

interface PredictionsResponse {
  total_predictions: number;
  predictions: MLPrediction[];
  grouped_by_month: Record<string, MLPrediction[]>;
  confidence_note: string;
  planning_tips: string[];
}

interface CyclePredictionsProps {
  userId?: number;
  showMLInsights?: boolean;
  maxPredictions?: number;
}

export default function CyclePredictions({ 
  userId, 
  showMLInsights = true, 
  maxPredictions = 6 
}: CyclePredictionsProps) {
  const { user } = useAuth();
  const { accessedChild } = useChildAccess();
  const [predictions, setPredictions] = useState<PredictionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState(3); // months

  // Determine target user ID
  const targetUserId = userId || accessedChild?.user_id || user?.id;

  useEffect(() => {
    loadPredictions();
  }, [targetUserId, selectedTimeframe]);

  const loadPredictions = async () => {
    if (!targetUserId) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await cycleAPI.getPredictions(selectedTimeframe, targetUserId);
      setPredictions(response.data);
    } catch (err: any) {
      console.error('Failed to load ML predictions:', err);
      setError('Failed to load predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    const colors = {
      'very_high': '#28a745',
      'high': '#17a2b8', 
      'medium': '#ffc107',
      'low': '#fd7e14',
      'very_low': '#dc3545'
    };
    return colors[confidence as keyof typeof colors] || colors.medium;
  };

  const getConfidencePercentage = (confidence: string) => {
    const percentages = {
      'very_high': 90,
      'high': 75,
      'medium': 60,
      'low': 40,
      'very_low': 25
    };
    return percentages[confidence as keyof typeof percentages] || 50;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateLong = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-4">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading AI-powered predictions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
          <button 
            className="btn btn-primary" 
            onClick={loadPredictions}
          >
            <i className="fas fa-retry me-2"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!predictions || predictions.predictions.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="mb-4">
            <i className="fas fa-brain fa-4x text-muted mb-3"></i>
            <h5 className="text-muted">AI Learning in Progress</h5>
            <p className="text-muted">
              Start logging your cycles to unlock intelligent predictions powered by machine learning.
            </p>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <div className="text-center">
                <i className="fas fa-robot fa-2x text-primary mb-2"></i>
                <h6>Smart AI</h6>
                <small className="text-muted">Learns your unique patterns</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center">
                <i className="fas fa-chart-line fa-2x text-success mb-2"></i>
                <h6>Adaptive Learning</h6>
                <small className="text-muted">Improves with each cycle</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center">
                <i className="fas fa-shield-alt fa-2x text-info mb-2"></i>
                <h6>Anomaly Detection</h6>
                <small className="text-muted">Health alerts & insights</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const firstPrediction = predictions.predictions[0];
  const hasMLData = firstPrediction?.ml_enhanced_data;

  return (
    <div className="cycle-predictions">
      {/* Header with ML Status */}
      <div className="card mb-4">
        <div className="card-header bg-gradient-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fas fa-brain me-2"></i>
              AI-Powered Cycle Predictions
            </h5>
            <div className="d-flex gap-2">
              <select 
                className="form-select form-select-sm text-dark"
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(Number(e.target.value))}
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={9}>9 months</option>
                <option value={12}>12 months</option>
              </select>
            </div>
          </div>
        </div>
        
        {hasMLData && (
          <div className="card-body">
            <div className="row g-3">
              {/* ML Learning Status */}
              <div className="col-md-3">
                <div className="text-center">
                  <div className={`h4 mb-1 text-${
                    firstPrediction.ml_enhanced_data.adaptive_learning_status === 'active' ? 'success' :
                    firstPrediction.ml_enhanced_data.adaptive_learning_status === 'learning' ? 'warning' : 'secondary'
                  }`}>
                    <i className={`fas fa-${
                      firstPrediction.ml_enhanced_data.adaptive_learning_status === 'active' ? 'check-circle' :
                      firstPrediction.ml_enhanced_data.adaptive_learning_status === 'learning' ? 'cog fa-spin' : 'pause-circle'
                    }`}></i>
                  </div>
                  <h6 className="text-capitalize">{firstPrediction.ml_enhanced_data.adaptive_learning_status}</h6>
                  <small className="text-muted">ML Learning</small>
                </div>
              </div>
              
              {/* Pattern Detection */}
              <div className="col-md-3">
                <div className="text-center">
                  <div className="h4 mb-1 text-info">
                    {firstPrediction.ml_enhanced_data.ml_patterns_detected}
                  </div>
                  <h6>Patterns Detected</h6>
                  <small className="text-muted">Unique to you</small>
                </div>
              </div>
              
              {/* Data Quality */}
              <div className="col-md-3">
                <div className="text-center">
                  <div className="h4 mb-1 text-primary">
                    {firstPrediction.ml_enhanced_data.total_cycles}
                  </div>
                  <h6>Cycles Analyzed</h6>
                  <small className="text-muted">Training data</small>
                </div>
              </div>
              
              {/* Health Score */}
              <div className="col-md-3">
                <div className="text-center">
                  <div className={`h4 mb-1 text-${
                    firstPrediction.ml_enhanced_data.health_insights.pattern_health_score.status === 'excellent' ? 'success' :
                    firstPrediction.ml_enhanced_data.health_insights.pattern_health_score.status === 'good' ? 'primary' :
                    firstPrediction.ml_enhanced_data.health_insights.pattern_health_score.status === 'fair' ? 'warning' : 'danger'
                  }`}>
                    {Math.round(firstPrediction.ml_enhanced_data.health_insights.pattern_health_score.overall_score * 100)}%
                  </div>
                  <h6 className="text-capitalize">{firstPrediction.ml_enhanced_data.health_insights.pattern_health_score.status}</h6>
                  <small className="text-muted">Health Score</small>
                </div>
              </div>
            </div>
            
            {/* Anomaly Alert */}
            {firstPrediction.ml_enhanced_data.anomalies_detected && (
              <div className="alert alert-warning mt-3 mb-0">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Anomaly Detected:</strong> Irregular patterns found. Consider consulting a healthcare provider.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Predictions Grid */}
      <div className="row g-4">
        {predictions.predictions.slice(0, maxPredictions).map((prediction, index) => (
          <div key={index} className="col-md-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header border-0 bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <i className="fas fa-calendar-alt text-danger me-2"></i>
                    Cycle #{prediction.cycle_number}
                  </h6>
                  <span 
                    className="badge rounded-pill"
                    style={{ 
                      backgroundColor: getConfidenceColor(prediction.confidence),
                      color: 'white'
                    }}
                  >
                    {prediction.confidence.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="card-body">
                {/* Period Dates */}
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-tint text-danger me-2"></i>
                    <strong>Period Window</strong>
                  </div>
                  <div className="text-muted small">
                    {formatDateLong(prediction.predicted_start)}
                  </div>
                  <div className="text-muted small">
                    to {formatDateLong(prediction.predicted_end)}
                  </div>
                  <div className="text-primary small mt-1">
                    Duration: {prediction.predicted_period_length} days
                  </div>
                </div>

                {/* Ovulation & Fertility */}
                <div className="mb-3">
                  <div className="row g-2 small">
                    <div className="col-12">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-egg text-warning me-2"></i>
                        <div>
                          <div className="fw-bold">Ovulation</div>
                          <div className="text-muted">{formatDate(prediction.ovulation_date)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 mt-2">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-fire text-info me-2"></i>
                        <div>
                          <div className="fw-bold">Fertile Window</div>
                          <div className="text-muted">
                            {formatDate(prediction.fertile_window_start)} - {formatDate(prediction.fertile_window_end)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confidence Visualization */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted">Prediction Confidence</small>
                    <small className="text-muted">{getConfidencePercentage(prediction.confidence)}%</small>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar"
                      style={{ 
                        width: `${getConfidencePercentage(prediction.confidence)}%`,
                        backgroundColor: getConfidenceColor(prediction.confidence)
                      }}
                    ></div>
                  </div>
                </div>

                {/* ML Insights */}
                {showMLInsights && prediction.ml_enhanced_data && (
                  <div className="mt-3 pt-3 border-top">
                    <h6 className="text-muted mb-2">
                      <i className="fas fa-robot me-2"></i>
                      AI Insights
                    </h6>
                    <div className="row g-2 small">
                      {prediction.ml_enhanced_data.seasonal_patterns && (
                        <div className="col-12">
                          <span className="badge bg-success me-2">
                            <i className="fas fa-calendar-alt me-1"></i>
                            Seasonal Patterns Detected
                          </span>
                        </div>
                      )}
                      {prediction.ml_enhanced_data.user_cycle_profile.regularity_score && (
                        <div className="col-12">
                          <div className="text-muted">
                            <i className="fas fa-chart-line me-1"></i>
                            Regularity: {Math.round(prediction.ml_enhanced_data.user_cycle_profile.regularity_score * 100)}%
                          </div>
                        </div>
                      )}
                      {prediction.trend_adjustment !== 0 && (
                        <div className="col-12">
                          <div className="text-info">
                            <i className={`fas fa-arrow-${prediction.trend_adjustment > 0 ? 'up' : 'down'} me-1`}></i>
                            Trend Adjustment: {prediction.trend_adjustment > 0 ? '+' : ''}{prediction.trend_adjustment.toFixed(1)} days
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Confidence Factors Footer */}
              {showMLInsights && prediction.ml_enhanced_data && (
                <div className="card-footer bg-light border-0">
                  <div className="d-flex flex-wrap gap-1">
                    {Object.entries(prediction.ml_enhanced_data.confidence_factors).map(([factor, isActive]) => (
                      <span 
                        key={factor}
                        className={`badge badge-sm ${isActive ? 'bg-success' : 'bg-light text-dark'}`}
                        title={factor.replace('_', ' ')}
                      >
                        <i className={`fas fa-${isActive ? 'check' : 'times'} me-1`}></i>
                        {factor.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Planning Tips & Recommendations */}
      {predictions.planning_tips && predictions.planning_tips.length > 0 && (
        <div className="card mt-4">
          <div className="card-header bg-info text-white">
            <h6 className="mb-0">
              <i className="fas fa-lightbulb me-2"></i>
              Smart Planning Tips
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {predictions.planning_tips.map((tip, index) => (
                <div key={index} className="col-md-6">
                  <div className="d-flex align-items-start">
                    <i className="fas fa-check-circle text-success me-3 mt-1"></i>
                    <span>{tip}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ML Health Recommendations */}
      {hasMLData && firstPrediction.ml_enhanced_data.health_insights.recommendations.length > 0 && (
        <div className="card mt-4">
          <div className="card-header bg-warning text-dark">
            <h6 className="mb-0">
              <i className="fas fa-heartbeat me-2"></i>
              Personalized Health Recommendations
            </h6>
          </div>
          <div className="card-body">
            {firstPrediction.ml_enhanced_data.health_insights.recommendations.map((recommendation, index) => (
              <div key={index} className="alert alert-info d-flex align-items-start mb-2">
                <i className="fas fa-brain text-primary me-3 mt-1"></i>
                <span>{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Note */}
      <div className="alert alert-info mt-4">
        <i className="fas fa-info-circle me-2"></i>
        <strong>Note:</strong> {predictions.confidence_note}
      </div>
    </div>
  );
}