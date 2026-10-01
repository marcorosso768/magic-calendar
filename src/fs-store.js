// fs-store.js — safe JSON storage helpers for the main process.
//
// - Atomic writes: data goes to "<file>.tmp" and is then renamed over the target, so a crash or
//   power loss during a save never leaves a truncated file. The previous version is kept as
//   "<file>.bak" and used automatically if the main file cannot be parsed.
// - Calendar keys are validated: only letters, digits, "_" and "-" (no paths).
// - Image references: images are stored by file name and served through the "mcimg://local/<name>"
//   protocol. Older data contains absolute "file:///…/images/<name>" URLs; they are rewritten on read.

const fs   = require('fs');
const path = require('path');

const KEY_RE = /^[A-Za-z0-9_-]{1,200}$/;

function isValidKey(key) {
  return typeof key === 'string' && KEY_RE.test(key);
}

function writeJsonAtomic(file, data) {
  const json = JSON.stringify(data, null, 2);
  const tmp  = `${file}.tmp`;
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeSync(fd, json);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  if (fs.existsSync(file)) {
    try { fs.copyFileSync(file, `${file}.bak`); } catch (_) { /* backup is best effort */ }
  }
  renameWithRetry(tmp, file);
}

// On Windows an antivirus or the search indexer can briefly lock the target: retry a few times.
function renameWithRetry(from, to) {
  for (let attempt = 0; ; attempt++) {
    try { fs.renameSync(from, to); return; }
    catch (err) {
      if (attempt >= 5 || !['EPERM', 'EBUSY', 'EACCES'].includes(err.code)) throw err;
      const until = Date.now() + 50 * (attempt + 1);
      while (Date.now() < until) { /* short synchronous wait */ }
    }
  }
}

// Rewrites legacy absolute image URLs (file:///…/images/img_123.png, also with Windows
// backslashes or percent-encoding) into the portable form mcimg://local/img_123.png.
const LEGACY_IMG_RE = /file:\/\/[^"]*?[\\/]+images[\\/]+([^"\\/]+?\.(?:jpe?g|png|gif|webp|svg))/gi;

function migrateImageUrls(text) {
  return text.replace(LEGACY_IMG_RE, (_, name) => `mcimg://local/${encodeURIComponent(decodeURIComponentSafe(name))}`);
}

function decodeURIComponentSafe(s) {
  try { return decodeURIComponent(s); } catch (_) { return s; }
}

// Reads a JSON file. Returns null if missing. If the file is corrupt, falls back to the .bak copy;
// if that fails too, returns null and logs (the app keeps working instead of refusing to start).
function readJsonSafe(file, log = console) {
  for (const candidate of [file, `${file}.bak`]) {
    if (!fs.existsSync(candidate)) continue;
    try {
      const text = fs.readFileSync(candidate, 'utf8');
      const data = JSON.parse(migrateImageUrls(text));
      if (candidate !== file) log.warn(`[store] ${path.basename(file)} unreadable, using backup`);
      return data;
    } catch (err) {
      log.warn(`[store] cannot parse ${path.basename(candidate)}: ${err.message}`);
    }
  }
  return null;
}

// Image file name from any stored reference (mcimg://local/x.png, file:///…/x.png, x.png).
function imageNameFromUrl(url) {
  const s = String(url || '');
  const last = s.split(/[\\/]/).pop() || '';
  return path.basename(decodeURIComponentSafe(last.split('?')[0]));
}

// Only plain image file names (no folders, no hidden files): anything else is refused.
const IMAGE_NAME_RE = /^[^\\/.][^\\/]*\.(?:jpe?g|png|gif|webp|svg)$/i;
function isValidImageName(name) {
  return typeof name === 'string' && IMAGE_NAME_RE.test(name);
}

function imageUrl(name) {
  return `mcimg://local/${encodeURIComponent(name)}`;
}

module.exports = { isValidKey, writeJsonAtomic, readJsonSafe, migrateImageUrls, imageNameFromUrl, imageUrl, isValidImageName };
