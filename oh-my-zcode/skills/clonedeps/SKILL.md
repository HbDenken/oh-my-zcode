---
name: clonedeps
description: Clone important project dependency source code into an ignored local workspace so ZCode can inspect library internals. Use when the user asks to clone dependencies, inspect dependency/source internals, understand SDK/framework behavior from source, debug library implementation details, or make core dependency repos locally readable. Do not use for ordinary API/docs questions where librarian is enough.
---

# Clonedeps Skill

You help users make a small set of important dependency source repositories
locally readable to ZCode.

This is a workflow skill, not a command wrapper. Do not use a helper script for
dependency detection, ref validation, cloning, status, or cleanup. The
orchestrator (with Explore) reads the local repo and decides what is worth
cloning; `librarian` resolves those dependencies to external source repos and
refs; the orchestrator performs the approved filesystem/git operations directly.

## Workflow

### Step 1: Check Existing State

First check whether `.oh-my-zcode/clonedeps.json` exists.

If it exists:

1. Read it before planning a new round of clones.
2. Check whether each listed `path` exists under `.oh-my-zcode/clonedeps/repos/`.
3. Reuse existing cloned repos when they already satisfy the user's task.
4. Only plan new clones if the existing manifest is
   missing, stale, or insufficient for the current task.

Do not rescan/re-plan from scratch when the manifest already has useful entries.

### Step 2: Build the Dependency List, Then Resolve Sources

Local discovery is not librarian's lane. Read the manifests and imports
yourself, or dispatch Explore, and produce the actual dependency list: what the
project does, its architecture, its integration points, and which external
libraries it depends on in practice.

Keep that list short: prefer 3-5 core dependencies — user-mentioned ones plus
central frameworks, SDKs, ORMs, runtime/plugin APIs, and build/runtime tools.
Do not list tiny utilities, transitive dependencies, or dev-only tools unless
they are directly relevant to the active task.

Then delegate **source resolution only** (official repo, ref, package path) to
`librarian`. Use this prompt:

```md
Resolve external source repositories for the dependencies of the current
project. Do not read or scan the local repo — the list below is your input and
it already covers what the project does, its architecture, its integration
points, and the libraries it uses.

Project:
- <one sentence: what the project does, its architecture, its integration points>

Dependencies:
- <name> <version or range> — how the project uses it

Think like a developer trying to debug or extend this project.

Which remote repositories, if cloned locally, would actually help understand the
codebase or solve likely implementation/debugging tasks?

Do not make a dependency dump. Most dependencies are not worth cloning.
Recommend a repo only when its source code would be more useful than docs or the
current repo alone.

For each recommendation, include:
- repo name
- repo URL
- suggested ref/tag/commit, verified where possible
- package subdirectory if the source is a monorepo
- why cloning this source would help
- when it would be useful
- caveats

Also include:
- repos/dependencies you considered but would not clone

Keep it small. Prefer 0–3 strong recommendations over 5 weak ones. If nothing
clearly needs cloning, say so.
```

Librarian should return a small plan with:

- dependency name;
- current version/range from the input list;
- official source repository URL;
- tag/commit/ref to check out;
- package subdirectory if the source is a monorepo;
- reason local source helps;
- caveats such as huge repo, missing tag, or uncertain version mapping.

### Step 3: Verify and Confirm the Plan

The orchestrator owns final approval. Before cloning:

1. Verify refs manually where possible with `git ls-remote`.
2. Prefer pinned tags or commit SHAs. If no exact tag exists, ask librarian to
   find the correct module-specific tag/commit or explain the fallback.
3. Only use HTTPS GitHub/GitLab-style repository URLs by default. Reject
   `file://`, SSH URLs, local paths, URLs with embedded credentials, and private
   or auth-required repositories unless the user explicitly approves that case.
4. Present the plan to the user with dependency, repo URL, ref, reason, and
   caveats.
5. Ask for confirmation before network cloning unless the user explicitly asked
   to clone immediately.

### Step 4: Update Ignore Files

Before cloning artifacts or cleaning cloned dependencies, inspect existing
`.gitignore` and `.ignore`. Update the managed block in place when present;
otherwise append it. Add only the missing exact lines below, never duplicate
entries or modify unrelated rules. These blocks keep cloned artifacts git-local
while the `.ignore` allowlist keeps them readable to ZCode.

`.gitignore`:

```gitignore
# BEGIN oh-my-zcode clonedeps
.oh-my-zcode/clonedeps/repos/
# END oh-my-zcode clonedeps
```

`.ignore`:

```ignore
# BEGIN oh-my-zcode clonedeps
!.oh-my-zcode/
!.oh-my-zcode/clonedeps.json
!.oh-my-zcode/clonedeps/
!.oh-my-zcode/clonedeps/repos/
!.oh-my-zcode/clonedeps/repos/**
.oh-my-zcode/clonedeps/repos/**/.git/
.oh-my-zcode/clonedeps/repos/**/.git/**
# END oh-my-zcode clonedeps
```

### Step 5: Clone Sources Manually

Create one folder per source repository under:

```text
.oh-my-zcode/clonedeps/repos/<safe-repo-name>/
```

Derive the safe name from the repository owner/name, not from the package name.
For example, `https://github.com/TanStack/query.git` becomes
`TanStack__query`. Replace `/` with `__`, strip common `.git` suffixes,
and replace other unsafe path characters with `_`.

If multiple packages come from the same monorepo, clone the repository once and
point each manifest entry at the same repo path with different `packagePath`
values as needed. Do not create ecosystem folders, per-package clone folders, or
per-version folders. If two different source repositories normalize to the same
safe name, disambiguate manually and record the chosen path in
`.oh-my-zcode/clonedeps.json`.

Clone/fetch with normal git commands. For an existing clone, first verify that
`git remote get-url origin` matches the approved repo URL. If it does not match,
stop and ask whether to clean/reclone.

Safe manual git pattern:

1. `git ls-remote <repoUrl> <ref>` to verify the ref where practical.
2. Clone without submodules/recursive behavior.
3. Prefer shallow fetch/clone where practical.
4. Clone into a temporary directory under `.oh-my-zcode/clonedeps/repos/`, then move it
   into the final safe-name path after checkout succeeds.
5. Remove failed temporary clones.

Do not run dependency install/build/test scripts from cloned repositories.

### Step 6: Write Local State

Write `.oh-my-zcode/clonedeps.json` so future agents know what exists:

```json
{
  "version": "1.0.0",
  "updatedAt": "2026-05-12T00:00:00.000Z",
  "dependencies": [
    {
      "name": "@tanstack/query-core",
      "resolvedVersion": "5.62.0",
      "repoUrl": "https://github.com/TanStack/query.git",
      "ref": "v5.62.0",
      "path": ".oh-my-zcode/clonedeps/repos/TanStack__query",
      "packagePath": "packages/query-core",
      "reason": "Plugin API source used by the project"
    },
    {
      "name": "@tanstack/react-query",
      "resolvedVersion": "5.62.0",
      "repoUrl": "https://github.com/TanStack/query.git",
      "ref": "v5.62.0",
      "path": ".oh-my-zcode/clonedeps/repos/TanStack__query",
      "packagePath": "packages/react-query",
      "reason": "Core SDK source used to inspect runtime behavior"
    }
  ]
}
```

版本号、ref 与 packagePath 都是示例值；写入前用 `git ls-remote` 校验真实 tag，不要照抄。

If a clone fails after earlier clones succeeded, still write state for the
successful clones so future inspection is not misleading.

Do not add `.oh-my-zcode/clonedeps.json` to `.gitignore`. It is small, reviewable
project metadata that can be committed. Only the cloned repository contents
under `.oh-my-zcode/clonedeps/repos/` should be ignored.

### Step 7: Register Dependency Source in AGENTS.md

After successful cloning, update the repository root `AGENTS.md` so future
agents know why the dependency source exists and where to look.

If `AGENTS.md` already has a `## Cloned Dependency Source` section, update that
section. Otherwise append this section:

Use this format and list the actual repos directly. Keep each item to one short
sentence so future agents do not need an extra read just to know what is there:

```markdown
## Cloned Dependency Source

Read-only dependency source repositories are available under
`.oh-my-zcode/clonedeps/repos/` for inspection. Do not edit these clones.

- `.oh-my-zcode/clonedeps/repos/<safe-name>/` - `<repo>` at `<ref>`; <one sentence on
  why this source is useful>.
- `.oh-my-zcode/clonedeps/repos/<safe-name-2>/` - `<repo>` at `<ref>`; <one sentence on
  why this source is useful>.
```

Also keep `.oh-my-zcode/clonedeps.json` updated as the structured manifest, but do not
make agents read it for the basic repo list.

## Cleanup

When the user asks to clean cloned dependencies, remove:

- `.oh-my-zcode/clonedeps/repos/`
- the managed clonedeps marker blocks from `.gitignore` and `.ignore`

Ask before removing `.oh-my-zcode/clonedeps.json` or the `AGENTS.md` section because
they may be intentional project metadata.
