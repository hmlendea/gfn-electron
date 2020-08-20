# geforcenow-electron

GeForce Now application written in Electron, wrapping around the web browser GFN implementation for ChromeBooks

## How to run

You can run this wrapper directly from a local directory cloned via git. On Arch Linux you can also use [this PKGBUILD](https://github.com/hmlendea/PKGBUILDs/blob/master/pkg/geforcenow-electron/PKGBUILD) for a system-wide installation.

### Requirements

Next to git, you will need to install [npm](https://www.npmjs.com/), the Node.js package manager. On most distributions, the package is simply called `npm`.

### Cloning the source code

Once you have npm, clone the wrapper to a convenient location:

```
git clone https://github.com/hmlendea/geforcenow-electron.git
```

### Installing dependencies and running

```
cd geforcenow-electron
npm install
npm start
```

On subsequent runs, `npm start` will be all that's required.

## Updating

Simply pull the latest version of master and install any changed dependencies:

```
cd geforcenow-electron
git checkout master
git pull
npm install
npm start
```
