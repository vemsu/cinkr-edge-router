# MPG subdomain restoration cutover record

Status: in progress. Baseline, implementation, candidate acceptance, staging
validation, and Cloudflare preconfiguration are complete. Production cutover,
search-platform actions, and observation are not complete.

## Cloudflare scope

- Account ID: `a8d4af671034afd0a869e0ef6b69d311`
- Zone ID: `b383cf29a0b750dc7791183d790ae584`
- Zone: `cinkr.com`
- Pages projects: `cinkr-mpg`, `cinkr-home`
- Workers: `cinkr-edge-router`, `cinkr-edge-router-staging`

## Git baseline

| Repository | `origin/main` | Candidate branch | Candidate worktree |
| --- | --- | --- | --- |
| `05-CInkr MPG` | `635f6f32ea786c561c2753755d7ce5e9726e1dce` | `restore/mpg-subdomain-20261026` | `D:\Code\02-项目\Cinkr site\.codex-worktrees\mpg-subdomain-20261026\05-CInkr MPG` |
| `01-Cinkr home` | `e0205ba20180fde5729a30fa301b12aecad5eb64` | `restore/mpg-subdomain-20261026` | `D:\Code\02-项目\Cinkr site\.codex-worktrees\mpg-subdomain-20261026\01-Cinkr home` |
| `cinkr-edge-router` | `2ca9d265f46e6bda8d50582deeb256556f10f74a` | `restore/mpg-subdomain-20261026` | `D:\Code\02-项目\Cinkr site\.codex-worktrees\mpg-subdomain-20261026\cinkr-edge-router` |

The primary Router checkout has a pre-existing uncommitted modification to
`docs/kinco-subdomain-cutover-20261026.md`. It was left untouched. Its
planning-time SHA-256 was
`16170190B49A78A8C03B38AE0C498D447583FDA374815139CC1CCE5E779163C6`.

## Pages baseline

| Project | Production deployment | Source | Deployment URL |
| --- | --- | --- | --- |
| `cinkr-mpg` | `d28d77fe-d1a8-442a-b6a6-7fe7c5c376ef` | `635f6f3` | `https://d28d77fe.cinkr-mpg.pages.dev` |
| `cinkr-home` | `8495c712-98e5-4ced-b6e2-b6d5f95a427e` | `e0205ba` | `https://8495c712.cinkr-home.pages.dev` |

### Candidate previews

Cloudflare Pages created Git-integration records for the candidate branch but
reported them as `skipped` because this preview branch is not configured to
run a Pages build. The already-tested local `dist` outputs were therefore
uploaded directly with Wrangler, using the matching source commit metadata:

| Project | Preview deployment | Source | Deployment URL | Status |
| --- | --- | --- | --- | --- |
| `cinkr-mpg` | `0cd50df7-b1b3-4058-a36b-ccf9068e4d6b` | `c4b64e0` | `https://0cd50df7.cinkr-mpg.pages.dev` | success |
| `cinkr-home` | `f1921168-c480-4fdb-8d8a-278d5015d318` | `da5df8a` | `https://f1921168.cinkr-home.pages.dev` | success |

The skipped Git-integration records are
`73464736-2456-4b50-b6b9-5617383fd4c8` for `cinkr-mpg` and
`f65d6086-e521-4cfa-8220-e32fe795b0d4` for `cinkr-home`. They contain no
deployed assets and are not acceptance evidence.

`cinkr-mpg` currently emits the subdirectory layout. On the immutable
deployment URL:

| Path | Status |
| --- | --- |
| `/` | `404` |
| `/mpg/` | `200` |
| `/blog/` | `404` |
| `/mpg/blog/` | `200` |

Custom domains:

| Project | Domain | Result |
| --- | --- | --- |
| `cinkr-mpg` | `mpg.cinkr.com` | active; domain ID `8f3b887c-f1da-496c-9d41-119d837040a6`; validation and certificate active |
| `cinkr-mpg` | `www.mpg.cinkr.com` | not attached at baseline |

## Candidate validation

The candidate branches and local builds passed these checks before preview
upload:

| Repository | Commit | Result |
| --- | --- | --- |
| `05-CInkr MPG` | `c4b64e07a9e817f2e8408b2fc4319c22368920fe` | Astro 0 errors/warnings/hints; 6 test files and 149 tests passed; build audit found 8 HTML pages, 7 indexable pages, 7 sitemap URLs, 6 photos, and 5 technical images |
| `01-Cinkr home` | `da5df8a0609a8bf24513893ce05e30422ab744f4` | Astro 0 errors; 3 test files and 8 tests passed; build audit found 2 indexable pages and 2 sitemap entries |
| `cinkr-edge-router` | `ee10e90da92936ccf27c23f636cb3bcd59db99b5` | 3 test files and 47 tests passed; manifest validator passed with 437 records and 0 MPG-host records |

Preview acceptance results:

| Check | Result |
| --- | --- |
| MPG preview crawl | 7 pages, 32 assets, 1 expected 404, and 0 redirects passed |
| MPG preview metadata | Canonical, Open Graph, robots, and sitemap use `https://mpg.cinkr.com/`; no retired `/mpg` prefix remains in the build |
| Home preview | `200`; MPG catalogue link is `https://mpg.cinkr.com/` |
| Home robots | `200`; declares `https://mpg.cinkr.com/sitemap-index.xml` |
| Router staging | Worker version `511d7ca6-1c35-46bb-b8ff-c3cbe28e25cc`; 15 redirects and 1 expected 404 passed |

Staging probes confirmed that `/mpg`, `/mpg/`, `/mpg/blog/?source=staging`,
and `/mpg/robots.txt` each return one-hop `301` responses with
`Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`.

Candidate Chromium screenshots were captured at `1440 x 1000` and
`390 x 844` for the home page, the guide
`/blog/what-is-a-cnc-mpg-handwheel/`, and the 404 page:

- `D:\Code\02-项目\Cinkr site\.codex-evidence\mpg-subdomain-20261026\candidate\desktop-home.png`
- `D:\Code\02-项目\Cinkr site\.codex-evidence\mpg-subdomain-20261026\candidate\desktop-article.png`
- `D:\Code\02-项目\Cinkr site\.codex-evidence\mpg-subdomain-20261026\candidate\desktop-404.png`
- `D:\Code\02-项目\Cinkr site\.codex-evidence\mpg-subdomain-20261026\candidate\mobile-home.png`
- `D:\Code\02-项目\Cinkr site\.codex-evidence\mpg-subdomain-20261026\candidate\mobile-article.png`
- `D:\Code\02-项目\Cinkr site\.codex-evidence\mpg-subdomain-20261026\candidate\mobile-404.png`

Visual inspection found no horizontal overflow, clipped product imagery,
missing branding, or mobile-dock obstruction of the principal controls.

## DNS baseline

The zone reports 20 of 200 available DNS records. Relevant records:

| Type | Name | Content | Proxied | Comment |
| --- | --- | --- | --- | --- |
| CNAME | `mpg.cinkr.com` | `cinkr-mpg.pages.dev` | yes | `Cloudflare Pages cinkr-mpg` |
| CNAME | `www.cinkr.com` | `cinkr-home.pages.dev` | yes | none |

No `www.mpg.cinkr.com` DNS record was present in the dashboard baseline.

### Preconfigured `www.mpg` resources

Prepared on 2026-10-26 without enabling the public redirect:

| Resource | Value |
| --- | --- |
| Custom Domain | `www.mpg.cinkr.com` |
| Custom Domain ID | `9dcdafb0-7f5f-4bcf-8827-efacb555f483` |
| Custom Domain status | `active` |
| Certificate | `SSL enabled`; validation method `http`, certificate authority `google` |
| DNS record ID | `2c02860de75a5acea72ec2099b21a4bf` |
| DNS record | Proxied `CNAME www.mpg.cinkr.com -> cinkr-mpg.pages.dev` |
| Redirect name | `CINKR canonical www.mpg to MPG apex` |
| Redirect rule ID | `776b76023783426c95976ec2e6344cfd` |
| Redirect ruleset ID | `abc8bd25b0444387b89669e68c5a29e4` |
| Redirect expression | `(http.host eq "www.mpg.cinkr.com")` |
| Redirect target | `concat("https://mpg.cinkr.com", http.request.uri.path)` |
| Redirect status/query | `301`; preserve query string enabled |
| Redirect state | disabled pending production cutover |

Before cutover, `https://mpg.cinkr.com/` still returned `301` to
`https://cinkr.com/mpg/`; `https://cinkr.com/mpg/` still returned `200`;
`https://www.cinkr.com/mpg/` still returned `301` to `cinkr.com/mpg/`.
`https://www.mpg.cinkr.com/` reached the Pages certificate and returned `404`
from the old subdirectory-layout production deployment because the dedicated
`www.mpg` redirect remained disabled.

## Worker baseline

Production Worker deployments end with:

- Latest recorded version: `bd2832e9-aea6-4e87-8ead-f6c73048b65a`
- Created: `2026-10-26T11:22:25.396Z`
- Traffic allocation: 100 percent

Worker Routes:

| Pattern | Script | Route ID |
| --- | --- | --- |
| `cinkr.com/*` | `cinkr-edge-router` | `7effcd0da67e4b8a8facbfad72f3b70b` |
| `mpg.cinkr.com/*` | `cinkr-edge-router` | `bb92f34fa4514e61829dbed7b770da2f` |
| `www.cinkr.com/*` | `cinkr-edge-router` | `9dcaa462d18d4e07aaa396c3924599e9` |
| `hmi.cinkr.com/*` | `cinkr-edge-router` | `8da5aa36db1f479da09e51c4a3b8f6c7` |
| `staging.cinkr.com/*` | `cinkr-edge-router-staging` | `88e594ae571e48b393f1d04ba27fbc66` |

## Redirect-rule baseline

Cloudflare Single Redirects reports 4 of 10 rules in use.

The general rule is:

- ID: `2f52ac15f60c42f789f41ea1e3deb15f`
- Name: `CINKR canonical www to apex`
- Path: `/rules/redirect-rules/2f52ac15f60c42f789f41ea1e3deb15f`
- Status code: `301`
- Preserve query string: enabled
- Expression:

```text
(http.host eq "www.cinkr.com" and http.request.uri.path ne "/richauto" and not starts_with(http.request.uri.path, "/richauto/") and http.request.uri.path ne "/kinco" and not starts_with(http.request.uri.path, "/kinco/") and http.request.uri.path ne "/hmi" and not starts_with(http.request.uri.path, "/hmi/") and http.request.uri.path ne "/hqd" and not starts_with(http.request.uri.path, "/hqd/"))
```

Existing product-specific rules occupy positions 2 through 4:

- `CINKR canonical www.richauto to RichAuto apex`
- `CINKR canonical www.kinco to Kinco apex`
- `HQD canonical www.hqd to apex`

No `www.mpg.cinkr.com` rule exists at baseline.

## HTTP baseline

Captured with redirects disabled and the public hostnames:

| URL | Status | Location | Cache-Control | X-Robots-Tag |
| --- | --- | --- | --- | --- |
| `https://mpg.cinkr.com/` | `301` | `https://cinkr.com/mpg/` | none | none |
| `https://mpg.cinkr.com/blog/` | `301` | `https://cinkr.com/mpg/blog/` | none | none |
| `https://cinkr.com/mpg/` | `200` | none | `public, max-age=0, must-revalidate` | none |
| `https://cinkr.com/mpg/blog/` | `200` | none | `public, max-age=0, must-revalidate` | none |
| `https://www.cinkr.com/mpg/` | `301` | `https://cinkr.com/mpg/` | none | none |
| `https://www.mpg.cinkr.com/` | TLS failure | none | none | none |
| `https://cinkr.com/mpg/robots.txt` | `301` | `https://cinkr.com/robots.txt` | none | none |
| `https://mpg.cinkr.com/robots.txt` | `301` | `https://cinkr.com/robots.txt` | none | none |

The canonical and Open Graph URL currently emitted by
`https://cinkr.com/mpg/` are both `https://cinkr.com/mpg/`.

## Router manifest baseline

`manifests/legacy-redirects.json` contains 503 exact redirects. Of those, 66
have host `mpg.cinkr.com` and currently target the matching `/mpg` path on
`https://cinkr.com`. Removing those records leaves 437 exact redirects.

## Search-platform baseline

Google Search Console and Bing Webmaster Tools state must be rechecked during
the production search-platform phase. The old MPG sitemap entrance is:

- `https://cinkr.com/mpg/sitemap-index.xml`

The target sitemap will be:

- `https://mpg.cinkr.com/sitemap-index.xml`

No search-platform submission or indexing claim has been made yet.

## Rollback assets

- MPG Pages: `d28d77fe-d1a8-442a-b6a6-7fe7c5c376ef`
- Home Pages: `8495c712-98e5-4ced-b6e2-b6d5f95a427e`
- Worker: `bd2832e9-aea6-4e87-8ead-f6c73048b65a`
- MPG Route: `mpg.cinkr.com/*`, ID
  `bb92f34fa4514e61829dbed7b770da2f`, script `cinkr-edge-router`,
  `request_limit_fail_open=false`
- General `www` rule: `2f52ac15f60c42f789f41ea1e3deb15f`
- MPG Custom Domain: `8f3b887c-f1da-496c-9d41-119d837040a6`
- `mpg.cinkr.com` DNS: proxied CNAME to `cinkr-mpg.pages.dev`

These records and the full Redirect-rule expression must remain available for
at least 30 days after production cutover.
