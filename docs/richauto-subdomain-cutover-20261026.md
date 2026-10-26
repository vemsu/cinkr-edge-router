# RichAuto subdomain restoration cutover record

Status: candidate implementation in progress; production not changed.

## Cloudflare scope

- Account ID: `a8d4af671034afd0a869e0ef6b69d311`
- Zone ID: `b383cf29a0b750dc7791183d790ae584`
- Zone: `cinkr.com`

## Git baseline

| Repository | `origin/main` baseline | Candidate |
| --- | --- | --- |
| `02-Cinkr RichAuto` | `6663387` | `restore/richauto-subdomain-20261026` |
| `01-Cinkr home` | `e3823b2` | `restore/richauto-subdomain-20261026` |
| `cinkr-edge-router` | `124ae4d` | `restore/richauto-subdomain-20261026` |

## Pages baseline

| Project | Production deployment | Notes |
| --- | --- | --- |
| `cinkr-richauto` | `0dff682d-b49a-4a17-a016-835c09ff18ae` | Current production; commit `6663387`; keep `556cac43-7925-4ecf-822a-0e4d984fa51d` as a historical rollback point |
| `cinkr-home` | `6066b153-fd76-43d6-a931-81d6bdbbcee9` | Current production; commit `e3823b2` |

`cinkr-richauto` Custom Domains:

- `richauto.cinkr.com`
- `www.richauto.cinkr.com` (currently deactivated but still attached; reactivate during cutover)

## Worker baseline

- Active production version: `0df4e1c0-3d3b-409b-a49a-5ee943a54427`.
- `richauto.cinkr.com/*` route ID: `62bbbf1c74e34c23b3a3f37a35a1ef4c`.
- `www.richauto.cinkr.com/*` route ID: `04586fc333d44ca9a184040f52c4b3bb`.
- Preserve the active Worker version ID for rollback before deploying the
  candidate.

## DNS and redirect rules

The `www` Single Redirect pre-existed on the `cinkr.com` zone:

- Rule ID: `6c2f82da101c4ae5aa7dd39ceee4cc4e`
- Name: `CINKR canonical www.richauto to RichAuto apex`
- Expression: `http.host eq "www.richauto.cinkr.com"`
- Target: `concat("https://richauto.cinkr.com", http.request.uri.path)`
- Status: `301`
- Preserve query string: enabled
- Enabled state before cutover: disabled

The target expression was corrected from an earlier value that appended the
query string explicitly. Query-string preservation remains enabled at the rule
level, so the query is appended exactly once.

## Production response baseline

Captured 2026-10-26 10:53 +08:00:

| URL | Status | Location |
| --- | --- | --- |
| `https://richauto.cinkr.com/` | `301` | `https://cinkr.com/richauto/` |
| `https://richauto.cinkr.com/a11/` | `301` | `https://cinkr.com/richauto/a11/` |
| `https://www.richauto.cinkr.com/` | `301` | `https://cinkr.com/richauto/` |
| `https://cinkr.com/richauto/` | `200` | none |
| `https://cinkr.com/richauto/a11/` | `200` | none |

## Candidate acceptance

RichAuto Git Preview:

- Deployment: `6ad3b526-b59c-45d7-922d-9e71eea40b08`
- URL: `https://6ad3b526.cinkr-richauto.pages.dev`
- Commit: `9c831e32ae3365fe6431f477a97532ea3798098c`
- Result: 48 pages, 50 assets, 1 not-found check passed.

Cinkr Home Preview:

- Deployment: `ec8a1493-dfc9-4e8e-8a2b-d5bd41d539c7`
- URL: `https://ec8a1493.cinkr-home.pages.dev`
- Commit: `c5a8fb59d084c4918af2e03fbb3311ae56ce1e36`
- Result: homepage 200, RichAuto subdomain link present, robots sitemap declarations correct.

Staging Worker:

- Version: `157fdfe6-0b95-40df-a297-45d671192cb9`
- `/richauto` and `/richauto/a11/` return one-hop 301 with query preservation.

## Production cutover

Pending.

## Search platform submission

Pending.

## Cleanup

Pending.
