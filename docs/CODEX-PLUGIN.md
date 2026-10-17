# Codex plugin packaging / Codex 插件封装

Version **0.2.0** packages the existing bridge for local marketplace installation. The preserved baseline is local Git commit **222d2c5**, annotated tag **v0.1.0**. No baseline or v0.2 changes were pushed by this work.

## Install from the prepared ZIP

Unzip `dsh-desktop-codex-plugin-0.2.0.zip`. Open a terminal in its extracted root, then:

```sh
codex plugin marketplace add .
codex plugin add dsh-desktop@dsh-desktop-bridge
```

For the source checkout, run `npm ci && npm run package:plugin` first. Plugin runtime payloads are deliberately kept under `plugins/dsh-desktop/` so a future Git marketplace can distribute them without requiring install-time builds or an unpublished npm package. Do not manually modify generated `runtime/server.cjs`; change source and rebuild.

The manifest uses the currently documented portable Agent Plugins layout: root `plugin.json`, `mcp.json` with explicit stdio transport, `skills/`, assets, and OpenAI presentation metadata under `extensions.com.openai`. MCP arguments/cwd use the supported `${PLUGIN_ROOT}` placeholder. No compatibility manifest is shipped with a second possibly conflicting MCP declaration. Clients must support this portable format; the local Codex **0.163.0-alpha.10.2** CLI successfully discovered the plugin. Older clients can use the standalone MCP entry described in README instead.

## One-time Desktop setup

1. New local Codex chat: ask to use DSH Desktop Bridge and inspect `dsh_setup_info` first. This read-only tool lists configuration validity and precise commands for the installed plugin copy.
2. Run the explicit `setup` command returned there. Default private directories are `~/.dsh-mcp-state` and `~/.dsh-mcp-work`. Existing config/token are validated and retained. Setup stages the Desktop archive under private state `adapters/`; installation commands use this durable copy so Codex cache updates/uninstallation do not remove its source. For blank/custom setup, both `--state-dir` and `--workspace-root` must be supplied together.
3. Save current tasks and fully quit DSH Desktop yourself. Install the bundled adapter archive via the official Plugins page or the returned command pointing to the Desktop-owned `runtime/cli/bin/dsh`. It may install npm dependencies and needs the existing Desktop profile initialized once. The helper does not quit Desktop, install anything, edit a profile, or launch a runtime.
4. Reopen Desktop. It discovers the valid default config, or uses an explicit `configFile`/environment value. Call `dsh_connection_info`. Valid configuration alone is not evidence that Desktop is connected or the selected provider credential works.
5. Delegate in an isolated session. Default-deny tool permissions must be explicitly edited for coding capabilities and loaded again by the Desktop plugin.

The MCP server can initialize before configuration exists, exposing setup diagnostics rather than failing its handshake. It retries configuration loading on subsequent calls after setup; it never creates config on startup. There are **10 MCP tools**: the original nine bridge operations and local read-only `dsh_setup_info`. No extra Desktop RPC or auto-approval API is introduced.

## Update and uninstall

Refresh the configured marketplace and reinstall the Codex plugin with `codex plugin marketplace upgrade dsh-desktop-bridge` and `codex plugin add dsh-desktop@dsh-desktop-bridge`. For a local source, rebuild/update that directory before reinstalling. New releases keep their own versioned Desktop archives in private state. Run setup again, then update the Desktop adapter via the official surface after saving/quitting Desktop; do not force a live Host restart.

```sh
codex plugin remove dsh-desktop@dsh-desktop-bridge
codex plugin marketplace remove dsh-desktop-bridge
```

Codex uninstallation does not remove the Desktop adapter, staged adapter archives, config/token or task files. Uninstall the adapter through Desktop Plugins separately, and remove private state/workspaces yourself only after reviewing/archiving their contents.

## Build and distribution

```sh
npm ci
npm run check
npm run package:plugin
npm run verify:plugin
```

Outputs:

- `outputs/dsh-desktop-codex-plugin-0.2.0.zip`: installable local marketplace, bundled MCP/skill, Desktop adapter, documentation and licenses.
- `outputs/dsh-desktop-mcp-bridge-0.2.0.tgz`: Desktop plugin npm archive.
- `outputs/dsh-desktop-mcp-bridge-source-0.2.0.zip`: source/tests plus built payloads, excluding dependencies, Git internals and scratch/state directories.
- `outputs/SHA256SUMS.txt`: checksums of current and retained baseline archives.

MCP code is bundled with its dependencies into CommonJS for Node, so moving the installed copy does not require `node_modules`, a global npm package or network. Build-generated THIRD_PARTY_NOTICES.txt retains the license text of every included dependency. The Desktop archive retains official API peers and runtime dependency installation; it does not bundle a Desktop binary or start one. No Codex lifecycle hooks, npm install-time hooks or automatic publishing workflows are included.

## Comparison and primary references

The user-requested [reference project](https://github.com/Seann0824/deepseek-harness-for-codex/tree/12174fcf17bfd760509340b9e34418c7c1213e3f) was read at commit `12174fcf17bfd760509340b9e34418c7c1213e3f`. Its marketplace/skill/MCP grouping inspired the installation layout; its runtime implementation was not copied. It starts/manages a separate local DSH Web process. This project's worker remains in the existing official Desktop Host and therefore still needs an explicitly installed Desktop adapter.

[Official plugin packaging](https://developers.openai.com/plugins/build/plugins) and [local stdio packaging](https://developers.openai.com/plugins/deploy/desktop-only) specify the portable files and `${PLUGIN_ROOT}`. The matching parser and tests were inspected at [openai/codex commit ce0323f](https://github.com/openai/codex/tree/ce0323f2f2d3b25e82806cd555237da3db4e1897/codex-rs/codex-mcp/src). Both manifests passed the official Agent Plugins 1.0.0 JSON schemas. Local/repository marketplaces are distinct from public-directory submission; this work only prepares local/Git distribution and does not submit anything to a public directory.

中文：插件封装借鉴参考项目的“市场 + MCP + Skill”分发结构，但继续复用已运行的官方 Desktop。一次显式初始化和桌面适配器安装后，Codex 侧不必再手动配置 MCP。v0.1.0 已有独立本地提交与标签；v0.2.0 的安装包和源代码仅供本地审查，尚未推送或发布。实际桌面安装与真实模型验收仍按 VALIDATION.md 执行。
