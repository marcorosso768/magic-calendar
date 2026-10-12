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

| Your computer | File to download |
|---|---|
| Mac with Apple Silicon (M1 and later) | `Magic-Calendar-X.Y.Z-mac-arm64.dmg` |
| Mac with Intel processor | `Magic-Calendar-X.Y.Z-mac-x64.dmg` |
| Windows (64-bit) | `Magic-Calendar-X.Y.Z-win-x64.exe` |

Requirements: macOS 13 Ventura or later, Windows 10 or later (64-bit).

Not sure which Mac you have? Apple menu  → *About This Mac*: "Chip Apple M…" means Apple Silicon,
"Processor Intel…" means Intel. The `.zip`, `.yml` and `.blockmap` files in the release are used by the
automatic updates: you do not need them.

---

## ⚠️ macOS first launch

This app is unsigned, so macOS may block it.

If you see:

- "cannot verify developer" or "Apple could not verify…"  
  → open *System Settings → Privacy & Security*, scroll down and click **Open Anyway**

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
- Today highlighted, past days dimmed, Italian public holidays
- Day counts and countdown to the next day of each type
- Backup and restore of all data in one file
- Select several days at once, weekly patterns (also alternate weeks), Undo/Redo

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
1. Download the `.dmg` for your Mac (`-mac-arm64` or `-mac-x64`, see above)
2. Open it and drag the app into Applications
3. Eject the disk image and open the app from Applications (not from the disk image: from there it
   cannot update itself)
4. First launch only: *System Settings → Privacy & Security → Open Anyway*

### Windows
1. Download `-win-x64.exe`
2. Run the installer

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
| macOS | `~/Library/Application Support/Magic Calendar/` |
| Windows | `%APPDATA%\Magic Calendar\` |

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

1. Write the notes for the new version in `build-resources/release-notes.md`.
2. Commit the changes and bump the version:

```bash
git add .
git commit -m "…"
npm version patch      # or minor / major
git push --follow-tags
```

`npm version` updates `package.json` and `package-lock.json`, commits and creates the tag `vX.Y.Z`;
`git push --follow-tags` pushes `main` and the tag. The tag starts GitHub Actions, which builds the Mac
and Windows versions and publishes one release with these files:

| File | For |
|---|---|
| `Magic-Calendar-X.Y.Z-mac-arm64.dmg` | Mac Apple Silicon, download |
| `Magic-Calendar-X.Y.Z-mac-x64.dmg` | Mac Intel, download |
| `Magic-Calendar-X.Y.Z-win-x64.exe` | Windows, installer and update |
| `Magic-Calendar-X.Y.Z-mac-arm64.zip`, `-mac-x64.zip` | Mac, in-app update |
| `latest-mac.yml`, `latest.yml`, `*.blockmap` | in-app update metadata |

The release is published only if both platforms build, and the build fails if the tag and
`package.json` disagree.

---

## License

This project is free for personal and educational use.

Commercial use is not allowed without explicit permission from the author.

Commercial licenses are available on request.
