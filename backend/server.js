require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { getCurrentTrack, getRecentTracks, getSpotifyAuthUrl, exchangeCode, refreshToken } = require('./spotify');
const { getTrackInsight, getArtistProfile } = require('./anthropic');
const { recognizeSong } = require('./audd');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Auth ---
// Visit /auth?user=maria to connect a Spotify account under that name
app.get('/auth', (req, res) => {
  const user = req.query.user?.trim();
  if (!user) return res.status(400).send('Missing ?user= param. Example: /auth?user=maria');
  res.redirect(getSpotifyAuthUrl(user));
});

app.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).json({ error: 'Missing code or state' });
  const user = Buffer.from(state, 'base64').toString('utf8');
  if (!user) return res.status(400).json({ error: 'Invalid state' });
  try {
    const tokens = await exchangeCode(code);
    db.saveTokens(user, tokens);
    res.send(`<html><body style="background:#0a0a0a;color:#ff2d2d;font-family:monospace;padding:40px">
      <h2>✓ ${user} connected.</h2><p>You can close this tab.</p>
    </body></html>`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users', (req, res) => {
  res.json(db.getUsers());
});

// --- Helpers ---
async function withUser(req, res, fn) {
  const user = req.query.user?.trim() || req.body?.user?.trim();
  if (!user) return res.status(400).json({ error: 'Missing ?user= param' });
  const tokens = db.getTokens(user);
  if (!tokens) return res.status(401).json({ error: `${user} not authenticated. Visit /auth?user=${user}` });
  try {
    const refreshed = await refreshToken(tokens.refresh_token);
    db.saveTokens(user, { ...tokens, ...refreshed });
    await fn(user, refreshed.access_token);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// --- Spotify ---
app.get('/now-playing', (req, res) => {
  withUser(req, res, async (user, token) => {
    const track = await getCurrentTrack(token);
    res.json({ user, ...track });
  });
});

app.get('/recent', (req, res) => {
  withUser(req, res, async (user, token) => {
    const tracks = await getRecentTracks(token, req.query.limit || 10);
    res.json({ user, tracks });
  });
});

// --- AI Insight ---
app.post('/insight', async (req, res) => {
  const { track, artist, album, mode } = req.body;
  if (!track || !artist) return res.status(400).json({ error: 'track and artist required' });
  const user = req.body.user?.trim() || 'anonymous';
  try {
    const insight = await getTrackInsight({ track, artist, album, mode });
    db.saveInsight(user, { track, artist, insight, mode });
    res.json({ insight });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/insight/history', (req, res) => {
  const user = req.query.user?.trim();
  if (!user) return res.status(400).json({ error: 'Missing ?user= param' });
  res.json(db.getInsightHistory(user, req.query.limit || 20));
});

// --- AudD Recognition ---
app.post('/recognize', async (req, res) => {
  const { audio_url, audio_data } = req.body;
  if (!audio_url && !audio_data) return res.status(400).json({ error: 'audio_url or audio_data required' });
  try {
    const result = await recognizeSong({ audio_url, audio_data });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Artist Profile ---
app.get('/artist', async (req, res) => {
  const { artist, track, album } = req.query;
  if (!artist) return res.status(400).json({ error: 'artist required' });
  try {
    const profile = await getArtistProfile({ artist, track, album });
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Health ---
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.listen(PORT, () => {
  console.log(`[musiclens] backend running on http://localhost:${PORT}`);
  console.log(`  Connect accounts at: /auth?user=yourname`);
});
