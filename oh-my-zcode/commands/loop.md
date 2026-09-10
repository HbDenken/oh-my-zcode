---
description: Run an automated execute-verify loop (dispatch fixer, verify, iterate with file-based history)
argument-hint: <goal until criteria, max N tries>
skills: loop-engineering
---

The user ran `/loop`. From the text below, extract: goal, successCriteria, maxAttempts.

If ANY are missing or unclear - push back and ask the user to clarify.
Do not assume or guess. All three must be explicit.

If the text below is empty, show this usage help instead:

Usage: `/loop <description>`

Describe what to accomplish, what success looks like, and how many tries.

Examples:
  `/loop fix typescript errors until typecheck passes, max 3 tries`
  `/loop improve api performance until response under 500ms, try 5 times`
  `/loop refactor auth module, tests must pass, 4 attempts max`

Once all three are clear, run the loop.

User input: $ARGUMENTS

For each attempt:
1. Create and read a history directory `.oh-my-zcode/loop-history/loop-<timestamp>/` for prior results (create it on the first attempt)
2. Dispatch the fixer subagent with the goal
3. When the fixer result returns, verify per the successCriteria
4. Write the result to `.oh-my-zcode/loop-history/loop-<timestamp>/history-{NNN}.md` (PASS/FAIL + reason)
5. PASS -> stop. FAIL under maxAttempts -> retry. FAIL at max -> escalate to the user.
