# Security Policy

## Supported version

Security fixes are applied to the current `main` branch and the production release built from it.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability, exposed credential, or privacy-sensitive finding.

Use GitHub's private vulnerability reporting feature when it is available for this repository. If private reporting is unavailable, contact the repository owner privately through the contact information on the GitHub profile.

Include enough detail to reproduce and assess the issue without including real credentials, personal data, or destructive proof-of-concept material.

## Repository security baseline

Maintained releases are expected to pass:

- dependency auditing with no known vulnerabilities accepted by the release gate;
- CodeQL analysis for supported source languages;
- type checks, automated tests, and production builds;
- checks that prevent production source maps from being published;
- Cloudflare output checks including Content Security Policy and HSTS headers;
- least-privilege GitHub Actions permissions;
- pinned third-party GitHub Actions revisions;
- secret-free source control and environment-specific credentials stored outside the repository.

A passing automated scan is evidence against known issues, not a guarantee that software is risk-free. New findings are treated as defects and remediated through the normal branch, pull-request, validation, and release process.
