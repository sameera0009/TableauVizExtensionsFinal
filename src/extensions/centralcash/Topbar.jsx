import { useEffect, useRef, useState, useCallback } from "react";

if (typeof window !== "undefined" && !document.getElementById("cpn-spin")) {
  const s = document.createElement("style");
  s.id = "cpn-spin";
  s.innerHTML = "@keyframes cpnSpin{to{transform:rotate(360deg)}} @keyframes cpnShim{0%{background-position:200% 0}100%{background-position:-200% 0}}";
  document.head.appendChild(s);
}

const RED      = "#c8102e";
const RED_GLOW = "rgba(200,16,46,.15)";
const GOLD     = "#e6a817";
const TEXT     = "#0f1c2e";
const TEXT_MID = "#4a5568";
const TEXT_SFT = "#8a96a8";
const BDR_MID  = "rgba(15,28,46,.12)";
const MONTHS   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WDAYS    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function useClock() {
  const [t, setT] = useState({ time: "--:--:--", date: "--- -- ----" });
  useEffect(() => {
    const tick = () => {
      const n = new Date(), p = (v) => String(v).padStart(2, "0");
      setT({
        time: p(n.getHours()) + ":" + p(n.getMinutes()) + ":" + p(n.getSeconds()),
        date: WDAYS[n.getDay()] + " " + p(n.getDate()) + " " + MONTHS[n.getMonth()] + " " + n.getFullYear(),
      });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  return t;
}

function findField(keys, ...ns) {
  for (const n of ns) {
    const e = keys.find((k) => k.toLowerCase() === n.toLowerCase()); if (e) return e;
    const s = keys.find((k) => k.toLowerCase().includes(n.toLowerCase())); if (s) return s;
  }
  return null;
}

async function fetchData(ws, enc) {
  try {
    const rdr = await ws.getSummaryDataReaderAsync(undefined, { ignoreSelection: true });
    const rows = [];
    for (let i = 0; i < rdr.pageCount; i++) {
      const pg = await rdr.getPageAsync(i);
      const keys = pg.columns.map((c) => c.fieldName);
      const aK = findField(keys, enc.agm?.name || "agm", "area general manager");
      const rK = findField(keys, enc.region?.name || "region", "regional");
      const bK = findField(keys, enc.branch?.name || "branch", "branchname");
      const uK = findField(keys, enc["user-name"]?.name || "user name", "username");
      const rlK = findField(keys, enc["user-role"]?.name || "user role", "role", "department");
      const iK = findField(keys, enc["user-image"]?.name || "user image", "image", "photo");
      const dhK = findField(keys, enc["dashboard-header"]?.name || "dashboard header", "header");
      const p1hK = findField(keys, enc["page1header"]?.name || "page1header", "page 1 header");
      const p1lK = findField(keys, enc["page1link"]?.name || "page1link", "page 1 link");
      const p2hK = findField(keys, enc["page2header"]?.name || "page2header", "page 2 header");
      const p2lK = findField(keys, enc["page2link"]?.name || "page2link", "page 2 link");
      const p3hK = findField(keys, enc["page3header"]?.name || "page3header", "page 3 header");
      const p3lK = findField(keys, enc["page3link"]?.name || "page3link", "page 3 link");
      const dUK = findField(keys, enc["default-user"]?.name || "default user", "company", "org");
      
      pg.data.forEach((row) => {
        const g = (k) => !k ? "" : (row[keys.indexOf(k)]?.formattedValue || String(row[keys.indexOf(k)]?.nativeValue||"")).trim();
        rows.push({
          agm: g(aK), region: g(rK), branch: g(bK),
          userName: g(uK), userRole: g(rlK), userImage: g(iK),
          dashboardHeader: g(dhK),
          page1header: g(p1hK), page1link: g(p1lK),
          page2header: g(p2hK), page2link: g(p2lK),
          page3header: g(p3hK), page3link: g(p3lK),
          defaultUser: g(dUK)
        });
      });
    }
    await rdr.releaseAsync(); 
    return rows;
  } catch { return []; }
}

async function setParams(ws, level, selected) {
  if (!ws) return;
  try {
    const params = await ws.getParametersAsync();
    const pL = params.find((p) => p.name === "level");
    const pS = params.find((p) => p.name === "selected");
    if (pL) await pL.changeValueAsync(level);
    if (pS) await pS.changeValueAsync(selected);
  } catch (e) { console.warn("setParams:", e); }
}

function buildMaps(rows) {
  const agms=[], rMap={}, bMap={};
  rows.forEach(({agm:a, region:r, branch:b})=>{
    if(a && !agms.includes(a)) agms.push(a);
    if(a && r){ if(!rMap[a]) rMap[a]=[]; if(!rMap[a].includes(r)) rMap[a].push(r); }
    if(a && r && b){ const k=a+"||"+r; if(!bMap[k]) bMap[k]=[]; if(!bMap[k].includes(b)) bMap[k].push(b); }
  });
  agms.sort(); 
  Object.values(rMap).forEach(a=>a.sort()); 
  Object.values(bMap).forEach(a=>a.sort());
  return {agms, rMap, bMap};
}

const initials = (n) => { 
  if(!n) return "?"; 
  const p = n.trim().split(/\s+/).filter(Boolean); 
  return p.length===1 ? p[0].slice(0,2).toUpperCase() : (p[0][0]+p[p.length-1][0]).toUpperCase(); 
};
const trunc = (s,n) => s && s.length > n ? s.slice(0,n).trimEnd()+"…" : (s||"");

export default function CashPositionAnalyzer() {
  const wsRef = useRef(null);
  const [maps, setMaps] = useState({ agms:[], rMap:{}, bMap:{} });
  const [drill, setDrill] = useState({ agm:"", region:"", branch:"", step:0 });
  const [fpOpen, setFpOpen] = useState(false);
  const [page, setPage] = useState("home");
  const [navConfig, setNavConfig] = useState({
    dashboardHeader: "Cash Position Analyzer",
    pages: [
      { id: "home", label: "Home", link: "#home" },
      { id: "limits", label: "Limits", link: "#limits" },
      { id: "position", label: "Position", link: "#position" }
    ],
    defaultUser: "ComBank"
  });
  const [user, setUser] = useState({ name:"", role:"", imageUrl:null, loaded:false });
  const [logoErr, setLogoErr] = useState(false);
  const clk = useClock();

  useEffect(() => {
    async function init() {
      try {
        await window.tableau.extensions.initializeAsync();
        const ws = window.tableau.extensions.worksheetContent.worksheet;
        wsRef.current = ws;
        
        const load = async () => {
          const enc = await getEncodings(ws);
          const rows = await fetchData(ws, enc);
          
          setMaps(buildMaps(rows));
          
          // Build navigation config from data
          if (rows.length) {
            const first = rows[0];
            const pages = [];
            for (let i = 1; i <= 3; i++) {
              const header = first[`page${i}header`];
              const link = first[`page${i}link`];
              if (header || link) {
                pages.push({
                  id: `page${i}`,
                  label: header || link || `Page ${i}`,
                  link: link || header || `#page${i}`
                });
              }
            }
            setNavConfig({
              dashboardHeader: first.dashboardHeader || "Cash Position Analyzer",
              pages: pages.length > 0 ? pages : [
                { id: "home", label: "Home", link: "#home" },
                { id: "limits", label: "Limits", link: "#limits" },
                { id: "position", label: "Position", link: "#position" }
              ],
              defaultUser: first.defaultUser || "ComBank"
            });
            setUser({
              name: first.userName || "Treasury User",
              role: first.userRole || "Analyst",
              imageUrl: first.userImage || null,
              loaded: true
            });
          }
        };
        
        ws.addEventListener(window.tableau.TableauEventType.SummaryDataChanged, load);
        await load();
      } catch {
        // Demo data fallback
        const demo = [
          { agm: "AGM North", region: "Northern", branch: "Jaffna" },
          { agm: "AGM North", region: "Northern", branch: "Vavuniya" },
          { agm: "AGM Central", region: "Central", branch: "Kandy" },
          { agm: "AGM Central", region: "Uva", branch: "Badulla" },
          { agm: "AGM South", region: "Southern", branch: "Galle" },
          { agm: "AGM West", region: "Western", branch: "Colombo 01" },
          { agm: "AGM West", region: "Sabaragamuwa", branch: "Ratnapura" },
        ];
        setMaps(buildMaps(demo));
        setUser({ name: "Treasury User", role: "Analyst", imageUrl: null, loaded: true });
      }
    }
    init();
  }, []);

  async function getEncodings(ws) {
    try {
      const spec = await ws.getVisualSpecificationAsync();
      const map = {};
      if (spec.activeMarksSpecificationIndex >= 0) {
        spec.marksSpecifications[spec.activeMarksSpecificationIndex]
          .encodings.forEach((e) => { map[e.id] = e.field; });
      }
      return map;
    } catch { return {}; }
  }

  useEffect(() => {
    if (!fpOpen) return;
    const h = (e) => {
      if (document.getElementById("cpn-fp")?.contains(e.target)) return;
      if (document.getElementById("cpn-fb")?.contains(e.target)) return;
      setFpOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [fpOpen]);

  const onAgm = useCallback((v) => { 
    setDrill({agm:v, region:"", branch:"", step:v?1:0}); 
    setParams(wsRef.current, v?"AGM":"ALL", v||"ALL"); 
  }, []);
  const toRegion = useCallback(() => setDrill(p => ({...p, step:2})), []);
  const onRegion = useCallback((v) => { 
    setDrill(p => { setParams(wsRef.current, v?"REGION":"AGM", v||p.agm); return {...p, region:v, branch:""}; }); 
  }, []);
  const toBranch = useCallback(() => setDrill(p => ({...p, step:3})), []);
  const onBranch = useCallback((v) => { 
    setDrill(p => { setParams(wsRef.current, v?"BRANCH":"REGION", v||p.region); return {...p, branch:v}; }); 
  }, []);
  const reset = useCallback(() => { 
    setDrill({agm:"", region:"", branch:"", step:0}); 
    setParams(wsRef.current, "ALL", "ALL"); 
  }, []);

  const {agms, rMap, bMap} = maps;
  const regions = drill.agm ? (rMap[drill.agm] || []) : [];
  const branches = drill.agm && drill.region ? (bMap[drill.agm+"||"+drill.region] || []) : [];
  const hasAgm = !!drill.agm, hasReg = !!drill.region, hasBr = !!drill.branch;
  const chipTxt = hasBr ? drill.branch : hasReg ? drill.region : hasAgm ? drill.agm : "";

  const base = { fontFamily: "system-ui,-apple-system,'Segoe UI',sans-serif", WebkitFontSmoothing: "antialiased", color: TEXT, boxSizing: "border-box" };

  return (
    <div style={{ width:"100%", height:"100%", backgroundColor:"transparent" }}>
      <nav style={{
        ...base,
        position: "relative",
        width: "100%",
        height: 58,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid rgba(15,28,46,.09)",
        boxShadow: "0 2px 8px rgba(15,28,46,.06)",
        display: "flex",
        alignItems: "center",
        padding: "0 18px 0 14px",
        boxSizing: "border-box",
        overflow: "visible"
      }}>
        {/* Top accent stripe */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 2.5,
          background: `linear-gradient(90deg, ${RED} 0%, #e8364f 45%, ${GOLD} 100%)`,
          pointerEvents: "none"
        }} />

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", flexShrink:0, paddingRight:16, borderRight:"1px solid "+BDR_MID, height:34 }}>
          {logoErr ? (
            <span style={{fontSize:15, fontWeight:700, color:RED}}>{navConfig.defaultUser}</span>
          ) : (
            <img 
              height="26" 
              src="https://www.combank.lk/assets/images/logo/newlogo.svg" 
              alt={navConfig.defaultUser} 
              style={{ mixBlendMode:"multiply", filter:"contrast(1.08) saturate(1.1)" }} 
              onError={() => setLogoErr(true)} 
            />
          )}
        </div>

        {/* Title */}
        <div style={{ display:"flex", flexDirection:"column", padding:"0 14px", flexShrink:0 }}>
          <span style={{ fontSize:13, fontWeight:600, color:TEXT, letterSpacing:"-.15px", whiteSpace:"nowrap" }}>
            {navConfig.dashboardHeader}
          </span>
        </div>

        <div style={{ width:1, height:26, background:BDR_MID, flexShrink:0, margin:"0 4px" }} />

        {/* Nav links */}
        <div style={{ display:"flex", alignItems:"center", gap:1, padding:"0 12px", height:"100%", overflowX:"auto" }}>
          {navConfig.pages.map(({id, label, link}) => (
            <button 
              key={id} 
              style={{
                ...base,
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 5,
                height: 34,
                padding: "0 12px",
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: page === id ? 600 : 500,
                color: page === id ? RED : TEXT_MID,
                cursor: "pointer",
                border: "none",
                backgroundColor: page === id ? RED_GLOW : "transparent",
                userSelect: "none",
                whiteSpace: "nowrap"
              }} 
              onClick={() => {
                setPage(id);
                if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
                  window.open(link, '_blank');
                }
              }}
            >
              {label}
              {page === id && (
                <div style={{
                  position: "absolute",
                  bottom: -1,
                  left: 12,
                  right: 12,
                  height: 2,
                  background: RED,
                  borderRadius: "2px 2px 0 0"
                }} />
              )}
            </button>
          ))}
        </div>

        <div style={{ width:1, height:26, background:BDR_MID, flexShrink:0, margin:"0 4px" }} />

        {/* Filter button */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 8px" }}>
          <button 
            id="cpn-fb" 
            style={{
              ...base,
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 30,
              padding: "0 12px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 500,
              color: fpOpen || hasAgm ? RED : TEXT_MID,
              cursor: "pointer",
              border: "1px solid " + (fpOpen ? "rgba(200,16,46,.3)" : BDR_MID),
              backgroundColor: fpOpen ? RED_GLOW : "rgba(255,255,255,.5)",
              userSelect: "none",
              flexShrink: 0,
              outline: "none"
            }} 
            onClick={() => setFpOpen(v => !v)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            {hasAgm ? "Filtered" : "Filters"}
            {hasAgm && <span style={{width:6, height:6, borderRadius:"50%", backgroundColor:RED, flexShrink:0}} />}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transition:"transform .25s", transform: fpOpen ? "rotate(180deg)" : "none", flexShrink:0}}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {chipTxt && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              height: 24,
              padding: "0 8px 0 10px",
              borderRadius: 20,
              backgroundColor: RED_GLOW,
              border: "1px solid rgba(200,16,46,.2)",
              fontSize: 11,
              fontWeight: 600,
              color: RED,
              whiteSpace: "nowrap",
              maxWidth: 180,
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              <span style={{overflow:"hidden", textOverflow:"ellipsis"}}>{chipTxt}</span>
              <button onClick={reset} style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: "rgba(200,16,46,.15)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: RED,
                fontWeight: 700,
                flexShrink: 0
              }}>✕</button>
            </div>
          )}
        </div>

        <div style={{flex:1}} />

        {/* Clock and user */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end" }}>
            <span style={{ fontSize:12.5, fontWeight:600, color:TEXT, fontVariantNumeric:"tabular-nums", letterSpacing:"-.2px", lineHeight:1 }}>{clk.time}</span>
            <span style={{ fontSize:9.5, color:TEXT_SFT, letterSpacing:".2px", marginTop:1 }}>{clk.date}</span>
          </div>
          <div style={{ width:1, height:26, background:BDR_MID, flexShrink:0, margin:"0 4px" }} />
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"3px 10px 3px 3px", borderRadius:30, backgroundColor:"#f4f6f9", border:"1px solid rgba(15,28,46,.09)", cursor:"default", maxWidth:200 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                backgroundColor: RED,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                overflow: "hidden",
                border: "1.5px solid rgba(200,16,46,.2)"
              }}>
                {user.loaded ? (
                  user.imageUrl ? (
                    <img src={user.imageUrl} alt={initials(user.name)} style={{width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%", display:"block"}} />
                  ) : initials(user.name)
                ) : "?"}
              </div>
              <span style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                border: "1.5px solid rgba(255,255,255,.8)"
              }} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
              <span style={{ fontSize:11.5, fontWeight:600, color:TEXT, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:110, lineHeight:1.2 }}>{trunc(user.name || "Treasury User", 18)}</span>
              <span style={{ fontSize:9.5, color:TEXT_SFT, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:110 }}>{trunc(user.role || "", 22)}</span>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        <div id="cpn-fp" style={{
          ...base,
          position: "absolute",
          top: 58,
          left: 0,
          right: 0,
          backgroundColor: "#ffffff",
          border: "1px solid rgba(15,28,46,.09)",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          boxShadow: "0 8px 24px rgba(15,28,46,.10)",
          overflow: "hidden",
          maxHeight: fpOpen ? 58 : 0,
          opacity: fpOpen ? 1 : 0,
          pointerEvents: fpOpen ? "all" : "none",
          transform: fpOpen ? "translateY(0)" : "translateY(-8px)",
          transition: "max-height .38s,opacity .28s,transform .3s",
          zIndex: 99
        }}>
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: `linear-gradient(180deg, ${RED}, ${GOLD})`,
            pointerEvents: "none"
          }} />
          <div style={{
            padding: "0 16px 0 24px",
            height: 58,
            display: "flex",
            alignItems: "center",
            gap: 0
          }}>
            <span style={{ fontSize:10.5, fontWeight:600, color:TEXT_SFT, textTransform:"uppercase", letterSpacing:".5px", whiteSpace:"nowrap", marginRight:14, flexShrink:0 }}>Filter by</span>

            {/* AGM */}
            <div style={{ display:"flex", alignItems:"center", opacity:1, transform:"translateX(0)", pointerEvents:"all", maxWidth:260, overflow:"hidden" }}>
              <select 
                style={{
                  ...base,
                  height: 28,
                  minWidth: 160,
                  maxWidth: 220,
                  padding: "0 30px 0 11px",
                  borderRadius: 8,
                  border: "1px solid " + (hasAgm ? "rgba(200,16,46,.35)" : BDR_MID),
                  backgroundColor: "rgba(255,255,255,.75)",
                  color: hasAgm ? RED : TEXT,
                  fontSize: 12.5,
                  fontWeight: hasAgm ? 600 : 500,
                  cursor: "pointer",
                  outline: "none",
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238a96a8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  appearance: "none",
                  WebkitAppearance: "none"
                }} 
                value={drill.agm} 
                onChange={(e) => onAgm(e.target.value)}
              >
                <option value="">— Select AGM —</option>
                {agms.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, width:28, overflow:"hidden", color:TEXT_SFT }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>

            <button 
              style={{
                ...base,
                display: hasAgm && drill.step === 1 ? "flex" : "none",
                alignItems: "center",
                gap: 8,
                padding: "0 11px",
                borderRadius: 7,
                backgroundColor: "rgba(200,16,46,.06)",
                border: "1px dashed rgba(200,16,46,.25)",
                fontSize: 11,
                fontWeight: 500,
                color: TEXT_MID,
                whiteSpace: "nowrap",
                cursor: "pointer",
                height: 28,
                flexShrink: 0,
                outline: "none"
              }} 
              onClick={toRegion}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Drill to Region
            </button>

            {/* Region */}
            <div style={{ display:"flex", alignItems:"center", opacity:drill.step >= 2 ? 1 : 0, transform:drill.step >= 2 ? "translateX(0)" : "translateX(12px)", pointerEvents:drill.step >= 2 ? "all" : "none", maxWidth:drill.step >= 2 ? 260 : 0, overflow:"hidden", transition:"opacity .3s,transform .3s,max-width .35s" }}>
              <select 
                style={{
                  ...base,
                  height: 28,
                  minWidth: 160,
                  maxWidth: 220,
                  padding: "0 30px 0 11px",
                  borderRadius: 8,
                  border: "1px solid " + (hasReg ? "rgba(200,16,46,.35)" : BDR_MID),
                  backgroundColor: "rgba(255,255,255,.75)",
                  color: hasReg ? RED : TEXT,
                  fontSize: 12.5,
                  fontWeight: hasReg ? 600 : 500,
                  cursor: "pointer",
                  outline: "none",
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238a96a8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  appearance: "none",
                  WebkitAppearance: "none"
                }} 
                value={drill.region} 
                onChange={(e) => onRegion(e.target.value)}
              >
                <option value="">— Select Region —</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, width:drill.step >= 3 ? 28 : 0, overflow:"hidden", opacity:drill.step >= 3 ? 1 : 0, transition:"width .3s,opacity .25s", color:TEXT_SFT }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>

            <button 
              style={{
                ...base,
                display: hasReg && drill.step === 2 ? "flex" : "none",
                alignItems: "center",
                gap: 8,
                padding: "0 11px",
                borderRadius: 7,
                backgroundColor: "rgba(200,16,46,.06)",
                border: "1px dashed rgba(200,16,46,.25)",
                fontSize: 11,
                fontWeight: 500,
                color: TEXT_MID,
                whiteSpace: "nowrap",
                cursor: "pointer",
                height: 28,
                flexShrink: 0,
                outline: "none"
              }} 
              onClick={toBranch}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              Drill to Branch
            </button>

            {/* Branch */}
            <div style={{ display:"flex", alignItems:"center", opacity:drill.step >= 3 ? 1 : 0, transform:drill.step >= 3 ? "translateX(0)" : "translateX(12px)", pointerEvents:drill.step >= 3 ? "all" : "none", maxWidth:drill.step >= 3 ? 260 : 0, overflow:"hidden", transition:"opacity .3s,transform .3s,max-width .35s" }}>
              <select 
                style={{
                  ...base,
                  height: 28,
                  minWidth: 160,
                  maxWidth: 220,
                  padding: "0 30px 0 11px",
                  borderRadius: 8,
                  border: "1px solid " + (hasBr ? "rgba(200,16,46,.35)" : BDR_MID),
                  backgroundColor: "rgba(255,255,255,.75)",
                  color: hasBr ? RED : TEXT,
                  fontSize: 12.5,
                  fontWeight: hasBr ? 600 : 500,
                  cursor: "pointer",
                  outline: "none",
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238a96a8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  appearance: "none",
                  WebkitAppearance: "none"
                }} 
                value={drill.branch} 
                onChange={(e) => onBranch(e.target.value)}
              >
                <option value="">— Select Branch —</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <button 
              style={{
                ...base,
                display: hasAgm ? "flex" : "none",
                alignItems: "center",
                gap: 5,
                height: 28,
                padding: "0 10px",
                borderRadius: 7,
                border: "1px solid " + BDR_MID,
                backgroundColor: "rgba(255,255,255,.5)",
                color: TEXT_SFT,
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                marginLeft: 8,
                flexShrink: 0,
                outline: "none"
              }} 
              onClick={reset}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
              </svg>
              Reset
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
