# Contributing

Use Node >=22.19 and `npm ci`. Run `npm run check` and `npm run format:check` before submitting changes. Keep package-lock.json in sync. Never include API keys, auth.token, local state/workspaces or private chat data.

Keep DSH integration in the adapter module. A new Desktop release requires pinned-source verification, exact-package typechecking, real Loader/AgentLoop tests, permission/cancellation tests, and a user-run signed-Desktop acceptance test. Do not remove version checks, copy internal Host credentials or add implicit CLI/Web fallback.

New tools need explicit authorization semantics, resource bounds, a teardown path, negative tests and bilingual documentation. All mutations must state uncertain-response handling. No test should require a paid model key by default. Preserve task workspaces and user changes.

CI does not publish. Follow docs/RELEASING.md and obtain the repository owner's explicit decision before public repository creation or any package/release publication. This project was developed locally and has no configured origin.
