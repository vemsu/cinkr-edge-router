# CINKR subdirectory cutover baseline

Captured: 2026-10-21 16:28:26 +08:00

This file is the rollback record for the production cutover. Update the deployment
and Worker IDs after the migration is accepted; do not remove the pre-cutover
values.

## Cloudflare scope

- Account ID: `a8d4af671034afd0a869e0ef6b69d311`
- Zone ID: `b383cf29a0b750dc7791183d790ae584`
- Zone: `cinkr.com`
- Shopify hostname `s.cinkr.com` is outside this migration.

## Pre-cutover Pages production deployments

| Project | Production deployment | Current deployment URL |
| --- | --- | --- |
| `cinkr-home` | `051e492d-9a93-4f3b-a129-5557297e7bca` | `https://051e492d.cinkr-home.pages.dev` |
| `cinkr-hmi` | `a8591650-83a0-4bf0-a699-b022e22a1bcd` | `https://a8591650.cinkr-hmi.pages.dev` |
| `cinkr-hqd` | `1fc9bbb1-6437-440c-a707-e69192c9889c` | `https://1fc9bbb1.cinkr-hqd.pages.dev` |
| `cinkr-richauto` | `b350c18f-214f-4496-a1bd-f7a73edd4758` | `https://b350c18f.cinkr-richauto.pages.dev` |
| `cinkr-mpg` | `cffe1962-39a0-4cdd-a157-c70121d620a9` | `https://cffe1962.cinkr-mpg.pages.dev` |

## Pages custom domains

| Project | Custom domains |
| --- | --- |
| `cinkr-home` | `cinkr.com`, `www.cinkr.com` |
| `cinkr-hmi` | `hmi.cinkr.com` |
| `cinkr-hqd` | `hqd.cinkr.com` |
| `cinkr-richauto` | `richauto.cinkr.com`, `www.richauto.cinkr.com` |
| `cinkr-mpg` | `mpg.cinkr.com` |

## DNS records

| Type | Name | Content | Proxied |
| --- | --- | --- | --- |
| CNAME | `cinkr.com` | `cinkr-home.pages.dev` | yes |
| CNAME | `www.cinkr.com` | `cinkr-home.pages.dev` | yes |
| CNAME | `hmi.cinkr.com` | `cinkr-hmi.pages.dev` | yes |
| CNAME | `hqd.cinkr.com` | `cinkr-hqd.pages.dev` | yes |
| CNAME | `richauto.cinkr.com` | `cinkr-richauto.pages.dev` | yes |
| CNAME | `mpg.cinkr.com` | `cinkr-mpg.pages.dev` | yes |
| A | `www.richauto.cinkr.com` | `192.0.2.1` | yes |
| AAAA | `staging.cinkr.com` | `100::` | yes |

## Workers before cutover

- No production `cinkr-edge-router` script existed.
- Existing staging script: `cinkr-edge-router-staging`.
- Existing staging route: `staging.cinkr.com/*`.
- Latest verified staging version before the package/Worker hardening:
  `b56cba67-8e06-42fc-815a-542abc2fb1c4`.
- The staging Worker must retain Cloudflare Access, `X-Robots-Tag: noindex`,
  and `Cache-Control: no-store`.

## Immutable migration preview aliases

These aliases were used to validate the subdirectory builds before production:

- `https://migration-subdirectory-20261.cinkr-home.pages.dev`
- `https://migration-subdirectory-20261.cinkr-hmi.pages.dev`
- `https://migration-subdirectory-20261.cinkr-hqd.pages.dev`
- `https://migration-subdirectory-20261.cinkr-richauto.pages.dev`
- `https://migration-subdirectory-20261.cinkr-mpg.pages.dev`

## Rollback sequence

1. Remove the production routes for `cinkr.com`, `www.cinkr.com`,
   `hmi.cinkr.com`, `hqd.cinkr.com`, `richauto.cinkr.com`, and
   `mpg.cinkr.com` from `cinkr-edge-router`.
2. Restore each Pages production deployment listed above if its project was
   replaced after the baseline.
3. Confirm the original custom-domain mappings and the DNS values in this file.
4. Verify HTTP 200 on `/`, each old product-domain root, representative model
   pages, CSS, JavaScript, and images.
5. Keep the new Pages deployments and Worker available but unrouted for
   diagnosis; they are not part of the public rollback path.

The 301 redirect manifest must remain deployed for at least one year after the
production cutover.

## Post-cutover production record

Captured after cutover on 2026-10-21:

| Project | Migration production deployment |
| --- | --- |
| `cinkr-home` | `af076d37-ea00-4748-b71e-2ea7d269f9ac` |
| `cinkr-hmi` | `77ef1b4e-358c-48b8-b274-0447f1285bd9` |
| `cinkr-hqd` | `e4bb6fb2-4a03-44e5-a45d-c5e6ac008002` |
| `cinkr-richauto` | `d3b13826-5ecb-4fa3-890a-90352359c630` |
| `cinkr-mpg` | `0bd8bf63-6b0b-4a85-8d73-ec665ad3be61` |

- Production Worker: `cinkr-edge-router`
- Production Worker version: `d062696f-eff6-4231-9e70-6dcb66504325`
- Staging Worker version: `5c8bc296-e929-428c-afbf-cccd1c0dc4cb`

### Main-branch automatic rollout

Captured after the six migration branches were fast-forwarded to `main` and the
RichAuto Cloudflare build compatibility fix was deployed:

| Project | Main commit | Production deployment |
| --- | --- | --- |
| `cinkr-home` | `3377328` | `d05524c1-ff21-4f0f-8f7e-94a3fd8373cc` |
| `cinkr-hmi` | `8c32cf8` | `2a3a575c-3677-4dd6-be60-d8f8caafb246` |
| `cinkr-hqd` | `e34a45a` | `2f70d00b-8dc2-437c-bb69-52216afbcf04` |
| `cinkr-richauto` | `2db4a54` | `556cac43-7925-4ecf-822a-0e4d984fa51d` |
| `cinkr-mpg` | `d619368` | `de5b0c7a-8926-44a7-837d-4c1c74723853` |

- Production Worker after the RichAuto `www` route fix:
  `0df4e1c0-3d3b-409b-a49a-5ee943a54427`
- RichAuto's first automatic build failed because its build helper imported a
  `.ts` module under Node 22.12. The helper now imports `site.config.mjs`; the
  exact Cloudflare Node version rebuild passed.

### Production routes

| Pattern | Route ID |
| --- | --- |
| `cinkr.com/*` | `7effcd0da67e4b8a8facbfad72f3b70b` |
| `www.cinkr.com/*` | `9dcaa462d18d4e07aaa396c3924599e9` |
| `hmi.cinkr.com/*` | `8da5aa36db1f479da09e51c4a3b8f6c7` |
| `hqd.cinkr.com/*` | `bc6997a55a334aebaaa4cdd482048f35` |
| `richauto.cinkr.com/*` | `62bbbf1c74e34c23b3a3f37a35a1ef4c` |
| `www.richauto.cinkr.com/*` | Managed in the Cloudflare dashboard |
| `mpg.cinkr.com/*` | `bb92f34fa4514e61829dbed7b770da2f` |

The Pages custom domains intentionally remain attached during the observation
period. Worker routes take precedence and preserve the recorded rollback path.

The legacy zone-level redirect rule and account-level bulk redirect that
previously sent `www.richauto.cinkr.com` to `richauto.cinkr.com` are disabled.
Requests now enter the Worker route and redirect directly to the canonical
`https://cinkr.com/richauto/...` URL in one hop.
