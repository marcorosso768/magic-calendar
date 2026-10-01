const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, Menu, nativeImage, protocol, net } = require('electron');
app.setName('Magic Calendar');
const path = require('path');
const fs   = require('fs');
const { pathToFileURL } = require('url');
const { autoUpdater } = require('electron-updater');
const store = require('./fs-store');
const macUpdater = require('./mac-updater');

// Images are referenced as mcimg://local/<file name> and served from userData/images, so stored
// calendars do not depend on absolute paths (user name, OS, app folder).
protocol.registerSchemesAsPrivileged([
  { scheme: 'mcimg', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
]);

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
    // PNG, not .icns: nativeImage only reads PNG/JPEG (and ICO on Windows), an .icns gives an
    // empty image and the Dock kept the light icon.
    const iconPath = iconResourcePath('png', variant);
    if (!fs.existsSync(iconPath)) { console.warn(`[dock] icon not found: ${iconPath}`); return; }
    const image = nativeImage.createFromPath(iconPath);
    if (image.isEmpty()) { console.warn(`[dock] cannot read ${iconPath}`); return; }
    app.dock.setIcon(image);
  } catch (err) {
    console.warn('[dock] update failed:', err);
  }
}

function setWindowIconWin(isDark) {
  if (process.platform !== 'win32' || !mainWindow || mainWindow.isDestroyed()) return;
  try {
    const variant = isDark ? 'dark' : 'light';
    const iconPath = iconResourcePath('png', variant);
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
          label: T('menuCheckUpdates'),
          click: () => checkForUpdatesInteractive(true)
        },
        { type: 'separator' },
        {
          label: T('menuSettings'),
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
          label: T('menuSettings'),
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
          label: T('menuCheckUpdates'),
          click: () => checkForUpdatesInteractive(true)
        }] : []),
        {
          label: T('menuHomepage'),
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
      // webSecurity on; images come through the mcimg:// protocol.
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // The window only ever shows the app: no pop-ups, no navigation away from index.html.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (e) => e.preventDefault());

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
// UI language for native dialogs and menus (same rule as the renderer: it or en)
// ──────────────────────────────────────────────────────────────
const MAIN_STRINGS = {
  it: {
    menuCheckUpdates: 'Controlla aggiornamenti…', menuSettings: 'Impostazioni…', menuHomepage: 'Pagina del progetto',
    devOnly: 'Gli aggiornamenti si controllano solo nella versione installata.',
    upToDate: (v) => `Magic Calendar ${v} è aggiornato.`,
    checkFailed: 'Impossibile controllare gli aggiornamenti', checkFailedMsg: 'Non è stato possibile controllare gli aggiornamenti in questo momento.',
    updateAvailable: 'Aggiornamento disponibile', updateAvailableMsg: (v) => `È disponibile Magic Calendar ${v}`,
    youHave: (v) => `Versione installata: ${v}.`,
    install: 'Installa aggiornamento', later: 'Più tardi',
    readyTitle: 'Aggiornamento pronto', readyMsg: (v) => `Magic Calendar ${v} è pronto.`,
    readyDetail: 'Riavvia ora per completare l’aggiornamento. Se scegli più tardi, verrà installato alla chiusura dell’app.',
    restartNow: 'Riavvia ora',
    manualTitle: 'Aggiornamento manuale', manualMsg: 'Non è stato possibile installare l’aggiornamento automaticamente.',
    manualDetail: 'Scarica la nuova versione dalla pagina delle release e sostituisci l’app in Applicazioni.',
    manualDetailDmg: 'L’app è aperta dall’immagine disco o da una cartella temporanea: spostala in Applicazioni per ricevere gli aggiornamenti automatici. Intanto puoi scaricare la nuova versione dalla pagina delle release.',
    openReleases: 'Apri la pagina delle release', close: 'Chiudi',
    savePdf: 'Salva PDF', chooseImage: 'Scegli un’immagine', images: 'Immagini',
  },
  en: {
    menuCheckUpdates: 'Check for Updates…', menuSettings: 'Settings…', menuHomepage: 'Project Homepage',
    devOnly: 'Updates are only checked in the installed app.',
    upToDate: (v) => `Magic Calendar ${v} is up to date.`,
    checkFailed: 'Update check failed', checkFailedMsg: 'Could not check for updates right now.',
    updateAvailable: 'Update available', updateAvailableMsg: (v) => `Magic Calendar ${v} is available`,
    youHave: (v) => `You have version ${v}.`,
    install: 'Install update', later: 'Later',
    readyTitle: 'Update ready', readyMsg: (v) => `Magic Calendar ${v} is ready.`,
    readyDetail: 'Restart now to finish updating. If you choose later, it will be installed when you quit the app.',
    restartNow: 'Restart now',
    manualTitle: 'Manual update', manualMsg: 'The update could not be installed automatically.',
    manualDetail: 'Download the new version from the releases page and replace the app in Applications.',
    manualDetailDmg: 'The app is running from the disk image or a temporary folder: move it to Applications to get automatic updates. Meanwhile you can download the new version from the releases page.',
    openReleases: 'Open Releases Page', close: 'Close',
    savePdf: 'Save PDF', chooseImage: 'Choose an image', images: 'Images',
  },
};

function uiLang() {
  let pref = 'auto';
  try { pref = (store.readJsonSafe(settingsF) || {}).language || 'auto'; } catch (_) {}
  const code = (pref !== 'auto' ? pref : (app.getLocale() || 'it')).slice(0, 2).toLowerCase();
  return code === 'en' ? 'en' : 'it';
}

function T(key, ...args) {
  const v = MAIN_STRINGS[uiLang()][key];
  return typeof v === 'function' ? v(...args) : v;
}

// ──────────────────────────────────────────────────────────────
// Auto-update
//   Check: electron-updater reads latest.yml / latest-mac.yml from the GitHub release.
//   Windows: electron-updater downloads and installs the NSIS update.
//   macOS: the app is not signed with a Developer ID, so Squirrel.Mac would refuse the update;
//          mac-updater.js downloads the zip, verifies it and swaps the app bundle itself.
// ──────────────────────────────────────────────────────────────
autoUpdater.autoDownload         = false;   // ask first
autoUpdater.autoInstallOnAppQuit = process.platform !== 'darwin';
autoUpdater.allowPrerelease      = false;
autoUpdater.fullChangelog        = false;
autoUpdater.logger = { info: () => {}, warn: console.warn, error: console.error, debug: () => {} };

let _updateBusy = false;          // a prompt or a download is in progress
let _pendingMacInstaller = null;  // mac update downloaded and ready: runs when the app quits
let _pendingMacVersion = null;
let _pendingRelaunch = false;     // "Restart now" reopens the app after the swap, "Later" does not

function releasePageUrl() {
  return 'https://github.com/marcorosso768/magic-calendar/releases/latest';
}

async function offerManualDownload(detail) {
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    title: T('manualTitle'),
    message: T('manualMsg'),
    detail,
    buttons: [T('openReleases'), T('close')],
    defaultId: 0,
    cancelId: 1
  });
  if (response === 0) shell.openExternal(releasePageUrl());
}

async function checkForUpdatesInteractive(userInitiated) {
  if (!app.isPackaged) {
    if (userInitiated) {
      dialog.showMessageBox(mainWindow, { type: 'info', message: T('devOnly'), buttons: ['OK'] });
    }
    return;
  }
  if (_updateBusy) return;
  try {
    const result = await autoUpdater.checkForUpdates();
    if (userInitiated && (!result || !result.isUpdateAvailable)) {
      dialog.showMessageBox(mainWindow, { type: 'info', message: T('upToDate', app.getVersion()), buttons: ['OK'] });
    }
  } catch (err) {
    if (userInitiated) {
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: T('checkFailed'),
        message: T('checkFailedMsg'),
        detail: err && err.message ? err.message : String(err),
        buttons: [T('openReleases'), T('close')],
        defaultId: 0,
        cancelId: 1
      });
      if (response === 0) shell.openExternal(releasePageUrl());
    }
  }
}

function releaseNotesText(info) {
  if (!info.releaseNotes) return T('youHave', app.getVersion());
  const notes = Array.isArray(info.releaseNotes)
    ? info.releaseNotes.map(n => n.note || '').join('\n')
    : String(info.releaseNotes);
  // Release notes are Markdown (build-resources/release-notes.md): shown as plain text in the dialog.
  const plain = notes
    .replace(/<[^>]+>/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return plain.slice(0, 800) || T('youHave', app.getVersion());
}

async function installMacUpdate(info) {
  // Already downloaded earlier (user chose "Later"): no second download.
  if (!_pendingMacInstaller || _pendingMacVersion !== info.version) {
    sendToRenderer('update:downloading');
    try {
      _pendingMacInstaller = await macUpdater.prepareUpdate({
        fetchImpl: (url) => net.fetch(url),
        info,
        arch: process.arch,
        execPath: process.execPath,
        workRoot: updatesDir,
        onProgress: (p) => sendToRenderer('update:progress', { percent: Math.round(p.percent || 0), transferred: p.transferred, total: p.total })
      });
      _pendingMacVersion = info.version;
    } catch (err) {
      console.warn('[updater] mac self-install unavailable:', err && err.message);
      sendToRenderer('update:failed');
      const blocked = err && ['translocated', 'running-from-dmg', 'not-a-bundle'].includes(err.code);
      await offerManualDownload(blocked ? T('manualDetailDmg') : `${T('manualDetail')}\n\n${err && err.message ? err.message : ''}`.trim());
      return;
    }
  }
  sendToRenderer('update:downloaded', { version: info.version });
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: T('readyTitle'),
    message: T('readyMsg', info.version),
    detail: T('readyDetail'),
    buttons: [T('restartNow'), T('later')],
    defaultId: 0,
    cancelId: 1
  });
  _pendingRelaunch = response === 0;
  if (_pendingRelaunch) app.quit();   // the installer starts in 'will-quit'
}

autoUpdater.on('update-available', async (info) => {
  if (_updateBusy) return;
  _updateBusy = true;
  try {
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: T('updateAvailable'),
      message: T('updateAvailableMsg', info.version),
      detail: releaseNotesText(info),
      buttons: [T('install'), T('later')],
      defaultId: 0,
      cancelId: 1
    });
    if (response !== 0) return;

    if (process.platform === 'darwin') {
      await installMacUpdate(info);
      return;
    }
    sendToRenderer('update:downloading');
    try {
      await autoUpdater.downloadUpdate();   // continues in 'update-downloaded'
    } catch (err) {
      console.warn('[updater] downloadUpdate failed:', err);
      sendToRenderer('update:failed');
      await offerManualDownload(T('manualDetail'));
    }
  } finally {
    _updateBusy = false;
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

// Windows only (macOS never calls downloadUpdate)
autoUpdater.on('update-downloaded', async (info) => {
  sendToRenderer('update:downloaded', { version: info.version });
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: T('readyTitle'),
    message: T('readyMsg', info.version),
    detail: T('readyDetail'),
    buttons: [T('restartNow'), T('later')],
    defaultId: 0,
    cancelId: 1
  });
  if (response === 0) setImmediate(() => autoUpdater.quitAndInstall());
});

autoUpdater.on('error', (err) => {
  console.warn('[updater] error:', err && err.message ? err.message : err);
});

app.on('will-quit', () => {
  if (_pendingMacInstaller) {
    const run = _pendingMacInstaller;
    _pendingMacInstaller = null;
    try {
      // Remembered so the next launch can tell whether the update really happened.
      fs.writeFileSync(path.join(updatesDir, 'pending.json'), JSON.stringify({ version: _pendingMacVersion }));
      run({ relaunch: _pendingRelaunch });
    } catch (err) { console.warn('[updater] cannot start installer:', err); }
  }
});

// macOS, at startup: remove leftovers of earlier updates; if an update was due but the app is still
// the old version (the swap failed), offer the manual download.
function checkPreviousMacUpdate() {
  if (process.platform !== 'darwin' || !app.isPackaged) return;
  macUpdater.cleanup({ execPath: process.execPath, workRoot: updatesDir });
  const pendingF = path.join(updatesDir, 'pending.json');
  let pending = null;
  try { pending = JSON.parse(fs.readFileSync(pendingF, 'utf8')); } catch (_) {}
  try { fs.unlinkSync(pendingF); } catch (_) {}
  if (pending && pending.version && macUpdater.isNewer(pending.version, app.getVersion())) {
    setTimeout(() => offerManualDownload(T('manualDetail')), 3000);
  }
}

// ──────────────────────────────────────────────────────────────
// Theme — single source of truth is the renderer (it already
// resolves the user's light/dark/auto preference against the OS).
// ──────────────────────────────────────────────────────────────
ipcMain.on('dock:set-dark', (_, isDark) => applyThemedIcon(!!isDark));
// Menu labels follow the UI language: rebuilt when the language changes in Settings.
ipcMain.on('menu:refresh', () => buildAppMenu());

// ──────────────────────────────────────────────────────────────
// App lifecycle
// ──────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  protocol.handle('mcimg', (request) => {
    const name = store.imageNameFromUrl(new URL(request.url).pathname);
    const file = path.join(imagesDir, name);
    if (!store.isValidImageName(name) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      return new Response('Not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(file).toString());
  });

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

  checkPreviousMacUpdate();
  // Automatic update check shortly after launch.
  setTimeout(() => checkForUpdatesInteractive(false), 4000);
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ──────────────────────────────────────────────────────────────
// Persisted state on disk (atomic writes, backups, validated keys: see fs-store.js)
// ──────────────────────────────────────────────────────────────
const userData  = app.getPath('userData');
const dataDir   = path.join(userData, 'calendari');
const imagesDir = path.join(userData, 'images');
const settingsF = path.join(userData, 'settings.json');
const weeklyF   = path.join(userData, 'weekly.json');
const updatesDir = path.join(userData, 'updates');   // mac self-update work folders and log
[dataDir, imagesDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

function calFile(key) {
  if (!store.isValidKey(key)) throw new Error(`invalid calendar key: ${key}`);
  return path.join(dataDir, `${key}.json`);
}

function listCalendarKeys() {
  return fs.readdirSync(dataDir).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).filter(store.isValidKey);
}

ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  name: app.getName(),
  platform: process.platform,
  isPackaged: app.isPackaged,
}));

ipcMain.handle('cal:save',   (_, { key, data }) => { store.writeJsonAtomic(calFile(key), data); return { ok: true }; });
ipcMain.handle('cal:load',   (_, { key })      => store.readJsonSafe(calFile(key)));
ipcMain.handle('cal:list',   ()                => listCalendarKeys());
// New calendar: fails if a file with that name exists (also on case-insensitive disks: macOS, Windows).
ipcMain.handle('cal:create', (_, { key, data }) => {
  const f = calFile(key);
  try { fs.closeSync(fs.openSync(f, 'wx')); } catch (err) { if (err.code === 'EEXIST') return { ok: false, exists: true }; throw err; }
  store.writeJsonAtomic(f, data);
  return { ok: true };
});
ipcMain.handle('cal:delete', (_, { key })      => {
  const f = calFile(key);
  for (const x of [f, `${f}.bak`]) if (fs.existsSync(x)) fs.unlinkSync(x);
  return { ok: true };
});
ipcMain.handle('settings:save', (_, s) => { store.writeJsonAtomic(settingsF, s); return { ok: true }; });
ipcMain.handle('settings:load', ()    => store.readJsonSafe(settingsF));

// Weekly data (week plans and the routine) lives in its own file, independent of the monthly
// calendars. Older versions kept it inside each calendar: on first load it is merged from there.
ipcMain.handle('weekly:load', () => {
  // weekly.json (or its backup) exists: never rebuild it from old data, even if it is unreadable.
  if (fs.existsSync(weeklyF) || fs.existsSync(`${weeklyF}.bak`)) return store.readJsonSafe(weeklyF) || {};
  const merged = {};
  for (const key of listCalendarKeys()) {
    const cal = store.readJsonSafe(path.join(dataDir, `${key}.json`));
    const wd = cal && cal.weeklyData;
    if (!wd || typeof wd !== 'object') continue;
    for (const [wk, block] of Object.entries(wd)) {
      merged[wk] = merged[wk] || { slots: {} };
      Object.assign(merged[wk].slots, (block && block.slots) || {});
    }
  }
  if (Object.keys(merged).length) store.writeJsonAtomic(weeklyF, merged);
  return merged;
});
ipcMain.handle('weekly:save', (_, data) => { store.writeJsonAtomic(weeklyF, data || {}); return { ok: true }; });

// Manual update check from a Settings-UI button, if desired.
ipcMain.handle('update:check', () => checkForUpdatesInteractive(true));

ipcMain.handle('image:pick', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: T('chooseImage'),
    properties: ['openFile'],
    filters: [{ name: T('images'), extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] }]
  });
  if (result.canceled || !result.filePaths.length) return null;
  const src  = result.filePaths[0];
  const ext  = path.extname(src).toLowerCase();
  const name = `img_${Date.now()}${ext}`;
  fs.copyFileSync(src, path.join(imagesDir, name));
  return store.imageUrl(name);
});

ipcMain.handle('image:delete', (_, { url }) => {
  const name = store.imageNameFromUrl(url);
  if (!store.isValidImageName(name)) return { ok: false };
  const f = path.join(imagesDir, name);
  if (fs.existsSync(f) && fs.statSync(f).isFile()) fs.unlinkSync(f);
  return { ok: true };
});

ipcMain.handle('image:list', () => {
  if (!fs.existsSync(imagesDir)) return [];
  return fs.readdirSync(imagesDir)
    .filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f))
    .map(f => ({ f, t: fs.statSync(path.join(imagesDir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)
    .map(({ f }) => store.imageUrl(f));
});

// ──────────────────────────────────────────────────────────────
// PDF export
//   The page is written to a temporary file (a data: URL has an opaque origin and cannot load the
//   app's fonts), uses the bundled Nunito font (works offline), and waits for fonts and images.
// ──────────────────────────────────────────────────────────────
const FONTS_URL = pathToFileURL(path.join(__dirname, 'fonts')).toString() + '/';

ipcMain.handle('pdf:export', async (_, { html, filename, landscape }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: T('savePdf'),
    defaultPath: path.join(app.getPath('downloads'), `${filename}.pdf`),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (result.canceled) return { ok: false };

  const isLandscape = !!landscape;
  const tmpHtml = path.join(app.getPath('temp'), `magic-calendar-print-${Date.now()}.html`);
  fs.writeFileSync(tmpHtml, String(html).split('__FONT_BASE__').join(FONTS_URL));

  const printWin = new BrowserWindow({
    width:  isLandscape ? 1123 : 794,
    height: isLandscape ? 794  : 1123,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true }
  });

  try {
    await printWin.loadFile(tmpHtml);

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
        await new Promise(r => requestAnimationFrame(() => r(null)));
        return true;
      })();
    `, true);

    const data = await printWin.webContents.printToPDF({
      landscape: isLandscape,
      printBackground: true,
      preferCSSPageSize: true,          // @page size A4 + margin 0 from the page CSS
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    fs.writeFileSync(result.filePath, data);
    shell.openPath(result.filePath);
    return { ok: true, path: result.filePath };
  } catch (err) {
    console.warn('[pdf:export] failed:', err);
    return { ok: false, error: err && err.message ? err.message : String(err) };
  } finally {
    if (!printWin.isDestroyed()) printWin.close();
    try { fs.unlinkSync(tmpHtml); } catch (_) {}
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
