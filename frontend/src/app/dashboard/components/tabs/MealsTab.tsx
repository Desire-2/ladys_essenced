import React, { useState } from 'react';
import { Child } from '../../types';
import { useAuth } from '../../../../contexts/AuthContext';
import '../../../../styles/meals-tab.css';

interface MealsTabProps {
  selectedChild: number | null;
  children: Child[];
  onMealSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  mealError?: string;
  userType?: string;
}

export const MealsTab: React.FC<MealsTabProps> = ({
  selectedChild,
  children,
  onMealSubmit,
  mealError,
  userType
}) => {
  const { hasRole } = useAuth();
  
  // Helper to get selected child info
  const selectedChildInfo = selectedChild ? children.find(c => c.user_id === selectedChild) : null;
  const isParentView = userType === 'parent' && selectedChild;
  const [selectedMealType, setSelectedMealType] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const [hoveredMealType, setHoveredMealType] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    try {
      await onMealSubmit(e);
      // Reset form on success
      setSelectedMealType('');
      const form = e.currentTarget;
      form.reset();
    } catch (error) {
      console.error('Error submitting meal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBestTime = (nutrient: string): string => {
    const timingMap: { [key: string]: string } = {
      'Iron-rich foods': 'With Vitamin C sources (citrus, tomatoes)',
      'Calcium': 'Between meals for better absorption',
      'Magnesium': 'Evening meals for better sleep',
      'Omega-3': 'With other fats for better absorption'
    };
    return timingMap[nutrient] || 'Throughout the day';
  };

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '🌅', color: 'warning', tip: 'Start your day with energy-rich foods' },
    { value: 'lunch', label: 'Lunch', icon: '☀️', color: 'success', tip: 'Balance proteins, carbs, and vegetables' },
    { value: 'dinner', label: 'Dinner', icon: '🌙', color: 'info', tip: 'Light, nutritious meal for good sleep' },
    { value: 'snack', label: 'Snack', icon: '🍎', color: 'secondary', tip: 'Healthy options to maintain energy' }
  ];

  const nutritionTips = [
    { 
      icon: 'fas fa-heartbeat', 
      color: 'danger', 
      title: 'Iron-rich foods', 
      description: 'Red meat, spinach, beans, lentils',
      benefit: 'Prevents anemia during menstruation'
    },
    { 
      icon: 'fas fa-bone', 
      color: 'primary', 
      title: 'Calcium', 
      description: 'Dairy products, fortified plant milks',
      benefit: 'Reduces cramps and supports bone health'
    },
    { 
      icon: 'fas fa-leaf', 
      color: 'success', 
      title: 'Magnesium', 
      description: 'Nuts, seeds, whole grains',
      benefit: 'Helps reduce mood swings and bloating'
    },
    { 
      icon: 'fas fa-fish', 
      color: 'info', 
      title: 'Omega-3', 
      description: 'Fatty fish, flaxseeds, walnuts',
      benefit: 'Reduces inflammation and period pain'
    }
  ];

  return (
    <div className="container-fluid px-0">
      {/* Child Context Banner - Only for Parent View */}
      {isParentView && selectedChildInfo && (
        <div className="alert alert-info border-0 shadow-sm mb-4" style={{ 
          borderRadius: '15px',
          background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
          color: 'white'
        }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-20 p-2 me-3">
                <i className="fas fa-utensils"></i>
              </div>
              <div>
                <strong>{selectedChildInfo.name}'s Nutrition Tracking</strong>
                <div className="small opacity-90">
                  Managing meal logs and nutritional intake
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="small opacity-75">Tracking for</div>
              <div className="badge bg-white bg-opacity-20">
                <i className="fas fa-user-friends me-1"></i>
                Your Child
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Header */}
      <div className="card border-0 shadow-lg mb-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
        <div 
          className="card-header border-0 position-relative"
          style={{ 
            background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
            padding: '2rem 2rem 1.5rem'
          }}
        >
          <div className="position-absolute top-0 end-0 opacity-10" style={{ fontSize: '6rem' }}>
            <i className="fas fa-utensils"></i>
          </div>
          <div className="position-relative">
            <h3 className="text-white mb-2 fw-bold">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-white bg-opacity-20 p-3 me-3">
                  <i className="fas fa-utensils fa-lg"></i>
                </div>
                Nutrition Tracking
              </div>
            </h3>
            {selectedChild && (
              <div className="d-flex align-items-center text-white-50">
                <i className="fas fa-user-circle me-2"></i>
                <span>Tracking for: <strong className="text-white">{children.find(c => c.user_id === selectedChild)?.name}</strong></span>
              </div>
            )}
          </div>
        </div>

        <div className="card-body p-0">
          <div className="row g-0">
            {/* Meal Logging Form - Enhanced */}
            <div className="col-lg-6 border-end">
              <div className="p-4">
                <div className="mb-4">
                  <h4 className="text-primary mb-3">
                    <i className="fas fa-plus-circle me-2"></i>
                    Log New Meal
                  </h4>
                  <p className="text-muted small mb-0">Track your nutrition intake for better health insights</p>
                </div>

                <form onSubmit={handleSubmit} className={isSubmitting ? 'form-loading' : ''}>
                  {mealError && (
                    <div className="alert alert-danger alert-dismissible border-0 shadow-sm mb-4" role="alert">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      {mealError}
                      <button type="button" className="btn-close" aria-label="Close"></button>
                    </div>
                  )}

                  {/* Enhanced Meal Type Selection */}
                  <div className="form-group mb-4">
                    <label className="form-label fw-semibold text-dark mb-3">
                      <i className="fas fa-clock me-2 text-primary"></i>
                      Meal Type
                    </label>
                    <div className="row g-3">
                      {mealTypes.map((type) => (
                        <div key={type.value} className="col-6">
                          <input
                            type="radio"
                            className="btn-check"
                            name="mealType"
                            id={`mealType${type.value}`}
                            value={type.value}
                            onChange={(e) => setSelectedMealType(e.target.value)}
                            required
                          />
                          <label
                            className={`btn btn-outline-${type.color} w-100 py-3 border-2 position-relative hover-lift`}
                            htmlFor={`mealType${type.value}`}
                            style={{ transition: 'all 0.3s ease' }}
                            onMouseEnter={() => setHoveredMealType(type.value)}
                            onMouseLeave={() => setHoveredMealType(null)}
                            title={type.tip}
                          >
                            <div className="d-flex flex-column align-items-center">
                              <span className="fs-3 mb-2 meal-icon">{type.icon}</span>
                              <span className="fw-semibold">{type.label}</span>
                              {hoveredMealType === type.value && (
                                <small className="text-muted mt-1" style={{ 
                                  fontSize: '0.7rem',
                                  animation: 'fadeIn 0.3s ease-in'
                                }}>
                                  {type.tip}
                                </small>
                              )}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Date & Time Input */}
                  <div className="form-group mb-4">
                    <label htmlFor="mealDate" className="form-label fw-semibold text-dark">
                      <i className="fas fa-calendar-alt me-2 text-primary"></i>
                      Date & Time
                    </label>
                    <input 
                      type="datetime-local" 
                      className="form-control form-control-lg border-2"
                      id="mealDate" 
                      name="mealDate"
                      style={{ 
                        borderRadius: '12px',
                        transition: 'all 0.3s ease'
                      }}
                      required 
                    />
                  </div>

                  {/* Enhanced Meal Details */}
                  <div className="form-group mb-4">
                    <label htmlFor="mealDetails" className="form-label fw-semibold text-dark">
                      <i className="fas fa-edit me-2 text-primary"></i>
                      Meal Description
                    </label>
                    <textarea 
                      className="form-control form-control-lg border-2"
                      id="mealDetails" 
                      name="mealDetails"
                      rows={4}
                      placeholder="Describe what you ate... (e.g., Grilled chicken with steamed vegetables and brown rice)"
                      style={{ 
                        borderRadius: '12px',
                        transition: 'all 0.3s ease'
                      }}
                      required
                    ></textarea>
                    <div className="form-text">
                      <i className="fas fa-lightbulb me-1 text-warning"></i>
                      Include details like ingredients, portions, and cooking methods for better tracking
                    </div>
                  </div>

                  {/* Enhanced Submit Button */}
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg w-100 fw-semibold shadow-sm hover-lift btn-gradient"
                    style={{ 
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Save Meal Log
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Nutrition Recommendations - Enhanced */}
            <div className="col-lg-6">
              <div className="p-4">
                <div className="mb-4">
                  <h4 className="text-primary mb-3">
                    <i className="fas fa-heartbeat me-2"></i>
                    Nutrition Guide
                  </h4>
                  <p className="text-muted small mb-0">Cycle-aware nutrition recommendations for optimal health</p>
                </div>

                <div className="row g-3 mb-4">
                  {nutritionTips.map((tip, index) => (
                    <div key={index} className="col-12">
                      <div 
                        className="card border-0 shadow-sm hover-lift nutrition-tip-card"
                        style={{ 
                          borderRadius: '16px',
                          borderLeft: `4px solid var(--bs-${tip.color})`,
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onClick={() => setExpandedTip(expandedTip === index ? null : index)}
                      >
                        <div className="card-body p-3">
                          <div className="d-flex align-items-start">
                            <div 
                              className={`rounded-circle bg-${tip.color} bg-opacity-10 p-2 me-3 flex-shrink-0 meal-icon`}
                              style={{ width: '48px', height: '48px' }}
                            >
                              <i className={`${tip.icon} text-${tip.color} d-flex align-items-center justify-content-center h-100`}></i>
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start">
                                <h6 className="fw-bold mb-1">{tip.title}</h6>
                                <i className={`fas fa-chevron-${expandedTip === index ? 'up' : 'down'} text-muted`}></i>
                              </div>
                              <p className="text-muted small mb-1">{tip.description}</p>
                              {expandedTip === index && (
                                <div className="mt-3 p-3 bg-light bg-opacity-50 rounded-3" style={{
                                  animation: 'fadeIn 0.3s ease-in'
                                }}>
                                  <small className={`text-${tip.color} fw-semibold d-block mb-2`}>
                                    <i className="fas fa-info-circle me-1"></i>
                                    Why it helps:
                                  </small>
                                  <small className="text-dark">{tip.benefit}</small>
                                  <div className="mt-2">
                                    <small className="text-muted">
                                      <i className="fas fa-clock me-1"></i>
                                      Best consumed: {getBestTime(tip.title)}
                                    </small>
                                  </div>
                                </div>
                              )}
                              {expandedTip !== index && (
                                <small className={`text-${tip.color} fw-semibold`}>
                                  <i className="fas fa-info-circle me-1"></i>
                                  {tip.benefit}
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Hydration Tip */}
                <div 
                  className="alert border-0 shadow-sm"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(13, 202, 240, 0.1) 0%, rgba(13, 110, 253, 0.1) 100%)',
                    borderRadius: '16px',
                    borderLeft: '4px solid #0dcaf0'
                  }}
                >
                  <div className="d-flex align-items-start">
                    <div className="rounded-circle bg-info bg-opacity-10 p-2 me-3">
                      <i className="fas fa-tint text-info"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-info mb-2">
                        <i className="fas fa-droplet me-1"></i>
                        Hydration & Wellness Tips
                      </h6>
                      <ul className="list-unstyled mb-0 small text-muted">
                        <li className="mb-1">
                          <i className="fas fa-check-circle text-success me-2"></i>
                          Drink 8-10 glasses of water daily
                        </li>
                        <li className="mb-1">
                          <i className="fas fa-times-circle text-danger me-2"></i>
                          Limit caffeine during menstruation
                        </li>
                        <li className="mb-0">
                          <i className="fas fa-times-circle text-danger me-2"></i>
                          Avoid excessive alcohol consumption
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Enhanced Quick Stats */}
                <div className="row g-3 mt-3">
                  <div className="col-6">
                    <div className="text-center p-3 bg-success bg-opacity-10 rounded-3 quick-stats-item">
                      <div className="text-success fw-bold fs-4 mb-2">
                        <i className="fas fa-utensils"></i>
                      </div>
                      <small className="text-success fw-semibold d-block">Track Daily</small>
                      <small className="text-muted">Log every meal</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 bg-primary bg-opacity-10 rounded-3 quick-stats-item">
                      <div className="text-primary fw-bold fs-4 mb-2">
                        <i className="fas fa-chart-line"></i>
                      </div>
                      <small className="text-primary fw-semibold d-block">See Progress</small>
                      <small className="text-muted">Weekly insights</small>
                    </div>
                  </div>
                  <div className="col-12 mt-3">
                    <div className="text-center p-3 bg-warning bg-opacity-10 rounded-3 quick-stats-item">
                      <div className="d-flex align-items-center justify-content-center">
                        <i className="fas fa-target text-warning fs-5 me-2"></i>
                        <div>
                          <small className="text-warning fw-semibold d-block">Daily Goal</small>
                          <small className="text-muted">3-5 balanced meals</small>
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
    </div>
  );
};