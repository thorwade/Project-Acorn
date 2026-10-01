# Project Acorn - Recovered Source

This is a readable reconstruction of the deployed Firebase app at:

https://project-acorn-1868e.web.app

The original source maps were not available from Firebase Hosting, so this is not a byte-for-byte checkout of the old repository. It was rebuilt from the deployed bundle, copied deployed assets, and recovered Firebase configuration.

## What Was Recovered

- React + Vite app structure
- Firebase project configuration for `project-acorn-1868e`
- Google sign-in
- Firestore private family hub using `users/{uid}/tasks`
- Child profiles, tasks, diary entries, gallery records, and preferences using a `kind` field
- Firebase Storage paths:
  - `users/{uid}/diary/{diaryId}/{fileId}-{safeName}`
  - `users/{uid}/gallery/{fileId}-{safeName}`
- Deployed CSS, web manifest, icon, and service worker

## Run Locally

```bash
pnpm install
pnpm dev
```

If Google sign-in is blocked locally, add `localhost` as an authorized domain in Firebase Authentication.

## Build

```bash
pnpm build
```

## Notes

The deployed app stores mixed record types in one Firestore collection:

`users/{uid}/tasks`

Record types are separated by the `kind` field:

- `child`
- `task`
- `diary`
- `gallery`
- `preferences`

The preferences document ID recovered from the bundle is `app-preferences`.
