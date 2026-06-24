import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import BalanceExplorer    from "./extensions/BalanceExplorer/BalanceExplorer.jsx";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/suspense-card"        element={<SuspenseCard />} />
        <Route path="/kpi-card"             element={<KpiCard />} />
        <Route path="/channel-donut"        element={<ChannelDonut />} />
        <Route path="/balance-explorer"     element={<BalanceExplorer />} />
        <Route path="/cash-position-navbar" element={<CashPositionNavbar />} />
        <Route path="/treasury-kpi"         element={<TreasuryKpi />} />
        <Route path="/cheque-material-kpi"  element={<ChequeMaterialKpi />} />
        <Route path="/percent-trend-kpi"    element={<PercentTrendKpi />} />
        <Route path="/"                     element={<Home />} />
        <Route path="*"                     element={<NotFound />} />
      </Routes>
    </Router>
  );
}

const linkStyle = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "11px 15px", background: "#fff", borderRadius: 10,
  border: "1px solid rgba(15,23,42,.07)", textDecoration: "none",
  color: "#0f172a", fontSize: 13, fontWeight: 600,
  boxShadow: "0 1px 3px rgba(15,23,42,.05)",
};
const codeStyle = {
  fontSize: 10, color: "#64748b", background: "rgba(15,23,42,.05)",
  padding: "2px 7px", borderRadius: 5, fontFamily: "ui-monospace, monospace",
};

function Home() {
  return (
    <div style={{ fontFamily: "system-ui", padding: 24, background: "#f8fafc", minHeight: "100vh", overflow: "auto" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
        Central Cash — Tableau Viz Extensions
      </h2>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>
        8 production extensions. Click any to preview, or use the URL in a Tableau .trex manifest.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 460 }}>
        <a href="/suspense-card" style={linkStyle}><span>Suspense KPI Card</span><code style={codeStyle}>/suspense-card</code></a>
        <a href="/kpi-card" style={linkStyle}><span>KPI Card Pro</span><code style={codeStyle}>/kpi-card</code></a>
        <a href="/channel-donut" style={linkStyle}><span>Channel Donut</span><code style={codeStyle}>/channel-donut</code></a>
        <a href="/balance-explorer" style={linkStyle}><span>Balance Explorer</span><code style={codeStyle}>/balance-explorer</code></a>
        <a href="/cash-position-navbar" style={linkStyle}><span>Cash Position Navbar</span><code style={codeStyle}>/cash-position-navbar</code></a>
        <a href="/treasury-kpi" style={linkStyle}><span>Treasury KPI</span><code style={codeStyle}>/treasury-kpi</code></a>
        <a href="/cheque-material-kpi" style={linkStyle}><span>Cheque Material KPI</span><code style={codeStyle}>/cheque-material-kpi</code></a>
        <a href="/percent-trend-kpi" style={linkStyle}><span>Percent Trend KPI</span><code style={codeStyle}>/percent-trend-kpi</code></a>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ fontFamily: "system-ui", padding: 24, color: "#64748b" }}>
      <p style={{ fontSize: 13, marginBottom: 8 }}>No route matched. Current URL:</p>
      <code style={{ fontSize: 12, background: "#f1f5f9", padding: "4px 10px", borderRadius: 6, display: "block" }}>
        {window.location.pathname}
      </code>
    </div>
  );
}

export default App;
