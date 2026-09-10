---
name: oh-my-zcode
description: Configure and improve the oh-my-zcode plugin setup for the current user. Use when users want to tune subagent models, prompts, skills, commands, MCP servers, or plugin behavior. Also use when recurring workflow friction suggests a safe config or prompt improvement.
---

# oh-my-zcode Configuration Skill

You help users configure, customize, and safely improve their oh-my-zcode
multi-agent setup.

The goal is not just to answer configuration questions. When useful, help the
user make their agent system better for future runs: tune subagent models,
adjust subagent prompts, add focused custom subagents, and document
restart requirements.

## When to Use

Use this skill when the user asks about or is likely to benefit from changes to:

- subagent definitions (`~/.zcode/agents/*.md` or plugin-provided agents)
- subagent models, thinking effort (`thoughtLevel`), or tool permissions
- skills (`~/.zcode/skills/` or plugin skills)
- slash commands (`~/.zcode/commands/` or plugin commands)
- MCP servers (`~/.zcode/cli/config.json` → `mcp.servers`, or plugin MCP)
- plugin enable/disable state and installed marketplaces
- recurring workflow friction that could be fixed by a prompt/config change

Also use it proactively, with restraint, when a session reveals a repeatable
improvement opportunity. Example: if the user repeatedly asks the same
subagent to follow a project-specific rule, suggest adding that rule to the
subagent's system prompt.

## What Is Possible

Concrete configuration surfaces:

| Path / Location | Use |
|---|---|
| `~/.zcode/agents/<name>.md` | User-level custom subagent (markdown + frontmatter) |
| Plugin `agents/*.md` | Plugin-provided subagents (read-only in Settings; copy to user dir to override) |
| `~/.zcode/skills/<name>/SKILL.md` | User-level skill |
| `~/.zcode/commands/<name>.md` | User-level slash command |
| `~/.zcode/cli/config.json` → `mcp.servers` | User-level MCP servers |
| `<repo>/.zcode/config.json` → `mcp.servers` | Workspace MCP servers (auto-connected) |
| `<repo>/AGENTS.md` / `~/.zcode/AGENTS.md` | Project / user instructions injected into context |
| Settings → 子智能体 | Create/edit user subagents (writes `~/.zcode/agents/*.md`) |
| Settings → 插件 | Install/enable/disable plugins and marketplaces |

Subagent frontmatter fields: `name` and `description` (required), `model`
(`inherit` or a specific model), `thoughtLevel` (only with a specific model),
`color`, `tools` / `disallowedTools`, `maxTurns`, `injectAgentsMd` (default
true), `mcpServers`. The body is the subagent's system prompt.

Tool permission boundaries:

- `tools` empty or `*` → inherits all tools including connected MCP tools.
- Custom `tools` list → only the listed built-in tools; MCP tools become
  unavailable unless written as full names (`mcp__<server>__<tool>`), and
  skills may become unavailable to that subagent.
- Subagents cannot spawn further subagents (runtime-enforced).
- Subagents only see MCP servers connected when the session started.

Common customizations:

- **Tune models**: assign a specific `model` per subagent in its `.md` file,
  or via Settings → 子智能体.
- **Limit costs**: cheaper models for fixer / librarian lanes.
- **Improve quality**: stronger models for oracle, or design-heavy designer work.
- **Enable observer**: point it at a vision-capable model; it needs one.
- **Add custom subagents**: create focused specialists in `~/.zcode/agents/`.
- **Tune prompts**: edit the subagent's body text (copy a plugin subagent to
  the user dir first — plugin-provided ones are read-only).

## Safe Improvement Rules

Configuration changes affect future agent behavior, so treat them as user-owned.

1. **Ask before changing config or prompts.**
   - Explain the proposed improvement briefly.
   - State which file would change.
   - Ask for confirmation unless the user explicitly requested the exact edit.
2. **Prefer narrow changes.**
   - Do not rewrite large prompts when a small rule solves the problem.
   - Do not add custom subagents for one-off tasks.
3. **Preserve existing user settings.**
   - Merge with current config rather than regenerating from scratch.
   - Keep frontmatter fields not related to the change.
4. **Avoid hidden behavior changes.**
   - Mention cost, permissions, or delegation changes before applying them.
   - Be explicit if a model/provider change may increase spend.
5. **Tell the user about restart requirements.**
   - Subagent definition changes require a **new session** to take effect
     (running sessions are not hot-reloaded).
   - Phrase it as: "This applies to new sessions; start a new session to use it."

## Configuration Workflow

When making or proposing changes:

1. **Inspect current setup**
   - Read the relevant subagent `.md` files and the plugin manifest.
   - Check for name collisions between user agents and plugin agents.
2. **Decide the smallest useful change**
   - Model tuning for performance, quality, or cost.
   - Prompt tuning for recurring behavior.
   - Custom subagent when a repeatable specialty deserves a separate lane.
3. **Ask for confirmation**
   - Show a concise proposal.
   - Include the target file path.
4. **Apply the edit carefully**
   - Preserve unrelated settings and frontmatter fields.
   - Keep subagent names and skill/MCP names exact.
5. **Validate**
   - Ensure the markdown frontmatter remains parseable.
   - Confirm `name`/`description` are present (missing → file ignored with a diagnostic).
   - Remind the user a new session is required.
