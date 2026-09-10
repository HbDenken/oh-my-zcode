# oh-my-zcode

[oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) 的 ZCode 移植版 —— 多智能体编排插件。主 Agent 作为 orchestrator，按编排协议委派专家子智能体执行编码工作。

## 架构

主 Agent（orchestrator）通过 SessionStart hook 注入编排协议，按规则把非平凡工作委派给专家子智能体：

| 子智能体 | 职责 | 来源 |
|---|---|---|
| Explore | 快速代码侦察（只读） | ZCode 内置 |
| fixer | 有界执行者：接完整规格实现代码 | 本插件 |
| designer | UI/UX 专家：设计+实现用户界面 | 本插件 |
| librarian | 外部知识研究：官方文档、库调研 | 本插件 |
| oracle | 战略顾问：架构决策、代码审查、简化 | 本插件 |
| observer | 视觉分析：图片/PDF/图表 | 本插件（需视觉模型） |
| council | 多模型共识合成器（零工具） | 本插件 |

配套组件：

- **命令**：`/loop`（执行-验证循环）、`/deepwork`（重活多阶段编排）、`/reflect`（复盘工作流）、`/interview`（规格访谈）
- **技能**：simplify、verification-planning、reflect、clonedeps、deepwork、loop-engineering、worktrees、oh-my-zcode（自配置）；仓库架构导读用 ZCode 内置 Wiki（未移植 codemap 流程）
- **MCP**：context7（官方文档查询）、gh_grep（GitHub 代码搜索）

## 安装

前置条件：系统 PATH 中有可用的 `node`（SessionStart hook 依赖）。

1. 打开 ZCode → 设置 → 插件
2. 点右上角 **创建 → 添加插件市场**，选择本仓库根目录（含 `marketplace.json`）
3. 在 **个人** 分段找到 oh-my-zcode，点 **安装**
4. **新建会话** 生效（子智能体/hook 定义不热更新）

## 模型覆盖

插件子智能体默认 `model: inherit`（跟随主 Agent 当前模型）。要为某个子智能体指定模型：

1. 把 `agents/<name>.md` 复制到 `~/.zcode/agents/<name>.md`
2. 修改 frontmatter 的 `model` 字段（或通过 设置 → 子智能体 编辑）
3. 新建会话生效

例：让 oracle 用更强模型、fixer 用便宜模型：

```yaml
---
name: oracle
model: glm-5.3          # 或其它具体模型；thoughtLevel 需模型支持
---
```

## 与 OpenCode 版的功能差异

| OpenCode 版功能 | ZCode 版状态 |
|---|---|
| 后台任务看板自动注入 | 由 ZCode 原生后台子智能体回灌替代 |
| orchestrator 空闲唤醒调度器 | 不需要：后台子智能体跑完自动回主对话 |
| task_message（向运行中任务排队消息） | 无：等结果后追加派发 |
| task_revive（会话内代际续跑） | 无：取消后新派 |
| wait_for_user 工具 | 结束回合等待用户（协议纪律） |
| council 动态席位（配置驱动 councillor） | 无：用任意子智能体并行取多模型意见后派 council 合成 |
| interview Web dashboard | 纯对话式 + Write 更新 `interview/<title>.md` |
| reflect SQLite 会话考古 | 改为 ZCode 日志（`~/.zcode/cli/log/*.jsonl`）+ 当前会话分析 |
| smartfetch 工具（二级模型摘要） | 无：ZCode 原生 WebFetch 已覆盖主干 |
| codemap skill（分层 codemap.md 生成） | 改用 ZCode 内置仓库 Wiki（UI 生成、自动刷新；Agent 可读 `~/.zcode/v2/repo-wiki/<hash>/wiki.json`） |
| 模型回退链 / 并发上限 / multiplexer / companion / TUI preset / 缓存安全注入体系 | 不适用（宿主能力不同） |

详见仓库根目录的 `docs/zcode-port.md`。

## 已知限制

- 插件子智能体在 设置 → 子智能体 中只读；覆盖/停用 = 复制到 `~/.zcode/agents/` 后修改
- 子智能体不能再派子智能体（ZCode 运行时强制），编排只在主 Agent 层
- 自定义 `tools` 白名单的子智能体会失去 MCP 工具和技能（除非写全名）；本插件 agents 均按此约束设计
- `context7` MCP 免 key 可用（有速率限制）；如需 API key，需后续版本通过自建转发代理注入鉴权头
