import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
        <div>
      {/* Hero Section */}
      <section className="py-5" style={{ backgroundColor: '#0F4C81', color: 'white' }}>
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h1 className="mb-4" style={{ color: 'white' }}>The Lady's Essence</h1>
              <h2 className="mb-4" style={{ color: '#F5B700' }}>Empowering Women, Enhancing Lives</h2>
              <p className="mb-4">
                An inclusive health platform offering menstrual cycle tracking, pregnancy care guidance, 
                and educational resources through a mobile app and USSD service.
              </p>
              <div className="mt-4">
                <Link href="/register" className="btn btn-accent btn-lg">Get Started</Link>
                <Link href="/features" className="btn btn-outline btn-lg ml-2" style={{ color: 'white', borderColor: 'white' }}>Learn More</Link>
              </div>
            </div>
            <div className="col-md-6">
              <div className="text-center">
                <img 
                  src="/images/icons/log.png" 
                  alt="The Lady's Essence" 
                  className="img-fluid" 
                  style={{
                    maxWidth: '80%',
                    border: '5px solid #F5B700',
                    borderRadius: '15px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Platform Access */}
      <section className="py-5" style={{ backgroundColor: '#f5f7fa' }}>
        <div className="container">
          <h2 className="text-center mb-5">Access Anywhere, Anytime</h2>
          <div className="row align-items-center">
            <div className="col-md-6">
              <h3>Multi-Platform Accessibility</h3>
              <p className="mb-4">
                The Lady's Essence is designed to be accessible to all women, regardless of their 
                technological resources. Our platform offers:
              </p>
              <ul>
                <li className="mb-2">Web application for desktop and mobile browsers</li>
                <li className="mb-2">USSD service for feature phones without internet</li>
                <li className="mb-2">SMS reminders and notifications</li>
                <li className="mb-2">Offline mode for areas with limited connectivity</li>
              </ul>
            </div>
            <div className="col-md-6 text-center">
              <div className="card">
                <div className="card-body">
                  <h4 style={{ color: '#36B37E' }}>Inclusive by Design</h4>
                  <p>
                    Our dual-platform approach ensures that women in rural and underserved areas 
                    can access vital health information and tracking tools, even without smartphones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-5">What Our Users Say</h2>
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <p className="font-italic">"The Lady's Essence has transformed how I manage my health. The cycle tracking is accurate and the nutrition guidance has been invaluable during my pregnancy."</p>
                  <div className="mt-3">
                    <strong>Sarah M.</strong><br />
                    <small>User since 2023</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <p className="font-italic">"As a mother of two teenage daughters, the family dashboard helps me support them through their menstrual health journey while respecting their privacy."</p>
                  <div className="mt-3">
                    <strong>Rebecca T.</strong><br />
                    <small>Parent user</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <p className="font-italic">"I live in a rural area with limited internet. The USSD service has been a lifeline for tracking my cycle and receiving health reminders."</p>
                  <div className="mt-3">
                    <strong>Grace K.</strong><br />
                    <small>USSD user</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="py-5" style={{ backgroundColor: '#f5f7fa' }}>
        <div className="container">
          <h2 className="text-center mb-5">Subscription Plans</h2>
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="card h-100">
                <div className="card-header text-center">
                  <h3>Basic</h3>
                  <p className="mb-0">Free</p>
                </div>
                <div className="card-body">
                  <ul>
                    <li>Basic cycle tracking</li>
                    <li>Limited educational content</li>
                    <li>Community forum access</li>
                  </ul>
                </div>
                <div className="card-footer text-center">
                  <Link href="/register" className="btn btn-outline">Sign Up Free</Link>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card h-100" style={{ borderColor: '#36B37E' }}>
                <div className="card-header text-center" style={{ backgroundColor: '#36B37E', color: 'white' }}>
                  <h3>Menstrual Health</h3>
                  <p className="mb-0">$5/year</p>
                </div>
                <div className="card-body">
                  <ul>
                    <li>Advanced cycle tracking</li>
                    <li>Personalized health insights</li>
                    <li>PMS management tools</li>
                    <li>Full educational content</li>
                    <li>Priority support</li>
                  </ul>
                </div>
                <div className="card-footer text-center">
                  <Link href="/register" className="btn btn-secondary">Subscribe Now</Link>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card h-100" style={{ borderColor: '#F5B700' }}>
                <div className="card-header text-center" style={{ backgroundColor: '#F5B700', color: 'white' }}>
                  <h3>Family Support</h3>
                  <p className="mb-0">$3/month</p>
                </div>
                <div className="card-body">
                  <ul>
                    <li>Full parent dashboard</li>
                    <li>Health education resources</li>
                    <li>Family health management</li>
                    <li>Emergency support</li>
                    <li>Premium educational content</li>
                  </ul>
                </div>
                <div className="card-footer text-center">
                  <Link href="/register" className="btn btn-accent">Subscribe Now</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-5" style={{ backgroundColor: '#0F4C81', color: 'white' }}>
        <div className="container text-center">
          <h2 className="mb-4" style={{ color: 'white' }}>Ready to Take Control of Your Health?</h2>
          <p className="mb-4">Join thousands of women who are empowering themselves with personalized health insights.</p>
          <Link href="/register" className="btn btn-accent btn-lg">Get Started Today</Link>
        </div>
      </section>
    </div>
  );
}
