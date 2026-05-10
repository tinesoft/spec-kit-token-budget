# Contributing to spec-kit-token-budget

Thank you for your interest in contributing! This project is open source under the MIT license. By participating you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md) (if present) and the project's license terms.

## Prerequisites

- **Git**
- **Node 20+** — used by commitlint and the release scripts
- **bash** (Linux/macOS) or **PowerShell** (Windows) — for the helper scripts
- **`specify` CLI** — for manual end-to-end testing ([spec-kit installation](https://github.com/github/spec-kit))

## Development Workflow

This extension has **no build step**. Source lives in `src/` and is used as-is.

### Install locally for manual testing

```bash
specify extension add --dev /path/to/spec-kit-token-budget
```

Then open a spec-kit project and run the slash commands (`/compact`, `/scope`, `/concise`, `/usage`) inside your agent to validate behavior.

### Test helper scripts directly

```bash
# Token estimator
bash scripts/bash/estimate_tokens.sh <file>

# Slim output wrapper
bash scripts/bash/slim_output.sh -- git status
bash scripts/bash/slim_output.sh -- git log -n 50

# Compact bookkeeping subcommands
bash scripts/bash/compact_helper.sh snapshot <file>
bash scripts/bash/compact_helper.sh summarize <orig> <compacted>
bash scripts/bash/compact_helper.sh has_marker <file>
bash scripts/bash/compact_helper.sh stamp <file> medium
```

PowerShell equivalents live under `scripts/powershell/` and mirror the bash API exactly.

## Commit Conventions

All commits **must** follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. The `commit-msg` hook (via Husky + commitlint) enforces this automatically — invalid messages are rejected before the commit is created.

```
# Valid
feat(compact): add aggressive compaction level
fix(scope): handle missing phase_inputs gracefully
docs: update README install instructions

# Invalid — will be rejected
updated stuff
WIP
```

Commit types map directly to semantic version bumps:

| Type | Version bump |
|---|---|
| `fix` | patch |
| `feat` | minor |
| `BREAKING CHANGE` footer | major |

## Submitting a Pull Request

> **For large or material changes, open an issue to discuss the approach before writing code.**

1. Fork the repository and create a branch off `develop`:
   ```bash
   git checkout develop
   git checkout -b feat/my-change
   ```
2. Make your changes. Keep the PR focused — one logical change per PR.
3. Update documentation in `src/` if your change affects user-facing behavior (commands, config, scripts).
4. Push and open a PR **targeting `develop`**, not `main`.
5. Describe what you changed and how you tested it (which commands / scripts you ran and what you observed).

## Release Process

Releases are **fully automated** — contributors do not need to tag or version anything manually.

When a maintainer merges `develop` into `main`, GitHub Actions runs the release workflow (`.github/workflows/release.yml`), which:

1. Bumps the version in `package.json` and `src/extension.yml` based on conventional commit history
2. Generates `src/CHANGELOG.md`
3. Creates a git commit and tag (`v<version>`)
4. Publishes a GitHub Release with the `src/` directory packaged as a `.zip` asset

To preview what a release would look like without publishing:

```bash
npm run release:dry
```

## Resources

- [spec-kit documentation](https://github.com/github/spec-kit)
- [Conventional Commits specification](https://www.conventionalcommits.org/)
- [How to contribute to open source](https://opensource.guide/how-to-contribute/)
