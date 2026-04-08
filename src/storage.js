const Storage = {
  save:           (k,d) => window.api.calSave(k,d),
  load:           (k)   => window.api.calLoad(k),
  list:           ()    => window.api.calList(),
  delete:         (k)   => window.api.calDelete(k),
  saveSettings:   (s)   => window.api.settingsSave(s),
  loadSettings:   ()    => window.api.settingsLoad(),
};
