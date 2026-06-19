const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('musiclens', {
  onInitUser: (cb) => ipcRenderer.on('init-user', (_e, user) => cb(user)),
  onNowPlaying: (cb) => ipcRenderer.on('now-playing', (_e, data) => cb(data)),
  setUser: (user) => ipcRenderer.send('user-set', user),
  clearUser: () => ipcRenderer.send('user-clear'),
  fetchInsight: (payload) => ipcRenderer.invoke('fetch-insight', payload),
  fetchRecent: (user) => ipcRenderer.invoke('fetch-recent', user),
  fetchUsers: () => ipcRenderer.invoke('fetch-users'),
  close: () => ipcRenderer.send('close-widget'),
});
