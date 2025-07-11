'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getDashboardLink = () => {
    switch (user.user_type) {
      case 'admin':
        return '/admin';
      case 'content_writer':
        return '/content-writer';
      case 'health_provider':
        return '/health-provider';
      default:
        return '/dashboard';
    }
  };

  const getUserTypeDisplay = () => {
    switch (user.user_type) {
      case 'admin':
        return 'Administrator';
      case 'content_writer':
        return 'Content Writer';
      case 'health_provider':
        return 'Health Provider';
      case 'parent':
        return 'Parent';
      case 'adolescent':
        return 'Adolescent';
      default:
        return 'User';
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Profile Header */}
        <div className="col-12 mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">Profile</h1>
              <p className="text-muted">Manage your account information</p>
            </div>
            <div>
              <a href={getDashboardLink()} className="btn btn-outline-primary me-2">
                <i className="fas fa-arrow-left me-1"></i>
                Back to Dashboard
              </a>
              <button 
                className="btn btn-primary"
                onClick={() => setIsEditing(!isEditing)}
              >
                <i className={`fas ${isEditing ? 'fa-times' : 'fa-edit'} me-1`}></i>
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="col-md-8 mx-auto">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              {/* Profile Avatar Section */}
              <div className="text-center mb-4">
                <div className="position-relative d-inline-block">
                  <div 
                    className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                    style={{ width: '120px', height: '120px', fontSize: '2.5rem' }}
                  >
                    <i className="fas fa-user"></i>
                  </div>
                  {isEditing && (
                    <button className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle">
                      <i className="fas fa-camera"></i>
                    </button>
                  )}
                </div>
                <h3 className="mt-3 mb-1">{user.full_name || user.name || 'User'}</h3>
                <p className="text-muted mb-0">{getUserTypeDisplay()}</p>
              </div>

              {/* Profile Information */}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-medium">Full Name</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      className="form-control" 
                      defaultValue={user.full_name || user.name || ''} 
                    />
                  ) : (
                    <p className="form-control-plaintext">{user.full_name || user.name || 'N/A'}</p>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">Email</label>
                  {isEditing ? (
                    <input 
                      type="email" 
                      className="form-control" 
                      defaultValue={user.email || ''} 
                    />
                  ) : (
                    <p className="form-control-plaintext">{user.email || 'N/A'}</p>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">Phone</label>
                  {isEditing ? (
                    <input 
                      type="tel" 
                      className="form-control" 
                      defaultValue={user.phone || ''} 
                    />
                  ) : (
                    <p className="form-control-plaintext">{user.phone || 'N/A'}</p>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">Account Type</label>
                  <p className="form-control-plaintext">
                    <span className="badge bg-primary">{getUserTypeDisplay()}</span>
                  </p>
                </div>

                {user.age && (
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Age</label>
                    {isEditing ? (
                      <input 
                        type="number" 
                        className="form-control" 
                        defaultValue={user.age || ''} 
                      />
                    ) : (
                      <p className="form-control-plaintext">{user.age}</p>
                    )}
                  </div>
                )}

                {user.specialization && (
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Specialization</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        className="form-control" 
                        defaultValue={user.specialization || ''} 
                      />
                    ) : (
                      <p className="form-control-plaintext">{user.specialization}</p>
                    )}
                  </div>
                )}

                {user.bio && (
                  <div className="col-12">
                    <label className="form-label fw-medium">Bio</label>
                    {isEditing ? (
                      <textarea 
                        className="form-control" 
                        rows={3}
                        defaultValue={user.bio || ''} 
                      />
                    ) : (
                      <p className="form-control-plaintext">{user.bio}</p>
                    )}
                  </div>
                )}

                <div className="col-12">
                  <label className="form-label fw-medium">Member Since</label>
                  <p className="form-control-plaintext">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="row mt-4">
                  <div className="col-12">
                    <hr />
                    <div className="d-flex justify-content-end gap-2">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </button>
                      <button className="btn btn-primary">
                        <i className="fas fa-save me-1"></i>
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Section */}
          <div className="card shadow-sm mt-4">
            <div className="card-body p-4">
              <h5 className="card-title mb-3">Security Settings</h5>
              <div className="row g-3">
                <div className="col-12">
                  <button className="btn btn-outline-primary me-2">
                    <i className="fas fa-key me-1"></i>
                    Change Password
                  </button>
                  <button className="btn btn-outline-warning">
                    <i className="fas fa-shield-alt me-1"></i>
                    Two-Factor Authentication
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
