'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [userType, setUserType] = useState('parent');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name || !phoneNumber || !password || !confirmPassword) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const result = await register({
        user_type: userType,
        name,
        phone_number: phoneNumber,
        password
      });

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{
      background: 'linear-gradient(135deg,rgb(2, 8, 54) 0%,rgb(1, 12, 46) 100%)'
    }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8">
            <div className="card border-0 shadow-lg overflow-hidden">
              <div className="row g-0">
                {/* Branding Side */}
                <div className="col-md-5 d-none d-md-block bg-primary text-white p-5">
                  <div className="d-flex flex-column h-100 justify-content-center">
                    <img 
                      src="/images/icons/log.png" 
                      alt="Logo" 
                      className="img-fluid mb-4"
                      style={{ maxWidth: '120px' }}
                    />
                    <h2 className="h1 fw-bold mb-3">Join Our Community</h2>
                    <p className="lead">
                      Empower your health journey with personalized tracking and support
                    </p>
                    <div className="mt-4">
                      <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-check2-circle fs-4 me-3"></i>
                        <span>Secure & Private</span>
                      </div>
                      <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-heart-pulse fs-4 me-3"></i>
                        <span>Personalized Health Insights</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-people fs-4 me-3"></i>
                        <span>Family Support Features</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registration Form */}
                <div className="col-md-7">
                  <div className="card-body p-5">
                    <div className="text-center mb-5">
                      <h2 className="h3 fw-bold text-primary mb-3">Create Account</h2>
                      <p className="text-muted">Start your personalized health journey</p>
                    </div>

                    {error && (
                      <div className="alert alert-danger d-flex align-items-center" role="alert">
                        <i className="bi bi-exclamation-circle-fill me-2"></i>
                        <div>{error}</div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit}>
                      {/* User Type Selection */}
                      <div className="mb-4">
                        <label className="form-label text-muted">I am registering as:</label>
                        <div className="d-grid gap-3">
                          <button
                            type="button"
                            className={`btn btn-outline-primary btn-lg text-start p-3 ${
                              userType === 'parent' ? 'active' : ''
                            }`}
                            onClick={() => setUserType('parent')}
                          >
                            <i className="bi bi-person-badge me-2"></i>
                            <div>
                              <h5 className="mb-1">Parent/Guardian</h5>
                              <small className="text-muted">Manage family health profiles</small>
                            </div>
                          </button>
                          <button
                            type="button"
                            className={`btn btn-outline-primary btn-lg text-start p-3 ${
                              userType === 'adolescent' ? 'active' : ''
                            }`}
                            onClick={() => setUserType('adolescent')}
                          >
                            <i className="bi bi-person-heart me-2"></i>
                            <div>
                              <h5 className="mb-1">Adolescent</h5>
                              <small className="text-muted">Track personal health & growth</small>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Name Input */}
                      <div className="form-floating mb-4">
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full Name"
                          required
                        />
                        <label htmlFor="name" className="text-muted">
                          <i className="bi bi-person-circle me-2"></i>Full Name
                        </label>
                      </div>

                      {/* Phone Number Input */}
                      <div className="form-floating mb-4">
                        <input
                          type="tel"
                          className="form-control"
                          id="phoneNumber"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Phone Number"
                          required
                        />
                        <label htmlFor="phoneNumber" className="text-muted">
                          <i className="bi bi-phone me-2"></i>Phone Number
                        </label>
                      </div>

                      {/* Password Input */}
                      <div className="form-floating mb-4">
                        <div className="input-group">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="form-control"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                          </button>
                        </div>
                        <label htmlFor="password" className="text-muted">
                          <i className="bi bi-lock me-2"></i>
                        </label>
                        <div className="password-strength mt-2">
                          <div className="progress" style={{ height: '4px' }}>
                            <div 
                              className="progress-bar" 
                              style={{ width: `${Math.min(password.length * 10, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Confirm Password Input */}
                      <div className="form-floating mb-4">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-control"
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm Password"
                          required
                        />
                        <label htmlFor="confirmPassword" className="text-muted">
                          <i className="bi bi-shield-lock me-2"></i>Confirm Password
                        </label>
                      </div>

                      {/* Submit Button */}
                      <div className="d-grid mb-4">
                        <button 
                          type="submit" 
                          className="btn btn-primary btn-lg rounded-pill"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <span 
                                className="spinner-border spinner-border-sm me-2" 
                                role="status" 
                                aria-hidden="true"
                              ></span>
                              Creating Account...
                            </>
                          ) : (
                            'Register Now'
                          )}
                        </button>
                      </div>

                      {/* Login Link */}
                      <div className="text-center small">
                        <span className="text-muted">Already have an account? </span>
                        <Link 
                          href="/login" 
                          className="text-primary text-decoration-none fw-bold"
                        >
                          Sign In Here
                        </Link>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}