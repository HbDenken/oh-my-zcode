---
description: Start a deepwork session for a complex, high-risk, multi-phase coding task
argument-hint: <task description>
skills: deepwork
---

Use the deepwork skill for this task. Treat it as a heavy coding session.

Task: $ARGUMENTS

The `deepwork` skill owns the pass protocol, state files, gate rules, and completion criteria. Follow it; do not restate it here.

Command-specific notes:
- apply the skill's ignore-file setup before creating any state (`.gitignore` gets `.oh-my-zcode/deepwork/`; `.ignore` gets the allowlist lines), adding only missing entries;
- create/update the progress file under `.oh-my-zcode/deepwork/` and show the user a compact pass plan (phase titles, lanes, specialists, gate points) before dispatching;
- run the oracle gate exactly where the skill requires it: one short design review before dispatch when a pass touches persistent state, money, concurrency, crash recovery, or destructive operations, then one pass-level gate at the end of each pass.
- if the `zcode-auto-continue` plugin is enabled, run `/auto-continue pause` before the first dispatch and `/auto-continue resume` after the final pass gate passes.
