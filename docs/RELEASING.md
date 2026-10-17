# Releasing

Releases are prepared manually. CI runs checks without publishing packages or releases.

1. Update package/plugin versions, the compatibility matrix and CHANGELOG.
2. Run `npm ci`, `npm run check`, `npm run test:compatibility`, `npm run format:check` and `npm audit`.
3. Build with `npm run package:plugin`, then run `npm run verify:plugin`.
4. Inspect the archives for private configuration, credentials and workspace files. Check LICENSE, NOTICE and bundled dependency notices.
5. Test the extracted marketplace from a separate directory. Record Desktop acceptance results and remaining gaps in [VALIDATION.md](VALIDATION.md).
6. Commit the source, bundled runtime and Desktop adapter archive. Create the release tag on that commit.
7. Upload the Codex plugin ZIP, Desktop adapter TGZ, source ZIP and `SHA256SUMS.txt`. Verify uploaded digests against local files.
8. Write release notes covering features, supported versions and installation links.

Keep experimental releases marked as prereleases. npm distribution and repository visibility are managed separately from GitHub Releases.
