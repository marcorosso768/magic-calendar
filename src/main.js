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
// App icon, light/dark
//   App closed: the bundle icon. On macOS 26+ an Icon Composer icon with a light and a dark
//     appearance and Liquid Glass turned off (build-scripts/afterPack.js); older macOS uses icon.icns.
//   App open: the Dock icon follows the app's own theme (Settings: light/dark/auto), also with
//     `npm start`. dock-*.png are complete icons on Apple's grid (824 px shape on a 1024 canvas,
//     with shadow), so they match the size of the other Dock icons.
//   Windows: the window/taskbar icon follows the theme too (icon-*.png).
// ──────────────────────────────────────────────────────────────
function iconResourcePath(name) {
  const base = app.isPackaged
    ? process.resourcesPath
    : path.join(app.getAppPath(), 'build-resources');
  return path.join(base, name);
}

function loadPng(name) {
  // PNG, not .icns: nativeImage cannot read .icns.
  const p = iconResourcePath(name);
  if (!fs.existsSync(p)) { console.warn(`[icon] not found: ${p}`); return null; }
  const image = nativeImage.createFromPath(p);
  if (image.isEmpty()) { console.warn(`[icon] cannot read ${p}`); return null; }
  return image;
}

function applyThemedIcon(isDark) {
  const variant = isDark ? 'dark' : 'light';
  try {
    if (process.platform === 'darwin' && app.dock) {
      const image = loadPng(`dock-${variant}.png`);
      if (image) app.dock.setIcon(image);
    } else if (process.platform === 'win32' && mainWindow && !mainWindow.isDestroyed()) {
      const image = loadPng(`icon-${variant}.png`);
      if (image) mainWindow.setIcon(image);
    }
  } catch (err) {
    console.warn('[icon] update failed:', err);
  }
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
        { label: T('menuAbout'), click: () => openAboutWindow() },
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
        { label: T('menuExportBackup'), click: () => exportBackupInteractive() },
        { label: T('menuImportBackup'), click: () => importBackupInteractive() },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      // Undo/Redo: in a text field the field's own undo, otherwise the calendar's (renderer decides).
      label: T('menuEdit'),
      submenu: [
        { label: T('menuUndo'), accelerator: 'CommandOrControl+Z', click: () => sendToRenderer('menu:undo') },
        { label: T('menuRedo'), accelerator: isMac ? 'Shift+Command+Z' : 'Control+Y', click: () => sendToRenderer('menu:redo') },
        { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        ...(!isMac ? [{
          label: T('menuCheckUpdates'),
          click: () => checkForUpdatesInteractive(true)
        }, {
          label: T('menuAbout'),
          click: () => openAboutWindow()
        }] : []),
        {
          label: T('menuWhatsNew'),
          click: () => sendToRenderer('menu:whats-new')
        },
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
    center: true,               // opens in the middle of the screen
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 14, y: 16 } : undefined,

    // macOS — solid window, no vibrancy/Liquid Glass: the translucent sidebar made its text hard
    // to read. The page paints its own opaque background; this colour only shows while loading.
    ...(isMac ? {
      backgroundColor: nativeTheme.shouldUseDarkColors ? '#120d1e' : '#fdf4ff',
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
    menuWhatsNew: 'Novità di questa versione', menuEdit: 'Modifica', menuAbout: 'Informazioni su Magic Calendar', menuUndo: 'Annulla', menuRedo: 'Ripristina',
    updChecking: 'Ricerca aggiornamenti…', updUpToDate: 'Sei aggiornato!',
    updUpToDateMsg: (v) => `Magic Calendar ${v} è la versione più recente.`,
    updAvailable: (v) => `È disponibile Magic Calendar ${v}`, updAvailableMsg: (v) => `Hai la versione ${v}. Vuoi installare l’aggiornamento?`,
    updDownloading: (v) => `Scaricamento di Magic Calendar ${v}…`, updReadyMsg: 'Riavvia per completare l’aggiornamento. Se scegli Più tardi, verrà installato alla chiusura dell’app.',
    updHistory: 'Storico versioni', updErrorMsg: 'Controlla la connessione e riprova più tardi.',
    aboutVersion: (v) => `Versione ${v}`, aboutProject: 'Il progetto Magic Calendar', aboutSource: 'Codice su GitHub', aboutReleases: 'Tutte le versioni',
    aboutAuthorRole: 'Programmazione, design e manutenzione', aboutBuilt: 'Costruito con', aboutCredits: 'Crediti',
    aboutFont: 'Carattere', aboutFontText: 'Nunito, di Vernon Adams (SIL Open Font License)',
    aboutLicense: 'Licenza', aboutLicenseText: 'Gratuita per uso personale ed educativo. Uso commerciale solo con permesso dell’autore.',
    aboutData: 'I tuoi dati', aboutDataText: 'Tutto resta sul tuo computer: nessun account, nessun server.',
    menuExportBackup: 'Esporta backup…', menuImportBackup: 'Importa backup…',
    backupSaveTitle: 'Esporta backup', backupOpenTitle: 'Importa backup', backupFilter: 'Backup di Magic Calendar',
    backupSaved: 'Backup salvato', backupSavedMsg: (n) => `Il backup contiene ${n} calendari, la settimana, le impostazioni e le immagini.`,
    showInFolder: 'Mostra nella cartella', ok: 'OK',
    importInvalid: 'File non valido', importInvalidMsg: 'Il file scelto non è un backup di Magic Calendar.',
    importConfirm: 'Sostituire i dati attuali con il backup?',
    importConfirmDetail: (n, when, dir) => `Il backup (${when}) contiene ${n} calendari. Calendari, settimana, impostazioni e immagini attuali vengono sostituiti. Prima viene salvata una copia dei dati attuali in:\n${dir}`,
    replace: 'Sostituisci', cancel: 'Annulla',
    importFailed: 'Importazione non riuscita',
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
    menuWhatsNew: 'What’s New in This Version', menuEdit: 'Edit', menuAbout: 'About Magic Calendar', menuUndo: 'Undo', menuRedo: 'Redo',
    updChecking: 'Checking for updates…', updUpToDate: 'You’re up to date!',
    updUpToDateMsg: (v) => `Magic Calendar ${v} is the newest version available.`,
    updAvailable: (v) => `Magic Calendar ${v} is available`, updAvailableMsg: (v) => `You have version ${v}. Install the update?`,
    updDownloading: (v) => `Downloading Magic Calendar ${v}…`, updReadyMsg: 'Restart to finish updating. If you choose Later, it will be installed when you quit the app.',
    updHistory: 'Version History', updErrorMsg: 'Check your connection and try again later.',
    aboutVersion: (v) => `Version ${v}`, aboutProject: 'The Magic Calendar project', aboutSource: 'Source on GitHub', aboutReleases: 'All versions',
    aboutAuthorRole: 'Programmer, designer & maintainer', aboutBuilt: 'Built with', aboutCredits: 'Credits',
    aboutFont: 'Typeface', aboutFontText: 'Nunito, by Vernon Adams (SIL Open Font License)',
    aboutLicense: 'License', aboutLicenseText: 'Free for personal and educational use. Commercial use only with the author’s permission.',
    aboutData: 'Your data', aboutDataText: 'Everything stays on your computer: no account, no server.',
    menuExportBackup: 'Export Backup…', menuImportBackup: 'Import Backup…',
    backupSaveTitle: 'Export backup', backupOpenTitle: 'Import backup', backupFilter: 'Magic Calendar backup',
    backupSaved: 'Backup saved', backupSavedMsg: (n) => `The backup contains ${n} calendars, the week plans, the settings and the images.`,
    showInFolder: 'Show in Folder', ok: 'OK',
    importInvalid: 'Invalid file', importInvalidMsg: 'The chosen file is not a Magic Calendar backup.',
    importConfirm: 'Replace the current data with the backup?',
    importConfirmDetail: (n, when, dir) => `The backup (${when}) contains ${n} calendars. The current calendars, week plans, settings and images are replaced. A copy of the current data is saved first in:\n${dir}`,
    replace: 'Replace', cancel: 'Cancel',
    importFailed: 'Import failed',
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

let _pendingMacInstaller = null;  // mac update downloaded and ready: runs when the app quits
let _pendingMacVersion = null;
let _pendingRelaunch = false;     // "Restart now" reopens the app after the swap, "Later" does not

function releasePageUrl() {
  return 'https://github.com/marcorosso768/magic-calendar/releases/latest';
}

// ──────────────────────────────────────────────────────────────
// Small windows: update (Bartender style) and About (Keka style), in src/panels/
// ──────────────────────────────────────────────────────────────
let updateWin = null;
let aboutWin = null;
let _isDark = nativeTheme.shouldUseDarkColors;   // effective app theme, sent by the renderer

function panelIcon() {
  try {
    const img = loadPng(`dock-${_isDark ? 'dark' : 'light'}.png`);
    return img ? img.toDataURL() : '';
  } catch (_) { return ''; }
}

function createPanel(file, opts) {
  const win = new BrowserWindow({
    show: false, resizable: false, minimizable: false, maximizable: false, fullscreenable: false,
    backgroundColor: _isDark ? '#1c1924' : '#f6f4fa',
    webPreferences: { preload: path.join(__dirname, 'panels', 'panel-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
    ...opts,
  });
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.loadFile(path.join(__dirname, 'panels', file));
  win.once('ready-to-show', () => { if (!win.isDestroyed()) win.show(); });
  return win;
}

function openUpdateWindow() {
  if (updateWin && !updateWin.isDestroyed()) { updateWin.show(); updateWin.focus(); return; }
  updateWin = createPanel('update.html', {
    width: 380, height: 300, frame: false, roundedCorners: true, skipTaskbar: true,
    parent: mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined,
  });
  if (mainWindow && !mainWindow.isDestroyed()) {
    const b = mainWindow.getBounds();
    updateWin.setPosition(Math.round(b.x + (b.width - 380) / 2), Math.round(b.y + Math.min(160, b.height / 4)));
  } else {
    updateWin.center();
  }
  updateWin.on('closed', () => {
    updateWin = null;
    // Closing while checking cancels the check; closing an available update means "later".
    if (_updState && ['checking', 'uptodate', 'error', 'manual', 'devonly', 'available'].includes(_updState.kind)) {
      if (_updState.kind === 'checking') _checkToken++;
      _updState = null;
    }
  });
}

function openAboutWindow() {
  if (aboutWin && !aboutWin.isDestroyed()) { aboutWin.show(); aboutWin.focus(); return; }
  aboutWin = createPanel('about.html', {
    width: 720, height: 430, center: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    title: T('menuAbout'),
  });
  aboutWin.on('closed', () => { aboutWin = null; });
}

function aboutInfo() {
  const v = process.versions;
  return {
    name: 'Magic Calendar',
    version: T('aboutVersion', app.getVersion()),
    copyright: `Copyright © 2026${new Date().getFullYear() > 2026 ? `-${new Date().getFullYear()}` : ''} Marco Rosso`,
    projectTitle: T('aboutProject'),
    homepage: 'https://github.com/marcorosso768/magic-calendar', homepageLabel: T('aboutSource'),
    releases: 'https://github.com/marcorosso768/magic-calendar/releases', releasesLabel: T('aboutReleases'),
    authorRole: T('aboutAuthorRole'), author: 'Marco Rosso',
    sections: [
      { title: T('aboutBuilt'), items: [
        { label: 'Electron', text: `${v.electron} · Chromium ${v.chrome} · Node.js ${v.node}`, url: 'https://www.electronjs.org', urlLabel: 'electronjs.org' },
      ] },
      { title: T('aboutCredits'), items: [
        { label: T('aboutFont'), text: T('aboutFontText') },
        { label: T('aboutData'), text: T('aboutDataText') },
        { label: T('aboutLicense'), text: T('aboutLicenseText') },
      ] },
    ],
  };
}

ipcMain.handle('panel:init', (e) => {
  const base = { dark: _isDark, lang: uiLang(), icon: panelIcon() };
  if (aboutWin && !aboutWin.isDestroyed() && e.sender === aboutWin.webContents) return { ...base, about: aboutInfo() };
  return { ...base, state: _updState || stateChecking() };
});
ipcMain.on('panel:action', (e, id) => {
  if (updateWin && !updateWin.isDestroyed() && e.sender === updateWin.webContents) onUpdateAction(String(id));
});
ipcMain.on('panel:resize', (e, height) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win || win !== updateWin) return;
  const h = Math.max(160, Math.min(620, Math.round(Number(height) || 0)));
  const [w] = win.getContentSize();
  win.setContentSize(w, h);
});

// ── Update window (Bartender style) ──────────────────────────────
// One small window shows every step: checking, up to date, update available (with the notes),
// downloading, ready to restart, errors. The main process decides the state; panels/update.js only
// draws it and sends back the id of the button pressed.
let _updState = null;        // state shown in the update window
let _availableInfo = null;   // update found by the last check
let _checkToken = 0;         // a cancelled check ignores its result

function stateChecking() {
  return { kind: 'checking', title: T('updChecking'), progress: 'indeterminate', buttons: [{ id: 'cancel', label: T('cancel') }] };
}
function stateUpToDate() {
  return { kind: 'uptodate', title: T('updUpToDate'), message: T('updUpToDateMsg', app.getVersion()),
    buttons: [{ id: 'close', label: T('ok'), primary: true }, { id: 'history', label: T('updHistory') }] };
}
function stateAvailable(info) {
  return { kind: 'available', title: T('updAvailable', info.version), message: T('updAvailableMsg', app.getVersion()),
    notes: releaseNotesText(info),
    buttons: [{ id: 'install', label: T('install'), primary: true }, { id: 'later', label: T('later') }] };
}
function stateDownloading(version, percent) {
  return { kind: 'downloading', title: T('updDownloading', version), progress: Math.max(0, Math.min(100, Math.round(percent || 0))), buttons: [] };
}
function stateReady(version) {
  return { kind: 'ready', title: T('readyMsg', version), message: T('updReadyMsg'),
    buttons: [{ id: 'restart', label: T('restartNow'), primary: true }, { id: 'later', label: T('later') }] };
}
function stateError(detail) {
  return { kind: 'error', title: T('checkFailed'), message: `${T('updErrorMsg')}${detail ? `\n\n${detail}` : ''}`,
    buttons: [{ id: 'close', label: T('close'), primary: true }, { id: 'releases', label: T('openReleases') }] };
}
function stateManual(detail) {
  return { kind: 'manual', title: T('manualMsg'), message: detail,
    buttons: [{ id: 'releases', label: T('openReleases'), primary: true }, { id: 'close', label: T('close') }] };
}

function setUpdateState(state, { show = true } = {}) {
  _updState = state;
  if (updateWin && !updateWin.isDestroyed()) updateWin.webContents.send('panel:state', state);
  else if (show) openUpdateWindow();
}

function closeUpdateWindow() {
  if (updateWin && !updateWin.isDestroyed()) updateWin.close();
}

async function offerManualDownload(detail) {
  setUpdateState(stateManual(detail));
}

async function checkForUpdatesInteractive(userInitiated) {
  if (!app.isPackaged) {
    if (userInitiated) setUpdateState({ kind: 'devonly', title: T('updChecking'), message: T('devOnly'), buttons: [{ id: 'close', label: T('ok'), primary: true }] });
    return;
  }
  // A download is running or an update is waiting: show where it is instead of checking again.
  if (_updState && ['downloading', 'ready'].includes(_updState.kind)) {
    if (userInitiated) setUpdateState(_updState);
    return;
  }
  const token = ++_checkToken;
  if (userInitiated) setUpdateState(stateChecking());
  try {
    const result = await autoUpdater.checkForUpdates();
    if (token !== _checkToken) return;                     // cancelled meanwhile
    if (result && result.isUpdateAvailable && result.updateInfo) {
      _availableInfo = result.updateInfo;
      setUpdateState(stateAvailable(result.updateInfo));   // also at launch: the window opens
    } else if (userInitiated) {
      setUpdateState(stateUpToDate());
    }
  } catch (err) {
    if (token !== _checkToken) return;
    if (userInitiated) setUpdateState(stateError(err && err.message ? err.message : String(err)));
  }
}

// Release notes come from GitHub as HTML or Markdown: shown as plain text with bullets.
function releaseNotesText(info) {
  if (!info.releaseNotes) return '';
  const notes = Array.isArray(info.releaseNotes)
    ? info.releaseNotes.map(n => n.note || '').join('\n')
    : String(info.releaseNotes);
  return notes
    .replace(/<\s*li[^>]*>/gi, '• ').replace(/<\s*(br|\/p|\/li|\/h\d)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]*)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function installMacUpdate(info) {
  // Already downloaded earlier (user chose "Later"): no second download.
  if (!_pendingMacInstaller || _pendingMacVersion !== info.version) {
    setUpdateState(stateDownloading(info.version, 0));
    try {
      _pendingMacInstaller = await macUpdater.prepareUpdate({
        fetchImpl: (url) => net.fetch(url),
        info,
        arch: process.arch,
        execPath: process.execPath,
        workRoot: updatesDir,
        onProgress: (p) => setUpdateState(stateDownloading(info.version, p.percent), { show: false })
      });
      _pendingMacVersion = info.version;
    } catch (err) {
      console.warn('[updater] mac self-install unavailable:', err && err.message);
      const blocked = err && ['translocated', 'running-from-dmg', 'not-a-bundle'].includes(err.code);
      await offerManualDownload(blocked ? T('manualDetailDmg') : `${T('manualDetail')}\n\n${err && err.message ? err.message : ''}`.trim());
      return;
    }
  }
  setUpdateState(stateReady(info.version));
}

async function startUpdate() {
  const info = _availableInfo;
  if (!info) return closeUpdateWindow();
  if (process.platform === 'darwin') return installMacUpdate(info);
  setUpdateState(stateDownloading(info.version, 0));
  try {
    await autoUpdater.downloadUpdate();   // continues in 'update-downloaded'
  } catch (err) {
    console.warn('[updater] downloadUpdate failed:', err);
    await offerManualDownload(T('manualDetail'));
  }
}

// Buttons of the update window
function onUpdateAction(id) {
  const kind = _updState && _updState.kind;
  switch (id) {
    case 'install':  startUpdate(); break;
    case 'restart':
      if (process.platform === 'darwin') { _pendingRelaunch = true; app.quit(); }   // installer starts in 'will-quit'
      else setImmediate(() => autoUpdater.quitAndInstall());
      break;
    case 'history':  shell.openExternal('https://github.com/marcorosso768/magic-calendar/releases'); break;
    case 'releases': shell.openExternal(releasePageUrl()); break;
    case 'cancel':   _checkToken++; _updState = null; closeUpdateWindow(); break;
    case 'escape':   if (kind !== 'downloading') { if (kind === 'checking') _checkToken++; closeUpdateWindow(); } break;
    default:         closeUpdateWindow();   // close, later
  }
}

autoUpdater.on('download-progress', (p) => {
  const v = _availableInfo ? _availableInfo.version : '';
  setUpdateState(stateDownloading(v, p.percent), { show: false });
});

// Windows only (macOS never calls downloadUpdate)
autoUpdater.on('update-downloaded', (info) => {
  setUpdateState(stateReady(info.version));
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

// macOS keeps app icons in a cache (Finder, Dock, Launchpad). When an update or a reinstall brings a
// different icon, the cache can keep showing the old one until the user logs out. On the first launch
// of a new version: if the bundle icon (Assets.car, or icon.icns) differs from the one seen last time,
// touch the bundle, re-register it with Launch Services and restart the Dock, which reloads the icons.
// The Dock restart happens only when the icon really changed (it makes the Dock flash once).
function refreshMacIconCacheIfChanged() {
  if (process.platform !== 'darwin' || !app.isPackaged) return;
  const bundle = macUpdater.currentBundlePath(process.execPath);
  if (!bundle) return;
  const res = path.join(bundle, 'Contents', 'Resources');
  const iconFile = ['Assets.car', 'icon.icns'].map(f => path.join(res, f)).find(f => fs.existsSync(f));
  if (!iconFile) return;
  const stateF = path.join(userData, 'icon-state.json');
  let state = {};
  try { state = JSON.parse(fs.readFileSync(stateF, 'utf8')) || {}; } catch (_) {}
  let hash;
  try { hash = require('crypto').createHash('sha1').update(fs.readFileSync(iconFile)).digest('hex'); } catch (_) { return; }
  if (state.iconHash === hash) return;
  const { execFile } = require('child_process');
  const lsregister = '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister';
  execFile('/usr/bin/touch', [bundle], () => {
    execFile(lsregister, ['-f', bundle], () => {
      setTimeout(() => execFile('/usr/bin/killall', ['Dock'], () => {}), 1500);
    });
  });
  try { fs.writeFileSync(stateF, JSON.stringify({ iconHash: hash, version: app.getVersion() })); } catch (_) {}
}

// ──────────────────────────────────────────────────────────────
// Theme — single source of truth is the renderer (it already
// resolves the user's light/dark/auto preference against the OS).
// ──────────────────────────────────────────────────────────────
ipcMain.on('dock:set-dark', (_, isDark) => {
  _isDark = !!isDark;
  applyThemedIcon(_isDark);
  for (const w of [updateWin, aboutWin]) if (w && !w.isDestroyed()) w.webContents.send('panel:theme', _isDark);
});
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
  // Initial icon from the system theme; the renderer corrects it once Settings are loaded.
  applyThemedIcon(nativeTheme.shouldUseDarkColors);

  app.setAboutPanelOptions({
    applicationName: 'Magic Calendar',
    applicationVersion: app.getVersion(),
    copyright: `Copyright © ${new Date().getFullYear()} Marco Rosso`,
    website: 'https://github.com/marcorosso768/magic-calendar'
  });

  checkPreviousMacUpdate();
  refreshMacIconCacheIfChanged();
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
// Backup and restore
//   One JSON file with everything the app stores: calendars, week plans, settings and images
//   (base64). Restoring replaces the current data; a copy of it is written first to
//   userData/backups, so a wrong import can be undone by importing that copy.
// ──────────────────────────────────────────────────────────────
const BACKUP_FORMAT = 'magic-calendar-backup';
const backupsDir = path.join(userData, 'backups');

function collectBackup() {
  const calendars = {};
  for (const key of listCalendarKeys()) {
    const d = store.readJsonSafe(calFile(key));
    if (d) calendars[key] = d;
  }
  const images = {};
  if (fs.existsSync(imagesDir)) {
    for (const f of fs.readdirSync(imagesDir)) {
      const p = path.join(imagesDir, f);
      if (store.isValidImageName(f) && fs.statSync(p).isFile()) images[f] = fs.readFileSync(p).toString('base64');
    }
  }
  return {
    format: BACKUP_FORMAT, formatVersion: 1,
    appVersion: app.getVersion(), createdAt: new Date().toISOString(),
    settings: store.readJsonSafe(settingsF),
    weekly: fs.existsSync(weeklyF) || fs.existsSync(`${weeklyF}.bak`) ? store.readJsonSafe(weeklyF) : null,
    calendars, images,
  };
}

// Throws if the file is not a usable backup. Keys and image names are checked as strictly as the
// rest of the app (no paths), so a backup can never write outside the data folder.
function validateBackup(b) {
  const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
  if (!isObj(b) || b.format !== BACKUP_FORMAT || typeof b.formatVersion !== 'number') throw new Error('format');
  if (b.formatVersion > 1) throw new Error('newer format');
  if (!isObj(b.calendars)) throw new Error('calendars');
  for (const [k, d] of Object.entries(b.calendars)) if (!store.isValidKey(k) || !isObj(d)) throw new Error(`calendar ${k}`);
  if (b.images != null && !isObj(b.images)) throw new Error('images');
  for (const [n, data] of Object.entries(b.images || {})) {
    if (!store.isValidImageName(n) || typeof data !== 'string') throw new Error(`image ${n}`);
  }
  if (b.settings != null && !isObj(b.settings)) throw new Error('settings');
  if (b.weekly != null && !isObj(b.weekly)) throw new Error('weekly');
}

function restoreBackup(b) {
  // Safety copy of the current data first.
  fs.mkdirSync(backupsDir, { recursive: true });
  const stampStr = new Date().toISOString().replace(/[:.]/g, '-');
  const safety = path.join(backupsDir, `before-import-${stampStr}.json`);
  fs.writeFileSync(safety, JSON.stringify(collectBackup()));

  for (const key of listCalendarKeys()) {
    const f = calFile(key);
    for (const x of [f, `${f}.bak`]) if (fs.existsSync(x)) fs.unlinkSync(x);
  }
  for (const [k, d] of Object.entries(b.calendars)) store.writeJsonAtomic(calFile(k), d);
  if (b.settings) store.writeJsonAtomic(settingsF, b.settings);
  store.writeJsonAtomic(weeklyF, b.weekly || {});
  fs.mkdirSync(imagesDir, { recursive: true });
  // Images are added (same name: replaced); images already here stay, so nothing is lost.
  for (const [n, data] of Object.entries(b.images || {})) fs.writeFileSync(path.join(imagesDir, n), Buffer.from(data, 'base64'));
  return safety;
}

function localDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function exportBackupInteractive() {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: T('backupSaveTitle'),
    defaultPath: path.join(app.getPath('documents'), `Magic-Calendar-backup-${localDate(new Date())}.json`),
    filters: [{ name: T('backupFilter'), extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return { ok: false };
  const b = collectBackup();
  const tmp = `${result.filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(b));
  fs.renameSync(tmp, result.filePath);
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'info', message: T('backupSaved'), detail: T('backupSavedMsg', Object.keys(b.calendars).length),
    buttons: [T('ok'), T('showInFolder')], defaultId: 0, cancelId: 0
  });
  if (response === 1) shell.showItemInFolder(result.filePath);
  return { ok: true, path: result.filePath };
}

async function importBackupInteractive() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: T('backupOpenTitle'),
    properties: ['openFile'],
    filters: [{ name: T('backupFilter'), extensions: ['json'] }]
  });
  if (result.canceled || !result.filePaths.length) return { ok: false };
  let b;
  try {
    b = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
    validateBackup(b);
  } catch (err) {
    await dialog.showMessageBox(mainWindow, {
      type: 'warning', message: T('importInvalid'), detail: T('importInvalidMsg'), buttons: [T('ok')]
    });
    return { ok: false, error: String(err && err.message || err) };
  }
  const when = b.createdAt ? localDate(new Date(b.createdAt)) : '?';
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'warning', message: T('importConfirm'),
    detail: T('importConfirmDetail', Object.keys(b.calendars).length, when, backupsDir),
    buttons: [T('replace'), T('cancel')], defaultId: 1, cancelId: 1
  });
  if (response !== 0) return { ok: false };
  try {
    restoreBackup(b);
  } catch (err) {
    await dialog.showMessageBox(mainWindow, {
      type: 'error', message: T('importFailed'), detail: String(err && err.message || err), buttons: [T('ok')]
    });
    return { ok: false, error: String(err && err.message || err) };
  }
  buildAppMenu();                                   // the restored settings may change the language
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.reload();
  return { ok: true };
}

ipcMain.handle('backup:export', () => exportBackupInteractive());
ipcMain.handle('backup:import', () => importBackupInteractive());

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
