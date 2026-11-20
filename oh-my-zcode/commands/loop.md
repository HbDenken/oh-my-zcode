---
description: Run an automated execute-verify loop (dispatch the right subagent, verify, iterate with file-based history)
argument-hint: <goal until criteria, max N tries>
skills: loop-engineering
---

The user ran `/loop`. From the text below, extract: goal, successCriteria, maxAttempts.

If goal or successCriteria are missing or unclear - push back and ask the user to clarify.
Do not assume or guess. Both must be explicit.

maxAttempts is optional: when the user does not give one, use the `loop-engineering`
skill's default of 3 and say so before the first attempt. If the user gives one, use it.

If the text below is empty, show this usage help instead:

Usage: `/loop <description>`

Describe what to accomplish, what success looks like, and how many tries.

Examples:
  `/loop fix typescript errors until typecheck passes, max 3 tries`
  `/loop improve api performance until response under 500ms, try 5 times`
  `/loop refactor auth module, tests must pass, 4 attempts max`

Once all three are clear, run the loop per the `loop-engineering` skill (success types, attempt protocol, and escalation rules live there).

Before the first attempt, keep history out of git: append `.oh-my-zcode/loop-history/` to `.gitignore` if missing, and add `!.oh-my-zcode/`, `!.oh-my-zcode/loop-history/`, `!.oh-my-zcode/loop-history/**` to `.ignore` if missing. Never duplicate existing entries.

User input: $ARGUMENTS

Per attempt: dispatch the execute subagent chosen per the `loop-engineering` skill's Grill step (fixer by default; designer / Explore / librarian when the goal calls for it), verify against successCriteria, write `.oh-my-zcode/loop-history/loop-<timestamp>/history-001.md` (increment the number each attempt) with PASS/FAIL + reason, then follow the skill's monitor rules (PASS stops, FAIL under max retries, FAIL at max escalates).

If the `zcode-auto-continue` plugin is enabled, run `/auto-continue pause` before the first attempt and `/auto-continue resume` once the loop stops (PASS or max attempts).
