# Security Policy

## Supported Versions

Security fixes are generally provided for the latest release only.

| Version | Supported |
| --- | --- |
| Latest release | :white_check_mark: |
| Older releases | :x: |
| Development builds from `master` | Best effort |

## Reporting a Vulnerability

Please do not report security vulnerabilities via public GitHub issues.

Use one of these private channels:

- GitHub Security Advisories (preferred):
  - Open a private advisory report via this repository's Security tab.

Please include:

- A clear summary of the vulnerability.
- Impact assessment (what an attacker could do).
- Steps to reproduce.
- A proof of concept (if available).
- Affected version(s) and installation method (Flatpak, AppImage, zip, distro package).
- Any suggested remediation.

## Disclosure Process

- You will receive an acknowledgement as soon as possible.
- We will investigate and validate the report.
- If confirmed, we will prepare and release a fix as soon as practical.
- We request coordinated disclosure and ask that details remain private until a fix is published.

## Scope Notes

This project is an Electron wrapper around NVIDIA GeForce NOW web services.

- Vulnerabilities in NVIDIA infrastructure, account systems, or the GeForce NOW backend should be reported directly to NVIDIA.
- Vulnerabilities introduced by this wrapper (desktop integration, Electron runtime usage, IPC, packaging, launch flags, and similar areas) are in scope for this repository.

## Security Updates

When possible, security-relevant fixes will be noted in release notes.
