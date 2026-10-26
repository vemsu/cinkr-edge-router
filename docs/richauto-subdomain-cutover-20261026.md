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
| `cinkr-richauto` | `556cac43-7925-4ecf-822a-0e4d984fa51d` | Keep for rollback; do not restore `b350c18f-214f-4496-a1bd-f7a73edd4758` |
| `cinkr-home` | Pending authenticated capture | Record before production merge |

`cinkr-richauto` Custom Domains:

- `richauto.cinkr.com`
- `www.richauto.cinkr.com`

## Worker baseline

- Active production version: Pending authenticated capture.
- `richauto.cinkr.com/*` route ID: `62bbbf1c74e34c23b3a3f37a35a1ef4c`.
- `www.richauto.cinkr.com/*` route ID: Pending authenticated capture.
- Preserve the active Worker version ID for rollback before deploying the
  candidate.

## DNS and redirect rules

- `richauto.cinkr.com` DNS record: Pending authenticated capture.
- `www.richauto.cinkr.com` DNS record: Pending authenticated capture.
- Existing `www.richauto.cinkr.com` Single Redirect, Bulk Redirect, and Page Rule
  state: Pending authenticated capture.

The target `www` rule is:

- Expression: `http.host eq "www.richauto.cinkr.com"`
- Target: `concat("https://richauto.cinkr.com", http.request.uri.path)`
- Status: `301`
- Preserve query string: enabled

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

Pending.

## Production cutover

Pending.

## Search platform submission

Pending.

## Cleanup

Pending.
