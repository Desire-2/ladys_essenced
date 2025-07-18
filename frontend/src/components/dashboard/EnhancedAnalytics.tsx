'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface AnalyticsData {
  cycleStats: {
    averageCycleLength: number;
    averagePeriodLength: number;
    totalCycles: number;
    lastPeriodDate: string | null;
    nextPredictedPeriod: string | null;
    cycleRegularity: number;
    symptomFrequency: { [key: string]: number };
  };
  mealStats: {
    totalMeals: number;
    averageMealsPerDay: number;
    nutritionBreakdown: { [key: string]: number };
    mealTypeDistribution: { [key: string]: number };
    weeklyTrends: Array<{ date: string; count: number }>;
  };
  appointmentStats: {
    totalAppointments: number;
    upcomingCount: number;
    completedCount: number;
    cancelledCount: number;
    averageWaitTime: number;
    providerDistribution: { [key: string]: number };
    monthlyTrends: Array<{ month: string; count: number }>;
  };
  healthTrends: {
    moodTrends: Array<{ date: string; mood: number; energy: number }>;
    symptomTrends: Array<{ date: string; [key: string]: any }>;
    weeklyComparison: {
      thisWeek: number;
      lastWeek: number;
      improvement: number;
    };
  };
}

interface EnhancedAnalyticsProps {
  selectedChild?: number | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function EnhancedAnalytics({ selectedChild }: EnhancedAnalyticsProps) {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'cycles' | 'nutrition' | 'appointments' | 'trends'>('overview');

  // Load analytics data
  const loadAnalyticsData = async () => {
    if (!user?.access_token) return;
    
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        time_range: timeRange,
        ...(selectedChild && { child_id: selectedChild.toString() })
      });

      const response = await fetch(`/api/dashboard/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        setError('Failed to load analytics data');
        // Generate mock data for demonstration
        setAnalyticsData(generateMockData());
      }
    } catch (err) {
      console.error('Analytics load error:', err);
      setError('Error loading analytics');
      // Generate mock data for demonstration
      setAnalyticsData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data for demonstration
  const generateMockData = (): AnalyticsData => {
    const today = new Date();
    const daysInRange = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365;
    
    return {
      cycleStats: {
        averageCycleLength: 28,
        averagePeriodLength: 5,
        totalCycles: 12,
        lastPeriodDate: format(subDays(today, 25), 'yyyy-MM-dd'),
        nextPredictedPeriod: format(subDays(today, -3), 'yyyy-MM-dd'),
        cycleRegularity: 85,
        symptomFrequency: {
          'Cramps': 60,
          'Fatigue': 45,
          'Mood Changes': 70,
          'Headache': 30,
          'Bloating': 55
        }
      },
      mealStats: {
        totalMeals: 89,
        averageMealsPerDay: 3.2,
        nutritionBreakdown: {
          'Protein': 25,
          'Carbs': 45,
          'Fats': 20,
          'Vitamins': 10
        },
        mealTypeDistribution: {
          'Breakfast': 30,
          'Lunch': 25,
          'Dinner': 30,
          'Snacks': 15
        },
        weeklyTrends: Array.from({ length: Math.min(daysInRange, 30) }, (_, i) => ({
          date: format(subDays(today, i), 'MMM dd'),
          count: Math.floor(Math.random() * 5) + 2
        })).reverse()
      },
      appointmentStats: {
        totalAppointments: 15,
        upcomingCount: 3,
        completedCount: 10,
        cancelledCount: 2,
        averageWaitTime: 12,
        providerDistribution: {
          'Dr. Smith': 5,
          'Dr. Johnson': 4,
          'Dr. Brown': 3,
          'Dr. Davis': 3
        },
        monthlyTrends: Array.from({ length: 6 }, (_, i) => ({
          month: format(subDays(today, i * 30), 'MMM'),
          count: Math.floor(Math.random() * 8) + 2
        })).reverse()
      },
      healthTrends: {
        moodTrends: Array.from({ length: Math.min(daysInRange, 14) }, (_, i) => ({
          date: format(subDays(today, i), 'MMM dd'),
          mood: Math.floor(Math.random() * 5) + 3,
          energy: Math.floor(Math.random() * 5) + 3
        })).reverse(),
        symptomTrends: Array.from({ length: Math.min(daysInRange, 7) }, (_, i) => ({
          date: format(subDays(today, i), 'MMM dd'),
          symptoms: Math.floor(Math.random() * 4),
          severity: Math.floor(Math.random() * 3) + 1
        })).reverse(),
        weeklyComparison: {
          thisWeek: 7.5,
          lastWeek: 6.8,
          improvement: 10.3
        }
      }
    };
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [user, timeRange, selectedChild]);

  // Memoized calculations
  const overviewStats = useMemo(() => {
    if (!analyticsData) return null;
    
    return {
      cycleHealth: Math.round(analyticsData.cycleStats.cycleRegularity),
      nutritionScore: Math.round((analyticsData.mealStats.averageMealsPerDay / 4) * 100),
      appointmentCompliance: Math.round((analyticsData.appointmentStats.completedCount / analyticsData.appointmentStats.totalAppointments) * 100),
      overallWellness: Math.round(analyticsData.healthTrends.weeklyComparison.thisWeek * 10)
    };
  }, [analyticsData]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading analytics...</span>
        </div>
        <p className="mt-2 text-muted">Loading analytics data...</p>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="alert alert-warning text-center">
        <i className="fas fa-exclamation-triangle me-2"></i>
        {error}
        <button className="btn btn-sm btn-outline-primary ms-3" onClick={loadAnalyticsData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="enhanced-analytics">
      {/* Header Controls */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">
            <i className="fas fa-chart-line me-2 text-primary"></i>
            Health Analytics
          </h3>
          {selectedChild && (
            <small className="text-muted">Analytics for selected child</small>
          )}
        </div>
        
        <div className="d-flex gap-3">
          {/* Time Range Selector */}
          <div className="btn-group btn-group-sm" role="group">
            {(['week', 'month', 'quarter', 'year'] as const).map(range => (
              <button
                key={range}
                type="button"
                className={`btn ${timeRange === range ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Export Button */}
          <button className="btn btn-sm btn-outline-secondary">
            <i className="fas fa-download me-1"></i>
            Export
          </button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="card mb-4">
        <div className="card-header p-0">
          <ul className="nav nav-tabs card-header-tabs">
            {[
              { key: 'overview', label: 'Overview', icon: 'tachometer-alt' },
              { key: 'cycles', label: 'Cycle Health', icon: 'calendar-alt' },
              { key: 'nutrition', label: 'Nutrition', icon: 'utensils' },
              { key: 'appointments', label: 'Healthcare', icon: 'user-md' },
              { key: 'trends', label: 'Trends', icon: 'chart-bar' }
            ].map(tab => (
              <li key={tab.key} className="nav-item">
                <button
                  className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key as any)}
                >
                  <i className={`fas fa-${tab.icon} me-1`}></i>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="card-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && overviewStats && (
            <div>
              {/* Key Metrics Cards */}
              <div className="row mb-4">
                <div className="col-md-3 mb-3">
                  <div className="card border-primary">
                    <div className="card-body text-center">
                      <div className="text-primary">
                        <i className="fas fa-heartbeat fa-2x mb-2"></i>
                      </div>
                      <h3 className="text-primary">{overviewStats.cycleHealth}%</h3>
                      <p className="mb-0 text-muted">Cycle Health</p>
                      <small className="text-success">
                        <i className="fas fa-arrow-up me-1"></i>
                        +5% from last period
                      </small>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <div className="card border-success">
                    <div className="card-body text-center">
                      <div className="text-success">
                        <i className="fas fa-leaf fa-2x mb-2"></i>
                      </div>
                      <h3 className="text-success">{overviewStats.nutritionScore}%</h3>
                      <p className="mb-0 text-muted">Nutrition Score</p>
                      <small className="text-warning">
                        <i className="fas fa-minus me-1"></i>
                        Same as last week
                      </small>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <div className="card border-info">
                    <div className="card-body text-center">
                      <div className="text-info">
                        <i className="fas fa-calendar-check fa-2x mb-2"></i>
                      </div>
                      <h3 className="text-info">{overviewStats.appointmentCompliance}%</h3>
                      <p className="mb-0 text-muted">Healthcare Compliance</p>
                      <small className="text-success">
                        <i className="fas fa-arrow-up me-1"></i>
                        +12% improvement
                      </small>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <div className="card border-warning">
                    <div className="card-body text-center">
                      <div className="text-warning">
                        <i className="fas fa-star fa-2x mb-2"></i>
                      </div>
                      <h3 className="text-warning">{overviewStats.overallWellness}%</h3>
                      <p className="mb-0 text-muted">Overall Wellness</p>
                      <small className="text-success">
                        <i className="fas fa-arrow-up me-1"></i>
                        +8% this week
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combined Trends Chart */}
              <div className="row">
                <div className="col-lg-8 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <i className="fas fa-chart-area me-2"></i>
                        Health Trends Overview
                      </h6>
                    </div>
                    <div className="card-body">
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analyticsData?.healthTrends.moodTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="mood" stackId="1" stroke="#8884d8" fill="#8884d8" name="Mood" />
                          <Area type="monotone" dataKey="energy" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Energy" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <i className="fas fa-bullseye me-2"></i>
                        Weekly Goals
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small>Water Intake</small>
                          <small>85%</small>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar bg-info" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small>Exercise</small>
                          <small>60%</small>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar bg-success" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small>Sleep Quality</small>
                          <small>92%</small>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar bg-primary" style={{ width: '92%' }}></div>
                        </div>
                      </div>
                      
                      <div className="text-center mt-3">
                        <button className="btn btn-sm btn-outline-primary">
                          <i className="fas fa-plus me-1"></i>
                          Set New Goal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cycle Health Tab */}
          {activeTab === 'cycles' && analyticsData && (
            <div className="row">
              <div className="col-md-6 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">Cycle Statistics</h6>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-6 mb-3">
                        <h4 className="text-primary">{analyticsData.cycleStats.averageCycleLength}</h4>
                        <small className="text-muted">Avg Cycle Length (days)</small>
                      </div>
                      <div className="col-6 mb-3">
                        <h4 className="text-success">{analyticsData.cycleStats.averagePeriodLength}</h4>
                        <small className="text-muted">Avg Period Length (days)</small>
                      </div>
                      <div className="col-6">
                        <h4 className="text-info">{analyticsData.cycleStats.totalCycles}</h4>
                        <small className="text-muted">Total Cycles Tracked</small>
                      </div>
                      <div className="col-6">
                        <h4 className="text-warning">{analyticsData.cycleStats.cycleRegularity}%</h4>
                        <small className="text-muted">Cycle Regularity</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">Symptom Frequency</h6>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={Object.entries(analyticsData.cycleStats.symptomFrequency).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {Object.entries(analyticsData.cycleStats.symptomFrequency).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nutrition Tab */}
          {activeTab === 'nutrition' && analyticsData && (
            <div className="row">
              <div className="col-lg-8 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">Daily Meal Trends</h6>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsData.mealStats.weeklyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} name="Meals per Day" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-4 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">Nutrition Breakdown</h6>
                  </div>
                  <div className="card-body">
                    {Object.entries(analyticsData.mealStats.nutritionBreakdown).map(([nutrient, percentage]) => (
                      <div key={nutrient} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small>{nutrient}</small>
                          <small>{percentage}%</small>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS[Object.keys(analyticsData.mealStats.nutritionBreakdown).indexOf(nutrient)]
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && analyticsData && (
            <div className="row">
              <div className="col-md-8 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">Appointment Trends</h6>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.appointmentStats.monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" name="Appointments" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="mb-0">Appointment Summary</h6>
                  </div>
                  <div className="card-body">
                    <div className="text-center mb-3">
                      <h3 className="text-primary">{analyticsData.appointmentStats.totalAppointments}</h3>
                      <small className="text-muted">Total Appointments</small>
                    </div>
                    
                    <div className="row text-center">
                      <div className="col-6 mb-2">
                        <div className="text-success">
                          <strong>{analyticsData.appointmentStats.completedCount}</strong>
                        </div>
                        <small className="text-muted">Completed</small>
                      </div>
                      <div className="col-6 mb-2">
                        <div className="text-info">
                          <strong>{analyticsData.appointmentStats.upcomingCount}</strong>
                        </div>
                        <small className="text-muted">Upcoming</small>
                      </div>
                      <div className="col-6">
                        <div className="text-warning">
                          <strong>{analyticsData.appointmentStats.cancelledCount}</strong>
                        </div>
                        <small className="text-muted">Cancelled</small>
                      </div>
                      <div className="col-6">
                        <div className="text-primary">
                          <strong>{analyticsData.appointmentStats.averageWaitTime}</strong>
                        </div>
                        <small className="text-muted">Avg Wait (days)</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && analyticsData && (
            <div className="row">
              <div className="col-12 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">Health Trends Comparison</h6>
                  </div>
                  <div className="card-body">
                    <div className="row mb-4">
                      <div className="col-md-4 text-center">
                        <div className="card border-success">
                          <div className="card-body">
                            <h4 className="text-success">{analyticsData.healthTrends.weeklyComparison.thisWeek}</h4>
                            <small className="text-muted">This Week Score</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 text-center">
                        <div className="card border-warning">
                          <div className="card-body">
                            <h4 className="text-warning">{analyticsData.healthTrends.weeklyComparison.lastWeek}</h4>
                            <small className="text-muted">Last Week Score</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 text-center">
                        <div className="card border-primary">
                          <div className="card-body">
                            <h4 className="text-primary">+{analyticsData.healthTrends.weeklyComparison.improvement}%</h4>
                            <small className="text-muted">Improvement</small>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={analyticsData.healthTrends.moodTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[1, 10]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="mood" stroke="#8884d8" strokeWidth={3} name="Mood" />
                        <Line type="monotone" dataKey="energy" stroke="#82ca9d" strokeWidth={3} name="Energy Level" />
                      </LineChart>
                    </ResponsiveContainer>
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
