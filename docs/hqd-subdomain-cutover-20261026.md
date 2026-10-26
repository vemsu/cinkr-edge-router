# HQD subdomain restoration cutover record

Status: complete; production cutover, redirects, acceptance, search-platform
actions, and temporary preview cleanup completed on 2026-10-26.

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
| `cinkr-edge-router` | `26114dc` before this completion record |

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

Final architecture:

- `https://hqd.cinkr.com/` is the canonical HQD site, served directly by the
  `cinkr-hqd` Cloudflare Pages project.
- `www.hqd.cinkr.com` is a `cinkr-hqd` Pages Custom Domain and permanently
  redirects to the apex HQD host.
- `cinkr-edge-router` returns one-hop `301` responses from the retired
  `cinkr.com/hqd`, `cinkr.com/hqd/*`, `www.cinkr.com/hqd`, and
  `www.cinkr.com/hqd/*` URLs to the same path on `https://hqd.cinkr.com`,
  preserving the query string.
- HQD is no longer a product origin in the Worker's origin policy, and the
  historical `hqd.cinkr.com/*` Worker Route is no longer present.

Git and deployment:

| Repository | Pre-cutover `main` | Final `main` |
| --- | --- | --- |
| `04-Cinkr HQD` | `bffd936` | `9c286a8` |
| `01-Cinkr home` | `df01022` | `e0205ba` |
| `cinkr-edge-router` | `67767f4` | `26114dc` |

| Project/Worker | Rollback deployment/version | Production after cutover |
| --- | --- | --- |
| `cinkr-hqd` | `d3aa02f9-167e-4c13-b7ed-53a28b21974f` | `e428c32b-7d21-44dc-baa2-d689d20c8e49` |
| `cinkr-home` | `82de07dd-65fa-4aa5-b9ca-be49af30d3a2` | `8495c712-98e5-4ced-b6e2-b6d5f95a427e` |
| `cinkr-edge-router` | `89fa1c72-8df5-485c-91f9-74d0a48bf197` | `bd2832e9-aea6-4e87-8ead-f6c73048b65a` |

The historical `hqd.cinkr.com/*` Route
`bc6997a55a334aebaaa4cdd482048f35` was deleted. Production Worker Routes are
now limited to:

- `cinkr.com/*`
- `www.cinkr.com/*`
- `mpg.cinkr.com/*` (MPG)
- `hmi.cinkr.com/*`
- `staging.cinkr.com/*` (staging Worker)

DNS and certificates:

- `hqd.cinkr.com` and `www.hqd.cinkr.com` are active `cinkr-hqd` Pages Custom
  Domains with SSL enabled.
- `www.hqd.cinkr.com` uses the automatically created proxied CNAME to
  `cinkr-hqd.pages.dev`.

Redirect rules:

- The general `www.cinkr.com` canonical redirect rule keeps ID
  `2f52ac15f60c42f789f41ea1e3deb15f`. Its expression now excludes `/hqd` and
  `/hqd/*` so those requests can reach the Worker directly.
- The HQD `www` Single Redirect is enabled:
  - Rule ID: `c92360fc148946dd8a6b7dd4597ffe08`
  - Expression: `http.host eq "www.hqd.cinkr.com"`
  - Target: `concat("https://hqd.cinkr.com", http.request.uri.path)`
  - Status: `301`
  - Preserve query string: enabled

Cloudflare cache was purged for `hqd.cinkr.com`, `www.hqd.cinkr.com`,
`cinkr.com/hqd`, and `www.cinkr.com/hqd` before final production acceptance.

## Production acceptance

HQD production acceptance passed:

- 64 pages
- 133 assets
- 6 redirect contracts
- 1 branded not-found contract

General production regression passed:

- Cinkr Home: 8 pages, 29 assets, 16 redirects, 3 not-found checks
- Kinco: 83 pages, 47 assets, 9 redirects, 1 not-found check
- RichAuto: 48 pages, 50 assets, 6 redirects, 1 not-found check

Redirect edge cases passed:

- `/hqd`, `/hqd/`, product links, guide links, and static paths redirect in one
  hop to the same HQD path.
- `www.cinkr.com/hqd/*` redirects in one hop to `hqd.cinkr.com`.
- `www.hqd.cinkr.com/*` redirects in one hop to `hqd.cinkr.com`.
- Query strings are preserved.
- `/hqd-other/` is not matched by the HQD prefix and remains a normal `404`.
- No redirect loop exists between `www.hqd`, `hqd`, and the retired `/hqd`
  paths.

Desktop `1440 x 1000` and mobile `390 x 844` visual checks passed with no
horizontal overflow or missing resources. Production screenshots are retained
at:

- `C:/Users/M1/ego/hqd-cloudflare-20261026/production-screens`

## Search platform submission

Google Search Console, domain property `sc-domain:cinkr.com`:

- `https://hqd.cinkr.com/sitemap-index.xml` was submitted successfully and
  discovered 64 pages.
- The new HQD homepage, a product page, and a guide were live-tested
  successfully.
- The homepage is indexed, and Google selected its self-referencing canonical.
- `https://hqd.cinkr.com/gdz-23/` was discovered from the new sitemap. Its
  indexing request was submitted on 2026-10-26.
- GSC live tests for the retired `/hqd` URL follow to an available, indexable
  page and do not surface a distinct redirect state. The actual one-hop `301`
  behavior is verified independently by production headers and acceptance.
- The old `https://cinkr.com/hqd/sitemap-index.xml` remains submitted and
  successful with 64 discovered pages. It must be retained for at least twelve
  months.

Bing Webmaster Tools:

- `https://hqd.cinkr.com/` was imported from Search Console; no other site was
  imported or modified.
- `https://hqd.cinkr.com/sitemap-index.xml` was submitted successfully and
  crawled. Bing reports 64 discovered URLs and zero sitemap errors or warnings.
- A live URL test reports that the homepage is crawlable, extraction succeeds,
  and the URL can be indexed.
- Bing indexing was requested for the homepage. The Bing index report still
  shows that the page has been discovered but is not yet indexed; this is a
  monitoring item, not a production failure.

## Monitoring

The `cinkr-hqd-7` heartbeat runs daily for seven days with
`failed_runs_only` notification policy. It checks HQD pages, assets,
canonical/OG/JSON-LD, robots, sitemaps, retired-path redirects, query
preservation, loops, 404 behavior, Cinkr Home, Kinco, RichAuto, MPG, GSC, and
Bing. It notifies only when an anomaly or meaningful state change requires
attention.

## Cleanup

The following temporary Preview deployments were deleted and their immutable
URLs now return `404`:

- `cinkr-hqd`: `bff3dc96-8b85-471f-a707-a4b8a1695626`
- `cinkr-home`: `8f9c7aa5-4f27-4cf6-a32a-c6e484374ad0`
- `cinkr-home`: `3b445b2c-7b09-4649-965f-f5fa09cd9876`

The candidate branches and isolated worktrees are removed after the final
documentation merge. The Router worktree `node_modules` junction is removed
without deleting the source directory it points to.

## Rollback

Preserve the production and rollback deployments/version named above for at
least 30 days. In particular, preserve `d3aa02f9-167e-4c13-b7ed-53a28b21974f`,
`82de07dd-65fa-4aa5-b9ca-be49af30d3a2`,
`89fa1c72-8df5-485c-91f9-74d0a48bf197`, the deleted historical Route ID,
Custom Domain records, DNS records, and Redirect Rule baseline evidence.

To roll back, redeploy the named baseline Pages deployments, restore the
historical Worker version and `hqd.cinkr.com/*` Route, remove the HQD-specific
`www` redirect rule, restore the prior general `www` expression, purge cache,
and rerun the production acceptance suites.

