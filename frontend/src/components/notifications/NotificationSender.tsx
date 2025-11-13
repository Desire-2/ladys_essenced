'use client';

import React, { useState, useCallback } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { toast } from 'react-hot-toast';

interface Patient {
  id: string;
  name: string;
  user_type: string;
  last_appointment?: string;
}

interface NotificationSenderProps {
  patients?: Patient[];
  onClose?: () => void;
  preselectedPatientId?: string;
}

const NotificationSender: React.FC<NotificationSenderProps> = ({
  patients = [],
  onClose,
  preselectedPatientId
}) => {
  const { fetchNotifications } = useNotification();

  // Mock sendNotification function
  const sendNotification = useCallback(async (patientId: string, data: any) => {
    // This would normally send a notification via API
    console.log('Sending notification to patient:', patientId, data);
    // For now, just return success
    return { success: true };
  }, []);
  
  const [formData, setFormData] = useState({
    patientId: preselectedPatientId || '',
    title: '',
    message: '',
    type: 'health_provider' as 'health_provider' | 'appointment' | 'info' | 'warning' | 'emergency',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    requiresAction: false,
    actionLabel: '',
    actionUrl: ''
  });
  
  const [sending, setSending] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Predefined message templates
  const messageTemplates = {
    appointment_reminder: {
      title: 'Appointment Reminder',
      message: 'This is a friendly reminder about your upcoming appointment. Please make sure to arrive 15 minutes early.',
      type: 'appointment' as 'health_provider' | 'appointment' | 'info' | 'warning' | 'emergency',
      priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
      requiresAction: true,
      actionLabel: 'View Appointment',
      actionUrl: '/appointments'
    },
    test_results: {
      title: 'Test Results Available',
      message: 'Your test results are now available. Please log in to view them or schedule a follow-up appointment.',
      type: 'health_provider' as 'health_provider' | 'appointment' | 'info' | 'warning' | 'emergency',
      priority: 'high' as 'low' | 'normal' | 'high' | 'urgent',
      requiresAction: true,
      actionLabel: 'View Results',
      actionUrl: '/test-results'
    },
    medication_reminder: {
      title: 'Medication Reminder',
      message: 'This is a reminder to take your prescribed medication as directed. If you have any concerns, please contact us.',
      type: 'health_provider' as 'health_provider' | 'appointment' | 'info' | 'warning' | 'emergency',
      priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
      requiresAction: false
    },
    follow_up: {
      title: 'Follow-up Required',
      message: 'Please schedule a follow-up appointment to monitor your progress and adjust your treatment plan if needed.',
      type: 'appointment' as 'health_provider' | 'appointment' | 'info' | 'warning' | 'emergency',
      priority: 'high' as 'low' | 'normal' | 'high' | 'urgent',
      requiresAction: true,
      actionLabel: 'Schedule Appointment',
      actionUrl: '/book-appointment'
    },
    health_tip: {
      title: 'Health Tip',
      message: 'Here\'s a helpful health tip for you: Remember to stay hydrated and maintain a balanced diet.',
      type: 'health_provider' as 'health_provider' | 'appointment' | 'info' | 'warning' | 'emergency',
      priority: 'low' as 'low' | 'normal' | 'high' | 'urgent',
      requiresAction: false
    },
    urgent_message: {
      title: 'Urgent: Please Contact Us',
      message: 'We need to discuss something important with you. Please contact our clinic as soon as possible.',
      type: 'emergency' as 'health_provider' | 'appointment' | 'info' | 'warning' | 'emergency',
      priority: 'urgent' as 'low' | 'normal' | 'high' | 'urgent',
      requiresAction: true,
      actionLabel: 'Contact Clinic',
      actionUrl: '/contact'
    }
  };
  
  // Handle form input changes
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  // Handle template selection
  const handleTemplateSelect = useCallback((templateKey: string) => {
    const template = messageTemplates[templateKey as keyof typeof messageTemplates];
    if (template) {
      setFormData(prev => ({
        ...prev,
        ...template
      }));
    }
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.title || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSending(true);
    
    try {
      const success = await sendNotification(formData.patientId, {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        requiresAction: formData.requiresAction,
        actionLabel: formData.actionLabel || undefined,
        actionUrl: formData.actionUrl || undefined
      });
      
      if (success) {
        // Reset form
        setFormData({
          patientId: preselectedPatientId || '',
          title: '',
          message: '',
          type: 'health_provider',
          priority: 'normal',
          requiresAction: false,
          actionLabel: '',
          actionUrl: ''
        });
        
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setSending(false);
    }
  }, [formData, sendNotification, onClose, preselectedPatientId]);
  
  const selectedPatient = patients.find(p => p.id === formData.patientId);
  
  return (
    <div className="notification-sender">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-paper-plane me-2"></i>
            Send Notification
          </h5>
          {onClose && (
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
            ></button>
          )}
        </div>
        
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Patient Selection */}
            <div className="mb-3">
              <label htmlFor="patientSelect" className="form-label">
                <i className="fas fa-user me-2"></i>
                Patient <span className="text-danger">*</span>
              </label>
              <select
                id="patientSelect"
                className="form-select"
                value={formData.patientId}
                onChange={(e) => handleInputChange('patientId', e.target.value)}
                required
              >
                <option value="">Select a patient...</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} ({patient.user_type})
                  </option>
                ))}
              </select>
              {selectedPatient && (
                <div className="form-text">
                  <i className="fas fa-info-circle me-1"></i>
                  {selectedPatient.last_appointment && (
                    <>Last appointment: {selectedPatient.last_appointment}</>
                  )}
                </div>
              )}
            </div>
            
            {/* Message Templates */}
            <div className="mb-3">
              <label className="form-label">
                <i className="fas fa-templates me-2"></i>
                Quick Templates
              </label>
              <div className="row g-2">
                {Object.entries(messageTemplates).map(([key, template]) => (
                  <div key={key} className="col-md-6">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm w-100 text-start"
                      onClick={() => handleTemplateSelect(key)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{template.title}</span>
                        <span className={`badge ${
                          template.priority === 'urgent' ? 'bg-danger' :
                          template.priority === 'high' ? 'bg-warning' :
                          template.priority === 'normal' ? 'bg-primary' : 'bg-secondary'
                        }`}>
                          {template.priority}
                        </span>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Title */}
            <div className="mb-3">
              <label htmlFor="title" className="form-label">
                <i className="fas fa-heading me-2"></i>
                Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="title"
                className="form-control"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter notification title..."
                maxLength={100}
                required
              />
              <div className="form-text">
                {formData.title.length}/100 characters
              </div>
            </div>
            
            {/* Message */}
            <div className="mb-3">
              <label htmlFor="message" className="form-label">
                <i className="fas fa-comment me-2"></i>
                Message <span className="text-danger">*</span>
              </label>
              <textarea
                id="message"
                className="form-control"
                rows={4}
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Enter notification message..."
                maxLength={500}
                required
              />
              <div className="form-text">
                {formData.message.length}/500 characters
              </div>
            </div>
            
            {/* Basic Settings */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="type" className="form-label">
                  <i className="fas fa-tag me-2"></i>
                  Type
                </label>
                <select
                  id="type"
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <option value="health_provider">Health Provider</option>
                  <option value="appointment">Appointment</option>
                  <option value="info">Information</option>
                  <option value="warning">Warning</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="priority" className="form-label">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Priority
                </label>
                <select
                  id="priority"
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            
            {/* Action Required Toggle */}
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="requiresAction"
                  checked={formData.requiresAction}
                  onChange={(e) => handleInputChange('requiresAction', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="requiresAction">
                  <i className="fas fa-mouse-pointer me-2"></i>
                  Requires patient action
                </label>
              </div>
            </div>
            
            {/* Advanced Options */}
            <div className="mb-3">
              <button
                type="button"
                className="btn btn-link btn-sm p-0"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <i className={`fas fa-chevron-${showAdvanced ? 'up' : 'down'} me-2`}></i>
                Advanced Options
              </button>
            </div>
            
            {showAdvanced && (
              <div className="advanced-options border rounded p-3 mb-3 bg-light">
                {formData.requiresAction && (
                  <>
                    <div className="mb-3">
                      <label htmlFor="actionLabel" className="form-label">
                        <i className="fas fa-button me-2"></i>
                        Action Button Label
                      </label>
                      <input
                        type="text"
                        id="actionLabel"
                        className="form-control"
                        value={formData.actionLabel}
                        onChange={(e) => handleInputChange('actionLabel', e.target.value)}
                        placeholder="e.g., View Appointment, Contact Clinic"
                        maxLength={50}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="actionUrl" className="form-label">
                        <i className="fas fa-link me-2"></i>
                        Action URL
                      </label>
                      <input
                        type="text"
                        id="actionUrl"
                        className="form-control"
                        value={formData.actionUrl}
                        onChange={(e) => handleInputChange('actionUrl', e.target.value)}
                        placeholder="e.g., /appointments, /contact, /test-results"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Preview */}
            {formData.title && formData.message && (
              <div className="notification-preview mb-3">
                <h6>Preview:</h6>
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex align-items-start">
                      <div className="me-3">
                        <i className={`fas ${
                          formData.type === 'emergency' ? 'fa-exclamation-triangle text-danger' :
                          formData.type === 'appointment' ? 'fa-calendar-alt text-primary' :
                          formData.type === 'warning' ? 'fa-exclamation-triangle text-warning' :
                          'fa-user-md text-success'
                        }`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="card-title mb-1">{formData.title}</h6>
                        <p className="card-text mb-2">{formData.message}</p>
                        <small className="text-muted">
                          Priority: <span className={`badge ${
                            formData.priority === 'urgent' ? 'bg-danger' :
                            formData.priority === 'high' ? 'bg-warning' :
                            formData.priority === 'normal' ? 'bg-primary' : 'bg-secondary'
                          }`}>
                            {formData.priority.toUpperCase()}
                          </span>
                        </small>
                        {formData.requiresAction && formData.actionLabel && (
                          <div className="mt-2">
                            <button className="btn btn-sm btn-primary" disabled>
                              {formData.actionLabel}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending || !formData.patientId || !formData.title || !formData.message}
              >
                {sending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-2"></i>
                    Send Notification
                  </>
                )}
              </button>
              
              {onClose && (
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotificationSender;