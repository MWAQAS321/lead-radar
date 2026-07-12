// Local Lead Radar — private lead generation backend
// Stores search config + scraped leads, talks to the dashboard and to n8n.

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/healthz', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

const DB_PATH = path.join(__dirname, 'db.json');

// ---------- tiny JSON "database" ----------
function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      config: {
        query: 'restaurants in Peshawar',
        location: 'Peshawar, Pakistan',
        email: '',
        n8n_webhook_url: '',
        leads_per_run: 10,
        radius_meters: 5000
      },
      leads: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ---------- config ----------
app.get('/api/config', (req, res) => {
  const db = loadDB();
  res.json(db.config);
});

app.post('/api/config', (req, res) => {
  const db = loadDB();
  db.config = { ...db.config, ...req.body };
  saveDB(db);
  res.json(db.config);
});

// ---------- leads ----------
// n8n pushes freshly scraped leads here after each daily run
app.post('/api/leads', (req, res) => {
  const db = loadDB();
  const incoming = Array.isArray(req.body) ? req.body : req.body.leads || [];

  let added = 0;
  incoming.forEach((lead) => {
    const key = lead.place_id || lead.phone || lead.name + lead.address;
    const exists = db.leads.some(
      (l) => (l.place_id || l.phone || l.name + l.address) === key
    );
    if (!exists) {
      db.leads.unshift({
        id: Date.now() + Math.random().toString(36).slice(2, 8),
        scraped_at: new Date().toISOString(),
        ...lead
      });
      added++;
    }
  });

  saveDB(db);
  res.json({ ok: true, added, total: db.leads.length });
});

// dashboard reads leads here (newest first, optional search)
app.get('/api/leads', (req, res) => {
  const db = loadDB();
  const q = (req.query.q || '').toLowerCase();
  let leads = db.leads;
  if (q) {
    leads = leads.filter(
      (l) =>
        (l.name || '').toLowerCase().includes(q) ||
        (l.category || '').toLowerCase().includes(q) ||
        (l.address || '').toLowerCase().includes(q)
    );
  }
  res.json(leads);
});

app.delete('/api/leads', (req, res) => {
  const db = loadDB();
  db.leads = [];
  saveDB(db);
  res.json({ ok: true });
});

// ---------- manual trigger: dashboard -> n8n webhook ----------
app.post('/api/trigger', async (req, res) => {
  const db = loadDB();
  const url = db.config.n8n_webhook_url;
  if (!url) {
    return res.status(400).json({ ok: false, error: 'n8n webhook URL not set in config yet.' });
  }
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db.config)
    });
    res.json({ ok: true, status: r.status });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Local Lead Radar running → http://localhost:${PORT}`);
});
