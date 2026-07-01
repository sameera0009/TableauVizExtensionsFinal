import { useEffect, useRef, useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════
   DRILL BAR — single-file React Viz Extension
   Horizontal bars · count/value toggle · rich hover tooltip ·
   click a bar to expand its children inline (3 levels) ·
   dynamic chart header.

   Fields (drop ALL on Detail, matched by calculated-field name):
     level1, level2, level3   (string dimensions)
     bar_count                (numeric — default metric)
     bar_value                (numeric — toggle metric)
     chart_title              (string — dynamic header)
═══════════════════════════════════════════════════════════ */

if (typeof window !== "undefined" && !document.getElementById("db-kf")) {
  const s = document.createElement("style");
  s.id = "db-kf";
  s.innerHTML =
    "@keyframes dbShim{0%{background-position:200% 0}100%{background-position:-200% 0}}" +
    "@keyframes dbFill{from{transform:scaleX(0)}to{transform:scaleX(1)}}" +
    "@keyframes dbRow{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}";
  document.head.appendChild(s);
}

/* deep-teal command-center palette */
const C = {
  ink: "#0b1220", sub: "#475569", mut: "#94a3b8", faint: "#cbd5e1",
  bg: "#ffffff", line: "rgba(15,28,46,.07)", track: "#eef2f6",
  teal: "#0d9488", tealLt: "#2dd4bf", tealDk: "#0f766e",
  l1a: "#0f766e", l1b: "#14b8a6",
  l2a: "#0369a1", l2b: "#38bdf8",
  l3a: "#7c3aed", l3b: "#a78bfa",
};
const LEVEL_COLORS = [
  { a: C.l1a, b: C.l1b },
  { a: C.l2a, b: C.l2b },
  { a: C.l3a, b: C.l3b },
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
export default function DrillBar() {
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
  return <Shell><Chart rows={state.rows} /></Shell>;
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

/* ════════════════════════════════
   CHART
════════════════════════════════ */
function Chart({ rows }) {
  const [metric, setMetric] = useState("count"); // count | value
  const [expanded, setExpanded] = useState({}); // path -> bool
  const [tip, setTip] = useState(null);

  /* resolve keys */
  const keys = useMemo(() => ({
    l1: keyFor(rows, "level1"),
    l2: keyFor(rows, "level2"),
    l3: keyFor(rows, "level3"),
    cnt: keyFor(rows, "bar_count"),
    val: keyFor(rows, "bar_value"),
    title: keyFor(rows, "chart_title"),
  }), [rows]);

  const hasValue = !!keys.val;
  const metricKey = metric === "value" && keys.val ? keys.val : keys.cnt;

  /* dynamic header */
  let header = vStr(rows[0], keys.title);
  header = header ? pretty(header) : "Breakdown";

  /* build nested tree: level1 → level2 → level3 */
  const tree = useMemo(() => {
    const root = {};
    rows.forEach((r) => {
      const a = vStr(r, keys.l1); if (!a) return;
      const b = vStr(r, keys.l2);
      const c = vStr(r, keys.l3);
      const cnt = vNum(r, keys.cnt) || 0;
      const val = vNum(r, keys.val) || 0;
      if (!root[a]) root[a] = { name: a, count: 0, value: 0, kids: {} };
      root[a].count += cnt; root[a].value += val;
      if (b) {
        if (!root[a].kids[b]) root[a].kids[b] = { name: b, count: 0, value: 0, kids: {} };
        root[a].kids[b].count += cnt; root[a].kids[b].value += val;
        if (c) {
          if (!root[a].kids[b].kids[c]) root[a].kids[b].kids[c] = { name: c, count: 0, value: 0, kids: {} };
          root[a].kids[b].kids[c].count += cnt; root[a].kids[b].kids[c].value += val;
        }
      }
    });
    const toArr = (obj) => Object.values(obj).map((n) => ({ ...n, kids: toArr(n.kids) }))
                                            .sort((x, y) => (y[metric] || 0) - (x[metric] || 0));
    return toArr(root);
  }, [rows, keys, metric]);

  const hasData = tree.length > 0;
  const maxVal = Math.max(...tree.map((n) => n[metric] || 0), 1);
  const grandTotal = tree.reduce((s, n) => s + (n[metric] || 0), 0);

  const toggle = (path) => setExpanded((e) => ({ ...e, [path]: !e[path] }));

  /* flatten visible rows with depth + parent max for proportional bars */
  const visible = [];
  const walk = (nodes, depth, parentPath, parentMax) => {
    nodes.forEach((n) => {
      const path = parentPath + "/" + n.name;
      const hasKids = n.kids && n.kids.length > 0 && depth < 2;
      const isOpen = !!expanded[path];
      visible.push({ node: n, depth, path, hasKids, isOpen, parentMax });
      if (isOpen && hasKids) {
        const childMax = Math.max(...n.kids.map((k) => k[metric] || 0), 1);
        walk(n.kids, depth + 1, path, childMax);
      }
    });
  };
  if (hasData) walk(tree, 0, "", maxVal);

  return (
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", background:C.bg,
                  borderRadius:14, border:`1px solid ${C.line}`, boxShadow:"0 1px 3px rgba(15,28,46,.05),0 8px 24px rgba(15,28,46,.06)",
                  overflow:"hidden", position:"relative" }}>

      {/* header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 16px 11px", borderBottom:`1px solid ${C.line}`, flexShrink:0 }}>
        <div style={{ width:3, height:18, borderRadius:2, background:`linear-gradient(180deg,${C.tealLt},${C.tealDk})`, flexShrink:0 }} />
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.ink, letterSpacing:"-.2px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{header}</div>
          <div style={{ fontSize:9.5, color:C.mut, marginTop:1 }}>{tree.length} items · total {fmtN(grandTotal)}</div>
        </div>
        {/* metric toggle */}
        <div style={{ display:"flex", background:C.track, borderRadius:9, padding:3, gap:2, flexShrink:0 }}>
          {["count","value"].map((m) => {
            const disabled = m === "value" && !hasValue;
            const active = metric === m;
            return (
              <button key={m} disabled={disabled}
                onClick={() => { setMetric(m); }}
                title={disabled ? "Drop bar_value to enable" : ""}
                style={{ fontSize:10.5, fontWeight:600, padding:"4px 12px", borderRadius:7, border:"none",
                         cursor: disabled ? "not-allowed" : "pointer", textTransform:"capitalize", fontFamily:"inherit",
                         background: active ? C.bg : "transparent", color: disabled ? C.faint : active ? C.ink : C.sub,
                         boxShadow: active ? "0 1px 4px rgba(0,0,0,.1)" : "none", opacity: disabled ? .5 : 1, transition:"all .15s" }}>
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* bars */}
      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", padding:"8px 14px 12px", minHeight:0 }}
           onMouseLeave={() => setTip(null)}>
        {!hasData
          ? <Empty />
          : visible.map((v, i) => (
              <BarRow key={v.path} v={v} metric={metric} grandTotal={grandTotal}
                      onToggle={() => toggle(v.path)} setTip={setTip} idx={i} />
            ))
        }
      </div>

      {/* footer legend */}
      {hasData && (
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"7px 16px", borderTop:`1px solid ${C.line}`, flexShrink:0 }}>
          {["Level 1","Level 2","Level 3"].map((lbl, i) => (
            <span key={lbl} style={{ display:"flex", alignItems:"center", gap:5, fontSize:9, color:C.mut }}>
              <span style={{ width:9, height:9, borderRadius:3, background:`linear-gradient(135deg,${LEVEL_COLORS[i].a},${LEVEL_COLORS[i].b})` }} />
              {lbl}
            </span>
          ))}
          <span style={{ marginLeft:"auto", fontSize:8.5, color:C.faint }}>click a bar to drill down</span>
        </div>
      )}

      {/* tooltip */}
      {tip && <Tooltip tip={tip} metric={metric} hasValue={hasValue} grandTotal={grandTotal} />}
    </div>
  );
}

/* ── single bar row ── */
function BarRow({ v, metric, grandTotal, onToggle, setTip, idx }) {
  const { node, depth, hasKids, isOpen, parentMax } = v;
  const [hov, setHov] = useState(false);
  const val = node[metric] || 0;
  const pct = parentMax > 0 ? (val / parentMax) * 100 : 0;
  const col = LEVEL_COLORS[depth] || LEVEL_COLORS[2];
  const indent = depth * 18;

  return (
    <div
      onMouseEnter={() => { setHov(true); }}
      onMouseLeave={() => setHov(false)}
      onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, node, depth })}
      onClick={() => hasKids && onToggle()}
      style={{
        display:"flex", alignItems:"center", gap:8, padding:"5px 6px", borderRadius:8,
        marginLeft:indent, cursor: hasKids ? "pointer" : "default",
        background: hov ? "rgba(13,148,136,.05)" : "transparent",
        transition:"background .14s", animation:`dbRow .3s ease ${Math.min(idx,12) * 0.02}s both`,
      }}
    >
      {/* caret */}
      <span style={{ width:12, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:C.mut }}>
        {hasKids ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
               style={{ transform: isOpen ? "rotate(90deg)" : "none", transition:"transform .25s" }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        ) : <span style={{ width:4, height:4, borderRadius:"50%", background:C.faint }} />}
      </span>

      {/* label */}
      <span style={{ width:"30%", minWidth:60, maxWidth:140, fontSize:11, fontWeight: depth === 0 ? 600 : 500,
                     color: depth === 0 ? C.ink : C.sub, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", flexShrink:0 }}>
        {node.name}
      </span>

      {/* bar track */}
      <div style={{ flex:1, height:18, background:C.track, borderRadius:6, overflow:"hidden", position:"relative", minWidth:30 }}>
        <div style={{
          height:"100%", width: Math.max(pct, 1.5) + "%", borderRadius:6, transformOrigin:"left",
          background:`linear-gradient(90deg,${col.a},${col.b})`,
          boxShadow: hov ? `0 0 0 1px ${col.b}66 inset` : "none",
          animation:`dbFill .55s cubic-bezier(.16,1,.3,1) ${Math.min(idx,12) * 0.02}s both`,
          transition:"box-shadow .15s",
        }} />
      </div>

      {/* value */}
      <span style={{ width:52, textAlign:"right", fontSize:10.5, fontWeight:700, fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace",
                     color:C.ink, fontVariantNumeric:"tabular-nums", flexShrink:0 }}>
        {fmtN(val)}
      </span>
    </div>
  );
}

/* ── floating tooltip ── */
function Tooltip({ tip, metric, hasValue, grandTotal }) {
  const { node, depth } = tip;
  const share = grandTotal > 0 ? ((node[metric] || 0) / grandTotal * 100).toFixed(1) : "—";
  const col = LEVEL_COLORS[depth] || LEVEL_COLORS[2];
  const kidCount = node.kids ? node.kids.length : 0;

  /* keep tooltip on-screen */
  const x = Math.min(tip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 9999) - 190);
  const y = Math.min(tip.y + 14, (typeof window !== "undefined" ? window.innerHeight : 9999) - 150);

  return (
    <div style={{
      position:"fixed", left:x, top:y, zIndex:9999, pointerEvents:"none",
      background:"rgba(11,18,32,.97)", backdropFilter:"blur(12px)", borderRadius:11,
      border:"1px solid rgba(255,255,255,.1)", boxShadow:"0 8px 28px rgba(0,0,0,.35)",
      padding:"11px 13px", minWidth:160, maxWidth:200,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
        <span style={{ width:8, height:8, borderRadius:3, background:`linear-gradient(135deg,${col.a},${col.b})`, flexShrink:0 }} />
        <span style={{ fontSize:11.5, fontWeight:700, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{node.name}</span>
      </div>
      <Row label="Count" value={fmtFull(node.count)} />
      {hasValue && <Row label="Value" value={fmtFull(node.value)} />}
      <Row label={"Share (" + metric + ")"} value={share + "%"} />
      {kidCount > 0 && depth < 2 && <Row label="Sub-items" value={String(kidCount)} />}
      <div style={{ marginTop:7, paddingTop:7, borderTop:"1px solid rgba(255,255,255,.08)", fontSize:8.5, color:"rgba(255,255,255,.4)" }}>
        Level {depth + 1}{kidCount > 0 && depth < 2 ? " · click to expand" : ""}
      </div>
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", gap:14, marginBottom:4 }}>
      <span style={{ fontSize:10, color:"rgba(255,255,255,.5)" }}>{label}</span>
      <span style={{ fontSize:10.5, fontWeight:700, color:"#fff", fontFamily:"ui-monospace,monospace", fontVariantNumeric:"tabular-nums" }}>{value}</span>
    </div>
  );
}

/* ── states ── */
function Empty() {
  return (
    <div style={{ height:"100%", minHeight:140, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
      <span style={{ fontSize:11, color:C.mut, textAlign:"center", lineHeight:1.5, padding:"0 16px" }}>
        Drop fields on <b>Detail</b>:<br/>
        <span style={{ fontSize:9, color:C.faint }}>level1, level2, level3, bar_count, bar_value, chart_title</span>
      </span>
    </div>
  );
}
function Skeleton() {
  return (
    <div style={{ width:"100%", height:"100%", background:C.bg, borderRadius:14, border:`1px solid ${C.line}`, padding:16, display:"flex", flexDirection:"column", gap:9 }}>
      <div style={{ height:18, width:180, borderRadius:5, background:"linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize:"200% 100%", animation:"dbShim 1.4s infinite" }} />
      {[90,70,82,55,68,45].map((w, i) => (
        <div key={i} style={{ height:18, width:w + "%", borderRadius:6, background:"linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize:"200% 100%", animation:"dbShim 1.4s infinite" }} />
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
