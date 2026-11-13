---
name: application-security
description: >
  Use for public websites, mobile apps, multi-tenant services, APIs and third-party integrations.
---

# External User and API Security

> Independent, organisation-neutral engineering guidance. This is not legal advice, a certification, or an official corporate policy.

## Public-facing attack surface
- Create an abuse-case map for anonymous, registered, privileged and malicious users.
- Enforce object-level and function-level authorization on server/API, including tenant isolation and role changes.
- Add rate limiting, quotas, bot/abuse defenses and safe error responses; avoid leaking account existence.
- Defend against OWASP Top 10 and API Top 10 risks, especially injection, XSS, CSRF, SSRF, broken access control, insecure uploads and misconfiguration.
- Validate webhook signatures, replay windows, API token scope, OAuth/OIDC state and redirect URIs.
- Use safe defaults for CORS, CSP, cookie settings, mobile storage and third-party SDK permissions.
- Document accessibility, fraud/abuse reporting and user safety issues where relevant.
## Test cases
- Try cross-account and cross-tenant ID swapping, role downgrade, expired tokens, mass assignment, pagination leaks, upload bypasses and resource exhaustion.

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
