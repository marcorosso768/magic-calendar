// views/tour.js — "What's new" tour: the window is dimmed except the element of the step, with a
// bubble next to it (Back / Next / Skip, "2 of 5"). Esc or Skip closes it.

const Tour = (() => {
  let _steps = [], _i = 0, _onEnd = null, _root = null;

  const lang = () => (I18n.currentLang() === 'en' ? 'en' : 'it');
  const mod = () => (document.documentElement.dataset.platform === 'darwin' ? '⌘' : 'Ctrl+');

  function start(steps, onEnd) {
    if (!steps || !steps.length) return;
    end(false);
    _steps = steps; _i = 0; _onEnd = onEnd || null;
    _root = document.createElement('div');
    _root.id = 'tour';
    _root.innerHTML = `<div class="tour-spot"></div><div class="tour-bubble" role="dialog" aria-live="polite">
      <div class="tour-count"></div><div class="tour-title"></div><div class="tour-text"></div>
      <div class="tour-buttons"><button class="tour-skip"></button><span class="tour-spacer"></span>
      <button class="tour-back"></button><button class="tour-next"></button></div></div>`;
    document.body.appendChild(_root);
    _root.querySelector('.tour-skip').addEventListener('click', () => end(true));
    _root.querySelector('.tour-back').addEventListener('click', () => go(_i - 1));
    _root.querySelector('.tour-next').addEventListener('click', () => (_i < _steps.length - 1 ? go(_i + 1) : end(true)));
    _root.addEventListener('click', e => { if (e.target === _root) e.stopPropagation(); });
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    go(0);
  }

  function onKey(e) {
    if (!_root) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(true); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); _i < _steps.length - 1 ? go(_i + 1) : end(true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(_i - 1); }
  }

  function go(i) {
    if (!_root || i < 0 || i >= _steps.length) return;
    _i = i;
    const s = _steps[i], L = lang();
    _root.querySelector('.tour-count').textContent = I18n.tf('tourStep', i + 1, _steps.length);
    _root.querySelector('.tour-title').textContent = s.title[L] || s.title.it;
    _root.querySelector('.tour-text').textContent = (s.text[L] || s.text.it).split('{mod}').join(mod());
    _root.querySelector('.tour-skip').textContent = I18n.t('tourSkip');
    const back = _root.querySelector('.tour-back');
    back.textContent = I18n.t('tourBack');
    back.style.visibility = i === 0 ? 'hidden' : 'visible';
    _root.querySelector('.tour-next').textContent = i === _steps.length - 1 ? I18n.t('tourDone') : I18n.t('tourNext');
    place();
    _root.querySelector('.tour-next').focus();
  }

  // Spotlight on the target (if visible), bubble below/above/beside it, or centred.
  function place() {
    if (!_root) return;
    const s = _steps[_i];
    const spot = _root.querySelector('.tour-spot');
    const bub = _root.querySelector('.tour-bubble');
    const el = s.target ? document.querySelector(s.target) : null;
    const r = el && el.offsetParent !== null ? el.getBoundingClientRect() : null;
    const W = window.innerWidth, H = window.innerHeight, pad = 8, gap = 14;
    bub.style.left = bub.style.top = '';
    if (!r || r.width === 0) {
      _root.classList.add('tour-center');
      spot.style.cssText = 'display:none';
      const bw = bub.offsetWidth, bh = bub.offsetHeight;
      bub.style.left = `${Math.round((W - bw) / 2)}px`;
      bub.style.top = `${Math.round((H - bh) / 2)}px`;
      return;
    }
    _root.classList.remove('tour-center');
    const x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad);
    const w = Math.min(W - x - 4, r.width + pad * 2), h = Math.min(H - y - 4, r.height + pad * 2);
    spot.style.cssText = `display:block;left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    const bw = bub.offsetWidth, bh = bub.offsetHeight;
    let left, top;
    if (x + w + gap + bw <= W - 8) { left = x + w + gap; top = y + Math.min(h, H) / 2 - bh / 2; }         // right
    else if (y + h + gap + bh <= H - 8) { left = x + w / 2 - bw / 2; top = y + h + gap; }                 // below
    else if (y - gap - bh >= 8) { left = x + w / 2 - bw / 2; top = y - gap - bh; }                        // above
    else { left = x + w / 2 - bw / 2; top = y + h / 2 - bh / 2; }                                        // over
    bub.style.left = `${Math.round(Math.max(8, Math.min(W - bw - 8, left)))}px`;
    bub.style.top = `${Math.round(Math.max(8, Math.min(H - bh - 8, top)))}px`;
  }

  function end(callback) {
    if (!_root) return;
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', place);
    _root.remove();
    _root = null;
    const cb = _onEnd; _onEnd = null;
    if (callback && cb) cb();
  }

  return { start, end, isOpen: () => !!_root };
})();
