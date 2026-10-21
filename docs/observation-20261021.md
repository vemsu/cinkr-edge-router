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
