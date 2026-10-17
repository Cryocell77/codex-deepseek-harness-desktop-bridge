# Changelog

## 0.2.1 — 2026-10-17

Target official DSH Desktop 0.2.1-rc.1 and Cordis 4.0.5 with exact release dependencies. Read package metadata through the official Host pluginPackages service, retain strict version checks, and add scoped monotonic tool guards alongside pre-execute/dispatch checks. Expand real-service tests for guard bypass attempts, ordinary-session isolation, in-flight tool cancellation, deadlines and socket task lifecycle. v0.2.0 remains the archived adapter for DSH 0.2.0-rc.2; it is not part of the new compatibility claim.

The release number is **0.2.1**. The unpublished development build was temporarily labeled 0.3.0 during local acceptance testing; no v0.3.0 Git tag or GitHub Release was published. Add README icons and foreground Desktop-to-Desktop reuse of configured Desktop providers, with no extra model API key in Codex/bridge config and no DSH CLI invocation during task execution. Include installable marketplace, Desktop adapter and source archives with checksums in the GitHub release.

Reorganize the English/Chinese landing pages around compatibility, the two-part plugin installation, first connection and task examples. Move standalone configuration, permissions/tool lifecycle and troubleshooting into matching English/Chinese guides; clarify staged adapter installation and preserve experimental acceptance limits. Include the linked contributor/security/changelog documents in the Desktop archive.

## 0.2.0 — 2026-10-17

Add a portable Codex plugin and local marketplace, bundled offline MCP launcher, delegation skill, explicit repeatable setup and packaged Desktop adapter. MCP can initialize before configuration exists; local read-only `dsh_setup_info` exposes setup diagnostics. Both sides discover explicitly initialized default private configuration. Build retains dependency license notices and generates installable/source ZIPs plus checksums. The v0.1.0 baseline is preserved in local commit 222d2c5 and tag v0.1.0. No push or publication was performed.

## 0.1.0 — 2026-10-17

Initial experimental local bridge for official DSH Desktop 0.2.0-rc.2: MCP stdio, authenticated Unix socket, exact-release Cordis adapter, isolated sessions/worktrees, task/follow-up submission, polling/results, cooperative cancellation, retained request deduplication and default-deny tool policy. Includes keyless real-service tests, bilingual setup, source audit, security and manual release preparation. No GitHub/npm publication and no signed-Desktop live-model compatibility claim.
