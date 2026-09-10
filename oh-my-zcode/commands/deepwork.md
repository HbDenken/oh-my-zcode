---
description: Start a deepwork session for a complex, high-risk, multi-phase coding task
argument-hint: <task description>
skills: deepwork
---

Use the deepwork skill for this task. Treat it as a heavy coding session.

Task: $ARGUMENTS

Deepwork requirements:
- before planning, delegation, or creating state, inspect existing `.gitignore` and `.ignore`; add only missing entries without duplicates: `.gitignore` must contain `.oh-my-zcode/deepwork/`, and `.ignore` must contain `!.oh-my-zcode/deepwork/` and `!.oh-my-zcode/deepwork/**`; this keeps state git-local yet readable;
- create/update a `.oh-my-zcode/deepwork/` progress file;
- save code/doc deliverables to project paths (e.g. `src/`, `docs/`); reserve `.oh-my-zcode/deepwork/` strictly for progress files;
- keep the todo list synced with the current phase;
- draft a phased implementation/delegation plan with a small number of coherent phases based on dependencies and natural delivery boundaries; do not split work merely to reduce review scope;
- before execution, show the user a compact overview with phase titles/order, delegated specialists and ownership/scope, plus the oracle review total, gate after each phase, and a short reason for each;
- execute phase by phase with background subagents where useful;
- background subagents return to this conversation automatically when they finish; reconcile results, validate and update state, then ask the oracle subagent to review every planned phase before continuing;
- batch material actionable oracle findings, including simplify/readability feedback, into one bounded remediation pass and validate it with focused evidence; only re-review when the remediation changes the reviewed decision/risk or the original concern cannot otherwise be verified.
