#!/usr/bin/env node
// SessionStart hook：向主 Agent 会话注入 orchestrator 编排协议。
// 协议文本与插件一起分发，位于 hooks/orchestrator-protocol.md。

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// 子智能体会话同样触发 SessionStart。协议只该进主 Agent：子智能体读到
// 「你是 orchestrator、要委派子智能体」既错误又白烧 ~17KB 上下文。
// 用已知子智能体名单排除；名单外（含主 Agent 的各种命名）一律注入，
// 避免猜错主 Agent 名字导致协议静默失效。
const SUBAGENT_TYPES = new Set([
  'explore',
  'general-purpose',
  'fixer',
  'designer',
  'librarian',
  'oracle',
  'observer',
  'council',
]);

try {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let agentType = '';
  if (input.trim()) {
    try {
      agentType = String(JSON.parse(input).agent_type ?? '')
        .trim()
        .toLowerCase();
    } catch {
      // 非 JSON payload：无法判定身份，按主 Agent 处理。
    }
  }
  if (SUBAGENT_TYPES.has(agentType)) process.exit(0);

  const pluginRoot =
    process.env.ZCODE_PLUGIN_ROOT ?? process.env.CLAUDE_PLUGIN_ROOT ?? '';
  if (!pluginRoot) {
    process.stderr.write('[oh-my-zcode] plugin root unavailable\n');
    process.exit(0);
  }

  const protocolPath = join(pluginRoot, 'hooks', 'orchestrator-protocol.md');
  const protocol = readFileSync(protocolPath, 'utf8');

  // 协议是仓库内可 review 的静态文件(当前约 17KB,宿主注入上限 32768 字节),
  // 不做截断;超限时报警,避免协议被宿主静默丢弃。
  const payload = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: protocol,
    },
  });

  if (Buffer.byteLength(payload, 'utf8') > 32768) {
    process.stderr.write(
      '[oh-my-zcode] orchestrator protocol exceeds the 32768-byte SessionStart limit; trim hooks/orchestrator-protocol.md\n',
    );
  }

  process.stdout.write(payload);
  process.exit(0);
} catch (error) {
  process.stderr.write(
    `[oh-my-zcode] inject-orchestrator failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(0);
}
