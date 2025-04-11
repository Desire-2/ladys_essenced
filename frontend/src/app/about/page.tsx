import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  return (
    <>
      <Head>
        <title>About Us - The Lady’s Essence</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          .hero {
            background: linear-gradient(rgba(255, 118, 140, 0.8), rgba(255, 126, 179, 0.8)),
                        url('https://source.unsplash.com/1600x900/?women,empowerment') center/cover;
            min-height: 60vh;
            display: flex;
            align-items: center;
            position: relative;
            overflow: hidden;
          }
          
          .hero::after {
            content: '';
            position: absolute;
            bottom: -50px;
            left: 0;
            width: 100%;
            height: 100px;
            background: white;
            transform: skewY(-3deg);
          }

          .mission-card {
            transition: transform 0.3s ease;
            border: none;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          }

          .mission-card:hover {
            transform: translateY(-10px);
          }

          .team-member {
            transition: all 0.3s ease;
            border-radius: 15px;
            overflow: hidden;
            position: relative;
          }

          .team-member:hover .team-overlay {
            opacity: 1;
          }

          .team-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 118, 140, 0.9);
            opacity: 0;
            transition: opacity 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            color: white;
          }

          .contact-card {
            background: linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%);
            border-radius: 20px;
            color: white;
            position: relative;
            overflow: hidden;
          }

          .contact-card::before {
            content: '';
            position: absolute;
            top: -50px;
            right: -50px;
            width: 150px;
            height: 150px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
          }
        `}</style>
      </Head>

      {/* Animated Hero Section */}
      <header className="hero">
        <div className="container text-center position-relative z-index-1">
          <h1 className="display-3 fw-bold text-black mb-4 animate__animated animate__fadeInDown">
            Empowering Women Through Technology
          </h1>
          <div className="d-flex justify-content-center gap-3 mt-4">
            <span className="badge bg-light text-primary rounded-pill px-4 py-2 fs-5">
              <i className="bi bi-graph-up me-2"></i>Funded: $25k
            </span>
            <span className="badge bg-light text-primary rounded-pill px-4 py-2 fs-5">
              <i className="bi bi-people-fill me-2"></i>5000+ Users
            </span>
          </div>
        </div>
      </header>

      {/* Mission Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <div className="mission-card">
                <img
                  src="/images/others/hero-woman.jpg"
                  alt="Our Mission"
                  className="img-fluid rounded-3"
                />
              </div>
            </div>
            <div className="col-lg-6">
              <h2 className="display-6 fw-bold text-primary mb-4">
                Transforming Women's Healthcare
              </h2>
              <div className="d-grid gap-4">
                <div className="d-flex align-items-start gap-3">
                  <div className="icon-box bg-primary text-black rounded-circle p-3">
                    <i className="bi bi-heart-pulse-fill fs-3"></i>
                  </div>
                  <div>
                    <h3 className="h5 fw-bold">Holistic Health Tracking</h3>
                    <p className="text-muted mb-0">
                      Comprehensive menstrual cycle tracking with AI-powered predictions and health insights.
                    </p>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-3">
                  <div className="icon-box bg-primary text-black rounded-circle p-3">
                    <i className="bi bi-phone-fill fs-3"></i>
                  </div>
                  <div>
                    <h3 className="h5 fw-bold">Dual Platform Access</h3>
                    <p className="text-muted mb-0">
                      Mobile app and USSD integration ensuring accessibility for all women.
                    </p>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-3">
                  <div className="icon-box bg-primary text-black rounded-circle p-3">
                    <i className="bi bi-book-half fs-3"></i>
                  </div>
                  <div>
                    <h3 className="h5 fw-bold">Educational Resources</h3>
                    <p className="text-muted mb-0">
                      Culturally sensitive content curated by health professionals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-primary mb-3">Our Visionaries</h2>
            <p className="lead text-muted">
              Passionate leaders driving innovation in women's health tech
            </p>
          </div>
          <div className="row g-4">
            {[{
              name: "Desire Bikorimana",
              role: "Founder & Tech Lead",
              image: "/images/founders/Deesire.png",
              contact: "+250 (780) 784-924",
              email: "bikorimanadesire@yahoo.com",
              bio: "Full-stack developer focused on accessible health solutions"
            }, {
              name: "Nina Joevanice Uwimpukwe",
              role: "Cofounder & Content Strategist",
              image: "images/founders/Nina.jpeg",
              contact: "+250 (781) 300-826",
              email: "ninauwimpuhwe@gmail.com",
              bio: "Health communication specialist ensuring cultural relevance"
            }, {
              name: "Delphine Iradukunda",
              role: "Cofounder & Operations Lead",
              image: "images/founders/Delphine.jpeg",
              contact: "+250 (791) 305-400",
              email: "delphineiradukunda03@gmail.com",
              bio: "Strategic partnership developer and project coordinator"
            }].map((member, index) => (
              <div key={index} className="col-lg-4 col-md-6">
                <div className="team-member shadow-lg h-100">
                  <div className="position-relative">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="img-fluid"
                      style={{ height: "300px", objectFit: "cover" }}
                    />
                    <div className="team-overlay p-4">
                      <h5 className="text-black fw-bold mb-3">{member.name}</h5>
                        <p className="text-primary mb-2">{member.role}</p>
                      <div className="d-flex gap-3">
                        <Link href={`tel:${member.contact}`} className="text-black">
                          <i className="bi bi-telephone-fill fs-4"></i>
                          <h5 className="text-black">{member.contact}</h5>
                        </Link>
                        
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                  <Link href={`mailto:${member.email}`} className="text-black">
                    <i className="bi bi-envelope-fill fs-4"></i>
                    <h5 className="text-black">{member.email}</h5>
                </Link>
                
                    <p className="text-muted small mb-0">{member.bio}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="contact-card py-5 px-4 text-center position-relative">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <h2 className="display-6 fw-bold text-black mb-4">Connect With Us</h2>
                <div className="d-flex flex-column flex-md-row justify-content-center gap-4">
                  <div className="contact-item">
                    <i className="bi bi-geo-alt-fill fs-1 mb-3"></i>
                    <h5 className="text-black">Location</h5>
                    <p className="mb-0">Kigali, Rwanda</p>
                  </div>
                  <div className="contact-item">
                    <i className="bi bi-telephone-fill fs-1 mb-3"></i>
                    <h5 className="text-black">Call Us</h5>
                    <p className="mb-0">+250 780 784 924</p>
                  </div>
                  <div className="contact-item">
                    <i className="bi bi-envelope-fill fs-1 mb-3"></i>
                    <h5 className="text-black">Email Us</h5>
                    <p className="mb-0">ladysessence1@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}