# Manual release checklist

This repository is prepared for review, not published. Do not create a GitHub repository, push, publish npm packages or upload a release without explicit owner authorization.

1. Choose and verify the repository/package name and ownership. Add accurate author/contact/repository/bugs metadata; do not invent URLs. Configure a private security reporting route.
2. Review MIT LICENSE, NOTICE and all direct/transitive dependency licenses in the packed distribution. Source license does not authorize DSH branding or model-service access.
3. Run `npm ci`, `npm run check`, `npm run format:check`, `npm audit`, and `npm pack --dry-run`. Inspect file inventory for credentials, user paths and private workspaces.
4. Run the signed macOS Desktop acceptance procedure in VALIDATION.md. Record exact app/core/Node versions and results. Verify English/Chinese plugin metadata visually and test any allowed tools/approvals.
5. Review the final git diff and local archive. Change the version/support matrix and changelog only to match observed behavior.
6. Ask the owner to approve the concrete repository name, visibility, files and publication targets. Only after approval create/push the repository or publish packages/releases. Do not install a publishing CI workflow without approval.

Initial release should remain experimental until real Desktop activation and model execution have passed. CI currently runs local checks only, with read-only repository permissions and no model/release credentials.
