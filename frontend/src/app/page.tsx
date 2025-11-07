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
      {/* Hero Section with Sliding Background Images */}
      <section className="hero-section position-relative" style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        {/* Sliding Background Images */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0
        }}>
          {/* Image 1 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            animation: 'heroSlide1 30s ease-in-out infinite',
            opacity: 1
          }}>
            <Image
              src="/images/others/1.jpg"
              alt="Health Background 1"
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center'
              }}
              priority
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(15,76,129,0.85) 0%, rgba(26,54,93,0.9) 100%)'
            }}></div>
          </div>

          {/* Image 2 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            animation: 'heroSlide2 30s ease-in-out infinite'
          }}>
            <Image
              src="/images/others/2.jpg"
              alt="Health Background 2"
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(15,76,129,0.85) 0%, rgba(26,54,93,0.9) 100%)'
            }}></div>
          </div>

          {/* Image 3 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            animation: 'heroSlide3 30s ease-in-out infinite'
          }}>
            <Image
              src="/images/others/3.jpg"
              alt="Health Background 3"
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(15,76,129,0.85) 0%, rgba(26,54,93,0.9) 100%)'
            }}></div>
          </div>

          {/* Image 4 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            animation: 'heroSlide4 30s ease-in-out infinite'
          }}>
            <Image
              src="/images/others/4.jpg"
              alt="Health Background 4"
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(15,76,129,0.85) 0%, rgba(26,54,93,0.9) 100%)'
            }}></div>
          </div>

          {/* Image 5 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            animation: 'heroSlide5 30s ease-in-out infinite'
          }}>
            <Image
              src="/images/others/5.jpg"
              alt="Health Background 5"
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(15,76,129,0.85) 0%, rgba(26,54,93,0.9) 100%)'
            }}></div>
          </div>

          {/* Image 6 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            animation: 'heroSlide6 30s ease-in-out infinite'
          }}>
            <Image
              src="/images/others/6.jpg"
              alt="Health Background 6"
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(15,76,129,0.85) 0%, rgba(26,54,93,0.9) 100%)'
            }}></div>
          </div>

          {/* Image 7 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            animation: 'heroSlide7 30s ease-in-out infinite'
          }}>
            <Image
              src="/images/others/7.jpg"
              alt="Health Background 7"
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(15,76,129,0.85) 0%, rgba(26,54,93,0.9) 100%)'
            }}></div>
          </div>

          {/* Image 8 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            animation: 'heroSlide8 30s ease-in-out infinite'
          }}>
            <Image
              src="/images/others/8.jpg"
              alt="Health Background 8"
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(15,76,129,0.85) 0%, rgba(26,54,93,0.9) 100%)'
            }}></div>
          </div>

          {/* Image 9 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            animation: 'heroSlide9 30s ease-in-out infinite'
          }}>
            <Image
              src="/images/others/hero-woman.jpg"
              alt="Empowered Woman Background"
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(15,76,129,0.85) 0%, rgba(26,54,93,0.9) 100%)'
            }}></div>
          
          </div>
        </div>

        {/* Content overlay */}
        <div className="container" style={{ position: 'relative', zIndex: 1, color: 'white' }}>
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <div className="hero-content">
                <h1 className="display-3 display-md-4 display-sm-5 fw-bold mb-3 mb-md-4" style={{
                  animation: 'fadeInUp 0.8s ease-out',
                  lineHeight: '1.2'
                }}>
                  The Lady's Essence
                </h1>
                <h2 className="h2 h3-md h4-sm mb-3 mb-md-4" style={{ 
                  color: '#F5B700',
                  animation: 'fadeInUp 0.8s ease-out 0.2s backwards'
                }}>
                  <span className="typed-text">Empowering Women, Enhancing Lives</span>
                </h2>
                <p className="lead fs-5 fs-6-sm mb-4 mb-md-5" style={{
                  animation: 'fadeInUp 0.8s ease-out 0.4s backwards',
                  maxWidth: '600px'
                }}>
                  Your comprehensive health companion offering menstrual tracking, pregnancy care, 
                  and educational resources through mobile and USSD services.
                </p>
                <div className="d-flex flex-column flex-sm-row gap-3" style={{
                  animation: 'fadeInUp 0.8s ease-out 0.6s backwards'
                }}>
                  <Link href="/register" className="btn btn-accent btn-lg px-4 px-md-5 py-3 rounded-pill shadow-lg">
                    <i className="bi bi-rocket-takeoff me-2"></i>
                    Get Started Free
                  </Link>
                  <Link href="/features" className="btn btn-outline-light btn-lg px-4 px-md-5 py-3 rounded-pill">
                    <i className="bi bi-play-circle me-2"></i>
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-illustration position-relative" style={{
                animation: 'fadeInRight 1s ease-out 0.4s backwards',
                minHeight: '500px'
              }}>
                {/* Animated background glow circles */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '120%',
                  height: '120%',
                  background: 'radial-gradient(circle, rgba(245,183,0,0.2) 0%, transparent 70%)',
                  borderRadius: '50%',
                  animation: 'pulseGlow 4s ease-in-out infinite',
                  zIndex: 0
                }}></div>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '100%',
                  height: '100%',
                  background: 'radial-gradient(circle, rgba(54,179,126,0.15) 0%, transparent 70%)',
                  borderRadius: '50%',
                  animation: 'pulseGlow 4s ease-in-out infinite 2s',
                  zIndex: 0
                }}></div>
                
                {/* Creative Image Series - Stacked Cards Style */}
                <div style={{
                  position: 'relative',
                  height: '500px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Image 1 - Background (USSD) */}
                  <div style={{
                    position: 'absolute',
                    top: '10%',
                    left: '5%',
                    width: '280px',
                    height: '320px',
                    zIndex: 1,
                    animation: 'floatCard1 7s ease-in-out infinite',
                    transformStyle: 'preserve-3d'
                  }}>
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                      border: '3px solid rgba(245,183,0,0.3)',
                      background: 'linear-gradient(135deg, rgba(245,183,0,0.1) 0%, transparent 100%)'
                    }}>
                      <Image
                        src="/images/others/3.jpg"
                        alt="USSD Service"
                        width={280}
                        height={320}
                        className="img-fluid"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'brightness(0.95)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Image 2 - Middle (Hero Woman) */}
                  <div style={{
                    position: 'absolute',
                    top: '5%',
                    right: '5%',
                    width: '300px',
                    height: '340px',
                    zIndex: 2,
                    animation: 'floatCard2 6s ease-in-out infinite 0.5s',
                    transformStyle: 'preserve-3d'
                  }}>
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      boxShadow: '0 25px 70px rgba(0,0,0,0.35)',
                      border: '3px solid rgba(54,179,126,0.4)',
                      background: 'linear-gradient(135deg, rgba(54,179,126,0.1) 0%, transparent 100%)'
                    }}>
                      <Image
                        src="/images/others/hero-woman.jpg"
                        alt="Empowered Woman"
                        width={300}
                        height={340}
                        className="img-fluid"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        priority
                      />
                    </div>
                  </div>

                  {/* Image 3 - Front (Main) */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '320px',
                    height: '360px',
                    zIndex: 3,
                    animation: 'floatCard3 5.5s ease-in-out infinite 1s',
                    transformStyle: 'preserve-3d'
                  }}>
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
                      border: '4px solid rgba(255,255,255,0.2)',
                      background: 'linear-gradient(135deg, rgba(15,76,129,0.1) 0%, transparent 100%)'
                    }}>
                      <Image
                        src="/images/others/1.jpg"
                        alt="Health Tracking"
                        width={320}
                        height={360}
                        className="img-fluid"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'brightness(1.05)'
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Decorative floating elements */}
                <div style={{
                  position: 'absolute',
                  top: '10%',
                  right: '10%',
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #F5B700 0%, #FFCA33 100%)',
                  borderRadius: '50%',
                  boxShadow: '0 8px 20px rgba(245,183,0,0.4)',
                  animation: 'orbitSlow 8s linear infinite',
                  zIndex: 4
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '15%',
                  left: '5%',
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #36B37E 0%, #5AC79A 100%)',
                  borderRadius: '50%',
                  boxShadow: '0 6px 16px rgba(54,179,126,0.4)',
                  animation: 'orbitReverse 10s linear infinite',
                  zIndex: 4
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-5 py-md-6 bg-light">
        <div className="container">
          <div className="text-center mb-5 mb-md-6">
            <h2 className="display-5 display-6-sm fw-bold mb-3 mb-md-4" style={{
              color: 'var(--primary)'
            }}>
              Key Features
            </h2>
            <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
              Comprehensive tools for holistic women's health management
            </p>
          </div>
          <div className="row g-3 g-md-4">
            {[
              { 
                icon: 'calendar',
                title: 'Cycle Tracking',
                text: 'Track your menstrual cycle with personalized insights and predictions.',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              },
              { 
                icon: 'nutrition',
                title: 'Nutrition Guidance',
                text: 'Personalized nutrition plans and meal tracking for optimal health.',
                gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              },
              { 
                icon: 'appointment',
                title: 'Appointments',
                text: 'Schedule healthcare appointments and telehealth consultations.',
                gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
              },
              { 
                icon: 'user',
                title: 'Family Dashboard',
                text: 'Manage your family\'s health collectively with parental controls.',
                gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
              }
            ].map((feature, index) => (
              <div key={index} className="col-sm-6 col-lg-3">
                <div className="feature-card card h-100 border-0 shadow-sm" style={{
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`
                }}>
                  <div className="card-body p-3 p-md-4 text-center">
                    <div className="icon-wrapper mb-3 mb-md-4 mx-auto d-flex align-items-center justify-content-center" style={{
                      width: '80px',
                      height: '80px',
                      background: feature.gradient,
                      borderRadius: '20px',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }}>
                      <Image
                        src={`/images/icons/${feature.icon}.svg`}
                        alt={feature.title}
                        width={50}
                        height={50}
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                    </div>
                    <h3 className="h5 h6-sm fw-bold mb-2 mb-md-3" style={{ color: 'var(--primary)' }}>
                      {feature.title}
                    </h3>
                    <p className="text-muted mb-0 small">
                      {feature.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Platform Section */}
      <section className="py-5 py-md-6">
        <div className="container">
          <div className="row g-4 g-lg-5 align-items-center">
            <div className="col-lg-6 order-lg-2 mb-4 mb-lg-0">
              <div className="platform-illustration" style={{
                animation: 'fadeInLeft 1s ease-out'
              }}>
                <Image
                  src="/images/others/ussd.png"
                  alt="Multi-Platform Access"
                  width={600}
                  height={250}
                  className="img-fluid rounded-4 shadow-lg"
                  style={{
                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.2))'
                  }}
                />
              </div>
            </div>
            <div className="col-lg-6 order-lg-1">
              <h2 className="display-6 display-sm-5 fw-bold mb-3 mb-md-4" style={{ color: 'var(--primary)' }}>
                Access Anywhere, Anytime
              </h2>
              <p className="lead fs-5 fs-6-sm mb-3 mb-md-4" style={{ color: 'var(--neutral-700)' }}>
                Whether on the go or offline, The Lady's Essence is available on multiple platforms
                to ensure you never miss a beat in your health journey.
              </p>
              <p className="text-muted mb-3 mb-md-4">
                Our platform is designed to be accessible for everyone, including those with limited
                internet access. With our USSD service, you can access essential features without
                needing a smartphone or internet connection.
              </p>
              <div className="d-grid gap-3 gap-md-4">
                {[
                  {icon: 'globe', text: 'Web & Mobile Applications', color: '#667eea'},
                  {icon: 'phone', text: 'USSD Service for Feature Phones', color: '#f5576c'},
                  {icon: 'bell', text: 'SMS Reminders & Notifications', color: '#4facfe'},
                  {icon: 'wifi-off', text: 'Offline Functionality', color: '#43e97b'}
                ].map((item, index) => (
                  <div key={index} className="d-flex gap-3 align-items-start" style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.15}s backwards`
                  }}>
                    <div className="icon-box d-flex align-items-center justify-content-center flex-shrink-0 text-white rounded-3 shadow-sm" style={{
                      background: item.color,
                      width: '48px',
                      height: '48px'
                    }}>
                      <i className={`bi bi-${item.icon} fs-5`}></i>
                    </div>
                    <div className="flex-grow-1 pt-2">
                      <h3 className="h6 h6-sm mb-0 fw-semibold" style={{ color: 'var(--neutral-800)' }}>
                        {item.text}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-5 py-md-6" style={{
        background: 'linear-gradient(135deg, rgba(15, 76, 129, 0.05) 0%, rgba(15, 76, 129, 0.1) 100%)'
      }}>
        <div className="container">
          <div className="text-center mb-5 mb-md-6">
            <h2 className="display-5 display-6-sm fw-bold mb-3 mb-md-4" style={{ color: 'var(--primary)' }}>
              User Stories
            </h2>
            <p className="lead text-muted">Hear from our empowered community</p>
          </div>
          <div className="row g-3 g-md-4">
            {[
              {
                text: "The Lady's Essence transformed how I manage my health. The cycle tracking is incredibly accurate!",
                author: "Sarah M.",
                role: "User since 2023",
                avatar: "SM",
                color: "#667eea"
              },
              {
                text: "As a mother, the family dashboard helps me support my daughters' health journey.",
                author: "Rebecca T.",
                role: "Parent user",
                avatar: "RT",
                color: "#f5576c"
              },
              {
                text: "The USSD service is a lifeline in my rural community with limited internet access.",
                author: "Grace K.",
                role: "USSD user",
                avatar: "GK",
                color: "#43e97b"
              }
            ].map((testimonial, index) => (
              <div key={index} className="col-md-6 col-lg-4">
                <div className="testimonial-card card h-100 border-0 shadow-sm" style={{
                  transition: 'all 0.3s ease',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.15}s backwards`
                }}>
                  <div className="card-body p-3 p-md-4">
                    <div className="d-flex align-items-center mb-3 mb-md-4">
                      <div className="d-flex align-items-center justify-content-center rounded-circle me-3 text-white fw-bold" style={{
                        width: '50px',
                        height: '50px',
                        background: testimonial.color,
                        fontSize: '18px'
                      }}>
                        {testimonial.avatar}
                      </div>
                      <div>
                        <h3 className="h6 fw-bold mb-0">{testimonial.author}</h3>
                        <small className="text-muted">{testimonial.role}</small>
                      </div>
                    </div>
                    <p className="mb-0 fst-italic" style={{ color: 'var(--neutral-700)' }}>
                      "{testimonial.text}"
                    </p>
                    <div className="mt-3 d-flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className="bi bi-star-fill" style={{ color: '#F5B700', fontSize: '14px' }}></i>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waiting List Section */}
      <section className="py-5 py-md-6" style={{
        background: 'linear-gradient(135deg, #F5B700 0%, #ffd700 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center">
            <div className="col-lg-10 col-xl-8 mx-auto text-center">
              <div className="p-4 p-md-5 rounded-4 shadow-lg bg-white">
                <div className="mb-3 mb-md-4">
                  <i className="bi bi-rocket-takeoff-fill" style={{ 
                    fontSize: '3rem', 
                    color: '#0F4C81',
                    animation: 'bounce 2s ease-in-out infinite'
                  }}></i>
                </div>
                <h2 className="display-5 display-6-sm fw-bold mb-3" style={{ color: '#0F4C81' }}>
                  Join Our Early Access
                </h2>
                <p className="lead mb-4 mb-md-5" style={{ color: 'var(--neutral-700)' }}>
                  Be among the first to experience The Lady's Essence! Join our waiting list for
                  exclusive early access and updates.
                </p>
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLScaT-0gsJd3yDhqaxRjAGAK8GwmnsyYYw9L8z-1tlXBEvjm6A/viewform?usp=sharing"
                  className="btn btn-primary btn-lg px-4 px-md-5 py-3 rounded-pill shadow-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    transition: 'all 0.3s ease'
                  }}
                >
                  <i className="bi bi-arrow-right-circle-fill me-2"></i>
                  Join Waiting List
                </a>
                <div className="mt-3 mt-md-4">
                  <small className="text-muted d-block">
                    <i className="bi bi-shield-fill-check me-1"></i>
                    Limited spots available - Priority access for early signups
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          zIndex: 1
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-100px',
          width: '300px',
          height: '300px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          zIndex: 1
        }}></div>
      </section>


      {/* Pricing Section */}
      <section className="py-5 py-md-6">
        <div className="container">
          <div className="text-center mb-5 mb-md-6">
            <h2 className="display-5 display-6-sm fw-bold mb-3 mb-md-4" style={{ color: 'var(--primary)' }}>
              Flexible Plans
            </h2>
            <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
              Choose the perfect plan for your needs
            </p>
          </div>
          <div className="row g-3 g-md-4">
            {[
              {
                title: 'Basic',
                price: 'Free',
                features: ['Basic Cycle Tracking', 'Community Access', 'Limited Content', 'Email Support'],
                accent: false,
                popular: false,
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              },
              {
                title: 'Menstrual Health',
                price: '$5/year',
                features: ['Advanced Tracking', 'Health Insights', 'Full Content', 'Priority Support'],
                accent: true,
                popular: true,
                gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              },
              {
                title: 'Family Support',
                price: '$3/month',
                features: ['Family Dashboard', 'Premium Content', 'Emergency Support', 'Health Management'],
                accent: false,
                popular: false,
                gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
              }
            ].map((plan, index) => (
              <div key={index} className="col-md-6 col-lg-4">
                <div className={`pricing-card card h-100 position-relative ${plan.accent ? 'border-primary' : 'border-0'}`} style={{
                  transition: 'all 0.3s ease',
                  transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: plan.popular ? '0 10px 40px rgba(0,0,0,0.15)' : '0 4px 20px rgba(0,0,0,0.08)',
                  borderWidth: plan.accent ? '2px' : '0',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.15}s backwards`
                }}>
                  {plan.popular && (
                    <div className="position-absolute top-0 start-50 translate-middle">
                      <span className="badge rounded-pill px-3 py-2 shadow-sm" style={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white'
                      }}>
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className={`card-body p-4 ${plan.popular ? 'pt-5' : ''}`}>
                    <div className="text-center mb-4">
                      <div className="mb-3 mx-auto d-flex align-items-center justify-content-center" style={{
                        width: '60px',
                        height: '60px',
                        background: plan.gradient,
                        borderRadius: '16px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                      }}>
                        <i className={`bi ${plan.title === 'Basic' ? 'bi-person' : plan.title === 'Menstrual Health' ? 'bi-heart-pulse' : 'bi-people'} fs-3 text-white`}></i>
                      </div>
                      <h3 className="h4 fw-bold mb-2" style={{ color: 'var(--primary)' }}>
                        {plan.title}
                      </h3>
                      <div className="price-display mb-3">
                        <span className="display-4 fw-bold" style={{ 
                          background: plan.gradient,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>
                          {plan.price}
                        </span>
                      </div>
                    </div>
                    <ul className="list-unstyled mb-4">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="d-flex align-items-start mb-3">
                          <i className="bi bi-check2-circle-fill me-2 flex-shrink-0" style={{ 
                            color: plan.accent ? '#f5576c' : '#43e97b',
                            fontSize: '1.1rem',
                            marginTop: '2px'
                          }}></i>
                          <span className="small">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-center mt-auto">
                      <Link 
                        href="/register" 
                        className={`btn btn-lg w-100 rounded-pill ${plan.accent ? 'text-white shadow-lg' : 'btn-outline-primary'}`}
                        style={plan.accent ? {
                          background: plan.gradient,
                          border: 'none'
                        } : {}}
                      >
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
      <section className="cta-section py-5 py-md-6 position-relative" style={{
        background: 'linear-gradient(135deg, #0F4C81 0%, #1a365d 100%)',
        color: 'white',
        overflow: 'hidden'
      }}>
        <div className="container text-center position-relative" style={{ zIndex: 2 }}>
          <div className="mx-auto" style={{ maxWidth: '800px' }}>
            <div className="mb-4">
              <i className="bi bi-stars" style={{ 
                fontSize: '3rem', 
                color: '#F5B700',
                animation: 'pulse 2s ease-in-out infinite'
              }}></i>
            </div>
            <h2 className="display-5 display-6-sm fw-bold mb-3 mb-md-4" style={{
              animation: 'fadeInUp 0.8s ease-out'
            }}>
              Start Your Health Journey Today
            </h2>
            <p className="lead fs-5 fs-6-sm mb-4 mb-md-5" style={{
              animation: 'fadeInUp 0.8s ease-out 0.2s backwards'
            }}>
              Join thousands of women taking control of their health with personalized insights
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center" style={{
              animation: 'fadeInUp 0.8s ease-out 0.4s backwards'
            }}>
              <Link href="/register" className="btn btn-accent btn-lg px-4 px-md-5 py-3 rounded-pill shadow-lg">
                <i className="bi bi-rocket-takeoff me-2"></i>
                Get Started Free
              </Link>
              <Link href="/features" className="btn btn-outline-light btn-lg px-4 px-md-5 py-3 rounded-pill">
                <i className="bi bi-play-circle me-2"></i>
                Explore Features
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '5%',
          width: '150px',
          height: '150px',
          background: 'rgba(245, 183, 0, 0.1)',
          borderRadius: '50%',
          zIndex: 1,
          animation: 'float 4s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          width: '100px',
          height: '100px',
          background: 'rgba(245, 183, 0, 0.1)',
          borderRadius: '50%',
          zIndex: 1,
          animation: 'float 3s ease-in-out infinite 1s'
        }}></div>
      </section>
    </div>
  );
}