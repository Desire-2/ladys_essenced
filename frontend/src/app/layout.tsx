'use client';

import { ReactNode, useEffect } from 'react';
import { Inter } from 'next/font/google';
import { AppProviders } from '../contexts';
import { useAuth } from '../contexts/AuthContext';
import '../styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const inter = Inter({ subsets: ['latin'] });

interface RootLayoutProps {
  children: ReactNode;
}

// Navigation component that uses auth context
function NavigationMenu() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
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

  return (
    <>
      <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
        <li className="nav-item mx-2">
          <a className="nav-link text-black position-relative hover-underline" href="/">
            Home
          </a>
        </li>
        <li className="nav-item mx-2">
          <a className="nav-link text-black position-relative hover-underline" href="/about">
            About
          </a>
        </li>
        {user && (
          <li className="nav-item mx-2">
            <a className="nav-link text-black position-relative hover-underline" href={getDashboardLink()}>
              Dashboard
            </a>
          </li>
        )}
      </ul>
      
      <div className="d-flex ms-lg-4">
        {user ? (
          <div className="d-flex align-items-center">
            <div className="dropdown">
              <button
                className="btn btn-outline-primary dropdown-toggle d-flex align-items-center"
                type="button"
                id="userDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fas fa-user-circle me-2"></i>
                {user.full_name || user.name || user.email}
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                <li>
                  <a className="dropdown-item" href={getDashboardLink()}>
                    <i className="fas fa-tachometer-alt me-2"></i>
                    Dashboard
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/profile">
                    <i className="fas fa-user-edit me-2"></i>
                    Profile
                  </a>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <a href="/login" className="btn btn-outline-light text-primary btn-hover-effect me-2">
              Login
            </a>
            <a href="/register" className="btn btn-light text-primary btn-hover-effect">
              Register
            </a>
          </>
        )}
      </div>
    </>
  );
}

export default function RootLayout({ children }: RootLayoutProps) {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>The Lady's Essence</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={inter.className}>
        <AppProviders>
          {/* Enhanced Header */}
          <header className="sticky-top">
            <nav className="navbar navbar-expand-lg navbar-dark bg-gradient-primary shadow-sm" style={{
              background: 'linear-gradient(135deg,rgb(250, 247, 248) 0%,rgb(249, 243, 246) 100%)'
            }}>
              <div className="container">
                <a className="navbar-brand" href="/">
                  <div className="d-flex align-items-center">
                    <img
                      src="/images/icons/logo.svg"
                      alt="The Lady's Essence"
                      className="brand-logo me-2"
                      height="50"
                    />
                    <span className="h3 mb-0 fw-bold text-uppercase brand-name text-black">
                      Lady's Essence
                    </span>
                  </div>
                </a>
                
                <button
                  className="navbar-toggler bg-dark navbar-toggler-custom"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#navbarNav"
                >
                  <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                  <NavigationMenu />
                </div>
              </div>
            </nav>
          </header>

          {/* Main Content with Gradient Background */}
          <main className="py-5" style={{
            background: 'linear-gradient(to bottom right,rgb(4, 37, 110) 0%, #fff 100%)',
            minHeight: 'calc(100vh - 160px)'
          }}>
            <div className="container mt-4 mb-5">
              <div className="bg-white rounded-4 shadow-sm p-4 p-md-5">
                {children}
              </div>
            </div>
          </main>

          {/* Enhanced Footer */}
          <footer className="footer bg-dark text-light pt-5 mt-auto">
            <div className="container">
              <div className="row g-4 pb-4">
                <div className="col-lg-4 mb-4">
                  <div className="footer-brand d-flex align-items-center mb-3">
                    <img
                      src="/images/icons/logo.svg"
                      alt="Logo"
                      className="me-3"
                      height="40"
                    />
                    <h3 className="h5 mb-0 text-white">Lady's Essence</h3>
                  </div>
                  <p className="text-muted">
                    Empowering women through holistic health management and community support.
                  </p>
                  <div className="social-icons mt-4">
                    <a href="#" className="text-light me-3">
                      <i className="fab fa-facebook fa-lg"></i>
                    </a>
                    <a href="#" className="text-light me-3">
                      <i className="fab fa-twitter fa-lg"></i>
                    </a>
                    <a href="#" className="text-light me-3">
                      <i className="fab fa-instagram fa-lg"></i>
                    </a>
                    <a href="#" className="text-light">
                      <i className="fab fa-linkedin fa-lg"></i>
                    </a>
                  </div>
                </div>

                <div className="col-lg-2 col-md-4 mb-4">
                  <h5 className="text-uppercase text-primary mb-3">Quick Links</h5>
                  <ul className="list-unstyled">
                    {['Home', 'About', 'Features', 'Contact'].map((item) => (
                      <li key={item} className="mb-2">
                        <a href={`/${item.toLowerCase()}`} className="text-light text-decoration-none hover-underline">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="col-lg-3 col-md-4 mb-4">
                  <h5 className="text-uppercase text-primary mb-3">Resources</h5>
                  <ul className="list-unstyled">
                    {['Blog', 'Help Center', 'Privacy Policy', 'Terms of Service'].map((item) => (
                      <li key={item} className="mb-2">
                        <a href="#" className="text-light text-decoration-none hover-underline">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="col-lg-3 col-md-4 mb-4">
                  <h5 className="text-uppercase text-primary mb-3">Contact</h5>
                  <ul className="list-unstyled">
                    <li className="mb-3">
                      <i className="fas fa-envelope me-2 text-primary"></i>
                      ladysessence1@gmail.com
                    </li>
                    <li className="mb-3">
                      <i className="fas fa-phone me-2 text-primary"></i>
                      +250-780-784-924
                    </li>
                    <li className="mb-3">
                      <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                      Kigali, Rwanda
                    </li>
                  </ul>
                </div>
              </div>

              <div className="footer-bottom border-top border-dark pt-4">
                <div className="row">
                  <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
                    <p className="mb-0 text-muted">
                      &copy; {new Date().getFullYear()} Lady's Essence. All rights reserved.
                    </p>
                  </div>
                  <div className="col-md-6 text-center text-md-end">
                    <div className="d-inline-flex">
                      <a href="#" className="text-muted me-3 hover-underline">Privacy Policy</a>
                      <a href="#" className="text-muted hover-underline">Terms of Use</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}