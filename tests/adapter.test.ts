import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Context } from '@deepseek-ai/cordis';
import Loader from '@deepseek-ai/cordis-plugin-loader';
import Group from '@deepseek-ai/cordis-plugin-group';
import LlmRuntime, {
  LlmAdapter,
  ToolCallId,
  type GenerateOptions,
  type StreamChunk,
  type LlmResolvedModelInfo,
} from '@deepseek-ai/dsh-llm';
import type {} from '@deepseek-ai/dsh-session-projection';
import { defineContentToolFixture } from '@deepseek-ai/dsh-tools';
import { DshDesktopRuntime } from '../src/dsh-adapter.ts';
import { assertCompatible } from '../src/desktop-plugin.ts';
import { until } from './helpers.ts';
class ScriptAdapter extends LlmAdapter {
  requests: GenerateOptions[] = [];
  constructor(private script: ('text' | 'tool' | 'hang' | 'failure')[]) {
    super();
  }
  override async resolveModel(provider: string, model: string): Promise<LlmResolvedModelInfo> {
    return { provider, id: model, name: model };
  }
  async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.requests.push(options);
    const item = this.script.shift();
    if (item === 'hang') {
      await new Promise<void>((resolve, reject) => {
        if (options.signal?.aborted) {
          reject(options.signal.reason);
          return;
        }
        options.signal?.addEventListener('abort', () => reject(options.signal?.reason), {
          once: true,
        });
      });
      return;
    }
    if (item === 'failure') throw new Error('MODEL_SECRET');
    if (item === 'tool') {
      const block = {
        type: 'tool-call' as const,
        id: ToolCallId('test-call'),
        name: 'fixture_tool',
        arguments: '{}',
      };
      yield { type: 'block-start', index: 0, blockType: 'tool-call' };
      yield {
        type: 'tool-call-delta',
        index: 0,
        id: block.id,
        name: block.name,
        argumentsDelta: '{}',
      };
      yield { type: 'block-end', index: 0, block };
      yield { type: 'finish', reason: { kind: 'tool-calls' } };
      return;
    }
    assert.equal(item, 'text', 'Test script exhausted');
    const text = 'official-runtime-response';
    yield { type: 'block-start', index: 0, blockType: 'text' };
    yield { type: 'text-delta', index: 0, text };
    yield { type: 'block-end', index: 0, block: { type: 'text', text } };
    yield { type: 'finish', reason: { kind: 'stop' } };
  }
}
async function compose(script: ('text' | 'tool' | 'hang' | 'failure')[]) {
  const ctx = new Context();
  await ctx.plugin(Loader, { baseUrl: new URL('../', import.meta.url).href });
  ctx.loader.builtins.group = Group;
  for (const [name, config] of [
    ['dsh-llm', {}],
    ['dsh-session', {}],
    ['dsh-session-projection', {}],
    ['dsh-system-prompt', { personaPrefix: '' }],
    ['dsh-tools', {}],
    ['dsh-agent', {}],
    ['dsh-agent-loop', { agents: [] }],
    ['dsh-agent-default-model', { provider: 'bridge-test', model: 'configured-model' }],
    ['dsh-agent-preset-registry', { default: 'standard' }],
  ] as const) {
    await ctx.loader.create({ name: `@deepseek-ai/${name}`, config });
  }
  await ctx.loader.await();
  assert.ok(ctx.get('agents'));
  assert.ok(ctx.get('agentPresets'));
  const unregister = await ctx.agentPresets.register({ id: 'standard', plugins: [] });
  ctx.effect(() => unregister);
  const adapter = new ScriptAdapter(script);
  ctx.effect(() => ctx.llm.registerAdapter(['bridge-test'], adapter));
  let executions = 0;
  ctx.effect(() =>
    ctx.tools.register(
      defineContentToolFixture({
        name: 'fixture_tool',
        description: 'Test permission executor',
        parameters: {},
        execute: async () => {
          executions++;
          return [{ type: 'text', text: 'executed' }];
        },
      }),
    ),
  );
  return { ctx, adapter, executions: () => executions };
}
test('adapter uses official Loader, AgentLoop, Preset and configured model; follow-ups share session', async (t) => {
  const f = await compose(['text', 'text']);
  t.after(() => f.ctx.fiber.dispose());
  const runtime = new DshDesktopRuntime(f.ctx, [], 1024);
  const session = await runtime.create('/tmp', 'standard');
  const result = await session.run('one');
  assert.equal(result.outcome, 'completed');
  assert.equal(result.text, 'official-runtime-response');
  await session.run('two');
  assert.equal(f.adapter.requests.length, 2);
  assert.equal(f.adapter.requests[0]!.model, 'configured-model');
  const events = f.ctx.agents
    .get(session.id as Parameters<typeof f.ctx.agents.get>[0])!
    .session.snapshotEvents();
  assert.equal(events.filter((e) => e.type === 'user/message').length, 2);
  assert.match(JSON.stringify(events), /desktop-mcp-bridge/);
  await session.dispose();
  assert.equal(f.ctx.agents.get(session.id as Parameters<typeof f.ctx.agents.get>[0]), undefined);
});
test('unallowlisted tools are denied by the real executor and allowed tools run', async (t) => {
  const f = await compose(['tool', 'text', 'tool', 'text']);
  t.after(() => f.ctx.fiber.dispose());
  const denied = await new DshDesktopRuntime(f.ctx, [], 1024).create('/tmp', 'standard');
  await denied.run('call tool');
  assert.equal(f.executions(), 0);
  const allowed = await new DshDesktopRuntime(f.ctx, ['fixture_tool'], 1024).create(
    '/tmp',
    'standard',
  );
  await allowed.run('call tool');
  assert.equal(f.executions(), 1);
  await denied.dispose();
  await allowed.dispose();
});
test('real AgentLoop cancellation drains before reporting cancellation', async (t) => {
  const f = await compose(['hang']);
  t.after(() => f.ctx.fiber.dispose());
  const session = await new DshDesktopRuntime(f.ctx, [], 1024).create('/tmp', 'standard');
  const result = session.run('wait');
  await until(() => f.adapter.requests.length === 1);
  session.cancel();
  assert.equal((await result).outcome, 'cancelled');
  await session.dispose();
});
test('Desktop adapter refuses a non-Desktop host', async (t) => {
  const ctx = new Context();
  t.after(() => ctx.fiber.dispose());
  await assert.rejects(assertCompatible(ctx), /official Desktop/);
});

test('real model failures report failure without exposing provider secrets', async (t) => {
  const f = await compose(['failure']);
  t.after(() => f.ctx.fiber.dispose());
  const session = await new DshDesktopRuntime(f.ctx, [], 1024).create('/tmp', 'standard');
  const result = await session.run('fail');
  assert.equal(result.outcome, 'failed');
  assert.equal(result.error?.code, 'RUNTIME_FAILURE');
  assert.doesNotMatch(JSON.stringify(result), /MODEL_SECRET/);
  await session.dispose();
});
test('built plugin activates in a simulated Desktop profile and cleans up its socket on unload', async (t) => {
  const { fixture } = await import('./helpers.ts');
  const { BridgeClient } = await import('../src/transport.ts');
  const f = await compose(['text']);
  const local = await fixture();
  t.after(async () => {
    await f.ctx.fiber.dispose();
    await local.cleanup();
  });
  f.ctx.provide('profileContext', {
    name: 'desktop',
    dir: local.root,
    patchPath: '',
    installAnchor: '',
    cwd: local.root,
    home: local.root,
    startedBundles: [],
    overlays: [],
    telemetryDisabledEnv: undefined,
  });
  await assertCompatible(f.ctx);
  const entryId = await f.ctx.loader.create({
    name: new URL('../dist/desktop-plugin.js', import.meta.url).href,
    config: { configFile: local.file },
  });
  await f.ctx.loader.await();
  const client = await BridgeClient.fromConfig(local.file);
  const session = (await client.call('create_session', {})) as { sessionId: string };
  const { randomUUID } = await import('node:crypto');
  const task = (await client.call('submit_task', {
    sessionId: session.sessionId,
    prompt: 'plugin smoke',
    requestId: randomUUID(),
  })) as { taskId: string };
  let result: { complete?: boolean; output?: string } = {};
  for (let i = 0; i < 100 && !result.complete; i++)
    result = (await client.call('get_result', { taskId: task.taskId })) as typeof result;
  assert.equal(result.output, 'official-runtime-response');
  await f.ctx.loader.resolve(entryId).fiber!.dispose();
  await assert.rejects(client.call('connection_info', {}), /socket is missing/);
});
