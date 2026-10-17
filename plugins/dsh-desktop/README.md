# DSH Desktop Bridge — Codex plugin

[简体中文](README.zh-CN.md)

Includes a self-contained MCP server, delegation skill and the official-Desktop adapter. Requires Node >=22.19 and official DSH Desktop **0.2.0-rc.2 / Cordis 4.0.4**. Starting the MCP server downloads nothing and never launches another Harness CLI/Web runtime.

Extract the prepared marketplace ZIP, then from its root:

```sh
codex plugin marketplace add .
codex plugin add dsh-desktop@dsh-desktop-bridge
```

For a source checkout, first run `npm ci && npm run package:plugin`. The prepared ZIP needs no npm setup. v0.2.0 has not been pushed or published by this work; use local installation until its owner publishes the prepared files.

Create a new local Codex chat and ask it to check DSH Desktop Bridge setup without submitting a model task. `dsh_setup_info` returns exact paths in the installed copy. Run its explicit setup command to initialize private `~/.dsh-mcp-state` and `~/.dsh-mcp-work` with tools denied by default; repeat setup validates existing config without rotating the token. Setup also copies the Desktop archive into private state `adapters/` for a durable installation path independent of the Codex cache. Inspection alone creates no files.

Save active tasks and fully quit DSH Desktop yourself. Install the bundled `desktop/*.tgz` through official Plugins or the returned Desktop-owned command, then reopen Desktop. Adapter dependency installation may require network access; MCP startup does not. Confirm connectivity with `dsh_connection_info`.

Both sides discover a valid private config at the default location, so no separate Codex MCP registration or shell edit is needed. Custom paths can still use standalone `--config`; for plugin use, pass it via a local plugin-MCP override and set Desktop `configFile` to match. Do not assume arbitrary environment variables are forwarded.

Delegate only in separate sessions/workspaces. Allow exact tools in the private config when authorized, reload the Desktop plugin, and review child output/diffs. An isolated cwd is not an OS sandbox.

```sh
codex plugin remove dsh-desktop@dsh-desktop-bridge
codex plugin marketplace remove dsh-desktop-bridge
```

Uninstalling this Codex plugin preserves the Desktop adapter, credentials/config and task files; remove those separately when safe. Experimental: real signed-Desktop installation/UI/live-provider acceptance remains unverified. MIT; bundled dependency licenses are in THIRD_PARTY_NOTICES.txt. No DeepSeek/OpenAI endorsement.
