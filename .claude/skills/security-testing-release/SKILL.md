---
name: security-testing-release
description: >
  Use during pull requests, CI/CD, penetration testing, go-live and major changes.
---

# Security Testing and Release Readiness

> Independent, organisation-neutral engineering guidance. This is not legal advice, a certification, or an official corporate policy.

## Verification pipeline
- Every change: lint/type checks, unit/integration tests, dependency and secret scanning, relevant security tests and code review.
- Pre-release: SAST, DAST where appropriate, infrastructure/container scans, API authorization tests, threat-model review and privacy checks.
- For significant public exposure or material changes, commission appropriately scoped independent penetration testing and track remediation.
- Define severity-based release gates: unresolved critical vulnerabilities block release; high findings require documented risk-owner exception and compensating controls if release proceeds.
- Validate backup restoration, rollback, alerting, incident contacts, access revocation and vulnerability disclosure process.
- Record evidence, version, scope, test results, residual risks, approvals and next review date.
## Output
- Produce a pass/fail release checklist with owners, evidence links, blockers and explicit open decisions; never claim a scan ran unless results are provided.

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
