/**
 * afterPack hook — runs after electron-builder packs the .app,
 * before packaging into DMG.
 *
 * Ad-hoc signing makes macOS show "Open Anyway" in Privacy & Security
 * instead of the "App is damaged" error, even without an Apple Developer account.
 */
const { execSync } = require('child_process');
const path = require('path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appName  = context.packager.appInfo.productFilename;
  const appPath  = path.join(context.appOutDir, `${appName}.app`);

  console.log(`\n[afterPack] Ad-hoc signing: ${appPath}`);
  try {
    execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
    console.log('[afterPack] Ad-hoc signing OK\n');
  } catch (err) {
    console.warn('[afterPack] codesign failed (non-fatal):', err.message);
  }
};
