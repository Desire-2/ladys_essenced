'use client';

import React, { useState, useEffect } from 'react';
import { cycleAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useChildAccess } from '../contexts/ChildAccessContext';

interface MLInsightsDashboardProps {
  userId?: number;
  showAdvanced?: boolean;
}

interface PatternAnalysis {
  patterns_detected: number;
  pattern_types: string[];
  confidence: string;
  learning_status: 'active' | 'learning' | 'inactive';
  user_profile: {
    regularity_score: number;
    predictability_index: number;
    trend_direction: 'stable' | 'lengthening' | 'shortening';
    cycle_signature: string[];
  };
}

interface AdaptiveLearning {
  accuracy_history: number[];
  improvement_trend: 'improving' | 'stable' | 'declining';
  learning_efficiency: number;
  prediction_feedback: {
    total_predictions: number;
    accurate_predictions: number;
    accuracy_rate: number;
  };
  next_optimization_cycle: number;
}

interface AnomalyDetection {
  anomalies_found: boolean;
  anomaly_types: string[];
  risk_assessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    confidence: number;
  };
  health_alerts: Array<{
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'danger';
    timestamp: string;
  }>;
}

interface MLDashboardData {
  pattern_analysis: PatternAnalysis;
  adaptive_learning: AdaptiveLearning;
  anomaly_detection: AnomalyDetection;
  confidence_metrics: {
    overall_confidence: number;
    data_quality_score: number;
    prediction_reliability: number;
    learning_progress: number;
  };
  personalization_insights: {
    unique_patterns: string[];
    recommendations: Array<{
      category: string;
      message: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    lifestyle_correlations: Record<string, number>;
  };
}

export default function MLInsightsDashboard({ userId, showAdvanced = true }: MLInsightsDashboardProps) {
  const { user } = useAuth();
  const { accessedChild } = useChildAccess();
  const [mlData, setMLData] = useState<MLDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Determine target user ID
  const targetUserId = userId || accessedChild?.user_id || user?.id;

  useEffect(() => {
    loadMLData();
  }, [targetUserId]);

  const loadMLData = async () => {
    if (!targetUserId) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Load all ML data in parallel
      const [
        patternResponse,
        adaptiveResponse,
        anomalyResponse,
        confidenceResponse
      ] = await Promise.all([
        cycleAPI.getPatternAnalysis(targetUserId),
        cycleAPI.getAdaptiveLearningStatus(targetUserId),
        cycleAPI.getAnomalyDetection(targetUserId),
        cycleAPI.getConfidenceMetrics(targetUserId)
      ]);

      setMLData({
        pattern_analysis: patternResponse.data,
        adaptive_learning: adaptiveResponse.data,
        anomaly_detection: anomalyResponse.data,
        confidence_metrics: confidenceResponse.data,
        personalization_insights: {
          unique_patterns: patternResponse.data.user_profile.cycle_signature || [],
          recommendations: anomalyResponse.data.health_alerts || [],
          lifestyle_correlations: {}
        }
      });
    } catch (err: any) {
      console.error('Failed to load ML dashboard data:', err);
      setError('Failed to load AI insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'primary';
    if (score >= 0.4) return 'warning';
    return 'danger';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      active: 'check-circle',
      learning: 'cog fa-spin',
      inactive: 'pause-circle',
      improving: 'arrow-trend-up',
      stable: 'minus',
      declining: 'arrow-trend-down'
    };
    return icons[status as keyof typeof icons] || 'question-circle';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading AI insights dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !mlData) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error || 'No AI insights available yet. Continue logging to unlock ML features.'}
          </div>
          <button className="btn btn-primary" onClick={loadMLData}>
            <i className="fas fa-retry me-2"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-insights-dashboard">
      {/* Dashboard Header */}
      <div className="card mb-4 bg-gradient-primary text-white">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col">
              <h4 className="mb-1">
                <i className="fas fa-brain me-3"></i>
                AI Insights Dashboard
              </h4>
              <p className="mb-0">
                Machine learning analysis of your menstrual cycle patterns
              </p>
            </div>
            <div className="col-auto">
              <div className="text-end">
                <div className="h3 mb-0">{Math.round(mlData.confidence_metrics.overall_confidence * 100)}%</div>
                <small>Overall AI Confidence</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card mb-4">
        <div className="card-header border-0">
          <ul className="nav nav-tabs card-header-tabs" role="tablist">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <i className="fas fa-tachometer-alt me-2"></i>
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'patterns' ? 'active' : ''}`}
                onClick={() => setActiveTab('patterns')}
              >
                <i className="fas fa-chart-line me-2"></i>
                Pattern Analysis
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'learning' ? 'active' : ''}`}
                onClick={() => setActiveTab('learning')}
              >
                <i className="fas fa-robot me-2"></i>
                Adaptive Learning
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'health' ? 'active' : ''}`}
                onClick={() => setActiveTab('health')}
              >
                <i className="fas fa-heartbeat me-2"></i>
                Health Monitoring
              </button>
            </li>
          </ul>
        </div>
        
        <div className="card-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="row g-4">
              {/* Confidence Metrics */}
              <div className="col-md-6 col-lg-3">
                <div className="text-center p-3 bg-light rounded">
                  <div className={`h3 mb-2 text-${getScoreColor(mlData.confidence_metrics.data_quality_score)}`}>
                    {Math.round(mlData.confidence_metrics.data_quality_score * 100)}%
                  </div>
                  <h6>Data Quality</h6>
                  <small className="text-muted">Input data reliability</small>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="text-center p-3 bg-light rounded">
                  <div className={`h3 mb-2 text-${getScoreColor(mlData.confidence_metrics.prediction_reliability)}`}>
                    {Math.round(mlData.confidence_metrics.prediction_reliability * 100)}%
                  </div>
                  <h6>Prediction Accuracy</h6>
                  <small className="text-muted">ML model performance</small>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="text-center p-3 bg-light rounded">
                  <div className={`h3 mb-2 text-${getScoreColor(mlData.confidence_metrics.learning_progress)}`}>
                    {Math.round(mlData.confidence_metrics.learning_progress * 100)}%
                  </div>
                  <h6>Learning Progress</h6>
                  <small className="text-muted">AI optimization level</small>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="text-center p-3 bg-light rounded">
                  <div className="h3 mb-2 text-info">
                    {mlData.pattern_analysis.patterns_detected}
                  </div>
                  <h6>Patterns Found</h6>
                  <small className="text-muted">Unique to you</small>
                </div>
              </div>

              {/* Learning Status Overview */}
              <div className="col-12">
                <div className="card bg-light">
                  <div className="card-body">
                    <h6 className="mb-3">
                      <i className="fas fa-cogs me-2"></i>
                      Machine Learning Status
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="d-flex align-items-center">
                          <i className={`fas fa-${getStatusIcon(mlData.pattern_analysis.learning_status)} text-${
                            mlData.pattern_analysis.learning_status === 'active' ? 'success' : 
                            mlData.pattern_analysis.learning_status === 'learning' ? 'warning' : 'secondary'
                          } me-3`}></i>
                          <div>
                            <div className="fw-bold text-capitalize">{mlData.pattern_analysis.learning_status}</div>
                            <small className="text-muted">Learning Status</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="d-flex align-items-center">
                          <i className={`fas fa-${getStatusIcon(mlData.adaptive_learning.improvement_trend)} text-${
                            mlData.adaptive_learning.improvement_trend === 'improving' ? 'success' : 
                            mlData.adaptive_learning.improvement_trend === 'stable' ? 'primary' : 'warning'
                          } me-3`}></i>
                          <div>
                            <div className="fw-bold text-capitalize">{mlData.adaptive_learning.improvement_trend}</div>
                            <small className="text-muted">Accuracy Trend</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-percentage text-info me-3"></i>
                          <div>
                            <div className="fw-bold">{Math.round(mlData.adaptive_learning.learning_efficiency * 100)}%</div>
                            <small className="text-muted">Learning Efficiency</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pattern Analysis Tab */}
          {activeTab === 'patterns' && (
            <div className="row g-4">
              <div className="col-md-8">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="fas fa-chart-line me-2"></i>
                      Detected Patterns
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      {mlData.pattern_analysis.pattern_types.map((pattern, index) => (
                        <div key={index} className="col-md-6">
                          <div className="d-flex align-items-center p-3 bg-light rounded">
                            <i className="fas fa-check-circle text-success me-3"></i>
                            <div>
                              <div className="fw-bold text-capitalize">{pattern.replace('_', ' ')}</div>
                              <small className="text-muted">Pattern detected</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="fas fa-user me-2"></i>
                      Your Cycle Profile
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small>Regularity Score</small>
                        <small>{Math.round(mlData.pattern_analysis.user_profile.regularity_score * 100)}%</small>
                      </div>
                      <div className="progress">
                        <div 
                          className={`progress-bar bg-${getScoreColor(mlData.pattern_analysis.user_profile.regularity_score)}`}
                          style={{ width: `${mlData.pattern_analysis.user_profile.regularity_score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small>Predictability</small>
                        <small>{Math.round(mlData.pattern_analysis.user_profile.predictability_index)}%</small>
                      </div>
                      <div className="progress">
                        <div 
                          className={`progress-bar bg-${getScoreColor(mlData.pattern_analysis.user_profile.predictability_index / 100)}`}
                          style={{ width: `${mlData.pattern_analysis.user_profile.predictability_index}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className={`badge bg-${
                        mlData.pattern_analysis.user_profile.trend_direction === 'stable' ? 'success' :
                        mlData.pattern_analysis.user_profile.trend_direction === 'lengthening' ? 'info' : 'warning'
                      }`}>
                        Trend: {mlData.pattern_analysis.user_profile.trend_direction}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Adaptive Learning Tab */}
          {activeTab === 'learning' && (
            <div className="row g-4">
              <div className="col-md-8">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="fas fa-chart-area me-2"></i>
                      Learning Progress
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3 mb-4">
                      <div className="col-md-4">
                        <div className="text-center p-3 bg-light rounded">
                          <div className="h4 mb-1 text-primary">
                            {mlData.adaptive_learning.prediction_feedback.total_predictions}
                          </div>
                          <h6>Total Predictions</h6>
                          <small className="text-muted">Made by AI</small>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="text-center p-3 bg-light rounded">
                          <div className="h4 mb-1 text-success">
                            {mlData.adaptive_learning.prediction_feedback.accurate_predictions}
                          </div>
                          <h6>Accurate</h6>
                          <small className="text-muted">Correct predictions</small>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="text-center p-3 bg-light rounded">
                          <div className={`h4 mb-1 text-${getScoreColor(mlData.adaptive_learning.prediction_feedback.accuracy_rate)}`}>
                            {Math.round(mlData.adaptive_learning.prediction_feedback.accuracy_rate * 100)}%
                          </div>
                          <h6>Accuracy Rate</h6>
                          <small className="text-muted">Overall performance</small>
                        </div>
                      </div>
                    </div>
                    <div className="alert alert-info">
                      <i className="fas fa-lightbulb me-2"></i>
                      <strong>Next optimization in {mlData.adaptive_learning.next_optimization_cycle} cycles.</strong> 
                      The AI will fine-tune its algorithms based on your recent data.
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="fas fa-brain me-2"></i>
                      AI Performance
                    </h6>
                  </div>
                  <div className="card-body">
                    {mlData.adaptive_learning.accuracy_history.length > 0 && (
                      <div className="mb-3">
                        <small className="text-muted">Recent Accuracy Trend</small>
                        <div className="mt-2">
                          {mlData.adaptive_learning.accuracy_history.slice(-5).map((accuracy, index) => (
                            <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                              <span className="small">Cycle {index + 1}</span>
                              <span className={`badge bg-${getScoreColor(accuracy)}`}>
                                {Math.round(accuracy * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className={`h5 text-${
                        mlData.adaptive_learning.improvement_trend === 'improving' ? 'success' :
                        mlData.adaptive_learning.improvement_trend === 'stable' ? 'primary' : 'warning'
                      }`}>
                        <i className={`fas fa-arrow-${
                          mlData.adaptive_learning.improvement_trend === 'improving' ? 'up' :
                          mlData.adaptive_learning.improvement_trend === 'stable' ? 'right' : 'down'
                        } me-2`}></i>
                        {mlData.adaptive_learning.improvement_trend}
                      </div>
                      <small className="text-muted">Performance Trend</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Health Monitoring Tab */}
          {activeTab === 'health' && (
            <div className="row g-4">
              <div className="col-md-8">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="fas fa-shield-alt me-2"></i>
                      Anomaly Detection
                    </h6>
                  </div>
                  <div className="card-body">
                    {mlData.anomaly_detection.anomalies_found ? (
                      <div>
                        <div className={`alert alert-${
                          mlData.anomaly_detection.risk_assessment.level === 'high' ? 'danger' :
                          mlData.anomaly_detection.risk_assessment.level === 'medium' ? 'warning' : 'info'
                        }`}>
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          <strong>Anomalies detected</strong> - {mlData.anomaly_detection.risk_assessment.level} risk level
                          <div className="mt-2">
                            <small>Confidence: {Math.round(mlData.anomaly_detection.risk_assessment.confidence * 100)}%</small>
                          </div>
                        </div>
                        <div className="row g-2">
                          {mlData.anomaly_detection.anomaly_types.map((type, index) => (
                            <div key={index} className="col-md-6">
                              <div className="p-2 bg-light rounded">
                                <i className="fas fa-exclamation-circle text-warning me-2"></i>
                                <span className="text-capitalize">{type.replace('_', ' ')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                        <h6>No Anomalies Detected</h6>
                        <p className="text-muted">Your cycle patterns appear normal and healthy.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Health Alerts */}
                {mlData.anomaly_detection.health_alerts.length > 0 && (
                  <div className="card mt-4">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <i className="fas fa-bell me-2"></i>
                        Health Alerts
                      </h6>
                    </div>
                    <div className="card-body">
                      {mlData.anomaly_detection.health_alerts.map((alert, index) => (
                        <div key={index} className={`alert alert-${alert.severity} mb-2`}>
                          <div className="d-flex align-items-start">
                            <i className={`fas fa-${
                              alert.severity === 'danger' ? 'exclamation-triangle' :
                              alert.severity === 'warning' ? 'exclamation-circle' : 'info-circle'
                            } me-3 mt-1`}></i>
                            <div className="flex-grow-1">
                              <strong className="text-capitalize">{alert.type}</strong>
                              <div>{alert.message}</div>
                              <small className="text-muted">
                                {new Date(alert.timestamp).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="col-md-4">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="fas fa-lightbulb me-2"></i>
                      AI Recommendations
                    </h6>
                  </div>
                  <div className="card-body">
                    {mlData.personalization_insights.recommendations.length > 0 ? (
                      mlData.personalization_insights.recommendations.map((rec, index) => (
                        <div key={index} className={`alert alert-${
                          rec.priority === 'high' ? 'warning' :
                          rec.priority === 'medium' ? 'info' : 'light'
                        } mb-2`}>
                          <div className="d-flex align-items-start">
                            <i className={`fas fa-${
                              rec.priority === 'high' ? 'exclamation-circle' :
                              rec.priority === 'medium' ? 'info-circle' : 'lightbulb'
                            } me-2 mt-1`}></i>
                            <div>
                              <strong className="text-capitalize">{rec.category}</strong>
                              <div className="small">{rec.message}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-3 text-muted">
                        <i className="fas fa-check-circle me-2"></i>
                        No specific recommendations at this time.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}