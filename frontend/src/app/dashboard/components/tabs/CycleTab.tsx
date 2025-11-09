import React from 'react';
import { Child, CycleData } from '../../types';
import { DataSection } from '../ui/DataSection';
import { EmptyState } from '../ui/EmptyState';
import CycleCalendar from '../../../../components/CycleCalendar';

interface CycleTabProps {
  selectedChild: number | null;
  children: Child[];
  cycleData: CycleData;
  calendarData: any;
  currentDate: Date;
  dataLoadingStates: any;
  dataErrors: any;
  dataAvailability: any;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  onRetryDataLoad: (dataType: string) => void;
  onCycleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  cycleError?: string;
}

export const CycleTab: React.FC<CycleTabProps> = ({
  selectedChild,
  children,
  cycleData,
  calendarData,
  currentDate,
  dataLoadingStates,
  dataErrors,
  dataAvailability,
  onNavigateMonth,
  onRetryDataLoad,
  onCycleSubmit,
  cycleError
}) => {
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>Cycle Tracking</h3>
          {selectedChild && (
            <small className="text-muted">For: {children.find(c => c.user_id === selectedChild)?.name}</small>
          )}
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-8">
              <DataSection
                title="Cycle Calendar"
                dataType="calendar"
                icon="fas fa-calendar-alt"
                isLoading={dataLoadingStates.calendar}
                error={dataErrors.calendar}
                hasData={dataAvailability.calendar}
                onRetry={() => onRetryDataLoad('calendar')}
                showRetry={true}
              >
                {dataAvailability.calendar && calendarData ? (
                  <CycleCalendar 
                    calendarData={calendarData}
                    currentDate={currentDate}
                    onNavigateMonth={onNavigateMonth}
                  />
                ) : (
                  <EmptyState
                    icon="fas fa-calendar-times"
                    title="Calendar Unavailable"
                    description="Unable to load calendar data. Please check your connection and try again."
                    actionText="Retry Loading"
                    onAction={() => onRetryDataLoad('calendar')}
                  />
                )}
              </DataSection>
              
              {/* Cycle Insights Section */}
              {calendarData?.stats && (
                <div className="card mt-4">
                  <div className="card-header bg-info text-white">
                    <h6 className="mb-0">
                      <i className="fas fa-chart-line me-2"></i>
                      Cycle Insights
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-4">
                        <div className="mb-2">
                          <div className="fs-4 fw-bold text-primary">
                            {calendarData.stats.average_cycle_length ? Math.round(calendarData.stats.average_cycle_length) : 'N/A'}
                          </div>
                          <small className="text-muted">Avg Cycle Length (days)</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="mb-2">
                          <div className="fs-4 fw-bold text-success">
                            {calendarData.stats.total_logs || 0}
                          </div>
                          <small className="text-muted">Cycles Tracked</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="mb-2">
                          <div className="fs-4 fw-bold text-warning">
                            {calendarData.stats.next_predicted_period ? 
                              new Date(calendarData.stats.next_predicted_period).getDate() : 'N/A'}
                          </div>
                          <small className="text-muted">Next Period (day)</small>
                        </div>
                      </div>
                    </div>
                    {calendarData.stats.next_predicted_period && (
                      <div className="mt-3">
                        <div className="alert alert-info py-2 mb-0">
                          <i className="fas fa-info-circle me-2"></i>
                          <small>
                            Next period predicted for {new Date(calendarData.stats.next_predicted_period).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="col-md-4">
              {/* Enhanced Log New Period Form */}
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="fas fa-plus-circle me-2"></i>
                    Log New Period
                  </h5>
                </div>
                <div className="card-body">
                  <form onSubmit={onCycleSubmit}>
                    {cycleError && <div className="alert alert-danger">{cycleError}</div>}
                    <div className="form-group mb-3">
                      <label htmlFor="startDate" className="form-label">
                        <i className="fas fa-calendar me-1"></i>
                        Start Date
                      </label>
                      <input 
                        type="date" 
                        className="form-control" 
                        id="startDate" 
                        name="startDate"
                        required 
                      />
                    </div>
                    
                    <div className="form-group mb-3">
                      <label htmlFor="endDate" className="form-label">
                        <i className="fas fa-calendar-check me-1 text-success"></i>
                        <span className="fw-semibold">End Date</span> <span className="text-muted small">(Optional)</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-0"><i className="fas fa-calendar-day text-success"></i></span>
                        <input 
                          type="date" 
                          className="form-control border-start-0" 
                          id="endDate" 
                          name="endDate"
                          style={{ background: '#133557ff' }}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group mb-3">
                      <label className="form-label">
                        <i className="fas fa-thermometer-half me-1"></i>
                        Flow Intensity
                      </label>
                      <div className="btn-group d-flex" role="group">
                        <input type="radio" className="btn-check" name="flowIntensity" id="light" value="light" />
                        <label className="btn btn-outline-info btn-sm" htmlFor="light">Light</label>
                        
                        <input type="radio" className="btn-check" name="flowIntensity" id="medium" value="medium" />
                        <label className="btn btn-outline-warning btn-sm" htmlFor="medium">Medium</label>
                        
                        <input type="radio" className="btn-check" name="flowIntensity" id="heavy" value="heavy" />
                        <label className="btn btn-outline-danger btn-sm" htmlFor="heavy">Heavy</label>
                      </div>
                    </div>
                    
                    <div className="form-group mb-3">
                      <label className="form-label">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        Symptoms
                      </label>
                      <div className="row">
                        <div className="col-6">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" name="symptoms" value="cramps" id="cramps" />
                            <label className="form-check-label" htmlFor="cramps">Cramps</label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" name="symptoms" value="bloating" id="bloating" />
                            <label className="form-check-label" htmlFor="bloating">Bloating</label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" name="symptoms" value="headache" id="headache" />
                            <label className="form-check-label" htmlFor="headache">Headache</label>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" name="symptoms" value="mood_swings" id="mood_swings" />
                            <label className="form-check-label" htmlFor="mood_swings">Mood Swings</label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" name="symptoms" value="fatigue" id="fatigue" />
                            <label className="form-check-label" htmlFor="fatigue">Fatigue</label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" name="symptoms" value="acne" id="acne" />
                            <label className="form-check-label" htmlFor="acne">Acne</label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-group mb-3">
                      <label htmlFor="notes" className="form-label">
                        <i className="fas fa-sticky-note me-1"></i>
                        Notes
                      </label>
                      <textarea 
                        className="form-control" 
                        id="notes" 
                        name="notes"
                        rows={3}
                        placeholder="Any additional notes about your cycle..."
                      ></textarea>
                    </div>
                    
                    <button type="submit" className="btn btn-primary w-100">
                      <i className="fas fa-save me-2"></i>
                      Save Period Log
                    </button>
                  </form>
                </div>
              </div>
              
              {/* Cycle Insights Card */}
              <div className="card mt-3">
                <div className="card-header bg-info text-white">
                  <h6 className="mb-0">
                    <i className="fas fa-chart-line me-2"></i>
                    Cycle Insights
                  </h6>
                </div>
                <div className="card-body">
                  <div className="mb-2">
                    <small className="text-muted">Next Period Expected</small>
                    <div className="fw-bold text-primary">
                      {cycleData.nextPeriod || 'Not enough data'}
                    </div>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">Average Cycle Length</small>
                    <div className="fw-bold">
                      {cycleData.cycleLength ? `${cycleData.cycleLength} days` : 'N/A'}
                    </div>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">Current Cycle Day</small>
                    <div className="fw-bold text-success">Day 9</div>
                  </div>
                  <div className="progress mt-2" style={{height: '8px'}}>
                    <div className="progress-bar bg-gradient" style={{width: '32%', background: 'linear-gradient(90deg, #28a745, #20c997)'}}></div>
                  </div>
                  <small className="text-muted">Cycle Progress</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};