import { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════
   KPI BAR — single-file React Viz Extension
   5 equal cards: Card 1 & 2 cheque-style, Card 3,4,5 percent-trend.
   All fields dropped on Detail, matched by calculated-field NAME.

   Field names:
     cheque1_headline / cheque1_amount / cheque1_count / cheque1_var_lw / cheque1_var_mom
     cheque2_*  (same five)
     trend1_header / trend1_hero / trend1_count / trend1_value / trend1_date
     trend2_* / trend3_*  (same five)
═══════════════════════════════════════════════════════════ */

if (typeof window !== "undefined" && !document.getElementById("kb-kf")) {
  const s = document.createElement("style");
  s.id = "kb-kf";
  s.innerHTML =
    "@keyframes kbShim{0%{background-position:200% 0}100%{background-position:-200% 0}}" +
    "@keyframes kbIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}";
  document.head.appendChild(s);
}

const C = {
  ink: "#0f1c2e", sub: "#4a5568", mut: "#8a96a8", faint: "#cbd5e1",
  line: "rgba(15,28,46,.08)",
  red: "#c8102e", redGlow: "rgba(200,16,46,.10)",
  green: "#16a34a", greenGlow: "rgba(22,163,74,.10)",
  teal: "#0d9488", tealLt: "#14b8a6", tealDk: "#0f766e",
  white: "#ffffff", chequeBd: "#e8ebf0",
};

/* ── format ── */
function fmtN(n) {
  if (n == null || isNaN(n)) return "—";
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1e9) return s + (a / 1e9).toFixed(2) + " B";
  if (a >= 1e6) return s + (a / 1e6).toFixed(2) + " M";
  if (a >= 1e3) return s + (a / 1e3).toFixed(1) + " K";
  return s + a.toFixed(2);
}
function fmtCount(n) {
  if (n == null || isNaN(n)) return "—";
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1e6) return s + (a / 1e6).toFixed(2) + "M";
  if (a >= 1e3) return s + (a / 1e3).toFixed(1) + "K";
  return s + Math.round(a).toLocaleString("en-US");
}
function fmtPct(n) {
  if (n == null || isNaN(n)) return "—";
  const v = Math.abs(n) <= 1 ? n * 100 : n;
  return v.toFixed(1) + "%";
}
function fmtSignPct(n) {
  if (n == null || isNaN(n)) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
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

/* STRICT key match: exact, wrapper-stripped exact, normalized exact only */
function norm(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ""); }
function inner(c) { return c.replace(/^(SUM|AVG|MIN|MAX|COUNT|AGG|ATTR|MEDIAN|STDEV|VAR)\((.+)\)$/i, "$2"); }
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
function sumNum(rows, k) {
  if (!k) return null;
  let s = 0, c = 0;
  rows.forEach((r) => { const v = vNum(r, k); if (v != null) { s += v; c++; } });
  return c ? s : null;
}

function parseDate(dv) {
  if (!dv) return null;
  const nv = dv.nativeValue ?? dv.value;
  const fv = (dv.formattedValue || "").trim();
  if (typeof nv === "number" && nv > 1e10) { const d = new Date(nv); if (d.getFullYear() >= 1990) return d; }
  if (typeof nv === "number" && nv >= 1990 && nv <= 2050) return new Date(nv, 0, 1);
  if (fv) {
    const iso = fv.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    const d2 = new Date(fv);
    if (!isNaN(d2.getTime()) && d2.getFullYear() >= 1990) return d2;
  }
  return null;
}
function dateLabel(dv) {
  if (!dv) return "";
  const fv = (dv.formattedValue || "").trim();
  if (fv && fv !== "%null%" && fv !== "Null") return fv;
  const nv = dv.nativeValue;
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (typeof nv === "number" && nv >= 1 && nv <= 12) return M[nv - 1];
  return String(nv || "");
}

/* ════════════════════════════════
   ROOT
════════════════════════════════ */
export default function KpiBar() {
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

  if (state.loading) return <Shell><BarSkeleton /></Shell>;
  if (state.error)   return <Shell><ErrView msg={state.error} /></Shell>;
  return <Shell><Bar rows={state.rows} /></Shell>;
}

function Shell({ children }) {
  return (
    <div style={{ width:"100%", height:"100%", background:"transparent", padding:6,
                  fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif", WebkitFontSmoothing:"antialiased",
                  boxSizing:"border-box", overflow:"hidden", display:"flex", flexDirection:"column" }}>
      {children}
    </div>
  );
}

/* ════════════════════════════════
   BAR
════════════════════════════════ */
function Bar({ rows }) {
  const [open, setOpen] = useState(true);
  const wrapRef = useRef(null);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      setNarrow(entries[0].contentRect.width < 620);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const cheque = (p) => {
    const hk = keyFor(rows, p + "_headline");
    const ak = keyFor(rows, p + "_amount");
    const ck = keyFor(rows, p + "_count");
    const lk = keyFor(rows, p + "_var_lw");
    const mk = keyFor(rows, p + "_var_mom");
    let headline = vStr(rows[0], hk);
    headline = headline ? pretty(headline) : pretty(p);
    return { headline, amount: sumNum(rows, ak), count: sumNum(rows, ck),
             lw: vNum(rows[0], lk), mom: vNum(rows[0], mk), has: !!(ak || hk || ck) };
  };

  const trend = (p) => {
    const hk = keyFor(rows, p + "_header");
    const hr = keyFor(rows, p + "_hero");
    const ck = keyFor(rows, p + "_count");
    const vk = keyFor(rows, p + "_value");
    const dk = keyFor(rows, p + "_date");
    let header = vStr(rows[0], hk);
    header = header ? pretty(header) : pretty(p);
    let hero = null;
    if (hr) {
      const vals = rows.map((r) => vNum(r, hr)).filter((v) => v != null);
      if (vals.length) hero = vals.every((v) => Math.abs(v) <= 100) ? vals[vals.length - 1] : vals.reduce((a, b) => a + b, 0);
    }
    let count = null;
    if (ck && ck !== vk && ck !== hr) count = sumNum(rows, ck);
    let pts = [];
    rows.forEach((r) => {
      const val = vNum(r, vk); if (val == null) return;
      pts.push({ val, lbl: dk ? dateLabel(r[dk]) : "", date: dk ? parseDate(r[dk]) : null });
    });
    if (pts.length && pts[0].date) pts.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
    const seen = {}; pts = pts.filter((x) => { const key = x.lbl || x.val; if (seen[key]) return false; seen[key] = true; return true; });
    if (hero == null && pts.length) hero = pts[pts.length - 1].val;
    return { header, hero, count, pts, has: !!(hr || vk || hk) };
  };

  const cards = [
    { type: "cheque", data: cheque("cheque1") },
    { type: "cheque", data: cheque("cheque2") },
    { type: "trend",  data: trend("trend1") },
    { type: "trend",  data: trend("trend2") },
    { type: "trend",  data: trend("trend3") },
  ];
  const anyData = cards.some((c) => c.data.has);

  return (
    <div ref={wrapRef} style={{ width:"100%", flex:1, minHeight:0, display:"flex", flexDirection:"column", gap:6 }}>
      {/* toggle row — separated above cards, right aligned */}
      <div style={{ display:"flex", justifyContent:"flex-end", flexShrink:0 }}>
        <IconToggle open={open} onClick={() => setOpen((v) => !v)} />
      </div>

      {/* card row */}
      <div style={{
        display:"flex",
        flexWrap: narrow ? "wrap" : "nowrap",
        gap:8,
        maxHeight: open ? 600 : 0,
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0)" : "translateY(-6px)",
        overflow:"hidden",
        transition:"max-height .4s cubic-bezier(.4,0,.2,1),opacity .28s,transform .32s",
        alignItems:"stretch",
      }}>
        {!anyData
          ? <EmptyHint />
          : cards.map((c, i) => (
              <div key={i} style={{
                flex: narrow ? "1 1 calc(50% - 4px)" : "1 1 0",
                minWidth: narrow ? 140 : 0,
                display:"flex",
                animation:`kbIn .45s cubic-bezier(.16,1,.3,1) ${i * 0.05}s both`,
              }}>
                {c.type === "cheque" ? <ChequeCard d={c.data} /> : <TrendCard d={c.data} />}
              </div>
            ))
        }
      </div>
    </div>
  );
}

/* ── icon-only show/hide button (no text) ── */
function IconToggle({ open, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={open ? "Hide" : "Show"}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        width:26, height:26, borderRadius:7, cursor:"pointer", outline:"none", padding:0,
        border:"1px solid " + (hov ? "rgba(13,148,136,.4)" : C.line),
        background: hov ? "rgba(13,148,136,.10)" : "rgba(255,255,255,.9)",
        color: hov ? C.tealDk : C.sub, transition:"all .2s",
        boxShadow: hov ? "0 2px 10px rgba(13,148,136,.15)" : "0 1px 3px rgba(15,28,46,.06)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
           style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition:"transform .35s cubic-bezier(.4,0,.2,1)" }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

/* ════════════════════════════════
   CHEQUE CARD — pure white, equal size
════════════════════════════════ */
function ChequeCard({ d }) {
  const { headline, amount, count, lw, mom, has } = d;
  if (!has) return <CardPlaceholder label="Cheque card" sub="drop chequeN_* fields" />;

  const lwPos = lw != null ? lw >= 0 : null;
  const momPos = mom != null ? mom >= 0 : null;
  const lwColor  = lwPos === true ? C.green : lwPos === false ? C.red : C.mut;
  const momColor = momPos === true ? C.green : momPos === false ? C.red : C.mut;

  const Arrow = ({ up }) => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={up ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
    </svg>
  );

  return (
    <div style={{
      width:"100%", boxSizing:"border-box", background:C.white,
      borderRadius:12, border:`1px solid ${C.chequeBd}`,
      boxShadow:"0 1px 3px rgba(15,28,46,.05)",
      padding:"12px 13px 11px", overflow:"hidden", display:"flex", flexDirection:"column",
    }}>
      <div style={{ fontSize:9, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", color:C.mut, marginBottom:5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{headline}</div>

      <div style={{ fontSize:23, fontWeight:700, color:C.ink, letterSpacing:"-.03em", lineHeight:1.05, fontVariantNumeric:"tabular-nums", fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
        {amount != null ? fmtN(amount) : "—"}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:5, margin:"7px 0", padding:"4px 0", borderTop:`0.5px solid ${C.line}`, borderBottom:`0.5px solid ${C.line}` }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
        <span style={{ fontSize:10.5, fontWeight:600, color:C.sub }}>{count != null ? Math.round(count).toLocaleString() : "—"}</span>
        <span style={{ fontSize:8, color:C.mut, marginLeft:"auto" }}>Count</span>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:9.5, color:C.sub }}>vs Last Week</span>
          <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, fontWeight:700, color:lwColor }}>
            {lw != null && <Arrow up={lwPos} />}{fmtSignPct(lw)}
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:9.5, color:C.sub }}>MoM</span>
          <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, fontWeight:700, color:momColor,
                         padding:"1px 6px", borderRadius:9, background: momPos === true ? C.greenGlow : momPos === false ? C.redGlow : "transparent" }}>
            {mom != null && <Arrow up={momPos} />}{fmtSignPct(mom)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   TREND CARD — pure white, count on own row, line fixed
════════════════════════════════ */
function TrendCard({ d }) {
  const { header, hero, count, pts, has } = d;
  const svgRef = useRef(null);
  const valsKey = pts.map((p) => p.val).join(",");

  useEffect(() => {
    if (!svgRef.current) return;
    buildSpark(svgRef.current, pts.map((p) => p.val));
  }, [valsKey]); // eslint-disable-line

  if (!has) return <CardPlaceholder label="Trend card" sub="drop trendN_* fields" />;

  const first = pts[0]?.lbl || "", last = pts[pts.length - 1]?.lbl || "";
  const hasLine = pts.length >= 2;

  return (
    <div style={{
      width:"100%", boxSizing:"border-box", background:C.white,
      borderRadius:12, border:`1px solid ${C.chequeBd}`, overflow:"hidden",
      boxShadow:"0 1px 3px rgba(15,28,46,.05)",
      display:"flex", flexDirection:"column",
    }}>
      <div style={{ padding:"12px 13px 0" }}>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", color:C.mut, marginBottom:6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{header}</div>

        {/* hero on its own line */}
        <div style={{ fontSize:25, fontWeight:700, color:C.ink, letterSpacing:"-.04em", lineHeight:1, fontVariantNumeric:"tabular-nums", fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace" }}>{fmtPct(hero)}</div>

        {/* count on its OWN row below hero */}
        {count != null && (
          <div style={{ display:"flex", alignItems:"baseline", gap:5, marginTop:5 }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.teal, fontFamily:"ui-monospace,monospace" }}>{fmtCount(count)}</span>
            <span style={{ fontSize:8, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:C.faint }}>Count</span>
          </div>
        )}
      </div>

      {/* trend line */}
      <div style={{ padding:"8px 5px 0", marginTop:"auto" }}>
        {hasLine
          ? <svg ref={svgRef} viewBox="0 0 240 44" preserveAspectRatio="none" style={{ width:"100%", height:42, display:"block", overflow:"visible" }} />
          : <div style={{ height:42, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:C.faint }}>drop {pretty(header).toLowerCase().includes("trend")?"":"trendN_"}value + date</div>
        }
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", padding:"2px 13px 9px" }}>
        <span style={{ fontSize:7, fontWeight:600, color:C.faint }}>{first}</span>
        <span style={{ fontSize:7, fontWeight:600, color:C.faint }}>{last}</span>
      </div>
    </div>
  );
}

function buildSpark(svg, values) {
  if (!svg) return;
  svg.innerHTML = "";
  if (values.length < 2) return;
  const ns = "http://www.w3.org/2000/svg";
  const W = 240, H = 44, pad = 5;
  const min = Math.min(...values), max = Math.max(...values), rng = max - min || 1, n = values.length;
  const toY = (v) => pad + (1 - (v - min) / rng) * (H - pad * 2);
  const pts = values.map((v, i) => ({ x: n === 1 ? W / 2 : (i / (n - 1)) * W, y: toY(v) }));
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
  const gid = "kbF" + Math.random().toString(36).slice(2, 7);
  const g = mk("linearGradient", { id: gid, x1: "0", y1: "0", x2: "0", y2: "1" });
  g.append(mk("stop", { offset: "0%", "stop-color": C.tealLt, "stop-opacity": ".26" }), mk("stop", { offset: "100%", "stop-color": C.teal, "stop-opacity": "0" }));
  defs.append(g); svg.appendChild(defs);
  const d = bez(pts);
  svg.appendChild(mk("path", { d: `${d} L ${pts[n-1].x} ${H} L ${pts[0].x} ${H} Z`, fill: `url(#${gid})` }));
  const line = mk("path", { d, fill: "none", stroke: C.teal, "stroke-width": "1.9", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": "600", "stroke-dashoffset": "600" });
  svg.appendChild(line);
  requestAnimationFrame(() => { line.style.transition = "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)"; line.setAttribute("stroke-dashoffset", "0"); });
  const lp = pts[n - 1];
  const dot = mk("circle", { cx: lp.x, cy: lp.y, r: "2.8", fill: C.teal, stroke: "#fff", "stroke-width": "1.6" });
  dot.style.opacity = "0"; dot.style.transition = "opacity .3s .7s"; svg.appendChild(dot);
  requestAnimationFrame(() => { dot.style.opacity = "1"; });
}

/* ════════════════════════════════
   STATES
════════════════════════════════ */
function CardPlaceholder({ label, sub }) {
  return (
    <div style={{ width:"100%", boxSizing:"border-box", border:`1px solid ${C.chequeBd}`, borderRadius:12, background:C.white,
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, padding:"24px 10px", minHeight:120 }}>
      <span style={{ fontSize:9.5, fontWeight:600, color:C.mut }}>{label}</span>
      <span style={{ fontSize:8, color:C.faint, textAlign:"center" }}>{sub}</span>
    </div>
  );
}
function EmptyHint() {
  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${C.chequeBd}`, borderRadius:12, background:C.white, padding:16, minHeight:100 }}>
      <span style={{ fontSize:10.5, color:C.mut, textAlign:"center", lineHeight:1.5 }}>
        Drop your calculated fields onto <b>Detail</b>.<br/>
        <span style={{ fontSize:8.5, color:C.faint }}>cheque1_* , cheque2_* , trend1_* , trend2_* , trend3_*</span>
      </span>
    </div>
  );
}
function BarSkeleton() {
  return (
    <div style={{ width:"100%", display:"flex", gap:8 }}>
      {[0,1,2,3,4].map((i) => (
        <div key={i} style={{ flex:1, height:130, borderRadius:12, background:"linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize:"200% 100%", animation:"kbShim 1.4s infinite" }} />
      ))}
    </div>
  );
}
function ErrView({ msg }) {
  return (
    <div style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <span style={{ fontSize:11, color:C.red, fontWeight:600, textAlign:"center" }}>{msg}</span>
    </div>
  );
}
