const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Calendars
  calSave:   (key, data) => ipcRenderer.invoke('cal:save',   { key, data }),
  calLoad:   (key)       => ipcRenderer.invoke('cal:load',   { key }),
  calList:   ()          => ipcRenderer.invoke('cal:list'),
  calCreate: (key, data) => ipcRenderer.invoke('cal:create', { key, data }),
  calDelete: (key)       => ipcRenderer.invoke('cal:delete', { key }),

  // Weekly plans and routine (own file, shared by all calendars)
  weeklyLoad: ()     => ipcRenderer.invoke('weekly:load'),
  weeklySave: (data) => ipcRenderer.invoke('weekly:save', data),

  // Settings
  settingsSave: (s)  => ipcRenderer.invoke('settings:save', s),
  settingsLoad: ()   => ipcRenderer.invoke('settings:load'),

  // App metadata / menu
  appInfo:    ()     => ipcRenderer.invoke('app:info'),
  onOpenSettings: (callback) => ipcRenderer.on('menu:open-settings', () => callback()),

  // Images
  imagePick:   ()        => ipcRenderer.invoke('image:pick'),
  imageList:   ()        => ipcRenderer.invoke('image:list'),
  imageDelete: (url)     => ipcRenderer.invoke('image:delete', { url }),

  // PDF
  pdfExport: (html, name, landscape) => ipcRenderer.invoke('pdf:export', { html, filename: name, landscape }),

  // Shell (URL scheme validated in main)
  openLink:  (url)   => ipcRenderer.invoke('shell:open', url),

  // Dock / window icon (macOS + Windows) — renderer is the source of truth
  // for the effective app theme (light/dark/auto resolved against the OS).
  setDockDark: (isDark) => ipcRenderer.send('dock:set-dark', isDark),
  refreshMenu: ()       => ipcRenderer.send('menu:refresh'),

  // Auto-update
  checkForUpdates: ()                 => ipcRenderer.invoke('update:check'),
  onUpdateDownloading: (cb)           => ipcRenderer.on('update:downloading', () => cb()),
  onUpdateProgress: (cb)              => ipcRenderer.on('update:progress', (_e, p) => cb(p)),
  onUpdateDownloaded: (cb)            => ipcRenderer.on('update:downloaded', (_e, info) => cb(info)),
  onUpdateFailed: (cb)                => ipcRenderer.on('update:failed', () => cb()),
});
