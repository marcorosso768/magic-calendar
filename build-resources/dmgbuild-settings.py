import os

# 'defines' is injected by dmgbuild when using -D flags on the command line
_app = defines.get('app', 'dist/mac/Magic Calendar.app')
_appname = os.path.basename(_app)

# Source items
files = [_app]
symlinks = {'Applications': '/Applications'}

# Volume icon: use standard macOS mounted-volume icon
icon = None
badge_icon = None

icon_locations = {
    _appname: (150, 185),
    'Applications': (390, 185),
}

# Window appearance
background = 'build-resources/dmg-background.png'
show_status_bar = False
show_tab_view = False
show_toolbar = False
show_pathbar = False
show_sidebar = False
default_view = 'icon-view'
window_rect = ((200, 120), (540, 380))
icon_size = 128
text_size = 12
arrange_by = None

# Force HFS+ so background and layout are preserved
format = 'UDZO'
filesystem = 'HFS+'