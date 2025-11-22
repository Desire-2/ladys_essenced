import React, { useState } from 'react';
import CycleLogsManagement from './CycleLogsManagement';
import PeriodLogsManagement from './PeriodLogsManagement';

export const MenstrualHealthDashboard = () => {
  const [activeTab, setActiveTab] = useState<'cycles' | 'periods'>('cycles');

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-body text-white">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h1 className="mb-2">
                    <i className="fas fa-heart me-3"></i>
                    Menstrual Health Dashboard
                  </h1>
                  <p className="mb-0 fs-5 opacity-75">
                    Track your cycles, periods, and wellness patterns with detailed insights
                  </p>
                </div>
                <div className="col-md-4 text-end">
                  <div className="d-flex flex-column align-items-end">
                    <div className="badge bg-light text-dark fs-6 mb-2 px-3 py-2">
                      <i className="fas fa-calendar-check me-1"></i>
                      Comprehensive Tracking
                    </div>
                    <div className="badge bg-light text-dark fs-6 px-3 py-2">
                      <i className="fas fa-chart-line me-1"></i>
                      AI-Powered Insights
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <ul className="nav nav-pills nav-justified" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeTab === 'cycles' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cycles')}
                        type="button"
                        role="tab"
                      >
                        <i className="fas fa-calendar-alt me-2"></i>
                        <span className="d-none d-md-inline">Cycle Management</span>
                        <span className="d-md-none">Cycles</span>
                        <div className="small text-muted mt-1">
                          Track full menstrual cycles
                        </div>
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeTab === 'periods' ? 'active' : ''}`}
                        onClick={() => setActiveTab('periods')}
                        type="button"
                        role="tab"
                      >
                        <i className="fas fa-tint me-2"></i>
                        <span className="d-none d-md-inline">Period Tracking</span>
                        <span className="d-md-none">Periods</span>
                        <div className="small text-muted mt-1">
                          Daily period logs
                        </div>
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <div className="row text-center">
                    <div className="col-6">
                      <div className="border-start ps-3">
                        <div className="fw-bold text-primary">Cycle Tracking</div>
                        <small className="text-muted">
                          Full cycle overview with wellness metrics
                        </small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border-start ps-3">
                        <div className="fw-bold text-danger">Period Details</div>
                        <small className="text-muted">
                          Daily flow, pain, and symptom tracking
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-primary">
            <div className="card-body text-center">
              <i className="fas fa-calendar-check fa-2x text-primary mb-2"></i>
              <h6 className="card-title text-muted">Current Status</h6>
              <div className="h5 mb-0">
                <span className="badge bg-success">Tracking Active</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-info">
            <div className="card-body text-center">
              <i className="fas fa-chart-line fa-2x text-info mb-2"></i>
              <h6 className="card-title text-muted">Data Quality</h6>
              <div className="h5 mb-0 text-info">Excellent</div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-warning">
            <div className="card-body text-center">
              <i className="fas fa-brain fa-2x text-warning mb-2"></i>
              <h6 className="card-title text-muted">AI Insights</h6>
              <div className="h5 mb-0 text-warning">Available</div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-success">
            <div className="card-body text-center">
              <i className="fas fa-shield-alt fa-2x text-success mb-2"></i>
              <h6 className="card-title text-muted">Privacy</h6>
              <div className="h5 mb-0 text-success">Protected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-light">
            <div className="card-body">
              <h5 className="card-title mb-3">
                <i className="fas fa-star text-warning me-2"></i>
                Enhanced Tracking Features
              </h5>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-start">
                    <i className="fas fa-edit text-primary me-3 mt-1"></i>
                    <div>
                      <h6 className="mb-1">Edit & Delete</h6>
                      <small className="text-muted">
                        Comprehensive editing with quick edit options and safe deletion
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-start">
                    <i className="fas fa-heart-rate text-danger me-3 mt-1"></i>
                    <div>
                      <h6 className="mb-1">Wellness Tracking</h6>
                      <small className="text-muted">
                        Track mood, sleep, exercise, and overall wellness patterns
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-start">
                    <i className="fas fa-chart-pie text-info me-3 mt-1"></i>
                    <div>
                      <h6 className="mb-1">Analytics Engine</h6>
                      <small className="text-muted">
                        AI-powered insights and predictions based on your data
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-start">
                    <i className="fas fa-calendar-alt text-success me-3 mt-1"></i>
                    <div>
                      <h6 className="mb-1">Multiple Views</h6>
                      <small className="text-muted">
                        Table, card, and calendar views for different preferences
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-start">
                    <i className="fas fa-mobile-alt text-purple me-3 mt-1"></i>
                    <div>
                      <h6 className="mb-1">Mobile Optimized</h6>
                      <small className="text-muted">
                        Responsive design works perfectly on all devices
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="d-flex align-items-start">
                    <i className="fas fa-lock text-dark me-3 mt-1"></i>
                    <div>
                      <h6 className="mb-1">Privacy First</h6>
                      <small className="text-muted">
                        Your health data is encrypted and completely private
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'cycles' && (
          <div className="tab-pane fade show active">
            <CycleLogsManagement />
          </div>
        )}
        {activeTab === 'periods' && (
          <div className="tab-pane fade show active">
            <PeriodLogsManagement />
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="row mt-5">
        <div className="col-12">
          <div className="card border-info">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <i className="fas fa-question-circle me-2"></i>
                Need Help?
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-info">Getting Started</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <i className="fas fa-circle text-info me-2" style={{ fontSize: '6px' }}></i>
                      Use <strong>Cycle Management</strong> to track full menstrual cycles
                    </li>
                    <li className="mb-2">
                      <i className="fas fa-circle text-info me-2" style={{ fontSize: '6px' }}></i>
                      Use <strong>Period Tracking</strong> for detailed daily logs
                    </li>
                    <li className="mb-2">
                      <i className="fas fa-circle text-info me-2" style={{ fontSize: '6px' }}></i>
                      Both systems work together to provide comprehensive insights
                    </li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6 className="text-info">Features</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <i className="fas fa-circle text-info me-2" style={{ fontSize: '6px' }}></i>
                      <strong>Quick Edit:</strong> Fast inline editing for minor updates
                    </li>
                    <li className="mb-2">
                      <i className="fas fa-circle text-info me-2" style={{ fontSize: '6px' }}></i>
                      <strong>Full Edit:</strong> Complete form for detailed modifications
                    </li>
                    <li className="mb-2">
                      <i className="fas fa-circle text-info me-2" style={{ fontSize: '6px' }}></i>
                      <strong>Safe Delete:</strong> Confirmation dialogs prevent accidents
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenstrualHealthDashboard;