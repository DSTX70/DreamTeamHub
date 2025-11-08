# Security Policy

We take security seriously. Please follow these guidelines for reporting and handling vulnerabilities.

## Reporting a Vulnerability
- **Do not** open public issues. Email the security team or use your private channel.
- Include: affected endpoints, reproduction steps, logs/screenshots, and impact.
- We will acknowledge within **2 business days** and provide a remediation timeline.

## Supported Branches
We patch the active release branch and `main`. Older releases may receive best‑effort fixes.

## Handling Secrets
- Store all secrets (RBAC keys, Redis, DB, SMTP) in the approved secrets manager.
- **Never** commit secrets or print them in CI logs.
- Rotate keys on role changes or suspected leakage. Document rotations in the runbook.

## Coordinated Disclosure
Once patched and deployed, we’ll coordinate disclosure where appropriate.
