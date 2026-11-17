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
| /loop /deepwork /reflect /interview 运行时命令 hook | commands/*.md（$ARGUMENTS 模板，无运行时 handler）。其中 /loop 为新增而非移植：上游明确不打包 loop harness |
| interview Web dashboard/HTTP server/事件监听 | 纯对话式：每轮 Write 更新 `.oh-my-zcode/interview/<title>.md` |
| reflect SQLite 会话考古 | ZCode 日志（`~/.zcode/cli/log/zcode-<date>.jsonl`）+ 当前会话 |
| context7 / gh_grep MCP 装配 | `.mcp.json`（服务名自动命名空间 `plugin:oh-my-zcode:<name>`;工具名 `mcp__<server>__<tool>`,server 段做 `[^A-Za-z0-9_-]` -> `_` 清洗,故 context7 实为 `mcp__plugin_oh-my-zcode_context7__*`） |
| smartfetch / ast-grep 工具 | 未移植（ZCode 原生 WebFetch + Bash `grep` 覆盖主干；后续可包 stdio MCP） |
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
- **子智能体技能**：`tools` 白名单会移除全部技能；`skills: [name]` 是唯一放行方式。真机已验:designer 子会话同时拿到 `Read/Write/Edit/Bash/Skill` 与 `skills: [design]` 放行(技能通过 `Skill` 工具加载)。
- **hook 输出上限**:SessionStart 注入上限 32768 字节(宿主默认 `hooks:{maxOutputBytes:32768, timeoutMs:60000}`;插件 hooks.json 的单个 hook 条目无法覆盖,只有 source 级配置能改)。当前协议 18376 字节(约 18KB),余量约 14392 字节。`inject-orchestrator.mjs` 不做截断,超限时向 stderr 报警;注入失败时改为输出一行可见告警到 `additionalContext`(stderr 是否展示给用户未实测)。**真机已核**(0.1.6 时点,协议 18314 字节):主会话 rollout 里注入块 18301 字节 + 尾部空白 13 字节,与 `hooks/orchestrator-protocol.md` 逐字节一致,无截断、无告警前缀。
- **hook 身份过滤**:SessionStart 对子智能体会话同样触发。宿主把会话 `agentName` 原样作为 `agent_type` 传入(0.17.1 源码 `agent_type: e.agentName`)。本地 DB `model_usage.agent` 实证(5000+ 样本):主会话恒为 `zcode-agent`(main_turn/compact/session_title 一致),子会话一律 `zcode-<类型>`——`zcode-Explore`、`zcode-oracle`、`zcode-oh-my-zcode:designer`,workflow/expert 子会话为 `zcode-workflow`/`zcode-expert`,第三方插件的子智能体同样带该前缀。`inject-orchestrator.mjs` 因此用开放规则「`zcode-` 前缀且非 `zcode-agent` ⇒ 子会话」过滤,覆盖未知插件的子智能体;裸名/空值/非 JSON 按主 Agent 注入(宿主从不发送裸名,未知时注入是安全方向)。已知边界:用户自定义名为 `agent` 的子智能体会话名同为 `zcode-agent`,会被注入协议(仅多读一段文本,不影响其身份)。本地矩阵 10/10 通过;真机已验:designer 子会话(独立 rollout `model-io-sess_subagent_agent_*.jsonl`,`querySource=subagent`)的 system prompt 里没有协议文本。
- **子智能体加载与工具面(真机已验)**:插件 `agents/` 能被 ZCode 加载,但**要重启 ZCode 才进 agent 列表**(只跑 `plugins update` 不够,启动时缓存 agent 注册表)。子智能体请求不写主会话 rollout,而是独立文件 `model-io-sess_subagent_agent_<uuid>.jsonl`(`querySource=subagent`),这是验证子会话的唯一入口。实测 designer 子会话:`tools` 白名单生效(6 个,非主会话的 61 个),system prompt 第二块就是 `agents/designer.md` 正文;`RespondToCoordinator` 由宿主自动注入给每个子智能体(即使没写进白名单)。
- **ZCode 没有 Grep/Glob 工具**:主会话 61 个工具里既无 `Grep` 也无 `Glob`(检索靠 `Read` + Bash `grep`/`find`)。agent frontmatter 写这两个名字会被静默忽略;6 份 agent 定义与协议的 File Operations Rules 已统一改写为「Read + Bash grep/find」措辞,不再出现裸 Glob/Grep 指令。
- **`model: inherit` 无效**:宿主 agent schema 的模型字段是 `modelSelection: {providerId, modelId}` 对象,字符串 `inherit` 被忽略;实测 designer 子会话跑 `auto/glm-5.3-flash`,与主会话模型不同。已从 6 份 agent 定义删除,子智能体统一用宿主默认模型。
- **agent 内联规则**:`File Operations Rules` 与协议重复是刻意的——ZCode 没有 include 机制,每个 agent 的 body 就是独立 system prompt。实际是 6 处、两种变体,改的时候按变体同步:
  - 可写变体(协议 + fixer + designer):`hooks/orchestrator-protocol.md`、`agents/fixer.md`、`agents/designer.md`(designer 措辞略有出入)
  - 只读变体(oracle / librarian / observer):三者其余一致;oracle 额外多一条 `Bash: diagnostics only` 条款(它有 Bash 白名单)
  - `agents/council.md` 没有该块(它只有 `RespondToCoordinator`),改规则时显式跳过
- **maxTurns 取舍**:只有 `fixer`(80) 与 `designer`(80) 设了上限,因为它们是反复改文件的执行车道;
  oracle/librarian/observer/council 不设上限——单次分析型车道,靠 `tools` 白名单与提示词约束,不进入改文件循环。
- **council 工具面(已核实)**:`RespondToCoordinator` 是 ZCode 内置工具,`tools: [RespondToCoordinator]` 因此只放行协调器回传通道,该子智能体没有文件/搜索/Bash 工具。注意插件 councillor 已无 `model: inherit`(该字段在 ZCode 无效),council 一律用宿主默认模型,是「多视角」而非「多模型」。

## 真机取证（ZCode 0.17.1 已跑）

CLI 清单只能证明「插件被加载」,证明不了 hook 真的跑过。真机证据在宿主自己的记录里:

- `~/.zcode/cli/rollout/model-io-sess_<id>.jsonl`:每行一次模型请求;`messagesKind=full` 且 `messageOffset=0` 的那条含完整上下文,主会话 `request.messages[3].content` 里能看到 `# oh-my-zcode Orchestrator Protocol` 与 `</Communication>` 结尾,即 SessionStart 注入成功。注意 `messagesKind=tail` 的行只是尾部切片,里面没有协议属正常,不代表注入失败。子智能体请求另存为 `model-io-sess_subagent_agent_<uuid>.jsonl`(`querySource=subagent`),主会话文件里找不到子会话属正常。
- `~/.zcode/cli/log/zcode-<date>.jsonl`:查 `bootstrap.app.startup.plugins.completed` 的 `hookCount`/`enabledPluginCount`,核对插件是否进入启动清单(不含逐次 hook 运行记录)。
- 无头复跑(可选):`node <zcode.cjs> -p '<prompt>'`。CLI 只在入口文件所在目录找内置 provider:`<入口目录>/provider/zcode-builtin.json` 或向上五级的 `config/provider/zcode-builtin.json`(本机即 `D:\config\provider\...`),缺失直接报「无法定位 CLI ZCode Built-in Provider Config」。没有该文件时不要为此改安装目录,用上面的 rollout 取证即可。

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
[Text.Encoding]::UTF8.GetByteCount($out)                        # 实测 18798(协议文件 18314 字节 / 190 行)
```

自诊断：`node hooks/inject-orchestrator.mjs --selftest` 打印插件根、协议路径与字节数、剩余额度、子智能体过滤矩阵(exit 0 正常 / 1 协议文件缺失)。

安装后验证：设置→插件→个人分段安装 → 详情页应列出 6 子智能体/8 技能/4 命令/2 MCP/1 hook → 新建会话后 / 面板出现命令与技能。注意:`plugins list` 报 `commands: 1`(对含 7 个命令的 zcode-site 同样报 1,疑为目录计数口径),命令数不要用它判断,以 `commands list` 为准。

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