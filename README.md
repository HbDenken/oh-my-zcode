# oh-my-zcode

ZCode 插件市场仓库，包含 **oh-my-zcode** —— 多智能体编排插件（[oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) 的 ZCode 移植版）。

主 Agent 作为 orchestrator，通过 SessionStart hook 注入编排协议，把非平凡工作委派给专家子智能体：fixer（有界执行）、designer（UI/UX）、librarian（文档调研）、oracle（架构顾问）、observer（视觉分析）、council（多模型共识）+ ZCode 内置 Explore。

## 仓库结构

| 路径 | 说明 |
|---|---|
| `marketplace.json` | ZCode 插件市场清单 |
| `oh-my-zcode/` | 插件本体：agents / commands / hooks / skills / MCP 配置 |

## 安装

前置条件：系统 PATH 中有可用的 `node`（SessionStart hook 依赖）。

1. 克隆或下载本仓库到本地
2. 打开 ZCode → 设置 → 插件
3. 点右上角 **创建 → 添加插件市场**，选择本仓库根目录（含 `marketplace.json`）
4. 在 **个人** 分段找到 oh-my-zcode，点 **安装**
5. **新建会话** 生效（子智能体/hook 定义不热更新）

## 插件详情

架构、子智能体职责、模型覆盖、功能差异与已知限制见 [oh-my-zcode/README.md](oh-my-zcode/README.md)。
