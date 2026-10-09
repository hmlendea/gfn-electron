# Contributing to GFN Electron

This document covers the guidelines and processes for contributing to this project, including how to report issues, suggest enhancements, submit code changes, and follow project standards.

## 📑 Table of Contents

- [How to Contribute](#-how-to-contribute)
  - [Reporting Issues](#reporting-issues)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Code Contributions](#code-contributions)
- [Code Style](#-code-style)
- [Testing](#-testing)
- [Documentation](#-documentation)
- [Code of Conduct](#-code-of-conduct)
- [Security Policy](#-security-policy)

## 🤝 How to Contribute

### Reporting Issues

- Search existing issues first.
- Use the issue templates if available.
- Provide clear reproduction steps.
- Include environment details.

### Suggesting Enhancements

- Check the roadmap and existing discussions.
- Explain the use case and expected behavior.
- Consider implementation complexity.

### Code Contributions

#### Prerequisites

- Node.js 20 or later
- npm

#### Development Setup

```bash
# Clone the repository
git clone https://github.com/hmlendea/gfn-electron.git
cd gfn-electron

# Install dependencies
npm install
```

#### Making Changes

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes.
4. Run tests: `npm run build` <!-- Only if tests exist. -->
5. Run linters: `npm run build` <!-- Only if linters exist. -->
6. Commit with clear and descriptive messages.
7. Push to your fork.
8. Open a Pull Request.

#### Pull Request Guidelines

- Target the `master` branch.
- Keep PRs focused and atomic.
- Update documentation if applicable.
- Add tests for any new functionality.
- Ensure the CI checks pass.

## 🎨 Code Style

Follow the project's coding standards:
- Maintain cross-platform compatibility
- Keep pull requests focused and consistent with the existing code style
- Run `npm run build` before committing to verify the build passes

## 🧪 Testing

```bash
# Run build to verify changes
npm run build

# Run the application to test manually
npm start
```

## 📚 Documentation

- Update relevant docs for changes.
- Follow the documentation style guide.
- Preview changes locally if possible.

## 📋 Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## 🔒 Security Policy

This project follows the [Security Policy](SECURITY.md).