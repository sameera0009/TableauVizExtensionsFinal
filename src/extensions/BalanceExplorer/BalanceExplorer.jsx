import { useEffect, useRef, useState, useCallback } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

/* ═══════════════════════════════════════════════════════════
   BALANCE EXPLORER — single-file React Viz Extension
   Encodings: ending, beginning  |  Auto-detect: date field
   Features : KPI strip, time-range slicer, dual-line chart,
              insights panel, weekday avg grid
═══════════════════════════════════════════════════════════ */

/* ── inject CSS once ── */
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{width:100%;height:100%;}
body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#f4f6f9;-webkit-font-smoothing:antialiased;overflow:auto;}
.be-app{width:calc(100% - 16px);max-width:960px;margin:0 auto;padding:8px 0 14px;}
.be-shell{background:#fff;border-radius:16px;border:0.5px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.04),0 6px 24px rgba(0,0,0,.07);animation:beRise .28s cubic-bezier(.22,.68,0,1.1) both;}
@keyframes beRise{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.be-topbar{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 10px;border-bottom:0.5px solid #f1f5f9;flex-wrap:wrap;gap:8px;}
.be-tt{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#64748b;}
.be-ts{font-size:9.5px;color:#94a3b8;margin-top:1px;}
.be-slicers{display:flex;gap:2px;background:#f1f5f9;border-radius:8px;padding:3px;}
.be-sl{font-size:9.5px;font-weight:600;padding:4px 11px;border-radius:6px;border:none;cursor:pointer;background:transparent;color:#94a3b8;font-family:inherit;transition:all .15s;}
.be-sl:hover{color:#334155;}
.be-sl.on{background:#fff;color:#0f172a;box-shadow:0 1px 3px rgba(0,0,0,.08);}
.be-kpi-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-bottom:0.5px solid #f1f5f9;}
.be-kpi{padding:11px 13px;border-right:0.5px solid #f1f5f9;border-left:3px solid transparent;}
.be-kpi:last-child{border-right:none;}
.be-kpi.g{border-left-color:#16a34a;}.be-kpi.b{border-left-color:#3b82f6;}.be-kpi.a{border-left-color:#f59e0b;}.be-kpi.r{border-left-color:#dc2626;}
.be-kl{font-size:8px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;margin-bottom:4px;}
.be-kv{font-size:16px;font-weight:600;color:#0f172a;letter-spacing:-.02em;line-height:1;margin-bottom:2px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.be-kd{font-size:8px;font-weight:500;color:#94a3b8;}
.be-kd.g{color:#15803d;}.be-kd.r{color:#b91c1c;}.be-kd.b{color:#1d4ed8;}.be-kd.a{color:#b45309;}
.be-chart-wrap{padding:14px 16px 0;position:relative;}
.be-ax{display:flex;justify-content:space-between;padding:3px 16px 8px;font-size:8.5px;color:#cbd5e1;}
.be-insights{border-top:0.5px solid #f1f5f9;padding:14px 16px;}
.be-sec{font-size:9px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;}
.be-ins-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:16px;}
.be-ins-card{background:#f8fafc;border-radius:10px;border:0.5px solid #e2e8f0;padding:11px 13px;}
.be-ins-l{font-size:8px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#94a3b8;margin-bottom:4px;}
.be-ins-v{font-size:14px;font-weight:600;color:#0f172a;margin-bottom:2px;font-variant-numeric:tabular-nums;}
.be-ins-d{font-size:8.5px;color:#94a3b8;}
.be-wday-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;}
.be-wday{background:#f8fafc;border-radius:10px;border:0.5px solid #e2e8f0;padding:11px 12px;position:relative;overflow:hidden;}
.be-wday::before{content:'';position:absolute;top:0;left:0;right:0;height:2.5px;border-radius:10px 10px 0 0;}
.be-wday.d0::before{background:#16a34a;}.be-wday.d1::before{background:#3b82f6;}.be-wday.d2::before{background:#f59e0b;}.be-wday.d3::before{background:#8b5cf6;}.be-wday.d4::before{background:#ec4899;}
.be-wday-name{font-size:8.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#475569;margin-bottom:7px;}
.be-wday-val{font-size:15px;font-weight:600;color:#0f172a;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1;margin-bottom:2px;}
.be-wday-lbl{font-size:8px;color:#94a3b8;margin-bottom:8px;}
.be-wbar-wrap{height:3px;background:#f1f5f9;border-radius:99px;overflow:hidden;margin-bottom:5px;}
.be-wbar-fill{height:100%;border-radius:99px;transition:width .5s ease;}
.be-wday-footer{display:flex;justify-content:space-between;font-size:8px;color:#94a3b8;}
.be-legend{display:flex;gap:14px;flex-wrap:wrap;align-items:center;padding:8px 16px 10px;border-top:0.5px solid #f1f5f9;}
.be-leg{display:flex;align-items:center;gap:5px;font-size:9.5px;color:#64748b;}
.be-leg-ln{width:16px;height:2px;border-radius:2px;}
.be-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;height:200px;}
.be-spinner{width:22px;height:22px;border:2.5px solid #e2e8f0;border-top-color:#3b82f6;border-radius:50%;animation:beSpin .7s linear infinite;}
@keyframes beSpin{to{transform:rotate(360deg)}}
.be-loading-txt{font-size:11px;color:#94a3b8;font-weight:500;}
.be-error{padding:24px;text-align:center;color:#ef4444;font-size:12px;}
@media(max-width:480px){.be-kpi-strip{grid-template-columns:repeat(2,1fr)}.be-ins-grid{grid-template-columns:1fr 1fr}.be-wday-grid{grid-template-columns:repeat(3,1fr)}}
`;

if (typeof document !== "undefined" && !document.getElementById("be-styles")) {
  const s = document.createElement("style");
  s.id = "be-styles";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ════════════════════════════════
   CONSTANTS
════════════════════════════════ */
const SLICERS = [
  { w: 7,   lbl: "1W" },
  { w: 14,  lbl: "2W" },
  { w: 30,  lbl: "1M" },
  { w: 90,  lbl: "3M" },
  { w: 180, lbl: "6M" },
  { w: 365, lbl: "1Y" },
  { w: 0,   lbl: "All" },
];

const DAYS = [
  { idx: 1, name: "MON", cls: "d0", color: "#16a34a" },
  { idx: 2, name: "TUE", cls: "d1", color: "#3b82f6" },
  { idx: 3, name: "WED", cls: "d2", color: "#f59e0b" },
  { idx: 4, name: "THU", cls: "d3", color: "#8b5cf6" },
  { idx: 5, name: "FRI", cls: "d4", color: "#ec4899" },
];

/* ════════════════════════════════
   FORMAT HELPERS
════════════════════════════════ */
function fN(n) {
  if (n === null || isNaN(n)) return "—";
  const abs = Math.abs(n), s = n < 0 ? "-" : "";
  if (abs >= 1e9) return s + (abs / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return s + (abs / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return s + Math.round(abs).toLocaleString("en-US");
  return s + abs.toFixed(0);
}

const MON_LONG  = ["january","february","march","april","may","june","july","august","september","october","november","december"];
const MON_SHORT = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const MON_DISP  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(d) {
  if (!d) return "—";
  return d.getDate() + " " + MON_DISP[d.getMonth()] + " " + d.getFullYear();
}

/* ════════════════════════════════
   TABLEAU READERS
════════════════════════════════ */
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
  const map  = {};
  if (spec.activeMarksSpecificationIndex >= 0) {
    spec.marksSpecifications[spec.activeMarksSpecificationIndex]
      .encodings.forEach((e) => { map[e.id] = e.field; });
  }
  return map;
}

/* ════════════════════════════════
   FIELD HELPERS
════════════════════════════════ */
function dvNum(dv) {
  if (!dv) return null;
  const n = parseFloat(dv.nativeValue !== undefined ? dv.nativeValue : dv.value);
  return isNaN(n) ? null : n;
}

function findKey(encField, rowKeys) {
  if (!encField) return null;
  const nm = encField.name.toLowerCase();
  return rowKeys.find((k) => k.toLowerCase() === nm) || null;
}

function findDateKey(rowKeys, rows) {
  const scored = rowKeys.map((k) => {
    const kl = k.toLowerCase();
    let s = 0;
    if (kl.includes("day"))     s = 10;
    else if (kl.includes("date"))    s = 9;
    else if (kl.includes("posting")) s = 8;
    else if (kl.includes("month"))   s = 5;
    else if (kl.includes("year"))    s = 2;
    return { k, s };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);

  if (!scored.length) return null;
  for (const { k } of scored) {
    if (!rows.length || !rows[0][k]) continue;
    const nv = rows[0][k].nativeValue;
    if (typeof nv === "number" && nv > 1e10) {
      const d = new Date(nv);
      if (d.getFullYear() >= 1990 && d.getFullYear() <= 2050) return k;
    }
    const fv = rows[0][k].formattedValue || "";
    if (fv.match(/\d{4}[-/]\d{2}[-/]\d{2}/) || fv.match(/\d{1,2}[-/\s]\w+[-/\s]\d{4}/)) return k;
  }
  return scored[0].k;
}

function parseDate(dv) {
  if (!dv) return null;
  const nv = dv.nativeValue !== undefined ? dv.nativeValue : dv.value;
  const fv = dv.formattedValue || String(dv.value || "");

  if (typeof nv === "number" && nv > 1e10) {
    const d = new Date(nv);
    if (d.getFullYear() >= 1990 && d.getFullYear() <= 2050) return d;
  }

  if (fv && fv !== "%null%" && fv !== "Null") {
    const iso = fv.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    const slsh = fv.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (slsh) {
      const [, p1, p2, yr] = slsh.map(Number);
      return p1 > 12 ? new Date(yr, p2 - 1, p1) : new Date(yr, p1 - 1, p2);
    }
    const parts = fv.split(/[\s,/]+/).filter(Boolean);
    if (parts.length >= 2) {
      let mi = -1, yr = -1, dy = 1;
      parts.forEach((p) => {
        const pl = p.toLowerCase();
        let m = MON_LONG.indexOf(pl);
        if (m < 0) m = MON_SHORT.indexOf(pl.slice(0, 3));
        if (m >= 0) mi = m;
        else if (+p >= 1900 && +p <= 2100) yr = +p;
        else if (+p >= 1 && +p <= 31 && yr < 0) dy = +p;
      });
      if (mi >= 0 && yr >= 0) return new Date(yr, mi, dy);
    }
    const d2 = new Date(fv);
    if (!isNaN(d2.getTime()) && d2.getFullYear() >= 1990) return d2;
  }

  if (typeof nv === "number" && nv >= 1990 && nv <= 2050) return new Date(nv, 0, 1);
  return null;
}

/* ════════════════════════════════
   PROCESS ROWS → POINTS
════════════════════════════════ */
function processRows(rows, enc) {
  if (!rows.length) return [];
  const rowKeys = Object.keys(rows[0]);
  const dateKey = findDateKey(rowKeys, rows);
  const endKey  = findKey(enc.ending,    rowKeys);
  const begKey  = findKey(enc.beginning, rowKeys);
  if (!endKey) return [];

  const pts = [];
  rows.forEach((row) => {
    const ending = dvNum(row[endKey]);
    if (ending === null) return;
    const dateObj = parseDate(row[dateKey]);
    if (!dateObj) return;
    const fv = row[dateKey] ? (row[dateKey].formattedValue || "") : "";
    pts.push({
      date:      dateObj,
      num:       dateObj.getTime(),
      label:     fv || fmtDate(dateObj),
      ending,
      beginning: dvNum(row[begKey]),
      weekday:   dateObj.getDay(),
    });
  });

  pts.sort((a, b) => a.num - b.num);
  const seen = new Set();
  return pts.filter((p) => { if (seen.has(p.num)) return false; seen.add(p.num); return true; });
}

/* ════════════════════════════════
   SLICE BY DAYS
════════════════════════════════ */
function sliceData(all, w) {
  if (w === 0) return all;
  const cut = new Date();
  cut.setDate(cut.getDate() - w);
  return all.filter((p) => p.date >= cut);
}

function pickDefault(n) {
  if (n <= 7)   return 7;
  if (n <= 14)  return 14;
  if (n <= 30)  return 30;
  if (n <= 90)  return 90;
  if (n <= 180) return 180;
  if (n <= 365) return 365;
  return 0;
}

/* ════════════════════════════════
   DERIVED DATA FOR RENDER
════════════════════════════════ */
function derive(data) {
  if (!data.length) return null;

  const last  = data[data.length - 1];
  const first = data[0];
  const endings = data.map((p) => p.ending).filter((v) => v !== null);
  const avg   = endings.reduce((s, v) => s + v, 0) / endings.length;
  const net   = last.ending - (first.beginning !== null ? first.beginning : first.ending);

  const maxV  = Math.max(...endings);
  const minV  = Math.min(...endings);
  const maxPt = data.find((p) => p.ending === maxV);
  const minPt = data.find((p) => p.ending === minV);

  const swings    = data.filter((p) => p.beginning !== null).map((p) => p.ending - p.beginning);
  const maxSwingAbs = swings.length ? Math.max(...swings.map(Math.abs)) : null;
  const swingPt   = maxSwingAbs !== null
    ? data.find((p) => p.beginning !== null && Math.abs(p.ending - p.beginning) === maxSwingAbs)
    : null;

  const wdayAvgs = DAYS.map((day) => {
    const pts2 = data.filter((p) => p.weekday === day.idx);
    const avg2  = pts2.length ? pts2.reduce((s, p) => s + p.ending, 0) / pts2.length : null;
    return { day, avg: avg2, cnt: pts2.length };
  });
  const maxWdayAvg = Math.max(...wdayAvgs.map((w) => w.avg || 0));

  return { last, first, avg, net, maxV, minV, maxPt, minPt, maxSwingAbs, swingPt, wdayAvgs, maxWdayAvg };
}

/* ════════════════════════════════
   ROOT EXPORT
════════════════════════════════ */
export default function BalanceExplorer() {
  const [status, setStatus] = useState({ loading: true, error: null });
  const [all,    setAll]    = useState([]);
  const [activeW, setActiveW] = useState(30);

  useEffect(() => {
    async function init() {
      try {
        await window.tableau.extensions.initializeAsync();
        const ws = window.tableau.extensions.worksheetContent.worksheet;
        const load = async () => {
          const rows = await readData(ws);
          const enc  = await readEncodings(ws);
          const pts  = processRows(rows, enc);
          if (!pts.length) { setStatus({ loading: false, error: "No data — drop Ending Balance and a Date field on Marks" }); return; }
          setAll(pts);
          setActiveW(pickDefault(pts.length));
          setStatus({ loading: false, error: null });
        };
        ws.addEventListener(window.tableau.TableauEventType.SummaryDataChanged, load);
        await load();
      } catch (err) {
        setStatus({ loading: false, error: err.message });
      }
    }
    init();
  }, []);

  if (status.loading) return (
    <div className="be-app">
      <div className="be-shell">
        <div className="be-loading"><div className="be-spinner" /><span className="be-loading-txt">Loading…</span></div>
      </div>
    </div>
  );

  if (status.error) return (
    <div className="be-app"><div className="be-shell"><div className="be-error">{status.error}</div></div></div>
  );

  const data    = sliceData(all, activeW);
  const derived = derive(data);

  return (
    <div className="be-app">
      <div className="be-shell">
        <TopBar activeW={activeW} onSlice={setActiveW} derived={derived} data={data} />
        <KpiStrip derived={derived} data={data} />
        <ChartArea data={data} />
        <Insights derived={derived} />
        <Legend />
      </div>
    </div>
  );
}

/* ════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════ */
function TopBar({ activeW, onSlice, derived, data }) {
  const first = data[0];
  const last  = data[data.length - 1];
  const range = data.length
    ? fmtDate(first.date) + " – " + fmtDate(last.date)
    : "— Select a period —";

  return (
    <div className="be-topbar">
      <div>
        <div className="be-tt">Balance Explorer</div>
        <div className="be-ts">{range}</div>
      </div>
      <div className="be-slicers">
        {SLICERS.map(({ w, lbl }) => (
          <button
            key={w}
            className={"be-sl" + (activeW === w ? " on" : "")}
            onClick={() => onSlice(w)}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

function KpiStrip({ derived, data }) {
  if (!derived) return null;
  const { last, first, avg, net } = derived;
  const netUp = net >= 0;

  return (
    <div className="be-kpi-strip">
      <div className="be-kpi g">
        <div className="be-kl">Latest Ending</div>
        <div className="be-kv">{fN(last.ending)}</div>
        <div className="be-kd">{fmtDate(last.date)}</div>
      </div>
      <div className="be-kpi b">
        <div className="be-kl">Latest Beginning</div>
        <div className="be-kv">{fN(first.beginning !== null ? first.beginning : first.ending)}</div>
        <div className="be-kd">{fmtDate(first.date)}</div>
      </div>
      <div className="be-kpi a">
        <div className="be-kl">Avg Ending</div>
        <div className="be-kv">{fN(avg)}</div>
        <div className="be-kd">Over {data.length} days</div>
      </div>
      <div className="be-kpi r">
        <div className="be-kl">Net Change</div>
        <div className="be-kv">{(netUp ? "+" : "") + fN(net)}</div>
        <div className={"be-kd " + (netUp ? "g" : "r")}>{netUp ? "▲ Positive" : "▼ Negative"}</div>
      </div>
    </div>
  );
}

function ChartArea({ data }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  const appRef    = useRef(null);

  const labels  = data.map((p) => p.label);
  const endings = data.map((p) => p.ending);
  const begins  = data.map((p) => p.beginning);
  const axL     = labels[0] || "";
  const axR     = labels[labels.length - 1] || "";

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const allY = [...endings, ...begins].filter((v) => v !== null);
    const yMin = Math.max(0, Math.floor(Math.min(...allY) * 0.97));
    const yMax = Math.ceil(Math.max(...allY) * 1.03);

    if (chartRef.current) {
      chartRef.current.data.labels = labels;
      chartRef.current.data.datasets[0].data = endings;
      chartRef.current.data.datasets[0].pointRadius = data.length > 90 ? 0 : 2.5;
      chartRef.current.data.datasets[1].data = begins;
      chartRef.current.options.scales.y.min = yMin;
      chartRef.current.options.scales.y.max = yMax;
      chartRef.current.update("active");
      return;
    }

    chartRef.current = new Chart(canvasRef.current, {
      data: {
        labels,
        datasets: [
          {
            type: "line", label: "Ending Balance", data: endings,
            borderColor: "#16a34a", borderWidth: 2,
            pointRadius: data.length > 90 ? 0 : 2.5,
            pointBackgroundColor: "#16a34a", pointBorderColor: "#fff", pointBorderWidth: 1.5,
            pointHoverRadius: 4.5, tension: 0.3,
            fill: { target: "origin", above: "rgba(22,163,74,0.06)" },
            order: 1,
          },
          {
            type: "line", label: "Beginning Balance", data: begins,
            borderColor: "#3b82f6", borderWidth: 1.5, borderDash: [4, 3],
            pointRadius: 0, pointHoverRadius: 4, tension: 0.3, fill: false,
            order: 2,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(10,10,10,.9)",
            titleColor: "#fff", bodyColor: "rgba(255,255,255,.72)",
            titleFont: { size: 11, weight: "600", family: "system-ui" },
            bodyFont:  { size: 10, family: "system-ui" },
            padding: 10, cornerRadius: 8,
            callbacks: { label: (c) => " " + c.dataset.label + ": " + fN(c.raw) },
          },
        },
        scales: {
          x: {
            grid: { display: false }, border: { display: false },
            ticks: { font: { size: 8 }, color: "#cbd5e1", maxRotation: 45, autoSkip: true, maxTicksLimit: 12 },
          },
          y: {
            min: yMin, max: yMax,
            grid: { color: "rgba(0,0,0,.04)" }, border: { display: false },
            ticks: { font: { size: 8 }, color: "#94a3b8", callback: (v) => fN(v) },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [labels.join(","), endings.join(","), begins.join(",")]); // eslint-disable-line

  return (
    <>
      <div className="be-chart-wrap" ref={appRef}>
        <canvas ref={canvasRef} height={185} />
      </div>
      <div className="be-ax"><span>{axL}</span><span>{axR}</span></div>
    </>
  );
}

function Insights({ derived }) {
  if (!derived) return null;
  const { maxV, minV, maxPt, minPt, maxSwingAbs, swingPt, wdayAvgs, maxWdayAvg } = derived;

  return (
    <div className="be-insights">
      <div className="be-sec">Key Insights</div>
      <div className="be-ins-grid">
        <div className="be-ins-card">
          <div className="be-ins-l">▲ Highest Ending Balance</div>
          <div className="be-ins-v">{fN(maxV)}</div>
          <div className="be-ins-d">{maxPt ? fmtDate(maxPt.date) : "—"}</div>
        </div>
        <div className="be-ins-card">
          <div className="be-ins-l">▼ Lowest Ending Balance</div>
          <div className="be-ins-v">{fN(minV)}</div>
          <div className="be-ins-d">{minPt ? fmtDate(minPt.date) : "—"}</div>
        </div>
        <div className="be-ins-card">
          <div className="be-ins-l">↕ Largest Daily Swing</div>
          <div className="be-ins-v">
            {maxSwingAbs !== null
              ? (swingPt && swingPt.ending > swingPt.beginning ? "+" : "") + fN(maxSwingAbs)
              : "—"}
          </div>
          <div className="be-ins-d">{swingPt ? fmtDate(swingPt.date) : "Ending − Beginning"}</div>
        </div>
      </div>

      <div className="be-sec">Average Ending Balance by Weekday</div>
      <div className="be-wday-grid">
        {wdayAvgs.map(({ day, avg, cnt }) => {
          const pct = maxWdayAvg > 0 && avg !== null ? Math.round((avg / maxWdayAvg) * 100) : 0;
          return (
            <div key={day.idx} className={"be-wday " + day.cls}>
              <div className="be-wday-name">{day.name}</div>
              <div className="be-wday-val">{avg !== null ? fN(avg) : "—"}</div>
              <div className="be-wday-lbl">Avg ending</div>
              <div className="be-wbar-wrap">
                <div className="be-wbar-fill" style={{ width: pct + "%", background: day.color }} />
              </div>
              <div className="be-wday-footer"><span>{cnt} days</span><span>{pct}%</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="be-legend">
      <div className="be-leg">
        <div className="be-leg-ln" style={{ background: "#16a34a" }} />
        Ending Balance
      </div>
      <div className="be-leg">
        <div className="be-leg-ln" style={{ background: "#3b82f6", borderTop: "2px dashed #3b82f6", height: 0 }} />
        Beginning Balance
      </div>
    </div>
  );
}
