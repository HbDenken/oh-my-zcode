# ZCode 移植说明（oh-my-zcode）

本仓库是 oh-my-opencode-slim 的 ZCode 移植版插件的独立仓库。本文记录移植映射、交付物与验证方式。

## 交付物结构

```
.
├── marketplace.json              # 本地市场清单（添加市场时指向本仓库根目录）
└── oh-my-zcode/                  # 插件根
    ├── .zcode-plugin/plugin.json # 清单：agents/skills/commands/mcpServers
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
| task_message / task_revive / wait_for_user | 放弃；协议纪律替代 |
| per-agent 权限塑形（permission map） | agents/*.md frontmatter `tools` 白名单（空数组＝继承全部，故零工具用非空白名单） |
| skill 可见性过滤 | 天然近似：主 Agent 全量技能；子智能体自定义 tools 后自动失去技能 |
| council 动态席位（council-agents.ts） | 静态 council 合成器；多模型意见由主 Agent 并行派任意子智能体取得后传给 council |
| /loop /deepwork /reflect /interview 运行时命令 hook | commands/*.md（$ARGUMENTS 模板，无运行时 handler） |
| interview Web dashboard/HTTP server/事件监听 | 纯对话式：每轮 Write 更新 `interview/<title>.md` |
| reflect SQLite 会话考古 | ZCode 日志（`~/.zcode/cli/log/zcode-<date>.jsonl`）+ 当前会话 |
| context7 / gh_grep MCP 装配 | `.mcp.json`（键名自动命名空间 `plugin:oh-my-zcode:<name>`） |
| smartfetch / ast-grep 工具 | 未移植（ZCode 原生 WebFetch/Grep 覆盖主干；后续可包 stdio MCP） |
| codemap skill | 改用 ZCode 内置仓库 Wiki |
| multiplexer / companion / TUI / 模型回退链 / 缓存安全注入 | 不适用 |

## 改写规则（从 src/ 移植内容时统一执行）

- `@explorer` → `Explore 子智能体`；`@fixer/@designer/@librarian/@oracle/@observer/@council` → 去 @ 同名子智能体
- `task(...)` → `Agent(run_in_background:true, subagent_type:...)`；`task_result/task_status` → 后台完成通知
- `wait_for_user` / `task_message` / `task_revive` 段落删除或改为“结束回合等待”
- `OpenCode` → `ZCode`；`oh-my-opencode-slim` → `oh-my-zcode`
- 状态目录 `.opencode/loop-history`、`.slim/deepwork` → `.oh-my-zcode/...`
- OpenCode 专属路径/SQLite → ZCode 等价或删除

## 验证

hook 手工断言（可复跑）：

```bash
cd oh-my-zcode
# 主 Agent 会话 → 注入协议
echo '{"session_id":"t","hook_event_name":"SessionStart"}' | ZCODE_PLUGIN_ROOT="$PWD" node hooks/inject-orchestrator.mjs
# 空 stdin → 容错
echo '' | ZCODE_PLUGIN_ROOT="$PWD" node hooks/inject-orchestrator.mjs
```

安装后验证：设置→插件→个人分段安装 → 详情页应列出 6 子智能体/8 技能/4 命令/2 MCP/1 hook → 新建会话后 / 面板出现命令与技能。