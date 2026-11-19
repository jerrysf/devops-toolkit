# Kubernetes Troubleshooting Toolkit — Source Assets

This directory holds the source files for the paid product. The download
ZIP given to customers is built from these files (see `scripts/` for the
packaging script once the checkout provider is connected).

## Contents (Launch Edition v1.0)

| File | Format | Purpose |
|------|--------|---------|
| `runbooks/*.md` | Markdown | Structured troubleshooting runbooks |
| `checklists/*.md` | Markdown | Printable incident-response checklists |
| `examples/*.yaml` | YAML | Annotated, adaptable manifest patterns |
| `kubectl-reference.md` | Markdown | Annotated command reference (to be added) |
| `handbook.pdf` | PDF | Bundled printable handbook (built from the above) |

## Status

These are the working source documents. `runbooks/` and `checklists/`
contain the launch-edition content. The PDF handbook is generated at
release time — don't commit generated artifacts.

## Integrity rules

- Every command must be marked read-only / modifying / destructive.
- No credentials, real hostnames, or customer-identifying data.
- Generic example names only (`example-ns`, `web`, `registry.example.com`).
- Keep in sync with the published free guides — the runbooks expand on
  them, they must not contradict them.
