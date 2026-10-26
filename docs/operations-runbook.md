# CINKR edge-router operations runbook

## Scope

`cinkr-edge-router` is the public routing layer for these hostnames:

- `cinkr.com`
- `www.cinkr.com`
- `hmi.cinkr.com`
- `staging.cinkr.com`

The canonical public URL for the main site is `/` on `cinkr.com`.
Kinco is published directly by Cloudflare Pages at
`https://kinco.cinkr.com/`; RichAuto is published directly at
`https://richauto.cinkr.com/`; HQD is published directly at
`https://hqd.cinkr.com/`; MPG is published directly at
`https://mpg.cinkr.com/`. These product sites do not pass through this Worker.
`s.cinkr.com` belongs to Shopify and must not be changed as part of this
repository.

## Normal deployment

1. Run `npm run check` in this repository.
2. Confirm the target product repository passes its own `npm run check`.
3. Merge the reviewed change to each repository's `main` branch.
4. Let Cloudflare Pages build the changed project from `main`.
5. Confirm the new Pages deployment reaches `success` before relying on it.
6. Run `npm run acceptance:production`.
7. For Worker source changes, run `npx wrangler deploy`, then rerun production
   acceptance.

Do not manually upload a Pages artifact from an uncommitted working tree.

## Add a product site

1. Publish the product through its own Cloudflare Pages project and product
   hostname.
2. Bind the apex and `www` product hostnames to that Pages project.
3. Add a product-specific `www` Single Redirect to the apex hostname.
4. Add an explicit one-hop redirect for any retired main-site prefix in
   `src/worker.ts`.
5. Add product-specific production acceptance that crawls its sitemap, pages,
   assets, canonical URLs, 404 response, and routing.
6. Do not add product hosts to `origin-policy.json` or reintroduce a proxy route.
7. Verify unknown product paths return that product's 404, never the main
   homepage.

## Change a slug

1. Publish the new canonical URL.
2. Add an exact 301 from the old absolute URL to the new canonical URL.
3. Update internal links, canonical tags, hreflang, JSON-LD, sitemaps, and
   external pages under the operator's control.
4. Run `npm run manifest:generate` only when rebuilding from complete build
   artifacts; otherwise make the smallest explicit manifest edit.
5. Run `npm run check` and `npm run acceptance:production`.

The redirect manifest is the source of truth. Do not implement durable SEO
redirects as ad hoc string replacement in the Worker.

## Kinco restoration

`kinco.cinkr.com` and `www.kinco.cinkr.com` are Cloudflare Pages Custom
Domains on the `cinkr-hmi` project and have no Worker Route.

The Worker returns a one-hop permanent redirect from `/kinco` and `/kinco/*`
on `cinkr.com`, `www.cinkr.com`, and `staging.cinkr.com` to the same path on
`https://kinco.cinkr.com`, preserving the query string. The retired `/hmi`
subdirectory does the same.

Known `hmi.cinkr.com` paths use exact one-hop mappings to their final Kinco
pages. Unknown paths on the retired host redirect to the same path on
`kinco.cinkr.com` and then return that host's normal 404.

Cloudflare Single Redirect returns a one-hop permanent redirect from
`www.kinco.cinkr.com/*` to `kinco.cinkr.com`.

Keep these redirects in place for at least one year. Do not reintroduce Kinco
into `origin-policy.json` or product routing.

## RichAuto restoration

`richauto.cinkr.com` and `www.richauto.cinkr.com` are Cloudflare Pages Custom
Domains on the `cinkr-richauto` project and have no Worker Route.

The Worker returns a one-hop permanent redirect from `/richauto` and
`/richauto/*` on `cinkr.com`, `www.cinkr.com`, and `staging.cinkr.com` to the
same path on `https://richauto.cinkr.com`, preserving the query string.

Cloudflare Single Redirect returns a one-hop permanent redirect from
`www.richauto.cinkr.com/*` to the same path on the apex RichAuto hostname,
preserving the query string.

Keep both redirects in place for at least one year. Do not reintroduce RichAuto
into `origin-policy.json`, product routing, or the exact-redirect manifest.

## HQD restoration

`hqd.cinkr.com` and `www.hqd.cinkr.com` are Cloudflare Pages Custom Domains
on the `cinkr-hqd` project and have no Worker Route.

The Worker returns a one-hop permanent redirect from `/hqd` and `/hqd/*` on
`cinkr.com`, `www.cinkr.com`, and `staging.cinkr.com` to the same path on
`https://hqd.cinkr.com`, preserving the query string.

Cloudflare Single Redirect returns a one-hop permanent redirect from
`www.hqd.cinkr.com/*` to the same path on the apex HQD hostname, preserving
the query string.

Keep both redirects in place for at least one year. Do not reintroduce HQD
into `origin-policy.json`, product routing, or the exact-redirect manifest.

## MPG restoration

`mpg.cinkr.com` and `www.mpg.cinkr.com` are Cloudflare Pages Custom Domains
on the `cinkr-mpg` project and have no Worker Route.

The Worker returns a one-hop permanent redirect from `/mpg` and `/mpg/*` on
`cinkr.com`, `www.cinkr.com`, and `staging.cinkr.com` to the same path on
`https://mpg.cinkr.com`, preserving the query string.

Cloudflare Single Redirect returns a one-hop permanent redirect from
`www.mpg.cinkr.com/*` to the same path on the apex MPG hostname, preserving
the query string.

Keep both redirects in place for at least one year. Do not reintroduce MPG
into `origin-policy.json`, product routing, or the exact-redirect manifest.

## Staging invariants

Keep all of the following enabled:

- Cloudflare Access on `staging.cinkr.com`.
- `X-Robots-Tag: noindex, nofollow`.
- `Cache-Control: no-store`.
- No public sitemap or search-engine discovery of the staging host.

Production must never inherit the staging `noindex` or `no-store` headers.

## Monitoring

Run:

```powershell
npm run acceptance:production
npm run acceptance:kinco:production
npm run acceptance:richauto:production
npm run acceptance:hqd:production
npm run acceptance:mpg:production
```

The check covers:

- canonical products and sitemap pages;
- CSS, JavaScript, images, fonts, and PDFs;
- `/kinco`, `/hmi`, `hmi.cinkr.com`, `www.kinco.cinkr.com`, and remaining
  retired product-domain redirects;
- `/richauto` and `www.richauto.cinkr.com` permanent redirects;
- `/hqd` and `www.hqd.cinkr.com` permanent redirects;
- `/mpg` and `www.mpg.cinkr.com` permanent redirects;
- unknown-path 404 responses;
- production `noindex` leakage;
- canonical URLs;
- core security headers.

During the observation window, also verify the five submitted sitemap URLs in
Search Console. A sitemap submission is not evidence of indexing; record the
processing status separately.

## Rollback

Use `docs/kinco-subdomain-cutover-20261026.md` for the Kinco restoration,
`docs/richauto-subdomain-cutover-20261026.md` for the RichAuto restoration,
`docs/hqd-subdomain-cutover-20261026.md` for the HQD restoration,
`docs/mpg-subdomain-cutover-20261026.md` for the MPG restoration, and
`docs/cutover-baseline.md` for the earlier subdirectory migration.

1. Remove the production Worker routes.
2. Restore the recorded pre-cutover Pages deployment for each affected project.
3. Confirm the original Pages custom-domain mappings and DNS values.
4. Verify `/`, old product-domain roots, representative model pages, assets, and
   the expected redirects.
5. Keep the failed deployment and Worker version available for diagnosis.

Never delete the 301 manifest while the observation window or the one-year
legacy-URL commitment is active.
