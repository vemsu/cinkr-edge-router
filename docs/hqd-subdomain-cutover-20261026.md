# HQD subdomain restoration cutover record

Status: candidate; production cutover not started.

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

Pending.

## Production cutover

Pending.

## Rollback

Preserve `d3aa02f9-167e-4c13-b7ed-53a28b21974f`,
`82de07dd-65fa-4aa5-b9ca-be49af30d3a2`,
`89fa1c72-8df5-485c-91f9-74d0a48bf197`, and all Cloudflare baseline records
for at least 30 days after acceptance.

