import { useEffect, useRef, useState } from 'react';

/**
 * Treasury KPI — Tableau Viz Extension, hosted as a React route.
 *
 * Tableau loads this page by URL inside a sandboxed iframe and calls
 * initializeAsync(). Wire it to a route (e.g. /treasury-kpi) and point the
 * .trex manifest <source-location> at the deployed URL.
 *
 * The Tableau data-reading logic (getData / getEnc / dv / num) is preserved
 * exactly from the working single-file extension; only the rendering moved
 * into React. Outside Tableau, a demo model renders so /treasury-kpi previews.
 */

const TABLEAU_SRC =
  'https://cdn.jsdelivr.net/gh/tableau/extensions-api/lib/tableau.extensions.1.latest.js';

const THEMES = {
  up: { s: '#16a34a', ib: '#dcfce7', vc: '#16a34a', bc: '#16a34a' },
  down: { s: '#dc2626', ib: '#fee2e2', vc: '#dc2626', bc: '#dc2626' },
  neu: { s: '#cbd5e1', ib: '#f1f5f9', vc: '#64748b', bc: '#cbd5e1' },
};

const DEMO = {
  ready: true,
  isDemo: true,
  label: 'Treasury Position',
  actualN: 12.84e9,
  deltaN: 0.42e9,
  dir: 'up',
  sign: '+0.42',
  pct: 3.38,
  barWidth: 65,
};

const INITIAL = {
  ready: false,
  isDemo: false,
  label: 'Loading…',
  actualN: null,
  deltaN: null,
  dir: 'neu',
  sign: null,
  pct: null,
  barWidth: 0,
};

/* ── number helpers (unchanged) ── */
function toBn(n) {
  if (n === null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  const s = n < 0 ? '-' : '';
  return s + (abs >= 1e6 ? abs / 1e9 : abs).toFixed(2);
}
function signBn(n) {
  if (n === null || isNaN(n)) return null;
  const abs = Math.abs(n);
  const s = n >= 0 ? '+' : '-';
  return s + (abs >= 1e6 ? abs / 1e9 : abs).toFixed(2);
}
function pctOf(d, a) {
  if (!a || !d || a === 0) return null;
  const aBn = Math.abs(a) >= 1e6 ? a / 1e9 : a;
  const dBn = Math.abs(d) >= 1e6 ? d / 1e9 : d;
  const prev = aBn - dBn;
  if (Math.abs(prev) < 0.0001) return null;
  return (dBn / Math.abs(prev)) * 100;
}
function pretty(name) {
  return name
    .replace(/^(SUM|AVG|MIN|MAX|COUNT|ATTR)\((.+)\)$/i, '$2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/* ── EXACT getData from working KPI card ── */
async function getData(ws) {
  const rows = [];
  const reader = await ws.getSummaryDataReaderAsync(undefined, { ignoreSelection: true });
  for (let i = 0; i < reader.pageCount; i++) {
    const pg = await reader.getPageAsync(i);
    pg.data.forEach((r) => {
      const row = {};
      pg.columns.forEach((c, idx) => {
        row[c.fieldName] = r[idx];
      });
      rows.push(row);
    });
  }
  await reader.releaseAsync();
  return rows;
}

/* ── EXACT getEnc from working KPI card ── */
async function getEnc(ws) {
  const spec = await ws.getVisualSpecificationAsync();
  const map = {};
  if (spec.activeMarksSpecificationIndex < 0) return map;
  const marks = spec.marksSpecifications[spec.activeMarksSpecificationIndex];
  marks.encodings.forEach((e) => {
    map[e.id] = e.field;
  });
  return map;
}

function loadTableau() {
  return new Promise((resolve, reject) => {
    if (window.tableau && window.tableau.extensions) return resolve(window.tableau);
    let s = document.querySelector(`script[src="${TABLEAU_SRC}"]`);
    if (s) {
      if (s.dataset.loaded) return resolve(window.tableau);
      s.addEventListener('load', () => resolve(window.tableau));
      s.addEventListener('error', reject);
      return;
    }
    s = document.createElement('script');
    s.src = TABLEAU_SRC;
    s.async = true;
    s.addEventListener('load', () => {
      s.dataset.loaded = '1';
      resolve(window.tableau);
    });
    s.addEventListener('error', reject);
    document.head.appendChild(s);
  });
}

function ensureFont() {
  const id = 'tk-inter-font';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
  document.head.appendChild(link);
}

function Arrow({ dir }) {
  if (dir === 'up')
    return (
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <polyline points="1.5,9 5.5,1.5 9.5,9" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (dir === 'down')
    return (
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <polyline points="1.5,1.5 5.5,9 9.5,1.5" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <line x1="1.5" y1="5.5" x2="9.5" y2="5.5" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function TreasuryKPI() {
  const [model, setModel] = useState(INITIAL);
  const heroRef = useRef(null);

  // Centered, non-scrolling layout for the extension card; restore on unmount.
  useEffect(() => {
    ensureFont();
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const snap = {
      html: html.getAttribute('style'),
      body: body.getAttribute('style'),
      root: root ? root.getAttribute('style') : null,
    };
    Object.assign(html.style, { height: '100%' });
    Object.assign(body.style, {
      height: '100%',
      margin: '0',
      background: '#f4f6f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    });
    if (root)
      Object.assign(root.style, {
        width: '100%',
        height: '100%',
        margin: '0',
        padding: '0',
        maxWidth: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });
    return () => {
      html.setAttribute('style', snap.html || '');
      body.setAttribute('style', snap.body || '');
      if (root) root.setAttribute('style', snap.root || '');
    };
  }, []);

  // Initialise the Tableau extension; fall back to demo data outside Tableau.
  useEffect(() => {
    let ws;
    let handler;
    let cancelled = false;
    let demoTimer;

    const update = async () => {
      const data = await getData(ws);
      const enc = await getEnc(ws);
      if (!enc.actual || !data.length) return;

      const row = data[0];
      const dv = (id) => (enc[id] ? row[enc[id].name] || null : null);
      const num = (id) => {
        const d = dv(id);
        if (!d) return null;
        const n = parseFloat(d.nativeValue !== undefined ? d.nativeValue : d.value);
        return isNaN(n) ? null : n;
      };

      const actualN = num('actual');
      const deltaN = num('delta');
      if (actualN === null) return;

      const dir = deltaN === null ? 'neu' : deltaN > 0 ? 'up' : deltaN < 0 ? 'down' : 'neu';
      const barWidth =
        deltaN !== null
          ? Math.min(100, Math.max(2, Math.round(Math.abs(deltaN / actualN) * 2000)))
          : 0;

      clearTimeout(demoTimer);
      if (!cancelled)
        setModel({
          ready: true,
          isDemo: false,
          label: pretty(enc.actual.name),
          actualN,
          deltaN,
          dir,
          sign: signBn(deltaN),
          pct: pctOf(deltaN, actualN),
          barWidth,
        });
    };

    // If we're not inside Tableau, show the demo card after a short wait.
    demoTimer = setTimeout(() => {
      if (!cancelled) setModel(DEMO);
    }, 1800);

    loadTableau()
      .then((tableau) =>
        tableau.extensions.initializeAsync().then(() => {
          if (cancelled) return;
          ws = tableau.extensions.worksheetContent.worksheet;
          handler = () => update();
          ws.addEventListener(tableau.TableauEventType.SummaryDataChanged, handler);
          update();
        })
      )
      .catch(() => {
        clearTimeout(demoTimer);
        if (!cancelled) setModel(DEMO);
      });

    return () => {
      cancelled = true;
      clearTimeout(demoTimer);
      if (ws && handler) {
        try {
          ws.removeEventListener(window.tableau.TableauEventType.SummaryDataChanged, handler);
        } catch (e) {
          /* worksheet already gone */
        }
      }
    };
  }, []);

  // Count-up animation on the hero number.
  useEffect(() => {
    const el = heroRef.current;
    if (!el || model.actualN === null) return;
    const abs = Math.abs(model.actualN);
    const end = abs >= 1e6 ? abs / 1e9 : abs;
    const sign = model.actualN < 0 ? '-' : '';
    const steps = 50;
    const duration = 800;
    let step = 0;
    const start = parseFloat((el.textContent || '').replace(/[^0-9.]/g, '')) || 0;
    if (start === end) {
      el.textContent = sign + end.toFixed(2);
      return;
    }
    const timer = setInterval(() => {
      step++;
      let t = step / steps;
      t = 1 - Math.pow(1 - t, 3);
      const cur = start + (end - start) * t;
      el.textContent = sign + cur.toFixed(2);
      if (step >= steps) {
        clearInterval(timer);
        el.textContent = sign + end.toFixed(2);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [model.actualN]);

  const th = THEMES[model.dir] || THEMES.neu;
  const hasDelta = model.deltaN !== null;

  return (
    <div className="tk-app">
      <div className="tk-card">
        <div className="tk-stripe" style={{ background: th.s }} />
        <div className="tk-body">
          <div className="tk-lbl">
            {model.label}
            {model.isDemo && <span className="tk-demo">DEMO</span>}
          </div>

          <div className="tk-hero">
            <span className="tk-hnum" ref={heroRef}>
              {model.actualN === null ? '—' : toBn(model.actualN)}
            </span>
            <span className="tk-hunit">Bn</span>
          </div>

          <div className="tk-divl" />

          <div className="tk-vrow">
            <div className="tk-vleft">
              <div className="tk-ibox" style={{ background: th.ib }}>
                <Arrow dir={model.dir} />
              </div>
              <span className="tk-vnum" style={{ color: th.vc }}>
                {hasDelta ? (
                  <>
                    {model.sign}
                    <span className="tk-vunit">Bn</span>
                  </>
                ) : model.ready ? (
                  'Drop Delta field'
                ) : (
                  '—'
                )}
              </span>
            </div>
            <span className="tk-vslbl">vs yesterday</span>
          </div>

          <div className="tk-btrack">
            <div className="tk-bfill" style={{ width: `${model.barWidth}%`, background: th.bc }} />
          </div>
          <div className="tk-bfoot">
            <span>{hasDelta ? `Δ ${model.sign} Bn` : '—'}</span>
            <span>{model.pct !== null ? `${model.pct >= 0 ? '+' : ''}${model.pct.toFixed(2)}%` : '—'}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .tk-app, .tk-app * { box-sizing: border-box; }
        .tk-app {
          width: calc(100% - 14px);
          max-width: 260px;
          font-family: 'Inter', -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .tk-card {
          background: #fff;
          border-radius: 14px;
          border: 0.5px solid #e2e8f0;
          overflow: hidden;
          position: relative;
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.04),
            0 4px 12px rgba(15, 23, 42, 0.07),
            0 14px 36px rgba(15, 23, 42, 0.05);
        }
        .tk-stripe { height: 3px; width: 100%; background: #f1f5f9; }
        .tk-body { padding: 13px 15px 12px; }
        .tk-lbl {
          font-size: 9px; font-weight: 600; letter-spacing: 0.11em; text-transform: uppercase;
          color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 9px; min-height: 12px; display: flex; align-items: center; gap: 6px;
        }
        .tk-demo {
          font-size: 7.5px; font-weight: 600; letter-spacing: 0.08em; color: #64748b;
          background: #f1f5f9; border: 0.5px solid #e2e8f0; border-radius: 4px; padding: 1px 4px;
        }
        .tk-hero { display: flex; align-items: baseline; gap: 5px; margin-bottom: 3px; }
        .tk-hnum {
          font-size: 34px; font-weight: 700; color: #0f172a; letter-spacing: -0.035em; line-height: 1;
          font-variant-numeric: tabular-nums; white-space: nowrap;
        }
        .tk-hunit { font-size: 12px; font-weight: 400; color: #cbd5e1; letter-spacing: 0.05em; }
        .tk-divl { height: 0.5px; background: #f1f5f9; margin: 10px 0; }
        .tk-vrow { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; }
        .tk-vleft { display: flex; align-items: center; gap: 5px; }
        .tk-ibox {
          width: 24px; height: 24px; border-radius: 7px; background: #f1f5f9;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .tk-vnum {
          font-size: 12.5px; font-weight: 600; color: #64748b;
          font-variant-numeric: tabular-nums; white-space: nowrap;
        }
        .tk-vunit { font-size: 10px; font-weight: 400; opacity: 0.6; margin-left: 1px; }
        .tk-vslbl { font-size: 9px; color: #cbd5e1; }
        .tk-btrack { height: 3px; background: #f1f5f9; border-radius: 99px; overflow: hidden; margin-bottom: 5px; }
        .tk-bfill { height: 100%; border-radius: 99px; background: #f1f5f9; width: 0%; transition: width 0.55s cubic-bezier(0.22, 0.68, 0, 1); }
        .tk-bfoot { display: flex; justify-content: space-between; font-size: 8px; color: #cbd5e1; }
      `}</style>
    </div>
  );
}
