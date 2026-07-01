import { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════
   CASH POSITION CARDS — single-file React Viz Extension
   Default: Total LCEY (2x2) + LKR + USD + EUR + GBP.
   The LKR card has a "Breakdown" toggle. When ON, the 3 FCY
   cards animate out and the 5 LKR-category cards animate in
   (Cash on Hand, In Transit, ATM, CRM, CDM). Toggle OFF → FCY
   returns. Pure-white rounded cards, transparent bg, icons +
   flags, auto-unit hero, delta arrow, trend line. Responsive.

   Fields (Detail, per card, by name):
     <key>_hero _delta _value _date  [+ _header override]
   keys: lcey, lkr, usd, eur, gbp, coh, cit, atm, crm, cdm
═══════════════════════════════════════════════════════════ */

if (typeof window !== "undefined" && !document.getElementById("cc-kf")) {
  const s = document.createElement("style");
  s.id = "cc-kf";
  s.innerHTML =
    "@keyframes ccShim{0%{background-position:200% 0}100%{background-position:-200% 0}}" +
    "@keyframes ccEnter{0%{opacity:0;transform:translateY(12px) scale(.96)}100%{opacity:1;transform:none}}";
  document.head.appendChild(s);
}

const C = {
  ink: "#0b1220", sub: "#475569", mut: "#94a3b8", faint: "#cbd5e1",
  bg: "#ffffff", line: "#e8ebf0",
  teal: "#0d9488", tealLt: "#2dd4bf", tealDk: "#0f766e", tealBg: "rgba(13,148,136,.08)",
  green: "#16a34a", greenGlow: "rgba(22,163,74,.10)",
  red: "#dc2626", redGlow: "rgba(220,38,38,.10)",
};

/* ── formatters ── */
function fmtHero(n) {
  if (n == null || isNaN(n)) return { num: "—", unit: "" };
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1e12) return { num: s + (a / 1e12).toFixed(2), unit: "Tn" };
  if (a >= 1e9)  return { num: s + (a / 1e9).toFixed(2),  unit: "Bn" };
  if (a >= 1e6)  return { num: s + (a / 1e6).toFixed(2),  unit: "Mn" };
  if (a >= 1e3)  return { num: s + (a / 1e3).toFixed(2),  unit: "K"  };
  return { num: s + a.toFixed(2), unit: "" };
}
function fmtDelta(n) {
  if (n == null || isNaN(n)) return "—";
  const a = Math.abs(n), s = n >= 0 ? "+" : "-";
  if (a >= 1e9) return s + (a / 1e9).toFixed(2) + "Bn";
  if (a >= 1e6) return s + (a / 1e6).toFixed(2) + "Mn";
  if (a >= 1e3) return s + (a / 1e3).toFixed(1) + "K";
  return s + Math.round(a).toLocaleString("en-US");
}
function pretty(s) {
  if (!s) return "";
  return s.replace(/^(SUM|AVG|MIN|MAX|COUNT|ATTR)\((.+)\)$/i, "$2")
          .replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

/* ── Tableau readers ── */
async function readRows(ws) {
  const rows = [];
  const reader = await ws.getSummaryDataReaderAsync(undefined, { ignoreSelection: true });
  for (let i = 0; i < reader.pageCount; i++) {
    const page = await reader.getPageAsync(i);
    page.data.forEach((r) => {
      const row = {};
      page.columns.forEach((c, idx) => { row[c.fieldName] = r[idx]; });
      rows.push(row);
    });
  }
  await reader.releaseAsync();
  return rows;
}
function norm(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ""); }
function inner(c) { return c.replace(/^(SUM|AVG|MIN|MAX|COUNT|ATTR|MEDIAN|STDEV|VAR)\((.+)\)$/i, "$2"); }
function keyFor(rows, name) {
  if (!rows.length) return null;
  const rk = Object.keys(rows[0]);
  const lc = name.toLowerCase(), nm = norm(name);
  let k = rk.find((c) => c.toLowerCase() === lc); if (k) return k;
  k = rk.find((c) => inner(c).toLowerCase() === lc); if (k) return k;
  k = rk.find((c) => norm(inner(c)) === nm); if (k) return k;
  return null;
}
function vStr(row, k) {
  if (!k || !row || !row[k]) return null;
  const dv = row[k];
  const fv = dv.formattedValue != null ? String(dv.formattedValue).trim() : "";
  if (fv && fv !== "%null%" && fv !== "Null" && fv !== "null") return fv;
  return null;
}
function vNum(row, k) {
  if (!k || !row || !row[k]) return null;
  const dv = row[k];
  const raw = dv.nativeValue != null ? dv.nativeValue : dv.value;
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}
function parseDate(dv) {
  if (!dv) return null;
  const nv = dv.nativeValue ?? dv.value;
  const fv = (dv.formattedValue || "").trim();
  if (typeof nv === "number" && nv > 1e10) { const d = new Date(nv); if (d.getFullYear() >= 1990) return d; }
  if (fv) { const iso = fv.match(/^(\d{4})-(\d{2})-(\d{2})/); if (iso) return new Date(+iso[1], +iso[2]-1, +iso[3]); const d2 = new Date(fv); if (!isNaN(d2.getTime()) && d2.getFullYear() >= 1990) return d2; }
  return null;
}

/* ── icons ── */
const Icon = {
  bank: <path d="M3 21h18M4 21V10m4 11V10m8 11V10m4 11V10M12 3 3 8h18l-9-5Z"/>,
  rupee: <path d="M6 3h12M6 8h12M15.5 3c0 4-3 5-6.5 5H6l7 10"/>,
  wallet: <g><path d="M3 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h13"/><circle cx="17" cy="13" r="1.3"/></g>,
  truck: <g><path d="M1 4h13v11H1zM14 8h4l3 3v4h-7"/><circle cx="6" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/></g>,
  atm: <g><rect x="4" y="3" width="16" height="14" rx="1.5"/><path d="M8 21h8M9 7h6M9 11h4"/></g>,
  recycle: <path d="M7 19H4l3-5m10 5 2-3-5 1M12 4l3 5-6 0m8-1 1.5 3M6.5 9 5 6"/>,
  deposit: <path d="M12 3v9m0 0 4-4m-4 4-4-4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>,
};
function FlagUSD() { return (
  <svg width="26" height="18" viewBox="0 0 26 18" style={{ borderRadius:3, display:"block", boxShadow:"0 0 0 1px rgba(0,0,0,.06)" }}>
    {[0,1,2,3,4,5,6].map((i) => <rect key={i} x="0" y={i * (18/7)} width="26" height={18/7} fill={i % 2 ? "#fff" : "#b22234"} />)}
    <rect x="0" y="0" width="11" height={18/7*4} fill="#3c3b6e" />
  </svg>); }
function FlagEUR() { return (
  <svg width="26" height="18" viewBox="0 0 26 18" style={{ borderRadius:3, display:"block", boxShadow:"0 0 0 1px rgba(0,0,0,.06)" }}>
    <rect width="26" height="18" fill="#003399" />
    {[...Array(12)].map((_, i) => { const a = (i/12)*Math.PI*2 - Math.PI/2; return <circle key={i} cx={13+Math.cos(a)*5.5} cy={9+Math.sin(a)*5.5} r="0.9" fill="#ffcc00" />; })}
  </svg>); }
function FlagGBP() { return (
  <svg width="26" height="18" viewBox="0 0 26 18" style={{ borderRadius:3, display:"block", boxShadow:"0 0 0 1px rgba(0,0,0,.06)" }}>
    <rect width="26" height="18" fill="#012169" />
    <path d="M0 0 26 18M26 0 0 18" stroke="#fff" strokeWidth="3.5" />
    <path d="M0 0 26 18M26 0 0 18" stroke="#c8102e" strokeWidth="1.8" />
    <path d="M13 0V18M0 9H26" stroke="#fff" strokeWidth="5" />
    <path d="M13 0V18M0 9H26" stroke="#c8102e" strokeWidth="2.6" />
  </svg>); }

/* card definitions */
const LCEY = { key: "lcey", label: "Total LCEY", icon: "bank", big: true };
const LKR  = { key: "lkr",  label: "LKR", icon: "rupee", toggle: true };
const FCY  = [
  { key: "usd", label: "USD", flag: "USD" },
  { key: "eur", label: "EUR", flag: "EUR" },
  { key: "gbp", label: "GBP", flag: "GBP" },
];
const BREAKDOWN = [
  { key: "coh", label: "Cash on Hand",    icon: "wallet"  },
  { key: "cit", label: "Cash in Transit", icon: "truck"   },
  { key: "atm", label: "ATM Cash",        icon: "atm"     },
  { key: "crm", label: "CRM Cash",        icon: "recycle" },
  { key: "cdm", label: "CDM Cash",        icon: "deposit" },
];

/* ════════════════════════════════
   ROOT
════════════════════════════════ */
export default function CashCards() {
  const [state, setState] = useState({ loading: true, error: null, rows: [] });

  useEffect(() => {
    async function init() {
      try {
        await window.tableau.extensions.initializeAsync();
        const ws = window.tableau.extensions.worksheetContent.worksheet;
        const load = async () => {
          const rows = await readRows(ws);
          setState({ loading: false, error: null, rows });
        };
        ws.addEventListener(window.tableau.TableauEventType.SummaryDataChanged, load);
        await load();
      } catch (err) {
        setState({ loading: false, error: err.message, rows: [] });
      }
    }
    init();
  }, []);

  if (state.loading) return <Shell><Skeleton /></Shell>;
  if (state.error)   return <Shell><ErrView msg={state.error} /></Shell>;
  return <Shell><Grid rows={state.rows} /></Shell>;
}

function Shell({ children }) {
  return (
    <div style={{ width:"100%", height:"100%", background:"transparent", padding:8,
                  fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif", WebkitFontSmoothing:"antialiased",
                  boxSizing:"border-box", overflow:"hidden" }}>
      {children}
    </div>
  );
}

/* ════════════════════════════════
   GRID  (with breakdown toggle)
════════════════════════════════ */
function Grid({ rows }) {
  const wrapRef = useRef(null);
  const [cols, setCols] = useState(5);
  const [breakdown, setBreakdown] = useState(false);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => {
      const w = e[0].contentRect.width;
      setCols(w >= 1000 ? (breakdown ? 5 : 4) : w >= 680 ? (breakdown ? 4 : 3) : 2);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [breakdown]);

  const build = (key) => {
    const hk = keyFor(rows, key + "_header");
    const hr = keyFor(rows, key + "_hero");
    const dk = keyFor(rows, key + "_delta");
    const vk = keyFor(rows, key + "_value");
    const tk = keyFor(rows, key + "_date");
    const headerOverride = vStr(rows[0], hk);
    let hero = null;
    if (hr) { let s = 0, c = 0; rows.forEach((r) => { const v = vNum(r, hr); if (v != null) { s += v; c++; } }); if (c) hero = s; }
    const delta = vNum(rows[0], dk);
    let pts = [];
    rows.forEach((r) => { const v = vNum(r, vk); if (v == null) return; pts.push({ v, d: tk ? parseDate(r[tk]) : null }); });
    if (pts.length && pts[0].d) pts.sort((a, b) => (a.d?.getTime() || 0) - (b.d?.getTime() || 0));
    return { hero, delta, pts: pts.map((x) => x.v), headerOverride, has: !!(hr || vk) };
  };

  /* which small cards show */
  const smallCards = breakdown ? [LKR, ...BREAKDOWN] : [LKR, ...FCY];

  const gridStyle = {
    display: "grid", width: "100%", height: "100%", gap: 10, boxSizing: "border-box",
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gridTemplateRows: cols >= 4 ? "1fr 1fr" : "auto",
    gridAutoRows: cols === 2 ? "minmax(120px,1fr)" : undefined,
    transition: "grid-template-columns .45s cubic-bezier(.16,1,.3,1)",
  };
  const bigSpan = cols === 2
    ? { gridColumn: "1 / 3", gridRow: "1 / 2", minHeight: 170 }
    : { gridColumn: "1 / 3", gridRow: "1 / 3" };

  return (
    <div ref={wrapRef} style={{ width:"100%", height:"100%" }}>
      <div style={gridStyle}>
        {/* big LCEY — always */}
        <div style={{ minWidth:0, minHeight:0, ...bigSpan }}>
          <Card cfg={LCEY} d={build(LCEY.key)} idx={0} />
        </div>

        {/* small cards — re-keyed on `breakdown` so they replay entrance animation */}
        {smallCards.map((cfg, i) => (
          <div key={(breakdown ? "b-" : "f-") + cfg.key} style={{ minWidth:0, minHeight:0 }}>
            <Card
              cfg={cfg}
              d={build(cfg.key)}
              idx={i + 1}
              enter
              breakdownOn={breakdown}
              onToggle={cfg.toggle ? () => setBreakdown((v) => !v) : null}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════
   CARD
════════════════════════════════ */
function Card({ cfg, d, idx, enter, onToggle, breakdownOn }) {
  const big = !!cfg.big;
  const svgRef = useRef(null);
  const valsKey = d.pts.join(",");

  useEffect(() => {
    if (!svgRef.current) return;
    buildSpark(svgRef.current, d.pts, big);
  }, [valsKey, big]); // eslint-disable-line

  const header = d.headerOverride ? pretty(d.headerOverride) : cfg.label;
  const hero = fmtHero(d.hero);
  const dPos = d.delta != null ? d.delta >= 0 : null;
  const dColor = dPos === true ? C.green : dPos === false ? C.red : C.mut;
  const dGlow  = dPos === true ? C.greenGlow : dPos === false ? C.redGlow : "transparent";
  const active = !!onToggle && breakdownOn;

  return (
    <div style={{
      position:"relative", width:"100%", height:"100%", boxSizing:"border-box", background:C.bg,
      borderRadius: big ? 20 : 16,
      border:`1px solid ${active ? "rgba(13,148,136,.4)" : C.line}`,
      boxShadow: active
        ? "0 0 0 3px rgba(13,148,136,.10), 0 2px 12px rgba(13,148,136,.10)"
        : big ? "0 2px 12px rgba(15,28,46,.06),0 10px 30px rgba(15,28,46,.06)" : "0 1px 5px rgba(15,28,46,.05)",
      padding: big ? "20px 22px 16px" : "14px 15px 11px",
      display:"flex", flexDirection:"column", overflow:"hidden",
      animation: enter ? `ccEnter .5s cubic-bezier(.16,1,.3,1) ${idx * 0.05}s both` : `ccEnter .5s cubic-bezier(.16,1,.3,1) both`,
      transition:"border-color .3s, box-shadow .3s",
    }}>
      {/* header row */}
      <div style={{ display:"flex", alignItems:"center", gap: big ? 9 : 7, marginBottom: big ? 12 : 7 }}>
        <span style={{ flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                       width: big ? 30 : 22, height: big ? 30 : 22, borderRadius: big ? 9 : 7,
                       background: cfg.flag ? "transparent" : C.tealBg }}>
          {cfg.flag
            ? (cfg.flag === "USD" ? <FlagUSD /> : cfg.flag === "EUR" ? <FlagEUR /> : <FlagGBP />)
            : <svg width={big ? 17 : 13} height={big ? 17 : 13} viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{Icon[cfg.icon]}</svg>
          }
        </span>
        <span style={{ fontSize: big ? 12 : 9.5, fontWeight:700, letterSpacing:".05em", textTransform:"uppercase",
                       color:C.mut, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", flex:1 }}>{header}</span>

        {/* breakdown toggle (LKR only) */}
        {onToggle && <ToggleBtn active={active} onClick={onToggle} />}
      </div>

      {/* hero */}
      <div style={{ display:"flex", alignItems:"baseline", gap: big ? 8 : 5, flexWrap:"wrap" }}>
        <span style={{ fontSize: big ? 48 : 25, fontWeight:800, color:C.ink, letterSpacing:"-.045em", lineHeight:1,
                       fontVariantNumeric:"tabular-nums", fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace" }}>
          {hero.num}
        </span>
        {hero.unit && <span style={{ fontSize: big ? 19 : 11, fontWeight:600, color:C.mut }}>{hero.unit}</span>}
      </div>

      {/* delta */}
      {d.delta != null && (
        <div style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop: big ? 11 : 6, alignSelf:"flex-start",
                      padding: big ? "4px 11px" : "2px 8px", borderRadius:20, background:dGlow }}>
          <svg width={big ? 13 : 11} height={big ? 13 : 11} viewBox="0 0 24 24" fill="none" stroke={dColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={dPos ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
          </svg>
          <span style={{ fontSize: big ? 13 : 10.5, fontWeight:700, color:dColor, fontVariantNumeric:"tabular-nums" }}>{fmtDelta(d.delta)}</span>
          <span style={{ fontSize: big ? 10 : 8, fontWeight:500, color:C.mut, marginLeft:2 }}>vs last day</span>
        </div>
      )}

      {/* trend */}
      <div style={{ flex:1, minHeight: big ? 70 : 30, marginTop:"auto", paddingTop: big ? 12 : 6, display:"flex", alignItems:"flex-end" }}>
        <svg ref={svgRef} viewBox={`0 0 240 ${big ? 80 : 40}`} preserveAspectRatio="none"
             style={{ width:"100%", height: big ? 80 : 40, display:"block", overflow:"visible" }} />
      </div>
    </div>
  );
}

/* ── modern toggle button ── */
function ToggleBtn({ active, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={active ? "Hide breakdown" : "View LKR breakdown"}
      style={{
        display:"inline-flex", alignItems:"center", gap:4, flexShrink:0, height:22, padding:"0 8px 0 7px",
        borderRadius:20, cursor:"pointer", outline:"none", fontFamily:"inherit", fontSize:9.5, fontWeight:700,
        letterSpacing:".02em", textTransform:"uppercase",
        border:"1px solid " + (active || hov ? "rgba(13,148,136,.4)" : C.line),
        background: active ? C.teal : hov ? "rgba(13,148,136,.08)" : "#fff",
        color: active ? "#fff" : C.tealDk,
        transition:"all .22s cubic-bezier(.16,1,.3,1)",
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
           style={{ transform: active ? "rotate(180deg)" : "none", transition:"transform .3s cubic-bezier(.16,1,.3,1)" }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
      {active ? "Hide" : "Split"}
    </button>
  );
}

function buildSpark(svg, values, big) {
  if (!svg) return;
  svg.innerHTML = "";
  if (values.length < 2) return;
  const ns = "http://www.w3.org/2000/svg";
  const W = 240, H = big ? 80 : 40, pad = 5;
  const min = Math.min(...values), max = Math.max(...values), rng = max - min || 1, n = values.length;
  const toY = (v) => pad + (1 - (v - min) / rng) * (H - pad * 2);
  const pts = values.map((v, i) => ({ x: (i / (n - 1)) * W, y: toY(v) }));
  const bez = (p) => {
    let d = `M ${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i];
      d += ` C ${(a.x + (b.x - a.x) * .4).toFixed(1)} ${a.y.toFixed(1)} ${(a.x + (b.x - a.x) * .6).toFixed(1)} ${b.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
    return d;
  };
  const mk = (t, a) => { const e = document.createElementNS(ns, t); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
  const defs = mk("defs", {});
  const gid = "ccF" + Math.random().toString(36).slice(2, 7);
  const g = mk("linearGradient", { id: gid, x1: "0", y1: "0", x2: "0", y2: "1" });
  g.append(mk("stop", { offset: "0%", "stop-color": C.tealLt, "stop-opacity": ".28" }), mk("stop", { offset: "100%", "stop-color": C.teal, "stop-opacity": "0" }));
  defs.append(g); svg.appendChild(defs);
  const d = bez(pts);
  svg.appendChild(mk("path", { d: `${d} L ${pts[n-1].x} ${H} L ${pts[0].x} ${H} Z`, fill: `url(#${gid})` }));
  const line = mk("path", { d, fill: "none", stroke: C.teal, "stroke-width": big ? "2.5" : "1.9", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": "700", "stroke-dashoffset": "700" });
  svg.appendChild(line);
  requestAnimationFrame(() => { line.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1)"; line.setAttribute("stroke-dashoffset", "0"); });
  const lp = pts[n - 1];
  const dot = mk("circle", { cx: lp.x, cy: lp.y, r: big ? "3.6" : "2.8", fill: C.tealDk, stroke: "#fff", "stroke-width": big ? "2" : "1.6" });
  dot.style.opacity = "0"; dot.style.transition = "opacity .3s .8s"; svg.appendChild(dot);
  requestAnimationFrame(() => { dot.style.opacity = "1"; });
}

/* ── states ── */
function Skeleton() {
  return (
    <div style={{ width:"100%", height:"100%", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gridTemplateRows:"1fr 1fr", gap:10 }}>
      <div style={{ gridColumn:"1 / 3", gridRow:"1 / 3", borderRadius:20, background:"linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize:"200% 100%", animation:"ccShim 1.4s infinite" }} />
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ borderRadius:16, background:"linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize:"200% 100%", animation:"ccShim 1.4s infinite" }} />
      ))}
    </div>
  );
}
function ErrView({ msg }) {
  return (
    <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <span style={{ fontSize:11, color:"#dc2626", fontWeight:600, textAlign:"center" }}>{msg}</span>
    </div>
  );
}
