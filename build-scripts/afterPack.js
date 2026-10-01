/**
 * afterPack hook — runs after electron-builder packs the .app, before it is zipped.
 *
 * 1. App icon for macOS 26+: compiles build-resources/AppIcon.icon (Icon Composer: light and dark
 *    appearance) into Contents/Resources/Assets.car and sets CFBundleIconName, so Finder, Dock and
 *    Launchpad switch the icon with the system appearance even when the app is closed.
 *    Needs Xcode 26 (actool). Older macOS ignores it and keeps using icon.icns (CFBundleIconFile).
 *    If the compilation fails the build continues with icon.icns only, with a warning.
 * 2. Ad-hoc signing (after any change to the bundle): macOS then shows "Open Anyway" in
 *    Privacy & Security instead of the "App is damaged" error, even without an Apple Developer account.
 */
const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function compileIcon(appPath) {
  const iconSrc = path.join(__dirname, '..', 'build-resources', 'AppIcon.icon');
  if (!fs.existsSync(iconSrc)) return;
  const resources = path.join(appPath, 'Contents', 'Resources');
  const plistTmp  = path.join(os.tmpdir(), `appicon-partial-${process.pid}.plist`);
  try {
    execFileSync('xcrun', [
      'actool', iconSrc,
      '--compile', resources,
      '--app-icon', 'AppIcon',
      '--include-all-app-icons',
      '--output-partial-info-plist', plistTmp,
      '--enable-on-demand-resources', 'NO',
      '--development-region', 'en',
      '--target-device', 'mac',
      '--platform', 'macosx',
      '--minimum-deployment-target', '11.0',
      '--warnings', '--errors', '--notices',
      '--output-format', 'human-readable-text',
    ], { stdio: 'inherit' });
    if (!fs.existsSync(path.join(resources, 'Assets.car'))) throw new Error('Assets.car was not produced');
    const infoPlist = path.join(appPath, 'Contents', 'Info.plist');
    execFileSync('plutil', ['-replace', 'CFBundleIconName', '-string', 'AppIcon', infoPlist]);
    console.log('[afterPack] Icon Composer icon compiled (Assets.car, CFBundleIconName=AppIcon)');
  } catch (err) {
    console.warn(`[afterPack] WARNING: AppIcon.icon not compiled, using icon.icns only: ${err.message}`);
  } finally {
    try { fs.unlinkSync(plistTmp); } catch (_) {}
  }
}

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appName  = context.packager.appInfo.productFilename;
  const appPath  = path.join(context.appOutDir, `${appName}.app`);

  compileIcon(appPath);

  console.log(`\n[afterPack] Ad-hoc signing: ${appPath}`);
  try {
    execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
    console.log('[afterPack] Ad-hoc signing OK\n');
  } catch (err) {
    console.warn('[afterPack] codesign failed (non-fatal):', err.message);
  }
};
