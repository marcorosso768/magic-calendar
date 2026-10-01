# 🦄 Magic Calendar

English · [Italiano](README.it.md)

[![Release](https://img.shields.io/github/v/release/marcorosso768/magic-calendar?display_name=tag)](../../releases)
[![Build](https://img.shields.io/github/actions/workflow/status/marcorosso768/magic-calendar/build.yml?branch=main)](../../actions)
[![Download](https://img.shields.io/badge/download-latest-blue)](../../releases/latest)

A simple, customisable desktop calendar designed for families.

Plan your week, organise activities, and keep everything in one place — with a clean and playful interface.

---

## 📥 Download

👉 **[Download the latest version](../../releases/latest)**

### Mac
- Apple Silicon (M1 / M2 / M3) → arm64 `.dmg`
- Intel Mac → x64 `.dmg`

### Windows
- `.exe` installer

---

## ⚠️ macOS first launch

This app is unsigned, so macOS may block it.

If you see:

- "cannot verify developer"  
  → right-click → Open

- "app is damaged"  
  → run in Terminal:

```bash
xattr -dr com.apple.quarantine "/Applications/Magic Calendar.app"
```

---

## ✨ Features

- Monthly and weekly views
- Multiple visual themes
- Emoji and custom images
- Family-oriented day types
- Italian / English interface
- Automatic local saving
- PDF export
- Multiple calendars

---

## 🎨 Themes

Choose your preferred theme on first launch.  
You can change it anytime in Settings.

---

## 📸 Preview

_Add real screenshots here._

```text
docs/screenshots/
├── monthly-view.png
├── weekly-view.png
└── settings-view.png
```

---

## 🛠 Installation

### macOS
1. Download the `.dmg`
2. Open it
3. Drag the app into Applications
4. Open Applications
5. Right-click → Open

### Windows
1. Download the `.exe`
2. Run installer

---

## 🧑‍💻 Development

```bash
git clone https://github.com/marcorosso768/magic-calendar
cd magic-calendar
npm install
npm start
```

Build:

```bash
npm run build:mac
npm run build:win
```

---

## 📍 Data storage

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/magic-calendar/` |
| Windows | `%APPDATA%\magic-calendar\` |

Calendars are in `calendari/`, the weekly plans and routine in `weekly.json`, settings in `settings.json`,
images in `images/`. Every file is written atomically and the previous version is kept as `.bak`.

---

## 🔄 Updates

The app checks for a new release a few seconds after launch (and from the menu: *Check for Updates…*).
When one is available it offers **Install update**:

- **Windows**: the update is downloaded and installed on restart.
- **macOS**: the app is not signed with an Apple Developer ID, so the standard installer cannot be used.
  The app downloads the new version, verifies its checksum, replaces itself in Applications and restarts.
  This requires the app to be in a folder you can write to (normally Applications). If it is run from the
  disk image or cannot replace itself, it opens the download page instead.

---

## 🚀 Releasing a new version

1. Set `"version"` in `package.json` (e.g. `1.1.0`) and update `build-resources/release-notes.md`.
2. Commit and push to `main`.
3. Create and push the tag: `git tag v1.1.0 && git push origin v1.1.0`.

GitHub Actions builds the Mac and Windows versions, uploads them to a release with the update files
(`latest-mac.yml`, `latest.yml`) and publishes it. The build fails if the tag and `package.json` disagree.

---

## License

This project is free for personal and educational use.

Commercial use is not allowed without explicit permission from the author.

Commercial licenses are available on request.
