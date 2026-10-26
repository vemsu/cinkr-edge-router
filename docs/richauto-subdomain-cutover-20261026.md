# RichAuto subdomain restoration cutover record

Status: complete; production cutover, acceptance, search-platform actions, and
cleanup completed on 2026-10-26.

## Cloudflare scope

- Account ID: `a8d4af671034afd0a869e0ef6b69d311`
- Zone ID: `b383cf29a0b750dc7791183d790ae584`
- Zone: `cinkr.com`

## Git and deployment

| Repository | Pre-cutover `main` | Candidate commit | Cutover implementation commit |
| --- | --- | --- | --- |
| `02-Cinkr RichAuto` | `6663387` | `9c831e3` | `9c831e3` |
| `01-Cinkr home` | `e3823b2` | `c5a8fb5` | `c5a8fb5` |
| `cinkr-edge-router` | `124ae4d` | `b6e8ec4` | `b6e8ec4` |

All three candidate branches were merged by fast-forward and deleted locally
and remotely after acceptance.

| Project/Worker | Deployment before cutover | Production after cutover |
| --- | --- | --- |
| `cinkr-richauto` | `0dff682d-b49a-4a17-a016-835c09ff18ae` | `b0a107ea-b846-49c9-90e2-6493fdf97b0b` |
| `cinkr-home` | `6066b153-fd76-43d6-a931-81d6bdbbcee9` | `a9bd8ca1-287b-4055-80a9-5b6e7cfaf5b5` |
| `cinkr-edge-router` | `0df4e1c0-3d3b-409b-a49a-5ee943a54427` | `cd6bad69-b2af-415c-bd6b-fec5252ddff6` |

`556cac43-7925-4ecf-822a-0e4d984fa51d` remains available as the earlier
RichAuto historical rollback point.

Both `richauto.cinkr.com` and `www.richauto.cinkr.com` Pages Custom Domains are
active and verified.

## DNS and redirect rules

DNS was corrected during cutover:

- `richauto.cinkr.com`: proxied CNAME to `cinkr-richauto.pages.dev`.
- `www.richauto.cinkr.com`: the historical proxied `A 192.0.2.1` placeholder
  was replaced with a proxied CNAME to `cinkr-richauto.pages.dev`.

The `www` Single Redirect is enabled:

- Rule ID: `6c2f82da101c4ae5aa7dd39ceee4cc4e`
- Name: `CINKR canonical www.richauto to RichAuto apex`
- Expression: `http.host eq "www.richauto.cinkr.com"`
- Target: `concat("https://richauto.cinkr.com", http.request.uri.path)`
- Target type: dynamic
- Status: `301`
- Preserve query string: enabled

The original static target had emitted the unevaluated `concat(...)` text. The
target type is now dynamic and query-string preservation appends the query
exactly once.

The general rule `CINKR canonical www to apex` has ID
`2f52ac15f60c42f789f41ea1e3deb15f`. Its expression now excludes
`/richauto` and `/richauto/*`, allowing the Worker to send those requests
directly to `richauto.cinkr.com` in one hop. All other `www.cinkr.com` paths
continue to canonicalize to `cinkr.com`.

Both RichAuto Worker routes were deleted after the new Pages deployment passed:

- `richauto.cinkr.com/*`: `62bbbf1c74e34c23b3a3f37a35a1ef4c`
- `www.richauto.cinkr.com/*`: `04586fc333d44ca9a184040f52c4b3bb`

Authenticated API verification after deletion returned zero RichAuto routes.

## Production response baseline

Captured 2026-10-26 10:53 +08:00:

| URL | Status | Location |
| --- | --- | --- |
| `https://richauto.cinkr.com/` | `301` | `https://cinkr.com/richauto/` |
| `https://richauto.cinkr.com/a11/` | `301` | `https://cinkr.com/richauto/a11/` |
| `https://www.richauto.cinkr.com/` | `301` | `https://cinkr.com/richauto/` |
| `https://cinkr.com/richauto/` | `200` | none |
| `https://cinkr.com/richauto/a11/` | `200` | none |

## Candidate acceptance

RichAuto Git Preview:

- Deployment: `6ad3b526-b59c-45d7-922d-9e71eea40b08`
- URL: `https://6ad3b526.cinkr-richauto.pages.dev`
- Commit: `9c831e32ae3365fe6431f477a97532ea3798098c`
- Result: 48 pages, 50 assets, 1 not-found check passed.

Cinkr Home Preview:

- Deployment: `ec8a1493-dfc9-4e8e-8a2b-d5bd41d539c7`
- URL: `https://ec8a1493.cinkr-home.pages.dev`
- Commit: `c5a8fb59d084c4918af2e03fbb3311ae56ce1e36`
- Result: homepage 200, RichAuto subdomain link present, robots sitemap declarations correct.

Staging Worker:

- Version: `157fdfe6-0b95-40df-a297-45d671192cb9`
- `/richauto` and `/richauto/a11/` return one-hop 301 with query preservation.

## Production responses

| URL | Status | Location |
| --- | --- | --- |
| `https://richauto.cinkr.com/` | `200` | none |
| `https://richauto.cinkr.com/a11/` | `200` | none |
| `https://www.richauto.cinkr.com/a11/?utm_source=test` | `301` | `https://richauto.cinkr.com/a11/?utm_source=test` |
| `https://cinkr.com/richauto` | `301` | `https://richauto.cinkr.com/` |
| `https://cinkr.com/richauto/a11/?utm_source=test` | `301` | `https://richauto.cinkr.com/a11/?utm_source=test` |
| `https://cinkr.com/richauto-other` | `404` | none |

Cloudflare cache was purged by host for `richauto.cinkr.com` and
`www.richauto.cinkr.com`, then by the `cinkr.com/richauto` prefix.

## Production acceptance

RichAuto production acceptance passed:

- 48 pages
- 50 assets
- 6 redirect contracts
- 1 not-found contract

The general Cinkr production acceptance passed:

- 206 pages
- 195 assets
- 14 redirects
- 7 not-found checks
- 3 security-header checks

The final RichAuto HTML uses root assets and canonicals on
`https://richauto.cinkr.com`, contains no `https://cinkr.com/richauto` or
root-relative `/richauto/` residue, and has no unintended page-level
`noindex`. Header checks found no `X-Robots-Tag: noindex` on normal HTML,
sitemap, or robots responses; the intentional `noindex, follow` remains on
`/downloads/*`.

Chrome visual checks passed for the desktop homepage and a 390 x 844 mobile
A11 viewport, including navigation, images, headings, cards, and CTA layout.
Chrome's page translator displayed translated text in the visual session, but
the HTML and accessibility tree remained English and layout checks passed.

## Search platform submission

Google Search Console, domain property `sc-domain:cinkr.com`:

- `https://richauto.cinkr.com/sitemap-index.xml` was resubmitted successfully.
- `https://richauto.cinkr.com/` was already indexed; a new indexing request was
  accepted.
- `https://richauto.cinkr.com/a11/` was already indexed; a new indexing request
  was accepted.
- The real-time test for `https://cinkr.com/richauto/` completed with a
  successful crawl and user-declared canonical
  `https://richauto.cinkr.com/`. The HTTP 301 itself was independently verified
  by production acceptance.
- GSC reports one invalid Product structured-data item on the A11 page. This is
  an existing rich-results issue and was not caused by the subdomain migration.

Bing Webmaster Tools:

- Imported `https://richauto.cinkr.com/` from the verified Google Search Console
  property.
- Submitted `https://richauto.cinkr.com/sitemap-index.xml`; status was
  `processing`.
- URL Inspection initially reported `Discovered but not crawled`; an indexing
  request was accepted.
- The live URL test completed successfully, reported that the URL can be
  indexed, and found no SEO/GEO issues.

Submission and request acceptance do not imply that Google or Bing have already
finished indexing the updated pages.

## Cleanup

The following candidate Preview deployments were deleted:

- `cinkr-richauto`: `6ad3b526-b59c-45d7-922d-9e71eea40b08`
- `cinkr-home`: `ec8a1493-dfc9-4e8e-8a2b-d5bd41d539c7`
- `cinkr-home`: `94de43ed-06a2-49ae-b240-e8599f51c885`

Their immutable URLs now return `404`. Production deployments, the Worker
rollback version, and the RichAuto rollback deployments were preserved.
