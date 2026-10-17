# Security policy and threat model

This is an experimental local integration. It assumes the current macOS account, installed DSH runtime/presets, allowlisted repositories and enabled plugins are trusted. It does not defend against root, malicious same-user software or a malicious in-process Cordis plugin.

## Enforced controls

- Explicit setup creates private default-deny configuration; a valid default config is subsequently discovered by the installed adapter. Explicit plugin setup also stages a versioned adapter archive in the private state directory; startup and read-only setup inspection create no files, and the plugin never starts an external Harness process.
- Desktop-profile and exact core package-version checks; no version exemptions.
- Unix socket only. State directory 0700, socket/token/config 0600, current UID ownership, regular-file/no-final-symlink reads, canonical bridge directory paths.
- Independent random 256-bit token, constant-time comparison, no browser-origin requests, no Host cookie/key extraction.
- Schema validation, input/output byte limits, session/task quotas, one active task per session, bounded socket connections and request times.
- Default-deny tool-name allowlist enforced at real pre-execute and execute hooks. Known composite/delegation/runtime-mutation/autonomous scheduling tool names are unsupported in v0.2.0. Do not enable third-party equivalents that evade those names.
- Repository allowlist, resolved commit refs, unique detached worktrees, no automatic merge/delete/commit.
- Task deadline requests real cancellation; no pretend terminal state before quiescence.
- All returned text is labeled untrusted. Generic runtime errors prevent leaking provider credentials through transport errors.

## Limits users must understand

An isolated cwd is a collision-avoidance measure, not a filesystem/network sandbox. Shell/general file tools, trusted preset hooks and repository checkout hooks can access the host with the Desktop process's privileges. A tool-name allowlist is not argument-level path confinement. Denied tools remain visible in model schemas; execution is refused. General code/delegation tools are intentionally unsupported, but a differently named third-party equivalent cannot be recognized by a name list. Review the implementation of every allowed tool and choose a native-tool preset.

All clients with this token share authority over bridge-owned sessions. There is no per-client tenancy, per-task permission elevation, remote pairing or OAuth. Same-user task code may access token files if you permit broad shell/file tools. The token protects other OS users and accidental access; it does not isolate trusted desktop workers from their owner account.

Provider calls may spend money and send prompts/code to the selected provider. Existing DSH persistence may store task prompts/results. The bridge does not export credentials, but permitted tools and model output can still contain sensitive user data. Do not submit secrets casually or treat subagent text as executable commands.

Cancellation is cooperative; tools may keep running and external effects may survive. Restart loses volatile bridge tracking and idempotency history; do not replay uncertain tasks automatically. Files are preserved even on close/failure. Git worktrees share the repository object database and hook configuration.

Configuration is a load-time snapshot. To revoke tools, stop active tasks and reload the plugin/Desktop. To rotate credentials, fully quit Desktop/Host and connected MCP clients, replace `auth.token` with a new 64-character hexadecimal random value (0600), and restart/reconnect. There is no live rotation. After a crash, verify the Host has quit before removing only the stale lock/socket/ready marker.

## Reporting

No public repository or private security inbox is configured yet. Before publication the maintainer must add a private reporting contact or enable GitHub private vulnerability reporting. Do not open a public issue containing tokens, prompts, credentials or private source code. Public issue templates explicitly request redaction.

安全边界：本项目防止误连接、未经令牌认证的本地访问、常规并发文件冲突和默认未授权工具执行。它不构成操作系统沙箱，也不隔离同一用户的恶意软件或进程内恶意插件。发布前需由维护者配置真实私密漏洞报告渠道。
