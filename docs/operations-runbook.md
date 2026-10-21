# CINKR edge-router operations runbook

## Scope

`cinkr-edge-router` is the public routing layer for these hostnames:

- `cinkr.com`
- `www.cinkr.com`
- `hmi.cinkr.com`
- `hqd.cinkr.com`
- `richauto.cinkr.com`
- `www.richauto.cinkr.com`
- `mpg.cinkr.com`
- `staging.cinkr.com`

The canonical public URLs are `/`, `/kinco/`, `/hqd/`, `/richauto/`, and
`/mpg/` on `cinkr.com`. `s.cinkr.com` belongs to Shopify and must not be changed
as part of this repository.

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

## Add a product subsection

1. Build the product site under a unique Astro `base`, for example `/newline`.
2. Set the product `site` to `https://cinkr.com`.
3. Emit assets, internal links, canonical URLs, JSON-LD, Open Graph URLs,
   `robots.txt`, and sitemaps below that base path.
4. Add the Pages origin to both production and staging in
   `manifests/origin-policy.json`.
5. Add the product route in `src/routes.ts`.
6. Add any retired-host mappings to `manifests/legacy-redirects.json`.
7. Add the hostname and route in Cloudflare, then deploy the Worker.
8. Add the product root to `scripts/crawl-acceptance.mjs`.
9. Verify unknown product paths return 404, never the site homepage.

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

## RichAuto legacy `www` hostname

`www.richauto.cinkr.com/*` is routed to the Worker. The Worker aliases the
hostname to the RichAuto legacy manifest before resolving an exact path.
Known paths go directly to `https://cinkr.com/richauto/...`; unknown paths fetch
the RichAuto product 404 page.

The old zone-level redirect rule and account-level bulk redirect for this
hostname are intentionally disabled. Re-enabling either would bypass the Worker
and reintroduce a two-hop redirect.

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
```

The check covers:

- canonical products and sitemap pages;
- CSS, JavaScript, images, fonts, and PDFs;
- `/hmi/` and retired product-domain redirects;
- `www.richauto.cinkr.com`;
- unknown-path 404 responses;
- production `noindex` leakage;
- canonical URLs;
- core security headers.

During the observation window, also verify the five submitted sitemap URLs in
Search Console. A sitemap submission is not evidence of indexing; record the
processing status separately.

## Rollback

Use `docs/cutover-baseline.md` as the source of truth.

1. Remove the production Worker routes.
2. Restore the recorded pre-cutover Pages deployment for each affected project.
3. Confirm the original Pages custom-domain mappings and DNS values.
4. Verify `/`, old product-domain roots, representative model pages, assets, and
   the expected redirects.
5. Keep the failed deployment and Worker version available for diagnosis.

Never delete the 301 manifest while the observation window or the one-year
legacy-URL commitment is active.
