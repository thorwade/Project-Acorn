# Recovery Notes

## Live App Used

- Working Firebase Hosting URL: https://project-acorn-1868e.web.app
- The originally typed `projectp-acorn-1868e.web.app` returns Firebase's "Site Not Found" page.

## Deployment Findings

The live app is a Vite-built React app hosted on Firebase Hosting.

Recovered public files:

- `index.html`
- compiled JavaScript bundle
- compiled CSS bundle
- `manifest.webmanifest`
- `icons/acorn-icon.svg`
- `sw.js`

Source maps were not publicly available. The recovered source in this folder is therefore a readable reconstruction, not the original exact repository checkout.

## Firebase Project

The deployed bundle points to:

- Project ID: `project-acorn-1868e`
- Auth domain: `project-acorn-1868e.firebaseapp.com`
- Storage bucket: `project-acorn-1868e.firebasestorage.app`

The app uses:

- Firebase Authentication with Google sign-in
- Firestore
- Firebase Storage

## Data Model

The deployed app stores all private hub records under:

`users/{uid}/tasks`

Records are separated by `kind`:

- `child`
- `task`
- `diary`
- `gallery`
- `preferences`

The preferences document ID is:

`app-preferences`

## Storage Paths

Diary attachments:

`users/{uid}/diary/{diaryId}/{fileId}-{safeFileName}`

Gallery uploads:

`users/{uid}/gallery/{fileId}-{safeFileName}`

## Verification Performed

- Downloaded and inspected the live deployed bundle.
- Recovered app-specific Firebase config, Firestore collection paths, record shapes, file size/type limits, PWA manifest, icon, and service worker.
- Recreated a readable React/Vite source tree.
- Installed dependencies with pnpm.
- Parsed `src/App.jsx`, `src/main.jsx`, and `src/firebase.js` successfully with Babel's JSX parser.

## Verification Limitation

Running Vite's production build inside the Codex Windows sandbox failed with `spawn EPERM` before module transformation. This appears to be the sandbox blocking a child process Vite uses for Windows path resolution, not a syntax error in the source.

To verify outside this sandbox:

```bash
pnpm install
pnpm build
pnpm dev
```

If local Google sign-in fails, add `localhost` to Firebase Authentication's authorized domains.
