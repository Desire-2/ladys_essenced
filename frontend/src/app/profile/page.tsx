'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading, updateProfile: updateUserProfile } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Profile form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    specialization: '',
    bio: ''
  });

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // PIN change modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinData, setPinData] = useState({
    newPin: '',
    confirmPin: ''
  });
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      setFormData({
        name: user.full_name || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age?.toString() || '',
        specialization: user.specialization || '',
        bio: user.bio || ''
      });
    }
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateUserProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : undefined,
        specialization: formData.specialization || undefined,
        bio: formData.bio || undefined
      });

      if (result.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate passwords
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await updateUserProfile({
        password: passwordData.newPassword
      });

      if (result.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(result.error || 'Failed to change password');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangePin = async (e: FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    // Validate PIN
    if (!/^\d{4}$/.test(pinData.newPin)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }

    if (pinData.newPin !== pinData.confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    setIsChangingPin(true);

    try {
      const result = await updateUserProfile({
        pin: pinData.newPin,
        enable_pin_auth: true
      });

      if (result.success) {
        setPinSuccess('PIN set successfully! You can now use PIN to login.');
        setPinData({ newPin: '', confirmPin: '' });
        setTimeout(() => {
          setShowPinModal(false);
          setPinSuccess('');
        }, 2000);
      } else {
        setPinError(result.error || 'Failed to set PIN');
      }
    } catch (err: any) {
      setPinError(err.message || 'Failed to set PIN');
    } finally {
      setIsChangingPin(false);
    }
  };

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
              {/* Success/Error Messages */}
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}
              
              {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <i className="fas fa-check-circle me-2"></i>
                  {success}
                  <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
                </div>
              )}

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
              <form onSubmit={handleSaveProfile}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Full Name</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="name"
                        className="form-control" 
                        value={formData.name} 
                        onChange={handleInputChange}
                        required
                      />
                    ) : (
                      <p className="form-control-plaintext">{formData.name || 'N/A'}</p>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium">Email</label>
                    {isEditing ? (
                      <input 
                        type="email" 
                        name="email"
                        className="form-control" 
                        value={formData.email} 
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="form-control-plaintext">{formData.email || 'N/A'}</p>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium">Phone</label>
                    {isEditing ? (
                      <input 
                        type="tel" 
                        name="phone"
                        className="form-control" 
                        value={formData.phone} 
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="form-control-plaintext">{formData.phone || 'N/A'}</p>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium">Account Type</label>
                    <p className="form-control-plaintext">
                      <span className="badge bg-primary">{getUserTypeDisplay()}</span>
                    </p>
                  </div>

                  {(user?.user_type === 'adolescent' || formData.age) && (
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Age</label>
                      {isEditing ? (
                        <input 
                          type="number" 
                          name="age"
                          className="form-control" 
                          value={formData.age} 
                          onChange={handleInputChange}
                          min="1"
                          max="120"
                        />
                      ) : (
                        <p className="form-control-plaintext">{formData.age || 'N/A'}</p>
                      )}
                    </div>
                  )}

                  {(user?.user_type === 'content_writer' || user?.user_type === 'health_provider' || formData.specialization) && (
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Specialization</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          name="specialization"
                          className="form-control" 
                          value={formData.specialization} 
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="form-control-plaintext">{formData.specialization || 'N/A'}</p>
                      )}
                    </div>
                  )}

                  {(user?.user_type === 'content_writer' || formData.bio) && (
                    <div className="col-12">
                      <label className="form-label fw-medium">Bio</label>
                      {isEditing ? (
                        <textarea 
                          name="bio"
                          className="form-control" 
                          rows={3}
                          value={formData.bio} 
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="form-control-plaintext">{formData.bio || 'N/A'}</p>
                      )}
                    </div>
                  )}

                  <div className="col-12">
                    <label className="form-label fw-medium">Member Since</label>
                    <p className="form-control-plaintext">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
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
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setIsEditing(false)}
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save me-1"></i>
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Security Section */}
          <div className="card shadow-sm mt-4">
            <div className="card-body p-4">
              <h5 className="card-title mb-3">
                <i className="fas fa-shield-alt me-2"></i>
                Security Settings
              </h5>
              <div className="row g-3">
                <div className="col-12">
                  <p className="text-muted mb-3">
                    Manage your account security settings including password and PIN authentication.
                  </p>
                </div>
                <div className="col-md-6">
                  <div className="card border">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-2">
                        <i className="fas fa-key me-2 text-primary"></i>
                        Password
                      </h6>
                      <p className="card-text small text-muted mb-3">
                        Change your account password for enhanced security.
                      </p>
                      <button 
                        className="btn btn-outline-primary btn-sm w-100"
                        onClick={() => setShowPasswordModal(true)}
                      >
                        <i className="fas fa-key me-1"></i>
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card border">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-2">
                        <i className="fas fa-lock me-2 text-warning"></i>
                        PIN Authentication
                      </h6>
                      <p className="card-text small text-muted mb-3">
                        Set up a 4-digit PIN for quick and secure login.
                      </p>
                      <button 
                        className="btn btn-outline-warning btn-sm w-100"
                        onClick={() => setShowPinModal(true)}
                      >
                        <i className="fas fa-shield-alt me-1"></i>
                        {user?.enable_pin_auth ? 'Change PIN' : 'Set Up PIN'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-key me-2"></i>
                    Change Password
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowPasswordModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleChangePassword}>
                  <div className="modal-body">
                    {passwordError && (
                      <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <i className="fas fa-exclamation-circle me-2"></i>
                        {passwordError}
                        <button 
                          type="button" 
                          className="btn-close" 
                          onClick={() => setPasswordError('')}
                        ></button>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="alert alert-success" role="alert">
                        <i className="fas fa-check-circle me-2"></i>
                        {passwordSuccess}
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label">New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        placeholder="Enter new password"
                        required
                        minLength={6}
                      />
                      <small className="text-muted">Minimum 6 characters</small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowPasswordModal(false)}
                      disabled={isChangingPassword}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Changing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check me-1"></i>
                          Change Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* Change PIN Modal */}
      {showPinModal && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-warning bg-opacity-10">
                  <h5 className="modal-title">
                    <i className="fas fa-lock me-2"></i>
                    {user?.enable_pin_auth ? 'Change PIN' : 'Set Up PIN'}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowPinModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleChangePin}>
                  <div className="modal-body">
                    {pinError && (
                      <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <i className="fas fa-exclamation-circle me-2"></i>
                        {pinError}
                        <button 
                          type="button" 
                          className="btn-close" 
                          onClick={() => setPinError('')}
                        ></button>
                      </div>
                    )}

                    {pinSuccess && (
                      <div className="alert alert-success" role="alert">
                        <i className="fas fa-check-circle me-2"></i>
                        {pinSuccess}
                      </div>
                    )}

                    <div className="alert alert-info">
                      <i className="fas fa-info-circle me-2"></i>
                      Your PIN must be exactly 4 digits. You can use it for quick login instead of your password.
                    </div>

                    <div className="mb-3">
                      <label className="form-label">New PIN</label>
                      <input
                        type="password"
                        className="form-control form-control-lg text-center"
                        value={pinData.newPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setPinData({...pinData, newPin: value});
                        }}
                        placeholder="Enter 4-digit PIN"
                        maxLength={4}
                        pattern="\d{4}"
                        required
                        style={{ letterSpacing: '1rem', fontSize: '1.5rem' }}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Confirm PIN</label>
                      <input
                        type="password"
                        className="form-control form-control-lg text-center"
                        value={pinData.confirmPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setPinData({...pinData, confirmPin: value});
                        }}
                        placeholder="Confirm 4-digit PIN"
                        maxLength={4}
                        pattern="\d{4}"
                        required
                        style={{ letterSpacing: '1rem', fontSize: '1.5rem' }}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowPinModal(false)}
                      disabled={isChangingPin}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-warning"
                      disabled={isChangingPin}
                    >
                      {isChangingPin ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Setting...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check me-1"></i>
                          {user?.enable_pin_auth ? 'Update PIN' : 'Set PIN'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}
