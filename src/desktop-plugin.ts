import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-app-boot';
import schema from '@deepseek-ai/schemastery';
import { configPath, loadConfig } from './config.ts';
import { DshDesktopRuntime } from './dsh-adapter.ts';
import { TaskManager } from './manager.ts';
import { startBridge } from './transport.ts';
import { fail } from './errors.ts';
import { pathExists, resolveConfigFile } from './setup.ts';
import { DESKTOP_TARGET, CORDIS_TARGET } from './version.ts';
export const name = 'dsh-desktop-mcp-bridge';
export const inject = ['agents', 'agentPresets', 'agentDefaultModel', 'tools', 'pluginPackages'];
export interface Config {
  configFile?: string;
}
export const Config = schema.object({ configFile: schema.string() });
export async function assertCompatible(ctx: Context): Promise<void> {
  if (ctx.get('profileContext')?.name !== 'desktop')
    fail('UNSUPPORTED_HOST', 'This plugin only connects to an existing official Desktop profile.');
  const packages = ctx.get('pluginPackages');
  if (!packages) fail('UNSUPPORTED_HOST', 'Official Desktop package metadata service is required.');
  for (const pkg of [
    'cordis',
    'dsh-agent',
    'dsh-session',
    'dsh-llm',
    'dsh-tools',
    'dsh-agent-preset-registry',
    'dsh-agent-default-model',
  ]) {
    const expected = pkg === 'cordis' ? CORDIS_TARGET : DESKTOP_TARGET;
    const metadata = packages.packageOf(`@deepseek-ai/${pkg}`, import.meta.url);
    if (metadata?.name !== `@deepseek-ai/${pkg}` || metadata.version !== expected)
      fail(
        'UNSUPPORTED_VERSION',
        `Adapter requires ${pkg}@${expected}; found ${metadata?.version ?? 'unresolved'}. Bridge stays disabled.`,
      );
  }
}
export async function apply(ctx: Context, options: Config = {}): Promise<void> {
  const explicit = options.configFile ?? (process.env.DSH_DESKTOP_BRIDGE_CONFIG || undefined);
  const file = resolveConfigFile(explicit);
  if (!explicit && !(await pathExists(file))) {
    ctx.logger.warn(
      'Desktop MCP bridge is disabled. Run the explicit setup command or set configFile/DSH_DESKTOP_BRIDGE_CONFIG.',
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
