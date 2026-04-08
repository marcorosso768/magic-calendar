const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Calendars
  calSave:   (key, data) => ipcRenderer.invoke('cal:save',   { key, data }),
  calLoad:   (key)       => ipcRenderer.invoke('cal:load',   { key }),
  calList:   ()          => ipcRenderer.invoke('cal:list'),
  calDelete: (key)       => ipcRenderer.invoke('cal:delete', { key }),
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
  // Shell
  openLink:  (url)   => ipcRenderer.invoke('shell:open', url),
  // Dock icon (macOS) — sincronizza con il tema effettivo dell'app
  setDockDark: (isDark) => ipcRenderer.send('dock:set-dark', isDark),
});
