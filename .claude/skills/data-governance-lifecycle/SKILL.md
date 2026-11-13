---
name: data-governance-lifecycle
description: >
  Use for database design, analytics, logs, backups, exports, integrations, retention and deletion.
---

# Data Governance and Lifecycle

> Independent, organisation-neutral engineering guidance. This is not legal advice, a certification, or an official corporate policy.

## Data lifecycle controls
- Maintain data inventory and classification, schema-level purpose tags, access owners and retention schedules.
- Separate production, development and testing data; use synthetic or properly de-identified data for tests.
- Minimize collection and analytics; restrict telemetry and prevent secrets/personal data in logs.
- Encrypt data in transit and at rest where appropriate, manage keys securely and verify access controls regularly.
- Design user deletion, archival and retention expiry as testable workflows across systems and subprocessors.
- Review vendor due diligence, processor agreements, international transfers and exit/deletion provisions.
- Define backup retention, restoration testing, disaster recovery and deletion propagation constraints.
- Audit data access, exports, administrative changes and exceptions with proportionate log retention.

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
