# Project Acorn upload preparation

Prepared 1 October 2026 for https://github.com/thorwade/Project-Acorn. The owner authorised upload after confirmation that this repository is public and empty.

Contents: app/ contains the current recovered React/Vite/Firebase source, including uncommitted changes, rules, tests and recovery notes. command-centre/index.html retains the only available standalone page source (originally under dist). docs/ contains the Facebook integration plan. Existing files and local Git state are preserved.

Excluded: local Git history, Firebase sign-in text, Google Docs shortcuts, Firebase tooling, hosting management metadata, dependencies, generated app output, logs and credentials.

Validation: 12 app unit tests passed, zero failures. All app snapshot files were checked against source SHA256 hashes. Heuristic source scan found no private-key, GitHub-token, refresh-token or client-secret markers. Firebase web configuration is public client configuration. Build and emulator tests were not rerun; dependencies are absent. Historical security reports are not current validation.

Run pnpm install, pnpm test and pnpm build inside app/. The recovered app is a reconstruction, not the original exact checkout.

The destination was verified as empty before initial publication. This source snapshot uses a new initial history; the original local repositories are preserved separately. MANIFEST.csv records prepared file hashes. No Firebase deployment or cloud configuration change is included in this upload.

