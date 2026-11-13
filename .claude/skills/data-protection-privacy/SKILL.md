---
name: data-protection-privacy
description: >
  Use whenever a website or app collects, observes, stores, shares or deletes data about identifiable people.
---

# Data Protection and Privacy by Design

> Independent, organisation-neutral engineering guidance. This is not legal advice, a certification, or an official corporate policy.

## Privacy requirements
- Map personal data fields, collection points, purposes, recipients, processors, countries, retention periods and lawful bases.
- Determine applicable regimes (e.g. UK GDPR, EU GDPR, DPA 2018, PECR) based on establishment, users, and activities; do not assume location alone decides scope.
- Apply purpose limitation, minimisation, privacy-protective defaults, least privilege and encryption appropriate to risk.
- Provide clear privacy information at collection, including rights, retention, sharing and contact routes.
- Implement verified requests for access, correction, deletion, portability, objection and restriction where applicable; track statutory deadlines and exemptions.
- Distinguish consent from other lawful bases; make withdrawal as easy as giving consent where consent is relied on.
- Block non-essential cookies and similar trackers until valid consent where required; allow granular choices and withdrawal.
- Assess DPIA triggers for likely high-risk processing and escalate before deployment; assess children's data and age-appropriate design where relevant.
- Review processor contracts, subprocessor lists, international transfer safeguards, breach handling and reporting deadlines with counsel/DPO.
- Verify retention/deletion across primary stores, search indexes, logs, analytics, backups and vendors, acknowledging justified backup exceptions.
## Acceptance tests
- Inspect browser network requests before consent, test rights workflows and identity checks, confirm privacy notice matches actual telemetry and SDKs.

## Operating rules
- Apply risk-based controls and document decisions. Do not claim legal compliance or certification based solely on this skill.
- Distinguish mandatory legal obligations from recommended engineering controls. Identify jurisdiction and data types before making legal claims.
- For every relevant change, produce: risks, implementation steps, verification tests, and unresolved decisions.
- Never put real credentials, personal information, or confidential production data into examples or test fixtures.
- Stop and seek specialist review for high-risk processing, unresolved critical vulnerabilities, or unclear legal bases.

## Reference standards (verify current editions)
- NIST SP 800-63B for authentication; OWASP ASVS, Top 10, API Security Top 10, Cheat Sheet Series; NIST SSDF SP 800-218; ISO/IEC 27001 and 27701; UK GDPR / EU GDPR where applicable; UK ICO guidance and PECR where applicable.
- Standards and regulatory guidance evolve. Check current official sources before treating a specific requirement as authoritative.


## Travel and hotel-gym application integration
For features involving precise location, hotel stays, traveller connections, workout/health records or AI recommendations, also apply the relevant location-privacy-traveller-safety, identity-social-community-safety, fitness-health-data-protection, ai-fitness-travel-assistant-safety and privacy-by-design-product-review skills. Do not mark a feature launch-ready until privacy and security acceptance criteria are tested.
