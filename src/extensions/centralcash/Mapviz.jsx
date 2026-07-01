import { useEffect, useRef, useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════
   MAP — Single-file React Viz Extension
   Leaflet base map (loaded from CDN at runtime) · circles sized &
   colored by value · auto-fits to all points · hover popups ·
   balance-themed color spectrum · hidden flyout settings controls.

   Fields (drop ALL on Detail, matched by calculated-field name):
     map_lat      (numeric) — latitude   [required]
     map_lng      (numeric) — longitude  [required]
     map_value    (numeric) — color + size [required]
     map_label    (string)  — hover name  [optional]
═══════════════════════════════════════════════════════════ */

if (typeof window !== "undefined" && !document.getElementById("mp-kf")) {
  const s = document.createElement("style");
  s.id = "mp-kf";
  s.innerHTML =
    "@keyframes mpShim{0%{background-position:200% 0}100%{background-position:-200% 0}}" +
    ".mp-pop .leaflet-popup-content-wrapper{background:rgba(15,23,42,0.96);color:#fff;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08)}" +
    ".mp-pop .leaflet-popup-tip{background:rgba(15,23,42,0.96)}" +
    ".mp-pop .leaflet-popup-content{margin:10px 14px;font-family:system-ui,-apple-system,sans-serif}" +
    ".leaflet-container{background:#f8fafc;font-family:system-ui,sans-serif}" +
    ".mp-slider::-webkit-slider-runnable-track{background:rgba(255,255,255,0.15);height:4px;border-radius:2px}" +
    ".mp-slider::-webkit-slider-thumb{-webkit-appearance:none;background:#ffffff;height:12px;width:12px;border-radius:50%;margin-top:-4px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.3)}";
  document.head.appendChild(s);
}

const C = {
  ink: "#0f172a", sub: "#475569", mut: "#64748b", faint: "#e2e8f0",
  bg: "#ffffff", line: "rgba(15,23,42,0.06)", track: "#f1f5f9",
  accent: "#475569", accentLt: "#94a3b8",
};

/* Balanced Diverging Ramp: Cool Slate-Blue (Low) → Neutral Cream (Mid) → Deep Coral (High) */
const RAMP = [
  { t: 0.0, c: [71, 85, 105] },     // Slate Blue (Below balance)
  { t: 0.25, c: [148, 163, 184] }, // Muted Blue-Gray
  { t: 0.5, c: [241, 245, 249] },  // Neutral Platinum (Balanced point)
  { t: 0.75, c: [248, 113, 113] }, // Soft Coral-Red
  { t: 1.0, c: [185, 28, 28] },    // Deep Coral (Above balance)
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
    <div style={{ width:"100%", height:"100%", background:"transparent", padding:4,
                  fontFamily:"system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
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
  
  // Custom Modern Interface States
  const [showSettings, setShowSettings] = useState(false);
  const [scaleMode, setScaleMode] = useState("size"); 
  const [baseRadius, setBaseRadius] = useState(8);    

  const keys = useMemo(() => ({
    lat: keyFor(rows, "map_lat"),
    lng: keyFor(rows, "map_lng"),
    val: keyFor(rows, "map_value"),
    label: keyFor(rows, "map_label"),
  }), [rows]);

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

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapElRef.current || mapRef.current) return;
      const map = L.map(mapElRef.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: true });
      
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

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
    if (!points.length) return;

    const latlngs = [];
    points.forEach((p) => {
      const t = (p.value - vMin) / range;
      
      const color = scaleMode === "color" ? rampColor(t) : C.accent;
      const radius = scaleMode === "size" ? (5 + t * 15) : baseRadius;

      latlngs.push([p.lat, p.lng]);
      const marker = L.circleMarker([p.lat, p.lng], {
        radius, color: "#ffffff", weight: 1.2, fillColor: color, fillOpacity: 0.88,
      });

      const labelLine = p.label ? `<div style="font-size:12px;font-weight:600;color:#fff;margin-bottom:6px;letter-spacing:-0.1px">${escapeHtml(p.label)}</div>` : "";
      marker.bindPopup(
        `${labelLine}` +
        `<div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:4px"><span style="font-size:10px;color:rgba(255,255,255,0.5)">Metric Value</span><span style="font-size:11px;font-weight:600;color:#fff;font-family:ui-monospace,monospace">${fmtFull(p.value)}</span></div>` +
        `<div style="display:flex;justify-content:space-between;gap:16px"><span style="font-size:10px;color:rgba(255,255,255,0.5)">Coordinates</span><span style="font-size:10px;color:rgba(255,255,255,0.7)">${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}</span></div>`,
        { className: "mp-pop", closeButton: false }
      );

      marker.on("mouseover", function () { this.openPopup(); this.setStyle({ weight: 2, fillOpacity: 1 }); });
      marker.on("mouseout", function () { this.closePopup(); this.setStyle({ weight: 1.2, fillOpacity: 0.88 }); });
      marker.addTo(layer);
    });

    /* AUTO-FIT: Strictly lock bounds viewport to content-filled regions only */
    if (latlngs.length === 1) {
      mapRef.current.setView(latlngs[0], 12);
    } else {
      const bounds = L.latLngBounds(latlngs);
      mapRef.current.fitBounds(bounds, { padding: [20, 20] }); // Form-fitted tight crop
    }
    setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 60);
  }, [ready, points, vMin, range, scaleMode, baseRadius]);

  useEffect(() => {
    if (!ready || !mapElRef.current) return;
    const ro = new ResizeObserver(() => mapRef.current && mapRef.current.invalidateSize());
    ro.observe(mapElRef.current);
    return () => ro.disconnect();
  }, [ready]);

  if (loadErr) return <ErrView msg={loadErr} />;

  return (
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", background:C.bg,
                  borderRadius:16, border:`1px solid ${C.line}`, boxShadow:"0 4px 30px rgba(0,0,0,0.03)",
                  overflow:"hidden", position:"relative" }}>

      <div style={{ flex:1, minHeight:0, position:"relative" }}>
        <div ref={mapElRef} style={{ position:"absolute", inset:0 }} />
        {!points.length && ready && <NoPoints />}
        {!ready && !loadErr && <LoadingMap />}

        {/* GEAR SETTINGS FLYOUT ACTION CONTAINER */}
        {ready && points.length > 0 && (
          <div style={{ position:"absolute", top:16, right:16, zIndex:500, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
            
            {/* Minimalist Gear Button */}
            <button 
              onClick={() => setShowSettings(!showSettings)}
              style={{ border: "none", width: 36, height: 36, borderRadius: 10, background: "rgba(15, 23, 42, 0.9)",
                       color: "#ffffff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", 
                       justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "transform 0.2s ease",
                       transform: showSettings ? "rotate(45deg)" : "rotate(0deg)" }}
            >
              ⚙️
            </button>

            {/* Collapsible Action Drawer Panel */}
            {showSettings && (
              <div style={{ width:220, background:"rgba(15, 23, 42, 0.95)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
                            padding:14, borderRadius:12, border:"1px solid rgba(255,255,255,0.08)",
                            boxShadow:"0 10px 25px -5px rgba(0,0,0,0.3)", display:"flex", flexDirection:"column", gap:12 }}>
                
                <div>
                  <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.6px" }}>Scale Display By</div>
                  
                  <div style={{ background:"rgba(255,255,255,0.06)", padding:3, borderRadius:8, display:"flex", marginTop:6 }}>
                    <button 
                      onClick={() => setScaleMode("size")}
                      style={{ border:"none", flex:1, padding:"5px 0", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", transition:"all 0.15s ease",
                               background: scaleMode === "size" ? "#ffffff" : "transparent",
                               color: scaleMode === "size" ? C.ink : "rgba(255,255,255,0.6)" }}
                    >
                      Size
                    </button>
                    <button 
                      onClick={() => setScaleMode("color")}
                      style={{ border:"none", flex:1, padding:"5px 0", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", transition:"all 0.15s ease",
                               background: scaleMode === "color" ? "#ffffff" : "transparent",
                               color: scaleMode === "color" ? C.ink : "rgba(255,255,255,0.6)" }}
                    >
                      Color
                    </button>
                  </div>
                </div>

                {scaleMode === "color" && (
                  <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                      <span style={{ fontSize:10, fontWeight:500, color:"rgba(255,255,255,0.5)" }}>Shape Radius</span>
                      <span style={{ fontSize:10, fontFamily:"monospace", color:"#fff" }}>{baseRadius}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="4" 
                      max="24" 
                      value={baseRadius} 
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

        {/* DIVERGING BALANCE MAP LEGEND CONTENT */}
        {points.length > 0 && (
          <div style={{ position:"absolute", bottom:16, left:16, zIndex:500, background:"#ffffff",
                        borderRadius:10, border:`1px solid ${C.line}`, boxShadow:"0 4px 20px rgba(15,28,46,0.08)", padding:"10px 12px" }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.4px", textTransform:"uppercase", color:C.mut, marginBottom:6 }}>
              {scaleMode === "size" ? "Metric: Area Size" : "Metric: Balanced Divergence"}
            </div>
            
            {scaleMode === "color" ? (
              <div>
                <div style={{ width:140, height:6, borderRadius:3, background:`linear-gradient(90deg, ${rampColor(0)}, ${rampColor(0.25)}, ${rampColor(0.5)}, ${rampColor(0.75)}, ${rampColor(1)})` }} />
                <div style={{ display:"flex", justifyContent:"space-between", width:140, position:"relative", marginTop:2 }}>
                  <span style={{ fontSize:7, color:C.mut, fontWeight:500 }}>Low</span>
                  <span style={{ fontSize:7, color:C.mut, fontWeight:700, position:"absolute", left:"50%", transform:"translateX(-50%)" }}>Balanced</span>
                  <span style={{ fontSize:7, color:C.mut, fontWeight:500 }}>High</span>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:6, height:6, width:140, padding:"0 2px" }}>
                <div style={{ width:4, height:4, borderRadius:"50%", background:C.accent }} />
                <div style={{ flex:1, height:1, background:C.faint }} />
                <div style={{ width:10, height:10, borderRadius:"50%", background:C.accent }} />
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
              <span style={{ fontSize:9, fontWeight:600, color:C.sub, fontFamily:"ui-monospace,monospace" }}>{fmtN(vMin)}</span>
              <span style={{ fontSize:9, fontWeight:600, color:C.sub, fontFamily:"ui-monospace,monospace" }}>{fmtN(vMax)}</span>
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
    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, background:"#f8fafc", zIndex:400 }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.mut} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
      <span style={{ fontSize:12, color:C.ink, fontWeight:500, textAlign:"center" }}> Missing Dimensions </span>
    </div>
  );
}
function LoadingMap() {
  return (
    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"#f8fafc", zIndex:400 }}>
      <span style={{ fontSize:12, color:C.mut, fontWeight:500, letterSpacing:"0.2px" }}>Loading Map Engine...</span>
    </div>
  );
}
function Skeleton() {
  return (
    <div style={{ width:"100%", height:"100%", background:C.bg, borderRadius:16, border:`1px solid ${C.line}`, padding:4, display:"flex", flexDirection:"column" }}>
      <div style={{ flex:1, borderRadius:12, background:"linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize:"200% 100%", animation:"mpShim 1.4s infinite" }} />
    </div>
  );
}
function ErrView({ msg }) {
  return (
    <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fef2f2", border:"1px solid #fee2e2", padding:"12px 20px", borderRadius:10, fontSize:12, color:"#b91c1c", fontWeight:500 }}>
        {msg}
      </div>
    </div>
  );
}
