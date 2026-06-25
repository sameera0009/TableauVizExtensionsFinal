import { useState, useEffect } from 'react';

function Home() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState('');
  const [visibleCards, setVisibleCards] = useState([]);
  const [imgError, setImgError] = useState({});

  const extensions = [
    {
      id: 1,
      title: 'Suspense KPI Card',
      description: 'Real-time suspense account monitoring with threshold alerts and one-click drill-down to the underlying entries.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      downloadUrl: '#',
      category: 'KPI',
      preview: 'kpi-spark',
      route: '/suspense-card',
    },
    {
      id: 2,
      title: 'KPI Card Pro',
      description: 'A configurable metric card with trend deltas, period comparison and target tracking built in.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      downloadUrl: '#',
      category: 'Analytics',
      preview: 'kpi-trend',
      route: '/kpi-card',
    },
    {
      id: 3,
      title: 'Channel Donut',
      description: 'Interactive channel-mix donut with live segmentation, hover detail and filter actions back to the dashboard.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      downloadUrl: '#',
      category: 'Visualization',
      preview: 'donut',
      route: '/channel-donut',
    },
    {
      id: 4,
      title: 'Balance Explorer',
      description: 'Balance trends over time with historical context, projections and what-if scenarios in a single panel.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      downloadUrl: '#',
      category: 'Financial',
      preview: 'area',
      route: '/balance-explorer',
    },
    {
      id: 5,
      title: 'Cash Position Navbar',
      description: 'A compact cash-position bar with visual headroom indicators and quick actions for treasury desks.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      downloadUrl: '#',
      category: 'Dashboard',
      preview: 'bars-h',
      route: '/cash-position-navbar',
    },
    {
      id: 6,
      title: 'Treasury KPI',
      description: 'Treasury performance at a glance — radial gauge, limit utilisation and compliance status in one tile.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      downloadUrl: '#',
      category: 'Treasury',
      preview: 'gauge',
      route: '/treasury-kpi',
    },
    {
      id: 7,
      title: 'Cheque Material KPI',
      description: 'Cheque-processing metrics with materiality thresholds and clear exception highlighting.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      downloadUrl: '#',
      category: 'Banking',
      preview: 'bars-v',
      route: '/cheque-material-kpi',
    },
    {
      id: 8,
      title: 'Percent Trend KPI',
      description: 'Percentage-based trend analysis with a smoothed line, signal band and anomaly markers.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      downloadUrl: '#',
      category: 'Analytics',
      preview: 'line-pct',
      route: '/percent-trend-kpi',
    },
  ];

  // Load fonts once, without depending on the host project's setup.
  useEffect(() => {
    const id = 'dvl-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const timers = extensions.map((_, index) =>
      setTimeout(() => setVisibleCards((prev) => [...prev, index]), 80 * index)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus('Message received. I’ll get back to you shortly.');
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => setFormStatus(''), 5000);
  };

  const handleWhatsApp = () =>
    window.open('https://wa.me/94766683434', '_blank', 'noopener');

  // ── Inline viz previews — on-brand stand-ins for what each extension renders ──
  const Preview = ({ type }) => {
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
            <g className="pv-legend">
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
              <linearGradient id="pvArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="pv-area-top" />
                <stop offset="100%" className="pv-area-bot" />
              </linearGradient>
            </defs>
            <path className="pv-area-fill" fill="url(#pvArea)"
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
  };

  return (
    <div className="dvl">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="#top" className="brand" aria-label="DataVizLabs — home">
            <img src="/logo.png" alt="DataVizLabs" className="brand-logo" />
          </a>
          <div className="nav-links">
            <a href="#extensions" className="nav-link">Extensions</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#contact" className="nav-link">Contact</a>
            <a href="/extensions" className="nav-link">Gallery</a>
            <button onClick={handleWhatsApp} className="nav-cta">WhatsApp</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header id="top" className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Tableau Viz Extensions · Built for excellence</span>
            <h1 className="hero-title">
              Instrument-grade visuals,<br />
              <span className="hero-title-accent">native to your dashboard.</span>
            </h1>
            <p className="hero-sub">
              Drop-in extensions that turn raw measures into KPI cards, gauges and
              live monitors — engineered in production environments, not
              theme-shop demos.
            </p>
            <div className="hero-actions">
              <a href="#extensions" className="btn btn-primary">Explore extensions</a>
              <a href="/extensions" className="btn btn-ghost">View full gallery</a>
              <button onClick={handleWhatsApp} className="btn btn-line">Talk to me →</button>
            </div>
            <div className="hero-meta">
              <span>Single-file install</span><span className="dot" />
              <span>Tableau Extensions API</span><span className="dot" />
              <span>No external dependencies</span>
            </div>
          </div>

          {/* Signature: a live monitor panel that is itself an example output */}
          <div className="monitor" aria-label="Example extension output">
            <div className="monitor-head">
              <span className="monitor-title">SUSPENSE MONITOR</span>
              <span className="monitor-flag"><span className="tk-pulse" />OK</span>
            </div>
            <div className="monitor-body">
              <div className="monitor-kpi">
                <span className="monitor-cap">SUSPENSE BALANCE</span>
                <span className="monitor-num">LKR 2.84<span className="monitor-num-unit">M</span></span>
                <span className="monitor-delta">▲ 1.9% · within tolerance</span>
              </div>
              <svg className="monitor-chart" viewBox="0 0 320 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(45,212,191,0.30)" />
                    <stop offset="100%" stopColor="rgba(45,212,191,0)" />
                  </linearGradient>
                </defs>
                <path fill="url(#heroArea)"
                  d="M0,86 L40,74 L80,80 L120,52 L160,64 L200,40 L240,50 L280,28 L320,36 L320,120 L0,120 Z" />
                <polyline className="monitor-line" fill="none"
                  points="0,86 40,74 80,80 120,52 160,64 200,40 240,50 280,28 320,36" />
              </svg>
              <div className="monitor-tiles">
                <div className="m-tile"><span className="m-tile-num">62%</span><span className="m-tile-cap">Digital mix</span></div>
                <div className="m-tile"><span className="m-tile-num">74</span><span className="m-tile-cap">Utilisation</span></div>
                <div className="m-tile"><span className="m-tile-num">0</span><span className="m-tile-cap">Exceptions</span></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stat strip */}
      <section className="strip">
        <div className="strip-inner">
          {[
            ['08', 'Extensions'],
            ['5K+', 'Downloads'],
            ['4.8', 'Avg rating'],
            ['50+', 'Teams served'],
          ].map(([num, label]) => (
            <div className="strip-item" key={label}>
              <span className="strip-num">{num}</span>
              <span className="strip-label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Extensions */}
      <section id="extensions" className="ext">
        <div className="wrap">
          <div className="ext-head">
            <div>
              <span className="eyebrow">The catalogue</span>
              <h2 className="h2">Extensions</h2>
            </div>
            <a href="/extensions" className="link-arrow">View all →</a>
          </div>

          <div className="ext-grid">
            {extensions.map((ext, index) => (
              <article
                key={ext.id}
                className={`card ${visibleCards.includes(index) ? 'is-in' : ''}`}
              >
                <div className="card-preview">
                  <span className="card-index">{String(ext.id).padStart(2, '0')}</span>
                  <span className="card-tag">{ext.category}</span>
                  <div className="card-viz">
                    {!imgError[ext.id] ? (
                      <img
                        src={`/extensions${ext.route}.png`}
                        alt={`${ext.title} preview`}
                        className="card-img"
                        loading="lazy"
                        onError={() => setImgError((p) => ({ ...p, [ext.id]: true }))}
                      />
                    ) : (
                      <Preview type={ext.preview} />
                    )}
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{ext.title}</h3>
                  <p className="card-desc">{ext.description}</p>
                  <div className="card-foot">
                    <div className="card-links">
                      <a href={ext.videoUrl} target="_blank" rel="noopener noreferrer" className="card-demo">▶ Demo</a>
                      <a href={ext.downloadUrl} className="card-dl">↓ Download</a>
                    </div>
                    <a href={ext.route} className="card-open">Open →</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="about">
        <div className="wrap about-grid">
          <div>
            <span className="eyebrow">Why DataVizLabs</span>
            <h2 className="h2">Built where the data is real.</h2>
            <p className="about-text">
              Every extension here started life solving an actual reporting problem
              . They’re designed to behave well under load, install as a single
              file, and stay out of your way once they’re running.
            </p>
            <ul className="about-list">
              <li><strong>Production-tested.</strong> Shipped against live  dashboards, not sample superstore data.</li>
              <li><strong>Self-contained.</strong> One file per extension. No build step on your side, no surprise dependencies.</li>
              <li><strong>Supported.</strong> Direct line to the person who built them — usually same-day.</li>
            </ul>
          </div>
          <aside className="about-panel">
            <div className="ap-row"><span className="ap-k">Platform</span><span className="ap-v">Tableau Extensions API</span></div>
            <div className="ap-row"><span className="ap-k">Install</span><span className="ap-v">Single .trex + file</span></div>
            <div className="ap-row"><span className="ap-k">Support</span><span className="ap-v">WhatsApp · Email</span></div>
            <div className="ap-row"><span className="ap-k">Location</span><span className="ap-v">Colombo, Sri Lanka</span></div>
          </aside>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="contact">
        <div className="wrap">
          <span className="eyebrow">Get in touch</span>
          <h2 className="h2">Tell me what you’re building.</h2>
          <div className="contact-grid">
            <form onSubmit={handleSubmit} className="form">
              <div className="field">
                <label className="label" htmlFor="c-name">Your name</label>
                <input id="c-name" type="text" name="name" value={formData.name}
                  onChange={handleInputChange} required className="input" placeholder="Jane Perera" />
              </div>
              <div className="field">
                <label className="label" htmlFor="c-email">Email address</label>
                <input id="c-email" type="email" name="email" value={formData.email}
                  onChange={handleInputChange} required className="input" placeholder="jane@bank.lk" />
              </div>
              <div className="field">
                <label className="label" htmlFor="c-msg">Message</label>
                <textarea id="c-msg" name="message" value={formData.message}
                  onChange={handleInputChange} required rows="4" className="input textarea"
                  placeholder="Which dashboard, which metric, what you need it to do…" />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Send message</button>
              {formStatus && <div className="form-ok" role="status">{formStatus}</div>}
            </form>

            <div className="contact-side">
              <div className="info">
                <h3 className="info-title">Direct</h3>
                <a className="info-row" href="https://wa.me/94766683434" target="_blank" rel="noopener noreferrer">
                  <span className="info-k">WhatsApp</span><span className="info-v">+94 76 666 83434</span>
                </a>
                <a className="info-row" href="mailto:contact@datavizlabs.com">
                  <span className="info-k">Email</span><span className="info-v">contact@datavizlabs.com</span>
                </a>
                <div className="info-row">
                  <span className="info-k">Phone</span><span className="info-v">+94 76 666 83434</span>
                </div>
                <div className="info-row">
                  <span className="info-k">Location</span><span className="info-v">Colombo, Sri Lanka</span>
                </div>
              </div>
              <div className="info">
                <h3 className="info-title">Elsewhere</h3>
                <div className="social">
                  <a href="#" className="soc" aria-label="LinkedIn">in</a>
                  <a href="#" className="soc" aria-label="YouTube">▶</a>
                  <a href="#" className="soc" aria-label="Facebook">f</a>
                  <button onClick={handleWhatsApp} className="soc" aria-label="WhatsApp">✆</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="foot">
        <div className="wrap foot-inner">
          <img src="/logo.png" alt="DataVizLabs" className="foot-logo" />
          <span className="foot-text">© {new Date().getFullYear()} DataVizLabs · Premium Tableau visualization extensions</span>
        </div>
      </footer>

      <style jsx>{`
        .dvl {
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
            radial-gradient(900px 500px at 80% -10%, rgba(13,148,136,0.16), transparent 60%),
            radial-gradient(700px 500px at -5% 10%, rgba(45,212,191,0.07), transparent 55%),
            var(--bg);
          color: var(--text);
          font-family: var(--body);
          line-height: 1.5;
          overflow-x: hidden;
        }
        .dvl :focus-visible {
          outline: 2px solid var(--teal);
          outline-offset: 2px;
          border-radius: 4px;
        }
        .wrap { max-width: 1180px; margin: 0 auto; padding: 0 1.5rem; }

        .eyebrow {
          font-family: var(--mono);
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--teal);
          display: inline-block;
          margin-bottom: 1rem;
        }
        .h2 {
          font-family: var(--display);
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          font-weight: 600;
          letter-spacing: -0.02em;
          margin: 0;
        }

        /* Live dot (used in monitor header) */
        .tk-pulse {
          width: 6px; height: 6px; border-radius: 50%; background: var(--teal);
          box-shadow: 0 0 0 0 rgba(45,212,191,0.6); animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(45,212,191,0.5); }
          70% { box-shadow: 0 0 0 6px rgba(45,212,191,0); }
          100% { box-shadow: 0 0 0 0 rgba(45,212,191,0); }
        }

        /* Nav */
        .nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(7,18,15,0.82);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--line);
        }
        .nav-inner {
          max-width: 1180px; margin: 0 auto; padding: 0 1.5rem;
          height: 62px; display: flex; align-items: center; justify-content: space-between;
        }
        .brand { display: flex; align-items: center; text-decoration: none; }
        .brand-logo {
          height: 36px; width: auto; display: block;
          background: #fff; border-radius: 8px; padding: 5px 9px;
        }
        .foot-logo {
          height: 30px; width: auto; display: block;
          background: #fff; border-radius: 8px; padding: 4px 8px;
        }
        .brand-name {
          font-family: var(--display); font-weight: 600; font-size: 1.18rem;
          letter-spacing: -0.01em; color: var(--text);
        }
        .brand-accent { color: var(--teal); }
        .nav-links { display: none; align-items: center; gap: 1.6rem; }
        @media (min-width: 860px) { .nav-links { display: flex; } }
        .nav-link {
          font-size: 0.92rem; color: var(--text-mid); text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover { color: var(--text); }
        .nav-cta {
          font-family: var(--body); font-size: 0.88rem; font-weight: 600;
          color: var(--bg); background: var(--teal); border: none;
          padding: 0.5rem 1.1rem; border-radius: 8px; cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .nav-cta:hover { background: #54e6d4; transform: translateY(-1px); }

        /* Hero */
        .hero { padding: clamp(3rem, 7vw, 6rem) 1.5rem clamp(2.5rem, 5vw, 4rem); }
        .hero-grid {
          max-width: 1180px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr; gap: 3rem; align-items: center;
        }
        @media (min-width: 940px) {
          .hero-grid { grid-template-columns: 1.05fr 0.95fr; gap: 4rem; }
        }
        .hero-title {
          font-family: var(--display); font-weight: 700;
          font-size: clamp(2.2rem, 5.4vw, 3.8rem); line-height: 1.04;
          letter-spacing: -0.03em; margin: 0 0 1.3rem;
        }
        .hero-title-accent {
          background: linear-gradient(100deg, var(--teal), #7af0e0 60%, var(--gold));
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-sub {
          font-size: 1.08rem; color: var(--text-mid); max-width: 34rem; margin: 0 0 2rem;
        }
        .hero-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.6rem; }
        .hero-meta {
          font-family: var(--mono); font-size: 0.72rem; color: var(--text-dim);
          display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap;
        }
        .hero-meta .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--line-bright); }

        .btn {
          font-family: var(--body); font-size: 0.94rem; font-weight: 600;
          padding: 0.72rem 1.4rem; border-radius: 9px; cursor: pointer;
          text-decoration: none; display: inline-flex; align-items: center;
          border: 1px solid transparent; transition: all 0.2s;
        }
        .btn-primary { background: var(--teal); color: var(--bg); }
        .btn-primary:hover { background: #54e6d4; transform: translateY(-1px); box-shadow: 0 10px 30px -12px rgba(45,212,191,0.5); }
        .btn-ghost { background: var(--surface); color: var(--text); border-color: var(--line-bright); }
        .btn-ghost:hover { border-color: var(--teal); background: var(--surface-2); }
        .btn-line { background: transparent; color: var(--text-mid); border-color: var(--line); }
        .btn-line:hover { color: var(--teal); border-color: var(--teal); }
        .btn-block { width: 100%; justify-content: center; }

        /* Monitor (signature) */
        .monitor {
          background: linear-gradient(180deg, var(--surface), var(--bg-2));
          border: 1px solid var(--line-bright); border-radius: 16px;
          box-shadow: 0 30px 80px -40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.03);
          overflow: hidden;
        }
        .monitor-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.85rem 1.1rem; border-bottom: 1px solid var(--line);
          font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.12em;
        }
        .monitor-title { color: var(--text-mid); }
        .monitor-flag { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--teal); }
        .monitor-body { padding: 1.3rem; }
        .monitor-cap { font-family: var(--mono); font-size: 0.66rem; letter-spacing: 0.14em; color: var(--text-dim); }
        .monitor-kpi { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.7rem; }
        .monitor-num {
          font-family: var(--display); font-weight: 600; font-size: 2.1rem;
          letter-spacing: -0.02em; line-height: 1;
        }
        .monitor-num-unit { color: var(--teal); font-size: 1.3rem; margin-left: 0.1rem; }
        .monitor-delta { font-family: var(--mono); font-size: 0.74rem; color: var(--teal); }
        .monitor-chart { width: 100%; height: 96px; display: block; }
        .monitor-line { stroke: var(--teal); stroke-width: 2; vector-effect: non-scaling-stroke; }
        .monitor-tiles {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; margin-top: 1rem;
        }
        .m-tile {
          background: var(--bg-2); border: 1px solid var(--line); border-radius: 10px;
          padding: 0.7rem 0.8rem; display: flex; flex-direction: column; gap: 0.15rem;
        }
        .m-tile-num { font-family: var(--display); font-weight: 600; font-size: 1.25rem; }
        .m-tile-cap { font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.1em; color: var(--text-dim); text-transform: uppercase; }

        /* Strip */
        .strip { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); background: rgba(10,24,21,0.5); }
        .strip-inner {
          max-width: 1180px; margin: 0 auto; padding: 1.6rem 1.5rem;
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.2rem;
        }
        @media (min-width: 700px) { .strip-inner { grid-template-columns: repeat(4, 1fr); } }
        .strip-item { display: flex; flex-direction: column; gap: 0.2rem; }
        .strip-num { font-family: var(--display); font-weight: 600; font-size: 1.9rem; color: var(--text); }
        .strip-label { font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-dim); }

        /* Extensions */
        .ext { padding: clamp(3.5rem, 7vw, 6rem) 0; }
        .ext-head {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 1rem; margin-bottom: 2.5rem;
        }
        .link-arrow { font-family: var(--mono); font-size: 0.8rem; color: var(--teal); text-decoration: none; white-space: nowrap; }
        .link-arrow:hover { color: #6ff0e1; }
        .ext-grid {
          display: grid; grid-template-columns: 1fr; gap: 1.4rem;
        }
        @media (min-width: 640px) { .ext-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1000px) { .ext-grid { grid-template-columns: repeat(3, 1fr); } }

        .card {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: 14px; overflow: hidden;
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.25s, box-shadow 0.25s;
          display: flex; flex-direction: column;
        }
        .card.is-in { opacity: 1; transform: translateY(0); }
        .card:hover {
          border-color: var(--line-bright);
          box-shadow: 0 24px 60px -34px rgba(45,212,191,0.4);
          transform: translateY(-3px);
        }
        .card-preview {
          position: relative; height: 150px;
          background:
            linear-gradient(180deg, var(--bg-2), var(--surface)),
            repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(45,212,191,0.04) 24px);
          border-bottom: 1px solid var(--line);
        }
        .card-viz { position: absolute; inset: 0; padding: 0.6rem; }
        .card-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .card-index {
          position: absolute; top: 0.7rem; left: 0.8rem; z-index: 2;
          font-family: var(--mono); font-size: 0.66rem; letter-spacing: 0.1em; color: var(--text-dim);
          text-shadow: 0 1px 3px rgba(0,0,0,0.7);
        }
        .card-tag {
          position: absolute; top: 0.6rem; right: 0.7rem; z-index: 2;
          font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--teal); background: rgba(13,148,136,0.14);
          border: 1px solid var(--line-bright); padding: 0.2rem 0.5rem; border-radius: 999px;
        }
        .card-body { padding: 1.2rem 1.2rem 1.3rem; display: flex; flex-direction: column; flex: 1; }
        .card-title { font-family: var(--display); font-size: 1.12rem; font-weight: 600; margin: 0 0 0.5rem; }
        .card:hover .card-title { color: var(--teal); }
        .card-desc { font-size: 0.88rem; color: var(--text-mid); margin: 0 0 1.2rem; flex: 1; }
        .card-foot { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
        .card-links { display: flex; align-items: center; gap: 0.9rem; }
        .card-demo, .card-dl, .card-open { font-size: 0.82rem; text-decoration: none; transition: color 0.2s; }
        .card-demo { color: var(--text-mid); }
        .card-demo:hover { color: var(--gold); }
        .card-dl { color: var(--text-mid); }
        .card-dl:hover { color: var(--teal); }
        .card-open { font-family: var(--mono); font-size: 0.78rem; color: var(--teal); }
        .card-open:hover { color: #6ff0e1; }

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

        /* About */
        .about { padding: clamp(3rem, 6vw, 5rem) 0; border-top: 1px solid var(--line); background: rgba(10,24,21,0.4); }
        .about-grid { display: grid; grid-template-columns: 1fr; gap: 2.5rem; align-items: start; }
        @media (min-width: 880px) { .about-grid { grid-template-columns: 1.3fr 0.7fr; gap: 4rem; } }
        .about-text { color: var(--text-mid); margin: 0 0 1.6rem; max-width: 38rem; }
        .about-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; }
        .about-list li { color: var(--text-mid); font-size: 0.94rem; padding-left: 1.2rem; position: relative; }
        .about-list li::before { content: '▹'; position: absolute; left: 0; color: var(--teal); }
        .about-list strong { color: var(--text); font-weight: 600; }
        .about-panel {
          background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
          padding: 0.4rem 1.2rem;
        }
        .ap-row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.8rem 0; border-bottom: 1px solid var(--line); }
        .ap-row:last-child { border-bottom: none; }
        .ap-k { font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-dim); }
        .ap-v { font-size: 0.86rem; color: var(--text); text-align: right; }

        /* Contact */
        .contact { padding: clamp(3rem, 6vw, 5rem) 0; }
        .contact-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; margin-top: 2rem; }
        @media (min-width: 880px) { .contact-grid { grid-template-columns: 1.2fr 0.8fr; gap: 3rem; } }
        .form { display: flex; flex-direction: column; gap: 1.2rem; }
        .field { display: flex; flex-direction: column; gap: 0.45rem; }
        .label { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); }
        .input {
          width: 100%; background: var(--bg-2); border: 1px solid var(--line);
          border-radius: 9px; padding: 0.75rem 0.9rem; color: var(--text);
          font-family: var(--body); font-size: 0.94rem; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input::placeholder { color: var(--text-dim); }
        .input:focus { outline: none; border-color: var(--teal); box-shadow: 0 0 0 3px rgba(45,212,191,0.14); }
        .textarea { resize: vertical; min-height: 7rem; }
        .form-ok {
          background: rgba(45,212,191,0.1); border: 1px solid var(--line-bright);
          color: var(--teal); padding: 0.7rem 0.9rem; border-radius: 9px; font-size: 0.86rem;
        }
        .contact-side { display: flex; flex-direction: column; gap: 1.2rem; }
        .info { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 1.3rem; }
        .info-title { font-family: var(--display); font-size: 1.05rem; font-weight: 600; margin: 0 0 0.9rem; }
        .info-row {
          display: flex; justify-content: space-between; gap: 1rem; padding: 0.55rem 0;
          border-bottom: 1px solid var(--line); text-decoration: none; color: inherit;
        }
        .info-row:last-child { border-bottom: none; }
        a.info-row:hover .info-v { color: var(--teal); }
        .info-k { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-dim); }
        .info-v { font-size: 0.88rem; color: var(--text); transition: color 0.2s; }
        .social { display: flex; gap: 0.7rem; }
        .soc {
          width: 42px; height: 42px; border-radius: 10px; display: grid; place-items: center;
          background: var(--bg-2); border: 1px solid var(--line); color: var(--text-mid);
          text-decoration: none; font-weight: 600; cursor: pointer; transition: all 0.2s;
          font-family: var(--body);
        }
        .soc:hover { color: var(--teal); border-color: var(--teal); transform: translateY(-2px); }

        /* Footer */
        .foot { border-top: 1px solid var(--line); padding: 2rem 0; }
        .foot-inner { display: flex; flex-direction: column; gap: 0.6rem; align-items: center; text-align: center; }
        @media (min-width: 700px) { .foot-inner { flex-direction: row; justify-content: space-between; text-align: left; } }
        .foot-brand { font-size: 1.05rem; }
        .foot-text { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.05em; color: var(--text-dim); }

        @media (prefers-reduced-motion: reduce) {
          .dvl *, .dvl *::before { animation: none !important; transition: none !important; }
          .card { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}

export default Home;
