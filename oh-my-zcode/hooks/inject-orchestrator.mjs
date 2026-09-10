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

  // stdout 上限 32768 字节，超限则截断（每轮重新序列化再测，避免对陈旧 payload 判断）。
  const makePayload = (text) =>
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: text,
      },
    });
  let payload = makePayload(protocol);
  if (Buffer.byteLength(payload, 'utf8') > MAX_OUTPUT_BYTES) {
    do {
      protocol = protocol.slice(0, Math.floor(protocol.length * 0.9));
      payload = makePayload(protocol);
    } while (
      Buffer.byteLength(payload, 'utf8') > MAX_OUTPUT_BYTES - 200 &&
      protocol.length > 0
    );
    payload = makePayload(
      `${protocol}\n\n[protocol truncated for hook output limit]`,
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
