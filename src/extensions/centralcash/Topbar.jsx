import { useEffect, useRef, useState, useCallback } from "react";

/* ════════════════════════════════
   CASH POSITION NAVBAR — pure inline styles
   Zero class names. Zero CSS injection.
   Follows exact same pattern as working KpiCard.
════════════════════════════════ */

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

/* ── Clock ── */
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

/* ── Tableau helpers ── */
function findField(keys, ...ns) {
  for (const n of ns) {
    const e = keys.find((k) => k.toLowerCase() === n.toLowerCase()); if (e) return e;
    const s = keys.find((k) => k.toLowerCase().includes(n.toLowerCase())); if (s) return s;
  }
  return null;
}
async function fetchHierarchy(ws) {
  try {
    const rdr = await ws.getSummaryDataReaderAsync(undefined, { ignoreSelection: true });
    const rows = [];
    for (let i = 0; i < rdr.pageCount; i++) {
      const pg = await rdr.getPageAsync(i);
      const keys = pg.columns.map((c) => c.fieldName);
      const aK = findField(keys,"agm","area general manager");
      const rK = findField(keys,"region","regional");
      const bK = findField(keys,"branch","branchname","branch name");
      pg.data.forEach((row) => {
        const g = (k) => !k ? "" : (row[keys.indexOf(k)]?.formattedValue || String(row[keys.indexOf(k)]?.nativeValue||"")).trim();
        rows.push({ agm:g(aK), region:g(rK), branch:g(bK) });
      });
    }
    await rdr.releaseAsync(); return rows;
  } catch { return []; }
}
async function fetchUser(ws) {
  try {
    const rdr = await ws.getSummaryDataReaderAsync(undefined, { ignoreSelection:true });
    const pg  = await rdr.getPageAsync(0); await rdr.releaseAsync();
    if (!pg.data.length) return null;
    const keys = pg.columns.map((c) => c.fieldName);
    const g = (...ns) => { const k = findField(keys,...ns); if(!k) return null; const i=keys.indexOf(k); return (pg.data[0][i]?.formattedValue||String(pg.data[0][i]?.nativeValue||"")).trim()||null; };
    return { name:g("user name","username","user","login"), role:g("user role","role","department","designation"), imageUrl:g("user image","image","photo","avatar") };
  } catch { return null; }
}
async function fetchNavConfig(ws) {
  try {
    const rdr = await ws.getSummaryDataReaderAsync(undefined, { ignoreSelection:true });
    const pg  = await rdr.getPageAsync(0); 
    await rdr.releaseAsync();
    if (!pg.data.length) return null;
    const keys = pg.columns.map((c) => c.fieldName);
    const g = (...ns) => { 
      const k = findField(keys,...ns); 
      if(!k) return null; 
      const i=keys.indexOf(k); 
      return (pg.data[0][i]?.formattedValue||String(pg.data[0][i]?.nativeValue||"")).trim()||null; 
    };
    
    // Get all possible page configs (up to 5 pages)
    const pages = [];
    for (let i = 1; i <= 5; i++) {
      const header = g(`page${i}header`, `page${i} header`, `page${i}_header`);
      const link = g(`page${i}link`, `page${i} link`, `page${i}_link`);
      if (header || link) {
        pages.push({
          id: `page${i}`,
          label: header || link || `Page ${i}`,
          link: link || header || `#page${i}`
        });
      }
    }
    
    const dashboardHeader = g("dashboard header", "dashboard_header", "dashboard", "header");
    const defaultUser = g("default user", "default_user", "company", "org", "default");
    
    return {
      dashboardHeader: dashboardHeader || "Cash Position Analyzer",
      pages: pages.length > 0 ? pages : [
        { id: "home", label: "Home", link: "#home" },
        { id: "limits", label: "Limits", link: "#limits" },
        { id: "position", label: "Position", link: "#position" }
      ],
      defaultUser: defaultUser || "ComBank"
    };
  } catch { return null; }
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
  rows.forEach(({agm:a,region:r,branch:b})=>{
    if(a&&!agms.includes(a)) agms.push(a);
    if(a&&r){if(!rMap[a])rMap[a]=[];if(!rMap[a].includes(r))rMap[a].push(r);}
    if(a&&r&&b){const k=a+"||"+r;if(!bMap[k])bMap[k]=[];if(!bMap[k].includes(b))bMap[k].push(b);}
  });
  agms.sort(); Object.values(rMap).forEach(a=>a.sort()); Object.values(bMap).forEach(a=>a.sort());
  return {agms,rMap,bMap};
}
const initials = (n) => { if(!n) return "?"; const p=n.trim().split(/\s+/).filter(Boolean); return p.length===1?p[0].slice(0,2).toUpperCase():(p[0][0]+p[p.length-1][0]).toUpperCase(); };
const trunc    = (s,n) => s&&s.length>n ? s.slice(0,n).trimEnd()+"…" : (s||"");

/* ════════════════════════════════
   EXPORT
════════════════════════════════ */
export default function CashPositionNavbar() {
  const wsRef    = useRef(null);
  const [maps,   setMaps]   = useState({ agms:[], rMap:{}, bMap:{} });
  const [drill,  setDrill]  = useState({ agm:"", region:"", branch:"", step:0 });
  const [fpOpen, setFpOpen] = useState(false);
  const [page,   setPage]   = useState("home");
  const [user,   setUser]   = useState({ name:"", role:"", imageUrl:null, loaded:false });
  const [navConfig, setNavConfig] = useState({ 
    dashboardHeader: "Cash Position Analyzer", 
    pages: [
      { id: "home", label: "Home", link: "#home" },
      { id: "limits", label: "Limits", link: "#limits" },
      { id: "position", label: "Position", link: "#position" }
    ],
    defaultUser: "ComBank"
  });
  const [logoErr,setLogoErr]= useState(false);
  const clk = useClock();

  useEffect(() => {
    async function init() {
      try {
        await window.tableau.extensions.initializeAsync();
        const ws = window.tableau.extensions.worksheetContent.worksheet;
        wsRef.current = ws;
        const load = async () => {
          const [rows, u, nav] = await Promise.all([
            fetchHierarchy(ws), 
            fetchUser(ws),
            fetchNavConfig(ws)
          ]);
          setMaps(buildMaps(rows));
          setUser(u ? {...u,loaded:true} : {name:"Treasury User",role:"Analyst",imageUrl:null,loaded:true});
          if (nav) {
            setNavConfig(nav);
          }
        };
        ws.addEventListener(window.tableau.TableauEventType.SummaryDataChanged, load);
        await load();
      } catch {
        const demo=[
          {agm:"AGM North",  region:"Northern",    branch:"Jaffna"},
          {agm:"AGM North",  region:"Northern",    branch:"Vavuniya"},
          {agm:"AGM Central",region:"Central",     branch:"Kandy"},
          {agm:"AGM Central",region:"Uva",         branch:"Badulla"},
          {agm:"AGM South",  region:"Southern",    branch:"Galle"},
          {agm:"AGM West",   region:"Western",     branch:"Colombo 01"},
          {agm:"AGM West",   region:"Sabaragamuwa",branch:"Ratnapura"},
        ];
        setMaps(buildMaps(demo));
        setUser({name:"Treasury User",role:"Analyst",imageUrl:null,loaded:true});
        // Keep default nav config for demo
      }
    }
    init();
  }, []);

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

  const onAgm    = useCallback((v) => { setDrill({agm:v,region:"",branch:"",step:v?1:0}); setParams(wsRef.current,v?"AGM":"ALL",v||"ALL"); },[]);
  const toRegion = useCallback(()   => setDrill(p=>({...p,step:2})),[]);
  const onRegion = useCallback((v)  => { setDrill(p=>{setParams(wsRef.current,v?"REGION":"AGM",v||p.agm);return{...p,region:v,branch:""}}); },[]);
  const toBranch = useCallback(()   => setDrill(p=>({...p,step:3})),[]);
  const onBranch = useCallback((v)  => { setDrill(p=>{setParams(wsRef.current,v?"BRANCH":"REGION",v||p.region);return{...p,branch:v}}); },[]);
  const reset    = useCallback(()   => { setDrill({agm:"",region:"",branch:"",step:0}); setParams(wsRef.current,"ALL","ALL"); },[]);

  const {agms,rMap,bMap} = maps;
  const regions  = drill.agm ? (rMap[drill.agm]||[]) : [];
  const branches = drill.agm&&drill.region ? (bMap[drill.agm+"||"+drill.region]||[]) : [];
  const hasAgm=!!drill.agm, hasReg=!!drill.region, hasBr=!!drill.branch;
  const chipTxt = hasBr?drill.branch : hasReg?drill.region : hasAgm?drill.agm : "";

  /* ── all inline style objects ── */
  const base = { fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif", WebkitFontSmoothing:"antialiased", color:TEXT, boxSizing:"border-box" };

  const navStyle = { ...base, position:"relative", width:"100%", height:58, backgroundColor:"#ffffff", borderBottom:"1px solid rgba(15,28,46,.09)", boxShadow:"0 2px 8px rgba(15,28,46,.06)", display:"flex", alignItems:"center", padding:"0 18px 0 14px", boxSizing:"border-box", overflow:"visible" };

  /* top red/gold accent stripe — done as a real div, not ::before */
  const stripeStyle = { position:"absolute", top:0, left:0, right:0, height:2.5, background:"linear-gradient(90deg,"+RED+" 0%,#e8364f 45%,"+GOLD+" 100%)", pointerEvents:"none" };

  const logoStyle   = { display:"flex", alignItems:"center", flexShrink:0, paddingRight:16, borderRight:"1px solid "+BDR_MID, height:34 };
  const titleStyle  = { display:"flex", flexDirection:"column", padding:"0 14px", flexShrink:0 };
  const vdivStyle   = { width:1, height:26, background:BDR_MID, flexShrink:0, margin:"0 4px" };
  const navLinksStyle={ display:"flex", alignItems:"center", gap:1, padding:"0 12px", height:"100%", overflowX:"auto" };

  const navBtnStyle = (active) => ({ ...base, position:"relative", display:"flex", alignItems:"center", gap:5, height:34, padding:"0 12px", borderRadius:7, fontSize:12.5, fontWeight:active?600:500, color:active?RED:TEXT_MID, cursor:"pointer", border:"none", backgroundColor:active?RED_GLOW:"transparent", userSelect:"none", whiteSpace:"nowrap" });

  /* active underline for nav — real div instead of ::after */
  const navUnderStyle = { position:"absolute", bottom:-1, left:12, right:12, height:2, background:RED, borderRadius:"2px 2px 0 0" };

  const filterBtnStyle = (open,hasF) => ({ ...base, display:"flex", alignItems:"center", gap:6, height:30, padding:"0 12px", borderRadius:7, fontSize:12, fontWeight:500, color:open||hasF?RED:TEXT_MID, cursor:"pointer", border:"1px solid "+(open?"rgba(200,16,46,.3)":BDR_MID), backgroundColor:open?RED_GLOW:"rgba(255,255,255,.5)", userSelect:"none", flexShrink:0, outline:"none" });

  const chipStyle = (vis) => ({ display:vis?"flex":"none", alignItems:"center", gap:5, height:24, padding:"0 8px 0 10px", borderRadius:20, backgroundColor:RED_GLOW, border:"1px solid rgba(200,16,46,.2)", fontSize:11, fontWeight:600, color:RED, whiteSpace:"nowrap", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis" });

  const fpStyle = { ...base, position:"absolute", top:58, left:0, right:0, backgroundColor:"#ffffff", border:"1px solid rgba(15,28,46,.09)", borderTop:"none", borderRadius:"0 0 12px 12px", boxShadow:"0 8px 24px rgba(15,28,46,.10)", overflow:"hidden", maxHeight:fpOpen?58:0, opacity:fpOpen?1:0, pointerEvents:fpOpen?"all":"none", transform:fpOpen?"translateY(0)":"translateY(-8px)", transition:"max-height .38s,opacity .28s,transform .3s", zIndex:99 };

  /* left accent stripe on filter panel — real div */
  const fpStripeStyle = { position:"absolute", left:0, top:0, bottom:0, width:3, background:"linear-gradient(180deg,"+RED+","+GOLD+")", pointerEvents:"none" };

  const fpInnerStyle  = { padding:"0 16px 0 24px", height:58, display:"flex", alignItems:"center", gap:0 };

  const stepStyle = (vis) => ({ display:"flex", alignItems:"center", opacity:vis?1:0, transform:vis?"translateX(0)":"translateX(12px)", pointerEvents:vis?"all":"none", maxWidth:vis?260:0, overflow:"hidden", transition:"opacity .3s,transform .3s,max-width .35s" });

  const arrowStyle = (vis) => ({ display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, width:vis?28:0, overflow:"hidden", opacity:vis?1:0, transition:"width .3s,opacity .25s", color:TEXT_SFT });

  const promptStyle = (vis) => ({ ...base, display:vis?"flex":"none", alignItems:"center", gap:8, padding:"0 11px", borderRadius:7, backgroundColor:"rgba(200,16,46,.06)", border:"1px dashed rgba(200,16,46,.25)", fontSize:11, fontWeight:500, color:TEXT_MID, whiteSpace:"nowrap", cursor:"pointer", height:28, flexShrink:0, outline:"none" });

  const selStyle = (filled) => ({ ...base, height:28, minWidth:160, maxWidth:220, padding:"0 30px 0 11px", borderRadius:8, border:"1px solid "+(filled?"rgba(200,16,46,.35)":BDR_MID), backgroundColor:"rgba(255,255,255,.75)", color:filled?RED:TEXT, fontSize:12.5, fontWeight:filled?600:500, cursor:"pointer", outline:"none", backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238a96a8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center", appearance:"none", WebkitAppearance:"none" });

  const resetStyle = (vis) => ({ ...base, display:vis?"flex":"none", alignItems:"center", gap:5, height:28, padding:"0 10px", borderRadius:7, border:"1px solid "+BDR_MID, backgroundColor:"rgba(255,255,255,.5)", color:TEXT_SFT, fontSize:11, fontWeight:500, cursor:"pointer", whiteSpace:"nowrap", marginLeft:8, flexShrink:0, outline:"none" });

  const userWrapStyle = { display:"flex", alignItems:"center", gap:8, padding:"3px 10px 3px 3px", borderRadius:30, backgroundColor:"#f4f6f9", border:"1px solid rgba(15,28,46,.09)", cursor:"default", maxWidth:200 };

  const avatarStyle = { width:30, height:30, borderRadius:"50%", backgroundColor:RED, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", overflow:"hidden", border:"1.5px solid rgba(200,16,46,.2)" };

  const skelStyle = (w,h) => ({ display:"block", width:w, height:h, borderRadius:4, backgroundColor:"#eef0f3", backgroundImage:"linear-gradient(90deg,#eef0f3 25%,#e4e6ea 50%,#eef0f3 75%)", backgroundSize:"200% 100%", animation:"cpnShim 1.4s infinite" });

  /* ── SVG icons — no external deps ── */
  const Ico = ({d,d2,extra}) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      <path d={d}/>{d2&&<path d={d2}/>}{extra}
    </svg>
  );
  const ChevIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transition:"transform .25s",transform:fpOpen?"rotate(180deg)":"none",flexShrink:0}}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
  const ArrowIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
  const ResetIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
    </svg>
  );

  return (
    <div style={{ width:"100%", height:"100%", backgroundColor:"transparent" }}>
      <nav style={navStyle}>

        {/* top accent stripe */}
        <div style={stripeStyle} />

        {/* Logo */}
        <div style={logoStyle}>
          {logoErr
            ? <span style={{fontSize:15,fontWeight:700,color:RED}}>{navConfig.defaultUser}</span>
            : <img height="26" src="https://www.combank.lk/assets/images/logo/newlogo.svg" alt={navConfig.defaultUser} style={{mixBlendMode:"multiply",filter:"contrast(1.08) saturate(1.1)"}} onError={()=>setLogoErr(true)} />
          }
        </div>

        {/* Title - Dynamic Dashboard Header */}
        <div style={titleStyle}>
          <span style={{fontSize:13,fontWeight:600,color:TEXT,letterSpacing:"-.15px",whiteSpace:"nowrap"}}>{navConfig.dashboardHeader}</span>
        </div>

        <div style={vdivStyle} />

        {/* Nav links - Dynamic from config */}
        <div style={navLinksStyle}>
          {navConfig.pages.map(({id,label,link}) => (
            <button 
              key={id} 
              style={navBtnStyle(page===id)} 
              onClick={() => {
                setPage(id);
                // If it's an external link, open it
                if (link.startsWith('http://') || link.startsWith('https://')) {
                  window.open(link, '_blank');
                } else if (link.startsWith('#')) {
                  // Handle internal navigation
                  // You can add routing logic here if needed
                }
              }}
            >
              <span style={{display:"flex",alignItems:"center",gap:5}}>
                {label}
              </span>
              {page===id && <div style={navUnderStyle} />}
            </button>
          ))}
        </div>

        <div style={vdivStyle} />

        {/* Filter trigger + chip */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 8px"}}>
          <button id="cpn-fb" style={filterBtnStyle(fpOpen,hasAgm)} onClick={()=>setFpOpen(v=>!v)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            {hasAgm?"Filtered":"Filters"}
            {hasAgm && <span style={{width:6,height:6,borderRadius:"50%",backgroundColor:RED,flexShrink:0}} />}
            <ChevIcon />
          </button>
          {chipTxt && (
            <div style={chipStyle(true)}>
              <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{chipTxt}</span>
              <button onClick={reset} style={{width:14,height:14,borderRadius:"50%",backgroundColor:"rgba(200,16,46,.15)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:RED,fontWeight:700,flexShrink:0}}>✕</button>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{flex:1}} />

        {/* Clock + user */}
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end"}}>
            <span style={{fontSize:12.5,fontWeight:600,color:TEXT,fontVariantNumeric:"tabular-nums",letterSpacing:"-.2px",lineHeight:1}}>{clk.time}</span>
            <span style={{fontSize:9.5,color:TEXT_SFT,letterSpacing:".2px",marginTop:1}}>{clk.date}</span>
          </div>
          <div style={vdivStyle} />
          <div style={userWrapStyle}>
            <div style={{position:"relative",flexShrink:0}}>
              <div style={avatarStyle}>
                {user.loaded
                  ? (user.imageUrl?.startsWith("http")
                      ? <img src={user.imageUrl} alt={initials(user.name)} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%",display:"block"}} onError={(e)=>{e.target.style.display="none";}} />
                      : initials(user.name))
                  : <span style={skelStyle(30,30)} />
                }
              </div>
              <span style={{position:"absolute",bottom:0,right:0,width:7,height:7,borderRadius:"50%",backgroundColor:"#22c55e",border:"1.5px solid rgba(255,255,255,.8)"}} />
            </div>
            <div style={{display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>
              {user.loaded
                ? <><span style={{fontSize:11.5,fontWeight:600,color:TEXT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:110,lineHeight:1.2}}>{trunc(user.name||"Treasury User",18)}</span>
                    <span style={{fontSize:9.5,color:TEXT_SFT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:110}}>{trunc(user.role||"",22)}</span></>
                : <><span style={skelStyle(80,9)}/><span style={{...skelStyle(55,7),marginTop:3}}/></>
              }
            </div>
          </div>
        </div>

        {/* ── Filter Panel ── */}
        <div id="cpn-fp" style={fpStyle}>
          <div style={fpStripeStyle} />
          <div style={fpInnerStyle}>
            <span style={{fontSize:10.5,fontWeight:600,color:TEXT_SFT,textTransform:"uppercase",letterSpacing:".5px",whiteSpace:"nowrap",marginRight:14,flexShrink:0}}>Filter by</span>

            {/* AGM */}
            <div style={stepStyle(true)}>
              <select style={selStyle(hasAgm)} value={drill.agm} onChange={(e)=>onAgm(e.target.value)}>
                <option value="">— Select AGM —</option>
                {agms.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div style={arrowStyle(drill.step>=2)}><ArrowIcon /></div>

            <button style={promptStyle(hasAgm&&drill.step===1)} onClick={toRegion}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Drill to Region
            </button>

            {/* Region */}
            <div style={stepStyle(drill.step>=2)}>
              <select style={selStyle(hasReg)} value={drill.region} onChange={(e)=>onRegion(e.target.value)}>
                <option value="">— Select Region —</option>
                {regions.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={arrowStyle(drill.step>=3)}><ArrowIcon /></div>

            <button style={promptStyle(hasReg&&drill.step===2)} onClick={toBranch}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Drill to Branch
            </button>

            {/* Branch */}
            <div style={stepStyle(drill.step>=3)}>
              <select style={selStyle(hasBr)} value={drill.branch} onChange={(e)=>onBranch(e.target.value)}>
                <option value="">— Select Branch —</option>
                {branches.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <button style={resetStyle(hasAgm)} onClick={reset}>
              <ResetIcon /> Reset
            </button>
          </div>
        </div>

      </nav>
    </div>
  );
}
