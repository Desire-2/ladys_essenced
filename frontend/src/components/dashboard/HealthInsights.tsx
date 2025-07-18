'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { format, addDays, differenceInDays } from 'date-fns';

interface HealthInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'alert' | 'achievement' | 'tip';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  icon: string;
  color: string;
  actionable: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
  metadata?: {
    confidence?: number;
    data_points?: number;
    last_updated?: string;
  };
}

interface HealthInsightsProps {
  cycleData?: any;
  mealData?: any;
  appointmentData?: any;
  selectedChild?: number | null;
}

export default function HealthInsights({ 
  cycleData, 
  mealData, 
  appointmentData, 
  selectedChild 
}: HealthInsightsProps) {
  const { user } = useAuth();
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  // Generate health insights based on data
  const generateInsights = () => {
    const generatedInsights: HealthInsight[] = [];
    
    // Cycle-based insights
    if (cycleData) {
      // Period prediction
      if (cycleData.lastPeriod) {
        const lastPeriodDate = new Date(cycleData.lastPeriod);
        const avgCycleLength = cycleData.cycleLength || 28;
        const nextPeriodDate = addDays(lastPeriodDate, avgCycleLength);
        const daysUntilPeriod = differenceInDays(nextPeriodDate, new Date());
        
        if (daysUntilPeriod >= 0 && daysUntilPeriod <= 7) {
          generatedInsights.push({
            id: 'period-prediction',
            type: 'prediction',
            title: 'Period Approaching',
            description: `Your next period is predicted to start in ${daysUntilPeriod} day${daysUntilPeriod !== 1 ? 's' : ''}`,
            priority: daysUntilPeriod <= 2 ? 'high' : 'medium',
            icon: 'fa-calendar-alt',
            color: 'info',
            actionable: true,
            action: {
              label: 'Prepare Kit',
              handler: () => alert('Period preparation tips opened!')
            },
            metadata: {
              confidence: 85,
              data_points: cycleData.totalLogs || 0
            }
          });
        }
      }

      // Cycle regularity insight
      const regularity = cycleData.cycleLength ? 
        (Math.abs(cycleData.cycleLength - 28) <= 3 ? 'regular' : 'irregular') : 'unknown';
      
      if (regularity === 'irregular') {
        generatedInsights.push({
          id: 'cycle-regularity',
          type: 'recommendation',
          title: 'Cycle Irregularity Detected',
          description: 'Your cycles have been irregular. Consider tracking more data or consulting a healthcare provider.',
          priority: 'medium',
          icon: 'fa-exclamation-triangle',
          color: 'warning',
          actionable: true,
          action: {
            label: 'Book Consultation',
            handler: () => alert('Booking appointment...')
          }
        });
      }
    }

    // Nutrition-based insights
    if (mealData && Array.isArray(mealData)) {
      const recentMeals = mealData.filter(meal => {
        const mealDate = new Date(meal.date || meal.meal_time);
        return differenceInDays(new Date(), mealDate) <= 7;
      });

      if (recentMeals.length < 14) { // Less than 2 meals per day on average
        generatedInsights.push({
          id: 'meal-tracking',
          type: 'recommendation',
          title: 'Increase Meal Logging',
          description: 'You\'ve logged fewer meals this week. Regular tracking helps identify nutrition patterns.',
          priority: 'low',
          icon: 'fa-utensils',
          color: 'success',
          actionable: true,
          action: {
            label: 'Log Meal Now',
            handler: () => alert('Meal logging opened!')
          }
        });
      }

      // Nutrition variety check
      const mealTypes = new Set(recentMeals.map(meal => meal.meal_type));
      if (mealTypes.size < 3) {
        generatedInsights.push({
          id: 'nutrition-variety',
          type: 'tip',
          title: 'Diversify Your Meals',
          description: 'Try to include breakfast, lunch, and dinner in your daily routine for balanced nutrition.',
          priority: 'low',
          icon: 'fa-leaf',
          color: 'success',
          actionable: false
        });
      }
    }

    // Appointment-based insights
    if (appointmentData && Array.isArray(appointmentData)) {
      const upcomingAppointments = appointmentData.filter(apt => {
        const aptDate = new Date(apt.date || apt.appointment_date);
        return aptDate > new Date();
      });

      if (upcomingAppointments.length === 0) {
        generatedInsights.push({
          id: 'schedule-checkup',
          type: 'recommendation',
          title: 'Schedule Regular Checkup',
          description: 'It\'s been a while since your last appointment. Consider scheduling a routine checkup.',
          priority: 'medium',
          icon: 'fa-user-md',
          color: 'primary',
          actionable: true,
          action: {
            label: 'Book Appointment',
            handler: () => alert('Appointment booking opened!')
          }
        });
      }

      // Upcoming appointment reminder
      const soonAppointments = upcomingAppointments.filter(apt => {
        const aptDate = new Date(apt.date || apt.appointment_date);
        return differenceInDays(aptDate, new Date()) <= 2;
      });

      soonAppointments.forEach(apt => {
        const daysUntil = differenceInDays(new Date(apt.date || apt.appointment_date), new Date());
        generatedInsights.push({
          id: `appointment-${apt.id}`,
          type: 'alert',
          title: 'Upcoming Appointment',
          description: `You have an appointment ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}`,
          priority: daysUntil === 0 ? 'high' : 'medium',
          icon: 'fa-calendar-check',
          color: daysUntil === 0 ? 'danger' : 'warning',
          actionable: true,
          action: {
            label: 'View Details',
            handler: () => alert('Appointment details opened!')
          }
        });
      });
    }

    // General health tips
    generatedInsights.push({
      id: 'hydration-tip',
      type: 'tip',
      title: 'Stay Hydrated',
      description: 'Aim for 8-10 glasses of water daily. Proper hydration can help reduce bloating and improve energy.',
      priority: 'low',
      icon: 'fa-tint',
      color: 'info',
      actionable: false
    });

    generatedInsights.push({
      id: 'exercise-tip',
      type: 'tip',
      title: 'Light Exercise Benefits',
      description: 'Gentle exercises like walking or yoga can help alleviate menstrual symptoms.',
      priority: 'low',
      icon: 'fa-running',
      color: 'success',
      actionable: false
    });

    // Achievement insights
    if (cycleData?.totalLogs && cycleData.totalLogs >= 10) {
      generatedInsights.push({
        id: 'tracking-achievement',
        type: 'achievement',
        title: 'Great Tracking!',
        description: `You've logged ${cycleData.totalLogs} cycle entries. Consistent tracking improves predictions!`,
        priority: 'low',
        icon: 'fa-trophy',
        color: 'warning',
        actionable: false
      });
    }

    return generatedInsights;
  };

  // Load insights
  useEffect(() => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      const newInsights = generateInsights();
      setInsights(newInsights);
      setLoading(false);
    }, 500);
  }, [cycleData, mealData, appointmentData, selectedChild]);

  // Filter insights by type
  const filteredInsights = insights.filter(insight => 
    selectedType === 'all' || insight.type === selectedType
  );

  // Get priority color class
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-danger';
      case 'medium': return 'border-warning';
      default: return 'border-info';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'prediction': return 'fa-crystal-ball';
      case 'recommendation': return 'fa-lightbulb';
      case 'alert': return 'fa-exclamation-circle';
      case 'achievement': return 'fa-trophy';
      case 'tip': return 'fa-info-circle';
      default: return 'fa-info';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading insights...</span>
        </div>
        <p className="mt-2 text-muted">Analyzing your health data...</p>
      </div>
    );
  }

  return (
    <div className="health-insights">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">
          <i className="fas fa-brain me-2 text-info"></i>
          Health Insights
        </h5>
        <small className="text-muted">Personalized recommendations</small>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4">
        <div className="btn-group btn-group-sm" role="group">
          {[
            { key: 'all', label: 'All', count: insights.length },
            { key: 'prediction', label: 'Predictions', count: insights.filter(i => i.type === 'prediction').length },
            { key: 'recommendation', label: 'Recommendations', count: insights.filter(i => i.type === 'recommendation').length },
            { key: 'alert', label: 'Alerts', count: insights.filter(i => i.type === 'alert').length },
            { key: 'achievement', label: 'Achievements', count: insights.filter(i => i.type === 'achievement').length }
          ].map(filter => (
            <button
              key={filter.key}
              type="button"
              className={`btn ${selectedType === filter.key ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setSelectedType(filter.key)}
            >
              {filter.label} {filter.count > 0 && <span className="badge bg-light text-dark ms-1">{filter.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Insights List */}
      <div className="row g-3">
        {filteredInsights.length > 0 ? (
          filteredInsights.map(insight => (
            <div key={insight.id} className="col-md-6 col-lg-4">
              <div className={`card h-100 ${getPriorityColor(insight.priority)}`}>
                <div className="card-body">
                  <div className="d-flex align-items-start mb-3">
                    <div className={`text-${insight.color} me-3`}>
                      <i className={`fas ${insight.icon} fa-lg`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="card-title mb-1">{insight.title}</h6>
                        <span className={`badge bg-${insight.color}`}>
                          <i className={`fas ${getTypeIcon(insight.type)} me-1`}></i>
                          {insight.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="card-text text-muted small mb-3">{insight.description}</p>
                  
                  {insight.metadata && (
                    <div className="mb-3">
                      {insight.metadata.confidence && (
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">Confidence</small>
                          <small className="fw-bold">{insight.metadata.confidence}%</small>
                        </div>
                      )}
                      {insight.metadata.data_points && (
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">Data Points</small>
                          <small className="fw-bold">{insight.metadata.data_points}</small>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {insight.actionable && insight.action && (
                    <button 
                      className={`btn btn-sm btn-outline-${insight.color} w-100`}
                      onClick={insight.action.handler}
                    >
                      <i className="fas fa-arrow-right me-1"></i>
                      {insight.action.label}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="text-center py-4">
              <i className="fas fa-lightbulb fa-3x text-muted mb-3"></i>
              <h6 className="text-muted">No insights available</h6>
              <p className="text-muted">Continue tracking your health data to get personalized insights.</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {insights.length > 0 && (
        <div className="mt-4">
          <div className="card bg-light">
            <div className="card-body">
              <h6 className="card-title">
                <i className="fas fa-chart-pie me-2"></i>
                Insights Summary
              </h6>
              <div className="row text-center">
                <div className="col-3">
                  <div className="text-danger">
                    <strong>{insights.filter(i => i.priority === 'high').length}</strong>
                  </div>
                  <small className="text-muted">High Priority</small>
                </div>
                <div className="col-3">
                  <div className="text-warning">
                    <strong>{insights.filter(i => i.priority === 'medium').length}</strong>
                  </div>
                  <small className="text-muted">Medium Priority</small>
                </div>
                <div className="col-3">
                  <div className="text-info">
                    <strong>{insights.filter(i => i.actionable).length}</strong>
                  </div>
                  <small className="text-muted">Actionable</small>
                </div>
                <div className="col-3">
                  <div className="text-success">
                    <strong>{insights.filter(i => i.type === 'achievement').length}</strong>
                  </div>
                  <small className="text-muted">Achievements</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
