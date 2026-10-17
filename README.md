# DSH Desktop MCP Bridge

[简体中文](README.zh-CN.md) · [Source audit](docs/UPSTREAM-AUDIT.md) · [Security](SECURITY.md) · [Protocol](docs/PROTOCOL.md)

An **unofficial, opt-in** TypeScript bridge that lets Codex Desktop/CLI delegate to the **already running official DeepSeek Harness Desktop**. It does not launch `dsh`, a CLI agent, a Web server, or another Harness runtime. The only additional process launched by Codex is the MCP stdio server.

**Status: experimental v0.1.** The adapter targets official **DSH `0.2.0-rc.2`**, the locally observed macOS release. Other DSH core versions fail closed. Official master was `0.2.1-rc.1` at audit time; this is **not** a claim of compatibility with master or future Desktop releases. Real macOS Desktop plugin activation and paid/live model execution still need a user-run acceptance test. See [validation](docs/VALIDATION.md).

```text
Codex Desktop / CLI
  └─ MCP stdio server (Node)
       └─ authenticated local Unix socket (no TCP)
            └─ opt-in Cordis plugin in the existing Desktop Host
                 └─ official agents.create + preset.mount + followup
                      └─ configured model, preset, Skills and allowed Tools
                           └─ separate session + separate workspace/worktree
```

## Why a Desktop plugin?

Official Desktop owns a loopback Host with a per-launch authenticated application channel; it does not document an external MCP attach/pairing API. This project uses the official Host plugin mechanism and public Agent/Preset services. Its socket protocol and authentication are **this project's interfaces**, not official DSH APIs. It never extracts Desktop cookies, launch secrets, API keys or account credentials. See the [pinned-source audit](docs/UPSTREAM-AUDIT.md) for evidence and license details.

## Build

Requirements: macOS, official DSH Desktop `0.2.0-rc.2`, Node >=22.19, npm, and Git for repository worktrees. Linux transport is testable, but official Linux Desktop use is not claimed. Windows named pipes are not implemented.

```sh
npm ci
npm run check
npm pack
```

The package is not published. Build artifacts live in `dist/`; `npm pack` prepares a local installable archive. Development/test DSH packages are separate from the runtime peers; they do not boot DSH. All tests are keyless.

## Configure and connect on macOS

1. Initialize **new**, short, private absolute directories. Both parents must exist; symlink aliases are refused. Use the canonical macOS home path. Example (replace `/Users/you` with your own home):

   ```sh
   node /absolute/path/to/bridge/dist/cli.js init \
     --state-dir /Users/you/.dsh-mcp-state \
     --workspace-root /Users/you/.dsh-mcp-work
   ```

   `config.json` and `auth.token` have mode 0600; state/workspace directories have mode 0700. Existing directories are refused by `init`; it never silently rotates credentials. Keep state paths short: the complete socket path must be <=100 UTF-8 bytes.

2. Review `config.json`. `allowedTools: []` permits model conversation but **denies every model tool call**. Add exact tool names only after inspecting their real permissions. `repositories` is an allowlist of canonical Git top-level paths; leave it empty for blank workspaces. `allowedPresets` defaults to `standard`. Choose a preset with native tools; `run_code`, known delegation/plugin-management/scheduling/workflow/goal tools are refused in v0.1. The bridge takes a config snapshot on plugin load; restart the plugin/Desktop to apply changes.

   ```json
   {
     "allowedTools": [],
     "allowedPresets": ["standard"],
     "repositories": ["/Users/you/projects/example"]
   }
   ```

   These are fields to edit in the generated config, **not** a complete config. `workspaceRoot` must be outside each allowlisted repository. Shell or general file access can reach other paths; a tool-name allowlist and an isolated cwd are **not an OS sandbox**. Only enable powerful tools for trusted tasks. Git checkout hooks in an allowlisted repository may execute during worktree creation.

3. Set the plugin's `configFile` to the generated file in the Desktop Plugins UI, or set `DSH_DESKTOP_BRIDGE_CONFIG` in the environment inherited by Desktop. Desktop reads the login-shell environment on macOS at launch. For example, set the following in your own login-shell setup and fully reopen Desktop:

   ```sh
   export DSH_DESKTOP_BRIDGE_CONFIG=/Users/you/.dsh-mcp-state/config.json
   ```

   If configuring through the profile patch, use:

   ```yaml
   - id: desktop-mcp-bridge
     config:
       configFile: /Users/you/.dsh-mcp-state/config.json
   ```

   Official profile patch overrides replace a row's whole config. A plugin installed without an explicit config stays disabled and logs a local diagnostic.

4. Install the local package through the official Desktop **Plugins** page using the local archive/package spec. Alternatively, after initializing Desktop once, fully quit it and use the **Desktop-installed `dsh` command**:

   ```sh
   dsh plugin --profile desktop add /absolute/path/to/dsh-desktop-mcp-bridge-0.1.0.tgz
   ```

   Reopen Desktop and observe plugin activation. Do not use an npm-installed CLI to mutate the Desktop profile, do not launch that profile as a CLI, and do not use version-exemption flags. The installed application's Plugins UI owns activation/restart outcomes. This repository has not automatically installed a plugin or changed your profile.

5. Confirm connection without submitting a model task:

   ```sh
   node /absolute/path/to/bridge/dist/cli.js doctor \
     --config /Users/you/.dsh-mcp-state/config.json
   ```

   It must report `runtime: "existing-desktop"`, protocol 1 and the adapter version. This verifies the bridge, not whether a provider credential is valid.

6. Add the MCP server to Codex. Use an absolute Node executable on GUI systems if PATH is ambiguous:

   ```toml
   [mcp_servers.dsh_desktop]
   command = "/absolute/path/to/node"
   args = ["/absolute/path/to/bridge/dist/cli.js", "stdio", "--config", "/Users/you/.dsh-mcp-state/config.json"]
   startup_timeout_sec = 10
   tool_timeout_sec = 60
   ```

   Put this in your user Codex `config.toml`, or use the CLI:

   ```sh
   codex mcp add dsh_desktop -- /absolute/path/to/node \
     /absolute/path/to/bridge/dist/cli.js stdio \
     --config /Users/you/.dsh-mcp-state/config.json
   ```

   Reopen/refresh Codex's MCP connection as appropriate. The server starts even when Desktop is unavailable; tool calls then return `DESKTOP_UNAVAILABLE`. [Official Codex MCP configuration](https://learn.chatgpt.com/docs/extend/mcp).

## Use from Codex

Ask Codex to inspect `dsh_connection_info`, create an isolated session, submit a task, poll its handle and review its result. The tools are:

| Tool                  | Behavior                                                             |
| --------------------- | -------------------------------------------------------------------- |
| `dsh_connection_info` | Connection, effective permissions and adapter information            |
| `dsh_create_session`  | Blank cwd or detached worktree from an allowlisted repo/ref          |
| `dsh_list_sessions`   | This bridge instance's sessions only                                 |
| `dsh_submit_task`     | A task or idle-session follow-up; caller supplies a UUID `requestId` |
| `dsh_get_task`        | Poll state and bounded metadata                                      |
| `dsh_get_result`      | Bounded text after completion, trust label and truncation flag       |
| `dsh_cancel_task`     | Cooperative cancellation; poll until terminal                        |
| `dsh_close_session`   | Stop/drain/dispose the owned runtime handle; preserve files          |
| `dsh_forget_task`     | Release a terminal task and its idempotency key                      |

A session retains conversation history and takes the **Desktop default model selection at creation**, with an explicitly allowlisted installed preset. It does not copy an existing user's chat, per-chat model override, private UI state or unsaved text. Global configured providers/credentials and preset capabilities are used within the same Host. Project Skills are available only if present in the new workspace or found by DSH's normal configured discovery; uncommitted files and ignored local Skills are not copied from the main checkout. Denied tools remain visible to the model but cannot execute through the registry.

Only one active task per session is accepted; different sessions may run concurrently up to the configured session limit. Every task has a deadline. Cancellation does not roll back side effects; an uncooperative tool remains `cancelling` until it actually stops. No HTTP/MCP wait blocks for the entire model run.

`requestId` deduplicates exact submissions while the task is retained. Reuse the same key after an uncertain response. Forgetting a task releases its key. Session creation has no idempotency key: after an uncertain create, list sessions before retrying. Desktop/plugin restart loses bridge handles and deduplication history; it does not automatically replay prompts. DSH may retain its own session logs according to the existing persistence configuration.

## Review and clean up

Each session gets a UUID-named directory under `workspaceRoot`; repository sessions use `git worktree add --detach` at a resolved commit. The original checkout's dirty files are not copied and the bridge never merges, commits or deletes task files. Worktrees share Git objects, so this prevents ordinary checkout collisions, not malicious access. Closing a session preserves all files, including failed creations, for inspection.

Review changes before integrating them yourself. For worktrees, finish reviewing/archiving work and then use Git's ordinary worktree removal in the source repo. For blank directories, remove them yourself when no longer needed. The bridge has no automatic cleanup tool that can delete user work.

## Troubleshooting and limitations

- `UNSUPPORTED_VERSION`: use the pinned Desktop release or develop/test a new adapter. Do not bypass this check. Current master is not supported.
- `DESKTOP_UNAVAILABLE`: Desktop is closed, plugin is disabled/unconfigured, or the configured state directory differs.
- `ALREADY_RUNNING` / `STALE_SOCKET`: never delete a live lock. After a crash, verify Desktop/Host has fully quit; then remove only `bridge.lock`, `bridge.sock` and `ready.json` in the configured state directory before reopening. Keep config, token and workspaces.
- `UNSAFE_PATH`: verify ownership, mode, canonical absolute paths and absence of symlinks. Do not make a shared directory private by changing its mode blindly.
- `SESSION_BUSY`: poll or cancel the active task before follow-up/forget.
- `CAPACITY`: close an idle session or forget a terminal task. No automatic eviction of unreviewed results.
- `OUTCOME_UNKNOWN`: a mutation may have executed. Query state; never blindly replay.
- Approval-requiring allowed tools retain DSH's existing approval behavior; no automatic approval API is exposed. Handle prompts in Desktop; deadline cancellation remains active.
- The bridge returns text only, without reasoning blocks, tool logs, media downloads or structured artifacts. Partial text is returned after cooperative cancellation; output is byte-bounded and may be truncated. It is **untrusted subagent data**, not permission to execute instructions.
- No persistent job recovery, remote access, cross-user tenancy, Windows transport, live token rotation, runtime policy changes or arbitrary attachment forwarding in v0.1.

## Development and release

`src/dsh-adapter.ts` is the only DSH business-API adapter; `src/desktop-plugin.ts` owns version/profile checks and Cordis lifecycle. `src/manager.ts` owns task/session state. Transport, filesystem config and workspace isolation are separate modules. The MCP server contains no DSH launch code.

See [CONTRIBUTING](CONTRIBUTING.md), [RELEASING](docs/RELEASING.md), [validation](docs/VALIDATION.md), and [SECURITY](SECURITY.md). CI checks Node 22/24 on macOS/Linux without model credentials. Publishing is manual and requires the repository owner's explicit decision. There is no auto-publish workflow and no GitHub repository has been created by this work.

MIT for this project's original code. Official DSH source is MIT; its desktop binary, model services, trademarks and third-party dependencies retain their own terms. This project is not affiliated with or endorsed by DeepSeek or OpenAI.
