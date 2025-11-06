'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [usePin, setUsePin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, getDashboardRoute } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!phoneNumber) {
      setError('Please enter phone number');
      setIsLoading(false);
      return;
    }

    if (usePin) {
      if (!pin) {
        setError('Please enter PIN');
        setIsLoading(false);
        return;
      }
      if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        setError('PIN must be exactly 4 digits');
        setIsLoading(false);
        return;
      }
    } else {
      if (!password) {
        setError('Please enter password');
        setIsLoading(false);
        return;
      }
    }

    try {
      const loginData: any = {
        phone_number: phoneNumber
      };

      if (usePin) {
        loginData.pin = pin;
      } else {
        loginData.password = password;
      }

      const result = await login(loginData);

      if (result.success) {
        const dashboardRoute = getDashboardRoute();
        setTimeout(() => {
          router.push(dashboardRoute);
        }, 300);
      } else {
        setError(result.error || 'An error occurred. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred during login.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{
      background: 'linear-gradient(135deg, rgb(3, 5, 86) 0%, rgb(2, 25, 92) 100%)'
    }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8">
            <div className="card border-0 shadow-lg overflow-hidden">
              <div className="row g-0">
                {/* Left Side - Branding */}
                <div className="col-md-5 d-none d-md-block bg-primary text-white p-5">
                  <div className="d-flex flex-column h-100 justify-content-center">
                    <img 
                      src="/images/icons/log.png" 
                      alt="Logo" 
                      className="img-fluid mb-4"
                      style={{ maxWidth: '120px' }}
                    />
                    <h2 className="h1 fw-bold mb-3">Welcome Back</h2>
                    <p className="lead mb-5">Empowering Women's Health Through Technology</p>
                    
                    {/* Benefits List */}
                    <div className="mt-4">
                      <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-shield-check fs-5 me-3"></i>
                        <span>Secure Access</span>
                      </div>
                      <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-clock-history fs-5 me-3"></i>
                        <span>Track Health Data</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-people fs-5 me-3"></i>
                        <span>Family Support</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Side - Login Form */}
                <div className="col-md-7">
                  <div className="card-body p-5">
                    {/* Header */}
                    <div className="text-center mb-4">
                      <h2 className="h3 fw-bold text-primary mb-2">Sign In</h2>
                      <p className="text-muted small">Access your personalized health dashboard</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                      <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                        <i className="bi bi-exclamation-circle-fill me-2 flex-shrink-0"></i>
                        <div>{error}</div>
                      </div>
                    )}

                    {/* Info Alert for Parents */}
                    <div className="alert alert-light border border-primary-subtle mb-4" style={{ backgroundColor: '#f0f7ff' }}>
                      <div className="d-flex">
                        <i className="bi bi-info-circle-fill text-primary me-2 flex-shrink-0 mt-1"></i>
                        <div className="small">
                          <strong className="text-primary">Parent Users:</strong> You'll access a dedicated dashboard to monitor and manage your children's health information.
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                      {/* Phone Number Input */}
                      <div className="mb-4">
                        <label htmlFor="phoneNumber" className="form-label fw-500 text-dark mb-2">
                          <i className="bi bi-phone me-2 text-primary"></i>Phone Number
                        </label>
                        <input
                          type="tel"
                          className="form-control form-control-lg"
                          id="phoneNumber"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Enter your phone number"
                          required
                        />
                      </div>

                      {/* Authentication Method Selection */}
                      <div className="mb-4">
                        <label className="form-label fw-500 text-dark mb-3">
                          <i className="bi bi-shield-check me-2 text-primary"></i>Authentication Method
                        </label>
                        <div className="d-grid gap-2">
                          {/* Password Option */}
                          <button
                            type="button"
                            className={`btn btn-outline-primary btn-lg text-start p-3 d-flex align-items-center justify-content-between transition ${
                              !usePin ? 'border-2 border-primary bg-primary-subtle' : ''
                            }`}
                            onClick={() => {
                              setUsePin(false);
                              setPin('');
                              setShowPassword(false);
                            }}
                            style={{
                              borderColor: !usePin ? 'var(--bs-primary)' : undefined,
                              backgroundColor: !usePin ? '#f0f7ff' : 'transparent'
                            }}
                          >
                            <div>
                              <div className="fw-bold text-dark">
                                <i className="bi bi-lock-fill me-2"></i>Password
                              </div>
                              <small className="text-muted">Sign in with your password</small>
                            </div>
                            {!usePin && (
                              <span className="badge bg-primary rounded-circle" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="bi bi-check2"></i>
                              </span>
                            )}
                          </button>

                          {/* PIN Option */}
                          <button
                            type="button"
                            className={`btn btn-outline-primary btn-lg text-start p-3 d-flex align-items-center justify-content-between transition ${
                              usePin ? 'border-2 border-primary bg-primary-subtle' : ''
                            }`}
                            onClick={() => {
                              setUsePin(true);
                              setPassword('');
                              setShowPassword(false);
                            }}
                            style={{
                              borderColor: usePin ? 'var(--bs-primary)' : undefined,
                              backgroundColor: usePin ? '#f0f7ff' : 'transparent'
                            }}
                          >
                            <div>
                              <div className="fw-bold text-dark">
                                <i className="bi bi-shield-check me-2"></i>4-Digit PIN
                              </div>
                              <small className="text-muted">Quick access on any device</small>
                            </div>
                            {usePin && (
                              <span className="badge bg-primary rounded-circle" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="bi bi-check2"></i>
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Conditional Input - Password */}
                      {!usePin && (
                        <div className="mb-4 animate__animated animate__fadeIn">
                          <label htmlFor="password" className="form-label fw-500 text-dark mb-2">
                            <i className="bi bi-lock me-2 text-primary"></i>Password
                          </label>
                          <div className="input-group input-group-lg">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className="form-control"
                              id="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your password"
                              required={!usePin}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{ borderColor: '#0d6efd', backgroundColor: '#ffffff' }}
                            >
                              <i className={`bi bi-eye${showPassword ? '-slash' : ''}`} style={{ color: '#000000', fontSize: '1.3rem', fontWeight: 'bold' }}></i>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Conditional Input - PIN */}
                      {usePin && (
                        <div className="mb-4 animate__animated animate__fadeIn">
                          <label htmlFor="pin" className="form-label fw-500 text-dark mb-2">
                            <i className="bi bi-shield-check me-2 text-primary"></i>4-Digit PIN
                          </label>
                          <div className="input-group input-group-lg">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className="form-control text-center"
                              id="pin"
                              value={pin}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                setPin(value);
                              }}
                              placeholder="• • • •"
                              maxLength={4}
                              pattern="\d{4}"
                              required={usePin}
                              inputMode="numeric"
                            />
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{ borderColor: '#0d6efd', backgroundColor: '#ffffff' }}
                            >
                              <i className={`bi bi-eye${showPassword ? '-slash' : ''}`} style={{ color: '#000000', fontSize: '1.3rem', fontWeight: 'bold' }}></i>
                            </button>
                          </div>
                          <div className="mt-2">
                            <div className="d-flex gap-2 justify-content-center">
                              {[0, 1, 2, 3].map((index) => (
                                <div
                                  key={index}
                                  className="rounded-circle"
                                  style={{
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: pin.length > index ? '#0d6efd' : '#e9ecef',
                                    transition: 'background-color 0.2s ease'
                                  }}
                                ></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Submit Button */}
                      <div className="d-grid gap-2 mb-4">
                        <button 
                          type="submit" 
                          className="btn btn-primary btn-lg rounded-pill fw-bold"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <span 
                                className="spinner-border spinner-border-sm me-2" 
                                role="status" 
                                aria-hidden="true"
                              ></span>
                              Authenticating...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-box-arrow-in-right me-2"></i>
                              Sign In
                            </>
                          )}
                        </button>
                      </div>

                      {/* Forgot Password Link */}
                      <div className="text-center mb-4">
                        <Link 
                          href="/forgot-password" 
                          className="text-decoration-none text-primary fw-500 small"
                        >
                          <i className="bi bi-question-circle me-1"></i>
                          Forgot Password?
                        </Link>
                      </div>

                      {/* Sign Up Link */}
                      <div className="border-top pt-4 text-center">
                        <p className="text-muted mb-0 small">
                          Don't have an account?{' '}
                          <Link 
                            href="/register" 
                            className="text-primary text-decoration-none fw-bold"
                          >
                            Create Account
                          </Link>
                        </p>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges - Below Card */}
            <div className="row mt-4 px-3">
              <div className="col-4 text-center">
                <div className="text-white small">
                  <i className="bi bi-shield-check fs-5 d-block mb-2"></i>
                  <span style={{ fontSize: '0.8rem' }}>Secure & Encrypted</span>
                </div>
              </div>
              <div className="col-4 text-center">
                <div className="text-white small">
                  <i className="bi bi-lock fs-5 d-block mb-2"></i>
                  <span style={{ fontSize: '0.8rem' }}>Privacy Protected</span>
                </div>
              </div>
              <div className="col-4 text-center">
                <div className="text-white small">
                  <i className="bi bi-check-circle fs-5 d-block mb-2"></i>
                  <span style={{ fontSize: '0.8rem' }}>Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}