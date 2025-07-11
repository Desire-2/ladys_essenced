'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading, getDashboardRoute } = useAuth();
  const router = useRouter();

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (!loading && user) {
      const dashboardRoute = getDashboardRoute();
      router.push(dashboardRoute);
    }
  }, [user, loading, router, getDashboardRoute]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Only show home page if user is not logged in
  if (user) {
    return null; // Will redirect via useEffect
  }
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="hero-section position-relative" style={{
        background: 'linear-gradient(135deg, #0F4C81 0%, #1a365d 100%)',
        color: 'white',
        padding: '6rem 0'
      }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <h1 className="display-3 fw-bold mb-4 animate__animated animate__fadeInDown">
                The Lady's Essence
              </h1>
              <h2 className="h2 mb-4" style={{ color: '#F5B700' }}>
                <span className="typed-text">Empowering Women, Enhancing Lives</span>
              </h2>
              <p className="lead mb-5">
                Your comprehensive health companion offering menstrual tracking, pregnancy care, 
                and educational resources through mobile and USSD services.
              </p>
              <div className="d-flex gap-3">
                <Link href="/register" className="btn btn-accent btn-lg px-5 py-3 rounded-pill">
                  Get Started Free
                </Link>
                <Link href="/features" className="btn btn-outline-light btn-lg px-5 py-3 rounded-pill">
                  Learn More
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-illustration position-relative">
                <Image
                  src="/images/icons/log.png"
                  alt="Health Tracking"
                  width={600}
                  height={500}
                  className="img-fluid floating-animation"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-6 bg-light">
        <div className="container">
          <div className="text-center mb-6">
            <h2 className="display-5 fw-bold mb-4">Key Features</h2>
            <p className="lead text-muted">Comprehensive tools for holistic women's health management</p>
          </div>
          <div className="row g-4">
            {[
              { 
                icon: 'calendar',
                title: 'Cycle Tracking',
                text: 'Track your menstrual cycle with personalized insights and predictions.'
              },
              { 
                icon: 'nutrition',
                title: 'Nutrition Guidance',
                text: 'Personalized nutrition plans and meal tracking for optimal health.'
              },
              { 
                icon: 'appointment',
                title: 'Appointments',
                text: 'Manage your family&s health collectively with parental controls.'
              },
              { 
                icon: 'user',
                title: 'Family Dashboard',
                text: 'Schedule healthcare appointments and telehealth consultations.'
              }
            ].map((feature, index) => (
              <div key={index} className="col-md-6 col-lg-3">
                <div className="feature-card card h-100 border-0 shadow-lg hover-effect">
                  <div className="card-body p-4 text-center">
                    <div className="icon-wrapper mb-4">
                      <Image
                        src={`/images/icons/${feature.icon}.svg`}
                        alt={feature.title}
                        width={80}
                        height={80}
                      />
                    </div>
                    <h3 className="h5 fw-bold mb-3">{feature.title}</h3>
                    <p className="text-muted mb-0">{feature.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Platform Section */}
      <section className="py-6">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6 order-lg-1">
              <div className="platform-illustration">
                <Image
                  src="/images/others/ussd.png"
                  alt="Multi-Platform Access"
                  width={600}
                  height={250}
                  className="img-fluid"
                />
              </div>
            </div>
            <div className="col-lg-6">
              <h2 className="display-6 fw-bold mb-4">Access Anywhere, Anytime</h2>
              <p className="lead mb-4">
                Whether on the go or offline, The Lady's Essence is available on multiple platforms
                to ensure you never miss a beat in your health journey.
              </p>
              <p className="text-muted mb-4">
                Our platform is designed to be accessible for everyone, including those with limited
                internet access. With our USSD service, you can access essential features without
                needing a smartphone or internet connection.
              </p>

              <p className="text-muted mb-4">
                Our web and mobile applications are designed to provide a seamless experience,
                ensuring you have all the tools you need at your fingertips.
              </p>
              <div className="d-grid gap-4">
                {[
                  {icon: 'globe', text: 'Web & Mobile Applications'},
                  {icon: 'phone', text: 'USSD Service for Feature Phones'},
                  {icon: 'bell', text: 'SMS Reminders & Notifications'},
                  {icon: 'wifi-off', text: 'Offline Functionality'}
                ].map((item, index) => (
                  <div key={index} className="d-flex gap-3">
                    <div className="icon-box bg-primary text-white rounded-circle p-3">
                      <i className={`bi bi-${item.icon} fs-4`}></i>
                    </div>
                    <div>
                      <h3 className="h5 mb-0">{item.text}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-6 bg-gradient-primary">
        <div className="container">
          <div className="text-center mb-6">
            <h2 className="display-5 fw-bold text-black mb-4">User Stories</h2>
            <p className="lead text-light">Hear from our empowered community</p>
          </div>
          <div className="row g-4">
            {[
              {
                text: "The Lady's Essence transformed how I manage my health. The cycle tracking is incredibly accurate!",
                author: "Sarah M.",
                role: "User since 2023"
              },
              {
                text: "As a mother, the family dashboard helps me support my daughters' health journey.",
                author: "Rebecca T.",
                role: "Parent user"
              },
              {
                text: "The USSD service is a lifeline in my rural community with limited internet access.",
                author: "Grace K.",
                role: "USSD user"
              }
            ].map((testimonial, index) => (
              <div key={index} className="col-md-4">
                <div className="testimonial-card card h-100 border-0 shadow-lg">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-4">
                      <div className="avatar-placeholder rounded-circle me-3"></div>
                      <div>
                        <h3 className="h6 fw-bold mb-0">{testimonial.author}</h3>
                        <small className="text-muted">{testimonial.role}</small>
                      </div>
                    </div>
                    <p className="mb-0">"{testimonial.text}"</p>
                    <div className="quote-icon mt-4">
                      <i className="bi bi-quote fs-1 text-primary opacity-25"></i>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waiting List Section */}
      <section className="py-6 bg-gradient-waiting" style={{
        background: 'linear-gradient(135deg, #F5B700 0%, #ffd700 100%)',
        color: '#0F4C81'
      }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8 mx-auto text-center">
              <div className="d-inline-block p-4 rounded-3 shadow-lg bg-white">
                <h2 className="display-5 fw-bold mb-3">Join Our Early Access</h2>
                <p className="lead mb-4">
                  Be among the first to experience The Lady's Essence! Join our waiting list for
                  exclusive early access and updates.
                </p>
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLScaT-0gsJd3yDhqaxRjAGAK8GwmnsyYYw9L8z-1tlXBEvjm6A/viewform?usp=sharing"
                  className="btn btn-primary btn-lg px-5 py-3 rounded-pill"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-arrow-right-circle-fill me-2"></i>
                  Join Waiting List
                </a>
              </div>
              <div className="mt-4 text-white">
                <small>Limited spots available - Priority access for early signups</small>
              </div>
            </div>
          </div>
        </div>
      </section>


      
      {/* Pricing Section */}
      <section className="py-6">
        <div className="container">
          <div className="text-center mb-6">
            <h2 className="display-5 fw-bold mb-4">Flexible Plans</h2>
            <p className="lead text-muted">Choose the perfect plan for your needs</p>
          </div>
          <div className="row g-4">
            {[
              {
                title: 'Basic',
                price: 'Free',
                features: ['Basic Cycle Tracking', 'Community Access', 'Limited Content'],
                accent: false
              },
              {
                title: 'Menstrual Health',
                price: '$5/year',
                features: ['Advanced Tracking', 'Health Insights', 'Full Content', 'Priority Support'],
                accent: true
              },
              {
                title: 'Family Support',
                price: '$3/month',
                features: ['Family Dashboard', 'Premium Content', 'Emergency Support', 'Health Management'],
                accent: false
              }
            ].map((plan, index) => (
              <div key={index} className="col-lg-4">
                <div className={`pricing-card card h-100 border-0 ${plan.accent ? 'bg-primary text-white' : 'shadow-lg'} hover-effect`}>
                  <div className="card-body p-4">
                    <div className="text-center mb-4">
                      <h3 className="h2 fw-bold mb-2">{plan.title}</h3>
                      <div className="price-display mb-4">
                        <span className="display-4 fw-bold">{plan.price}</span>
                      </div>
                    </div>
                    <ul className="list-unstyled mb-4">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="d-flex align-items-center mb-3">
                          <i className={`bi bi-check2-circle me-2 ${plan.accent ? 'text-white' : 'text-primary'}`}></i>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    
                    <div className="text-center mt-auto">
                      <Link href="/register" className={`btn btn-lg ${plan.accent ? 'btn-light' : 'btn-primary'} rounded-pill px-5`}>
                        Get Started
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      

      {/* CTA Section */}
      <section className="cta-section py-6" style={{
        background: 'linear-gradient(135deg, #0F4C81 0%, #1a365d 100%)',
        color: 'white'
      }}>
        <div className="container text-center">
          <div className="mx-auto" style={{ maxWidth: '800px' }}>
            <h2 className="display-5 fw-bold mb-4">Start Your Health Journey Today</h2>
            <p className="lead mb-5">Join thousands of women taking control of their health with personalized insights</p>
            <div className="d-flex gap-3 justify-content-center">
              <Link href="/register" className="btn btn-accent btn-lg px-5 py-3 rounded-pill">
                Get Started Free
              </Link>
              <Link href="/features" className="btn btn-outline-light btn-lg px-5 py-3 rounded-pill">
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}