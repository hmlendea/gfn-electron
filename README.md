[![Donate](https://img.shields.io/badge/-%E2%99%A5%20Donate-%23ff69b4)](https://hmlendea.go.ro/fund.html) [![Build Status](https://github.com/hmlendea/gfn-electron/actions/workflows/node.js.yml/badge.svg)](https://github.com/hmlendea/gfn-electron/actions/workflows/node.js.yml) [![Latest GitHub release](https://img.shields.io/github/v/release/hmlendea/gfn-electron)](https://github.com/hmlendea/gfn-electron/releases/latest)

# About

Unofficial client for Nvidia's GeForce NOW game streaming service, providing a native Linux desktop experince and some additional features such as Discord rich presence.

## Disclaimer

This project and its contributors are not affiliated with Nvidia, nor it's GeForce NOW product. This repository does not contain any Nvidia / GeForce NOW software. It is simply an Electron wrapper that loads the official GFN web application page, just as it would in a regular web browser.

# Installation

[![Get it from the AUR](https://raw.githubusercontent.com/hmlendea/readme-assets/master/badges/stores/aur.png)](https://aur.archlinux.org/packages/geforcenow-electron/) [![Get it from FlatHub](https://raw.githubusercontent.com/hmlendea/readme-assets/master/badges/stores/flathub.png)](https://flathub.org/apps/details/io.github.hmlendea.geforcenow-electron) [![Get it from the Snap Store](https://raw.githubusercontent.com/snapcore/snap-store-badges/master/EN/%5BEN%5D-snap-store-white.png)](https://snapcraft.io/geforcenow-electron)

***Note**: The main version of this project, which receives the most support, is the flatpak version hosted on FlatHub!*

## Manual Installation

 - Go to the [latest release](https://github.com/hmlendea/gfn-electron/releases/latest).
 - Download the specific file that best fits your disto.

***Note**: Manual installations are possible but not supported. Please use the flatpak version if you have any trouble with the manual installation!*

# Usage

 - [Basic usage](https://github.com/hmlendea/gfn-electron/wiki/Basic-usage)
   - [Keyboard shortcuts](https://github.com/hmlendea/gfn-electron/wiki/Basic-usage#keyboard-shortcuts)
   - [Command-line arguments](https://github.com/hmlendea/gfn-electron/wiki/Basic-usage#command-line-arguments)
   - [Changing the keyboard layout](https://github.com/hmlendea/gfn-electron/wiki/Basic-usage#changing-the-keyboard-layout)
   - [Directly launching a game from the desktop](https://github.com/hmlendea/gfn-electron/wiki/Basic-usage#directly-launching-a-game-from-the-desktop)
 - [Integrations](https://github.com/hmlendea/gfn-electron/wiki/Integrations)
   - [Discord](https://github.com/hmlendea/gfn-electron/wiki/Integrations#discord)
     - [Using native GFN + flatpak Discord](https://github.com/hmlendea/gfn-electron/wiki/Integrations#using-native-gfn--flatpak-discord)
     - [Disabling the Discord RPC](https://github.com/hmlendea/gfn-electron/wiki/Integrations#disabling-the-discord-rpc)
 - [Troubleshooting](https://github.com/hmlendea/gfn-electron/wiki/Troubleshooting)
   - [Gamepad controls are not detected](https://github.com/hmlendea/gfn-electron/wiki/Troubleshooting#gamepad-controls-are-not-detected)
   - [Steam Deck controls are not detected](https://github.com/hmlendea/gfn-electron/wiki/Troubleshooting#steam-deck-controls-are-not-detected)

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
 - [Basic usage](https://github.com/hmlendea/gfn-electron/wiki/Basic-usage)
 - [Troubleshooting](https://github.com/hmlendea/gfn-electron/wiki/Troubleshooting)
