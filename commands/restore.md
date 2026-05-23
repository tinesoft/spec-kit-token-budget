---
description: >
  Restore one or more Spec-Driven Development artifacts to their original
  (pre-compaction) state from the <artifact>.full.md backups created by
  /compact. Deletes each backup after a successful restore.
scripts:
  sh: scripts/bash/compact_helper.sh
  ps: scripts/powershell/compact_helper.ps1
---

# /speckit.token-budget.restore

The user has invoked `/speckit.token-budget.restore` with arguments: `$ARGUMENTS`.

## Your task

Restore one or more SDD artifacts in the active feature to their original
(pre-compaction) state, using the `<artifact>.full.md` backups that
`/compact` created. Delete each backup after a successful restore.

## Inputs

1. Resolve the active feature directory (typically `specs/<NNN-feature-name>/`)
   from the current git branch using the existing spec-kit conventions. If the
   user is not on a feature branch, ask which feature to operate on and stop.

2. Parse `$ARGUMENTS`:
   - empty → restore every artifact in the active feature directory that has a
     corresponding `.full.md` backup.
   - `spec` | `plan` | `tasks` | `research` | `data-model` | `contracts` |
     `quickstart` | `constitution` → restore only that artifact (or that group,
     in the case of `contracts`).
   - a relative or absolute path → restore that specific file.
   - `--dry-run` → report what would be restored, write nothing.

## Algorithm — apply in order, per artifact

### Step 1 — Discover candidates

Build the list of artifacts to process:
- If a specific artifact name or path was given, resolve it to its `.md` path
  and check that a matching `.full.md` backup exists. If not, report
  "no backup found for `<file>`" and stop.
- If no argument was given, scan the feature directory for `*.full.md` files
  and derive the corresponding `*.md` path for each.
- If no backups exist at all, print "No compaction backups found in
  `<feature-dir>`." and stop (not an error).

### Step 2 — Snapshot before

For each candidate, use `compact_helper.sh snapshot <file>` to record the
current (compacted) token count. Also note whether the file currently carries
the compaction marker (`has_marker <file>`). If the marker is absent but a
backup still exists, restore it anyway — the backup is the authoritative
source of truth.

### Step 3 — Restore (skipped for --dry-run)

If not `--dry-run`, call:

```
compact_helper.sh restore <file>
```

This copies `<file>.full.md` back over `<file>` and deletes the backup.
The helper prints one of:
- `"restored"` — success.
- `"skipped-no-backup"` — backup disappeared between discovery and restore
  (race condition). Warn and skip this artifact.
- `"skipped-missing"` — the compacted file itself is gone. Warn and skip.

### Step 4 — Snapshot after

Use `compact_helper.sh snapshot <file>` on the restored file to get the
post-restore token count (should match the original pre-compaction size).

### Step 5 — Report

Print one row per artifact, then a totals separator line:

```
spec.md           2,310 → 4,820 tokens   (+108.7%)   [backup deleted]
plan.md           3,580 → 6,140 tokens    (+71.5%)   [backup deleted]
──────────────────────────────────────────────────────────────────────
total             5,890 → 10,960 tokens   (+86.1%)
```

For `--dry-run`, replace `[backup deleted]` with `[dry-run — no changes]`.

Then end the response. Do not narrate the steps you took.

## Scripts

The helper script `scripts/bash/compact_helper.sh` provides:
- `snapshot <file>` — prints the current token count.
- `has_marker <file>` — exit 0 if file carries the compaction marker.
- `restore <file>` — copies the backup back and deletes it; prints the result.

## Notes

- Restore is the exact inverse of compact. The restored file is the original
  content — it never contained the compaction marker, so no marker cleanup is
  needed.
- Running restore twice on the same artifact is safe: the second run will find
  no backup and skip with a warning.
- Restore does **not** re-compact. If the user wants to compact again at a
  different level, they should run `/compact --level=<level>` after restoring.
