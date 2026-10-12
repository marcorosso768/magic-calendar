// Preload for the small windows (update, about): a narrow bridge to the main process.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('panel', {
  init:     ()       => ipcRenderer.invoke('panel:init'),
  action:   (id)     => ipcRenderer.send('panel:action', id),
  resize:   (height) => ipcRenderer.send('panel:resize', height),
  openLink: (url)    => ipcRenderer.invoke('shell:open', url),
  onState:  (cb)     => ipcRenderer.on('panel:state', (_e, s) => cb(s)),
  onTheme:  (cb)     => ipcRenderer.on('panel:theme', (_e, dark) => cb(dark)),
});
