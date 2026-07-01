import { useEffect, useRef, useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════
   MAP — single-file React Viz Extension
   Leaflet base map (loaded from CDN at runtime) · circles sized &
   colored by value · auto-fits to all points · hover popups ·
   dynamic header · color legend.

   Fields (drop ALL on Detail, matched by calculated-field name):
     map_lat      (numeric) — latitude   [required]
     map_lng      (numeric) — longitude  [required]
     map_value    (numeric) — color + size [required]
     map_label    (string)  — hover name  [optional]
     chart_title  (string)  — dynamic header [optional]
═══════════════════════════════════════════════════════════ */

if (typeof window !== "undefined" && !document.getElementById("mp-kf")) {
  const s = document.createElement("style");
  s.id = "mp-kf";
  s.innerHTML =
    "@keyframes mpShim{0%{background-position:200% 0}100%{background-position:-200% 0}}" +
    ".mp-pop .leaflet-popup-content-wrapper{background:rgba(11,18,32,.97);color:#fff;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.3)}" +
    ".mp-pop .leaflet-popup-tip{background:rgba(11,18,32,.97)}" +
    ".mp-pop .leaflet-popup-content{margin:9px 12px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}" +
    ".leaflet-container{background:#eef2f6;font-family:system-ui,sans-serif}";
  document.head.appendChild(s);
}

const C = {
  ink: "#0b1220", sub: "#475569", mut: "#94a3b8", faint: "#cbd5e1",
  bg: "#ffffff", line: "rgba(15,28,46,.07)", track: "#eef2f6",
  teal: "#0d9488", tealLt: "#2dd4bf", tealDk: "#0f766e",
};

/* sequential color ramp (low → high): cool teal to warm amber to red */
const RAMP = [
  { t: 0.0, c: [45, 212, 191] },    // teal
  { t: 0.35, c: [13, 148, 136] },  // deep teal
  { t: 0.6, c: [217, 119, 6] },    // amber
  { t: 0.8, c: [220, 38, 38] },    // red
  { t: 1.0, c: [153, 27, 27] },    // dark red
];
function rampColor(t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < RAMP.length; i++) {
    if (t <= RAMP[i].t) {
      const a = RAMP[i - 1], b = RAMP[i];
      const f = (t - a.t) / (b.t - a.t || 1);
      const ch = (j) => Math.round(a.c[j] + (b.c[j] - a.c[j]) * f);
      return `rgb(${ch(0)},${ch(1)},${ch(2)})`;
    }
  }
  const last = RAMP[RAMP.length - 1].c;
  return `rgb(${last[0]},${last[1]},${last[2]})`;
}

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

/* ── dynamic Leaflet loader from CDN ── */
let leafletPromise = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    css.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    css.crossOrigin = "";
    document.head.appendChild(css);

    const js = document.createElement("script");
    js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    js.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    js.crossOrigin = "";
    js.onload = () => resolve(window.L);
    js.onerror = () => reject(new Error("Could not load map library from CDN"));
    document.body.appendChild(js);
  });
  return leafletPromise;
}

/* ════════════════════════════════
   ROOT
════════════════════════════════ */
export default function MapViz() {
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
  return <Shell><MapInner rows={state.rows} /></Shell>;
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
   MAP
════════════════════════════════ */
function MapInner({ rows }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  
  // "size" or "color" selector
  const [scaleMode, setScaleMode] = useState("size"); 

  const keys = useMemo(() => ({
    lat: keyFor(rows, "map_lat"),
    lng: keyFor(rows, "map_lng"),
    val: keyFor(rows, "map_value"),
    label: keyFor(rows, "map_label"),
  }), [rows]);

  /* parse points */
  const points = useMemo(() => {
    const pts = [];
    rows.forEach((r) => {
      const lat = vNum(r, keys.lat), lng = vNum(r, keys.lng);
      if (lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
      pts.push({ lat, lng, value: vNum(r, keys.val) || 0, label: vStr(r, keys.label) || "" });
    });
    return pts;
  }, [rows, keys]);

  const vals = points.map((p) => p.value);
  const vMin = vals.length ? Math.min(...vals) : 0;
  const vMax = vals.length ? Math.max(...vals) : 1;
  const range = vMax - vMin || 1;

  /* init leaflet once */
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapElRef.current || mapRef.current) return;
      const map = L.map(mapElRef.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO", subdomains: "abcd", maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setReady(true);
    }).catch((e) => setLoadErr(e.message));
    return () => { cancelled = true; };
  }, []);

  /* draw / redraw circles + auto-fit dependency added for [scaleMode] */
  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;
    const layer = layerRef.current;
    layer.clearLayers();
    if (!points.length) return;

    const latlngs = [];
    points.forEach((p) => {
      const t = (p.value - vMin) / range;
      
      // Determine logic metrics based on state swapper option selected
      const color = scaleMode === "color" ? rampColor(t) : C.teal;
      const radius = scaleMode === "size" ? (7 + t * 17) : 12; // Dynamic 7–24px or static unified size

      latlngs.push([p.lat, p.lng]);
      const marker = L.circleMarker([p.lat, p.lng], {
        radius, color: "#fff", weight: 1.5, fillColor: color, fillOpacity: 0.82,
      });
      const labelLine = p.label ? `<div style="font-size:11px;font-weight:700;color:#fff;margin-bottom:5px">${escapeHtml(p.label)}</div>` : "";
      marker.bindPopup(
        `${labelLine}` +
        `<div style="display:flex;justify-content:space-between;gap:14px;margin-bottom:3px"><span style="font-size:9.5px;color:rgba(255,255,255,.55)">Value</span><span style="font-size:10.5px;font-weight:700;color:#fff;font-family:ui-monospace,monospace">${fmtFull(p.value)}</span></div>` +
        `<div style="display:flex;justify-content:space-between;gap:14px"><span style="font-size:9.5px;color:rgba(255,255,255,.55)">Location</span><span style="font-size:9.5px;color:rgba(255,255,255,.8);font-family:ui-monospace,monospace">${p.lat.toFixed(3)}, ${p.lng.toFixed(3)}</span></div>`,
        { className: "mp-pop", closeButton: false }
      );
      marker.on("mouseover", function () { this.openPopup(); this.setStyle({ weight: 2.5 }); });
      marker.on("mouseout", function () { this.closePopup(); this.setStyle({ weight: 1.5 }); });
      marker.addTo(layer);
    });

    /* AUTO-FIT to all points */
    if (latlngs.length === 1) {
      mapRef.current.setView(latlngs[0], 12);
    } else {
      const bounds = L.latLngBounds(latlngs);
      mapRef.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
    }
    setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 60);
  }, [ready, points, vMin, range, scaleMode]);

  /* keep map sized to container */
  useEffect(() => {
    if (!ready || !mapElRef.current) return;
    const ro = new ResizeObserver(() => mapRef.current && mapRef.current.invalidateSize());
    ro.observe(mapElRef.current);
    return () => ro.disconnect();
  }, [ready]);

  if (loadErr) return <ErrView msg={loadErr} />;

  return (
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", background:C.bg,
                  borderRadius:14, border:`1px solid ${C.line}`, boxShadow:"0 1px 3px rgba(15,28,46,.05),0 8px 24px rgba(15,28,46,.06)",
                  overflow:"hidden", position:"relative" }}>

      {/* map layout workspace */}
      <div style={{ flex:1, minHeight:0, position:"relative" }}>
        <div ref={mapElRef} style={{ position:"absolute", inset:0 }} />
        {!points.length && ready && <NoPoints />}
        {!ready && !loadErr && <LoadingMap />}

        {/* FLOATING SCALE MODE SWAPPER & METADATA OVERLAY */}
        {ready && points.length > 0 && (
          <div style={{ position:"absolute", top:12, right:12, zIndex:500, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
            
            {/* Animated Tab Control Box */}
            <div style={{ background:"rgba(255, 255, 255, 0.9)", backdropFilter:"blur(12px)", padding:4, borderRadius:10, 
                          border:`1px solid ${C.line}`, boxShadow:"0 4px 12px rgba(15,28,46,0.08)", display:"flex", gap:2 }}>
              <button 
                onClick={() => setScaleMode("size")}
                style={{ border:"none", padding:"6px 12px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer",
                         transition:"all 0.2s ease", display:"flex", alignItems:"center", gap:5,
                         background: scaleMode === "size" ? C.ink : "transparent",
                         color: scaleMode === "size" ? "#ffffff" : C.sub }}
              >
                <span style={{ fontSize:12 }}>📐</span> Size Scale
              </button>
              <button 
                onClick={() => setScaleMode("color")}
                style={{ border:"none", padding:"6px 12px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer",
                         transition:"all 0.2s ease", display:"flex", alignItems:"center", gap:5,
                         background: scaleMode === "color" ? C.ink : "transparent",
                         color: scaleMode === "color" ? "#ffffff" : C.sub }}
              >
                <span style={{ fontSize:12 }}>🎨</span> Color Scale
              </button>
            </div>

            {/* Context Location Count Tag */}
            <div style={{ background:"rgba(11, 18, 32, 0.8)", backdropFilter:"blur(6px)", color:"#fff", fontSize:10, 
                          padding:"4px 10px", borderRadius:20, fontWeight:500, boxShadow:"0 2px 6px rgba(0,0,0,0.15)" }}>
              {points.length} Active location{points.length === 1 ? "" : "s"}
            </div>
          </div>
        )}

        {/* DYNAMIC LEGEND CONFIGURATION */}
        {points.length > 0 && (
          <div style={{ position:"absolute", bottom:12, left:12, zIndex:500, background:"rgba(255,255,255,.94)", backdropFilter:"blur(8px)",
                        borderRadius:9, border:`1px solid ${C.line}`, boxShadow:"0 2px 10px rgba(15,28,46,.1)", padding:"8px 12px", minWidth:120 }}>
            <div style={{ fontSize:8.5, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", color:C.mut, marginBottom:6 }}>
              {scaleMode === "size" ? "Scale: Radius Size" : "Scale: Color Spectrum"}
            </div>
            
            {scaleMode === "color" ? (
              <div style={{ width:120, height:8, borderRadius:5, background:`linear-gradient(90deg, ${rampColor(0)}, ${rampColor(0.35)}, ${rampColor(0.6)}, ${rampColor(0.8)}, ${rampColor(1)})` }} />
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:6, height:8, padding:"0 2px" }}>
                <div style={{ width:4, height:4, borderRadius:"50%", background:C.teal }} />
                <div style={{ flex:1, height:1, background:C.faint }} />
                <div style={{ width:10, height:10, borderRadius:"50%", background:C.teal }} />
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
              <span style={{ fontSize:8, color:C.sub, fontFamily:"ui-monospace,monospace" }}>{fmtN(vMin)}</span>
              <span style={{ fontSize:8, color:C.sub, fontFamily:"ui-monospace,monospace" }}>{fmtN(vMax)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ── states ── */
function NoPoints() {
  return (
    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, background:"rgba(238,242,246,.85)", zIndex:400 }}>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
      <span style={{ fontSize:11, color:C.mut, textAlign:"center", lineHeight:1.5, padding:"0 16px" }}>
        Drop fields on <b>Detail</b>:<br/>
        <span style={{ fontSize:9, color:C.faint }}>map_lat, map_lng, map_value, map_label</span>
      </span>
    </div>
  );
}
function LoadingMap() {
  return (
    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:C.track, zIndex:400 }}>
      <span style={{ fontSize:11, color:C.mut, fontWeight:500 }}>Loading map…</span>
    </div>
  );
}
function Skeleton() {
  return (
    <div style={{ width:"100%", height:"100%", background:C.bg, borderRadius:14, border:`1px solid ${C.line}`, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ flex:1, borderRadius:8, background:"linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize:"200% 100%", animation:"mpShim 1.4s infinite" }} />
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
