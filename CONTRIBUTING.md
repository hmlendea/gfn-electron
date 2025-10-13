# Contributing to GeForce NOW Electron

Thanks for helping improve this project! This document explains the recommended Git workflow and PR expectations.

Branching

- Create a new branch per feature or fix, named with a short prefix, for example:
  - feat/feature-name
  - fix/bug-description
  - chore/docs-update

Commits

- Make small, focused commits. Use present-tense, imperative messages and include a short description.
- Optionally follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `perf:`.

Syncing with upstream

- Add upstream remote once: `git remote add upstream https://github.com/hmlendea/gfn-electron.git`
- Rebase your branch onto upstream/main before opening a PR to keep history linear:
  - `git fetch upstream`
  - `git rebase upstream/main`

Pull Requests

- Open a PR from your fork's feature branch to the upstream `main` branch.
- Include a clear description, testing steps, and link any relevant issues.

CI and checks

- This repository runs lint and tests on PRs. Please run `npm ci` and `npm run lint` locally before pushing.

Secrets and config

- Never commit secrets or real client IDs. Use `scripts/local-config.js` locally and keep `scripts/local-config.js.example` in the repo.

If you need help preparing a PR or squashing commits, ask and I can prepare commands or perform the action for you.
