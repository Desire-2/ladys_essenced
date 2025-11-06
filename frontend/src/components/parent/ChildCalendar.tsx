import React, { useState, useEffect } from 'react';
import { useParent } from '@/contexts/ParentContext';

interface CalendarEvent {
  date: string;
  type: 'cycle' | 'meal' | 'appointment';
  title: string;
  details?: string;
  color: string;
}

interface ChildCalendarProps {
  childId: number;
  childName: string;
}

export const ChildCalendar: React.FC<ChildCalendarProps> = ({ childId, childName }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [view, setView] = useState<'month' | 'list'>('month');

  useEffect(() => {
    fetchCalendarData();
  }, [childId, currentDate]);

  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch cycle logs, meals, and appointments
      const [cycleRes, mealRes, appointmentRes] = await Promise.all([
        fetch(`http://localhost:5001/api/parents/children/${childId}/cycle-logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5001/api/parents/children/${childId}/meal-logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5001/api/parents/children/${childId}/appointments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const calendarEvents: CalendarEvent[] = [];

      // Process cycle logs
      if (cycleRes.ok) {
        const cycleData = await cycleRes.json();
        if (cycleData.items) {
          cycleData.items.forEach((log: any) => {
            if (log.start_date) {
              calendarEvents.push({
                date: log.start_date.split('T')[0],
                type: 'cycle',
                title: 'Period Start',
                details: `Symptoms: ${log.symptoms || 'None'}`,
                color: '#dc3545'
              });
            }
            if (log.end_date) {
              calendarEvents.push({
                date: log.end_date.split('T')[0],
                type: 'cycle',
                title: 'Period End',
                color: '#ffc107'
              });
            }
          });
        }
      }

      // Process meal logs
      if (mealRes.ok) {
        const mealData = await mealRes.json();
        if (mealData.items) {
          mealData.items.forEach((meal: any) => {
            if (meal.meal_time) {
              const mealDate = meal.meal_time.split('T')[0];
              calendarEvents.push({
                date: mealDate,
                type: 'meal',
                title: `${meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)} - ${meal.description}`,
                details: `${meal.calories ? meal.calories + ' kcal' : 'No calorie info'}`,
                color: '#28a745'
              });
            }
          });
        }
      }

      // Process appointments
      if (appointmentRes.ok) {
        const appointmentData = await appointmentRes.json();
        if (appointmentData.items) {
          appointmentData.items.forEach((appointment: any) => {
            if (appointment.appointment_date) {
              const appointDate = appointment.appointment_date.split('T')[0];
              calendarEvents.push({
                date: appointDate,
                type: 'appointment',
                title: appointment.appointment_for,
                details: `Status: ${appointment.status}`,
                color: '#0d6efd'
              });
            }
          });
        }
      }

      setEvents(calendarEvents);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  const formatDate = (d: number) => {
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    return `${currentDate.getFullYear()}-${month}-${day}`;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthDays = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // Add days of month
  for (let i = 1; i <= monthDays; i++) {
    calendarDays.push(i);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filteredEvents = selectedDate
    ? getEventsForDate(selectedDate)
    : [];

  return (
    <div className="card h-100">
      <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">
            <i className="fas fa-calendar me-2"></i>
            {childName}'s Calendar
          </h5>
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn ${view === 'month' ? 'btn-light' : 'btn-outline-light'}`}
              onClick={() => setView('month')}
            >
              <i className="fas fa-table me-1"></i>Month
            </button>
            <button
              type="button"
              className={`btn ${view === 'list' ? 'btn-light' : 'btn-outline-light'}`}
              onClick={() => setView('list')}
            >
              <i className="fas fa-list me-1"></i>List
            </button>
          </div>
        </div>
      </div>
      <div className="card-body">
        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : view === 'month' ? (
          <div>
            {/* Month Navigation */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={previousMonth}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <h6 className="mb-0">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h6>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={nextMonth}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid">
              <div className="row g-1 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="col d-flex align-items-center justify-content-center fw-bold small bg-light py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="row g-1">
                {calendarDays.map((day, index) => {
                  const dateStr = day ? formatDate(day) : null;
                  const dayEvents = dateStr ? getEventsForDate(dateStr) : [];
                  const isToday =
                    day &&
                    day === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear();

                  return (
                    <div
                      key={index}
                      className={`col d-flex flex-column p-2 border cursor-pointer ${
                        day ? 'bg-white' : 'bg-light'
                      } ${isToday ? 'border-primary border-2' : ''}`}
                      style={{
                        minHeight: '80px',
                        cursor: day ? 'pointer' : 'default',
                        backgroundColor: isToday ? '#f0f0f0' : 'white'
                      }}
                      onClick={() => {
                        if (dateStr) setSelectedDate(dateStr);
                      }}
                    >
                      {day && (
                        <>
                          <span className="fw-bold small">{day}</span>
                          <div className="flex-grow-1 small">
                            {dayEvents.map((event, idx) => (
                              <span
                                key={idx}
                                className="d-block badge"
                                style={{
                                  backgroundColor: event.color,
                                  fontSize: '9px',
                                  marginTop: '2px'
                                }}
                                title={event.title}
                              >
                                {event.type === 'cycle' ? '🔴' : event.type === 'meal' ? '🍽️' : '📅'}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-3 d-flex gap-2 flex-wrap">
              <small>
                <span className="badge" style={{ backgroundColor: '#dc3545' }}>🔴 Period</span>
              </small>
              <small>
                <span className="badge" style={{ backgroundColor: '#28a745' }}>🍽️ Meals</span>
              </small>
              <small>
                <span className="badge" style={{ backgroundColor: '#0d6efd' }}>📅 Appointments</span>
              </small>
            </div>
          </div>
        ) : (
          /* List View */
          <div>
            <h6 className="mb-3">Events for {childName}</h6>
            {events.length === 0 ? (
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                No events recorded yet
              </div>
            ) : (
              <div className="list-group">
                {events.map((event, idx) => (
                  <div
                    key={idx}
                    className="list-group-item"
                    style={{ borderLeft: `4px solid ${event.color}` }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{event.title}</h6>
                        <small className="text-muted d-block">{event.date}</small>
                        {event.details && (
                          <small className="text-muted d-block">{event.details}</small>
                        )}
                      </div>
                      <span className="badge" style={{ backgroundColor: event.color }}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
