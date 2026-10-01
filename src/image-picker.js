// image-picker.js — reusable image selection component
// Depends on: i18n.js, preload.js (window.api)

// Same image whatever the stored form (mcimg://local/name, old file:// URL): compare file names.
function imageName(url) {
  const last = String(url || '').split(/[\\/]/).pop() || '';
  try { return decodeURIComponent(last.split('?')[0]); } catch (_) { return last; }
}

async function findImageUsage(url) {
  const name = imageName(url);
  const days = [];
  for (const key of await Storage.list()) {
    const cal = await Storage.load(key);
    for (const [day, dd] of Object.entries(cal?.days || {})) {
      if (dd?.image && imageName(dd.image) === name) days.push({ key, day });
    }
  }
  const types = (SettingsManager.get().types || [])
    .map((t, i) => (t.photoUrl && imageName(t.photoUrl) === name ? i : -1))
    .filter(i => i >= 0);
  return { days, types, count: days.length + types.length };
}

async function removeImageReferences(url, usage) {
  const byKey = {};
  usage.days.forEach(({ key, day }) => { (byKey[key] = byKey[key] || []).push(day); });
  for (const [key, days] of Object.entries(byKey)) {
    const cal = await Storage.load(key);
    if (!cal?.days) continue;
    days.forEach(d => { if (cal.days[d]) cal.days[d].image = ''; });
    await Storage.save(key, cal);
  }
  const name = imageName(url);
  const clear = t => (t && t.photoUrl && imageName(t.photoUrl) === name ? { ...t, photoUrl: '' } : t);
  const settingsOpen = !document.getElementById('modal-settings')?.classList.contains('hidden');

  if (!settingsOpen) {
    if (usage.types.length) {
      SettingsManager.set({ types: (SettingsManager.get().types || []).map(clear) });
      await SettingsManager.save();
    }
    return;
  }

  // Settings window open: its edits are not saved yet. Clear the photo in the live settings, in the
  // copy being edited and in the snapshot restored on "Close", and write to disk only the snapshot
  // (the last saved settings) without the photo, so unsaved edits are not saved by this.
  SettingsManager.set({ types: (SettingsManager.get().types || []).map(clear) });
  if (_settingsSnapshot) {
    _settingsSnapshot.types = (_settingsSnapshot.types || []).map(clear);
    await Storage.saveSettings(_settingsSnapshot);
  }
  if (Array.isArray(_editTypes)) {
    // keep what the user typed in the label fields before redrawing them
    _editTypes = _editTypes.map((t, i) => clear({
      ...t,
      label: document.getElementById(`set-t${i}-label`)?.value ?? t.label,
      sub:   document.getElementById(`set-t${i}-sub`)?.value   ?? t.sub,
    }));
    _renderTypesUI();
  }
}

/**
 * Build an inline image picker inside `container`.
 * Shows all saved images as thumbnails + an import button.
 * Calls onSelect(url) when an image is selected ('' = none).
 *
 * @param {HTMLElement} container
 * @param {string}      currentUrl  — currently selected image URL ('' = none)
 * @param {function}    onSelect    — callback(url: string)
 */
async function buildImagePicker(container, currentUrl, onSelect) {
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'imgp-wrap';

  // Load saved images (newest first)
  let images = [];
  try { images = await window.api.imageList(); } catch(e) {}

  const grid = document.createElement('div');
  grid.className = 'imgp-grid';

  // "None" option — always first
  const noneEl = document.createElement('div');
  noneEl.className = 'imgp-item imgp-none' + (!currentUrl ? ' active' : '');
  noneEl.title = I18n.t('removeImage') || 'Rimuovi';
  noneEl.innerHTML = '<span style="font-size:16px;color:#9ca3af">✕</span>';
  noneEl.addEventListener('click', () => {
    grid.querySelectorAll('.imgp-item').forEach(x => x.classList.remove('active'));
    noneEl.classList.add('active');
    if (onSelect) onSelect('');
  });
  grid.appendChild(noneEl);

  // Saved image thumbnails
  images.forEach(url => {
    const el = document.createElement('div');
    el.className = 'imgp-item' + (currentUrl === url ? ' active' : '');
    el.style.position = 'relative';
    const img = document.createElement('img');
    img.src = url;
    img.className = 'imgp-thumb';
    el.appendChild(img);
    // Delete button
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'imgp-del';
    del.textContent = '✕';
    del.title = I18n.t('removeImage') || 'Elimina';
    del.addEventListener('click', async (e) => {
      e.stopPropagation();
      // Images can be used by days of any calendar and by day types: ask first, then remove the
      // references too, so no calendar is left pointing to a missing file.
      const usage = await findImageUsage(url);
      if (!confirm(I18n.tf('confirmDeleteImage', usage.count))) return;
      await window.api.imageDelete(url);
      await removeImageReferences(url, usage);
      if (currentUrl === url && onSelect) onSelect('');
      await buildImagePicker(container, currentUrl === url ? '' : currentUrl, onSelect);
      if (usage.count) App.refresh();
    });
    el.appendChild(del);
    el.addEventListener('click', () => {
      grid.querySelectorAll('.imgp-item').forEach(x => x.classList.remove('active'));
      el.classList.add('active');
      if (onSelect) onSelect(url);
    });
    grid.appendChild(el);
  });

  wrap.appendChild(grid);

  // Import new image button
  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.className = 'btn-sm';
  importBtn.style.cssText = 'margin-top:6px;font-size:11px';
  importBtn.textContent = I18n.t('choosePhoto') || '📂 Importa foto';
  importBtn.addEventListener('click', async () => {
    const url = await window.api.imagePick();
    if (!url) return;
    // Rebuild with new image pre-selected
    await buildImagePicker(container, url, onSelect);
    if (onSelect) onSelect(url);
  });
  wrap.appendChild(importBtn);

  container.appendChild(wrap);
}

/**
 * Open a full-screen overlay containing an image picker.
 * Used in settings to pick a type photo.
 *
 * @param {string}   currentUrl
 * @param {function} onSelect(url)
 */
async function openImagePickerOverlay(currentUrl, onSelect) {
  document.getElementById('imgp-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'imgp-overlay';
  overlay.className = 'imgp-overlay';

  const box = document.createElement('div');
  box.className = 'imgp-box';

  // Header
  const hdr = document.createElement('div');
  hdr.className = 'imgp-hdr';
  const title = document.createElement('span');
  title.textContent = I18n.currentLang() === 'it' ? '📷 Immagini salvate' : '📷 Saved images';
  title.style.fontWeight = '800';
  hdr.appendChild(title);
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.className = 'close-btn';
  closeBtn.style.marginLeft = 'auto';
  closeBtn.addEventListener('click', () => overlay.remove());
  hdr.appendChild(closeBtn);
  box.appendChild(hdr);

  // Picker content
  const pickerDiv = document.createElement('div');
  pickerDiv.style.padding = '12px';
  await buildImagePicker(pickerDiv, currentUrl, (url) => {
    overlay.remove();
    if (onSelect) onSelect(url);
  });
  box.appendChild(pickerDiv);

  overlay.appendChild(box);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}
