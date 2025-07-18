'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { analyticsService, DashboardAnalytics, HealthProviderAnalytics } from '../services/analytics';

interface EnhancedAnalyticsProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  showHealthProviders?: boolean;
  compactView?: boolean;
}

export default function EnhancedAnalytics({ 
  timeRange = '30d', 
  showHealthProviders = true,
  compactView = false 
}: EnhancedAnalyticsProps) {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [providerAnalytics, setProviderAnalytics] = useState<HealthProviderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'cycle' | 'appointments' | 'health'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<string>('mood');

  const analyticsServiceInstance = analyticsService;

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [dashboardData, providerData] = await Promise.all([
        analyticsServiceInstance.getDashboardAnalytics(), // No timeRange parameter needed
        showHealthProviders ? analyticsServiceInstance.getHealthProviderAnalytics() : Promise.resolve(null)
      ]);
      
      setAnalytics(dashboardData);
      setProviderAnalytics(providerData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = {
    primary: '#0d6efd',
    success: '#198754',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#0dcaf0',
    pink: '#d63384',
    purple: '#6f42c1',
    indigo: '#6610f2',
    teal: '#20c997',
    orange: '#fd7e14'
  };

  const chartColors = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.info, COLORS.pink];

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading analytics...</span>
        </div>
        <p className="mt-3 text-muted">Loading your health insights...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="alert alert-warning">
        <i className="fas fa-exclamation-triangle me-2"></i>
        Unable to load analytics data. Please try again later.
      </div>
    );
  }

  const renderMetricCard = (title: string, value: string | number, icon: string, color: string, change?: string) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card h-100 border-0 shadow-sm"
    >
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h6 className="card-title text-muted mb-1">{title}</h6>
            <h3 className="mb-0">{value}</h3>
            {change && (
              <small className={`${change.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                <i className={`fas ${change.startsWith('+') ? 'fa-arrow-up' : 'fa-arrow-down'} me-1`}></i>
                {change}
              </small>
            )}
          </div>
          <div className={`rounded-circle d-flex align-items-center justify-content-center`} 
               style={{ width: '60px', height: '60px', backgroundColor: `${color}20`, color: color }}>
            <i className={`${icon} fa-lg`}></i>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderCycleInsights = () => (
    <div className="row g-4">
      <div className="col-md-8">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent border-0">
            <h5 className="mb-0">
              <i className="fas fa-venus text-pink me-2"></i>
              Cycle Tracking Trends
            </h5>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.chartData.cycleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6c757d" />
                <YAxis stroke="#6c757d" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #dee2e6', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
                <Area type="monotone" dataKey="mood" stackId="1" stroke={COLORS.pink} fill={`${COLORS.pink}80`} name="Mood Score" />
                <Area type="monotone" dataKey="flow" stackId="1" stroke={COLORS.danger} fill={`${COLORS.danger}80`} name="Flow Level" />
                <Area type="monotone" dataKey="cycleDay" stackId="1" stroke={COLORS.info} fill={`${COLORS.info}80`} name="Cycle Day" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="col-md-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-header bg-transparent border-0">
            <h6 className="mb-0">Cycle Health Score</h6>
          </div>
          <div className="card-body">
            <div className="text-center">
              <div className="mb-3">
                <div className="progress-circle mx-auto" style={{ width: '120px', height: '120px', position: 'relative' }}>
                  <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#e9ecef"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={COLORS.pink}
                      strokeWidth="8"
                      strokeDasharray={`${(analytics.cycleHealth.score / 100) * 314} 314`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <h3 className="mb-0">{analytics.cycleHealth.score}%</h3>
                  </div>
                </div>
              </div>
              <h6 className="text-muted">Overall Health</h6>
              <p className="small text-muted">
                {analytics.cycleHealth.insights.join('. ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppointmentStats = () => (
    <div className="row g-4">
      <div className="col-lg-8">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent border-0">
            <h5 className="mb-0">
              <i className="fas fa-calendar-check text-primary me-2"></i>
              Appointment Statistics
            </h5>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.chartData.appointmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6c757d" />
                <YAxis stroke="#6c757d" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #dee2e6', 
                    borderRadius: '8px' 
                  }} 
                />
                <Legend />
                <Bar dataKey="appointments" fill={COLORS.primary} name="Scheduled" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill={COLORS.success} name="Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="row g-3">
          {renderMetricCard('Overall Health', `${analytics.overallHealth.score}%`, 'fas fa-heartbeat', COLORS.success, `${analytics.overallHealth.trend === 'up' ? '+' : analytics.overallHealth.trend === 'down' ? '-' : ''}5%`)}
          {renderMetricCard('Cycle Health', `${analytics.cycleHealth.score}%`, 'fas fa-venus', COLORS.pink, `${analytics.cycleHealth.trend === 'up' ? '+' : analytics.cycleHealth.trend === 'down' ? '-' : ''}3%`)}
          {renderMetricCard('Mental Health', `${analytics.mentalHealth.score}%`, 'fas fa-brain', COLORS.info, `${analytics.mentalHealth.trend === 'up' ? '+' : analytics.mentalHealth.trend === 'down' ? '-' : ''}2%`)}
        </div>
      </div>
    </div>
  );

  const renderHealthMetrics = () => (
    <div className="row g-4">
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent border-0">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-heartbeat text-danger me-2"></i>
                Health Metrics Trends
              </h5>
              <div className="btn-group btn-group-sm">
                {['nutrition', 'cycle', 'mental', 'overall'].map((metric) => (
                  <button
                    key={metric}
                    className={`btn ${selectedMetric === metric ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedMetric(metric)}
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analytics.chartData.nutritionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6c757d" />
                <YAxis stroke="#6c757d" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #dee2e6', 
                    borderRadius: '8px' 
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric === 'nutrition' ? 'nutrition' : 'calories'} 
                  stroke={chartColors[0]} 
                  strokeWidth={3}
                  dot={{ fill: chartColors[0], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="row g-3">
          {renderMetricCard('Overall Health', `${analytics.overallHealth.score}%`, 'fas fa-star', COLORS.success, `${analytics.overallHealth.trend === 'up' ? '+' : analytics.overallHealth.trend === 'down' ? '-' : ''}8%`)}
          {renderMetricCard('Cycle Health', `${analytics.cycleHealth.score}%`, 'fas fa-venus', COLORS.pink, `${analytics.cycleHealth.trend === 'up' ? '+' : analytics.cycleHealth.trend === 'down' ? '-' : ''}3%`)}
          {renderMetricCard('Nutrition Score', `${analytics.nutritionHealth.score}%`, 'fas fa-apple-alt', COLORS.warning, `${analytics.nutritionHealth.trend === 'up' ? '+' : analytics.nutritionHealth.trend === 'down' ? '-' : ''}5%`)}
          {renderMetricCard('Mental Health', `${analytics.mentalHealth.score}%`, 'fas fa-brain', COLORS.info, `${analytics.mentalHealth.trend === 'up' ? '+' : analytics.mentalHealth.trend === 'down' ? '-' : ''}2%`)}
        </div>
      </div>
    </div>
  );

  const renderProviderAnalytics = () => {
    if (!providerAnalytics) return null;

    return (
      <div className="row g-4 mt-4">
        <div className="col-12">
          <h5 className="mb-4">
            <i className="fas fa-user-md text-info me-2"></i>
            Health Provider Analytics
          </h5>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0">
              <h6 className="mb-0">Provider Satisfaction Trends</h6>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={providerAnalytics.trends.patientSatisfaction}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6c757d" />
                  <YAxis stroke="#6c757d" />
                  <Tooltip />
                  <Area type="monotone" dataKey="rating" stroke={COLORS.success} fill={`${COLORS.success}40`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="row g-3">
            {renderMetricCard('Avg Rating', providerAnalytics.stats.averageRating.toFixed(1), 'fas fa-star', COLORS.warning)}
            {renderMetricCard('Total Appointments', providerAnalytics.stats.totalAppointments, 'fas fa-calendar-check', COLORS.primary)}
            {renderMetricCard('Completion Rate', `${Math.round((providerAnalytics.stats.completedAppointments / providerAnalytics.stats.totalAppointments) * 100)}%`, 'fas fa-check-circle', COLORS.success)}
          </div>
        </div>
      </div>
    );
  };

  if (compactView) {
    return (
      <div className="row g-3">
        {renderMetricCard('Overall Health', `${analytics.overallHealth.score}%`, 'fas fa-heartbeat', COLORS.success)}
        {renderMetricCard('Cycle Health', `${analytics.cycleHealth.score}%`, 'fas fa-venus', COLORS.pink)}
        {renderMetricCard('Nutrition Score', `${analytics.nutritionHealth.score}%`, 'fas fa-apple-alt', COLORS.warning)}
        {renderMetricCard('Mental Health', `${analytics.mentalHealth.score}%`, 'fas fa-brain', COLORS.info)}
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Time Range Selector */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="fas fa-chart-line text-primary me-2"></i>
              Health Analytics Dashboard
            </h4>
            <div className="btn-group">
              {['7d', '30d', '90d', '1y'].map((range) => (
                <input
                  key={range}
                  type="radio"
                  className="btn-check"
                  name="timeRange"
                  id={`range-${range}`}
                  checked={timeRange === range}
                  onChange={() => {}}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-pills nav-fill">
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
                className={`nav-link ${activeTab === 'cycle' ? 'active' : ''}`}
                onClick={() => setActiveTab('cycle')}
              >
                <i className="fas fa-venus me-2"></i>
                Cycle Insights
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`}
                onClick={() => setActiveTab('appointments')}
              >
                <i className="fas fa-calendar-check me-2"></i>
                Appointments
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'health' ? 'active' : ''}`}
                onClick={() => setActiveTab('health')}
              >
                <i className="fas fa-heartbeat me-2"></i>
                Health Metrics
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="row g-4">
              {renderMetricCard('Overall Health', `${analytics.overallHealth.score}%`, 'fas fa-heartbeat', COLORS.success, `${analytics.overallHealth.trend === 'up' ? '+' : analytics.overallHealth.trend === 'down' ? '-' : ''}8%`)}
              {renderMetricCard('Cycle Health', `${analytics.cycleHealth.score}%`, 'fas fa-venus', COLORS.pink, `${analytics.cycleHealth.trend === 'up' ? '+' : analytics.cycleHealth.trend === 'down' ? '-' : ''}3%`)}
              {renderMetricCard('Nutrition Score', `${analytics.nutritionHealth.score}%`, 'fas fa-apple-alt', COLORS.warning, `${analytics.nutritionHealth.trend === 'up' ? '+' : analytics.nutritionHealth.trend === 'down' ? '-' : ''}5%`)}
              {renderMetricCard('Mental Health', `${analytics.mentalHealth.score}%`, 'fas fa-brain', COLORS.info, `${analytics.mentalHealth.trend === 'up' ? '+' : analytics.mentalHealth.trend === 'down' ? '-' : ''}2%`)}
            </div>
          )}
          
          {activeTab === 'cycle' && renderCycleInsights()}
          {activeTab === 'appointments' && renderAppointmentStats()}
          {activeTab === 'health' && renderHealthMetrics()}
        </motion.div>
      </AnimatePresence>

      {/* Provider Analytics */}
      {showHealthProviders && renderProviderAnalytics()}
    </div>
  );
}
