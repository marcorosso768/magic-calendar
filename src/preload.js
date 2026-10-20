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
  icsExport: (text, name, open) => ipcRenderer.invoke('ics:export', { text, filename: name, open }),

  // Shell (URL scheme validated in main)
  openLink:  (url)   => ipcRenderer.invoke('shell:open', url),

  // Dock (macOS) / window (Windows) icon: the renderer resolves the effective theme.
  setDockDark: (isDark) => ipcRenderer.send('dock:set-dark', isDark),
  refreshMenu: ()       => ipcRenderer.send('menu:refresh'),

  // Backup of all data to one file, and restore (the window reloads after a restore)
  backupExport: () => ipcRenderer.invoke('backup:export'),
  backupImport: () => ipcRenderer.invoke('backup:import'),

  // Auto-update (the update window is drawn by the main process: see panels/)
  checkForUpdates: ()                 => ipcRenderer.invoke('update:check'),

  // Edit menu: Undo / Redo of day changes (text fields keep their own undo)
  onMenuUndo: (cb) => ipcRenderer.on('menu:undo', () => cb()),
  onMenuRedo: (cb) => ipcRenderer.on('menu:redo', () => cb()),
  onMenuWhatsNew: (cb) => ipcRenderer.on('menu:whats-new', () => cb()),
});
