# Validation / 验证记录

Bridge **v0.2.1**, macOS arm64, **2026-10-17**. Earlier results: [v0.2.0](VALIDATION-v0.2.md).

## Compatibility matrix

| Desktop/core | Cordis | Schemastery | Typecheck | Automated suite | Live Desktop                 |
| ------------ | ------ | ----------- | --------- | --------------- | ---------------------------- |
| 0.2.0-rc.2   | 4.0.4  | 3.18.4      | Passed    | 27 passed       | Not tested                   |
| 0.2.1-rc.1   | 4.0.5  | 3.18.5      | Passed    | 27 passed       | Development build, see below |

Run `npm run test:compatibility` to install each release's dependencies in a separate temporary directory and run typechecking and the full suite. Select one target with `-- --desktop 0.2.0-rc.2`. The tests use official Cordis, Loader, AgentLoop, Session, Preset and Default Model services with a scripted model provider; no API key is required.

## Automated coverage

| Area               | Checks                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Tasks and sessions | Execution, follow-ups, busy-session rejection, request deduplication and bounded retention             |
| Permissions        | Denied and allowed tools, pre-execute short-circuit resistance, isolation from ordinary Desktop agents |
| Cancellation       | Model cancellation, in-flight tool quiescence, deadlines and terminal results                          |
| Plugin lifecycle   | Built adapter activation in a simulated Desktop profile, socket cleanup and session disposal           |
| Version checks     | Complete supported combinations accepted; mixed, missing, misnamed and unknown packages rejected       |
| Transport          | Token authentication, browser-origin rejection, protocol validation and input/output limits            |
| Workspaces         | Detached Git worktrees, preservation of main-checkout changes and retained child files                 |
| Portable bundle    | Relocation without node_modules, MCP initialization before setup and later reconnection                |

The newer dependency tree also passed all 10 adapter tests under the installed application's bundled Node in Electron RunAsNode mode. These use simulated contexts rather than a live Desktop Host.

## Live Desktop run

Environment: signed macOS DSH Desktop **0.2.1-rc.1**, pre-release bridge build, `allowedTools: []`. The final v0.2.1 package was checked by the automated suite above; it was not separately installed for this live run.

| Check          | Result                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------- |
| Installation   | Application-owned plugin installer completed its lockfile check; adapter activated in Desktop |
| Connection     | `runtime: existing-desktop`, adapter `dsh-v0.2.1-rc.1`                                        |
| Model response | Isolated session returned the expected response; durable events recorded a completed turn     |
| Cancellation   | running → cancelling → cancelled; durable `turn/end` reason was `aborted`                     |
| Tool denial    | Native `read` was denied; the session's `tool/result` recorded `isError: true`                |
| Cleanup        | Both test sessions closed; workspaces retained                                                |

## Remaining checks

- Live end-to-end testing on Desktop 0.2.0-rc.2.
- Allowed file edits and tool approval UI routing.
- Rendered plugin metadata and icon.
- Linux Desktop, Windows transport and other DSH versions.
- Long-running external side effects and production reliability.

中文：两组兼容版本均通过类型检查和自动化测试。0.2.1-rc.1 的桌面连接、模型回复、工具拒绝及取消经过开发构建实测；最终 v0.2.1 包和旧版桌面端的实机测试范围见上表。获准文件编辑及人工审批仍待验证。
