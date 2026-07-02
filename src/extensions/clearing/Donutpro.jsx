import { useEffect, useRef, useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════
   DONUT — single-file React Viz Extension (pure SVG, no deps)
   Professional donut · count/value toggle · separate hero field
   in the center · labels drawn on segments · dynamic header.

   Fields (drop ALL on Detail, matched by calculated-field name):
     segment       (string)  — arc category
     donut_count   (numeric) — default metric
     donut_value   (numeric) — toggle metric
     donut_hero    (num/str) — big center value
     chart_title   (string)  — dynamic header
═══════════════════════════════════════════════════════════ */

if (typeof window !== "undefined" && !document.getElementById("dn-kf")) {
  const s = document.createElement("style");
  s.id = "dn-kf";
  s.innerHTML =
    "@keyframes dnShim{0%{background-position:200% 0}100%{background-position:-200% 0}}" +
    "@keyframes dnPop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}";
  document.head.appendChild(s);
}

const C = {
  ink: "#0b1220", sub: "#475569", mut: "#94a3b8", faint: "#cbd5e1",
  bg: "#ffffff", line: "rgba(15,28,46,.07)", track: "#eef2f6",
  teal: "#0d9488", tealLt: "#2dd4bf", tealDk: "#0f766e",
};
/* professional categorical palette (teal-anchored, harmonious) */
const PALETTE = [
  "#0d9488", "#0369a1", "#7c3aed", "#d97706", "#db2777",
  "#0891b2", "#65a30d", "#dc2626", "#4f46e5", "#0f766e",
  "#9333ea", "#ca8a04",
];

/* ── format ── */
function fmtN(n) {
  if (n == null || isNaN(n)) return "—";
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1e9) return s + (a / 1e9).toFixed(2) + "B";
  if (a >= 1e6) return s + (a / 1e6).toFixed(2) + "M";
  if (a >= 1e3) return s + (a / 1e3).toFixed(1) + "K";
  return s + Math.round(a).toLocaleString("en-US");
}
function fmtFull(n) {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
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

/* ════════════════════════════════
   ROOT
════════════════════════════════ */
export default function Donut() {
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
  return <Shell><DonutChart rows={state.rows} /></Shell>;
}

function Shell({ children }) {
  return (
    <div style={{ width:"100%", height:"100%", background:"transparent", padding:8,
                  fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif", WebkitFontSmoothing:"antialiased",
                  boxSizing:"border-box", overflow:"hidden", display:"flex", flexDirection:"column" }}>
      {children}
    </div>
  );
}

/* ── arc geometry ── */
function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function arcPath(cx, cy, rOut, rIn, start, end) {
  const large = end - start > 180 ? 1 : 0;
  const p1 = polar(cx, cy, rOut, end);
  const p2 = polar(cx, cy, rOut, start);
  const p3 = polar(cx, cy, rIn, start);
  const p4 = polar(cx, cy, rIn, end);
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rOut} ${rOut} 0 ${large} 0 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rIn} ${rIn} 0 ${large} 1 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

/* ════════════════════════════════
   DONUT CHART
════════════════════════════════ */
function DonutChart({ rows }) {
  const [metric, setMetric] = useState("count");
  const [active, setActive] = useState(-1);

  const keys = useMemo(() => ({
    seg: keyFor(rows, "segment"),
    cnt: keyFor(rows, "donut_count"),
    val: keyFor(rows, "donut_value"),
    hero: keyFor(rows, "donut_hero"),
    title: keyFor(rows, "chart_title"),
  }), [rows]);

  const hasValue = !!keys.val;

  /* dynamic header */
  let header = vStr(rows[0], keys.title);
  header = header ? pretty(header) : "Distribution";

  /* hero: prefer string formatted value, else numeric formatted */
  let heroDisplay = vStr(rows[0], keys.hero);
  if (heroDisplay == null) {
    const hn = vNum(rows[0], keys.hero);
    heroDisplay = hn != null ? fmtN(hn) : null;
  }

  /* aggregate segments */
  const segs = useMemo(() => {
    const map = {}, order = [];
    rows.forEach((r) => {
      const s = vStr(r, keys.seg); if (!s) return;
      if (!map[s]) { map[s] = { name: s, count: 0, value: 0 }; order.push(s); }
      map[s].count += vNum(r, keys.cnt) || 0;
      map[s].value += vNum(r, keys.val) || 0;
    });
    return order.map((k) => map[k]).sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
  }, [rows, keys, metric]);

  const total = segs.reduce((s, x) => s + (x[metric] || 0), 0);
  const hasData = segs.length > 0 && total > 0;

  /* center text: hero field if provided, else total */
  const centerMain = heroDisplay != null ? heroDisplay : fmtN(total);
  const centerSub = heroDisplay != null ? "Hero" : (metric === "count" ? "Total Count" : "Total Value");

  /* SVG dims */
  const SIZE = 230, cx = SIZE / 2, cy = SIZE / 2, rOut = 100, rIn = 62;

  /* build arcs */
  let cursor = 0;
  const arcs = segs.map((s, i) => {
    const v = s[metric] || 0;
    const frac = total > 0 ? v / total : 0;
    const sweep = frac * 360;
    const start = cursor, end = cursor + sweep;
    cursor = end;
    const mid = (start + end) / 2;
    const labelPos = polar(cx, cy, (rOut + rIn) / 2, mid);
    return { ...s, i, frac, start, end, mid, labelPos, color: PALETTE[i % PALETTE.length] };
  });

  return (
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", background:C.bg,
                  borderRadius:14, border:`1px solid ${C.line}`, boxShadow:"0 1px 3px rgba(15,28,46,.05),0 8px 24px rgba(15,28,46,.06)",
                  overflow:"hidden" }}>

      {/* header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 16px 11px", borderBottom:`1px solid ${C.line}`, flexShrink:0 }}>
        <div style={{ width:3, height:18, borderRadius:2, background:`linear-gradient(180deg,${C.tealLt},${C.tealDk})`, flexShrink:0 }} />
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.ink, letterSpacing:"-.2px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{header}</div>
          <div style={{ fontSize:9.5, color:C.mut, marginTop:1 }}>{segs.length} segments</div>
        </div>
        <div style={{ display:"flex", background:C.track, borderRadius:9, padding:3, gap:2, flexShrink:0 }}>
          {["count","value"].map((m) => {
            const disabled = m === "value" && !hasValue;
            const act = metric === m;
            return (
              <button key={m} disabled={disabled} onClick={() => setMetric(m)} title={disabled ? "Drop donut_value to enable" : ""}
                style={{ fontSize:10.5, fontWeight:600, padding:"4px 12px", borderRadius:7, border:"none",
                         cursor: disabled ? "not-allowed" : "pointer", textTransform:"capitalize", fontFamily:"inherit",
                         background: act ? C.bg : "transparent", color: disabled ? C.faint : act ? C.ink : C.sub,
                         boxShadow: act ? "0 1px 4px rgba(0,0,0,.1)" : "none", opacity: disabled ? .5 : 1, transition:"all .15s" }}>
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* body: donut + legend */}
      <div style={{ flex:1, display:"flex", alignItems:"center", gap:6, padding:"10px 14px", minHeight:0, overflow:"hidden" }}>
        {!hasData
          ? <Empty />
          : (
            <>
              {/* donut */}
              <div style={{ flexShrink:0, animation:"dnPop .5s cubic-bezier(.16,1,.3,1) both" }}>
                <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display:"block", overflow:"visible" }}>
                  {arcs.map((a) => {
                    const dim = active !== -1 && active !== a.i;
                    const pull = active === a.i ? 4 : 0;
                    const off = pull ? polar(cx, cy, pull, a.mid) : { x: cx, y: cy };
                    const dx = off.x - cx, dy = off.y - cy;
                    const showLabel = a.frac >= 0.06; // only label arcs big enough
                    return (
                      <g key={a.i}
                         transform={`translate(${dx.toFixed(2)} ${dy.toFixed(2)})`}
                         style={{ transition:"transform .2s,opacity .2s", opacity: dim ? .35 : 1, cursor:"pointer" }}
                         onMouseEnter={() => setActive(a.i)}
                         onMouseLeave={() => setActive(-1)}>
                        <path d={arcPath(cx, cy, rOut, rIn, a.start, a.end)} fill={a.color}
                              stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
                        {showLabel && (
                          <text x={a.labelPos.x} y={a.labelPos.y} textAnchor="middle" dominantBaseline="central"
                                style={{ fontSize:10, fontWeight:700, fill:"#fff", pointerEvents:"none",
                                         fontFamily:"ui-monospace,monospace", textShadow:"0 1px 2px rgba(0,0,0,.25)" }}>
                            {Math.round(a.frac * 100)}%
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {/* center hero */}
                  <text x={cx} y={cy - 7} textAnchor="middle" dominantBaseline="central"
                        style={{ fontSize: centerMain.length > 7 ? 20 : 26, fontWeight:800, fill:C.ink,
                                 fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace", letterSpacing:"-.02em" }}>
                    {active !== -1 ? fmtN(arcs[active][metric]) : centerMain}
                  </text>
                  <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central"
                        style={{ fontSize:9, fontWeight:700, fill:C.mut, letterSpacing:".08em", textTransform:"uppercase" }}>
                    {active !== -1 ? truncate(arcs[active].name, 16) : centerSub}
                  </text>
                </svg>
              </div>

              {/* legend */}
              <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:2, overflowY:"auto", overflowX:"hidden", maxHeight:"100%", padding:"2px 0" }}>
                {arcs.map((a) => {
                  const dim = active !== -1 && active !== a.i;
                  return (
                    <div key={a.i}
                         onMouseEnter={() => setActive(a.i)}
                         onMouseLeave={() => setActive(-1)}
                         style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 7px", borderRadius:7, cursor:"pointer",
                                  background: active === a.i ? "rgba(13,148,136,.07)" : "transparent", opacity: dim ? .4 : 1, transition:"all .15s" }}>
                      <span style={{ width:9, height:9, borderRadius:3, background:a.color, flexShrink:0 }} />
                      <span style={{ flex:1, minWidth:0, fontSize:10.5, fontWeight:500, color:C.sub, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.name}</span>
                      <span style={{ fontSize:10.5, fontWeight:700, color:C.ink, fontFamily:"ui-monospace,monospace", fontVariantNumeric:"tabular-nums", flexShrink:0 }}>{fmtN(a[metric])}</span>
                      <span style={{ width:34, textAlign:"right", fontSize:9, fontWeight:600, color:C.mut, fontFamily:"ui-monospace,monospace", flexShrink:0 }}>{Math.round(a.frac * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          )
        }
      </div>
    </div>
  );
}

function truncate(s, n) { return s && s.length > n ? s.slice(0, n).trim() + "…" : (s || ""); }

/* ── states ── */
function Empty() {
  return (
    <div style={{ flex:1, height:"100%", minHeight:140, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" />
      </svg>
      <span style={{ fontSize:11, color:C.mut, textAlign:"center", lineHeight:1.5, padding:"0 16px" }}>
        Drop fields on <b>Detail</b>:<br/>
        <span style={{ fontSize:9, color:C.faint }}>segment, donut_count, donut_value, donut_hero, chart_title</span>
      </span>
    </div>
  );
}
function Skeleton() {
  return (
    <div style={{ width:"100%", height:"100%", background:C.bg, borderRadius:14, border:`1px solid ${C.line}`, padding:16, display:"flex", alignItems:"center", gap:16 }}>
      <div style={{ width:180, height:180, borderRadius:"50%", flexShrink:0, background:"linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize:"200% 100%", animation:"dnShim 1.4s infinite" }} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
        {[80,65,72,50].map((w, i) => (
          <div key={i} style={{ height:14, width:w + "%", borderRadius:5, background:"linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize:"200% 100%", animation:"dnShim 1.4s infinite" }} />
        ))}
      </div>
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
