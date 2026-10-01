# Circles first version

Firebase-backed circle creation, three illustrated cover themes, bounded signed-in discovery, personal invitations using account UID codes, atomic acceptance, membership listing/removal, self-leaving, member-only event posting and detail views, owner/author event cancellation, and merged upcoming member-circle feeds on Home and Events.

The original fictional catalogue remains behind an explicitly labelled demo option. This is a responsive web app, not a native Android/iOS release. No automated email invitations, user email lookup, Facebook importing, circle deletion, event editing, maps or payments are implemented.

## Data and queries

- `circles`: `limit(50)` authenticated discovery. Name/about/theme are discoverable; explain this before creation. Do not put sensitive details in metadata.
- `users/{uid}/tasks/circle-index`: owner-only account-specific circle IDs, updated by `arrayUnion`/`arrayRemove`. Up to 50 stored IDs are read by the client; this index is a convenience, never authorization.
- `circles/{cid}`: metadata get/listen for stored IDs and explicit circle codes.
- `circles/{cid}/invites/{uid}`: recipient/owner-only invitation, six-day expiry. Owner explicitly replaces a previous invite; no email or push notification is sent.
- `circles/{cid}/members/{uid}`: member check; accepting uses an atomic batch with invitation consumption. Removal is enforced by deployed rules. Rejoining reinstalls listeners.
- `circles/{cid}/members`: membership listing for members; owner can remove a member. Membership records expose UIDs, not emails or private profiles.
- `circles/{cid}/events`: `where(startsAt, >=, Timestamp.now())`, `orderBy(startsAt)`, `limit(50)`, per tracked circle. Results merged and sorted client-side. No global collection-group query. Cancellation filters events from the upcoming feed.

Private child/diary/gallery/task data never becomes circle content. Auth changes remount the Circles component and clean up subscriptions. Revoked access clears event data and any open event details. Client shape/range checks supplement, not replace, Firestore enforcement.

## Invitation walkthrough

1. Invitee signs in, opens Circles, expands “Your invitation code & privacy” and copies their account code.
2. Owner opens their circle, expands membership management, and creates an invitation using that code.
3. Owner shares the circle code directly with the invitee. The local preview URL is not a remotely reachable invitation link.
4. Invitee opens that circle code, accepts the invitation and sees its member events.

Before a wider launch, test with two actual adult accounts, confirm invitation identity carefully, review billing alerts and Firestore read usage, and harden existing family document schema validation separately.

## Verification

12 app unit tests passed; production build passed (existing large bundle warning remains). The expanded deployed-rules suite passed 20 emulator tests, including the exact upcoming-event query, account-separated circle indexing and fresh invitation after removal. Signed-out Circles navigation and Galaxy S26-style viewport rendering were inspected in the browser. Actual two-account signed-in browser sharing remains pending. No real circles, invitations or events were created during automated testing, and the updated app has not been published.
