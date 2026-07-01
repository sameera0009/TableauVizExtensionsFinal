import { useEffect, useRef, useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════
   DRILL BAR — single-file React Viz Extension
   Horizontal bars · insurance limit color alerts · value metric driven.

   Fields (drop ALL on Detail, matched by calculated-field name):
     level1, level2, level3   (string dimensions)
     bar_value                (numeric — primary value metric) [required]
     insurance_limit          (numeric — dynamic boundary limit) [required]
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

const C = {
  ink: "#0b1220", sub: "#475569", mut: "#94a3b8", faint: "#cbd5e1",
  bg: "#ffffff", line: "rgba(15,28,46,.07)", track: "#eef2f6",
  alertRed: "#ef4444", safeGreen: "#10b981"
};

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
    <div style={{ width:"100%", height:"100%", background:"transparent", padding:4,
                  fontFamily:"system-ui,-apple-system,sans-serif", WebkitFontSmoothing:"antialiased",
                  boxSizing:"border-box", overflow:"hidden", display:"flex", flexDirection:"column" }}>
      {children}
    </div>
  );
}

function Chart({ rows }) {
  const [expanded, setExpanded] = useState({}); 
  const [tip, setTip] = useState(null);

  const keys = useMemo(() => ({
    l1: keyFor(rows, "level1"),
    l2: keyFor(rows, "level2"),
    l3: keyFor(rows, "level3"),
    val: keyFor(rows, "bar_value"),
    limit: keyFor(rows, "insurance_limit"),
  }), [rows]);

  /* Build analytical breakdown mapping tree node models using only absolute value fields */
  const tree = useMemo(() => {
    const root = {};
    rows.forEach((r) => {
      const a = vStr(r, keys.l1); if (!a) return;
      const b = vStr(r, keys.l2);
      const c = vStr(r, keys.l3);
      const val = vNum(r, keys.val) || 0;
      const limit = vNum(r, keys.limit) || 0;

      if (!root[a]) root[a] = { name: a, value: 0, limit: 0, kids: {} };
      root[a].value += val;
      root[a].limit += limit;

      if (b) {
        if (!root[a].kids[b]) root[a].kids[b] = { name: b, value: 0, limit: 0, kids: {} };
        root[a].kids[b].value += val;
        root[a].kids[b].limit += limit;
        if (c) {
          if (!root[a].kids[b].kids[c]) root[a].kids[b].kids[c] = { name: c, value: 0, limit: 0, kids: {} };
          root[a].kids[b].kids[c].value += val;
          root[a].kids[b].kids[c].limit += limit;
        }
      }
    });

    const toArr = (obj) => Object.values(obj).map((n) => ({ ...n, kids: toArr(n.kids) }))
                                             .sort((x, y) => (y.value || 0) - (x.value || 0));
    return toArr(root);
  }, [rows, keys]);

  const hasData = tree.length > 0;
  const maxVal = Math.max(...tree.map((n) => n.value || 0), 1);
  const grandTotal = tree.reduce((s, n) => s + (n.value || 0), 0);

  const toggle = (path) => setExpanded((e) => ({ ...e, [path]: !e[path] }));

  const visible = [];
  const walk = (nodes, depth, parentPath, parentMax) => {
    nodes.forEach((n) => {
      const path = parentPath + "/" + n.name;
      const hasKids = n.kids && n.kids.length > 0 && depth < 2;
      const isOpen = !!expanded[path];
      visible.push({ node: n, depth, path, hasKids, isOpen, parentMax });
      if (isOpen && hasKids) {
        const childMax = Math.max(...n.kids.map((k) => k.value || 0), 1);
        walk(n.kids, depth + 1, path, childMax);
      }
    });
  };
  if (hasData) walk(tree, 0, "", maxVal);

  return (
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", background:C.bg,
                  borderRadius:12, border:`1px solid ${C.line}`, boxShadow:"0 4px 20px rgba(0,0,0,0.02)",
                  overflow:"hidden", position:"relative" }}>

      {/* Main Bar Scroller Content Area */}
      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", padding:"12px 14px", minHeight:0 }}
           onMouseLeave={() => setTip(null)}>
        {!hasData
          ? <Empty />
          : visible.map((v, i) => (
              <BarRow key={v.path} v={v} grandTotal={grandTotal}
                      onToggle={() => toggle(v.path)} setTip={setTip} idx={i} />
            ))
        }
      </div>

      {/* Floating Tooltip Interface Card */}
      {tip && <Tooltip tip={tip} grandTotal={grandTotal} />}
    </div>
  );
}

function BarRow({ v, grandTotal, onToggle, setTip, idx }) {
  const { node, depth, hasKids, isOpen, parentMax } = v;
  const [hov, setHov] = useState(false);
  const val = node.value || 0;
  const limit = node.limit || 0;
  
  // Insurance calculation logic: Alert color mapping threshold checks
  const isExceeded = val > limit;
  const barColor = isExceeded ? C.alertRed : C.safeGreen;
  
  const pct = parentMax > 0 ? (val / parentMax) * 100 : 0;
  const indent = depth * 16;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, node, depth, isExceeded })}
      onClick={() => hasKids && onToggle()}
      style={{
        display:"flex", alignItems:"center", gap:8, padding:"5px 6px", borderRadius:6,
        marginLeft:indent, cursor: hasKids ? "pointer" : "default",
        background: hov ? "rgba(15,23,42,0.03)" : "transparent",
        transition:"background .12s", animation:`dbRow .25s ease ${Math.min(idx,15) * 0.01}s both`,
      }}
    >
      {/* Drill-down interactive carets */}
      <span style={{ width:10, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:C.mut }}>
        {hasKids ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
               style={{ transform: isOpen ? "rotate(90deg)" : "none", transition:"transform .2s" }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        ) : <span style={{ width:3, height:3, borderRadius:"50%", background:C.faint }} />}
      </span>

      {/* Data Label Row */}
      <span style={{ width:"28%", minWidth:60, maxWidth:130, fontSize:11, fontWeight: depth === 0 ? 600 : 500,
                     color: C.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", flexShrink:0 }}>
        {node.name}
      </span>

      {/* Target dynamic value bar width structure */}
      <div style={{ flex:1, height:14, background:C.track, borderRadius:4, overflow:"hidden", position:"relative" }}>
        <div style={{
          height:"100%", width: Math.max(pct, 1.2) + "%", borderRadius:4, transformOrigin:"left",
          background: barColor, opacity: hov ? 0.95 : 0.85,
          animation:`dbFill .45s cubic-bezier(.16,1,.3,1) ${Math.min(idx,15) * 0.01}s both`,
          transition: "opacity 0.1s ease",
        }} />
      </div>

      {/* Quantitative Value Outputs */}
      <span style={{ width:55, textAlign:"right", fontSize:10.5, fontWeight:700, fontFamily:"ui-monospace,monospace",
                     color:C.ink, flexShrink:0 }}>
        {fmtN(val)}
      </span>
    </div>
  );
}

function Tooltip({ tip, grandTotal }) {
  const { node, depth, isExceeded } = tip;
  const share = grandTotal > 0 ? ((node.value || 0) / grandTotal * 100).toFixed(1) : "—";

  const x = Math.min(tip.x + 12, (typeof window !== "undefined" ? window.innerWidth : 9999) - 180);
  const y = Math.min(tip.y + 12, (typeof window !== "undefined" ? window.innerHeight : 9999) - 130);

  return (
    <div style={{
      position:"fixed", left:x, top:y, zIndex:9999, pointerEvents:"none",
      background:"rgba(15,23,42,0.96)", backdropFilter:"blur(8px)", borderRadius:8,
      border:"1px solid rgba(255,255,255,0.08)", boxShadow:"0 6px 20px rgba(0,0,0,0.25)",
      padding:"8px 10px", minWidth:150,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
        <span style={{ width:7, height:7, borderRadius:"50%", background: isExceeded ? C.alertRed : C.safeGreen }} />
        <span style={{ fontSize:11, fontWeight:700, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{node.name}</span>
      </div>
      
      <div style={{ display:"flex", justifyContent:"space-between", gap:12, marginBottom:2 }}>
        <span style={{ fontSize:9.5, color:"rgba(255,255,255,0.5)" }}>Value</span>
        <span style={{ fontSize:10, fontWeight:700, color:"#fff", fontFamily:"ui-monospace,monospace" }}>{fmtFull(node.value)}</span>
      </div>
      
      <div style={{ display:"flex", justifyContent:"space-between", gap:12, marginBottom:2 }}>
        <span style={{ fontSize:9.5, color:"rgba(255,255,255,0.5)" }}>Limit</span>
        <span style={{ fontSize:10, fontWeight:700, color:"#fff", fontFamily:"ui-monospace,monospace" }}>{fmtFull(node.limit)}</span>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
        <span style={{ fontSize:9.5, color:"rgba(255,255,255,0.5)" }}>Total Share</span>
        <span style={{ fontSize:10, fontWeight:700, color:"#fff", fontFamily:"ui-monospace,monospace" }}>{share}%</span>
      </div>
    </div>
  );
}

/* ── Asset Empty States ── */
function Empty() {
  return (
    <div style={{ height:"100%", minHeight:120, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
      <span style={{ fontSize:10, color:C.mut, textAlign:"center" }}>
        Missing dimensions on <b>Detail</b>.<br/>
        <span style={{ fontSize:9, color:C.faint }}>Requires: level1, bar_value, insurance_limit</span>
      </span>
    </div>
  );
}
function Skeleton() {
  return (
    <div style={{ width:"100%", height:"100%", background:C.bg, borderRadius:12, padding:12, display:"flex", flexDirection:"column", gap:8 }}>
      {[85,65,75,45,60].map((w, i) => (
        <div key={i} style={{ height:14, width:w + "%", borderRadius:4, background:"linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize:"200% 100%", animation:"dbShim 1.4s infinite" }} />
      ))}
    </div>
  );
}
function ErrView({ msg }) {
  return (
    <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ fontSize:10, color:"#dc2626", fontWeight:600 }}>{msg}</span>
    </div>
  );
}
