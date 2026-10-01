const Storage = {
  save:           (k,d) => window.api.calSave(k,d),
  load:           (k)   => window.api.calLoad(k),
  list:           ()    => window.api.calList(),
  create:         (k,d) => window.api.calCreate(k,d),   // { ok:false, exists:true } if the key is taken
  delete:         (k)   => window.api.calDelete(k),
  saveSettings:   (s)   => window.api.settingsSave(s),
  loadSettings:   ()    => window.api.settingsLoad(),
  loadWeekly:     ()    => window.api.weeklyLoad(),
  saveWeekly:     (d)   => window.api.weeklySave(d),
};

// Escapes text for use inside HTML (element content and quoted attributes).
function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
