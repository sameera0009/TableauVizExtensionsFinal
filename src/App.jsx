import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import your existing extensions
import BalanceExplorer from "./extensions/BalanceExplorer/BalanceExplorer.jsx";
import Kpiwithtrend from "./extensions/clearing/kpiwithtrend.jsx";
import Ccashkpimain1 from "./extensions/Ccashkpimain1/Ccashkpimain1.jsx";
import Topkpibar from "./extensions/clearing/Topkpibar.jsx";
import Topbar from "./extensions/centralcash/Topbar.jsx";
import Firstfivekpicards from "./extensions/centralcash/Firstfivekpicards.jsx";
import Mapviz from "./extensions/centralcash/Mapviz.jsx";
import Drillbar from "./extensions/clearing/Drillbar.jsx";
import Drillbarccash from "./extensions/centralcash/Drillbarccash.jsx";
import Donutpro from "./extensions/clearing/Donutpro.jsx";



// Import pages
import Home from "./pages/Home.jsx";
import Extensions from "./pages/Extensions.jsx";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Your existing extension routes */}
        <Route path="/balance-explorer" element={<BalanceExplorer />} />
        <Route path="/kpiwithtrend" element={<Kpiwithtrend />} />
        <Route path="/Topkpibar" element={<Topkpibar />} />
        <Route path="/Topbar" element={<Topbar />} />
        <Route path="/Firstfivekpicards" element={<Firstfivekpicards />} />
        <Route path="/Mapviz" element={<Mapviz />} />
        <Route path="/Drillbar" element={<Drillbar />} />
        <Route path="/Drillbarccash" element={<Drillbarccash />} />
        <Route path="/Donutpro" element={<Donutpro />} />
        
        <Route path="/suspense-card" element={<ExtensionPlaceholder title="Suspense KPI Card" />} />
        <Route path="/kpi-card" element={<ExtensionPlaceholder title="KPI Card Pro" />} />
        <Route path="/channel-donut" element={<ExtensionPlaceholder title="Channel Donut" />} />
        <Route path="/cash-position-navbar" element={<ExtensionPlaceholder title="Cash Position Navbar" />} />
        <Route path="/treasury-kpi" element={<ExtensionPlaceholder title="Treasury KPI" />} />
        <Route path="/cheque-material-kpi" element={<ExtensionPlaceholder title="Cheque Material KPI" />} />
        <Route path="/percent-trend-kpi" element={<ExtensionPlaceholder title="Percent Trend KPI" />} />
        <Route path="/Ccashkpimain1" element={<ExtensionPlaceholder title="Ccashkpimain1" />} />
        
        {/* Page routes */}
        <Route path="/" element={<Home />} />
        <Route path="/extensions" element={<Extensions />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

// Placeholder for extensions that don't have components yet
function ExtensionPlaceholder({ title }) {
  return (
    <div style={{ 
      fontFamily: "system-ui", 
      padding: 40, 
      background: "#f8fafc", 
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
        {title}
      </h1>
      <p style={{ color: "#64748b", marginBottom: 20 }}>This extension is being developed.</p>
      <a href="/" style={{ 
        color: "#3b82f6", 
        textDecoration: "none",
        fontWeight: 600
      }}>
        ← Back to Home
      </a>
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
