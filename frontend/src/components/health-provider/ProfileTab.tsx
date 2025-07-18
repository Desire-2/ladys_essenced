'use client';

import type { HealthProvider, ProviderStats } from '../../types/health-provider';
import { formatDate } from '../../utils/health-provider';

interface ProfileTabProps {
  profile: HealthProvider;
  stats: ProviderStats | null;
  onEditProfile: () => void;
}

export default function ProfileTab({ 
  profile, 
  stats, 
  onEditProfile 
}: ProfileTabProps) {
  return (
    <div className="row">
      <div className="col-md-8">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5>Provider Profile</h5>
            <button 
              className="btn btn-primary btn-sm"
              onClick={onEditProfile}
            >
              <i className="fas fa-edit me-1"></i>
              Edit Profile
            </button>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Full Name:</strong>
                <p>{profile.name}</p>
              </div>
              <div className="col-md-6">
                <strong>Email:</strong>
                <p>{profile.email}</p>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>License Number:</strong>
                <p>{profile.license_number}</p>
              </div>
              <div className="col-md-6">
                <strong>Specialization:</strong>
                <p>{profile.specialization}</p>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Clinic Name:</strong>
                <p>{profile.clinic_name}</p>
              </div>
              <div className="col-md-6">
                <strong>Phone:</strong>
                <p>{profile.phone}</p>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-12">
                <strong>Clinic Address:</strong>
                <p>{profile.clinic_address}</p>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <strong>Verification Status:</strong>
                <p>
                  <span className={`badge ${profile.is_verified ? 'bg-success' : 'bg-warning'}`}>
                    {profile.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </p>
              </div>
              <div className="col-md-6">
                <strong>Member Since:</strong>
                <p>{formatDate(profile.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card">
          <div className="card-header">
            <h6>Quick Stats</h6>
          </div>
          <div className="card-body">
            {stats && (
              <>
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Appointments:</span>
                  <strong>{stats.appointment_stats.total}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Completed:</span>
                  <strong>{stats.appointment_stats.completed}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Success Rate:</span>
                  <strong>
                    {stats.appointment_stats.total > 0 
                      ? Math.round((stats.appointment_stats.completed / stats.appointment_stats.total) * 100)
                      : 0
                    }%
                  </strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Pending:</span>
                  <strong>{stats.appointment_stats.pending}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Today's Appointments:</span>
                  <strong>{stats.appointment_stats.today}</strong>
                </div>
              </>
            )}
          </div>
        </div>
        
        {!profile.is_verified && (
          <div className="card mt-3">
            <div className="card-header bg-warning text-dark">
              <h6 className="mb-0">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Verification Required
              </h6>
            </div>
            <div className="card-body">
              <p className="small mb-2">
                Your account is pending verification. Please ensure all your profile information is accurate and complete.
              </p>
              <p className="small mb-0">
                <strong>Verification Benefits:</strong>
              </p>
              <ul className="small mb-0">
                <li>Full access to all features</li>
                <li>Enhanced patient trust</li>
                <li>Priority appointment assignments</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
