# dmgbuild-settings.py — DEPRECATED, no longer used.
#
# Starting from v1.1.0 the DMG is produced by electron-builder itself
# (see `build.dmg` in package.json) so that `latest-mac.yml` — the
# metadata file required by electron-updater — can be generated and
# uploaded alongside the DMG. The equivalent dmgbuild knobs are now
# expressed in package.json:
#
#   build.dmg.background            ← was `background`
#   build.dmg.window.width/height   ← was `window_rect`
#   build.dmg.contents              ← was `icon_locations`
#
# You can safely delete this file; it is kept only because the sandbox
# running this refactor could not remove it. It is not referenced by
# any CI job, build script, or documentation.
