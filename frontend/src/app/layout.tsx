'use client';

import { ReactNode, useEffect } from 'react';
import { Inter } from 'next/font/google';
import { AppProviders } from '../contexts';
import '../styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const inter = Inter({ subsets: ['latin'] });

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  // Load Bootstrap JS on client side
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/css/styles.css" />
        <script src="/js/main.js" defer></script>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>The Lady's Essence</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        {/* Header */}
        <header>
          <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
            <div className="container">
              {/* Branding: Logo + Company Name with Divider */}
              <a className="navbar-brand" href="/">
                <div className="d-flex align-items-center">
                  <img
                    src="/images/icons/logo.svg"
                    alt="The Lady's Essence"
                    className="brand-logo"
                    height="40"
                  />
                  <div className="ms-3 ps-3 border-start">
                    <span className="fw-bold text-uppercase brand-name">Lady's Essence</span>
                  </div>
                </div>
              </a>
              {/* Toggler Button */}
              <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarNav"
                aria-controls="navbarNav"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
              {/* Navigation Items & Authentication Buttons with Extra Left Margin */}
              <div
                className="collapse navbar-collapse justify-content-end ms-lg-5"
                id="navbarNav"
              >
                <ul className=" navbar-nav me-rg mb-4 mb-lg-11">
                  <li className="nav-item">
                    <a className="nav-link active" aria-current="page" href="/">
                      Home
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="/about">
                      About
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="/features">
                      Features
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="/pricing">
                      Pricing
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="/contact">
                      Contact
                    </a>
                  </li>
                </ul>
                <div className="d-flex align-items-center">
                  <a href="/login" className="btn btn-outline-primary me-2">
                    Login
                  </a>
                  <a href="/register" className="btn btn-primary">
                    Register
                  </a>
                </div>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="py-4">
          <AppProviders>{children}</AppProviders>
        </main>

        {/* Footer */}
        <footer className="footer bg-dark text-light pt-5">
          <div className="container">
            <div className="row pb-4">
              <div className="col-md-6 col-lg-4 mb-3">
                <div className="footer-logo mb-2">
                  <img src="/images/icons/logo.svg" alt="The Lady's Essence" height="40" />
                </div>
                <p>
                  Empowering Women, Enhancing Lives through personalized health insights, SMS
                  reminders, and culturally sensitive content.
                </p>
              </div>
              <div className="col-md-6 col-lg-2 mb-3">
                <h4 className="footer-heading mb-3">Quick Links</h4>
                <ul className="list-unstyled">
                  <li>
                    <a href="/" className="text-light text-decoration-none">
                      Home
                    </a>
                  </li>
                  <li>
                    <a href="/about" className="text-light text-decoration-none">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="/features" className="text-light text-decoration-none">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="/pricing" className="text-light text-decoration-none">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="/contact" className="text-light text-decoration-none">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-md-6 col-lg-3 mb-3">
                <h4 className="footer-heading mb-3">Features</h4>
                <ul className="list-unstyled">
                  <li>
                    <a
                      href="/features#cycle-tracking"
                      className="text-light text-decoration-none"
                    >
                      Cycle Tracking
                    </a>
                  </li>
                  <li>
                    <a
                      href="/features#pregnancy-care"
                      className="text-light text-decoration-none"
                    >
                      Pregnancy Care
                    </a>
                  </li>
                  <li>
                    <a
                      href="/features#family-support"
                      className="text-light text-decoration-none"
                    >
                      Family Support
                    </a>
                  </li>
                  <li>
                    <a href="/features#nutrition" className="text-light text-decoration-none">
                      Nutrition Guidance
                    </a>
                  </li>
                  <li>
                    <a
                      href="/features#appointments"
                      className="text-light text-decoration-none"
                    >
                      Appointments
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-md-6 col-lg-3 mb-3">
                <h4 className="footer-heading mb-3">Contact Us</h4>
                <ul className="list-unstyled">
                  <li>Email: ladysessence1@gmail.com
                  </li>
                  <li>Phone: +250-780-784-924</li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom border-top border-secondary pt-3">
              <p className="mb-0 text-center">
                &copy; {new Date().getFullYear()} The Lady's Essence. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}