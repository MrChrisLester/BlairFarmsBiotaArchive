# Blair Farms Biota Archive

A record of Southeastern native plant dye work: wool dyed with locally sourced plants, how those colors hold up over time, and a growing set of short research case studies on individual plants.

The site is a small, static, single-page archive. It has no accounts, no database and no build step, and all of its content comes from one data file.

## What it records

- **Dye tests on fabric.** Each plant is dyed on wool using the same mordant (10% alum, 5% cream of tartar), then tested for lightfastness, waterfastness and washfastness. A color reading is taken at the start and again each week for four weeks.
- **Color change over time.** Readings are stored as hex colors and converted to CIELAB, so the amount each color has shifted can be measured as a color difference (ΔE) rather than judged by eye.
- **Case studies.** Individual plants get a longer write-up covering the botanical profile, habitat, dye results and follow-up experiments.

## The tabs

**Wool Library**
A searchable grid of every plant. Each card shows the starting color of the dyed wool and a strip of its final colors. Opening a card shows every test and its full series of readings.

**Color Wheel**
Every measured color plotted by hue and saturation. A ring around the wheel shows which of twelve hue families the archive has reached so far, so gaps are easy to spot. Very pale and near-black colors can be hidden.

**Fastness**
A line chart of how far each plant's color drifted over the four weeks, and a ranking of plants by their average drift from start to final. The ranking can be filtered by test type.

**Concentrates**
Reserved for reductions and lake pigments. It is a placeholder until those results exist.

**Solution Analysis**
The case studies: one micro research project per plant.

**Methods**
How the color difference is calculated, with a worked example you can change, and the caveats that apply to the readings.

## About the data

- Color difference is CIE76 ΔE, measured from each test's first reading.
- Hex values are treated as sRGB under D65 light. They come from a colorimeter with a high margin of error.
- These are comparative observations, not formal fastness ratings. They are not ISO 105 or Blue Wool scores.
- The current wool data covers 18 plants, taken from the original study's Fig. 3 readings.
- The Broomsedge case study is a draft. Its wool dye results exist, but the lake pigment method it describes is a proposal and has not been run yet.

## Look and feel

The header uses a watercolor rainbow banner, and a matching rainbow line runs under the tabs. The site follows the visitor's light or dark setting and works on phones as well as desktops.

# Security

This site is built to keep its attack surface small and its trust boundaries easy to see. That is a design goal, not a guarantee.

## How the site works

- It is static: HTML, CSS, JavaScript, JSON and images served by GitHub Pages.
- There is no server code, database, login, form, upload, cookie or browser storage.
- There are no third-party scripts, fonts or CDNs. The only request the page makes is for its own `data.json`.

## How content is updated

1. The admin opens `data.json` in a in house tool, a single HTML file run locally from disk. It makes no network requests.
2. The editor checks for basic mistakes such as invalid hex colors and duplicate IDs, accepts proper edits, then saves back to the exact file the admin chose.
3. The admin reviews the diff and commits it to GitHub by hand.

There is no API, token or stored credential connecting the editor to the live site.

## Trust boundaries

- **Trusted:** the `main` branch, the admin's GitHub account and the admin's computer.
- **Treated as trusted for now:** the contents of `data.json`, because only the admin can change it. If outside contributions are ever accepted, it will be treated as untrusted input.

## Threats and mitigations

| Threat | Mitigation | Residual risk |
|---|---|---|
| Visitor changes site content | No write path exists from the site | None through the site itself |
| GitHub account takeover | See repository hardening below | Remains the main risk |
| Malicious or mistaken change to `data.json` | Manual review of every diff; validation (planned in CI) | Depends on review quality |
| Compromised admin computer | Local-only tool, no stored credentials | Out of scope for this repo |
| Supply chain | No dependencies to compromise | Platform-level compromise of GitHub is accepted risk |
| Custom domain hijack (if used) | Verify the domain in GitHub, keep DNS records current, HTTPS on | Registrar account security |

## Repository hardening

- [ ] Passkey or 2FA on the GitHub account
- [ ] Branch protection on `main`
- [ ] Secret scanning and private vulnerability reporting enabled
- [ ] GitHub Actions permissions set to read-only by default
- [ ] Verified domain, if a custom domain is added

## Known limitations and planned work

- Data values are inserted into the page with template strings. Most text is HTML-escaped; this will be made consistent, and data will be validated on load and in CI.
- Inline event handlers will be replaced with event delegation so a Content-Security-Policy can be added. GitHub Pages can't send custom headers, so this will use a meta tag, which covers fewer directives than a header.

## Reporting a vulnerability

Please use this repository's private vulnerability reporting (Security tab → Report a vulnerability) rather than a public issue.
