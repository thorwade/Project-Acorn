# Project Acorn backup and recovery plan

## Status

Prepared on 16 September 2026. Cloud backups are **not enabled or verified** by this document. Verify billing, database identity, existing schedules and permissions before applying the proposal below. Do not upgrade billing or change access automatically.

## Proposed protection

- Firestore: one daily scheduled backup retained for 7 days, plus one weekly Sunday backup retained for 4 weeks. Preserve existing schedules until reviewed. These managed backups require Blaze billing and incur storage and restore charges.
- Firebase Storage: gallery photographs and diary attachments need separate protection. Review current soft-delete retention and object versioning, then agree a retention policy and cost limit before changing them. Database backups do not contain these file objects.
- Source: keep the local Git baseline and create another private off-device source copy excluding dependencies, build output, credentials and private family data. Do not publish source to an external repository without approval.
- Configuration: retain a reviewed copy of Firebase rules, indexes and deployment configuration. Backups are not a replacement for security rules.

## Verification checklist

1. Confirm the Firebase project, database ID, edition, region, billing plan and existing backup schedules.
2. Confirm the desired retention and any additional charges with the owner.
3. Enable only the agreed missing schedules; record their actual identifiers and retention in a private operations record.
4. After the first scheduled run, verify a completed backup exists. A saved schedule alone is not proof of a usable backup.
5. Verify file recovery protection on the Storage bucket separately.
6. Review backup health weekly and retention/cost monthly.

## Restore drill

Quarterly, restore a database backup into a separate, restricted test database, never over the live family hub. Compare document counts, record kinds and a small sample of child, task, diary, gallery and preference records. Verify attachment references against separately protected Storage objects. Restrict restored personal data to authorized administrators. Review test-database costs and securely remove the test copy only with explicit approval.

For an incident, stop harmful writes first, identify the last clean backup, restore to a separate database, validate records and file references, and obtain owner approval before switching the app to restored data. Retain the original database for investigation until its removal is explicitly approved.

## Official references

- https://firebase.google.com/docs/firestore/backups
- https://firebase.google.com/docs/firestore/disaster-recovery
- https://cloud.google.com/storage/docs/soft-delete
- https://cloud.google.com/storage/docs/object-versioning
