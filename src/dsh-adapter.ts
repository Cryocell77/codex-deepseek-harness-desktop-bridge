import type { Context } from '@deepseek-ai/cordis';
import type { AgentHandle } from '@deepseek-ai/dsh-agent';
import type {} from '@deepseek-ai/dsh-agent-default-model';
import type {} from '@deepseek-ai/dsh-agent-preset-registry';
import type {} from '@deepseek-ai/dsh-tools';
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import type { SessionId } from '@deepseek-ai/dsh-session';
import { randomUUID } from 'node:crypto';
import type { DesktopRuntime, RuntimeSession, RunResult } from './runtime.ts';
import { boundedText } from './manager.ts';
import { BridgeError } from './errors.ts';
// Distinct source attribution: an MCP agent is not a direct human user.
declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    'desktop-mcp-bridge': { kind: 'desktop-mcp-bridge' };
  }
}
export class DshDesktopRuntime implements DesktopRuntime {
  constructor(
    private ctx: Context,
    private allowedTools: readonly string[],
    private maxOutputBytes: number,
  ) {}
  async create(cwd: string, preset: string): Promise<RuntimeSession> {
    const selection = this.ctx.agentDefaultModel.currentSelection();
    const resolved = await this.ctx.agentPresets.resolve(preset);
    const handle = await this.ctx.agents.create({
      sessionId: `mcp-${randomUUID()}` as SessionId,
      meta: { cwd, agentPreset: resolved.id },
      agentOptions: { ...selection },
      setup: async (agentCtx) => {
        // Install before composing preset listeners. Both policy stages fail closed.
        agentCtx.on('tools/pre-execute', async (exec, next) => {
          if (!this.allowedTools.includes(exec.name))
            return {
              kind: 'deny',
              reason: `Desktop MCP bridge does not permit tool ${exec.name}.`,
            };
          return next();
        });
        agentCtx.on('tools/execute', async (exec, next) => {
          if (!this.allowedTools.includes(exec.name))
            return {
              isError: true,
              content: [{ type: 'text', text: 'Desktop MCP bridge tool permission denied.' }],
              error: {
                name: 'BridgePermissionError',
                code: 'BRIDGE_PERMISSION_DENIED',
                message: 'Tool is not locally allowed.',
              },
            };
          return next();
        });
        await this.ctx.agentPresets.mount(agentCtx, resolved.id);
      },
    });
    return new DshSession(handle, this.maxOutputBytes);
  }
}
class DshSession implements RuntimeSession {
  readonly id: string;
  constructor(
    private handle: AgentHandle,
    private limit: number,
  ) {
    this.id = handle.agent.id;
  }
  async run(prompt: string): Promise<RunResult> {
    const agent = this.handle.agent;
    const start = agent.session.seq;
    agent.followup(
      createUserMessage({
        content: [{ type: 'text', text: prompt }],
        source: { kind: 'desktop-mcp-bridge' },
      }),
    );
    await agent.whenIdle();
    let text = '';
    let truncated = false;
    let outcome: RunResult['outcome'] = 'failed';
    let ended = false;
    let error: RunResult['error'];
    for (const event of agent.session.snapshotEvents(start)) {
      if (event.type === 'assistant/message') {
        for (const block of event.data.message.content) {
          if (block.type === 'text') {
            const result = boundedText(text + block.text, this.limit);
            text = result.text;
            truncated ||= result.truncated;
          }
        }
      } else if (event.type === 'turn/end') {
        ended = true;
        switch (event.data.reason.kind) {
          case 'completed':
            outcome = 'completed';
            break;
          case 'aborted':
          case 'interrupted':
            outcome = 'cancelled';
            break;
          case 'error':
            outcome = 'failed';
            error = {
              code: 'RUNTIME_FAILURE',
              message:
                'Desktop model/tool execution failed. Inspect the owned DSH session for details.',
            };
            break;
          case 'blocked':
            outcome = 'failed';
            error = { code: 'RUNTIME_BLOCKED', message: 'Desktop blocked the task.' };
            break;
          case 'max-tokens':
            outcome = 'failed';
            error = {
              code: 'OUTPUT_LIMIT',
              message: 'Desktop model reached its output-token limit.',
            };
            break;
          default:
            outcome = 'failed';
        }
      }
    }
    if (!ended)
      throw new BridgeError('RUNTIME_FAILURE', 'Agent became idle without a durable turn outcome.');
    return { text, outcome, truncated, error };
  }
  cancel() {
    this.handle.agent.cancel({ kind: 'user' });
  }
  async dispose() {
    await this.handle.dispose();
  }
}
