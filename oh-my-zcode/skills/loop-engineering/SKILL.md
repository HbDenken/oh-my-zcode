---
name: loop-engineering
description: Loop engineering. Grill the goal for explicit success criteria, then drive an execute-verify loop with explicit attempt tracking and human escalation.
---

# Loop Engineering Skill

## Grill (orchestrator interview)

1. Goal: "What are you trying to accomplish?"
2. Success criteria: "Describe how we know the loop succeeded."
3. Success type: choose from `test`, `build`, `lint`, `command`, `fileExists`, `oracle`, `observer`, `manual`. For CLI steps provide `successCommand`; for file detection provide `successPath`.
4. Execute subagent: fixer / designer / Explore / librarian
5. Verify subagent: oracle / observer / test
6. Max attempts (default 3)
7. Optional context files: which files or directories should be read before execution?

## Loop Monitor

The orchestrator drives the loop and reports progress; there is no runtime callback surface.

- Run one attempt at a time: dispatch the execute subagent, then the verify subagent, or run the success command directly.
- After each attempt, report the attempt number, the result, and the failure reason in one short message.
- For `manual` verification, present the failure reason first, then ask the user to pass or fail. Do not auto-resolve.
- On success, stop and report the final outcome.
- At max attempts without success, stop and escalate to the user with the accumulated failure reasons.
- If the user cancels, stop dispatching further attempts.