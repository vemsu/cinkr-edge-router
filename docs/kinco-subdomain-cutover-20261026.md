# Kinco subdomain restoration cutover record

Status: complete; production cutover, redirects, acceptance, search-platform
actions, rollback assets, and cleanup completed on 2026-10-26.

## Cloudflare scope

- Account ID: `a8d4af671034afd0a869e0ef6b69d311`
- Zone ID: `b383cf29a0b750dc7791183d790ae584`
- Zone: `cinkr.com`

## Final architecture

- `https://kinco.cinkr.com/` is the canonical Kinco site, published directly by
  the `cinkr-hmi` Cloudflare Pages project.
- `www.kinco.cinkr.com` is a Cloudflare Pages Custom Domain and permanently
  redirects to the apex Kinco host.
- `cinkr-edge-router` returns one-hop `301` responses from the retired
  `cinkr.com/kinco*`, `cinkr.com/hmi*`, `www.cinkr.com/kinco*`,
  `www.cinkr.com/hmi*`, and `hmi.cinkr.com/*` URLs to the same path on
  `https://kinco.cinkr.com`, preserving the query string.
- Kinco is no longer a product origin in the Worker's origin policy.

Keep the legacy host and path redirects in place until at least
`2027-10-26`. Do not reintroduce Kinco into `origin-policy.json`.

## Git and deployment

| Repository | Pre-cutover `main` | Final `main` |
| --- | --- | --- |
| `03-Cinkr HMI` | `1041c61` | `e53241e` |
| `01-Cinkr home` | `c5a8fb5` | `df01022` |
| `cinkr-edge-router` | `5803963` | `b2ed2a8` |

The candidate and transition branches were deleted locally and remotely after
the final commits were merged and accepted.

| Project/Worker | Rollback deployment/version | Production after cutover |
| --- | --- | --- |
| `cinkr-hmi` | `e6d691f8-2c67-40a9-898a-c3a92c78ebd2` | `5cd16475-92ce-4719-963f-073610f84e0c` |
| `cinkr-home` | `a9bd8ca1-287b-4055-80a9-5b6e7cfaf5b5` | `82de07dd-65fa-4aa5-b9ca-be49af30d3a2` |
| `cinkr-edge-router` | `cd6bad69-b2af-415c-bd6b-fec5252ddff6` | `89fa1c72-8df5-485c-91f9-74d0a48bf197` |

The no-interruption transition Worker version
`b72f5496-19c0-443c-a0ce-690da952388c` remains available. The final staging
Worker version is `664da32a-315d-4e4a-96e0-f93d319552ce`.

## DNS and certificates

Both new Pages Custom Domains are active and verified:

- `kinco.cinkr.com`
  - Custom Domain ID: `2792eebb-d015-48ef-bcfe-44c073f9aecc`
  - Proxied CNAME target: `cinkr-hmi.pages.dev`
  - Status: `active`
- `www.kinco.cinkr.com`
  - Custom Domain ID: `14130f59-c008-487d-8dc5-84440551fff3`
  - Proxied CNAME target: `cinkr-hmi.pages.dev`
  - Status: `active`

Google Trust Services certificates are active for both hosts. The historical
`hmi.cinkr.com` Custom Domain remains active so its Worker Route can continue
serving permanent redirects.

## Routing and redirects

The production Worker routes remain:

- `cinkr.com/*`
- `www.cinkr.com/*`
- `hmi.cinkr.com/*`
- `hqd.cinkr.com/*`
- `mpg.cinkr.com/*`

All five route to `cinkr-edge-router`. The `staging.cinkr.com/*` route remains
attached to `cinkr-edge-router-staging`.

The existing general redirect rule `CINKR canonical www to apex` keeps ID
`2f52ac15f60c42f789f41ea1e3deb15f`. Its expression was extended to exclude
`/kinco`, `/kinco/*`, `/hmi`, and `/hmi/*`, in addition to the existing
RichAuto exclusions. This lets those paths reach the Worker directly instead
of taking a second redirect.

The new Kinco `www` Single Redirect is enabled:

- Rule ID: `167a1a941c9b4f7db2c56a08ca379490`
- Name: `CINKR canonical www.kinco to Kinco apex`
- Expression: `http.host eq "www.kinco.cinkr.com"`
- Target: `concat("https://kinco.cinkr.com", http.request.uri.path)`
- Target type: dynamic
- Status: `301`
- Preserve query string: enabled

## Candidate acceptance

Kinco page build:

- `npm run check` passed.
- 84 tests passed.
- 83 indexable pages were generated and audited.

Kinco Pages Preview `6ebfe0ad-6120-4d40-b592-afd8c91b2368` passed:

- 83 pages
- 47 assets
- 1 not-found contract

Cinkr Home Preview `a2e2fb50-d06b-4b26-a212-cd1d64f269df` passed:

- Homepage returned `200`.
- The HMI card linked directly to `https://kinco.cinkr.com/`.
- `robots.txt` declared the Kinco subdomain sitemap.
- The temporary `/hmi/` redirect still worked during the transition.

Router checks passed on `main`:

- 731 exact redirect-manifest entries valid.
- 6 test files and 69 tests passed.

Staging acceptance passed after the final Worker deployment:

- 73 pages
- 149 assets
- 9 redirect contracts
- 3 not-found contracts
- 2 security-header checks

## Production acceptance

Cloudflare cache was purged for the zone after the Worker and redirect rules
were active, then the production suites were rerun.

Kinco production acceptance passed:

- 83 pages
- 47 assets
- 9 redirect contracts
- 1 not-found contract

General Cinkr production acceptance passed:

- 73 pages
- 149 assets
- 16 redirect contracts
- 5 not-found contracts
- 2 security-header checks

RichAuto regression acceptance passed:

- 48 pages
- 50 assets
- 6 redirect contracts
- 1 not-found contract

The Kinco site was also checked in the production browser at `1440 x 1000`
and `390 x 844`:

- homepage
- GL070 product page
- selection guide
- 404 page

Navigation, logo, product imagery, headings, comparison content, CTAs, and the
mobile bottom navigation rendered without clipping or overlap.
Production screenshots are retained at:

- `C:/Users/M1/ego/kinco-cloudflare-20261026/screens-prod/home-desktop.png`
- `C:/Users/M1/ego/kinco-cloudflare-20261026/screens-prod/product-desktop.png`
- `C:/Users/M1/ego/kinco-cloudflare-20261026/screens-prod/guide-desktop.png`
- `C:/Users/M1/ego/kinco-cloudflare-20261026/screens-prod/notfound-desktop.png`
- `C:/Users/M1/ego/kinco-cloudflare-20261026/screens-prod/home-mobile.png`
- `C:/Users/M1/ego/kinco-cloudflare-20261026/screens-prod/product-mobile.png`

## Search platform submission

Google Search Console, domain property `sc-domain:cinkr.com`:

- `https://kinco.cinkr.com/sitemap-index.xml` was submitted successfully.
- A live test for `https://kinco.cinkr.com/` reported that the URL is available
  to Google and can be indexed; indexing was requested.
- A live test for `https://kinco.cinkr.com/gl070/` reported that the URL can be
  indexed; indexing was requested.
- Live tests for the retired `https://cinkr.com/kinco/` and
  `https://hmi.cinkr.com/` URLs reached an available, indexable final page.
  The actual one-hop `301` behavior is verified independently by production
  acceptance.

The two former sitemap submissions remain visible in GSC:

- `https://cinkr.com/kinco/sitemap-index.xml`: previously successful, 132
  discovered pages.
- `https://hmi.cinkr.com/sitemap-index.xml`: previously successful, 132
  discovered pages.

They were intentionally not removed during the one-year redirect period.

GSC's live Product-snippet check reports one existing rich-results issue on
`/gl070/`: `Product` markup lacks `offers`, `review`, or `aggregateRating`.
This is a pre-existing structured-data issue and does not prevent the page
from being indexed. It should be handled as a separate content/schema decision.

Bing Webmaster Tools was explicitly waived by the user for this cutover and
was not treated as an outstanding item.

## Cleanup

The following temporary Preview deployments were deleted and their immutable
URLs now return `404`:

- `cinkr-hmi`: `6ebfe0ad-6120-4d40-b592-afd8c91b2368`
- `cinkr-home`: `a2e2fb50-d06b-4b26-a212-cd1d64f269df`

The candidate branches were deleted locally and remotely. The temporary Router
worktree and `.codex-tmp` directory were removed.

The current production deployments, pre-cutover rollback deployments, final
Worker version, transition Worker version, historical baseline Worker version,
DNS records, certificates, Worker Routes, and all legacy `301` paths were
preserved.
