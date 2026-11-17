#!/usr/bin/env node
// SessionStart hook：向主 Agent 会话注入 orchestrator 编排协议。
// 协议文本与插件一起分发，位于 hooks/orchestrator-protocol.md。

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 子智能体会话同样触发 SessionStart。协议只该进主 Agent：子智能体读到
// 「你是 orchestrator、要委派子智能体」既错误又白烧 ~18KB 上下文。
//
// 身份判据（本地 DB model_usage.agent 实证，5000+ 样本）：宿主把会话 agentName
// 原样作为 agent_type 传入（ZCode 0.17.1 源码 `agent_type: e.agentName`）。
// 主会话恒为 `zcode-agent`（main_turn/compact/session_title 一致）；子会话一律
// `zcode-<类型>`——`zcode-Explore`、`zcode-oracle`、`zcode-oh-my-zcode:designer`，
// workflow/expert 子会话为 `zcode-workflow`/`zcode-expert`，第三方插件的子智能体
// 同样带前缀（如 `zcode-documents:visual-judge`）。
// 因此用开放规则「zcode- 前缀且非 zcode-agent」过滤，覆盖未知插件的子智能体；
// 裸名/无 agent_type/非 JSON 按主 Agent 注入——宿主从不发送裸名，未知时注入是
// 安全方向。已知边界：用户自定义名为 `agent` 的子智能体会话名也是 `zcode-agent`，
// 会被注入协议（后果仅是多读一段文本，不影响身份判定）。
const MAIN_AGENT_TYPE = 'zcode-agent';
const SUBAGENT_PREFIX = 'zcode-';

// 宿主注入上限（docs/zcode-port.md「宿主能力边界」）。超限时宿主是截断、丢弃
// 还是报错未实测，所以不自行截断协议——截断会造出半条规则，比不注入更糟。
const INJECT_LIMIT_BYTES = 32768;
const STDIN_TIMEOUT_MS = 800;

// 插件根优先按本文件位置推导，不依赖宿主是否展开 hooks.json 里的变量。
const MODULE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const protocolPath = (root) => join(root, 'hooks', 'orchestrator-protocol.md');

function resolveRoot() {
  if (existsSync(protocolPath(MODULE_ROOT))) return MODULE_ROOT;
  const fromEnv = (process.env.ZCODE_PLUGIN_ROOT ?? '').trim();
  return fromEnv || MODULE_ROOT;
}

function message(error) {
  return error instanceof Error ? error.message : String(error);
}

// 失败也要回一条可见上下文：hook 的 stderr 是否展示给用户未实测，
// 只写 stderr 等于静默失效。
function emit(additionalContext) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext },
    }),
  );
  process.exitCode = 0;
}

function fail(reason) {
  emit(`[oh-my-zcode] 编排协议注入失败：${reason}。本次会话按无协议运行。`);
}

function readStdin() {
  if (process.stdin.isTTY) return Promise.resolve('');

  process.stdin.setEncoding('utf8');
  return new Promise((resolve) => {
    let input = '';
    let done = false;
    let timer;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(input);
    };
    // 宿主若不关闭 stdin，不能挂到 hook 超时被杀（那会变成静默零注入）。
    timer = setTimeout(() => {
      process.stdin.destroy();
      finish();
    }, STDIN_TIMEOUT_MS);

    process.stdin.on('data', (chunk) => {
      input += chunk;
    });
    process.stdin.on('end', finish);
    process.stdin.on('error', finish);
  });
}

function isSubagent(raw) {
  if (!raw.trim()) return false;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return false; // 非 JSON payload：无法判定身份，按主 Agent 处理
  }
  if (!payload || typeof payload !== 'object') return false;

  const agentType = String(payload.agent_type ?? '').toLowerCase();
  return agentType.startsWith(SUBAGENT_PREFIX) && agentType !== MAIN_AGENT_TYPE;
}

function selftest() {
  const root = resolveRoot();
  const path = protocolPath(root);
  const exists = existsSync(path);
  const bytes = exists ? Buffer.byteLength(readFileSync(path, 'utf8'), 'utf8') : 0;
  const probes = [
    ['主会话 main_turn', 'zcode-agent', false],
    ['内置 Explore 子会话（DB 实证）', 'zcode-Explore', true],
    ['本插件 fixer 子会话', 'zcode-fixer', true],
    ['本插件命名空间子会话（DB 实证）', 'zcode-oh-my-zcode:designer', true],
    ['第三方插件子会话', 'zcode-documents:visual-judge', true],
    ['workflow 子会话', 'zcode-workflow', true],
    ['expert 子会话', 'zcode-expert', true],
    ['裸名（宿主不发，按主 Agent 安全兜底）', 'oh-my-zcode:fixer', false],
    ['非 zcode- 名（按主 Agent）', 'build', false],
    ['空 agent_type（按主 Agent）', '', false],
  ];

  process.stdout.write(
    `${JSON.stringify(
      {
        moduleRoot: MODULE_ROOT,
        resolvedRoot: root,
        protocolPath: path,
        protocolExists: exists,
        protocolBytes: bytes,
        limitBytes: INJECT_LIMIT_BYTES,
        headroomBytes: INJECT_LIMIT_BYTES - bytes,
        subagentFilter: Object.fromEntries(
          probes.map(([label, probe, expected]) => [
            `${label} (${probe || '<空>'})`,
            `${isSubagent(JSON.stringify({ agent_type: probe }))} (期望 ${expected})`,
          ]),
        ),
      },
      null,
      2,
    )}\n`,
  );
  process.exitCode = exists ? 0 : 1;
}

async function main() {
  if (process.argv.includes('--selftest')) {
    selftest();
    return;
  }

  if (isSubagent(await readStdin())) return;

  const path = protocolPath(resolveRoot());
  let protocol;
  try {
    protocol = readFileSync(path, 'utf8');
  } catch (error) {
    fail(`读不到 ${path}（${message(error)}）`);
    return;
  }

  const bytes = Buffer.byteLength(protocol, 'utf8');
  if (bytes > INJECT_LIMIT_BYTES) {
    process.stderr.write(
      `[oh-my-zcode] protocol ${bytes}B exceeds ${INJECT_LIMIT_BYTES}B SessionStart limit; trim hooks/orchestrator-protocol.md\n`,
    );
  }

  emit(protocol);
}

main().catch((error) => fail(message(error)));