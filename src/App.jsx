import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { motion } from 'framer-motion';
import { 
  FaWhatsapp, 
  FaLinkedin, 
  FaFacebook, 
  FaYoutube, 
  FaDownload,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaChartBar,
  FaClock,
  FaUserCheck,
  FaArrowRight
} from 'react-icons/fa';
import { HiOutlineMail, HiOutlineUser } from 'react-icons/hi';
import { MdMessage } from 'react-icons/md';

// Import your existing extensions
import BalanceExplorer from "./extensions/BalanceExplorer/BalanceExplorer.jsx";
import Kpiwithtrend from "./extensions/clearing/kpiwithtrend.jsx";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Your existing extension routes */}
        <Route path="/balance-explorer" element={<BalanceExplorer />} />
        <Route path="/kpiwithtrend" element={<Kpiwithtrend />} />
        <Route path="/suspense-card" element={<ExtensionPlaceholder title="Suspense KPI Card" />} />
        <Route path="/kpi-card" element={<ExtensionPlaceholder title="KPI Card Pro" />} />
        <Route path="/channel-donut" element={<ExtensionPlaceholder title="Channel Donut" />} />
        <Route path="/cash-position-navbar" element={<ExtensionPlaceholder title="Cash Position Navbar" />} />
        <Route path="/treasury-kpi" element={<ExtensionPlaceholder title="Treasury KPI" />} />
        <Route path="/cheque-material-kpi" element={<ExtensionPlaceholder title="Cheque Material KPI" />} />
        <Route path="/percent-trend-kpi" element={<ExtensionPlaceholder title="Percent Trend KPI" />} />
        
        {/* Homepage route */}
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

// Placeholder for extensions that don't have components yet
function ExtensionPlaceholder({ title }) {
  return (
    <div style={{ 
      fontFamily: "system-ui", 
      padding: 40, 
      background: "#f8fafc", 
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
        {title}
      </h1>
      <p style={{ color: "#64748b", marginBottom: 20 }}>This extension is being developed.</p>
      <a href="/" style={{ 
        color: "#3b82f6", 
        textDecoration: "none",
        fontWeight: 600
      }}>
        ← Back to Home
      </a>
    </div>
  );
}

function Home() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState('');

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-900/90 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FaChartBar className="text-3xl text-blue-400 mr-2" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                DataVizLabs
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#extensions" className="hover:text-blue-400 transition-colors">Extensions</a>
              <a href="#about" className="hover:text-blue-400 transition-colors">About</a>
              <a href="#contact" className="hover:text-blue-400 transition-colors">Contact</a>
              <button
                onClick={handleWhatsApp}
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105"
              >
                <FaWhatsapp /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Tableau Viz Extensions
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Premium visualization extensions for Tableau — designed to transform your data into stunning, interactive stories
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="#extensions"
                className="bg-blue-500 hover:bg-blue-600 px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 inline-block"
              >
                Explore Extensions
              </a>
              <button 
                onClick={handleWhatsApp}
                className="bg-green-500 hover:bg-green-600 px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <FaWhatsapp /> Contact Sales
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 border-t border-b border-gray-700">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">8+</div>
            <div className="text-gray-400">Extensions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">5K+</div>
            <div className="text-gray-400">Downloads</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-400">4.8★</div>
            <div className="text-gray-400">Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">50+</div>
            <div className="text-gray-400">Clients</div>
          </div>
        </div>
      </section>

      {/* Extensions Grid */}
      <section id="extensions" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Our Extensions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {extensions.map((ext, index) => (
              <motion.div
                key={ext.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700 hover:border-blue-400 transition-all hover:shadow-2xl hover:shadow-blue-500/20 group"
              >
                <div className="relative">
                  <img 
                    src={ext.image} 
                    alt={ext.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-blue-500/90 px-3 py-1 rounded-full text-sm">
                    {ext.category}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                    {ext.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {ext.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <a 
                        href={ext.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-red-400 hover:text-red-300 flex items-center gap-2 transition-colors text-sm"
                      >
                        <FaYoutube /> Watch Demo
                      </a>
                      <a 
                        href={ext.downloadUrl}
                        className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105 text-sm"
                      >
                        <FaDownload /> Download
                      </a>
                    </div>
                    <a 
                      href={ext.route}
                      className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 text-sm"
                    >
                      Open <FaArrowRight className="text-xs" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Why DataVizLabs?
              </h2>
              <p className="text-gray-300 mb-6">
                We specialize in creating cutting-edge Tableau visualization extensions that transform complex data into actionable insights. Our team of expert developers and data scientists work together to deliver solutions that are both powerful and intuitive.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FaUserCheck className="text-blue-400 text-xl mt-1" />
                  <div>
                    <h4 className="font-semibold">Expert Team</h4>
                    <p className="text-gray-400 text-sm">Industry professionals with 10+ years of experience</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaClock className="text-purple-400 text-xl mt-1" />
                  <div>
                    <h4 className="font-semibold">24/7 Support</h4>
                    <p className="text-gray-400 text-sm">Dedicated support team always ready to help</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-8 rounded-2xl border border-gray-700"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-6 rounded-xl text-center">
                  <div className="text-3xl font-bold text-blue-400">8</div>
                  <div className="text-gray-400 text-sm">Extensions</div>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-xl text-center">
                  <div className="text-3xl font-bold text-purple-400">5K+</div>
                  <div className="text-gray-400 text-sm">Downloads</div>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-xl text-center">
                  <div className="text-3xl font-bold text-pink-400">4.8★</div>
                  <div className="text-gray-400 text-sm">Rating</div>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-xl text-center">
                  <div className="text-3xl font-bold text-green-400">50+</div>
                  <div className="text-gray-400 text-sm">Clients</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Get In Touch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Name</label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 transition-colors text-white"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <div className="relative">
                    <HiOutlineMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 transition-colors text-white"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <div className="relative">
                    <MdMessage className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows="4"
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 transition-colors text-white"
                      placeholder="Tell us about your project..."
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  Send Message
                </button>
                {formStatus && (
                  <div className="bg-green-500/20 border border-green-500/50 text-green-300 p-3 rounded-lg text-sm">
                    {formStatus}
                  </div>
                )}
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FaWhatsapp className="text-green-400 text-xl" />
                    <div>
                      <p className="text-sm text-gray-400">WhatsApp</p>
                      <p className="font-medium">+94 76 666 83434</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaEnvelope className="text-blue-400 text-xl" />
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="font-medium">contact@datavizlabs.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaPhone className="text-purple-400 text-xl" />
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="font-medium">+94 76 666 83434</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaMapMarkerAlt className="text-pink-400 text-xl" />
                    <div>
                      <p className="text-sm text-gray-400">Location</p>
                      <p className="font-medium">Colombo, Sri Lanka</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a href="#" className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full transition-all transform hover:scale-110">
                    <FaLinkedin className="text-xl" />
                  </a>
                  <a href="#" className="bg-blue-700 hover:bg-blue-800 p-3 rounded-full transition-all transform hover:scale-110">
                    <FaFacebook className="text-xl" />
                  </a>
                  <a href="#" className="bg-red-600 hover:bg-red-700 p-3 rounded-full transition-all transform hover:scale-110">
                    <FaYoutube className="text-xl" />
                  </a>
                  <button 
                    onClick={handleWhatsApp}
                    className="bg-green-500 hover:bg-green-600 p-3 rounded-full transition-all transform hover:scale-110"
                  >
                    <FaWhatsapp className="text-xl" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/80 border-t border-gray-700 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <FaChartBar className="text-blue-400 text-xl" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DataVizLabs
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} DataVizLabs. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Premium Tableau Visualization Extensions
          </p>
        </div>
      </footer>

      {/* Add styles for the navigation and components */}
      <style jsx>{`
        .min-h-screen {
          min-height: 100vh;
        }
        .bg-gradient-to-br {
          background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
        }
        .from-gray-900 { --tw-gradient-from: #111827; }
        .via-gray-800 { --tw-gradient-via: #1f2937; }
        .to-gray-900 { --tw-gradient-to: #111827; }
        .backdrop-blur-lg { backdrop-filter: blur(16px); }
        .bg-gray-900\\/90 { background-color: rgba(17, 24, 39, 0.9); }
        .border-gray-700 { border-color: #374151; }
        .bg-blue-500 { background-color: #3b82f6; }
        .bg-green-500 { background-color: #22c55e; }
        .bg-purple-500 { background-color: #8b5cf6; }
        .bg-pink-500 { background-color: #ec4899; }
        .bg-red-600 { background-color: #dc2626; }
        .bg-blue-600 { background-color: #2563eb; }
        .bg-blue-700 { background-color: #1d4ed8; }
        .text-blue-400 { color: #60a5fa; }
        .text-purple-400 { color: #a78bfa; }
        .text-pink-400 { color: #f472b6; }
        .text-green-400 { color: #4ade80; }
        .text-gray-300 { color: #d1d5db; }
        .text-gray-400 { color: #9ca3af; }
        .text-gray-500 { color: #6b7280; }
        .hover\\:text-blue-400:hover { color: #60a5fa; }
        .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
        .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
        .transform { transform: translateX(0) translateY(0) rotate(0) skewX(0) skewY(0) scaleX(1) scaleY(1); }
        .hover\\:scale-105:hover { transform: scale(1.05); }
        .hover\\:scale-110:hover { transform: scale(1.1); }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        .shadow-blue-500\\/20 { box-shadow: 0 25px 50px -12px rgba(59, 130, 246, 0.2); }
      `}</style>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ fontFamily: "system-ui", padding: 24, color: "#64748b" }}>
      <p style={{ fontSize: 13, marginBottom: 8 }}>No route matched. Current URL:</p>
      <code style={{ fontSize: 12, background: "#f1f5f9", padding: "4px 10px", borderRadius: 6, display: "block" }}>
        {window.location.pathname}
      </code>
    </div>
  );
}

export default App;
