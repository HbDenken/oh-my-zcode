#!/usr/bin/env node
// SessionStart hook：向主 Agent 会话注入 orchestrator 编排协议。
// 协议文本与插件一起分发，位于 hooks/orchestrator-protocol.md。

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_OUTPUT_BYTES = 32768;

try {
  // Drain stdin to avoid EPIPE on the writer side, but we don't need the payload.
  for await (const _chunk of process.stdin) {
    // drain
  }

  const pluginRoot =
    process.env.ZCODE_PLUGIN_ROOT ?? process.env.CLAUDE_PLUGIN_ROOT ?? '';
  if (!pluginRoot) {
    process.stderr.write('[oh-my-zcode] plugin root unavailable\n');
    process.exit(0);
  }

  const protocolPath = join(pluginRoot, 'hooks', 'orchestrator-protocol.md');
  let protocol = readFileSync(protocolPath, 'utf8');

  // stdout 上限 32768 字节，超限则截断（保留头部完整段落，尾部给出说明）。
  const output = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: protocol,
    },
  };
  let payload = JSON.stringify(output);
  if (Buffer.byteLength(payload, 'utf8') > MAX_OUTPUT_BYTES) {
    while (
      Buffer.byteLength(payload, 'utf8') > MAX_OUTPUT_BYTES - 200 &&
      protocol.length > 0
    ) {
      protocol = protocol.slice(0, Math.floor(protocol.length * 0.9));
    }
    protocol += '\n\n[protocol truncated for hook output limit]';
    payload = JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: protocol,
      },
    });
  }

  process.stdout.write(payload);
  process.exit(0);
} catch (error) {
  process.stderr.write(
    `[oh-my-zcode] inject-orchestrator failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(0);
}
