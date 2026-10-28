# CINKR subdirectory production observation

Observation window: 2026-10-22 through 2026-10-28.

## 2026-10-21 baseline

- Production HTTP acceptance passed after the main-branch Pages rollout:
  255 pages, 242 assets, 16 redirect checks, 10 not-found checks, and 4 full
  security-header checks.
- `/hmi/` and representative old product URLs return one-hop 301 responses.
- Known `www.richauto.cinkr.com` URLs return one-hop 301 responses to the
  canonical RichAuto subdirectory; unknown paths return 404.
- Production HTML contains canonical URLs and no `noindex`.
- All five submitted sitemap URLs return HTTP 200 with `application/xml` to a
  Googlebot user agent and are declared in the site-level `robots.txt`.
- Search Console accepted the five submissions but initially listed the four
  newly created `cinkr.com` sitemap entries as unable to fetch. Their HTTP
  responses are valid, so this remains under observation rather than being
  treated as a crawlable-content failure.
- Heartbeat automation `cinkr-7` will record production and Search Console
  checks daily from 2026-10-22 through 2026-10-28, notifying only on regression,
  required action, or the final summary.

## Search Console URL Inspection

URL Inspection was completed in `sc-domain:cinkr.com` for the home page, the
four product sections, a Kinco product and article page, a RichAuto model page,
an MPG article page, and a deliberately unknown URL.

- `https://cinkr.com/` is indexed. Google previously crawled it on
  2026-10-17, its declared canonical is `https://cinkr.com/`, and Google selects
  the inspected URL as canonical.
- `https://cinkr.com/kinco/`, `/hqd/`, `/richauto/`, and `/mpg/` were not yet
  known to Google at inspection time. Search Console showed no crawl yet and no
  referring sitemap for their new URLs.
- Indexing requests were successfully accepted for all four product sections.
  Search Console reported that each URL was added to the priority crawl queue.
- The representative Kinco product and article, RichAuto model, and MPG article
  URLs had the same not-yet-crawled status. The unknown URL remained unindexed,
  as expected.

This records a normal indexing lag for the newly introduced subdirectories, not
an HTTP or sitemap delivery failure. The submitted sitemap endpoints continue to
return valid XML, and the heartbeat automation will observe Search Console and
production daily during the migration window.

## 2026-10-22 daily check

- Production HTTP acceptance passed: 255 pages, 244 assets, 16 redirect checks,
  10 not-found checks, and 4 full security-header checks.
- `/hmi/` and `/hmi/gl070/` returned one-hop 301 responses to the canonical
  Kinco paths. Representative HMI, HQD, RichAuto, `www.richauto`, and MPG
  legacy URLs also returned one-hop 301 responses with query strings preserved
  where supplied.
- An unknown production path returned a real HTML 404.
- The five public section pages returned 200 with the expected self-canonical
  URLs and no `noindex`.
- All five submitted sitemap indexes and the site-level `robots.txt` returned
  200 to a Googlebot user agent; each sitemap index returned
  `application/xml`.
- Search Console now reports the Kinco sitemap as successful, last read
  2026-10-22, with 132 discovered URLs. The home, HQD, RichAuto, and MPG sitemap
  indexes still show `unable to fetch`; this remains an indexing-processing
  state under observation because their public responses are valid.

## 2026-10-23 daily check

- The first full production crawl attempt stopped on a transient connection
  timeout. Three immediate homepage retries returned 200, and a repeat of the
  same full crawl passed with 255 pages, 244 assets, 16 redirect checks,
  10 not-found checks, and 4 full security-header checks.
- `/hmi/` and `/hmi/gl070/` returned one-hop 301 responses to the canonical
  Kinco paths. Representative HMI, HQD, RichAuto, `www.richauto`, and MPG
  legacy URLs also returned one-hop 301 responses with query strings preserved
  where supplied. An unknown production path returned a real HTML 404.
- The five public section pages returned 200 with the expected self-canonical
  URLs and no `noindex`.
- All five submitted sitemap indexes and the site-level `robots.txt` returned
  200 to a Googlebot user agent; each sitemap index returned
  `application/xml`.
- Search Console now reports both the home sitemap and the Kinco sitemap as
  successful, last read 2026-10-23 and 2026-10-22 respectively. They discovered
  2 and 132 URLs. The HQD, RichAuto, and MPG sitemap indexes still show
  `unable to fetch`; this remains under observation because their public
  responses are valid.

## 2026-10-24 daily check

- Production HTTP acceptance passed: 255 pages, 244 assets, 16 redirect checks,
  10 not-found checks, and 4 full security-header checks.
- `/hmi/` and `/hmi/gl070/` returned one-hop 301 responses to the canonical
  Kinco paths. Representative HMI, HQD, RichAuto, `www.richauto`, and MPG
  legacy URLs also returned one-hop 301 responses with query strings preserved
  where supplied. An unknown production path returned a real HTML 404.
- The five public section pages returned 200 with the expected self-canonical
  URLs and no `noindex`.
- All five submitted sitemap indexes and the site-level `robots.txt` returned
  200 to a Googlebot user agent; each sitemap index returned
  `application/xml`.
- Search Console now reports all five `cinkr.com` sitemap indexes as successful.
  The latest reads discovered 2 home URLs, 132 Kinco URLs, 64 HQD URLs,
  48 RichAuto URLs, and 7 MPG URLs. No submitted sitemap remains in the
  `unable to fetch` state.

## 2026-10-25 daily check

- Production HTTP acceptance passed: 255 pages, 244 assets, 16 redirect checks,
  10 not-found checks, and 4 full security-header checks.
- `/hmi/` and `/hmi/gl070/` returned one-hop 301 responses to the canonical
  Kinco paths. Representative HMI, HQD, RichAuto, `www.richauto`, and MPG
  legacy URLs also returned one-hop 301 responses with query strings preserved
  where supplied. An unknown production path returned a real HTML 404.
- The five public section pages returned 200 with the expected self-canonical
  URLs and no `noindex`.
- All five submitted sitemap indexes and the site-level `robots.txt` returned
  200 to a Googlebot user agent; each sitemap index returned
  `application/xml`.
- Search Console continues to report all five `cinkr.com` sitemap indexes as
  successful, with 2 home URLs, 132 Kinco URLs, 64 HQD URLs, 48 RichAuto URLs,
  and 7 MPG URLs discovered.

## 2026-10-26 architecture update and daily check

The production topology changed during the observation window. Kinco and
RichAuto were moved from subdirectories back to canonical subdomains, while HQD
and MPG remain on subdirectories:

- `https://cinkr.com/`
- `https://kinco.cinkr.com/`
- `https://cinkr.com/hqd/`
- `https://richauto.cinkr.com/`
- `https://cinkr.com/mpg/`

The monitoring gate was updated to cover this current topology. The latest
checks passed:

- General Cinkr acceptance: 73 pages, 149 assets, 16 redirects, 5 not-found
  checks, and 2 full security-header checks.
- Kinco subdomain acceptance: 83 pages, 47 assets, 9 redirects, and 1
  not-found check.
- RichAuto subdomain acceptance: 48 pages, 50 assets, 6 redirects, and 1
  not-found check.
- `/hmi/`, `/hmi/gl070/`, `/kinco/gl070/`, and `/richauto/a11/` returned one-hop
  301 responses to their canonical subdomain URLs.
- HQD and MPG legacy-host URLs returned one-hop 301 responses to their canonical
  subdirectory URLs.
- `www.richauto.cinkr.com` and `www.cinkr.com/richauto` URLs returned one-hop
  301 responses to `richauto.cinkr.com`, preserving query strings.
- Canonical homepages returned the expected self-canonical URLs with no
  unintended `noindex`.
- All five current sitemap indexes returned 200 `application/xml` to a Googlebot
  user agent, and Search Console reports them as successful: 2 home URLs,
  64 HQD URLs, 7 MPG URLs, 132 Kinco URLs, and 48 RichAuto URLs.

## 2026-10-27 full subdomain topology check

The production topology completed its move back to independent product
subdomains. The current canonical site roots are:

- `https://cinkr.com/`
- `https://kinco.cinkr.com/`
- `https://hqd.cinkr.com/`
- `https://richauto.cinkr.com/`
- `https://mpg.cinkr.com/`

All current production acceptance gates passed:

- Main Cinkr acceptance: 1 page, 0 assets, 18 redirects, and 1 not-found check.
- Kinco acceptance: 83 pages, 47 assets, 9 redirects, and 1 not-found check.
- HQD acceptance: 64 pages, 133 assets, 6 redirects, and 1 not-found check.
- RichAuto acceptance: 48 pages, 50 assets, 6 redirects, and 1 not-found check.
- MPG acceptance: 7 pages, 32 assets, 8 redirects, and 1 not-found check.

The redirect contracts passed for the former subdirectories on both `cinkr.com`
and `www.cinkr.com`, each resolving in one hop to the corresponding product
subdomain. The product `www` hosts and retired `/hmi` paths also resolve in one
hop. Canonical and `noindex` checks passed with no unexpected production
`noindex`.

Search Console reports all five current canonical sitemap indexes as successful:
2 home URLs, 132 Kinco URLs, 64 HQD URLs, 48 RichAuto URLs, and 7 MPG URLs.

## 2026-10-28 final daily check

The seven-day observation window completed with all current production
acceptance gates passing:

- Main Cinkr acceptance: 1 page, 18 redirects, and 1 not-found check.
- Kinco acceptance: 83 pages, 47 assets, 9 redirects, and 1 not-found check.
- HQD acceptance: 64 pages, 133 assets, 6 redirects, and 1 not-found check.
- RichAuto acceptance: 48 pages, 50 assets, 6 redirects, and 1 not-found check.
- MPG acceptance: 7 pages, 32 assets, 8 redirects, and 1 not-found check.

Canonical URLs, security headers, one-hop legacy redirects, product `www`
redirects, and real 404 responses remained correct, with no unintended
production `noindex`. Search Console continues to report all five current
canonical sitemap indexes as successful: 2 home URLs, 132 Kinco URLs, 64 HQD
URLs, 48 RichAuto URLs, and 7 MPG URLs.

No production regression requiring action was found during the observation
window. The daily heartbeat can be closed; the one-year legacy redirect and
standard release acceptance commitments remain in place.
