# Subdirectory migration acceptance - 2026-10-21

## Repository verification

| Repository | Check result |
| --- | --- |
| Home | Astro check 0/0/0; 4/4 tests; build and audit passed |
| Kinco | Astro check 0/0/0; 84/84 tests; build audit passed; 83 indexable pages |
| HQD | Astro check 0 errors/0 warnings/1 deprecated-API hint; 54/54 tests; all four audits passed |
| RichAuto | Astro check 0/0/0; 52/52 tests; build and SEO/accessibility contracts passed |
| MPG | Astro check 0/0/0; 148/148 tests; build audit passed; 7 indexable pages |
| Edge router | 828 exact redirects; 22/22 tests; manifest validation passed |

## HTTP acceptance

Production and staging crawls both passed:

| Environment | Pages | Assets | Redirect checks | 404 checks | Page header checks |
| --- | ---: | ---: | ---: | ---: | ---: |
| Production | 255 | 242 | 14 | 9 | 4 |
| Staging | 255 | 242 | 6 | 5 | 4 |

Production checks covered:

- All product homepage and sitemap page URLs returned 200.
- Static CSS, JavaScript, images, fonts, and PDFs returned 200.
- Canonical URLs point to `https://cinkr.com/<product>/...`.
- Production HTML does not contain `noindex`.
- CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, and `Permissions-Policy` are present.
- `/hmi/` and `/hmi/gl070/` redirect to Kinco in one hop.
- Product `robots.txt` URLs redirect to the single site-level robots file.
- Unknown paths on `cinkr.com`, product paths, and all four legacy hosts return
  404.
- Legacy product roots and representative model, guide, and asset URLs return
  one-hop 301 responses to the canonical subdirectory.
- Unknown legacy-host paths no longer fall back to the main website.

## Real Chromium acceptance

Chromium at a 390 px mobile viewport loaded:

- `/`
- `/kinco/`
- `/hqd/`
- `/richauto/`
- `/mpg/`
- `/kinco/gl070/`
- `/hqd/gdz-23-1/`
- `/richauto/a11/`
- `/mpg/blog/what-is-a-cnc-mpg-handwheel/`

Every page had the expected title, H1, canonical, product links, and no
horizontal overflow. Images reported as not yet loaded by `naturalWidth` were
lazy-loaded below the fold; HTTP checks for representative images across all
five sites returned 200 with the correct image content type.

## Search Console

Submitted for the `sc-domain:cinkr.com` property:

- `https://cinkr.com/sitemap-index.xml`
- `https://cinkr.com/kinco/sitemap-index.xml`
- `https://cinkr.com/hqd/sitemap-index.xml`
- `https://cinkr.com/richauto/sitemap-index.xml`
- `https://cinkr.com/mpg/sitemap-index.xml`

Google accepted all five submissions. Its initial processing state was
`无法抓取`; a Googlebot user-agent check of every sitemap immediately returned
HTTP 200 with `application/xml`, so the final Search Console read status must be
checked during the observation window.

## Observation

Continue daily checks for seven days. Escalate any production 5xx, unintended
404, redirect loop, missing security header, `noindex` leak, canonical
regression, or sitemap processing failure.
