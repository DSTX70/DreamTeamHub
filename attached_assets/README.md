# Images Admin — Preview Re‑encode Drawer

**Date:** 2025-11-07

Adds a tiny **Preview re‑encode** drawer to the Images Admin page that:
- Lets you pick a source file (defaults to the last file you selected in the uploader)
- Adjust **quality sliders** (AVIF/WEBP/JPG) and custom widths CSV
- Calls **POST /api/ops/images/preview** to get projected sizes (no upload to S3)
- Shows a **Compare vs uploaded** diff (size and % change) using the current stats

## How to use
1. Open **Ops → Images**.
2. Select a file and upload as usual (optional, but gives you a baseline for comparison).
3. Click **Preview re‑encode** → adjust sliders → **Run Preview**.
4. See totals by format and a row-by-row comparison (by width & format).

No server changes are required beyond mounting the preview endpoint you just added:
`app.use(require("./server/routes/images.preview.route").router);`
