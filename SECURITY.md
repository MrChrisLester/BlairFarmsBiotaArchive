# Security

This site is built to keep its attack surface small and its trust boundaries easy to see. That is a design goal, not a guarantee.

## How the site works

- It is static: HTML, CSS, JavaScript, JSON and images served by GitHub Pages.
- There is no server code, database, login, form, upload, cookie or browser storage.
- There are no third-party scripts, fonts or CDNs. The only request the page makes is for its own `data.json`.
- All content in this repository and on the site is public by design.

## How content is updated

1. The admin opens `data.json` in a custom-built editor, a single HTML file run locally from disk.
2. The editor checks for basic mistakes such as invalid hex colors and duplicate IDs.
3. To publish, the admin creates a short-lived GitHub token and pastes it into the editor. The editor then talks to the GitHub API (`api.github.com`) to read and write the repository. This is the only network traffic the editor makes, and it makes none until a token is provided.
4. The admin reviews the diff on GitHub.

The editor is a convenience, not a security boundary. Anyone holding a valid write token could use the GitHub API, `git` or `curl` directly. The real protections are the token's scope and lifetime (see below), the GitHub account's own security, and the controls on the repository.

### Token handling

- The token is a fine-grained personal access token limited to this one repository, with only Contents read/write permission and a short expiry.
- A new token is created each time the admin starts an editing session. GitHub tokens do not reset on their own; the short expiry and the fresh token per session are what limit exposure.
- The editor holds the token in memory only. Nothing is written to disk or browser storage, and closing the editor discards it.
- Without a valid token the editor cannot read from or write to the repository.

## Controls in this repository

- **Validation on load.** `app.js` drops any plant, test or study whose ID, hex colors or image file name do not match strict patterns, and logs what it dropped.
- **Validation in CI.** `scripts/validate-data.js` runs on every push and pull request (`.github/workflows/validate.yml`). It checks IDs, hex colors, dates, texture range, study references, image files and the shape of every study block, and fails the build on anything unexpected. The workflow has read-only permissions. Because it runs on push, a failure means a bad change is detected after it lands on `main`, not prevented from landing (see Known limitations).
- **No inline script.** The page has no inline event handlers or inline scripts; interaction is wired through event delegation on `data-` attributes.
- **Content-Security-Policy.** A meta tag restricts the page to its own scripts, styles, images and data file, and sets `base-uri` and `form-action` to none.
- **Escaping.** Text from `data.json` is HTML-escaped before it is inserted into the page.
- **Dependabot** watches the GitHub Actions used by the workflow.

## Trust boundaries

- **Trusted:** the `main` branch, the admin's GitHub account and the admin's computer.
- **Treated as trusted for now:** the contents of `data.json`, because only the admin can change it. The controls above exist so that a mistaken or malicious change is caught, and so that outside contributions could be accepted later.

## Threats and mitigations

| Threat | Mitigation | Residual risk |
|---|---|---|
| Visitor changes site content | No write path exists from the site | None through the site itself |
| GitHub account takeover | Passkey and 2FA; see repository measures below | Remains the main risk |
| Leaked or stolen write token | Fine-grained, single-repo, Contents-only, short expiry, held in memory only | Token is usable by anyone until it expires or is revoked |
| Malicious or mistaken change to `data.json` | Manual diff review, CI validation, validation on load, escaping, CSP | Depends on review quality; CI detects but does not block unless branch protection is enabled |
| Compromised admin computer | Token is short-lived and never stored | Out of scope for this repo, but note the token is pasted into a local tool, so a compromised machine could capture it during a session |
| Supply chain | No runtime dependencies; first-party Actions only, watched by Dependabot | Platform-level compromise of GitHub is accepted risk |
| Custom domain hijack (if used) | Verify the domain in GitHub, keep DNS records current, HTTPS on | Registrar account security |

## Known limitations

- The CSP is delivered in a meta tag because GitHub Pages cannot send custom response headers. A meta tag cannot set `frame-ancestors`, so the page can still be framed by other sites.
- The CSP allows inline `style` attributes (`style-src-attr 'unsafe-inline'`), because swatch colors are set per element. Those values are validated as six-digit hex colors on load and in CI.
- CI validation runs after a push. If Pages deploys directly from `main`, a failing check does not stop the deploy. Branch protection with a required check, or deploying Pages through an Actions workflow that depends on validation, would close this gap.
- Pinning the workflow's actions to commit SHAs is planned.
- The repository is public, so all data in it is public by design. Moving to a private repository with a public page requires a paid plan.

## Repository measures

- [X] Passkey and 2FA on the GitHub account
- [X] Short-lived, fine-grained, single-repository token created per editing session and kept in memory only
- [X] Secret scanning and push protection enabled
- [X] Private vulnerability reporting enabled
- [X] Branch protection on `main` (require pull requests and the validation check, block force pushes)
- [ ] Private repo with public page (requires paid plan)

## Reporting a vulnerability

Please use this repository's private vulnerability reporting (Security tab → Report a vulnerability) rather than a public issue. Reports are acknowledged within 7 days, and fixes are prioritized by severity.
