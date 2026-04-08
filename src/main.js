const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, Menu, nativeImage } = require('electron');
app.setName('Magic Calendar');
const path = require('path');
const fs   = require('fs');

let mainWindow;

function bundledPath(...segments) {
  return path.join(app.getAppPath(), ...segments);
}

function setDockIcon(isDark) {
  if (process.platform !== 'darwin' || !app.dock) return;
  try {
    const variant = isDark ? 'dark' : 'light';
    const base = app.isPackaged
      ? process.resourcesPath
      : path.join(app.getAppPath(), 'build-resources');
    const iconPath = path.join(base, `icon-${variant}.icns`);
    if (!fs.existsSync(iconPath)) { console.warn(`[dock] icon not found: ${iconPath}`); return; }
    const image = nativeImage.createFromPath(iconPath);
    if (!image.isEmpty()) app.dock.setIcon(image);
  } catch (err) {
    console.warn('[dock] update failed:', err);
  }
}

function updateDockIcon() {
  setDockIcon(nativeTheme.shouldUseDarkColors);
}

function sendToRenderer(channel) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel);
  }
}

function buildAppMenu() {
  const isMac = process.platform === 'darwin';
  const appName = app.name || 'Magic Calendar';

  const template = [
    ...(isMac ? [{
      label: appName,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Settings…',
          accelerator: 'CommandOrControl+,',
          click: () => sendToRenderer('menu:open-settings')
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        ...(isMac ? [] : [{
          label: 'Settings',
          accelerator: 'Ctrl+,',
          click: () => sendToRenderer('menu:open-settings')
        }]),
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 960,
    minHeight: 680,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    ...(process.platform === 'darwin' ? {
      roundedCorners: true,
      backgroundColor: '#00000000',
      transparent: true,
      vibrancy: 'under-window',
      visualEffectState: 'active'
    } : {
      backgroundColor: '#140f20'
    }),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(() => {
  createWindow();
  buildAppMenu();
  updateDockIcon();
  nativeTheme.on('updated', updateDockIcon);

  app.setAboutPanelOptions({
    applicationName: 'Magic Calendar',
    applicationVersion: app.getVersion(),
    copyright: `Copyright © ${new Date().getFullYear()} Marco Rosso`,
    website: 'https://github.com/marcorosso768/magic-calendar'
  });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

const userData  = app.getPath('userData');
const dataDir   = path.join(userData, 'calendari');
const imagesDir = path.join(userData, 'images');
const settingsF = path.join(userData, 'settings.json');
[dataDir, imagesDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive:true }); });

ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  name: app.getName(),
  platform: process.platform,
  isPackaged: app.isPackaged,
}));

ipcMain.handle('cal:save',   (_, {key,data}) => { fs.writeFileSync(path.join(dataDir,`${key}.json`), JSON.stringify(data,null,2)); return {ok:true}; });
ipcMain.handle('cal:load',   (_, {key})      => { const f=path.join(dataDir,`${key}.json`); return fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):null; });
ipcMain.handle('cal:list',   ()              => fs.readdirSync(dataDir).filter(f=>f.endsWith('.json')).map(f=>f.replace('.json','')));
ipcMain.handle('cal:delete', (_, {key})      => { const f=path.join(dataDir,`${key}.json`); if(fs.existsSync(f))fs.unlinkSync(f); return {ok:true}; });
ipcMain.handle('settings:save', (_, s) => { fs.writeFileSync(settingsF, JSON.stringify(s,null,2)); return {ok:true}; });
ipcMain.handle('settings:load', ()    => fs.existsSync(settingsF)?JSON.parse(fs.readFileSync(settingsF,'utf8')):null);

ipcMain.handle('image:pick', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Scegli un\'immagine',
    properties: ['openFile'],
    filters: [{name:'Immagini', extensions:['jpg','jpeg','png','gif','webp','svg']}]
  });
  if (result.canceled || !result.filePaths.length) return null;
  const src  = result.filePaths[0];
  const ext  = path.extname(src);
  const name = `img_${Date.now()}${ext}`;
  const dest = path.join(imagesDir, name);
  fs.copyFileSync(src, dest);
  return `file://${dest}`;
});

ipcMain.handle('image:delete', (_, { url }) => {
  const name = path.basename(url.replace('file://', ''));
  const f = path.join(imagesDir, name);
  if (fs.existsSync(f)) fs.unlinkSync(f);
  return { ok: true };
});

ipcMain.handle('image:list', () => {
  if (!fs.existsSync(imagesDir)) return [];
  return fs.readdirSync(imagesDir)
    .filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f))
    .sort((a, b) => {
      const ta = fs.statSync(path.join(imagesDir, a)).mtimeMs;
      const tb = fs.statSync(path.join(imagesDir, b)).mtimeMs;
      return tb - ta;
    })
    .map(f => `file://${path.join(imagesDir, f)}`);
});

ipcMain.handle('pdf:export', async (_, { html, filename, landscape }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Salva PDF',
    defaultPath: path.join(app.getPath('downloads'), `${filename}.pdf`),
    filters: [{ name:'PDF', extensions:['pdf'] }]
  });
  if (result.canceled) return { ok: false };

  const isLandscape = !!landscape;
  const printWin = new BrowserWindow({
    width: isLandscape ? 1123 : 794,
    height: isLandscape ? 794 : 1123,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true, webSecurity: false }
  });

  await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  await new Promise(r => setTimeout(r, 800));

  const data = await printWin.webContents.printToPDF({
    pageSize: 'A4',
    printBackground: true,
    landscape: isLandscape,
    marginsType: 1
  });

  printWin.close();
  fs.writeFileSync(result.filePath, data);
  shell.openPath(result.filePath);
  return { ok: true, path: result.filePath };
});

ipcMain.handle('shell:open', (_, url) => shell.openExternal(url));

// Dock icon sincronizzato con il tema effettivo dell'app (non solo il sistema)
ipcMain.on('dock:set-dark', (_, isDark) => setDockIcon(isDark));
