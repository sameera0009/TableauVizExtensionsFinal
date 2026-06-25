import { useState, useEffect } from 'react';

function Home() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState('');
  const [visibleCards, setVisibleCards] = useState([]);

  const extensions = [
    {
      id: 1,
      title: "Suspense KPI Card",
      description: "Real-time suspense account monitoring with instant alerts and drill-down capabilities",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      downloadUrl: "#",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
      category: "KPI",
      route: "/suspense-card"
    },
    {
      id: 2,
      title: "KPI Card Pro",
      description: "Advanced KPI dashboard with trend analysis, forecasting, and customizable metrics",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      downloadUrl: "#",
      image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop",
      category: "Analytics",
      route: "/kpi-card"
    },
    {
      id: 3,
      title: "Channel Donut",
      description: "Interactive channel performance visualization with dynamic segmentation and filtering",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      downloadUrl: "#",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
      category: "Visualization",
      route: "/channel-donut"
    },
    {
      id: 4,
      title: "Balance Explorer",
      description: "Comprehensive balance analysis with historical tracking, projections, and what-if scenarios",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      downloadUrl: "#",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
      category: "Financial",
      route: "/balance-explorer"
    },
    {
      id: 5,
      title: "Cash Position Navbar",
      description: "Real-time cash position monitoring with visual indicators and quick action buttons",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      downloadUrl: "#",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
      category: "Dashboard",
      route: "/cash-position-navbar"
    },
    {
      id: 6,
      title: "Treasury KPI",
      description: "Treasury performance metrics with automated reporting and compliance tracking",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      downloadUrl: "#",
      image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop",
      category: "Treasury",
      route: "/treasury-kpi"
    },
    {
      id: 7,
      title: "Cheque Material KPI",
      description: "Cheque processing metrics with materiality thresholds and exception handling",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      downloadUrl: "#",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
      category: "Banking",
      route: "/cheque-material-kpi"
    },
    {
      id: 8,
      title: "Percent Trend KPI",
      description: "Percentage-based trend analysis with predictive modeling and anomaly detection",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      downloadUrl: "#",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
      category: "Analytics",
      route: "/percent-trend-kpi"
    }
  ];

  useEffect(() => {
    // Simulate cards appearing with stagger effect
    extensions.forEach((_, index) => {
      setTimeout(() => {
        setVisibleCards(prev => [...prev, index]);
      }, index * 100);
    });
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus('Thank you for your message! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => setFormStatus(''), 5000);
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/94766683434', '_blank');
  };

  return (
    <div className="home-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-logo">
            <span className="logo-icon">📊</span>
            <span className="logo-text">DataVizLabs</span>
          </div>
          <div className="nav-links">
            <a href="#extensions" className="nav-link">Extensions</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#contact" className="nav-link">Contact</a>
            <a href="/extensions" className="nav-link gallery-link">📦 Gallery</a>
            <button onClick={handleWhatsApp} className="whatsapp-btn">
              💬 WhatsApp
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Tableau Viz Extensions
          </h1>
          <p className="hero-description">
            Premium visualization extensions for Tableau — designed to transform your data into stunning, interactive stories
          </p>
          <div className="hero-buttons">
            <a href="#extensions" className="btn-primary">
              Explore Extensions
            </a>
            <a href="/extensions" className="btn-secondary">
              📦 View All Extensions
            </a>
            <button onClick={handleWhatsApp} className="btn-whatsapp">
              💬 Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">8+</div>
            <div className="stat-label">Extensions</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">5K+</div>
            <div className="stat-label">Downloads</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">4.8★</div>
            <div className="stat-label">Rating</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Clients</div>
          </div>
        </div>
      </section>

      {/* Extensions Grid */}
      <section id="extensions" className="extensions-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Our Extensions</h2>
            <a href="/extensions" className="view-all-link">View All →</a>
          </div>
          <div className="extensions-grid">
            {extensions.slice(0, 6).map((ext, index) => (
              <div 
                key={ext.id} 
                className={`extension-card ${visibleCards.includes(index) ? 'fade-in' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-image-container">
                  <img src={ext.image} alt={ext.title} className="card-image" />
                  <span className="card-category">{ext.category}</span>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{ext.title}</h3>
                  <p className="card-description">{ext.description}</p>
                  <div className="card-actions">
                    <div className="card-buttons">
                      <a href={ext.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-demo">
                        ▶ Watch Demo
                      </a>
                      <a href={ext.downloadUrl} className="btn-download">
                        ⬇ Download
                      </a>
                    </div>
                    <a href={ext.route} className="btn-open">
                      Open →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="view-all-container">
            <a href="/extensions" className="btn-view-all">
              View All 8 Extensions →
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="section-container">
          <div className="about-grid">
            <div className="about-content">
              <h2 className="section-title">Why DataVizLabs?</h2>
              <p className="about-text">
                We specialize in creating cutting-edge Tableau visualization extensions that transform complex data into actionable insights. Our team of expert developers and data scientists work together to deliver solutions that are both powerful and intuitive.
              </p>
              <div className="about-features">
                <div className="feature-item">
                  <span className="feature-icon">👥</span>
                  <div>
                    <h4 className="feature-title">Expert Team</h4>
                    <p className="feature-description">Industry professionals with 10+ years of experience</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🕐</span>
                  <div>
                    <h4 className="feature-title">24/7 Support</h4>
                    <p className="feature-description">Dedicated support team always ready to help</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="about-stats">
              <div className="stats-card">
                <div className="mini-stat">
                  <div className="mini-stat-number">8</div>
                  <div className="mini-stat-label">Extensions</div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-number">5K+</div>
                  <div className="mini-stat-label">Downloads</div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-number">4.8★</div>
                  <div className="mini-stat-label">Rating</div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-number">50+</div>
                  <div className="mini-stat-label">Clients</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="section-container">
          <h2 className="section-title">Get In Touch</h2>
          <div className="contact-grid">
            <div className="contact-form-container">
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✉</span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <div className="input-wrapper">
                    <span className="input-icon">💬</span>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows="4"
                      className="form-textarea"
                      placeholder="Tell us about your project..."
                    />
                  </div>
                </div>
                <button type="submit" className="btn-submit">
                  Send Message
                </button>
                {formStatus && (
                  <div className="form-success">{formStatus}</div>
                )}
              </form>
            </div>

            <div className="contact-info">
              <div className="info-card">
                <h3 className="info-title">Contact Information</h3>
                <div className="info-items">
                  <div className="info-item">
                    <span className="info-icon whatsapp">💬</span>
                    <div>
                      <p className="info-label">WhatsApp</p>
                      <p className="info-value">+94 76 666 83434</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon email">✉</span>
                    <div>
                      <p className="info-label">Email</p>
                      <p className="info-value">contact@datavizlabs.com</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon phone">📞</span>
                    <div>
                      <p className="info-label">Phone</p>
                      <p className="info-value">+94 76 666 83434</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon location">📍</span>
                    <div>
                      <p className="info-label">Location</p>
                      <p className="info-value">Colombo, Sri Lanka</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="social-card">
                <h3 className="info-title">Follow Us</h3>
                <div className="social-links">
                  <a href="#" className="social-link linkedin">in</a>
                  <a href="#" className="social-link facebook">f</a>
                  <a href="#" className="social-link youtube">▶</a>
                  <button onClick={handleWhatsApp} className="social-link whatsapp-social">💬</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span className="footer-logo-icon">📊</span>
            <span className="footer-logo-text">DataVizLabs</span>
          </div>
          <p className="footer-text">© {new Date().getFullYear()} DataVizLabs. All rights reserved.</p>
          <p className="footer-subtext">Premium Tableau Visualization Extensions</p>
        </div>
      </footer>

      <style jsx>{`
        /* Global Styles */
        .home-container {
          min-height: 100vh;
          background: linear-gradient(to bottom right, #111827, #1f2937, #111827);
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
        }

        /* Navigation */
        .navbar {
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 50;
          background: rgba(17, 24, 39, 0.9);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid #374151;
        }

        .nav-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 64px;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo-icon {
          font-size: 1.75rem;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: bold;
          background: linear-gradient(to right, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links {
          display: none;
          align-items: center;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .nav-links {
            display: flex;
          }
        }

        .nav-link {
          color: #d1d5db;
          text-decoration: none;
          transition: color 0.3s;
        }

        .nav-link:hover {
          color: #60a5fa;
        }

        .gallery-link {
          color: #a78bfa;
          font-weight: 600;
        }

        .gallery-link:hover {
          color: #c4b5fd;
        }

        .whatsapp-btn {
          background: #22c55e;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          border: none;
          color: white;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s;
        }

        .whatsapp-btn:hover {
          background: #16a34a;
          transform: scale(1.05);
        }

        /* Hero Section */
        .hero-section {
          padding: 8rem 1rem 5rem;
        }

        .hero-content {
          max-width: 1280px;
          margin: 0 auto;
          text-align: center;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 1.5rem;
          background: linear-gradient(to right, #60a5fa, #a78bfa, #f472b6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: fadeInUp 0.8s ease-out;
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: 4.5rem;
          }
        }

        .hero-description {
          font-size: 1.25rem;
          color: #d1d5db;
          margin-bottom: 2rem;
          max-width: 48rem;
          margin-left: auto;
          margin-right: auto;
          animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        @media (min-width: 768px) {
          .hero-description {
            font-size: 1.5rem;
          }
        }

        .hero-buttons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
          animation: fadeInUp 0.8s ease-out 0.4s both;
        }

        .btn-primary {
          background: #3b82f6;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          font-weight: 600;
          text-decoration: none;
          color: white;
          transition: all 0.3s;
          display: inline-block;
        }

        .btn-primary:hover {
          background: #2563eb;
          transform: scale(1.05);
        }

        .btn-secondary {
          background: rgba(31, 41, 55, 0.5);
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          font-weight: 600;
          text-decoration: none;
          color: white;
          border: 1px solid #374151;
          transition: all 0.3s;
          display: inline-block;
        }

        .btn-secondary:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: #60a5fa;
          transform: scale(1.05);
        }

        .btn-whatsapp {
          background: #22c55e;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          font-weight: 600;
          border: none;
          color: white;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s;
        }

        .btn-whatsapp:hover {
          background: #16a34a;
          transform: scale(1.05);
        }

        /* Stats Section */
        .stats-section {
          padding: 3rem 1rem;
          border-top: 1px solid #374151;
          border-bottom: 1px solid #374151;
        }

        .stats-grid {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 1.875rem;
          font-weight: bold;
        }

        .stat-item:nth-child(1) .stat-number { color: #60a5fa; }
        .stat-item:nth-child(2) .stat-number { color: #a78bfa; }
        .stat-item:nth-child(3) .stat-number { color: #f472b6; }
        .stat-item:nth-child(4) .stat-number { color: #4ade80; }

        .stat-label {
          color: #9ca3af;
        }

        /* Extensions Section */
        .extensions-section {
          padding: 5rem 1rem;
        }

        .section-container {
          max-width: 1280px;
          margin: 0 auto;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 2.25rem;
          font-weight: bold;
          background: linear-gradient(to right, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .view-all-link {
          color: #60a5fa;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s;
        }

        .view-all-link:hover {
          color: #93bbfc;
        }

        .extensions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .extensions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .extensions-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .extension-card {
          background: rgba(31, 41, 55, 0.5);
          backdrop-filter: blur(4px);
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid #374151;
          transition: all 0.3s;
          opacity: 0;
          transform: translateY(20px);
        }

        .extension-card:hover {
          border-color: #60a5fa;
          box-shadow: 0 25px 50px -12px rgba(59, 130, 246, 0.2);
          transform: translateY(-4px);
        }

        .extension-card.fade-in {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.5s ease-out;
        }

        .card-image-container {
          position: relative;
        }

        .card-image {
          width: 100%;
          height: 12rem;
          object-fit: cover;
        }

        .card-category {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(59, 130, 246, 0.9);
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
        }

        .card-content {
          padding: 1.5rem;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          transition: color 0.3s;
        }

        .extension-card:hover .card-title {
          color: #60a5fa;
        }

        .card-description {
          color: #9ca3af;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .card-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .card-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .btn-demo {
          color: #f87171;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          transition: color 0.3s;
        }

        .btn-demo:hover {
          color: #fca5a5;
        }

        .btn-download {
          background: #3b82f6;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          text-decoration: none;
          color: white;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          transition: all 0.3s;
        }

        .btn-download:hover {
          background: #2563eb;
          transform: scale(1.05);
        }

        .btn-open {
          color: #a78bfa;
          text-decoration: none;
          font-size: 0.875rem;
          transition: color 0.3s;
        }

        .btn-open:hover {
          color: #c4b5fd;
        }

        .view-all-container {
          text-align: center;
          margin-top: 3rem;
        }

        .btn-view-all {
          display: inline-block;
          padding: 0.75rem 2rem;
          background: rgba(31, 41, 55, 0.5);
          border: 1px solid #374151;
          border-radius: 0.5rem;
          color: white;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-view-all:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: #60a5fa;
          transform: scale(1.05);
        }

        /* About Section */
        .about-section {
          padding: 5rem 1rem;
          background: rgba(31, 41, 55, 0.3);
        }

        .about-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          align-items: center;
        }

        @media (min-width: 768px) {
          .about-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .about-text {
          color: #d1d5db;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .about-features {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .feature-icon {
          font-size: 1.25rem;
          margin-top: 0.25rem;
        }

        .feature-title {
          font-weight: 600;
        }

        .feature-description {
          color: #9ca3af;
          font-size: 0.875rem;
        }

        .stats-card {
          background: linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1));
          padding: 2rem;
          border-radius: 1rem;
          border: 1px solid #374151;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .mini-stat {
          background: rgba(31, 41, 55, 0.5);
          padding: 1.5rem;
          border-radius: 0.75rem;
          text-align: center;
        }

        .mini-stat-number {
          font-size: 1.875rem;
          font-weight: bold;
        }

        .mini-stat:nth-child(1) .mini-stat-number { color: #60a5fa; }
        .mini-stat:nth-child(2) .mini-stat-number { color: #a78bfa; }
        .mini-stat:nth-child(3) .mini-stat-number { color: #f472b6; }
        .mini-stat:nth-child(4) .mini-stat-number { color: #4ade80; }

        .mini-stat-label {
          color: #9ca3af;
          font-size: 0.875rem;
        }

        /* Contact Section */
        .contact-section {
          padding: 5rem 1rem;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
        }

        @media (min-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          background: rgba(31, 41, 55, 0.5);
          border: 1px solid #374151;
          border-radius: 0.5rem;
          padding: 0.75rem 0.75rem 0.75rem 2.5rem;
          color: white;
          transition: border-color 0.3s;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #60a5fa;
        }

        .form-textarea {
          min-height: 6rem;
          resize: vertical;
          padding-top: 0.75rem;
        }

        .btn-submit {
          width: 100%;
          background: linear-gradient(to right, #3b82f6, #8b5cf6);
          padding: 0.75rem;
          border: none;
          border-radius: 0.5rem;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-submit:hover {
          transform: scale(1.05);
        }

        .form-success {
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.5);
          color: #86efac;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .info-card,
        .social-card {
          background: rgba(31, 41, 55, 0.5);
          padding: 1.5rem;
          border-radius: 0.75rem;
          border: 1px solid #374151;
        }

        .info-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .info-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .info-icon {
          font-size: 1.25rem;
        }

        .info-icon.whatsapp { color: #4ade80; }
        .info-icon.email { color: #60a5fa; }
        .info-icon.phone { color: #a78bfa; }
        .info-icon.location { color: #f472b6; }

        .info-label {
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .info-value {
          font-weight: 500;
        }

        .social-links {
          display: flex;
          gap: 1rem;
        }

        .social-link {
          width: 3rem;
          height: 3rem;
          border-radius: 9999px;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-decoration: none;
          border: none;
          cursor: pointer;
          font-weight: bold;
          font-size: 1.25rem;
        }

        .social-link:hover {
          transform: scale(1.1);
        }

        .social-link.linkedin { background: #2563eb; }
        .social-link.linkedin:hover { background: #1d4ed8; }
        .social-link.facebook { background: #1d4ed8; }
        .social-link.facebook:hover { background: #1e3a8a; }
        .social-link.youtube { background: #dc2626; }
        .social-link.youtube:hover { background: #b91c1c; }
        .social-link.whatsapp-social { background: #22c55e; }
        .social-link.whatsapp-social:hover { background: #16a34a; }

        /* Footer */
        .footer {
          background: rgba(17, 24, 39, 0.8);
          border-top: 1px solid #374151;
          padding: 2rem 1rem;
        }

        .footer-content {
          max-width: 1280px;
          margin: 0 auto;
          text-align: center;
        }

        .footer-logo {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .footer-logo-icon {
          font-size: 1.25rem;
        }

        .footer-logo-text {
          font-size: 1.25rem;
          font-weight: bold;
          background: linear-gradient(to right, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-text {
          color: #9ca3af;
          font-size: 0.875rem;
        }

        .footer-subtext {
          color: #6b7280;
          font-size: 0.75rem;
          margin-top: 0.5rem;
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .hero-title {
            font-size: 2rem;
          }

          .hero-description {
            font-size: 1rem;
          }

          .section-title {
            font-size: 1.5rem;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .stats-grid {
            gap: 1rem;
          }

          .stat-number {
            font-size: 1.25rem;
          }

          .stats-card {
            padding: 1rem;
            gap: 0.5rem;
          }

          .mini-stat {
            padding: 1rem;
          }

          .mini-stat-number {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Home;
