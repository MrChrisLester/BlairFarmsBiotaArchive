# Security

This site is built to keep its attack surface small and its trust boundaries easy to see. That is a design goal, not a guarantee.

## How the site works

- It is static: HTML, CSS, JavaScript, JSON and images served by GitHub Pages.
- There is no server code, database, login, form, upload, cookie or browser storage.
- There are no third-party scripts, fonts or CDNs. The only request the page makes is for its own `data.json`.

## How content is updated

1. The admin opens `data.json` in a custom-built editor, a single HTML file run locally from disk. It makes no network requests.
2. The editor checks for basic mistakes such as invalid hex colors and duplicate IDs, then saves back to the file the admin chose.
3. The admin reviews the diff and commits it to GitHub by hand.

There is no API, token or stored credential connecting the editor to the live site.

## Controls in this repository

- **Validation on load.** `app.js` drops any plant, test or study whose ID, hex colors or image file name do not match strict patterns, and logs what it dropped.
- **Validation in CI.** `scripts/validate-data.js` runs on every push and pull request (`.github/workflows/validate.yml`). It checks IDs, hex colors, dates, texture range, study references, image files and the shape of every study block, and fails the build on anything unexpected. The workflow has read-only permissions.
- **No inline script.** The page has no inline event handlers or inline scripts; interaction is wired through event delegation on `data-` attributes.
- **Content-Security-Policy.** A meta tag restricts the page to its own scripts, styles, images and data file, and sets `base-uri` and `form-action` to none.
- **Escaping.** Text from `data.json` is HTML-escaped before it is inserted into the page.
- **Dependabot** watches the GitHub Actions used by the workflow.

## Trust boundaries

- **Trusted:** the `main` branch, the admin's GitHub account and the admin's computer.
- **Treated as trusted for now:** the contents of `data.json`, because only the admin can change it. The controls above exist so that a mistaken or malicious change is caught before it ships, and so that outside contributions could be accepted later.

## Threats and mitigations

| Threat | Mitigation | Residual risk |
|---|---|---|
| Visitor changes site content | No write path exists from the site | None through the site itself |
| GitHub account takeover | See repository hardening below | Remains the main risk |
| Malicious or mistaken change to `data.json` | Manual diff review, CI validation, validation on load, escaping, CSP | Depends on review quality |
| Compromised admin computer | Local-only tool, no stored credentials | Out of scope for this repo |
| Supply chain | No runtime dependencies; first-party Actions only, watched by Dependabot | Platform-level compromise of GitHub is accepted risk |
| Custom domain hijack (if used) | Verify the domain in GitHub, keep DNS records current, HTTPS on | Registrar account security |

## Known limitations

- The CSP is delivered in a meta tag because GitHub Pages cannot send custom response headers. A meta tag cannot set `frame-ancestors`, so the page can still be framed by other sites.
- The CSP allows inline `style` attributes (`style-src-attr 'unsafe-inline'`), because swatch colors are set per element. Those values are validated as six-digit hex colors on load and in CI.
- Pinning the workflow's actions to commit SHAs is planned.

## Repository hardening checklist

- [ ] Passkey or 2FA on the GitHub account
- [ ] Ruleset on `main` requiring a pull request and the "Validate data" check, with no bypass
- [ ] Secret scanning and push protection enabled
- [ ] Private vulnerability reporting enabled
- [ ] Actions workflow permissions set to read-only by default
- [ ] Verified domain, if a custom domain is added

## Reporting a vulnerability

Please use this repository's private vulnerability reporting (Security tab → Report a vulnerability) rather than a public issue.
