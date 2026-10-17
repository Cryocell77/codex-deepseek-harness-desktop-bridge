# Validation / 验证记录

Release **v0.2.1**, retested **2026-10-17 (Asia/Shanghai)** against both exact targets below. The v0.2.1 tag/assets are replaced at the owner’s request, retaining the version. [Archived v0.2.0 evidence](VALIDATION-v0.2.md) applies to the earlier adapter only.

## Automated compatibility matrix

| Official Desktop/core | Cordis | Schemastery | Strict typecheck | Automated tests                    | Signed Desktop live evidence                  |
| --------------------- | ------ | ----------- | ---------------- | ---------------------------------- | --------------------------------------------- |
| 0.2.0-rc.2            | 4.0.4  | 3.18.4      | Passed           | **27 passed, 0 failed, 0 skipped** | Not performed with this adapter               |
| 0.2.1-rc.1            | 4.0.5  | 3.18.5      | Passed           | **27 passed, 0 failed, 0 skipped** | Historical development build, described below |

Reproduce both independent dependency trees with `npm run test:compatibility`, or select one using `-- --desktop 0.2.0-rc.2`. Each tree installs exact official release dependencies without force/legacy-peer-deps, then runs the unmodified adapter, strict typechecking and the complete suite. A shared compatibility table drives the production guard, setup and build metadata. CI runs the current tree and the older tree on its existing OS/Node matrix.

## Automated behavior checks (both targets)

| Check                      | Result                                                                                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact dependencies         | Fresh install without force/legacy-peer-deps; dedicated local cache avoided an existing user npm-cache ownership error                                                                        |
| Strict typecheck and build | Passed against both releases’ public types; shared bundle built with supported Node target                                                                                                    |
| Test suite                 | **27 passed per target, 54 total, 0 failed, 0 skipped**; no live provider credentials                                                                                                         |
| Task execution             | Real Cordis Loader, AgentLoop, Session, Preset and Default Model services with a scripted keyless LLM adapter; normal output and follow-ups passed                                            |
| Permissions                | Unallowlisted fixture denied; allowed fixture executed; pre-execute short circuit could not override the monotonic guard; ordinary Desktop agent remained unrestricted                        |
| Cancellation               | Model request cancelled; allowed in-flight tool remained nonterminal until released; scripted provider deadline through the real AgentLoop resulted in `timed_out`                            |
| Socket lifecycle           | Built plugin in simulated Desktop profile: submission, terminal result, follow-up cancellation, session close preserving files, unload removing socket                                        |
| Version checks             | Official metadata accepted both complete exact targets; mixed Cordis/core/schema, unknown versions and missing packages rejected; connection info and ready marker report the detected pair   |
| Bundled Electron Node      | All **10 adapter tests passed** for the newer dependency tree under the installed official app executable in Electron RunAsNode mode; separate temporary simulated contexts, not another Host |
| Existing safeguards        | Auth/origin/schema/bounds, idempotency, shutdown, quotas, errors and detached worktrees passed                                                                                                |
| Portable plugin            | Relocated bundle worked without node_modules and configuration could be created after MCP initialization                                                                                      |

These tests create separate temporary contexts/workspaces. They do not open another Harness CLI/Web runtime, alter provider credentials, broaden the user's tool policy or prove real signed-Desktop GUI behavior.

## Actual signed Desktop acceptance

The live checks below were performed on the same execution/permission implementation (before extending the exact-version admission table) in an **unpublished development build labeled 0.3.0**. At the owner's request, the release is numbered **0.2.1**. The live version values are preserved as observed; this is not a claim of a second live installation under the final number. The final 0.2.1 package is validated separately by the automated suite. No v0.3.0 Git tag or GitHub Release was published.

The user explicitly confirmed active work was saved and Desktop was fully quit. The application-owned `dsh plugin --profile desktop add` updated the installed adapter from 0.2.0 to 0.3.0 and passed the official lockfile supply-chain check. The Codex plugin was updated to 0.3.0 and confirmed installed/enabled. Desktop was reopened through its ordinary application launcher.

| Live check               | Observed result                                                                                                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connection               | `runtime: existing-desktop`, bridge 0.3.0, adapter dsh-v0.2.1-rc.1, existing `allowedTools: []` unchanged                                                                                                        |
| Task execution           | A new blank isolated session used the existing configured provider and returned exact `BRIDGE_V030_OK`; durable assistant/message and completed turn/end verified                                                |
| Cooperative cancellation | A follow-up task moved running → cancelling → cancelled; complete:true observed and its own durable log recorded turn/end reason aborted                                                                         |
| Negative permission      | A second new isolated session attempted one native read of a harmless probe file inside its own workspace; its own durable tool/result recorded isError:true and `Desktop MCP bridge does not permit tool read.` |
| Cleanup                  | Both bridge-owned validation sessions closed; list_sessions returned empty; both workspaces remained for review                                                                                                  |

Evidence was checked only in these newly created validation sessions, including their compressed durable logs; unrelated chats and provider credentials were not read. Local sanitized evidence is saved as `outputs/VALIDATION-v0.3.0.json`. Three bounded live turns were submitted using the existing provider. The existing private config/token and tool allowlist were not modified. These live results supplement, rather than replace, positive allowed-tool and delayed-quiescence fixture tests.

Actual allowed-tool editing, approval UI and rendered plugin metadata/icon are not claimed by these probes.

## Remaining scope

Old signed-Desktop end-to-end acceptance, Linux/Node 22 CI matrix, other DSH releases (including 0.2.1-rc.2), Windows, long-running external side effects, real approval UI routing and production reliability remain outside local automated evidence. The live test run did not push code or publish npm packages; both local plugin updates were explicitly authorized. The subsequent v0.2.1 GitHub release is a separate owner-authorized publication step.

中文：正式发布版本号为 v0.2.1；下方真实桌面证据来自未发布、临时标号为 0.3.0 的同一任务/权限实现（本次另行扩展了精确版本准入表），保留实际观测版本，不伪称重新安装过最终版本。两组精确版本各通过 27 项自动化测试，共 54 项；旧版签名桌面端尚未使用当前适配器实机验收。测试覆盖官方服务上的工具白名单、提前允许监听器、普通会话权限不受影响、模型/工具取消、超时以及 socket 任务完整流程。真实 Desktop 已完成连接、模型回复、取消和默认权限拒绝验收；权限结论来自本次新建会话的持久工具错误事件，不依据模型自述。两个测试会话已关闭，工作区保留，用户白名单与 token 未改动。
