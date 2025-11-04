# Agent Lab — Replit Bundle

This package serves two static apps and a tiny mock API:

- **Academy Dashboard** → `/academy/`
- **Calendar Viewer** → `/viewer/`
- **Mock API** → `/agents/summary` (returns the same data as `academy/agents.sample.json`)

## Run on Replit
1. Create a new Node.js Repl.
2. Upload the contents of this ZIP (or import from Git).
3. Open the shell and run:
   ```bash
   npm install
   npm start
   ```
4. Click the webview link; you’ll see the landing page with links to both apps.

## Notes
- The Academy dashboard currently reads `academy/agents.sample.json`. You can switch it to the live mock API by editing `academy/app.js` to fetch `/agents/summary` instead.
- For the Calendar Viewer, you can append query params:  
  `/viewer/?agent=agent-router&when=2025-11-05T17:00:00.000Z&pr=https%3A%2F%2Fgithub.com%2Fowner%2Frepo%2Fpull%2F42`

### vNext
- Academy now fetches `/agents/summary` (falls back to local sample if API not available)
- KPIs are color-tinted by thresholds (success≥0.80=green; p95≤5s=green; cost≤$0.05=green)

### v3
- Detail modal with **Promotion** tab (Calendar Viewer link + .ics)
- Card-level **Next review** chip when `next_review` is present
