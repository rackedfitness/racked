---
name: ai-policy
description: >
  Use when AI models, agents, AI APIs, prompts, AI-generated content or AI-processed user data are involved.
---

# Responsible AI and AI Data Governance

> Independent, organisation-neutral engineering guidance. This is not legal advice, a certification, or an official corporate policy.

## AI integration requirements
- Inventory model providers, data flows, purposes, user-facing disclosures, and whether prompts or outputs contain personal or confidential data.
- Confirm lawful basis, processor terms, retention, international transfer arrangements, and provider training/data-use settings before sending personal data to a model.
- Minimize and redact inputs, restrict retrieval by user permissions, and avoid storing sensitive prompts or outputs unnecessarily.
- Treat model output and retrieved content as untrusted: guard against prompt injection, tool misuse, data exfiltration and unsafe automated actions.
- Require human review for consequential decisions; assess fairness, accuracy, hallucination, explainability and appeal/escalation needs.
- Test adversarial prompts, cross-user data leakage, content safety, and model/provider changes before release.
- Identify whether UK/EU AI-specific legal obligations apply to the actual use case; do not assume every AI feature is high-risk.
- Document model/version, evaluation results, fallback, incident response and ability to disable an AI feature.

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
