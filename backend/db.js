const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'musiclens.json');

function load() {
  if (!fs.existsSync(DB_PATH)) return { users: {} };
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return { users: {} }; }
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function ensureUser(db, user) {
  if (!db.users[user]) db.users[user] = { tokens: null, insights: [] };
}

function saveTokens(user, tokens) {
  const db = load();
  ensureUser(db, user);
  db.users[user].tokens = { ...db.users[user].tokens, ...tokens, updated_at: Date.now() };
  save(db);
}

function getTokens(user) {
  return load().users[user]?.tokens || null;
}

function getUsers() {
  return Object.keys(load().users);
}

function saveInsight(user, { track, artist, insight }) {
  const db = load();
  ensureUser(db, user);
  db.users[user].insights.unshift({ id: Date.now(), track, artist, insight, created_at: Date.now() });
  if (db.users[user].insights.length > 200) db.users[user].insights = db.users[user].insights.slice(0, 200);
  save(db);
}

function getInsightHistory(user, limit = 20) {
  return (load().users[user]?.insights || []).slice(0, Number(limit));
}

module.exports = { saveTokens, getTokens, getUsers, saveInsight, getInsightHistory };
