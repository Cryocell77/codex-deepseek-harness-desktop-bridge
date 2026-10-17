#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { initialize } from './config.ts';
import { BridgeClient } from './transport.ts';
import { serveMcp } from './mcp.ts';
import { BridgeError, publicError } from './errors.ts';
try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      config: { type: 'string' },
      'state-dir': { type: 'string' },
      'workspace-root': { type: 'string' },
    },
  });
  const command = positionals[0] ?? 'help';
  if (command === 'init') {
    if (!values['state-dir'] || !values['workspace-root'])
      throw new BridgeError('USAGE', 'init requires --state-dir and --workspace-root');
    const file = await initialize(values['state-dir'], values['workspace-root']);
    console.log(
      `Created private bridge config: ${file}\nReview allowedTools and repositories before enabling the Desktop plugin.`,
    );
  } else if (command === 'stdio' || command === 'doctor') {
    const config = values.config ?? process.env.DSH_DESKTOP_BRIDGE_CONFIG;
    if (!config) throw new BridgeError('USAGE', 'Use --config /absolute/path/config.json');
    if (command === 'stdio') {
      const server = await serveMcp(config);
      const stop = () => {
        void server.close().finally(() => process.exit(0));
      };
      process.once('SIGINT', stop);
      process.once('SIGTERM', stop);
    } else {
      console.log(
        JSON.stringify(
          await (await BridgeClient.fromConfig(config)).call('connection_info', {}),
          null,
          2,
        ),
      );
    }
  } else {
    console.log(
      'dsh-desktop-mcp init --state-dir PATH --workspace-root PATH\ndsh-desktop-mcp doctor --config FILE\ndsh-desktop-mcp stdio --config FILE',
    );
  }
} catch (error) {
  console.error(JSON.stringify(publicError(error)));
  process.exitCode = 1;
}
