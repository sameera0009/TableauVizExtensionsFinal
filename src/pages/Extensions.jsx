import { useState, useEffect } from 'react';

// Extension data with download links
const extensionData = [
  {
    id: 1,
    title: "Balance Explorer",
    description: "Comprehensive balance analysis with historical tracking, projections, and what-if scenarios",
    version: "2.1.0",
    fileSize: "2.4 MB",
    downloads: 1542,
    rating: 4.8,
    category: "Financial",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
    downloadUrl: "/extensions/balance-explorer.trex",
    route: "/balance-explorer",
    features: [
      "Real-time balance tracking",
      "Historical data analysis",
      "What-if scenario modeling",
      "Export to Excel/PDF"
    ],
    requirements: "Tableau 2021.4 or higher",
    lastUpdated: "2024-01-15"
  },
  {
    id: 2,
    title: "KPI with Trend",
    description: "Advanced KPI dashboard with trend analysis, forecasting, and customizable metrics",
    version: "1.8.0",
    fileSize: "1.8 MB",
    downloads: 2341,
    rating: 4.9,
    category: "Analytics",
    image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop",
    downloadUrl: "/extensions/kpi-with-trend.trex",
    route: "/kpiwithtrend",
    features: [
      "Trend line analysis",
      "Forecasting models",
      "Customizable metrics",
      "Alert notifications"
    ],
    requirements: "Tableau 2022.1 or higher",
    lastUpdated: "2024-02-01"
  },
  {
    id: 3,
    title: "Suspense KPI Card",
    description: "Real-time suspense account monitoring with instant alerts and drill-down capabilities",
    version: "1.5.0",
    fileSize: "1.2 MB",
    downloads: 876,
    rating: 4.7,
    category: "KPI",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    downloadUrl: "/extensions/suspense-kpi.trex",
    route: "/suspense-card",
    features: [
      "Instant alert system",
      "Drill-down capabilities",
      "Suspense account monitoring",
      "Automated reporting"
    ],
    requirements: "Tableau 2021.4 or higher",
    lastUpdated: "2024-01-28"
  },
  {
    id: 4,
    title: "Channel Donut",
    description: "Interactive channel performance visualization with dynamic segmentation and filtering",
    version: "2.0.0",
    fileSize: "3.1 MB",
    downloads: 654,
    rating: 4.6,
    category: "Visualization",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    downloadUrl: "/extensions/channel-donut.trex",
    route: "/channel-donut",
    features: [
      "Dynamic segmentation",
      "Interactive filtering",
      "Channel performance metrics",
      "Export capabilities"
    ],
    requirements: "Tableau 2022.3 or higher",
    lastUpdated: "2024-02-10"
  },
  {
    id: 5,
    title: "Cash Position Navbar",
    description: "Real-time cash position monitoring with visual indicators and quick action buttons",
    version: "1.3.0",
    fileSize: "1.5 MB",
    downloads: 432,
    rating: 4.5,
    category: "Dashboard",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    downloadUrl: "/extensions/cash-position.trex",
    route: "/cash-position-navbar",
    features: [
      "Real-time cash position",
      "Visual indicators",
      "Quick action buttons",
      "Cash flow forecasting"
    ],
    requirements: "Tableau 2021.4 or higher",
    lastUpdated: "2024-02-05"
  },
  {
    id: 6,
    title: "Treasury KPI",
    description: "Treasury performance metrics with automated reporting and compliance tracking",
    version: "1.7.0",
    fileSize: "2.2 MB",
    downloads: 321,
    rating: 4.8,
    category: "Treasury",
    image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop",
    downloadUrl: "/extensions/treasury-kpi.trex",
    route: "/treasury-kpi",
    features: [
      "Treasury performance metrics",
      "Automated reporting",
      "Compliance tracking",
      "Risk assessment"
    ],
    requirements: "Tableau 2022.1 or higher",
    lastUpdated: "2024-01-20"
  },
  {
    id: 7,
    title: "Cheque Material KPI",
    description: "Cheque processing metrics with materiality thresholds and exception handling",
    version: "1.5.0",
    fileSize: "1.8 MB",
    downloads: 289,
    rating: 4.7,
    category: "Banking",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
    downloadUrl: "/extensions/cheque-material.trex",
    route: "/cheque-material-kpi",
    features: [
      "Materiality thresholds",
      "Exception handling",
      "Processing metrics",
      "Audit trails"
    ],
    requirements: "Tableau 2021.4 or higher",
    lastUpdated: "2024-02-15"
  },
  {
    id: 8,
    title: "Percent Trend KPI",
    description: "Percentage-based trend analysis with predictive modeling and anomaly detection",
    version: "2.2.0",
    fileSize: "2.0 MB",
    downloads: 567,
    rating: 4.8,
    category: "Analytics",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    downloadUrl: "/extensions/percent-trend.trex",
    route: "/percent-trend-kpi",
    features: [
      "Predictive modeling",
      "Anomaly detection",
      "Trend analysis",
      "Automated insights"
    ],
    requirements: "Tableau 2022.3 or higher",
    lastUpdated: "2024-02-20"
  }
];

function Extensions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [visibleCards, setVisibleCards] = useState([]);
  const [selectedExtension, setSelectedExtension] = useState(null);

  const categories = ['All', ...new Set(extensionData.map(ext => ext.category))];

  const filteredExtensions = extensionData.filter(ext => {
    const matchesSearch = ext.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ext.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ext.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    filteredExtensions.forEach((_, index) => {
      setTimeout(() => {
        setVisibleCards(prev => [...prev, index]);
      }, index * 100);
    });
  }, [filteredExtensions]);

  const handleDownload = (downloadUrl, title) => {
    // For actual download, use window.location.href
    // window.location.href = downloadUrl;
    alert(`⬇ Downloading ${title}...\nThe .trex file would be downloaded from: ${downloadUrl}`);
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/94766683434', '_blank');
  };

  return (
    <div className="extensions-page">
      {/* Header */}
      <header className="extensions-header">
        <div className="header-content">
          <div className="header-top">
            <a href="/" className="back-link">← Back to Home</a>
            <button onClick={handleWhatsApp} className="whatsapp-btn-header">
              💬 WhatsApp
            </button>
          </div>
          <h1 className="header-title">📦 Extension Gallery</h1>
          <p className="header-subtitle">Browse, preview, and download our premium Tableau visualization extensions</p>
          <div className="header-actions">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search extensions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="category-filters">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                  {cat !== 'All' && (
                    <span className="filter-count">
                      {extensionData.filter(e => e.category === cat).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{extensionData.length}</span>
          <span className="stat-label">Total Extensions</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">4.7★</span>
          <span className="stat-label">Average Rating</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">{extensionData.reduce((sum, ext) => sum + ext.downloads, 0).toLocaleString()}</span>
          <span className="stat-label">Total Downloads</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">{categories.length - 1}</span>
          <span className="stat-label">Categories</span>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-count">
        Showing <span className="count-number">{filteredExtensions.length}</span> extensions
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Extensions Grid */}
      <section className="extensions-grid-section">
        <div className="grid-container">
          {filteredExtensions.length === 0 ? (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <h3>No extensions found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="extensions-grid">
              {filteredExtensions.map((ext, index) => (
                <div 
                  key={ext.id} 
                  className={`extension-card ${visibleCards.includes(index) ? 'fade-in' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="card-image-wrapper">
                    <img src={ext.image} alt={ext.title} className="card-image" />
                    <span className="card-category">{ext.category}</span>
                    <div className="card-rating">⭐ {ext.rating}</div>
                  </div>
                  <div className="card-content">
                    <div className="card-header">
                      <h3 className="card-title">{ext.title}</h3>
                      <span className="card-version">v{ext.version}</span>
                    </div>
                    <p className="card-description">{ext.description}</p>
                    
                    <div className="card-features">
                      {ext.features.slice(0, 2).map((feature, idx) => (
                        <span key={idx} className="feature-tag">✓ {feature}</span>
                      ))}
                      {ext.features.length > 2 && (
                        <span className="feature-tag more">+{ext.features.length - 2}</span>
                      )}
                    </div>

                    <div className="card-meta">
                      <span className="meta-item">📥 {ext.downloads.toLocaleString()}</span>
                      <span className="meta-item">📦 {ext.fileSize}</span>
                    </div>

                    <div className="card-actions">
                      <div className="action-buttons">
                        <a href={ext.route} className="btn-preview">
                          👁 Preview
                        </a>
                        <button 
                          onClick={() => handleDownload(ext.downloadUrl, ext.title)}
                          className="btn-download"
                        >
                          ⬇ Download
                        </button>
                      </div>
                      <button 
                        className="btn-info"
                        onClick={() => setSelectedExtension(ext)}
                      >
                        ℹ️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal for Extension Details */}
      {selectedExtension && (
        <div className="modal-overlay" onClick={() => setSelectedExtension(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedExtension(null)}>✕</button>
            <div className="modal-grid">
              <div className="modal-image-wrapper">
                <img src={selectedExtension.image} alt={selectedExtension.title} className="modal-image" />
                <span className="modal-category">{selectedExtension.category}</span>
              </div>
              <div className="modal-details">
                <div className="modal-header-details">
                  <h2>{selectedExtension.title}</h2>
                  <span className="modal-version">v{selectedExtension.version}</span>
                </div>
                <p className="modal-description">{selectedExtension.description}</p>
                
                <div className="modal-meta-grid">
                  <div className="modal-meta-item">
                    <span className="meta-label">Downloads</span>
                    <span className="meta-value">{selectedExtension.downloads.toLocaleString()}</span>
                  </div>
                  <div className="modal-meta-item">
                    <span className="meta-label">Rating</span>
                    <span className="meta-value">⭐ {selectedExtension.rating}</span>
                  </div>
                  <div className="modal-meta-item">
                    <span className="meta-label">Version</span>
                    <span className="meta-value">{selectedExtension.version}</span>
                  </div>
                  <div className="modal-meta-item">
                    <span className="meta-label">File Size</span>
                    <span className="meta-value">{selectedExtension.fileSize}</span>
                  </div>
                  <div className="modal-meta-item">
                    <span className="meta-label">Requirements</span>
                    <span className="meta-value">{selectedExtension.requirements}</span>
                  </div>
                  <div className="modal-meta-item">
                    <span className="meta-label">Last Updated</span>
                    <span className="meta-value">{selectedExtension.lastUpdated}</span>
                  </div>
                </div>

                <div className="modal-features">
                  <h4>Features</h4>
                  <ul>
                    {selectedExtension.features.map((feature, idx) => (
                      <li key={idx}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="modal-actions">
                  <a href={selectedExtension.route} className="btn-preview-large">
                    👁 Preview Extension
                  </a>
                  <button 
                    onClick={() => handleDownload(selectedExtension.downloadUrl, selectedExtension.title)}
                    className="btn-download-large"
                  >
                    ⬇ Download .trex
                  </button>
                  <button 
                    onClick={handleWhatsApp}
                    className="btn-whatsapp-modal"
                  >
                    💬 Custom Version
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .extensions-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e1a 0%, #1a1f36 50%, #0f1423 100%);
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
          padding: 1rem;
        }

        .extensions-header {
          padding: 1rem 0 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .header-content {
          max-width: 1280px;
          margin: 0 auto;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .back-link {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          transition: color 0.3s;
        }

        .back-link:hover {
          color: white;
        }

        .whatsapp-btn-header {
          background: #25D366;
          padding: 0.5rem 1.25rem;
          border: none;
          border-radius: 50px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .whatsapp-btn-header:hover {
          transform: scale(1.05);
        }

        .header-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .header-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
        }

        .header-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .header-actions {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.3);
        }

        .search-input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 3rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 50px;
          color: white;
          font-size: 0.95rem;
          transition: all 0.3s;
        }

        .search-input:focus {
          outline: none;
          border-color: rgba(96, 165, 250, 0.3);
          background: rgba(255, 255, 255, 0.08);
        }

        .category-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .filter-btn {
          padding: 0.4rem 1.2rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 50px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.3s;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
          border-color: rgba(96, 165, 250, 0.3);
          color: #60a5fa;
        }

        .filter-count {
          font-size: 0.7rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.1rem 0.4rem;
          border-radius: 50px;
        }

        .stats-bar {
          max-width: 1280px;
          margin: 2rem auto;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.03);
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #60a5fa;
        }

        .stat-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
        }

        .stat-divider {
          width: 1px;
          height: 2rem;
          background: rgba(255, 255, 255, 0.05);
        }

        .results-count {
          max-width: 1280px;
          margin: 0 auto 1.5rem;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.9rem;
        }

        .count-number {
          color: white;
          font-weight: 600;
        }

        .extensions-grid-section {
          max-width: 1280px;
          margin: 0 auto;
        }

        .extensions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 640px) {
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
          background: rgba(255, 255, 255, 0.03);
          border-radius: 1rem;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          opacity: 0;
          transform: translateY(30px);
        }

        .extension-card:hover {
          transform: translateY(-8px);
          border-color: rgba(96, 165, 250, 0.2);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          background: rgba(255, 255, 255, 0.05);
        }

        .extension-card.fade-in {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .card-image-wrapper {
          position: relative;
          overflow: hidden;
          aspect-ratio: 16/9;
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .extension-card:hover .card-image {
          transform: scale(1.05);
        }

        .card-category {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          background: rgba(0, 0, 0, 0.7);
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.7rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .card-rating {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(0, 0, 0, 0.7);
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .card-content {
          padding: 1.5rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .card-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
          transition: color 0.3s;
        }

        .extension-card:hover .card-title {
          color: #60a5fa;
        }

        .card-version {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.1rem 0.5rem;
          border-radius: 50px;
          white-space: nowrap;
        }

        .card-description {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          line-height: 1.6;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin-bottom: 1rem;
        }

        .feature-tag {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.03);
          padding: 0.15rem 0.6rem;
          border-radius: 50px;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .feature-tag.more {
          color: rgba(255, 255, 255, 0.3);
        }

        .card-meta {
          display: flex;
          gap: 1rem;
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.75rem;
          margin-bottom: 1rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .card-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .btn-preview {
          padding: 0.4rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 50px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.8rem;
          transition: all 0.3s;
        }

        .btn-preview:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .btn-download {
          padding: 0.4rem 1.2rem;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          border-radius: 50px;
          color: white;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-download:hover {
          transform: scale(1.05);
        }

        .btn-info {
          width: 2.2rem;
          height: 2.2rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
        }

        .btn-info:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .no-results {
          text-align: center;
          padding: 4rem 0;
          grid-column: 1 / -1;
        }

        .no-results-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .no-results h3 {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.5rem;
        }

        .no-results p {
          color: rgba(255, 255, 255, 0.3);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 1rem;
          animation: fadeIn 0.3s ease;
        }

        .modal-content {
          background: linear-gradient(135deg, #1a1f36, #0f1423);
          border-radius: 1.5rem;
          max-width: 1000px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 50px 100px rgba(0, 0, 0, 0.5);
          animation: scaleIn 0.3s ease;
        }

        .modal-close {
          position: sticky;
          top: 1rem;
          float: right;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.6);
          width: 2.5rem;
          height: 2.5rem;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.3s;
          margin: 1rem 1rem 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: rotate(90deg);
        }

        .modal-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          padding: 0 2rem 2rem;
        }

        @media (min-width: 768px) {
          .modal-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .modal-image-wrapper {
          position: relative;
        }

        .modal-image {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 1rem;
        }

        .modal-category {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: rgba(0, 0, 0, 0.7);
          padding: 0.3rem 1rem;
          border-radius: 50px;
          font-size: 0.8rem;
        }

        .modal-header-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .modal-header-details h2 {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
        }

        .modal-version {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.2rem 0.8rem;
          border-radius: 50px;
        }

        .modal-description {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.8;
          margin-bottom: 1.5rem;
        }

        .modal-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .modal-meta-item {
          background: rgba(255, 255, 255, 0.03);
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .meta-label {
          display: block;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 0.2rem;
        }

        .meta-value {
          font-weight: 600;
          font-size: 1rem;
        }

        .modal-features {
          margin-bottom: 1.5rem;
        }

        .modal-features h4 {
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .modal-features ul {
          list-style: none;
          padding: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.3rem;
        }

        .modal-features li {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          padding: 0.2rem 0;
        }

        .modal-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .btn-preview-large,
        .btn-download-large,
        .btn-whatsapp-modal {
          padding: 0.6rem 1.5rem;
          border-radius: 50px;
          border: none;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-preview-large {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: white;
        }

        .btn-preview-large:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-download-large {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
        }

        .btn-download-large:hover {
          transform: scale(1.05);
        }

        .btn-whatsapp-modal {
          background: #25D366;
          color: white;
        }

        .btn-whatsapp-modal:hover {
          transform: scale(1.05);
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 640px) {
          .header-title {
            font-size: 1.8rem;
          }

          .stats-bar {
            gap: 0.75rem;
            padding: 0.75rem;
          }

          .stat-divider {
            display: none;
          }

          .modal-grid {
            padding: 0 1rem 1rem;
          }

          .modal-close {
            margin: 0.5rem 0.5rem 0 0;
          }

          .modal-image {
            height: 200px;
          }

          .modal-features ul {
            grid-template-columns: 1fr;
          }

          .search-box {
            max-width: 100%;
          }

          .category-filters {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default Extensions;
