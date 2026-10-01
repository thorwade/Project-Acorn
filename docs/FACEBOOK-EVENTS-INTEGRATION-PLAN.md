# Acorn: Facebook events and nearby discovery

Both features remain requirements. No Facebook sync, partner approval, external registration, billing change, or live location collection has been implemented.

## Verified feasibility gate

On 18 September 2026, Meta's current Event API reference (Graph API v26.0) was inspected directly in the browser. It limits access to Events on Users and Pages to Facebook Marketing Partners.

Source: https://developers.facebook.com/docs/graph-api/reference/event/

This is not confirmation that partners can read the personalised recommended Events feed. Permission to read an event and access to that feed are separate questions.

## Work towards official access

1. Ask Meta whether Acorn is eligible for partner event access and whether the requested personalised recommended feed is exposed at all. Do not assume ordinary Facebook Login permissions or app review are enough.
2. If eligible, register the developer app under the owner's account and follow the applicable partner onboarding/review process. The owner must complete authentication, account verification and accept terms themselves.
3. Before requesting parent permissions, obtain a supported endpoint, permission requirements, allowed uses and retention limits from Meta.
4. Prove import against a consenting test account: upcoming events, pagination, removed/cancelled events, time zones, duplicates and revoked consent. A connection is not complete until actual permitted event data imports.
5. Store tokens only in a secure backend, never committed source, URLs or browser-local storage. Keep Facebook linking separate from the existing Google family identity; do not silently switch accounts.
6. Add consent, disconnect, deletion, privacy policy and user-visible import status before real-parent trials.

## Nearby discovery

- Request location only after a user taps Use my location; do not collect continuously or persist precise coordinates by default.
- Offer a manual town/postcode fallback when permission is declined or unavailable.
- Search an authorised event source with event coordinates and a selected radius. Location permission alone cannot provide Facebook event data.
- Keep demo events clearly fictional; existing illustrative distances must never be presented as device-derived distances.
- Verify distance boundaries, unknown locations, location failures, empty results and age/cost/date filters together.

## Acceptance criteria

- Facebook import uses officially approved access and imports actual permitted events, not fabricated results or scraping of logged-in pages.
- Nearby discovery uses consented location or an explicit manual location and an authorised catalogue.
- Denied permissions do not break other app features.
- No paid services are enabled without explicit approval.
- If Meta does not expose the feed or declines eligibility, report the feature as externally blocked and obtain the owner's decision before substituting another source or export workflow.
