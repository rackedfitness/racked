---
name: location-privacy-traveller-safety
description: Use when implementing geolocation, nearby gyms, hotel stays, maps, travel itineraries, location sharing, notifications, or analytics involving place or time.
---

# Location Privacy and Traveller Safety

## Mandatory safeguards
- Default to manual city/hotel search; request device location only in context, with clear purpose and OS permission handling.
- Prefer on-device proximity calculation or coarse/ephemeral coordinates; do not persist raw GPS or precise travel histories unless necessary and explicitly justified.
- Never reveal hotel room, precise stay location, live GPS, or itineraries publicly. Strip location metadata from uploaded media.
- Location sharing is off by default, limited to selected recipients and a short expiry, revocable immediately; show prominent active-sharing status and a kill switch. Avoid background tracking in MVP.
- Prevent triangulation via repeated queries, distance precision, presence indicators, notifications, maps, APIs and exports.
- Apply rate limits and abuse detection; ensure blocked users cannot infer location via search, mutuals, old links or push notifications.
- Specify data flows, lawful basis, retention and permissions; perform DPIA screening for tracking or systematic profiling.
## Verification
Test denied/revoked permission, expired shares, blocked accounts, stale cached coordinates, API access by strangers and account deletion.

## Boundaries
This skill is guidance, not a certification or substitute for jurisdiction-specific legal, security or clinical review.
