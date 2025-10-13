# Wayland & GNOME notes for GeForce NOW Electron

This document summarizes recommended flags and steps to improve compatibility with Wayland (GNOME) and Electron.

Recommended runtime flags:

- Native Wayland / Ozone platform (preferred when available):

```fish
# Run Electron with Ozone/Wayland
env OZONE_PLATFORM=wayland electron .
# or
electron --ozone-platform=wayland
```

- Force server-side window decorations if client-side decorations misbehave:

```fish
electron . --force-frame
```

Flatpak notes:

- Flatpak apps use sandboxing. To pass environment variables to a Flatpak-run app, use Flatpak's `--env` or set them in the manifest:

```fish
flatpak run --env=OZONE_PLATFORM=wayland io.github.hmlendea.geforcenow-electron
```

GNOME tray icons / system indicators:

- GNOME removed legacy tray icons; install the "AppIndicator" extension (KStatusNotifierItem) to restore tray icons.
- Extensions can be enabled via the GNOME Extensions app or the website <https://extensions.gnome.org>

Troubleshooting window controls:

- If an app only shows the close (X) button, it may be using client-side decorations. Try `--force-frame` to use server-side window decorations.
- If you experience GPU crashes, the app already attempts alternative GL backends; if crashes persist, disable hardware acceleration by launching with `--disable-gpu`.
