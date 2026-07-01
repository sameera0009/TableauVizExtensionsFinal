import { useEffect, useRef, useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════
   MAP — Single-file React Viz Extension (Dashboard Optimized)
   Leaflet base map · diverging balance ramp · hidden gear controls.

   Fields (drop ALL on Detail, matched by calculated-field name):
     map_lat         (numeric) — latitude         [required]
     map_lng         (numeric) — longitude        [required]
     map_value       (numeric) — Cash balance     [required]
     insurance_limit (numeric) — baseline limit   [required for filters]
     map_label       (string)  — hover name       [optional]
═══════════════════════════════════════════════════════════ */

if (typeof window !== "undefined" && !document.getElementById("mp-kf")) {
  const s = document.createElement("style");
  s.id = "mp-kf";
  s.innerHTML =
    "@keyframes mpShim{0%{background-position:200% 0}100%{background-position:-200% 0}}" +
    ".mp-pop .leaflet-popup-content-wrapper{background:rgba(15,23,42,0.96);color:#fff;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.22);border:1px solid rgba(255,255,255,0.08)}" +
    ".mp-pop .leaflet-popup-tip{background:rgba(15,23,42,0.96)}" +
    ".mp-pop .leaflet-popup-content{margin:8px 12px;font-family:system-ui,-apple-system,sans-serif}" +
    ".leaflet-container{background:#f8fafc;font-family:system-ui,sans-serif}" +
    ".mp-slider::-webkit-slider-runnable-track{background:rgba(255,255,255,0.15);height:4px;border-radius:2px}" +
    ".mp-slider::-webkit-slider-thumb{-webkit-appearance:none;background:#ffffff;height:12px;width:12px;border-radius:50%;margin-top:-4px;cursor:pointer}" +
    ".mp-select{background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15);padding:5px;border-radius:6px;font-size:11px;outline:none;width:100%;cursor:pointer}" +
    ".mp-select option{background:#1e293b;color:#fff}";
  document.head.appendChild(s);
}

const C = {
  ink: "#0f172a", sub: "#475569", mut: "#64748b", faint: "#e2e8f0",
  bg: "#ffffff", line: "rgba(15,23,42,0.06)", track: "#f1f5f9",
  accent: "#475569",
};

/* Balanced Diverging Ramp: Cool Slate-Blue (Low) → Neutral Cream (Mid) → Deep Coral (High) */
const RAMP = [
  { t: 0.0, c: [71, 85, 105] },     
  { t: 0.25, c: [148, 163, 184] }, 
  { t: 0.5, c: [241, 245, 249] },  
  { t: 0.75, c: [248, 113, 113] }, 
  { t: 1.0, c: [185, 28, 28] },    
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

function fmtN(n) {
  if (n == null || isNaN(n)) return "—";
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1e9) return s + (a / 1e9).toFixed(1) + "B";
  if (a >= 1e6) return s + (a / 1e6).toFixed(1) + "M";
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

let leafletPromise = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);

    const js = document.createElement("script");
    js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    js.onload = () => resolve(window.L);
    js.onerror = () => reject(new Error("Could not load map library from CDN"));
    document.body.appendChild(js);
  });
  return leafletPromise;
}

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
    <div style={{ width:"100%", height:"100%", background:"transparent", padding:2,
                  fontFamily:"system-ui,-apple-system,sans-serif",
                  WebkitFontSmoothing:"antialiased", boxSizing:"border-box", overflow:"hidden", display:"flex", flexDirection:"column" }}>
      {children}
    </div>
  );
}

function MapInner({ rows }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  
  // Clean Workspace Parameters Configuration
  const [showSettings, setShowSettings] = useState(false);
  const [scaleMode, setScaleMode] = useState("color"); // Default Color Spectrum
  const [baseRadius, setBaseRadius] = useState(5);     // Default 5px Radius Size
  const [filterMode, setFilterMode] = useState("all"); // Default array scope

  const keys = useMemo(() => ({
    lat: keyFor(rows, "map_lat"),
    lng: keyFor(rows, "map_lng"),
    val: keyFor(rows, "map_value"),
    limit: keyFor(rows, "insurance_limit"),
    label: keyFor(rows, "map_label"),
  }), [rows]);

  // Unified Parse, Metric Analysis & Content Filtering Pipeline
  const filteredPoints = useMemo(() => {
    const pts = [];
    rows.forEach((r) => {
      const lat = vNum(r, keys.lat), lng = vNum(r, keys.lng);
      if (lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
      
      const value = vNum(r, keys.val) || 0;
      const limit = vNum(r, keys.limit) || 0;
      
      pts.push({ 
        lat, lng, value, limit, 
        exceededAmount: value - limit,
        label: vStr(r, keys.label) || "" 
      });
    });

    // Handle Conditional Filter States
    if (filterMode === "exceed") {
      return pts.filter(p => p.value > p.limit);
    }
    if (filterMode === "top10_exceed") {
      return pts.filter(p => p.value > p.limit)
                .sort((a, b) => b.exceededAmount - a.exceededAmount)
                .slice(0, 10);
    }
    if (filterMode === "top10") {
      return pts.sort((a, b) => b.value - a.value).slice(0, 10);
    }
    return pts; // Default "all" configuration
  }, [rows, keys, filterMode]);

  const vals = filteredPoints.map((p) => p.value);
  const vMin = vals.length ? Math.min(...vals) : 0;
  const vMax = vals.length ? Math.max(...vals) : 1;
  const range = vMax - vMin || 1;

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapElRef.current || mapRef.current) return;
      const map = L.map(mapElRef.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: true });
      
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setReady(true);
    }).catch((e) => setLoadErr(e.message));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;
    const layer = layerRef.current;
    layer.clearLayers();
    if (!filteredPoints.length) return;

    const latlngs = [];
    filteredPoints.forEach((p) => {
      const t = (p.value - vMin) / range;
      const color = scaleMode === "color" ? rampColor(t) : C.accent;
      const radius = scaleMode === "size" ? (4 + t * 14) : baseRadius;

      latlngs.push([p.lat, p.lng]);
      const marker = L.circleMarker([p.lat, p.lng], {
        radius, color: "#ffffff", weight: 1.0, fillColor: color, fillOpacity: 0.88,
      });

      const labelLine = p.label ? `<div style="font-size:11.5px;font-weight:600;color:#fff;margin-bottom:4px">${escapeHtml(p.label)}</div>` : "";
      marker.bindPopup(
        `${labelLine}` +
        `<div style="display:flex;justify-content:space-between;gap:12px;"><span style="font-size:10px;color:rgba(255,255,255,0.5)">Cash balance</span><span style="font-size:10.5px;font-weight:600;color:#fff;font-family:ui-monospace,monospace">${fmtFull(p.value)}</span></div>`,
        { className: "mp-pop", closeButton: false }
      );

      marker.on("mouseover", function () { this.openPopup(); this.setStyle({ weight: 2, fillOpacity: 1 }); });
      marker.on("mouseout", function () { this.closePopup(); this.setStyle({ weight: 1.0, fillOpacity: 0.88 }); });
      marker.addTo(layer);
    });

    if (latlngs.length === 1) {
      mapRef.current.setView(latlngs[0], 12);
    } else {
      mapRef.current.fitBounds(L.latLngBounds(latlngs), { padding: [15, 15] }); 
    }
    setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 60);
  }, [ready, filteredPoints, vMin, range, scaleMode, baseRadius]);

  useEffect(() => {
    if (!ready || !mapElRef.current) return;
    const ro = new ResizeObserver(() => mapRef.current && mapRef.current.invalidateSize());
    ro.observe(mapElRef.current);
    return () => ro.disconnect();
  }, [ready]);

  if (loadErr) return <ErrView msg={loadErr} />;

  return (
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", background:C.bg,
                  borderRadius:12, border:`1px solid ${C.line}`, boxShadow:"0 2px 12px rgba(0,0,0,0.03)",
                  overflow:"hidden", position:"relative" }}>

      <div style={{ flex:1, minHeight:0, position:"relative" }}>
        <div ref={mapElRef} style={{ position:"absolute", inset:0 }} />
        {!filteredPoints.length && ready && <NoPoints />}
        {!ready && !loadErr && <LoadingMap />}

        {/* COMPACT FLOATING SETTINGS CONTROLLER */}
        {ready && (
          <div style={{ position:"absolute", top:10, right:10, zIndex:500, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              style={{ border: "none", width: 30, height: 30, borderRadius: 8, background: "rgba(15, 23, 42, 0.9)",
                       color: "#ffffff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", 
                       justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transition: "transform 0.15s ease",
                       transform: showSettings ? "rotate(45deg)" : "rotate(0deg)" }}
            >
              ⚙️
            </button>

            {showSettings && (
              <div style={{ width:190, background:"rgba(15, 23, 42, 0.95)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
                            padding:10, borderRadius:10, border:"1px solid rgba(255,255,255,0.08)",
                            boxShadow:"0 8px 20px rgba(0,0,0,0.25)", display:"flex", flexDirection:"column", gap:10 }}>
                
                {/* Metrics Dropdown Filter */}
                <div>
                  <div style={{ fontSize:9, fontWeight:600, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.4px" }}>Filter Boundaries</div>
                  <select 
                    value={filterMode} 
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="mp-select"
                    style={{ marginTop:4 }}
                  >
                    <option value="all">All Records</option>
                    <option value="exceed">Exceed Limit</option>
                    <option value="top10_exceed">Top 10 Exceeded Limit</option>
                    <option value="top10">Top 10 Overall</option>
                  </select>
                </div>

                {/* Scale configuration selection */}
                <div>
                  <div style={{ fontSize:9, fontWeight:600, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.4px" }}>Scale Display By</div>
                  <div style={{ background:"rgba(255,255,255,0.06)", padding:2, borderRadius:6, display:"flex", marginTop:4 }}>
                    <button 
                      onClick={() => setScaleMode("size")}
                      style={{ border:"none", flex:1, padding:"4px 0", borderRadius:4, fontSize:10, fontWeight:600, cursor:"pointer",
                               background: scaleMode === "size" ? "#ffffff" : "transparent",
                               color: scaleMode === "size" ? C.ink : "rgba(255,255,255,0.6)" }}
                    >
                      Size
                    </button>
                    <button 
                      onClick={() => setScaleMode("color")}
                      style={{ border:"none", flex:1, padding:"4px 0", borderRadius:4, fontSize:10, fontWeight:600, cursor:"pointer",
                               background: scaleMode === "color" ? "#ffffff" : "transparent",
                               color: scaleMode === "color" ? C.ink : "rgba(255,255,255,0.6)" }}
                    >
                      Color
                    </button>
                  </div>
                </div>

                {scaleMode === "color" && (
                  <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.5)" }}>Shape Radius</span>
                      <span style={{ fontSize:9, fontFamily:"monospace", color:"#fff" }}>{baseRadius}px</span>
                    </div>
                    <input 
                      type="range" min="3" max="18" value={baseRadius} 
                      onChange={(e) => setBaseRadius(parseInt(e.target.value, 10))}
                      className="mp-slider"
                      style={{ width:"100%", WebkitAppearance:"none", background:"transparent", outline:"none" }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ULTRA-COMPACT DASHBOARD LEGEND BAR */}
        {filteredPoints.length > 0 && (
          <div style={{ position:"absolute", bottom:10, left:10, zIndex:500, background:"#ffffff",
                        borderRadius:6, border:`1px solid ${C.line}`, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", padding:"6px 8px", width:110 }}>
            
            {scaleMode === "color" ? (
              <div>
                <div style={{ width:"100%", height:5, borderRadius:2, background:`linear-gradient(90deg, ${rampColor(0)}, ${rampColor(0.5)}, ${rampColor(1)})` }} />
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:2, fontSize:8, color:C.mut, fontFamily:"ui-monospace,monospace" }}>
                  <span>{fmtN(vMin)}</span>
                  <span>{fmtN(vMax)}</span>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", justifyBounding:"space-between", gap:4 }}>
                <span style={{ fontSize:8, color:C.mut, fontFamily:"ui-monospace,monospace" }}>{fmtN(vMin)}</span>
                <div style={{ flex:1, display:"flex", alignItems:"center", gap:3 }}>
                  <div style={{ width:3, height:3, borderRadius:"50%", background:C.accent }} />
                  <div style={{ flex:1, height:1, background:C.faint }} />
                  <div style={{ width:7, height:7, borderRadius:"50%", background:C.accent }} />
                </div>
                <span style={{ fontSize:8, color:C.mut, fontFamily:"ui-monospace,monospace" }}>{fmtN(vMax)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ── Asset Component States ── */
function NoPoints() {
  return (
    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"#f8fafc", zIndex:400, padding:10 }}>
      <span style={{ fontSize:10, color:C.mut, textAlign:"center" }}>No active matching spatial points found.</span>
    </div>
  );
}
function LoadingMap() {
  return (
    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"#f8fafc", zIndex:400 }}>
      <span style={{ fontSize:10, color:C.mut }}>Loading Engine...</span>
    </div>
  );
}
function Skeleton() {
  return (
    <div style={{ width:"100%", height:"100%", background:C.bg, padding:2 }}>
      <div style={{ flex:1, height:"100%", borderRadius:8, background:"linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize:"200% 100%", animation:"mpShim 1.4s infinite" }} />
    </div>
  );
}
function ErrView({ msg }) {
  return (
    <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:10 }}>
      <div style={{ background:"#fef2f2", padding:"6px 12px", borderRadius:6, fontSize:10, color:"#b91c1c", textAlign:"center" }}>{msg}</div>
    </div>
  );
}
