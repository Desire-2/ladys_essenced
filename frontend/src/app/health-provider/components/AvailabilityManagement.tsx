import React from 'react';

interface AvailabilityManagementProps {
  providerId: number;
}

const AvailabilityManagement: React.FC<AvailabilityManagementProps> = ({ providerId }) => {
  return (
    <div className="availability-management">
      <div className="alert alert-info">
        <h5>
          <i className="fas fa-calendar-alt me-2"></i>
          Advanced Availability Management
        </h5>
        <p className="mb-2">
          Detailed availability scheduling features are coming soon! This will include:
        </p>
        <ul className="mb-0">
          <li>Custom working hours by day</li>
          <li>Break time management</li>
          <li>Special availability slots</li>
          <li>Blocked time management</li>
          <li>Holiday scheduling</li>
        </ul>
        <p className="mt-2 mb-0">
          <small className="text-muted">Provider ID: {providerId}</small>
        </p>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Current Basic Availability</h6>
            </div>
            <div className="card-body">
              <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
              <p>Saturday: 9:00 AM - 1:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Quick Stats</h6>
            </div>
            <div className="card-body">
              <p>Total slots this week: 40</p>
              <p>Booked slots: 15</p>
              <p>Availability: 62.5%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityManagement;