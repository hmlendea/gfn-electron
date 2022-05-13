[![Donate](https://img.shields.io/badge/-%E2%99%A5%20Donate-%23ff69b4)](https://hmlendea.go.ro/fund.html) [![Build Status](https://github.com/hmlendea/gfn-electron/actions/workflows/node.js.yml/badge.svg)](https://github.com/hmlendea/gfn-electron/actions/workflows/node.js.yml) [![Latest GitHub release](https://img.shields.io/github/v/release/hmlendea/gfn-electron)](https://github.com/hmlendea/gfn-electron/releases/latest)

# About

Unofficial client for Nvidia's GeForce NOW game streaming service, providing a native Linux desktop experince and some additional features such as Discord rich presence.

## Disclaimer

This project and its contributors are not affiliated with Nvidia, nor it's GeForce NOW product. This repository does not contain any Nvidia / GeForce NOW software. It is simply an Electron wrapper that loads the official GFN web application page, just as it would in a regular web browser.

# Installation

[![Get it from the AUR](https://raw.githubusercontent.com/hmlendea/readme-assets/master/badges/stores/aur.png)](https://aur.archlinux.org/packages/geforcenow-electron/) [![Get it from FlatHub](https://raw.githubusercontent.com/hmlendea/readme-assets/master/badges/stores/flathub.png)](https://flathub.org/apps/details/io.github.hmlendea.geforcenow-electron) [![Get it from the Snap Store](https://raw.githubusercontent.com/snapcore/snap-store-badges/master/EN/%5BEN%5D-snap-store-white.png)](https://snapcraft.io/geforcenow-electron)

## Manual Installation

 - Go to the [latest release](https://github.com/hmlendea/gfn-electron/releases/latest).
 - Download the specific file that best fits your disto.

# Usage

If you've installed it through a package manager, then you can launch it directly from your desktop environment.
You can also run `geforcenow` _(or `io.github.hmlendea.geforcenow-electron` if you're using flatpak)_ in the terminal.

## Keyboard shortcuts

 - **Super + F** / **F11**: Toggles the fullscreen mode
 - **ALT + F4** / **F4**: Exits app
 - **ALT + Home**: Switches back to the GeForce NOW Home page
 - **CTRL + M**: Toggles the microphone
 - **F12**: Toggles chrome dev tools

## Command-line arguments

 - **--spoof-chromeos**: Uses a ChromeOS UserAgent string
 - **--spoof-windows**: Uses a Windows UserAgent string
 - **--disable-rpc**: Disables the Discord Rich Presence

## Changing the keyboard layout

Currently NVIDIA doesn't allow changing the keyboard layout on Linux.

In order to get access to that setting, use one of the UA-spoofing CLI arguments mentioned above.

## Discord Rich Presence

Discord RPC should work out-of-the-box in most situations, with no user input required.
The exceptional cases are documented below.

### Native GFN + Flatpak Discord
Run the following commands in a terminal: *([source](https://github.com/flathub/com.discordapp.Discord/wiki/Rich-Precense-(discord-rpc)#unsandboxed-applications))*
```bash
mkdir -p ~/.config/user-tmpfiles.d
echo 'L %t/discord-ipc-0 - - - - app/com.discordapp.Discord/discord-ipc-0' > ~/.config/user-tmpfiles.d/discord-rpc.conf
systemctl --user enable --now systemd-tmpfiles-setup.service
```

### Disabling the Discord RPC
Currently, the only way to disable it is to use the `--disable-rpc` command-line argument ([documented above](https://github.com/hmlendea/gfn-electron#command-line-arguments))

In order to make this permanent, you can edit the applications desktop file launcher and add that argument to the `Exec` line

# Building from source

## Requirements

You will need to install [npm](https://www.npmjs.com/), the Node.js package manager. On most distributions, the package is simply called `npm`.

## Cloning the source code

Once you have npm, clone the wrapper to a convenient location:

```bash
git clone https://github.com/hmlendea/gfn-electron.git
```

## Building

```bash
npm install
npm start
```

On subsequent runs, `npm start` will be all that's required.

## Updating the source code

Simply pull the latest version of master and install any changed dependencies:

```bash
git checkout master
git pull
npm install
```

# Links
 - [GeForce NOW](https://nvidia.com/en-eu/geforce-now)
 - [FlatHub release](https://flathub.org/apps/details/io.github.hmlendea.geforcenow-electron)
 - [FlatHub repository](https://github.com/flathub/io.github.hmlendea.geforcenow-electron)
