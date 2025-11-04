import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Static mounts
app.use('/academy', express.static(path.join(__dirname, 'academy')));
app.use('/viewer', express.static(path.join(__dirname, 'calendar-viewer')));

// Mock API for agents summary (dashboard can be switched to this later)
app.get('/agents/summary', (req, res) => {
  try {
    const data = require('./academy/agents.sample.json');
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Sample data not found' });
  }
});

// Root index
app.get('/', (req, res) => {
  res.type('html').send(`
  <!doctype html>
  <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Agent Lab — Replit Drop</title>
  <style>body{font-family:Inter,Arial,sans-serif;background:#0f1220;color:#e9ecf1;margin:0;padding:24px}a{color:#3c82f6;text-decoration:none}</style>
  </head><body>
    <h1>Agent Lab — Replit Bundle</h1>
    <p>Choose an app:</p>
    <ul>
      <li><a href="/academy/" target="_self">Academy Dashboard</a></li>
      <li><a href="/viewer/" target="_self">Calendar Viewer</a></li>
    </ul>
    <p>Mock API: <code>/agents/summary</code></p>
  </body></html>`);
});

app.listen(PORT, () => {
  console.log(`Agent Lab server running on http://localhost:${PORT}`);
});
