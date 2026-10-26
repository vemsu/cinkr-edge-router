# HQD subdomain restoration cutover record

Status: candidate accepted; production cutover not started.

## Cloudflare scope

- Account ID: `a8d4af671034afd0a869e0ef6b69d311`
- Zone ID: `b383cf29a0b750dc7791183d790ae584`
- Zone: `cinkr.com`

## Git baseline

| Repository | Baseline branch | Baseline commit | Candidate branch |
| --- | --- | --- | --- |
| `04-Cinkr HQD` | `cinkr-hqd/main` | `bffd936` | `restore/hqd-subdomain-20261026` |
| `01-Cinkr home` | `origin/main` | `df01022` | `restore/hqd-subdomain-20261026` |
| `cinkr-edge-router` | `origin/main` | `67767f4` | `restore/hqd-subdomain-20261026` |

| Repository | Candidate commit |
| --- | --- |
| `04-Cinkr HQD` | `9c286a8` |
| `01-Cinkr home` | `e0205ba` |
| `cinkr-edge-router` | `03b5473` before this acceptance record |

The existing uncommitted change to
`docs/kinco-subdomain-cutover-20261026.md` in the primary router checkout was
left untouched by using an isolated worktree from `origin/main`.

## Cloudflare rollout baseline

| Resource | Baseline |
| --- | --- |
| `cinkr-hqd` production deployment | `d3aa02f9-167e-4c13-b7ed-53a28b21974f` |
| `cinkr-home` production deployment | `82de07dd-65fa-4aa5-b9ca-be49af30d3a2` |
| `cinkr-edge-router` production version | `89fa1c72-8df5-485c-91f9-74d0a48bf197` |
| `hqd.cinkr.com/*` Worker Route | `bc6997a55a334aebaaa4cdd482048f35` |
| `hqd.cinkr.com` Pages Custom Domain | active; Google Trust Services certificate |
| `www.hqd.cinkr.com` Pages Custom Domain | absent at baseline |

Current Worker routes:

| Pattern | Script | Route ID |
| --- | --- | --- |
| `cinkr.com/*` | `cinkr-edge-router` | `7effcd0da67e4b8a8facbfad72f3b70b` |
| `www.cinkr.com/*` | `cinkr-edge-router` | `9dcaa462d18d4e07aaa396c3924599e9` |
| `hmi.cinkr.com/*` | `cinkr-edge-router` | `8da5aa36db1f479da09e51c4a3b8f6c7` |
| `hqd.cinkr.com/*` | `cinkr-edge-router` | `bc6997a55a334aebaaa4cdd482048f35` |
| `mpg.cinkr.com/*` | `cinkr-edge-router` | `bb92f34fa4514e61829dbed7b770da2f` |
| `staging.cinkr.com/*` | `cinkr-edge-router-staging` | `45273b1ebead4163b787ccdfe3972d17` |

The existing general `www.cinkr.com` canonical redirect rule is recorded in
project documentation as
`2f52ac15f60c42f789f41ea1e3deb15f`. Its live expression and the HQD-specific
redirect/DNS baseline still require Dashboard verification because the current
Wrangler OAuth token can read Pages and Worker Routes but not DNS Records or
Redirect Rulesets.

## HTTP baseline

Captured 2026-10-26 before the candidate changes:

| URL | Status | Location |
| --- | --- | --- |
| `https://hqd.cinkr.com/` | `301` | `https://cinkr.com/hqd/` |
| `https://hqd.cinkr.com/gdz-23/` | `301` | `https://cinkr.com/hqd/gdz-23/` |
| `https://cinkr.com/hqd/` | `200` | none |
| `https://cinkr.com/hqd/gdz-23/` | `200` | none |
| `https://www.cinkr.com/hqd/` | `301` | `https://cinkr.com/hqd/` |
| `https://www.hqd.cinkr.com/` | no application response | none |

## Candidate acceptance

Local quality gates:

- HQD `npm run check`: passed; 64 indexable pages, 64 sitemap URLs, 43
  product images, 1,290 fact/schema/asset/download checks, 812 HMI-alignment
  checks, and 140 optimization checks.
- Cinkr Home `npm run check`: passed; 8 tests and 2 indexable pages.
- Router `npm run check`: passed; manifest valid with 503 exact redirects and
  43 unit tests.

HQD Pages Preview:

- Deployment: `bff3dc96-8b85-471f-a707-a4b8a1695626`
- URL: `https://bff3dc96.cinkr-hqd.pages.dev`
- Source: `9c286a8`
- Acceptance: 64 pages, 133 assets, and 1 not-found contract passed.

Cinkr Home Preview:

- Git-triggered deployment `3b445b2c-7b09-4649-965f-f5fa09cd9876`
  remained queued, so the exact clean `dist` from commit `e0205ba` was
  uploaded as a preview deployment.
- Deployment: `8f9c7aa5-4f27-4cf6-a32a-c6e484374ad0`
- URL: `https://8f9c7aa5.cinkr-home.pages.dev`
- Alias: `https://restore-hqd-subdomain-202610.cinkr-home.pages.dev`
- Result: homepage and robots returned `200`; the HQD card links directly to
  `https://hqd.cinkr.com/`; the root robots lists the new HQD sitemap and omits
  the retired `/hqd` sitemap; Kinco, RichAuto, and MPG links remain present.

Staging Worker:

- Version: `9da452ab-eda6-46fd-a4b3-44515b7ad983`
- `/hqd`, `/hqd/`, and `/hqd/gdz-23/` returned one-hop `301` responses with
  query preservation.
- Staging responses include `X-Robots-Tag: noindex, nofollow` and
  `Cache-Control: no-store`.
- `/hqd-other/` returned `404`.
- General staging acceptance passed: 8 pages, 29 assets, 11 redirects, 2
  not-found checks, and 1 security-header check.

Visual acceptance:

- Chrome/Ego Browser checked HQD home, GDZ-23, a guide, and the branded 404 at
  `1440 x 1000` and `390 x 844`.
- Cinkr Home was checked at both viewport widths.
- No horizontal overflow, clipped navigation, missing logo, or overlapping
  content was observed.
- Screenshots:
  `C:/Users/M1/ego/hqd-cloudflare-20261026/screens/`.

## Production cutover

Pending.

## Rollback

Preserve `d3aa02f9-167e-4c13-b7ed-53a28b21974f`,
`82de07dd-65fa-4aa5-b9ca-be49af30d3a2`,
`89fa1c72-8df5-485c-91f9-74d0a48bf197`, and all Cloudflare baseline records
for at least 30 days after acceptance.

