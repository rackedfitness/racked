---
name: secure-dev
description: >
  Use for application design, code, APIs, infrastructure, dependencies, deployments and security reviews.
---

# Secure Software Development

> Independent, organisation-neutral engineering guidance. This is not legal advice, a certification, or an official corporate policy.

## Secure delivery lifecycle
1. Classify data and trust boundaries; document a lightweight STRIDE threat model and abuse cases before implementation.
2. Define security acceptance criteria, owner, and verification evidence for each risky feature.
3. Enforce server-side authorization on every resource and operation; default deny and test cross-tenant and horizontal privilege escalation.
4. Validate and normalize untrusted inputs; use parameterized database queries, context-aware output encoding and safe file-upload processing.
5. Protect APIs against broken object-level authorization, excessive data exposure, injection, SSRF, mass assignment, and resource exhaustion.
6. Configure TLS, secure headers, restrictive CORS, secret management, network isolation, encryption and backups proportionate to risk.
7. Scan dependencies, secrets, containers and infrastructure as code; maintain dependency inventory/SBOM and patch critical issues.
8. Use protected branches, peer review, CI security gates, isolated environments, least-privilege CI tokens and auditable deployments.
9. Log security events without credentials or unnecessary personal data; monitor, alert, and rehearse incident response and recovery.
10. Verify against OWASP ASVS controls selected by application risk; record exceptions with owner and expiry.
## External-user safeguards
- Apply per-user/per-tenant authorization, abuse prevention, account deletion and export workflows, accessible error handling, and secure defaults.
- Never treat client-side validation or hidden UI elements as authorization.

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
