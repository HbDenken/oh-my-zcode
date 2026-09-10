---
description: Review repeated work and suggest workflow improvements (skills, commands, subagents, config)
argument-hint: [focus] [--sessions] [--last N]
skills: reflect
---

Use the reflect skill for this request.

Focus: $ARGUMENTS

Reflect requirements:
- inspect existing skills, commands, subagents, prompt overrides, MCP permissions, config, and project playbooks before suggesting anything new;
- find repeated workflow patterns from the current conversation, project notes, local memories, logs, or session artifacts that are available and safe to inspect;
- prefer evidence from repeated recent behavior over speculation;
- recommend the smallest useful improvement: prompt/config rule, skill, command, custom subagent, MCP/tool permission change, project playbook, or skip;
- treat creating nothing as a valid result when evidence is weak;
- ask before changing prompts, skills, commands, subagents, MCP access, or config unless the user explicitly requested the exact edit;
- return a compact report with findings, recommended changes, skipped candidates, and items needing more evidence.

Session Reflection Mode (only if `--sessions` appears in the arguments):
- Analyze the last N sessions (use `--last N` to adjust, default 50)
- Extract session records from ZCode logs under `~/.zcode/cli/log/zcode-<date>.jsonl`
- Analyze each session for patterns and friction
- Aggregate findings across all sessions
- Report with scope (global/cross-repo/project-specific), confidence, and impact
