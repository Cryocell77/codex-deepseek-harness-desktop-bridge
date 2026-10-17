# Manual release checklist

Publish only to the owner-authorized repository and targets. The v0.2.1 GitHub release is explicitly authorized; keep the existing private visibility. npm publication or a visibility change needs separate authorization.

1. Choose and verify the repository/package name and ownership. Add accurate author/contact/repository/bugs metadata; do not invent URLs. Configure a private security reporting route.
2. Review MIT LICENSE, NOTICE and all direct/transitive dependency licenses in the packed distribution. Source license does not authorize DSH branding or model-service access.
3. Run `npm ci`, `npm run check`, `npm run format:check`, `npm audit`, and `npm pack --dry-run`, `npm run package:plugin`, and `npm run verify:plugin`. Inspect file inventory for credentials, user paths and private workspaces.
4. Run the signed macOS Desktop acceptance procedure in VALIDATION.md. Record exact app/core/Node versions and results. Verify English/Chinese plugin metadata visually and test any allowed tools/approvals.
5. Review the final git diff and local archive. Change the version/support matrix and changelog only to match observed behavior.
6. Ask the owner to approve the concrete repository name, visibility, files and publication targets. Only after approval create/push the repository or publish packages/releases. Do not install a publishing CI workflow without approval.

Basic signed-Desktop acceptance passed on the unpublished development build of the v0.2.1 adapter; retain experimental status until allowed-tool edits, approval routing and other documented gaps have been accepted. CI currently runs local checks only, with read-only repository permissions and no model/release credentials.

The v0.1.0 snapshot is local commit 222d2c5 / tag v0.1.0. Do not move that tag. For a Git marketplace release, include generated plugin runtime and adapter archive, and compare their versions to package.json. Verify the extracted marketplace from an unrelated directory before publication.
