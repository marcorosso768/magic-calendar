const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, Menu, nativeImage } = require('electron');
app.setName('Magic Calendar');
const path = require('path');
const fs   = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;

// ──────────────────────────────────────────────────────────────
// Icon resources — theme-aware Dock (macOS) and window (Windows)
// ──────────────────────────────────────────────────────────────
function iconResourcePath(ext, variant) {
  const base = app.isPackaged
    ? process.resourcesPath
    : path.join(app.getAppPath(), 'build-resources');
  return path.join(base, `icon-${variant}.${ext}`);
}

function setDockIcon(isDark) {
  if (process.platform !== 'darwin' || !app.dock) return;
  try {
    const variant = isDark ? 'dark' : 'light';
    const iconPath = iconResourcePath('icns', variant);
    if (!fs.existsSync(iconPath)) { console.warn(`[dock] icon not found: ${iconPath}`); return; }
    const image = nativeImage.createFromPath(iconPath);
    if (!image.isEmpty()) app.dock.setIcon(image);
  } catch (err) {
    console.warn('[dock] update failed:', err);
  }
}

function setWindowIconWin(isDark) {
  if (process.platform !== 'win32' || !mainWindow || mainWindow.isDestroyed()) return;
  try {
    const variant = isDark ? 'dark' : 'light';
    const iconPath = iconResourcePath('ico', variant);
    if (!fs.existsSync(iconPath)) return; // graceful: keep the default .ico
    const image = nativeImage.createFromPath(iconPath);
    if (!image.isEmpty()) mainWindow.setIcon(image);
  } catch (err) {
    console.warn('[win-icon] update failed:', err);
  }
}

function applyThemedIcon(isDark) {
  setDockIcon(isDark);
  setWindowIconWin(isDark);
}

function sendToRenderer(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

// ──────────────────────────────────────────────────────────────
// Application menu
// ──────────────────────────────────────────────────────────────
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
          label: 'Check for Updates…',
          click: () => checkForUpdatesInteractive(true)
        },
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
    {
      role: 'help',
      submenu: [
        ...(!isMac ? [{
          label: 'Check for Updates…',
          click: () => checkForUpdatesInteractive(true)
        }] : []),
        {
          label: 'Project Homepage',
          click: () => shell.openExternal('https://github.com/marcorosso768/magic-calendar')
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ──────────────────────────────────────────────────────────────
// Window
// ──────────────────────────────────────────────────────────────
function createWindow() {
  const isMac = process.platform === 'darwin';
  const isWin = process.platform === 'win32';

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 960,
    minHeight: 680,
    show: false,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 14, y: 16 } : undefined,

    // macOS — Liquid Glass friendly: let AppKit paint the chrome.
    // No `transparent: true` (which kills the system-drawn glass border).
    ...(isMac ? {
      vibrancy: 'fullscreen-ui',       // resolves to Liquid Glass on macOS 26+,
                                       // falls back gracefully on 14/15.
      visualEffectState: 'followsWindowActiveState',
      backgroundColor: '#00000000',    // RGBA-transparent fill; chrome is still drawn
      roundedCorners: true
    } : {}),

    // Windows 11 — Mica gives the analogous translucent-border treatment.
    ...(isWin ? {
      backgroundMaterial: 'mica',
      backgroundColor: '#140f20'
    } : {}),

    // Linux / fallback
    ...(!isMac && !isWin ? { backgroundColor: '#140f20' } : {}),

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // webSecurity kept ON by default; local file:// still works for renderer assets.
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Primary path — show when the renderer is ready.
  mainWindow.once('ready-to-show', () => { if (!mainWindow.isDestroyed()) mainWindow.show(); });

  // Safety fallback: force-show after 3 s so the user never sees a blank window
  // if `ready-to-show` never fires (can happen with vibrancy on some hardware).
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 3000);
}

// ──────────────────────────────────────────────────────────────
// Auto-update (electron-updater + GitHub releases)
// ──────────────────────────────────────────────────────────────
autoUpdater.autoDownload              = false;   // ask first
autoUpdater.autoInstallOnAppQuit      = true;
autoUpdater.allowPrerelease           = false;
autoUpdater.fullChangelog             = false;
autoUpdater.logger = { info: () => {}, warn: console.warn, error: console.error, debug: () => {} };

function releasePageUrl() {
  return 'https://github.com/marcorosso768/magic-calendar/releases/latest';
}

async function checkForUpdatesInteractive(userInitiated) {
  // In dev, electron-updater does nothing useful and throws.
  if (!app.isPackaged) {
    if (userInitiated) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        message: 'Updates are only checked in the packaged build.',
        buttons: ['OK']
      });
    }
    return;
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    if (userInitiated && result && result.updateInfo && result.updateInfo.version === app.getVersion()) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        message: `Magic Calendar ${app.getVersion()} is up to date.`,
        buttons: ['OK']
      });
    }
  } catch (err) {
    if (userInitiated) {
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Update check failed',
        message: 'Could not check for updates right now.',
        detail: err && err.message ? err.message : String(err),
        buttons: ['Open Releases Page', 'Close'],
        defaultId: 0,
        cancelId: 1
      });
      if (response === 0) shell.openExternal(releasePageUrl());
    }
  }
}

autoUpdater.on('update-available', async (info) => {
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update available',
    message: `Magic Calendar ${info.version} is available`,
    detail: info.releaseNotes
      ? String(info.releaseNotes).replace(/<[^>]+>/g, '').trim().slice(0, 800)
      : `You are on ${app.getVersion()}.`,
    buttons: ['Download now', 'Later'],
    defaultId: 0,
    cancelId: 1
  });
  if (response === 0) {
    sendToRenderer('update:downloading');
    autoUpdater.downloadUpdate().catch(err => {
      console.warn('[updater] downloadUpdate failed:', err);
      // On mac builds without Developer ID the download can fail or the
      // swapped-in app can be blocked by Gatekeeper. Offer a manual path.
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Automatic update failed',
        message: 'Please download the latest version manually.',
        buttons: ['Open Releases Page', 'Close'],
        defaultId: 0,
        cancelId: 1
      }).then(({ response: r }) => { if (r === 0) shell.openExternal(releasePageUrl()); });
    });
  }
});

autoUpdater.on('download-progress', (p) => {
  sendToRenderer('update:progress', {
    percent: Math.round(p.percent || 0),
    transferred: p.transferred,
    total: p.total,
    bytesPerSecond: p.bytesPerSecond
  });
});

autoUpdater.on('update-downloaded', async (info) => {
  sendToRenderer('update:downloaded', { version: info.version });
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update ready',
    message: `Magic Calendar ${info.version} has been downloaded.`,
    detail: 'Restart the application to apply the update now. It will also install automatically next time you quit.',
    buttons: ['Restart now', 'Later'],
    defaultId: 0,
    cancelId: 1
  });
  if (response === 0) setImmediate(() => autoUpdater.quitAndInstall());
});

autoUpdater.on('error', (err) => {
  console.warn('[updater] error:', err && err.message ? err.message : err);
});

// ──────────────────────────────────────────────────────────────
// Theme — single source of truth is the renderer (it already
// resolves the user's light/dark/auto preference against the OS).
// ──────────────────────────────────────────────────────────────
ipcMain.on('dock:set-dark', (_, isDark) => applyThemedIcon(!!isDark));

// ──────────────────────────────────────────────────────────────
// App lifecycle
// ──────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  buildAppMenu();
  // Initial icon — renderer will correct it once SettingsManager resolves.
  applyThemedIcon(nativeTheme.shouldUseDarkColors);

  app.setAboutPanelOptions({
    applicationName: 'Magic Calendar',
    applicationVersion: app.getVersion(),
    copyright: `Copyright © ${new Date().getFullYear()} Marco Rosso`,
    website: 'https://github.com/marcorosso768/magic-calendar'
  });

  // Automatic update check shortly after launch.
  setTimeout(() => checkForUpdatesInteractive(false), 4000);
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ──────────────────────────────────────────────────────────────
// Persisted state on disk
// ──────────────────────────────────────────────────────────────
const userData  = app.getPath('userData');
const dataDir   = path.join(userData, 'calendari');
const imagesDir = path.join(userData, 'images');
const settingsF = path.join(userData, 'settings.json');
[dataDir, imagesDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  name: app.getName(),
  platform: process.platform,
  isPackaged: app.isPackaged,
}));

ipcMain.handle('cal:save',   (_, { key, data }) => { fs.writeFileSync(path.join(dataDir, `${key}.json`), JSON.stringify(data, null, 2)); return { ok: true }; });
ipcMain.handle('cal:load',   (_, { key })      => { const f = path.join(dataDir, `${key}.json`); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; });
ipcMain.handle('cal:list',   ()                => fs.readdirSync(dataDir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')));
ipcMain.handle('cal:delete', (_, { key })      => { const f = path.join(dataDir, `${key}.json`); if (fs.existsSync(f)) fs.unlinkSync(f); return { ok: true }; });
ipcMain.handle('settings:save', (_, s) => { fs.writeFileSync(settingsF, JSON.stringify(s, null, 2)); return { ok: true }; });
ipcMain.handle('settings:load', ()    => fs.existsSync(settingsF) ? JSON.parse(fs.readFileSync(settingsF, 'utf8')) : null);

// Manual update check from a Settings-UI button, if desired.
ipcMain.handle('update:check', () => checkForUpdatesInteractive(true));

ipcMain.handle('image:pick', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Scegli un'immagine",
    properties: ['openFile'],
    filters: [{ name: 'Immagini', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] }]
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

// ──────────────────────────────────────────────────────────────
// PDF export — waits for fonts + images instead of a blind timeout
// ──────────────────────────────────────────────────────────────
ipcMain.handle('pdf:export', async (_, { html, filename, landscape }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Salva PDF',
    defaultPath: path.join(app.getPath('downloads'), `${filename}.pdf`),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (result.canceled) return { ok: false };

  const isLandscape = !!landscape;
  const printWin = new BrowserWindow({
    width:  isLandscape ? 1123 : 794,
    height: isLandscape ? 794  : 1123,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: false }
  });

  try {
    await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    // Wait for fonts + images to actually render before printing.
    await printWin.webContents.executeJavaScript(`
      (async () => {
        try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch(_) {}
        const imgs = Array.from(document.images || []);
        await Promise.all(imgs.map(img =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise(r => { img.addEventListener('load', r, { once:true });
                                 img.addEventListener('error', r, { once:true }); })
        ));
        // One animation frame for layout settle.
        await new Promise(r => requestAnimationFrame(() => r(null)));
        return true;
      })();
    `, true);

    const data = await printWin.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      landscape: isLandscape,
      marginsType: 1
    });
    fs.writeFileSync(result.filePath, data);
    shell.openPath(result.filePath);
    return { ok: true, path: result.filePath };
  } catch (err) {
    console.warn('[pdf:export] failed:', err);
    return { ok: false, error: err && err.message ? err.message : String(err) };
  } finally {
    if (!printWin.isDestroyed()) printWin.close();
  }
});

// ──────────────────────────────────────────────────────────────
// Hardened external-link opener
// ──────────────────────────────────────────────────────────────
const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:']);
ipcMain.handle('shell:open', (_, url) => {
  try {
    const u = new URL(String(url));
    if (!ALLOWED_SCHEMES.has(u.protocol)) {
      console.warn('[shell:open] blocked scheme:', u.protocol);
      return { ok: false, error: 'scheme-not-allowed' };
    }
    shell.openExternal(u.toString());
    return { ok: true };
  } catch (err) {
    console.warn('[shell:open] invalid URL:', err && err.message);
    return { ok: false, error: 'invalid-url' };
  }
});
