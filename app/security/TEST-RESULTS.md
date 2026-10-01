# Circles prototype verification

## Latest result: merged rules deployed and verified

On 18 September 2026 the authenticated checker retrieved the active default Firestore rules. Its owner-only `users/{userId}/tasks/{taskId}` permissions were preserved in the Circles candidate. The merged suite passed 19 tests (0 failed/skipped), including owner CRUD/list compatibility for child, diary, gallery, preferences and task records and outsider/signed-out denial of family CRUD/list access.

Firebase deployment dry-run compiled successfully. Rules-only deployment succeeded, and a read-back of the active `cloud.firestore` release exactly matched the tested candidate. The released ruleset is `f220f819-c858-42a9-be48-556d331a0de7`. The original release was `97012aaf-d6f0-48e8-9eae-68258b8d6a60`; its source is preserved in `firestore.pre-circles.rules`. Final merged source is `firestore.rules`.

No family documents, Storage rules, app hosting or billing were changed. Circles client integration is still unbuilt/unverified. Existing private-family schema validation was not tightened: original owner-only permissions were deliberately preserved. These remain prototype rules, not an exhaustive security guarantee.

The initial isolated-result description below is historical; its warning about deploying the Circles-only candidate no longer describes the merged file.

Verified 18 September 2026 using Firebase CLI 15.30.1, Firestore emulator 1.22.0 (Standard edition), Java 21 and `@firebase/rules-unit-testing` 5.0.0.

Result: 17 tests passed, 0 failed, 0 skipped. Test script exited successfully. Rules compiled and loaded in the real local emulator.

Tests cover authenticated bounded discovery, owner binding and immutable metadata, private event reads, owner-issued invitations, atomic acceptance, expired and consumed invite rejection, forged membership and role escalation, removal and self-leaving, authenticated authorship, owner cancellation, immutable author fields, create/update validation, deletion permissions, orphan membership and denial of access to private family records.

The test project was `demo-acorn-circles`, listening only on localhost port 8088. Fixtures are fictional. No production reads, writes or deployment occurred.

## Remaining release gates

- Retrieve and confirm the active production rules, merge the Circles candidate while preserving existing private-family ownership access, and test that merged ruleset.
- Implement and test the client queries and invitation workflow against that merged ruleset.
- Review discoverable metadata: authenticated users can see circle name/about/theme, but event content is member-only.
- Confirm the deployed rules version before real cross-user sharing.

`circles.candidate.rules` is isolated and intentionally denies private-family paths; never deploy it over the existing rules by itself. This suite does not prove owner access to private-family records remains functional in a merged production ruleset.
