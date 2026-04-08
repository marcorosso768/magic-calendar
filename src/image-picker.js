// image-picker.js — reusable image selection component
// Depends on: i18n.js, preload.js (window.api)

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
      await window.api.imageDelete(url);
      if (currentUrl === url && onSelect) onSelect('');
      await buildImagePicker(container, currentUrl === url ? '' : currentUrl, onSelect);
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
