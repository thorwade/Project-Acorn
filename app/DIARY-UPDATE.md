# Diary update — 14 October 2026

The diary form now follows: Title; Entry date (Today or Choose a date); Family members (multiple); Subjects (multiple); photos/videos; diary text.

One Firestore diary document stores `entryDate` as YYYY-MM-DD, `assigneeIds` as an array and `subjects` as an optional array. `createdAt` remains the save audit timestamp. Today uses Europe/London. Older single `assigneeId` records remain readable; older dates fall back to createdAt. Lists display and sort by diary day; inclusive From/To filters use that day. Shared entries appear once in the all-spaces list and in each selected child's space. Whole family remains a separate selection, mutually exclusive with individual children.

Subjects can be edited on existing entries without changing text, members, attachments or dates. This change does not add general diary editing, AI tagging or reports.

Validation: production build passed; 23 unit tests passed. Browser checks used the real form component with fictional in-memory data to exercise multi-child selection/removal, multiple subjects, a saved chosen date and entry display. No production family records were created or changed. Authenticated production persistence and emulator tests were not exercised. Vite still reports a large main bundle.

No changes to Firebase security rules, billing or Auth settings are part of this release.
