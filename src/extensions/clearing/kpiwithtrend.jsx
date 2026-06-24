import { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════
   PERCENT TREND KPI — single-file React Viz Extension

   Encodings (drop onto Marks tiles):
     header  → text/dimension calculated field (DYNAMIC title)
     hero    → percentage measure (shown as 87.5%)
     count   → secondary count measure (small number)
     trend   → measure plotted over time
     date    → date/time dimension (x-axis)

   Chart: fixed teal gradient area + line.
═══════════════════════════════════════════════════════════ */

if (typeof window !== "undefined" && !document.getElementById("ptk-kf")) {
  const s = document.createElement("style");
  s.id = "ptk-kf";
  s.innerHTML = "@keyframes ptkShim{0%{background-position:200% 0}100%{background-position:-200% 0}}";
  document.head.appendChild(s);
}

/* ── teal brand palette ── */
const TEAL       = "#0d9488";
const TEAL_DARK  = "#0f766e";
const TEAL_LIGHT = "#14b8a6";

/* ── number helpers ── */
function fmtPct(n) {
  if (n === null || isNaN(n)) return "—";
  /* if value is a fraction (0–1) scale to percent */
  const v = Math.abs(n) <= 1 ? n * 100 : n;
  return v.toFixed(1) + "%";
}
function fmtCount(n) {
  if (n === null || isNaN(n)) return "—";
  const abs = Math.abs(n), s = n < 0 ? "-" : "";
  if (abs >= 1e9) return s + (abs / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return s + (abs / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return s + (abs / 1e3).toFixed(1) + "K";
  return s + Math.round(abs).toLocaleString("en-US");
}
function pretty(name) {
  return name
    .replace(/^(SUM|AVG|MIN|MAX|COUNT|ATTR)\((.+)\)$/i, "$2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/* ── Tableau readers ── */
async function readData(ws) {
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
async function readEncodings(ws) {
  const spec = await ws.getVisualSpecificationAsync();
  const map = {};
  if (spec.activeMarksSpecificationIndex >= 0) {
    spec.marksSpecifications[spec.activeMarksSpecificationIndex]
      .encodings.forEach((e) => { map[e.id] = e.field; });
  }
  return map;
}

/* ── field resolution ── */
function findKey(encField, rk) {
  if (!encField) return null;
  const nm = encField.name.toLowerCase();
  return rk.find((k) => k.toLowerCase() === nm) || null;
}
function autoFind(rk, used, pats) {
  for (const pat of pats)
    for (const k of rk) {
      if (used.includes(k)) continue;
      if (k.toLowerCase().includes(pat)) return k;
    }
  return null;
}
function dvStr(row, k) {
  if (!k || !row[k]) return null;
  const dv = row[k];
  const fv = dv.formattedValue != null ? String(dv.formattedValue).trim() : "";
  if (fv && fv !== "%null%" && fv !== "Null" && fv !== "null") return fv;
  return null;
}
function dvNum(row, k) {
  if (!k || !row[k]) return null;
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
  if (typeof nv === "number" && nv >= 1990 && nv <= 2050) return new Date(nv, 0, 1);
  if (typeof nv === "number" && nv >= 1 && nv <= 12) return new Date(2000, nv - 1, 1);
  if (fv) {
    const iso = fv.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    const d2 = new Date(fv);
    if (!isNaN(d2.getTime()) && d2.getFullYear() >= 1990) return d2;
  }
  return null;
}
function fmtLabel(dv) {
  if (!dv) return "";
  const fv = (dv.formattedValue || "").trim();
  if (fv && fv !== "%null%" && fv !== "Null") return fv;
  const nv = dv.nativeValue;
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (typeof nv === "number" && nv >= 1 && nv <= 12) return M[nv - 1];
  if (typeof nv === "number" && nv > 1e10) { const d = new Date(nv); return d.getDate() + " " + M[d.getMonth()]; }
  return String(nv || "");
}

/* ════════════════════════════════
   ROOT EXPORT
════════════════════════════════ */
export default function PercentTrendKpi() {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    async function init() {
      try {
        await window.tableau.extensions.initializeAsync();
        const ws = window.tableau.extensions.worksheetContent.worksheet;
        const load = async () => {
          const rows = await readData(ws);
          const enc = await readEncodings(ws);
          setState({ loading: false, error: null, data: { rows, enc } });
        };
        ws.addEventListener(window.tableau.TableauEventType.SummaryDataChanged, load);
        await load();
      } catch (err) {
        setState({ loading: false, error: err.message, data: null });
      }
    }
    init();
  }, []);

  if (state.loading) return <Shell><LoadingView /></Shell>;
  if (state.error)   return <Shell><ErrorView msg={state.error} /></Shell>;
  if (!state.data)   return null;

  return <Shell><Card rows={state.data.rows} enc={state.data.enc} /></Shell>;
}

function Shell({ children }) {
  return (
    <div style={{ width:"100%", height:"100%", background:"transparent", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif", WebkitFontSmoothing:"antialiased", padding:6 }}>
      {children}
    </div>
  );
}

/* ════════════════════════════════
   PROCESS
════════════════════════════════ */
function process(rows, enc) {
  if (!rows.length) return null;
  const rk = Object.keys(rows[0]);

  let hdrKey  = findKey(enc.header, rk);
  let heroKey = findKey(enc.hero,   rk);
  let cntKey  = findKey(enc.count,  rk);
  let trdKey  = findKey(enc.trend,  rk);
  let datKey  = findKey(enc.date,   rk);

  const used = [hdrKey, heroKey, cntKey, trdKey, datKey].filter(Boolean);
  if (!hdrKey)  hdrKey  = autoFind(rk, used, ["header","title","name","category","label","kpi"]);
  if (!heroKey) heroKey = autoFind(rk, used, ["percent","pct","rate","ratio","hero","%"]);
  if (!cntKey)  cntKey  = autoFind(rk, used, ["count","cnt","number","volume","qty","total"]);
  if (!datKey)  datKey  = autoFind(rk, used, ["date","month","day","year","period","posting"]);
  if (!trdKey)  trdKey  = heroKey;

  /* header from dropped calc field */
  let header = dvStr(rows[0], hdrKey);
  if (!header && enc.hero) header = pretty(enc.hero.name);
  header = header ? pretty(header) : "KPI";

  /* hero: SUM all rows (or avg-like — use last if it's a rate) */
  let heroVal = null;
  if (heroKey) {
    const vals = rows.map((r) => dvNum(r, heroKey)).filter((v) => v !== null);
    if (vals.length) {
      /* if values look like rates (all 0–1 or 0–100), use the latest; else sum */
      const allRate = vals.every((v) => Math.abs(v) <= 100);
      heroVal = allRate ? vals[vals.length - 1] : vals.reduce((a, b) => a + b, 0);
    }
  }

  /* count: SUM all rows */
  let count = null;
  if (cntKey) {
    let s = 0, c = 0;
    rows.forEach((r) => { const v = dvNum(r, cntKey); if (v !== null) { s += v; c++; } });
    if (c > 0) count = s;
  }

  /* trend series over date */
  let pts = [];
  rows.forEach((row) => {
    const val = dvNum(row, trdKey); if (val === null) return;
    pts.push({
      val,
      lbl:  datKey ? fmtLabel(row[datKey]) : "",
      date: datKey ? parseDate(row[datKey]) : null,
    });
  });
  if (pts.length && pts[0].date) pts.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
  const seen = {};
  pts = pts.filter((p) => { if (seen[p.lbl]) return false; seen[p.lbl] = true; return true; });

  if (heroVal === null && pts.length) heroVal = pts[pts.length - 1].val;

  return { header, heroVal, count, pts };
}

/* ════════════════════════════════
   SVG AREA + LINE BUILDER (teal)
════════════════════════════════ */
function buildChart(svgEl, values, labels) {
  if (!svgEl || values.length < 2) return;
  svgEl.innerHTML = "";
  const ns = "http://www.w3.org/2000/svg";
  const W = 240, H = 64, pad = 6;
  const min = Math.min(...values), max = Math.max(...values);
  const rng = max - min || 1;
  const n   = values.length;
  const toY = (v) => pad + (1 - (v - min) / rng) * (H - pad * 2);
  const pts = values.map((v, i) => ({ x: n === 1 ? W / 2 : (i / (n - 1)) * W, y: toY(v) }));

  const bezier = (points) => {
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1], p1 = points[i];
      d += ` C ${(p0.x + (p1.x - p0.x) * 0.4).toFixed(1)} ${p0.y.toFixed(1)} ${(p0.x + (p1.x - p0.x) * 0.6).toFixed(1)} ${p1.y.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return d;
  };
  const mk = (tag, attrs) => { const e = document.createElementNS(ns, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); return e; };

  /* defs: teal gradient fill */
  const defs = mk("defs", {});
  const grad = mk("linearGradient", { id: "ptkFill", x1: "0", y1: "0", x2: "0", y2: "1" });
  grad.append(
    mk("stop", { offset: "0%",   "stop-color": TEAL_LIGHT, "stop-opacity": "0.30" }),
    mk("stop", { offset: "100%", "stop-color": TEAL,       "stop-opacity": "0"    }),
  );
  /* line gradient teal → dark teal */
  const lgrad = mk("linearGradient", { id: "ptkLine", x1: "0", y1: "0", x2: "1", y2: "0" });
  lgrad.append(
    mk("stop", { offset: "0%",   "stop-color": TEAL_LIGHT }),
    mk("stop", { offset: "100%", "stop-color": TEAL_DARK  }),
  );
  defs.append(grad, lgrad);
  svgEl.appendChild(defs);

  const d = bezier(pts);

  /* area fill */
  svgEl.appendChild(mk("path", { d: `${d} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`, fill: "url(#ptkFill)" }));

  /* line */
  const line = mk("path", { d, fill: "none", stroke: "url(#ptkLine)", "stroke-width": "2.25", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": "600", "stroke-dashoffset": "600" });
  svgEl.appendChild(line);
  requestAnimationFrame(() => {
    line.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1)";
    line.setAttribute("stroke-dashoffset", "0");
  });

  /* endpoint dot */
  const last = pts[pts.length - 1];
  const dot = mk("circle", { cx: last.x, cy: last.y, r: "3.5", fill: TEAL, stroke: "#fff", "stroke-width": "2" });
  dot.style.opacity = "0"; dot.style.transition = "opacity .3s .75s";
  svgEl.appendChild(dot);
  requestAnimationFrame(() => { dot.style.opacity = "1"; });
}

/* ════════════════════════════════
   CARD
════════════════════════════════ */
function Card({ rows, enc }) {
  const d = process(rows, enc);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!d || !svgRef.current) return;
    const vals = d.pts.map((p) => p.val);
    buildChart(svgRef.current, vals, d.pts.map((p) => p.lbl));
  }, [d?.pts?.map((p) => p.val).join(",")]); // eslint-disable-line

  if (!d) return <ErrorView msg="Drop Header, Hero % and a Date on the Marks card" />;

  const { header, heroVal, count, pts } = d;
  const firstLbl = pts[0]?.lbl || "";
  const lastLbl  = pts[pts.length - 1]?.lbl || "";

  return (
    <div style={{ width:"100%", maxWidth:280, background:"#ffffff", borderRadius:16, border:"0.5px solid rgba(15,23,42,.06)", overflow:"hidden", position:"relative", boxShadow:"0 1px 3px rgba(15,23,42,.04),0 8px 24px rgba(15,23,42,.07)" }}>

      {/* teal top accent */}
      <div style={{ height:3, width:"100%", background:`linear-gradient(90deg,${TEAL_LIGHT},${TEAL_DARK})` }} />

      <div style={{ padding:"14px 16px 4px" }}>
        {/* DYNAMIC HEADER */}
        <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#94a3b8", marginBottom:10, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {header}
        </div>

        {/* HERO % + count */}
        <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:2 }}>
          <span style={{ fontSize:36, fontWeight:700, color:"#0f172a", letterSpacing:"-.04em", lineHeight:1, fontVariantNumeric:"tabular-nums", fontFamily:"ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" }}>
            {fmtPct(heroVal)}
          </span>
          {count !== null && (
            <span style={{ fontSize:14, fontWeight:600, color:TEAL, fontVariantNumeric:"tabular-nums", fontFamily:"ui-monospace,monospace" }}>
              {fmtCount(count)}
            </span>
          )}
        </div>
        {count !== null && (
          <div style={{ fontSize:8.5, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:"#cbd5e1", marginBottom:6 }}>
            Count
          </div>
        )}
      </div>

      {/* CHART */}
      <div style={{ padding:"0 8px 6px" }}>
        <svg ref={svgRef} viewBox="0 0 240 64" preserveAspectRatio="none" style={{ width:"100%", height:64, display:"block", overflow:"visible" }} />
      </div>

      {/* x labels */}
      <div style={{ display:"flex", justifyContent:"space-between", padding:"0 16px 12px" }}>
        <span style={{ fontSize:8, fontWeight:600, color:"#cbd5e1" }}>{firstLbl}</span>
        <span style={{ fontSize:8, fontWeight:600, color:"#cbd5e1" }}>{lastLbl}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   LOADING / ERROR
════════════════════════════════ */
function LoadingView() {
  return (
    <div style={{ width:"100%", maxWidth:280, background:"#fff", borderRadius:16, border:"0.5px solid rgba(15,23,42,.06)", overflow:"hidden", boxShadow:"0 1px 3px rgba(15,23,42,.04)" }}>
      <div style={{ height:3, background:TEAL }} />
      <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:9 }}>
        {[60,80,100,40].map((w,i) => (
          <div key={i} style={{ height: i===1?34:11, width:w+"%", borderRadius:4, background:"linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize:"200% 100%", animation:"ptkShim 1.4s infinite" }} />
        ))}
      </div>
    </div>
  );
}
function ErrorView({ msg }) {
  return (
    <div style={{ width:"100%", maxWidth:280, background:"#fff", borderRadius:16, border:"0.5px solid #fee2e2", padding:"16px 18px" }}>
      <div style={{ fontSize:10, color:"#0d9488", fontWeight:600, textAlign:"center" }}>{msg}</div>
    </div>
  );
}
