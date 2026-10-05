# Privacy and Personal Data

GFN Electron is an unofficial Linux desktop wrapper that loads the official Nvidia GeForce NOW web application in a single Electron BrowserWindow. It does not collect, store, or transmit personal data to the project maintainers; all processing occurs locally on the user's machine, while the remote GeForce NOW service handles account, session, and streaming data under Nvidia's own policies.

**Information reviewed:** 2026-10-05

## 📑 Table of Contents

- [What This Document Covers](#what-this-document-covers)
- [Self-Hosted Deployments](#self-hosted-deployments)
- [Data We Handle](#data-we-handle)
- [Processing and Use](#processing-and-use)
- [Storage, Retention, and Deletion](#storage-retention-and-deletion)
- [External Processing and Integrations](#external-processing-and-integrations)
- [User Controls and Requests](#user-controls-and-requests)
- [International Transfers](#international-transfers)
- [Data Protection and Security](#data-protection-and-security)
- [Document Changes](#document-changes)
- [Contact](#contact)

## 🔎 What This Document Covers

This document describes how GFN Electron at https://github.com/hmlendea/gfn-electron handles personal data. It covers the Electron application behaviour and verified integrations described below. The software is self-hosted; the instance operator controls local storage, logs, backups, access, retention, and applicable user requests unless the project directly controls those functions.

The project maintainers do not operate a server, service, or cloud component. No personal data is transmitted to the project maintainers.

## 🏠 Self-Hosted Deployments

GFN Electron is distributed as a Linux desktop application (FlatHub, AUR, GitHub Releases) that each user installs and runs locally. The instance operator controls the application's configuration, local storage, logs, backups, access controls, retention, and request handling.

Data sent from a self-hosted instance to external services:
- **GeForce NOW web traffic** — HTTPS navigation, session requests, and media stream to Nvidia's servers at `play.geforcenow.com`.
- **Discord rich presence** — an optional page-title-derived activity string sent to a local Discord process when enabled.
- **Startup console output** — the complete process argument list is logged at launch, which can expose launch identifiers in terminal output.

Optional flows that the operator can disable:
- Discord rich presence: `--disable-rpc` flag or `GFN_DISABLE_RPC=1` environment variable.

## 📥 Data We Handle

### Data Provided to the Application
- Command-line arguments (`--direct-start <cmsId>`) and environment variables (`GFN_DIRECT_START_ID`, `GFN_RESOLUTION_WIDTH`, `GFN_RESOLUTION_HEIGHT`, `GFN_REFRESH_RATE`, `GFN_ENABLE_EXPERIMENTAL_GPU_FLAGS`, `GFN_DISABLE_RPC`, `SteamDeck`, `WAYLAND_DISPLAY`, `FLATPAK_ID`).
- User interaction with the remote GeForce NOW page (keyboard, fullscreen, pointer lock).

### Data Generated or Collected by the Application
- GPU crash counter persisted as `{ "crashCount": <number> }` in `config.json` under Electron's `userData` directory.
- Generated Desktop Entry files written to `~/.local/share/applications/` (contains sanitised game title and CMS identifier).
- Unstructured console log records (user agent, arguments, transitions, failures, shortcut creation, GPU relaunch).

### Data Received from Integrations
- Page title from the GeForce NOW web page (used for streaming-mode detection and Discord rich presence).
- No personal data is received from third-party integrations beyond what the remote page provides.

## 🧭 Processing and Use

The application processes the data described above for these verified functions:
- GPU crash recovery — `crashCount` selects a progressive graphics fallback tier (EGL → ANGLE → disabled hardware acceleration).
- Session request adaptation — monitor width, height, FPS, and physical resolution are revised in supported `/v2/session` POST requests.
- Desktop launcher creation — CMS identifier and game title are written to a `.desktop` file for direct game launch.
- Discord rich presence — page title is sent as activity details to a local Discord process.
- Display backend selection — `WAYLAND_DISPLAY` and `SteamDeck=1` select Wayland/Steam Deck rendering flags.

## 🗄️ Storage, Retention, and Deletion

| Data | Location | Retention |
|------|----------|-----------|
| GPU crash counter | `userData/config.json` (Electron user data directory) | Persists until a non-crash quit resets it to `0` |
| Desktop launchers | `~/.local/share/applications/*.desktop` | Persistent; no deletion or stale-launcher maintenance exists |
| Browser session state | Electron default session (Chromium-managed cookies, cache, storage) | Follows Electron default-session behaviour; no custom retention policy |
| Console logs | Terminal output | Not persisted by the application |

The project does not define cookie, cache, or credential retention policy; those follow Electron's default session and the remote GeForce NOW page.

## 🔗 External Processing and Integrations

| Service or integration | Purpose | Data involved | Configuration or documentation |
|------------------------|---------|---------------|--------------------------------|
| Nvidia GeForce NOW (`play.geforcenow.com`) | Game streaming, authentication, game discovery | HTTPS session traffic, stream media | Loaded at `https://play.geforcenow.com`; no repository-owned API contract |
| Discord desktop process | Optional rich presence | Page-title-derived activity string | `--disable-rpc` or `GFN_DISABLE_RPC=1` to disable |

The application has no built-in telemetry, metrics exporter, remote logging client, or external data transfer beyond the two integrations above.

## ⚙️ User Controls and Requests

The following documented controls are available:
- Disable Discord rich presence: `--disable-rpc` CLI flag or `GFN_DISABLE_RPC=1` environment variable.
- Override reported stream resolution: `GFN_RESOLUTION_WIDTH`, `GFN_RESOLUTION_HEIGHT` environment variables.
- Override reported refresh rate: `GFN_REFRESH_RATE` environment variable.
- Direct-launch a game: `--direct-start <cmsId>` or `GFN_DIRECT_START_ID` environment variable.
- Disable GPU crash recovery tier progression: set `crashCount >= 2` in `config.json` (disables hardware acceleration).

No documented procedure exists for exporting or deleting browser session data; that is controlled by Electron's default session and the remote page.

## 🌍 International Transfers

The GeForce NOW web application is served by Nvidia (United States). Data transmitted to `play.geforcenow.com` crosses national borders according to the user's deployment location. The instance operator controls the deployment location; the project maintainers do not operate a server that receives this data.

## 🧒 Children

No age-related behaviour or restrictions are documented in the repository. The application loads the remote GeForce NOW page, which may apply its own age controls.

## 🛡️ Data Protection and Security

Verified technical and operational safeguards:
- No repository-owned server or cloud component processes user data.
- No application-specific telemetry, metrics, or remote logging exists in repository code.
- The preload adapter transforms session-request JSON in memory; transformed bodies are not persisted by repository code.
- Desktop launcher filenames and CMS identifiers are sanitised (digits extracted, non-alphanumeric characters replaced with `-`).

Known gaps (not guarantees):
- `contextIsolation: false` — preload and page scripts share a JavaScript context; page code can interfere with preload-installed globals.
- Direct-start values are concatenated into URLs without URI encoding or format validation.
- Remote page titles are inserted into Desktop Entry fields without escaping.
- No origin allow-list for new-window navigation; new-window requests are denied but navigated in the existing window.
- Startup logs include the complete process argument list, which can expose launch identifiers.

For self-hosted deployments, the instance operator is responsible for updates, secrets, access controls, backups, network exposure, and log protection.

## 🔄 Document Changes

Update this document when application data flows, storage, integrations, or deployment responsibilities change. The current version is published at `PRIVACY.md` in the repository root.

## 📬 Contact

For questions about application data handling, contact the project maintainers via the [GitHub repository](https://github.com/hmlendea/gfn-electron). For a self-hosted instance, contact the instance operator. Include the deployment context or data-flow details if relevant; do not send passwords, access tokens, or other secrets.