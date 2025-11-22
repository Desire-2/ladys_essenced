'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';

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

interface SettingsTabProps {
  userType?: 'parent' | 'adolescent';
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ userType }) => {
  const { user, makeAuthenticatedRequest } = useAuth();
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

  const loadSettings = useCallback(async () => {
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
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading Settings...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      {/* Settings Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center mb-3">
            <i className="fas fa-cog text-primary me-3 fs-4"></i>
            <div>
              <h2 className="h4 mb-1">Account Settings</h2>
              <p className="text-muted mb-0">Manage your account preferences and privacy settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show mb-4">
          <i className="fas fa-check-circle me-2"></i>
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Privacy Settings - Only for Adolescents */}
        {user?.user_type === 'adolescent' && privacySettings && (
          <div className="col-12 col-lg-6">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-primary text-white border-0">
                <h5 className="card-title mb-0">
                  <i className="fas fa-shield-alt me-2"></i>
                  Privacy Settings
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-4">
                  <h6 className="fw-bold mb-3 text-dark">Parent Access Control</h6>
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
                    <div className="text-center mb-3">
                      <div className="spinner-border spinner-border-sm text-primary">
                        <span className="visually-hidden">Updating...</span>
                      </div>
                      <small className="text-muted ms-2">Updating privacy settings...</small>
                    </div>
                  )}

                  {privacySettings.linked_parents && privacySettings.linked_parents.length > 0 && (
                    <div className="mt-4">
                      <h6 className="fw-bold mb-2">Linked Parents</h6>
                      {privacySettings.linked_parents.map((parent) => (
                        <div key={parent.id} className="d-flex align-items-center justify-content-between p-3 border rounded mb-2 bg-light">
                          <div>
                            <div className="fw-bold text-dark">{parent.name}</div>
                            <small className="text-muted text-capitalize">{parent.relationship}</small>
                          </div>
                          <div className="text-end">
                            {privacySettings.allow_parent_access ? (
                              <small className="badge bg-success">
                                <i className="fas fa-eye me-1"></i>
                                Can view data
                              </small>
                            ) : (
                              <small className="badge bg-secondary">
                                <i className="fas fa-eye-slash me-1"></i>
                                Cannot view data
                              </small>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="alert alert-info mt-4">
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
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-secondary text-white border-0">
              <h5 className="card-title mb-0">
                <i className="fas fa-user-cog me-2"></i>
                Account Information
              </h5>
            </div>
            <div className="card-body">
              {accountSettings && (
                <div>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark">Name</label>
                    <input 
                      type="text" 
                      className="form-control bg-light" 
                      value={accountSettings.name}
                      disabled
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark">Email</label>
                    <input 
                      type="email" 
                      className="form-control bg-light" 
                      value={accountSettings.email || 'Not set'}
                      disabled
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark">Phone Number</label>
                    <input 
                      type="text" 
                      className="form-control bg-light" 
                      value={accountSettings.phone_number || 'Not set'}
                      disabled
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark">Account Type</label>
                    <input 
                      type="text" 
                      className="form-control bg-light" 
                      value={accountSettings.user_type}
                      disabled
                    />
                  </div>

                  <hr className="my-4" />

                  {/* Password Section */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-bold mb-0 text-dark">Password Security</h6>
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
                          <label className="form-label fw-bold">Current Password</label>
                          <input 
                            type="password"
                            className="form-control"
                            placeholder="Enter your current password"
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">New Password</label>
                          <input 
                            type="password"
                            className="form-control"
                            placeholder="Enter new password (min. 6 characters)"
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Confirm New Password</label>
                          <input 
                            type="password"
                            className="form-control"
                            placeholder="Confirm your new password"
                            value={passwordForm.confirm_password}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                          />
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                          <button 
                            type="button"
                            className="btn btn-primary"
                            onClick={updatePassword}
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Updating...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-save me-1"></i>
                                Update Password
                              </>
                            )}
                          </button>
                          <button 
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setShowPasswordForm(false);
                              setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                              setError('');
                            }}
                          >
                            <i className="fas fa-times me-1"></i>
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
                      <label className="form-check-label fw-bold text-dark" htmlFor="pinAuth">
                        PIN Authentication Enabled
                      </label>
                    </div>
                    <small className="text-muted">
                      <i className="fas fa-info-circle me-1"></i>
                      PIN authentication settings can be managed through your profile page.
                    </small>
                  </div>

                  {/* Additional Account Info */}
                  <div className="mt-4 p-3 bg-light border rounded">
                    <h6 className="fw-bold mb-2 text-dark">
                      <i className="fas fa-info-circle me-2 text-info"></i>
                      Account Information
                    </h6>
                    <small className="text-muted d-block mb-1">
                      <strong>Account Type:</strong> {accountSettings.user_type === 'adolescent' ? 'Adolescent User' : 'Parent User'}
                    </small>
                    {user?.user_type === 'adolescent' && (
                      <small className="text-muted d-block">
                        <strong>Privacy Control:</strong> You can control your parents' access to your data using the privacy settings above.
                      </small>
                    )}
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