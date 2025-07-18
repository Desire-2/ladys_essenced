'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  action: () => void;
  badge?: string;
  disabled?: boolean;
}

interface QuickActionsProps {
  onCycleLog?: () => void;
  onMealLog?: () => void;
  onAppointmentBook?: () => void;
  onEmergencyCall?: () => void;
  onSymptomTrack?: () => void;
  onMoodLog?: () => void;
}

export default function QuickActions({
  onCycleLog,
  onMealLog,
  onAppointmentBook,
  onEmergencyCall,
  onSymptomTrack,
  onMoodLog
}: QuickActionsProps) {
  const { user } = useAuth();
  const [processing, setProcessing] = useState<string | null>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'cycle-log',
      title: 'Log Period',
      description: 'Track your menstrual cycle',
      icon: 'fa-calendar-check',
      color: 'primary',
      action: () => {
        setProcessing('cycle-log');
        onCycleLog?.();
        setTimeout(() => setProcessing(null), 1000);
      }
    },
    {
      id: 'meal-log',
      title: 'Log Meal',
      description: 'Record what you ate',
      icon: 'fa-utensils',
      color: 'success',
      action: () => {
        setProcessing('meal-log');
        onMealLog?.();
        setTimeout(() => setProcessing(null), 1000);
      }
    },
    {
      id: 'appointment',
      title: 'Book Appointment',
      description: 'Schedule with a doctor',
      icon: 'fa-user-md',
      color: 'info',
      action: () => {
        setProcessing('appointment');
        onAppointmentBook?.();
        setTimeout(() => setProcessing(null), 1000);
      }
    },
    {
      id: 'emergency',
      title: 'Emergency',
      description: 'Quick emergency assistance',
      icon: 'fa-ambulance',
      color: 'danger',
      action: () => {
        setProcessing('emergency');
        onEmergencyCall?.();
        setTimeout(() => setProcessing(null), 1000);
      }
    },
    {
      id: 'symptoms',
      title: 'Track Symptoms',
      description: 'Log symptoms and pain',
      icon: 'fa-heartbeat',
      color: 'warning',
      action: () => {
        setProcessing('symptoms');
        onSymptomTrack?.();
        setTimeout(() => setProcessing(null), 1000);
      }
    },
    {
      id: 'mood',
      title: 'Mood Tracker',
      description: 'How are you feeling?',
      icon: 'fa-smile',
      color: 'secondary',
      action: () => {
        setProcessing('mood');
        onMoodLog?.();
        setTimeout(() => setProcessing(null), 1000);
      }
    }
  ];

  return (
    <div className="quick-actions">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <i className="fas fa-bolt me-2 text-warning"></i>
          Quick Actions
        </h5>
        <small className="text-muted">Tap to perform actions</small>
      </div>
      
      <div className="row g-3">
        {quickActions.map(action => (
          <div key={action.id} className="col-md-4 col-sm-6">
            <div 
              className={`card h-100 border-${action.color} quick-action-card ${processing === action.id ? 'processing' : ''}`}
              style={{ 
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: action.disabled ? 0.6 : 1
              }}
              onClick={() => !action.disabled && !processing && action.action()}
            >
              <div className="card-body text-center p-3">
                <div className={`text-${action.color} mb-2`}>
                  {processing === action.id ? (
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Processing...</span>
                    </div>
                  ) : (
                    <i className={`fas ${action.icon} fa-2x`}></i>
                  )}
                </div>
                <h6 className="card-title mb-1">{action.title}</h6>
                <p className="card-text small text-muted mb-0">{action.description}</p>
                {action.badge && (
                  <span className={`badge bg-${action.color} mt-2`}>{action.badge}</span>
                )}
              </div>
              
              {/* Hover effect overlay */}
              <div 
                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{
                  background: `var(--bs-${action.color})`,
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                }}
              >
                <i className="fas fa-arrow-right text-white fa-lg"></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Actions Summary */}
      <div className="mt-4">
        <div className="card border-light">
          <div className="card-body">
            <h6 className="card-title">
              <i className="fas fa-history me-2 text-muted"></i>
              Recent Activity
            </h6>
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <div className="text-center">
                  <div className="text-primary">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  <small className="text-muted d-block">Last Period</small>
                  <small className="fw-bold">3 days ago</small>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="text-center">
                  <div className="text-success">
                    <i className="fas fa-utensils"></i>
                  </div>
                  <small className="text-muted d-block">Meals Today</small>
                  <small className="fw-bold">2 logged</small>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="text-center">
                  <div className="text-info">
                    <i className="fas fa-user-md"></i>
                  </div>
                  <small className="text-muted d-block">Next Appointment</small>
                  <small className="fw-bold">Tomorrow</small>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="text-center">
                  <div className="text-warning">
                    <i className="fas fa-heartbeat"></i>
                  </div>
                  <small className="text-muted d-block">Symptoms</small>
                  <small className="fw-bold">None today</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .quick-action-card {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .quick-action-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        }
        
        .quick-action-card:hover .position-absolute {
          opacity: 0.1;
        }
        
        .quick-action-card.processing {
          transform: scale(0.98);
        }
        
        @media (max-width: 768px) {
          .quick-action-card {
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
