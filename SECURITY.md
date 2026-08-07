# Security Policy

This policy defines vulnerability reporting principles for this repository and clarifies that security maintenance is provided for the latest maintained release line only.

## 📑 Table of Contents

- Supported Versions
- Reporting a Vulnerability
- Scope
- Disclosure Policy
- Safe Harbour
- Recognition

## 🛡️ Supported Versions

Use this table to indicate which project versions currently receive security maintenance.

| Version | Distribution Method | Supported |
|---------|--------------------|-----------|
| Latest release | FlatHub | ✅ |
| Latest release | GitHub Releases | ❌ |
| Latest release | Unofficial third-party distribution channels | ❌ |
| Older releases | Any distribution channel | ❌ |

## 🚨 Reporting a Vulnerability

Please do not disclose suspected vulnerabilities publicly before maintainers have had an opportunity to validate and remediate them.

To report a vulnerability, contact the maintainers directly

Preferred private channel:
- GitHub Security Advisories via this repository Security tab

Include the following details where possible:
- Vulnerability summary
- Impact assessment
- Reproduction steps
- Proof of concept
- Affected version and distribution method

## 📌 Scope

The subsequent report categories are in scope for this repository:
- Electron application wrapper vulnerabilities (for example IPC boundaries, preload exposure, and desktop integration)
- Project packaging and distribution security defects (for example release artefacts and launch-flag handling)

The subsequent categories are out of scope unless explicitly stated to the contrary:
- NVIDIA GeForce NOW backend, infrastructure, or account-system vulnerabilities
- Security issues in unrelated third-party systems not maintained in this repository

## 📢 Disclosure Policy

This project follows coordinated disclosure:
1. Vulnerabilities are investigated privately.
2. A remediation plan is prepared and validated.
3. Public disclosure is published after a fix, mitigation, or agreed risk decision is available.
4. Credit is attributed in accordance with reporter preference and project policy.

## 🧾 Safe Harbour

If your research is conducted in good faith, confined to authorised scope, and disclosed responsibly, the maintainers will not pursue action for policy-compliant activity.

## 🙏 Recognition

We appreciate responsible disclosure. Reporters who desire public attribution may be acknowledged in release notes, advisories, or a dedicated acknowledgements section.
