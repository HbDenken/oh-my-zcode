---
name: worktrees
description: Isolate parallel, risky or experimental coding lanes. Desktop uses native worktree tasks; CLI has no worktree tool and falls back to git worktree with absolute paths.
---

# Worktrees

Use a worktree lane when work needs its own build, touches areas another lane is editing, or may be thrown away. Do not use one for a small single-file change or a docs edit.

## Host routing

### Desktop — native worktree tasks

ZCode Desktop owns worktrees. A lane is a task, not a `git worktree` command.

1. Start each lane as its own task: enable the worktree toggle in the composer, or fork the conversation to a worktree (`fork to worktree`).
2. One lane = one task/session. The session cwd is the worktree, so subagents you dispatch inherit it; put absolute paths in cross-session notes.
3. ZCode owns the managed location (outside the repo), branch, creation card with retry/continue-local, task-row icon, and removal. Do not run `git worktree add/remove`, do not edit `.gitignore`/`.ignore`, and keep no lane registry.
4. Use fork-to-worktree for an experiment that may be discarded; continue in the local checkout only when worktree creation fails and the user accepts that fallback.

### CLI — no worktree tool

The CLI exposes no worktree tool and `Agent` has no cwd parameter: a dispatched subagent does not enter the lane. Prefer same-checkout lanes with disjoint write scopes. When the user explicitly wants a worktree lane:

1. Confirm the repo is clean enough and inspect `git worktree list`.
2. Put lanes in `.oh-my-zcode/worktrees/<slug>` and add that path to `.gitignore`. Do not use `.zcode/`: that name is ZCode's own runtime data directory, and lanes there are easily confused with tool state.
3. `git worktree add .oh-my-zcode/worktrees/<slug> -b <slug> <base>` after explicit confirmation.
4. Give every subagent the absolute lane path and require all edits, builds and tests there; verify the files changed in the lane, not the main checkout.
5. Remove the lane only after it is merged or archived and the user confirms.

### Never

- Dynamic-workflow agent `isolation: "worktree"` throws `not implemented yet` — do not use it in a workflow script.
- Do not hand-create worktrees when Desktop native lanes are available.
- Do not treat a worktree as a backup: uncommitted lane changes are lost on removal.

## Lane contract

- One writer per lane; write scopes must be disjoint. Agree interfaces before dispatch.
- The orchestrator owns lane plan, integration and cleanup; specialists only work inside their lane.
- Verify each lane before integration; show a diff against the base; ask before merge, cherry-pick, removal or any force/reset.
- Parallel lanes are only useful when their verification is independent; shared generated files or lockfiles are a conflict, not a lane.
