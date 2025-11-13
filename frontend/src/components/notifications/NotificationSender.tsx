/**// Health Provider Notification Sender Component

 * NotificationSender Component'use client';

 * 

 * A comprehensive notification system for sending enhanced notificationsimport React, { useState, useCallback } from 'react';

 * with emojis, priority levels, and real-time delivery.import { useNotifications } from '../../contexts/NotificationContext';

 * import { toast } from 'react-hot-toast';

 * Features:

 * - Send notifications to users or health providersinterface Patient {

 * - Priority-based messaging (high, medium, low)  id: string;

 * - Emoji-enhanced messages for better user engagement  name: string;

 * - Real-time delivery tracking  user_type: string;

 * - Multiple delivery channels support  last_appointment?: string;

 * - Action buttons and deep linking}

 */

interface NotificationSenderProps {

import React, { useState } from 'react';  patients?: Patient[];

import { Button, Form, Alert, Spinner, Card, Row, Col, Badge } from 'react-bootstrap';  onClose?: () => void;

  preselectedPatientId?: string;

interface NotificationSenderProps {}

  onNotificationSent?: (success: boolean, message: string) => void;

  defaultRecipientId?: string;const NotificationSender: React.FC<NotificationSenderProps> = ({

  defaultRecipientType?: 'user' | 'health_provider';  patients = [],

}  onClose,

  preselectedPatientId

interface NotificationTemplate {}) => {

  id: string;  const { sendNotification } = useNotifications();

  name: string;  

  message: string;  const [formData, setFormData] = useState({

  emoji: string;    patientId: preselectedPatientId || '',

  priority: 'high' | 'medium' | 'low';    title: '',

  category: string;    message: '',

}    type: 'health_provider' as 'health_provider' | 'appointment' | 'info' | 'warning' | 'emergency',

    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',

const NotificationSender: React.FC<NotificationSenderProps> = ({    requiresAction: false,

  onNotificationSent,    actionLabel: '',

  defaultRecipientId = '',    actionUrl: ''

  defaultRecipientType = 'user'  });

}) => {  

  const [recipientId, setRecipientId] = useState(defaultRecipientId);  const [sending, setSending] = useState(false);

  const [recipientType, setRecipientType] = useState(defaultRecipientType);  const [showAdvanced, setShowAdvanced] = useState(false);

  const [title, setTitle] = useState('');  

  const [message, setMessage] = useState('');  // Predefined message templates

  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');  const messageTemplates = {

  const [category, setCategory] = useState('general');    appointment_reminder: {

  const [actionUrl, setActionUrl] = useState('');      title: 'Appointment Reminder',

  const [actionLabel, setActionLabel] = useState('');      message: 'This is a friendly reminder about your upcoming appointment. Please make sure to arrive 15 minutes early.',

  const [isLoading, setIsLoading] = useState(false);      type: 'appointment' as 'health_provider' | 'appointment' | 'info' | 'warning' | 'emergency',

  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);      priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',

      requiresAction: true,

  // Predefined notification templates      actionLabel: 'View Appointment',

  const templates: NotificationTemplate[] = [      actionUrl: '/appointments'

    {    },

      id: 'appointment_reminder',    test_results: {

      name: 'Appointment Reminder',      title: 'Test Results Available',

      message: 'You have an upcoming appointment tomorrow at {time}. Please arrive 15 minutes early.',      message: 'Your test results are now available. Please log in to view them or schedule a follow-up appointment.',

      emoji: '🏥',      type: 'health_provider' as 'health_provider' | 'appointment' | 'info' | 'warning' | 'emergency',

      priority: 'high',      priority: 'high' as 'low' | 'normal' | 'high' | 'urgent',

      category: 'appointment'      requiresAction: true,

    },      actionLabel: 'View Results',

    {      actionUrl: '/test-results'

      id: 'cycle_prediction',    },

      name: 'Cycle Prediction',    medication_reminder: {

      message: 'Your next period is predicted to start in 3 days. Track your symptoms for better insights.',      title: 'Medication Reminder',

      emoji: '📅',      message: 'This is a reminder to take your prescribed medication as directed. If you have any concerns, please contact us.',

      priority: 'medium',      type: 'health_provider' as 'health_provider' | 'appointment' | 'info' | 'warning' | 'emergency',

      category: 'cycle'      priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',

    },      requiresAction: false

    {    },

      id: 'health_tip',    follow_up: {

      name: 'Daily Health Tip',      title: 'Follow-up Required',

      message: 'Remember to stay hydrated! Aim for 8 glasses of water today for optimal health.',      message: 'Please schedule a follow-up appointment to monitor your progress and adjust your treatment plan if needed.',

      emoji: '💧',      type: 'appointment' as 'health_provider' | 'appointment' | 'info' | 'warning' | 'emergency',

      priority: 'low',      priority: 'high' as 'low' | 'normal' | 'high' | 'urgent',

      category: 'education'      requiresAction: true,

    },      actionLabel: 'Schedule Appointment',

    {      actionUrl: '/book-appointment'

      id: 'medication_reminder',    },

      name: 'Medication Reminder',    health_tip: {

      message: 'Time for your daily medication. Take your prescribed dose with food.',      title: 'Health Tip',

      emoji: '💊',      message: 'Here\'s a helpful health tip for you: Remember to stay hydrated and maintain a balanced diet.',

      priority: 'high',      type: 'health_provider' as 'health_provider' | 'appointment' | 'info' | 'warning' | 'emergency',

      category: 'medication'      priority: 'low' as 'low' | 'normal' | 'high' | 'urgent',

    },      requiresAction: false

    {    },

      id: 'appointment_confirmed',    urgent_message: {

      name: 'Appointment Confirmed',      title: 'Urgent: Please Contact Us',

      message: 'Your appointment with Dr. {provider_name} has been confirmed for {date} at {time}.',      message: 'We need to discuss something important with you. Please contact our clinic as soon as possible.',

      emoji: '✅',      type: 'emergency' as 'health_provider' | 'appointment' | 'info' | 'warning' | 'emergency',

      priority: 'medium',      priority: 'urgent' as 'low' | 'normal' | 'high' | 'urgent',

      category: 'appointment'      requiresAction: true,

    },      actionLabel: 'Contact Clinic',

    {      actionUrl: '/contact'

      id: 'new_content',    }

      name: 'New Educational Content',  };

      message: 'New article available: "Understanding Your Menstrual Cycle". Check it out in the education section!',  

      emoji: '📚',  // Handle form input changes

      priority: 'low',  const handleInputChange = useCallback((field: string, value: any) => {

      category: 'education'    setFormData(prev => ({

    }      ...prev,

  ];      [field]: value

    }));

  const handleTemplateSelect = (template: NotificationTemplate) => {  }, []);

    setTitle(`${template.emoji} ${template.name}`);  

    setMessage(template.message);  // Handle template selection

    setPriority(template.priority);  const handleTemplateSelect = useCallback((templateKey: string) => {

    setCategory(template.category);    const template = messageTemplates[templateKey as keyof typeof messageTemplates];

  };    if (template) {

      setFormData(prev => ({

  const handleSubmit = async (e: React.FormEvent) => {        ...prev,

    e.preventDefault();        ...template

    setIsLoading(true);      }));

    setAlert(null);    }

  }, []);

    try {  

      const token = localStorage.getItem('access_token');  // Handle form submission

      if (!token) {  const handleSubmit = useCallback(async (e: React.FormEvent) => {

        throw new Error('Authentication required');    e.preventDefault();

      }    

    if (!formData.patientId || !formData.title || !formData.message) {

      const notificationData = {      toast.error('Please fill in all required fields');

        recipient_id: recipientId,      return;

        recipient_type: recipientType,    }

        title: title,    

        message: message,    setSending(true);

        priority: priority,    

        category: category,    try {

        action_url: actionUrl || null,      const success = await sendNotification(formData.patientId, {

        action_label: actionLabel || null,        title: formData.title,

        delivery_channels: ['app', 'email'], // Default channels        message: formData.message,

        requires_action: !!(actionUrl && actionLabel),        type: formData.type,

        expires_in_hours: priority === 'high' ? 24 : priority === 'medium' ? 72 : 168 // 1 day, 3 days, 1 week        priority: formData.priority,

      };        requiresAction: formData.requiresAction,

        actionLabel: formData.actionLabel || undefined,

      const response = await fetch('/api/notifications/send', {        actionUrl: formData.actionUrl || undefined

        method: 'POST',      });

        headers: {      

          'Content-Type': 'application/json',      if (success) {

          'Authorization': `Bearer ${token}`        // Reset form

        },        setFormData({

        body: JSON.stringify(notificationData)          patientId: preselectedPatientId || '',

      });          title: '',

          message: '',

      const result = await response.json();          type: 'health_provider',

          priority: 'normal',

      if (response.ok) {          requiresAction: false,

        setAlert({ type: 'success', message: 'Notification sent successfully!' });          actionLabel: '',

        // Reset form          actionUrl: ''

        setTitle('');        });

        setMessage('');        

        setPriority('medium');        if (onClose) {

        setCategory('general');          onClose();

        setActionUrl('');        }

        setActionLabel('');      }

            } catch (error) {

        if (onNotificationSent) {      console.error('Error sending notification:', error);

          onNotificationSent(true, 'Notification sent successfully');    } finally {

        }      setSending(false);

      } else {    }

        throw new Error(result.message || 'Failed to send notification');  }, [formData, sendNotification, onClose, preselectedPatientId]);

      }  

    } catch (error) {  const selectedPatient = patients.find(p => p.id === formData.patientId);

      console.error('Error sending notification:', error);  

      const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';  return (

      setAlert({ type: 'danger', message: errorMessage });    <div className="notification-sender">

            <div className="card">

      if (onNotificationSent) {        <div className="card-header d-flex justify-content-between align-items-center">

        onNotificationSent(false, errorMessage);          <h5 className="mb-0">

      }            <i className="fas fa-paper-plane me-2"></i>

    } finally {            Send Notification

      setIsLoading(false);          </h5>

    }          {onClose && (

  };            <button 

              type="button" 

  const getPriorityBadge = (priority: string) => {              className="btn-close" 

    const variants = {              onClick={onClose}

      high: 'danger',            ></button>

      medium: 'warning',          )}

      low: 'info'        </div>

    };        

    return <Badge bg={variants[priority as keyof typeof variants]}>{priority.toUpperCase()}</Badge>;        <div className="card-body">

  };          <form onSubmit={handleSubmit}>

            {/* Patient Selection */}

  return (            <div className="mb-3">

    <Card>              <label htmlFor="patientSelect" className="form-label">

      <Card.Header>                <i className="fas fa-user me-2"></i>

        <h5 className="mb-0">📨 Send Enhanced Notification</h5>                Patient <span className="text-danger">*</span>

      </Card.Header>              </label>

      <Card.Body>              <select

        {alert && (                id="patientSelect"

          <Alert variant={alert.type} className="mb-3">                className="form-select"

            {alert.message}                value={formData.patientId}

          </Alert>                onChange={(e) => handleInputChange('patientId', e.target.value)}

        )}                required

              >

        {/* Quick Templates */}                <option value="">Select a patient...</option>

        <div className="mb-4">                {patients.map(patient => (

          <h6>📋 Quick Templates</h6>                  <option key={patient.id} value={patient.id}>

          <Row>                    {patient.name} ({patient.user_type})

            {templates.map(template => (                  </option>

              <Col key={template.id} md={6} lg={4} className="mb-2">                ))}

                <Card               </select>

                  className="cursor-pointer border-light"              {selectedPatient && (

                  style={{ cursor: 'pointer' }}                <div className="form-text">

                  onClick={() => handleTemplateSelect(template)}                  <i className="fas fa-info-circle me-1"></i>

                >                  {selectedPatient.last_appointment && (

                  <Card.Body className="p-2">                    <>Last appointment: {selectedPatient.last_appointment}</>

                    <div className="d-flex justify-content-between align-items-center">                  )}

                      <small className="fw-bold">                </div>

                        {template.emoji} {template.name}              )}

                      </small>            </div>

                      {getPriorityBadge(template.priority)}            

                    </div>            {/* Message Templates */}

                    <small className="text-muted">            <div className="mb-3">

                      {template.message.substring(0, 50)}...              <label className="form-label">

                    </small>                <i className="fas fa-templates me-2"></i>

                  </Card.Body>                Quick Templates

                </Card>              </label>

              </Col>              <div className="row g-2">

            ))}                {Object.entries(messageTemplates).map(([key, template]) => (

          </Row>                  <div key={key} className="col-md-6">

        </div>                    <button

                      type="button"

        <Form onSubmit={handleSubmit}>                      className="btn btn-outline-secondary btn-sm w-100 text-start"

          <Row>                      onClick={() => handleTemplateSelect(key)}

            <Col md={6}>                    >

              <Form.Group className="mb-3">                      <div className="d-flex justify-content-between align-items-center">

                <Form.Label>👤 Recipient ID</Form.Label>                        <span>{template.title}</span>

                <Form.Control                        <span className={`badge ${

                  type="text"                          template.priority === 'urgent' ? 'bg-danger' :

                  value={recipientId}                          template.priority === 'high' ? 'bg-warning' :

                  onChange={(e) => setRecipientId(e.target.value)}                          template.priority === 'normal' ? 'bg-primary' : 'bg-secondary'

                  placeholder="Enter user or provider ID"                        }`}>

                  required                          {template.priority}

                />                        </span>

              </Form.Group>                      </div>

            </Col>                    </button>

            <Col md={6}>                  </div>

              <Form.Group className="mb-3">                ))}

                <Form.Label>🎯 Recipient Type</Form.Label>              </div>

                <Form.Select            </div>

                  value={recipientType}            

                  onChange={(e) => setRecipientType(e.target.value as 'user' | 'health_provider')}            {/* Title */}

                >            <div className="mb-3">

                  <option value="user">👩 User</option>              <label htmlFor="title" className="form-label">

                  <option value="health_provider">🏥 Health Provider</option>                <i className="fas fa-heading me-2"></i>

                </Form.Select>                Title <span className="text-danger">*</span>

              </Form.Group>              </label>

            </Col>              <input

          </Row>                type="text"

                id="title"

          <Form.Group className="mb-3">                className="form-control"

            <Form.Label>📝 Title</Form.Label>                value={formData.title}

            <Form.Control                onChange={(e) => handleInputChange('title', e.target.value)}

              type="text"                placeholder="Enter notification title..."

              value={title}                maxLength={100}

              onChange={(e) => setTitle(e.target.value)}                required

              placeholder="Enter notification title (include emoji for better engagement)"              />

              required              <div className="form-text">

            />                {formData.title.length}/100 characters

          </Form.Group>              </div>

            </div>

          <Form.Group className="mb-3">            

            <Form.Label>💬 Message</Form.Label>            {/* Message */}

            <Form.Control            <div className="mb-3">

              as="textarea"              <label htmlFor="message" className="form-label">

              rows={3}                <i className="fas fa-comment me-2"></i>

              value={message}                Message <span className="text-danger">*</span>

              onChange={(e) => setMessage(e.target.value)}              </label>

              placeholder="Enter your notification message..."              <textarea

              required                id="message"

            />                className="form-control"

            <Form.Text className="text-muted">                rows={4}

              Use emojis and clear language. Variables like {'{time}'}, {'{date}'}, {'{provider_name}'} will be replaced automatically.                value={formData.message}

            </Form.Text>                onChange={(e) => handleInputChange('message', e.target.value)}

          </Form.Group>                placeholder="Enter notification message..."

                maxLength={500}

          <Row>                required

            <Col md={6}>              />

              <Form.Group className="mb-3">              <div className="form-text">

                <Form.Label>⚡ Priority</Form.Label>                {formData.message.length}/500 characters

                <Form.Select              </div>

                  value={priority}            </div>

                  onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}            

                >            {/* Basic Settings */}

                  <option value="low">🔵 Low Priority</option>            <div className="row mb-3">

                  <option value="medium">🟡 Medium Priority</option>              <div className="col-md-6">

                  <option value="high">🔴 High Priority</option>                <label htmlFor="type" className="form-label">

                </Form.Select>                  <i className="fas fa-tag me-2"></i>

              </Form.Group>                  Type

            </Col>                </label>

            <Col md={6}>                <select

              <Form.Group className="mb-3">                  id="type"

                <Form.Label>📂 Category</Form.Label>                  className="form-select"

                <Form.Select                  value={formData.type}

                  value={category}                  onChange={(e) => handleInputChange('type', e.target.value)}

                  onChange={(e) => setCategory(e.target.value)}                >

                >                  <option value="health_provider">Health Provider</option>

                  <option value="general">📢 General</option>                  <option value="appointment">Appointment</option>

                  <option value="appointment">🏥 Appointment</option>                  <option value="info">Information</option>

                  <option value="cycle">📅 Cycle</option>                  <option value="warning">Warning</option>

                  <option value="education">📚 Education</option>                  <option value="emergency">Emergency</option>

                  <option value="medication">💊 Medication</option>                </select>

                  <option value="emergency">🚨 Emergency</option>              </div>

                </Form.Select>              

              </Form.Group>              <div className="col-md-6">

            </Col>                <label htmlFor="priority" className="form-label">

          </Row>                  <i className="fas fa-exclamation-triangle me-2"></i>

                  Priority

          {/* Action Button (Optional) */}                </label>

          <Card className="mb-3 bg-light">                <select

            <Card.Body>                  id="priority"

              <h6>🔗 Action Button (Optional)</h6>                  className="form-select"

              <Row>                  value={formData.priority}

                <Col md={8}>                  onChange={(e) => handleInputChange('priority', e.target.value)}

                  <Form.Group className="mb-2">                >

                    <Form.Label>Action URL</Form.Label>                  <option value="low">Low</option>

                    <Form.Control                  <option value="normal">Normal</option>

                      type="url"                  <option value="high">High</option>

                      value={actionUrl}                  <option value="urgent">Urgent</option>

                      onChange={(e) => setActionUrl(e.target.value)}                </select>

                      placeholder="https://example.com/action or /dashboard/appointments"              </div>

                    />            </div>

                  </Form.Group>            

                </Col>            {/* Action Required Toggle */}

                <Col md={4}>            <div className="mb-3">

                  <Form.Group className="mb-2">              <div className="form-check">

                    <Form.Label>Button Label</Form.Label>                <input

                    <Form.Control                  className="form-check-input"

                      type="text"                  type="checkbox"

                      value={actionLabel}                  id="requiresAction"

                      onChange={(e) => setActionLabel(e.target.value)}                  checked={formData.requiresAction}

                      placeholder="View Details"                  onChange={(e) => handleInputChange('requiresAction', e.target.checked)}

                    />                />

                  </Form.Group>                <label className="form-check-label" htmlFor="requiresAction">

                </Col>                  <i className="fas fa-mouse-pointer me-2"></i>

              </Row>                  Requires patient action

            </Card.Body>                </label>

          </Card>              </div>

            </div>

          <div className="d-flex justify-content-between align-items-center">            

            <small className="text-muted">            {/* Advanced Options */}

              {getPriorityBadge(priority)} notification will be sent via app and email            <div className="mb-3">

            </small>              <button

            <Button                 type="button"

              type="submit"                 className="btn btn-link btn-sm p-0"

              variant="primary"                 onClick={() => setShowAdvanced(!showAdvanced)}

              disabled={isLoading}              >

              className="d-flex align-items-center"                <i className={`fas fa-chevron-${showAdvanced ? 'up' : 'down'} me-2`}></i>

            >                Advanced Options

              {isLoading ? (              </button>

                <>            </div>

                  <Spinner animation="border" size="sm" className="me-2" />            

                  Sending...            {showAdvanced && (

                </>              <div className="advanced-options border rounded p-3 mb-3 bg-light">

              ) : (                {formData.requiresAction && (

                <>                  <>

                  📨 Send Notification                    <div className="mb-3">

                </>                      <label htmlFor="actionLabel" className="form-label">

              )}                        <i className="fas fa-button me-2"></i>

            </Button>                        Action Button Label

          </div>                      </label>

        </Form>                      <input

      </Card.Body>                        type="text"

    </Card>                        id="actionLabel"

  );                        className="form-control"

};                        value={formData.actionLabel}

                        onChange={(e) => handleInputChange('actionLabel', e.target.value)}

export default NotificationSender;                        placeholder="e.g., View Appointment, Contact Clinic"
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