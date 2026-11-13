---
name: password-security
description: >
  Use when implementing or reviewing sign-up, login, passwords, passkeys, MFA, sessions, account recovery, secrets, service accounts or API keys.
---

# Password and Authentication Security

> Independent, organisation-neutral engineering guidance. This is not legal advice, a certification, or an official corporate policy.

## Authentication baseline
- Prefer standards-based identity providers and phishing-resistant authentication (passkeys/WebAuthn) where feasible.
- For user-chosen passwords, support at least 15 characters for single-factor passwords and at least 8 when used as part of MFA, subject to current NIST guidance; allow long passphrases (at least 64 characters), spaces, Unicode, and password managers/paste.
- Do not mandate arbitrary character-class complexity, periodic password rotation without evidence of compromise, or security questions.
- Screen passwords against common/compromised password blocklists; rate-limit login, registration, reset and MFA attempts.
- Hash passwords using Argon2id with reviewed parameters and unique salts (or another modern vetted adaptive password hashing method); never encrypt passwords for later recovery or store them in plaintext.
- MFA required for administrators and high-risk actions; provide secure recovery and anti-enumeration protections.
- Use short-lived, scoped sessions, Secure/HttpOnly/SameSite cookies, CSRF defenses where relevant, and rotate session identifiers after privilege changes.
- Use managed secrets storage, rotation on exposure, and least-privilege service identities; no secrets in source, logs, URLs or client bundles.
## Review checklist
- Test account enumeration, credential stuffing defenses, reset token expiry and single-use, MFA bypass, session fixation, logout invalidation, and privilege escalation.
- Explain tradeoffs for legacy authentication and migrations; do not silently break existing accounts.

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
