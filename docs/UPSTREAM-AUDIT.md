# Official upstream audit / 官方源码核实

Updated **2026-10-17 (Asia/Hong_Kong)** for bridge **v0.2.1**. [Archived v0.2.0 audit](UPSTREAM-AUDIT-v0.2.md) records the earlier target; its compatibility claim does not extend to this release.

| Subject                | Verified target                                                             |
| ---------------------- | --------------------------------------------------------------------------- |
| Official repository    | https://github.com/deepseek-ai/deepseek-harness                             |
| Pinned release         | `dsh-v0.2.1-rc.1`, commit `1600d8a1e140dcde43a1a0941940a0480712c011`        |
| Installed macOS app    | `/Applications/DeepSeek Harness.app`, Info.plist `0.2.1-rc.1`               |
| Bundled core manifests | Agent, Session, LLM, Tools, Preset Registry and Default Model: `0.2.1-rc.1` |
| Cordis / schema        | `4.0.5` / `3.18.5`                                                          |
| Source license         | MIT; see [NOTICE](../NOTICE)                                                |

The installed application was inspected read-only, including targeted manifests in `app.asar`; no application file, cookie, launch secret or provider credential was extracted or patched. The release SHA matches the local upstream checkout and [official release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-rc.1).

## Current extension and authentication model

The [official Desktop README](https://github.com/deepseek-ai/deepseek-harness/blob/1600d8a1e140dcde43a1a0941940a0480712c011/apps/desktop/README.md) continues to describe an Electron-owned Host and Desktop profile, with application authentication and a documented plugin installation surface. No supported external MCP attach/pairing API was established by this audit. The bridge uses a Cordis plugin in that existing Host and its own private Unix socket/token protocol. It never boots a CLI/Web replacement or reads Host authentication material.

## New-release adapter decisions

- **Metadata:** `ctx.pluginPackages.packageOf(specifier, parentURL)` is the official [profile package metadata service](https://github.com/deepseek-ai/deepseek-harness/blob/1600d8a1e140dcde43a1a0941940a0480712c011/packages/boot/app-boot/src/profile-resolution/service.ts). Use it instead of independently guessing package resolution in the Desktop ASAR/profile layout. Missing service/package or any mismatching guarded version fails closed.
- **Permissions:** the [Tools service](https://github.com/deepseek-ai/deepseek-harness/blob/1600d8a1e140dcde43a1a0941940a0480712c011/packages/core/tools/src/index.ts) adds monotonic `tools.guard()`. A scope-local guard may deny or abstain; an extensible pre-execute listener cannot force-allow a denial. The bridge registers it through the new agent context before mounting the preset and retains the earlier pre-execute/execute checks. Real executor tests verify short-circuit resistance and that ordinary unguarded Desktop agents still execute tools. Trusted in-process code remains outside the threat model.
- **Preset lifecycle:** the [registry](https://github.com/deepseek-ai/deepseek-harness/blob/1600d8a1e140dcde43a1a0941940a0480712c011/packages/preset/agent-preset-registry/src/index.ts) now tracks retained compositions internally; the adapter uses its public `resolve` and `mount`, without inspecting internal mount storage. Model selection continues through `agentDefaultModel.currentSelection()`.
- **Tasks/cancellation:** `agents.create`, `followup`, `whenIdle`, `cancel` and owned-handle disposal remain the integration path. Results are read from durable `assistant/message` and `turn/end` events. New-release tests cover model cancellation, delayed tool quiescence, task deadlines and completed/cancelled results through the private socket.
- **Dependencies:** dev/runtime peers match this release exactly, including Cordis 4.0.5, Loader 1.0.6, Group 1.0.5, Include 1.0.10 and Schemastery 3.18.5. No version exemptions or legacy peer-dependency bypasses are used.

## Supported scope

v0.2.1 targets only **DSH 0.2.1-rc.1 / Cordis 4.0.5**. Use the archived v0.2.0 release for the previous target. Later releases, Linux Desktop and Windows are not claimed. Automated official-service evidence and actual signed-Desktop acceptance are distinguished in [validation](VALIDATION.md).

中文：已读取本机更新后的应用版本及打包核心清单，固定到官方 `dsh-v0.2.1-rc.1`。适配器采用官方包元数据服务与新增的单向拒绝权限守卫，继续严格校验版本。任务仍运行在现有 Desktop Host，新版本不会通过启动独立 CLI/Web 或放宽认证实现兼容。
