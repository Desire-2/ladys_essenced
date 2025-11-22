/**
 * Settings Page Component
 * Handles user account settings and privacy controls
 * Moved from dashboard tab to standalone page
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface PrivacySettings {
  allow_parent_access: boolean;
  linked_parents?: Array<{
    id: number;
    name: string;
    relationship: string;
  }>;
}

interface AccountSettings {
  name: string;
  email: string;
  phone_number: string;
  user_type: string;
  enable_pin_auth: boolean;
  allow_parent_access?: boolean;
}

const SettingsPage = () => {
  const { user, makeAuthenticatedRequest } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Settings state
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [accountSettings, setAccountSettings] = useState<AccountSettings | null>(null);
  
  // Form states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');

      // Load privacy settings
      try {
        const privacyData = await makeAuthenticatedRequest('/api/settings/privacy');
        setPrivacySettings(privacyData);
      } catch (privacyErr) {
        console.error('Failed to load privacy settings:', privacyErr);
      }

      // Load account settings
      try {
        const accountData = await makeAuthenticatedRequest('/api/settings/account');
        setAccountSettings(accountData);
      } catch (accountErr) {
        console.error('Failed to load account settings:', accountErr);
      }

    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateParentAccess = async (allowAccess: boolean) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await makeAuthenticatedRequest('/api/settings/privacy/parent-access', {
        method: 'PUT',
        body: JSON.stringify({ allow_parent_access: allowAccess })
      });

      setPrivacySettings(prev => prev ? { ...prev, allow_parent_access: allowAccess } : null);
      setSuccess(allowAccess ? 'Parent access enabled successfully' : 'Parent access disabled successfully');

    } catch (err) {
      console.error('Error updating parent access:', err);
      setError('Failed to update parent access setting');
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await makeAuthenticatedRequest('/api/settings/account', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });

      setSuccess('Password updated successfully');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordForm(false);

    } catch (err) {
      console.error('Error updating password:', err);
      setError('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    
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

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Settings Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">Account Settings</h1>
              <p className="text-muted">Manage your account preferences and privacy settings</p>
            </div>
            <div>
              <a href={getDashboardLink()} className="btn btn-outline-primary">
                <i className="fas fa-arrow-left me-2"></i>
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="fas fa-check-circle me-2"></i>
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Privacy Settings - Only for Adolescents */}
        {user?.user_type === 'adolescent' && privacySettings && (
          <div className="col-12 col-lg-6">
            <div className="card h-100">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-shield-alt me-2"></i>
                  Privacy Settings
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Parent Access Control</h6>
                  <p className="text-muted small mb-3">
                    Control whether your parents can view your health data and activity.
                  </p>

                  <div className="form-check form-switch mb-3">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="parentAccess"
                      checked={privacySettings.allow_parent_access}
                      onChange={(e) => updateParentAccess(e.target.checked)}
                      disabled={saving}
                    />
                    <label className="form-check-label fw-bold" htmlFor="parentAccess">
                      {privacySettings.allow_parent_access ? (
                        <span className="text-success">
                          <i className="fas fa-unlock me-1"></i>
                          Parents can view my data
                        </span>
                      ) : (
                        <span className="text-warning">
                          <i className="fas fa-lock me-1"></i>
                          Parents cannot view my data
                        </span>
                      )}
                    </label>
                  </div>

                  {saving && (
                    <div className="text-center">
                      <div className="spinner-border spinner-border-sm text-primary">
                        <span className="visually-hidden">Updating...</span>
                      </div>
                    </div>
                  )}

                  {privacySettings.linked_parents && privacySettings.linked_parents.length > 0 && (
                    <div className="mt-4">
                      <h6 className="fw-bold mb-2">Linked Parents</h6>
                      {privacySettings.linked_parents.map((parent) => (
                        <div key={parent.id} className="d-flex align-items-center justify-content-between p-2 border rounded mb-2">
                          <div>
                            <div className="fw-bold">{parent.name}</div>
                            <small className="text-muted text-capitalize">{parent.relationship}</small>
                          </div>
                          <div className="text-end">
                            {privacySettings.allow_parent_access ? (
                              <small className="text-success">
                                <i className="fas fa-eye me-1"></i>
                                Can view data
                              </small>
                            ) : (
                              <small className="text-muted">
                                <i className="fas fa-eye-slash me-1"></i>
                                Cannot view data
                              </small>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="alert alert-info mt-3">
                    <small>
                      <i className="fas fa-info-circle me-1"></i>
                      When you disable parent access, your parents will be notified and will no longer be able to view your health data, cycle logs, meal logs, or appointments.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Settings */}
        <div className={`col-12 ${user?.user_type === 'adolescent' ? 'col-lg-6' : ''}`}>
          <div className="card h-100">
            <div className="card-header bg-secondary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-user-cog me-2"></i>
                Account Information
              </h5>
            </div>
            <div className="card-body">
              {accountSettings && (
                <div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={accountSettings.name}
                      disabled
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Email</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      value={accountSettings.email || 'Not set'}
                      disabled
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Phone Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={accountSettings.phone_number || 'Not set'}
                      disabled
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Account Type</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={accountSettings.user_type}
                      disabled
                    />
                  </div>

                  <hr />

                  {/* Password Section */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="fw-bold mb-0">Password</h6>
                      <button 
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                      >
                        <i className="fas fa-key me-1"></i>
                        Change Password
                      </button>
                    </div>

                    {showPasswordForm && (
                      <div className="border rounded p-3 bg-light">
                        <div className="mb-3">
                          <label className="form-label">Current Password</label>
                          <input 
                            type="password"
                            className="form-control"
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">New Password</label>
                          <input 
                            type="password"
                            className="form-control"
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Confirm New Password</label>
                          <input 
                            type="password"
                            className="form-control"
                            value={passwordForm.confirm_password}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                          />
                        </div>
                        <div className="d-flex gap-2">
                          <button 
                            type="button"
                            className="btn btn-primary"
                            onClick={updatePassword}
                            disabled={saving}
                          >
                            {saving ? 'Updating...' : 'Update Password'}
                          </button>
                          <button 
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setShowPasswordForm(false);
                              setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PIN Authentication */}
                  <div className="mb-3">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="pinAuth"
                        checked={accountSettings.enable_pin_auth}
                        disabled
                      />
                      <label className="form-check-label fw-bold" htmlFor="pinAuth">
                        PIN Authentication Enabled
                      </label>
                    </div>
                    <small className="text-muted">
                      PIN authentication settings can be managed through your profile.
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;