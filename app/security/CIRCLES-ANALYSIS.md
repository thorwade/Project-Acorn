# Circles security prototype — not deployed

Database: existing Acorn Standard edition, default database, eur3 (console verified).

Source scan: React/JavaScript. All existing Firestore records use users/{uid}/tasks, queried by createdAt descending. The kind field distinguishes tasks, children, diary, gallery and preferences. Diary attachments point into the owner's Storage diary folder; gallery files use the owner's gallery folder. Google authentication uses onAuthStateChanged and the Firebase UID. No current Circles collections, UI or queries exist. Earlier claims that diary/children needed separate collection permissions were incorrect.

The candidate below is an isolated Circles ruleset for emulator testing ONLY. It intentionally denies existing private records; it must not replace live rules. Before deployment, retrieve the confirmed active rules and merge only the Circles scopes, preserving the existing family collection behaviour. Do not attach this candidate to the app's main firebase.json or enable sharing until tested.

## Proposed new model

- circles/{id}: name (1–80), about (0–500), theme (woodland/sky/sunset), ownerUid (1–128, immutable), createdAt (immutable server timestamp). Metadata is discoverable only to signed-in users; no emails, child data or private family records. No client deletion of a circle, to prevent orphaned access; archive/deletion needs a later controlled lifecycle.
- circles/{id}/members/{uid}: uid (same as path), joinedAt (server timestamp). Owner is implicitly a member. Members cannot update roles: there is no client-controlled role field. Owners remove members; members can leave.
- circles/{id}/invites/{uid}: inviteeUid, createdAt, expiresAt (within seven days), usedAt (null until acceptance). Only owners invite. Only owner or invitee reads it. Acceptance atomically creates the membership and consumes the invitation. Existing consumed invitations cannot be replayed; re-invitation requires owner action.
- circles/{id}/events/{id}: circleId, authorUid, authorName (verified against auth name on creation), title (1–120), body (0–4000), venue (1–200), startsAt, endsAt (maximum seven-day duration), costPence (0–100000), minAge/maxAge (0–18), parentStays (boolean), kind (organising/attending), status (scheduled/cancelled), createdAt. IDs, author identity and creation time are immutable. Members read/post; current member authors edit their events; owners may only cancel another author's event. Authors/owners can delete. Removed members cannot read, post or edit.

Queries: circle directory uses limit(50); members and events are queried inside a single circle, with event orderBy(startsAt), limit(50). No global event collection-group query. Discovery metadata is separate from event content. Member event feed can merge bounded queries across joined circles.

Assumptions: adult accounts only for this first version; events shared with circle members only; no automatic sharing of child profiles or precise family location; invitations addressed to a known UID, not public email lookup. Full UI, invitation delivery and account-linking are separate work. No cloud services or billing settings changed.

## Required adversarial tests

Unauthenticated listing; outsider CRUD; owner/author spoofing; consumed/expired/absent invitation; non-atomic acceptance; extra role fields; member escalation; ownership/creation time changes; huge text; invalid field types; missing fields; negative cost; inconsistent ages; invalid dates; removed-member access; nonexistent parent; circle owner cancellation restrictions; directory limits; scoped event queries; attempts to read private family data. Test rules against the emulator, not a JavaScript imitation. Pending tests must not be described as passed.
> Latest verification (18 September 2026): active default database rules were retrieved through the authenticated Firebase checker; existing private-family ownership permissions were preserved in the merged candidate. All 19 merged emulator tests and the Firebase deployment dry-run passed. Rules-only deployment succeeded, and the active release content exactly matched the tested file. The final source is `firestore.rules`; original rules are in `firestore.pre-circles.rules`. Circles client integration is still pending. Earlier isolation/deployment warnings below describe the initial Circles-only draft, not the current merged rules.
