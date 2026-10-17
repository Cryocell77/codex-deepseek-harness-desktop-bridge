import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-app-boot';
import schema from '@deepseek-ai/schemastery';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { configPath, loadConfig } from './config.ts';
import { DshDesktopRuntime } from './dsh-adapter.ts';
import { TaskManager } from './manager.ts';
import { startBridge } from './transport.ts';
import { fail } from './errors.ts';
export const name = 'dsh-desktop-mcp-bridge';
export const inject = ['agents', 'agentPresets', 'agentDefaultModel', 'tools'];
export interface Config {
  configFile?: string;
}
export const Config = schema.object({ configFile: schema.string() });
export async function assertCompatible(ctx: Context): Promise<void> {
  if (ctx.get('profileContext')?.name !== 'desktop')
    fail('UNSUPPORTED_HOST', 'This plugin only connects to an existing official Desktop profile.');
  const require = createRequire(import.meta.url);
  for (const pkg of [
    'cordis',
    'dsh-agent',
    'dsh-session',
    'dsh-llm',
    'dsh-tools',
    'dsh-agent-preset-registry',
    'dsh-agent-default-model',
  ]) {
    const manifest = JSON.parse(
      await readFile(require.resolve(`@deepseek-ai/${pkg}/package.json`), 'utf8'),
    ) as { version?: string };
    const expected = pkg === 'cordis' ? '4.0.4' : '0.2.0-rc.2';
    if (manifest.version !== expected)
      fail(
        'UNSUPPORTED_VERSION',
        `Adapter requires ${pkg}@${expected}. Installed version is unsupported; bridge stays disabled.`,
      );
  }
}
export async function apply(ctx: Context, options: Config = {}): Promise<void> {
  const file = options.configFile ?? process.env.DSH_DESKTOP_BRIDGE_CONFIG;
  if (!file) {
    ctx.logger.warn(
      'Desktop MCP bridge is disabled. Set configFile or DSH_DESKTOP_BRIDGE_CONFIG explicitly.',
    );
    return;
  }
  await assertCompatible(ctx);
  const config = await loadConfig(file);
  if (file !== configPath(config.stateDir)) fail('CONFIG', 'Use canonical configFile path.');
  const manager = new TaskManager(
    config,
    new DshDesktopRuntime(ctx, config.allowedTools, config.maxOutputBytes),
  );
  await ctx.effect(async () => {
    const stop = await startBridge(config, manager);
    return async () => {
      await stop();
      await manager.dispose();
    };
  });
}
