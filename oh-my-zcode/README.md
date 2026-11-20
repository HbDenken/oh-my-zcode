# oh-my-zcode

[oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) 的 ZCode 移植版 —— 多智能体编排插件。主 Agent 作为 orchestrator，按编排协议委派专家子智能体执行编码工作。

## 架构

主 Agent（orchestrator）通过 SessionStart hook 注入编排协议，按规则把非平凡工作委派给专家子智能体：

| 子智能体 | 职责 | 来源 |
|---|---|---|
| Explore | 快速代码侦察（只读） | ZCode 内置 |
| fixer | 有界执行者：接完整规格实现代码 | 本插件 |
| designer | UI/UX 专家：设计+实现用户界面；HTML 设计稿/原型/deck 走官方 `design` 技能 | 本插件 |
| librarian | 外部知识研究：官方文档、库调研、GitHub 示例（WebFetch/WebSearch/context7/gh_grep）；本地代码扫描归 Explore | 本插件 |
| oracle | 战略顾问/终极调试：架构决策、疑难调试、方案权衡、代码审查、简化 | 本插件 |
| observer | 视觉分析：图片/PDF/图表 | 本插件（需视觉模型） |

配套组件：

- **命令**：`/loop`（执行-验证循环）、`/deepwork`（重活多阶段编排）、`/reflect`（复盘工作流）、`/interview`（规格访谈）
- **技能**：simplify、verification-planning、reflect、clonedeps、deepwork、loop-engineering、worktrees（并行车道隔离）、oh-my-zcode（自配置）；仓库架构导读用 ZCode 内置 Wiki（未移植 codemap 流程）
- **MCP**：context7（官方文档查询）、gh_grep（GitHub 代码搜索）

## 安装

前置条件：系统 PATH 中有可用的 `node`（SessionStart hook 依赖）。

1. 打开 ZCode → 设置 → 插件
2. 点右上角 **创建 → 添加插件市场**，选择本仓库根目录（含 `marketplace.json`）
3. 在 **个人** 分段找到 oh-my-zcode，点 **安装**
4. **新建会话** 生效。插件级子智能体（`agents/`）需**重启 ZCode** 才进 agent 列表（启动时缓存 agent 注册表，只跑 `plugins update` 不够）；hook 与已有定义的改动新会话即可生效。

## 模型

子智能体模型 = 宿主默认模型（不跟随主 Agent 当前模型，ZCode 0.17.1 源码 schema 实证：agent frontmatter 的模型字段是 `modelSelection: {providerId, modelId, options.reasoningLevel?}`，字符串形式的 `model` / `thoughtLevel` 不在 schema 内、会被静默忽略——插件定义里不写它，写了也无效）。

要为某个子智能体指定模型：

1. 把 `agents/<name>.md` 复制到 `~/.zcode/agents/<name>.md`
2. 在 frontmatter 加 `modelSelection` 对象（或通过 设置 → 子智能体 编辑）
3. 新建会话生效

```yaml
---
name: oracle
modelSelection:
  providerId: <provider 标识>   # 如 zcode-builtin / magpie，见 /model list
  modelId: <model 标识>         # 如 glm-5.3
  # options:
  #   reasoningLevel: high     # 可选，需模型支持
---
```

具体 `providerId`/`modelId` 取值以 设置 → 模型 或 `/model list` 显示为准。

## 与 OpenCode 版的功能差异

权威对照只维护在 `docs/zcode-port.md`（架构映射、宿主能力边界、验证命令）。这里只记结论：

- 后台任务：ZCode 原生后台子智能体跑完自动回灌，不需要看板与唤醒调度器；取消用 `TaskStop`，插话/续跑用 `SendMessage`。
- 交互：`wait_for_user` 改为结束回合等待；提问用 `AskUserQuestion`。
- 能力缺口：无 interview dashboard、无 smartfetch；codemap 改用内置仓库 Wiki。
- council：未移植。上游的「动态席位 + 零工具合成器」在主 Agent 自己并行派车道再对账的等效流程下没有增量价值，且本机历史里零调用；高风险的独立复核改写为协议里的 Independent Corroboration 一节。
- worktree：Desktop 用原生 worktree 任务；CLI 无 worktree 工具，按 `skills/worktrees` 的路径约定回退。
- 设计系统：接入官方 `design` 插件，`design-lint.mjs` 退出码 1/2 不得当通过。

## 已知限制

- 插件子智能体在 设置 → 子智能体 中只读；覆盖/停用 = 复制到 `~/.zcode/agents/` 后修改
- 子智能体不能再派子智能体（宿主运行时行为未验证，按假设处理），编排只在主 Agent 层
- 自定义 `tools` 白名单的子智能体会失去 MCP 工具和技能；需要技能时用 frontmatter `skills: [name]` 显式放行（designer 已放行 `design`）。librarian 已用全名接入 WebSearch 与 context7/gh_grep，其余 agents 按最小工具集设计
- 动态 workflow 的 agent `isolation: "worktree"` 在 ZCode 未实现（运行时抛错），不要使用；worktree 并行只在 Desktop 原生任务里成立
- `context7` MCP 免 key 可用（有速率限制）；如需 API key，直接在 `.mcp.json` 的 `headers` 里加 `Authorization` 即可（静态 headers 不受官方 auth 的保留头限制）
