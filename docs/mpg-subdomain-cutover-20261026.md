# MPG subdomain restoration cutover record

Status: in progress. Baseline captured; implementation, candidate acceptance,
production cutover, search-platform actions, and observation are not complete.

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

## DNS baseline

The zone reports 20 of 200 available DNS records. Relevant records:

| Type | Name | Content | Proxied | Comment |
| --- | --- | --- | --- | --- |
| CNAME | `mpg.cinkr.com` | `cinkr-mpg.pages.dev` | yes | `Cloudflare Pages cinkr-mpg` |
| CNAME | `www.cinkr.com` | `cinkr-home.pages.dev` | yes | none |

No `www.mpg.cinkr.com` DNS record was present in the dashboard baseline.

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
