# ZCode 移植说明（oh-my-zcode）

本仓库是 oh-my-opencode-slim 的 ZCode 移植版插件的独立仓库。本文记录移植映射、交付物与验证方式。

## 交付物结构

```
.
├── marketplace.json              # 本地市场清单（添加市场时指向本仓库根目录）
└── oh-my-zcode/                  # 插件根
    ├── .zcode-plugin/plugin.json # 清单：agents/skills/commands/hooks/mcpServers
    ├── .mcp.json                 # context7 + gh_grep（http 远程 MCP）
    ├── agents/                   # 6 个自定义子智能体（fixer/designer/librarian/oracle/observer/council）
    ├── skills/                   # 8 个技能
    ├── commands/                 # loop/deepwork/reflect/interview
    └── hooks/
        ├── hooks.json            # 仅 SessionStart
        ├── inject-orchestrator.mjs
        └── orchestrator-protocol.md
```

## 架构映射

| OpenCode 原语 | ZCode 方案 |
|---|---|
| orchestrator 默认 agent + system prompt 注入 | 主 Agent + SessionStart hook `additionalContext`（注入 `hooks/orchestrator-protocol.md`） |
| explorer agent | 内置 Explore 子智能体（零配置复用） |
| task() 后台子代理 + Background Job Board + wake scheduler | 原生后台子智能体（run_in_background，跑完自动回主对话） |
| task_result / task_status | 后台完成通知自动回灌；不主动轮询 |
| task_cancel | TaskStop(task_id) |
| task_message / task_revive | 原生 `SendMessage`（`delivery: queued / steered / resumed_background`） |
| wait_for_user | 放弃；协议纪律替代 |
| per-agent 权限塑形（permission map） | agents/*.md frontmatter `tools` 白名单（空数组＝继承全部，故零工具用非空白名单） |
| skill 可见性过滤 | 子智能体自定义 `tools` 后失去全部技能；再用 frontmatter `skills: [name]` 显式放行（designer 已放行官方 `design` 技能） |
| council 动态席位（council-agents.ts） | 静态 council 合成器；多模型意见由主 Agent 并行派任意子智能体取得后传给 council |
| /loop /deepwork /reflect /interview 运行时命令 hook | commands/*.md（$ARGUMENTS 模板，无运行时 handler） |
| interview Web dashboard/HTTP server/事件监听 | 纯对话式：每轮 Write 更新 `interview/<title>.md` |
| reflect SQLite 会话考古 | ZCode 日志（`~/.zcode/cli/log/zcode-<date>.jsonl`）+ 当前会话 |
| context7 / gh_grep MCP 装配 | `.mcp.json`（键名自动命名空间 `plugin:oh-my-zcode:<name>`） |
| smartfetch / ast-grep 工具 | 未移植（ZCode 原生 WebFetch/Grep 覆盖主干；后续可包 stdio MCP） |
| codemap skill | 改用 ZCode 内置仓库 Wiki |
| worktree 并行车道（OMO 手工协议） | Desktop 原生 worktree 任务（composer 开关 / fork-to-worktree，会话 cwd 即车道）；CLI 无 worktree 工具，回退手工 `git worktree` + 绝对路径 |
| design 能力（HTML 设计稿/原型/deck） | 接入 ZCode 官方 `design` 插件：designer 加载 `design` 技能，按其 `design-system/<name>.md` 与 `design-lint.mjs` 门禁交付 |
| multiplexer / companion / TUI / 模型回退链 / 缓存安全注入 | 不适用 |

## 改写规则（从 src/ 移植内容时统一执行）

- `@explorer` → `Explore 子智能体`；`@fixer/@designer/@librarian/@oracle/@observer/@council` → 去 @ 同名子智能体
- `task(...)` → `Agent(run_in_background:true, subagent_type:...)`；`task_result/task_status` → 后台完成通知
- `wait_for_user` 段落删除或改为“结束回合等待”；`task_message` / `task_revive` 改为 `SendMessage`
- `OpenCode` → `ZCode`；`oh-my-opencode-slim` → `oh-my-zcode`
- 状态目录 `.opencode/loop-history`、`.slim/deepwork` → `.oh-my-zcode/...`
- OpenCode 专属路径/SQLite → ZCode 等价或删除
- 宿主能力不可用时不要照搬：动态 workflow 的 `isolation: "worktree"` 在 ZCode 会抛 `not implemented yet`，禁止写入文档或脚本

## 宿主能力边界（实测）

- **Worktree**：Desktop 原生（`EnterWorktree`/`ExitWorktree`、`worktreeCwd` 能力协商、`worktree_created` 时间线、`fork-to-worktree`、任务组）；托管目录在数据目录的 `.zcode/worktrees/<4位hex>/<name>`，位于仓库外。CLI 0.17.1 无 worktree 工具，且 `Agent` 无 cwd 参数，子智能体不会进入车道。
- **Design**：官方插件 `design@zcode-plugins-official`（0.7.2）自带 `design-system/<name>.md` 格式、`import-design-system.mjs`、`design-lint.mjs`。lint 退出码：0 通过、1 有违规、2 页面或系统文件读不了（不可当通过）。
- **子智能体技能**：`tools` 白名单会移除全部技能；`skills: [name]` 是唯一放行方式。
- **hook 输出上限**:SessionStart 注入上限 32768 字节(宿主默认;插件 hooks.json 的单个 hook 条目无法覆盖,只有 source 级配置能改)。当前协议约 17KB,`inject-orchestrator.mjs` 不做截断,超限时向 stderr 报警。
- **hook 身份过滤**:SessionStart 对子智能体会话同样触发。`inject-orchestrator.mjs` 解析 stdin 的 `agent_type`,命中已知子智能体名单(fixer/designer/librarian/oracle/observer/council/Explore/general-purpose)时直接退出,协议只进主 Agent。
- **agent 内联规则**:6 个子智能体的 `File Operations Rules` 与协议重复是刻意的——ZCode 没有 include 机制,每个 agent 的 body 就是独立 system prompt。改这条规则要同步改七处。
- **council 工具面(已核实)**:`RespondToCoordinator` 是 ZCode 内置工具,`tools: [RespondToCoordinator]` 因此只放行协调器回传通道,该子智能体没有文件/搜索/Bash 工具。注意插件 councillor 均为 `model: inherit`,不做用户级模型覆盖时 council 是「多视角」而非「多模型」。

## 验证

hook 手工断言（可复跑）。下面是 bash（Git Bash / WSL）；本机 pwsh 没有 `grep`，用后面的 PowerShell 版本。

```bash
cd oh-my-zcode
# 主 Agent 会话 → 注入协议
echo '{"session_id":"t","hook_event_name":"SessionStart"}' | ZCODE_PLUGIN_ROOT="$PWD" node hooks/inject-orchestrator.mjs
# 空 stdin → 容错
echo '' | ZCODE_PLUGIN_ROOT="$PWD" node hooks/inject-orchestrator.mjs
# 子智能体会话 → 应无输出
echo '{"agent_type":"fixer"}' | ZCODE_PLUGIN_ROOT="$PWD" node hooks/inject-orchestrator.mjs
```

```powershell
cd oh-my-zcode
$env:ZCODE_PLUGIN_ROOT = (Get-Location).Path
'{"agent_type":"fixer"}' | node hooks/inject-orchestrator.mjs   # 应无输出
$out = '{"session_id":"t"}' | node hooks/inject-orchestrator.mjs
[Text.Encoding]::UTF8.GetByteCount($out)                        # 约 17900
```

安装后验证：设置→插件→个人分段安装 → 详情页应列出 6 子智能体/8 技能/4 命令/2 MCP/1 hook → 新建会话后 / 面板出现命令与技能。

清单与技能发现（CLI 可跑，bash）：

```bash
cd <仓库根>
ZCODE="D:/ZCode/resources/glm/zcode.cjs"   # 按本机 zcode CLI 实际路径调整
node "$ZCODE" plugins validate oh-my-zcode     # Plugin manifest is valid
node "$ZCODE" skills list | grep -E "design:design|oh-my-zcode:worktrees"
node "$ZCODE" plugins list | grep -A2 "oh-my-zcode@"
```

设计系统门禁（designer 交付前必跑）：

```bash
S="<design 技能目录>/scripts/design-lint.mjs"
node "$S" page.html design-system/<name>.md --spacing   # 0 通过 / 1 违规 / 2 读不了
```