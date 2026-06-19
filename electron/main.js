const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const API_BASE = 'http://localhost:3001';
let win;

function getUserDataPath() {
  return path.join(app.getPath('userData'), 'musiclens-user.json');
}

function loadUser() {
  try {
    const data = JSON.parse(fs.readFileSync(getUserDataPath(), 'utf8'));
    return data.user || null;
  } catch { return null; }
}

function saveUser(user) {
  fs.writeFileSync(getUserDataPath(), JSON.stringify({ user }));
}

function createWidget() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: 340,
    height: 200,
    x: screenW - 360,
    y: screenH - 220,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('widget.html');

  if (process.argv.includes('--dev')) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  let pollInterval = null;

  function startPolling(user) {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/now-playing?user=${encodeURIComponent(user)}`);
        const data = await res.json();
        if (!win.isDestroyed()) win.webContents.send('now-playing', data);
      } catch { /* backend not running yet */ }
    }, 5000);
  }

  // Send saved user to renderer once it's ready
  win.webContents.on('did-finish-load', () => {
    const user = loadUser();
    win.webContents.send('init-user', user);
    if (user) startPolling(user);
  });

  ipcMain.on('user-set', (_event, user) => {
    saveUser(user);
    startPolling(user);
  });

  ipcMain.on('user-clear', () => {
    if (pollInterval) clearInterval(pollInterval);
    try { fs.unlinkSync(getUserDataPath()); } catch {}
  });

  win.on('closed', () => {
    if (pollInterval) clearInterval(pollInterval);
  });
}

app.whenReady().then(createWidget);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('fetch-insight', async (_event, { user, track, artist, album }) => {
  const res = await fetch(`${API_BASE}/insight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, track, artist, album }),
  });
  return res.json();
});

ipcMain.handle('fetch-recent', async (_event, user) => {
  const res = await fetch(`${API_BASE}/recent?user=${encodeURIComponent(user)}&limit=5`);
  return res.json();
});

ipcMain.handle('fetch-users', async () => {
  const res = await fetch(`${API_BASE}/users`);
  return res.json();
});

ipcMain.on('close-widget', () => win?.close());
