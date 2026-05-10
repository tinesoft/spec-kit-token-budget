# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A [Spec Kit](https://github.com/github/spec-kit) extension (`extension.yml`) that adds four slash commands to reduce LLM token consumption in Spec-Driven Development workflows. It is installed by `specify extension add` and picked up by any agent spec-kit supports.

## Development workflow

This extension has no build step. There are no tests in the conventional sense — validation is done by installing the extension into a real spec-kit project and running the commands.

```bash
# Install locally into an SDD project for manual testing
specify extension add --dev /path/to/spec-kit-token-budget

# Estimate tokens for a file (used internally by the commands)
bash scripts/bash/estimate_tokens.sh <file>

# Test slim_output.sh
bash scripts/bash/slim_output.sh -- git status
bash scripts/bash/slim_output.sh -- git log -n 50

# Test compact_helper.sh subcommands directly
bash scripts/bash/compact_helper.sh snapshot <file>
bash scripts/bash/compact_helper.sh summarize <orig> <compacted>
bash scripts/bash/compact_helper.sh has_marker <file>
bash scripts/bash/compact_helper.sh stamp <file> medium
```

PowerShell equivalents live under `scripts/powershell/` and mirror the bash API exactly.

## Architecture

The extension has two layers:

**1. Slash command prompts (`commands/*.md`)**
Each file is a full agent instruction prompt with YAML frontmatter. The frontmatter declares `scripts.sh` / `scripts.ps1` pointers to helper scripts. The agent follows the in-prompt algorithm to do content transformation (rewriting artifacts, writing manifests, toggling directives); the scripts handle the deterministic bookkeeping side.

- `compact.md` — artifact compaction in three levels (light / medium / aggressive). Instructs the agent to rewrite in place with hard guardrails: never touch lines with IDs matching `preserve_id_patterns`, never touch `preserve_sections` headings, never touch fenced code blocks. Uses `compact_helper.sh` for backup, token snapshot, and stamp.
- `scope.md` — reads `scope.phase_inputs` from config, builds a per-phase reading manifest at `specs/<feature>/.token-budget/scope-<phase>.md`. Uses `estimate_tokens.sh` to budget each artifact.
- `concise.md` — locates the right agent memory file (AGENTS.md preferred, then agent-specific files in priority order from `concise.memory_files`), then inserts or removes a directive block between unique HTML comment markers.
- `usage.md` — read-only dashboard. Calls `estimate_tokens.sh` for each artifact, compares against `.full.md` backups, projects per-phase budgets.

**2. Shell helper scripts (`scripts/bash/`)**
Pure-bash, dependency-free. Three scripts:

- `estimate_tokens.sh` — token counting. Uses `tiktoken` (cl100k_base) if `python3 + tiktoken` are available; falls back to `chars/4`. Outputs `<count>\t<path>` per file, or `--total` / `--json` modes.
- `compact_helper.sh` — bookkeeping for compact: `backup_if_needed`, `snapshot`, `summarize`, `has_marker`, `stamp`. Never rewrites content — that's the agent's job.
- `slim_output.sh` — wraps a CLI command and compresses its output using rule-based strategies (`git_status`, `git_log`, `pytest`, `npm_test`, `head_tail`). Defers to the `rtk` binary if it's on `$PATH` and `TOKEN_BUDGET_PREFER_RTK` is not `0`.

**3. Extension manifest (`extension.yml`)**
Declares the extension id/version, the four commands with their aliases, the config template, and the six lifecycle hooks (`after_specify`, `after_plan`, `after_tasks`, `before_plan`, `before_tasks`, `before_implement`). Spec-kit's `CommandRegistrar` translates this into the right directory structure for whichever agent is installed.

**4. Config (`token-budget-config.template.yml`)**
All tunable knobs with inline comments. The user copies this to `token-budget-config.yml` in the extension directory. Environment overrides use the `SPECKIT_TOKEN_BUDGET_<DOTTED_KEY>` pattern.

## Key invariants

- `compact` is **lossless**: lines matching `preserve_id_patterns` (FR-, NFR-, T-, US-, AC- prefixed IDs) and headings matching `preserve_sections` must never be modified or removed.
- Re-compaction always reads from `<artifact>.full.md`, never from the already-compacted file, to prevent lossy compounding.
- `concise` writes only between `<!-- BEGIN token-budget concise-mode -->` / `<!-- END token-budget concise-mode -->` markers — never inline with user content — so `concise off` is a deterministic block delete.
- `scope` and `usage` are read-only; they never modify SDD artifacts.


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax


<!-- nx configuration end-->