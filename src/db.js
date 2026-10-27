const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'shortener.db'));
db.pragma('journal_mode = WAL');

function generateCode() {
  return Math.random().toString(36).slice(2, 9).toLowerCase();
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      destination TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      click_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS click_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      link_id INTEGER NOT NULL,
      timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      referrer TEXT,
      user_agent TEXT,
      ip TEXT,
      FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
    );
  `);
}

function createLinkRecord({ title, destination, code }) {
  const normalizedCode = (code || generateCode()).trim();

  const existing = db.prepare('SELECT id FROM links WHERE code = ?').get(normalizedCode);
  if (existing) {
    const error = new Error(`Short code ${normalizedCode} already exists.`);
    error.code = 'DUPLICATE_CODE';
    throw error;
  }

  const insert = db.prepare(`
    INSERT INTO links (code, title, destination, click_count)
    VALUES (?, ?, ?, 0)
  `);

  const result = insert.run(normalizedCode, title, destination);
  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(result.lastInsertRowid);

  return link;
}

function getLinks() {
  return db.prepare(`
    SELECT l.*, COUNT(e.id) AS total_clicks
    FROM links l
    LEFT JOIN click_events e ON e.link_id = l.id
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `).all();
}

function getLinkByCode(code) {
  return db.prepare('SELECT * FROM links WHERE code = ?').get(code);
}

function getLinkById(id) {
  return db.prepare('SELECT * FROM links WHERE id = ?').get(id);
}

function recordClick({ linkId, referrer, userAgent, ip }) {
  db.prepare(`
    INSERT INTO click_events (link_id, referrer, user_agent, ip)
    VALUES (?, ?, ?, ?)
  `).run(linkId, referrer || 'direct', userAgent || 'unknown', ip || 'unknown');

  db.prepare(`
    UPDATE links
    SET click_count = click_count + 1
    WHERE id = ?
  `).run(linkId);

  return true;
}

function getLinkAnalytics(linkId) {
  const link = getLinkById(linkId);
  const events = db.prepare(`
    SELECT timestamp, referrer, user_agent
    FROM click_events
    WHERE link_id = ?
    ORDER BY timestamp ASC
  `).all(linkId);

  const clicksByDay = {};
  const referrerMap = {};
  const deviceMap = { Mobile: 0, Desktop: 0, Tablet: 0 };

  events.forEach((event) => {
    const day = new Date(event.timestamp).toISOString().slice(0, 10);
    clicksByDay[day] = (clicksByDay[day] || 0) + 1;

    const referrer = (event.referrer || 'direct').toLowerCase();
    if (referrer.includes('twitter')) {
      referrerMap.Twitter = (referrerMap.Twitter || 0) + 1;
    } else if (referrer.includes('linkedin')) {
      referrerMap.LinkedIn = (referrerMap.LinkedIn || 0) + 1;
    } else {
      referrerMap.Direct = (referrerMap.Direct || 0) + 1;
    }

    const ua = (event.user_agent || '').toLowerCase();
    if (ua.includes('mobile')) {
      deviceMap.Mobile += 1;
    } else if (ua.includes('tablet')) {
      deviceMap.Tablet += 1;
    } else {
      deviceMap.Desktop += 1;
    }
  });

  const labelData = Object.keys(clicksByDay).sort().slice(-7);
  const trend = labelData.map((date) => ({
    date,
    count: clicksByDay[date],
  }));

  return {
    total_clicks: link?.click_count || 0,
    click_trend: trend,
    referrers: Object.entries(referrerMap).map(([name, value]) => ({ name, value })),
    devices: Object.entries(deviceMap)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value })),
  };
}

module.exports = {
  initDatabase,
  createLinkRecord,
  getLinks,
  getLinkByCode,
  getLinkById,
  getLinkAnalytics,
  recordClick,
};
