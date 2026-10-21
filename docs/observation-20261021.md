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
