import { useEffect, useRef, useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════
   HERO CARDS — single-file React Viz Extension
   5 pure-white rounded cards on a transparent background.
   Card 1 is DOUBLE (2 cols x 2 rows). Cards 2-5 are single.
   Each card: dynamic header · hero amount (auto Mn/Bn) ·
   delta vs last working day (colored arrow) · trend line.

   Fields (drop ALL on Detail, per-card, matched by name):
     cardN_header (string)  — dynamic header
     cardN_hero   (numeric) — hero amount
     cardN_delta  (numeric) — vs last working day
     cardN_value  (numeric) — trend series
     cardN_date   (date)    — trend x-axis (optional)
   where N = 1..5
═══════════════════════════════════════════════════════════ */

if (typeof window !== "undefined" && !document.getElementById("hc-kf")) {
  const s = document.createElement("style");
  s.id = "hc-kf";
  s.innerHTML =
    "@keyframes hcShim{0%{background-position:200% 0}100%{background-position:-200% 0}}" +
    "@keyframes hcIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}";
  document.head.appendChild(s);
}

const C = {
  ink: "#0b1220", sub: "#475569", mut: "#94a3b8", faint: "#cbd5e1",
  bg: "#ffffff", line: "#e8ebf0", track: "#eef2f6",
  teal: "#0d9488", tealLt: "#2dd4bf", tealDk: "#0f766e",
  green: "#16a34a", greenGlow: "rgba(22,163,74,.10)",
  red: "#dc2626", redGlow: "rgba(220,38,38,.10)",
};

/* ── auto-unit hero formatter ── */
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

/* ════════════════════════════════
   ROOT
════════════════════════════════ */
export default function HeroCards() {
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
   GRID  — card1 spans 2x2
════════════════════════════════ */
function Grid({ rows }) {
  const wrapRef = useRef(null);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => setNarrow(e[0].contentRect.width < 560));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const card = (p) => {
    const hk = keyFor(rows, p + "_header");
    const hr = keyFor(rows, p + "_hero");
    const dk = keyFor(rows, p + "_delta");
    const vk = keyFor(rows, p + "_value");
    const tk = keyFor(rows, p + "_date");
    let header = vStr(rows[0], hk);
    header = header ? pretty(header) : pretty(p);
    /* hero: sum across rows */
    let hero = null;
    if (hr) { let s = 0, c = 0; rows.forEach((r) => { const v = vNum(r, hr); if (v != null) { s += v; c++; } }); if (c) hero = s; }
    /* delta: first row (pre-computed) */
    const delta = vNum(rows[0], dk);
    /* trend series */
    let pts = [];
    rows.forEach((r) => { const v = vNum(r, vk); if (v == null) return; pts.push({ v, d: tk ? parseDate(r[tk]) : null }); });
    if (pts.length && pts[0].d) pts.sort((a, b) => (a.d?.getTime() || 0) - (b.d?.getTime() || 0));
    return { header, hero, delta, pts: pts.map((x) => x.v), has: !!(hr || hk || vk) };
  };

  const c1 = card("card1");
  const rest = [card("card2"), card("card3"), card("card4"), card("card5")];

  /* grid: 4 cols x 2 rows on wide. card1 spans col1-2 / row1-2.
     rest fill: c2 (col3,row1), c3 (col4,row1), c4 (col3,row2), c5 (col4,row2) */
  return (
    <div ref={wrapRef} style={{ width:"100%", height:"100%" }}>
      {narrow ? (
        /* stacked: big card on top full width, then 2x2 of the rest */
        <div style={{ display:"flex", flexDirection:"column", gap:8, height:"100%" }}>
          <div style={{ flex:"2 1 0", minHeight:0 }}>
            <Card d={c1} big idx={0} />
          </div>
          <div style={{ flex:"2 1 0", display:"grid", gridTemplateColumns:"1fr 1fr", gridTemplateRows:"1fr 1fr", gap:8, minHeight:0 }}>
            {rest.map((d, i) => <Card key={i} d={d} idx={i + 1} />)}
          </div>
        </div>
      ) : (
        <div style={{
          display:"grid", width:"100%", height:"100%",
          gridTemplateColumns:"1fr 1fr 1fr 1fr", gridTemplateRows:"1fr 1fr", gap:8,
        }}>
          <div style={{ gridColumn:"1 / 3", gridRow:"1 / 3", minWidth:0, minHeight:0 }}>
            <Card d={c1} big idx={0} />
          </div>
          {rest.map((d, i) => (
            <div key={i} style={{ minWidth:0, minHeight:0 }}>
              <Card d={d} idx={i + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════
   CARD
════════════════════════════════ */
function Card({ d, big, idx }) {
  const svgRef = useRef(null);
  const valsKey = d.pts.join(",");

  useEffect(() => {
    if (!svgRef.current) return;
    buildSpark(svgRef.current, d.pts, big);
  }, [valsKey, big]); // eslint-disable-line

  if (!d.has) return <Placeholder big={big} />;

  const hero = fmtHero(d.hero);
  const dPos = d.delta != null ? d.delta >= 0 : null;
  const dColor = dPos === true ? C.green : dPos === false ? C.red : C.mut;
  const dGlow  = dPos === true ? C.greenGlow : dPos === false ? C.redGlow : "transparent";

  return (
    <div style={{
      width:"100%", height:"100%", boxSizing:"border-box", background:C.bg,
      borderRadius: big ? 18 : 14, border:`1px solid ${C.line}`,
      boxShadow: big ? "0 2px 10px rgba(15,28,46,.06),0 8px 28px rgba(15,28,46,.06)" : "0 1px 4px rgba(15,28,46,.05)",
      padding: big ? "18px 20px 14px" : "13px 14px 10px",
      display:"flex", flexDirection:"column", overflow:"hidden",
      animation:`hcIn .45s cubic-bezier(.16,1,.3,1) ${idx * 0.05}s both`,
    }}>
      {/* header */}
      <div style={{ fontSize: big ? 11 : 9.5, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase",
                    color:C.mut, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginBottom: big ? 10 : 6 }}>
        {d.header}
      </div>

      {/* hero */}
      <div style={{ display:"flex", alignItems:"baseline", gap: big ? 8 : 5, flexWrap:"wrap" }}>
        <span style={{ fontSize: big ? 46 : 24, fontWeight:800, color:C.ink, letterSpacing:"-.04em", lineHeight:1,
                       fontVariantNumeric:"tabular-nums", fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace" }}>
          {hero.num}
        </span>
        {hero.unit && (
          <span style={{ fontSize: big ? 18 : 11, fontWeight:600, color:C.mut, letterSpacing:".02em" }}>{hero.unit}</span>
        )}
      </div>

      {/* delta */}
      {d.delta != null && (
        <div style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop: big ? 10 : 6, alignSelf:"flex-start",
                      padding: big ? "3px 10px" : "2px 7px", borderRadius:20, background:dGlow }}>
          <svg width={big ? 13 : 11} height={big ? 13 : 11} viewBox="0 0 24 24" fill="none" stroke={dColor}
               strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={dPos ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
          </svg>
          <span style={{ fontSize: big ? 13 : 10.5, fontWeight:700, color:dColor, fontVariantNumeric:"tabular-nums" }}>{fmtDelta(d.delta)}</span>
          <span style={{ fontSize: big ? 9.5 : 8, fontWeight:500, color:C.mut, marginLeft:2 }}>vs last day</span>
        </div>
      )}

      {/* trend line */}
      <div style={{ flex:1, minHeight: big ? 60 : 30, marginTop:"auto", paddingTop: big ? 10 : 6, display:"flex", alignItems:"flex-end" }}>
        <svg ref={svgRef} viewBox={`0 0 240 ${big ? 70 : 40}`} preserveAspectRatio="none"
             style={{ width:"100%", height: big ? 70 : 40, display:"block", overflow:"visible" }} />
      </div>
    </div>
  );
}

function buildSpark(svg, values, big) {
  if (!svg) return;
  svg.innerHTML = "";
  if (values.length < 2) return;
  const ns = "http://www.w3.org/2000/svg";
  const W = 240, H = big ? 70 : 40, pad = 5;
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
  const gid = "hcF" + Math.random().toString(36).slice(2, 7);
  const g = mk("linearGradient", { id: gid, x1: "0", y1: "0", x2: "0", y2: "1" });
  g.append(mk("stop", { offset: "0%", "stop-color": C.tealLt, "stop-opacity": ".26" }), mk("stop", { offset: "100%", "stop-color": C.teal, "stop-opacity": "0" }));
  defs.append(g); svg.appendChild(defs);
  const d = bez(pts);
  svg.appendChild(mk("path", { d: `${d} L ${pts[n-1].x} ${H} L ${pts[0].x} ${H} Z`, fill: `url(#${gid})` }));
  const line = mk("path", { d, fill: "none", stroke: C.teal, "stroke-width": big ? "2.4" : "1.9", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": "600", "stroke-dashoffset": "600" });
  svg.appendChild(line);
  requestAnimationFrame(() => { line.style.transition = "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)"; line.setAttribute("stroke-dashoffset", "0"); });
  const lp = pts[n - 1];
  const dot = mk("circle", { cx: lp.x, cy: lp.y, r: big ? "3.4" : "2.8", fill: C.teal, stroke: "#fff", "stroke-width": big ? "2" : "1.6" });
  dot.style.opacity = "0"; dot.style.transition = "opacity .3s .7s"; svg.appendChild(dot);
  requestAnimationFrame(() => { dot.style.opacity = "1"; });
}

/* ── states ── */
function Placeholder({ big }) {
  return (
    <div style={{ width:"100%", height:"100%", boxSizing:"border-box", background:C.bg, borderRadius: big ? 18 : 14,
                  border:`1px dashed ${C.line}`, display:"flex", alignItems:"center", justifyContent:"center", padding:12 }}>
      <span style={{ fontSize: big ? 10 : 8.5, color:C.faint, textAlign:"center" }}>drop cardN_* fields</span>
    </div>
  );
}
function Skeleton() {
  return (
    <div style={{ width:"100%", height:"100%", display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gridTemplateRows:"1fr 1fr", gap:8 }}>
      <div style={{ gridColumn:"1 / 3", gridRow:"1 / 3", borderRadius:18, background:"linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize:"200% 100%", animation:"hcShim 1.4s infinite" }} />
      {[0,1,2,3].map((i) => (
        <div key={i} style={{ borderRadius:14, background:"linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize:"200% 100%", animation:"hcShim 1.4s infinite" }} />
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
