'use client';

import { useState } from 'react';

export default function Feedback() {
  const [feedbackType, setFeedbackType] = useState('general');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Form validation
    if (!message) {
      setError('Please enter your feedback message');
      return;
    }
    
    // In a real application, this would call the API service
    console.log('Feedback submitted:', { feedbackType, message });
    
    // Simulate API call
    try {
      // This would be replaced with actual API call in production
      // const response = await ApiService.submitFeedback({ feedbackType, message });
      
      // Show success message
      setSubmitted(true);
      setMessage('');
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    }
  };

  return (
    <div className="container py-5">
      <h1 className="mb-4">Feedback</h1>
      
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h2>Submit Feedback</h2>
            </div>
            <div className="card-body">
              {submitted && (
                <div className="alert alert-success" role="alert">
                  Thank you for your feedback! We appreciate your input and will use it to improve our services.
                </div>
              )}
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label htmlFor="feedbackType" className="form-label">Feedback Type</label>
                  <select
                    className="form-control"
                    id="feedbackType"
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                  >
                    <option value="general">General</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="content">Content Suggestion</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="message" className="form-label">Your Message</label>
                  <textarea
                    className="form-control"
                    id="message"
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please share your thoughts, suggestions, or report issues..."
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Submit Feedback</button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h3>Previous Feedback</h3>
            </div>
            <div className="card-body">
              <div className="list-group">
                <div className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">Feature Request</h5>
                    <small className="text-muted">2025-03-15</small>
                  </div>
                  <p className="mb-1">Could you add a reminder feature for medication?</p>
                  <small className="text-muted">Status: Under Review</small>
                </div>
                <div className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">General Feedback</h5>
                    <small className="text-muted">2025-02-28</small>
                  </div>
                  <p className="mb-1">I love the new cycle tracking interface. It's very intuitive!</p>
                  <small className="text-success">Status: Responded</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
