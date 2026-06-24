# Central Cash — Tableau Viz Extensions

8 production Tableau viz extensions built with React + Vite, deployed on Vercel.

## Extensions

| Extension | Route | Encodings |
|---|---|---|
| Suspense KPI Card | `/suspense-card` | account, cost_center, balance |
| KPI Card Pro | `/kpi-card` | category, hero, trend, date |
| Channel Donut | `/channel-donut` | channel, txn_count, txn_value |
| Balance Explorer | `/balance-explorer` | ending, beginning, date |
| Cash Position Navbar | `/cash-position-navbar` | agm, region, branch |
| Treasury KPI | `/treasury-kpi` | actual, delta |
| Cheque Material KPI | `/cheque-material-kpi` | headline, amount, count, varLW, varMoM |
| Percent Trend KPI | `/percent-trend-kpi` | header, hero, count, trend, date |

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173 to see the extension index.

## Build

```bash
npm run build
```

Outputs to `dist/`.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo at vercel.com
3. Vercel auto-detects Vite — no config needed
4. Deploy

Each extension is then available at:
`https://YOUR-PROJECT.vercel.app/<route>`

## Using in Tableau

In each `.trex` manifest, set the `<url>` to the deployed Vercel URL:

```xml
<source-location>
  <url>https://YOUR-PROJECT.vercel.app/kpi-card</url>
</source-location>
```

Then in Tableau: Dashboard → Objects → Extension → drop your `.trex` file.

## Tech notes

- Each extension is a self-contained single `.jsx` file with inline styles
- Tableau Extensions API loads from CDN in `index.html`
- Only Channel Donut and Balance Explorer use `chart.js`; the rest are pure SVG
- `vercel.json` rewrites all routes to `index.html` so React Router handles them
