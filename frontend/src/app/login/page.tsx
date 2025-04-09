'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!phoneNumber || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        phone_number: phoneNumber,
        password,
      });

      const { token, user_type, user_id } = response.data;
      
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_type', user_type);
      localStorage.setItem('user_id', user_id);

      router.push('/dashboard');
    } catch (err: any) {
      setIsLoading(false);
      const errorMessage = err.response?.data?.message || 'An error occurred. Please try again.';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{
      background: 'linear-gradient(135deg,rgb(3, 5, 86) 0%,rgb(2, 25, 92) 100%)'
    }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card border-0 shadow-lg overflow-hidden animate__animated animate__fadeIn">
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
                    <p className="lead">Empowering Women's Health Through Technology</p>
                  </div>
                </div>
                
                {/* Right Side - Login Form */}
                <div className="col-md-7">
                  <div className="card-body p-5">
                    <div className="text-center mb-5">
                      <h2 className="h3 fw-bold text-primary mb-3">Sign In</h2>
                      <p className="text-muted">Access your personalized health dashboard</p>
                    </div>

                    {error && (
                      <div className="alert alert-danger d-flex align-items-center" role="alert">
                        <i className="bi bi-exclamation-circle-fill me-2"></i>
                        <div>{error}</div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit}>
                      <div className="form-floating mb-4">
                        <input
                          type="tel"
                          className="form-control"
                          id="phoneNumber"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Enter phone number"
                          required
                        />
                        <label htmlFor="phoneNumber" className="text-muted">
                          <i className="bi bi-phone me-2"></i>Phone Number
                        </label>
                      </div>

                      <div className="form-floating mb-4">
                        <input
                          type="password"
                          className="form-control"
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                          required
                        />
                        <label htmlFor="password" className="text-muted">
                          <i className="bi bi-lock me-2"></i>Password
                        </label>
                      </div>

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
                              Authenticating...
                            </>
                          ) : (
                            'Login'
                          )}
                        </button>
                      </div>

                      <div className="text-center mb-4">
                        <Link 
                          href="/forgot-password" 
                          className="text-decoration-none text-muted small"
                        >
                          <i className="bi bi-question-circle me-1"></i>
                          Forgot Password?
                        </Link>
                      </div>

                      <div className="text-center small">
                        <span className="text-muted">New here? </span>
                        <Link 
                          href="/register" 
                          className="text-primary text-decoration-none fw-bold"
                        >
                          Create an Account
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