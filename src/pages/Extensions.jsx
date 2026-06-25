import { useState, useEffect } from 'react';

const extensionData = [
  {
    id: 1,
    title: 'Balance Explorer',
    description: 'Comprehensive balance analysis with historical tracking, projections and what-if scenarios.',
    version: '2.1.0',
    fileSize: '2.4 MB',
    downloads: 1542,
    rating: 4.8,
    category: 'Financial',
    preview: 'area',
    image: '/extensions/balance-explorer.png',
    downloadUrl: '/extensions/balance-explorer.trex',
    route: '/balance-explorer',
    features: ['Real-time balance tracking', 'Historical data analysis', 'What-if scenario modeling', 'Export to Excel/PDF'],
    requirements: 'Tableau 2021.4 or higher',
    lastUpdated: '2024-01-15',
  },
  {
    id: 2,
    title: 'KPI with Trend',
    description: 'Configurable KPI card with trend analysis, forecasting and period comparison built in.',
    version: '1.8.0',
    fileSize: '1.8 MB',
    downloads: 2341,
    rating: 4.9,
    category: 'Analytics',
    preview: 'kpi-trend',
    image: '/extensions/kpi-with-trend.png',
    downloadUrl: '/extensions/kpi-with-trend.trex',
    route: '/kpiwithtrend',
    features: ['Trend line analysis', 'Forecasting models', 'Customizable metrics', 'Alert notifications'],
    requirements: 'Tableau 2022.1 or higher',
    lastUpdated: '2024-02-01',
  },
  {
    id: 3,
    title: 'Suspense KPI Card',
    description: 'Real-time suspense account monitoring with threshold alerts and drill-down to entries.',
    version: '1.5.0',
    fileSize: '1.2 MB',
    downloads: 876,
    rating: 4.7,
    category: 'KPI',
    preview: 'kpi-spark',
    image: '/extensions/suspense-kpi.png',
    downloadUrl: '/extensions/suspense-kpi.trex',
    route: '/suspense-card',
    features: ['Instant alert system', 'Drill-down capabilities', 'Suspense account monitoring', 'Automated reporting'],
    requirements: 'Tableau 2021.4 or higher',
    lastUpdated: '2024-01-28',
  },
  {
    id: 4,
    title: 'Channel Donut',
    description: 'Interactive channel-mix donut with dynamic segmentation, filtering and export.',
    version: '2.0.0',
    fileSize: '3.1 MB',
    downloads: 654,
    rating: 4.6,
    category: 'Visualization',
    preview: 'donut',
    image: '/extensions/channel-donut.png',
    downloadUrl: '/extensions/channel-donut.trex',
    route: '/channel-donut',
    features: ['Dynamic segmentation', 'Interactive filtering', 'Channel performance metrics', 'Export capabilities'],
    requirements: 'Tableau 2022.3 or higher',
    lastUpdated: '2024-02-10',
  },
  {
    id: 5,
    title: 'Cash Position Navbar',
    description: 'Compact cash-position bar with visual headroom indicators and quick actions.',
    version: '1.3.0',
    fileSize: '1.5 MB',
    downloads: 432,
    rating: 4.5,
    category: 'Dashboard',
    preview: 'bars-h',
    image: '/extensions/cash-position.png',
    downloadUrl: '/extensions/cash-position.trex',
    route: '/cash-position-navbar',
    features: ['Real-time cash position', 'Visual indicators', 'Quick action buttons', 'Cash flow forecasting'],
    requirements: 'Tableau 2021.4 or higher',
    lastUpdated: '2024-02-05',
  },
  {
    id: 6,
    title: 'Treasury KPI',
    description: 'Treasury performance at a glance — radial gauge, limit utilisation and compliance status.',
    version: '1.7.0',
    fileSize: '2.2 MB',
    downloads: 321,
    rating: 4.8,
    category: 'Treasury',
    preview: 'gauge',
    image: '/extensions/treasury-kpi.png',
    downloadUrl: '/extensions/treasury-kpi.trex',
    route: '/treasury-kpi',
    features: ['Treasury performance metrics', 'Automated reporting', 'Compliance tracking', 'Risk assessment'],
    requirements: 'Tableau 2022.1 or higher',
    lastUpdated: '2024-01-20',
  },
  {
    id: 7,
    title: 'Cheque Material KPI',
    description: 'Cheque-processing metrics with materiality thresholds and clear exception highlighting.',
    version: '1.5.0',
    fileSize: '1.8 MB',
    downloads: 289,
    rating: 4.7,
    category: 'Banking',
    preview: 'bars-v',
    image: '/extensions/cheque-material.png',
    downloadUrl: '/extensions/cheque-material.trex',
    route: '/cheque-material-kpi',
    features: ['Materiality thresholds', 'Exception handling', 'Processing metrics', 'Audit trails'],
    requirements: 'Tableau 2021.4 or higher',
    lastUpdated: '2024-02-15',
  },
  {
    id: 8,
    title: 'Percent Trend KPI',
    description: 'Percentage-based trend analysis with a smoothed line, signal band and anomaly markers.',
    version: '2.2.0',
    fileSize: '2.0 MB',
    downloads: 567,
    rating: 4.8,
    category: 'Analytics',
    preview: 'line-pct',
    image: '/extensions/percent-trend.png',
    downloadUrl: '/extensions/percent-trend.trex',
    route: '/percent-trend-kpi',
    features: ['Predictive modeling', 'Anomaly detection', 'Trend analysis', 'Automated insights'],
    requirements: 'Tableau 2022.3 or higher',
    lastUpdated: '2024-02-20',
  },
];

// Inline viz previews — on-brand stand-ins shown until a real screenshot exists.
function Preview({ type }) {
  const common = { width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet' };
  switch (type) {
    case 'kpi-spark':
      return (
        <svg viewBox="0 0 240 130" {...common}>
          <text x="16" y="34" className="pv-cap">SUSPENSE BAL</text>
          <text x="16" y="74" className="pv-num">2.84M</text>
          <text x="16" y="98" className="pv-delta-up">▲ 1.9%</text>
          <polyline className="pv-spark" points="120,96 138,82 152,88 168,64 184,72 200,48 220,40" />
          <circle className="pv-dot" cx="220" cy="40" r="3.5" />
        </svg>
      );
    case 'kpi-trend':
      return (
        <svg viewBox="0 0 240 130" {...common}>
          <text x="16" y="34" className="pv-cap">NET FLOW · MTD</text>
          <text x="16" y="74" className="pv-num">48.2K</text>
          <text x="16" y="98" className="pv-delta-up">▲ 12.4% vs LM</text>
          <rect className="pv-bar-soft" x="150" y="70" width="14" height="40" rx="2" />
          <rect className="pv-bar-soft" x="172" y="56" width="14" height="54" rx="2" />
          <rect className="pv-bar" x="194" y="36" width="14" height="74" rx="2" />
        </svg>
      );
    case 'donut':
      return (
        <svg viewBox="0 0 240 130" {...common}>
          <g transform="translate(64,65)">
            <circle className="pv-ring-track" r="38" fill="none" />
            <circle className="pv-ring" r="38" fill="none" strokeDasharray="150 89" transform="rotate(-90)" />
            <text x="0" y="6" className="pv-num-sm" textAnchor="middle">62%</text>
          </g>
          <g>
            <rect x="140" y="40" width="9" height="9" rx="2" className="pv-sw-1" />
            <text x="156" y="48" className="pv-cap">Digital</text>
            <rect x="140" y="62" width="9" height="9" rx="2" className="pv-sw-2" />
            <text x="156" y="70" className="pv-cap">Branch</text>
            <rect x="140" y="84" width="9" height="9" rx="2" className="pv-sw-3" />
            <text x="156" y="92" className="pv-cap">ATM</text>
          </g>
        </svg>
      );
    case 'area':
      return (
        <svg viewBox="0 0 240 130" {...common}>
          <defs>
            <linearGradient id="exArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="pv-area-top" />
              <stop offset="100%" className="pv-area-bot" />
            </linearGradient>
          </defs>
          <path className="pv-area-fill" fill="url(#exArea)"
            d="M16,96 L48,82 L80,88 L112,60 L144,70 L176,44 L224,52 L224,114 L16,114 Z" />
          <polyline className="pv-line" points="16,96 48,82 80,88 112,60 144,70 176,44 224,52" />
        </svg>
      );
    case 'bars-h':
      return (
        <svg viewBox="0 0 240 130" {...common}>
          <text x="16" y="28" className="pv-cap">CASH POSITION</text>
          <rect className="pv-track" x="16" y="44" width="208" height="10" rx="5" />
          <rect className="pv-fill" x="16" y="44" width="150" height="10" rx="5" />
          <rect className="pv-track" x="16" y="70" width="208" height="10" rx="5" />
          <rect className="pv-fill-2" x="16" y="70" width="96" height="10" rx="5" />
          <rect className="pv-track" x="16" y="96" width="208" height="10" rx="5" />
          <rect className="pv-fill" x="16" y="96" width="186" height="10" rx="5" />
        </svg>
      );
    case 'gauge':
      return (
        <svg viewBox="0 0 240 130" {...common}>
          <g transform="translate(120,96)">
            <path className="pv-ring-track" fill="none" d="M-58,0 A58,58 0 0 1 58,0" />
            <path className="pv-ring" fill="none" strokeDasharray="135 200" d="M-58,0 A58,58 0 0 1 58,0" />
            <text x="0" y="-12" className="pv-num" textAnchor="middle">74</text>
            <text x="0" y="6" className="pv-cap" textAnchor="middle">UTILISATION</text>
          </g>
        </svg>
      );
    case 'bars-v':
      return (
        <svg viewBox="0 0 240 130" {...common}>
          {[30, 52, 40, 66, 48, 80, 58].map((h, i) => (
            <rect key={i} className={i === 5 ? 'pv-bar' : 'pv-bar-soft'}
              x={20 + i * 30} y={110 - h} width="16" height={h} rx="2" />
          ))}
        </svg>
      );
    case 'line-pct':
      return (
        <svg viewBox="0 0 240 130" {...common}>
          <line className="pv-band" x1="16" y1="58" x2="224" y2="58" />
          <polyline className="pv-line" points="16,86 48,70 80,78 112,52 144,62 176,40 224,46" />
          <circle className="pv-flag" cx="112" cy="52" r="4" />
          <text x="112" y="38" className="pv-cap" textAnchor="middle">peak</text>
        </svg>
      );
    default:
      return null;
  }
}

function Logo({ footer = false }) {
  return (
    <a href="/" className={`brand${footer ? ' foot-brand' : ''}`} aria-label="DataVizLabs home">
      <svg className="logo-mark" viewBox="0 0 48 48" role="img" aria-label="DataVizLabs logo">
        <polygon points="22,10 7,40 22,40" className="lg-face-l" />
        <polygon points="22,10 22,40 37,40" className="lg-face-r" />
        <polygon points="22,10 7,40 37,40" className="lg-edge" />
        <line x1="22" y1="10" x2="22" y2="40" className="lg-ridge" />
        <polyline points="20,34 27,27 31,31 38,19 44,13" className="lg-trend" />
        <polyline points="39,12 44,13 43,18" className="lg-arrow" />
        <circle cx="44" cy="13" r="2" className="lg-tip" />
      </svg>
      <span className="logo-word">DataViz<span className="logo-word-accent">Labs</span></span>
    </a>
  );
}

function Extensions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [imgError, setImgError] = useState({});

  const categories = ['All', ...new Set(extensionData.map((ext) => ext.category))];

  const filteredExtensions = extensionData.filter((ext) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      ext.title.toLowerCase().includes(q) || ext.description.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'All' || ext.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalDownloads = extensionData.reduce((sum, ext) => sum + ext.downloads, 0);
  const avgRating = (
    extensionData.reduce((sum, ext) => sum + ext.rating, 0) / extensionData.length
  ).toFixed(1);

  // Lock background scroll while the modal is open.
  useEffect(() => {
    document.body.style.overflow = selectedExtension ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedExtension]);

  // Close modal on Escape.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setSelectedExtension(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleDownload = (downloadUrl, title) =>
    alert(`Downloading ${title}\nFile: ${downloadUrl}`);

  const handleWhatsApp = () =>
    window.open('https://wa.me/94766683434', '_blank', 'noopener');

  const media = (ext, className) =>
    !imgError[ext.id] ? (
      <img
        src={ext.image}
        alt={`${ext.title} preview`}
        className={className}
        loading="lazy"
        onError={() => setImgError((p) => ({ ...p, [ext.id]: true }))}
      />
    ) : (
      <div className={`${className} preview-fallback`}><Preview type={ext.preview} /></div>
    );

  return (
    <div className="gallery">
      {/* Top bar */}
      <nav className="nav">
        <div className="nav-inner">
          <Logo />
          <div className="nav-links">
            <a href="/" className="nav-link">← Home</a>
            <button onClick={handleWhatsApp} className="nav-cta">WhatsApp</button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="head">
        <div className="wrap">
          <span className="eyebrow">Catalogue · {extensionData.length} extensions</span>
          <h1 className="h1">Extension gallery</h1>
          <p className="head-sub">
            Browse, preview and download the full set of Tableau visualization extensions —
            each one a single-file install built in a production banking environment.
          </p>

          <div className="controls">
            <div className="search">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <input
                type="text"
                placeholder="Search extensions…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                aria-label="Search extensions"
              />
            </div>
            <div className="filters">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`chip ${selectedCategory === cat ? 'is-active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                  {cat !== 'All' && (
                    <span className="chip-count">
                      {extensionData.filter((e) => e.category === cat).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="wrap">
        <div className="stats">
          <div className="stat"><span className="stat-num">{extensionData.length}</span><span className="stat-lab">Extensions</span></div>
          <div className="stat"><span className="stat-num">{avgRating}</span><span className="stat-lab">Avg rating</span></div>
          <div className="stat"><span className="stat-num">{totalDownloads.toLocaleString()}</span><span className="stat-lab">Downloads</span></div>
          <div className="stat"><span className="stat-num">{categories.length - 1}</span><span className="stat-lab">Categories</span></div>
        </div>

        <div className="results">
          Showing <span className="results-n">{filteredExtensions.length}</span> of {extensionData.length}
          {searchTerm && <> for “{searchTerm}”</>}
        </div>
      </div>

      {/* Grid */}
      <section className="grid-section wrap">
        {filteredExtensions.length === 0 ? (
          <div className="empty">
            <p className="empty-title">No extensions match that.</p>
            <p className="empty-sub">Clear the search or pick a different category to see the full set.</p>
            <button className="btn-line" onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}>
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid">
            {filteredExtensions.map((ext, index) => (
              <article className="card" key={ext.id} style={{ '--d': `${index * 55}ms` }}>
                <div className="card-media">
                  {media(ext, 'card-img')}
                  <span className="card-tag">{ext.category}</span>
                  <span className="card-rate">★ {ext.rating}</span>
                </div>
                <div className="card-body">
                  <div className="card-top">
                    <h3 className="card-title">{ext.title}</h3>
                    <span className="card-ver">v{ext.version}</span>
                  </div>
                  <p className="card-desc">{ext.description}</p>
                  <div className="card-feats">
                    {ext.features.slice(0, 2).map((f, i) => (
                      <span className="feat" key={i}>✓ {f}</span>
                    ))}
                    {ext.features.length > 2 && (
                      <span className="feat feat-more">+{ext.features.length - 2}</span>
                    )}
                  </div>
                  <div className="card-metrics">
                    <span>↓ {ext.downloads.toLocaleString()}</span>
                    <span className="metric-dot" />
                    <span>{ext.fileSize}</span>
                  </div>
                  <div className="card-actions">
                    <a href={ext.route} className="btn-line-sm">Preview</a>
                    <button className="btn-primary-sm" onClick={() => handleDownload(ext.downloadUrl, ext.title)}>
                      ↓ Download
                    </button>
                    <button className="btn-icon" onClick={() => setSelectedExtension(ext)} aria-label={`Details for ${ext.title}`}>
                      i
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="foot">
        <div className="wrap foot-inner">
          <Logo footer />
          <span className="foot-text">© {new Date().getFullYear()} DataVizLabs · Premium Tableau visualization extensions</span>
        </div>
      </footer>

      {/* Modal */}
      {selectedExtension && (
        <div className="overlay" onClick={() => setSelectedExtension(null)} role="dialog" aria-modal="true" aria-label={selectedExtension.title}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setSelectedExtension(null)} aria-label="Close">✕</button>
            <div className="modal-grid">
              <div className="modal-media">
                {media(selectedExtension, 'modal-img')}
                <span className="card-tag">{selectedExtension.category}</span>
              </div>
              <div className="modal-info">
                <div className="modal-top">
                  <h2 className="modal-title">{selectedExtension.title}</h2>
                  <span className="card-ver">v{selectedExtension.version}</span>
                </div>
                <p className="modal-desc">{selectedExtension.description}</p>

                <div className="modal-meta">
                  <div className="mm"><span className="mm-k">Downloads</span><span className="mm-v">{selectedExtension.downloads.toLocaleString()}</span></div>
                  <div className="mm"><span className="mm-k">Rating</span><span className="mm-v">★ {selectedExtension.rating}</span></div>
                  <div className="mm"><span className="mm-k">File size</span><span className="mm-v">{selectedExtension.fileSize}</span></div>
                  <div className="mm"><span className="mm-k">Requires</span><span className="mm-v">{selectedExtension.requirements}</span></div>
                  <div className="mm"><span className="mm-k">Updated</span><span className="mm-v">{selectedExtension.lastUpdated}</span></div>
                  <div className="mm"><span className="mm-k">Category</span><span className="mm-v">{selectedExtension.category}</span></div>
                </div>

                <div className="modal-feats">
                  <span className="modal-feats-h">What it does</span>
                  <ul>
                    {selectedExtension.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="modal-actions">
                  <a href={selectedExtension.route} className="btn-line">Preview</a>
                  <button className="btn-primary" onClick={() => handleDownload(selectedExtension.downloadUrl, selectedExtension.title)}>
                    ↓ Download .trex
                  </button>
                  <button className="btn-whatsapp" onClick={handleWhatsApp}>Request a custom build</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .gallery {
          --bg: #07120F;
          --bg-2: #0A1815;
          --surface: #0E2420;
          --surface-2: #10302A;
          --line: #1B3A34;
          --line-bright: #27514A;
          --teal: #2DD4BF;
          --teal-deep: #0D9488;
          --gold: #E8B84B;
          --text: #E9F4F1;
          --text-mid: #A4C2BC;
          --text-dim: #6B8A84;
          --mono: 'JetBrains Mono', ui-monospace, monospace;
          --display: 'Space Grotesk', system-ui, sans-serif;
          --body: 'Inter', system-ui, sans-serif;

          min-height: 100vh;
          background:
            radial-gradient(900px 500px at 85% -10%, rgba(13,148,136,0.16), transparent 60%),
            radial-gradient(700px 500px at -5% 5%, rgba(45,212,191,0.06), transparent 55%),
            var(--bg);
          color: var(--text);
          font-family: var(--body);
          line-height: 1.5;
          overflow-x: hidden;
        }
        :global(html) { scroll-behavior: smooth; }
        :global(body) { margin: 0; display: block; overflow-x: hidden; overflow-y: auto; }
        :global(#root) { width: 100%; min-height: 100vh; }
        .gallery :focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; border-radius: 4px; }

        .wrap { max-width: 1180px; margin: 0 auto; padding: 0 1.5rem; }
        .eyebrow {
          font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--teal); display: inline-block; margin-bottom: 0.9rem;
        }

        /* Logo */
        .brand { display: flex; align-items: center; gap: 0.55rem; text-decoration: none; }
        .logo-mark { width: 34px; height: 34px; display: block; flex: none; }
        .lg-face-l { fill: var(--teal); fill-opacity: 0.20; }
        .lg-face-r { fill: var(--teal); fill-opacity: 0.42; }
        .lg-edge { fill: none; stroke: var(--teal); stroke-width: 1.6; stroke-linejoin: round; }
        .lg-ridge { stroke: var(--teal); stroke-width: 1; stroke-opacity: 0.55; }
        .lg-trend, .lg-arrow { fill: none; stroke: #6ff0e1; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
        .lg-tip { fill: var(--gold); }
        .logo-word { font-family: var(--display); font-weight: 700; font-size: 1.16rem; letter-spacing: -0.01em; color: var(--text); }
        .logo-word-accent { color: var(--teal); }
        .foot-brand .logo-mark { width: 28px; height: 28px; }
        .foot-brand .logo-word { font-size: 1.04rem; }

        /* Nav */
        .nav { position: sticky; top: 0; z-index: 50; background: rgba(7,18,15,0.82); backdrop-filter: blur(14px); border-bottom: 1px solid var(--line); }
        .nav-inner { max-width: 1180px; margin: 0 auto; padding: 0 1.5rem; height: 62px; display: flex; align-items: center; justify-content: space-between; }
        .nav-links { display: flex; align-items: center; gap: 1.4rem; }
        .nav-link { font-size: 0.92rem; color: var(--text-mid); text-decoration: none; transition: color 0.2s; }
        .nav-link:hover { color: var(--text); }
        .nav-cta { font-family: var(--body); font-size: 0.88rem; font-weight: 600; color: var(--bg); background: var(--teal); border: none; padding: 0.5rem 1.1rem; border-radius: 8px; cursor: pointer; transition: background 0.2s, transform 0.2s; }
        .nav-cta:hover { background: #54e6d4; transform: translateY(-1px); }

        /* Header */
        .head { padding: clamp(2.5rem, 6vw, 4.5rem) 0 2rem; }
        .h1 { font-family: var(--display); font-weight: 700; font-size: clamp(2rem, 5vw, 3.2rem); letter-spacing: -0.03em; margin: 0 0 0.9rem; }
        .head-sub { font-size: 1.05rem; color: var(--text-mid); max-width: 42rem; margin: 0 0 2.2rem; }
        .controls { display: flex; flex-direction: column; gap: 1.1rem; }
        @media (min-width: 820px) { .controls { flex-direction: row; align-items: center; justify-content: space-between; } }

        .search { position: relative; width: 100%; max-width: 360px; }
        .search-icon { position: absolute; left: 0.95rem; top: 50%; transform: translateY(-50%); color: var(--text-dim); font-size: 1.05rem; }
        .search-input {
          width: 100%; background: var(--bg-2); border: 1px solid var(--line); border-radius: 10px;
          padding: 0.7rem 0.9rem 0.7rem 2.5rem; color: var(--text); font-family: var(--body); font-size: 0.92rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-input::placeholder { color: var(--text-dim); }
        .search-input:focus { outline: none; border-color: var(--teal); box-shadow: 0 0 0 3px rgba(45,212,191,0.14); }

        .filters { display: flex; flex-wrap: wrap; gap: 0.45rem; }
        .chip {
          font-family: var(--mono); font-size: 0.74rem; letter-spacing: 0.04em;
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.4rem 0.85rem; border-radius: 999px; cursor: pointer;
          background: var(--surface); border: 1px solid var(--line); color: var(--text-mid);
          transition: all 0.2s;
        }
        .chip:hover { color: var(--text); border-color: var(--line-bright); }
        .chip.is-active { color: var(--bg); background: var(--teal); border-color: var(--teal); }
        .chip-count { font-size: 0.66rem; background: rgba(0,0,0,0.18); padding: 0.05rem 0.4rem; border-radius: 999px; }
        .chip.is-active .chip-count { background: rgba(7,18,15,0.25); }

        /* Stats */
        .stats {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px;
          background: var(--line); border: 1px solid var(--line); border-radius: 12px; overflow: hidden;
          margin: 1.5rem 0 1rem;
        }
        @media (min-width: 700px) { .stats { grid-template-columns: repeat(4, 1fr); } }
        .stat { background: var(--bg-2); padding: 1.1rem 1.3rem; display: flex; flex-direction: column; gap: 0.2rem; }
        .stat-num { font-family: var(--display); font-weight: 600; font-size: 1.65rem; }
        .stat-lab { font-family: var(--mono); font-size: 0.66rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-dim); }

        .results { font-family: var(--mono); font-size: 0.78rem; color: var(--text-dim); margin-bottom: 1.6rem; }
        .results-n { color: var(--teal); }

        /* Grid */
        .grid-section { padding-bottom: clamp(3rem, 6vw, 5rem); }
        .grid { display: grid; grid-template-columns: 1fr; gap: 1.4rem; }
        @media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1000px) { .grid { grid-template-columns: repeat(3, 1fr); } }

        .card {
          background: var(--surface); border: 1px solid var(--line); border-radius: 14px; overflow: hidden;
          display: flex; flex-direction: column;
          animation: fadeUp 0.5s ease both; animation-delay: var(--d);
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        }
        .card:hover { border-color: var(--line-bright); box-shadow: 0 24px 60px -34px rgba(45,212,191,0.4); transform: translateY(-3px); }
        .card-media {
          position: relative; aspect-ratio: 16 / 9; overflow: hidden;
          background:
            linear-gradient(180deg, var(--bg-2), var(--surface)),
            repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(45,212,191,0.04) 24px);
          border-bottom: 1px solid var(--line);
        }
        .card-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
        .card:hover .card-img { transform: scale(1.04); }
        .preview-fallback { padding: 0.6rem; }
        .preview-fallback :global(svg) { width: 100%; height: 100%; }
        .card-tag {
          position: absolute; top: 0.6rem; left: 0.7rem; z-index: 2;
          font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--teal); background: rgba(7,18,15,0.72); border: 1px solid var(--line-bright);
          padding: 0.2rem 0.5rem; border-radius: 999px; backdrop-filter: blur(4px);
        }
        .card-rate {
          position: absolute; top: 0.6rem; right: 0.7rem; z-index: 2;
          font-family: var(--mono); font-size: 0.66rem; color: var(--gold);
          background: rgba(7,18,15,0.72); border: 1px solid var(--line-bright);
          padding: 0.2rem 0.5rem; border-radius: 999px; backdrop-filter: blur(4px);
        }
        .card-body { padding: 1.2rem; display: flex; flex-direction: column; flex: 1; }
        .card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.6rem; margin-bottom: 0.5rem; }
        .card-title { font-family: var(--display); font-size: 1.1rem; font-weight: 600; margin: 0; }
        .card:hover .card-title { color: var(--teal); }
        .card-ver { font-family: var(--mono); font-size: 0.66rem; color: var(--text-dim); border: 1px solid var(--line); border-radius: 999px; padding: 0.12rem 0.5rem; white-space: nowrap; }
        .card-desc {
          font-size: 0.85rem; color: var(--text-mid); margin: 0 0 0.9rem;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .card-feats { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.9rem; }
        .feat { font-family: var(--mono); font-size: 0.66rem; color: var(--text-mid); background: var(--bg-2); border: 1px solid var(--line); padding: 0.18rem 0.55rem; border-radius: 999px; }
        .feat-more { color: var(--text-dim); }
        .card-metrics { display: flex; align-items: center; gap: 0.6rem; font-family: var(--mono); font-size: 0.72rem; color: var(--text-dim); margin-bottom: 1.1rem; margin-top: auto; }
        .metric-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--line-bright); }
        .card-actions { display: flex; align-items: center; gap: 0.5rem; }

        .btn-line-sm, .btn-primary-sm {
          font-family: var(--body); font-size: 0.82rem; font-weight: 600; padding: 0.5rem 0.95rem;
          border-radius: 8px; cursor: pointer; text-decoration: none; transition: all 0.2s; border: 1px solid transparent;
        }
        .btn-line-sm { background: var(--bg-2); color: var(--text-mid); border-color: var(--line); }
        .btn-line-sm:hover { color: var(--teal); border-color: var(--teal); }
        .btn-primary-sm { background: var(--teal); color: var(--bg); flex: 1; text-align: center; }
        .btn-primary-sm:hover { background: #54e6d4; }
        .btn-icon {
          width: 34px; height: 34px; flex: none; border-radius: 8px; cursor: pointer;
          background: var(--bg-2); border: 1px solid var(--line); color: var(--text-mid);
          font-family: var(--mono); font-style: italic; font-size: 0.9rem; transition: all 0.2s;
        }
        .btn-icon:hover { color: var(--teal); border-color: var(--teal); }

        /* Empty */
        .empty { text-align: center; padding: 4rem 1rem; border: 1px dashed var(--line-bright); border-radius: 14px; }
        .empty-title { font-family: var(--display); font-size: 1.2rem; margin: 0 0 0.4rem; }
        .empty-sub { color: var(--text-mid); margin: 0 0 1.4rem; font-size: 0.92rem; }
        .btn-line {
          font-family: var(--body); font-size: 0.9rem; font-weight: 600; padding: 0.6rem 1.3rem;
          border-radius: 9px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center;
          background: var(--surface); color: var(--text); border: 1px solid var(--line-bright); transition: all 0.2s;
        }
        .btn-line:hover { border-color: var(--teal); background: var(--surface-2); }
        .btn-primary {
          font-family: var(--body); font-size: 0.9rem; font-weight: 600; padding: 0.6rem 1.3rem;
          border-radius: 9px; cursor: pointer; border: none; background: var(--teal); color: var(--bg);
          display: inline-flex; align-items: center; transition: all 0.2s;
        }
        .btn-primary:hover { background: #54e6d4; transform: translateY(-1px); }
        .btn-whatsapp {
          font-family: var(--body); font-size: 0.9rem; font-weight: 600; padding: 0.6rem 1.3rem;
          border-radius: 9px; cursor: pointer; border: 1px solid var(--line); background: transparent; color: var(--text-mid);
          display: inline-flex; align-items: center; transition: all 0.2s;
        }
        .btn-whatsapp:hover { color: var(--teal); border-color: var(--teal); }

        /* Footer */
        .foot { border-top: 1px solid var(--line); padding: 2rem 0; }
        .foot-inner { display: flex; flex-direction: column; gap: 0.8rem; align-items: center; text-align: center; }
        @media (min-width: 700px) { .foot-inner { flex-direction: row; justify-content: space-between; text-align: left; } }
        .foot-text { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.05em; color: var(--text-dim); }

        /* Modal */
        .overlay {
          position: fixed; inset: 0; z-index: 200; padding: 1.2rem;
          background: rgba(4,10,8,0.78); backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          animation: fade 0.25s ease;
        }
        .modal {
          position: relative; width: 100%; max-width: 880px; max-height: 88vh; overflow-y: auto;
          background: linear-gradient(180deg, var(--surface), var(--bg-2));
          border: 1px solid var(--line-bright); border-radius: 18px;
          box-shadow: 0 40px 100px -30px rgba(0,0,0,0.85);
          animation: pop 0.25s ease;
        }
        .modal-x {
          position: absolute; top: 1rem; right: 1rem; z-index: 3; width: 36px; height: 36px; border-radius: 9px;
          background: var(--bg-2); border: 1px solid var(--line); color: var(--text-mid); cursor: pointer;
          font-size: 0.9rem; transition: all 0.2s;
        }
        .modal-x:hover { color: var(--teal); border-color: var(--teal); }
        .modal-grid { display: grid; grid-template-columns: 1fr; gap: 1.6rem; padding: 1.6rem; }
        @media (min-width: 760px) { .modal-grid { grid-template-columns: 0.9fr 1.1fr; padding: 2rem; } }
        .modal-media {
          position: relative; aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, var(--bg-2), var(--surface));
        }
        .modal-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .modal-top { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; margin-bottom: 0.7rem; }
        .modal-title { font-family: var(--display); font-size: 1.7rem; font-weight: 600; margin: 0; letter-spacing: -0.02em; }
        .modal-desc { color: var(--text-mid); font-size: 0.95rem; margin: 0 0 1.3rem; }
        .modal-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 1.4rem; }
        .mm { background: var(--bg-2); border: 1px solid var(--line); border-radius: 10px; padding: 0.6rem 0.75rem; display: flex; flex-direction: column; gap: 0.15rem; }
        .mm-k { font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); }
        .mm-v { font-size: 0.86rem; font-weight: 500; }
        .modal-feats { margin-bottom: 1.5rem; }
        .modal-feats-h { font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-dim); }
        .modal-feats ul { list-style: none; padding: 0; margin: 0.6rem 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
        .modal-feats li { position: relative; padding-left: 1.1rem; color: var(--text-mid); font-size: 0.85rem; }
        .modal-feats li::before { content: '▹'; position: absolute; left: 0; color: var(--teal); }
        .modal-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pop { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }

        /* Preview SVG styling */
        .pv-cap { font-family: var(--mono); font-size: 9px; letter-spacing: 0.06em; fill: var(--text-dim); }
        .pv-num { font-family: var(--display); font-weight: 600; font-size: 30px; fill: var(--text); }
        .pv-num-sm { font-family: var(--display); font-weight: 600; font-size: 16px; fill: var(--text); }
        .pv-delta-up { font-family: var(--mono); font-size: 10px; fill: var(--teal); }
        .pv-spark, .pv-line { fill: none; stroke: var(--teal); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .pv-dot, .pv-flag { fill: var(--gold); }
        .pv-bar { fill: var(--teal); }
        .pv-bar-soft { fill: var(--line-bright); }
        .pv-ring-track { stroke: var(--line); stroke-width: 9; }
        .pv-ring { stroke: var(--teal); stroke-width: 9; stroke-linecap: round; }
        .pv-sw-1 { fill: var(--teal); } .pv-sw-2 { fill: var(--teal-deep); } .pv-sw-3 { fill: var(--line-bright); }
        .pv-area-top { stop-color: rgba(45,212,191,0.32); }
        .pv-area-bot { stop-color: rgba(45,212,191,0); }
        .pv-area-fill { stroke: none; }
        .pv-track { fill: var(--line); }
        .pv-fill { fill: var(--teal); } .pv-fill-2 { fill: var(--teal-deep); }
        .pv-band { stroke: var(--line-bright); stroke-width: 1; stroke-dasharray: 3 3; }

        @media (prefers-reduced-motion: reduce) {
          .gallery *, .gallery *::before { animation: none !important; transition: none !important; }
          .card { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}

export default Extensions;
